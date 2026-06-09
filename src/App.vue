<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { RouterView } from 'vue-router';

import { useDailyStore } from '@/stores/dailyStore';

const dailyStore = useDailyStore();
const crashMessage = ref('');

onMounted(() => {
  const hasHandledCrash = dailyStore.checkAndHandleCrash();

  if (hasHandledCrash) {
    crashMessage.value = '检测到上次起卦动画中断，已按规则扣除 1 次今日起卦次数。';

    window.setTimeout(() => {
      crashMessage.value = '';
    }, 4000);
  }
});
</script>

<template>
  <div>
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="translate-y-2 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-2 opacity-0"
    >
      <div
        v-if="crashMessage"
        class="fixed left-1/2 top-4 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl bg-orange-50 px-4 py-3 text-sm font-medium text-orange-700 shadow-soft ring-1 ring-orange-100"
      >
        {{ crashMessage }}
      </div>
    </Transition>

    <RouterView />
  </div>
</template>
