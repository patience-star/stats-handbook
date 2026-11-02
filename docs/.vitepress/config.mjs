import { defineConfig } from 'vitepress'
import container from 'markdown-it-container'
import { existsSync } from 'node:fs'
import { parts, routes } from './syllabus.mjs'

// 章节文件存在才生成链接；还没写的章节在侧边栏显示“编写中”
const docs = new URL('../', import.meta.url)
const syllabus = parts.map((p) => ({
  ...p,
  chapters: p.chapters.map((c) => {
    const id = `${p.dir}/${c.slug}`
    return { ...c, id, ready: existsSync(new URL(`${id}.md`, docs)) }
  }),
}))

const dot = (lv) => `<span class="lv-dot l${lv[0]}"></span>`

// ---------- Markdown 扩展 ----------
// 标注框：::: core 标题 … :::（标题可省略）；l2 / l3 是层级块，低层级阅读时折叠
const boxes = {
  core: '核心', key: '重点', hard: '难点', geo: '几何直观', insight: '深刻理解',
  pitfall: '易错', example: '例题', l2: '进阶', l3: '深入',
}

function extend(md) {
  const title = (info, name) => md.renderInline(info.trim().slice(name.length).trim())

  for (const [name, chip] of Object.entries(boxes)) {
    md.use(container, name, {
      render: (t, i) => t[i].nesting < 0 ? '</div>\n'
        : `<div class="box ${name}"><p class="box-title"><span class="chip">${chip}</span>${title(t[i].info, name)}</p>\n`,
    })
  }

  // ::: proof 标题 —— 可折叠的证明或推导
  md.use(container, 'proof', {
    render: (t, i) => t[i].nesting < 0 ? '</details>\n'
      : `<details class="box proof"><summary>${title(t[i].info, 'proof') || '证明'}</summary>\n`,
  })

  // ::: quiz（选择题）或 ::: quiz 答案 [容差]（数值题），渲染为 <Quiz>
  md.use(container, 'quiz', {
    render: (t, i) => {
      if (t[i].nesting < 0) return '</Quiz>\n'
      const ans = t[i].info.trim().slice(4).trim()
      return ans ? `<Quiz answer="${md.utils.escapeHtml(ans)}">\n` : '<Quiz>\n'
    },
  })

  // quiz 里以 [x] / [ ] 开头的列表项是选项：去掉标记，写入 data-opt（1 为正确项）
  md.core.ruler.push('quiz_options', (state) => {
    let depth = 0
    state.tokens.forEach((t, i) => {
      if (t.type === 'container_quiz_open') depth++
      else if (t.type === 'container_quiz_close') depth--
      else if (depth && t.type === 'inline' && state.tokens[i - 2]?.type === 'list_item_open') {
        const m = /^\[([ xX])\]\s*/.exec(t.content)
        if (!m || t.children[0]?.type !== 'text') return
        state.tokens[i - 2].attrSet('data-opt', m[1] === ' ' ? '0' : '1')
        t.children[0].content = t.children[0].content.slice(m[0].length)
      }
    })
  })

  // 每页一级标题之后自动插入章节信息卡
  md.core.ruler.push('chapter_card', (state) => {
    const i = state.tokens.findIndex((t) => t.type === 'heading_close' && t.tag === 'h1')
    if (i < 0) return
    const card = new state.Token('html_block', '', 0)
    card.content = '<ChapterCard />\n'
    state.tokens.splice(i + 1, 0, card)
  })
}

export default defineConfig({
  lang: 'zh-CN',
  title: '统计学互动讲义',
  description: '以茆诗松《概率论与数理统计教程》与黄良文《统计学》为纲的统计学互动讲义：直观、几何与严格表述，配互动实验与分层练习。',
  cleanUrls: true,
  head: [
    // 在页面渲染前应用阅读层级与复习模式，避免刷新时闪烁
    ['script', {}, "try{var d=document.documentElement;d.dataset.level=localStorage.getItem('stat-level')||'3';if(localStorage.getItem('stat-review')==='1')d.dataset.review='1'}catch(e){}"],
  ],
  // fontCache: 'local' 让同一公式里重复的字形共用一份路径，页面体积约减三分之一
  markdown: { math: { svg: { fontCache: 'local' } }, config: extend },
  themeConfig: {
    syllabus,
    routes,
    nav: [
      { text: '学习指南', link: '/guide' },
      {
        text: '章节',
        items: syllabus
          .map((p) => ({ text: p.title, items: p.chapters.filter((c) => c.ready).map((c) => ({ text: c.title, link: `/${c.id}` })) }))
          .filter((g) => g.items.length),
      },
    ],
    sidebar: syllabus.map((p) => ({
      text: p.title,
      collapsed: false,
      items: p.chapters.map((c) => c.ready
        ? { text: c.title + dot(c.lv), link: `/${c.id}` }
        : { text: `<span class="todo">${c.title}${dot(c.lv)}</span>` }),
    })),
    outline: { level: [2, 3], label: '本页目录' },
    docFooter: { prev: '上一章', next: '下一章' },
    darkModeSwitchLabel: '外观',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
    sidebarMenuLabel: '目录',
    returnToTopLabel: '回到顶部',
    notFound: { title: '页面不存在', quote: '这一章可能还在编写中。', linkLabel: '回到首页', linkText: '回到首页' },
    footer: { message: '讲解、例题与习题均为原创；章节编排参照茆诗松等《概率论与数理统计教程》（第三版）与黄良文《统计学》。' },
    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索', buttonAriaLabel: '搜索' },
          modal: {
            displayDetails: '显示详情', resetButtonTitle: '清除', backButtonTitle: '返回', noResultsText: '没有找到相关结果',
            footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' },
          },
        },
        miniSearch: {
          // 中文按词切分。VitePress 会把这个函数序列化到浏览器端，所以函数体不能引用外部变量
          options: {
            tokenize: (text) => [...new Intl.Segmenter('zh', { granularity: 'word' }).segment(text)]
              .filter((s) => s.isWordLike).map((s) => s.segment),
          },
          searchOptions: { combineWith: 'AND' },
        },
      },
    },
  },
})
