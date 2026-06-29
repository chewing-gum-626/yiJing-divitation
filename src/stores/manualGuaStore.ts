import { defineStore } from 'pinia';

import { type CoinCombination, deriveYao, type YaoInfo } from '@/constants/gua';

export type LuckType = 'ji' | 'ping' | 'xiong';
type Sender = 'system' | 'user';
type MessageType = 'text' | 'guide' | 'coin_selector' | 'result_card';
type CurrentStep = 'ask_question' | 'showing_guide' | 'rolling' | 'finished';
type FortuneLevel = '吉' | '平' | '凶';

interface ManualDivineResponse {
  interpretation?: string;
  message?: string;
}

interface ResultCardPayload {
  guaName: string;
  fortune: FortuneLevel;
  luckType: LuckType;
  interpretation: string;
  yaos: YaoInfo[];
  question: string;
  isLoading: boolean;
  errorMessage: string;
}

interface CoinSelectorPayload {
  round: number;
}

export interface Message {
  id: string;
  sender: Sender;
  type: MessageType;
  content: string;
  payload?: YaoInfo | CoinSelectorPayload | ResultCardPayload;
}

interface ManualGuaState {
  currentStep: CurrentStep;
  question: string;
  userQuestion: string;
  currentRound: number;
  yaos: YaoInfo[];
  messages: Message[];
}

const GUA_NAMES = ['风泽中孚', '山火贲', '水天需', '雷风恒', '地山谦', '火地晋'];
const LUCK_TYPE_LABELS: Record<LuckType, FortuneLevel> = {
  ji: '吉',
  ping: '平',
  xiong: '凶',
};
const DEFAULT_INTERPRETATION = 'AI 解卦正在生成中，请稍候片刻。';

/**
 * 创建聊天消息对象。
 * sender 表示消息归属，type 决定组件渲染分支，payload 承载爻位、选择器或最终解卦卡片数据。
 */
function createMessage(sender: Sender, type: MessageType, content: string, payload?: Message['payload']): Message {
  return {
    id: crypto.randomUUID(),
    sender,
    type,
    content,
    payload,
  };
}

/**
 * 使用六爻数值快速推导一个本地卦名。
 * 这里先用轻量映射保证离线也能完成卡片生成，后续可替换为完整 64 卦映射。
 */
function deriveGuaName(yaos: YaoInfo[]): string {
  const valueSum = yaos.reduce((sum, yao) => sum + yao.value, 0);
  return GUA_NAMES[valueSum % GUA_NAMES.length];
}

/**
 * 根据手动六爻的动爻数量和值域推导吉凶。
 * 目的：DeepSeek Prompt 需要明确卦性，当前先用简单稳定规则模拟，避免接入完整卦变逻辑前无状态可用。
 */
function deriveLuckType(yaos: YaoInfo[]): LuckType {
  const changingCount = yaos.filter((yao) => yao.isChanging).length;
  const valueSum = yaos.reduce((sum, yao) => sum + yao.value, 0);

  if (changingCount >= 4) {
    return 'xiong';
  }

  if (changingCount >= 2) {
    return 'ping';
  }

  return valueSum % 3 === 0 ? 'ji' : valueSum % 3 === 1 ? 'ping' : 'xiong';
}

/**
 * 生成结果卡片初始数据。
 * 卡片会先以 loading 状态插入聊天流，随后 fetchGuaInterpretation 完成后再更新 interpretation。
 */
function createResultCard(question: string, yaos: YaoInfo[]): ResultCardPayload {
  const luckType = deriveLuckType(yaos);

  return {
    guaName: deriveGuaName(yaos),
    fortune: LUCK_TYPE_LABELS[luckType],
    luckType,
    question,
    yaos,
    interpretation: DEFAULT_INTERPRETATION,
    isLoading: true,
    errorMessage: '',
  };
}

