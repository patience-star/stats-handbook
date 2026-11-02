# 相关与回归分析

广告费增加，销售额会增加多少？父母的身高与子女的身高有什么关系？收入水平怎样影响消费支出？这类问题研究的是变量之间的 **统计关系**：它不像“正方形面积 = 边长²”那样确定，一个变量取定后，另一个变量仍有随机波动；但两者之间又存在着明显的规律。

**相关分析** 度量这种关系的强弱和方向；**回归分析** 进一步用一个方程描述它，并据此作预测和推断。这一章是本讲义数理统计部分的收官，用到了前面几乎所有的工具：最小二乘、$t$ 检验、$F$ 检验、方差分解，以及贯穿始终的几何图像——**投影**。

## 相关关系与相关系数 {.core}

::: core 样本相关系数
设有 $n$ 对观测 $(x_i,y_i)$，记
$$l_{xx}=\sum(x_i-\bar x)^2,\quad l_{yy}=\sum(y_i-\bar y)^2,\quad l_{xy}=\sum(x_i-\bar x)(y_i-\bar y),$$
**样本相关系数** 为
$$r=\frac{l_{xy}}{\sqrt{l_{xx}\,l_{yy}}}.$$
$|r|\le1$；$r>0$ 为正相关，$r<0$ 为负相关；$|r|$ 越接近 1，散点越接近一条直线。
:::

::: geo 几何直观：中心化数据向量的夹角
把 $n$ 个观测看成 $\mathbb R^n$ 中的两个向量，减去各自的均值得到 $\tilde{\boldsymbol x}=(x_i-\bar x)$ 与 $\tilde{\boldsymbol y}=(y_i-\bar y)$。那么
$$r=\frac{\tilde{\boldsymbol x}\cdot\tilde{\boldsymbol y}}{\|\tilde{\boldsymbol x}\|\,\|\tilde{\boldsymbol y}\|}=\cos\theta,$$
正是两个向量 **夹角的余弦**——“[协方差、相关与条件期望](/probability/dependence)”一章总体相关系数的几何图像，在样本上原样重现。
:::

::: core 相关系数的显著性检验
总体为二维正态时，检验 $H_0:\rho=0$ 的统计量为
$$t=\frac{r\sqrt{n-2}}{\sqrt{1-r^2}}\sim t(n-2).$$
样本量很小时，即使 $r$ 看起来不小，也可能只是偶然；样本量很大时，很小的 $r$ 也会显著——显著不代表相关性强。
:::

::: pitfall 相关系数的三个陷阱
1. **只度量线性关系**：$y=x^2$（$x$ 关于 0 对称）时 $r=0$，但二者有确定的函数关系。一定要先画散点图。
2. **受离群值影响很大**：一个远离其他数据的点就可以造出或抹掉相关性（下面的实验中可以试试）。
3. **相关不等于因果**：见“[统计学与数据](/descriptive/intro)”一章。
:::

## 一元线性回归模型 {.core}

::: core 一元线性回归模型
$$y_i=\beta_0+\beta_1x_i+\varepsilon_i,\qquad\varepsilon_i\stackrel{\text{iid}}{\sim}N(0,\sigma^2),\qquad i=1,\dots,n.$$
$x$ 称为自变量（解释变量），$y$ 称为因变量（被解释变量）；$\beta_0+\beta_1x=E(y\mid x)$ 是 **回归函数**，$\beta_1$ 表示 $x$ 每增加一个单位，$y$ 平均增加的量。
:::

## 最小二乘估计 {.hard}

::: core 最小二乘估计
使残差平方和
$$Q(\beta_0,\beta_1)=\sum_{i=1}^n(y_i-\beta_0-\beta_1x_i)^2$$
达到最小的 $\hat\beta_0,\hat\beta_1$ 称为 **最小二乘估计**。令偏导数为 0 得 **正规方程**，解得
$$\hat\beta_1=\frac{l_{xy}}{l_{xx}},\qquad\hat\beta_0=\bar y-\hat\beta_1\bar x.$$
回归直线一定通过点 $(\bar x,\bar y)$。在正态假定下，最小二乘估计也就是最大似然估计。
:::

