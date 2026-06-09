import { defineStore } from 'pinia';

import { DAILY_NORMAL_LIMIT } from '@/constants/gua';
import type { QuestionType } from '@/constants/questionType';
import type { DivinationResult } from '@/types/gua';
import { getTodayKey } from '@/utils/date';

const STORAGE_KEYS = {
  DAILY_NORMAL_COUNT: 'daily_normal_count',
  DAILY_NORMAL_DATE: 'daily_normal_date',
  DAILY_ONE_DATE: 'daily_one_date',
  DAILY_ONE_USED: 'daily_one_used',
  DAILY_ONE_RESULT: 'daily_one_result',
  DIVINING_STATE: 'divining_state',
} as const;

interface DiviningState {
  isDivining: true;
  timestamp: number;
  questionType: QuestionType;
}

interface DailyState {
  normalCount: number;
  normalDate: string;
  dailyOneDate: string;
  dailyOneUsed: boolean;
  dailyOneResult: DivinationResult | null;
  crashHandled: boolean;
}

function safeReadNumber(key: string, fallback: number): number {
  const rawValue = localStorage.getItem(key);
  const parsedValue = rawValue === null ? Number.NaN : Number(rawValue);

  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

function safeReadDiviningState(): DiviningState | null {
  const rawValue = localStorage.getItem(STORAGE_KEYS.DIVINING_STATE);

  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(rawValue) as Partial<DiviningState>;
    const isValidQuestionType = typeof parsedValue.questionType === 'string';

    if (parsedValue.isDivining === true && typeof parsedValue.timestamp === 'number' && isValidQuestionType) {
      return parsedValue as DiviningState;
    }
  } catch {
    return null;
  }

  return null;
}

function safeReadDivinationResult(key: string): DivinationResult | null {
  const rawValue = localStorage.getItem(key);

  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(rawValue) as Partial<DivinationResult>;

    if (
      typeof parsedValue.questionType === 'string' &&
      typeof parsedValue.timestamp === 'number' &&
      typeof parsedValue.originalGuaId === 'string' &&
      typeof parsedValue.changedGuaId === 'string' &&
      Array.isArray(parsedValue.displayYaos)
    ) {
      return parsedValue as DivinationResult;
    }
  } catch {
    return null;
  }

  return null;
}

export const useDailyStore = defineStore('daily', {
  state: (): DailyState => ({
    normalCount: DAILY_NORMAL_LIMIT,
    normalDate: getTodayKey(),
    dailyOneDate: getTodayKey(),
    dailyOneUsed: false,
    dailyOneResult: null,
    crashHandled: false,
  }),
  getters: {
    remainingNormalCount: (state) => state.normalCount,
    hasNormalChance: (state) => state.normalCount > 0,
    hasDailyOneChance: (state) => !state.dailyOneUsed,
  },
  actions: {
    initializeNormalLimit() {
      const todayKey = getTodayKey();
      const storedDate = localStorage.getItem(STORAGE_KEYS.DAILY_NORMAL_DATE);

      if (storedDate !== todayKey) {
        this.normalDate = todayKey;
        this.normalCount = DAILY_NORMAL_LIMIT;
        this.syncNormalLimit();
        return;
      }

      this.normalDate = storedDate;
      this.normalCount = Math.min(
        Math.max(safeReadNumber(STORAGE_KEYS.DAILY_NORMAL_COUNT, DAILY_NORMAL_LIMIT), 0),
        DAILY_NORMAL_LIMIT,
      );
    },

    syncNormalLimit() {
      localStorage.setItem(STORAGE_KEYS.DAILY_NORMAL_DATE, this.normalDate);
      localStorage.setItem(STORAGE_KEYS.DAILY_NORMAL_COUNT, String(this.normalCount));
    },

    initializeDailyOneLimit() {
      const todayKey = getTodayKey();
      const storedDate = localStorage.getItem(STORAGE_KEYS.DAILY_ONE_DATE);

      if (storedDate !== todayKey) {
        this.dailyOneDate = todayKey;
        this.dailyOneUsed = false;
        this.dailyOneResult = null;
        this.syncDailyOneLimit();
        return;
      }

      this.dailyOneDate = storedDate;
      this.dailyOneUsed = localStorage.getItem(STORAGE_KEYS.DAILY_ONE_USED) === 'true';
      this.dailyOneResult = safeReadDivinationResult(STORAGE_KEYS.DAILY_ONE_RESULT);
    },

    syncDailyOneLimit() {
      localStorage.setItem(STORAGE_KEYS.DAILY_ONE_DATE, this.dailyOneDate);
      localStorage.setItem(STORAGE_KEYS.DAILY_ONE_USED, String(this.dailyOneUsed));

      if (this.dailyOneResult) {
        localStorage.setItem(STORAGE_KEYS.DAILY_ONE_RESULT, JSON.stringify(this.dailyOneResult));
      } else {
        localStorage.removeItem(STORAGE_KEYS.DAILY_ONE_RESULT);
      }
    },

    consumeDailyOneChance(result: DivinationResult) {
      this.initializeDailyOneLimit();

      if (this.dailyOneUsed) {
        return false;
      }

      this.dailyOneUsed = true;
      this.dailyOneResult = result;
      this.syncDailyOneLimit();
      return true;
    },

    lockDivining(questionType: QuestionType) {
      const diviningState: DiviningState = {
        isDivining: true,
        timestamp: Date.now(),
        questionType,
      };

      localStorage.setItem(STORAGE_KEYS.DIVINING_STATE, JSON.stringify(diviningState));
    },

    clearDiviningLock() {
      localStorage.removeItem(STORAGE_KEYS.DIVINING_STATE);
    },

    consumeNormalChance() {
      this.initializeNormalLimit();

      if (this.normalCount <= 0) {
        return false;
      }

      this.normalCount -= 1;
      this.syncNormalLimit();
      return true;
    },

    checkAndHandleCrash() {
      this.initializeNormalLimit();

      const diviningState = safeReadDiviningState();

      if (!diviningState) {
        this.crashHandled = false;
        this.clearDiviningLock();
        return false;
      }

      this.consumeNormalChance();
      this.clearDiviningLock();
      this.crashHandled = true;
      return true;
    },
  },
});
