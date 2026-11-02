<script setup>
// AR 模型定阶：Yule–Walker 估计（Durbin–Levinson 递推）给出各阶的预测误差方差 σ̂²_p，
// AIC = n ln σ̂²_p + 2(p+1)，BIC = n ln σ̂²_p + (p+1) ln n。点选阶数，查看系数与残差诊断
import { computed, ref } from 'vue'
import jStat from 'jstat'
import Plot, { linePath } from '../../components/Plot.vue'
import { acf, durbinLevinson, ljungBox, noise, simulateArma } from '../../lib/ts.js'
import lynx from '../../data/lynx.json'
import nile from '../../data/nile.json'
import sun from '../../data/sunspots.json'

const P = 12, H = 20, CLIP = 30
const z = ref(noise(300))
const sets = computed(() => ({
  lynx: ['猞猁捕获量（lg）', lynx.values.map(Math.log10)],
  sun: ['太阳黑子', sun.values],
  nile: ['尼罗河流量', nile.values],
  sim: ['模拟 AR(2)：φ = (1, −0.5)', simulateArma([1, -0.5], [], z.value).slice(100)],
}))
const which = ref('lynx')
const sel = ref(null)
function pick(k) {
  which.value = k
  sel.value = null
}
const x = computed(() => sets.value[which.value][1])
const n = computed(() => x.value.length)
const mu = computed(() => x.value.reduce((s, v) => s + v, 0) / n.value)
const g0 = computed(() => x.value.reduce((s, v) => s + (v - mu.value) ** 2, 0) / n.value)
const dl = computed(() => durbinLevinson(acf(x.value, P)))
const fits = computed(() => [{ phi: [], v: 1 }, ...dl.value].map(({ phi, v }, p) => {
  const s2 = g0.value * v, k = p + 1
  return { p, phi, s2, aic: n.value * Math.log(s2) + 2 * k, bic: n.value * Math.log(s2) + k * Math.log(n.value) }
}))
const argmin = (key) => fits.value.reduce((b, f) => (f[key] < b[key] ? f : b)).p
const pa = computed(() => argmin('aic'))
const pb = computed(() => argmin('bic'))
const p = computed(() => sel.value ?? pb.value)
const cur = computed(() => fits.value[p.value])
const rel = (key) => {
  const m = Math.min(...fits.value.map((f) => f[key]))
  return fits.value.map((f) => [f.p, Math.min(CLIP, f[key] - m)])
}
const pacf = computed(() => dl.value.map((s) => s.phi.at(-1)))
const band = computed(() => 1.96 / Math.sqrt(n.value))

// 残差：用估计的系数逐期计算一步预测误差（从第 p+1 期开始）
const resid = computed(() => {
  const y = x.value.map((v) => v - mu.value), phi = cur.value.phi
  return y.slice(p.value).map((v, i) => phi.reduce((e, c, j) => e - c * y[i + p.value - 1 - j], v))
})
const racf = computed(() => acf(resid.value, H))
const rband = computed(() => 1.96 / Math.sqrt(resid.value.length))
const q = computed(() => ljungBox(resid.value, H))
const pval = computed(() => 1 - jStat.chisquare.cdf(q.value, H - p.value))
const period = computed(() => {
  if (p.value !== 2) return null
  const [a, b] = cur.value.phi
  if (a * a + 4 * b >= 0) return null
  return (2 * Math.PI) / Math.acos(a / (2 * Math.sqrt(-b)))
})
const f3 = (v) => v.toFixed(3).replace('-', '−')
const fp = (v) => (v < 1e-4 ? '< 0.0001' : v.toFixed(4))
</script>

