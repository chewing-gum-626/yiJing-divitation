export const config = {
  runtime: 'edge',
};

interface ManualDivineRequestPayload {
  question?: string;
  guaName?: string;
  luckType?: string;
}

interface DeepSeekChoice {
  message?: {
    content?: string;
  };
}

interface DeepSeekChatCompletionResponse {
  choices?: DeepSeekChoice[];
}

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const LUCK_TYPE_LABELS: Record<string, string> = {
  ji: '吉',
  ping: '平',
  xiong: '凶',
};

/**
 * 统一返回 JSON，确保前端 Store 可以稳定读取 message 或 interpretation 字段。
 * body 是响应内容，status 是 HTTP 状态码，用于区分参数错误、密钥缺失和上游模型异常。
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
 * 校验手动起卦 AI 解读入参。
 * question 是用户问题，guaName 是本地推导卦名，luckType 是 ji/ping/xiong；三者都会进入 Prompt，必须限制长度和取值。
 */
function validatePayload(payload: ManualDivineRequestPayload) {
  const question = typeof payload.question === 'string' ? payload.question.trim().slice(0, 300) : '';
  const guaName = typeof payload.guaName === 'string' ? payload.guaName.trim().slice(0, 30) : '';
  const luckType = typeof payload.luckType === 'string' ? payload.luckType.trim() : '';

  if (!question || !guaName || !(luckType in LUCK_TYPE_LABELS)) {
    throw new Error('手动起卦参数不完整。');
  }

  return {
    question,
    guaName,
    luckType,
    luckLabel: LUCK_TYPE_LABELS[luckType],
  };
}

/**
 * 从 DeepSeek 非流式响应中提取最终解读文本。
 * DeepSeek 兼容 OpenAI chat completions 结构，正常文本位于 choices[0].message.content。
 */
function extractInterpretation(data: DeepSeekChatCompletionResponse): string {
  const content = data.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error('AI 未返回有效解读内容。');
  }

  return content;
}

/**
 * 手动起卦非流式 AI 解读接口。
 * 目的：把 DeepSeek API Key 保护在服务端，避免浏览器直连 DeepSeek 产生 CORS 问题和密钥泄露风险。
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
    const payload = validatePayload((await request.json()) as ManualDivineRequestPayload);

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${deepSeekApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        temperature: 0.7,
        stream: false,
        messages: [
          {
            role: 'system',
            content: `你是一位专业易经解卦师，语言现代、简洁、吉利、不迷信，80～100字。
用户问题：${payload.question}
占得卦象：${payload.guaName}
卦性：${payload.luckLabel}（吉/平/凶）
请结合问题与卦意给出简明运势指引，语气温和专业。`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return createJsonResponse({ message: errorText || 'AI 解读暂时不可用，请稍后再试。' }, response.status || 502);
    }

    const data = (await response.json()) as DeepSeekChatCompletionResponse;
    return createJsonResponse({ interpretation: extractInterpretation(data) }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI 解读失败，请稍后再试。';
    return createJsonResponse({ message }, 400);
  }
}
