# 点估计

总体的分布形式通常是知道的（比如正态、泊松），但其中的 **参数** 未知：正态总体的均值和方差、泊松分布的强度、某种产品的次品率。用样本构造一个统计量去估计参数，称为 **点估计**；这个统计量称为 **估计量**，代入观测值后得到的具体数值称为 **估计值**。

同一个参数可以有许多种估计方法，得到不同的估计量。这一章回答两个问题：**怎样构造估计量**（矩估计、最大似然估计），**怎样评价估计量的好坏**（无偏性、有效性、相合性，以及能达到的最佳程度）。

## 无偏性 {.core}

::: core 定义（无偏估计）
设 $\hat\theta=\hat\theta(X_1,\dots,X_n)$ 是 $\theta$ 的估计量。若对参数的一切可能取值都有
$$E(\hat\theta)=\theta,$$
则称 $\hat\theta$ 是 $\theta$ 的 **无偏估计**；$E(\hat\theta)-\theta$ 称为 **偏差**。若 $n\to\infty$ 时偏差趋于 0，称为 **渐近无偏**。
:::

由“[统计量与抽样分布](/inference/sampling)”一章，样本均值 $\bar X$ 是总体均值的无偏估计，样本方差 $S^2$ 是总体方差的无偏估计，而 $S_n^2=\frac{n-1}nS^2$ 有偏（偏小），但渐近无偏。

::: pitfall 无偏性在变换下不保持
$S^2$ 是 $\sigma^2$ 的无偏估计，但 $S$ **不是** $\sigma$ 的无偏估计。由于开平方是凹函数，$E(S)\le\sqrt{E(S^2)}=\sigma$，$S$ 平均而言偏小。一般地，$\hat\theta$ 无偏不能推出 $g(\hat\theta)$ 是 $g(\theta)$ 的无偏估计，除非 $g$ 是线性函数。
:::

## 有效性与均方误差 {.core}

无偏只说明估计量“平均来说”没有偏离，并不保证它离真值近。两个无偏估计量中，方差较小的那个更好。

::: core 定义（有效性、均方误差）
- 设 $\hat\theta_1,\hat\theta_2$ 都是 $\theta$ 的无偏估计，若 $\operatorname{Var}(\hat\theta_1)\le\operatorname{Var}(\hat\theta_2)$ 对一切 $\theta$ 成立，且至少对某个 $\theta$ 严格成立，则称 $\hat\theta_1$ 比 $\hat\theta_2$ **有效**。
- 一般地，用 **均方误差** 衡量估计量的优劣：
$$\operatorname{MSE}(\hat\theta)=E(\hat\theta-\theta)^2=\operatorname{Var}(\hat\theta)+\big[E(\hat\theta)-\theta\big]^2.$$
:::

::: geo 几何直观：打靶
把每次抽样得到的估计值看成一颗子弹，真值是靶心。
- **偏差** 是弹着点的 **中心** 偏离靶心的距离——瞄准歪了；
- **方差** 是弹着点 **散开** 的程度——手不稳；
- **均方误差** 是子弹到靶心距离平方的平均，恰好是“偏差的平方 + 方差”（这又是一个勾股定理）。

一个稍微瞄偏、但非常稳的射手，平均距离可能比瞄得正、但手抖的射手更近。所以 **无偏不一定是最好的**。
:::

<EstimatorLab />

**试一试**

1. 选“正态总体的方差”：三种估计量中哪个无偏？哪个 MSE 最小？把 $n$ 调大，三者的差别如何变化？
2. 选“均匀分布 $U(0,\theta)$ 的 $\theta$”：矩估计 $2\bar X$ 和修正最大值都无偏，哪个更集中？
3. 选“对称分布的中心”，依次换成正态、均匀、拉普拉斯、柯西总体：最好的估计量是不是一直是样本均值？

::: example 例 1　均匀分布的两个无偏估计
设 $X_1,\dots,X_n$ 来自 $U(0,\theta)$。矩估计 $\hat\theta_1=2\bar X$ 与修正的最大值 $\hat\theta_2=\frac{n+1}nX_{(n)}$ 都是 $\theta$ 的无偏估计，但
$$\operatorname{Var}(\hat\theta_1)=\frac{\theta^2}{3n},\qquad\operatorname{Var}(\hat\theta_2)=\frac{\theta^2}{n(n+2)}.$$
两者之比为 $\frac{n+2}3$：$n=10$ 时 $\hat\theta_2$ 的方差只有 $\hat\theta_1$ 的 1/4。直观上，$\theta$ 是区间的右端点，最大观测值“最贴近”它；样本均值则混入了许多与端点无关的信息。
:::

