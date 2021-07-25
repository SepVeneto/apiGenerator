import { defineConfig } from 'vite';
import path from 'path';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';

export default defineConfig(({ command }) => {
  const config = command === 'serve' ? {} : {
    resolve: {
      alias: {
        'vue': 'https://unpkg.com/vue@3.1.5/dist/vue.runtime.esm-browser.prod.js'
      }
    }
  };
  return {
    plugins: [vue(), vueJsx()],
    base: '/apiGenerator/',
    build: {
      outDir: path.resolve('..', __dirname, 'gh-pages'),
    },
    ...config,
  }
})
