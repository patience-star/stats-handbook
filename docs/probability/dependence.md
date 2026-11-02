# 协方差、相关与条件期望

19 世纪 80 年代，高尔顿收集了近千对父子的身高。他发现：高个子父亲的儿子往往也高，但平均来说没有父亲那么高；矮个子父亲的儿子往往也矮，但平均来说没有父亲那么矮。下一代的身高似乎在向平均值“回归”。

怎样度量两个变量“一起变化”的程度？知道一个变量的值之后，另一个变量的最佳预测是什么？这一章的三个概念——**协方差**、**相关系数**、**条件期望**——回答了这两个问题，也正是回归分析的源头。

## 和的期望与方差

::: core 期望与方差的运算性质
1. $E(X+Y)=E(X)+E(Y)$，**无论是否独立**都成立；
2. 若 $X$ 与 $Y$ 独立，则 $E(XY)=E(X)\,E(Y)$；
3. $\operatorname{Var}(X\pm Y)=\operatorname{Var}(X)+\operatorname{Var}(Y)\pm2\operatorname{Cov}(X,Y)$；若 $X$ 与 $Y$ 独立，则 $\operatorname{Var}(X\pm Y)=\operatorname{Var}(X)+\operatorname{Var}(Y)$。
:::

第 3 条中的交叉项 $\operatorname{Cov}(X,Y)=E\big[(X-EX)(Y-EY)\big]$ 来自展开平方，它就是本章的主角。注意 $\operatorname{Var}(X-Y)$ 中方差也是 **相加** 的：两个独立的误差相减，不会互相抵消，而是让不确定性变大。

## 协方差 {.core}

::: core 定义（协方差）
$$\operatorname{Cov}(X,Y)=E\big[(X-EX)(Y-EY)\big]=E(XY)-E(X)E(Y).$$
$\operatorname{Cov}(X,Y)>0$ 称 $X$ 与 $Y$ 正相关，$<0$ 称负相关，$=0$ 称不相关。
:::

::: geo 几何直观：带符号的矩形面积
以均值点 $(EX,EY)$ 为一个顶点、以 $(X,Y)$ 为对角顶点画一个矩形，它的面积是 $|X-EX|\cdot|Y-EY|$。如果点落在均值点的右上方或左下方，乘积 $(X-EX)(Y-EY)$ 为正；落在左上方或右下方则为负。**协方差就是这些带符号面积的平均值**：点大多分布在一、三象限，正面积占优，协方差为正；大多在二、四象限，协方差为负；四个象限势均力敌，协方差接近 0。
:::

<CovRectangles />

**试一试**

1. 把相关程度调到 0.9，再调到 −0.9，各生成几次：红蓝面积的对比怎样变化？
2. 把一个点拖到远离中心的右上角，协方差变化很大：协方差对 **离群点** 很敏感。
3. 把所有点拖成一条水平线，协方差是多少？

::: core 协方差的性质
1. $\operatorname{Cov}(X,X)=\operatorname{Var}(X)$；$\operatorname{Cov}(X,Y)=\operatorname{Cov}(Y,X)$；
2. $\operatorname{Cov}(aX+b,\ cY+d)=ac\operatorname{Cov}(X,Y)$；
3. $\operatorname{Cov}(X_1+X_2,\ Y)=\operatorname{Cov}(X_1,Y)+\operatorname{Cov}(X_2,Y)$（双线性）；
4. 若 $X$ 与 $Y$ 独立，则 $\operatorname{Cov}(X,Y)=0$。
:::

::: example 例 1　不放回摸球的协方差
沿用“[多维随机变量](/probability/multivariate)”一章例 1：袋中 2 红 3 白，不放回摸两次，$X,Y$ 为两次摸到的红球数。$E(X)=E(Y)=0.4$，$E(XY)=P(X=1,Y=1)=0.1$，所以
$$\operatorname{Cov}(X,Y)=0.1-0.4\times0.4=-0.06.$$
负相关：第一次摸到红球，会让第二次摸到红球的可能变小。顺便验证方差公式：$\operatorname{Var}(X+Y)=0.24+0.24-2\times0.06=0.36$，与直接由 $X+Y$ 的分布列计算的结果一致。
:::

