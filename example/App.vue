<template>
  <div>
    <input ref="leftFileRef" type="file">
    <input ref="rightFileRef" type="file">
    <button @click="handleDiff">比对</button>
    <button @click="handleClear">清除结果</button>
    <render-diff :data="renderData" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { generateMap } from '../tools';
import diff from '../myers';
import renderDiff from './renderDiff.vue';

export default defineComponent({
  components: {
    renderDiff,
  },
  setup() {
    const leftFileRef = ref<HTMLInputElement>();
    const rightFileRef = ref<HTMLInputElement>();
    const renderData = ref();

    async function handleDiff() {
      const leftFiles = leftFileRef.value?.files;
      const rightFiles = rightFileRef.value?.files;
      if (!leftFiles?.length || !rightFiles?.length) {
        return;
      }
      const leftFile = leftFiles[0];
      const rightFile = rightFiles[0];
      const leftText = await leftFile.text();
      const rightText = await rightFile.text();
      // const res = logText(leftText, rightText);

      const leftMap = generateMap(leftText);
      const rightMap = generateMap(rightText);
      const res = diff(leftMap as any, rightMap as any, false);

      const leftOperate: Array<Array<string>> = [];
      const rightOperate: Array<Array<string>> = [];
      let leftIndex = 0;
      let rightIndex = 0;
      res.forEach(item => {
        switch (item) {
          case 'insert':
            rightOperate.push(['insert', [...rightMap.values()][rightIndex++]]);
            leftOperate.push(['empty']);
            break;
          case 'delete':
            leftOperate.push(['delete', [...leftMap.values()][leftIndex++]]);
            rightOperate.push(['empty']);
            break;
          case 'move':
            leftOperate.push(['move', [...leftMap.values()][leftIndex++]]);
            rightOperate.push(['move', [...rightMap.values()][rightIndex++]]);
            break;
        }
      })
      let renderIndex = 0;
      const render = [];
      while(renderIndex < Math.max(leftOperate.length, rightOperate.length)) {
        const left = leftOperate[renderIndex] || ['empty'];
        const right =rightOperate[renderIndex] || ['empty'];
        render.push({ left, right })
        ++renderIndex;
      }
      renderData.value = render;
    }
    function handleClear() {
      renderData.value = [];
    }
    return {
      renderData,
      leftFileRef,
      rightFileRef,
      handleDiff,
      handleClear,
    }
  },
})
</script>
