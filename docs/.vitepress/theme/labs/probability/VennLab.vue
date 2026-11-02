<script setup>
// 事件运算的维恩图：选一个表达式，满足它的区域被涂色；成对的表达式（德摩根律、分配律）图形完全相同
import { onMounted, onUnmounted, ref, watch } from 'vue'

const exprs = [
  { k: 'A∪B', f: (a, b) => a || b, say: '并：A、B 至少有一个发生' },
  { k: 'AB', f: (a, b) => a && b, say: '交：A、B 同时发生' },
  { k: 'A−B', f: (a, b) => a && !b, say: '差：A 发生而 B 不发生，即 AB̄' },
  { k: 'Ā', f: (a) => !a, say: '对立：A 不发生' },
  { k: 'A∪B∪C', f: (a, b, c) => a || b || c, say: '三个事件至少发生一个' },
  { k: 'ABC', f: (a, b, c) => a && b && c, say: '三个事件同时发生' },
  { k: '恰有一个', f: (a, b, c) => a + b + c === 1, say: '恰有一个发生：AB̄C̄ ∪ ĀBC̄ ∪ ĀB̄C' },
  { k: '至少两个', f: (a, b, c) => a + b + c >= 2, say: '至少两个发生：AB ∪ BC ∪ AC' },
  { k: '(A∪B)‾', f: (a, b) => !(a || b), say: '德摩根律：与 ĀB̄ 是同一个区域' },
  { k: 'ĀB̄', f: (a, b) => !a && !b, say: '德摩根律：与 (A∪B)‾ 是同一个区域' },
  { k: 'A(B∪C)', f: (a, b, c) => a && (b || c), say: '分配律：与 AB∪AC 是同一个区域' },
  { k: 'AB∪AC', f: (a, b, c) => (a && b) || (a && c), say: '分配律：与 A(B∪C) 是同一个区域' },
]
const pick = ref(0)
const cv = ref()
const box = ref()
// 三个圆：圆心与半径都以画布宽度为单位，画布高度 = 0.72 × 宽度
const circles = [[0.38, 0.3, 'A', -1, -1], [0.62, 0.3, 'B', 1, -1], [0.5, 0.5, 'C', 0, 1]]
const R = 0.19
let ro

function draw() {
  const w = box.value.clientWidth, h = Math.round(w * 0.72), dpr = devicePixelRatio || 1
  const c = cv.value
  c.width = Math.round(w * dpr)
  c.height = Math.round(h * dpr)
  c.style.height = h + 'px'
  const ctx = c.getContext('2d')
  const s = getComputedStyle(document.documentElement)
  const css = (k) => s.getPropertyValue(k).trim()

  // 先把主色画到一个像素上，读出 RGB，再逐像素涂满足表达式的区域
  ctx.fillStyle = css('--c-s1')
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
  ctx.clearRect(0, 0, c.width, c.height)
  const img = ctx.createImageData(c.width, c.height)
  const f = exprs[pick.value].f
  const W = c.width, rr = (R * W) ** 2
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < W; x++) {
      const inside = circles.map(([cx, cy]) => (x - cx * W) ** 2 + (y - cy * W) ** 2 <= rr)
      if (f(...inside)) {
        const i = (y * W + x) * 4
        img.data[i] = r
        img.data[i + 1] = g
        img.data[i + 2] = b
        img.data[i + 3] = 140
      }
    }
  }
  ctx.putImageData(img, 0, 0)

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.strokeStyle = css('--vp-c-text-2')
  ctx.fillStyle = css('--vp-c-text-1')
  ctx.lineWidth = 1.5
  ctx.strokeRect(1, 1, w - 2, h - 2)
  ctx.font = '600 16px sans-serif'
  ctx.fillText('Ω', 10, 22)
  for (const [cx, cy, name, dx, dy] of circles) {
    ctx.beginPath()
    ctx.arc(cx * w, cy * w, R * w, 0, 7)
    ctx.stroke()
    ctx.fillText(name, cx * w + dx * R * w * 0.95 - 5, cy * w + dy * R * w * 0.95 + 6)
  }
}
watch(pick, draw)
onMounted(() => {
  draw()
  ro = new ResizeObserver(draw)
  ro.observe(box.value)
})
onUnmounted(() => ro?.disconnect())
</script>

<template>
  <div class="lab">
    <header>事件运算的维恩图</header>
    <div class="body">
      <div class="btns">
        <button v-for="(e, i) in exprs" :key="e.k" class="btn" :class="{ on: pick === i }" @click="pick = i">{{ e.k }}</button>
      </div>
      <div ref="box" class="canvas"><canvas ref="cv" aria-label="三个事件的维恩图" /></div>
      <div class="readout"><b>{{ exprs[pick].k }}</b>：{{ exprs[pick].say }}</div>
    </div>
  </div>
</template>

<style scoped>
.canvas { max-width: 440px; margin: 0 auto; }
canvas { display: block; width: 100%; border-radius: 8px; }
</style>
