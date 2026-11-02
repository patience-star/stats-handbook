<script setup>
// 置信区间覆盖率：反复抽样、每次造一个区间，统计盖住真值的比例，并与理论覆盖率对比
import { computed, onUnmounted, ref, watch } from 'vue'
import jStat from 'jstat'
import Plot from '../../components/Plot.vue'

const methods = {
  z: { name: '均值 · σ 已知（u 区间）', prop: false },
  t: { name: '均值 · σ 未知（t 区间）', prop: false },
  zmis: { name: '均值 · σ 未知却用 u 分位数（误用）', prop: false },
  wald: { name: '比例 · Wald 区间', prop: true },
  wilson: { name: '比例 · Wilson 区间', prop: true },
}
const KEEP = 100   // 图上保留最近 100 个区间

const method = ref('t')
const n = ref(10)
const conf = ref(0.95)
const p = ref(0.3)
const ivs = ref([])
const total = ref(0)
const hits = ref(0)
const auto = ref(false)

const isProp = computed(() => methods[method.value].prop)
const truth = computed(() => (isProp.value ? p.value : 0))
const u = computed(() => jStat.normal.inv(1 - (1 - conf.value) / 2, 0, 1))

function propCI(k) {
  const m = n.value, ph = k / m, z = u.value
  if (method.value === 'wald') {
    const h = z * Math.sqrt((ph * (1 - ph)) / m)
    return [ph - h, ph + h]
  }
  const d = 1 + (z * z) / m
  const c = (ph + (z * z) / (2 * m)) / d
  const h = (z * Math.sqrt((ph * (1 - ph)) / m + (z * z) / (4 * m * m))) / d
  return [c - h, c + h]
}

// 总体：均值类方法用 N(0, 1)，比例类方法用 b(1, p)
function sample() {
  const m = n.value
  let lo, hi
  if (isProp.value) {
    let k = 0
    for (let i = 0; i < m; i++) if (Math.random() < p.value) k++
    ;[lo, hi] = propCI(k)
  } else {
    const xs = Array.from({ length: m }, () => jStat.normal.sample(0, 1))
    const xbar = jStat.mean(xs), s = jStat.stdev(xs, true)
    const h = method.value === 'z' ? u.value / Math.sqrt(m)
      : method.value === 't' ? (jStat.studentt.inv(1 - (1 - conf.value) / 2, m - 1) * s) / Math.sqrt(m)
      : (u.value * s) / Math.sqrt(m)
    lo = xbar - h
    hi = xbar + h
  }
  return { lo, hi, hit: lo <= truth.value && truth.value <= hi }
}

function draw(k) {
  const add = Array.from({ length: k }, sample)
  total.value += k
  hits.value += add.filter((v) => v.hit).length
  ivs.value = [...ivs.value, ...add].slice(-KEEP)
}
function clear() {
  ivs.value = []
  total.value = 0
  hits.value = 0
}
watch([method, n, conf, p], clear)

let timer = 0
watch(auto, (on) => {
  clearInterval(timer)
  if (on) timer = setInterval(() => draw(1), 80)
})
onUnmounted(() => clearInterval(timer))

// 理论覆盖率：z、t 精确为名义水平；误用 u 时为 P(|T| ≤ u)；比例类方法按二项分布逐项求和
const exact = computed(() => {
  const m = n.value
  if (method.value === 'z' || method.value === 't') return conf.value
  if (method.value === 'zmis') return 2 * jStat.studentt.cdf(u.value, m - 1) - 1
  let s = 0
  for (let k = 0; k <= m; k++) {
    const [lo, hi] = propCI(k)
    if (lo <= p.value && p.value <= hi) s += jStat.binomial.pdf(k, m, p.value)
  }
  return s
})
const avgLen = computed(() => ivs.value.reduce((s, v) => s + v.hi - v.lo, 0) / Math.max(1, ivs.value.length))

const xr = computed(() => (isProp.value ? [0, 1] : [-3.5 / Math.sqrt(n.value), 3.5 / Math.sqrt(n.value)]))
const clip = (v) => Math.min(xr.value[1], Math.max(xr.value[0], v))
const pct = (v) => (v * 100).toFixed(1) + '%'
</script>

<template>
  <div class="lab">
    <header>置信区间的覆盖率</header>
    <div class="body">
      <div class="controls">
        <label>方法
          <select v-model="method">
            <option v-for="(v, k) in methods" :key="k" :value="k">{{ v.name }}</option>
          </select>
        </label>
        <label>置信水平
          <select v-model.number="conf">
            <option :value="0.8">80%</option>
            <option :value="0.9">90%</option>
            <option :value="0.95">95%</option>
            <option :value="0.99">99%</option>
          </select>
        </label>
        <label>样本量 n <input v-model.number="n" type="range" min="2" max="100" step="1"><span class="val">{{ n }}</span></label>
        <label v-if="isProp">真实比例 p <input v-model.number="p" type="range" min="0.01" max="0.99" step="0.01"><span class="val">{{ p.toFixed(2) }}</span></label>
      </div>
      <div class="btns">
        <button class="btn" @click="draw(1)">抽样 1 次</button>
        <button class="btn" @click="draw(20)">抽样 20 次</button>
        <button class="btn" @click="draw(1000)">抽样 1000 次</button>
        <button class="btn" :class="{ on: auto }" @click="auto = !auto">{{ auto ? '停止' : '自动抽样' }}</button>
        <button class="btn" @click="clear">清空</button>
      </div>
      <Plot v-slot="{ sx, sy }" :x="xr" :y="[0, KEEP + 1]" :height="300" :yticks="[]" :xlabel="isProp ? 'p' : 'μ'">
        <line
          v-for="(iv, i) in ivs" :key="i" :x1="sx(clip(iv.lo))" :x2="sx(clip(iv.hi))"
          :y1="sy(i + 1)" :y2="sy(i + 1)" :class="iv.hit ? 'hit' : 'miss'"
        />
        <line :x1="sx(truth)" :x2="sx(truth)" :y1="sy(0)" :y2="sy(KEEP + 1)" class="truth" />
        <text :x="sx(truth) + 4" :y="sy(KEEP + 1) - 3" class="truth-label">真值 {{ isProp ? 'p' : 'μ' }} = {{ truth }}</text>
      </Plot>
      <div class="cap">每条横线是一次抽样造出的区间（最新的在最上面）；蓝色盖住了真值，红色没有；超出显示范围的部分被截断。</div>
      <div class="readout">
        <template v-if="total">
          已抽样 <b>{{ total }}</b> 次，其中 <b>{{ hits }}</b> 个区间盖住真值，实际覆盖率 <b>{{ pct(hits / total) }}</b>；
          最近 {{ ivs.length }} 个区间的平均长度 {{ avgLen.toFixed(3) }}。<br>
        </template>
        <template v-else>点“抽样”开始。<br></template>
        理论覆盖率 <b :class="Math.abs(exact - conf) > 0.02 ? 'bad' : ''">{{ pct(exact) }}</b>，名义置信水平 {{ pct(conf) }}。
      </div>
    </div>
  </div>
</template>

<style scoped>
.truth { stroke: var(--vp-c-text-2); stroke-width: 1.5; stroke-dasharray: 4 3; }
.truth-label { font-size: 12px; fill: var(--vp-c-text-2); }
.hit { stroke: var(--c-s1); stroke-width: 1.6; }
.miss { stroke: var(--c-s4); stroke-width: 2.2; }
</style>
