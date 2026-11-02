<script setup>
// 正态 QQ 图：把排好序的样本与标准正态的理论分位数配对画点。正态样本的点落在一条直线上；
// 厚尾、轻尾、偏斜各有特征形状。点的相关系数的平方 r² 就是 Shapiro–Francia 统计量
import { computed, ref, watch } from 'vue'
import jStat from 'jstat'
import Plot, { linePath } from '../../components/Plot.vue'

const D = {
  normal: { name: '正态 N(0, 1)', draw: () => jStat.normal.sample(0, 1), say: '点基本落在直线上。' },
  t3: { name: 't(3)：厚尾', draw: () => jStat.studentt.sample(3), say: '两端的点偏离直线：左端更低、右端更高，呈“反 S 形”——尾部比正态厚，极端值更多。' },
  exp: { name: '指数：右偏', draw: () => -Math.log(1 - Math.random()), say: '点呈向上弯曲的弧形：右尾拉得很长，左边被压缩。' },
  unif: { name: '均匀：轻尾', draw: () => Math.random(), say: '点呈“S 形”：两端比直线平——尾部比正态轻，没有极端值。' },
  bimodal: { name: '双峰混合', draw: () => jStat.normal.sample(Math.random() < 0.5 ? -1.6 : 1.6, 0.6), say: '中间出现一段平台：数据在中心附近稀少，分成了两堆。' },
}
const key = ref('t3')
const n = ref(60)
const xs = ref([])
const draw = () => { xs.value = Array.from({ length: n.value }, D[key.value].draw).sort((a, b) => a - b) }
watch([key, n], draw, { immediate: true })

// 理论分位数（Blom 公式）
const q = computed(() => xs.value.map((_, i) => jStat.normal.inv((i + 1 - 0.375) / (n.value + 0.25), 0, 1)))
const pts = computed(() => q.value.map((t, i) => [t, xs.value[i]]))
// 参考线：过两个四分位点
const ref1 = computed(() => {
  const s = xs.value, k1 = Math.floor(0.25 * (s.length - 1)), k3 = Math.floor(0.75 * (s.length - 1))
  const slope = (s[k3] - s[k1]) / (q.value[k3] - q.value[k1]), b = s[k1] - slope * q.value[k1]
  return [[-3.2, b - 3.2 * slope], [3.2, b + 3.2 * slope]]
})
const r2 = computed(() => { const r = jStat.corrcoeff(q.value, xs.value); return r * r })
const yr = computed(() => { const lo = Math.min(...xs.value), hi = Math.max(...xs.value), pad = (hi - lo) * 0.08; return [lo - pad, hi + pad] })
</script>

<template>
  <div class="lab">
    <header>正态 QQ 图：从形状读出分布的特征</header>
    <div class="body">
      <div class="controls">
        <label>样本来自
          <select v-model="key"><option v-for="(v, k) in D" :key="k" :value="k">{{ v.name }}</option></select>
        </label>
        <label>样本量 n <input v-model.number="n" type="range" min="10" max="300" step="5"><span class="val">{{ n }}</span></label>
      </div>
      <div class="btns"><button class="btn" @click="draw">重新抽样</button></div>
      <Plot v-slot="{ sx, sy }" :x="[-3.2, 3.2]" :y="yr" :height="280" xlabel="标准正态的理论分位数" ylabel="样本的次序统计量">
        <path :d="linePath(ref1, sx, sy)" class="refl" />
        <circle v-for="(p, i) in pts" :key="i" :cx="sx(p[0])" :cy="sy(Math.min(yr[1], Math.max(yr[0], p[1])))" r="3" class="pt" />
      </Plot>
      <div class="readout">
        {{ D[key].say }}<br>
        QQ 图上点的相关系数平方 r² = <b>{{ r2.toFixed(4) }}</b>（越接近 1 越像正态；这就是 Shapiro–Francia 统计量，W 检验与它思路相同）。
        样本量很小时，即使来自正态总体，点也会有不小的波动。
      </div>
    </div>
  </div>
</template>

<style scoped>
.refl { fill: none; stroke: var(--c-s4); stroke-width: 1.8; stroke-dasharray: 6 4; }
.pt { fill: var(--c-s1); opacity: 0.75; }
</style>
