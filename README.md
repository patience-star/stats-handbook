# 统计学互动讲义

以茆诗松等《概率论与数理统计教程》（第三版，高教社）与黄良文《统计学》为纲的中文统计学学习网站：每个核心知识点按 **直观 → 几何 → 严格 → 应用** 展开，标注核心与重难点，三级难度可切换，配互动实验与分层练习。时间序列部分在黄书基础上一直讲到 ARMA、Box–Jenkins、单位根、GARCH 与卡尔曼滤波。

技术栈：[VitePress](https://vitepress.dev/) 1.6（Markdown 写内容）+ Vue 组件（互动实验）+ MathJax（公式在构建时渲染）+ jStat（分布函数与抽样）。所有资源本地打包，不依赖 CDN，离线可用。

## 快速开始

需要 Node.js 18 以上。

```bash
npm install
```

```bash
npm run dev
```

```bash
npm run build
```

- `npm run dev`：本地预览，默认 <http://localhost:5173>，改动即时生效；
- `npm run build`：构建静态站点到 `docs/.vitepress/dist`，可直接部署到任何静态托管（GitHub Pages、Netlify、自有服务器……）；构建时会检查死链；
- `npm run preview`：预览构建结果；
- `npm run check`：运行计算库的断言自检。

## 目录结构

```
docs/
├─ index.md                 首页（知识图谱、学习路线、进度）
├─ guide.md                 学习指南（分层说明、标注图例、两书对照）
├─ descriptive/ probability/ inference/ applied/ time-series/ appendix/
│                           各章内容，每章一个 .md
└─ .vitepress/
   ├─ syllabus.mjs          ★ 唯一的课程大纲
   ├─ config.mjs            站点配置与 Markdown 扩展（标注框、证明、练习）
   └─ theme/
      ├─ index.js           自动注册 components/ 与 labs/ 下的组件
      ├─ Layout.vue         阅读层级切换、复习模式、学完打卡
      ├─ style.css          配色与全部共享样式
      ├─ components/        通用组件：Plot（坐标系）、Space3D（三维示意图）、Quiz、ChapterCard、KnowledgeMap、BookTable
      ├─ labs/              互动实验（只在浏览器端渲染），按部分分子目录
      ├─ lib/               时间序列计算库 ts.js 与断言自检 check.mjs
      └─ data/              数据集（JSON，见下文“数据来源”）
```

`lib/ts.js` 提供：ARMA 模拟与 ψ 权重、理论与样本 ACF、Durbin–Levinson 递推（PACF、Yule–Walker）、差分、移动平均、经典分解、简单 / Holt / Holt–Winters 指数平滑、Ljung–Box 统计量、最小二乘、ARMA 的 Hannan–Rissanen 估计与预测、(A)DF 统计量、周期图、局部水平模型的卡尔曼滤波、GARCH(1,1) 模拟。每个函数在 `check.mjs` 里至少有一条断言；分布函数与随机数用 jStat。

## 新增一章

1. 在 `syllabus.mjs` 对应部分加一行：`{ slug, title, lv: [起点层级, 最高层级], mao: '茆书节号', huang: '黄书章名', pre: ['先修章节'] }`；
2. 新建 `docs/<部分目录>/<slug>.md`，第一行写 `# 标题`。

侧边栏、章节信息卡、知识图谱、两书对照表和学习进度都会自动更新。文件还没建时，侧边栏显示“编写中”，不会产生死链。教材章节号要校准，也只改 `syllabus.mjs`。

> 开发服务器运行时新建章节文件，需要重启 `npm run dev`，侧边栏才会出现链接。

## 新增一个互动实验

1. 在 `docs/.vitepress/theme/labs/<部分>/` 下新建 `名字.vue`；
2. 在 Markdown 里直接写 `<名字 />`，不需要注册。

约定：

- 外层用 `<div class="lab"><header>标题</header><div class="body">…</div></div>`，控件放在 `.controls`、按钮放在 `.btns`、读数放在 `.readout`，样式都在 `style.css` 里；
- 坐标图用 `components/Plot.vue`：`<Plot v-slot="{ sx, sy, inv }" :x="[0, 1]" :y="[0, 1]">…</Plot>`，`sx/sy` 把数据坐标换成像素，`inv(event)` 把指针位置换回数据坐标（拖拽用）；`equal` 让横纵比例尺相同；`xticks/yticks` 与 `xfmt/yfmt` 自定义刻度；同文件导出的 `linePath(点列, sx, sy)` 生成折线路径；
- 三维示意图用 `components/Space3D.vue`：`<Space3D :items="items" :range="2.6" />`，`items` 是 `{ type: 'poly' | 'line' | 'arrow' | 'point' | 'text', … , cls: 'c1' }` 的数组，可拖动旋转（正交投影）；
- 实验可以带参数：组件里用 `defineProps` 声明，Markdown 里写 `<RandomWalkPair initial="coint" />`；
- 颜色用 CSS 变量（`--c-s1` … `--c-s5`、`--c-core` 等），亮/暗主题自动适配；
- 实验只负责交互与可视化；“试一试”的引导问题和结论写在 Markdown 里；
- 实验只在浏览器端渲染，可以直接使用 `window`、`Math.random()`。

## 写作语法

````md
## 贝叶斯公式 {.hard}            标题角标：.core 核心 / .key 重点 / .hard 难点 / .l2 进阶 / .l3 深入

::: core 定义（条件概率）          标注框：core 核心 / key 重点 / hard 难点 / geo 几何直观
内容……                              insight 深刻理解 / pitfall 易错 / example 例题
:::

::: proof 证明                     可折叠的证明（标题可省略）
:::

:::: l3 深入：条件期望是投影        层级块：l2 进阶 / l3 深入；阅读层级较低时折叠
::: geo 里面还可以嵌套标注框
:::
::::                                嵌套时外层用 4 个冒号

::: quiz                           选择题：[x] 为正确项，引用块是解析（作答后显示）
题干……
- [ ] 选项 A
- [x] 选项 B
> 解析……
:::

::: quiz 0.95 0.005                数值题：答案与容差（不写容差默认为答案的 1%）
题干……
> 解析……
:::

::: details 解答                   章末练习的解答（VitePress 自带）
:::

::: info 史话                      VitePress 自带的提示框
:::
````

**标注的使用建议**：核心框用于本章最重要的定义、定理与公式，且一定写标题——每章开头的信息卡会把带标题的 核心/重点/难点 框和带角标的标题自动汇总成索引。

**引用其他章节**：写成 `“[章节标题](/目录/文件名)”一章`，例如 `“[区间估计](/inference/interval)”一章`。构建时会检查链接，章节改名或移动后能立刻发现。

**代码块**：每段 Python 代码都应能单独运行，只依赖 NumPy、SciPy、pandas、statsmodels（作图另需 matplotlib）；数据直接写在代码里，或用 statsmodels 自带的数据集。

## 章节模板

```md
# 章标题

问题引入：一个具体问题，说明为什么需要这一章。

## 知识点一 {.core}

直观引入……

::: core 定义（……）
:::

::: geo 几何直观：……
:::

<某个实验 />

**试一试**
1. ……

::: insight 深刻理解：……
:::

::: proof 证明
:::

::: quiz
:::

## 本章小结
（知识结构 + 公式表）

## 分层练习
### 基础
### 提高
### 挑战

## 代码实现（Python）
::: details 展开代码
:::

## 延伸阅读
```

## 记号约定

与茆书一致：密度 $p(x)$，分布函数 $F(x)$，下侧分位数 $u_\alpha$、$t_\alpha(n)$、$\chi^2_\alpha(n)$、$F_\alpha(m,n)$，样本方差 $s^2$ 用 $n-1$ 作分母。MA 部分写作 $X_t=\varepsilon_t+\theta_1\varepsilon_{t-1}+\cdots$（与 statsmodels 一致）。与经管类教材写法不同之处在正文的“易错”框中对照说明。

## 数据来源

| 文件 | 内容 | 来源 |
| --- | --- | --- |
| `air.json` | 国际航线月度乘客数，1949—1960 | R datasets：AirPassengers（Box & Jenkins, 1976） |
| `nile.json` | 尼罗河阿斯旺年流量，1871—1970 | R datasets：Nile（Durbin & Koopman, 2001） |
| `lynx.json` | 加拿大猞猁年捕获量，1821—1934 | R datasets：lynx（Campbell & Walker, 1977） |
| `sunspots.json` | 太阳黑子年均数，1700—1988 | R datasets：sunspot.year |
| `china.json` | 我国国内生产总值（现价美元，2000—2023）与年中人口（2010—2024） | 世界银行 WDI（经 datahub.io 镜像） |

其余实验中的数据都是随机生成的，界面上标明“模拟”。

## 版权说明

讲解、例题与习题均为原创，章节编排参照上述两本教材；真实数据注明来源，模拟数据会标明“模拟”。
