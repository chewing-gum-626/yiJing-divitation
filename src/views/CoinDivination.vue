<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { gsap } from 'gsap';
import { RefreshCw } from 'lucide-vue-next';

import { QUESTION_TYPES, type QuestionType } from '@/constants/questionType';
import { createDivinationResult } from '@/services/guaService';
import { useAIStore } from '@/stores/aiStore';
import { useDailyStore } from '@/stores/dailyStore';
import { useGuaStore } from '@/stores/guaStore';
import type { YaoInfo } from '@/types/gua';
import { generateSixYaos } from '@/utils/random';

const router = useRouter();
const aiStore = useAIStore();
const dailyStore = useDailyStore();
const guaStore = useGuaStore();

const selectedQuestionType = ref<QuestionType>('general');
const question = ref('');
const displayYaos = ref<YaoInfo[]>([]);
const isAnimating = ref(false);
const errorMessage = ref('');

const remainingText = computed(() => `${dailyStore.remainingNormalCount}/3`);
const canStartDivination = computed(() => dailyStore.hasNormalChance && !isAnimating.value);

/**
 * 切换问题类型时清空已展示卦象和 AI 状态。
 * 目的：问题类型会影响基础文案和 AI Prompt，旧结果不能继续保留，否则用户会误以为当前类型已重新起卦。
 */
function handleQuestionTypeChange(questionType: QuestionType) {
  if (isAnimating.value || selectedQuestionType.value === questionType) {
    return;
  }

  selectedQuestionType.value = questionType;
  errorMessage.value = '';

  if (displayYaos.value.length > 0) {
    displayYaos.value = [];
    aiStore.reset();
    guaStore.clearCurrentResult();
  }
}

function getYaoLabel(yao: YaoInfo) {
  const labels: Record<YaoInfo['value'], string> = {
    6: '老阴',
    7: '少阳',
    8: '少阴',
    9: '老阳',
  };

  return labels[yao.value];
}

/**
 * 启动系统模拟起卦。
 * 该流程会同时做三件事：生成六爻并保存本地结果、后台发起 AI 流式解卦、播放 1.8 秒左右的爻位动画；
 * 动画完成后立即跳转结果页，AI 文本会继续通过 Pinia Store 流式追加，形成打字机效果。
 */
async function startDivination() {
  dailyStore.initializeNormalLimit();
  errorMessage.value = '';

  // if (!dailyStore.hasNormalChance) {
  //   errorMessage.value = '今日铜钱起卦次数已用尽，请明天再来。';
  //   return;
  // }

  if (isAnimating.value) {
    return;
  }

  isAnimating.value = true;
  aiStore.reset();
  guaStore.clearCurrentResult();
  dailyStore.lockDivining(selectedQuestionType.value);

  const generatedYaos = generateSixYaos();
  const result = createDivinationResult(selectedQuestionType.value, generatedYaos);
  displayYaos.value = generatedYaos;
  guaStore.setCurrentResult(result);

  // AI 请求不等待动画结束：先让云函数开始流式生成，结果页打开后即可继续接收 Store 中追加的文本。
  const aiPromise = aiStore.fetchAIResponse({
    question: question.value,
    questionType: selectedQuestionType.value,
    originalGuaId: result.originalGuaId,
    changedGuaId: result.changedGuaId,
  });

  await nextTick();

  gsap.set('.yao-line', {
    opacity: 0,
    y: 18,
    scaleX: 0.72,
    transformOrigin: 'center',
  });

  // 用 Promise 包装 GSAP 回调，让起卦主流程可以按“动画完成 -> 扣次数 -> 跳转”的顺序自然书写。
  await new Promise<void>((resolve) => {
    gsap.to('.yao-line', {
      opacity: 1,
      y: 0,
      scaleX: 1,
      duration: 0.3,
      stagger: 0.3,
      ease: 'back.out(1.7)',
      onComplete: resolve,
    });
  });

  const consumed = dailyStore.consumeNormalChance();
  dailyStore.clearDiviningLock();

  if (!consumed) {
    isAnimating.value = false;
    errorMessage.value = '今日铜钱起卦次数已用尽，请明天再来。';
    return;
  }

  void aiPromise;
  void router.push({ name: 'result' });
}

