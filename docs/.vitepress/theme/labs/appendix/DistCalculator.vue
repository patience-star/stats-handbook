<script setup>
// 统计表计算器：代替书后的附表。给定数值求概率，或给定概率求分位数（同时给出下侧与上侧两种记法）
import { computed, reactive, ref } from 'vue'
import jStat from 'jstat'
import Plot, { linePath } from '../../components/Plot.vue'

const dists = {
  norm: {
    name: '正态 N(μ, σ²)', params: [['μ', 0], ['σ', 1]], cont: true, sym: true,
    cdf: (x, [m, s]) => jStat.normal.cdf(x, m, s), inv: (p, [m, s]) => jStat.normal.inv(p, m, s), pdf: (x, [m, s]) => jStat.normal.pdf(x, m, s),
    center: ([m]) => m, range: ([m, s]) => [m - 4 * s, m + 4 * s],
  },
  t: {
    name: 't(n)', params: [['n', 10]], cont: true, sym: true,
    cdf: (x, [n]) => jStat.studentt.cdf(x, n), inv: (p, [n]) => jStat.studentt.inv(p, n), pdf: (x, [n]) => jStat.studentt.pdf(x, n),
    center: () => 0, range: ([n]) => { const r = Math.max(4, jStat.studentt.inv(0.995, n) * 1.2); return [-r, r] },
  },
  chi2: {
    name: 'χ²(n)', params: [['n', 8]], cont: true,
    cdf: (x, [n]) => jStat.chisquare.cdf(x, n), inv: (p, [n]) => jStat.chisquare.inv(p, n), pdf: (x, [n]) => jStat.chisquare.pdf(x, n),
    range: ([n]) => [0, jStat.chisquare.inv(0.999, n)],
  },
  f: {
    name: 'F(m, n)', params: [['m', 2], ['n', 12]], cont: true,
    cdf: (x, [a, b]) => jStat.centralF.cdf(x, a, b), inv: (p, [a, b]) => jStat.centralF.inv(p, a, b), pdf: (x, [a, b]) => jStat.centralF.pdf(x, a, b),
    range: ([a, b]) => [0, jStat.centralF.inv(0.995, a, b)],
  },
  binom: {
    name: '二项 b(n, p)', params: [['n', 10], ['p', 0.3]], cont: false,
    pmf: (k, [n, p]) => jStat.binomial.pdf(k, n, p), cdf: (k, [n, p]) => jStat.binomial.cdf(k, n, p),
    range: ([n]) => [0, Math.round(n)],
  },
  pois: {
    name: '泊松 P(λ)', params: [['λ', 4]], cont: false,
    pmf: (k, [l]) => jStat.poisson.pdf(k, l), cdf: (k, [l]) => jStat.poisson.cdf(k, l),
    range: ([l]) => [0, Math.ceil(l + 6 * Math.sqrt(l) + 4)],
  },
}
const which = ref('norm')
const vals = reactive(Object.fromEntries(Object.entries(dists).map(([k, d]) => [k, d.params.map((p) => p[1])])))
const mode = ref('x2p')
const x = ref(1.96)
const p = ref(0.975)
const d = computed(() => dists[which.value])
const par = computed(() => vals[which.value])
// 参数是否合法
const ok = computed(() => {
  const v = par.value
  switch (which.value) {
    case 'norm': return v[1] > 0
    case 't': case 'chi2': return v[0] > 0
    case 'f': return v[0] > 0 && v[1] > 0
    case 'binom': return Number.isInteger(v[0]) && v[0] >= 1 && v[0] <= 2000 && v[1] >= 0 && v[1] <= 1
    default: return v[0] > 0 && v[0] <= 500
  }
})
const pOk = computed(() => p.value > 0 && p.value < 1)

// 连续分布
const lower = computed(() => d.value.cdf(x.value, par.value))
const qLow = computed(() => d.value.inv(p.value, par.value))
const qUp = computed(() => d.value.inv(1 - p.value, par.value))
const twoSided = computed(() => 2 * Math.min(lower.value, 1 - lower.value))
const table = computed(() => (d.value.sym ? [] : [0.005, 0.01, 0.025, 0.05, 0.1]).concat([0.9, 0.95, 0.975, 0.99, 0.995]).map((q) => [q, d.value.inv(q, par.value)]))

