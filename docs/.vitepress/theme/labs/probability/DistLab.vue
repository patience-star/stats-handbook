<script setup>
// 分布图谱与浏览器：上方是常用分布之间的关系图，点击节点在下方查看该分布，调参数、看期望方差、叠加正态近似
import { computed, ref, watch } from 'vue'
import jStat from 'jstat'
import Plot, { linePath } from '../../components/Plot.vue'

const C = (n, k) => Math.exp(jStat.gammaln(n + 1) - jStat.gammaln(k + 1) - jStat.gammaln(n - k + 1))
// 每个分布：名称、记号、是否离散、参数 [名称, 默认, 最小, 最大, 步长]、概率函数、显示范围、期望、方差、背景故事
const D = {
  bern: { name: '两点分布', tag: 'b(1, p)', disc: true, params: [['p', 0.3, 0.01, 0.99, 0.01]],
    f: (k, { p }) => (k === 0 ? 1 - p : k === 1 ? p : 0), range: () => [0, 1], mean: ({ p }) => p, var: ({ p }) => p * (1 - p),
    story: '一次试验只有成功、失败两种结果，X 为成功的次数。' },
  binom: { name: '二项分布', tag: 'b(n, p)', disc: true, params: [['n', 20, 1, 60, 1], ['p', 0.3, 0.01, 0.99, 0.01]],
    f: (k, { n, p }) => jStat.binomial.pdf(k, n, p), range: ({ n }) => [0, n], mean: ({ n, p }) => n * p, var: ({ n, p }) => n * p * (1 - p),
    story: 'n 重伯努利试验中成功的次数；等于 n 个独立两点分布之和。' },
  pois: { name: '泊松分布', tag: 'P(λ)', disc: true, params: [['λ', 4, 0.2, 30, 0.1]],
    f: (k, { λ }) => jStat.poisson.pdf(k, λ), range: ({ λ }) => [0, Math.ceil(λ + 4 * Math.sqrt(λ) + 3)], mean: ({ λ }) => λ, var: ({ λ }) => λ,
    story: '单位时间（或空间）内稀有事件发生的次数：电话呼叫、放射性衰变、一页书上的错字。' },
  hyper: { name: '超几何分布', tag: 'h(n, N, M)', disc: true, params: [['N', 60, 10, 200, 1], ['M', 15, 1, 60, 1], ['n', 12, 1, 60, 1]],
    f: (k, { N, M, n }) => (k < 0 || k > n || k > M || n - k > N - M ? 0 : (C(M, k) * C(N - M, n - k)) / C(N, n)),
    range: ({ n, M }) => [0, Math.min(n, M)], mean: ({ N, M, n }) => (n * M) / N, var: ({ N, M, n }) => ((n * M) / N) * (1 - M / N) * ((N - n) / (N - 1)),
    story: 'N 件产品中有 M 件次品，不放回地抽 n 件，其中的次品数。' },
  geom: { name: '几何分布', tag: 'Ge(p)', disc: true, params: [['p', 0.25, 0.03, 0.95, 0.01]],
    f: (k, { p }) => (k >= 1 ? (1 - p) ** (k - 1) * p : 0), range: ({ p }) => [1, Math.max(3, Math.ceil(Math.log(0.002) / Math.log(1 - p)))], mean: ({ p }) => 1 / p, var: ({ p }) => (1 - p) / p ** 2,
    story: '独立重复试验中，首次成功所需的试验次数。唯一具有无记忆性的离散分布。' },
  nbin: { name: '负二项分布', tag: 'Nb(r, p)', disc: true, params: [['r', 3, 1, 20, 1], ['p', 0.35, 0.05, 0.95, 0.01]],
    f: (k, { r, p }) => (k >= r ? C(k - 1, r - 1) * p ** r * (1 - p) ** (k - r) : 0),
    range: ({ r, p }) => [r, Math.ceil(r / p + 5 * Math.sqrt((r * (1 - p)) / p ** 2) + 3)], mean: ({ r, p }) => r / p, var: ({ r, p }) => (r * (1 - p)) / p ** 2,
    story: '第 r 次成功所需的试验次数；等于 r 个独立几何分布之和。' },
  unif: { name: '均匀分布', tag: 'U(a, b)', params: [['a', 0, -5, 5, 0.1], ['b', 2, -4, 6, 0.1]],
    f: (x, { a, b }) => (b > a && x >= a && x <= b ? 1 / (b - a) : 0), range: ({ a, b }) => [a - 0.25 * Math.abs(b - a) - 0.2, b + 0.25 * Math.abs(b - a) + 0.2],
    mean: ({ a, b }) => (a + b) / 2, var: ({ a, b }) => (b - a) ** 2 / 12, story: '在区间上“完全随机”地取一点；四舍五入的误差。' },
  exp: { name: '指数分布', tag: 'Exp(λ)', params: [['λ', 1, 0.2, 5, 0.1]],
    f: (x, { λ }) => (x < 0 ? 0 : λ * Math.exp(-λ * x)), range: ({ λ }) => [-0.2 / λ, 6 / λ], mean: ({ λ }) => 1 / λ, var: ({ λ }) => 1 / λ ** 2,
    story: '等待时间、寿命：泊松过程中相邻两次事件的间隔。唯一具有无记忆性的连续分布。' },
  gamma: { name: '伽马分布', tag: 'Ga(α, λ)', params: [['α', 3, 0.5, 30, 0.1], ['λ', 1, 0.2, 5, 0.1]],
    f: (x, { α, λ }) => (x <= 0 ? 0 : jStat.gamma.pdf(x, α, 1 / λ)), range: ({ α, λ }) => [0, (α + 5 * Math.sqrt(α) + 2) / λ], mean: ({ α, λ }) => α / λ, var: ({ α, λ }) => α / λ ** 2,
    story: 'α 为整数时，是 α 个独立 Exp(λ) 之和：第 α 次事件发生的时刻。' },
  chi2: { name: '卡方分布', tag: 'χ²(n)', params: [['n', 4, 1, 50, 1]],
    f: (x, { n }) => (x <= 0 ? 0 : jStat.chisquare.pdf(x, n)), range: ({ n }) => [0, n + 5 * Math.sqrt(2 * n) + 2], mean: ({ n }) => n, var: ({ n }) => 2 * n,
    story: 'n 个独立标准正态变量的平方和，即 Ga(n/2, 1/2)。用于方差的推断。' },
  norm: { name: '正态分布', tag: 'N(μ, σ²)', params: [['μ', 0, -5, 5, 0.1], ['σ', 1, 0.2, 4, 0.1]],
    f: (x, { μ, σ }) => jStat.normal.pdf(x, μ, σ), range: ({ μ, σ }) => [μ - 4 * σ, μ + 4 * σ], mean: ({ μ }) => μ, var: ({ σ }) => σ * σ,
    story: '大量微小、独立因素叠加的结果（中心极限定理）：测量误差、身高。' },
  lnorm: { name: '对数正态分布', tag: 'LN(μ, σ²)', params: [['μ', 0, -1, 2, 0.1], ['σ', 0.5, 0.1, 1.5, 0.05]],
    f: (x, { μ, σ }) => (x <= 0 ? 0 : jStat.lognormal.pdf(x, μ, σ)), range: ({ μ, σ }) => [0, Math.exp(μ + 3 * σ)],
    mean: ({ μ, σ }) => Math.exp(μ + σ * σ / 2), var: ({ μ, σ }) => (Math.exp(σ * σ) - 1) * Math.exp(2 * μ + σ * σ),
    story: 'ln X 服从正态：大量独立因素“相乘”的结果，如收入、股价、颗粒大小。' },
  beta: { name: '贝塔分布', tag: 'Be(a, b)', params: [['a', 2, 0.3, 12, 0.1], ['b', 5, 0.3, 12, 0.1]],
    f: (x, { a, b }) => (x <= 0 || x >= 1 ? 0 : jStat.beta.pdf(x, a, b)), range: () => [0, 1], mean: ({ a, b }) => a / (a + b), var: ({ a, b }) => (a * b) / ((a + b) ** 2 * (a + b + 1)),
    story: '取值在 (0, 1) 的比例；均匀分布的次序统计量；贝叶斯统计中比例的先验。' },
  t: { name: 't 分布', tag: 't(n)', params: [['n', 4, 1, 60, 1]],
    f: (x, { n }) => jStat.studentt.pdf(x, n), range: () => [-5, 5], mean: ({ n }) => (n > 1 ? 0 : NaN), var: ({ n }) => (n > 2 ? n / (n - 2) : NaN),
    story: 'Z / √(χ²(n)/n)：σ 未知时的均值推断。尾部比正态厚，n → ∞ 时趋于标准正态。' },
  f: { name: 'F 分布', tag: 'F(m, n)', params: [['m', 5, 1, 60, 1], ['n', 12, 1, 60, 1]],
    f: (x, { m, n }) => (x <= 0 ? 0 : jStat.centralF.pdf(x, m, n)), range: () => [0, 5], mean: ({ n }) => (n > 2 ? n / (n - 2) : NaN),
    var: ({ m, n }) => (n > 4 ? (2 * n * n * (m + n - 2)) / (m * (n - 2) ** 2 * (n - 4)) : NaN),
    story: '两个独立卡方变量各除以自由度之比：方差比较、方差分析。' },
}

