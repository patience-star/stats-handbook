<script setup>
// 密度与分布函数联动：上图区间 (a, b] 下的面积 = 下图 F(b) − F(a)；切比雪夫模式对比真实尾部概率与上界 1/k²
import { computed, ref, watch } from 'vue'
import jStat from 'jstat'
import Plot, { linePath } from '../../components/Plot.vue'

const N = jStat.normal
const mixPdf = (x) => 0.5 * N.pdf(x, -1.5, 0.6) + 0.5 * N.pdf(x, 1.5, 0.6)
const mixCdf = (x) => 0.5 * N.cdf(x, -1.5, 0.6) + 0.5 * N.cdf(x, 1.5, 0.6)
const dists = {
  norm: { name: '正态 N(0, 1)', x: [-4, 4], pdf: (x) => N.pdf(x, 0, 1), cdf: (x) => N.cdf(x, 0, 1), mu: 0, sd: 1, ab: [-1, 1] },
  exp: { name: '指数 Exp(1)', x: [-0.5, 6], pdf: (x) => (x < 0 ? 0 : Math.exp(-x)), cdf: (x) => (x < 0 ? 0 : 1 - Math.exp(-x)), mu: 1, sd: 1, ab: [0.5, 2] },
  unif: { name: '均匀 U(0, 2)', x: [-0.5, 2.5], pdf: (x) => (x >= 0 && x <= 2 ? 0.5 : 0), cdf: (x) => Math.min(1, Math.max(0, x / 2)), mu: 1, sd: 2 / Math.sqrt(12), ab: [0.5, 1.5] },
  mix: { name: '双峰混合', x: [-4, 4], pdf: mixPdf, cdf: mixCdf, mu: 0, sd: Math.sqrt(0.36 + 2.25), ab: [-1, 1] },
  binom: { name: '二项 b(10, 0.3)', discrete: true, x: [-0.5, 10.5], pmf: (k) => jStat.binomial.pdf(k, 10, 0.3), cdf: (x) => (x < 0 ? 0 : jStat.binomial.cdf(Math.min(10, Math.floor(x + 1e-9)), 10, 0.3)), mu: 3, sd: Math.sqrt(2.1), ab: [1.5, 4.5] },
}
const key = ref('norm')
const d = computed(() => dists[key.value])
const mode = ref('interval')     // interval | cheb
const a = ref(-1)
const b = ref(1)
const k = ref(2)
watch(key, () => { [a.value, b.value] = d.value.ab })
watch([mode, k, key], () => {
  if (mode.value === 'cheb') { a.value = d.value.mu - k.value * d.value.sd; b.value = d.value.mu + k.value * d.value.sd }
})

const xs = computed(() => { const [l, r] = d.value.x; return Array.from({ length: 241 }, (_, i) => l + ((r - l) * i) / 240) })
const pdfPts = computed(() => xs.value.map((x) => [x, d.value.pdf(x)]))
const cdfPts = computed(() => xs.value.map((x) => [x, d.value.cdf(x)]))
const ks = Array.from({ length: 11 }, (_, i) => i)
const ymax = computed(() => (d.value.discrete ? Math.max(...ks.map(d.value.pmf)) : Math.max(...pdfPts.value.map((p) => p[1]))) * 1.15)
const lo = computed(() => Math.min(a.value, b.value))
const hi = computed(() => Math.max(a.value, b.value))
const shade = computed(() => {
  if (d.value.discrete) return []
  const pts = xs.value.filter((x) => x > lo.value && x < hi.value).map((x) => [x, d.value.pdf(x)])
  return [[lo.value, 0], [lo.value, d.value.pdf(lo.value)], ...pts, [hi.value, d.value.pdf(hi.value)], [hi.value, 0]]
})
const prob = computed(() => d.value.cdf(hi.value) - d.value.cdf(lo.value))
// 切比雪夫：P(|X − μ| ≥ kσ) = F(μ − kσ) + 1 − F((μ + kσ)⁻)
const tail = computed(() => d.value.cdf(lo.value) + 1 - d.value.cdf(hi.value - 1e-9))

// 拖动区间端点：选离指针近的那个
let which = null
function start(e, inv) {
  if (mode.value === 'cheb') return
  e.currentTarget.setPointerCapture(e.pointerId)
  const [x] = inv(e)
  which = Math.abs(x - a.value) < Math.abs(x - b.value) ? a : b
  which.value = x
}
function move(e, inv) {
  if (!which) return
  const [l, r] = d.value.x
  which.value = Math.min(r, Math.max(l, inv(e)[0]))
}
const stop = () => { which = null }
const f4 = (v) => v.toFixed(4)
const f2 = (v) => v.toFixed(2).replace('-', '−')
</script>

