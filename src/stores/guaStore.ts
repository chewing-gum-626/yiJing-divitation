import { defineStore } from 'pinia';

import type { DivinationResult } from '@/types/gua';

interface GuaState {
  currentResult: DivinationResult | null;
}

export const useGuaStore = defineStore('gua', {
  state: (): GuaState => ({
    currentResult: null,
  }),
  actions: {
    setCurrentResult(result: DivinationResult) {
      this.currentResult = result;
    },

    clearCurrentResult() {
      this.currentResult = null;
    },
  },
});