onMounted(() => {
  dailyStore.initializeNormalLimit();
});
</script>

<template>
  <main class="mx-auto min-h-screen w-full max-w-[var(--app-max-width)] px-5 py-8">
    <RouterLink to="/" class="text-sm font-medium text-brand-600">返回首页</RouterLink>

    <section class="mt-8 rounded-[var(--card-radius)] bg-white/85 p-6 shadow-soft ring-1 ring-white/80 backdrop-blur">
      <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="mb-2 text-sm font-semibold text-brand-600">今日剩余次数 {{ remainingText }}</p>
          <h1 class="text-3xl font-bold text-slate-900">铜钱起卦</h1>
        </div>
        <p class="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-500">一事不二占，先定问题再起卦</p>
      </div>

      <div class="mb-5 flex flex-wrap gap-2">
        <button
          v-for="type in QUESTION_TYPES"
          :key="type.value"
          type="button"
          class="rounded-full px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
          :class="
            selectedQuestionType === type.value
              ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20'
              : 'bg-slate-100 text-slate-600 hover:bg-brand-100 hover:text-brand-600'
          "
          :disabled="isAnimating"
          @click="handleQuestionTypeChange(type.value)"
        >
          {{ type.label }}
        </button>
      </div>

      <label class="mb-8 block">
        <span class="mb-2 block text-sm font-semibold text-slate-600">想问什么？</span>
        <textarea
          v-model="question"
          rows="3"
          maxlength="300"
          class="w-full resize-none rounded-3xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-brand-300 focus:bg-white focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-60"
          placeholder="例如：我最近适合换工作吗？不填也可以获得通用解读。"
          :disabled="isAnimating"
        />
      </label>

      <div class="mb-8 rounded-3xl bg-gradient-to-b from-slate-50 to-white p-5 ring-1 ring-slate-100">
        <div
          v-if="displayYaos.length === 0"
          class="flex min-h-72 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-center text-slate-400"
        >
          <p>点击系统模拟起卦后，六爻会由下往上依次亮起。</p>
        </div>

        <div v-else class="flex min-h-72 flex-col-reverse justify-center gap-4">
          <div
            v-for="yao in displayYaos"
            :key="yao.position"
            class="yao-line flex items-center justify-center gap-4"
          >
            <span class="w-8 text-right text-xs font-semibold text-slate-400">{{ yao.position }}</span>

            <div class="flex h-8 w-52 items-center justify-center sm:w-72">
              <div
                v-if="yao.symbol === 'yang'"
                class="h-3 w-full rounded-full shadow-sm"
                :class="yao.isChanging ? 'bg-orange-500 shadow-orange-200' : 'bg-slate-800 shadow-slate-200'"
              />

              <div v-else class="flex w-full items-center justify-between gap-8">
                <div
                  class="h-3 flex-1 rounded-full shadow-sm"
                  :class="yao.isChanging ? 'bg-orange-500 shadow-orange-200' : 'bg-slate-800 shadow-slate-200'"
                />
                <div
                  class="h-3 flex-1 rounded-full shadow-sm"
                  :class="yao.isChanging ? 'bg-orange-500 shadow-orange-200' : 'bg-slate-800 shadow-slate-200'"
                />
              </div>
            </div>

            <div class="flex w-20 items-center gap-2 text-sm font-medium">
              <span :class="yao.isChanging ? 'text-orange-600' : 'text-slate-500'">{{ getYaoLabel(yao) }}</span>
              <RefreshCw v-if="yao.isChanging" class="animate-spin text-orange-500" :size="16" />
            </div>
          </div>
        </div>
      </div>

      <p v-if="errorMessage" class="mb-4 rounded-2xl bg-orange-50 px-4 py-3 text-sm text-orange-700">
        {{ errorMessage }}
      </p>

      <div class="grid gap-3">
        <button
          type="button"
          class="w-full rounded-2xl bg-brand-600 px-5 py-4 font-semibold text-white shadow-lg shadow-brand-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          :disabled="!canStartDivination"
          @click="startDivination"
        >
          {{ isAnimating ? '起卦中...' : dailyStore.hasNormalChance ? '系统模拟起卦' : '今日次数已用尽' }}
        </button>
      </div>
    </section>
  </main>
</template>
