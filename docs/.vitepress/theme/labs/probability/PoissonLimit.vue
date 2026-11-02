<script setup>
// 泊松定理：保持 np = λ，n 增大时二项分布 b(n, λ/n) 逼近泊松分布 P(λ)
import { computed, ref } from 'vue'
import jStat from 'jstat'
import Plot from '../../components/Plot.vue'

const lam = ref(3)
const n = ref(10)
const K = computed(() => Math.ceil(lam.value + 4 * Math.sqrt(lam.value) + 3))
const ks = computed(() => Array.from({ length: K.value + 1 }, (_, k) => k))
const nn = computed(() => Math.max(n.value, Math.ceil(lam.value)))   // 保证 p = λ/n ≤ 1
const p = computed(() => lam.value / nn.value)
const bin = (k) => (k > nn.value ? 0 : jStat.binomial.pdf(k, nn.value, p.value))
const poi = (k) => jStat.poisson.pdf(k, lam.value)
const gap = computed(() => Math.max(...ks.value.map((k) => Math.abs(bin(k) - poi(k)))))
const ymax = computed(() => Math.max(...ks.value.map((k) => Math.max(bin(k), poi(k)))) * 1.15)
</script>

<template>
  <div class="lab">
    <header>泊松定理：二项分布的极限</header>
    <div class="body">
      <div class="controls">
        <label>λ = np <input v-model.number="lam" type="range" min="0.5" max="10" step="0.5"><span class="val">{{ lam }}</span></label>
        <label>试验次数 n <input v-model.number="n" type="range" min="1" max="300" step="1"><span class="val">{{ nn }}</span></label>
      </div>
      <Plot v-slot="{ sx, sy }" :x="[-0.8, K + 0.8]" :y="[0, ymax]" :height="230">
        <template v-for="k in ks" :key="k">
          <rect :x="sx(k) - 7" :y="sy(bin(k))" width="7" :height="sy(0) - sy(bin(k))" class="b" />
          <rect :x="sx(k)" :y="sy(poi(k))" width="7" :height="sy(0) - sy(poi(k))" class="p" />
        </template>
      </Plot>
      <div class="cap"><span class="sw b" /> 二项 b(n, λ/n)　<span class="sw p" /> 泊松 P(λ)</div>
      <div class="readout">
        n = {{ nn }}，p = λ/n = {{ p.toFixed(4) }}；各点概率之差的最大值 max|b − P| = <b>{{ gap.toFixed(4) }}</b>
      </div>
    </div>
  </div>
</template>

<style scoped>
.b { fill: var(--c-s1); }
.p { fill: var(--c-s2); }
.sw { display: inline-block; width: 10px; height: 10px; margin-right: 4px; vertical-align: -1px; border-radius: 2px; }
.sw.b { background: var(--c-s1); }
.sw.p { background: var(--c-s2); }
</style>
