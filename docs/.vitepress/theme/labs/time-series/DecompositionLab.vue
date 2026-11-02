<script setup>
// 经典分解（移动平均趋势剔除法）：趋势 = 2×12 移动平均；季节指数 = 去趋势后同月平均再标准化；余项 = 剩下的部分。
// 模拟数据按乘法模型生成，真实的季节指数已知，可以直接与估计值比较
import { computed, ref } from 'vue'
import Plot, { linePath } from '../../components/Plot.vue'
import { decompose, noise } from '../../lib/ts.js'
import air from '../../data/air.json'

const MONTHS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
const TRUE_S = [0.92, 0.88, 1.0, 0.97, 0.98, 1.1, 1.22, 1.21, 1.06, 0.93, 0.81, 0.92]   // 平均恰为 1
const N = 144
const z = ref(noise(N))
const sim = computed(() => z.value.map((e, t) => 120 * 1.01 ** t * TRUE_S[t % 12] * (1 + 0.03 * e)))
const which = ref('air')
const model = ref('mult')
const mult = computed(() => model.value === 'mult')
const x = computed(() => (which.value === 'air' ? air.values : sim.value))
const dec = computed(() => decompose(x.value, 12, model.value))
const adj = computed(() => x.value.map((v, t) => (mult.value ? v / dec.value.S[t] : v - dec.value.S[t])))

const pts = (arr) => arr.map((v, t) => [t, v]).filter(([, v]) => v != null)
const range = (arr, base) => {
  const v = arr.filter((a) => a != null), lo = Math.min(base ?? Infinity, ...v), hi = Math.max(base ?? -Infinity, ...v), p = (hi - lo) * 0.08
  return [lo - p, hi + p]
}
const yr = computed(() => range([...x.value, ...adj.value]))
const base = computed(() => (mult.value ? 1 : 0))
const sr = computed(() => range([...dec.value.seasonal, ...(which.value === 'sim' && mult.value ? TRUE_S : [])], base.value))
const rr = computed(() => range(dec.value.remainder, base.value))
const yearTicks = [0, 24, 48, 72, 96, 120]
const yfmt = (t) => String(1949 + t / 12)

// 余项与季节项的相关系数：前 3 年与后 3 年（只用有趋势值的月份）
function corr(a, b) {
  const n = a.length, ma = a.reduce((s, v) => s + v, 0) / n, mb = b.reduce((s, v) => s + v, 0) / n
  let sab = 0, saa = 0, sbb = 0
  for (let i = 0; i < n; i++) { sab += (a[i] - ma) * (b[i] - mb); saa += (a[i] - ma) ** 2; sbb += (b[i] - mb) ** 2 }
  return sab / Math.sqrt(saa * sbb)
}
const rc = computed(() => {
  const idx = dec.value.remainder.map((v, t) => t).filter((t) => dec.value.remainder[t] != null)
  const part = (ts) => corr(ts.map((t) => dec.value.remainder[t]), ts.map((t) => dec.value.S[t]))
  return [part(idx.slice(0, 36)), part(idx.slice(-36))]
})
const worst = computed(() => Math.max(...rc.value.map(Math.abs)))
const maxErr = computed(() => Math.max(...dec.value.seasonal.map((v, i) => Math.abs(v - TRUE_S[i]))))
const fmtS = (v) => (mult.value ? (v * 100).toFixed(1) + '%' : v.toFixed(1).replace('-', '−'))
const f3 = (v) => v.toFixed(3).replace('-', '−')
</script>

