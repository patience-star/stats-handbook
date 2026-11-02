<script setup>
// 秩和检验：只用秩，不用原始数值。H₀ 下，12 个秩随机分给两组的 C(12, 6) = 924 种分法等可能，
// 由此精确地得到第一组秩和 W 的分布（置换分布），p 值就是比观测值更极端的分法所占的比例
import { computed, ref, watch } from 'vue'
import jStat from 'jstat'
import Plot from '../../components/Plot.vue'

const N1 = 6, N2 = 6, N = N1 + N2
const shift = ref(1)
const heavy = ref(false)
const a = ref([])
const b = ref([])
const noise = () => (heavy.value ? jStat.studentt.sample(1) : jStat.normal.sample(0, 1))
function gen() {
  a.value = Array.from({ length: N1 }, () => +(10 + noise()).toFixed(2))
  b.value = Array.from({ length: N2 }, () => +(10 + shift.value + noise()).toFixed(2))
}
watch([shift, heavy], gen, { immediate: true })

const all = computed(() => [...a.value.map((v) => ({ v, g: 'A' })), ...b.value.map((v) => ({ v, g: 'B' }))].sort((p, q) => p.v - q.v).map((o, i) => ({ ...o, r: i + 1 })))
const W = computed(() => all.value.filter((o) => o.g === 'A').reduce((s, o) => s + o.r, 0))
// 精确置换分布：从 1..N 中取 N1 个数，和为 s 的取法数（动态规划）
const dist = (() => {
  const ways = Array.from({ length: N1 + 1 }, () => Array(N * (N + 1) / 2 + 1).fill(0))
  ways[0][0] = 1
  for (let r = 1; r <= N; r++) for (let k = Math.min(r, N1); k >= 1; k--) for (let s = r; s < ways[k].length; s++) ways[k][s] += ways[k - 1][s - r]
  const total = ways[N1].reduce((x, y) => x + y, 0)
  return ways[N1].map((c, s) => [s, c / total]).filter(([, p]) => p > 0)
})()
const EW = (N1 * (N + 1)) / 2
const pval = computed(() => dist.filter(([s]) => Math.abs(s - EW) >= Math.abs(W.value - EW) - 1e-9).reduce((t, [, p]) => t + p, 0))
const tP = computed(() => {
  const m = (x) => x.reduce((s, v) => s + v, 0) / x.length
  const sw = Math.sqrt(((N1 - 1) * jStat.variance(a.value, true) + (N2 - 1) * jStat.variance(b.value, true)) / (N - 2))
  const t = (m(a.value) - m(b.value)) / (sw * Math.sqrt(1 / N1 + 1 / N2))
  return 2 * (1 - jStat.studentt.cdf(Math.abs(t), N - 2))
})
const ymax = Math.max(...dist.map(([, p]) => p)) * 1.15
const xr = computed(() => { const vs = all.value.map((o) => o.v); const lo = Math.min(...vs), hi = Math.max(...vs), pad = (hi - lo) * 0.06 + 0.1; return [lo - pad, hi + pad] })
</script>

<template>
  <div class="lab">
    <header>秩和检验的置换分布</header>
    <div class="body">
      <div class="controls">
        <label>B 组比 A 组的平均移动 <input v-model.number="shift" type="range" min="0" max="3" step="0.1"><span class="val">{{ shift.toFixed(1) }}</span></label>
        <label><input v-model="heavy" type="checkbox"> 误差来自柯西分布（厚尾）</label>
      </div>
      <div class="btns"><button class="btn" @click="gen">重新生成两组数据</button></div>
      <Plot v-slot="{ sx, sy }" :x="xr" :y="[0, 1]" :height="110" :yticks="[]">
        <template v-for="o in all" :key="o.r">
          <circle :cx="sx(o.v)" :cy="sy(o.g === 'A' ? 0.68 : 0.32)" r="7" :class="o.g === 'A' ? 'ga' : 'gb'" />
          <text :x="sx(o.v)" :y="sy(o.g === 'A' ? 0.68 : 0.32) + 4" text-anchor="middle" class="rk">{{ o.r }}</text>
        </template>
        <text :x="sx(xr[0]) + 4" :y="sy(0.68) - 12" class="lbl">A 组</text>
        <text :x="sx(xr[0]) + 4" :y="sy(0.32) - 12" class="lbl">B 组</text>
      </Plot>
      <div class="cap">圆中的数字是秩（全部 12 个数据从小到大的名次）</div>
      <Plot v-slot="{ sx, sy }" :x="[20, 58]" :y="[0, ymax]" :height="190" xlabel="A 组秩和 W">
        <rect v-for="[s, p] in dist" :key="s" :x="sx(s - 0.45)" :y="sy(p)" :width="sx(s + 0.45) - sx(s - 0.45)" :height="sy(0) - sy(p)" :class="Math.abs(s - EW) >= Math.abs(W - EW) - 1e-9 ? 'tail' : 'bar'" />
        <line :x1="sx(W)" :x2="sx(W)" :y1="sy(0)" :y2="sy(ymax)" class="obs" />
      </Plot>
      <div class="cap">H₀ 下 W 的精确分布（924 种分法等可能），红色为与观测值同样极端或更极端的部分</div>
      <div class="readout">
        A 组秩和 W = <b>{{ W }}</b>（H₀ 下期望 {{ EW }}，方差 {{ (N1 * N2 * (N + 1)) / 12 }}）。精确双侧 p 值 = <b>{{ pval.toFixed(4) }}</b>；
        作为对比，两样本 t 检验的 p 值 = {{ tP.toFixed(4) }}。勾选“柯西分布”后多生成几次：极端值会严重干扰 t 检验，秩检验却几乎不受影响。
      </div>
    </div>
  </div>
</template>

<style scoped>
.ga { fill: var(--c-s1); }
.gb { fill: var(--c-s2); }
.rk { font-size: 10px; font-weight: 700; fill: #fff; }
.lbl { font-size: 12px; fill: var(--vp-c-text-2); }
.bar { fill: color-mix(in srgb, var(--c-s1) 45%, transparent); }
.tail { fill: color-mix(in srgb, var(--c-s4) 70%, transparent); }
.obs { stroke: var(--c-s4); stroke-width: 2; }
</style>
