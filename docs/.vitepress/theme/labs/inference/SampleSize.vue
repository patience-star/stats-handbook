<script setup>
// 样本量计算器：n = (u σ / E)² 或 u² p(1−p) / E²，可选有限总体修正；双对数坐标下 n ∝ E^(−2) 是斜率 −2 的直线
import { computed, ref } from 'vue'
import jStat from 'jstat'
import Plot, { linePath } from '../../components/Plot.vue'

const kind = ref('mean')     // mean：估计均值；prop：估计比例
const conf = ref(0.95)
const sigma = ref(10)
const ratio = ref(0.2)       // 估计均值时，允许误差 E 与 σ 之比
const eProp = ref(0.03)      // 估计比例时的允许误差
const p = ref(0.5)
const N = ref('')            // 总体规模；留空表示重复抽样或无限总体

const u = computed(() => jStat.normal.inv(1 - (1 - conf.value) / 2, 0, 1))
const E = computed(() => (kind.value === 'mean' ? ratio.value * sigma.value : eProp.value))
const n0 = (e) => (kind.value === 'mean' ? ((u.value * sigma.value) / e) ** 2 : (u.value ** 2 * p.value * (1 - p.value)) / e ** 2)
const fpc = (m) => (Number(N.value) > 0 ? m / (1 + (m - 1) / Number(N.value)) : m)
const need = (e) => Math.ceil(fpc(n0(e)) - 1e-9)
const n = computed(() => need(E.value))

// 双对数图
const ticksE = computed(() => (kind.value === 'mean' ? [0.05, 0.1, 0.2, 0.5, 1].map((r) => r * sigma.value) : [0.005, 0.01, 0.02, 0.05, 0.1]))
const xr = computed(() => [Math.log10(ticksE.value[0]), Math.log10(ticksE.value[4])])
const curve = computed(() => {
  const [a, b] = xr.value
  return Array.from({ length: 61 }, (_, i) => {
    const lx = a + ((b - a) * i) / 60
    return [lx, Math.log10(fpc(n0(10 ** lx)))]
  })
})
const yr = computed(() => {
  const ys = curve.value.map((q) => q[1])
  return [Math.floor(Math.min(...ys)), Math.ceil(Math.max(...ys))]
})
const yticks = computed(() => Array.from({ length: yr.value[1] - yr.value[0] + 1 }, (_, i) => yr.value[0] + i))
const fmtE = (lx) => String(+(10 ** lx).toPrecision(2))
const fmtN = (ly) => (10 ** ly).toLocaleString('zh-CN')
</script>

<template>
  <div class="lab">
    <header>样本量计算器</header>
    <div class="body">
      <div class="controls">
        <label>估计对象
          <select v-model="kind">
            <option value="mean">总体均值 μ</option>
            <option value="prop">总体比例 p</option>
          </select>
        </label>
        <label>置信水平
          <select v-model.number="conf">
            <option :value="0.9">90%</option>
            <option :value="0.95">95%</option>
            <option :value="0.99">99%</option>
          </select>
        </label>
        <template v-if="kind === 'mean'">
          <label>总体标准差 σ <input v-model.number="sigma" type="number" min="0.01" step="any" style="width: 6em"></label>
          <label>允许误差 E <input v-model.number="ratio" type="range" min="0.05" max="1" step="0.01"><span class="val">{{ +E.toPrecision(3) }}</span></label>
        </template>
        <template v-else>
          <label>预估比例 p <input v-model.number="p" type="range" min="0.01" max="0.99" step="0.01"><span class="val">{{ p.toFixed(2) }}</span></label>
          <label>允许误差 E <input v-model.number="eProp" type="range" min="0.005" max="0.1" step="0.001"><span class="val">{{ (eProp * 100).toFixed(1) }}%</span></label>
        </template>
        <label>总体规模 N <input v-model="N" type="number" min="1" placeholder="不填 = 无限总体" style="width: 9em"></label>
      </div>
      <div v-if="kind === 'prop'" class="btns">
        <button class="btn" @click="p = 0.5">不知道 p：保守取 0.5</button>
      </div>

      <div class="readout">
        <div v-if="kind === 'mean'">
          n₀ = (u<sub>{{ (1 - (1 - conf) / 2).toFixed(3) }}</sub> · σ / E)² = ({{ u.toFixed(3) }} × {{ sigma }} / {{ +E.toPrecision(3) }})² = {{ n0(E).toFixed(2) }}
        </div>
        <div v-else>
          n₀ = u² · p(1−p) / E² = {{ u.toFixed(3) }}² × {{ p.toFixed(2) }} × {{ (1 - p).toFixed(2) }} / {{ eProp.toFixed(3) }}² = {{ n0(E).toFixed(2) }}
        </div>
        <div v-if="Number(N) > 0">不重复抽样修正：n = n₀ / (1 + (n₀ − 1) / N) = {{ fpc(n0(E)).toFixed(2) }}</div>
        <div>至少需要 <b>{{ n.toLocaleString('zh-CN') }}</b> 个样本。误差减半时需要 {{ need(E / 2).toLocaleString('zh-CN') }} 个，约为 {{ (need(E / 2) / n).toFixed(1) }} 倍。</div>
      </div>

      <Plot
        v-slot="{ sx, sy }" :x="xr" :y="yr" :height="260"
        :xticks="ticksE.map(Math.log10)" :xfmt="fmtE" :yticks="yticks" :yfmt="fmtN"
      >
        <path :d="linePath(curve, sx, sy)" class="c1" fill="none" stroke="currentColor" stroke-width="2" />
        <circle :cx="sx(Math.log10(E))" :cy="sy(Math.log10(fpc(n0(E))))" r="5" class="c4" fill="currentColor" />
      </Plot>
      <div class="cap">横轴：允许误差 E；纵轴：所需样本量 n，均为对数刻度。n ∝ E⁻² 在双对数坐标下是斜率为 −2 的直线；填入总体规模 N 后，曲线在高处被“压弯”，n 不会超过 N。</div>
    </div>
  </div>
</template>
