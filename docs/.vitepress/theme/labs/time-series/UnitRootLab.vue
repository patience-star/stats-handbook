<script setup>
// 确定性趋势还是随机趋势：x_t = a + bt + u_t，u_t = ρ u_{t−1} + ε_t。ρ < 1 时冲击的影响按 ρ^k 消失（趋势平稳）；
// ρ = 1 时 u_t 是随机游走，x_t 成为带漂移的随机游走（差分平稳），冲击的影响永久存在
import { computed, ref } from 'vue'
import Plot, { linePath } from '../../components/Plot.vue'
import { dfStat, noise } from '../../lib/ts.js'

const N = 100, H = 30, A = 10, B = 0.1, T0 = 40, SHOCK = 6, K = 40
const CRIT = -3.455   // n = 100、含常数项和趋势项时 DF 检验 5% 的临界值（MacKinnon）
const rho = ref(0.8)
const eps = ref(noise(N))
const shock = ref(true)
const u = computed(() => {
  let v = 0
  return eps.value.map((e, t) => (v = rho.value * v + e + (shock.value && t === T0 ? SHOCK : 0)))
})
const x = computed(() => u.value.map((v, t) => A + B * t + v))
const fc = computed(() => {
  let cum = 0
  return Array.from({ length: H }, (_, k) => {
    cum += rho.value ** (2 * k)
    return [N + k, A + B * (N + k) + rho.value ** (k + 1) * u.value[N - 1], Math.sqrt(cum)]
  })
})
const tau = computed(() => dfStat(x.value, { trend: true }))
const halfLife = computed(() => (rho.value === 0 ? 0 : rho.value < 1 ? Math.log(0.5) / Math.log(rho.value) : Infinity))
const longSe = computed(() => (rho.value < 1 ? 1 / Math.sqrt(1 - rho.value ** 2) : Infinity))
const yr = computed(() => {
  const v = [...x.value, ...fc.value.flatMap(([, m, s]) => [m - 1.96 * s, m + 1.96 * s])]
  return [Math.min(...v) - 1, Math.max(...v) + 1]
})
const band = computed(() => {
  const up = fc.value.map(([t, m, s]) => [t, m + 1.96 * s]), lo = fc.value.map(([t, m, s]) => [t, m - 1.96 * s]).reverse()
  return [[N - 1, x.value[N - 1]], ...up, ...lo]
})
const poly = (pts, sx, sy) => pts.map(([a, b]) => `${sx(a)},${sy(b)}`).join(' ')
const pts = (arr) => arr.map((v, t) => [t, v])
const irf = computed(() => Array.from({ length: K + 1 }, (_, k) => rho.value ** k))
</script>

<template>
  <div class="lab">
    <header>趋势平稳与差分平稳：冲击会不会消失</header>
    <div class="body">
      <div class="btns">
        <button v-for="v in [0.5, 0.8, 0.95, 1]" :key="v" class="btn" :class="{ on: rho === v }" @click="rho = v">ρ = {{ v }}</button>
        <button class="btn" :class="{ on: shock }" @click="shock = !shock">第 {{ T0 }} 期加入一次 +{{ SHOCK }} 的冲击</button>
        <button class="btn" @click="eps = noise(N)">换一组随机冲击</button>
      </div>
      <div class="controls">
        <label>ρ <input v-model.number="rho" type="range" min="0" max="1" step="0.01"><span class="val">{{ rho.toFixed(2) }}</span></label>
      </div>
      <Plot v-slot="{ sx, sy }" :x="[0, N + H - 1]" :y="yr" :height="250" xlabel="t">
        <polygon :points="poly(band, sx, sy)" class="fan" />
        <line :x1="sx(0)" :x2="sx(N + H - 1)" :y1="sy(A)" :y2="sy(A + B * (N + H - 1))" class="trend" />
        <line v-if="shock" :x1="sx(T0)" :x2="sx(T0)" :y1="sy(yr[0])" :y2="sy(yr[1])" class="mark" />
        <path :d="linePath(pts(x), sx, sy)" class="path" />
        <path :d="linePath([[N - 1, x[N - 1]], ...fc.map(([t, m]) => [t, m])], sx, sy)" class="fmean" />
      </Plot>
      <div class="cap"><span class="sw path" /> x<sub>t</sub> = 10 + 0.1t + u<sub>t</sub>　<span class="sw trend" /> 确定性趋势 10 + 0.1t　<span class="sw fmean" /> 预测及 95% 区间{{ shock ? '；竖线：冲击发生的时刻' : '' }}</div>
      <div class="grid2">
        <div class="panel">
          <Plot v-slot="{ sx, sy }" :x="[-0.5, K + 0.5]" :y="[0, 1.05]" :height="150" :yticks="[0, 0.5, 1]" xlabel="冲击发生后的期数 k">
            <line v-for="(v, k) in irf" :key="k" :x1="sx(k)" :x2="sx(k)" :y1="sy(0)" :y2="sy(v)" class="ibar" />
          </Plot>
          <div class="cap">脉冲响应：一单位冲击在 k 期后对 x 的影响 ρ<sup>k</sup></div>
        </div>
        <div class="panel readout" style="margin-top: 0">
          冲击的半衰期：<b>{{ halfLife === Infinity ? '∞（永不衰减）' : halfLife.toFixed(2) + ' 期' }}</b><br>
          预测标准误的极限：<b>{{ longSe === Infinity ? '∞（按 √h 增大）' : longSe.toFixed(2) }}</b><br>
          DF 检验（含常数项与趋势项）：τ = <b>{{ tau.toFixed(2).replace("-", "−") }}</b>，5% 临界值 −3.455
          <span v-if="tau < CRIT" class="good">——拒绝单位根</span><span v-else class="bad">——不能拒绝单位根</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fan { fill: color-mix(in srgb, var(--c-s2) 16%, transparent); }
.trend { stroke: var(--c-s3); stroke-width: 1.6; stroke-dasharray: 6 4; }
.mark { stroke: var(--c-s4); stroke-dasharray: 2 3; }
.path { fill: none; stroke: var(--c-s1); stroke-width: 1.6; }
.fmean { fill: none; stroke: var(--c-s2); stroke-width: 2.2; }
.ibar { stroke: var(--c-s4); stroke-width: 4; }
.sw { display: inline-block; width: 14px; height: 3px; margin: 0 4px 0 6px; vertical-align: 3px; }
.sw.path { background: var(--c-s1); }
.sw.trend { background: var(--c-s3); }
.sw.fmean { background: var(--c-s2); }
</style>
