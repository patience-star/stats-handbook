<script setup>
// 似然函数：对数似然曲线的最高点是最大似然估计，峰的“尖锐程度”（曲率）是信息量。
// 曲线比峰顶低 1.92 的范围是似然比置信区间；用抛物线近似峰顶，得到 θ̂ ± 1.96/√(观测信息)
import { computed, ref, watch } from 'vue'
import jStat from 'jstat'
import Plot, { linePath } from '../../components/Plot.vue'

const M = {
  bern: { name: '两点分布 b(1, p)', th: 'p', lo: 0.001, hi: 0.999, init: 0.3, draw: (p) => (Math.random() < p ? 1 : 0),
    ll: (p, x, s) => s * Math.log(p) + (x.length - s) * Math.log(1 - p), mle: (x, s) => s / x.length, info: (p) => 1 / (p * (1 - p)) },
  pois: { name: '泊松 P(λ)', th: 'λ', lo: 0.05, hi: 12, init: 3, draw: (l) => jStat.poisson.sample(l),
    ll: (l, x, s) => s * Math.log(l) - x.length * l, mle: (x, s) => s / x.length, info: (l) => 1 / l },
  norm: { name: '正态 N(μ, 1)', th: 'μ', lo: -3, hi: 3, init: 0.5, draw: (m) => jStat.normal.sample(m, 1),
    ll: (m, x) => -x.reduce((a, v) => a + (v - m) ** 2, 0) / 2, mle: (x, s) => s / x.length, info: () => 1 },
  unif: { name: '均匀 U(0, θ)', th: 'θ', lo: 0.05, hi: 3, init: 1, draw: (t) => t * Math.random(),
    ll: (t, x) => (t < Math.max(...x) ? -Infinity : -x.length * Math.log(t)), mle: (x) => Math.max(...x), info: null },
}
const key = ref('bern')
const truth = ref(0.3)
const n = ref(20)
const data = ref([])
const m = computed(() => M[key.value])
const resample = () => { data.value = Array.from({ length: n.value }, () => m.value.draw(truth.value)) }
watch(key, () => { truth.value = M[key.value].init })
watch([key, truth, n], resample, { immediate: true })

const sum = computed(() => data.value.reduce((a, v) => a + v, 0))
const mle = computed(() => Math.min(m.value.hi, Math.max(m.value.lo, m.value.mle(data.value, sum.value))))
const llMax = computed(() => m.value.ll(mle.value, data.value, sum.value))
const rel = (t) => m.value.ll(t, data.value, sum.value) - llMax.value
const se = computed(() => (m.value.info ? 1 / Math.sqrt(data.value.length * m.value.info(mle.value)) : null))
// 显示范围：MLE 附近 ±5 个标准误（均匀分布另取）
const xr = computed(() => {
  if (!se.value || !Number.isFinite(se.value)) return [m.value.lo, Math.min(m.value.hi, mle.value * 2 + 0.2)]
  return [Math.max(m.value.lo, mle.value - 5 * se.value), Math.min(m.value.hi, mle.value + 5 * se.value)]
})
const grid = computed(() => Array.from({ length: 301 }, (_, i) => xr.value[0] + ((xr.value[1] - xr.value[0]) * i) / 300))
const curve = computed(() => grid.value.map((t) => [t, Math.max(-7, rel(t))]).filter(([, y]) => Number.isFinite(y)))
const parab = computed(() => (se.value ? grid.value.map((t) => [t, Math.max(-7, -((t - mle.value) ** 2) / (2 * se.value ** 2))]) : []))
// 似然比区间：rel(θ) ≥ −1.92
const lrci = computed(() => { const inside = grid.value.filter((t) => rel(t) >= -1.92); return inside.length ? [inside[0], inside[inside.length - 1]] : null })
const f = (v) => v.toFixed(3)
</script>

