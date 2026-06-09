<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { QUESTION_TYPES, type QuestionType } from '@/constants/questionType';
import { generateDailyDivinationResult } from '@/services/guaService';
import { useDailyStore } from '@/stores/dailyStore';
import { useGuaStore } from '@/stores/guaStore';

const router = useRouter();
const dailyStore = useDailyStore();
const guaStore = useGuaStore();

const selectedQuestionType = ref<QuestionType>('general');
const errorMessage = ref('');

const buttonText = computed(() => (dailyStore.hasDailyOneChance ? '起今日之卦' : '今日已起卦，查看结果'));

function handleQuestionTypeChange(questionType: QuestionType) {
  if (!dailyStore.hasDailyOneChance) {
    return;
  }

  selectedQuestionType.value = questionType;
  errorMessage.value = '';
}

function startDailyGua() {
  dailyStore.initializeDailyOneLimit();
  errorMessage.value = '';

  if (dailyStore.dailyOneResult) {
    guaStore.setCurrentResult(dailyStore.dailyOneResult);
    void router.push('/result');
    return;
  }

  const result = generateDailyDivinationResult(selectedQuestionType.value);
  const consumed = dailyStore.consumeDailyOneChance(result);

  if (!consumed) {
    errorMessage.value = '今日每日一卦已使用，请明天再来。';
    return;
  }

  guaStore.setCurrentResult(result);
  void router.push('/result');
}

onMounted(() => {
  dailyStore.initializeDailyOneLimit();

  if (dailyStore.dailyOneResult) {
    selectedQuestionType.value = dailyStore.dailyOneResult.questionType;
  }
});
</script>

<template>
  <main class="mx-auto min-h-screen w-full max-w-[var(--app-max-width)] px-5 py-8">
    <RouterLink to="/" class="text-sm font-medium text-brand-600">返回首页</RouterLink>

    <section class="mt-8 rounded-[var(--card-radius)] bg-white/80 p-6 shadow-soft ring-1 ring-white/80">
      <p class="mb-2 text-sm font-semibold text-orange-500">每日一卦 1 次/天</p>
      <h1 class="mb-6 text-3xl font-bold text-slate-900">每日一卦</h1>

      <div class="mb-8 flex flex-wrap gap-2">
        <button
          v-for="type in QUESTION_TYPES"
          :key="type.value"
          type="button"
          class="rounded-full px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
          :class="
            selectedQuestionType === type.value
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
              : 'bg-slate-100 text-slate-600 hover:bg-orange-100 hover:text-orange-600'
          "
          :disabled="!dailyStore.hasDailyOneChance"
          @click="handleQuestionTypeChange(type.value)"
        >
          {{ type.label }}
        </button>
      </div>

      <p v-if="errorMessage" class="mb-4 rounded-2xl bg-orange-50 px-4 py-3 text-sm text-orange-700">
        {{ errorMessage }}
      </p>

      <button
        type="button"
        class="w-full rounded-2xl bg-orange-500 px-5 py-4 font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
        @click="startDailyGua"
      >
        {{ buttonText }}
      </button>
    </section>
  </main>
</template>
