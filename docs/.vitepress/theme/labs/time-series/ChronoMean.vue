<script setup>
// 时点序列的序时平均：两次记录之间的曲线是未知的。假定其间均匀变动（线性插值），平均水平 = 折线下的面积
// （一串梯形）÷ 总时长；若数值只在记录的时刻才变动（阶梯），就是矩形面积之和 ÷ 总时长
import { computed, ref } from 'vue'
import Plot, { linePath } from '../../components/Plot.vue'

const T = 12
const vals = ref([120, 150, 130, 160, 140])
const equal = ref(false)
const step = ref(false)
const times = computed(() => (equal.value ? [0, 3, 6, 9, 12] : [0, 2, 6, 9, 12]))
const pieces = computed(() => times.value.slice(1).map((t1, i) => {
  const t0 = times.value[i], a0 = vals.value[i], a1 = vals.value[i + 1]
  return { t0, t1, a0, a1, f: t1 - t0, area: step.value ? a0 * (t1 - t0) : ((a0 + a1) / 2) * (t1 - t0) }
}))
const area = computed(() => pieces.value.reduce((s, p) => s + p.area, 0))
const avg = computed(() => area.value / T)
const naive = computed(() => vals.value.reduce((s, v) => s + v, 0) / vals.value.length)
const halfEnds = computed(() => { const a = vals.value; return (a[0] / 2 + a[1] + a[2] + a[3] + a[4] / 2) / 4 })
const pts = computed(() => (step.value
  ? [...pieces.value.flatMap((p) => [[p.t0, p.a0], [p.t1, p.a0]]), [T, vals.value[4]]]
  : times.value.map((t, i) => [t, vals.value[i]])))
const shape = (p, sx, sy) => {
  const right = step.value ? p.a0 : p.a1
  return `${sx(p.t0)},${sy(0)} ${sx(p.t0)},${sy(p.a0)} ${sx(p.t1)},${sy(right)} ${sx(p.t1)},${sy(0)}`
}
const date = (t) => (t === 12 ? '12/31' : `${t + 1}/1`)
const term = (p) => (step.value ? `${p.a0}×${p.f}` : `(${p.a0}+${p.a1})/2×${p.f}`)
</script>

<template>
  <div class="lab">
    <header>序时平均：时点序列的梯形面积</header>
    <div class="body">
      <div class="btns">
        <button class="btn" :class="{ on: !equal }" @click="equal = false">间隔不等（例 1）</button>
        <button class="btn" :class="{ on: equal }" @click="equal = true">间隔相等</button>
        <button class="btn" :class="{ on: !step }" @click="step = false">记录之间均匀变动（梯形）</button>
        <button class="btn" :class="{ on: step }" @click="step = true">只在记录时变动（阶梯）</button>
      </div>
      <div class="controls">
        <label v-for="(t, i) in times" :key="i">{{ date(t) }} <input v-model.number="vals[i]" type="range" min="60" max="200" step="1"><span class="val">{{ vals[i] }}</span></label>
      </div>
      <Plot v-slot="{ sx, sy }" :x="[0, T]" :y="[0, 200]" :height="250" :xticks="times" :xfmt="date" xlabel="日期" ylabel="库存（吨）">
        <polygon v-for="(p, i) in pieces" :key="i" :points="shape(p, sx, sy)" :class="i % 2 ? 'pa' : 'pb'" />
        <path :d="linePath(pts, sx, sy)" class="curve" />
        <line :x1="sx(0)" :x2="sx(T)" :y1="sy(avg)" :y2="sy(avg)" class="avg" />
        <text :x="sx(T) - 4" :y="sy(avg) - 6" text-anchor="end" class="avg-t">序时平均 {{ avg.toFixed(2) }}</text>
        <circle v-for="(t, i) in times" :key="'p' + i" :cx="sx(t)" :cy="sy(vals[i])" r="5" class="pt" />
      </Plot>
      <div class="cap">每一块的面积 = 这段时间里“库存 × 时长”的累计；总面积 ÷ 12 个月 = 平均库存（虚线）。拖动滑块改变各次记录的数值。</div>
      <div class="readout">
        <template v-if="!step">
          Σ (a<sub>i</sub> + a<sub>i+1</sub>)/2 × f<sub>i</sub> = {{ pieces.map(term).join(' + ') }} = {{ area.toFixed(1) }}；÷ 12 = <b>{{ avg.toFixed(2) }}</b><br>
          <template v-if="equal">间隔相等时就是首末折半法：(a₁/2 + a₂ + a₃ + a₄ + a₅/2) / 4 = <b>{{ halfEnds.toFixed(2) }}</b><br></template>
        </template>
        <template v-else>
          Σ a<sub>i</sub> f<sub>i</sub> = {{ pieces.map(term).join(' + ') }} = {{ area.toFixed(1) }}；÷ 12 = <b>{{ avg.toFixed(2) }}</b>（12/31 的记录之后没有持续时间，不进入计算）<br>
        </template>
        对照：五个记录值的简单平均 = {{ naive.toFixed(2) }}，它把每次记录看得同样重要，忽略了间隔的长短{{ equal && !step ? '，也忽略了首末两点各只“管”半个间隔' : '' }}。
      </div>
    </div>
  </div>
</template>

<style scoped>
.pa { fill: color-mix(in srgb, var(--c-s1) 22%, transparent); }
.pb { fill: color-mix(in srgb, var(--c-s3) 22%, transparent); }
.curve { fill: none; stroke: var(--c-s1); stroke-width: 2.2; }
.avg { stroke: var(--c-s2); stroke-width: 2; stroke-dasharray: 6 4; }
.avg-t { fill: var(--c-s2); font-size: 12px; font-weight: 600; }
.pt { fill: var(--c-s4); stroke: var(--vp-c-bg); stroke-width: 2; }
</style>
