<script setup>
// AR(2) 实验室：参数平面（平稳三角形）与复平面（倒数根）两种视角联动，下方是同一组冲击驱动的路径与 ACF/PACF
import { computed, ref } from 'vue'
import Plot, { linePath } from '../../components/Plot.vue'
import { acf, noise, pacfFromAcf, simulateArma } from '../../lib/ts.js'

const N = 200, BURN = 100, LAGS = 20
const phi1 = ref(1.0)
const phi2 = ref(-0.5)
const eps = ref(noise(N + BURN))

const presets = [
  ['AR(1) 型', 0.7, 0],
  ['两个实根', 1.1, -0.28],
  ['负根·正负交替', -0.6, 0.2],
  ['复根·周期 8', 1.0, -0.5],
  ['复根·慢衰减', 1.54, -0.9],
  ['接近单位根', 1.6, -0.62],
  ['非平稳', 0.6, 0.5],
]

// 倒数根 λ：λ² − φ1 λ − φ2 = 0（它们是 φ(z) = 1 − φ1 z − φ2 z² 的根的倒数）
const roots = computed(() => {
  const d = phi1.value ** 2 + 4 * phi2.value
  if (d >= 0) {
    const s = Math.sqrt(d)
    return { real: true, l: [(phi1.value + s) / 2, (phi1.value - s) / 2] }
  }
  return { real: false, re: phi1.value / 2, im: Math.sqrt(-d) / 2 }
})
const modulus = computed(() => (roots.value.real ? Math.max(...roots.value.l.map(Math.abs)) : Math.hypot(roots.value.re, roots.value.im)))
const stationary = computed(() => modulus.value < 1)
const omega = computed(() => (roots.value.real ? null : Math.atan2(roots.value.im, roots.value.re)))

// 平稳时丢掉前 BURN 期；非平稳时从 0 开始，并在数值过大处截断，免得爆炸后什么都看不见
const path = computed(() => {
  const x = simulateArma([phi1.value, phi2.value], [], eps.value)
  if (stationary.value) return x.slice(BURN)
  const out = x.slice(0, N)
  const i = out.findIndex((v) => !Number.isFinite(v) || Math.abs(v) > 1e6)
  return i < 0 ? out : out.slice(0, i)
})
const pathPts = computed(() => path.value.map((v, t) => [t, v]))
const yr = computed(() => {
  const m = Math.max(3, ...path.value.map(Math.abs)) * 1.05
  return [-m, m]
})

// 理论 ACF：ρ1 = φ1/(1−φ2)，ρk = φ1 ρ_{k−1} + φ2 ρ_{k−2}（Yule–Walker 递推，精确）
const theo = computed(() => {
  if (!stationary.value) return null
  const r = [1, phi1.value / (1 - phi2.value)]
  for (let k = 2; k <= LAGS; k++) r.push(phi1.value * r[k - 1] + phi2.value * r[k - 2])
  return r
})
const theoPacf = computed(() => theo.value && pacfFromAcf(theo.value))
const samp = computed(() => (stationary.value ? acf(path.value, LAGS) : null))
const sampPacf = computed(() => samp.value && pacfFromAcf(samp.value))
const band = 1.96 / Math.sqrt(N)

// 拖拽：左图拖 (φ1, φ2)；右图拖倒数根
const drag = ref(null)
let fixed = null   // 拖动实根时，另一个保持不动的根
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
function start(e, inv, kind) {
  drag.value = kind
  e.currentTarget.setPointerCapture(e.pointerId)
  if (kind === 'root') {
    const [re] = inv(e)
    const r = roots.value
    fixed = r.real ? (Math.abs(r.l[0] - re) < Math.abs(r.l[1] - re) ? r.l[1] : r.l[0]) : null
  }
  move(e, inv)
}
function move(e, inv) {
  if (!drag.value) return
  const [x, y] = inv(e)
  if (drag.value === 'phi') {
    phi1.value = clamp(x, -2.2, 2.2)
    phi2.value = clamp(y, -1.2, 1.2)
    return
  }
  const re = clamp(x, -1.35, 1.35), im = Math.min(Math.abs(y), 1.35)
  if (im > 0.03) {          // 一对共轭复根 re ± i·im
    fixed = null
    phi1.value = 2 * re
    phi2.value = -(re * re + im * im)
  } else {                  // 实根：拖动的根取 re，另一个不动
    if (fixed === null) fixed = re
    phi1.value = re + fixed
    phi2.value = -re * fixed
  }
}
const stop = () => { drag.value = null }