::: geo 几何直观：残差正方形
“残差平方和”可以字面理解：每个数据点到直线的竖直距离是残差 $e_i$，以它为边画一个正方形，面积就是 $e_i^2$。最小二乘直线是使 **这些正方形的总面积最小** 的那条直线。下面的实验里，你可以自己调一条直线，看看能否让红色正方形的总面积比最小二乘直线更小。
:::

<LeastSquaresLab />

**试一试**

1. 用滑块调一条你认为最好的直线，残差平方和是多少？再点“显示最小二乘直线”比较。
2. 把最右边的点向下拖很远：直线被拽着转了多少？再把中间某个点拖同样的距离，比较影响的大小。
3. 打开置信带与预测带：两条带为什么在 $\bar x$ 附近最窄、向两端张开？预测带为什么总比置信带宽？

::: example 例 1　广告费与销售额
某公司 10 个销售区的广告费 $x$（万元）与销售额 $y$（十万元）如下：

| $x$ | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| $y$ | 12 | 16 | 16 | 22 | 20 | 27 | 25 | 31 | 30 | 37 |

**解** $\bar x=5.5$，$\bar y=23.6$，$l_{xx}=82.5$，$l_{xy}=207$，$l_{yy}=554.4$。
$$\hat\beta_1=\frac{207}{82.5}\approx2.509,\qquad\hat\beta_0=23.6-2.509\times5.5=9.8,$$
回归方程为 $\hat y=9.8+2.509x$：广告费每增加 1 万元，销售额平均增加约 2.51 个单位。相关系数 $r=\frac{207}{\sqrt{82.5\times554.4}}\approx0.968$。
:::

:::: l2 进阶：最小二乘估计的性质
在模型假定下：
- $\hat\beta_1\sim N\big(\beta_1,\ \frac{\sigma^2}{l_{xx}}\big)$，$\hat\beta_0\sim N\big(\beta_0,\ (\frac1n+\frac{\bar x^2}{l_{xx}})\sigma^2\big)$，都是无偏的；
- **高斯–马尔可夫定理**：即使不假定正态，只要误差零均值、等方差、不相关，最小二乘估计在所有线性无偏估计中方差最小（BLUE）；
- $\hat\sigma^2=\frac{Q_e}{n-2}$ 是 $\sigma^2$ 的无偏估计，$\frac{Q_e}{\sigma^2}\sim\chi^2(n-2)$，且与 $\hat\beta_0,\hat\beta_1$ 独立。

$\operatorname{Var}(\hat\beta_1)=\sigma^2/l_{xx}$ 说明：$x$ 的取值越分散，斜率估计越精确——就像用一根杠杆的两端定方向比用中间两点更准。设计试验时，应让自变量的取值尽量分散。
::::

## 显著性检验 {.core}

回归方程算出来了，但 $x$ 与 $y$ 之间真的有线性关系吗？检验 $H_0:\beta_1=0$。

::: core 平方和分解与 $F$ 检验
$$\underbrace{\sum(y_i-\bar y)^2}_{S_T}=\underbrace{\sum(\hat y_i-\bar y)^2}_{S_R\ \text{回归平方和}}+\underbrace{\sum(y_i-\hat y_i)^2}_{S_e\ \text{残差平方和}},$$
自由度 $n-1=1+(n-2)$。$H_0$ 下
$$F=\frac{S_R/1}{S_e/(n-2)}\sim F(1,n-2).$$
等价地，用 $t=\dfrac{\hat\beta_1}{\hat\sigma/\sqrt{l_{xx}}}\sim t(n-2)$，且 $t^2=F$。
:::

::: example 例 2　回归方程的检验
例 1 中 $S_R=\hat\beta_1l_{xy}\approx519.38$，$S_e=554.4-519.38\approx35.02$，$\hat\sigma=\sqrt{35.02/8}\approx2.09$。

| 来源 | 平方和 | 自由度 | 均方 | $F$ |
| --- | --- | --- | --- | --- |
| 回归 | 519.38 | 1 | 519.38 | 118.65 |
| 残差 | 35.02 | 8 | 4.38 | |
| 总和 | 554.40 | 9 | | |

$F=118.65\gg F_{0.95}(1,8)=5.32$，回归关系极显著。也可以算 $t=\frac{2.509}{2.09/\sqrt{82.5}}\approx10.89$，$t^2\approx118.65$。
:::

