import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';

export default defineConfig(({ command }) => {
  const alias: Record<string, string> = command === 'serve' ? {} : {
    'vue': 'https://unpkg.com/vue@3.1.5/dist/vue.runtime.esm-browser.prod.js'
  };
  return {
    plugins: [vue(), vueJsx()],
    resolve: {
      alias,
    }
  }
})
