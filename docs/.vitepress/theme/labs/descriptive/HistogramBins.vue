<script setup>
// 直方图的组距与起点：同一组数据，分组方式不同，图形的“故事”可能完全不同；下方是箱线图与茎叶图
import { computed, ref } from 'vue'
import Plot from '../../components/Plot.vue'

// 固定种子的伪随机数，保证每次打开看到同一组“模拟成绩”
function rng(seed) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
const r = rng(20240901)
const gauss = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r())
const data = Array.from({ length: 200 }, () => Math.round(Math.min(99, Math.max(25, r() < 0.6 ? 79 + 7 * gauss() : 58 + 7 * gauss())))).sort((a, b) => a - b)

const width = ref(10)
const start = ref(0)
const bins = computed(() => {
  const w = width.value, a = 20 + (start.value % w) - w, out = []
  for (let lo = a; lo < 100; lo += w) out.push({ lo, hi: lo + w, c: data.filter((x) => x >= lo && x < lo + w).length })
  return out.filter((b) => b.hi > 20)
})
const cmax = computed(() => Math.max(...bins.value.map((b) => b.c)) * 1.15)
const q = (p) => { const i = (data.length - 1) * p, lo = Math.floor(i); return data[lo] + (data[Math.ceil(i)] - data[lo]) * (i - lo) }
const five = { min: data[0], q1: q(0.25), med: q(0.5), q3: q(0.75), max: data[data.length - 1] }
const iqr = five.q3 - five.q1
const fence = [five.q1 - 1.5 * iqr, five.q3 + 1.5 * iqr]
const inside = data.filter((x) => x >= fence[0] && x <= fence[1])
const whisker = [inside[0], inside[inside.length - 1]]
const outliers = data.filter((x) => x < fence[0] || x > fence[1])
const sturges = Math.ceil(1 + Math.log2(data.length))
const stems = computed(() => {
  const m = new Map()
  for (const x of data) { const s = Math.floor(x / 10); m.set(s, (m.get(s) ?? '') + (x % 10)) }
  return [...m].map(([s, leaves]) => `${String(s).padStart(2)} | ${leaves}`)
})
</script>

<template>
  <div class="lab">
    <header>直方图：组距与起点的影响</header>
    <div class="body">
      <div class="controls">
        <label>组距 <input v-model.number="width" type="range" min="1" max="20" step="1"><span class="val">{{ width }}</span></label>
        <label>起点偏移 <input v-model.number="start" type="range" min="0" max="19" step="1"><span class="val">{{ start % width }}</span></label>
      </div>
      <Plot v-slot="{ sx, sy }" :x="[20, 100]" :y="[0, cmax]" :height="230" ylabel="人数">
        <rect v-for="(b, i) in bins" :key="i" :x="sx(b.lo)" :y="sy(b.c)" :width="Math.max(0, sx(b.hi) - sx(b.lo) - 1)" :height="sy(0) - sy(b.c)" class="bar" />
      </Plot>
      <Plot v-slot="{ sx, sy }" :x="[20, 100]" :y="[0, 1]" :height="90" :yticks="[]">
        <line :x1="sx(whisker[0])" :x2="sx(five.q1)" :y1="sy(0.5)" :y2="sy(0.5)" class="wh" />
        <line :x1="sx(five.q3)" :x2="sx(whisker[1])" :y1="sy(0.5)" :y2="sy(0.5)" class="wh" />
        <rect :x="sx(five.q1)" :y="sy(0.85)" :width="sx(five.q3) - sx(five.q1)" :height="sy(0.15) - sy(0.85)" class="box" />
        <line :x1="sx(five.med)" :x2="sx(five.med)" :y1="sy(0.85)" :y2="sy(0.15)" class="med" />
        <line v-for="(x, i) in whisker" :key="'w' + i" :x1="sx(x)" :x2="sx(x)" :y1="sy(0.7)" :y2="sy(0.3)" class="wh" />
        <circle v-for="(x, i) in outliers" :key="'o' + i" :cx="sx(x)" :cy="sy(0.5)" r="3.5" class="out" />
      </Plot>
      <div class="cap">箱线图：箱体为 Q₁ 到 Q₃，中线为中位数，须线延伸到 1.5 倍四分位距以内最远的数据，圆点为离群值</div>
      <div class="readout">
        200 名学生的考试成绩（模拟数据）。当前分成 {{ bins.length }} 组；按斯特奇斯公式 k ≈ 1 + log₂n，建议约 {{ sturges }} 组。<br>
        五数概括：最小 {{ five.min }}，Q₁ = {{ five.q1 }}，中位数 {{ five.med }}，Q₃ = {{ five.q3 }}，最大 {{ five.max }}；四分位距 IQR = {{ iqr }}；离群值 {{ outliers.length ? outliers.join('、') : '无' }}。
      </div>
      <details class="stem">
        <summary>展开茎叶图（茎为十位，叶为个位）</summary>
        <pre>{{ stems.join('\n') }}</pre>
      </details>
    </div>
  </div>
</template>

<style scoped>
.bar { fill: color-mix(in srgb, var(--c-s1) 55%, transparent); }
.box { fill: color-mix(in srgb, var(--c-s3) 18%, transparent); stroke: var(--c-s3); stroke-width: 1.5; }
.med { stroke: var(--c-s4); stroke-width: 2.5; }
.wh { stroke: var(--c-s3); stroke-width: 1.5; }
.out { fill: none; stroke: var(--c-s4); stroke-width: 1.5; }
.stem { margin-top: 10px; }
.stem summary { cursor: pointer; font-size: 13px; color: var(--vp-c-text-2); }
.stem pre { overflow-x: auto; font-size: 12px; line-height: 1.5; }
</style>
