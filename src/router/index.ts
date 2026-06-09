import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/Home.vue'),
    },
    {
      path: '/coin',
      name: 'coin-divination',
      component: () => import('@/views/CoinDivination.vue'),
    },
    {
      path: '/manual',
      name: 'manual-divination',
      component: () => import('@/views/ManualDivination.vue'),
    },
    {
      path: '/daily',
      name: 'daily-gua',
      component: () => import('@/views/DailyGua.vue'),
    },
    {
      path: '/result',
      name: 'result',
      component: () => import('@/views/Result.vue'),
    },
  ],
});

export default router;
