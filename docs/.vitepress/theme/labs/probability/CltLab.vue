<script setup>
// 中心极限定理：从任意（方差有限的）总体中抽 n 个求平均，重复许多次；标准化后的平均值的直方图趋于 N(0, 1)
import { computed, ref, watch } from 'vue'
import jStat from 'jstat'
import Plot, { linePath } from '../../components/Plot.vue'

const P = {
  unif: { name: '均匀 U(0, 1)', mu: 0.5, sd: Math.sqrt(1 / 12), draw: () => Math.random(), pdf: (x) => (x >= 0 && x <= 1 ? 1 : 0), x: [-0.2, 1.2] },
  exp: { name: '指数 Exp(1)（右偏）', mu: 1, sd: 1, draw: () => -Math.log(1 - Math.random()), pdf: (x) => (x >= 0 ? Math.exp(-x) : 0), x: [-0.2, 5] },
  bern: { name: '两点 b(1, 0.1)（离散、强偏斜）', mu: 0.1, sd: 0.3, draw: () => (Math.random() < 0.1 ? 1 : 0), disc: [[0, 0.9], [1, 0.1]], x: [-0.3, 1.3] },
  bimodal: { name: '双峰混合', mu: 0, sd: Math.sqrt(4.25), draw: () => jStat.normal.sample(Math.random() < 0.5 ? -2 : 2, 0.5), pdf: (x) => 0.5 * jStat.normal.pdf(x, -2, 0.5) + 0.5 * jStat.normal.pdf(x, 2, 0.5), x: [-4, 4] },
  cauchy: { name: '柯西分布（方差不存在）', mu: 0, sd: Infinity, draw: () => Math.tan(Math.PI * (Math.random() - 0.5)), pdf: (x) => 1 / (Math.PI * (1 + x * x)), x: [-6, 6] },
}
const key = ref('exp')
const n = ref(5)
const R = 5000
const zs = ref([])
function run() {
  const p = P[key.value], m = n.value
  zs.value = Array.from({ length: R }, () => {
    let s = 0
    for (let i = 0; i < m; i++) s += p.draw()
    const mean = s / m
    return Number.isFinite(p.sd) ? (mean - p.mu) / (p.sd / Math.sqrt(m)) : mean
  })
}
watch([key, n], run, { immediate: true })

const p = computed(() => P[key.value])
const XR = [-4, 4]
const bins = computed(() => {
  const B = 48, w = (XR[1] - XR[0]) / B, c = Array(B).fill(0)
  for (const z of zs.value) { const k = Math.floor((z - XR[0]) / w); if (k >= 0 && k < B) c[k]++ }
  return c.map((v, k) => ({ x0: XR[0] + k * w, x1: XR[0] + (k + 1) * w, h: v / (R * w) }))
})
const ref01 = computed(() => Array.from({ length: 161 }, (_, i) => { const x = XR[0] + (i * 8) / 160; return [x, Number.isFinite(p.value.sd) ? jStat.normal.pdf(x, 0, 1) : 1 / (Math.PI * (1 + x * x))] }))
const hmax = computed(() => Math.max(0.45, ...bins.value.map((b) => b.h)) * 1.1)
const skew = computed(() => {
  const v = zs.value.filter(Number.isFinite), m = jStat.mean(v), s = jStat.stdev(v)
  return v.reduce((a, z) => a + ((z - m) / s) ** 3, 0) / v.length
})
const cover = computed(() => zs.value.filter((z) => Math.abs(z) <= 1.96).length / R)
const parentPts = computed(() => (p.value.pdf ? Array.from({ length: 201 }, (_, i) => { const x = p.value.x[0] + ((p.value.x[1] - p.value.x[0]) * i) / 200; return [x, p.value.pdf(x)] }) : []))
const pmax = computed(() => (p.value.disc ? 1 : Math.max(...parentPts.value.map((q) => q[1]))) * 1.15)
</script>

<template>
  <div class="lab">
    <header>中心极限定理：样本均值的分布</header>
    <div class="body">
      <div class="controls">
        <label>总体分布
          <select v-model="key"><option v-for="(v, k) in P" :key="k" :value="k">{{ v.name }}</option></select>
        </label>
        <label>样本量 n <input v-model.number="n" type="range" min="1" max="100" step="1"><span class="val">{{ n }}</span></label>
      </div>
      <div class="btns"><button class="btn" @click="run">重新抽样 {{ R }} 次</button></div>
      <div class="grid2">
        <div class="panel">
          <Plot v-slot="{ sx, sy }" :x="p.x" :y="[0, pmax]" :height="220">
            <template v-if="p.disc">
              <line v-for="[x, q] in p.disc" :key="x" :x1="sx(x)" :x2="sx(x)" :y1="sy(0)" :y2="sy(q)" class="disc" />
            </template>
            <path v-else :d="linePath(parentPts, sx, sy)" class="parent" />
          </Plot>
          <div class="cap">总体分布（单个观测）</div>
        </div>
        <div class="panel">
          <Plot v-slot="{ sx, sy }" :x="XR" :y="[0, hmax]" :height="220">
            <rect v-for="(b, i) in bins" :key="i" :x="sx(b.x0)" :y="sy(b.h)" :width="Math.max(0, sx(b.x1) - sx(b.x0) - 1)" :height="sy(0) - sy(b.h)" class="bar" />
            <path :d="linePath(ref01, sx, sy)" class="norm" />
          </Plot>
          <div class="cap">{{ Number.isFinite(p.sd) ? '标准化的样本均值 (X̄ − μ)/(σ/√n) 的直方图，与 N(0, 1)（曲线）对比' : '样本均值本身的直方图，与柯西密度（曲线）对比' }}</div>
        </div>
      </div>
      <div class="readout">
        <template v-if="Number.isFinite(p.sd)">
          样本均值的偏度 <b>{{ skew.toFixed(3) }}</b>（正态为 0）；落在 ±1.96 之内的比例 <b>{{ (cover * 100).toFixed(1) }}%</b>（正态为 95%）。
        </template>
        <template v-else>
          <span class="bad">柯西分布的方差（甚至期望）都不存在，中心极限定理不适用：无论 n 多大，样本均值仍然服从同一个柯西分布。</span>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.parent { fill: none; stroke: var(--c-s5); stroke-width: 2.2; }
.disc { stroke: var(--c-s5); stroke-width: 8; }
.bar { fill: color-mix(in srgb, var(--c-s1) 45%, transparent); }
.norm { fill: none; stroke: var(--c-s2); stroke-width: 2.2; }
</style>