<template>
  <div class="lab">
    <header>时间序列的分解：趋势 × 季节 × 余项</header>
    <div class="body">
      <div class="btns">
        <button class="btn" :class="{ on: which === 'air' }" @click="which = 'air'">航空乘客（1949—1960）</button>
        <button class="btn" :class="{ on: which === 'sim' }" @click="which = 'sim'">模拟数据（成分已知）</button>
        <button v-if="which === 'sim'" class="btn" @click="z = noise(N)">换一组随机数</button>
        <span style="flex: 1" />
        <button class="btn" :class="{ on: mult }" @click="model = 'mult'">乘法模型</button>
        <button class="btn" :class="{ on: !mult }" @click="model = 'add'">加法模型</button>
      </div>
      <Plot v-slot="{ sx, sy }" :x="[0, N - 1]" :y="yr" :height="220" :xticks="yearTicks" :xfmt="yfmt">
        <path :d="linePath(pts(x), sx, sy)" class="raw" />
        <path :d="linePath(pts(adj), sx, sy)" class="adj" />
        <path :d="linePath(pts(dec.trend), sx, sy)" class="trend" />
      </Plot>
      <div class="cap"><span class="sw raw" /> 原序列　<span class="sw trend" /> 趋势（2×12 移动平均）　<span class="sw adj" /> 季节调整后（{{ mult ? 'Y / S' : 'Y − S' }}）</div>
      <div class="grid2">
        <div class="panel">
          <Plot v-slot="{ sx, sy }" :x="[0.4, 12.6]" :y="sr" :height="190" :xticks="[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]" :yfmt="mult ? (v) => Math.round(v * 100) + '%' : undefined" xlabel="月">
            <line :x1="sx(0.4)" :x2="sx(12.6)" :y1="sy(base)" :y2="sy(base)" class="zero" />
            <rect v-for="(v, i) in dec.seasonal" :key="i" :x="sx(i + 1 - 0.36)" :y="sy(Math.max(v, base))" :width="sx(0.72) - sx(0)" :height="Math.abs(sy(v) - sy(base))" :class="v >= base ? 'up' : 'down'" />
            <template v-if="which === 'sim' && mult">
              <circle v-for="(v, i) in TRUE_S" :key="'t' + i" :cx="sx(i + 1)" :cy="sy(v)" r="4" class="truth" />
            </template>
          </Plot>
          <div class="cap">{{ mult ? '季节指数（平均为 100%）' : '季节项（平均为 0）' }}{{ which === 'sim' && mult ? '；圆点是真实值' : '' }}</div>
        </div>
        <div class="panel">
          <Plot v-slot="{ sx, sy }" :x="[0, N - 1]" :y="rr" :height="190" :xticks="yearTicks" :xfmt="yfmt">
            <line :x1="sx(0)" :x2="sx(N - 1)" :y1="sy(base)" :y2="sy(base)" class="zero" />
            <path :d="linePath(pts(dec.remainder), sx, sy)" class="rem" />
          </Plot>
          <div class="cap">余项（{{ mult ? 'Y / (T·S)，围绕 1' : 'Y − T − S，围绕 0' }}）</div>
        </div>
      </div>
      <div class="readout">
        {{ mult ? '季节指数' : '季节项' }}：<span v-for="(v, i) in dec.seasonal" :key="i">{{ MONTHS[i] }}月 {{ fmtS(v) }}{{ i < 11 ? '，' : '' }}</span><br>
        余项与季节项的相关系数：前 3 年 <b>{{ f3(rc[0]) }}</b>，后 3 年 <b>{{ f3(rc[1]) }}</b>
        <span v-if="worst > 0.7" class="bad">——余项里还残留着明显的季节形状，模型形式不合适</span>
        <span v-else-if="worst > 0.3">——余项里仍有一些季节形状：季节波动的幅度在逐年变化</span>
        <span v-else class="good">——余项与季节形状基本无关</span>
        <template v-if="which === 'sim' && mult"><br>估计的季节指数与真值的最大偏差：{{ (maxErr * 100).toFixed(2) }} 个百分点</template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.raw { fill: none; stroke: var(--vp-c-text-3); stroke-width: 1.2; }
.trend { fill: none; stroke: var(--c-s1); stroke-width: 2.6; }
.adj { fill: none; stroke: var(--c-s2); stroke-width: 1.5; }
.rem { fill: none; stroke: var(--c-s5); stroke-width: 1.4; }
.zero { stroke: var(--vp-c-text-3); stroke-dasharray: 4 3; }
.up { fill: color-mix(in srgb, var(--c-s3) 60%, transparent); }
.down { fill: color-mix(in srgb, var(--c-s4) 45%, transparent); }
.truth { fill: none; stroke: var(--vp-c-text-1); stroke-width: 1.8; }
.sw { display: inline-block; width: 14px; height: 3px; margin: 0 4px 0 6px; vertical-align: 3px; }
.sw.raw { background: var(--vp-c-text-3); }
.sw.trend { background: var(--c-s1); height: 4px; }
.sw.adj { background: var(--c-s2); }
</style>