// 关系图：节点位置与连线 [起点, 终点, 说明, 弯曲量]
const pos = {
  bern: [80, 40], binom: [230, 40], pois: [380, 40], norm: [530, 40], lnorm: [670, 40],
  geom: [80, 125], hyper: [230, 125], exp: [380, 125], t: [670, 125],
  nbin: [80, 210], unif: [230, 210], gamma: [380, 210], chi2: [530, 210], f: [670, 210],
  beta: [230, 290],
}
const edges = [
  ['bern', 'binom', 'n 个独立相加', 0], ['hyper', 'binom', 'N→∞', 0], ['binom', 'pois', 'n→∞，np=λ', 0],
  ['binom', 'norm', 'n 大（中心极限）', -42], ['pois', 'norm', 'λ 大', 0], ['norm', 'lnorm', '取 eˣ', 0],
  ['bern', 'geom', '等待首次成功', 0], ['geom', 'nbin', 'r 个独立相加', 0], ['pois', 'exp', '事件间隔', 0],
  ['geom', 'exp', '都无记忆', 26], ['exp', 'gamma', 'α 个独立相加', 0], ['gamma', 'chi2', 'α=n/2，λ=1/2', 0],
  ['norm', 'chi2', '平方和', -20], ['unif', 'exp', '−ln U / λ', 0], ['unif', 'beta', '次序统计量', 0],
  ['norm', 't', 'Z/√(χ²/n)', 0], ['chi2', 't', '', 0], ['chi2', 'f', '两个 χ² 之比', 0], ['t', 'f', 't² ~ F(1, n)', 0],
]
function edgePath([a, b, , bend]) {
  const [x1, y1] = pos[a], [x2, y2] = pos[b]
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, len = Math.hypot(x2 - x1, y2 - y1)
  const cx = mx - ((y2 - y1) / len) * bend, cy = my + ((x2 - x1) / len) * bend
  return { d: `M${x1},${y1}Q${cx},${cy} ${x2},${y2}`, lx: (mx + cx) / 2, ly: (my + cy) / 2 }
}

