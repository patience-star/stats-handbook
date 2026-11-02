<script setup>
// 贝叶斯面积图：左边是全体人群（宽 = 先验，高 = 检测结果），右边把“阳性”区域拉伸成一整条
import { computed, ref } from 'vue'

const MAXLOG = Math.log10(0.99)
const logPrior = ref(-3)          // 患病率 P(D) = 10^logPrior，滑块按对数刻度
const sens = ref(0.99)            // 灵敏度 P(+|D)
const spec = ref(0.99)            // 特异度 P(−|D̄)
const chain = ref([])             // 复查时依次得到的后验

const prior = computed(() => 10 ** logPrior.value)
const tp = computed(() => prior.value * sens.value)
const fp = computed(() => (1 - prior.value) * (1 - spec.value))
const post = computed(() => tp.value / (tp.value + fp.value))
const lr = computed(() => sens.value / (1 - spec.value))

const pct = (v) => (v * 100).toFixed(v < 0.01 ? 2 : 1) + '%'
const num = (v) => Math.round(v).toLocaleString('zh-CN')
const one = (v) => (v >= 100 ? num(v) : +v.toFixed(1))
const odds = (p) => (p < 0.5 ? `1 : ${one((1 - p) / p)}` : `${one(p / (1 - p))} : 1`)

// 自然频数（以 10 万人计）
const N = 100000
const freq = computed(() => ({
  sick: N * prior.value, healthy: N * (1 - prior.value), tp: N * tp.value, fp: N * fp.value,
}))

function retest() {
  if (!chain.value.length) chain.value.push(prior.value)
  chain.value.push(post.value)
  logPrior.value = Math.min(MAXLOG, Math.log10(post.value))
}
function reset() {
  chain.value = []
  logPrior.value = -3
  sens.value = 0.99
  spec.value = 0.99
}

// 左图几何：正方形边长 S，患病竖条宽度至少 2px，否则看不见
const S = 240, X = 20, Y = 24
const ws = computed(() => Math.max(2, S * prior.value))
const hfp = computed(() => Math.max(1, S * (1 - spec.value)))
</script>

<template>
  <div class="lab">
    <header>贝叶斯面积图：阳性意味着什么</header>
    <div class="body">
      <div class="controls">
        <label>患病率 P(D) <input v-model.number="logPrior" type="range" min="-4" :max="MAXLOG" step="0.01" @input="chain = []"><span class="val">{{ pct(prior) }}</span></label>
        <label>灵敏度 P(+|D) <input v-model.number="sens" type="range" min="0.3" max="0.999" step="0.001" @input="chain = []"><span class="val">{{ pct(sens) }}</span></label>
        <label>特异度 P(−|D̄) <input v-model.number="spec" type="range" min="0.3" max="0.999" step="0.001" @input="chain = []"><span class="val">{{ pct(spec) }}</span></label>
      </div>
      <div class="btns">
        <button class="btn" @click="retest">阳性后再测一次（后验当先验）</button>
        <button class="btn" @click="reset">重置</button>
      </div>

      <div class="grid2">
        <div class="panel">
          <svg viewBox="0 0 280 300" class="plot">
            <text x="140" y="14" text-anchor="middle" class="title">全体人群（面积 = 概率）</text>
            <!-- 患病竖条：上真阳性、下假阴性 -->
            <rect :x="X" :y="Y" :width="ws" :height="S * sens" class="tp" />
            <rect :x="X" :y="Y + S * sens" :width="ws" :height="S * (1 - sens)" class="fn" />
            <!-- 健康部分：上假阳性、下真阴性 -->
            <rect :x="X + ws" :y="Y" :width="S - ws" :height="hfp" class="fp" />
            <rect :x="X + ws" :y="Y + hfp" :width="S - ws" :height="S - hfp" class="tn" />
            <rect :x="X" :y="Y" :width="S" :height="S" class="frame" />
            <!-- 阳性带标注 -->
            <path :d="`M${X + S + 6},${Y}h6V${Y + Math.max(hfp, 6)}h-6`" class="brace" />
            <text :x="X + S + 15" :y="Y + 10" class="small">阳性</text>
            <text :x="X" :y="Y + S + 16" class="small">← 患病 {{ pct(prior) }}</text>
            <text :x="X + S" :y="Y + S + 16" text-anchor="end" class="small">健康 {{ pct(1 - prior) }}</text>
            <g class="legend" :transform="`translate(${X},${Y + S + 30})`">
              <rect width="10" height="10" class="tp" /><text x="14" y="9">真阳性</text>
              <rect x="64" width="10" height="10" class="fn" /><text x="78" y="9">假阴性</text>
              <rect x="128" width="10" height="10" class="fp" /><text x="142" y="9">假阳性</text>
              <rect x="192" width="10" height="10" class="tn" /><text x="206" y="9">真阴性</text>
            </g>
          </svg>
        </div>
        <div class="panel">
          <svg viewBox="0 0 280 300" class="plot">
            <text x="140" y="14" text-anchor="middle" class="title">只看阳性者（拉伸成整条）</text>
            <rect x="70" :y="Y" width="70" :height="S * post" class="tp" />
            <rect x="70" :y="Y + S * post" width="70" :height="S * (1 - post)" class="fp" />
            <rect x="70" :y="Y" width="70" :height="S" class="frame" />
            <text x="150" :y="Y + Math.min(Math.max(S * post / 2, 10), S - 26) + 4" class="big">真阳性 {{ pct(post) }}</text>
            <text x="150" :y="Y + Math.max(S * post + (S * (1 - post)) / 2, 30) + 4" class="small">假阳性 {{ pct(1 - post) }}</text>
            <text x="140" :y="Y + S + 16" text-anchor="middle" class="small">P(患病 | 阳性) = {{ pct(post) }}</text>
          </svg>
        </div>
      </div>

      <div class="readout">
        <div>
          <b>P(患病 | 阳性) = {{ pct(post) }}</b>
          = 真阳性 {{ tp.toFixed(5) }} ÷（真阳性 {{ tp.toFixed(5) }} + 假阳性 {{ fp.toFixed(5) }}）
        </div>
        <div>
          自然频数：10 万人中约 {{ num(freq.sick) }} 人患病，其中约 {{ num(freq.tp) }} 人阳性；
          {{ num(freq.healthy) }} 名健康者中约 {{ num(freq.fp) }} 人被误报为阳性。
          阳性共约 {{ num(freq.tp + freq.fp) }} 人，真正患病的只有约 {{ num(freq.tp) }} 人。
        </div>
        <div>
          几率形式：先验几率 {{ odds(prior) }} × 似然比 {{ one(lr) }} = 后验几率 {{ odds(post) }}
        </div>
        <div v-if="chain.length">检测链：{{ chain.map(pct).join(' → ') }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.plot { width: 100%; height: auto; }
.title { font-size: 13px; font-weight: 600; fill: var(--vp-c-text-1); }
.small { font-size: 12px; fill: var(--vp-c-text-2); }
.big { font-size: 14px; font-weight: 600; fill: var(--c-s4); }
.legend text { font-size: 11px; fill: var(--vp-c-text-2); }
.tp { fill: var(--c-s4); }
.fn { fill: color-mix(in srgb, var(--c-s4) 28%, transparent); }
.fp { fill: var(--c-s1); }
.tn { fill: color-mix(in srgb, var(--c-s1) 14%, transparent); }
.frame { fill: none; stroke: var(--vp-c-text-3); stroke-width: 1; }
.brace { fill: none; stroke: var(--vp-c-text-2); stroke-width: 1.2; }
</style>
