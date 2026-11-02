<script setup>
// 预测区间的扇形图：向前 h 步的预测误差方差为 σ² Σ_{j<h} ψ_j²。平稳模型的区间宽度趋于序列本身的标准差，
// 随机游走的区间宽度按 √h 无限增大
import { computed, ref } from 'vue'
import Plot, { linePath } from '../../components/Plot.vue'
import { acf, durbinLevinson, forecastArma, psiWeights } from '../../lib/ts.js'
import lynx from '../../data/lynx.json'

const mode = ref('lynx')
// —— 猞猁：用 1821—1920 年拟合 AR(p)（Yule–Walker），预测 1921—1934 年 ——
const Y = lynx.values.map(Math.log10), NT = 100, HL = Y.length - NT
const order = ref(2)
const train = Y.slice(0, NT), test = Y.slice(NT)
const model = computed(() => {
  const mu = train.reduce((s, v) => s + v, 0) / NT
  const g0 = train.reduce((s, v) => s + (v - mu) ** 2, 0) / NT
  const { phi, v } = durbinLevinson(acf(train, order.value))[order.value - 1]
  return { mu, phi, theta: [], sigma2: g0 * v, resid: Array(NT).fill(0), sd: Math.sqrt(g0) }
})
const fcL = computed(() => forecastArma(train, model.value, HL))
const rmse = computed(() => Math.sqrt(fcL.value.reduce((s, f, i) => s + (test[i] - f.mean) ** 2, 0) / HL))
const covered = computed(() => fcL.value.filter((f, i) => Math.abs(test[i] - f.mean) <= 1.96 * f.se).length)

// —— AR(1) 理论模型：μ = 0，σ = 1，最后一个观测值为 2 ——
const phi = ref(0.8)
const HA = 30, X0 = 2
const fcA = computed(() => {
  const psi = psiWeights([phi.value], [], HA)
  let cum = 0
  return psi.map((p, k) => { cum += p * p; return { mean: X0 * phi.value ** (k + 1), se: Math.sqrt(cum) } })
})
const limit = computed(() => (phi.value < 1 ? 1 / Math.sqrt(1 - phi.value ** 2) : Infinity))

// 画图用：历史部分与预测部分
const shown = computed(() => (mode.value === 'lynx'
  ? { hist: train.slice(-40).map((v, i) => [NT - 40 + i, v]), fc: fcL.value, t0: NT, act: test.map((v, i) => [NT + i, v]) }
  : { hist: [], fc: fcA.value, t0: 1, act: [] }))
const bandPts = (z) => {
  const s = shown.value, up = s.fc.map((f, i) => [s.t0 + i, f.mean + z * f.se]), lo = s.fc.map((f, i) => [s.t0 + i, f.mean - z * f.se]).reverse()
  const start = mode.value === 'lynx' ? [[NT - 1, train.at(-1)]] : [[0, X0]]
  return [...start, ...up, ...lo, ...start]
}
const meanPts = computed(() => [mode.value === 'lynx' ? [NT - 1, train.at(-1)] : [0, X0], ...shown.value.fc.map((f, i) => [shown.value.t0 + i, f.mean])])
const xr = computed(() => (mode.value === 'lynx' ? [NT - 40, Y.length - 1] : [0, HA]))
const yr = computed(() => (mode.value === 'lynx' ? [1.4, 4.4] : [-12, 12]))
const poly = (pts, sx, sy) => pts.map(([a, b]) => `${sx(a)},${sy(Math.max(yr.value[0], Math.min(yr.value[1], b)))}`).join(' ')
const yearFmt = (t) => String(1821 + t)
const f3 = (v) => v.toFixed(3).replace('-', '−')
</script>

