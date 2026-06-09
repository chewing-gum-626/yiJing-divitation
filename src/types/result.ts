import type { GuaResult } from './gua';

export interface ResultViewState {
  result: GuaResult | null;
  source: 'normal' | 'daily' | null;
}