::: insight 最好的估计量取决于模型
实验中估计对称分布的中心时，结论随总体而变：正态总体样本均值最好；均匀总体中程数最好（它只用两个端点，而端点恰好包含了中心的全部信息）；拉普拉斯总体样本中位数更好；柯西总体样本均值完全失效（它的方差不存在），中位数仍然可用。**没有放之四海而皆准的最优估计量**——这正是统计学需要模型的原因，也是稳健统计关心的问题。
:::

::: quiz 4
例 1 中，当 $n=10$ 时，$\operatorname{Var}(\hat\theta_1)$ 是 $\operatorname{Var}(\hat\theta_2)$ 的多少倍？
> 比值为 $\frac{n+2}3=\frac{12}3=4$。
:::

## 相合性 {.key}

::: core 定义（相合估计）
若对任意 $\varepsilon>0$，$\lim\limits_{n\to\infty}P(|\hat\theta_n-\theta|\ge\varepsilon)=0$，即 $\hat\theta_n\xrightarrow{P}\theta$，则称 $\hat\theta_n$ 是 $\theta$ 的 **相合估计**（一致估计）。

**充分条件**：若 $E(\hat\theta_n)\to\theta$ 且 $\operatorname{Var}(\hat\theta_n)\to0$，则 $\hat\theta_n$ 是相合估计。
:::

相合性是对估计量最基本的要求：样本无限增多时，估计应当越来越准。由大数定律，样本矩是总体矩的相合估计；连续函数保持依概率收敛，所以样本矩的连续函数也是相合的。

## 矩估计 {.core}

::: core 矩估计法
用样本矩代替总体矩：总体的前 $k$ 阶矩是参数的函数 $\mu_j=\mu_j(\theta_1,\dots,\theta_k)$，令
$$A_j=\frac1n\sum_{i=1}^nX_i^j=\mu_j(\theta_1,\dots,\theta_k),\qquad j=1,\dots,k,$$
解出的 $\hat\theta_1,\dots,\hat\theta_k$ 称为 **矩估计**。
:::

::: example 例 2　矩估计
- 指数分布 $\mathrm{Exp}(\lambda)$：$E(X)=1/\lambda$，令 $\bar X=1/\lambda$，得 $\hat\lambda=1/\bar X$；
- 正态分布 $N(\mu,\sigma^2)$：$E(X)=\mu$，$E(X^2)=\sigma^2+\mu^2$，解得 $\hat\mu=\bar X$，$\hat\sigma^2=A_2-\bar X^2=S_n^2$；
- 均匀分布 $U(0,\theta)$：$E(X)=\theta/2$，得 $\hat\theta=2\bar X$。
:::

矩估计简单直观，不需要知道总体分布的具体形式（只要矩存在），由大数定律它是相合的；缺点是常常不是最有效的（如例 1），也可能给出不合理的值（如 $2\bar X$ 可能小于最大观测值）。

## 最大似然估计 {.core}

### 似然函数 {.hard}

::: core 似然函数与最大似然估计
设总体的密度（或分布列）为 $p(x;\theta)$，样本观测值为 $x_1,\dots,x_n$，称
$$L(\theta)=\prod_{i=1}^np(x_i;\theta)$$
为 **似然函数**。使 $L(\theta)$ 达到最大的 $\hat\theta$ 称为 $\theta$ 的 **最大似然估计**（MLE）。由于对数单调，常求 **对数似然** $\ell(\theta)=\ln L(\theta)=\sum\ln p(x_i;\theta)$ 的最大值点，通常解方程 $\ell'(\theta)=0$。
:::

似然函数与联合密度是同一个表达式，看法却相反：联合密度把 $\theta$ 固定、把 $x$ 看成变量；似然函数把观测值 $x$ 固定、把 $\theta$ 看成变量。它回答的问题是：**哪个参数值最可能产生我们手中的这组数据？**

