import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

import { getServerGuaText } from './helpers/guaData.js';

export const config = {
  runtime: 'edge',
};

interface DivineRequestPayload {
  question?: string;
  questionType?: string;
  originalGuaId?: string;
  changedGuaId?: string;
}

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DAILY_LIMIT = 4;

/**
 * 统一生成 JSON 响应，避免 Edge Function 在错误分支返回结构不一致。
 * body 表示要返回给前端的错误或提示内容，status 对应 HTTP 状态码，前端会据此展示年轻化 Toast。
 */
function createJsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

/**
 * 获取真实客户端 IP，用于云端防刷限流。
 * Vercel 会把代理链路写入 x-forwarded-for，这里只取第一个 IP 作为用户标识；
 * 若本地调试或代理未提供该头，则退回 x-real-ip，最后兜底为 unknown。
 */
function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');

  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }

  return request.headers.get('x-real-ip') ?? 'unknown';
}

/**
 * 创建 Upstash 限流器实例。
 * 目的：AI 解卦会消耗模型额度，因此必须在服务端按 IP 做每日限制，不能只依赖前端按钮状态。
 * 返回 null 表示环境变量未配置，此时直接阻断请求，避免在无防刷保护时调用 DeepSeek。
 */
function createRateLimiter(): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  return new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.fixedWindow(DAILY_LIMIT, '1 d'),
    analytics: true,
    prefix: 'divination:ai',
  });
}

/**
 * 校验并规整前端传来的占问参数。
 * question 会被截断到 300 字，避免用户输入过长导致 Prompt 膨胀；
 * originalGuaId 与 changedGuaId 必须是 6 位 0/1 字符串，后端只信任这个结构化 ID，再自行查表得到卦辞。
 */
function validatePayload(payload: DivineRequestPayload) {
  const question = typeof payload.question === 'string' ? payload.question.trim().slice(0, 300) : '';
  const questionType = typeof payload.questionType === 'string' ? payload.questionType.trim().slice(0, 20) : 'general';
  const originalGuaId = typeof payload.originalGuaId === 'string' ? payload.originalGuaId.trim() : '';
  const changedGuaId = typeof payload.changedGuaId === 'string' ? payload.changedGuaId.trim() : '';

  if (!/^[01]{6}$/.test(originalGuaId) || !/^[01]{6}$/.test(changedGuaId)) {
    throw new Error('卦象参数不合法');
  }

  return {
    question: question || '未填写具体问题，请按问题类型给出通用建议。',
    questionType,
    originalGuaId,
    changedGuaId,
  };
}

/**
 * 拼装 DeepSeek System Prompt。
 * 这里根据卦象 ID 在服务端查出本卦/变卦原文，目的不是相信前端传来的文案，
 * 而是只接受前端传来的结构化卦 ID，防止用户篡改卦辞或注入不可信上下文。
 */
function buildSystemPrompt(payload: Required<Pick<DivineRequestPayload, 'question' | 'questionType' | 'originalGuaId' | 'changedGuaId'>>): string {
  const originalGua = getServerGuaText(payload.originalGuaId);
  const changedGua = getServerGuaText(payload.changedGuaId);

  if (!originalGua || !changedGua) {
    throw new Error('未找到对应卦象数据');
  }

  return `你是一位精通周易占卜与现代心理疏导的专家。请根据以下易经本卦和变卦原文，结合用户占问的问题类型（${payload.questionType}）和具体问题（${payload.question}），给出定制化的白话解答。

【本卦】${originalGua.name}
卦辞：${originalGua.judgment}
白话简解：${originalGua.plain}

【变卦】${changedGua.name}
卦辞：${changedGua.judgment}
白话简解：${changedGua.plain}

【硬性格式要求】：你的输出必须严格以 [STATUS:吉]、[STATUS:平] 或 [STATUS:凶] 作为第一行开头（基于卦象和问题自主判定），然后换行输出具体的解卦文本。不要有任何多余的解释。`;
}

/**
 * 执行每日 IP 限流。
 * 返回 null 表示放行；返回 Response 表示已命中错误分支，由主 handler 直接返回给前端。
 * 这样主流程可以保持“校验限流 -> 组 Prompt -> 调模型 -> 透传流”的线性结构。
 */
async function applyRateLimit(request: Request): Promise<Response | null> {
  const ratelimit = createRateLimiter();

  if (!ratelimit) {
    return createJsonResponse({ message: 'AI 限流服务未配置，请检查 Upstash 环境变量。' }, 500);
  }

  const ip = getClientIp(request);
  const result = await ratelimit.limit(ip);

  if (!result.success) {
    return createJsonResponse({ message: '今天的 AI 解卦次数已用完，请明天再来。' }, 429);
  }

  return null;
}

/**
 * AI 解卦 Edge Function 主入口。
 * 目的：在服务端完成限流、卦辞查表和 DeepSeek API Key 保护，并把模型流式输出实时转发给浏览器。
 */
export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return createJsonResponse({ message: 'Method Not Allowed' }, 405);
  }

  const deepSeekApiKey = process.env.DEEPSEEK_API_KEY;

  if (!deepSeekApiKey) {
    return createJsonResponse({ message: 'DeepSeek API Key 未配置。' }, 500);
  }

  try {
    const rateLimitResponse = await applyRateLimit(request);

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const rawPayload = (await request.json()) as DivineRequestPayload;
    const payload = validatePayload(rawPayload);
    const systemPrompt = buildSystemPrompt(payload);

    // 使用 stream: true 让 DeepSeek 以 SSE 方式逐段返回内容，前端可边接收边渲染打字机效果。
    const upstreamResponse = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${deepSeekApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        stream: true,
        temperature: 0.8,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
        ],
      }),
    });

    if (!upstreamResponse.ok || !upstreamResponse.body) {
      const errorText = await upstreamResponse.text();
      console.log("errorText", errorText);
      return createJsonResponse({ message: errorText || 'AI 服务暂时不可用，请稍后再试。' }, upstreamResponse.status || 502);
    }

    // Edge Runtime 支持直接把上游 ReadableStream 作为响应体返回，避免服务端缓存完整 AI 文本造成延迟。
    return new Response(upstreamResponse.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI 解卦请求失败，请稍后再试。';
    return createJsonResponse({ message }, 400);
  }
}