## 相关系数 {.core}

协方差的大小依赖于单位：身高用厘米还是米，协方差相差一万倍。除以两个标准差，就得到无量纲的相关系数。

::: core 定义（相关系数）
$$\operatorname{Corr}(X,Y)=\rho=\frac{\operatorname{Cov}(X,Y)}{\sigma(X)\,\sigma(Y)}.$$
它满足 $|\rho|\le1$，且 $|\rho|=1$ 当且仅当存在常数 $a\neq0,b$ 使 $P(Y=aX+b)=1$。
:::

::: proof 证明（$|\rho|\le1$）
记标准化变量 $X^*=(X-EX)/\sigma(X)$，$Y^*=(Y-EY)/\sigma(Y)$，则 $\operatorname{Cov}(X^*,Y^*)=\rho$。由方差非负，
$$0\le\operatorname{Var}(X^*\pm Y^*)=1+1\pm2\rho=2(1\pm\rho),$$
所以 $-1\le\rho\le1$。$\rho=1$ 时 $\operatorname{Var}(X^*-Y^*)=0$，即 $X^*-Y^*$ 几乎必然为常数 0，$Y$ 是 $X$ 的增函数式线性函数；$\rho=-1$ 同理。
:::

::: geo 几何直观：相关系数是夹角的余弦
把（中心化的）随机变量看成向量，内积取协方差 $\langle X,Y\rangle=\operatorname{Cov}(X,Y)$，长度取标准差 $\|X\|=\sigma(X)$。那么
$$\rho=\frac{\langle X,Y\rangle}{\|X\|\,\|Y\|}=\cos\theta,$$
正是两个向量 **夹角的余弦**。$|\rho|\le1$ 就是柯西–施瓦茨不等式；$\rho=\pm1$ 意味着两个向量共线；$\rho=0$ 意味着 **正交**。对样本数据也一样：把 $n$ 个观测值看成 $n$ 维空间的向量，中心化后，样本相关系数就是两个数据向量夹角的余弦。这个几何图像会在“[相关与回归分析](/inference/regression)”一章再次出现。
:::

::: pitfall 不相关不等于独立
独立 ⟹ 不相关，但反过来不成立。相关系数只度量 **线性** 关系。例如 $X\sim N(0,1)$，$Y=X^2$，$Y$ 完全由 $X$ 决定，但
$$\operatorname{Cov}(X,X^2)=E(X^3)-E(X)E(X^2)=0.$$
上一章实验中圆盘上的均匀分布也是如此：不相关，却不独立。只有在二维正态分布这样的特殊情形下，不相关才等价于独立。
:::

::: quiz
设 $\operatorname{Var}(X)=4$，$\operatorname{Var}(Y)=9$，$\rho=0.5$，则 $\operatorname{Var}(X-Y)=$
- [ ] $-5$
- [x] $7$
- [ ] $13$
- [ ] $19$

> $\operatorname{Cov}(X,Y)=\rho\sigma_X\sigma_Y=3$，$\operatorname{Var}(X-Y)=4+9-2\times3=7$。$-5$ 是把方差相减了；$13$ 忽略了协方差；$19$ 是 $\operatorname{Var}(X+Y)$。
:::

## 二维正态分布 {.key}

::: core 二维正态分布
$(X,Y)\sim N(\mu_1,\mu_2,\sigma_1^2,\sigma_2^2,\rho)$ 的联合密度为
$$p(x,y)=\frac{1}{2\pi\sigma_1\sigma_2\sqrt{1-\rho^2}}\exp\Big\{-\frac{1}{2(1-\rho^2)}\Big[\frac{(x-\mu_1)^2}{\sigma_1^2}-2\rho\frac{(x-\mu_1)(y-\mu_2)}{\sigma_1\sigma_2}+\frac{(y-\mu_2)^2}{\sigma_2^2}\Big]\Big\}.$$
它的两个边际分布分别是 $N(\mu_1,\sigma_1^2)$ 与 $N(\mu_2,\sigma_2^2)$，$\rho$ 正是 $X$ 与 $Y$ 的相关系数；对二维正态，**$\rho=0$ ⟺ $X$ 与 $Y$ 独立**。
:::

