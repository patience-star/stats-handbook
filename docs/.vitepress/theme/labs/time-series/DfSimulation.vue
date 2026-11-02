<script setup>
// 单位根原假设（随机游走）下，回归 Δy_t = α + ρ y_{t−1} + ε_t 中 ρ 的 t 统计量的分布。
// 它不是 t 分布（近似标准正态），而是明显偏左的 Dickey–Fuller 分布
import { computed, ref, watch } from 'vue'
import jStat from 'jstat'
import Plot, { linePath } from '../../components/Plot.vue'
import { dfStat, noise, simulateArma } from '../../lib/ts.js'

const n = ref(100)
const sims = ref([])
const BATCH = 1000
function run() {
  const out = []
  for (let i = 0; i < BATCH; i++) out.push(dfStat(simulateArma([1], [], noise(n.value))))
  sims.value = [...sims.value, ...out]
}
watch(n, () => { sims.value = []; run() }, { immediate: true })

const LO = -5, HI = 3, W = 0.2
const hist = computed(() => {
  const c = Array(Math.round((HI - LO) / W)).fill(0)
  for (const t of sims.value) { const i = Math.floor((t - LO) / W); if (i >= 0 && i < c.length) c[i]++ }
  return c.map((v, i) => [LO + i * W, v / (sims.value.length * W)])
})
const normal = Array.from({ length: 161 }, (_, i) => { const x = LO + i * 0.05; return [x, jStat.normal.pdf(x, 0, 1)] })
const sorted = computed(() => [...sims.value].sort((a, b) => a - b))
const q = (p) => sorted.value[Math.floor(p * (sorted.value.length - 1))]
const m = (v) => v.toFixed(2).replace("-", "−")
const size = computed(() => sims.value.filter((t) => t < -1.645).length / sims.value.length)
const ymax = computed(() => Math.max(0.45, ...hist.value.map(([, d]) => d)) * 1.08)
</script>

<template>
  <div class="lab">
    <header>Dickey–Fuller 分布：单位根下的 t 统计量</header>
    <div class="body">
      <div class="btns">
        <button v-for="v in [25, 50, 100, 250]" :key="v" class="btn" :class="{ on: n === v }" @click="n = v">n = {{ v }}</button>
        <button class="btn" @click="run">再模拟 {{ BATCH }} 次</button>
      </div>
      <Plot v-slot="{ sx, sy }" :x="[LO, HI]" :y="[0, ymax]" :height="250" xlabel="t 统计量">
        <rect v-for="([x0, d], i) in hist" :key="i" :x="sx(x0)" :y="sy(d)" :width="sx(x0 + W) - sx(x0) - 1" :height="sy(0) - sy(d)" :class="x0 + W <= q(0.05) + 1e-9 ? 'hbar tail' : 'hbar'" />
        <path :d="linePath(normal, sx, sy)" class="norm" />
        <line :x1="sx(-1.645)" :x2="sx(-1.645)" :y1="sy(0)" :y2="sy(ymax)" class="cn" />
        <line :x1="sx(q(0.05))" :x2="sx(q(0.05))" :y1="sy(0)" :y2="sy(ymax)" class="cd" />
      </Plot>
      <div class="cap">
        柱：{{ sims.length }} 条长度为 {{ n }} 的随机游走算出的 t 统计量；<span class="sw norm" /> 标准正态密度；
        <span class="sw cn" /> 正态分布的 5% 临界值 −1.645；<span class="sw cd" /> 模拟分布的 5% 分位数
      </div>
      <div class="readout">
        模拟分布的分位数：1% {{ m(q(0.01)) }}，5% <b>{{ m(q(0.05)) }}</b>，10% {{ m(q(0.1)) }}（渐近值 −3.43，−2.86，−2.57）<br>
        若误用正态临界值 −1.645，原假设成立时的拒绝概率是 <b class="bad">{{ (size * 100).toFixed(1) }}%</b>，而不是名义上的 5%
      </div>
    </div>
  </div>
</template>

<style scoped>
.hbar { fill: color-mix(in srgb, var(--c-s1) 40%, transparent); }
.hbar.tail { fill: color-mix(in srgb, var(--c-s4) 55%, transparent); }
.norm { fill: none; stroke: var(--vp-c-text-2); stroke-width: 2; }
.cn { stroke: var(--vp-c-text-2); stroke-dasharray: 4 3; }
.cd { stroke: var(--c-s4); stroke-width: 2; }
.sw { display: inline-block; width: 14px; height: 3px; margin: 0 4px 0 6px; vertical-align: 3px; }
.sw.norm { background: var(--vp-c-text-2); }
.sw.cn { background: var(--vp-c-text-2); }
.sw.cd { background: var(--c-s4); }
</style>
