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

function parseSseContent(rawChunk: string): string {
  return rawChunk
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
        return line;
      }
    })
    .join('');
}

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
    reset() {
      this.aiResult = '';
      this.guaStatus = '';
      this.isStreaming = false;
      this.errorMessage = '';
    },

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

        while (true) {
          const { value, done } = await reader.read();

          if (done) {
            break;
          }

          const rawChunk = decoder.decode(value, { stream: true });
          const content = parseSseContent(rawChunk);
          this.appendContent(content || rawChunk);
        }

        const remainingContent = decoder.decode();
        this.appendContent(parseSseContent(remainingContent) || remainingContent);
      } catch (error) {
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
