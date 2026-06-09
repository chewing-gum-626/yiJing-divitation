import { ref } from 'vue';

import { createShareImage } from '@/services/shareService';

export function useShare() {
  const imageUrl = ref<string | null>(null);
  const isGenerating = ref(false);

  async function generateShareImage(element: HTMLElement) {
    isGenerating.value = true;

    try {
      imageUrl.value = await createShareImage(element);
    } finally {
      isGenerating.value = false;
    }
  }

  return {
    imageUrl,
    isGenerating,
    generateShareImage,
  };
}
