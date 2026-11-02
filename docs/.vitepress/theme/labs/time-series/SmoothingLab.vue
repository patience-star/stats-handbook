<script setup>
// 指数平滑：在训练期选参数（使一步预测误差平方和最小），对最后一段检验期作多步预测，并与朴素方法比较
import { computed, ref } from 'vue'
import Plot, { linePath } from '../../components/Plot.vue'
import { holt, holtWinters, ses } from '../../lib/ts.js'
import air from '../../data/air.json'
import nile from '../../data/nile.json'

const sets = {
  air: { label: '航空乘客（月度）', x: air.values, m: 12, test: 24, t0: 1949, per: 12, unit: '个月' },
  nile: { label: '尼罗河流量（年度）', x: nile.values, m: 1, test: 20, t0: 1871, per: 1, unit: '年' },
}
const methods = [['ses', '简单指数平滑'], ['holt', 'Holt 线性趋势'], ['hw-mult', 'Holt–Winters 乘法'], ['hw-add', 'Holt–Winters 加法']]
const which = ref('air')
const method = ref('hw-mult')
const a = ref(0.3)
const b = ref(0.05)
const g = ref(0.5)
const d = computed(() => sets[which.value])
const nTrain = computed(() => d.value.x.length - d.value.test)
const train = computed(() => d.value.x.slice(0, nTrain.value))
const test = computed(() => d.value.x.slice(nTrain.value))
const seasonal = computed(() => d.value.m > 1)
const isHw = computed(() => method.value.startsWith('hw'))
function pick(k) {
  which.value = k
  if (!seasonal.value && isHw.value) method.value = 'ses'
}

function run(meth, p, x, h) {
  if (meth === 'ses') return ses(x, p[0], h)
  if (meth === 'holt') return holt(x, p[0], p[1], h)
  return holtWinters(x, d.value.m, p[0], p[1], p[2], h, meth === 'hw-add' ? 'add' : 'mult')
}
const start = computed(() => (isHw.value ? d.value.m : 1))
const res = computed(() => run(method.value, [a.value, b.value, g.value], train.value, d.value.test))
function sse(fit, x, s) {
  let q = 0
  for (let t = s; t < x.length; t++) q += (x[t] - fit[t]) ** 2
  return q
}
const rmseIn = computed(() => Math.sqrt(sse(res.value.fit, train.value, start.value) / (nTrain.value - start.value)))
function metrics(y, f) {
  const e = y.map((v, i) => v - f[i]), n = y.length
  return {
    mae: e.reduce((s, v) => s + Math.abs(v), 0) / n,
    rmse: Math.sqrt(e.reduce((s, v) => s + v * v, 0) / n),
    mape: (e.reduce((s, v, i) => s + Math.abs(v / y[i]), 0) / n) * 100,
  }
}
const mTest = computed(() => metrics(test.value, res.value.fc))
const bench = computed(() => {
  const x = train.value, m = d.value.m
  const fc = seasonal.value ? test.value.map((_, k) => x[x.length - m + (k % m)]) : test.value.map(() => x.at(-1))
  return { name: seasonal.value ? '季节朴素预测（重复最后一年）' : '朴素预测（取最后一个值）', fc, ...metrics(test.value, fc) }
})

// 网格搜索：先以 0.05 为步长粗搜，再在最优点附近以 0.01 为步长细搜
function optimize() {
  const meth = method.value, x = train.value, s = start.value
  const r2 = (v) => Math.round(v * 100) / 100
  const coarse = Array.from({ length: 20 }, (_, i) => r2(0.05 * (i + 1)))
  const fine = (c) => Array.from({ length: 9 }, (_, i) => r2(c - 0.04 + 0.01 * i)).filter((v) => v >= 0.01 && v <= 1)
  let best = null
  const tryP = (p) => {
    const v = sse(run(meth, p, x, 0).fit, x, s)
    if (!best || v < best.v) best = { p, v }
  }
  if (meth === 'ses') {
    for (let i = 1; i <= 100; i++) tryP([i / 100])
  } else if (meth === 'holt') {
    for (const p of coarse) for (const q of coarse) tryP([p, q])
    const c = best.p
    best = null
    for (const p of fine(c[0])) for (const q of fine(c[1])) tryP([p, q])
  } else {
    for (const p of coarse) for (const q of coarse) for (const r of coarse) tryP([p, q, r])
    const c = best.p
    best = null
    for (const p of fine(c[0])) for (const q of fine(c[1])) for (const r of fine(c[2])) tryP([p, q, r])
  }
  a.value = best.p[0]
  if (best.p.length > 1) b.value = best.p[1]
  if (best.p.length > 2) g.value = best.p[2]
}

const n = computed(() => d.value.x.length)
const pts = (arr, off = 0) => arr.map((v, t) => [t + off, v]).filter(([, v]) => v != null)
const yr = computed(() => {
  const all = [...d.value.x, ...res.value.fc, ...bench.value.fc].filter(Number.isFinite)
  const lo = Math.min(...all), hi = Math.max(...all), p = (hi - lo) * 0.06
  return [lo - p, hi + p]
})
const xticks = computed(() => (which.value === 'air' ? [0, 24, 48, 72, 96, 120] : [9, 29, 49, 69, 89]))
const tfmt = (t) => String(d.value.t0 + Math.round(t / d.value.per * 100) / 100)
const weights = computed(() => Array.from({ length: 24 }, (_, j) => a.value * (1 - a.value) ** j))
const f2 = (v) => v.toFixed(2)
</script>

