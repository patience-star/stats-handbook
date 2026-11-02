<script setup>
// 协方差的矩形图：以均值点为一角、每个数据点为对角画矩形，右上/左下为正（红），左上/右下为负（蓝）；协方差 = 带符号面积的平均
import { computed, ref } from 'vue'
import jStat from 'jstat'
import Plot from '../../components/Plot.vue'

const rho = ref(0.6)
const pts = ref([])
function generate() {
  const r = rho.value
  pts.value = Array.from({ length: 12 }, () => {
    const z1 = jStat.normal.sample(0, 1), z2 = jStat.normal.sample(0, 1)
    const x = 5 + 1.6 * z1, y = 5 + 1.6 * (r * z1 + Math.sqrt(1 - r * r) * z2)
    return { x: Math.min(9.6, Math.max(0.4, x)), y: Math.min(9.6, Math.max(0.4, y)) }
  })
}
generate()

const n = computed(() => pts.value.length)
const mx = computed(() => pts.value.reduce((s, p) => s + p.x, 0) / n.value)
const my = computed(() => pts.value.reduce((s, p) => s + p.y, 0) / n.value)
const cov = computed(() => pts.value.reduce((s, p) => s + (p.x - mx.value) * (p.y - my.value), 0) / (n.value - 1))
const sx_ = computed(() => Math.sqrt(pts.value.reduce((s, p) => s + (p.x - mx.value) ** 2, 0) / (n.value - 1)))
const sy_ = computed(() => Math.sqrt(pts.value.reduce((s, p) => s + (p.y - my.value) ** 2, 0) / (n.value - 1)))
const r = computed(() => cov.value / (sx_.value * sy_.value))
const pos = computed(() => pts.value.reduce((s, p) => { const a = (p.x - mx.value) * (p.y - my.value); return s + (a > 0 ? a : 0) }, 0))
const neg = computed(() => pts.value.reduce((s, p) => { const a = (p.x - mx.value) * (p.y - my.value); return s + (a < 0 ? -a : 0) }, 0))

// 拖动数据点
const drag = ref(-1)
function down(e, i) { drag.value = i; e.target.setPointerCapture(e.pointerId) }
function move(e, inv) {
  if (drag.value < 0) return
  const [x, y] = inv(e)
  pts.value[drag.value] = { x: Math.min(9.8, Math.max(0.2, x)), y: Math.min(9.8, Math.max(0.2, y)) }
}
const up = () => { drag.value = -1 }
</script>

<template>
  <div class="lab">
    <header>协方差：带符号的矩形面积</header>
    <div class="body">
      <div class="controls">
        <label>生成数据的相关程度 <input v-model.number="rho" type="range" min="-0.95" max="0.95" step="0.05"><span class="val">{{ rho.toFixed(2) }}</span></label>
      </div>
      <div class="btns"><button class="btn" @click="generate">重新生成 12 个点</button></div>
      <Plot v-slot="{ sx, sy, inv }" :x="[0, 10]" :y="[0, 10]" equal>
        <rect
          v-for="(p, i) in pts" :key="'r' + i"
          :x="sx(Math.min(p.x, mx))" :y="sy(Math.max(p.y, my))"
          :width="Math.abs(sx(p.x) - sx(mx))" :height="Math.abs(sy(p.y) - sy(my))"
          :class="(p.x - mx) * (p.y - my) > 0 ? 'pos' : 'neg'"
        />
        <line :x1="sx(mx)" :x2="sx(mx)" :y1="sy(0)" :y2="sy(10)" class="mean" />
        <line :x1="sx(0)" :x2="sx(10)" :y1="sy(my)" :y2="sy(my)" class="mean" />
        <circle
          v-for="(p, i) in pts" :key="'c' + i" :cx="sx(p.x)" :cy="sy(p.y)" r="7" class="pt"
          @pointerdown="down($event, i)" @pointermove="move($event, inv)" @pointerup="up" @pointercancel="up"
        />
        <text :x="sx(mx) + 4" :y="sy(9.7)" class="lab-text">x̄</text>
        <text :x="sx(9.7)" :y="sy(my) - 4" class="lab-text" text-anchor="end">ȳ</text>
      </Plot>
      <div class="cap">拖动任意一个点；红色矩形面积计正，蓝色矩形面积计负</div>
      <div class="readout">
        正面积合计 <b class="pos-t">{{ pos.toFixed(1) }}</b>，负面积合计 <b class="neg-t">{{ neg.toFixed(1) }}</b>，
        样本协方差 = (正 − 负)/(n − 1) = <b>{{ cov.toFixed(2) }}</b><br>
        相关系数 r = 协方差 / (s<sub>x</sub>s<sub>y</sub>) = <b>{{ r.toFixed(3) }}</b>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pos { fill: color-mix(in srgb, var(--c-s4) 18%, transparent); stroke: color-mix(in srgb, var(--c-s4) 55%, transparent); }
.neg { fill: color-mix(in srgb, var(--c-s1) 18%, transparent); stroke: color-mix(in srgb, var(--c-s1) 55%, transparent); }
.mean { stroke: var(--vp-c-text-2); stroke-dasharray: 5 4; }
.pt { fill: var(--vp-c-text-1); stroke: var(--vp-c-bg); stroke-width: 2; cursor: grab; touch-action: none; }
.lab-text { font-size: 13px; fill: var(--vp-c-text-2); }
.pos-t { color: var(--c-s4) !important; }
.neg-t { color: var(--c-s1) !important; }
</style>
