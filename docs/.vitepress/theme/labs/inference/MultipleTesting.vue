<script setup>
// 多重检验：m 个原假设全都成立，每个检验各自用 α = 0.05，“至少错拒一个”的概率是 1 − (1 − α)^m；
// 原假设成立时 p 值服从 U(0, 1)，所以直接用均匀随机数模拟
import { computed, ref, watch } from 'vue'
import Plot, { linePath } from '../../components/Plot.vue'

const m = ref(10)
const alpha = 0.05
const R = 3000
const one = ref([])
const sim = ref({ raw: 0, bonf: 0 })
function run() {
  let raw = 0, bonf = 0
  for (let r = 0; r < R; r++) {
    let minp = 1
    for (let i = 0; i < m.value; i++) minp = Math.min(minp, Math.random())
    if (minp < alpha) raw++
    if (minp < alpha / m.value) bonf++
  }
  sim.value = { raw: raw / R, bonf: bonf / R }
  one.value = Array.from({ length: m.value }, () => Math.random())
}
watch(m, run, { immediate: true })
const ms = Array.from({ length: 50 }, (_, i) => i + 1)
const theo = ms.map((k) => [k, 1 - (1 - alpha) ** k])
const theoB = ms.map((k) => [k, 1 - (1 - alpha / k) ** k])
</script>

<template>
  <div class="lab">
    <header>多重检验：显著性被“稀释”</header>
    <div class="body">
      <div class="controls">
        <label>检验的个数 m <input v-model.number="m" type="range" min="1" max="50" step="1"><span class="val">{{ m }}</span></label>
      </div>
      <div class="btns"><button class="btn" @click="run">重新模拟</button></div>
      <Plot v-slot="{ sx, sy }" :x="[0, 1]" :y="[0, 1]" :height="90" :yticks="[]" :xticks="[0, 0.05, 0.25, 0.5, 0.75, 1]">
        <line :x1="sx(alpha)" :x2="sx(alpha)" :y1="sy(0)" :y2="sy(1)" class="a" />
        <line :x1="sx(alpha / m)" :x2="sx(alpha / m)" :y1="sy(0)" :y2="sy(1)" class="b" />
        <circle v-for="(p, i) in one" :key="i" :cx="sx(p)" :cy="sy(0.5)" r="5" :class="p < alpha ? 'hit' : 'pt'" />
      </Plot>
      <div class="cap">一次模拟中 {{ m }} 个 p 值（原假设全部成立）；红色虚线 α = 0.05，紫色虚线 Bonferroni 界限 α/m；红点是“显著”但其实是误报</div>
      <Plot v-slot="{ sx, sy }" :x="[1, 50]" :y="[0, 1]" :height="220" :yticks="[0, 0.05, 0.25, 0.5, 0.75, 1]" xlabel="检验个数 m">
        <path :d="linePath(theo, sx, sy)" class="raw" />
        <path :d="linePath(theoB, sx, sy)" class="bonf" />
        <circle :cx="sx(m)" :cy="sy(sim.raw)" r="5" class="dot-raw" />
        <circle :cx="sx(m)" :cy="sy(sim.bonf)" r="5" class="dot-bonf" />
      </Plot>
      <div class="cap"><span class="sw raw" /> 不校正：1 − (1 − α)<sup>m</sup>　<span class="sw bonf" /> Bonferroni 校正；圆点为模拟值</div>
      <div class="readout">
        m = {{ m }} 时，“至少有一个误报”的概率：不校正 <b>{{ (sim.raw * 100).toFixed(1) }}%</b>（理论 {{ ((1 - (1 - alpha) ** m) * 100).toFixed(1) }}%）；
        Bonferroni 校正后 <b>{{ (sim.bonf * 100).toFixed(1) }}%</b>（理论 {{ ((1 - (1 - alpha / m) ** m) * 100).toFixed(1) }}%，不会超过 5%；模拟值的小幅波动来自随机性）。
      </div>
    </div>
  </div>
</template>

<style scoped>
.a { stroke: var(--c-s4); stroke-dasharray: 5 4; stroke-width: 1.5; }
.b { stroke: var(--c-s5); stroke-dasharray: 3 3; stroke-width: 1.5; }
.pt { fill: var(--c-s1); opacity: 0.6; }
.hit { fill: var(--c-s4); }
.raw { fill: none; stroke: var(--c-s4); stroke-width: 2.2; }
.bonf { fill: none; stroke: var(--c-s5); stroke-width: 2.2; }
.dot-raw { fill: var(--c-s4); }
.dot-bonf { fill: var(--c-s5); }
.sw { display: inline-block; width: 14px; height: 3px; margin: 0 4px 0 6px; vertical-align: 3px; }
.sw.raw { background: var(--c-s4); }
.sw.bonf { background: var(--c-s5); }
</style>