// 离散分布
const k = computed(() => Math.round(x.value))
const kLow = computed(() => {   // 使 P(X ≤ k) ≥ p 的最小 k
  const [, hi] = d.value.range(par.value)
  for (let j = 0; j <= hi * 3 + 50; j++) if (d.value.cdf(j, par.value) >= p.value - 1e-12) return j
  return NaN
})
const kUp = computed(() => {    // 使 P(X ≥ k) ≤ p 的最小 k（上侧检验的临界值）
  for (let j = 0; j <= kLow.value + 1000; j++) if (1 - (j > 0 ? d.value.cdf(j - 1, par.value) : 0) <= p.value + 1e-12) return j
  return NaN
})

// 图
const xr = computed(() => d.value.range(par.value))
const curve = computed(() => {
  if (!d.value.cont) return []
  const [a, b] = xr.value, out = []
  for (let i = 0; i <= 240; i++) { const t = a + ((b - a) * i) / 240; out.push([t, d.value.pdf(t, par.value)]) }
  return out
})
const bars = computed(() => {
  if (d.value.cont) return []
  const [a, b] = xr.value
  return Array.from({ length: b - a + 1 }, (_, i) => [a + i, d.value.pmf(a + i, par.value)])
})
const ymax = computed(() => {
  const v = d.value.cont ? curve.value.filter(([t]) => t > xr.value[0] + (xr.value[1] - xr.value[0]) * 0.02).map((c) => c[1]) : bars.value.map((c) => c[1])
  return Math.max(...v.filter(Number.isFinite)) * 1.1
})
const clip = (v) => Math.min(v, ymax.value)
const cut = computed(() => (mode.value === 'x2p' ? x.value : qLow.value))
const shade = computed(() => {
  const pts = curve.value.filter(([t]) => t <= cut.value).map(([t, v]) => [t, clip(v)])
  return pts.length ? [[pts[0][0], 0], ...pts, [pts.at(-1)[0], 0]] : []
})
const shadeUp = computed(() => {
  if (mode.value !== 'p2x') return []
  const pts = curve.value.filter(([t]) => t >= qUp.value).map(([t, v]) => [t, clip(v)])
  return pts.length ? [[pts[0][0], 0], ...pts, [pts.at(-1)[0], 0]] : []
})
const poly = (pts, sx, sy) => pts.map(([a, b]) => `${sx(a).toFixed(1)},${sy(b).toFixed(1)}`).join(' ')
const kCut = computed(() => (mode.value === 'x2p' ? k.value : kLow.value))
const f4 = (v) => (Number.isFinite(v) ? (Math.abs(v) < 1e-4 && v !== 0 ? v.toExponential(3) : v.toFixed(4)).replace('-', '−') : '—')
const fp = (v) => (Number.isFinite(v) ? (v < 1e-4 && v > 0 ? v.toExponential(3) : v.toFixed(4)) : '—')
</script>

