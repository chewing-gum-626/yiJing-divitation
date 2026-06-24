import { defineStore } from 'pinia';

import type { QuestionType } from '@/constants/questionType';

export type AIGuaStatus = '吉' | '平' | '凶';

export interface AIRequestPayload {
  question: string;
  questionType: QuestionType;
  originalGuaId: string;
  changedGuaId: string;
}

interface AIState {
  aiResult: string;
  guaStatus: AIGuaStatus | '';
  isStreaming: boolean;
  errorMessage: string;
}

interface DeepSeekStreamChunk {
  choices?: Array<{
    delta?: {
      content?: string;
    };
  }>;
}

const STATUS_PATTERN = /^\s*\[STATUS:(吉|平|凶)]\s*/;

/**
 * 从单条 SSE 事件中提取 DeepSeek 返回的增量文本。
 * eventText 是以 data: 开头的一条完整事件；只有拿到完整事件后再 JSON.parse，
 * 才能避免网络分块把 JSON 字符串截断造成解析失败。
 */
function parseSseEvent(eventText: string): string {
  return eventText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.replace(/^data:\s*/, ''))
    .filter((line) => line && line !== '[DONE]')
    .map((line) => {
      try {
        const parsed = JSON.parse(line) as DeepSeekStreamChunk;
        return parsed.choices?.[0]?.delta?.content ?? '';
      } catch {
        return '';
      }
    })
    .join('');
}

/**
 * 解析 SSE 缓冲区中的完整事件，并把最后一段未完成事件保留下来。
 * DeepSeek 的流式响应以空行分隔事件；当 chunk 刚好切在 JSON 中间时，rest 会等待下一块数据再解析。
 */
function parseSseBuffer(buffer: string): { content: string; rest: string } {
  const normalizedBuffer = buffer.replace(/\r\n/g, '\n');
  const parts = normalizedBuffer.split('\n\n');
  const rest = parts.pop() ?? '';
  const content = parts.map(parseSseEvent).join('');

  return { content, rest };
}

/**
 * 解析后端错误响应，统一转成适合前端 Toast 展示的中文文案。
 * value 可能来自 429 限流、环境变量缺失或 DeepSeek 上游错误，因此必须先做 unknown 类型收窄。
 */
function parseErrorMessage(value: unknown): string {
  if (typeof value === 'object' && value !== null && 'message' in value) {
    const message = (value as { message?: unknown }).message;
    return typeof message === 'string' ? message : 'AI 解卦失败，请稍后再试。';
  }

  return 'AI 解卦失败，请稍后再试。';
}

export const useAIStore = defineStore('ai', {
  state: (): AIState => ({
    aiResult: '',
    guaStatus: '',
    isStreaming: false,
    errorMessage: '',
  }),
  actions: {
    /**
     * 清空上一次 AI 解卦状态。
     * 新起卦前必须重置，避免旧的状态徽章和旧文本在新一轮流式响应到达前短暂闪现。
     */
    reset() {
      this.aiResult = '';
      this.guaStatus = '';
      this.isStreaming = false;
      this.errorMessage = '';
    },

    /**
     * 追加模型增量内容，并在首次出现 [STATUS:*] 时提取吉凶状态。
     * 状态标记只作为 UI 徽章使用，不展示给用户；剩余文本会持续追加到 aiResult，形成打字机效果。
     */
    appendContent(content: string) {
      if (!content) {
        return;
      }

      if (!this.guaStatus) {
        const statusMatch = content.match(STATUS_PATTERN);

        if (statusMatch) {
          this.guaStatus = statusMatch[1] as AIGuaStatus;
          this.aiResult += content.replace(STATUS_PATTERN, '').trimStart();
          return;
        }
      }

      this.aiResult += content;
    },

    /**
     * 请求后端 AI 解卦接口并消费浏览器 ReadableStream。
     * payload 中的 originalGuaId/changedGuaId 只作为服务端查表索引；questionType 和 question 用于定制化 Prompt。
     * 读取循环会逐块 decode 二进制数据，保证结果页能在 Store 更新时实时渲染。
     */
    async fetchAIResponse(payload: AIRequestPayload) {
      this.reset();
      this.isStreaming = true;

      try {
        const response = await window.fetch('/api/divine', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          let errorBody: unknown = null;

          try {
            errorBody = await response.json();
          } catch {
            errorBody = null;
          }

          throw new Error(parseErrorMessage(errorBody));
        }

        if (!response.body) {
          throw new Error('当前浏览器不支持流式解卦，请稍后再试。');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let sseBuffer = '';

        // 持续读取流式响应，每拿到一个 chunk 就写入缓冲区；只有完整 SSE 事件才会被解析并追加到 Store。
        while (true) {
          const { value, done } = await reader.read();

          if (done) {
            break;
          }

          sseBuffer += decoder.decode(value, { stream: true });
          const parsed = parseSseBuffer(sseBuffer);
          sseBuffer = parsed.rest;
          this.appendContent(parsed.content);
        }

        sseBuffer += decoder.decode();
        const parsed = parseSseBuffer(`${sseBuffer}\n\n`);
        this.appendContent(parsed.content);
      } catch (error) {
        // 网络错误、限流或上游异常都不应打断结果页基础解读，因此只记录提示并给出可展示的兜底文案。
        this.errorMessage = error instanceof Error ? error.message : 'AI 解卦失败，请稍后再试。';

        if (!this.aiResult) {
          this.aiResult = 'AI 解卦暂时不可用，你可以先参考页面上的基础卦象解读。';
        }
      } finally {
        this.isStreaming = false;
      }
    },
  },
});
