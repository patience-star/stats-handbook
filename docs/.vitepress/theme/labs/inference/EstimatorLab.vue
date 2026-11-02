<script setup>
// 估计量的靶场：同一个参数的几个估计量，各自重复抽样 R 次，比较偏差、方差与均方误差（MSE = 偏差² + 方差）
import { computed, ref, watch } from 'vue'
import jStat from 'jstat'
import Plot from '../../components/Plot.vue'

const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length
const median = (a) => { const s = [...a].sort((p, q) => p - q), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2 }
const laplace = () => { const u = Math.random() - 0.5; return -Math.sign(u) * Math.log(1 - 2 * Math.abs(u)) / Math.SQRT2 }
const POPS = {
  normal: { name: '正态 N(0, 1)', draw: () => jStat.normal.sample(0, 1) },
  uniform: { name: '均匀 U(−1, 1)', draw: () => 2 * Math.random() - 1 },
  laplace: { name: '拉普拉斯（双指数）', draw: laplace },
  cauchy: { name: '柯西', draw: () => Math.tan(Math.PI * (Math.random() - 0.5)) },
}
const S = {
  var: {
    name: '正态总体的方差 σ²（真值 1）', truth: 1, draw: () => jStat.normal.sample(0, 1),
    est: [
      ['S²：除以 n − 1', (x) => ss(x) / (x.length - 1)],
      ['Sₙ²：除以 n', (x) => ss(x) / x.length],
      ['除以 n + 1', (x) => ss(x) / (x.length + 1)],
    ],
  },
  unif: {
    name: '均匀分布 U(0, θ) 的 θ（真值 1）', truth: 1, draw: () => Math.random(),
    est: [
      ['矩估计 2X̄', (x) => 2 * mean(x)],
      ['最大值 X₍ₙ₎', (x) => Math.max(...x)],
      ['修正最大值 (n+1)/n · X₍ₙ₎', (x) => ((x.length + 1) / x.length) * Math.max(...x)],
    ],
  },
  center: {
    name: '对称分布的中心（真值 0）', truth: 0, draw: null,
    est: [['样本均值', mean], ['样本中位数', median], ['中程数 (最小 + 最大)/2', (x) => (Math.min(...x) + Math.max(...x)) / 2]],
  },
}
function ss(x) { const m = mean(x); return x.reduce((s, v) => s + (v - m) ** 2, 0) }

const key = ref('var')
const pop = ref('normal')
const n = ref(10)
const R = 3000
const res = ref([])
function run() {
  const s = S[key.value], draw = s.draw ?? POPS[pop.value].draw
  const samples = Array.from({ length: R }, () => Array.from({ length: n.value }, draw))
  res.value = s.est.map(([name, f]) => {
    const v = samples.map(f), m = mean(v), vr = mean(v.map((e) => (e - m) ** 2)), b = m - s.truth
    return { name, v: v.slice(0, 300), bias: b, var: vr, mse: b * b + vr }
  })
}
watch([key, pop, n], run, { immediate: true })

const truth = computed(() => S[key.value].truth)
const xr = computed(() => {
  const spread = Math.max(...res.value.map((r) => Math.sqrt(r.var) + Math.abs(r.bias)))
  const w = Math.min(Math.max(4 * spread, 0.3), 3)
  return [truth.value - w, truth.value + w]
})
const best = computed(() => res.value.reduce((b, r, i) => (r.mse < res.value[b].mse ? i : b), 0))
const mseMax = computed(() => Math.max(...res.value.map((r) => r.mse)))
const jitter = Array.from({ length: 300 }, () => Math.random())
const fmt = (v) => (Math.abs(v) < 1e-4 ? v.toExponential(1) : v.toFixed(4))
</script>

<template>
  <div class="lab">
    <header>估计量的靶场：偏差、方差与均方误差</header>
    <div class="body">
      <div class="controls">
        <label>估计对象
          <select v-model="key"><option v-for="(v, k) in S" :key="k" :value="k">{{ v.name }}</option></select>
        </label>
        <label v-if="key === 'center'">总体
          <select v-model="pop"><option v-for="(v, k) in POPS" :key="k" :value="k">{{ v.name }}</option></select>
        </label>
        <label>样本量 n <input v-model.number="n" type="range" min="3" max="60" step="1"><span class="val">{{ n }}</span></label>
      </div>
      <div class="btns"><button class="btn" @click="run">重新抽样 {{ R }} 次</button></div>
      <div v-for="(r, i) in res" :key="r.name" class="row">
        <div class="name" :class="{ best: i === best }">{{ r.name }}{{ i === best ? '（MSE 最小）' : '' }}</div>
        <Plot v-slot="{ sx, sy }" :x="xr" :y="[0, 1]" :height="74" :yticks="[]">
          <circle v-for="(e, j) in r.v" :key="j" :cx="sx(Math.min(xr[1], Math.max(xr[0], e)))" :cy="sy(0.15 + 0.7 * jitter[j])" r="2" class="dot" />
          <line :x1="sx(truth)" :x2="sx(truth)" :y1="sy(0)" :y2="sy(1)" class="truth" />
          <line :x1="sx(Math.min(xr[1], Math.max(xr[0], truth + r.bias)))" :x2="sx(Math.min(xr[1], Math.max(xr[0], truth + r.bias)))" :y1="sy(0)" :y2="sy(1)" class="avg" />
        </Plot>
        <div class="stats">
          偏差 {{ fmt(r.bias) }}　方差 {{ fmt(r.var) }}　MSE {{ fmt(r.mse) }}
          <span class="mse"><span class="b2" :style="{ width: (100 * r.bias * r.bias) / mseMax + '%' }" /><span class="vv" :style="{ width: (100 * r.var) / mseMax + '%' }" /></span>
        </div>
      </div>
      <div class="cap">每行的点是 300 次抽样的估计值（超出范围的被压在边缘）；红线为真值，蓝线为估计值的平均。条形：<span class="sw b2" /> 偏差² + <span class="sw vv" /> 方差 = MSE</div>
    </div>
  </div>
</template>

<style scoped>
.row { margin-bottom: 4px; }
.name { font-size: 13px; font-weight: 600; }
.name.best { color: var(--c-s3); }
.dot { fill: var(--c-s1); opacity: 0.45; }
.truth { stroke: var(--c-s4); stroke-width: 2; }
.avg { stroke: var(--c-s1); stroke-width: 2; stroke-dasharray: 4 3; }
.stats { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 12px; font-size: 13px; font-variant-numeric: tabular-nums; color: var(--vp-c-text-2); }
.mse { display: inline-flex; width: 160px; height: 10px; background: var(--vp-c-divider); border-radius: 3px; overflow: hidden; }
.b2 { background: var(--c-s4); }
.vv { background: var(--c-s1); }
.sw { display: inline-block; width: 12px; height: 10px; vertical-align: -1px; border-radius: 2px; }
</style>
