<script setup>
// 首页知识图谱：按部分分列，连线表示先修关系；可选学习路线，显示本机学习进度。数据全部来自 syllabus。
import { computed, onMounted, ref } from 'vue'
import { useData, useRouter, withBase } from 'vitepress'

const { theme } = useData()
const router = useRouter()
const W = 160, H = 38, GX = 196, GY = 52, X0 = 8, Y0 = 44

const cols = computed(() => theme.value.syllabus.filter((p) => p.dir !== 'appendix'))
const nodes = computed(() => {
  const out = {}
  cols.value.forEach((p, ci) => p.chapters.forEach((c, ri) => { out[c.id] = { ...c, x: X0 + ci * GX, y: Y0 + ri * GY } }))
  return out
})
const list = computed(() => Object.values(nodes.value))
const width = computed(() => X0 * 2 + (cols.value.length - 1) * GX + W + 12)
const height = computed(() => Y0 + Math.max(...cols.value.map((p) => p.chapters.length)) * GY)

const edges = computed(() => list.value.flatMap((n) => n.pre.filter((id) => nodes.value[id]).map((id) => [nodes.value[id], n])))
function edgePath([a, b]) {
  if (a.x === b.x) {
    if (b.y - a.y === GY) return `M${a.x + W / 2},${a.y + H}V${b.y}`
    const x = a.x + W, mx = x + 22
    return `M${x},${a.y + H / 2}C${mx},${a.y + H / 2} ${mx},${b.y + H / 2} ${x},${b.y + H / 2}`
  }
  const x1 = a.x + W, y1 = a.y + H / 2, x2 = b.x, y2 = b.y + H / 2, mx = (x1 + x2) / 2
  return `M${x1},${y1}C${mx},${y1} ${mx},${y2} ${x2},${y2}`
}

const route = ref('')
const current = computed(() => theme.value.routes.find((r) => r.id === route.value))
const order = computed(() => current.value ? Object.fromEntries(current.value.chapters.map((id, i) => [id, i + 1])) : null)
const dim = (id) => order.value && !(id in order.value)

const hover = ref(null)
const hot = ([a, b]) => hover.value === a.id || hover.value === b.id

const done = ref({})
onMounted(() => {
  const d = {}
  for (const n of list.value) {
    try { if (localStorage.getItem(`stat-done:${n.id}`) === '1') d[n.id] = true } catch {}
  }
  done.value = d
})
const stats = computed(() => ({
  total: list.value.length,
  ready: list.value.filter((n) => n.ready).length,
  done: list.value.filter((n) => done.value[n.id]).length,
}))

const short = (t) => (t.length > 12 ? t.slice(0, 11) + '…' : t)
const open = (n) => { if (n.ready) router.go(withBase(`/${n.id}`)) }
</script>

<template>
  <section class="km">
    <div class="km-top">
      <div class="routes">
        <button :class="{ on: !route }" @click="route = ''">全部章节</button>
        <button v-for="r in theme.routes" :key="r.id" :class="{ on: route === r.id }" @click="route = r.id">{{ r.name }}</button>
      </div>
      <div class="stats">已上线 {{ stats.ready }} / {{ stats.total }} 章 · 已学完 {{ stats.done }} 章</div>
    </div>
    <p class="desc">{{ current ? current.desc + ' 圆圈里的数字是建议的学习顺序。' : '鼠标停在某一章上，会高亮它的先修关系；点击进入该章。' }}</p>
    <div class="scroll">
      <svg :viewBox="`0 0 ${width} ${height}`" :style="{ minWidth: width * 0.8 + 'px' }">
        <text v-for="(p, ci) in cols" :key="p.dir" class="col" :x="X0 + ci * GX" y="22">{{ p.title }}</text>
        <path v-for="(e, i) in edges" :key="i" class="edge" :class="{ hot: hot(e), dim: dim(e[0].id) || dim(e[1].id) }" :d="edgePath(e)" />
        <g
          v-for="n in list" :key="n.id" class="node"
          :class="{ ready: n.ready, done: done[n.id], dim: dim(n.id), hot: hover === n.id }"
          :transform="`translate(${n.x},${n.y})`"
          @click="open(n)" @mouseenter="hover = n.id" @mouseleave="hover = null"
        >
          <title>{{ n.title }}{{ n.ready ? '' : '（编写中）' }}</title>
          <rect :width="W" :height="H" rx="9" />
          <circle class="lv" :class="'l' + n.lv[0]" cx="14" :cy="H / 2" r="4" />
          <text x="26" :y="H / 2 + 4.5">{{ short(n.title) }}</text>
          <text v-if="done[n.id]" class="check" :x="W - 14" :y="H / 2 + 5" text-anchor="middle">✓</text>
          <g v-if="order && order[n.id]" class="step">
            <circle :cx="W" cy="1" r="9" />
            <text :x="W" y="5" text-anchor="middle">{{ order[n.id] }}</text>
          </g>
        </g>
      </svg>
    </div>
    <div class="legend">
      <span><i class="l1" />L1 基础</span><span><i class="l2" />L2 进阶</span><span><i class="l3" />L3 深入</span>
      <span class="dash">虚线框：编写中</span>
    </div>
  </section>