const f2 = (v) => v.toFixed(2).replace('-', '−')
const sign = (v) => (v < 0 ? '−' : '+')
const zRoots = computed(() => {
  const r = roots.value
  if (r.real) return r.l.map((l) => (Math.abs(l) < 1e-9 ? '∞' : f2(1 / l))).join('，')
  const m2 = r.re ** 2 + r.im ** 2
  return `${f2(r.re / m2)} ± ${Math.abs(r.im / m2).toFixed(2)}i`
})
const parabola = Array.from({ length: 81 }, (_, i) => { const x = -2 + i / 20; return [x, -(x * x) / 4] })
</script>

<template>
  <div class="lab">
    <header>AR(2)：平稳三角形与单位圆</header>
    <div class="body">
      <div class="btns">
        <button v-for="[name, a, b] in presets" :key="name" class="btn" @click="phi1 = a; phi2 = b">{{ name }}</button>
        <button class="btn" @click="eps = noise(N + BURN)">换一组随机冲击</button>
      </div>

      <div class="grid2">
        <div class="panel">
          <Plot v-slot="{ sx, sy, inv }" :x="[-2.2, 2.2]" :y="[-1.2, 1.2]" equal :xticks="[-2, -1, 0, 1, 2]" :yticks="[-1, 0, 1]">
            <polygon :points="`${sx(-2)},${sy(-1)} ${sx(2)},${sy(-1)} ${sx(0)},${sy(1)}`" class="tri" />
            <path :d="linePath(parabola, sx, sy)" class="para" />
            <text :x="sx(0)" :y="sy(0.45)" text-anchor="middle" class="region">实根</text>
            <text :x="sx(0)" :y="sy(-0.62)" text-anchor="middle" class="region">复根（伪周期）</text>
            <text :x="sx(2.15)" :y="sy(1.05)" text-anchor="end" class="axis-name">φ₁ 横轴 · φ₂ 纵轴</text>
            <circle :cx="sx(phi1)" :cy="sy(phi2)" r="7" class="pt" :class="{ out: !stationary }" />
            <rect
              :x="sx(-2.2)" :y="sy(1.2)" :width="sx(2.2) - sx(-2.2)" :height="sy(-1.2) - sy(1.2)" fill="transparent" class="drag"
              @pointerdown="start($event, inv, 'phi')" @pointermove="move($event, inv)" @pointerup="stop" @pointercancel="stop"
            />
          </Plot>
          <div class="cap">参数平面：拖动圆点改变 (φ₁, φ₂)。三角形内平稳，虚线抛物线 φ₁² + 4φ₂ = 0 分开实根与复根。</div>
        </div>
        <div class="panel">
          <Plot v-slot="{ sx, sy, inv }" :x="[-1.4, 1.4]" :y="[-1.4, 1.4]" equal :xticks="[-1, 0, 1]" :yticks="[-1, 0, 1]">
            <circle :cx="sx(0)" :cy="sy(0)" :r="sx(1) - sx(0)" class="unit" />
            <template v-if="roots.real">
              <circle v-for="(l, i) in roots.l" :key="i" :cx="sx(l)" :cy="sy(0)" r="7" class="pt" :class="{ out: Math.abs(l) >= 1 }" />
            </template>
            <template v-else>
              <line :x1="sx(0)" :y1="sy(0)" :x2="sx(roots.re)" :y2="sy(roots.im)" class="ray" />
              <circle :cx="sx(roots.re)" :cy="sy(roots.im)" r="7" class="pt" :class="{ out: !stationary }" />
              <circle :cx="sx(roots.re)" :cy="sy(-roots.im)" r="7" class="pt ghost" :class="{ out: !stationary }" />
            </template>
            <rect
              :x="sx(-1.4)" :y="sy(1.4)" :width="sx(1.4) - sx(-1.4)" :height="sy(-1.4) - sy(1.4)" fill="transparent" class="drag"
              @pointerdown="start($event, inv, 'root')" @pointermove="move($event, inv)" @pointerup="stop" @pointercancel="stop"
            />
          </Plot>
          <div class="cap">复平面：倒数根 λ。拖离实轴得到一对共轭复根，沿实轴拖动单个实根。根在单位圆内 ⟺ 平稳。</div>
        </div>
      </div>

      <div class="readout">
        <div>模型 X<sub>t</sub> = {{ f2(phi1) }} X<sub>t−1</sub> {{ sign(phi2) }} {{ Math.abs(phi2).toFixed(2) }} X<sub>t−2</sub> + ε<sub>t</sub></div>
        <div v-if="roots.real">倒数根 λ = {{ f2(roots.l[0]) }}，{{ f2(roots.l[1]) }}（实根）；φ(z) 的根 z = 1/λ = {{ zRoots }}</div>
        <div v-else>
          倒数根 λ = {{ f2(roots.re) }} ± {{ roots.im.toFixed(2) }}i，模 r = {{ modulus.toFixed(3) }}，辐角 ω = {{ omega.toFixed(3) }}；
          φ(z) 的根 z = {{ zRoots }}
        </div>
        <div>
          <b v-if="stationary" class="good">平稳</b><b v-else class="bad">非平稳</b>：最大的 |λ| = {{ modulus.toFixed(3) }}{{ stationary ? ' < 1' : ' ≥ 1' }}
          <template v-if="!roots.real && stationary">；ACF 是衰减的余弦波，伪周期 2π/ω ≈ <b>{{ (2 * Math.PI / omega).toFixed(1) }}</b> 期，每期振幅衰减为原来的 {{ modulus.toFixed(2) }} 倍</template>
        </div>
      </div>

      <Plot v-slot="{ sx, sy }" :x="[0, N]" :y="yr" :height="190">
        <path :d="linePath(pathPts, sx, sy)" class="c1" fill="none" stroke="currentColor" stroke-width="1.4" />
      </Plot>
      <div class="cap">一条样本路径（{{ stationary ? `丢掉前 ${BURN} 期后的 ${N} 期` : '从 0 出发，发散后截断' }}）。换参数时冲击序列不变，可以看出同一组冲击在不同“记忆方式”下的表现。</div>

      <div v-if="theo" class="grid2">
        <div class="panel">
          <Plot v-slot="{ sx, sy }" :x="[0, LAGS + 0.5]" :y="[-1, 1]" :height="170" :yticks="[-1, -0.5, 0, 0.5, 1]">
            <rect :x="sx(0)" :y="sy(band)" :width="sx(LAGS + 0.5) - sx(0)" :height="sy(-band) - sy(band)" class="band" />
            <line v-for="(r, k) in theo" :key="k" :x1="sx(k)" :x2="sx(k)" :y1="sy(0)" :y2="sy(r)" class="bar" />
            <circle v-for="(r, k) in samp" :key="'s' + k" :cx="sx(k)" :cy="sy(r)" r="3" class="samp" />
          </Plot>
          <div class="cap">ACF：竖线为理论值，空心点为样本值，阴影为 ±1.96/√n</div>
        </div>
        <div class="panel">
          <Plot v-slot="{ sx, sy }" :x="[0, LAGS + 0.5]" :y="[-1, 1]" :height="170" :yticks="[-1, -0.5, 0, 0.5, 1]">
            <rect :x="sx(0)" :y="sy(band)" :width="sx(LAGS + 0.5) - sx(0)" :height="sy(-band) - sy(band)" class="band" />
            <line v-for="(r, k) in theoPacf" :key="k" :x1="sx(k + 1)" :x2="sx(k + 1)" :y1="sy(0)" :y2="sy(r)" class="bar" />
            <circle v-for="(r, k) in sampPacf" :key="'s' + k" :cx="sx(k + 1)" :cy="sy(r)" r="3" class="samp" />
          </Plot>
          <div class="cap">PACF：AR(2) 的理论 PACF 在第 2 步之后为 0</div>
        </div>
      </div>
      <div v-else class="readout bad">非平稳过程没有（不随时间变化的）理论自相关函数。把参数拖回三角形内看看。</div>
    </div>
  </div>
</template>

<style scoped>
.tri { fill: color-mix(in srgb, var(--c-s1) 10%, transparent); stroke: var(--c-s1); stroke-width: 1.5; }
.para { fill: none; stroke: var(--c-s2); stroke-width: 1.5; stroke-dasharray: 5 4; }
.region { font-size: 12px; fill: var(--vp-c-text-2); }
.axis-name { font-size: 11px; fill: var(--vp-c-text-3); }
.unit { fill: color-mix(in srgb, var(--c-s1) 8%, transparent); stroke: var(--c-s1); stroke-width: 1.5; }
.ray { stroke: var(--vp-c-text-3); stroke-dasharray: 3 3; }
.pt { fill: var(--c-s4); stroke: var(--vp-c-bg); stroke-width: 2; pointer-events: none; }
.pt.ghost { fill-opacity: 0.45; }
.pt.out { fill: var(--vp-c-text-3); }
.bar { stroke: var(--c-s1); stroke-width: 3; }
.samp { fill: var(--vp-c-bg); stroke: var(--c-s2); stroke-width: 1.5; }
.band { fill: color-mix(in srgb, var(--c-s1) 10%, transparent); }
</style>
