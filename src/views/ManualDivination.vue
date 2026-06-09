<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch, type ComponentPublicInstance } from 'vue';
import { gsap } from 'gsap';
import { ArrowUp, CheckCircle2, Droplets, HandCoins, Sparkles } from 'lucide-vue-next';

import { COIN_COMBINATION_OPTIONS, type CoinCombination, type YaoInfo } from '@/constants/gua';
import { useManualGuaStore, type ResultCardPayload } from '@/stores/manualGuaStore';

const store = useManualGuaStore();
const questionInput = ref('');
const chatContainerRef = ref<HTMLElement | null>(null);
const messageRefs = ref<HTMLElement[]>([]);

const canSubmitQuestion = computed(() => questionInput.value.trim().length > 0);

function setMessageRef(element: Element | ComponentPublicInstance | null, index: number) {
  if (element instanceof HTMLElement) {
    messageRefs.value[index] = element;
  }
}

function isLatestMessage(index: number) {
  return index === store.messages.length - 1;
}

function isResultPayload(payload: unknown): payload is ResultCardPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'guaName' in payload &&
    'fortune' in payload &&
    'interpretation' in payload &&
    'yaos' in payload
  );
}

function getYaoSymbol(yao: YaoInfo) {
  return yao.value === 7 || yao.value === 9 ? 'yang' : 'yin';
}

function submitQuestion() {
  if (!canSubmitQuestion.value) {
    return;
  }

  store.submitQuestion(questionInput.value);
  questionInput.value = '';
}

function recordCoinResult(combination: CoinCombination, index: number) {
  if (!isLatestMessage(index)) {
    return;
  }

  store.recordCoinResult(combination);
}

async function scrollToBottomWithAnimation() {
  await nextTick();

  const container = chatContainerRef.value;
  const latestMessage = messageRefs.value[store.messages.length - 1];

  if (latestMessage) {
    gsap.fromTo(
      latestMessage,
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.36, ease: 'power2.out' },
    );
  }

  if (container) {
    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth',
    });
  }
}

watch(
  () => store.messages.length,
  () => {
    void scrollToBottomWithAnimation();
  },
);

onMounted(() => {
  store.initSession();
});
</script>

