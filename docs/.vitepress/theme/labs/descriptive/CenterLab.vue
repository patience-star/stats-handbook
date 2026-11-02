<script setup>
// 均值与中位数：均值是让平方偏差之和最小的点（也是跷跷板的支点），中位数是让绝对偏差之和最小的点
import { computed, ref } from 'vue'
import Plot, { linePath } from '../../components/Plot.vue'

const INIT = [2, 3, 3.5, 5, 6, 7.5, 9]
const xs = ref([...INIT])
const sorted = computed(() => [...xs.value].sort((a, b) => a - b))
const n = computed(() => xs.value.length)
const mean = computed(() => xs.value.reduce((s, v) => s + v, 0) / n.value)
const median = computed(() => { const s = sorted.value, m = Math.floor(n.value / 2); return n.value % 2 ? s[m] : (s[m - 1] + s[m]) / 2 })
const L1 = (c) => xs.value.reduce((s, v) => s + Math.abs(v - c), 0)
const L2 = (c) => xs.value.reduce((s, v) => s + (v - c) ** 2, 0)
const cs = Array.from({ length: 201 }, (_, i) => i * 0.1)
const l1Pts = computed(() => { const m = Math.max(...cs.map(L1)); return cs.map((c) => [c, L1(c) / m]) })
const l2Pts = computed(() => { const m = Math.max(...cs.map(L2)); return cs.map((c) => [c, L2(c) / m]) })
const flat = computed(() => (n.value % 2 ? null : [sorted.value[n.value / 2 - 1], sorted.value[n.value / 2]]))

const drag = ref(-1)
function down(e, i) { drag.value = i; e.target.setPointerCapture(e.pointerId) }
function move(e, inv) { if (drag.value >= 0) xs.value[drag.value] = Math.round(Math.min(20, Math.max(0, inv(e)[0])) * 10) / 10 }
const up = () => { drag.value = -1 }
const add = () => { xs.value.push(Math.round(Math.random() * 100) / 10) }
const remove = () => { if (xs.value.length > 2) xs.value.pop() }
const outlier = () => { xs.value[xs.value.length - 1] = 19.5 }
const reset = () => { xs.value = [...INIT] }
// 同一位置有多个点时上下错开
const stackY = computed(() => xs.value.map((x, i) => xs.value.slice(0, i).filter((v) => Math.abs(v - x) < 0.25).length))
</script>

<template>
  <div class="lab">
    <header>均值、中位数与两种“距离”</header>
    <div class="body">
      <div class="btns">
        <button class="btn" @click="add">添加一个点</button>
        <button class="btn" @click="remove">删除一个点</button>
        <button class="btn" @click="outlier">把最后一个点变成离群值</button>
        <button class="btn" @click="reset">重置</button>
      </div>
      <Plot v-slot="{ sx, sy, inv }" :x="[0, 20]" :y="[0, 1]" :height="110" :yticks="[]">
        <line :x1="sx(0)" :x2="sx(20)" :y1="sy(0.3)" :y2="sy(0.3)" class="beam" />
        <polygon :points="`${sx(mean)},${sy(0.3) + 1} ${sx(mean) - 9},${sy(0.3) + 16} ${sx(mean) + 9},${sy(0.3) + 16}`" class="fulcrum" />
        <line :x1="sx(median)" :x2="sx(median)" :y1="sy(0.95)" :y2="sy(0.3)" class="medline" />
        <text :x="sx(median)" :y="sy(0.95) - 2" text-anchor="middle" class="tag-med">中位数</text>
        <circle
          v-for="(x, i) in xs" :key="i" :cx="sx(x)" :cy="sy(0.3) - 9 - 16 * stackY[i]" r="8" class="pt"
          @pointerdown="down($event, i)" @pointermove="move($event, inv)" @pointerup="up" @pointercancel="up"
        />
      </Plot>
      <div class="cap">拖动圆点。▲ 是均值：把数据看成跷跷板上的砝码，均值就是让它平衡的支点</div>
      <Plot v-slot="{ sx, sy }" :x="[0, 20]" :y="[0, 1.05]" :height="190" :yticks="[0, 0.5, 1]">
        <rect v-if="flat" :x="sx(flat[0])" :y="sy(1.05)" :width="Math.max(1, sx(flat[1]) - sx(flat[0]))" :height="sy(0) - sy(1.05)" class="flat" />
        <path :d="linePath(l2Pts, sx, sy)" class="l2" />
        <path :d="linePath(l1Pts, sx, sy)" class="l1" />
        <circle :cx="sx(mean)" :cy="sy(L2(mean) / Math.max(...cs.map(L2)))" r="5" class="m2" />
        <circle :cx="sx(median)" :cy="sy(L1(median) / Math.max(...cs.map(L1)))" r="5" class="m1" />
      </Plot>
      <div class="cap">
        <span class="sw l2" /> Σ(xᵢ − c)²（最低点在均值）　<span class="sw l1" /> Σ|xᵢ − c|（最低点在中位数）；横轴为 c，两条曲线都缩放到最大值为 1
      </div>
      <div class="readout">
        n = {{ n }}，均值 <b>{{ mean.toFixed(2) }}</b>，中位数 <b>{{ median.toFixed(2) }}</b>。
        <template v-if="flat">n 为偶数，绝对偏差之和在 [{{ flat[0] }}, {{ flat[1] }}] 上是一段平底，其中任意一点都使它最小，通常取中点作中位数。</template>
        <br>把一个点拖到很远处：均值被拽着走，中位数纹丝不动——这就是中位数的 <b>稳健性</b>。
      </div>
    </div>
  </div>
</template>

<style scoped>
.beam { stroke: var(--vp-c-text-2); stroke-width: 3; }
.fulcrum { fill: var(--c-s2); }
.medline { stroke: var(--c-s4); stroke-dasharray: 4 3; stroke-width: 1.5; }
.tag-med { font-size: 11px; fill: var(--c-s4); }
.pt { fill: var(--c-s1); stroke: var(--vp-c-bg); stroke-width: 2; cursor: grab; touch-action: none; }
.l1 { fill: none; stroke: var(--c-s4); stroke-width: 2.2; }
.l2 { fill: none; stroke: var(--c-s2); stroke-width: 2.2; }
.m1 { fill: var(--c-s4); }
.m2 { fill: var(--c-s2); }
.flat { fill: color-mix(in srgb, var(--c-s4) 10%, transparent); }
.sw { display: inline-block; width: 14px; height: 3px; margin: 0 4px 0 6px; vertical-align: 3px; }
.sw.l1 { background: var(--c-s4); }
.sw.l2 { background: var(--c-s2); }
</style>