## 判定系数 {.key}

::: core 判定系数
$$R^2=\frac{S_R}{S_T}=1-\frac{S_e}{S_T},$$
表示 $y$ 的总波动中能被 $x$ 的线性关系解释的比例。一元线性回归中 $R^2=r^2$。例 1 中 $R^2\approx0.937$：销售额的波动约 94% 可以由广告费解释。
:::

::: geo 几何直观：$R^2$ 是夹角余弦的平方
平方和分解同样是勾股定理：中心化的观测向量 $\boldsymbol y-\bar y\boldsymbol 1$ 是斜边，拟合部分 $\hat{\boldsymbol y}-\bar y\boldsymbol 1$ 与残差 $\boldsymbol e$ 是两条直角边。于是
$$R^2=\frac{\|\hat{\boldsymbol y}-\bar y\boldsymbol 1\|^2}{\|\boldsymbol y-\bar y\boldsymbol 1\|^2}=\cos^2\theta,$$
$\theta$ 是观测向量与拟合向量之间的夹角。数据向量越贴近模型能“到达”的方向，$R^2$ 越大。
:::

## 回归的几何：投影 {.hard}

::: core 正规方程就是正交条件
正规方程 $\sum e_i=0$、$\sum x_ie_i=0$ 可以写成
$$\boldsymbol e\perp\boldsymbol 1,\qquad\boldsymbol e\perp\boldsymbol x.$$
残差向量与 $\boldsymbol 1$、$\boldsymbol x$ 都垂直，因而垂直于它们张成的平面（**列空间**）。所以拟合值向量 $\hat{\boldsymbol y}=\hat\beta_0\boldsymbol 1+\hat\beta_1\boldsymbol x$ 就是 $\boldsymbol y$ 在列空间上的 **正交投影**——列空间中离 $\boldsymbol y$ 最近的点。“残差平方和最小”与“残差垂直于平面”说的是同一件事：点到平面的最短距离是垂线段。
:::

<RegressionGeometry3D />

**试一试**

1. 拖动 $y_1,y_2,y_3$：残差（红）是否总垂直于绿色平面？读数中的 $\boldsymbol e\cdot\boldsymbol 1$、$\boldsymbol e\cdot\boldsymbol x$ 是否总为 0？
2. 令 $y_1,y_2,y_3$ 恰好在一条直线上（例如 0、1、2）：$\boldsymbol y$ 落在平面内，残差为 0，$R^2=1$。
3. 令 $y_1=y_3$：拟合的斜率为 0，$\hat{\boldsymbol y}$ 落在 $\boldsymbol 1$ 方向上，$R^2=0$。

::: insight 统一的图像
“[统计量与抽样分布](/inference/sampling)”一章：样本均值是 $\boldsymbol y$ 在 $\boldsymbol 1$ 方向上的投影；“[方差分析](/inference/anova)”一章：组均值是 $\boldsymbol y$ 在“同组分量相同”的子空间上的投影；这一章：回归拟合值是 $\boldsymbol y$ 在 $\{\boldsymbol 1,\boldsymbol x\}$ 张成的子空间上的投影；“[协方差、相关与条件期望](/probability/dependence)”一章：条件期望是 $Y$ 在“$X$ 的函数”这个子空间上的投影。**估计就是投影，平方和分解就是勾股定理，自由度就是子空间的维数**——这是线性统计模型最核心的几何图像。
:::

## 预测与控制 {.key}

::: core 预测区间与置信区间
对给定的 $x_0$，点预测为 $\hat y_0=\hat\beta_0+\hat\beta_1x_0$。

- **均值 $E(y_0)$ 的置信区间**：$\hat y_0\pm t_{1-\alpha/2}(n-2)\,\hat\sigma\sqrt{\dfrac1n+\dfrac{(x_0-\bar x)^2}{l_{xx}}}$；
- **个别值 $y_0$ 的预测区间**：$\hat y_0\pm t_{1-\alpha/2}(n-2)\,\hat\sigma\sqrt{1+\dfrac1n+\dfrac{(x_0-\bar x)^2}{l_{xx}}}$。

预测区间多出的“1”来自个别值本身的随机误差 $\varepsilon_0$：即使回归直线完全准确，单个观测也会围绕它波动。
:::

