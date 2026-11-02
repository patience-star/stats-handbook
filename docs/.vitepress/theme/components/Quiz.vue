<script setup>
// 练习题。由 Markdown 的 ::: quiz 容器生成：
//   选择题：列表项带 data-opt（1 为正确项），点选即判分
//   数值题：answer = "答案 [容差]"，容差缺省为答案的 1%；可输入分数，如 2/5
// 引用块是解析，作答后才显示。结果按“页面路径#序号”存进 localStorage。
import { onMounted, ref } from 'vue'

const props = defineProps({ answer: String })
const root = ref()
const state = ref('')   // '' | 'right' | 'wrong'
const input = ref('')
const last = ref(null)
let key = ''

onMounted(() => {
  key = `stat-quiz:${location.pathname}#${[...document.querySelectorAll('.vp-doc .quiz')].indexOf(root.value)}`
  try { last.value = localStorage.getItem(key) } catch {}
})

function save(ok) {
  state.value = ok ? 'right' : 'wrong'
  try { localStorage.setItem(key, ok ? '1' : '0') } catch {}
}

function pick(e) {
  const li = e.target.closest('li[data-opt]')
  if (!li || state.value || props.answer) return
  li.classList.add('picked')
  save(li.dataset.opt === '1')
}

const parse = (s) => {
  const m = s.trim().match(/^(-?[\d.]+)\s*\/\s*([\d.]+)$/)
  return m ? m[1] / m[2] : Number(s.trim())
}
function check() {
  const v = parse(input.value)
  if (input.value.trim() === '' || Number.isNaN(v)) return
  const [a, tol] = props.answer.split(/\s+/).map(Number)
  save(Math.abs(v - a) <= (tol ?? (Math.abs(a) * 0.01 || 1e-9)))
}

function reset() {
  state.value = ''
  input.value = ''
  root.value.querySelectorAll('li.picked').forEach((li) => li.classList.remove('picked'))
}
</script>

<template>
  <div ref="root" class="quiz" :class="state" @click="pick">
    <div class="quiz-head">
      <span class="chip">小测</span>
      <span v-if="last && !state" class="quiz-last">{{ last === '1' ? '上次答对了' : '上次答错了，再试一次' }}</span>
    </div>
    <slot />
    <div v-if="answer" class="quiz-input">
      <input v-model="input" :disabled="!!state" placeholder="输入答案（可写分数，如 2/5）" @keydown.enter="check">
      <button :disabled="!!state" @click.stop="check">提交</button>
    </div>
    <div v-if="state" class="quiz-result">
      <span>{{ state === 'right' ? '✓ 回答正确' : '✗ 不对，看看解析' }}</span>
      <button @click.stop="reset">重做</button>
    </div>
  </div>
</template>
