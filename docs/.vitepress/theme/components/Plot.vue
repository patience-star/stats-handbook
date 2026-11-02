<script>
// 折线路径：pts = [[x, y], …]，sx / sy 是比例尺
export const linePath = (pts, sx, sy) =>
  pts.map(([x, y], i) => `${i ? 'L' : 'M'}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`).join('')

// 刻度：步长取 1、2、5 × 10^k
export function niceTicks(a, b, count = 5) {
  if (!(b > a)) return [a]
  const raw = (b - a) / count
  const mag = 10 ** Math.floor(Math.log10(raw))
  const r = raw / mag
  const step = (r < 1.5 ? 1 : r < 3 ? 2 : r < 7 ? 5 : 10) * mag
  const out = []
  for (let v = Math.ceil(a / step - 1e-9) * step; v <= b + step * 1e-9; v += step) out.push(+v.toPrecision(12))
  return out
}
</script>

<script setup>
// 坐标系：画网格、刻度，并把比例尺 sx/sy 和“指针 → 数据坐标”的 inv 通过插槽交给实验组件。
// 宽度随容器变化，SVG 与屏幕像素 1:1，文字在手机上不会缩小。
import { computed, onMounted, onUnmounted, ref } from 'vue'

const props = defineProps({
  x: { type: Array, required: true },      // 横轴数据范围 [min, max]
  y: { type: Array, required: true },      // 纵轴数据范围 [min, max]
  height: { type: Number, default: 240 },  // 像素高度；equal 为真时由比例自动决定
  equal: Boolean,                          // 横纵比例尺相同（画圆、几何图时用）
  xlabel: String,
  ylabel: String,
  xticks: Array,                           // 自定义刻度位置
  yticks: Array,
  xfmt: Function,                          // 自定义刻度文字
  yfmt: Function,
  bare: Boolean,                           // 不画网格与刻度
})

const pad = { l: 42, r: 14, t: 14, b: 30 }
const wrap = ref()
const svg = ref()
const width = ref(560)
let ro
onMounted(() => {
  const fit = (w) => { width.value = Math.max(200, Math.round(w)) }
  fit(wrap.value.clientWidth)
  ro = new ResizeObserver(([e]) => fit(e.contentRect.width))
  ro.observe(wrap.value)
})
onUnmounted(() => ro?.disconnect())

const iw = computed(() => width.value - pad.l - pad.r)
const ih = computed(() => props.equal
  ? iw.value * (props.y[1] - props.y[0]) / (props.x[1] - props.x[0])
  : props.height - pad.t - pad.b)
const sx = computed(() => {
  const [a, b] = props.x, k = iw.value / (b - a)
  return (v) => pad.l + (v - a) * k
})
const sy = computed(() => {
  const [a, b] = props.y, k = ih.value / (b - a)
  return (v) => pad.t + ih.value - (v - a) * k
})
const xt = computed(() => props.xticks ?? niceTicks(props.x[0], props.x[1], Math.max(2, Math.round(iw.value / 80))))
const yt = computed(() => props.yticks ?? niceTicks(props.y[0], props.y[1], Math.max(2, Math.round(ih.value / 45))))
const fmt = (v) => String(+v.toPrecision(4)).replace('-', '−')

// 指针位置 → 数据坐标（拖拽用）
function inv(e) {
  const r = svg.value.getBoundingClientRect()
  return [
    props.x[0] + ((e.clientX - r.left - pad.l) / iw.value) * (props.x[1] - props.x[0]),
    props.y[0] + ((pad.t + ih.value - (e.clientY - r.top)) / ih.value) * (props.y[1] - props.y[0]),
  ]
}
</script>

<template>
  <div ref="wrap" class="plot-wrap">
    <svg ref="svg" class="plot" :width="width" :height="ih + pad.t + pad.b" :viewBox="`0 0 ${width} ${ih + pad.t + pad.b}`">
      <g v-if="!bare">
        <g class="grid">
          <line v-for="v in xt" :key="'x' + v" :x1="sx(v)" :x2="sx(v)" :y1="pad.t" :y2="pad.t + ih" />
          <line v-for="v in yt" :key="'y' + v" :x1="pad.l" :x2="pad.l + iw" :y1="sy(v)" :y2="sy(v)" />
        </g>
        <g class="ticks">
          <text v-for="v in xt" :key="'tx' + v" :x="sx(v)" :y="pad.t + ih + 18" text-anchor="middle">{{ (xfmt || fmt)(v) }}</text>
          <text v-for="v in yt" :key="'ty' + v" :x="pad.l - 6" :y="sy(v) + 4" text-anchor="end">{{ (yfmt || fmt)(v) }}</text>
        </g>
        <text v-if="xlabel" class="label" :x="pad.l + iw" :y="pad.t + ih - 6" text-anchor="end">{{ xlabel }}</text>
        <text v-if="ylabel" class="label" :x="pad.l + 6" :y="pad.t + 12">{{ ylabel }}</text>
      </g>
      <slot :sx="sx" :sy="sy" :inv="inv" :iw="iw" :ih="ih" :pad="pad" />
    </svg>
  </div>
</template>
