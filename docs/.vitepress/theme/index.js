import DefaultTheme from 'vitepress/theme'
import { defineAsyncComponent, h } from 'vue'
import Layout from './Layout.vue'
import './style.css'

const name = (path) => path.split('/').pop().replace('.vue', '')

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    // components/ 与 labs/ 下的组件自动全局注册，Markdown 里直接写 <名字 />；异步加载，用到的页面才下载
    for (const [path, load] of Object.entries(import.meta.glob('./components/*.vue')))
      app.component(name(path), defineAsyncComponent(load))
    // 互动实验只在浏览器端渲染，组件里可以放心使用 window 和随机数
    const ClientOnly = app.component('ClientOnly')
    for (const [path, load] of Object.entries(import.meta.glob('./labs/**/*.vue'))) {
      const Lab = defineAsyncComponent(load)
      app.component(name(path), (props) => h(ClientOnly, () => h(Lab, props)))
    }
  },
}
