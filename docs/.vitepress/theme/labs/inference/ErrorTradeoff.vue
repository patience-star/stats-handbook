<script setup>
// 两类错误：H₀ 下与 H₁ 下样本均值的两条分布曲线；临界值一移动，α 与 β 此消彼长；增大 n 两条曲线变窄、分开，β 下降
import { computed, ref } from 'vue'
import jStat from 'jstat'
import Plot, { linePath } from '../../components/Plot.vue'

const N = jStat.normal
const mu1 = ref(0.5)          // 备择假设下的真实均值（H₀：μ = 0，σ = 1）
const n = ref(16)
const alpha = ref(0.05)
const sided = ref('right')    // right：H₁ μ > 0；two：H₁ μ ≠ 0
const se = computed(() => 1 / Math.sqrt(n.value))
const c = computed(() => (sided.value === 'right' ? N.inv(1 - alpha.value, 0, 1) : N.inv(1 - alpha.value / 2, 0, 1)) * se.value)
const power = (m) => (sided.value === 'right' ? 1 - N.cdf(c.value, m, se.value) : 1 - N.cdf(c.value, m, se.value) + N.cdf(-c.value, m, se.value))
const beta = computed(() => 1 - power(mu1.value))

const xr = computed(() => [Math.min(0, mu1.value) - 4 * se.value, Math.max(0, mu1.value) + 4 * se.value])
const grid = computed(() => Array.from({ length: 301 }, (_, i) => xr.value[0] + ((xr.value[1] - xr.value[0]) * i) / 300))
const h0 = computed(() => grid.value.map((x) => [x, N.pdf(x, 0, se.value)]))
const h1 = computed(() => grid.value.map((x) => [x, N.pdf(x, mu1.value, se.value)]))
const ymax = computed(() => N.pdf(0, 0, se.value) * 1.15)
const reject = (x) => (sided.value === 'right' ? x >= c.value : Math.abs(x) >= c.value)
// 把满足条件的一段曲线围成多边形
const area = (pts, keep) => {
  const segs = []
  let cur = []
  for (const p of pts) { if (keep(p[0])) cur.push(p); else if (cur.length) { segs.push(cur); cur = [] } }
  if (cur.length) segs.push(cur)
  return segs
}
const alphaSegs = computed(() => area(h0.value, reject))
const betaSegs = computed(() => area(h1.value, (x) => !reject(x)))
const poly = (seg, sx, sy) => linePath([[seg[0][0], 0], ...seg, [seg[seg.length - 1][0], 0]], sx, sy) + 'Z'

const muGrid = Array.from({ length: 121 }, (_, i) => -1.5 + i / 40)
const powerCurve = computed(() => muGrid.map((m) => [m, power(m)]))
const f = (v) => v.toFixed(3)
</script>

<template>
  <div class="lab">
    <header>两类错误与功效</header>
    <div class="body">
      <div class="controls">
        <label>真实均值 μ <input v-model.number="mu1" type="range" min="-1" max="1.5" step="0.05"><span class="val">{{ mu1.toFixed(2) }}</span></label>
        <label>样本量 n <input v-model.number="n" type="range" min="1" max="100" step="1"><span class="val">{{ n }}</span></label>
        <label>显著性水平 α <input v-model.number="alpha" type="range" min="0.005" max="0.2" step="0.005"><span class="val">{{ alpha.toFixed(3) }}</span></label>
        <label>备择假设
          <select v-model="sided"><option value="right">单侧 H₁：μ &gt; 0</option><option value="two">双侧 H₁：μ ≠ 0</option></select>
        </label>
      </div>
      <Plot v-slot="{ sx, sy }" :x="xr" :y="[0, ymax]" :height="240" xlabel="样本均值 x̄">
        <path v-for="(s, i) in betaSegs" :key="'b' + i" :d="poly(s, sx, sy)" class="beta" />
        <path v-for="(s, i) in alphaSegs" :key="'a' + i" :d="poly(s, sx, sy)" class="alpha" />
        <path :d="linePath(h0, sx, sy)" class="h0" />
        <path :d="linePath(h1, sx, sy)" class="h1" />
        <line v-for="(v, i) in sided === 'right' ? [c] : [-c, c]" :key="i" :x1="sx(v)" :x2="sx(v)" :y1="sy(0)" :y2="sy(ymax)" class="crit" />
      </Plot>
      <div class="cap">
        <span class="sw h0" /> H₀ 为真时 x̄ 的分布 N(0, 1/n)　<span class="sw h1" /> 真实均值为 μ 时 x̄ 的分布　虚线：临界值；
        <span class="sw alpha" /> 第一类错误 α　<span class="sw beta" /> 第二类错误 β
      </div>
      <div class="readout">
        拒绝域：{{ sided === 'right' ? `x̄ ≥ ${f(c)}` : `|x̄| ≥ ${f(c)}` }}。
        α = <b>{{ f(alpha) }}</b>，在 μ = {{ mu1.toFixed(2) }} 时 β = <b>{{ f(beta) }}</b>，功效 1 − β = <b>{{ f(1 - beta) }}</b>。
      </div>
      <Plot v-slot="{ sx, sy }" :x="[-1.5, 1.5]" :y="[0, 1]" :height="190" :yticks="[0, 0.25, 0.5, 0.75, 1]" xlabel="真实均值 μ">
        <line :x1="sx(-1.5)" :x2="sx(1.5)" :y1="sy(alpha)" :y2="sy(alpha)" class="crit" />
        <path :d="linePath(powerCurve, sx, sy)" class="pw" />
        <circle :cx="sx(mu1)" :cy="sy(1 - beta)" r="5" class="dot" />
      </Plot>
      <div class="cap">功效函数 g(μ) = P(拒绝 H₀ | μ)：μ = 0 处等于 α，μ 偏离 0 越远越接近 1</div>
    </div>
  </div>
</template>

<style scoped>
.h0 { fill: none; stroke: var(--c-s1); stroke-width: 2.2; }
.h1 { fill: none; stroke: var(--c-s2); stroke-width: 2.2; }
.alpha { fill: color-mix(in srgb, var(--c-s4) 45%, transparent); }
.beta { fill: color-mix(in srgb, var(--c-s2) 25%, transparent); }
.crit { stroke: var(--vp-c-text-2); stroke-width: 1.5; stroke-dasharray: 5 4; }
.pw { fill: none; stroke: var(--c-s3); stroke-width: 2.2; }
.dot { fill: var(--c-s2); }
.sw { display: inline-block; width: 14px; height: 10px; margin: 0 4px 0 6px; vertical-align: -1px; border-radius: 2px; }
.sw.h0 { background: var(--c-s1); height: 3px; vertical-align: 3px; }
.sw.h1 { background: var(--c-s2); height: 3px; vertical-align: 3px; }
.sw.alpha { background: color-mix(in srgb, var(--c-s4) 45%, transparent); }
.sw.beta { background: color-mix(in srgb, var(--c-s2) 25%, transparent); }
</style>
