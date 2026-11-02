<script setup>
// 由标准正态随机数“搭”出三大抽样分布：χ² = 平方和；t = Z/√(χ²/n)；F = (χ²₁/m)/(χ²₂/n)
import { computed, ref, watch } from 'vue'
import jStat from 'jstat'
import Plot, { linePath } from '../../components/Plot.vue'

const mode = ref('chi2')
const k = ref(4)
const m = ref(5)
const R = 6000
const z = () => jStat.normal.sample(0, 1)
const chi = (d) => { let s = 0; for (let i = 0; i < d; i++) s += z() ** 2; return s }
const samples = ref([])
function run() {
  samples.value = Array.from({ length: R }, () =>
    mode.value === 'chi2' ? chi(k.value) : mode.value === 't' ? z() / Math.sqrt(chi(k.value) / k.value) : (chi(m.value) / m.value) / (chi(k.value) / k.value))
}
watch([mode, k, m], run, { immediate: true })

const xr = computed(() => (mode.value === 'chi2' ? [0, k.value + 5 * Math.sqrt(2 * k.value) + 2] : mode.value === 't' ? [-5, 5] : [0, 5]))
const dens = (x) => (mode.value === 'chi2' ? jStat.chisquare.pdf(x, k.value) : mode.value === 't' ? jStat.studentt.pdf(x, k.value) : jStat.centralF.pdf(x, m.value, k.value))
const curve = computed(() => Array.from({ length: 241 }, (_, i) => { const x = xr.value[0] + ((xr.value[1] - xr.value[0]) * (i + 0.5)) / 241; return [x, dens(x)] }))
const normal = computed(() => (mode.value === 't' ? curve.value.map(([x]) => [x, jStat.normal.pdf(x, 0, 1)]) : []))
const bins = computed(() => {
  const [a, b] = xr.value, B = 50, w = (b - a) / B, c = Array(B).fill(0)
  for (const v of samples.value) { const i = Math.floor((v - a) / w); if (i >= 0 && i < B) c[i]++ }
  return c.map((v, i) => ({ x0: a + i * w, x1: a + (i + 1) * w, h: v / (R * w) }))
})
const ymax = computed(() => Math.min(Math.max(...bins.value.map((b) => b.h), ...curve.value.map((p) => p[1]).filter(Number.isFinite)) * 1.12, 2))
const sm = computed(() => jStat.mean(samples.value))
const sv = computed(() => jStat.variance(samples.value, true))
const theory = computed(() => {
  if (mode.value === 'chi2') return [k.value, 2 * k.value]
  if (mode.value === 't') return [k.value > 1 ? 0 : NaN, k.value > 2 ? k.value / (k.value - 2) : NaN]
  const n = k.value
  return [n > 2 ? n / (n - 2) : NaN, n > 4 ? (2 * n * n * (m.value + n - 2)) / (m.value * (n - 2) ** 2 * (n - 4)) : NaN]
})
const fmt = (v) => (Number.isFinite(v) ? v.toFixed(3) : '不存在')
</script>

<template>
  <div class="lab">
    <header>用标准正态随机数搭出 χ²、t、F 分布</header>
    <div class="body">
      <div class="btns">
        <button class="btn" :class="{ on: mode === 'chi2' }" @click="mode = 'chi2'">χ²(n) = Z₁² + … + Zₙ²</button>
        <button class="btn" :class="{ on: mode === 't' }" @click="mode = 't'">t(n) = Z / √(χ²(n)/n)</button>
        <button class="btn" :class="{ on: mode === 'f' }" @click="mode = 'f'">F(m, n) = (χ²(m)/m) / (χ²(n)/n)</button>
        <button class="btn" @click="run">重新抽样</button>
      </div>
      <div class="controls">
        <label v-if="mode === 'f'">分子自由度 m <input v-model.number="m" type="range" min="1" max="40" step="1"><span class="val">{{ m }}</span></label>
        <label>{{ mode === 'f' ? '分母自由度 n' : '自由度 n' }} <input v-model.number="k" type="range" min="1" max="40" step="1"><span class="val">{{ k }}</span></label>
      </div>
      <Plot v-slot="{ sx, sy }" :x="xr" :y="[0, ymax]" :height="250">
        <rect v-for="(b, i) in bins" :key="i" :x="sx(b.x0)" :y="sy(Math.min(b.h, ymax))" :width="Math.max(0, sx(b.x1) - sx(b.x0) - 1)" :height="sy(0) - sy(Math.min(b.h, ymax))" class="bar" />
        <path v-if="normal.length" :d="linePath(normal, sx, sy)" class="normal" />
        <path :d="linePath(curve.map(([x, y]) => [x, Math.min(y, ymax)]), sx, sy)" class="curve" />
      </Plot>
      <div class="cap">直方图：{{ R }} 次模拟；曲线：理论密度<template v-if="mode === 't'">；虚线：标准正态</template></div>
      <div class="readout">
        模拟值的均值 <b>{{ fmt(sm) }}</b>（理论 {{ fmt(theory[0]) }}），方差 <b>{{ fmt(sv) }}</b>（理论 {{ fmt(theory[1]) }}）。
        <template v-if="mode === 't' && k <= 2">自由度很小时 t 分布的尾巴极厚，方差不存在，模拟出的方差会很不稳定。</template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bar { fill: color-mix(in srgb, var(--c-s1) 45%, transparent); }
.curve { fill: none; stroke: var(--c-s2); stroke-width: 2.2; }
.normal { fill: none; stroke: var(--vp-c-text-3); stroke-width: 1.6; stroke-dasharray: 5 4; }
</style>
