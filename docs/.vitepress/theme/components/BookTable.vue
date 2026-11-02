<script setup>
// 两书对照表 + 学习路线归属，数据来自 syllabus
import { useData, withBase } from 'vitepress'

const { theme } = useData()
const lv = (c) => `L${c.lv[0]}${c.lv[1] > c.lv[0] ? '–' + c.lv[1] : ''}`
</script>

<template>
  <table class="book-table">
    <thead>
      <tr>
        <th>章节</th><th>层级</th><th>茆书（教程·第三版）</th><th>黄书《统计学》</th>
        <th v-for="r in theme.routes" :key="r.id">{{ r.short }}</th>
      </tr>
    </thead>
    <tbody>
      <template v-for="p in theme.syllabus" :key="p.dir">
        <tr class="part"><td :colspan="4 + theme.routes.length">{{ p.title }}</td></tr>
        <tr v-for="c in p.chapters" :key="c.id">
          <td>
            <a v-if="c.ready" :href="withBase('/' + c.id)">{{ c.title }}</a>
            <span v-else class="todo">{{ c.title }}</span>
          </td>
          <td class="nowrap">{{ lv(c) }}</td>
          <td>{{ c.mao || '—' }}</td>
          <td>{{ c.huang || '—' }}</td>
          <td v-for="r in theme.routes" :key="r.id" class="mark">{{ r.chapters.includes(c.id) ? '●' : '' }}</td>
        </tr>
      </template>
    </tbody>
  </table>
</template>

<style scoped>
.book-table { font-size: 14px; }
.part td { font-weight: 600; background: var(--vp-c-bg-soft); }
.nowrap { white-space: nowrap; }
.mark { text-align: center; color: var(--vp-c-brand-1); }
</style>
