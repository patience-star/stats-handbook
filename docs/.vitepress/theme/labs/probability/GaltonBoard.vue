<script setup>
// 高尔顿钉板：每颗小球经过 n 排钉子，每排以概率 p 向右、1−p 向左，落点 ~ B(n, p)。
// hero 模式用于首页：无控件、自动循环。
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import jStat from 'jstat'

const props = defineProps({ hero: Boolean })
const rows = ref(props.hero ? 10 : 12)
const p = ref(0.5)
const rate = ref(2)            // 每帧放出的小球数
const running = ref(true)
const counts = ref([])
const total = ref(0)
const box = ref()
const cv = ref()

let ctx, w = 0, h = 0, balls = [], raf = 0, frame = 0, visible = true, dirty = true, colors = {}, ro, io

function reset() {
  counts.value = Array(rows.value + 1).fill(0)
  total.value = 0
  balls = []
  dirty = true
}
watch([rows, p], reset)

// 瞬间投 k 个（不做动画）
function drop(k) {
  const c = counts.value.slice()
  for (let i = 0; i < k; i++) {
    let j = 0
    for (let r = 0; r < rows.value; r++) if (Math.random() < p.value) j++
    c[j]++
  }
  counts.value = c
  total.value += k
  dirty = true
}

function resize() {
  const dpr = devicePixelRatio || 1
  w = box.value.clientWidth
  h = props.hero ? Math.min(w, 340) : Math.round(Math.min(w * 0.7, 420))
  cv.value.width = w * dpr
  cv.value.height = h * dpr
  cv.value.style.height = h + 'px'
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  dirty = true
}

function readColors() {
  const s = getComputedStyle(document.documentElement)
  const v = (k) => s.getPropertyValue(k).trim()
  colors = { peg: v('--vp-c-text-3'), ball: v('--vp-c-brand-1'), bar: v('--vp-c-brand-soft'), edge: v('--vp-c-brand-2'), curve: v('--c-s2'), line: v('--vp-c-divider') }
  dirty = true
}

// 几何：上方是钉子，下方是收集槽；第 r 排第 j 个钉子的横坐标 cx + (j − r/2)·dx
function geo() {
  const n = rows.value, dx = (w * 0.94) / (n + 1), top = h * 0.06, dy = (h * 0.48) / n
  return { n, dx, dy, top, cx: w / 2, binTop: top + n * dy, binBottom: h - 2 }
}
const px = (g, r, j) => (r < 0 ? g.cx : g.cx + (j - r / 2) * g.dx)
const py = (g, r) => g.top + r * g.dy

function step(g) {
  // t 为负表示还没进场，让小球错开出发
  for (let i = 0; i < rate.value; i++) if (balls.length < 320) balls.push({ r: -1, j: 0, d: 0, t: -Math.random() })
  for (const b of balls) {
    b.t += 0.13
    if (b.t >= 1) { b.t -= 1; b.r++; b.j += b.d; b.d = Math.random() < p.value ? 1 : 0 }
  }
  const landed = balls.filter((b) => b.r >= g.n)
  if (landed.length) {
    const c = counts.value.slice()
    landed.forEach((b) => c[b.j]++)
    counts.value = c
    total.value += landed.length
    balls = balls.filter((b) => b.r < g.n)
  }
  if (props.hero && total.value > 1500) reset()
}