联合密度的等高线是一族同心椭圆。$\rho=0$ 且 $\sigma_1=\sigma_2$ 时是圆；$\rho$ 越接近 $\pm1$，椭圆越扁，最后退化为一条直线。

## 条件分布 {.core}

::: core 条件分布
- 离散：$P(Y=y_j\mid X=x_i)=\dfrac{p_{ij}}{P(X=x_i)}$；
- 连续：给定 $X=x$（$p_X(x)>0$）时 $Y$ 的条件密度为 $p(y\mid x)=\dfrac{p(x,y)}{p_X(x)}$。
:::

::: geo 几何直观：切一刀，再归一化
条件密度就是在 $x$ 处沿竖直方向 **切一刀**，得到联合密度曲面的一个截面，再把截面的面积调整为 1。这和“[条件概率与独立性](/probability/conditional)”一章的做法完全一样：**缩小到已知发生的部分，再重新归一化**。

对二维正态，切出来的截面仍是钟形：
$$Y\mid X=x\ \sim\ N\Big(\mu_2+\rho\frac{\sigma_2}{\sigma_1}(x-\mu_1),\ \ \sigma_2^2(1-\rho^2)\Big).$$
条件均值随 $x$ 线性变化，条件方差则与 $x$ 无关，比无条件方差小了 $\rho^2$ 的比例。
:::

<BivariateNormal />

**试一试**

1. 拖动切片位置 $x_0$：右图的条件密度（红）左右移动，形状不变；它比边际密度（虚线）窄多少？
2. 把 $\rho$ 调到 0.95，条件密度变得很窄：知道 $x$ 后，对 $y$ 的不确定性大大减少。$\rho=0$ 时呢？
3. 比较橙色的回归线与灰色虚线的主轴：哪一条更平？勾选“显示 X 对 Y 的回归线”，为什么两条回归线不重合？

::: insight 回归效应
在标准化的单位下，回归线的斜率是 $\rho$，而椭圆主轴的斜率是 $\pm1$。只要 $|\rho|<1$，回归线就 **比主轴平**：$X$ 偏离均值 1 个标准差时，$Y$ 的条件均值只偏离 $\rho$ 个标准差。

这就是高尔顿看到的现象。设父亲身高 $X\sim N(170,6^2)$，儿子身高 $Y\sim N(172,6^2)$，$\rho=0.5$。父亲身高 182 cm（高出均值 2 个标准差）时，儿子身高的条件均值为
$$172+0.5\times(182-170)=178\ \text{cm},$$
只高出均值 1 个标准差。“回归”一词由此而来。它不是什么神秘的力量，只是 **不完全相关** 的必然结果：极端的父亲身高里有一部分来自偶然因素，这部分不会遗传。反过来看，儿子很高时，父亲身高的条件均值同样向平均值回归——这就是两条回归线不重合的原因。
:::

## 条件期望 {.core}

::: core 定义（条件期望）
条件分布的期望称为 **条件期望**：
$$E(Y\mid X=x)=\sum_jy_jP(Y=y_j\mid X=x)\quad\text{或}\quad\int y\,p(y\mid x)\,\mathrm dy.$$
它是 $x$ 的函数，记作 $m(x)$，称为 $Y$ 对 $X$ 的 **回归函数**。把 $x$ 换成随机变量 $X$，$E(Y\mid X)=m(X)$ 本身是一个随机变量。
:::

::: core 重期望公式
$$E\big[E(Y\mid X)\big]=E(Y).$$
离散形式为 $E(Y)=\sum_iE(Y\mid X=x_i)P(X=x_i)$，这是全概率公式的期望版本：**先分情况求条件均值，再按各情况的概率加权平均**。
:::

::: example 例 2　随机个数的随机变量之和
某商店一天的顾客数 $N\sim P(100)$，每位顾客的消费额 $X_i$ 相互独立，均值 50 元、标准差 20 元，且与 $N$ 独立。求一天营业额 $S=X_1+\cdots+X_N$ 的期望与方差。

**解** 给定 $N=n$ 时 $E(S\mid N=n)=50n$，所以 $E(S\mid N)=50N$，由重期望公式 $E(S)=50\,E(N)=5000$ 元。