<template>
  <div class="lab">
    <header>预测区间：扇形怎样张开</header>
    <div class="body">
      <div class="btns">
        <button class="btn" :class="{ on: mode === 'lynx' }" @click="mode = 'lynx'">猞猁：预测 1921—1934 年</button>
        <button class="btn" :class="{ on: mode === 'ar1' }" @click="mode = 'ar1'">AR(1) 理论模型</button>
        <template v-if="mode === 'lynx'">
          <span style="flex: 1" />
          <button v-for="o in [2, 11]" :key="o" class="btn" :class="{ on: order === o }" @click="order = o">AR({{ o }})</button>
        </template>
      </div>
      <div v-if="mode === 'ar1'" class="controls">
        <label>φ <input v-model.number="phi" type="range" min="0" max="1" step="0.01"><span class="val">{{ phi.toFixed(2) }}</span></label>
      </div>
      <Plot v-slot="{ sx, sy }" :x="xr" :y="yr" :height="270" :xfmt="mode === 'lynx' ? yearFmt : undefined" :xlabel="mode === 'lynx' ? '' : '向前步数 h'">
        <polygon :points="poly(bandPts(1.96), sx, sy)" class="b95" />
        <polygon :points="poly(bandPts(1.2816), sx, sy)" class="b80" />
        <template v-if="mode === 'ar1' && limit < Infinity">
          <line v-for="s in [1, -1]" :key="s" :x1="sx(0)" :x2="sx(HA)" :y1="sy(s * 1.96 * limit)" :y2="sy(s * 1.96 * limit)" class="lim" />
        </template>
        <path :d="linePath(shown.hist, sx, sy)" class="hist" />
        <path :d="linePath(meanPts, sx, sy)" class="fmean" />
        <circle v-for="([t, v], i) in shown.act" :key="i" :cx="sx(t)" :cy="sy(v)" r="3.5" class="act" />
        <circle v-if="mode === 'ar1'" :cx="sx(0)" :cy="sy(X0)" r="4" class="act" />
      </Plot>
      <div class="cap">
        深色：80% 预测区间；浅色：95% 预测区间；<span class="sw fmean" /> 预测值
        <template v-if="mode === 'lynx'">；圆点：1921—1934 年的实际值（拟合时没有用到）</template>
        <template v-else-if="limit < Infinity">；虚线：±1.96 × 序列本身的标准差 σ/√(1−φ²)</template>
      </div>
      <div class="readout">
        <template v-if="mode === 'lynx'">
          AR({{ order }})：φ̂ = {{ model.phi.map(f3).join('，') }}，σ̂ = {{ Math.sqrt(model.sigma2).toFixed(3) }}<br>
          预测标准误：h = 1 时 {{ fcL[0].se.toFixed(3) }}，h = 5 时 {{ fcL[4].se.toFixed(3) }}，h = 14 时 {{ fcL[13].se.toFixed(3) }}；训练期序列的标准差 {{ model.sd.toFixed(3) }}<br>
          检验期 RMSE = <b>{{ rmse.toFixed(3) }}</b>，14 个实际值中有 {{ covered }} 个落在 95% 预测区间内
        </template>
        <template v-else>
          预测值 x̂(h) = 2φ<sup>h</sup> 向均值 0 衰减；标准误 √(1 + φ² + … + φ<sup>2(h−1)</sup>)：h = 1 时 1，h = 10 时 {{ fcA[9].se.toFixed(3) }}，h = 30 时 {{ fcA[29].se.toFixed(3) }}<br>
          <template v-if="limit < Infinity">h → ∞ 时趋于 1/√(1−φ²) = <b>{{ limit.toFixed(3) }}</b>：预测得再远，也不会比“不知道最近的数据、只知道序列的分布”更差</template>
          <b v-else class="bad">φ = 1 是随机游走：标准误为 √h，区间无限张开，冲击的影响永不消失</b>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.b95 { fill: color-mix(in srgb, var(--c-s1) 14%, transparent); }
.b80 { fill: color-mix(in srgb, var(--c-s1) 26%, transparent); }
.lim { stroke: var(--c-s4); stroke-dasharray: 5 4; }
.hist { fill: none; stroke: var(--vp-c-text-2); stroke-width: 1.6; }
.fmean { fill: none; stroke: var(--c-s2); stroke-width: 2.4; }
.act { fill: var(--c-s4); }
.sw { display: inline-block; width: 14px; height: 3px; margin: 0 4px 0 6px; vertical-align: 3px; }
.sw.fmean { background: var(--c-s2); }
</style>
