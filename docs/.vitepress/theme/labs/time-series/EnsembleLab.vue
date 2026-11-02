<script setup>
// 系综与平稳性：同一个随机过程的许多条样本路径。固定时刻 t 作竖直截面，就得到 X_t 的分布；
// 平稳意味着这些截面的分布不随 t 改变。遍历性则问：一条路径的时间平均能否代替截面上的平均
import { computed, ref } from 'vue'
import Plot, { linePath } from '../../components/Plot.vue'
import { noise } from '../../lib/ts.js'

const T = 100, M = 200, SHOW = 24
const PHI = 0.8, A = 2, PERIOD = 20
const procs = [
  ['wn', '白噪声'],
  ['ar1', `AR(1)，φ = ${PHI}`],
  ['rw', '随机游走'],
  ['trend', '趋势 + 噪声'],
  ['phase', '随机相位的余弦波'],
  ['const', '常数随机变量 X_t = Z'],
]
const which = ref('ar1')
const seed = ref(0)
const paths = computed(() => {
  void seed.value // 依赖：点“重新抽样”时重算
  return Array.from({ length: M }, () => {
    const e = noise(T)
    switch (which.value) {
      case 'wn': return e
      case 'ar1': {
        let x = e[0] / Math.sqrt(1 - PHI * PHI)   // 从平稳分布出发
        return e.map((v, t) => (t ? (x = PHI * x + v) : x))
      }
      case 'rw': {
        let x = 0
        return e.map((v) => (x += v))
      }
      case 'trend': return e.map((v, t) => 0.05 * t + v)
      case 'phase': {
        const th = Math.random() * 2 * Math.PI
        return e.map((_, t) => A * Math.cos((2 * Math.PI * t) / PERIOD + th))
      }
      default: return Array(T).fill(e[0])
    }
  })
})
// 理论均值与标准差（随机游走从 X_0 = 0 出发，第 t 期方差为 t + 1）
const theory = (t) => ({
  wn: [0, 1], ar1: [0, 1 / Math.sqrt(1 - PHI * PHI)], rw: [0, Math.sqrt(t + 1)],
  trend: [0.05 * t, 1], phase: [0, A / Math.SQRT2], const: [0, 1],
})[which.value]
const stats = computed(() => Array.from({ length: T }, (_, t) => {
  let s = 0, q = 0
  for (const p of paths.value) { s += p[t]; q += p[t] * p[t] }
  const m = s / M
  return { m, sd: Math.sqrt(q / M - m * m) }
}))
const yr = computed(() => (which.value === 'rw' ? [-25, 25] : [-6, 6]))
const pts = (arr) => arr.map((v, t) => [t, v])
const band = computed(() => {
  const up = stats.value.map((s, t) => [t, s.m + 2 * s.sd]), lo = stats.value.map((s, t) => [t, s.m - 2 * s.sd]).reverse()
  return [...up, ...lo]
})
const theoUp = computed(() => Array.from({ length: T }, (_, t) => { const [m, s] = theory(t); return [t, m + 2 * s] }))
const theoLo = computed(() => Array.from({ length: T }, (_, t) => { const [m, s] = theory(t); return [t, m - 2 * s] }))
const timeAvg = computed(() => paths.value[0].reduce((s, v) => s + v, 0) / T)
const slice = (t) => stats.value[t]
const f2 = (v) => v.toFixed(2).replace('-', '−')
const poly = (pts2, sx, sy) => pts2.map(([x, y]) => `${sx(x)},${sy(y)}`).join(' ')
const stationary = computed(() => !['rw', 'trend'].includes(which.value))
</script>

<template>
  <div class="lab">
    <header>系综：同一个过程的许多条路径</header>
    <div class="body">
      <div class="btns">
        <button v-for="[k, name] in procs" :key="k" class="btn" :class="{ on: which === k }" @click="which = k">{{ name }}</button>
        <button class="btn" @click="seed++">重新抽样</button>
      </div>
      <Plot v-slot="{ sx, sy }" :x="[0, T - 1]" :y="yr" :height="260" xlabel="t">
        <polygon :points="poly(band, sx, sy)" class="band" />
        <path v-for="i in SHOW" :key="i" :d="linePath(pts(paths[i]), sx, sy)" class="faint" />
        <path :d="linePath(pts(paths[0]), sx, sy)" class="one" />
        <path :d="linePath(stats.map((s, t) => [t, s.m]), sx, sy)" class="mean" />
        <path :d="linePath(theoUp, sx, sy)" class="theo" />
        <path :d="linePath(theoLo, sx, sy)" class="theo" />
        <line v-for="t in [25, 80]" :key="t" :x1="sx(t)" :x2="sx(t)" :y1="sy(yr[0])" :y2="sy(yr[1])" class="cut" />
      </Plot>
      <div class="cap">
        灰线：{{ SHOW }} 条样本路径；<span class="sw one" /> 其中一条；阴影：{{ M }} 条路径在每个时刻的均值 ± 2 倍标准差；<span class="sw mean" /> 截面均值；虚线：理论的均值 ± 2 倍标准差；竖线：t = 25 与 t = 80 两个截面
      </div>
      <div class="readout">
        截面 t = 25：均值 {{ f2(slice(25).m) }}，标准差 {{ f2(slice(25).sd) }}；截面 t = 80：均值 {{ f2(slice(80).m) }}，标准差 {{ f2(slice(80).sd) }}
        <b v-if="stationary" class="good">——两个截面的分布相同（在抽样误差范围内）</b><b v-else class="bad">——截面的分布随时间变化，不平稳</b><br>
        橙色路径的时间平均 = {{ f2(timeAvg) }}，各截面均值的平均 = {{ f2(stats.reduce((s, v) => s + v.m, 0) / T) }}
        <template v-if="which === 'const'">——每条路径都是一条水平线，时间平均就是它自己的 Z，<b class="bad">一条路径无法估计系综均值（不遍历）</b></template>
        <template v-else-if="which === 'phase'">——每条路径都是确定的余弦波，但相位随机，时间平均仍接近 0</template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.band { fill: color-mix(in srgb, var(--c-s1) 14%, transparent); }
.faint { fill: none; stroke: var(--vp-c-text-3); stroke-opacity: 0.35; stroke-width: 1; }
.one { fill: none; stroke: var(--c-s2); stroke-width: 2; }
.mean { fill: none; stroke: var(--c-s1); stroke-width: 2.2; }
.theo { fill: none; stroke: var(--c-s4); stroke-width: 1.5; stroke-dasharray: 5 4; }
.cut { stroke: var(--vp-c-text-2); stroke-width: 1; stroke-dasharray: 2 3; }
.sw { display: inline-block; width: 14px; height: 3px; margin: 0 4px 0 6px; vertical-align: 3px; }
.sw.one { background: var(--c-s2); }
.sw.mean { background: var(--c-s1); }
</style>
