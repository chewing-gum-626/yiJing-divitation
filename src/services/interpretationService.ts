import type { GuaResult } from '@/types/gua';

const OUTCOME_LABELS: Record<GuaResult['outcome'], string> = {
  good: '吉',
  neutral: '平',
  bad: '凶',
};

export function formatInterpretation(result: GuaResult): string {
  return `【卦名】${result.name}\n【吉凶】${OUTCOME_LABELS[result.outcome]}\n【解读】${result.interpretation}`;
}
