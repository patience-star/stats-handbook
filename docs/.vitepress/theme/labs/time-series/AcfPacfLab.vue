<script setup>
// ACF/PACF 图鉴：选模型、调系数，对比理论与样本的 ACF/PACF，体会“截尾”与“拖尾”
import { computed, ref } from 'vue'
import Plot, { linePath } from '../../components/Plot.vue'
import { acf, armaAcf, noise, pacfFromAcf, simulateArma } from '../../lib/ts.js'

const N = 300, BURN = 200, LAGS = 20
// 每个模型的系数滑块：[名称, 默认值, 最小, 最大]
const models = {
  ar1: { name: 'AR(1)', phi: [['φ₁', 0.7, -0.99, 0.99]], theta: [], hint: 'ACF 按 φ₁ᵏ 拖尾（φ₁ < 0 时正负交替）；PACF 在第 1 步之后截尾。' },
  ar2: { name: 'AR(2)', phi: [['φ₁', 1.0, -1.95, 1.95], ['φ₂', -0.5, -0.99, 0.99]], theta: [], hint: 'ACF 拖尾（指数衰减或衰减振荡）；PACF 在第 2 步之后截尾。' },
  ma1: { name: 'MA(1)', phi: [], theta: [['θ₁', 0.6, -2, 2]], hint: 'ACF 在第 1 步之后截尾；PACF 拖尾。试试 θ₁ = 2 与 θ₁ = 0.5：ACF 完全相同。' },
  ma2: { name: 'MA(2)', phi: [], theta: [['θ₁', 0.6, -2, 2], ['θ₂', 0.3, -0.99, 0.99]], hint: 'ACF 在第 2 步之后截尾；PACF 拖尾。' },
  arma11: { name: 'ARMA(1,1)', phi: [['φ₁', 0.6, -0.99, 0.99]], theta: [['θ₁', 0.4, -0.99, 0.99]], hint: 'ACF 与 PACF 都拖尾；ACF 从第 1 步起按 φ₁ 的比例衰减。' },
}
const model = ref('ar1')
const vals = ref({})
const reset = () => {
  const m = models[model.value]
  vals.value = Object.fromEntries([...m.phi, ...m.theta].map(([k, v]) => [k, v]))
}
reset()
const pick = (k) => { model.value = k; reset() }

const phi = computed(() => models[model.value].phi.map(([k]) => vals.value[k]))
const theta = computed(() => models[model.value].theta.map(([k]) => vals.value[k]))

// AR(1) 要求 |φ₁| < 1；AR(2) 用平稳三角形。MA 部分同理判断可逆性
const inTriangle = ([a = 0, b = 0]) => a + b < 1 && b - a < 1 && Math.abs(b) < 1
const stationary = computed(() => inTriangle(phi.value))
const invertible = computed(() => inTriangle(theta.value.map((v) => -v)))

const eps = ref(noise(N + BURN))
const path = computed(() => simulateArma(phi.value, theta.value, eps.value).slice(BURN))
const pathPts = computed(() => path.value.map((v, t) => [t, v]))
const yr = computed(() => {
  const m = Math.max(3, ...path.value.map(Math.abs)) * 1.05
  return [-m, m]
})
const theo = computed(() => (stationary.value ? armaAcf(phi.value, theta.value, LAGS) : null))
const theoPacf = computed(() => theo.value && pacfFromAcf(theo.value))
const samp = computed(() => acf(path.value, LAGS))
const sampPacf = computed(() => pacfFromAcf(samp.value))
const band = 1.96 / Math.sqrt(N)

const f2 = (v) => Math.abs(v).toFixed(2)
const sgn = (v) => (v < 0 ? '−' : '+')
</script>

<template>
  <div class="lab">
    <header>ACF / PACF 图鉴：截尾还是拖尾</header>
    <div class="body">
      <div class="btns">
        <button v-for="(m, k) in models" :key="k" class="btn" :class="{ on: model === k }" @click="pick(k)">{{ m.name }}</button>
        <button class="btn" @click="eps = noise(N + BURN)">换一组随机冲击</button>
      </div>
      <div class="controls">
        <label v-for="[k, , lo, hi] in [...models[model].phi, ...models[model].theta]" :key="model + k">
          {{ k }} <input v-model.number="vals[k]" type="range" :min="lo" :max="hi" step="0.01"><span class="val">{{ vals[k].toFixed(2) }}</span>
        </label>
      </div>
      <div class="readout">
        <div>
          模型 X<sub>t</sub> =
          <template v-for="(v, i) in phi" :key="'p' + i">{{ i ? sgn(v) : (v < 0 ? '−' : '') }} {{ f2(v) }} X<sub>t−{{ i + 1 }}</sub> + </template>
          ε<sub>t</sub>
          <template v-for="(v, j) in theta" :key="'q' + j">{{ ` ${sgn(v)} ${f2(v)} ` }}ε<sub>t−{{ j + 1 }}</sub></template>
        </div>
        <div>
          <b :class="stationary ? 'good' : 'bad'">{{ stationary ? '平稳' : '非平稳' }}</b>
          <template v-if="theta.length"> · <b :class="invertible ? 'good' : 'bad'">{{ invertible ? '可逆' : '不可逆' }}</b></template>
          · {{ models[model].hint }}
        </div>
      </div>

      <Plot v-slot="{ sx, sy }" :x="[0, N]" :y="yr" :height="170">
        <path :d="linePath(pathPts, sx, sy)" class="c1" fill="none" stroke="currentColor" stroke-width="1.2" />
      </Plot>

      <div class="grid2">
        <div class="panel">
          <Plot v-slot="{ sx, sy }" :x="[0, LAGS + 0.5]" :y="[-1, 1]" :height="170" :yticks="[-1, -0.5, 0, 0.5, 1]">
            <rect :x="sx(0)" :y="sy(band)" :width="sx(LAGS + 0.5) - sx(0)" :height="sy(-band) - sy(band)" class="band" />
            <line v-for="(r, k) in theo" :key="k" :x1="sx(k)" :x2="sx(k)" :y1="sy(0)" :y2="sy(r)" class="bar" />
            <circle v-for="(r, k) in samp" :key="'s' + k" :cx="sx(k)" :cy="sy(r)" r="3" class="samp" />
          </Plot>
          <div class="cap">ACF（竖线：理论值；空心点：样本值；阴影：±1.96/√n）</div>
        </div>
        <div class="panel">
          <Plot v-slot="{ sx, sy }" :x="[0, LAGS + 0.5]" :y="[-1, 1]" :height="170" :yticks="[-1, -0.5, 0, 0.5, 1]">
            <rect :x="sx(0)" :y="sy(band)" :width="sx(LAGS + 0.5) - sx(0)" :height="sy(-band) - sy(band)" class="band" />
            <line v-for="(r, k) in theoPacf" :key="k" :x1="sx(k + 1)" :x2="sx(k + 1)" :y1="sy(0)" :y2="sy(r)" class="bar" />
            <circle v-for="(r, k) in sampPacf" :key="'s' + k" :cx="sx(k + 1)" :cy="sy(r)" r="3" class="samp" />
          </Plot>
          <div class="cap">PACF</div>
        </div>
      </div>
      <div v-if="!stationary" class="readout bad">当前系数不满足平稳条件，没有理论 ACF；图中只剩样本值。</div>
    </div>
  </div>
</template>

<style scoped>
.bar { stroke: var(--c-s1); stroke-width: 3; }
.samp { fill: var(--vp-c-bg); stroke: var(--c-s2); stroke-width: 1.5; }
.band { fill: color-mix(in srgb, var(--c-s1) 10%, transparent); }
</style>
