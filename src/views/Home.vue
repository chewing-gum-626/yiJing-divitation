<script setup lang="ts">
import { CalendarDays, Coins, MessagesSquare } from 'lucide-vue-next';
</script>

<template>
  <main class="mx-auto flex min-h-screen w-full max-w-[var(--app-max-width)] flex-col px-5 py-8">
    <section class="flex flex-1 flex-col justify-center gap-10">
      <header class="space-y-4 text-center">
        <p class="text-sm font-semibold tracking-[0.32em] text-brand-600">YI JING</p>
        <h1 class="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">易经起卦</h1>
        <p class="mx-auto max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
          纯游客模式，轻量、明亮、无广告。每天三次铜钱起卦，一次每日一卦。
        </p>
      </header>

      <div class="grid gap-4 lg:grid-cols-3">
        <RouterLink
          to="/coin"
          class="group rounded-[var(--card-radius)] bg-white/80 p-7 shadow-soft ring-1 ring-white/80 backdrop-blur transition hover:-translate-y-1 hover:bg-white"
        >
          <div class="mb-8 inline-flex rounded-2xl bg-brand-100 p-4 text-brand-600">
            <Coins :size="32" />
          </div>
          <h2 class="mb-3 text-2xl font-bold text-slate-900">铜钱起卦</h2>
          <p class="text-slate-600">系统模拟完整卦象，每日限 3 次。</p>
        </RouterLink>

        <RouterLink
          to="/manual"
          class="group rounded-[var(--card-radius)] bg-white/80 p-7 shadow-soft ring-1 ring-white/80 backdrop-blur transition hover:-translate-y-1 hover:bg-white"
        >
          <div class="mb-8 inline-flex rounded-2xl bg-emerald-100 p-4 text-emerald-600">
            <MessagesSquare :size="32" />
          </div>
          <h2 class="mb-3 text-2xl font-bold text-slate-900">手动起卦</h2>
          <p class="text-slate-600">对话式引导，逐次记录 6 次硬币结果。</p>
        </RouterLink>

        <RouterLink
          to="/daily"
          class="group rounded-[var(--card-radius)] bg-white/80 p-7 shadow-soft ring-1 ring-white/80 backdrop-blur transition hover:-translate-y-1 hover:bg-white"
        >
          <div class="mb-8 inline-flex rounded-2xl bg-orange-100 p-4 text-orange-500">
            <CalendarDays :size="32" />
          </div>
          <h2 class="mb-3 text-2xl font-bold text-slate-900">每日一卦</h2>
          <p class="text-slate-600">每天仅一次，已起卦则直接展示当日结果。</p>
        </RouterLink>
      </div>

      <footer class="rounded-3xl bg-white/60 px-5 py-4 text-center text-sm text-slate-500 ring-1 ring-white/80">
        一事不二占，结果仅作轻量参考。所有记录仅保存在本地设备。
      </footer>
    </section>
  </main>
</template>