const pick = ref('binom')
const vals = ref({})
const reset = () => { vals.value = Object.fromEntries(D[pick.value].params.map(([k, v]) => [k, v])) }
reset()
watch(pick, reset)
// 超几何分布要求 M ≤ N、n ≤ N
watch(() => vals.value.N, (N) => {
  if (N === undefined) return
  vals.value.M = Math.min(vals.value.M, N)
  vals.value.n = Math.min(vals.value.n, N)
})
const showNormal = ref(false)

const d = computed(() => D[pick.value])
const P = computed(() => vals.value)
const xr = computed(() => d.value.range(P.value))
const pts = computed(() => {
  const [a, b] = xr.value
  if (d.value.disc) return Array.from({ length: b - a + 1 }, (_, i) => [a + i, d.value.f(a + i, P.value)])
  return Array.from({ length: 301 }, (_, i) => { const x = a + ((b - a) * i) / 300; return [x, d.value.f(x, P.value)] })
})
const mean = computed(() => d.value.mean(P.value))
const sd = computed(() => Math.sqrt(d.value.var(P.value)))
const normPts = computed(() => {
  if (!showNormal.value || !Number.isFinite(sd.value)) return []
  const [a, b] = xr.value
  return Array.from({ length: 201 }, (_, i) => { const x = a - 0.5 + ((b - a + 1) * i) / 200; return [x, jStat.normal.pdf(x, mean.value, sd.value)] })
})
const ymax = computed(() => Math.max(...pts.value.map((q) => q[1]).filter(Number.isFinite), ...normPts.value.map((q) => q[1]), 1e-6) * 1.12)
const plotX = computed(() => (d.value.disc ? [xr.value[0] - 0.7, xr.value[1] + 0.7] : xr.value))
const fmt = (v) => (Number.isFinite(v) ? +v.toPrecision(4) : '不存在')
</script>

