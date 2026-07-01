import { fileURLToPath, URL } from 'node:url';

import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // 排除不必要的目录，防止 EMFILE: too many open files 报错
  server: {
    watch: {
      ignored: ['**/.npm-cache/**', '**/dist/**'],
    },
  },
});
