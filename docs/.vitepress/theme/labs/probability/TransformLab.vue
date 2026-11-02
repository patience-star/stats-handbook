<script setup>
// 变换 Y = g(X)：一小段区间 [x, x+Δx] 被 g 映成 [y, y+Δy]，概率不变，所以密度按 |g'| 缩放
import { computed, ref } from 'vue'
import jStat from 'jstat'
import Plot, { linePath } from '../../components/Plot.vue'

const Xs = {
  norm: { name: 'X ~ N(0, 1)', pdf: (x) => jStat.normal.pdf(x, 0, 1), x: [-3.5, 3.5] },
  unif: { name: 'X ~ U(0, 1)', pdf: (x) => (x > 0 && x < 1 ? 1 : 0), x: [0.0005, 0.9995] },
  exp: { name: 'X ~ Exp(1)', pdf: (x) => (x >= 0 ? Math.exp(-x) : 0), x: [0, 6] },
}
const Gs = {
  lin: { name: 'Y = 2X + 1', g: (x) => 2 * x + 1, note: '线性变换只平移和伸缩：区间长度处处放大 2 倍，密度处处缩小一半，形状不变。' },
  exp: { name: 'Y = eˣ', g: (x) => Math.exp(x), note: 'X 正态时 Y 是对数正态：右边的区间被拉得很长，密度被压低，形成长长的右尾。' },
  sq: { name: 'Y = X²', g: (x) => x * x, note: '非单调：x 与 −x 映到同一个 y，两段的贡献要相加。X ~ N(0, 1) 时 Y ~ χ²(1)，在 0 附近密度趋于无穷。' },
  log: { name: 'Y = −ln X', g: (x) => -Math.log(x), note: 'X ~ U(0, 1) 时 Y ~ Exp(1)：靠近 0 的一小段被拉成很长的尾巴。' },
  cdf: { name: 'Y = Φ(X)', g: (x) => jStat.normal.cdf(x, 0, 1), note: 'X ~ N(0, 1) 时 Y ~ U(0, 1)：密度高的地方 Φ 恰好陡，压缩与拉伸互相抵消（概率积分变换）。' },
}
const xk = ref('norm')
const gk = ref('exp')
const X = computed(() => Xs[xk.value])
const G = computed(() => Gs[gk.value])
const t = ref(0.6)                                         // 小区间在 X 范围中的位置（0~1）
const dxFrac = 1 / 25
const xr = computed(() => X.value.x)
const x0 = computed(() => xr.value[0] + t.value * (xr.value[1] - xr.value[0]) * (1 - dxFrac))
const dx = computed(() => (xr.value[1] - xr.value[0]) * dxFrac)
const y0 = computed(() => G.value.g(x0.value))
const y1 = computed(() => G.value.g(x0.value + dx.value))

// 数值方法求 Y 的密度：在 X 的细网格上把概率质量搬到 y 的分箱里
const grid = computed(() => {
  const [a, b] = xr.value, m = 6000, h = (b - a) / m
  return Array.from({ length: m }, (_, i) => { const x = a + (i + 0.5) * h; return [G.value.g(x), X.value.pdf(x) * h] })
})
const yr = computed(() => {
  // 取 Y 的 0.5% 与 99.5% 分位数作显示范围
  const s = grid.value.filter(([, w]) => w > 0).sort((p, q) => p[0] - q[0])
  let c = 0, lo = s[0][0], hi = s[s.length - 1][0]
  for (const [y, w] of s) { c += w; if (c < 0.005) lo = y; if (c < 0.995) hi = y }
  return [lo, hi + (hi - lo) * 0.02]
})
const dens = computed(() => {
  const [a, b] = yr.value, B = 120, bw = (b - a) / B, mass = Array(B).fill(0)
  for (const [y, w] of grid.value) { const k = Math.floor((y - a) / bw); if (k >= 0 && k < B) mass[k] += w }
  return mass.map((w, k) => [a + (k + 0.5) * bw, w / bw])
})
const pxPts = computed(() => Array.from({ length: 201 }, (_, i) => { const x = xr.value[0] + ((xr.value[1] - xr.value[0]) * i) / 200; return [x, X.value.pdf(x)] }))
const gPts = computed(() => pxPts.value.map(([x]) => [x, G.value.g(x)]))
const pmax = computed(() => Math.max(...pxPts.value.map((p) => p[1])) * 1.15)
const dmax = computed(() => {
  const s = dens.value.map((p) => p[1]).sort((p, q) => p - q)
  return s[Math.floor(s.length * 0.97)] * 1.4
})
const mass = computed(() => X.value.pdf(x0.value + dx.value / 2) * dx.value)
const ylo = computed(() => Math.min(y0.value, y1.value))
const yhi = computed(() => Math.max(y0.value, y1.value))
const stretch = computed(() => (yhi.value - ylo.value) / dx.value)
const clipY = (v) => Math.min(yr.value[1], Math.max(yr.value[0], v))
</script>