::: example 例 3　预测下一个销售区
例 1 中若某区计划投入广告费 12 万元，求销售额的 95% 预测区间。

**解** $\hat y_0=9.8+2.509\times12\approx39.91$。$\sqrt{1+\frac1{10}+\frac{(12-5.5)^2}{82.5}}\approx1.270$，$t_{0.975}(8)=2.306$，预测区间为
$$39.91\pm2.306\times2.09\times1.270\approx39.91\pm6.13=[33.78,\ 46.03].$$
平均销售额的置信区间则窄得多：$[36.13,\ 43.68]$。注意 $x_0=12$ 已经超出了观测数据的范围，这种 **外推** 依赖于“线性关系在数据范围之外依然成立”的假定，要格外谨慎。
:::

::: quiz 0.9368 0.002
例 1 的判定系数 $R^2$ 是多少？（保留四位小数）
> $R^2=S_R/S_T\approx519.38/554.4\approx0.9368$，等于相关系数 0.968 的平方。
:::

## 可线性化的非线性回归 {.key}

有些非线性关系经过变换可以化为线性：

| 曲线 | 变换 | 线性形式 |
| --- | --- | --- |
| 指数 $y=ae^{bx}$ | $y'=\ln y$ | $y'=\ln a+bx$ |
| 幂函数 $y=ax^b$ | $y'=\ln y$，$x'=\ln x$ | $y'=\ln a+bx'$ |
| 双曲线 $\frac1y=a+\frac bx$ | $y'=\frac1y$，$x'=\frac1x$ | $y'=a+bx'$ |
| 对数 $y=a+b\ln x$ | $x'=\ln x$ | $y=a+bx'$ |

::: example 例 4　指数增长
某产品上市后 6 个月的月销量（千件）为 2.9、4.1、5.9、8.2、11.8、16.6。对 $\ln y$ 关于月份 $x$ 作线性回归，得 $\ln\hat y\approx0.716+0.349x$，即
$$\hat y\approx2.05\,e^{0.349x}.$$
月增长率约为 $e^{0.349}-1\approx42\%$。注意：对数变换后的最小二乘，最小化的是 **相对误差** 的平方和，而不是原始尺度上的残差平方和；变换后的误差假定（正态、等方差）也需要重新检查。
:::

## 多元线性回归 {.l3}

:::: l3 深入：矩阵形式与帽子矩阵
有 $p$ 个自变量时，模型写成矩阵形式 $\boldsymbol y=X\boldsymbol\beta+\boldsymbol\varepsilon$，其中 $X$ 是 $n\times(p+1)$ 的设计矩阵（第一列全为 1）。最小二乘估计为
$$\hat{\boldsymbol\beta}=(X^\top X)^{-1}X^\top\boldsymbol y,\qquad\hat{\boldsymbol y}=X\hat{\boldsymbol\beta}=H\boldsymbol y,\qquad H=X(X^\top X)^{-1}X^\top.$$
$H$ 称为 **帽子矩阵**，它就是到列空间的 **正交投影矩阵**：$H^2=H$，$H^\top=H$。残差 $\boldsymbol e=(I-H)\boldsymbol y$ 是到列空间正交补的投影，自由度 $n-p-1$ 就是正交补的维数。$H$ 的对角元 $h_{ii}$ 称为第 $i$ 个观测的 **杠杆值**，它度量该观测在自变量空间中远离中心的程度——上面实验中拖动远端点影响巨大，正是因为它的杠杆值大。

多元回归中，每个系数表示 **在其他自变量保持不变时** 该变量的效应；自变量之间高度相关（**多重共线性**）时，单个系数的估计会很不稳定。
::::

## 本章小结

- **相关系数** $r=l_{xy}/\sqrt{l_{xx}l_{yy}}$ 是中心化数据向量夹角的余弦，只度量线性关系，对离群值敏感，不代表因果。
- **最小二乘**：$\hat\beta_1=l_{xy}/l_{xx}$，$\hat\beta_0=\bar y-\hat\beta_1\bar x$；最小化残差正方形的总面积。
- **检验**：$S_T=S_R+S_e$，$F=\frac{S_R}{S_e/(n-2)}$，$t^2=F$；$R^2=S_R/S_T=r^2=\cos^2\theta$。
- **几何**：拟合值是观测向量在列空间上的正交投影，正规方程就是正交条件。
- **预测**：预测区间比均值的置信区间多一个“1”，在 $\bar x$ 处最窄；外推要谨慎。
- 指数、幂函数等曲线可以通过变换化为线性回归。