<template>
  <div class="lab">
    <header>分布图谱：常用分布从哪里来、彼此什么关系</header>
    <div class="body">
      <div class="map">
        <svg viewBox="0 0 750 320">
          <g v-for="(e, i) in edges" :key="i" class="edge" :class="{ hot: e[0] === pick || e[1] === pick, dash: e[2] === '都无记忆' }">
            <path :d="edgePath(e).d" />
            <text v-if="e[2]" :x="edgePath(e).lx" :y="edgePath(e).ly - 4" text-anchor="middle">{{ e[2] }}</text>
          </g>
          <g v-for="(xy, k) in pos" :key="k" class="node" :class="{ on: pick === k, disc: D[k].disc }" :transform="`translate(${xy[0] - 60},${xy[1] - 16})`" @click="pick = k">
            <rect width="120" height="32" rx="9" />
            <text x="60" y="20" text-anchor="middle">{{ D[k].name.replace('分布', '') }} {{ D[k].tag }}</text>
          </g>
        </svg>
      </div>
      <div class="cap">点击节点查看分布。实线框为离散分布，圆角填充框为连续分布；箭头方向表示“由……得到”。</div>

      <div class="controls">
        <label v-for="[k, , lo, hi, st] in d.params" :key="pick + k">
          {{ k }} <input v-model.number="vals[k]" type="range" :min="lo" :max="hi" :step="st"><span class="val">{{ vals[k] }}</span>
        </label>
        <label><input v-model="showNormal" type="checkbox"> 叠加正态近似 N(EX, Var X)</label>
      </div>
      <Plot v-slot="{ sx, sy }" :x="plotX" :y="[0, ymax]" :height="230">
        <template v-if="d.disc">
          <line v-for="[k, v] in pts" :key="k" :x1="sx(k)" :x2="sx(k)" :y1="sy(0)" :y2="sy(v)" class="bar" />
        </template>
        <path v-else :d="linePath(pts.filter((q) => Number.isFinite(q[1])), sx, sy)" class="curve" />
        <path v-if="normPts.length" :d="linePath(normPts, sx, sy)" class="normal" />
        <polygon v-if="Number.isFinite(mean)" :points="`${sx(mean)},${sy(0) - 1} ${sx(mean) - 7},${sy(0) + 11} ${sx(mean) + 7},${sy(0) + 11}`" class="fulcrum" />
      </Plot>
      <div class="readout">
        <b>{{ d.name }} {{ d.tag }}</b>：{{ d.story }}<br>
        期望 E(X) = <b>{{ fmt(mean) }}</b>，方差 Var(X) = <b>{{ fmt(d.var(P)) }}</b>，标准差 {{ fmt(sd) }}（▲ 标出期望的位置）
      </div>
    </div>
  </div>
</template>

<style scoped>
.map { overflow-x: auto; }
.map svg { display: block; width: 100%; min-width: 620px; height: auto; }
.edge path { fill: none; stroke: var(--vp-c-divider); stroke-width: 1.6; }
.edge text { font-size: 11px; fill: var(--vp-c-text-3); paint-order: stroke; stroke: var(--vp-c-bg-soft); stroke-width: 4px; }
.edge.dash path { stroke-dasharray: 5 4; }
.edge.hot path { stroke: var(--c-s1); stroke-width: 2.2; }
.edge.hot text { fill: var(--c-s1); }
.node { cursor: pointer; }
.node rect { fill: color-mix(in srgb, var(--c-s3) 12%, var(--vp-c-bg)); stroke: var(--c-s3); stroke-width: 1.2; }
.node.disc rect { fill: var(--vp-c-bg); stroke: var(--c-s1); }
.node text { font-size: 12px; fill: var(--vp-c-text-1); }
.node.on rect { stroke-width: 3; fill: var(--vp-c-brand-soft); }
.bar { stroke: var(--c-s1); stroke-width: 5; }
.curve { fill: none; stroke: var(--c-s3); stroke-width: 2.2; }
.normal { fill: none; stroke: var(--c-s2); stroke-width: 1.8; stroke-dasharray: 6 4; }
.fulcrum { fill: var(--c-s2); }
</style>
