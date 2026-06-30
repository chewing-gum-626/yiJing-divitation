export const DAILY_NORMAL_LIMIT = 99;
export const DAILY_ONE_LIMIT = 1;

export type CoinCombination = '3_HEADS' | '2_HEADS_1_TAIL' | '1_HEAD_2_TAILS' | '3_TAILS';
export type ManualYaoType = '少阳' | '少阴' | '老阳' | '老阴';

export interface YaoInfo {
  type: ManualYaoType;
  value: 6 | 7 | 8 | 9;
  isChanging: boolean;
  name: string;
}

export const COIN_COMBINATION_OPTIONS: Array<{
  label: string;
  description: string;
  value: CoinCombination;
}> = [
  {
    label: '两字一背',
    description: '少阳 · 7',
    value: '2_HEADS_1_TAIL',
  },
  {
    label: '一字两背',
    description: '少阴 · 8',
    value: '1_HEAD_2_TAILS',
  },
  {
    label: '三个背',
    description: '老阳 · 9 · 动爻',
    value: '3_TAILS',
  },
  {
    label: '三个字',
    description: '老阴 · 6 · 动爻',
    value: '3_HEADS',
  },
];

export function deriveYao(combination: CoinCombination): YaoInfo {
  switch (combination) {
    case '3_HEADS':
      return {
        type: '老阴',
        value: 6,
        isChanging: true,
        name: '老阴',
      };
    case '2_HEADS_1_TAIL':
      return {
        type: '少阳',
        value: 7,
        isChanging: false,
        name: '少阳',
      };
    case '1_HEAD_2_TAILS':
      return {
        type: '少阴',
        value: 8,
        isChanging: false,
        name: '少阴',
      };
    case '3_TAILS':
      return {
        type: '老阳',
        value: 9,
        isChanging: true,
        name: '老阳',
      };
    default: {
      const exhaustiveCheck: never = combination;
      return exhaustiveCheck;
    }
  }
}
