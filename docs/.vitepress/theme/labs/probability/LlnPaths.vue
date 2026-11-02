<script setup>
// 大数定律：许多条“累计平均”路径在漏斗 μ ± 2σ/√n 内收拢；柯西分布没有期望，路径不收敛
import { computed, ref, watch } from 'vue'
import Plot, { linePath } from '../../components/Plot.vue'

const D = {
  coin: { name: '抛硬币 b(1, 0.5)', mu: 0.5, sd: 0.5, draw: () => (Math.random() < 0.5 ? 1 : 0), yr: [0, 1], eps: 0.05 },
  unif: { name: '均匀 U(0, 1)', mu: 0.5, sd: Math.sqrt(1 / 12), draw: () => Math.random(), yr: [0, 1], eps: 0.05 },
  exp: { name: '指数 Exp(1)', mu: 1, sd: 1, draw: () => -Math.log(1 - Math.random()), yr: [0, 2.5], eps: 0.1 },
  cauchy: { name: '柯西分布（期望不存在）', mu: 0, sd: Infinity, draw: () => Math.tan(Math.PI * (Math.random() - 0.5)), yr: [-6, 6], eps: 0.5 },
}
const key = ref('coin')
const N = 3000, M = 300, SHOW = 20
const ns = Array.from({ length: 120 }, (_, i) => Math.round(10 ** ((Math.log10(N) * i) / 119)))
  .filter((v, i, a) => i === 0 || v !== a[i - 1])
const paths = ref([])
const finals = ref([])
function run() {
  const d = D[key.value], keep = new Set(ns)
  const ps = [], fs = []
  for (let m = 0; m < M; m++) {
    let s = 0
    const pts = []
    for (let n = 1; n <= N; n++) {
      s += d.draw()
      if (m < SHOW && keep.has(n)) pts.push([Math.log10(n), s / n])
    }
    if (m < SHOW) ps.push(pts)
    fs.push(s / N)
  }
  paths.value = ps
  finals.value = fs
}
watch(key, run, { immediate: true })

const d = computed(() => D[key.value])
const eps = ref(0.05)
watch(key, () => { eps.value = D[key.value].eps }, { immediate: true })
const funnel = computed(() => (Number.isFinite(d.value.sd)
  ? [ns.map((n) => [Math.log10(n), d.value.mu + (2 * d.value.sd) / Math.sqrt(n)]), ns.map((n) => [Math.log10(n), d.value.mu - (2 * d.value.sd) / Math.sqrt(n)])]
  : []))
const clip = (pts) => pts.map(([x, y]) => [x, Math.min(d.value.yr[1], Math.max(d.value.yr[0], y))])
const outside = computed(() => finals.value.filter((v) => Math.abs(v - d.value.mu) >= eps.value).length / M)
const cheb = computed(() => (Number.isFinite(d.value.sd) ? Math.min(1, d.value.sd ** 2 / (N * eps.value ** 2)) : null))
</script>

<template>
  <div class="lab">
    <header>大数定律：累计平均的收拢</header>
    <div class="body">
      <div class="controls">
        <label>每次观测的分布
          <select v-model="key"><option v-for="(v, k) in D" :key="k" :value="k">{{ v.name }}</option></select>
        </label>
        <label>偏差 ε <input v-model.number="eps" type="range" min="0.01" max="1" step="0.01"><span class="val">{{ eps.toFixed(2) }}</span></label>
      </div>
      <div class="btns"><button class="btn" @click="run">重新模拟</button></div>
      <Plot v-slot="{ sx, sy }" :x="[0, Math.log10(N)]" :y="d.yr" :height="280" :xticks="[0, 1, 2, 3]" :xfmt="(v) => String(10 ** v)">
        <template v-if="funnel.length">
          <path :d="linePath(clip(funnel[0]), sx, sy)" class="funnel" />
          <path :d="linePath(clip(funnel[1]), sx, sy)" class="funnel" />
        </template>
        <rect :x="sx(0)" :y="sy(Math.min(d.yr[1], d.mu + eps))" :width="sx(Math.log10(N)) - sx(0)" :height="sy(Math.max(d.yr[0], d.mu - eps)) - sy(Math.min(d.yr[1], d.mu + eps))" class="band" />
        <path v-for="(p, i) in paths" :key="i" :d="linePath(clip(p), sx, sy)" class="path" />
        <line :x1="sx(0)" :x2="sx(Math.log10(N))" :y1="sy(d.mu)" :y2="sy(d.mu)" class="mu" />
      </Plot>
      <div class="cap">横轴为观测次数 n（对数刻度），纵轴为前 n 次观测的平均值；灰色带为 μ ± ε，虚线漏斗为 μ ± 2σ/√n。图中画了 {{ SHOW }} 条路径。</div>
      <div class="readout">
        在 {{ M }} 条路径中，n = {{ N }} 时平均值偏离 μ 至少 ε 的比例为 <b>{{ (outside * 100).toFixed(1) }}%</b>；
        <template v-if="cheb !== null">切比雪夫上界 σ²/(nε²) = <b>{{ (cheb * 100).toFixed(1) }}%</b>。</template>
        <template v-else><span class="bad">柯西分布没有期望，累计平均不会收敛：偶尔出现的巨大观测值会把它一下子拽走。</span></template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.path { fill: none; stroke: var(--c-s1); stroke-width: 1.1; opacity: 0.6; }
.funnel { fill: none; stroke: var(--c-s2); stroke-width: 1.8; stroke-dasharray: 6 4; }
.band { fill: color-mix(in srgb, var(--vp-c-text-3) 14%, transparent); }
.mu { stroke: var(--c-s4); stroke-width: 1.5; }
</style>
