// 全站唯一的课程大纲：侧边栏、章节信息卡、知识图谱、两书对照表、学习路线都由它生成。
//   lv    [起点层级, 最高层级]，1 基础 · 2 进阶 · 3 深入
//   mao   茆诗松等《概率论与数理统计教程》第三版（高等教育出版社）的对应节
//   huang 黄良文《统计学》的对应章（按章名标注）
//   pre   先修章节，写成 "目录/文件名"
// 章节的 .md 文件还不存在时，侧边栏显示“编写中”，不生成链接。
export const parts = [
  {
    dir: 'descriptive', title: '一、描述统计', chapters: [
      { slug: 'intro', title: '统计学与数据', lv: [1, 1], mao: '', huang: '总论', pre: [] },
      { slug: 'collection', title: '数据的搜集', lv: [1, 1], mao: '', huang: '统计数据的搜集', pre: ['descriptive/intro'] },
      { slug: 'organization', title: '数据的整理与显示', lv: [1, 1], mao: '§5.2', huang: '统计数据的整理', pre: ['descriptive/collection'] },
      { slug: 'measures', title: '分布特征的描述', lv: [1, 1], mao: '§5.3', huang: '数据分布特征的描述', pre: ['descriptive/organization'] },
    ],
  },
  {
    dir: 'probability', title: '二、概率论', chapters: [
      { slug: 'events', title: '随机事件与概率', lv: [1, 2], mao: '§1.1–1.3', huang: '概率基础', pre: [] },
      { slug: 'conditional', title: '条件概率与独立性', lv: [1, 2], mao: '§1.4–1.5', huang: '概率基础', pre: ['probability/events'] },
      { slug: 'random-variables', title: '随机变量及其数字特征', lv: [1, 2], mao: '§2.1–2.3', huang: '概率分布', pre: ['probability/conditional'] },
      { slug: 'distributions', title: '常用分布', lv: [1, 2], mao: '§2.4–2.5', huang: '概率分布', pre: ['probability/random-variables'] },
      { slug: 'transformations', title: '随机变量函数的分布', lv: [2, 2], mao: '§2.6–2.7', huang: '', pre: ['probability/distributions'] },
      { slug: 'multivariate', title: '多维随机变量', lv: [2, 2], mao: '§3.1–3.3', huang: '', pre: ['probability/transformations'] },
      { slug: 'dependence', title: '协方差、相关与条件期望', lv: [2, 3], mao: '§3.4–3.5', huang: '', pre: ['probability/multivariate'] },
      { slug: 'limit-theorems', title: '大数定律与中心极限定理', lv: [1, 3], mao: '第 4 章', huang: '抽样分布', pre: ['probability/distributions'] },
    ],
  },
  {
    dir: 'inference', title: '三、数理统计', chapters: [
      { slug: 'sampling', title: '统计量与抽样分布', lv: [1, 3], mao: '§5.1, §5.3–5.5', huang: '抽样分布', pre: ['probability/limit-theorems'] },
      { slug: 'point-estimation', title: '点估计', lv: [1, 3], mao: '§6.1–6.4', huang: '参数估计', pre: ['inference/sampling'] },
      { slug: 'bayesian', title: '贝叶斯估计', lv: [2, 3], mao: '§6.5', huang: '', pre: ['inference/point-estimation'] },
      { slug: 'interval', title: '区间估计', lv: [1, 2], mao: '§6.6', huang: '参数估计', pre: ['inference/sampling'] },
      { slug: 'testing', title: '假设检验', lv: [1, 2], mao: '§7.1–7.3', huang: '假设检验', pre: ['inference/interval'] },
      { slug: 'lrt-nonparam', title: '似然比检验与非参数检验', lv: [2, 3], mao: '§7.4–7.6', huang: '', pre: ['inference/testing'] },
      { slug: 'anova', title: '方差分析', lv: [1, 2], mao: '§8.1–8.3', huang: '方差分析', pre: ['inference/testing'] },
      { slug: 'regression', title: '相关与回归分析', lv: [1, 3], mao: '§8.4–8.5', huang: '相关与回归分析', pre: ['inference/anova', 'probability/dependence'] },
    ],
  },
  {
    dir: 'applied', title: '四、应用统计', chapters: [
      { slug: 'index-numbers', title: '统计指数', lv: [1, 2], mao: '', huang: '统计指数', pre: ['descriptive/measures'] },
    ],
  },
  {
    dir: 'time-series', title: '五、时间序列分析', chapters: [
      { slug: 'basics', title: '水平分析与速度分析', lv: [1, 2], mao: '', huang: '时间序列分析', pre: ['descriptive/measures'] },
      { slug: 'decomposition', title: '趋势、季节与分解', lv: [1, 2], mao: '', huang: '时间序列分析', pre: ['time-series/basics'] },
      { slug: 'smoothing', title: '指数平滑与预测评价', lv: [2, 3], mao: '', huang: '时间序列分析（加深）', pre: ['time-series/decomposition'] },
      { slug: 'stationarity', title: '平稳性与自相关', lv: [2, 3], mao: '', huang: '时间序列分析（加深）', pre: ['time-series/decomposition', 'probability/dependence'] },
      { slug: 'arma', title: 'ARMA 模型', lv: [2, 3], mao: '', huang: '时间序列分析（加深）', pre: ['time-series/stationarity'] },
      { slug: 'box-jenkins', title: 'Box–Jenkins 建模与预测', lv: [2, 3], mao: '', huang: '时间序列分析（加深）', pre: ['time-series/arma', 'inference/point-estimation'] },
      { slug: 'unit-root', title: 'ARIMA 与单位根', lv: [3, 3], mao: '', huang: '时间序列分析（加深）', pre: ['time-series/box-jenkins', 'inference/testing'] },
      { slug: 'topics', title: '拓展：谱、GARCH、协整与卡尔曼', lv: [3, 3], mao: '', huang: '时间序列分析（加深）', pre: ['time-series/unit-root'] },
    ],
  },
  {
    dir: 'appendix', title: '附录', chapters: [
      { slug: 'formulas', title: '公式与符号速查', lv: [1, 3], mao: '', huang: '', pre: [] },
      { slug: 'calculator', title: '统计表计算器', lv: [1, 1], mao: '附表', huang: '附表', pre: [] },
    ],
  },
]

