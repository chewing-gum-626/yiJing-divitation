import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

import { getServerGuaText } from './helpers/guaData';

interface EdgeOnePagesEnv {
  DEEPSEEK_API_KEY?: string;
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
}

interface EdgeOnePagesContext {
  request: Request;
  env: EdgeOnePagesEnv;
}

interface DivineRequestPayload {
  question?: string;
  questionType?: string;
  originalGuaId?: string;
  changedGuaId?: string;
}

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DAILY_LIMIT = 4;

/**
 * 统一生成 JSON 响应，确保 EdgeOne Pages Functions 的所有错误分支都返回稳定结构。
 * 前端会根据 HTTP 状态码与 message 字段展示提示，因此这里集中维护响应头与编码。
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
 * EdgeOne 与其他 CDN/边缘平台通常会透传 x-forwarded-for，这里优先读取代理链第一个 IP；
 * 如果平台或本地调试没有该头，再依次使用 x-real-ip、unknown 兜底，保证限流 key 始终存在。
 */
function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');

  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }

  return request.headers.get('x-real-ip') ?? 'unknown';
}

/**
 * 基于 EdgeOne Pages 注入的环境变量创建 Upstash 限流器。
 * EdgeOne Functions 不应依赖 Node.js 的 process.env，而应从 context.env 读取平台环境变量。
 */
function createRateLimiter(env: EdgeOnePagesEnv): Ratelimit | null {
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;

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
 * 后端只信任 6 位 0/1 卦 ID，再自行查表得到卦辞，避免用户篡改卦辞或注入不可信上下文。
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
 * 这里根据卦象 ID 在服务端查出本卦/变卦原文，让 AI 解读基于后端可信数据而不是前端传来的展示文本。
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
 * 返回 null 表示放行；返回 Response 表示已命中错误分支，由主入口直接返回给前端。
 */
async function applyRateLimit(request: Request, env: EdgeOnePagesEnv): Promise<Response | null> {
  const ratelimit = createRateLimiter(env);

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
 * EdgeOne Pages AI 解卦函数入口。
 * 这里使用 onRequestPost 让文件路径 functions/api/divine.ts 映射为 /api/divine，并只响应 POST 请求。
 */
export async function onRequestPost(context: EdgeOnePagesContext): Promise<Response> {
  const { request, env } = context;
  const deepSeekApiKey = env.DEEPSEEK_API_KEY;

  if (!deepSeekApiKey) {
    return createJsonResponse({ message: 'DeepSeek API Key 未配置。' }, 500);
  }

  try {
    const rateLimitResponse = await applyRateLimit(request, env);

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
      console.log('errorText', errorText);
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

/**
 * 非 POST 请求统一返回 405。
 * 明确补齐 onRequest，可避免平台对未实现方法返回默认 HTML，便于前端和调试工具稳定读取 JSON。
 */
export function onRequest(): Response {
  return createJsonResponse({ message: 'Method Not Allowed' }, 405);
}
