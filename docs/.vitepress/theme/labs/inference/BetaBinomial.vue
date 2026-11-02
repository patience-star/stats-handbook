<script setup>
// 贝塔–二项共轭：先验 Be(a, b) + 数据（n 次中 k 次成功）= 后验 Be(a + k, b + n − k)。
// 后验均值是先验均值与样本比例的加权平均，权重分别正比于“先验样本量” a + b 与数据量 n
import { computed, ref } from 'vue'
import jStat from 'jstat'
import Plot, { linePath } from '../../components/Plot.vue'

const a = ref(2)
const b = ref(2)
const k = ref(7)
const n = ref(10)
const pTrue = ref(0.3)
const addOne = () => { n.value++; if (Math.random() < pTrue.value) k.value++ }
const addMany = (m) => { for (let i = 0; i < m; i++) addOne() }
const clear = () => { n.value = 0; k.value = 0 }
const kk = computed(() => Math.min(k.value, n.value))

const xs = Array.from({ length: 401 }, (_, i) => 0.0005 + (0.999 * i) / 400)
const prior = computed(() => xs.map((p) => [p, jStat.beta.pdf(p, a.value, b.value)]))
const post = computed(() => xs.map((p) => [p, jStat.beta.pdf(p, a.value + kk.value, b.value + n.value - kk.value)]))
// 似然函数缩放成一个密度（即均匀先验下的后验），便于同图比较
const lik = computed(() => (n.value ? xs.map((p) => [p, jStat.beta.pdf(p, kk.value + 1, n.value - kk.value + 1)]) : []))
const ymax = computed(() => Math.min(30, Math.max(...[...prior.value, ...post.value, ...lik.value].map((q) => q[1]).filter(Number.isFinite)) * 1.1))
const cap = (pts) => pts.map(([x, y]) => [x, Math.min(y, ymax.value)])

const priorMean = computed(() => a.value / (a.value + b.value))
const phat = computed(() => (n.value ? kk.value / n.value : NaN))
const w = computed(() => n.value / (a.value + b.value + n.value))
const postMean = computed(() => (a.value + kk.value) / (a.value + b.value + n.value))
const ci = computed(() => [0.025, 0.975].map((q) => jStat.beta.inv(q, a.value + kk.value, b.value + n.value - kk.value)))
const f = (v) => (Number.isFinite(v) ? v.toFixed(3) : '—')
</script>

<template>
  <div class="lab">
    <header>贝叶斯更新：先验 + 数据 = 后验</header>
    <div class="body">
      <div class="controls">
        <label>先验参数 a <input v-model.number="a" type="range" min="0.5" max="30" step="0.5"><span class="val">{{ a }}</span></label>
        <label>先验参数 b <input v-model.number="b" type="range" min="0.5" max="30" step="0.5"><span class="val">{{ b }}</span></label>
        <label>试验次数 n <input v-model.number="n" type="range" min="0" max="200" step="1"><span class="val">{{ n }}</span></label>
        <label>成功次数 k <input v-model.number="k" type="range" min="0" :max="n" step="1"><span class="val">{{ kk }}</span></label>
      </div>
      <div class="controls">
        <label>真实成功率（用于模拟） <input v-model.number="pTrue" type="range" min="0.01" max="0.99" step="0.01"><span class="val">{{ pTrue.toFixed(2) }}</span></label>
      </div>
      <div class="btns">
        <button class="btn" @click="addOne">再做 1 次试验</button>
        <button class="btn" @click="addMany(20)">再做 20 次</button>
        <button class="btn" @click="clear">清空数据</button>
      </div>
      <Plot v-slot="{ sx, sy }" :x="[0, 1]" :y="[0, ymax]" :height="250">
        <rect :x="sx(ci[0])" :y="sy(ymax)" :width="sx(ci[1]) - sx(ci[0])" :height="sy(0) - sy(ymax)" class="ci" />
        <path :d="linePath(cap(prior), sx, sy)" class="prior" />
        <path v-if="lik.length" :d="linePath(cap(lik), sx, sy)" class="lik" />
        <path :d="linePath(cap(post), sx, sy)" class="post" />
      </Plot>
      <div class="cap">
        <span class="sw prior" /> 先验 Be({{ a }}, {{ b }})　<span class="sw lik" /> 似然（归一化）　<span class="sw post" /> 后验 Be({{ a + kk }}, {{ b + n - kk }})　阴影：95% 可信区间
      </div>
      <svg viewBox="0 0 600 64" class="seg">
        <line x1="40" x2="560" y1="32" y2="32" class="axis" />
        <circle :cx="40 + 520 * priorMean" cy="32" r="7" class="dot-prior" />
        <circle v-if="n" :cx="40 + 520 * phat" cy="32" r="7" class="dot-lik" />
        <circle :cx="40 + 520 * postMean" cy="32" r="6" class="dot-post" />
        <text :x="40 + 520 * priorMean" y="14" text-anchor="middle" class="t-prior">先验均值</text>
        <text v-if="n" :x="40 + 520 * phat" y="60" text-anchor="middle" class="t-lik">样本比例</text>
        <text x="40" y="60" text-anchor="middle" class="t-axis">0</text>
        <text x="560" y="60" text-anchor="middle" class="t-axis">1</text>
      </svg>
      <div class="readout">
        后验均值 = <b>{{ f(postMean) }}</b> = {{ f(1 - w) }} × 先验均值 {{ f(priorMean) }} + {{ f(w) }} × 样本比例 {{ f(phat) }}：
        权重 n/(a + b + n) = {{ f(w) }}，先验相当于 a + b = {{ a + b }} 次“虚拟试验”。<br>
        95% 可信区间 [{{ f(ci[0]) }}, {{ f(ci[1]) }}]：在已知数据的条件下，p 落在其中的概率为 95%。
      </div>
    </div>
  </div>
</template>

<style scoped>
.prior { fill: none; stroke: var(--c-s5); stroke-width: 2; stroke-dasharray: 6 4; }
.lik { fill: none; stroke: var(--c-s2); stroke-width: 2; }
.post { fill: none; stroke: var(--c-s1); stroke-width: 2.6; }
.ci { fill: color-mix(in srgb, var(--c-s1) 10%, transparent); }
.sw { display: inline-block; width: 14px; height: 3px; margin: 0 4px 0 6px; vertical-align: 3px; }
.sw.prior { background: var(--c-s5); }
.sw.lik { background: var(--c-s2); }
.sw.post { background: var(--c-s1); }
.seg { display: block; width: 100%; max-width: 600px; height: auto; margin: 4px auto 0; }
.axis { stroke: var(--vp-c-text-3); stroke-width: 2; }
.dot-prior { fill: var(--c-s5); }
.dot-lik { fill: var(--c-s2); }
.dot-post { fill: var(--c-s1); stroke: var(--vp-c-bg); stroke-width: 2; }
.t-prior { font-size: 12px; fill: var(--c-s5); }
.t-lik { font-size: 12px; fill: var(--c-s2); }
.t-axis { font-size: 12px; fill: var(--vp-c-text-3); }
</style>