<template>
  <div class="lab">
    <header>统计表计算器</header>
    <div class="body">
      <div class="btns">
        <button v-for="(s, key) in dists" :key="key" class="btn" :class="{ on: which === key }" @click="which = key">{{ s.name }}</button>
      </div>
      <div class="controls">
        <label v-for="(pp, i) in d.params" :key="which + i">{{ pp[0] }} <input v-model.number="vals[which][i]" type="number" :step="pp[0] === 'p' ? 0.01 : 1" style="width: 7em"></label>
        <label>
          <select v-model="mode">
            <option value="x2p">已知数值，求概率</option>
            <option value="p2x">已知概率，求分位数</option>
          </select>
        </label>
        <label v-if="mode === 'x2p'">{{ d.cont ? 'x' : 'k' }} <input v-model.number="x" type="number" step="0.01" style="width: 7em"></label>
        <label v-else>概率 p <input v-model.number="p" type="number" step="0.005" min="0" max="1" style="width: 7em"></label>
      </div>
      <div v-if="!ok" class="readout bad">参数不合法：请检查（如 σ、自由度、λ 须为正数，二项分布的 n 为 1～2000 的整数、0 ≤ p ≤ 1）。</div>
      <template v-else>
        <Plot v-slot="{ sx, sy }" :x="d.cont ? xr : [xr[0] - 0.6, xr[1] + 0.6]" :y="[0, ymax]" :height="220">
          <template v-if="d.cont">
            <polygon v-if="shade.length" :points="poly(shade, sx, sy)" class="area" />
            <polygon v-if="shadeUp.length" :points="poly(shadeUp, sx, sy)" class="area up" />
            <path :d="linePath(curve.map(([t, v]) => [t, clip(v)]), sx, sy)" class="pdf" />
          </template>
          <template v-else>
            <rect v-for="[j, v] in bars" :key="j" :x="sx(j - 0.38)" :y="sy(v)" :width="sx(0.76) - sx(0)" :height="sy(0) - sy(v)" :class="j <= kCut ? 'bar on' : 'bar'" />
          </template>
        </Plot>
        <div v-if="d.cont" class="readout">
          <template v-if="mode === 'x2p'">
            P(X ≤ {{ x }}) = <b>{{ fp(lower) }}</b>，P(X > {{ x }}) = <b>{{ fp(1 - lower) }}</b>
            <template v-if="d.sym">；双侧 P(|X − {{ d.center(par) }}| ≥ |{{ x }} − {{ d.center(par) }}|) = <b>{{ fp(twoSided) }}</b></template>
          </template>
          <template v-else-if="pOk">
            下侧 {{ p }} 分位数（茆书记号，P(X ≤ x) = {{ p }}）：<b>{{ f4(qLow) }}</b><br>
            上侧 {{ p }} 分位数（经管类教材记号，P(X > x) = {{ p }}）：<b>{{ f4(qUp) }}</b>
          </template>
          <span v-else class="bad">概率 p 须在 0 与 1 之间</span>
        </div>
        <div v-else class="readout">
          <template v-if="mode === 'x2p'">
            P(X = {{ k }}) = <b>{{ fp(d.pmf(k, par)) }}</b>，P(X ≤ {{ k }}) = <b>{{ fp(d.cdf(k, par)) }}</b>，P(X ≥ {{ k }}) = <b>{{ fp(1 - (k > 0 ? d.cdf(k - 1, par) : 0)) }}</b>
          </template>
          <template v-else-if="pOk">
            使 P(X ≤ k) ≥ {{ p }} 的最小 k：<b>{{ kLow }}</b>（P(X ≤ {{ kLow }}) = {{ fp(d.cdf(kLow, par)) }}）<br>
            使 P(X ≥ k) ≤ {{ p }} 的最小 k：<b>{{ kUp }}</b>（右侧检验的临界值，P(X ≥ {{ kUp }}) = {{ fp(1 - (kUp > 0 ? d.cdf(kUp - 1, par) : 0)) }}）
          </template>
          <span v-else class="bad">概率 p 须在 0 与 1 之间</span>
        </div>
        <table v-if="d.cont" class="qt">
          <thead><tr><th>下侧概率 p</th><th v-for="[q] in table" :key="q">{{ q }}</th></tr></thead>
          <tbody>
            <tr><td>下侧 p 分位数</td><td v-for="[q, a] in table" :key="q">{{ f4(a) }}</td></tr>
            <tr><td>也就是上侧 α 分位数，α =</td><td v-for="[q] in table" :key="q">{{ +(1 - q).toFixed(3) }}</td></tr>
          </tbody>
        </table>
      </template>
    </div>
  </div>
</template>

<style scoped>
.pdf { fill: none; stroke: var(--c-s1); stroke-width: 2; }
.area { fill: color-mix(in srgb, var(--c-s1) 25%, transparent); }
.area.up { fill: color-mix(in srgb, var(--c-s4) 25%, transparent); }
.bar { fill: color-mix(in srgb, var(--c-s1) 30%, transparent); }
.bar.on { fill: color-mix(in srgb, var(--c-s1) 70%, transparent); }
.qt { margin: 12px 0 0; font-size: 13px; font-variant-numeric: tabular-nums; }
.qt th, .qt td { padding: 4px 8px; text-align: right; }
.qt td:first-child, .qt th:first-child { text-align: left; }
</style>