方差用下面的“全方差公式”：$\operatorname{Var}(S)=E[\operatorname{Var}(S\mid N)]+\operatorname{Var}[E(S\mid N)]=E(400N)+\operatorname{Var}(50N)=40000+2500\times100=290000$，标准差约 539 元。顾客人数的波动贡献了绝大部分的不确定性。
:::

::: quiz 0.6
接着“[多维随机变量](/probability/multivariate)”一章练习 1 的分布列（$P(0,0)=0.1$，$P(0,1)=0.2$，$P(1,0)=0.3$，$P(1,1)=0.4$），先求 $E(Y\mid X=0)$ 与 $E(Y\mid X=1)$，再用重期望公式求 $E(Y)$。
> $E(Y\mid X=0)=0.2/0.3=2/3$，$E(Y\mid X=1)=0.4/0.7=4/7$。$E(Y)=0.3\times\frac23+0.7\times\frac47=0.2+0.4=0.6$，与直接计算 $P(Y=1)=0.6$ 一致。
:::

:::: l3 深入：条件期望是投影，全方差公式是勾股定理
在所有“只依赖 $X$ 的预测” $g(X)$ 中，均方误差 $E[Y-g(X)]^2$ 在 $g(X)=E(Y\mid X)$ 时最小：
$$E[Y-g(X)]^2=E[Y-m(X)]^2+E[m(X)-g(X)]^2\ \ge\ E[Y-m(X)]^2.$$
交叉项为 0，是因为预测误差 $Y-m(X)$ 与 **一切** $X$ 的函数都不相关（正交）。

用向量的语言说：所有形如 $g(X)$ 的随机变量构成一个子空间，$E(Y\mid X)$ 是 $Y$ 在这个子空间上的 **正交投影**，误差 $Y-E(Y\mid X)$ 垂直于这个子空间。于是有勾股定理
$$\underbrace{\operatorname{Var}(Y)}_{\text{斜边}^2}=\underbrace{\operatorname{Var}\big[E(Y\mid X)\big]}_{\text{投影}^2}+\underbrace{E\big[\operatorname{Var}(Y\mid X)\big]}_{\text{误差}^2},$$
这就是 **全方差公式**：总方差 = “能被 $X$ 解释的方差” + “解释不了的方差”。对二维正态，两部分分别是 $\rho^2\sigma_2^2$ 和 $(1-\rho^2)\sigma_2^2$——$\rho^2$ 正是回归分析中判定系数 $R^2$ 的总体版本。方差分析、回归分析中的平方和分解，都是这条勾股定理在样本上的体现。
::::

## 本章小结

- **协方差** 是带符号矩形面积的平均；它依赖单位，是双线性的。
- **相关系数** $\rho=\operatorname{Cov}/(\sigma_X\sigma_Y)$ 是向量夹角的余弦，$|\rho|\le1$，只度量线性关系；不相关不等于独立。
- **二维正态**：等高线是椭圆；边际正态；$\rho=0$ ⟺ 独立；条件分布仍是正态，条件均值线性、条件方差缩小为 $(1-\rho^2)$ 倍。
- **条件期望** 是回归函数，是均方意义下的最佳预测（投影）；重期望公式 $E[E(Y\mid X)]=E(Y)$；全方差公式是勾股定理。
- **回归效应**：$|\rho|<1$ 时回归线比主轴平。

| 公式 | 表达式 |
| --- | --- |
| 协方差 | $\operatorname{Cov}(X,Y)=E(XY)-E(X)E(Y)$ |
| 和的方差 | $\operatorname{Var}(X\pm Y)=\operatorname{Var}X+\operatorname{Var}Y\pm2\operatorname{Cov}(X,Y)$ |
| 相关系数 | $\rho=\operatorname{Cov}(X,Y)/(\sigma_X\sigma_Y)$，$\lvert\rho\rvert\le1$ |
| 二维正态的条件分布 | $N\big(\mu_2+\rho\frac{\sigma_2}{\sigma_1}(x-\mu_1),\ \sigma_2^2(1-\rho^2)\big)$ |
| 重期望公式 | $E[E(Y\mid X)]=E(Y)$ |
| 全方差公式 | $\operatorname{Var}Y=\operatorname{Var}[E(Y\mid X)]+E[\operatorname{Var}(Y\mid X)]$ |