::: example 例 3　几个最大似然估计
- **两点分布**：$\ell(p)=k\ln p+(n-k)\ln(1-p)$，$k=\sum x_i$。令 $\ell'(p)=\frac kp-\frac{n-k}{1-p}=0$，得 $\hat p=k/n=\bar x$。
- **泊松分布**：$\ell(\lambda)=\sum x_i\ln\lambda-n\lambda-\sum\ln x_i!$，得 $\hat\lambda=\bar x$。
- **正态分布** $N(\mu,\sigma^2)$：对 $\mu$ 和 $\sigma^2$ 分别求偏导，得 $\hat\mu=\bar x$，$\hat\sigma^2=\frac1n\sum(x_i-\bar x)^2=s_n^2$。注意方差的 MLE 是有偏的。
:::

::: pitfall 不是所有的最大值都在导数为 0 处
设 $X_1,\dots,X_n$ 来自 $U(0,\theta)$。似然函数为
$$L(\theta)=\begin{cases}\theta^{-n},&\theta\ge x_{(n)},\\0,&\theta<x_{(n)}.\end{cases}$$
在 $\theta\ge x_{(n)}$ 上它单调递减，最大值在边界 $\theta=x_{(n)}$ 处取得，那里导数并不为 0。所以 $\hat\theta=X_{(n)}$。求导数等于 0 只是寻找最大值的一种方法，而不是定义。
:::

::: core 最大似然估计的不变性
若 $\hat\theta$ 是 $\theta$ 的最大似然估计，$g$ 是任意函数，则 $g(\hat\theta)$ 是 $g(\theta)$ 的最大似然估计。例如正态总体中 $\sigma$ 的 MLE 是 $\sqrt{S_n^2}=S_n$；泊松分布中 $P(X=0)=e^{-\lambda}$ 的 MLE 是 $e^{-\bar X}$。
:::

::: quiz 0.35
抛一枚硬币 20 次，出现 7 次正面。正面概率 $p$ 的最大似然估计是多少？
> $\hat p=7/20=0.35$。
:::

### 信息量：似然曲线的曲率 {.key}

<LikelihoodLab />

**试一试**

1. 选两点分布，把 $n$ 从 10 增大到 200：对数似然曲线变得更“尖”还是更“平”？近似区间怎样变化？
2. 选正态分布：橙色虚线（抛物线近似）和蓝色曲线完全重合；选两点分布、$p$ 接近 0.05、$n$ 较小时呢？
3. 选均匀分布 $U(0,\theta)$：曲线在最大观测值处是什么形状？

::: geo 几何直观：峰越尖，信息越多
对数似然曲线在峰顶附近可以用抛物线近似：
$$\ell(\theta)\approx\ell(\hat\theta)-\frac{1}{2}\,J(\hat\theta)\,(\theta-\hat\theta)^2,\qquad J(\hat\theta)=-\ell''(\hat\theta).$$
曲率 $J$ 越大，峰越尖：稍微偏离 $\hat\theta$，似然就急剧下降，数据对参数的“指认”非常明确。曲率小则峰平坦，许多参数值都能同样好地解释数据。

所以曲率就是 **数据所含的关于 $\theta$ 的信息量**，$1/\sqrt J$ 就是估计的标准误。由此得到近似置信区间 $\hat\theta\pm1.96/\sqrt J$；直接取似然下降不超过 1.92 的范围，则得到 **似然比区间**（$1.92=\chi^2_{0.95}(1)/2$）。
:::

## Fisher 信息与 C-R 下界 {.l2}

:::: l2 进阶：Fisher 信息量与 Cramér–Rao 不等式
单个观测的 **Fisher 信息量** 定义为
$$I(\theta)=E\Big[\Big(\frac{\partial}{\partial\theta}\ln p(X;\theta)\Big)^2\Big]=-E\Big[\frac{\partial^2}{\partial\theta^2}\ln p(X;\theta)\Big],$$
即对数似然曲率的期望。$n$ 个独立观测的信息量为 $nI(\theta)$——信息可以相加。

**Cramér–Rao 不等式**：在一定的正则条件下，$\theta$ 的任何无偏估计 $\hat\theta$ 都满足
$$\operatorname{Var}(\hat\theta)\ge\frac1{nI(\theta)}.$$
达到这个下界的无偏估计称为 **有效估计**。

**例**：两点分布 $I(p)=\frac1{p(1-p)}$，C-R 下界为 $\frac{p(1-p)}n$，恰好等于 $\operatorname{Var}(\bar X)$，所以 $\hat p=\bar X$ 是有效估计。泊松分布 $I(\lambda)=1/\lambda$，下界 $\lambda/n=\operatorname{Var}(\bar X)$，$\bar X$ 同样有效。

