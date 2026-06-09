import { computed, ref } from 'vue';

import { generateGuaResult } from '@/services/guaService';
import type { GuaResult } from '@/types/gua';

export function useGua() {
  const result = ref<GuaResult | null>(null);
  const hasResult = computed(() => Boolean(result.value));

  function generate() {
    result.value = generateGuaResult();
  }

  return {
    result,
    hasResult,
    generate,
  };
}
