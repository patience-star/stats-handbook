<script setup>
// 蒲丰投针：长为 l 的针随机落在间距为 d 的平行线之间，相交概率 2l/(πd)；右图是样本空间 (θ, x) 上的几何概率
import { computed, onUnmounted, ref, watch } from 'vue'
import Plot, { linePath } from '../../components/Plot.vue'

const ratio = ref(0.8)        // l / d
const needles = ref([])       // 最近若干根针：{ cx, cy, th, x, hit }
const n = ref(0)
const k = ref(0)
const trace = ref([])         // [投针数, π 的估计]
const auto = ref(false)
const SHOW = 300
const D = 60, LINES = [30, 90, 150, 210, 270]   // 左图：线距 60 像素

function drop(m) {
  const hl = (ratio.value * D) / 2
  const add = []
  for (let i = 0; i < m; i++) {
    const cx = 20 + Math.random() * 360, cy = 30 + Math.random() * 240, th = Math.random() * Math.PI
    const x = Math.min(...LINES.map((y) => Math.abs(cy - y))) / D   // 中点到最近直线的距离（以 d 为单位）
    const hit = x * D <= hl * Math.sin(th)
    add.push({ cx, cy, th, x, hit })
    n.value++
    if (hit) k.value++
  }
  needles.value = [...needles.value, ...add].slice(-SHOW)
  if (k.value) trace.value = [...trace.value, [n.value, (2 * ratio.value * n.value) / k.value]].slice(-400)
}
function clear() {
  needles.value = []
  trace.value = []
  n.value = 0
  k.value = 0
}
watch(ratio, clear)

let timer = 0
watch(auto, (on) => {
  clearInterval(timer)
  if (on) timer = setInterval(() => drop(5), 60)
})
onUnmounted(() => clearInterval(timer))

const piHat = computed(() => (k.value ? (2 * ratio.value * n.value) / k.value : null))
const curve = computed(() => Array.from({ length: 61 }, (_, i) => { const t = (Math.PI * i) / 60; return [t, (ratio.value / 2) * Math.sin(t)] }))
const ends = (p) => {
  const hl = (ratio.value * D) / 2, dx = hl * Math.cos(p.th), dy = hl * Math.sin(p.th)
  return { x1: p.cx - dx, y1: p.cy - dy, x2: p.cx + dx, y2: p.cy + dy }
}
const yr = [2.6, 3.8]
</script>

<template>
  <div class="lab">
    <header>蒲丰投针：用随机性估计 π</header>
    <div class="body">
      <div class="controls">
        <label>针长 / 线距 l/d <input v-model.number="ratio" type="range" min="0.2" max="1" step="0.05"><span class="val">{{ ratio.toFixed(2) }}</span></label>
      </div>
      <div class="btns">
        <button class="btn" @click="drop(1)">投 1 根</button>
        <button class="btn" @click="drop(100)">投 100 根</button>
        <button class="btn" @click="drop(5000)">投 5000 根</button>
        <button class="btn" :class="{ on: auto }" @click="auto = !auto">{{ auto ? '停止' : '自动投针' }}</button>
        <button class="btn" @click="clear">清空</button>
      </div>
      <div class="grid2">
        <div class="panel">
          <svg viewBox="0 0 400 300" class="board">
            <line v-for="y in LINES" :key="y" x1="0" x2="400" :y1="y" :y2="y" class="rule" />
            <line v-for="(p, i) in needles" :key="i" v-bind="ends(p)" :class="p.hit ? 'hit' : 'miss'" />
          </svg>
          <div class="cap">最近 {{ SHOW }} 根针；红色与直线相交</div>
        </div>
        <div class="panel">
          <Plot v-slot="{ sx, sy }" :x="[0, Math.PI]" :y="[0, 0.5]" :height="230" :xticks="[0, Math.PI / 2, Math.PI]" :xfmt="(v) => ['0', 'π/2', 'π'][Math.round(v / (Math.PI / 2))]" :yticks="[0, 0.25, 0.5]">
            <path :d="linePath([[0, 0], ...curve, [Math.PI, 0]], sx, sy) + 'Z'" class="region" />
            <path :d="linePath(curve, sx, sy)" class="edge" />
            <circle v-for="(p, i) in needles" :key="i" :cx="sx(p.th)" :cy="sy(p.x)" r="2.2" :class="p.hit ? 'dot-hit' : 'dot-miss'" />
          </Plot>
          <div class="cap">样本空间：横轴 θ，纵轴 x（以 d 为单位）。阴影 x ≤ (l/2)·sin θ 就是“相交”</div>
        </div>
      </div>
      <div class="readout">
        已投 <b>{{ n }}</b> 根，相交 <b>{{ k }}</b> 根，频率 {{ n ? (k / n).toFixed(4) : '—' }}；
        理论概率 2l/(πd) = {{ ((2 * ratio) / Math.PI).toFixed(4) }}。<br>
        π 的估计 2l·n / (d·k) = <b>{{ piHat ? piHat.toFixed(4) : '—' }}</b>
      </div>
      <Plot v-if="trace.length > 1" v-slot="{ sx, sy }" :x="[0, n]" :y="yr" :height="150" :yticks="[2.8, 3.14159, 3.6]" :yfmt="(v) => (Math.abs(v - Math.PI) < 1e-3 ? 'π' : v.toFixed(1))">
        <line :x1="sx(0)" :x2="sx(n)" :y1="sy(Math.PI)" :y2="sy(Math.PI)" class="pi" />
        <path :d="linePath(trace.map(([a, b]) => [a, Math.min(3.8, Math.max(2.6, b))]), sx, sy)" class="c1" fill="none" stroke="currentColor" stroke-width="1.6" />
      </Plot>
    </div>
  </div>
</template>

<style scoped>
.board { width: 100%; height: auto; display: block; background: var(--vp-c-bg); border-radius: 8px; }
.rule { stroke: var(--vp-c-text-2); stroke-width: 1.5; }
.hit { stroke: var(--c-s4); stroke-width: 1.6; }
.miss { stroke: var(--c-s1); stroke-width: 1.2; opacity: 0.55; }
.region { fill: color-mix(in srgb, var(--c-s4) 16%, transparent); }
.edge { fill: none; stroke: var(--c-s4); stroke-width: 1.5; }
.dot-hit { fill: var(--c-s4); }
.dot-miss { fill: var(--c-s1); opacity: 0.5; }
.pi { stroke: var(--c-s2); stroke-dasharray: 5 4; stroke-width: 1.5; }
</style>