function draw(g) {
  ctx.clearRect(0, 0, w, h)
  // 钉子
  ctx.fillStyle = colors.peg
  for (let r = 0; r < g.n; r++) {
    for (let j = 0; j <= r; j++) {
      ctx.beginPath()
      ctx.arc(px(g, r, j), py(g, r), 2, 0, 7)
      ctx.fill()
    }
  }
  // 收集槽：观测频数（柱）与理论频数（正态近似曲线）
  const n = g.n, q = p.value, mu = n * q, sd = Math.sqrt(n * q * (1 - q))
  const peak = total.value * jStat.binomial.pdf(Math.round(mu), n, q)
  const max = Math.max(1, peak, ...counts.value)
  const bh = g.binBottom - g.binTop - 6
  ctx.strokeStyle = colors.line
  ctx.lineWidth = 1
  for (let j = 0; j <= n + 1; j++) {
    const x = px(g, n, j) - g.dx / 2
    ctx.beginPath(); ctx.moveTo(x, g.binTop + 4); ctx.lineTo(x, g.binBottom); ctx.stroke()
  }
  counts.value.forEach((v, j) => {
    const x = px(g, n, j) - g.dx * 0.4, bw = g.dx * 0.8, hh = (v / max) * bh
    ctx.fillStyle = colors.bar
    ctx.fillRect(x, g.binBottom - hh, bw, hh)
    ctx.fillStyle = colors.edge
    ctx.fillRect(x, g.binBottom - hh, bw, Math.min(2, hh))
  })
  if (total.value > 0 && sd > 0) {
    ctx.strokeStyle = colors.curve
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let i = 0; i <= 80; i++) {
      const k = -0.5 + ((n + 1) * i) / 80
      const y = g.binBottom - ((total.value * jStat.normal.pdf(k, mu, sd)) / max) * bh
      i ? ctx.lineTo(px(g, n, k), y) : ctx.moveTo(px(g, n, k), y)
    }
    ctx.stroke()
  }
  // 小球：两排之间走一段带弹跳的弧线
  ctx.fillStyle = colors.ball
  const rad = Math.max(2.2, Math.min(4, g.dx * 0.16))
  for (const b of balls) {
    if (b.t < 0) continue
    const x = px(g, b.r, b.j) + (px(g, b.r + 1, b.j + b.d) - px(g, b.r, b.j)) * b.t
    const y = py(g, b.r) + g.dy * b.t - Math.sin(Math.PI * b.t) * g.dy * 0.45 - rad - 1
    ctx.beginPath()
    ctx.arc(x, y, rad, 0, 7)
    ctx.fill()
  }
}

function tick() {
  raf = requestAnimationFrame(tick)
  if (!visible) return
  if (++frame % 30 === 0) readColors()
  const g = geo()
  if (running.value) step(g)
  if (running.value || balls.length || dirty) {
    draw(g)
    dirty = false
  }
}

onMounted(() => {
  ctx = cv.value.getContext('2d')
  reset()
  readColors()
  resize()
  ro = new ResizeObserver(resize)
  ro.observe(box.value)
  io = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
  io.observe(box.value)
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    running.value = false
    drop(1200)
  }
  tick()
})
onUnmounted(() => {
  cancelAnimationFrame(raf)
  ro?.disconnect()
  io?.disconnect()
})

// 读数：落点的样本均值、方差与理论值 np、np(1−p) 对比
const summary = computed(() => {
  const c = counts.value, N = total.value
  if (!N) return null
  const m = c.reduce((s, v, j) => s + v * j, 0) / N
  const v = c.reduce((s, x, j) => s + x * (j - m) ** 2, 0) / Math.max(1, N - 1)
  return { m, v }
})
</script>

<template>
  <div v-if="hero" class="galton hero">
    <div ref="box" class="canvas"><canvas ref="cv" aria-label="高尔顿钉板动画：小球落点逐渐形成钟形分布" /></div>
    <div class="hero-cap">高尔顿钉板：{{ rows }} 排钉子，落点服从二项分布，形状趋近正态</div>
  </div>
  <div v-else class="lab">
    <header>高尔顿钉板</header>
    <div class="body">
      <div class="controls">
        <label>钉子排数 n <input v-model.number="rows" type="range" min="4" max="20" step="1"><span class="val">{{ rows }}</span></label>
        <label>向右概率 p <input v-model.number="p" type="range" min="0.05" max="0.95" step="0.05"><span class="val">{{ p.toFixed(2) }}</span></label>
        <label>投放速度 <input v-model.number="rate" type="range" min="1" max="8" step="1"><span class="val">{{ rate }}/帧</span></label>
      </div>
      <div class="btns">
        <button class="btn" @click="running = !running">{{ running ? '暂停' : '继续' }}</button>
        <button class="btn" @click="drop(1000)">瞬间投 1000 个</button>
        <button class="btn" @click="reset">清空</button>
      </div>
      <div ref="box" class="canvas"><canvas ref="cv" aria-label="高尔顿钉板" /></div>
      <div class="readout">
        已落下 <b>{{ total }}</b> 个小球。
        <template v-if="summary">
          落点均值 <b>{{ summary.m.toFixed(2) }}</b>（理论 np = {{ (rows * p).toFixed(2) }}），
          方差 <b>{{ summary.v.toFixed(2) }}</b>（理论 np(1−p) = {{ (rows * p * (1 - p)).toFixed(2) }}）。
        </template>
        橙色曲线是正态近似 N(np, np(1−p))。
      </div>
    </div>
  </div>
</template>

<style scoped>
.canvas { width: 100%; }
canvas { display: block; width: 100%; }
.hero { width: min(380px, 86vw); }
.hero-cap { margin-top: 6px; font-size: 12px; text-align: center; color: var(--vp-c-text-3); }
</style>
