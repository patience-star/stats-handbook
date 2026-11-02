<script setup>
// 二维正态（σ₁ = σ₂ = 1）：等高椭圆、在 x = x₀ 处的竖切片（条件分布）、回归线 E(Y|X=x) = ρx 与椭圆主轴的对比
import { computed, ref } from 'vue'
import jStat from 'jstat'
import Plot, { linePath } from '../../components/Plot.vue'

const rho = ref(0.7)
const x0 = ref(1.5)
const showXonY = ref(false)
const Z = ref(Array.from({ length: 500 }, () => [jStat.normal.sample(0, 1), jStat.normal.sample(0, 1)]))
const pts = computed(() => Z.value.map(([a, b]) => [a, rho.value * a + Math.sqrt(1 - rho.value ** 2) * b]))
const near = (x) => Math.abs(x - x0.value) < 0.12

// 等高椭圆 x² − 2ρxy + y² = c²(1 − ρ²)：沿 (1,1) 与 (1,−1) 方向的半轴为 c√(1±ρ)
const ellipse = (c) => Array.from({ length: 121 }, (_, i) => {
  const t = (2 * Math.PI * i) / 120, u = c * Math.sqrt(1 + rho.value) * Math.cos(t), v = c * Math.sqrt(1 - rho.value) * Math.sin(t)
  return [(u - v) / Math.SQRT2, (u + v) / Math.SQRT2]
})
const R = 3.2
const line = (k) => [[-R, -R * k], [R, R * k]]
const ys = Array.from({ length: 161 }, (_, i) => -4 + i * 0.05)
const condMean = computed(() => rho.value * x0.value)
const condSd = computed(() => Math.sqrt(1 - rho.value ** 2))
const cond = computed(() => ys.map((y) => [y, jStat.normal.pdf(y, condMean.value, condSd.value)]))
const marg = ys.map((y) => [y, jStat.normal.pdf(y, 0, 1)])
const cmax = computed(() => Math.max(jStat.normal.pdf(0, 0, condSd.value), 0.45) * 1.1)
</script>

<template>
  <div class="lab">
    <header>二维正态：椭圆、切片与回归效应</header>
    <div class="body">
      <div class="controls">
        <label>相关系数 ρ <input v-model.number="rho" type="range" min="-0.95" max="0.95" step="0.05"><span class="val">{{ rho.toFixed(2) }}</span></label>
        <label>切片位置 x₀ <input v-model.number="x0" type="range" min="-2.5" max="2.5" step="0.05"><span class="val">{{ x0.toFixed(2) }}</span></label>
        <label><input v-model="showXonY" type="checkbox"> 显示 X 对 Y 的回归线</label>
      </div>
      <div class="grid2">
        <div class="panel">
          <Plot v-slot="{ sx, sy }" :x="[-R, R]" :y="[-R, R]" equal :xticks="[-3, -2, -1, 0, 1, 2, 3]" :yticks="[-3, -2, -1, 0, 1, 2, 3]">
            <circle v-for="(p, i) in pts" :key="i" :cx="sx(p[0])" :cy="sy(p[1])" r="2.2" :class="near(p[0]) ? 'pt-hot' : 'pt'" />
            <path v-for="c in [1, 2]" :key="c" :d="linePath(ellipse(c), sx, sy) + 'Z'" class="ell" />
            <line :x1="sx(x0)" :x2="sx(x0)" :y1="sy(-R)" :y2="sy(R)" class="slice" />
            <path v-if="Math.abs(rho) > 0.001" :d="linePath(line(Math.sign(rho)), sx, sy)" class="axis-major" />
            <path :d="linePath(line(rho), sx, sy)" class="reg" />
            <path v-if="showXonY && Math.abs(rho) > 0.05" :d="linePath([[-R * Math.abs(rho), -R * Math.sign(rho)], [R * Math.abs(rho), R * Math.sign(rho)]], sx, sy)" class="reg2" />
            <circle :cx="sx(x0)" :cy="sy(condMean)" r="5" class="cm" />
          </Plot>
          <div class="cap">
            <span class="sw reg" /> 回归线 E(Y|X=x) = ρx　<span class="sw major" /> 椭圆主轴
            <template v-if="showXonY">　<span class="sw reg2" /> X 对 Y 的回归线</template>
          </div>
        </div>
        <div class="panel">
          <Plot v-slot="{ sx, sy }" :x="[-4, 4]" :y="[0, cmax]" :height="250">
            <path :d="linePath(marg, sx, sy)" class="marg" />
            <path :d="linePath(cond, sx, sy)" class="cond" />
            <line :x1="sx(condMean)" :x2="sx(condMean)" :y1="sy(0)" :y2="sy(jStat.normal.pdf(0, 0, condSd))" class="cmline" />
          </Plot>
          <div class="cap">横轴为 y。<span class="sw cond" /> 条件密度 p(y | x₀)　<span class="sw marg" /> 边际密度 p(y)</div>
        </div>
      </div>
      <div class="readout">
        在 X = {{ x0.toFixed(2) }} 处切一刀，Y 的条件分布是 N({{ condMean.toFixed(2) }}, {{ (1 - rho * rho).toFixed(3) }})：
        条件均值 ρx₀ = <b>{{ condMean.toFixed(2) }}</b>，条件方差 1 − ρ² = <b>{{ (1 - rho * rho).toFixed(3) }}</b>。<br>
        回归线的斜率 ρ = {{ rho.toFixed(2) }}，比主轴的斜率 {{ Math.sign(rho) || 0 }} 更平：X 偏离均值 1 个标准差，Y 平均只偏离 {{ Math.abs(rho).toFixed(2) }} 个标准差——这就是“回归效应”。
      </div>
    </div>
  </div>
</template>

<style scoped>
.pt { fill: var(--c-s1); opacity: 0.35; }
.pt-hot { fill: var(--c-s4); }
.ell { fill: none; stroke: var(--c-s1); stroke-width: 1.5; }
.slice { stroke: var(--c-s4); stroke-dasharray: 4 3; }
.axis-major { fill: none; stroke: var(--vp-c-text-3); stroke-width: 1.5; stroke-dasharray: 7 5; }
.reg { fill: none; stroke: var(--c-s2); stroke-width: 2.4; }
.reg2 { fill: none; stroke: var(--c-s5); stroke-width: 2; stroke-dasharray: 3 3; }
.cm { fill: var(--c-s2); stroke: var(--vp-c-bg); stroke-width: 2; }
.marg { fill: none; stroke: var(--vp-c-text-3); stroke-width: 1.8; stroke-dasharray: 5 4; }
.cond { fill: none; stroke: var(--c-s4); stroke-width: 2.2; }
.cmline { stroke: var(--c-s2); stroke-dasharray: 3 3; }
.sw { display: inline-block; width: 14px; height: 3px; margin: 0 4px 0 6px; vertical-align: 3px; }
.sw.reg { background: var(--c-s2); }
.sw.major { background: var(--vp-c-text-3); }
.sw.reg2 { background: var(--c-s5); }
.sw.cond { background: var(--c-s4); }
.sw.marg { background: var(--vp-c-text-3); }
</style>
