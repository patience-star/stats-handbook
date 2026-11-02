<script setup>
// 航空乘客的识别：对数使季节波动的幅度稳定，一阶差分去掉趋势，季节差分去掉季节。
// 每一步都看 ACF：衰减很慢说明还不平稳；最后只剩滞后 1 和 12 处的负相关，提示“航空模型”
import { computed, ref } from 'vue'
import Plot, { linePath } from '../../components/Plot.vue'
import { acf, diff } from '../../lib/ts.js'
import air from '../../data/air.json'

const LAGS = 36
const steps = [
  ['raw', '原序列 x', (x) => x],
  ['log', '取对数 ln x', (x) => x.map(Math.log)],
  ['d1', '∇ln x', (x) => diff(x.map(Math.log))],
  ['d12', '∇₁₂ ln x', (x) => diff(x.map(Math.log), 12)],
  ['dd', '∇∇₁₂ ln x', (x) => diff(diff(x.map(Math.log)), 12)],
]
const k = ref('dd')
const y = computed(() => steps.find((s) => s[0] === k.value)[2](air.values))
const off = computed(() => air.values.length - y.value.length)
const r = computed(() => acf(y.value, LAGS))
const band = computed(() => 1.96 / Math.sqrt(y.value.length))
const yr = computed(() => {
  const lo = Math.min(...y.value), hi = Math.max(...y.value), p = (hi - lo) * 0.06
  return [lo - p, hi + p]
})
const pts = computed(() => y.value.map((v, t) => [t + off.value, v]))
const yearFmt = (t) => String(1949 + t / 12)
const f3 = (v) => v.toFixed(3).replace('-', '−')
</script>

<template>
  <div class="lab">
    <header>一步一步差分：航空乘客的识别</header>
    <div class="body">
      <div class="btns">
        <button v-for="[key, name] in steps" :key="key" class="btn" :class="{ on: k === key }" @click="k = key">{{ name }}</button>
      </div>
      <Plot v-slot="{ sx, sy }" :x="[0, 143]" :y="yr" :height="190" :xticks="[0, 24, 48, 72, 96, 120]" :xfmt="yearFmt">
        <path :d="linePath(pts, sx, sy)" class="ser" />
      </Plot>
      <Plot v-slot="{ sx, sy }" :x="[0.4, LAGS + 0.6]" :y="[-1, 1]" :height="170" :xticks="[1, 6, 12, 18, 24, 30, 36]" :yticks="[-1, -0.5, 0, 0.5, 1]" xlabel="滞后 k">
        <rect :x="sx(0.4)" :y="sy(band)" :width="sx(LAGS + 0.6) - sx(0.4)" :height="sy(-band) - sy(band)" class="bandr" />
        <line v-for="j in LAGS" :key="j" :x1="sx(j)" :x2="sx(j)" :y1="sy(0)" :y2="sy(r[j])" :class="j % 12 === 0 ? 'bar s' : 'bar'" />
      </Plot>
      <div class="cap">样本 ACF；红色是季节滞后 12、24、36，阴影为 ±1.96/√n</div>
      <div class="readout">
        n = {{ y.length }}；r₁ = <b>{{ f3(r[1]) }}</b>，r₁₂ = <b>{{ f3(r[12]) }}</b>，r₂₄ = {{ f3(r[24]) }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.ser { fill: none; stroke: var(--c-s1); stroke-width: 1.5; }
.bandr { fill: color-mix(in srgb, var(--c-s1) 12%, transparent); }
.bar { stroke: var(--c-s1); stroke-width: 4; }
.bar.s { stroke: var(--c-s4); }
</style>
