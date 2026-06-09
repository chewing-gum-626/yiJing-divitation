import { readJson, writeJson } from '@/utils/storage';

export const STORAGE_KEYS = {
  DAILY_NORMAL_COUNT: 'daily_normal_count',
  DAILY_NORMAL_DATE: 'daily_normal_date',
  DAILY_ONE_USED: 'daily_one_used',
  DAILY_ONE_DATE: 'daily_one_date',
  DAILY_ONE_RESULT: 'daily_one_result',
} as const;

export { readJson, writeJson };
