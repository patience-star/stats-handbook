<script setup>
// 抽样方式的比较：同一个模拟总体（4 个地区、50 个村、每村 20 户），用不同方式抽 100 户估计平均收入，重复多次看估计值的波动
import { computed, ref } from 'vue'
import jStat from 'jstat'
import Plot from '../../components/Plot.vue'

// 模拟总体：地区之间差异大；同村住户的收入相似（村内相关）
const REGION = [40, 60, 80, 100]                     // 各地区平均收入（千元）
const pop = []                                       // { y, region, village }
for (let v = 0; v < 50; v++) {
  const region = Math.floor(v / 12.5), vEffect = jStat.normal.sample(0, 12)
  for (let h = 0; h < 20; h++) pop.push({ y: Math.max(5, REGION[region] + vEffect + jStat.normal.sample(0, 15)), region, village: v })
}
const N = pop.length
const mu = pop.reduce((s, p) => s + p.y, 0) / N
const n = 100

const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] } return a }
const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length
const designs = {
  srs: { name: '简单随机抽样', est: () => mean(shuffle([...pop]).slice(0, n).map((p) => p.y)) },
  strat: {
    name: '分层抽样（按地区，比例分配）',
    est: () => {
      let total = 0
      for (let r = 0; r < 4; r++) {
        const units = pop.filter((p) => p.region === r), k = Math.round((n * units.length) / N)
        total += (units.length / N) * mean(shuffle([...units]).slice(0, k).map((p) => p.y))
      }
      return total
    },
  },
  cluster: { name: '整群抽样（随机抽 5 个村，村内全查）', est: () => { const vs = shuffle([...Array(50).keys()]).slice(0, 5); return mean(pop.filter((p) => vs.includes(p.village)).map((p) => p.y)) } },
  sys: { name: '系统抽样（每隔 10 户抽 1 户）', est: () => { const s = Math.floor(Math.random() * 10); return mean(pop.filter((_, i) => i % 10 === s).map((p) => p.y)) } },
}
const R = 1500
const results = ref({})
function run() {
  const out = {}
  for (const [k, d] of Object.entries(designs)) out[k] = Array.from({ length: R }, d.est)
  results.value = out
}
run()
const sd = (a) => Math.sqrt(a.reduce((s, v) => s + (v - mean(a)) ** 2, 0) / (a.length - 1))
const stats = computed(() => Object.fromEntries(Object.entries(results.value).map(([k, a]) => [k, { m: mean(a), s: sd(a) }])))
const xr = computed(() => { const s = stats.value.srs.s; return [mu - 5 * s, mu + 5 * s] })
function hist(a) {
  const [lo, hi] = xr.value, B = 40, w = (hi - lo) / B, c = Array(B).fill(0)
  for (const v of a) { const k = Math.floor((v - lo) / w); if (k >= 0 && k < B) c[k]++ }
  return c.map((v, k) => ({ x0: lo + k * w, x1: lo + (k + 1) * w, h: v / (a.length * w) }))
}
const hmax = computed(() => Math.max(...Object.values(results.value).flatMap((a) => hist(a).map((b) => b.h))) * 1.1)
</script>

<template>
  <div class="lab">
    <header>四种抽样方式的比较</header>
    <div class="body">
      <div class="btns"><button class="btn" @click="run">重新各抽 {{ R }} 次</button></div>
      <div class="grid2">
        <div v-for="(d, k) in designs" :key="k" class="panel">
          <Plot v-slot="{ sx, sy }" :x="xr" :y="[0, hmax]" :height="150" :yticks="[]">
            <rect v-for="(b, i) in hist(results[k])" :key="i" :x="sx(b.x0)" :y="sy(b.h)" :width="Math.max(0, sx(b.x1) - sx(b.x0) - 1)" :height="sy(0) - sy(b.h)" class="bar" />
            <line :x1="sx(mu)" :x2="sx(mu)" :y1="sy(0)" :y2="sy(hmax)" class="truth" />
          </Plot>
          <div class="cap"><b>{{ d.name }}</b>：估计值的标准差 {{ stats[k].s.toFixed(2) }}</div>
        </div>
      </div>
      <div class="readout">
        总体共 {{ N }} 户，真实平均收入 μ = <b>{{ mu.toFixed(2) }}</b> 千元（红线）。每种方式都抽 100 户左右，各重复 {{ R }} 次，直方图是估计值的分布。<br>
        标准差越小，抽样误差越小：分层抽样消除了地区之间的差异；整群抽样只抽到 5 个村，而同村住户收入相似，信息重复，误差最大。
        这里的名单按村排列，系统抽样相当于每个村各抽 2 户，效果接近分层抽样；但如果名单带有周期性，系统抽样可能很糟。
      </div>
    </div>
  </div>
</template>

<style scoped>
.bar { fill: color-mix(in srgb, var(--c-s1) 50%, transparent); }
.truth { stroke: var(--c-s4); stroke-width: 2; }
</style>