<template>
  <div class="lab">
    <header>密度的面积与分布函数的高度</header>
    <div class="body">
      <div class="controls">
        <label>分布
          <select v-model="key">
            <option v-for="(v, kk) in dists" :key="kk" :value="kk">{{ v.name }}</option>
          </select>
        </label>
        <label>模式
          <select v-model="mode">
            <option value="interval">区间概率 P(a &lt; X ≤ b)</option>
            <option value="cheb">切比雪夫：μ ± kσ</option>
          </select>
        </label>
        <label v-if="mode === 'cheb'">k <input v-model.number="k" type="range" min="1" max="4" step="0.1"><span class="val">{{ k.toFixed(1) }}</span></label>
      </div>
      <div class="grid2">
        <div class="panel">
          <Plot v-slot="{ sx, sy, inv }" :x="d.x" :y="[0, ymax]" :height="220">
            <template v-if="d.discrete">
              <line v-for="kk in ks" :key="kk" :x1="sx(kk)" :x2="sx(kk)" :y1="sy(0)" :y2="sy(d.pmf(kk))" :class="kk > lo && kk <= hi ? 'bar-in' : 'bar'" />
            </template>
            <template v-else>
              <path :d="linePath(shade, sx, sy) + 'Z'" class="area" />
              <path :d="linePath(pdfPts, sx, sy)" class="curve" />
            </template>
            <line v-for="(v, i) in [lo, hi]" :key="i" :x1="sx(v)" :x2="sx(v)" :y1="sy(0)" :y2="sy(ymax * 0.95)" class="handle" />
            <text :x="sx(lo)" :y="sy(ymax * 0.95) - 4" text-anchor="middle" class="tag">a</text>
            <text :x="sx(hi)" :y="sy(ymax * 0.95) - 4" text-anchor="middle" class="tag">b</text>
            <polygon :points="`${sx(d.mu)},${sy(0) - 1} ${sx(d.mu) - 7},${sy(0) + 11} ${sx(d.mu) + 7},${sy(0) + 11}`" class="fulcrum" />
            <rect
              :x="sx(d.x[0])" :y="sy(ymax)" :width="sx(d.x[1]) - sx(d.x[0])" :height="sy(0) - sy(ymax)" fill="transparent" class="drag"
              @pointerdown="start($event, inv)" @pointermove="move($event, inv)" @pointerup="stop" @pointercancel="stop"
            />
          </Plot>
          <div class="cap">{{ d.discrete ? '分布列' : '密度 p(x)' }}：拖动可以移动 a、b；▲ 是期望（重心）的位置</div>
        </div>
        <div class="panel">
          <Plot v-slot="{ sx, sy }" :x="d.x" :y="[0, 1.05]" :height="220" :yticks="[0, 0.25, 0.5, 0.75, 1]">
            <path :d="linePath(cdfPts, sx, sy)" class="cdf" />
            <template v-if="d.discrete">
              <circle v-for="kk in ks" :key="kk" :cx="sx(kk)" :cy="sy(d.cdf(kk))" r="3" class="dot" />
            </template>
            <line v-for="(v, i) in [lo, hi]" :key="'h' + i" :x1="sx(d.x[0])" :x2="sx(v)" :y1="sy(d.cdf(v))" :y2="sy(d.cdf(v))" class="guide" />
            <line :x1="sx(d.x[0]) + 6" :x2="sx(d.x[0]) + 6" :y1="sy(d.cdf(lo))" :y2="sy(d.cdf(hi))" class="bracket" />
            <text :x="sx(d.x[0]) + 12" :y="(sy(d.cdf(lo)) + sy(d.cdf(hi))) / 2 + 4" class="tag">F(b) − F(a)</text>
          </Plot>
          <div class="cap">分布函数 F(x)：单调不减、右连续，从 0 升到 1</div>
        </div>
      </div>
      <div class="readout">
        <template v-if="mode === 'interval'">
          a = {{ f2(lo) }}，b = {{ f2(hi) }}：P(a &lt; X ≤ b) = F(b) − F(a) = {{ f4(d.cdf(hi)) }} − {{ f4(d.cdf(lo)) }} = <b>{{ f4(prob) }}</b>
        </template>
        <template v-else>
          P(|X − μ| ≥ {{ k.toFixed(1) }}σ) = <b>{{ f4(tail) }}</b>，切比雪夫上界 1/k² = <b>{{ f4(1 / (k * k)) }}</b>
          <span :class="tail <= 1 / (k * k) + 1e-12 ? 'good' : 'bad'">（{{ tail <= 1 / (k * k) + 1e-12 ? '上界成立' : '上界被突破？' }}）</span>
        </template>
        <br>期望 μ = {{ f2(d.mu) }}，标准差 σ = {{ d.sd.toFixed(3) }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.curve { fill: none; stroke: var(--c-s1); stroke-width: 2; }
.area { fill: color-mix(in srgb, var(--c-s1) 22%, transparent); }
.bar { stroke: var(--vp-c-text-3); stroke-width: 6; }
.bar-in { stroke: var(--c-s1); stroke-width: 6; }
.cdf { fill: none; stroke: var(--c-s3); stroke-width: 2; }
.dot { fill: var(--c-s3); }
.handle { stroke: var(--c-s4); stroke-width: 1.5; stroke-dasharray: 4 3; }
.tag { font-size: 12px; fill: var(--c-s4); font-weight: 600; }
.guide { stroke: var(--c-s4); stroke-dasharray: 3 3; }
.bracket { stroke: var(--c-s4); stroke-width: 3; }
.fulcrum { fill: var(--c-s2); }
</style>