| 量 | 公式 |
| --- | --- |
| 斜率与截距 | $\hat\beta_1=\frac{l_{xy}}{l_{xx}}$，$\hat\beta_0=\bar y-\hat\beta_1\bar x$ |
| 误差方差 | $\hat\sigma^2=\frac{S_e}{n-2}$ |
| 斜率的检验 | $t=\frac{\hat\beta_1}{\hat\sigma/\sqrt{l_{xx}}}\sim t(n-2)$ |
| 判定系数 | $R^2=\frac{S_R}{S_T}=r^2$ |
| 均值的置信区间 | $\hat y_0\pm t\,\hat\sigma\sqrt{\frac1n+\frac{(x_0-\bar x)^2}{l_{xx}}}$ |
| 预测区间 | $\hat y_0\pm t\,\hat\sigma\sqrt{1+\frac1n+\frac{(x_0-\bar x)^2}{l_{xx}}}$ |

## 分层练习

### 基础

**1.** 已知 $n=12$，$\bar x=10$，$\bar y=50$，$l_{xx}=40$，$l_{xy}=120$，$l_{yy}=500$。求回归方程、相关系数和判定系数。

::: details 解答
$\hat\beta_1=120/40=3$，$\hat\beta_0=50-3\times10=20$，$\hat y=20+3x$。$r=\frac{120}{\sqrt{40\times500}}\approx0.849$，$R^2\approx0.72$。
:::

**2.** 第 1 题中检验 $H_0:\beta_1=0$（$\alpha=0.05$）。

::: details 解答
$S_R=\hat\beta_1l_{xy}=360$，$S_e=500-360=140$，$\hat\sigma^2=140/10=14$。$F=360/14\approx25.7>F_{0.95}(1,10)=4.96$，拒绝 $H_0$。或 $t=\frac{3}{\sqrt{14/40}}\approx5.07$。
:::

**3.** 判断：(1) $r=0$ 说明 $x$ 与 $y$ 没有任何关系；(2) 回归直线一定通过 $(\bar x,\bar y)$；(3) $R^2$ 越大，因果关系越强。

::: details 解答
(1) 错，$r=0$ 只说明没有 **线性** 关系；(2) 对，由 $\hat\beta_0=\bar y-\hat\beta_1\bar x$ 立即可得；(3) 错，$R^2$ 只说明拟合程度，与因果无关。
:::

### 提高

**4.** 证明一元线性回归中 $R^2=r^2$。

::: details 解答
$S_R=\sum(\hat y_i-\bar y)^2=\hat\beta_1^2l_{xx}=\frac{l_{xy}^2}{l_{xx}}$，所以 $R^2=\frac{S_R}{l_{yy}}=\frac{l_{xy}^2}{l_{xx}l_{yy}}=r^2$。
:::

**5.** 证明预测区间在 $x_0=\bar x$ 时最窄，并说明为什么远离 $\bar x$ 时区间变宽。

::: details 解答
区间半宽中只有 $(x_0-\bar x)^2/l_{xx}$ 一项依赖于 $x_0$，在 $x_0=\bar x$ 时取最小值 0。几何上，回归直线绕 $(\bar x,\bar y)$ 这个“支点”摆动：截距的误差使直线上下平移，斜率的误差使它绕支点转动，离支点越远，转动带来的偏差越大。
:::

**6.** 某商品的需求量 $Q$ 与价格 $P$ 满足 $Q=aP^b$。怎样估计 $a$ 和 $b$？$b$ 有什么经济含义？

::: details 解答
取对数 $\ln Q=\ln a+b\ln P$，对 $(\ln P_i,\ln Q_i)$ 作线性回归，斜率即 $\hat b$，截距的指数即 $\hat a$。$b=\frac{\mathrm d\ln Q}{\mathrm d\ln P}$ 是 **需求的价格弹性**：价格上升 1%，需求量变化 $b\%$。
:::

### 挑战

**7.** 证明 $\hat\beta_1$ 是 $\beta_1$ 的无偏估计，并求其方差。

