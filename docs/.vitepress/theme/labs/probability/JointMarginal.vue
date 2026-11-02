<script setup>
// 联合密度与边际：边际是联合密度向坐标轴的“投影”；独立 ⟺ 联合密度等于边际密度之积
import { computed, onMounted, ref } from 'vue'
import Plot, { linePath } from '../../components/Plot.vue'

const phi = (x) => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI)
const bvn = (x, y, r) => Math.exp(-(x * x - 2 * r * x * y + y * y) / (2 * (1 - r * r))) / (2 * Math.PI * Math.sqrt(1 - r * r))
const J = {
  indep: { name: '独立的标准正态', p: (x, y) => phi(x) * phi(y), r: [-3, 3] },
  corr: { name: '相关的正态（ρ = 0.7）', p: (x, y) => bvn(x, y, 0.7), r: [-3, 3] },
  square: { name: '正方形上的均匀分布', p: (x, y) => (x > 0 && x < 1 && y > 0 && y < 1 ? 1 : 0), r: [-0.25, 1.25] },
  tri: { name: '三角形 0 < y < x < 1 上的均匀分布', p: (x, y) => (y > 0 && y < x && x < 1 ? 2 : 0), r: [-0.25, 1.25] },
  disk: { name: '单位圆盘上的均匀分布', p: (x, y) => (x * x + y * y < 1 ? 1 / Math.PI : 0), r: [-1.3, 1.3] },
  mix: { name: '两个团簇的混合', p: (x, y) => 0.5 * phi((x + 1) / 0.5) * phi((y + 1) / 0.5) / 0.25 + 0.5 * phi((x - 1) / 0.5) * phi((y - 1) / 0.5) / 0.25, r: [-3, 3] },
}
const key = ref('corr')
const G = 120
const grid = computed(() => {
  const [a, b] = J[key.value].r, h = (b - a) / G, c = Array.from({ length: G }, (_, i) => a + (i + 0.5) * h)
  const p = c.map((y) => c.map((x) => J[key.value].p(x, y)))       // p[行 = y][列 = x]
  const px = c.map((_, i) => p.reduce((s, row) => s + row[i], 0) * h)
  const py = p.map((row) => row.reduce((s, v) => s + v, 0) * h)
  const q = c.map((_, j) => c.map((_, i) => px[i] * py[j]))
  let tv = 0
  for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) tv += Math.abs(p[j][i] - q[j][i]) * h * h
  return { c, h, p, q, px, py, tv: tv / 2 }
})

// 把密度网格画成图片，嵌进坐标系
const color = ref([47, 93, 138])
onMounted(() => {
  const ctx = document.createElement('canvas').getContext('2d')
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--c-s1').trim()
  ctx.fillRect(0, 0, 1, 1)
  color.value = [...ctx.getImageData(0, 0, 1, 1).data.slice(0, 3)]
})
function image(m) {
  if (typeof document === 'undefined') return ''
  const c = document.createElement('canvas')
  c.width = G
  c.height = G
  const ctx = c.getContext('2d'), img = ctx.createImageData(G, G)
  const max = Math.max(...m.flat())
  for (let j = 0; j < G; j++) {
    for (let i = 0; i < G; i++) {
      const k = ((G - 1 - j) * G + i) * 4     // 图片第一行对应 y 最大
      img.data.set([...color.value, Math.round(255 * Math.sqrt(m[j][i] / max))], k)
    }
  }
  ctx.putImageData(img, 0, 0)
  return c.toDataURL()
}
const joint = computed(() => image(grid.value.p))
const prod = computed(() => image(grid.value.q))
const pxPts = computed(() => grid.value.c.map((x, i) => [x, grid.value.px[i]]))
const pyPts = computed(() => grid.value.c.map((y, j) => [y, grid.value.py[j]]))
const mmax = computed(() => Math.max(...grid.value.px, ...grid.value.py) * 1.15)
const independent = computed(() => grid.value.tv < 0.01)
</script>

<template>
  <div class="lab">
    <header>联合密度、边际密度与独立性</header>
    <div class="body">
      <div class="btns">
        <button v-for="(v, k) in J" :key="k" class="btn" :class="{ on: key === k }" @click="key = k">{{ v.name }}</button>
      </div>
      <div class="grid2">
        <div class="panel">
          <Plot v-slot="{ sx, sy }" :x="J[key].r" :y="J[key].r" equal>
            <image :href="joint" :x="sx(J[key].r[0])" :y="sy(J[key].r[1])" :width="sx(J[key].r[1]) - sx(J[key].r[0])" :height="sy(J[key].r[0]) - sy(J[key].r[1])" preserveAspectRatio="none" />
          </Plot>
          <div class="cap">联合密度 p(x, y)（颜色越深密度越大）</div>
        </div>
        <div class="panel">
          <Plot v-slot="{ sx, sy }" :x="J[key].r" :y="J[key].r" equal>
            <image :href="prod" :x="sx(J[key].r[0])" :y="sy(J[key].r[1])" :width="sx(J[key].r[1]) - sx(J[key].r[0])" :height="sy(J[key].r[0]) - sy(J[key].r[1])" preserveAspectRatio="none" />
          </Plot>
          <div class="cap">边际密度之积 p<sub>X</sub>(x)·p<sub>Y</sub>(y)</div>
        </div>
        <div class="panel">
          <Plot v-slot="{ sx, sy }" :x="J[key].r" :y="[0, mmax]" :height="140">
            <path :d="linePath(pxPts, sx, sy)" class="c1" fill="none" stroke="currentColor" stroke-width="2" />
          </Plot>
          <div class="cap">X 的边际密度：把联合密度沿 y 方向累加（投影到 x 轴）</div>
        </div>
        <div class="panel">
          <Plot v-slot="{ sx, sy }" :x="J[key].r" :y="[0, mmax]" :height="140">
            <path :d="linePath(pyPts, sx, sy)" class="c3" fill="none" stroke="currentColor" stroke-width="2" />
          </Plot>
          <div class="cap">Y 的边际密度（横轴为 y）：沿 x 方向累加</div>
        </div>
      </div>
      <div class="readout">
        两幅图之差：½∬|p − p<sub>X</sub>p<sub>Y</sub>| = <b>{{ grid.tv.toFixed(3) }}</b>，
        <b :class="independent ? 'good' : 'bad'">{{ independent ? 'X 与 Y 独立' : 'X 与 Y 不独立' }}</b>。
        <template v-if="key === 'disk'">圆盘上 X、Y 的相关系数为 0，却不独立：知道 x 接近 1，y 就只能接近 0。</template>
        <template v-if="key === 'tri'">支撑集不是“矩形”，就一定不独立：知道 x，y 的取值范围就变了。</template>
      </div>
    </div>
  </div>
</template>
