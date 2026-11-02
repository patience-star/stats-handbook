<script setup>
// 两条随机游走。相互独立时，把一条对另一条回归也常常“显著”——伪回归；
// 若 y_t = 2 + 0.8x_t + u_t 且 u_t 平稳（协整），回归残差平稳，回归才有意义。残差的 DF 检验就是 Engle–Granger 协整检验
import { computed, ref } from 'vue'
import Plot, { linePath } from '../../components/Plot.vue'
import { dfStat, noise, ols, simulateArma } from '../../lib/ts.js'

const props = defineProps({ initial: { type: String, default: 'indep' } })
const N = 100, BETA = 0.8, CRIT_T = 1.984, CRIT_EG = -3.398   // t(98) 的 97.5% 分位数；两变量 Engle–Granger 检验 n = 100 时 5% 的临界值
const mode = ref(props.initial)
const e1 = ref(noise(N))
const e2 = ref(noise(N))
function series(m, a, b) {
  const x = simulateArma([1], [], a)
  const y = m === 'indep' ? simulateArma([1], [], b) : simulateArma([0.5], [], b).map((u, t) => 2 + BETA * x[t] + u)
  return { x, y }
}
function regress({ x, y }) {
  const r = ols(x.map((v) => [1, v]), y)
  const my = y.reduce((s, v) => s + v, 0) / N
  const sst = y.reduce((s, v) => s + (v - my) ** 2, 0), sse = r.resid.reduce((s, v) => s + v * v, 0)
  const dw = r.resid.slice(1).reduce((s, v, i) => s + (v - r.resid[i]) ** 2, 0) / sse
  return { ...r, t: r.beta[1] / r.se[1], r2: 1 - sse / sst, dw, eg: dfStat(r.resid, { constant: false }) }
}
const data = computed(() => series(mode.value, e1.value, e2.value))
const fit = computed(() => regress(data.value))
const rate = ref(null)
function repeat() {
  let tRej = 0, egRej = 0
  for (let i = 0; i < 500; i++) {
    const f = regress(series(mode.value, noise(N), noise(N)))
    if (Math.abs(f.t) > CRIT_T) tRej++
    if (f.eg < CRIT_EG) egRej++
  }
  rate.value = { mode: mode.value, t: tRej / 500, eg: egRej / 500 }
}
function setMode(m) {
  mode.value = m
  rate.value = null
}
const range = (arr) => {
  const lo = Math.min(...arr), hi = Math.max(...arr), p = (hi - lo) * 0.06 + 0.5
  return [lo - p, hi + p]
}
const yAll = computed(() => range([...data.value.x, ...data.value.y]))
const xr = computed(() => range(data.value.x))
const yr = computed(() => range(data.value.y))
const er = computed(() => range(fit.value.resid))
const pts = (arr) => arr.map((v, t) => [t, v])
const f2 = (v) => v.toFixed(2).replace('-', '−')
</script>

<template>
  <div class="lab">
    <header>伪回归与协整：两条随机游走</header>
    <div class="body">
      <div class="btns">
        <button class="btn" :class="{ on: mode === 'indep' }" @click="setMode('indep')">相互独立</button>
        <button class="btn" :class="{ on: mode === 'coint' }" @click="setMode('coint')">协整：y = 2 + 0.8x + 平稳误差</button>
        <button class="btn" @click="e1 = noise(N); e2 = noise(N)">重新抽样</button>
        <button class="btn" @click="repeat">模拟 500 次</button>
      </div>
      <Plot v-slot="{ sx, sy }" :x="[0, N - 1]" :y="yAll" :height="200" xlabel="t">
        <path :d="linePath(pts(data.x), sx, sy)" class="sx" />
        <path :d="linePath(pts(data.y), sx, sy)" class="sy" />
      </Plot>
      <div class="cap"><span class="sw sx" /> x<sub>t</sub>　<span class="sw sy" /> y<sub>t</sub></div>
      <div class="grid2">
        <div class="panel">
          <Plot v-slot="{ sx, sy }" :x="xr" :y="yr" :height="200" xlabel="x" ylabel="y">
            <circle v-for="(v, i) in data.x" :key="i" :cx="sx(v)" :cy="sy(data.y[i])" r="2.6" class="dot" />
            <line :x1="sx(xr[0])" :y1="sy(fit.beta[0] + fit.beta[1] * xr[0])" :x2="sx(xr[1])" :y2="sy(fit.beta[0] + fit.beta[1] * xr[1])" class="fitl" />
          </Plot>
          <div class="cap">散点与回归直线 y = {{ f2(fit.beta[0]) }} + {{ f2(fit.beta[1]) }}x</div>
        </div>
        <div class="panel">
          <Plot v-slot="{ sx, sy }" :x="[0, N - 1]" :y="er" :height="200" xlabel="t">
            <line :x1="sx(0)" :x2="sx(N - 1)" :y1="sy(0)" :y2="sy(0)" class="zero" />
            <path :d="linePath(pts(fit.resid), sx, sy)" class="res" />
          </Plot>
          <div class="cap">回归残差：{{ mode === 'indep' ? '像随机游走一样长期偏离 0' : '围绕 0 来回波动' }}</div>
        </div>
      </div>
      <div class="readout">
        斜率的 t 统计量 = <b>{{ f2(fit.t) }}</b>（|t| > 1.98 即“显著”），R² = {{ fit.r2.toFixed(3) }}，DW = {{ fit.dw.toFixed(3) }}
        <span v-if="fit.r2 > fit.dw" class="bad">——R² > DW，伪回归的危险信号</span><br>
        残差的 DF 统计量（Engle–Granger 检验）= <b>{{ f2(fit.eg) }}</b>，5% 临界值 −3.398
        <span v-if="fit.eg < CRIT_EG" class="good">——拒绝“无协整”</span><span v-else class="bad">——不能拒绝“无协整”</span>
        <template v-if="rate"><br>
          {{ rate.mode === 'indep' ? '两条独立随机游走' : '协整的两条序列' }}模拟 500 次：t 检验判为显著的比例 <b>{{ (rate.t * 100).toFixed(1) }}%</b>{{ rate.mode === 'indep' ? '（名义上应为 5%）' : '' }}；Engle–Granger 检验判为协整的比例 <b>{{ (rate.eg * 100).toFixed(1) }}%</b>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sx { fill: none; stroke: var(--c-s1); stroke-width: 1.6; }
.sy { fill: none; stroke: var(--c-s2); stroke-width: 1.6; }
.dot { fill: var(--c-s5); fill-opacity: 0.55; }
.fitl { stroke: var(--c-s4); stroke-width: 2; }
.zero { stroke: var(--vp-c-text-3); stroke-dasharray: 4 3; }
.res { fill: none; stroke: var(--c-s3); stroke-width: 1.5; }
.sw { display: inline-block; width: 14px; height: 3px; margin: 0 4px 0 6px; vertical-align: 3px; }
.sw.sx { background: var(--c-s1); }
.sw.sy { background: var(--c-s2); }
</style>
