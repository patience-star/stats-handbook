<script setup>
// 指数体系的面积图：销售额 = 价格 × 销售量，是一个矩形的面积。从基期到报告期，面积的变化分成三块：
// 数量变动（Δq·p₀）、价格变动（Δp·q₀）和右上角的交叉项（Δp·Δq）。我国通行的做法把交叉项归入价格因素
import { computed, ref } from 'vue'
import Plot from '../../components/Plot.vue'

const goods = ref([
  { name: '甲（件）', p0: 10, q0: 100, p1: 12, q1: 90 },
  { name: '乙（千克）', p0: 5, q0: 200, p1: 5.5, q1: 240 },
])
const k = ref(0)
const g = computed(() => goods.value[k.value])
const sum = (f) => goods.value.reduce((s, x) => s + f(x), 0)
const v00 = computed(() => sum((x) => x.p0 * x.q0))
const v11 = computed(() => sum((x) => x.p1 * x.q1))
const v01 = computed(() => sum((x) => x.p0 * x.q1))   // 基期价格 × 报告期数量
const v10 = computed(() => sum((x) => x.p1 * x.q0))   // 报告期价格 × 基期数量
const Iv = computed(() => v11.value / v00.value)
const Iq = computed(() => v01.value / v00.value)      // 拉氏数量指数
const Ip = computed(() => v11.value / v01.value)      // 帕氏价格指数
const IpL = computed(() => v10.value / v00.value)     // 拉氏价格指数
const fisher = computed(() => Math.sqrt(IpL.value * Ip.value))

const qmax = computed(() => Math.max(g.value.q0, g.value.q1) * 1.25)
const pmax = computed(() => Math.max(g.value.p0, g.value.p1) * 1.3)
const pct = (v) => ((v - 1) * 100).toFixed(2) + '%'
const f0 = (v) => v.toFixed(0)
</script>

