<script setup>
// 卷积：Z = X + Y 的密度 p_Z(z) = ∫ p_X(x) p_Y(z − x) dx。把 p_Y 翻转、平移到 z，与 p_X 相乘后求面积
import { computed, ref } from 'vue'
import Plot, { linePath } from '../../components/Plot.vue'

const phi = (x) => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI)
const F = {
  unif: { name: 'U(0, 1)', f: (x) => (x >= 0 && x <= 1 ? 1 : 0), m: 0.5, v: 1 / 12 },
  exp: { name: 'Exp(1)', f: (x) => (x >= 0 ? Math.exp(-x) : 0), m: 1, v: 1 },
  norm: { name: 'N(0, 1)', f: phi, m: 0, v: 1 },
  skew: { name: '偏斜：0.8U(0, 1) + 0.2U(3, 4)', f: (x) => (x >= 0 && x <= 1 ? 0.8 : x >= 3 && x <= 4 ? 0.2 : 0), m: 0.8 * 0.5 + 0.2 * 3.5, v: 0.8 * (1 / 12 + 0.25) + 0.2 * (1 / 12 + 12.25) - (0.4 + 0.7) ** 2 },
}
const mode = ref('two')      // two：两个分布相加；sum：n 个独立同分布相加
const fx = ref('unif')
const fy = ref('unif')
const z = ref(1)
const n = ref(3)
const X0 = -4, X1 = 16, H = 0.02
const xs = Array.from({ length: Math.round((X1 - X0) / H) + 1 }, (_, i) => X0 + i * H)
const xm = xs.map((x) => x + H / 2)    // 积分用中点，避免恰好落在密度的间断点上

const pz = computed(() => {
  const f = F[fx.value].f, g = F[fy.value].f
  const fv = xm.map(f)
  return xs.map((zz) => { let s = 0; for (let i = 0; i < xm.length; i++) if (fv[i]) s += fv[i] * g(zz - xm[i]); return s * H })
})
const zIndex = computed(() => Math.round((z.value - X0) / H))
const curX = computed(() => xs.map((x) => [x, F[fx.value].f(x)]))
const curY = computed(() => xs.map((x) => [x, F[fy.value].f(z.value - x)]))
const prodPts = computed(() => xs.map((x) => [x, F[fx.value].f(x) * F[fy.value].f(z.value - x)]))
const range2 = [-3, 9]
const vis = (pts) => pts.filter(([x]) => x >= range2[0] && x <= range2[1])

// n 个独立同分布之和：反复卷积
const sums = computed(() => {
  const f = F[fx.value].f
  let cur = xs.map(f)                 // n = 1 的密度（画图用）
  const out = [cur]
  let prev = xm.map(f)                // 上一步的密度在中点处的值，用于下一次卷积
  for (let k = 2; k <= 12; k++) {
    const p = prev
    cur = xs.map((zz) => { let s = 0; for (let i = 0; i < xm.length; i++) if (p[i]) s += p[i] * f(zz - xm[i]); return s * H })
    out.push(cur)
    prev = xm.map((x, i) => (cur[i] + (cur[i + 1] ?? cur[i])) / 2)
  }
  return out
})
const sumPts = computed(() => xs.map((x, i) => [x, sums.value[n.value - 1][i]]))
const normPts = computed(() => {
  const m = n.value * F[fx.value].m, s = Math.sqrt(n.value * F[fx.value].v)
  return xs.map((x) => [x, phi((x - m) / s) / s])
})
const sumRange = computed(() => {
  const m = n.value * F[fx.value].m, s = Math.sqrt(n.value * F[fx.value].v)
  return [Math.max(X0, m - 4.5 * s), Math.min(X1, m + 4.5 * s)]
})
const within = (pts, [a, b]) => pts.filter(([x]) => x >= a && x <= b)
const top = (pts) => Math.max(...pts.map((p) => p[1])) * 1.15 || 1
</script>

