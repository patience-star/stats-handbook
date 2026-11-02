<script setup>
// 单因素方差分析：每个数据对总均值的偏差 = 组内偏差（到组均值）+ 组间偏差（组均值到总均值）；
// 平方和也这样相加（勾股定理），F = 组间均方 / 组内均方
import { computed, ref } from 'vue'
import jStat from 'jstat'
import Plot, { linePath } from '../../components/Plot.vue'

const R = 3, K = 8                         // 3 组，每组 8 个数据
const delta = ref(1)                       // 组均值的间隔
const sigma = ref(1.5)                     // 组内标准差
const z = ref([])
const regen = () => { z.value = Array.from({ length: R }, () => Array.from({ length: K }, () => jStat.normal.sample(0, 1))) }
regen()

const ys = computed(() => z.value.map((row, i) => row.map((e) => 10 + (i - 1) * delta.value + sigma.value * e)))
const gm = computed(() => ys.value.map((row) => row.reduce((s, v) => s + v, 0) / K))
const grand = computed(() => gm.value.reduce((s, v) => s + v, 0) / R)
const SA = computed(() => K * gm.value.reduce((s, m) => s + (m - grand.value) ** 2, 0))
const SE = computed(() => ys.value.reduce((s, row, i) => s + row.reduce((t, v) => t + (v - gm.value[i]) ** 2, 0), 0))
const ST = computed(() => SA.value + SE.value)
const dfA = R - 1, dfE = R * K - R
const F = computed(() => (SA.value / dfA) / (SE.value / dfE))
const p = computed(() => 1 - jStat.centralF.cdf(F.value, dfA, dfE))
const Fcrit = jStat.centralF.inv(0.95, dfA, dfE)

const yr = computed(() => { const all = ys.value.flat(); const lo = Math.min(...all), hi = Math.max(...all), pad = (hi - lo) * 0.08 + 0.2; return [lo - pad, hi + pad] })
const jit = Array.from({ length: R * K }, (_, i) => ((i * 37) % 17) / 17 - 0.5)
const fmax = computed(() => Math.max(8, F.value * 1.15))
const fcurve = computed(() => Array.from({ length: 200 }, (_, i) => { const x = 0.02 + (fmax.value * i) / 199; return [x, jStat.centralF.pdf(x, dfA, dfE)] }))
const tail = computed(() => fcurve.value.filter(([x]) => x >= F.value))
const f2 = (v) => v.toFixed(2)
</script>

