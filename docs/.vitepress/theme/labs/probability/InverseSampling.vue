<script setup>
// 逆变换抽样：U ~ U(0, 1) 从纵轴出发，水平碰到分布函数曲线，再竖直落到横轴，得到 X = F⁻¹(U)
import { computed, ref, watch } from 'vue'
import jStat from 'jstat'
import Plot, { linePath } from '../../components/Plot.vue'

const T = {
  exp: { name: '指数 Exp(1)', x: [0, 6], cdf: (x) => (x < 0 ? 0 : 1 - Math.exp(-x)), inv: (u) => -Math.log(1 - u), pdf: (x) => Math.exp(-x) },
  norm: { name: '正态 N(0, 1)', x: [-3.5, 3.5], cdf: (x) => jStat.normal.cdf(x, 0, 1), inv: (u) => jStat.normal.inv(u, 0, 1), pdf: (x) => jStat.normal.pdf(x, 0, 1) },
  binom: { name: '二项 b(5, 0.4)', disc: true, x: [-0.5, 5.5], cdf: (x) => (x < 0 ? 0 : jStat.binomial.cdf(Math.min(5, Math.floor(x + 1e-9)), 5, 0.4)),
    inv: (u) => { let k = 0; while (jStat.binomial.cdf(k, 5, 0.4) < u) k++; return k }, pdf: (k) => jStat.binomial.pdf(k, 5, 0.4) },
}
const key = ref('exp')
const t = computed(() => T[key.value])
const draws = ref([])          // [u, x]
const last = computed(() => draws.value[draws.value.length - 1])
function draw(m) {
  const add = Array.from({ length: m }, () => { const u = Math.random(); return [u, t.value.inv(u)] })
  draws.value = [...draws.value, ...add].slice(-20000)
}
watch(key, () => { draws.value = [] })

const cdfPts = computed(() => Array.from({ length: 301 }, (_, i) => { const x = t.value.x[0] + ((t.value.x[1] - t.value.x[0]) * i) / 300; return [x, t.value.cdf(x)] }))
// 直方图（离散分布按整数计数）
const bins = computed(() => {
  const [a, b] = t.value.x, n = draws.value.length
  if (t.value.disc) {
    return Array.from({ length: 6 }, (_, k) => ({ x0: k - 0.4, x1: k + 0.4, h: n ? draws.value.filter((d) => d[1] === k).length / n : 0 }))
  }
  const B = 40, w = (b - a) / B, c = Array(B).fill(0)
  for (const [, x] of draws.value) { const k = Math.floor((x - a) / w); if (k >= 0 && k < B) c[k]++ }
  return c.map((v, k) => ({ x0: a + k * w, x1: a + (k + 1) * w, h: n ? v / (n * w) : 0 }))
})
const pdfPts = computed(() => (t.value.disc ? [] : cdfPts.value.map(([x]) => [x, t.value.pdf(x)])))
const hmax = computed(() => Math.max(...bins.value.map((b) => b.h), ...(t.value.disc ? [0, 1, 2, 3, 4, 5].map(t.value.pdf) : pdfPts.value.map((p) => p[1]))) * 1.15)
</script>

<template>
  <div class="lab">
    <header>逆变换抽样：用均匀随机数造出任意分布</header>
    <div class="body">
      <div class="controls">
        <label>目标分布
          <select v-model="key"><option v-for="(v, k) in T" :key="k" :value="k">{{ v.name }}</option></select>
        </label>
      </div>
      <div class="btns">
        <button class="btn" @click="draw(1)">抽 1 个</button>
        <button class="btn" @click="draw(100)">抽 100 个</button>
        <button class="btn" @click="draw(5000)">抽 5000 个</button>
        <button class="btn" @click="draws = []">清空</button>
      </div>
      <div class="grid2">
        <div class="panel">
          <Plot v-slot="{ sx, sy }" :x="t.x" :y="[0, 1]" :height="230" :yticks="[0, 0.25, 0.5, 0.75, 1]">
            <path :d="linePath(cdfPts, sx, sy)" class="cdf" />
            <template v-if="last">
              <polyline :points="`${sx(t.x[0])},${sy(last[0])} ${sx(last[1])},${sy(last[0])} ${sx(last[1])},${sy(0)}`" class="path" />
              <circle :cx="sx(t.x[0])" :cy="sy(last[0])" r="4" class="u" />
              <circle :cx="sx(last[1])" :cy="sy(0)" r="4" class="xdot" />
            </template>
          </Plot>
          <div class="cap">分布函数 F(x)：u 在纵轴上均匀，碰到曲线后落在 x = F⁻¹(u)</div>
        </div>
        <div class="panel">
          <Plot v-slot="{ sx, sy }" :x="t.x" :y="[0, hmax]" :height="230">
            <rect v-for="(b, i) in bins" :key="i" :x="sx(b.x0)" :y="sy(b.h)" :width="Math.max(0, sx(b.x1) - sx(b.x0) - 1)" :height="sy(0) - sy(b.h)" class="bar" />
            <path v-if="pdfPts.length" :d="linePath(pdfPts, sx, sy)" class="pdf" />
            <template v-else>
              <circle v-for="k in [0, 1, 2, 3, 4, 5]" :key="k" :cx="sx(k)" :cy="sy(t.pdf(k))" r="4" class="pmf" />
            </template>
          </Plot>
          <div class="cap">抽到的 x 的直方图，与目标{{ t.disc ? '分布列（圆点）' : '密度（曲线）' }}对比</div>
        </div>
      </div>
      <div class="readout">
        已抽 <b>{{ draws.length }}</b> 个。<template v-if="last">最近一次：u = {{ last[0].toFixed(4) }} → x = F⁻¹(u) = <b>{{ +last[1].toFixed(4) }}</b>。</template>
        分布函数陡的地方，纵轴上的一小段 u 只对应横轴上很短的一段 x，抽到的点就密集——这正是密度大的地方。
      </div>
    </div>
  </div>
</template>

<style scoped>
.cdf { fill: none; stroke: var(--c-s3); stroke-width: 2.2; }
.path { fill: none; stroke: var(--c-s4); stroke-width: 1.5; stroke-dasharray: 4 3; }
.u { fill: var(--c-s2); }
.xdot { fill: var(--c-s4); }
.bar { fill: color-mix(in srgb, var(--c-s1) 45%, transparent); }
.pdf { fill: none; stroke: var(--c-s2); stroke-width: 2; }
.pmf { fill: var(--c-s2); }
</style>
