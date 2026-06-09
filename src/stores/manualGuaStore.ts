import { defineStore } from 'pinia';

import { type CoinCombination, deriveYao, type YaoInfo } from '@/constants/gua';

type Sender = 'system' | 'user';
type MessageType = 'text' | 'guide' | 'coin_selector' | 'result_card';
type CurrentStep = 'ask_question' | 'showing_guide' | 'rolling' | 'finished';
type FortuneLevel = '吉' | '平' | '凶';

interface ResultCardPayload {
  guaName: string;
  fortune: FortuneLevel;
  interpretation: string;
  yaos: YaoInfo[];
  question: string;
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
  currentRound: number;
  yaos: YaoInfo[];
  messages: Message[];
}

const GUA_NAMES = ['风泽中孚', '山火贲', '水天需', '雷风恒', '地山谦', '火地晋'];
const FORTUNES: FortuneLevel[] = ['吉', '平', '凶'];

function createMessage(sender: Sender, type: MessageType, content: string, payload?: Message['payload']): Message {
  return {
    id: crypto.randomUUID(),
    sender,
    type,
    content,
    payload,
  };
}

function createResultCard(question: string, yaos: YaoInfo[]): ResultCardPayload {
  const changingCount = yaos.filter((yao) => yao.isChanging).length;
  const valueSum = yaos.reduce((sum, yao) => sum + yao.value, 0);
  const guaName = GUA_NAMES[valueSum % GUA_NAMES.length];
  const fortune = changingCount >= 3 ? '平' : FORTUNES[valueSum % FORTUNES.length];

  return {
    guaName,
    fortune,
    question,
    yaos,
    interpretation:
      '眼前的变化正在成形，适合先稳住节奏，再顺势推进。别急着下结论，整理信息后行动，会更容易看见清晰方向。',
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
    currentRound: 1,
    yaos: [],
    messages: [],
  }),
  actions: {
    initSession() {
      this.currentStep = 'ask_question';
      this.question = '';
      this.currentRound = 1;
      this.yaos = [];
      this.messages = [
        createMessage('system', 'text', '你好，请问你今天想要占卜什么问题？'),
      ];
    },

    submitQuestion(question: string) {
      const normalizedQuestion = question.trim();

      if (!normalizedQuestion || this.currentStep !== 'ask_question') {
        return;
      }

      this.question = normalizedQuestion;
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

    recordCoinResult(combination: CoinCombination) {
      if (this.currentStep !== 'rolling' || this.yaos.length >= 6) {
        return;
      }

      const yao = deriveYao(combination);
      const round = this.currentRound;

      this.yaos.push(yao);
      this.messages.push(createMessage('user', 'text', `第 ${round} 次：${getCombinationLabel(combination)}（${yao.name}）`, yao));

      if (this.yaos.length >= 6) {
        const resultCard = createResultCard(this.question, this.yaos);

        this.currentStep = 'finished';
        this.messages.push(createMessage('system', 'result_card', '六爻已成，这是本次卦象的简明解读。', resultCard));
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

export type { CoinSelectorPayload, CurrentStep, ResultCardPayload };