<template>
  <div class="lab">
    <header>似然函数：峰顶、曲率与置信区间</header>
    <div class="body">
      <div class="controls">
        <label>模型
          <select v-model="key"><option v-for="(v, k) in M" :key="k" :value="k">{{ v.name }}</option></select>
        </label>
        <label>真实 {{ m.th }} <input v-model.number="truth" type="range" :min="key === 'bern' ? 0.05 : key === 'pois' ? 0.5 : key === 'norm' ? -2 : 0.2" :max="key === 'bern' ? 0.95 : key === 'pois' ? 8 : key === 'norm' ? 2 : 2" step="0.05"><span class="val">{{ truth.toFixed(2) }}</span></label>
        <label>样本量 n <input v-model.number="n" type="range" min="2" max="200" step="1"><span class="val">{{ n }}</span></label>
      </div>
      <div class="btns"><button class="btn" @click="resample">重新抽一组样本</button></div>
      <Plot v-slot="{ sx, sy }" :x="xr" :y="[-7, 0.6]" :height="260" :yticks="[-6, -4, -1.92, 0]" :yfmt="(v) => (v === -1.92 ? '−1.92' : String(v).replace('-', '−'))">
        <rect v-if="lrci" :x="sx(lrci[0])" :y="sy(0.6)" :width="sx(lrci[1]) - sx(lrci[0])" :height="sy(-7) - sy(0.6)" class="ci" />
        <line :x1="sx(xr[0])" :x2="sx(xr[1])" :y1="sy(-1.92)" :y2="sy(-1.92)" class="cut" />
        <path v-if="parab.length" :d="linePath(parab, sx, sy)" class="parab" />
        <path :d="linePath(curve, sx, sy)" class="ll" />
        <line :x1="sx(mle)" :x2="sx(mle)" :y1="sy(-7)" :y2="sy(0)" class="mle" />
        <line :x1="sx(truth)" :x2="sx(truth)" :y1="sy(-7)" :y2="sy(0.6)" class="true" />
      </Plot>
      <div class="cap">
        <span class="sw ll" /> 对数似然 ℓ(θ) − ℓ(θ̂)　<span class="sw parab" /> 峰顶的抛物线近似　<span class="sw mle" /> θ̂　<span class="sw true" /> 真值　阴影：ℓ 比峰顶低不超过 1.92 的范围
      </div>
      <div class="readout">
        最大似然估计 {{ m.th }}̂ = <b>{{ f(mle) }}</b>（真值 {{ truth.toFixed(2) }}）。
        <template v-if="se">
          观测信息 nI(θ̂) = {{ f(1 / se ** 2) }}，标准误 1/√(nI) = <b>{{ f(se) }}</b>；
          近似 95% 区间 θ̂ ± 1.96·标准误 = [{{ f(mle - 1.96 * se) }}, {{ f(mle + 1.96 * se) }}]。
        </template>
        <template v-if="lrci"><br>似然比区间（阴影）= [{{ f(lrci[0]) }}, {{ f(lrci[1]) }}]。</template>
        <template v-if="key === 'unif'"><br><span class="bad">均匀分布的似然函数在 θ = 最大观测值处有一个“悬崖”：最大值出现在边界上，导数不为 0，也谈不上曲率。</span></template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ll { fill: none; stroke: var(--c-s1); stroke-width: 2.4; }
.parab { fill: none; stroke: var(--c-s2); stroke-width: 1.8; stroke-dasharray: 6 4; }
.mle { stroke: var(--c-s1); stroke-dasharray: 3 3; }
.true { stroke: var(--c-s4); stroke-width: 2; }
.cut { stroke: var(--vp-c-text-3); stroke-dasharray: 2 3; }
.ci { fill: color-mix(in srgb, var(--c-s3) 14%, transparent); }
.sw { display: inline-block; width: 14px; height: 3px; margin: 0 4px 0 8px; vertical-align: 3px; }
.sw.ll { background: var(--c-s1); }
.sw.parab { background: var(--c-s2); }
.sw.mle { background: var(--c-s1); opacity: 0.6; }
.sw.true { background: var(--c-s4); }
</style>