<template>
  <div class="lab">
    <header>AR 模型定阶：PACF、AIC 与 BIC</header>
    <div class="body">
      <div class="btns">
        <button v-for="(s, k) in sets" :key="k" class="btn" :class="{ on: which === k }" @click="pick(k)">{{ s[0] }}</button>
        <button v-if="which === 'sim'" class="btn" @click="z = noise(300)">换一组随机数</button>
      </div>
      <div class="grid2">
        <div class="panel">
          <Plot v-slot="{ sx, sy }" :x="[-0.5, P + 0.5]" :y="[0, CLIP]" :height="220" :xticks="[0, 2, 4, 6, 8, 10, 12]" xlabel="阶数 p">
            <line :x1="sx(p)" :x2="sx(p)" :y1="sy(0)" :y2="sy(CLIP)" class="selp" />
            <path :d="linePath(rel('aic'), sx, sy)" class="aic" />
            <path :d="linePath(rel('bic'), sx, sy)" class="bic" />
            <circle v-for="[k, v] in rel('aic')" :key="'a' + k" :cx="sx(k)" :cy="sy(v)" :r="k === pa ? 6 : 3" class="aicd" />
            <circle v-for="[k, v] in rel('bic')" :key="'b' + k" :cx="sx(k)" :cy="sy(v)" :r="k === pb ? 6 : 3" class="bicd" />
            <rect v-for="k in P + 1" :key="'h' + k" :x="sx(k - 1.5)" :y="sy(CLIP)" :width="sx(1) - sx(0)" :height="sy(0) - sy(CLIP)" fill="transparent" class="hit" @click="sel = k - 1" />
          </Plot>
          <div class="cap"><span class="sw aic" /> AIC　<span class="sw bic" /> BIC（都减去各自的最小值，超过 {{ CLIP }} 的截断）；大圆点是最小值，点击图中任一阶数可选中它</div>
        </div>
        <div class="panel">
          <Plot v-slot="{ sx, sy }" :x="[0.4, P + 0.6]" :y="[-1, 1]" :height="220" :xticks="[1, 2, 4, 6, 8, 10, 12]" :yticks="[-1, -0.5, 0, 0.5, 1]" xlabel="滞后 k">
            <rect :x="sx(0.4)" :y="sy(band)" :width="sx(P + 0.6) - sx(0.4)" :height="sy(-band) - sy(band)" class="bandr" />
            <line v-for="(v, i) in pacf" :key="i" :x1="sx(i + 1)" :x2="sx(i + 1)" :y1="sy(0)" :y2="sy(v)" :class="i < p ? 'bar in' : 'bar'" />
          </Plot>
          <div class="cap">样本 PACF φ̂<sub>kk</sub>；深色是当前模型包含的滞后，阴影为 ±1.96/√n</div>
        </div>
      </div>
      <div class="readout">
        AIC 选 <b>AR({{ pa }})</b>，BIC 选 <b>AR({{ pb }})</b>。当前：AR({{ p }})，σ̂² = {{ cur.s2.toPrecision(4) }}
        <template v-if="p">，系数 {{ cur.phi.map(f3).join('，') }}</template>
        <template v-if="period">；倒数根是一对复根，伪周期 ≈ {{ period.toFixed(2) }}</template>
      </div>
      <Plot v-slot="{ sx, sy }" :x="[0.4, H + 0.6]" :y="[-0.6, 0.6]" :height="150" :xticks="[1, 5, 10, 15, 20]" :yticks="[-0.5, 0, 0.5]" xlabel="滞后 k">
        <rect :x="sx(0.4)" :y="sy(rband)" :width="sx(H + 0.6) - sx(0.4)" :height="sy(-rband) - sy(rband)" class="bandr" />
        <line v-for="k in H" :key="k" :x1="sx(k)" :x2="sx(k)" :y1="sy(0)" :y2="sy(racf[k])" :class="Math.abs(racf[k]) > rband ? 'bar out' : 'bar'" />
      </Plot>
      <div class="cap">AR({{ p }}) 残差的样本 ACF；红色表示超出 ±1.96/√n</div>
      <div class="readout">
        残差的 Ljung–Box 检验：Q({{ H }}) = {{ q.toFixed(2) }}，自由度 {{ H }} − {{ p }} = {{ H - p }}，p 值 {{ fp(pval) }}
        <b v-if="pval < 0.05" class="bad">——残差不是白噪声，模型还没有把相关结构提取干净</b>
        <b v-else class="good">——残差可以看作白噪声</b>
      </div>
    </div>
  </div>
</template>

<style scoped>
.aic { fill: none; stroke: var(--c-s2); stroke-width: 2; }
.bic { fill: none; stroke: var(--c-s5); stroke-width: 2; }
.aicd { fill: var(--c-s2); }
.bicd { fill: var(--c-s5); }
.selp { stroke: var(--vp-c-text-3); stroke-width: 6; stroke-opacity: 0.25; }
.hit { cursor: pointer; }
.bandr { fill: color-mix(in srgb, var(--c-s1) 12%, transparent); }
.bar { stroke: color-mix(in srgb, var(--c-s1) 45%, transparent); stroke-width: 5; }
.bar.in { stroke: var(--c-s1); }
.bar.out { stroke: var(--c-s4); }
.sw { display: inline-block; width: 14px; height: 3px; margin: 0 4px 0 6px; vertical-align: 3px; }
.sw.aic { background: var(--c-s2); }
.sw.bic { background: var(--c-s5); }
</style>
