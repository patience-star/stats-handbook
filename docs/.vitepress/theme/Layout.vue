<script setup>
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
import { computed, onMounted, ref, watch } from 'vue'

const { theme, page } = useData()
const get = (k) => { try { return localStorage.getItem(k) } catch { return null } }
const set = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v) } catch {} }

// 阅读层级与复习模式写在 <html> 的 data 属性上，显隐由 style.css 控制
const levels = [
  ['1', '基础', '只看 L1：概念、直观与计算'],
  ['2', '进阶', 'L1 + L2：加上严格表述与证明'],
  ['3', '深入', '全部内容，包括超出两本教材的拓展'],
]  // 窄屏上按钮只显示 L1/L2/L3
const level = ref('3')
const review = ref(false)
onMounted(() => {
  level.value = document.documentElement.dataset.level || '3'
  review.value = document.documentElement.dataset.review === '1'
})
function setLevel(v) {
  level.value = v
  document.documentElement.dataset.level = v
  set('stat-level', v)
}
function toggleReview() {
  review.value = !review.value
  const d = document.documentElement.dataset
  if (review.value) d.review = '1'
  else delete d.review
  set('stat-review', review.value ? '1' : null)
}

// 学完打卡
const chapter = computed(() =>
  theme.value.syllabus.flatMap((p) => p.chapters).find((c) => `${c.id}.md` === page.value.relativePath))
const done = ref(false)
const sync = () => { done.value = !!chapter.value && get(`stat-done:${chapter.value.id}`) === '1' }
onMounted(sync)
watch(chapter, sync)
function toggleDone() {
  done.value = !done.value
  set(`stat-done:${chapter.value.id}`, done.value ? '1' : null)
}
</script>

<template>
  <DefaultTheme.Layout>
    <template #nav-bar-content-after>
      <div class="reader">
        <div class="seg" role="group" aria-label="阅读层级">
          <button
            v-for="[v, t, tip] in levels" :key="v" :class="{ on: level === v }"
            :title="tip" :aria-pressed="level === v" :aria-label="t" @click="setLevel(v)"
          ><span class="long">{{ t }}</span><span class="short">L{{ v }}</span></button>
        </div>
        <button
          class="rev" :class="{ on: review }" :aria-pressed="review"
          title="复习模式：只显示标题与核心、重点、难点、易错框" @click="toggleReview"
        >复习</button>
      </div>
    </template>

    <template #doc-footer-before>
      <div v-if="chapter" class="done-bar">
        <button :class="{ on: done }" @click="toggleDone">{{ done ? '✓ 已学完本章' : '标记本章为已学完' }}</button>
        <span>进度保存在本机浏览器里，首页的知识图谱会显示出来。</span>
      </div>
    </template>

    <template #home-hero-image>
      <GaltonBoard hero />
    </template>
  </DefaultTheme.Layout>
</template>

<style scoped>
.reader {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 16px;
}
.seg {
  display: flex;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
}
.reader button {
  height: 28px;
  padding: 0 10px;
  font-size: 13px;
  color: var(--vp-c-text-2);
  transition: color 0.2s, background-color 0.2s;
}
.reader button:hover { color: var(--vp-c-brand-1); }
.reader button.on {
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  font-weight: 600;
}
.rev {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
}
.short { display: none; }
@media (max-width: 767px) {
  .reader { margin-left: 4px; gap: 4px; }
  .reader button { padding: 0 6px; font-size: 12px; }
}
@media (max-width: 480px) {
  .reader button { padding: 0 5px; }
  .long { display: none; }
  .short { display: inline; }
}

.done-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin: 40px 0 24px;
  padding: 16px 20px;
  border: 1px dashed var(--vp-c-divider);
  border-radius: 12px;
}
.done-bar button {
  padding: 6px 16px;
  border-radius: 20px;
  border: 1px solid var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  font-weight: 600;
  font-size: 14px;
}
.done-bar button.on {
  background: var(--vp-c-brand-1);
  color: var(--vp-c-bg);
}
.done-bar span {
  font-size: 13px;
  color: var(--vp-c-text-3);
}
</style>
