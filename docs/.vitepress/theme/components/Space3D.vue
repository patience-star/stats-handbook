<script setup>
// 三维示意图：正交投影，拖动旋转。items 中的对象：
//   { type: 'poly', pts: [[x,y,z], …], cls }   半透明平面
//   { type: 'line' | 'arrow', a: [x,y,z], b: [x,y,z], cls }
//   { type: 'point', p: [x,y,z], cls, r }
//   { type: 'text', p: [x,y,z], text, cls }
import { computed, onMounted, onUnmounted, ref } from 'vue'

const props = defineProps({
  items: { type: Array, required: true },
  range: { type: Number, default: 2 },      // 场景半径，决定缩放比例
  height: { type: Number, default: 320 },
})
const yaw = ref(-0.75)
const pitch = ref(0.35)
const wrap = ref()
const width = ref(420)
let ro
onMounted(() => {
  width.value = wrap.value.clientWidth
  ro = new ResizeObserver(([e]) => { width.value = Math.max(200, e.contentRect.width) })
  ro.observe(wrap.value)
})
onUnmounted(() => ro?.disconnect())

// 先绕竖直的 z 轴转 yaw，再俯仰 pitch；返回 [屏幕 x, 屏幕 y, 深度]
function proj([x, y, z]) {
  const cy = Math.cos(yaw.value), sy = Math.sin(yaw.value), cp = Math.cos(pitch.value), sp = Math.sin(pitch.value)
  const x1 = x * cy - y * sy, y1 = x * sy + y * cy
  const depth = y1 * cp - z * sp, up = y1 * sp + z * cp
  const k = Math.min(width.value, props.height) / (2 * props.range)
  return [width.value / 2 + k * x1, props.height / 2 - k * up, depth]
}
const shapes = computed(() => {
  const polys = props.items.filter((it) => it.type === 'poly').map((it) => {
    const ps = it.pts.map(proj)
    return { ...it, points: ps.map((p) => `${p[0]},${p[1]}`).join(' '), depth: ps.reduce((s, p) => s + p[2], 0) / ps.length }
  }).sort((a, b) => b.depth - a.depth)
  const rest = props.items.filter((it) => it.type !== 'poly').map((it) => {
    if (it.type === 'point' || it.type === 'text') { const [x, y] = proj(it.p); return { ...it, x, y } }
    const [x1, y1] = proj(it.a), [x2, y2] = proj(it.b)
    let head = ''
    if (it.type === 'arrow') {
      const L = Math.hypot(x2 - x1, y2 - y1) || 1, ux = (x2 - x1) / L, uy = (y2 - y1) / L, s = Math.min(10, L * 0.4)
      head = `${x2},${y2} ${x2 - s * ux + 0.5 * s * uy},${y2 - s * uy - 0.5 * s * ux} ${x2 - s * ux - 0.5 * s * uy},${y2 - s * uy + 0.5 * s * ux}`
    }
    return { ...it, x1, y1, x2, y2, head }
  })
  return { polys, rest }
})

let last = null
function down(e) { last = [e.clientX, e.clientY]; e.currentTarget.setPointerCapture(e.pointerId) }
function move(e) {
  if (!last) return
  yaw.value -= (e.clientX - last[0]) * 0.01
  pitch.value = Math.max(-1.4, Math.min(1.4, pitch.value + (e.clientY - last[1]) * 0.01))
  last = [e.clientX, e.clientY]
}
const up = () => { last = null }
</script>

<template>
  <div ref="wrap" class="s3d">
    <svg :width="width" :height="height" :viewBox="`0 0 ${width} ${height}`" @pointerdown="down" @pointermove="move" @pointerup="up" @pointercancel="up">
      <polygon v-for="(s, i) in shapes.polys" :key="'p' + i" :points="s.points" :class="['poly', s.cls]" />
      <template v-for="(s, i) in shapes.rest" :key="'r' + i">
        <line v-if="s.type === 'line'" :x1="s.x1" :y1="s.y1" :x2="s.x2" :y2="s.y2" :class="['ln', s.cls]" />
        <g v-else-if="s.type === 'arrow'" :class="['arrow', s.cls]">
          <line :x1="s.x1" :y1="s.y1" :x2="s.x2" :y2="s.y2" />
          <polygon :points="s.head" />
        </g>
        <circle v-else-if="s.type === 'point'" :cx="s.x" :cy="s.y" :r="s.r ?? 3" :class="['pt', s.cls]" />
        <text v-else-if="s.type === 'text'" :x="s.x + 6" :y="s.y - 6" :class="['tx', s.cls]">{{ s.text }}</text>
      </template>
    </svg>
    <div class="hint">拖动图形可以旋转视角</div>
  </div>
</template>

<style scoped>
.s3d { width: 100%; }
svg { display: block; cursor: grab; touch-action: none; user-select: none; }
.hint { font-size: 12px; text-align: center; color: var(--vp-c-text-3); }
</style>
