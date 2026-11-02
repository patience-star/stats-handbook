<script setup>
// 平均发展速度的两种算法。水平法 x̄ = (aₙ/a₀)^(1/n) 只看首末两期，对数坐标下就是连接首末两点的直线的斜率；
// 方程式法要求“按 x̄ 匀速发展”的假想路径各期之和等于实际各期之和
import { computed, ref } from 'vue'
import Plot, { linePath } from '../../components/Plot.vue'
import china from '../../data/china.json'

const n = 8
const gdp = china.gdp.values.slice(15, 24)   // 2015—2023
const presets = [
  ['先快后慢', 100, [16, 14, 12, 10, 8, 6, 4, 2]],
  ['先慢后快', 100, [2, 4, 6, 8, 10, 12, 14, 16]],
  ['先跌后涨', 100, [-10, -8, -4, 6, 14, 22, 26, 34]],
  ['中国 GDP 2015—2023（美元现价）', gdp[0], gdp.slice(1).map((v, i) => (v / gdp[i] - 1) * 100)],
]
const k = ref(0)
const a0 = ref(100)
const g = ref([...presets[0][2]])
const logScale = ref(false)
function load(i) {
  k.value = i
  a0.value = presets[i][1]
  g.value = [...presets[i][2]]
}
const isGdp = computed(() => k.value === 3)

const levels = computed(() => g.value.reduce((a, r) => [...a, a.at(-1) * (1 + r / 100)], [a0.value]))
const total = computed(() => levels.value.slice(1).reduce((s, v) => s + v, 0))
const xg = computed(() => (levels.value[n] / a0.value) ** (1 / n))
// 方程式法：x + x² + … + xⁿ = Σaᵢ / a₀，左边单调递增，二分求根
const xc = computed(() => {
  const S = total.value / a0.value
  let lo = 0.01, hi = 3
  for (let it = 0; it < 60; it++) {
    const mid = (lo + hi) / 2
    let s = 0, p = 1
    for (let i = 1; i <= n; i++) s += (p *= mid)
    if (s < S) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
})
const arith = computed(() => g.value.reduce((s, r) => s + 1 + r / 100, 0) / n)
const path = (x) => Array.from({ length: n + 1 }, (_, t) => a0.value * x ** t)
const pg = computed(() => path(xg.value))
const pc = computed(() => path(xc.value))
const sumOf = (p) => p.slice(1).reduce((s, v) => s + v, 0)

const all = computed(() => [...levels.value, ...pg.value, ...pc.value])
const tf = (v) => (logScale.value ? Math.log(v) : v)
const yr = computed(() => {
  const lo = Math.min(...all.value), hi = Math.max(...all.value)
  return logScale.value ? [Math.log(lo * 0.9), Math.log(hi * 1.08)] : [0, hi * 1.08]
})
const logTicks = computed(() => {
  const [a, b] = yr.value.map(Math.exp), out = []
  for (let m = 10 ** Math.floor(Math.log10(a)); m <= b; m *= 10) for (const c of [1, 1.5, 2, 3, 5, 7]) if (c * m >= a && c * m <= b) out.push(Math.log(c * m))
  return out
})
const pts = (p) => p.map((v, t) => [t, tf(v)])
const lab = (t) => (isGdp.value ? String(2015 + t) : String(t))
const f4 = (v) => v.toFixed(4)
const pct = (v) => ((v - 1) * 100).toFixed(2) + '%'
const f1 = (v) => (Math.abs(v) >= 1000 ? v.toFixed(0) : v.toFixed(1))
</script>

<template>
  <div class="lab">
    <header>平均发展速度：只看首末，还是看全程</header>
    <div class="body">
      <div class="btns">
        <button v-for="(p, i) in presets" :key="i" class="btn" :class="{ on: k === i }" @click="load(i)">{{ p[0] }}</button>
        <button class="btn" :class="{ on: logScale }" @click="logScale = !logScale">对数坐标</button>
      </div>
      <div class="controls">
        <label v-for="i in n" :key="i">{{ isGdp ? 2015 + i + ' 年' : '第 ' + i + ' 期' }} <input v-model.number="g[i - 1]" type="range" min="-20" max="40" step="0.1"><span class="val">{{ g[i - 1].toFixed(1) }}%</span></label>
      </div>
      <Plot v-slot="{ sx, sy }" :x="[-0.6, n + 0.6]" :y="yr" :height="260" :xticks="Array.from({ length: n + 1 }, (_, t) => t)" :xfmt="lab" :yticks="logScale ? logTicks : undefined" :yfmt="logScale ? (v) => f1(Math.exp(v)) : undefined">
        <template v-if="!logScale">
          <rect v-for="(v, t) in levels" :key="t" :x="sx(t - 0.32)" :y="sy(v)" :width="sx(0.64) - sx(0)" :height="sy(0) - sy(v)" :class="t ? 'bar' : 'bar0'" />
        </template>
        <template v-else>
          <path :d="linePath(pts(levels), sx, sy)" class="actual" />
          <circle v-for="(v, t) in levels" :key="t" :cx="sx(t)" :cy="sy(tf(v))" r="4" class="dot" />
        </template>
        <path :d="linePath(pts(pg), sx, sy)" class="geo" />
        <path :d="linePath(pts(pc), sx, sy)" class="eq" />
      </Plot>
      <div class="cap">
        <span class="sw bar" /> 实际水平 a<sub>t</sub>　<span class="sw geo" /> 水平法：a₀x̄<sup>t</sup> 恰好到达 a<sub>n</sub>　<span class="sw eq" /> 方程式法：a₀x̄<sup>t</sup> 各期之和 = 实际各期之和
      </div>
      <div class="readout">
        定基发展速度 a<sub>{{ n }}</sub>/a₀ = 各期环比之积 = {{ f4(levels[n] / a0) }}<br>
        水平法：x̄ = (a<sub>{{ n }}</sub>/a₀)<sup>1/{{ n }}</sup> = <b>{{ f4(xg) }}</b>，平均增长 {{ pct(xg) }}；假想路径之和 {{ f1(sumOf(pg)) }}<br>
        方程式法：x̄ + x̄² + … + x̄<sup>{{ n }}</sup> = Σa<sub>i</sub>/a₀ = {{ f4(total / a0) }} ⇒ x̄ = <b>{{ f4(xc) }}</b>，平均增长 {{ pct(xc) }}；假想路径之和 {{ f1(sumOf(pc)) }} = 实际之和 {{ f1(total) }}<br>
        对照：环比发展速度的算术平均 = {{ f4(arith) }}，不小于几何平均 {{ f4(xg) }}——用它连乘 {{ n }} 期会超过实际的 a<sub>{{ n }}</sub>。
      </div>
    </div>
  </div>
</template>

<style scoped>
.bar { fill: color-mix(in srgb, var(--c-s1) 30%, transparent); }
.bar0 { fill: color-mix(in srgb, var(--vp-c-text-3) 30%, transparent); }
.actual { fill: none; stroke: var(--c-s1); stroke-width: 1.6; }
.dot { fill: var(--c-s1); }
.geo { fill: none; stroke: var(--c-s2); stroke-width: 2.4; }
.eq { fill: none; stroke: var(--c-s3); stroke-width: 2.4; stroke-dasharray: 6 4; }
.sw { display: inline-block; width: 14px; height: 4px; margin: 0 4px 0 6px; vertical-align: 3px; }
.sw.bar { height: 10px; vertical-align: -1px; background: color-mix(in srgb, var(--c-s1) 30%, transparent); }
.sw.geo { background: var(--c-s2); }
.sw.eq { background: var(--c-s3); }
</style>
