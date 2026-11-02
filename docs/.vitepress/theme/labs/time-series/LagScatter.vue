<script setup>
// 滞后散点图与 ACF：把序列和它向后平移 k 期的副本配对，(x_{t−k}, x_t) 的散点越贴近对角线，r_k 越大。
// 右图把各个滞后的 r_k 排在一起，就是 ACF；阴影为白噪声的 95% 界限 ±1.96/√n
import { computed, ref } from 'vue'
import jStat from 'jstat'
import Plot from '../../components/Plot.vue'
import { acf, ljungBox, noise, simulateArma } from '../../lib/ts.js'
import air from '../../data/air.json'
import lynx from '../../data/lynx.json'
import nile from '../../data/nile.json'
import sun from '../../data/sunspots.json'

const N = 200
const z = ref(noise(N))
const sets = computed(() => ({
  wn: ['白噪声（模拟）', z.value],
  ar1: ['AR(1)，φ = 0.7（模拟）', simulateArma([0.7], [], z.value)],
  rw: ['随机游走（模拟）', simulateArma([1], [], z.value)],
  nile: ['尼罗河流量', nile.values],
  lynx: ['猞猁捕获量（lg）', lynx.values.map(Math.log10)],
  sun: ['太阳黑子', sun.values],
  air: ['航空乘客', air.values],
}))
const which = ref('nile')
const k = ref(1)
const LAGS = 24, H = 10
const x = computed(() => sets.value[which.value][1])
const n = computed(() => x.value.length)
const r = computed(() => acf(x.value, LAGS))
const band = computed(() => 1.96 / Math.sqrt(n.value))
const pairs = computed(() => x.value.slice(k.value).map((v, i) => [x.value[i], v]))
const pairCorr = computed(() => {
  const p = pairs.value, m = p.length
  const ma = p.reduce((s, q) => s + q[0], 0) / m, mb = p.reduce((s, q) => s + q[1], 0) / m
  let sab = 0, saa = 0, sbb = 0
  for (const [a, b] of p) { sab += (a - ma) * (b - mb); saa += (a - ma) ** 2; sbb += (b - mb) ** 2 }
  return sab / Math.sqrt(saa * sbb)
})
const range = computed(() => {
  const lo = Math.min(...x.value), hi = Math.max(...x.value), p = (hi - lo) * 0.05
  return [lo - p, hi + p]
})
const q = computed(() => ljungBox(x.value, H))
const pval = computed(() => 1 - jStat.chisquare.cdf(q.value, H))
const f3 = (v) => v.toFixed(3).replace('-', '−')
const fp = (p) => (p < 1e-4 ? '< 0.0001' : p.toFixed(4))
</script>

<template>
  <div class="lab">
    <header>滞后散点图与自相关函数</header>
    <div class="body">
      <div class="btns">
        <button v-for="(s, key) in sets" :key="key" class="btn" :class="{ on: which === key }" @click="which = key">{{ s[0] }}</button>
        <button class="btn" @click="z = noise(N)">换一组随机数</button>
      </div>
      <div class="controls">
        <label>滞后 k <input v-model.number="k" type="range" min="1" :max="LAGS" step="1"><span class="val">{{ k }}</span></label>
      </div>
      <div class="grid2">
        <div class="panel">
          <Plot v-slot="{ sx, sy }" :x="range" :y="range" equal :xlabel="`x(t−${k})`" :ylabel="'x(t)'">
            <line :x1="sx(range[0])" :y1="sy(range[0])" :x2="sx(range[1])" :y2="sy(range[1])" class="diag" />
            <circle v-for="(p, i) in pairs" :key="i" :cx="sx(p[0])" :cy="sy(p[1])" r="2.6" class="dot" />
          </Plot>
          <div class="cap">共 {{ pairs.length }} 个点 (x<sub>t−{{ k }}</sub>, x<sub>t</sub>)；虚线为对角线</div>
        </div>
        <div class="panel">
          <Plot v-slot="{ sx, sy }" :x="[0, LAGS + 0.6]" :y="[-1, 1]" :height="260" :yticks="[-1, -0.5, 0, 0.5, 1]" xlabel="滞后">
            <rect :x="sx(0)" :y="sy(band)" :width="sx(LAGS + 0.6) - sx(0)" :height="sy(-band) - sy(band)" class="bandr" />
            <line v-for="j in LAGS" :key="j" :x1="sx(j)" :x2="sx(j)" :y1="sy(0)" :y2="sy(r[j])" :class="j === k ? 'bar on' : 'bar'" />
          </Plot>
          <div class="cap">样本 ACF r<sub>1</sub> … r<sub>{{ LAGS }}</sub>；阴影为 ±1.96/√n = ±{{ band.toFixed(3) }}；红色是当前的滞后 k</div>
        </div>
      </div>
      <div class="readout">
        r<sub>{{ k }}</sub> = <b>{{ f3(r[k]) }}</b>；散点的相关系数 = {{ f3(pairCorr) }}<template v-if="Math.abs(pairCorr - r[k]) > 0.05">（差别较大：r<sub>k</sub> 用全部数据的均值和方差，序列有趋势时前后两段的均值不同，两者会差得很多）</template><template v-else>（两者略有差别：r<sub>k</sub> 用全部 n 个数据的均值和方差）</template><br>
        Ljung–Box 检验（前 {{ H }} 个滞后）：Q = {{ q.toFixed(2) }}，自由度 {{ H }}，p 值 {{ fp(pval) }}
        <b v-if="pval < 0.05" class="bad">——拒绝“白噪声”</b><b v-else class="good">——不能拒绝“白噪声”</b>
      </div>
    </div>
  </div>
</template>

<style scoped>
.diag { stroke: var(--vp-c-text-3); stroke-dasharray: 5 4; }
.dot { fill: var(--c-s1); fill-opacity: 0.55; }
.bandr { fill: color-mix(in srgb, var(--c-s1) 12%, transparent); }
.bar { stroke: var(--c-s1); stroke-width: 4; }
.bar.on { stroke: var(--c-s4); stroke-width: 6; }
</style>
