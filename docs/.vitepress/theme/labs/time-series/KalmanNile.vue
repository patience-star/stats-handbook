<script setup>
// 局部水平模型 y_t = μ_t + ε_t，μ_{t+1} = μ_t + η_t。卡尔曼滤波逐期用新观测修正对水平 μ_t 的估计，
// 修正幅度（卡尔曼增益）取决于信噪比 q = σ²_η / σ²_ε；两个方差可以用极大似然估计
import { computed, ref } from 'vue'
import Plot, { linePath } from '../../components/Plot.vue'
import { kalmanLevel } from '../../lib/ts.js'
import nile from '../../data/nile.json'

const y = nile.values, N = y.length, Y0 = 1871
const le = ref(Math.log10(15099))
const lh = ref(Math.log10(1469.1))
const zeroEta = ref(false)
const s2e = computed(() => 10 ** le.value)
const s2h = computed(() => (zeroEta.value ? 0 : 10 ** lh.value))
const res = computed(() => kalmanLevel(y, s2e.value, s2h.value))
const q = computed(() => s2h.value / s2e.value)
// 稳态：预测方差 P̄ = σ²_ε (q + √(q² + 4q)) / 2，增益 K̄ = P̄ / (P̄ + σ²_ε)
const gain = computed(() => { const P = (s2e.value * (q.value + Math.sqrt(q.value ** 2 + 4 * q.value))) / 2; return P / (P + s2e.value) })

function mle() {
  const ll = (a, b) => kalmanLevel(y, 10 ** a, 10 ** b).loglik
  let best = { v: -Infinity }
  const scan = (a0, a1, b0, b1, h) => {
    for (let a = a0; a <= a1 + 1e-9; a += h) for (let b = b0; b <= b1 + 1e-9; b += h) { const v = ll(a, b); if (v > best.v) best = { v, a, b } }
  }
  scan(3.5, 4.8, 1.5, 4.5, 0.02)   // 先粗后细的网格搜索（似然曲面在一个方向上很平，细搜要足够细）
  for (const h of [0.001, 0.0001]) { const { a, b } = best; scan(a - 20 * h, a + 20 * h, b - 20 * h, b + 20 * h, h) }
  zeroEta.value = false
  le.value = best.a
  lh.value = best.b
}
function setLh(v) {
  zeroEta.value = false
  lh.value = v
}
const band = computed(() => {
  const r = res.value
  const up = r.level.map((m, t) => [t, m + 1.96 * Math.sqrt(r.P[t])]).slice(1)
  const lo = r.level.map((m, t) => [t, m - 1.96 * Math.sqrt(r.P[t])]).slice(1).reverse()
  return [...up, ...lo]
})
const poly = (pts, sx, sy) => pts.map(([a, b]) => `${sx(a).toFixed(1)},${sy(b).toFixed(1)}`).join(' ')
const yearFmt = (t) => String(Y0 + t)
const lv = (year) => res.value.level[year - Y0].toFixed(1)
</script>

<template>
  <div class="lab">
    <header>卡尔曼滤波：尼罗河的水平</header>
    <div class="body">
      <div class="btns">
        <button class="btn" @click="mle">极大似然估计</button>
        <button class="btn" :class="{ on: zeroEta }" @click="zeroEta = true">水平不变（σ²<sub>η</sub> = 0）</button>
        <button class="btn" @click="le = 3; setLh(5)">紧跟数据（q 很大）</button>
      </div>
      <div class="controls">
        <label>lg σ²<sub>ε</sub>（观测噪声） <input v-model.number="le" type="range" min="2.5" max="5" step="0.01"><span class="val">{{ Math.round(s2e) }}</span></label>
        <label>lg σ²<sub>η</sub>（水平的变化） <input :value="lh" type="range" min="0" max="5" step="0.01" @input="setLh(+$event.target.value)"><span class="val">{{ zeroEta ? 0 : Math.round(s2h) }}</span></label>
      </div>
      <Plot v-slot="{ sx, sy }" :x="[0, N - 1]" :y="[400, 1450]" :height="270" :xfmt="yearFmt" ylabel="流量（亿立方米）">
        <polygon :points="poly(band, sx, sy)" class="band" />
        <circle v-for="(v, t) in y" :key="t" :cx="sx(t)" :cy="sy(v)" r="2.8" class="obs" />
        <path :d="linePath(res.level.map((v, t) => [t, v]), sx, sy)" class="lev" />
      </Plot>
      <div class="cap">圆点：观测值；<span class="sw lev" /> 滤波得到的水平 μ̂<sub>t|t</sub>；阴影：μ<sub>t</sub> 的 95% 区间 ±1.96√P<sub>t|t</sub></div>
      <div class="readout">
        信噪比 q = σ²<sub>η</sub>/σ²<sub>ε</sub> = <b>{{ q.toFixed(4) }}</b>，稳态卡尔曼增益 K̄ = <b>{{ gain.toFixed(3) }}</b>（等价于平滑系数 α = K̄ 的简单指数平滑）<br>
        对数似然 = <b>{{ res.loglik.toFixed(2).replace('-', '−') }}</b>；滤波水平：1897 年 {{ lv(1897) }}，1899 年 {{ lv(1899) }}，1901 年 {{ lv(1901) }}，1970 年 {{ lv(1970) }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.band { fill: color-mix(in srgb, var(--c-s2) 20%, transparent); }
.obs { fill: var(--vp-c-text-3); }
.lev { fill: none; stroke: var(--c-s2); stroke-width: 2.4; }
.sw { display: inline-block; width: 14px; height: 3px; margin: 0 4px 0 6px; vertical-align: 3px; }
.sw.lev { background: var(--c-s2); }
</style>