<template>
  <div class="lab">
    <header>密度怎样随变换伸缩</header>
    <div class="body">
      <div class="controls">
        <label>X 的分布
          <select v-model="xk"><option v-for="(v, k) in Xs" :key="k" :value="k">{{ v.name }}</option></select>
        </label>
        <label>变换
          <select v-model="gk"><option v-for="(v, k) in Gs" :key="k" :value="k">{{ v.name }}</option></select>
        </label>
        <label>小区间位置 <input v-model.number="t" type="range" min="0" max="1" step="0.005"></label>
      </div>
      <div class="grid2">
        <div class="panel">
          <Plot v-slot="{ sx, sy }" :x="xr" :y="yr" :height="210">
            <rect :x="sx(x0)" :y="sy(yr[1])" :width="sx(x0 + dx) - sx(x0)" :height="sy(yr[0]) - sy(yr[1])" class="vband" />
            <rect :x="sx(xr[0])" :y="sy(clipY(yhi))" :width="sx(xr[1]) - sx(xr[0])" :height="Math.max(1, sy(clipY(ylo)) - sy(clipY(yhi)))" class="hband" />
            <path :d="linePath(gPts.filter((p) => p[1] >= yr[0] - 1 && p[1] <= yr[1] + 1), sx, sy)" class="g" />
          </Plot>
          <div class="cap">变换曲线 y = g(x)：竖条 [x, x+Δx] 被映成横条 [y, y+Δy]</div>
          <Plot v-slot="{ sx, sy }" :x="xr" :y="[0, pmax]" :height="150">
            <rect :x="sx(x0)" :y="sy(X.pdf(x0 + dx / 2))" :width="sx(x0 + dx) - sx(x0)" :height="sy(0) - sy(X.pdf(x0 + dx / 2))" class="mass" />
            <path :d="linePath(pxPts, sx, sy)" class="px" />
          </Plot>
          <div class="cap">X 的密度：阴影面积 = 这一小段的概率</div>
        </div>
        <div class="panel">
          <Plot v-slot="{ sx, sy }" :x="yr" :y="[0, dmax]" :height="210">
            <rect :x="sx(clipY(ylo))" :y="sy(Math.min(dmax, mass / Math.max(1e-9, yhi - ylo)))" :width="Math.max(1, sx(clipY(yhi)) - sx(clipY(ylo)))" :height="sy(0) - sy(Math.min(dmax, mass / Math.max(1e-9, yhi - ylo)))" class="mass" />
            <path :d="linePath(dens.map(([y, v]) => [y, Math.min(v, dmax)]), sx, sy)" class="py" />
          </Plot>
          <div class="cap">Y 的密度（数值计算）：同样的概率摊在长度 Δy 上</div>
          <div class="readout">
            这一小段的概率 ≈ <b>{{ mass.toFixed(4) }}</b><br>
            Δx = {{ dx.toFixed(3) }} → Δy = {{ (yhi - ylo).toFixed(3) }}，长度放大 <b>{{ stretch.toFixed(2) }}</b> 倍<br>
            所以 Y 在这里的密度 ≈ X 的密度 ÷ {{ stretch.toFixed(2) }}
          </div>
        </div>
      </div>
      <div class="readout">{{ G.note }}</div>
    </div>
  </div>
</template>

<style scoped>
.vband { fill: color-mix(in srgb, var(--c-s2) 18%, transparent); }
.hband { fill: color-mix(in srgb, var(--c-s4) 18%, transparent); }
.g { fill: none; stroke: var(--c-s5); stroke-width: 2.2; }
.px { fill: none; stroke: var(--c-s1); stroke-width: 2; }
.py { fill: none; stroke: var(--c-s3); stroke-width: 2; }
.mass { fill: color-mix(in srgb, var(--c-s4) 40%, transparent); }
</style>