// 学习路线：按顺序列出章节
export const routes = [
  {
    id: 'econ', name: '经管路线', short: '经管', desc: '以黄书为主线：概念、直观与应用，L1 为主，适合经济管理类专业。',
    chapters: [
      'descriptive/intro', 'descriptive/collection', 'descriptive/organization', 'descriptive/measures',
      'probability/events', 'probability/conditional', 'probability/random-variables', 'probability/distributions', 'probability/limit-theorems',
      'inference/sampling', 'inference/interval', 'inference/testing', 'inference/anova', 'inference/regression',
      'applied/index-numbers', 'time-series/basics', 'time-series/decomposition', 'time-series/smoothing',
    ],
  },
  {
    id: 'math', name: '数学路线', short: '数学', desc: '以茆书为主线：完整的概率论与数理统计，L2 为主，适合数学、统计类专业。',
    chapters: [
      'descriptive/organization', 'descriptive/measures',
      'probability/events', 'probability/conditional', 'probability/random-variables', 'probability/distributions',
      'probability/transformations', 'probability/multivariate', 'probability/dependence', 'probability/limit-theorems',
      'inference/sampling', 'inference/point-estimation', 'inference/bayesian', 'inference/interval',
      'inference/testing', 'inference/lrt-nonparam', 'inference/anova', 'inference/regression',
    ],
  },
  {
    id: 'ts', name: '时间序列专精', short: '时序', desc: '从黄书的水平、速度与分解方法出发，一直走到 ARIMA、单位根、GARCH 与卡尔曼滤波。',
    chapters: [
      'descriptive/measures', 'probability/random-variables', 'probability/dependence', 'probability/limit-theorems',
      'inference/point-estimation', 'inference/testing', 'inference/regression',
      'time-series/basics', 'time-series/decomposition', 'time-series/smoothing', 'time-series/stationarity',
      'time-series/arma', 'time-series/box-jenkins', 'time-series/unit-root', 'time-series/topics',
    ],
  },
]
