<script setup lang="ts">
import { computed } from 'vue';

import statusBadIcon from '@/assets/images/xiong.png';
import statusGoodIcon from '@/assets/images/ji.png';
import statusNeutralIcon from '@/assets/images/ping.png';
import { resolveGuaResult } from '@/services/guaService';
import { useAIStore, type AIGuaStatus } from '@/stores/aiStore';
import { useGuaStore } from '@/stores/guaStore';
import type { GuaOutcome } from '@/types/gua';

const aiStore = useAIStore();
const guaStore = useGuaStore();

const result = computed(() => (guaStore.currentResult ? resolveGuaResult(guaStore.currentResult) : null));

// 基础卦象吉凶来自本地静态文案，用于 AI 尚未返回状态时提供稳定的结果兜底。
const outcomeMeta: Record<GuaOutcome, { label: string; className: string }> = {
  good: {
    label: '吉',
    className: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  },
  neutral: {
    label: '平',
    className: 'bg-amber-50 text-amber-600 ring-amber-100',
  },
  bad: {
    label: '凶',
    className: 'bg-rose-50 text-rose-600 ring-rose-100',
  },
};

// AI 状态用于控制徽章、解读卡片底色和正文中的状态图标；吉/平/凶分别对应正向、观望、谨慎三种视觉语义。
const aiStatusMeta: Record<AIGuaStatus, { className: string; glowClassName: string; icon: string }> = {
  吉: {
    className: 'bg-emerald-500 text-white shadow-emerald-500/25',
    glowClassName: 'from-emerald-100 via-white to-brand-50',
    icon: statusGoodIcon,
  },
  平: {
    className: 'bg-amber-500 text-white shadow-amber-500/25',
    glowClassName: 'from-amber-100 via-white to-orange-50',
    icon: statusNeutralIcon,
  },
  凶: {
    className: 'bg-rose-500 text-white shadow-rose-500/25',
    glowClassName: 'from-rose-100 via-white to-orange-50',
    icon: statusBadIcon,
  },
};

// DeepSeek 首个 chunk 可能还没带回 [STATUS:*]，此时临时按“平”渲染，避免模板访问空 key。
const currentAIStatus = computed<AIGuaStatus>(() => aiStore.guaStatus || '平');
  console.log(aiStore);

// 后端流式内容会把 [STATUS:吉/平/凶] 拼在正文前，页面展示时移除原始标记，改由状态图标与文字承载结果。
const cleanAIResult = computed(() => aiStore.aiResult.replace(/^\s*\[STATUS:(吉|平|凶)\]\s*/u, ''));
</script>

<template>
  <main class="mx-auto min-h-screen w-full max-w-[var(--app-max-width)] px-5 py-8">
    <RouterLink to="/" class="text-sm font-medium text-brand-600">返回首页</RouterLink>

    <div
      v-if="aiStore.errorMessage"
      class="mt-5 rounded-3xl bg-orange-50 px-4 py-3 text-sm font-medium text-orange-700 shadow-sm ring-1 ring-orange-100"
    >
      {{ aiStore.errorMessage }}
    </div>

    <section class="mt-8 rounded-[var(--card-radius)] bg-white/80 p-6 shadow-soft ring-1 ring-white/80">
      <template v-if="result">
        <p class="mb-2 text-sm font-semibold text-brand-600">卦象结果</p>
        <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 class="text-3xl font-bold text-slate-900">{{ result.name }}</h1>
            <p class="mt-2 text-sm text-slate-500">{{ result.lowerTrigram }}下 {{ result.upperTrigram }}上</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <span class="w-fit rounded-full px-4 py-2 text-sm font-bold ring-1" :class="outcomeMeta[result.outcome].className">
              基础：{{ outcomeMeta[result.outcome].label }}
            </span>
            <span class="w-fit rounded-full px-4 py-2 text-sm font-bold shadow-lg" :class="aiStatusMeta[currentAIStatus].className">
              AI：{{ aiStore.guaStatus || '解读中' }}
            </span>
          </div>
        </div>

        <div class="mb-6 flex min-h-64 flex-col-reverse justify-center gap-4 rounded-3xl bg-gradient-to-b from-slate-50 to-white p-5 ring-1 ring-slate-100">
          <div v-for="(line, index) in result.lines" :key="index" class="flex items-center justify-center gap-4">
            <span class="w-8 text-right text-xs font-semibold text-slate-400">{{ index + 1 }}</span>
            <div class="flex h-8 w-52 items-center justify-center sm:w-72">
              <div
                v-if="line.kind === 'yang'"
                class="h-3 w-full rounded-full shadow-sm"
                :class="line.moving ? 'bg-orange-500 shadow-orange-200' : 'bg-slate-800 shadow-slate-200'"
              />
              <div v-else class="flex w-full items-center justify-between gap-8">
                <div
                  class="h-3 flex-1 rounded-full shadow-sm"
                  :class="line.moving ? 'bg-orange-500 shadow-orange-200' : 'bg-slate-800 shadow-slate-200'"
                />
                <div
                  class="h-3 flex-1 rounded-full shadow-sm"
                  :class="line.moving ? 'bg-orange-500 shadow-orange-200' : 'bg-slate-800 shadow-slate-200'"
                />
              </div>
            </div>
            <span class="w-8 text-sm font-medium" :class="line.moving ? 'text-orange-500' : 'text-slate-300'">
              {{ line.moving ? '动' : '' }}
            </span>
          </div>
        </div>

        <div class="mb-5 rounded-3xl bg-brand-50/70 p-5 text-left ring-1 ring-brand-100/80">
          <p class="mb-2 text-sm font-semibold text-brand-600">基础白话解读</p>
          <p class="leading-8 text-slate-700">{{ result.interpretation }}</p>
        </div>

        <div class="rounded-3xl bg-gradient-to-br p-5 text-left ring-1 ring-white/90" :class="aiStatusMeta[currentAIStatus].glowClassName">
          <div class="mb-3 flex items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <p class="text-sm font-semibold text-slate-700">AI 动态解卦</p>
              <span
                v-if="aiStore.guaStatus"
                class="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-white"
              >
                <img :src="aiStatusMeta[currentAIStatus].icon" :alt="`${currentAIStatus}卦图标`" class="h-4 w-4" />
                {{ currentAIStatus }}
              </span>
            </div>
            <span v-if="aiStore.isStreaming" class="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-brand-600 ring-1 ring-white">
              正在生成中...
            </span>
          </div>
          <p class="min-h-32 whitespace-pre-wrap leading-8 text-slate-700">
            {{ cleanAIResult || 'AI 正在结合本卦、变卦和你的问题生成专属解读...' }}
            <span v-if="aiStore.isStreaming" class="ml-1 inline-block h-4 w-2 animate-pulse rounded-sm bg-brand-500 align-middle" />
          </p>
        </div>
      </template>

      <template v-else>
        <div class="text-center">
          <p class="mb-2 text-sm font-semibold text-brand-600">结果页</p>
          <h1 class="mb-4 text-3xl font-bold text-slate-900">暂无卦象结果</h1>
          <p class="text-slate-600">请先返回首页，选择铜钱起卦或每日一卦。</p>
        </div>
      </template>
    </section>
  </main>
</template>