<template>
  <div class="lab">
    <header>卷积：独立随机变量之和的密度</header>
    <div class="body">
      <div class="btns">
        <button class="btn" :class="{ on: mode === 'two' }" @click="mode = 'two'">两个分布相加</button>
        <button class="btn" :class="{ on: mode === 'sum' }" @click="mode = 'sum'">n 个同分布相加</button>
      </div>
      <div class="controls">
        <label>{{ mode === 'two' ? 'X 的分布' : '每一项的分布' }}
          <select v-model="fx"><option v-for="(v, k) in F" :key="k" :value="k">{{ v.name }}</option></select>
        </label>
        <label v-if="mode === 'two'">Y 的分布
          <select v-model="fy"><option v-for="(v, k) in F" :key="k" :value="k">{{ v.name }}</option></select>
        </label>
        <label v-if="mode === 'two'">z <input v-model.number="z" type="range" :min="range2[0]" :max="range2[1]" step="0.02"><span class="val">{{ z.toFixed(2) }}</span></label>
        <label v-else>项数 n <input v-model.number="n" type="range" min="1" max="12" step="1"><span class="val">{{ n }}</span></label>
      </div>

      <template v-if="mode === 'two'">
        <Plot v-slot="{ sx, sy }" :x="range2" :y="[0, top([...vis(curX), ...vis(curY)])]" :height="190">
          <path :d="linePath(vis(prodPts), sx, sy) + `L${sx(range2[1])},${sy(0)}L${sx(range2[0])},${sy(0)}Z`" class="prod" />
          <path :d="linePath(vis(curX), sx, sy)" class="fx" />
          <path :d="linePath(vis(curY), sx, sy)" class="fy" />
          <line :x1="sx(z)" :x2="sx(z)" :y1="sy(0)" :y2="sy(top([...vis(curX), ...vis(curY)]) * 0.9)" class="zline" />
        </Plot>
        <div class="cap"><span class="sw fx" /> p<sub>X</sub>(x)　<span class="sw fy" /> p<sub>Y</sub>(z − x)：把 p<sub>Y</sub> 左右翻转后平移到 z　<span class="sw prod" /> 两者之积，面积 = p<sub>Z</sub>(z)</div>
        <Plot v-slot="{ sx, sy }" :x="range2" :y="[0, top(vis(xs.map((x, i) => [x, pz[i]])))]" :height="170">
          <path :d="linePath(vis(xs.map((x, i) => [x, pz[i]])), sx, sy)" class="pz" />
          <circle :cx="sx(z)" :cy="sy(pz[zIndex] ?? 0)" r="5" class="dot" />
        </Plot>
        <div class="readout">p<sub>Z</sub>({{ z.toFixed(2) }}) = 阴影面积 ≈ <b>{{ (pz[zIndex] ?? 0).toFixed(4) }}</b>。拖动 z，让翻转后的曲线从左扫到右，下图就一点一点画出来。</div>
      </template>
      <template v-else>
        <Plot v-slot="{ sx, sy }" :x="sumRange" :y="[0, top(within(sumPts, sumRange))]" :height="240">
          <path :d="linePath(within(normPts, sumRange), sx, sy)" class="norm" />
          <path :d="linePath(within(sumPts, sumRange), sx, sy)" class="pz" />
        </Plot>
        <div class="cap"><span class="sw pz" /> X<sub>1</sub> + … + X<sub>n</sub> 的精确密度（反复卷积）　<span class="sw norm" /> 正态近似 N(nμ, nσ²)</div>
        <div class="readout">每卷积一次，曲线就被“抹平”一次：尖角变圆、偏斜变小。n 增大时，无论起点是什么形状，和的密度都越来越接近正态曲线——这就是中心极限定理的几何图像。</div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.fx { fill: none; stroke: var(--c-s1); stroke-width: 2; }
.fy { fill: none; stroke: var(--c-s2); stroke-width: 2; }
.prod { fill: color-mix(in srgb, var(--c-s3) 35%, transparent); stroke: none; }
.pz { fill: none; stroke: var(--c-s3); stroke-width: 2.2; }
.norm { fill: none; stroke: var(--c-s2); stroke-width: 1.8; stroke-dasharray: 6 4; }
.zline { stroke: var(--c-s4); stroke-dasharray: 4 3; }
.dot { fill: var(--c-s4); }
.sw { display: inline-block; width: 12px; height: 10px; margin: 0 4px 0 8px; vertical-align: -1px; border-radius: 2px; }
.sw.fx { background: var(--c-s1); }
.sw.fy { background: var(--c-s2); }
.sw.prod { background: color-mix(in srgb, var(--c-s3) 35%, transparent); }
.sw.pz { background: var(--c-s3); }
.sw.norm { background: var(--c-s2); }
</style>
