<script setup>
// GARCH(1,1)：r_t = σ_t z_t，σ²_t = ω + α r²_{t−1} + β σ²_{t−1}，取 ω = 1 − α − β，使无条件方差为 1。
// 收益率本身几乎不相关，平方却明显相关：大的波动后面跟着大的波动
import { computed, ref } from 'vue'
import jStat from 'jstat'
import Plot, { linePath } from '../../components/Plot.vue'
import { acf, garch, ljungBox, noise } from '../../lib/ts.js'

const N = 1000, LAGS = 20, H = 10
const z = ref(noise(N))
const alpha = ref(0.08)
const beta = ref(0.9)
const presets = [['同方差', 0, 0], ['ARCH(1)', 0.5, 0], ['典型的日收益率', 0.08, 0.9], ['高持续性', 0.04, 0.95]]
const b = computed(() => Math.min(beta.value, 0.99 - alpha.value))
const sim = computed(() => garch(z.value, 1 - alpha.value - b.value, alpha.value, b.value))
const r = computed(() => sim.value.map((s) => s.r))
const r2 = computed(() => r.value.map((v) => v * v))
const acfR = computed(() => acf(r.value, LAGS))
const acfR2 = computed(() => acf(r2.value, LAGS))
const band = 1.96 / Math.sqrt(N)
const persist = computed(() => alpha.value + b.value)
const kurt = computed(() => {
  const m2 = r2.value.reduce((s, v) => s + v, 0) / N, m4 = r2.value.reduce((s, v) => s + v * v, 0) / N
  return m4 / (m2 * m2)
})
const kurtTheo = computed(() => {
  const p = persist.value, den = 1 - p * p - 2 * alpha.value ** 2
  return den > 0 ? (3 * (1 - p * p)) / den : Infinity
})
const pv = (x) => 1 - jStat.chisquare.cdf(ljungBox(x, H), H)
const fp = (p) => (p < 1e-4 ? '< 0.0001' : p.toFixed(4))
const lim = computed(() => Math.max(4, ...r.value.map(Math.abs)) * 1.05)
const band2 = computed(() => {
  const up = sim.value.map((s, t) => [t, 2 * s.sigma]), lo = sim.value.map((s, t) => [t, -2 * s.sigma]).reverse()
  return [...up, ...lo]
})
const poly = (pts, sx, sy) => pts.map(([a, c]) => `${sx(a).toFixed(1)},${sy(c).toFixed(1)}`).join(' ')
</script>

<template>
  <div class="lab">
    <header>GARCH(1,1)：波动的聚集</header>
    <div class="body">
      <div class="btns">
        <button v-for="[name, a, bb] in presets" :key="name" class="btn" @click="alpha = a; beta = bb">{{ name }}</button>
        <button class="btn" @click="z = noise(N)">换一组随机数</button>
      </div>
      <div class="controls">
        <label>α（新冲击） <input v-model.number="alpha" type="range" min="0" max="0.6" step="0.01"><span class="val">{{ alpha.toFixed(2) }}</span></label>
        <label>β（旧波动） <input v-model.number="beta" type="range" min="0" max="0.98" step="0.01"><span class="val">{{ b.toFixed(2) }}</span></label>
      </div>
      <Plot v-slot="{ sx, sy }" :x="[0, N - 1]" :y="[-lim, lim]" :height="220" xlabel="t（模拟）">
        <polygon :points="poly(band2, sx, sy)" class="env" />
        <path :d="linePath(r.map((v, t) => [t, v]), sx, sy)" class="ret" />
      </Plot>
      <div class="cap">模拟的收益率 r<sub>t</sub>；阴影为 ±2σ<sub>t</sub>，即条件标准差的“包络”</div>
      <div class="grid2">
        <div v-for="[name, arr] in [['r 的 ACF', acfR], ['r² 的 ACF', acfR2]]" :key="name" class="panel">
          <Plot v-slot="{ sx, sy }" :x="[0.4, LAGS + 0.6]" :y="[-0.3, 0.6]" :height="150" :xticks="[1, 5, 10, 15, 20]" :yticks="[-0.2, 0, 0.2, 0.4, 0.6]">
            <rect :x="sx(0.4)" :y="sy(band)" :width="sx(LAGS + 0.6) - sx(0.4)" :height="sy(-band) - sy(band)" class="bandr" />
            <line v-for="k in LAGS" :key="k" :x1="sx(k)" :x2="sx(k)" :y1="sy(0)" :y2="sy(Math.max(-0.3, Math.min(0.6, arr[k])))" class="bar" />
          </Plot>
          <div class="cap">{{ name }}</div>
        </div>
      </div>
      <div class="readout">
        持续性 α + β = <b>{{ persist.toFixed(2) }}</b>{{ persist > 0 ? `，波动冲击的半衰期 ${(Math.log(0.5) / Math.log(persist)).toFixed(1)} 期` : '' }}<br>
        峰度：样本 {{ kurt.toFixed(2) }}，理论 {{ kurtTheo === Infinity ? '∞（四阶矩不存在）' : kurtTheo.toFixed(2) }}（正态分布为 3）<br>
        Ljung–Box（前 {{ H }} 个滞后）：r 的 p 值 {{ fp(pv(r)) }}，r² 的 p 值 <b>{{ fp(pv(r2)) }}</b>
      </div>
    </div>
  </div>
</template>

<style scoped>
.env { fill: color-mix(in srgb, var(--c-s2) 22%, transparent); }
.ret { fill: none; stroke: var(--c-s1); stroke-width: 0.9; }
.bandr { fill: color-mix(in srgb, var(--c-s1) 12%, transparent); }
.bar { stroke: var(--c-s1); stroke-width: 4; }
</style>
