import type { QuestionType } from '@/constants/questionType';

export type GuaOutcome = 'good' | 'neutral' | 'bad';
export type LineKind = 'yin' | 'yang';
export type YaoType = 6 | 7 | 8 | 9;

export interface YaoInfo {
  position: 1 | 2 | 3 | 4 | 5 | 6;
  value: YaoType;
  isChanging: boolean;
  symbol: LineKind;
}

export interface DivinationResult {
  questionType: QuestionType;
  timestamp: number;
  originalGuaId: string;
  changedGuaId: string;
  displayYaos: YaoInfo[];
}

export interface GuaLine {
  kind: LineKind;
  moving: boolean;
}

export interface GuaResult {
  id: string;
  name: string;
  outcome: GuaOutcome;
  interpretation: string;
  lines: GuaLine[];
  createdAt: string;
  questionType: QuestionType;
  originalGuaId: string;
  changedGuaId: string;
  upperTrigram: string;
  lowerTrigram: string;
}
