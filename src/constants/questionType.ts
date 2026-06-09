export const QUESTION_TYPES = [
  { label: '通用', value: 'general' },
  { label: '事业', value: 'career' },
  { label: '感情', value: 'love' },
  { label: '财运', value: 'wealth' },
  { label: '学业', value: 'study' },
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number]['value'];
