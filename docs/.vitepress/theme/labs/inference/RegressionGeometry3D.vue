<script setup>
// 回归的几何：3 个观测时 y 是三维空间的一个向量；1 = (1,1,1) 与 x = (−1,0,1) 张成一个平面（列空间），
// 拟合值 ŷ 是 y 在平面上的正交投影，残差 e = y − ŷ 垂直于平面
import { computed, ref } from 'vue'
import Space3D from '../../components/Space3D.vue'

const y = ref([0.6, 1.4, 1.6])
const X = [-1, 0, 1]
const U1 = [1, 1, 1].map((v) => v / Math.sqrt(3)), U2 = X.map((v) => v / Math.SQRT2)   // 列空间的单位正交基
const dot = (p, q) => p.reduce((s, v, i) => s + v * q[i], 0)
const yhat = computed(() => { const c1 = dot(y.value, U1), c2 = dot(y.value, U2); return U1.map((u, i) => c1 * u + c2 * U2[i]) })
const e = computed(() => y.value.map((v, i) => v - yhat.value[i]))
const b0 = computed(() => (y.value[0] + y.value[1] + y.value[2]) / 3)
const b1 = computed(() => (y.value[2] - y.value[0]) / 2)
const n2 = (v) => dot(v, v)
const ybar = computed(() => [b0.value, b0.value, b0.value])
const sst = computed(() => n2(y.value.map((v) => v - b0.value)))
const ssr = computed(() => n2(yhat.value.map((v) => v - b0.value)))
const plane = [[1, 1], [1, -1], [-1, -1], [-1, 1]].map(([s, t]) => U1.map((u, i) => 2.2 * s * u + 1.6 * t * U2[i]))
const items = computed(() => [
  { type: 'poly', pts: plane, cls: 'c3' },
  { type: 'arrow', a: [0, 0, 0], b: U1.map((v) => v * 1.4), cls: 'muted' },
  { type: 'text', p: U1.map((v) => v * 1.4), text: '1', cls: 'muted' },
  { type: 'arrow', a: [0, 0, 0], b: X, cls: 'muted' },
  { type: 'text', p: X, text: 'x', cls: 'muted' },
  { type: 'arrow', a: [0, 0, 0], b: y.value, cls: 'c1' },
  { type: 'arrow', a: [0, 0, 0], b: yhat.value, cls: 'c2' },
  { type: 'arrow', a: yhat.value, b: y.value, cls: 'c4' },
  { type: 'line', a: ybar.value, b: yhat.value, cls: 'c5 dash' },
  { type: 'line', a: ybar.value, b: y.value, cls: 'c1 dash' },
  { type: 'point', p: ybar.value, cls: 'c5', r: 4 },
  { type: 'text', p: y.value, text: 'y', cls: 'c1' },
  { type: 'text', p: yhat.value, text: 'ŷ', cls: 'c2' },
])
const f = (v) => (Math.abs(v) < 5e-4 ? 0 : v).toFixed(3)
</script>

<template>
  <div class="lab">
    <header>回归的几何：投影到列空间</header>
    <div class="body">
      <div class="controls">
        <label v-for="i in [0, 1, 2]" :key="i">y{{ ['₁', '₂', '₃'][i] }}（x = {{ X[i] }}） <input v-model.number="y[i]" type="range" min="-1.5" max="2.5" step="0.05"><span class="val">{{ y[i].toFixed(2) }}</span></label>
      </div>
      <Space3D :items="items" :range="2.6" :height="340" />
      <div class="readout">
        <span class="sw c1" /> 观测向量 y　<span class="sw c2" /> 拟合值 ŷ（y 在绿色平面上的投影）　<span class="sw c4" /> 残差 e，垂直于平面<br>
        回归方程 ŷ = {{ f(b0) }} + {{ f(b1) }}x；e·1 = {{ f(dot(e, [1, 1, 1])) }}，e·x = {{ f(dot(e, X)) }}（正规方程：残差与每一列都正交）<br>
        勾股定理：‖y − ȳ1‖² = {{ f(sst) }} = ‖ŷ − ȳ1‖² {{ f(ssr) }} + ‖e‖² {{ f(n2(e)) }}；R² = {{ sst > 1e-9 ? f(ssr / sst) : '—' }}，即从点 ȳ1 出发的两条虚线（到 y、到 ŷ）夹角余弦的平方
      </div>
    </div>
  </div>
</template>

<style scoped>
.sw { display: inline-block; width: 14px; height: 4px; margin: 0 4px 0 6px; vertical-align: 3px; }
.sw.c1 { background: var(--c-s1); }
.sw.c2 { background: var(--c-s2); }
.sw.c4 { background: var(--c-s4); }
</style>