均匀分布 $U(0,\theta)$ 不满足正则条件（支撑集依赖于 $\theta$），例 1 中 $\operatorname{Var}(\hat\theta_2)=\frac{\theta^2}{n(n+2)}$ 按 $1/n^2$ 减小，比 C-R 下界的 $1/n$ 快得多——这是“悬崖形”似然的特殊性。
::::

:::: l3 深入：最大似然估计的渐近正态性
在正则条件下，MLE 有一条非常好的大样本性质：
$$\sqrt n\,(\hat\theta-\theta)\xrightarrow{L}N\Big(0,\ \frac1{I(\theta)}\Big).$$
即 $n$ 很大时，$\hat\theta$ 近似无偏、近似正态，方差达到 C-R 下界——**大样本时没有比 MLE 更好的估计**。这就是 MLE 成为最常用的估计方法的原因，也是许多统计软件报告“标准误”的理论依据：标准误就是 $1/\sqrt{\text{观测信息}}$，即上面实验中由曲率算出的那个数。
::::

## EM 算法 {.l3}

:::: l3 深入：EM 算法
很多问题的似然函数难以直接最大化，但如果知道了某些“缺失的数据”，问题就会变得很简单。例如两个正态分布的混合：若知道每个观测来自哪一个分布，估计各自的均值、方差就是简单的分组计算。

**EM 算法** 在“猜缺失数据”和“估参数”之间交替进行：

- **E 步**（期望）：在当前参数下，计算缺失数据的条件期望——对混合模型，就是每个观测属于各分布的后验概率（“软分组”）；
- **M 步**（最大化）：把缺失数据用 E 步的结果代入，求使完全数据似然最大的参数——对混合模型，就是按后验概率加权计算各组的均值和方差。

可以证明每一轮迭代都不会使似然下降，所以算法收敛到似然函数的一个局部最大点。EM 算法由 Dempster、Laird、Rubin 在 1977 年系统提出，广泛用于混合模型、缺失数据、隐马尔可夫模型等问题。
::::

## 最小方差无偏估计 {.l3}

:::: l3 深入：Rao–Blackwell 定理——用充分统计量“抹平”估计
设 $T$ 是 $\theta$ 的充分统计量，$\hat\theta$ 是任一无偏估计。令 $\tilde\theta=E(\hat\theta\mid T)$（由充分性，它不含 $\theta$，确实是一个统计量），则
$$E(\tilde\theta)=\theta,\qquad\operatorname{Var}(\tilde\theta)\le\operatorname{Var}(\hat\theta).$$
证明就是全方差公式：$\operatorname{Var}(\hat\theta)=\operatorname{Var}[E(\hat\theta\mid T)]+E[\operatorname{Var}(\hat\theta\mid T)]$，后一项非负。几何上，$\tilde\theta$ 是 $\hat\theta$ 在“$T$ 的函数”这个子空间上的投影，投影只会更短。

**例**：泊松总体中估计 $\theta=P(X=0)=e^{-\lambda}$。粗糙的无偏估计是 $\hat\theta=I\{X_1=0\}$（只看第一个观测是否为 0）。以充分统计量 $T=\sum X_i$ 为条件：给定 $T=t$，$X_1\sim b(t,\frac1n)$，所以
$$\tilde\theta=E(\hat\theta\mid T)=P(X_1=0\mid T)=\Big(1-\frac1n\Big)^T.$$
这正是 $e^{-\lambda}$ 的 **最小方差无偏估计**（UMVUE）。若 $T$ 还是 **完全** 统计量，Lehmann–Scheffé 定理保证这样得到的估计在所有无偏估计中方差最小。
::::

## 本章小结

- **无偏性**：$E(\hat\theta)=\theta$；无偏性在非线性变换下不保持。
- **有效性与 MSE**：$\text{MSE}=\text{方差}+\text{偏差}^2$，像打靶；无偏不一定最好，最好的估计量依赖于模型。
- **相合性**：$\hat\theta_n\xrightarrow{P}\theta$，是最基本的要求。
- **矩估计**：样本矩代替总体矩，简单但不一定有效。
- **最大似然估计**：使观测数据“最可能出现”的参数；具有不变性；最大值未必在导数为 0 处。
- **信息量**：对数似然的曲率；C-R 下界 $1/(nI)$；MLE 渐近有效。