<template>
  <div class="lab">
    <header>指数平滑：拟合、预测与评价</header>
    <div class="body">
      <div class="btns">
        <button v-for="(s, k) in sets" :key="k" class="btn" :class="{ on: which === k }" @click="pick(k)">{{ s.label }}</button>
      </div>
      <div class="btns">
        <button v-for="[k, name] in methods.filter(([k]) => seasonal || !k.startsWith('hw'))" :key="k" class="btn" :class="{ on: method === k }" @click="method = k">{{ name }}</button>
        <button class="btn" @click="optimize">最优参数（训练期）</button>
      </div>
      <div class="controls">
        <label>α（水平） <input v-model.number="a" type="range" min="0.01" max="1" step="0.01"><span class="val">{{ f2(a) }}</span></label>
        <label v-if="method !== 'ses'">β（趋势） <input v-model.number="b" type="range" min="0.01" max="1" step="0.01"><span class="val">{{ f2(b) }}</span></label>
        <label v-if="isHw">γ（季节） <input v-model.number="g" type="range" min="0.01" max="1" step="0.01"><span class="val">{{ f2(g) }}</span></label>
      </div>
      <Plot v-slot="{ sx, sy }" :x="[0, n - 1]" :y="yr" :height="260" :xticks="xticks" :xfmt="tfmt">
        <rect :x="sx(nTrain - 0.5)" :y="sy(yr[1])" :width="sx(n - 1) - sx(nTrain - 0.5)" :height="sy(yr[0]) - sy(yr[1])" class="testzone" />
        <text :x="sx(nTrain - 0.5) + 6" :y="sy(yr[1]) + 14" class="zone-t">检验期</text>
        <path :d="linePath(pts(d.x), sx, sy)" class="raw" />
        <path :d="linePath(pts(res.fit), sx, sy)" class="fit" />
        <path :d="linePath(pts(bench.fc, nTrain), sx, sy)" class="bench" />
        <path :d="linePath(pts(res.fc, nTrain), sx, sy)" class="fc" />
      </Plot>
      <div class="cap">
        <span class="sw raw" /> 实际值　<span class="sw fit" /> 训练期的一步预测　<span class="sw fc" /> 检验期的多步预测　<span class="sw bench" /> {{ bench.name }}
      </div>
      <div v-if="method === 'ses'" class="panel">
        <Plot v-slot="{ sx, sy }" :x="[-0.6, 23.6]" :y="[0, Math.max(0.2, a) * 1.05]" :height="130" :xticks="[0, 4, 8, 12, 16, 20]" xlabel="j 期以前">
          <rect v-for="(w, j) in weights" :key="j" :x="sx(j - 0.35)" :y="sy(w)" :width="sx(0.7) - sx(0)" :height="sy(0) - sy(w)" class="wbar" />
          <line v-if="(1 - a) / a < 23.6" :x1="sx((1 - a) / a)" :x2="sx((1 - a) / a)" :y1="sy(0)" :y2="sy(Math.max(0.2, a))" class="age" />
        </Plot>
        <div class="cap">简单指数平滑给 j 期以前的观测值的权数 α(1−α)<sup>j</sup>；竖线是权数的重心：平均滞后 (1−α)/α = {{ ((1 - a) / a).toFixed(2) }} 期</div>
      </div>
      <div class="readout">
        训练期一步预测的 RMSE = <b>{{ f2(rmseIn) }}</b><br>
        检验期（最后 {{ d.test }} {{ d.unit }}）的多步预测：MAE {{ f2(mTest.mae) }}，RMSE {{ f2(mTest.rmse) }}，MAPE <b>{{ f2(mTest.mape) }}%</b><br>
        对照：{{ bench.name }}的 MAPE {{ f2(bench.mape) }}%，RMSE {{ f2(bench.rmse) }}
        <span v-if="mTest.mape < bench.mape" class="good">——比基准好</span><span v-else class="bad">——还不如基准</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.testzone { fill: color-mix(in srgb, var(--c-s2) 8%, transparent); }
.zone-t { fill: var(--c-s2); font-size: 12px; }
.raw { fill: none; stroke: var(--vp-c-text-3); stroke-width: 1.3; }
.fit { fill: none; stroke: var(--c-s1); stroke-width: 1.4; }
.fc { fill: none; stroke: var(--c-s2); stroke-width: 2.6; }
.bench { fill: none; stroke: var(--c-s5); stroke-width: 1.6; stroke-dasharray: 5 4; }
.wbar { fill: color-mix(in srgb, var(--c-s1) 55%, transparent); }
.age { stroke: var(--c-s4); stroke-width: 2; stroke-dasharray: 4 3; }
.sw { display: inline-block; width: 14px; height: 3px; margin: 0 4px 0 6px; vertical-align: 3px; }
.sw.raw { background: var(--vp-c-text-3); }
.sw.fit { background: var(--c-s1); }
.sw.fc { background: var(--c-s2); height: 4px; }
.sw.bench { background: var(--c-s5); }
</style>
