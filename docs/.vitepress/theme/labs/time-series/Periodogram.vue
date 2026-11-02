<script setup>
// 周期图：把序列看成许多正弦波的叠加，I(f_j) 是频率 f_j = j/n 处的“能量”，峰所在的频率对应主要的周期 1/f。
// 原始周期图的每个值都很不稳定，把相邻的 2m+1 个值平均（Daniell 窗）可以得到较平滑的谱估计
import { computed, ref } from 'vue'
import Plot, { linePath } from '../../components/Plot.vue'
import { noise, periodogram, simulateArma } from '../../lib/ts.js'
import lynx from '../../data/lynx.json'
import sun from '../../data/sunspots.json'

const PHI = [1, -0.5]
// AR(2) 的理论值：E I(f) ≈ σ² / |φ(e^{−iω})|²，ω = 2πf，σ² = 1；白噪声为常数 σ² = 1
const arSpec = (f) => {
  const w = 2 * Math.PI * f
  return 1 / ((1 - PHI[0] * Math.cos(w) - PHI[1] * Math.cos(2 * w)) ** 2 + (PHI[0] * Math.sin(w) + PHI[1] * Math.sin(2 * w)) ** 2)
}
const z = ref(noise(356))
const sets = computed(() => ({
  sun: ['太阳黑子（年度）', sun.values, null, 1700],
  lynx: ['猞猁捕获量（lg）', lynx.values.map(Math.log10), null, 1821],
  ar2: ['模拟 AR(2)：φ = (1, −0.5)', simulateArma(PHI, [], z.value).slice(100), arSpec, 0],
  wn: ['白噪声（模拟）', z.value.slice(100), () => 1, 0],
}))
const which = ref('sun')
const m = ref(0)
const logScale = ref(false)
const d = computed(() => sets.value[which.value])
const x = computed(() => d.value[1])
const pg = computed(() => periodogram(x.value))
const smooth = computed(() => pg.value.map((p, i) => {
  let s = 0, c = 0
  for (let j = Math.max(0, i - m.value); j <= Math.min(pg.value.length - 1, i + m.value); j++) { s += pg.value[j].power; c++ }
  return [p.freq, s / c]
}))
const peak = computed(() => pg.value.reduce((b, p) => (p.power > b.power ? p : b)))
const tf = (v) => (logScale.value ? Math.log10(Math.max(v, 1e-6)) : v)
const theo = computed(() => (d.value[2] ? Array.from({ length: 201 }, (_, i) => [i / 400, tf(d.value[2](i / 400))]) : null))
const yr = computed(() => {
  const v = [...pg.value.map((p) => tf(p.power)), ...(theo.value ? theo.value.map(([, y]) => y) : [])]
  const lo = Math.min(...v), hi = Math.max(...v)
  return logScale.value ? [lo - 0.2, hi + 0.2] : [0, hi * 1.08]
})
const sr = computed(() => {
  const lo = Math.min(...x.value), hi = Math.max(...x.value), p = (hi - lo) * 0.06
  return [lo - p, hi + p]
})
const tfmt = (t) => String(d.value[3] + t)
const yfmt = (v) => (logScale.value ? `10^${+v.toFixed(1)}` : String(+v.toPrecision(3)))
</script>

<template>
  <div class="lab">
    <header>周期图：序列里藏着哪些周期</header>
    <div class="body">
      <div class="btns">
        <button v-for="(s, k) in sets" :key="k" class="btn" :class="{ on: which === k }" @click="which = k">{{ s[0] }}</button>
        <button v-if="which === 'ar2' || which === 'wn'" class="btn" @click="z = noise(356)">换一组随机数</button>
        <button class="btn" :class="{ on: logScale }" @click="logScale = !logScale">对数纵轴</button>
      </div>
      <Plot v-slot="{ sx, sy }" :x="[0, x.length - 1]" :y="sr" :height="150" :xfmt="d[3] ? tfmt : undefined">
        <path :d="linePath(x.map((v, t) => [t, v]), sx, sy)" class="ser" />
      </Plot>
      <div class="controls">
        <label>平滑窗口半宽 m <input v-model.number="m" type="range" min="0" max="6" step="1"><span class="val">{{ m }}</span></label>
      </div>
      <Plot v-slot="{ sx, sy }" :x="[0, 0.5]" :y="yr" :height="240" :xticks="[0, 0.1, 0.2, 0.3, 0.4, 0.5]" :yfmt="yfmt" xlabel="频率 f（周期 / 期）">
        <line v-for="p in pg" :key="p.freq" :x1="sx(p.freq)" :x2="sx(p.freq)" :y1="sy(yr[0])" :y2="sy(tf(p.power))" class="pbar" />
        <path v-if="m > 0" :d="linePath(smooth.map(([f, v]) => [f, tf(v)]), sx, sy)" class="smooth" />
        <path v-if="theo" :d="linePath(theo, sx, sy)" class="theo" />
        <circle :cx="sx(peak.freq)" :cy="sy(tf(peak.power))" r="5" class="peak" />
      </Plot>
      <div class="cap">
        竖线：周期图 I(f<sub>j</sub>)；<template v-if="m > 0"><span class="sw smooth" /> 相邻 {{ 2 * m + 1 }} 个值的平均　</template><template v-if="theo"><span class="sw theo" /> 理论谱（周期图的期望）　</template>红点：最高峰
      </div>
      <div class="readout">
        n = {{ x.length }}，最高峰在 f = {{ peak.freq.toFixed(4) }}（j = {{ Math.round(peak.freq * x.length) }}），对应的周期 1/f ≈ <b>{{ (1 / peak.freq).toFixed(2) }}</b>{{ d[3] ? ' 年' : ' 期' }}
        <template v-if="which === 'ar2'">；理论峰值在 cos ω = φ₁(φ₂ − 1)/(4φ₂) 处，即周期 ≈ {{ (2 * Math.PI / Math.acos(PHI[0] * (PHI[1] - 1) / (4 * PHI[1]))).toFixed(2) }} 期（伪周期 2π/ω₀ = 8 期）</template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ser { fill: none; stroke: var(--c-s1); stroke-width: 1.3; }
.pbar { stroke: color-mix(in srgb, var(--c-s1) 60%, transparent); stroke-width: 1.6; }
.smooth { fill: none; stroke: var(--c-s2); stroke-width: 2.4; }
.theo { fill: none; stroke: var(--c-s4); stroke-width: 2; stroke-dasharray: 5 4; }
.peak { fill: var(--c-s4); }
.sw { display: inline-block; width: 14px; height: 3px; margin: 0 4px 0 6px; vertical-align: 3px; }
.sw.smooth { background: var(--c-s2); }
.sw.theo { background: var(--c-s4); }
</style>
