<script setup>
// 生日问题：n 个人中至少两人同一天生日的概率 1 − 365·364·…·(365−n+1)/365ⁿ，以及“模拟一个班”
import { computed, ref } from 'vue'
import Plot, { linePath } from '../../components/Plot.vue'

const n = ref(23)
const exact = (m) => { let q = 1; for (let i = 0; i < m; i++) q *= (365 - i) / 365; return 1 - q }
const approx = (m) => 1 - Math.exp(-(m * (m - 1)) / (2 * 365))
const curve = Array.from({ length: 81 }, (_, m) => [m, exact(m)])
const curveApprox = Array.from({ length: 81 }, (_, m) => [m, approx(m)])

const cls = ref(null)   // 模拟的一个班：{ days, dup }
const tally = ref({ runs: 0, hits: 0 })
function simulate(times = 1) {
  for (let t = 0; t < times; t++) {
    const days = Array.from({ length: n.value }, () => Math.floor(Math.random() * 365))
    const seen = new Map()
    let dup = null
    days.forEach((d, i) => { if (seen.has(d) && dup === null) dup = d; seen.set(d, i) })
    tally.value = { runs: tally.value.runs + 1, hits: tally.value.hits + (dup !== null) }
    cls.value = { days, dup }
  }
}
const resetTally = () => { tally.value = { runs: 0, hits: 0 }; cls.value = null }
const dayName = (d) => { const dt = new Date(2025, 0, 1 + d); return `${dt.getMonth() + 1} 月 ${dt.getDate()} 日` }
const pct = (v) => (v * 100).toFixed(1) + '%'
const p = computed(() => exact(n.value))
</script>

<template>
  <div class="lab">
    <header>生日问题</header>
    <div class="body">
      <div class="controls">
        <label>人数 n <input v-model.number="n" type="range" min="2" max="80" step="1" @input="resetTally"><span class="val">{{ n }}</span></label>
      </div>
      <Plot v-slot="{ sx, sy }" :x="[0, 80]" :y="[0, 1]" :height="230" :yticks="[0, 0.25, 0.5, 0.75, 1]">
        <line :x1="sx(0)" :x2="sx(80)" :y1="sy(0.5)" :y2="sy(0.5)" class="half" />
        <path :d="linePath(curveApprox, sx, sy)" class="approx" />
        <path :d="linePath(curve, sx, sy)" class="c1" fill="none" stroke="currentColor" stroke-width="2.2" />
        <line :x1="sx(n)" :x2="sx(n)" :y1="sy(0)" :y2="sy(p)" class="cursor" />
        <circle :cx="sx(n)" :cy="sy(p)" r="5" class="c4" fill="currentColor" />
      </Plot>
      <div class="cap">蓝色实线：精确值；橙色虚线：近似 1 − exp(−n(n−1)/730)</div>
      <div class="btns">
        <button class="btn" @click="simulate(1)">模拟一个 {{ n }} 人的班</button>
        <button class="btn" @click="simulate(1000)">模拟 1000 个班</button>
      </div>
      <div class="readout">
        n = {{ n }} 时，至少两人同一天生日的概率为 <b>{{ pct(p) }}</b>。
        <template v-if="cls">
          <br>最近一个班：{{ cls.dup === null ? '没有人同一天生日' : `有人同在 ${dayName(cls.dup)} 生日` }}；
          累计模拟 {{ tally.runs }} 个班，其中 {{ tally.hits }} 个有人同天生日，频率 <b>{{ pct(tally.hits / tally.runs) }}</b>。
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.half { stroke: var(--vp-c-text-3); stroke-dasharray: 4 4; }
.approx { fill: none; stroke: var(--c-s2); stroke-width: 1.5; stroke-dasharray: 6 4; }
.cursor { stroke: var(--c-s4); stroke-dasharray: 3 3; }
</style>