::: details 解答
$\hat\beta_1=\frac{\sum(x_i-\bar x)y_i}{l_{xx}}$（因为 $\sum(x_i-\bar x)\bar y=0$），是 $y_i$ 的线性组合。代入 $y_i=\beta_0+\beta_1x_i+\varepsilon_i$，利用 $\sum(x_i-\bar x)=0$，$\sum(x_i-\bar x)x_i=l_{xx}$，得
$$\hat\beta_1=\beta_1+\frac{\sum(x_i-\bar x)\varepsilon_i}{l_{xx}}.$$
所以 $E(\hat\beta_1)=\beta_1$，$\operatorname{Var}(\hat\beta_1)=\frac{\sum(x_i-\bar x)^2\sigma^2}{l_{xx}^2}=\frac{\sigma^2}{l_{xx}}$。
:::

**8.** 用 $y$ 对 $x$ 回归得斜率 $\hat\beta_{y|x}$，用 $x$ 对 $y$ 回归得斜率 $\hat\beta_{x|y}$。证明 $\hat\beta_{y|x}\cdot\hat\beta_{x|y}=r^2$，并解释为什么两条回归直线一般不重合。

::: details 解答
$\hat\beta_{y|x}=l_{xy}/l_{xx}$，$\hat\beta_{x|y}=l_{xy}/l_{yy}$，乘积为 $l_{xy}^2/(l_{xx}l_{yy})=r^2$。在 $(x,y)$ 平面上，第二条直线的斜率是 $1/\hat\beta_{x|y}=\hat\beta_{y|x}/r^2$，除非 $|r|=1$，它总比第一条更陡。两条直线最小化的是不同方向的残差（竖直方向与水平方向），也对应着“[协方差、相关与条件期望](/probability/dependence)”一章里的两条回归线：都比椭圆主轴“更靠近各自的坐标轴”，这正是回归效应。
:::

## 代码实现（Python）

::: details 展开代码：用 statsmodels 做回归分析
```python
import numpy as np
import statsmodels.api as sm

x = np.arange(1, 11, dtype=float)
y = np.array([12, 16, 16, 22, 20, 27, 25, 31, 30, 37], dtype=float)

# 1. 一元线性回归：系数、标准误、t 检验、R²、F 检验一应俱全
model = sm.OLS(y, sm.add_constant(x)).fit()
print(model.summary())

# 2. 在 x0 = 12 处：均值的置信区间与个别值的预测区间
pred = model.get_prediction(np.array([[1.0, 12.0]])).summary_frame(alpha=0.05)
print(pred[["mean", "mean_ci_lower", "mean_ci_upper", "obs_ci_lower", "obs_ci_upper"]].round(2))

# 3. 几何验证：残差与 1、x 都正交
e = model.resid
print("e·1 =", round(e.sum(), 10), " e·x =", round(e @ x, 10))

# 4. 可线性化的回归：指数增长
months = np.arange(1, 7, dtype=float)
sales = np.array([2.9, 4.1, 5.9, 8.2, 11.8, 16.6])
b, ln_a = np.polyfit(months, np.log(sales), 1)
print(f"y = {np.exp(ln_a):.3f} * exp({b:.3f} x)，月增长率约 {np.exp(b) - 1:.1%}")
```
:::

::: info 史话：最小二乘之争
1805 年，勒让德在一本研究彗星轨道的书的附录中发表了最小二乘法。1809 年，高斯在《天体运动论》中也给出了这一方法，并声称自己早在 1795 年就已使用，还把它与正态误差联系起来，为它提供了概率论的依据，由此引发了一场著名的优先权之争。“回归”一词则来自高尔顿 1886 年的身高研究（见“[协方差、相关与条件期望](/probability/dependence)”一章）。20 世纪初，尤尔和皮尔逊把最小二乘与相关分析结合起来，形成了今天的回归分析。
:::

## 延伸阅读

- 茆诗松等《概率论与数理统计教程》（第三版）§8.4 一元线性回归、§8.5 一元非线性回归。
- 黄良文《统计学》相关与回归分析。
- 何晓群、刘文卿《应用回归分析》：国内回归分析的常用教材。
- G. Strang.《线性代数及其应用》第 4 章：从投影的角度理解最小二乘。
