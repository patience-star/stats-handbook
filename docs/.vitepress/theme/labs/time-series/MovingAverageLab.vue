<script setup>
// 移动平均是一个线性滤波器：输入频率为 f（周期 1/f）的余弦波，输出是同频的余弦波乘以增益 H(f) = Σ w_j cos(2πfj)。
// k 等于季节周期时，H 在季节频率 1/12, 2/12, … 处恰好为 0，季节成分被完全滤掉
import { computed, ref } from 'vue'
import Plot, { linePath } from '../../components/Plot.vue'
import { movingAverage, noise } from '../../lib/ts.js'
import air from '../../data/air.json'

const N = 120
const z = ref(noise(N))
// 模拟数据：直线趋势 + 周期 12 的季节项（含周期 6 的谐波）+ 白噪声
const sim = computed(() => z.value.map((e, t) => 50 + 0.25 * t + 8 * Math.sin((2 * Math.PI * t) / 12) + 3 * Math.cos((2 * Math.PI * t) / 6) + 2 * e))
const which = ref('sim')
const k = ref(12)
const x = computed(() => (which.value === 'sim' ? sim.value : air.values))
const ma = computed(() => movingAverage(x.value, k.value))
const h = computed(() => Math.floor(k.value / 2))
const w = computed(() => Array.from({ length: 2 * h.value + 1 }, (_, i) => (k.value % 2 === 0 && (i === 0 || i === 2 * h.value) ? 0.5 : 1) / k.value))
const H = (f) => w.value.reduce((s, wj, i) => s + wj * Math.cos(2 * Math.PI * f * (i - h.value)), 0)
const gain = computed(() => Array.from({ length: 241 }, (_, i) => [i / 480, H(i / 480)]))
const seasonal = computed(() => [1, 2, 3, 4, 5, 6].map((j) => H(j / 12)))
const killed = computed(() => seasonal.value.every((v) => Math.abs(v) < 5e-4))
const w2 = computed(() => w.value.reduce((s, v) => s + v * v, 0))

const pts = (arr) => arr.map((v, t) => [t, v]).filter(([, v]) => v != null)
const yr = computed(() => {
  const lo = Math.min(...x.value), hi = Math.max(...x.value), pad = (hi - lo) * 0.06
  return [lo - pad, hi + pad]
})
const len = computed(() => x.value.length)
const tfmt = (t) => (which.value === 'air' ? String(1949 + t / 12) : String(t))
const fticks = [0, 1, 2, 3, 4, 5, 6].map((j) => j / 12)
const ffmt = (f) => { const j = Math.round(f * 12); return j === 0 ? '0' : j === 6 ? '1/2' : `${j}/12` }
const f3 = (v) => (Math.abs(v) < 5e-4 ? '0.000' : v.toFixed(3).replace('-', '−'))
</script>

<template>
  <div class="lab">
    <header>移动平均：一个滤掉季节的滤波器</header>
    <div class="body">
      <div class="btns">
        <button class="btn" :class="{ on: which === 'sim' }" @click="which = 'sim'">模拟数据</button>
        <button class="btn" :class="{ on: which === 'air' }" @click="which = 'air'">航空乘客（1949—1960）</button>
        <button v-if="which === 'sim'" class="btn" @click="z = noise(N)">换一组随机数</button>
        <span style="flex: 1" />
        <button v-for="v in [3, 5, 6, 12, 13, 24]" :key="v" class="btn" :class="{ on: k === v }" @click="k = v">k = {{ v }}</button>
      </div>
      <div class="controls">
        <label>移动平均项数 k <input v-model.number="k" type="range" min="2" max="25" step="1"><span class="val">{{ k }}</span></label>
      </div>
      <Plot v-slot="{ sx, sy }" :x="[0, len - 1]" :y="yr" :height="220" :xticks="which === 'air' ? [0, 24, 48, 72, 96, 120] : undefined" :xfmt="tfmt" :xlabel="which === 'air' ? '' : '月份 t'">
        <path :d="linePath(pts(x), sx, sy)" class="raw" />
        <path :d="linePath(pts(ma), sx, sy)" class="ma" />
      </Plot>
      <div class="cap"><span class="sw raw" /> 原序列　<span class="sw ma" /> {{ k % 2 ? k : '2×' + k }} 期中心化移动平均（两端各缺 {{ h }} 期）</div>
      <div class="grid2">
        <div class="panel">
          <Plot v-slot="{ sx, sy }" :x="[-13, 13]" :y="[0, 0.55]" :height="150" :yticks="[0, 0.25, 0.5]" :xticks="[-12, -6, 0, 6, 12]" xlabel="j">
            <rect v-for="(wj, i) in w" :key="i" :x="sx(i - h - 0.38)" :y="sy(wj)" :width="sx(0.76) - sx(0)" :height="sy(0) - sy(wj)" class="wbar" />
          </Plot>
          <div class="cap">权数 w<sub>j</sub>：中间各项 1/{{ k }}{{ k % 2 ? '' : `，两端各 1/${2 * k}` }}，总和为 1</div>
        </div>
        <div class="panel">
          <Plot v-slot="{ sx, sy }" :x="[0, 0.5]" :y="[-0.35, 1.05]" :height="150" :xticks="fticks" :xfmt="ffmt" :yticks="[0, 0.5, 1]" xlabel="频率 f">
            <line v-for="f in fticks.slice(1)" :key="f" :x1="sx(f)" :x2="sx(f)" :y1="sy(-0.35)" :y2="sy(1.05)" class="sfreq" />
            <line :x1="sx(0)" :x2="sx(0.5)" :y1="sy(0)" :y2="sy(0)" class="zero" />
            <path :d="linePath(gain, sx, sy)" class="gain" />
            <circle v-for="(v, i) in seasonal" :key="i" :cx="sx((i + 1) / 12)" :cy="sy(v)" r="4" class="sdot" />
          </Plot>
          <div class="cap">增益 H(f)：周期为 1/f 的波动通过后振幅乘以 H(f)，负值表示被反相；红点是季节频率</div>
        </div>
      </div>
      <div class="readout">
        季节频率 1/12, 2/12, …, 6/12 处的增益：{{ seasonal.map(f3).join('，') }}
        <b v-if="killed" class="good">——全部为 0，周期为 12 的季节波动被完全消除</b><span v-else class="bad">——不全为 0，季节波动有残留</span><br>
        直线趋势通过后保持不变（权数之和为 1、关于中心对称）；白噪声通过后方差变为原来的 Σw<sub>j</sub>² = <b>{{ w2.toFixed(4) }}</b> 倍
      </div>
    </div>
  </div>
</template>

<style scoped>
.raw { fill: none; stroke: var(--vp-c-text-3); stroke-width: 1.2; }
.ma { fill: none; stroke: var(--c-s1); stroke-width: 2.6; }
.wbar { fill: color-mix(in srgb, var(--c-s1) 55%, transparent); }
.gain { fill: none; stroke: var(--c-s1); stroke-width: 2; }
.sfreq { stroke: var(--c-s4); stroke-opacity: 0.35; stroke-dasharray: 3 3; }
.zero { stroke: var(--vp-c-text-3); }
.sdot { fill: var(--c-s4); }
.sw { display: inline-block; width: 14px; height: 3px; margin: 0 4px 0 6px; vertical-align: 3px; }
.sw.raw { background: var(--vp-c-text-3); }
.sw.ma { background: var(--c-s1); height: 4px; }
</style>