</template>

<style scoped>
.km { margin: 8px 0 24px; }
.km-top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; }
.routes { display: flex; flex-wrap: wrap; gap: 8px; }
.routes button {
  padding: 4px 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 20px;
  font-size: 14px;
  color: var(--vp-c-text-2);
  transition: all 0.2s;
}
.routes button:hover { color: var(--vp-c-brand-1); border-color: var(--vp-c-brand-1); }
.routes button.on { color: var(--vp-c-bg); background: var(--vp-c-brand-1); border-color: var(--vp-c-brand-1); }
.stats { font-size: 13px; color: var(--vp-c-text-2); }
.desc { margin: 10px 0 6px !important; font-size: 14px; color: var(--vp-c-text-2); }
.scroll { overflow-x: auto; padding: 4px 0; }
svg { display: block; width: 100%; height: auto; }
.col { font-size: 14px; font-weight: 600; fill: var(--vp-c-text-1); }
.edge { fill: none; stroke: var(--vp-c-divider); stroke-width: 1.5; transition: stroke 0.2s, opacity 0.2s; }
.edge.hot { stroke: var(--vp-c-brand-1); stroke-width: 2.2; }
.edge.dim { opacity: 0.15; }
.node { transition: opacity 0.2s; }
.node rect { fill: var(--vp-c-bg); stroke: var(--vp-c-divider); stroke-width: 1.2; transition: stroke 0.2s, fill 0.2s; }
.node text { font-size: 13px; fill: var(--vp-c-text-1); }
.node.ready { cursor: pointer; }
.node.ready:hover rect, .node.hot rect { stroke: var(--vp-c-brand-1); stroke-width: 1.8; }
.node:not(.ready) rect { stroke-dasharray: 4 3; fill: transparent; }
.node:not(.ready) text { fill: var(--vp-c-text-3); }
.node.done rect { fill: var(--vp-c-brand-soft); stroke: var(--vp-c-brand-1); }
.node.dim { opacity: 0.22; }
.node .check { fill: var(--vp-c-brand-1); font-weight: 700; }
.lv.l1 { fill: var(--c-l1); }
.lv.l2 { fill: var(--c-l2); }
.lv.l3 { fill: var(--c-l3); }
.step circle { fill: var(--vp-c-brand-1); }
.step text { fill: var(--vp-c-bg); font-size: 11px; font-weight: 700; }
.legend { display: flex; flex-wrap: wrap; gap: 6px 18px; font-size: 13px; color: var(--vp-c-text-2); }
.legend i { display: inline-block; width: 8px; height: 8px; margin-right: 6px; border-radius: 50%; }
.legend .l1 { background: var(--c-l1); }
.legend .l2 { background: var(--c-l2); }
.legend .l3 { background: var(--c-l3); }
</style>