<template>
  <main class="mx-auto flex h-screen w-full max-w-2xl flex-col bg-slate-50/80 px-4 py-4 sm:py-6">
    <header class="mb-4 flex items-center justify-between rounded-3xl bg-white/85 px-5 py-4 shadow-soft ring-1 ring-white/80 backdrop-blur">
      <div>
        <RouterLink to="/" class="text-xs font-semibold uppercase tracking-[0.24em] text-brand-600">
          Manual Gua
        </RouterLink>
        <h1 class="mt-1 text-xl font-bold text-slate-900">对话式手动起卦</h1>
      </div>
      <div class="hidden rounded-2xl bg-brand-50 px-3 py-2 text-xs font-medium text-brand-600 sm:block">
        6 轮记录 · 本地会话
      </div>
    </header>

    <section
      ref="chatContainerRef"
      class="scroll-smooth flex-1 space-y-5 overflow-y-auto rounded-3xl bg-white/70 p-4 shadow-soft ring-1 ring-white/80 backdrop-blur sm:p-6"
    >
      <div
        v-for="(message, index) in store.messages"
        :key="message.id"
        :ref="(element) => setMessageRef(element, index)"
        class="message-item"
      >
        <div
          v-if="message.type === 'text'"
          class="flex"
          :class="message.sender === 'user' ? 'justify-end' : 'justify-start'"
        >
          <div
            class="max-w-[82%] rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm"
            :class="
              message.sender === 'user'
                ? 'rounded-br-md bg-brand-600 text-white shadow-brand-500/20'
                : 'rounded-bl-md bg-slate-100 text-slate-700'
            "
          >
            {{ message.content }}
          </div>
        </div>

        <div
          v-else-if="message.type === 'guide'"
          class="rounded-3xl bg-gradient-to-br from-white to-brand-50 p-5 shadow-sm ring-1 ring-brand-100"
        >
          <div class="mb-4 flex items-center gap-3">
            <div class="rounded-2xl bg-brand-100 p-3 text-brand-600">
              <Sparkles :size="22" />
            </div>
            <div>
              <h2 class="font-bold text-slate-900">开始前的小仪式</h2>
              <p class="text-sm text-slate-500">让问题更清楚，也让记录更专注。</p>
            </div>
          </div>

          <div class="grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
            <div class="rounded-2xl bg-white/80 p-4 ring-1 ring-white">
              <Droplets class="mb-3 text-sky-500" :size="20" />
              <p class="font-semibold text-slate-800">净手</p>
              <p class="mt-1">简单洗手，安静片刻。</p>
            </div>
            <div class="rounded-2xl bg-white/80 p-4 ring-1 ring-white">
              <HandCoins class="mb-3 text-orange-500" :size="20" />
              <p class="font-semibold text-slate-800">合掌摇币</p>
              <p class="mt-1">字为阳，背为阴。</p>
            </div>
            <div class="rounded-2xl bg-white/80 p-4 ring-1 ring-white">
              <CheckCircle2 class="mb-3 text-emerald-500" :size="20" />
              <p class="font-semibold text-slate-800">逐次记录</p>
              <p class="mt-1">从初爻到上爻，共 6 次。</p>
            </div>
          </div>

          <button
            type="button"
            class="mt-5 w-full rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5"
            @click="store.startRolling()"
          >
            我已准备好，开始记录
          </button>
        </div>

        <div v-else-if="message.type === 'coin_selector'" class="rounded-3xl bg-slate-100 p-5 ring-1 ring-slate-200">
          <p class="mb-4 text-sm font-semibold text-slate-800">{{ message.content }}</p>
          <div class="grid gap-3 sm:grid-cols-2">
            <button
              v-for="option in COIN_COMBINATION_OPTIONS"
              :key="option.value"
              type="button"
              class="rounded-2xl bg-white px-4 py-4 text-left shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:ring-brand-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
              :disabled="!isLatestMessage(index)"
              @click="recordCoinResult(option.value, index)"
            >
              <span class="block font-semibold text-slate-900">{{ option.label }}</span>
              <span class="mt-1 block text-xs text-slate-500">{{ option.description }}</span>
            </button>
          </div>
        </div>

        <div
          v-else-if="message.type === 'result_card' && isResultPayload(message.payload)"
          class="overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-soft"
        >
          <div class="bg-gradient-to-br from-slate-900 via-slate-950 to-brand-600 p-6">
            <p class="text-xs font-semibold uppercase tracking-[0.28em] text-brand-100">Final Reading</p>
            <div class="mt-4 flex items-start justify-between gap-4">
              <div>
                <h2 class="text-3xl font-bold">{{ message.payload.guaName }}</h2>
                <p class="mt-2 text-sm text-slate-300">问题：{{ message.payload.question }}</p>
              </div>
              <span class="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-950">
                {{ message.payload.fortune }}
              </span>
            </div>
          </div>

          <div class="grid gap-6 p-6 sm:grid-cols-[0.9fr_1.1fr]">
            <div class="flex flex-col-reverse gap-3 rounded-3xl bg-white/8 p-5 ring-1 ring-white/10">
              <div
                v-for="(yao, yaoIndex) in message.payload.yaos"
                :key="`${yao.name}-${yaoIndex}`"
                class="flex items-center gap-3"
              >
                <span class="w-6 text-right text-xs text-slate-500">{{ yaoIndex + 1 }}</span>
                <div class="flex h-7 flex-1 items-center">
                  <div v-if="getYaoSymbol(yao) === 'yang'" class="h-3 w-full rounded-full bg-white" />
                  <div v-else class="flex w-full gap-5">
                    <div class="h-3 flex-1 rounded-full bg-white" />
                    <div class="h-3 flex-1 rounded-full bg-white" />
                  </div>
                </div>
                <span class="h-2.5 w-2.5 rounded-full" :class="yao.isChanging ? 'bg-orange-400' : 'bg-white/15'" />
              </div>
            </div>

            <div class="flex flex-col justify-between gap-5">
              <p class="text-base leading-8 text-slate-100">{{ message.payload.interpretation }}</p>
              <div class="rounded-2xl bg-white/8 px-4 py-3 text-sm text-slate-300 ring-1 ring-white/10">
                动爻以橙色小圆点标记。此结果仅作轻量参考，适合用于整理思路。
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <footer class="mt-4 rounded-3xl bg-white/90 p-3 shadow-soft ring-1 ring-white/80 backdrop-blur">
      <form v-if="store.currentStep === 'ask_question'" class="flex items-center gap-2" @submit.prevent="submitQuestion">
        <input
          v-model="questionInput"
          class="min-w-0 flex-1 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-900 outline-none ring-1 ring-transparent transition placeholder:text-slate-400 focus:bg-white focus:ring-brand-200"
          placeholder="输入你想占卜的问题..."
          type="text"
        />
        <button
          type="submit"
          class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-500/20 transition disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          :disabled="!canSubmitQuestion"
          aria-label="发送问题"
        >
          <ArrowUp :size="20" />
        </button>
      </form>

      <div v-else class="flex min-h-12 items-center justify-center rounded-2xl bg-slate-100 px-4 text-center text-sm text-slate-500">
        {{ store.currentStep === 'finished' ? '本次手动起卦已完成，一事不二占。' : '专注当下，逐次记录硬币结果。' }}
      </div>
    </footer>
  </main>
</template>
