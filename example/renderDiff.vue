<script lang="tsx">
import { defineComponent, PropType } from 'vue'

function tag(operate: string) {
  switch (operate) {
    case 'insert':
      return '+';
    case 'delete':
      return '-';
    case 'move':
      return ' ';
  }
}

export default defineComponent({
  props: {
    data: {
      type: Array as PropType<Record<string, string[]>[]>,
      default: () => [],
    },
  },
  setup(props) {
    return () => {
      return (
        <section class="diff-view">
          {props.data.map(item => {
            const { left, right } = item;
            return (
              <div>
                <span class={left[0]}>{tag(left[0])}{left[1]}</span>
                <span class={right[0]}>{tag(right[0])}{right[1]}</span>
              </div>
            )
          })}
        </section>
      )
    }
  },
})
</script>

<style scoped>
.diff-view > div {
 display: grid;
 grid-template-columns: repeat(2, 1fr);
 height: fit-content;
}
.delete {
  background: #F56C6C
;
  color: #fff;
}
.insert {
  background: #67C23A
;
  color: #fff;
}
.empty {
  display: inline-block;
  background: #d9d9d9;
}
</style>