<template>
  <div class="lab">
    <header>指数体系：销售额变动的面积分解</header>
    <div class="body">
      <div class="btns">
        <button v-for="(x, i) in goods" :key="i" class="btn" :class="{ on: k === i }" @click="k = i">商品{{ x.name }}</button>
      </div>
      <div class="controls">
        <label>报告期价格 p₁ <input v-model.number="g.p1" type="range" :min="g.p0 * 0.6" :max="g.p0 * 1.6" :step="g.p0 / 100"><span class="val">{{ g.p1.toFixed(2) }}</span></label>
        <label>报告期数量 q₁ <input v-model.number="g.q1" type="range" :min="g.q0 * 0.5" :max="g.q0 * 1.5" step="1"><span class="val">{{ g.q1 }}</span></label>
      </div>
      <div class="grid2">
        <div class="panel">
          <Plot v-slot="{ sx, sy }" :x="[0, qmax]" :y="[0, pmax]" :height="260" xlabel="销售量 q" ylabel="价格 p">
            <rect :x="sx(0)" :y="sy(Math.min(g.p0, g.p1))" :width="sx(Math.min(g.q0, g.q1)) - sx(0)" :height="sy(0) - sy(Math.min(g.p0, g.p1))" class="common" />
            <rect :x="sx(Math.min(g.q0, g.q1))" :y="sy(g.p0)" :width="Math.abs(sx(g.q1) - sx(g.q0))" :height="sy(0) - sy(g.p0)" :class="g.q1 >= g.q0 ? 'qplus' : 'qminus'" />
            <rect :x="sx(0)" :y="sy(Math.max(g.p0, g.p1))" :width="sx(Math.min(g.q0, g.q1)) - sx(0)" :height="Math.abs(sy(g.p1) - sy(g.p0))" :class="g.p1 >= g.p0 ? 'pplus' : 'pminus'" />
            <rect :x="sx(Math.min(g.q0, g.q1))" :y="sy(Math.max(g.p0, g.p1))" :width="Math.abs(sx(g.q1) - sx(g.q0))" :height="Math.abs(sy(g.p1) - sy(g.p0))" class="corner" />
            <rect :x="sx(0)" :y="sy(g.p0)" :width="sx(g.q0) - sx(0)" :height="sy(0) - sy(g.p0)" class="base" />
            <rect :x="sx(0)" :y="sy(g.p1)" :width="sx(g.q1) - sx(0)" :height="sy(0) - sy(g.p1)" class="cur" />
          </Plot>
          <div class="cap">
            <span class="sw base" /> 基期 p₀q₀　<span class="sw cur" /> 报告期 p₁q₁
            <span class="sw qplus" /> 数量变动 Δq·p₀　<span class="sw pplus" /> 价格变动 Δp·q₀　<span class="sw corner" /> 交叉项 Δp·Δq（颜色浅表示减少）
          </div>
        </div>
        <div class="panel">
          <div class="readout">
            <b>商品{{ g.name }}</b>：销售额 {{ f0(g.p0 * g.q0) }} → {{ f0(g.p1 * g.q1) }}，变动 {{ f0(g.p1 * g.q1 - g.p0 * g.q0) }}<br>
            = 数量变动 {{ f0((g.q1 - g.q0) * g.p0) }} + 价格变动 {{ f0((g.p1 - g.p0) * g.q0) }} + 交叉项 {{ f0((g.p1 - g.p0) * (g.q1 - g.q0)) }}<br>
            把交叉项归入价格：价格影响 = Δp·q₁ = {{ f0((g.p1 - g.p0) * g.q1) }}
          </div>
          <div class="readout">
            <b>两种商品合计</b><br>
            销售额指数 Σp₁q₁/Σp₀q₀ = {{ f0(v11) }}/{{ f0(v00) }} = <b>{{ Iv.toFixed(4) }}</b>（{{ pct(Iv) }}）<br>
            销售量指数（拉氏）Σq₁p₀/Σq₀p₀ = <b>{{ Iq.toFixed(4) }}</b>，影响额 {{ f0(v01 - v00) }}<br>
            价格指数（帕氏）Σp₁q₁/Σp₀q₁ = <b>{{ Ip.toFixed(4) }}</b>，影响额 {{ f0(v11 - v01) }}<br>
            检验：{{ Iq.toFixed(4) }} × {{ Ip.toFixed(4) }} = {{ (Iq * Ip).toFixed(4) }}；{{ f0(v01 - v00) }} + {{ f0(v11 - v01) }} = {{ f0(v11 - v00) }}<br>
            对照：拉氏价格指数 {{ IpL.toFixed(4) }}，费希尔理想指数 {{ fisher.toFixed(4) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.base { fill: none; stroke: var(--c-s1); stroke-width: 2.4; }
.cur { fill: none; stroke: var(--vp-c-text-1); stroke-width: 1.6; stroke-dasharray: 6 4; }
.common { fill: color-mix(in srgb, var(--c-s1) 16%, transparent); }
.qplus { fill: color-mix(in srgb, var(--c-s2) 55%, transparent); }
.qminus { fill: color-mix(in srgb, var(--c-s2) 22%, transparent); }
.pplus { fill: color-mix(in srgb, var(--c-s3) 55%, transparent); }
.pminus { fill: color-mix(in srgb, var(--c-s3) 22%, transparent); }
.corner { fill: color-mix(in srgb, var(--c-s4) 55%, transparent); }
.sw { display: inline-block; width: 12px; height: 10px; margin: 0 3px 0 6px; vertical-align: -1px; border-radius: 2px; }
.sw.base { border: 2px solid var(--c-s1); }
.sw.cur { border: 2px dashed var(--vp-c-text-1); }
.sw.qplus { background: color-mix(in srgb, var(--c-s2) 55%, transparent); }
.sw.pplus { background: color-mix(in srgb, var(--c-s3) 55%, transparent); }
.sw.corner { background: color-mix(in srgb, var(--c-s4) 55%, transparent); }
.readout + .readout { margin-top: 10px; }
</style>
