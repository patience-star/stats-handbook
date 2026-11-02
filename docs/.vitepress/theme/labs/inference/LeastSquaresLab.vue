<script setup>
// 最小二乘：每个残差画成一个正方形，残差平方和就是这些正方形的总面积。自己调一条直线，与最小二乘直线比较；
// 可以拖动数据点观察杠杆作用，也可以显示均值的置信带与个别值的预测带
import { computed, ref } from 'vue'
import jStat from 'jstat'
import Plot, { linePath } from '../../components/Plot.vue'

const INIT = [[1, 12], [2, 16], [3, 16], [4, 22], [5, 20], [6, 27], [7, 25], [8, 31], [9, 30], [10, 37]]
const pts = ref(INIT.map((p) => [...p]))
const a = ref(15)          // 自己调的直线：截距
const b = ref(1.5)         //               斜率
const useLs = ref(false)
const bands = ref(false)

const fit = computed(() => {
  const n = pts.value.length, xs = pts.value.map((p) => p[0]), ys = pts.value.map((p) => p[1])
  const mx = xs.reduce((s, v) => s + v, 0) / n, my = ys.reduce((s, v) => s + v, 0) / n
  const lxx = xs.reduce((s, v) => s + (v - mx) ** 2, 0), lxy = xs.reduce((s, v, i) => s + (v - mx) * (ys[i] - my), 0), lyy = ys.reduce((s, v) => s + (v - my) ** 2, 0)
  const b1 = lxy / lxx, b0 = my - b1 * mx, sse = lyy - b1 * lxy
  return { n, mx, my, lxx, b0, b1, sse, r2: (b1 * lxy) / lyy, sigma: Math.sqrt(sse / (n - 2)) }
})
const line = computed(() => (useLs.value ? [fit.value.b0, fit.value.b1] : [a.value, b.value]))
const yhat = (x) => line.value[0] + line.value[1] * x
const sse = computed(() => pts.value.reduce((s, [x, y]) => s + (y - yhat(x)) ** 2, 0))
const snap = () => { a.value = +fit.value.b0.toFixed(2); b.value = +fit.value.b1.toFixed(2); useLs.value = true }

const XR = [0, 11.5], YR = [0, 48]
const tq = computed(() => jStat.studentt.inv(0.975, fit.value.n - 2))
const band = (extra) => {
  const f = fit.value, xs = Array.from({ length: 61 }, (_, i) => XR[0] + ((XR[1] - XR[0]) * i) / 60)
  const h = (x) => tq.value * f.sigma * Math.sqrt(extra + 1 / f.n + (x - f.mx) ** 2 / f.lxx)
  return [xs.map((x) => [x, f.b0 + f.b1 * x + h(x)]), xs.map((x) => [x, f.b0 + f.b1 * x - h(x)])]
}

// 拖动数据点
const drag = ref(-1)
function down(e, i) { drag.value = i; e.target.setPointerCapture(e.pointerId) }
function move(e, inv) {
  if (drag.value < 0) return
  const [x, y] = inv(e)
  pts.value[drag.value] = [Math.min(XR[1] - 0.2, Math.max(0.2, +x.toFixed(2))), Math.min(YR[1] - 1, Math.max(0.5, +y.toFixed(2)))]
}
const up = () => { drag.value = -1 }
const reset = () => { pts.value = INIT.map((p) => [...p]) }
const f2 = (v) => v.toFixed(2)
</script>

<template>
  <div class="lab">
    <header>最小二乘：让残差正方形的总面积最小</header>
    <div class="body">
      <div class="controls">
        <label>截距 <input v-model.number="a" type="range" min="-5" max="30" step="0.1" :disabled="useLs"><span class="val">{{ f2(line[0]) }}</span></label>
        <label>斜率 <input v-model.number="b" type="range" min="-1" max="5" step="0.01" :disabled="useLs"><span class="val">{{ f2(line[1]) }}</span></label>
      </div>
      <div class="btns">
        <button class="btn" :class="{ on: useLs }" @click="useLs ? (useLs = false) : snap()">{{ useLs ? '改为自己调直线' : '显示最小二乘直线' }}</button>
        <button class="btn" :class="{ on: bands }" @click="bands = !bands">{{ bands ? '隐藏' : '显示' }}置信带与预测带</button>
        <button class="btn" @click="reset">恢复数据</button>
      </div>
      <Plot v-slot="{ sx, sy, inv }" :x="XR" :y="YR" :height="320" xlabel="广告费 x" ylabel="销售额 y">
        <template v-if="bands">
          <path :d="linePath(band(1)[0], sx, sy)" class="pi" /><path :d="linePath(band(1)[1], sx, sy)" class="pi" />
          <path :d="linePath(band(0)[0], sx, sy)" class="ci" /><path :d="linePath(band(0)[1], sx, sy)" class="ci" />
        </template>
        <rect
          v-for="([x, y], i) in pts" :key="'s' + i"
          :x="sx(x)" :y="Math.min(sy(y), sy(yhat(x)))"
          :width="Math.abs(sy(y) - sy(yhat(x)))" :height="Math.abs(sy(y) - sy(yhat(x)))" class="sq"
        />
        <line v-for="([x, y], i) in pts" :key="'r' + i" :x1="sx(x)" :x2="sx(x)" :y1="sy(y)" :y2="sy(yhat(x))" class="res" />
        <path :d="linePath([[XR[0], yhat(XR[0])], [XR[1], yhat(XR[1])]], sx, sy)" class="fit" />
        <circle
          v-for="([x, y], i) in pts" :key="'p' + i" :cx="sx(x)" :cy="sy(y)" r="7" class="pt"
          @pointerdown="down($event, i)" @pointermove="move($event, inv)" @pointerup="up" @pointercancel="up"
        />
      </Plot>
      <div class="cap">
        每个红色正方形的边长等于残差。拖动数据点试试：远离 x̄ 的点（杠杆点）对直线的影响最大。
        <template v-if="bands">内侧虚线：E(y) 的 95% 置信带；外侧点线：个别值的 95% 预测带。</template>
      </div>
      <div class="readout">
        当前直线的残差平方和 = <b>{{ f2(sse) }}</b>；最小二乘直线 ŷ = {{ f2(fit.b0) }} + {{ f2(fit.b1) }}x 的残差平方和 = <b>{{ f2(fit.sse) }}</b>（不可能更小）。<br>
        判定系数 R² = <b>{{ fit.r2.toFixed(4) }}</b>，残差标准差 σ̂ = {{ f2(fit.sigma) }}。
      </div>
    </div>
  </div>
</template>

<style scoped>
.sq { fill: color-mix(in srgb, var(--c-s4) 14%, transparent); stroke: color-mix(in srgb, var(--c-s4) 50%, transparent); }
.res { stroke: var(--c-s4); stroke-width: 1.5; }
.fit { fill: none; stroke: var(--c-s1); stroke-width: 2.5; }
.pt { fill: var(--vp-c-text-1); stroke: var(--vp-c-bg); stroke-width: 2; cursor: grab; touch-action: none; }
.ci { fill: none; stroke: var(--c-s2); stroke-width: 1.6; stroke-dasharray: 6 4; }
.pi { fill: none; stroke: var(--c-s3); stroke-width: 1.6; stroke-dasharray: 2 3; }
</style>