## 分层练习

### 基础

**1.** 设 $\operatorname{Var}(X)=4$，$\operatorname{Var}(Y)=9$，$\rho_{XY}=0.5$。求 $\operatorname{Cov}(X,Y)$、$\operatorname{Var}(X+Y)$ 与 $\operatorname{Var}(2X-Y)$。

::: details 解答
$\operatorname{Cov}(X,Y)=0.5\times2\times3=3$；$\operatorname{Var}(X+Y)=4+9+6=19$；$\operatorname{Var}(2X-Y)=4\times4+9-2\times2\times3=13$。
:::

**2.** 对分布列 $P(0,0)=0.1$，$P(0,1)=0.2$，$P(1,0)=0.3$，$P(1,1)=0.4$，求 $\operatorname{Cov}(X,Y)$ 和 $\rho$。

::: details 解答
$E(X)=0.7$，$E(Y)=0.6$，$E(XY)=0.4$，$\operatorname{Cov}=0.4-0.42=-0.02$。$\operatorname{Var}(X)=0.21$，$\operatorname{Var}(Y)=0.24$，$\rho=-0.02/\sqrt{0.21\times0.24}\approx-0.089$，几乎不相关。
:::

**3.** 证明 $\operatorname{Corr}(aX+b,\ cY+d)=\operatorname{sign}(ac)\cdot\operatorname{Corr}(X,Y)$（$ac\neq0$）。

::: details 解答
分子 $\operatorname{Cov}(aX+b,cY+d)=ac\operatorname{Cov}(X,Y)$，分母 $\sigma(aX+b)\sigma(cY+d)=|a||c|\sigma_X\sigma_Y$，相除即得。相关系数不受单位和原点的影响，只可能因为把某个变量“反过来”而变号。
:::

**4.** 设 $X\sim U(-1,1)$，$Y=X^2$。求 $\operatorname{Cov}(X,Y)$，并说明 $X$ 与 $Y$ 是否独立。

::: details 解答
$\operatorname{Cov}(X,Y)=E(X^3)-E(X)E(X^2)=0-0=0$，不相关。但 $P(X>0.5,\ Y<0.25)=0$，而 $P(X>0.5)P(Y<0.25)=0.25\times0.5>0$，所以不独立。
:::

### 提高

**5.** 设 $(X,Y)$ 服从二维正态，$X$ 为父亲身高，$Y$ 为儿子身高，$\mu_1=170$，$\mu_2=172$，$\sigma_1=\sigma_2=6$，$\rho=0.5$。已知父亲身高 182 cm，求儿子身高在 180 cm 以上的条件概率。

::: details 解答
$Y\mid X=182\sim N(178,\ 36\times0.75)=N(178,27)$，标准差约 5.196。$P(Y>180\mid X=182)=1-\Phi\big(\frac{2}{5.196}\big)=1-\Phi(0.385)\approx0.35$。虽然父亲很高，儿子超过 180 cm 的可能也只有约 35%。
:::

**6.** 一位学生每天学习的时长 $N$（小时）服从 $P(3)$，每小时完成的习题数相互独立，均值为 4、方差为 2，且与 $N$ 独立。求一天完成习题数 $S$ 的期望与方差。

::: details 解答
$E(S)=E(N)\times4=12$。$\operatorname{Var}(S)=E(N)\times2+\operatorname{Var}(N)\times4^2=6+48=54$。
:::

**7.** 设 $X,Y$ 独立同分布，方差为 $\sigma^2$。求 $U=X+Y$ 与 $V=X-Y$ 的协方差。它们独立吗？

::: details 解答
$\operatorname{Cov}(U,V)=\operatorname{Var}(X)-\operatorname{Var}(Y)=0$，不相关。若 $X,Y$ 服从正态分布，$(U,V)$ 服从二维正态，于是 $U,V$ 独立；一般情况下不一定独立（例如 $X,Y$ 服从两点分布时，$U=2$ 蕴含 $V=0$）。“和与差独立”是正态分布的特征性质之一，它也是正态样本均值与样本方差独立的根源（见“[统计量与抽样分布](/inference/sampling)”一章）。
:::

### 挑战

