import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

import { getServerGuaText } from './helpers/guaData';

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

function createJsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');

  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }

  return request.headers.get('x-real-ip') ?? 'unknown';
}

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
      return createJsonResponse({ message: errorText || 'AI 服务暂时不可用，请稍后再试。' }, upstreamResponse.status || 502);
    }

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