| 总体 | 参数 | 矩估计 | 最大似然估计 |
| --- | --- | --- | --- |
| $b(1,p)$ | $p$ | $\bar X$ | $\bar X$ |
| $P(\lambda)$ | $\lambda$ | $\bar X$ | $\bar X$ |
| $\mathrm{Exp}(\lambda)$ | $\lambda$ | $1/\bar X$ | $1/\bar X$ |
| $N(\mu,\sigma^2)$ | $\mu,\sigma^2$ | $\bar X,\ S_n^2$ | $\bar X,\ S_n^2$ |
| $U(0,\theta)$ | $\theta$ | $2\bar X$ | $X_{(n)}$ |

## 分层练习

### 基础

**1.** 某元件的寿命服从指数分布，抽测 5 个元件的寿命（千小时）为 2.1、3.4、1.8、2.7、3.0。求 $\lambda$ 的矩估计与最大似然估计。

::: details 解答
$\bar x=13/5=2.6$，两种方法都得 $\hat\lambda=1/2.6\approx0.385$（每千小时）。
:::

**2.** 设 $X_1,\dots,X_n$（$n\ge3$）来自均值为 $\mu$ 的总体。$\hat\mu_1=\bar X$ 与 $\hat\mu_2=\frac{X_1+X_2}2$ 都是无偏估计吗？哪个更有效？

::: details 解答
都无偏。$\operatorname{Var}(\hat\mu_1)=\sigma^2/n$，$\operatorname{Var}(\hat\mu_2)=\sigma^2/2$，$n\ge3$ 时 $\hat\mu_1$ 更有效——它用了全部数据。
:::

**3.** 某路口每天发生的事故数服从泊松分布，连续 5 天的事故数为 2、0、3、1、4。求 $\lambda$ 的最大似然估计，以及“一天内不发生事故”的概率的最大似然估计。

::: details 解答
$\hat\lambda=\bar x=2$。由不变性，$P(X=0)=e^{-\lambda}$ 的 MLE 为 $e^{-2}\approx0.135$。
:::

### 提高

**4.** 设 $X_1,\dots,X_n$ 来自 $N(\mu,\sigma^2)$，两个参数都未知。推导 $\mu$ 与 $\sigma^2$ 的最大似然估计。

::: details 解答
$\ell(\mu,\sigma^2)=-\frac n2\ln(2\pi\sigma^2)-\frac1{2\sigma^2}\sum(x_i-\mu)^2$。
$\frac{\partial\ell}{\partial\mu}=\frac1{\sigma^2}\sum(x_i-\mu)=0$，得 $\hat\mu=\bar x$；
$\frac{\partial\ell}{\partial\sigma^2}=-\frac n{2\sigma^2}+\frac1{2\sigma^4}\sum(x_i-\mu)^2=0$，代入 $\hat\mu$ 得 $\hat\sigma^2=\frac1n\sum(x_i-\bar x)^2$。
:::

**5.** 证明 $\operatorname{MSE}(\hat\theta)=\operatorname{Var}(\hat\theta)+[E(\hat\theta)-\theta]^2$。

::: details 解答
记 $m=E(\hat\theta)$。
$$E(\hat\theta-\theta)^2=E[(\hat\theta-m)+(m-\theta)]^2=E(\hat\theta-m)^2+2(m-\theta)E(\hat\theta-m)+(m-\theta)^2,$$
中间项为 0，得证。
:::

**6.** 设 $X_1,\dots,X_n$ 来自 $N(\mu,\sigma^2)$。对 $\sigma^2$ 的估计量 $c\sum(X_i-\bar X)^2$，$c$ 取何值时均方误差最小？（提示：$\sum(X_i-\bar X)^2/\sigma^2\sim\chi^2(n-1)$。）

::: details 解答
记 $Q=\sum(X_i-\bar X)^2$，$E(Q)=(n-1)\sigma^2$，$\operatorname{Var}(Q)=2(n-1)\sigma^4$。
$$\operatorname{MSE}=c^2\cdot2(n-1)\sigma^4+[c(n-1)-1]^2\sigma^4.$$
对 $c$ 求导并令其为 0：$4c(n-1)+2(n-1)[c(n-1)-1]=0$，得 $c=\frac1{n+1}$。所以除以 $n+1$ 的估计 MSE 最小，比无偏的 $S^2$（除以 $n-1$）还小——这正是上面实验第 1 题的结论。
:::

