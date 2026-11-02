<script setup>
// 样本的几何：n = 3 时样本 x = (x₁, x₂, x₃) 是空间中的一个向量。它在对角线方向 1 = (1,1,1) 上的投影是 x̄·1，
// 剩下的残差 x − x̄·1 落在与 1 垂直的平面上——这个平面只有 n − 1 = 2 维，这就是 (n − 1) 的来历
import { computed, ref } from 'vue'
import jStat from 'jstat'
import Space3D from '../../components/Space3D.vue'

const x = ref([1.5, 0.3, 0.9])
const mu = ref(0)
const cloud = ref([])
const sample = () => { x.value = [0, 1, 2].map(() => +(mu.value + jStat.normal.sample(0, 0.6)).toFixed(2)) }
const toggleCloud = () => { cloud.value = cloud.value.length ? [] : Array.from({ length: 300 }, () => [0, 1, 2].map(() => mu.value + jStat.normal.sample(0, 0.5))) }

const mean = computed(() => (x.value[0] + x.value[1] + x.value[2]) / 3)
const proj = computed(() => [mean.value, mean.value, mean.value])
const resid = computed(() => x.value.map((v) => v - mean.value))
const ssr = computed(() => resid.value.reduce((s, v) => s + v * v, 0))          // Σ(xᵢ − x̄)² = (n − 1)s²
const ssm = computed(() => 3 * mean.value ** 2)                                  // ‖x̄·1‖² = n x̄²
const ssx = computed(() => x.value.reduce((s, v) => s + v * v, 0))
const t = computed(() => (ssr.value > 1e-9 ? mean.value / Math.sqrt(ssr.value / 2 / 3) : NaN))

// 与 1 垂直的平面（过原点），由 u = (1,−1,0)/√2 与 v = (1,1,−2)/√6 张成
const U = [1 / Math.SQRT2, -1 / Math.SQRT2, 0], V = [1 / Math.sqrt(6), 1 / Math.sqrt(6), -2 / Math.sqrt(6)]
const plane = [[1, 1], [1, -1], [-1, -1], [-1, 1]].map(([a, b]) => U.map((u, i) => 1.8 * (a * u + b * V[i])))
const items = computed(() => {
  const out = [
    { type: 'poly', pts: plane, cls: 'c3' },
    { type: 'line', a: [-1.7, -1.7, -1.7], b: [1.7, 1.7, 1.7], cls: 'muted dash' },
    { type: 'text', p: [1.7, 1.7, 1.7], text: '方向 1', cls: 'muted' },
    ...[[2, 0, 0, 'x₁'], [0, 2, 0, 'x₂'], [0, 0, 2, 'x₃']].flatMap(([a, b, c, s]) => [
      { type: 'line', a: [0, 0, 0], b: [a, b, c], cls: 'muted' }, { type: 'text', p: [a, b, c], text: s, cls: 'muted' },
    ]),
    { type: 'line', a: [0, 0, 0], b: resid.value, cls: 'c4 dash' },
    { type: 'arrow', a: [0, 0, 0], b: x.value, cls: 'c1' },
    { type: 'arrow', a: [0, 0, 0], b: proj.value, cls: 'c2' },
    { type: 'arrow', a: proj.value, b: x.value, cls: 'c4' },
    { type: 'text', p: x.value, text: 'x', cls: 'c1' },
    { type: 'text', p: proj.value, text: 'x̄·1', cls: 'c2' },
  ]
  for (const p of cloud.value) out.push({ type: 'point', p, cls: 'c5 faint', r: 2 })
  return out
})
const f = (v) => v.toFixed(3)
</script>

<template>
  <div class="lab">
    <header>样本的几何：投影、残差与自由度（n = 3）</header>
    <div class="body">
      <div class="controls">
        <label v-for="i in [0, 1, 2]" :key="i">x{{ ['₁', '₂', '₃'][i] }} <input v-model.number="x[i]" type="range" min="-1.8" max="1.8" step="0.05"><span class="val">{{ x[i].toFixed(2) }}</span></label>
        <label>总体均值 μ <input v-model.number="mu" type="range" min="-1" max="1" step="0.1"><span class="val">{{ mu.toFixed(1) }}</span></label>
      </div>
      <div class="btns">
        <button class="btn" @click="sample">从 N(μ, σ²) 随机抽一个样本</button>
        <button class="btn" :class="{ on: cloud.length }" @click="toggleCloud">{{ cloud.length ? '隐藏' : '显示' }} 300 个样本组成的点云</button>
      </div>
      <Space3D :items="items" :range="2.3" :height="340" />
      <div class="readout">
        <span class="sw c1" /> 样本向量 x = ({{ x.map((v) => v.toFixed(2)).join(', ') }})
        <span class="sw c2" /> 投影 x̄·1，x̄ = <b>{{ f(mean) }}</b>
        <span class="sw c4" /> 残差 x − x̄·1（虚线是把它平移到原点，落在绿色平面内）<br>
        勾股定理：‖x‖² = {{ f(ssx) }} = n·x̄² + Σ(xᵢ − x̄)² = {{ f(ssm) }} + {{ f(ssr) }}<br>
        残差只能在 2 维平面里活动，所以 Σ(xᵢ − x̄)² 只有 n − 1 = 2 个自由度：s² = {{ f(ssr) }}/2 = <b>{{ f(ssr / 2) }}</b><br>
        <template v-if="Number.isFinite(t)">t = x̄/(s/√n) = <b>{{ t.toFixed(3) }}</b>：x 越贴近方向 1（夹角越小），|t| 越大。</template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sw { display: inline-block; width: 14px; height: 4px; margin: 0 4px 0 8px; vertical-align: 3px; }
.sw.c1 { background: var(--c-s1); }
.sw.c2 { background: var(--c-s2); }
.sw.c4 { background: var(--c-s4); }
</style>