**8.** 证明：在所有函数 $g$ 中，$E[Y-g(X)]^2$ 在 $g(x)=E(Y\mid X=x)$ 时最小。

::: details 解答
记 $m(X)=E(Y\mid X)$。
$$E[Y-g(X)]^2=E[Y-m(X)]^2+2E\{[Y-m(X)][m(X)-g(X)]\}+E[m(X)-g(X)]^2.$$
由重期望公式，交叉项 $=2E\big\{[m(X)-g(X)]\,E[Y-m(X)\mid X]\big\}=0$，因为 $E[Y-m(X)\mid X]=m(X)-m(X)=0$。于是 $E[Y-g(X)]^2\ge E[Y-m(X)]^2$，等号当且仅当 $g(X)=m(X)$ 几乎必然成立。
:::

**9.** 证明全方差公式 $\operatorname{Var}(Y)=E[\operatorname{Var}(Y\mid X)]+\operatorname{Var}[E(Y\mid X)]$，并说明二维正态时两项各是什么。

::: details 解答
$E[\operatorname{Var}(Y\mid X)]=E[E(Y^2\mid X)]-E\{[E(Y\mid X)]^2\}=E(Y^2)-E[m(X)^2]$；$\operatorname{Var}[m(X)]=E[m(X)^2]-[E(Y)]^2$。两式相加得 $E(Y^2)-[E(Y)]^2=\operatorname{Var}(Y)$。

二维正态时，$m(X)=\mu_2+\rho\frac{\sigma_2}{\sigma_1}(X-\mu_1)$，$\operatorname{Var}[m(X)]=\rho^2\sigma_2^2$；$\operatorname{Var}(Y\mid X)=\sigma_2^2(1-\rho^2)$ 为常数。两项之和恰为 $\sigma_2^2$，$\rho^2$ 是 $Y$ 的方差中能被 $X$ 线性解释的比例。
:::

## 代码实现（Python）

::: details 展开代码：协方差、相关系数、二维正态与随机和
```python
import numpy as np

rng = np.random.default_rng(11)
n = 200_000

# 1. 二维正态：父子身高
mean = [170, 172]
cov = [[36, 18], [18, 36]]                     # Cov = ρσ1σ2 = 0.5*6*6
X, Y = rng.multivariate_normal(mean, cov, n).T
print("样本协方差矩阵：\n", np.cov(X, Y).round(2))
print("样本相关系数：", np.corrcoef(X, Y)[0, 1].round(3))

# 2. 条件均值：父亲身高在 182 附近的儿子平均身高（理论 178）
near = np.abs(X - 182) < 0.5
print("父亲约 182 cm 时，儿子平均身高：", Y[near].mean().round(2))

# 3. 不相关但不独立：Y = X^2
Z = rng.standard_normal(n)
print("Corr(Z, Z^2) =", np.corrcoef(Z, Z**2)[0, 1].round(4))

# 4. 随机和：N ~ P(100)，每人消费均值 50、标准差 20（用正态近似生成）
N = rng.poisson(100, 20_000)
S = np.array([rng.normal(50, 20, k).sum() for k in N])
print("营业额均值", S.mean().round(0), "（理论 5000），标准差", S.std().round(0), "（理论约 539）")
```
:::

::: info 史话：高尔顿、皮尔逊与“回归”
1886 年，高尔顿发表《遗传身高向平均的回归》，用父子身高数据描述了回归效应，并画出了等高线为椭圆的二维频数分布。他的学生皮尔逊在 1896 年给出了今天通用的相关系数公式（因此也叫皮尔逊相关系数），后来又与费希尔等人一起，把相关与回归发展成现代统计学的核心工具。“回归”这个词后来泛指一切“由 $X$ 预测 $Y$”的模型，早已不再有“回到平均”的原意。
:::

## 延伸阅读

- 茆诗松等《概率论与数理统计教程》（第三版）§3.4 多维随机变量的特征数、§3.5 条件分布与条件期望。
- D. Freedman, R. Pisani, R. Purves.《统计学》（第 4 版）第 8–10 章：对相关与回归效应的直观讲解极为出色。
- S. M. Stigler. *The History of Statistics*：高尔顿与皮尔逊的工作。