### 挑战

**7.** 求泊松分布 $P(\lambda)$ 的 Fisher 信息量和 C-R 下界，并说明 $\bar X$ 是有效估计。

::: details 解答
$\ln p(x;\lambda)=x\ln\lambda-\lambda-\ln x!$，$\frac{\partial^2}{\partial\lambda^2}\ln p=-\frac x{\lambda^2}$，$I(\lambda)=E\big(\frac X{\lambda^2}\big)=\frac1\lambda$。C-R 下界 $\frac1{nI}=\frac\lambda n=\operatorname{Var}(\bar X)$，$\bar X$ 无偏且达到下界，是有效估计。
:::

**8.** 设 $X_1,\dots,X_n$ 来自泊松分布，$T=\sum X_i$。验证 $\big(1-\frac1n\big)^T$ 是 $e^{-\lambda}$ 的无偏估计。

::: details 解答
$T\sim P(n\lambda)$，
$$E\Big[\Big(1-\frac1n\Big)^T\Big]=\sum_{t\ge0}\Big(1-\frac1n\Big)^t\frac{(n\lambda)^t}{t!}e^{-n\lambda}=e^{-n\lambda}e^{(n-1)\lambda}=e^{-\lambda}.$$
与 MLE $e^{-\bar X}$ 相比，它是无偏的；$n$ 很大时二者几乎相同，因为 $\big(1-\frac1n\big)^{n\bar X}\approx e^{-\bar X}$。
:::

## 代码实现（Python）

::: details 展开代码：数值求最大似然估计、比较估计量的均方误差
```python
import numpy as np
from scipy import stats, optimize

rng = np.random.default_rng(1)

# 1. 数值最大化似然：伽马分布 Ga(α, λ) 没有闭式的 MLE
x = rng.gamma(shape=3.0, scale=1 / 2.0, size=500)          # 真值 α = 3，λ = 2
negll = lambda p: -np.sum(stats.gamma.logpdf(x, a=p[0], scale=1 / p[1])) if min(p) > 0 else np.inf
res = optimize.minimize(negll, x0=[1.0, 1.0], method="Nelder-Mead")
print("数值 MLE：alpha, lambda =", res.x.round(3))
print("scipy 内置拟合：", stats.gamma.fit(x, floc=0))      # 返回 (alpha, loc, scale = 1/lambda)

# 2. 比较 σ² 的三种估计量的均方误差（正态总体，σ² = 1，n = 10）
n, R = 10, 200_000
Q = rng.chisquare(n - 1, R)                                # 即 Σ(Xi - Xbar)²，σ² = 1
for name, c in [("除以 n-1", 1 / (n - 1)), ("除以 n", 1 / n), ("除以 n+1", 1 / (n + 1))]:
    est = c * Q
    print(f"{name}：偏差 {est.mean() - 1:+.4f}，MSE {np.mean((est - 1) ** 2):.4f}")

# 3. 均匀分布 U(0, θ)：矩估计与修正最大值的方差之比约为 (n+2)/3
U = rng.random((R, n))
v1 = (2 * U.mean(axis=1)).var()
v2 = ((n + 1) / n * U.max(axis=1)).var()
print("方差之比：", round(v1 / v2, 2), "（理论", (n + 2) / 3, "）")
```
:::

::: info 史话：费希尔与似然
最大似然的思想可以追溯到高斯和拉普拉斯，但把它作为一般方法系统提出的是费希尔。1912 年他还是剑桥的学生时就发表了第一篇关于这一方法的论文，1922 年在《理论统计学的数学基础》中正式提出了“似然”这个名称，并同时引入了相合性、有效性、充分性和信息量等概念——今天点估计理论的基本框架，几乎都出自这一篇论文。矩估计法则由皮尔逊在 1894 年提出，两人为两种方法的优劣争论了多年。
:::

## 延伸阅读

- 茆诗松等《概率论与数理统计教程》（第三版）§6.1 点估计的概念与无偏性、§6.2 矩估计及相合性、§6.3 最大似然估计与 EM 算法、§6.4 最小方差无偏估计。
- 黄良文《统计学》参数估计部分：点估计与估计量的评价标准。
- E. L. Lehmann, G. Casella. *Theory of Point Estimation*（第 2 版）：点估计理论的权威著作。
