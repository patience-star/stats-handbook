<script setup>
// 章节信息卡：由 config 自动插在每页一级标题之后。教材对应、层级、先修来自 syllabus；
// “本章核心与重难点”在页面挂载后从 {.core}/{.key}/{.hard} 标题和对应标注框里收集。
import { computed, onMounted, ref } from 'vue'
import { useData, withBase } from 'vitepress'

const { theme, page } = useData()
const all = computed(() => theme.value.syllabus.flatMap((p) => p.chapters.map((c) => ({ ...c, part: p.title }))))
const chapter = computed(() => all.value.find((c) => `${c.id}.md` === page.value.relativePath))
const no = computed(() => all.value.filter((c) => !c.id.startsWith('appendix/')).indexOf(chapter.value) + 1)
const pre = computed(() => (chapter.value?.pre ?? []).map((id) => all.value.find((c) => c.id === id)).filter(Boolean))
const levels = computed(() => {
  const [a, b] = chapter.value.lv
  return Array.from({ length: b - a + 1 }, (_, i) => a + i)
})
const LV = ['', '基础', '进阶', '深入']

const kinds = [['core', '核心'], ['key', '重点'], ['hard', '难点']]
const marks = ref({ core: [], key: [], hard: [] })
onMounted(() => {
  if (!chapter.value) return
  const out = { core: [], key: [], hard: [] }
  document.querySelectorAll('.vp-doc :is(h2, h3, .box):is(.core, .key, .hard)').forEach((el, i) => {
    const [kind] = kinds.find(([k]) => el.classList.contains(k))
    const t = (el.querySelector(':scope > .box-title') ?? el).cloneNode(true)
    t.querySelectorAll('.chip, .header-anchor').forEach((n) => n.remove())
    const html = t.innerHTML.trim()
    if (!html) return
    if (!el.id) el.id = `mark-${i}`
    out[kind].push({ id: el.id, html })
  })
  marks.value = out
})
</script>

<template>
  <div v-if="chapter" class="chapter-card">
    <div class="row head">
      <span class="kicker">{{ chapter.part }}{{ no ? ` · 第 ${no} 章` : '' }}</span>
      <span class="lvs">
        <span v-for="l in levels" :key="l" class="lv" :class="'l' + l">L{{ l }} {{ LV[l] }}</span>
      </span>
    </div>
    <div class="row">
      <b>对应教材</b>
      <span>茆书 {{ chapter.mao || '—' }}</span><span class="sep">｜</span><span>黄书 {{ chapter.huang || '—' }}</span>
    </div>
    <div v-if="pre.length" class="row">
      <b>先修</b>
      <template v-for="(c, i) in pre" :key="c.id">
        <span v-if="i" class="sep">·</span>
        <a v-if="c.ready" :href="withBase('/' + c.id)">{{ c.title }}</a>
        <span v-else class="todo">{{ c.title }}</span>
      </template>
    </div>
    <template v-for="[k, name] in kinds" :key="k">
      <div v-if="marks[k].length" class="row marks">
        <span class="chip" :class="k">{{ name }}</span>
        <span class="links">
          <a v-for="m in marks[k]" :key="m.id" :href="'#' + m.id" v-html="m.html" />
        </span>
      </div>
    </template>
  </div>
</template>

<style scoped>
.chapter-card {
  margin: 12px 0 32px;
  padding: 14px 18px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  font-size: 14px;
  line-height: 1.9;
}
.row { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 8px; }
.row b { color: var(--vp-c-text-2); font-weight: 600; margin-right: 4px; }
.head { justify-content: space-between; margin-bottom: 4px; }
.kicker { font-weight: 600; color: var(--vp-c-brand-1); }
.lvs { display: flex; gap: 6px; }
.lv {
  padding: 0 8px;
  border-radius: 6px;
  font-size: 12px;
  line-height: 20px;
  border: 1px solid currentColor;
}
.lv.l1 { color: var(--c-l1); }
.lv.l2 { color: var(--c-l2); }
.lv.l3 { color: var(--c-l3); }
.sep { color: var(--vp-c-text-3); }
.marks { flex-wrap: nowrap; align-items: flex-start; margin-top: 4px; }
.marks .chip { margin-top: 4px; }
.chip.core { --c: var(--c-core); }
.chip.key { --c: var(--c-key); }
.chip.hard { --c: var(--c-hard); }
.links { display: flex; flex-wrap: wrap; gap: 0 14px; }
.links a { font-weight: 500; text-decoration: none; }
.links a:hover { text-decoration: underline; }
</style>
