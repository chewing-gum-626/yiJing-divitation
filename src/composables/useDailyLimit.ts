import { computed, ref } from 'vue';

export function useDailyLimit(limit: number) {
  const usedCount = ref(0);
  const remainingCount = computed(() => Math.max(limit - usedCount.value, 0));
  const isExhausted = computed(() => remainingCount.value === 0);

  function increase() {
    if (!isExhausted.value) {
      usedCount.value += 1;
    }
  }

  return {
    usedCount,
    remainingCount,
    isExhausted,
    increase,
  };
}