function getCombinationLabel(combination: CoinCombination): string {
  const labels: Record<CoinCombination, string> = {
    '3_HEADS': '三个字',
    '2_HEADS_1_TAIL': '两字一背',
    '1_HEAD_2_TAILS': '一字两背',
    '3_TAILS': '三个背',
  };

  return labels[combination];
}

export const useManualGuaStore = defineStore('manualGua', {
  state: (): ManualGuaState => ({
    currentStep: 'ask_question',
    question: '',
    userQuestion: '',
    currentRound: 1,
    yaos: [],
    messages: [],
  }),
  actions: {
    initSession() {
      this.currentStep = 'ask_question';
      this.question = '';
      this.userQuestion = '';
      this.currentRound = 1;
      this.yaos = [];
      this.messages = [createMessage('system', 'text', '你好，请问你今天想要占卜什么问题？')];
    },

    submitQuestion(question: string) {
      const normalizedQuestion = question.trim();

      if (!normalizedQuestion || this.currentStep !== 'ask_question') {
        return;
      }

      this.question = normalizedQuestion;
      this.userQuestion = normalizedQuestion;
      this.currentStep = 'showing_guide';
      this.messages.push(createMessage('user', 'text', normalizedQuestion));
      this.messages.push(
        createMessage(
          'system',
          'guide',
          '准备开始手动起卦。请让自己安静下来，把问题在心里默念一遍。',
        ),
      );
    },

    startRolling() {
      if (this.currentStep !== 'showing_guide') {
        return;
      }

      this.currentStep = 'rolling';
      this.currentRound = 1;
      this.messages.push(
        createMessage('system', 'coin_selector', '请掷出第 1 次，结果是？', {
          round: 1,
        }),
      );
    },

    /**
     * 通过服务端接口生成手动起卦解读。
     * resultMessageId 用于定位聊天流中的结果卡片，避免异步返回后更新错消息。
     */
    async fetchGuaInterpretation(resultMessageId: string) {
      const resultMessage = this.messages.find((message) => message.id === resultMessageId);
      const payload = resultMessage?.payload;

      if (!payload || !('guaName' in payload) || !('luckType' in payload)) {
        return;
      }

      try {
        const response = await fetch('/api/manual-divine', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question: payload.question,
            guaName: payload.guaName,
            luckType: payload.luckType,
          }),
        });
        const data = (await response.json()) as ManualDivineResponse;

        if (!response.ok) {
          throw new Error(data.message || 'AI 解读暂时不可用，请稍后再试。');
        }

        if (!data.interpretation) {
          throw new Error('AI 未返回有效解读内容。');
        }

        payload.interpretation = data.interpretation;
      } catch (error) {
        payload.errorMessage = error instanceof Error ? error.message : 'AI 解读失败，请稍后再试。';
        payload.interpretation = '暂时无法连接 AI 解卦服务。你可以先参考卦象本身：稳住心绪，聚焦当下最重要的一步，避免在信息不足时做过度判断。';
      } finally {
        payload.isLoading = false;
      }
    },

    recordCoinResult(combination: CoinCombination) {
      if (this.currentStep !== 'rolling' || this.yaos.length >= 6) {
        return;
      }

      const yao = deriveYao(combination);
      const round = this.currentRound;

      this.yaos.push(yao);
      this.messages.push(createMessage('user', 'text', `第 ${round} 次：${getCombinationLabel(combination)}（${yao.name}）`, yao));

      if (this.yaos.length >= 6) {
        const resultCard = createResultCard(this.userQuestion, this.yaos);
        const resultMessage = createMessage('system', 'result_card', '六爻已成，这是本次卦象的 AI 解读。', resultCard);

        this.currentStep = 'finished';
        this.messages.push(resultMessage);
        void this.fetchGuaInterpretation(resultMessage.id);
        return;
      }

      this.currentRound += 1;
      this.messages.push(
        createMessage('system', 'coin_selector', `请掷出第 ${this.currentRound} 次，结果是？`, {
          round: this.currentRound,
        }),
      );
    },
  },
});

export type { CoinSelectorPayload, CurrentStep, FortuneLevel, ResultCardPayload };