<template>
  <div class="lab">
    <header>方差分析：平方和的分解</header>
    <div class="body">
      <div class="controls">
        <label>组间差异 δ <input v-model.number="delta" type="range" min="0" max="3" step="0.1"><span class="val">{{ delta.toFixed(1) }}</span></label>
        <label>组内标准差 σ <input v-model.number="sigma" type="range" min="0.3" max="3" step="0.1"><span class="val">{{ sigma.toFixed(1) }}</span></label>
      </div>
      <div class="btns"><button class="btn" @click="regen">重新生成随机误差</button></div>
      <div class="grid2">
        <div class="panel">
          <Plot v-slot="{ sx, sy }" :x="[0.4, 3.6]" :y="yr" :height="260" :xticks="[1, 2, 3]" :xfmt="(v) => ['', '第 1 组', '第 2 组', '第 3 组'][v]">
            <line :x1="sx(0.4)" :x2="sx(3.6)" :y1="sy(grand)" :y2="sy(grand)" class="grand" />
            <template v-for="(row, i) in ys" :key="i">
              <line :x1="sx(i + 0.65)" :x2="sx(i + 1.35)" :y1="sy(gm[i])" :y2="sy(gm[i])" class="gmean" />
              <line :x1="sx(i + 1.42)" :x2="sx(i + 1.42)" :y1="sy(grand)" :y2="sy(gm[i])" class="between" />
              <template v-for="(v, j) in row" :key="j">
                <line :x1="sx(i + 1 + 0.45 * jit[i * K + j])" :x2="sx(i + 1 + 0.45 * jit[i * K + j])" :y1="sy(v)" :y2="sy(gm[i])" class="within" />
                <circle :cx="sx(i + 1 + 0.45 * jit[i * K + j])" :cy="sy(v)" r="4" class="pt" />
              </template>
            </template>
          </Plot>
          <div class="cap"><span class="sw within" /> 组内偏差（到组均值）　<span class="sw between" /> 组间偏差（组均值到总均值，虚线）</div>
        </div>
        <div class="panel">
          <Plot v-slot="{ sx, sy }" :x="[0, fmax]" :y="[0, 1]" :height="260" :yticks="[]" xlabel="F">
            <path v-if="tail.length" :d="linePath([[tail[0][0], 0], ...tail, [tail[tail.length - 1][0], 0]], sx, sy) + 'Z'" class="tailp" />
            <path :d="linePath(fcurve.map(([x, y]) => [x, Math.min(y, 1)]), sx, sy)" class="fc" />
            <line :x1="sx(Fcrit)" :x2="sx(Fcrit)" :y1="sy(0)" :y2="sy(0.9)" class="crit" />
            <line :x1="sx(Math.min(F, fmax))" :x2="sx(Math.min(F, fmax))" :y1="sy(0)" :y2="sy(1)" class="obs" />
          </Plot>
          <div class="cap">H₀ 下 F({{ dfA }}, {{ dfE }}) 的密度；红线为观测的 F，虚线为 α = 0.05 的临界值 {{ f2(Fcrit) }}</div>
        </div>
      </div>
      <div class="ss">
        <span class="sa" :style="{ width: (100 * SA) / ST + '%' }">S<sub>A</sub></span><span class="se" :style="{ width: (100 * SE) / ST + '%' }">S<sub>e</sub></span>
      </div>
      <div class="readout">
        S<sub>T</sub> = {{ f2(ST) }} = S<sub>A</sub> {{ f2(SA) }}（自由度 {{ dfA }}）+ S<sub>e</sub> {{ f2(SE) }}（自由度 {{ dfE }}）；
        F = ({{ f2(SA) }}/{{ dfA }}) ÷ ({{ f2(SE) }}/{{ dfE }}) = <b>{{ f2(F) }}</b>，p 值 = <b>{{ p < 0.0001 ? p.toExponential(1) : p.toFixed(4) }}</b>
        <span :class="p < 0.05 ? 'good' : ''">{{ p < 0.05 ? '（α = 0.05 下拒绝“各组均值相等”）' : '（不能拒绝“各组均值相等”）' }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grand { stroke: var(--c-s4); stroke-width: 1.5; stroke-dasharray: 6 4; }
.gmean { stroke: var(--c-s2); stroke-width: 3; }
.between { stroke: var(--c-s2); stroke-width: 2; stroke-dasharray: 3 2; }
.within { stroke: var(--c-s1); stroke-width: 1; opacity: 0.6; }
.pt { fill: var(--c-s1); }
.fc { fill: none; stroke: var(--c-s3); stroke-width: 2; }
.tailp { fill: color-mix(in srgb, var(--c-s4) 40%, transparent); }
.crit { stroke: var(--vp-c-text-2); stroke-dasharray: 5 4; }
.obs { stroke: var(--c-s4); stroke-width: 2.2; }
.ss { display: flex; height: 22px; margin-top: 10px; border-radius: 6px; overflow: hidden; font-size: 12px; color: #fff; }
.ss span { display: flex; align-items: center; justify-content: center; min-width: 0; overflow: hidden; }
.sa { background: var(--c-s2); }
.se { background: var(--c-s1); }
.sw { display: inline-block; width: 14px; height: 3px; margin: 0 4px 0 6px; vertical-align: 3px; }
.sw.within { background: var(--c-s1); }
.sw.between { background: var(--c-s2); }
</style>
