# 平稳性与自相关

前几章把时间序列看作一串确定的数字，用平均、分解、平滑去描述它。从这一章开始换一个视角：把观测到的序列看作某个 **随机过程** 的一次实现，就像把一组样本看作来自某个总体。这样才能谈论“预测的误差有多大”“这个相关是不是偶然的”。

但时间序列有一个特殊的困难：每个时刻只有 **一个** 观测值。1950 年的尼罗河流量只有一个数，不可能重复抽样。要从一条路径中学到过程的规律，过程必须在某种意义上“不随时间改变”——这就是 **平稳性**。这一章讨论平稳性的含义、刻画序列记忆的自相关函数，以及怎样检验一个序列是不是白噪声。

## 随机过程与样本路径 {.core}

::: core 随机过程
依时间排列的一族随机变量 $\{X_t\}$ 称为 **随机过程**（时间序列模型）。观测到的序列 $x_1,x_2,\dots,x_n$ 是它的一次实现，称为一条 **样本路径**。描述随机过程最常用的是一阶矩和二阶矩：
$$\mu_t=EX_t,\qquad \gamma(s,t)=\operatorname{Cov}(X_s,X_t).$$
:::

::: geo 几何直观：系综与截面
设想同一个过程在许多“平行世界”里各运行一次，得到许多条样本路径，它们的全体称为 **系综**。在某个时刻 $t$ 作一个竖直的 **截面**，截面上各条路径的取值就构成 $X_t$ 的分布；均值函数 $\mu_t$ 和方差 $\gamma(t,t)$ 描述的正是这些截面。

**平稳** 的意思是：无论在哪个时刻作截面，看到的分布都一样；两个相隔 $k$ 期的截面之间的关系，也只与 $k$ 有关，与在什么时候无关。
:::

<EnsembleLab />

**试一试**

1. 比较白噪声与 AR(1)：两者的阴影带都是水平的，但 AR(1) 的路径“黏”得多——截面的分布相同，记忆不同。
2. 随机游走：阴影带像喇叭口一样张开，第 $t$ 期的方差随 $t$ 线性增大，不平稳。
3. 趋势 + 噪声：每个截面的方差相同，但均值随时间上升，也不平稳；减去趋势之后就平稳了。
4. 随机相位的余弦波：每一条路径都是确定的余弦波，为什么阴影带却是水平的？
5. 常数随机变量 $X_t=Z$：截面的分布完全不变，过程是平稳的，但每条路径都是一条水平线。一条路径的时间平均能估计出系综的均值吗？

## 严平稳与宽平稳 {.core}

::: core 定义（平稳性）
- **严平稳**：对任意 $k$、任意时刻 $t_1,\dots,t_k$ 和任意平移 $h$，$(X_{t_1},\dots,X_{t_k})$ 与 $(X_{t_1+h},\dots,X_{t_k+h})$ 的联合分布相同。
- **宽平稳**（二阶平稳、协方差平稳）：
  1. $EX_t=\mu$ 与 $t$ 无关；
  2. $\operatorname{Var}(X_t)<\infty$；
  3. $\operatorname{Cov}(X_t,X_{t+k})=\gamma_k$ 只依赖于间隔 $k$，与 $t$ 无关。

二阶矩有限的严平稳过程一定宽平稳；反之不然，但对 **正态过程**（任意有限维分布都是正态分布）两者等价。时间序列分析中说“平稳”，通常指宽平稳。
:::

::: example 例 1　几个基本的例子
设 $\varepsilon_t\sim WN(0,\sigma^2)$。

1. **白噪声** 本身是宽平稳的：$\gamma_0=\sigma^2$，$\gamma_k=0$（$k\ne0$）。独立同分布的白噪声还是严平稳的。
2. **随机游走** $X_t=X_{t-1}+\varepsilon_t$（$X_0=0$）：$X_t=\varepsilon_1+\cdots+\varepsilon_t$，均值为 0，但 $\operatorname{Var}(X_t)=t\sigma^2$ 随时间增大，**不平稳**。而且 $\operatorname{Cov}(X_s,X_t)=\sigma^2\min(s,t)$，依赖于 $s,t$ 本身，而不只是它们的差。
3. **趋势平稳** $X_t=a+bt+\varepsilon_t$：均值 $a+bt$ 随时间变化，不平稳；但去掉趋势后 $X_t-a-bt=\varepsilon_t$ 平稳。
4. **随机相位的余弦波** $X_t=A\cos(\omega t+\Theta)$，$\Theta\sim U(0,2\pi)$：$EX_t=0$，
$$\operatorname{Cov}(X_t,X_{t+k})=\frac{A^2}{2}\cos(\omega k),$$
只与 $k$ 有关，所以 **宽平稳**——尽管每一条路径都是确定的余弦波（练习 5）。
:::

::: pitfall 平稳 ≠ 看起来平坦
平稳说的是 **概率分布** 不随时间变化，而不是路径平坦或没有起伏。AR(2) 的路径可以有明显的伪周期，随机相位余弦波的路径是完美的周期函数，它们都平稳；随机游走的一小段可能看上去很平坦，它却不平稳。判断平稳性要看产生数据的机制，或者用后面几章的检验方法。
:::

## 自协方差函数与自相关函数 {.core}

::: core 性质
设 $\{X_t\}$ 宽平稳，自协方差函数 $\gamma_k$ 与自相关函数 $\rho_k=\gamma_k/\gamma_0$ 满足：

1. $\gamma_0=\operatorname{Var}(X_t)\ge0$，$\rho_0=1$，$|\rho_k|\le1$；
2. 对称：$\gamma_{-k}=\gamma_k$；
3. **非负定**：对任意实数 $a_1,\dots,a_m$ 和时刻 $t_1,\dots,t_m$，$\sum_i\sum_ja_ia_j\gamma_{t_i-t_j}\ge0$。

第 3 条是因为左边等于 $\operatorname{Var}\big(\sum_ia_iX_{t_i}\big)$。它说明并不是任意一个数列都能当自相关函数：例如 $\rho_1=\rho_2=-0.9$ 就不可能（练习 8）。
:::

::: core 样本自协方差与样本自相关
$$\hat\gamma_k=\frac1n\sum_{t=1}^{n-k}(x_t-\bar x)(x_{t+k}-\bar x),\qquad r_k=\frac{\hat\gamma_k}{\hat\gamma_0},\qquad k=0,1,\dots,n-1.$$
分母取 $n$ 而不是 $n-k$：这样虽然有偏，但保证了样本自协方差矩阵非负定，而且大滞后处的估计不会剧烈波动。$r_k$ 只在 $k$ 远小于 $n$ 时可靠，实践中一般只看到 $n/4$ 左右。
:::

::: geo 几何直观：序列与自身平移副本的相关
把序列和它向后平移 $k$ 期的副本配成 $n-k$ 对 $(x_{t-k},x_t)$，画成散点图，称为 **滞后散点图**。$r_k$ 近似等于这些点的相关系数：点越贴近对角线，$r_k$ 越接近 1；呈一团圆形，$r_k$ 接近 0；沿反对角线分布，$r_k$ 为负。把 $k=1,2,\dots$ 的 $r_k$ 依次排开，就是 **自相关图**（ACF 图）——它记录了序列对自己过去的记忆随间隔怎样衰减。

$r_k$ 与散点的相关系数不完全相同：$r_k$ 用的是全部 $n$ 个数据的均值与方差，而散点只有 $n-k$ 对。这个小差别正是保证非负定性的代价。
:::

<LagScatter />

**试一试**

1. 尼罗河流量，$k=1$：散点有明显的正相关，$r_1\approx0.50$。逐步增大 $k$，散点怎样变化？
2. 猞猁（取常用对数）：$k=1$ 时散点贴近对角线，$k=5$ 附近却沿反对角线分布。ACF 图上对应的是什么形状？这和“[ARMA 模型](/time-series/arma)”一章的十年周期有什么联系？
3. 航空乘客：$k=1$ 和 $k=12$ 的散点都非常贴近对角线，ACF 衰减得极慢，在 12、24 处还有小峰，这是趋势与季节的表现。注意 $k=12$ 时散点的相关系数约为 0.99，$r_{12}$ 却只有 0.76：序列有趋势，前后两段的均值相差很大，而 $r_k$ 用的是全部数据的均值。
4. 随机游走：各个滞后的散点都贴近对角线，ACF 从接近 1 开始缓慢下降——这是 **不平稳** 的典型信号。
5. 白噪声：多换几组随机数，24 个 $r_k$ 中大约有几个会落到阴影带外？Ljung–Box 检验的结论呢？

## 白噪声检验 {.key}

拿到一个序列（或模型的残差），首先要问：它是不是白噪声？若是，过去对预测未来毫无帮助，建模可以到此为止。

::: core 巴特利特界限
若 $\{X_t\}$ 是独立同分布的白噪声，则当 $n$ 较大时，对每个 $k\ge1$ 近似地有
$$r_k\sim N\Big(0,\frac1n\Big),$$
且不同滞后的 $r_k$ 近似独立。所以 $|r_k|>1.96/\sqrt n$ 时，可以在 5% 的水平上认为 $\rho_k\neq0$。ACF 图上的阴影带就是这个界限。
:::

::: pitfall 看了 20 根柱子
即使序列真是白噪声，每个 $r_k$ 也有 5% 的机会落到界外；一次看 20 个滞后，平均会有 1 个“显著”。这与“[方差分析](/inference/anova)”一章的多重比较是同一个问题。单个滞后略微出界不必在意，除非它出现在有意义的位置（如月度数据的滞后 12）。更好的办法是把多个滞后合起来作一次检验。
:::

::: core 混成检验（Portmanteau 检验）
原假设 $H_0$：$\rho_1=\cdots=\rho_h=0$。**Box–Pierce 统计量** 与改进的 **Ljung–Box 统计量** 分别为
$$Q_{BP}=n\sum_{k=1}^hr_k^2,\qquad Q_{LB}=n(n+2)\sum_{k=1}^h\frac{r_k^2}{n-k}.$$
$H_0$ 成立时，它们近似服从 $\chi^2(h)$，统计量过大就拒绝白噪声的假设。Ljung–Box 统计量在小样本下更接近 $\chi^2$ 分布，是软件的默认选择。检验 ARMA($p,q$) 模型的残差时，自由度要减去估计的参数个数，取 $h-p-q$。
:::

::: example 例 2　尼罗河流量是白噪声吗
尼罗河流量（1871—1970 年，$n=100$）的样本自相关为 $r_1\approx0.498$，$r_2\approx0.385$，$r_3\approx0.328$，都远在 $\pm1.96/\sqrt{100}=\pm0.196$ 之外。取 $h=10$，Ljung–Box 统计量 $Q_{LB}\approx88.13$，而 $\chi^2_{0.95}(10)\approx18.31$，p 值约为 $10^{-14}$，强烈拒绝白噪声。流量的高低有持续性：丰水年之后往往还是丰水年。（实际上，1898 年前后流量有一次明显的下降，这种水平的变化也会造成很强的自相关，见“[拓展：谱、GARCH、协整与卡尔曼](/time-series/topics)”一章的卡尔曼滤波。）
:::

::: quiz 7.74 0.02
$n=100$ 的序列，$r_1=0.25$，$r_2=0.10$，$r_3=-0.05$。取 $h=3$，Ljung–Box 统计量是多少？（保留两位小数）
> $Q=100\times102\times\left(\frac{0.0625}{99}+\frac{0.01}{98}+\frac{0.0025}{97}\right)\approx7.74$。$\chi^2_{0.95}(3)\approx7.81$，在 5% 的水平上恰好不能拒绝白噪声（p 值约 0.052）。注意 $r_1=0.25$ 单独看已经超出了 $\pm0.196$ 的界限——单个检验与联合检验的结论可以不同。
:::

:::: l3 深入：巴特利特公式
更一般地，对线性平稳过程，巴特利特（Bartlett，1946）给出了样本自相关的渐近方差。特别地，若 $\{X_t\}$ 是 MA($q$)，则 $k>q$ 时
$$\operatorname{Var}(r_k)\approx\frac1n\Big(1+2\sum_{j=1}^q\rho_j^2\Big).$$
所以判断 MA($q$) 的 ACF 是否在 $q$ 步后截尾时，界限应当比 $\pm1.96/\sqrt n$ 宽一些。statsmodels 的 `plot_acf` 画出的就是这种逐步放宽的界限。
::::

## 遍历性：一条路径够用吗 {.l3}

:::: l3 深入：遍历性与有效样本量
平稳只保证各截面的分布相同；用一条路径的 **时间平均** 去估计截面上的 **系综平均**，还需要 **遍历性**。对宽平稳过程，样本均值的方差为
$$\operatorname{Var}(\bar X)=\frac1n\sum_{|k|<n}\Big(1-\frac{|k|}{n}\Big)\gamma_k.$$
若 $\gamma_k\to0$（足够快），它趋于 0，$\bar X$ 依概率收敛到 $\mu$，称过程 **均值遍历**。反例是上面实验中的 $X_t=Z$：$\gamma_k=\operatorname{Var}(Z)$ 不衰减，一条路径的时间平均永远等于它自己的 $Z$，无论观测多久，都得不到 $EZ$。

当 $\sum_k|\gamma_k|<\infty$ 时，
$$\operatorname{Var}(\bar X)\approx\frac{\gamma_0}{n}\Big(1+2\sum_{k\ge1}\rho_k\Big)=\frac{\gamma_0}{n_{\text{eff}}},\qquad n_{\text{eff}}=\frac{n}{1+2\sum_{k\ge1}\rho_k}.$$
$n_{\text{eff}}$ 称为 **有效样本量**。对 AR(1)，$\rho_k=\phi^k$，$n_{\text{eff}}=n\,\dfrac{1-\phi}{1+\phi}$：$\phi=0.8$ 时只有 $n/9$。100 个正相关的观测值，所含的关于均值的信息只相当于约 11 个独立观测值。对自相关的数据套用 $s/\sqrt n$ 计算均值的置信区间，会严重低估不确定性。
::::

## 怎样从 ACF 识别非平稳

::: insight ACF 衰减得很慢，是非平稳的信号
对平稳的 ARMA 过程，$\rho_k$ 按几何级数衰减（见“[ARMA 模型](/time-series/arma)”一章）。如果样本 ACF 从接近 1 的地方 **缓慢、近似直线地** 下降，通常意味着序列有趋势或随机游走的成分：对随机游走，$\operatorname{Corr}(X_t,X_{t+k})=\sqrt{t/(t+k)}$，$t$ 较大时对很大的 $k$ 都接近 1。

对策是 **差分**：随机游走的一阶差分 $\nabla X_t=\varepsilon_t$ 就是白噪声。季节性序列的 ACF 在季节滞后（12、24……）处有缓慢衰减的峰，对策是季节差分 $X_t-X_{t-12}$。怎样判断该不该差分、差分几次，是“[ARIMA 与单位根](/time-series/unit-root)”一章的主题。
:::

## 本章小结

- 观测到的时间序列是随机过程的一条 **样本路径**；**宽平稳** 要求均值不变、协方差只依赖于间隔。随机游走、趋势序列不平稳；随机相位余弦波平稳。
- **ACF** $\rho_k$ 刻画序列的记忆，具有对称性和非负定性；样本 ACF 的分母取 $n$。几何上，$r_k$ 是滞后散点图 $(x_{t-k},x_t)$ 的相关系数（近似）。
- **白噪声检验**：单个滞后用巴特利特界限 $\pm1.96/\sqrt n$；联合检验用 Ljung–Box 统计量，近似 $\chi^2(h)$，检验残差时自由度减去参数个数。
- **遍历性** 保证一条路径的时间平均能估计系综平均；正自相关使 **有效样本量** 变小。
- 样本 ACF **衰减很慢** 是非平稳的信号，通常需要差分。

| 概念 | 公式 |
| --- | --- |
| 宽平稳 | $EX_t=\mu$，$\operatorname{Cov}(X_t,X_{t+k})=\gamma_k$ |
| 自相关函数 | $\rho_k=\gamma_k/\gamma_0$ |
| 样本自相关 | $r_k=\dfrac{\sum_{t=1}^{n-k}(x_t-\bar x)(x_{t+k}-\bar x)}{\sum_{t=1}^n(x_t-\bar x)^2}$ |
| 巴特利特界限 | $\pm1.96/\sqrt n$ |
| Ljung–Box | $Q=n(n+2)\sum_{k=1}^hr_k^2/(n-k)\sim\chi^2(h)$ |
| 有效样本量（AR(1)） | $n_{\text{eff}}=n(1-\phi)/(1+\phi)$ |

## 分层练习

### 基础

**1.** 设 $\varepsilon_t$ 是独立同分布的 $N(0,1)$ 序列。下列过程是否宽平稳？(a) $X_t=\varepsilon_t+0.5\varepsilon_{t-1}$；(b) $X_t=t+\varepsilon_t$；(c) $X_t=\varepsilon_1+\cdots+\varepsilon_t$；(d) $X_t=(-1)^t\varepsilon_t$；(e) $X_t=\varepsilon_t\varepsilon_{t-1}$。

::: details 解答
(a) 平稳，MA(1)。(b) 不平稳，均值随 $t$ 变化。(c) 不平稳，方差为 $t$。(d) 平稳：均值 0，方差 1，$k\ne0$ 时 $\operatorname{Cov}(X_t,X_{t+k})=\pm E(\varepsilon_t\varepsilon_{t+k})=0$，它其实是白噪声，尽管路径的符号有规律地翻转。(e) 平稳：均值 0，方差 $E\varepsilon_t^2E\varepsilon_{t-1}^2=1$；$\operatorname{Cov}(X_t,X_{t+1})=E(\varepsilon_t^2)E(\varepsilon_{t-1})E(\varepsilon_{t+1})=0$，其余滞后也为 0，所以它是白噪声——但相邻的 $X_t$ 并不独立（见练习 9）。
:::

**2.** 计算序列 2，4，3，5，6 的样本自相关 $r_1$ 和 $r_2$。

::: details 解答
$\bar x=4$，离差为 −2，0，−1，1，2，$\sum(x_t-\bar x)^2=10$。$\sum(x_t-\bar x)(x_{t+1}-\bar x)=0+0-1+2=1$，$r_1=0.1$；$\sum(x_t-\bar x)(x_{t+2}-\bar x)=2+0-2=0$，$r_2=0$。
:::

**3.** 某序列 $n=100$，样本自相关 $r_1=0.15$，$r_2=-0.22$，$r_3=0.08$，$r_{12}=0.25$。用巴特利特界限判断哪些滞后显著。若这是月度数据，你会特别关注哪一个？

::: details 解答
界限为 $\pm1.96/\sqrt{100}=\pm0.196$，$r_2$ 与 $r_{12}$ 出界，$r_1$、$r_3$ 在界内。对月度数据，$r_{12}$ 显著提示可能存在季节性，值得特别关注；$r_2$ 单独略微出界，可能是偶然的，需要结合 Ljung–Box 检验和模型诊断判断。
:::

### 提高

**4.** 用 Box–Pierce 统计量重做上面的小测（$n=100$，$r_1=0.25$，$r_2=0.10$，$r_3=-0.05$），并与 Ljung–Box 统计量比较。

::: details 解答
$Q_{BP}=100\times(0.0625+0.01+0.0025)=7.5$，比 $Q_{LB}\approx7.74$ 小。Ljung–Box 统计量给每一项乘了 $(n+2)/(n-k)>1$ 的修正因子，在小样本下更接近 $\chi^2$ 分布；Box–Pierce 统计量偏小，检验偏保守。
:::

**5.** 证明随机相位余弦波 $X_t=A\cos(\omega t+\Theta)$（$\Theta\sim U(0,2\pi)$，$A,\omega$ 为常数）宽平稳，并求其自相关函数。

::: details 解答
$EX_t=\frac{A}{2\pi}\int_0^{2\pi}\cos(\omega t+\theta)\,\mathrm d\theta=0$。由积化和差，
$$E(X_tX_{t+k})=\frac{A^2}{2}E\big[\cos(\omega k)+\cos(2\omega t+\omega k+2\Theta)\big]=\frac{A^2}{2}\cos(\omega k),$$
因为第二项对 $\Theta$ 的平均为 0。它只依赖于 $k$，所以宽平稳，$\rho_k=\cos(\omega k)$，**不衰减**——这是“确定性”成分的标志，对应 Wold 分解中的 $V_t$。
:::

**6.** 设随机游走 $X_t=\varepsilon_1+\cdots+\varepsilon_t$，$\varepsilon_t\sim WN(0,\sigma^2)$。求 $\operatorname{Corr}(X_t,X_{t+k})$，并计算 $t=50$，$k=10$ 时的值。

::: details 解答
$\operatorname{Cov}(X_t,X_{t+k})=\operatorname{Var}(X_t)=t\sigma^2$（$X_{t+k}-X_t$ 与 $X_t$ 不相关），于是
$$\operatorname{Corr}(X_t,X_{t+k})=\frac{t\sigma^2}{\sqrt{t\sigma^2\cdot(t+k)\sigma^2}}=\sqrt{\frac{t}{t+k}}.$$
$t=50$，$k=10$ 时为 $\sqrt{50/60}\approx0.913$。相隔 10 期仍高度相关，这就是随机游走的样本 ACF 衰减极慢的原因。
:::

**7.** 设 $X_t$ 是 $\phi=0.5$ 的 AR(1)，方差为 $\gamma_0$。观测 $n=120$ 期，样本均值的方差近似是多少？有效样本量是多少？

::: details 解答
$n_{\text{eff}}=120\times\frac{1-0.5}{1+0.5}=40$，$\operatorname{Var}(\bar X)\approx\gamma_0/40$，是独立情形 $\gamma_0/120$ 的 3 倍，均值置信区间应放宽为 $\sqrt3\approx1.73$ 倍。
:::

### 挑战

**8.** 证明不存在宽平稳过程使 $\rho_1=\rho_2=-0.9$。

::: details 解答
非负定性要求相关矩阵
$$R=\begin{pmatrix}1&\rho_1&\rho_2\\\rho_1&1&\rho_1\\\rho_2&\rho_1&1\end{pmatrix}$$
非负定。取 $a=(1,1,1)$，$a^\top Ra=3+4\rho_1+2\rho_2=3-3.6-1.8=-2.4<0$，矛盾。直观地说：$X_t$ 与 $X_{t+1}$、$X_{t+1}$ 与 $X_{t+2}$ 都强烈负相关时，$X_t$ 与 $X_{t+2}$ 应当正相关，不可能也强烈负相关。
:::

**9.** 设 $\varepsilon_t$ 独立同分布于 $N(0,1)$，$X_t=\varepsilon_t\varepsilon_{t-1}$。练习 1 已说明它是白噪声。求 $\operatorname{Corr}(X_t^2,X_{t+1}^2)$，并说明“白噪声”与“独立”的区别。

::: details 解答
$X_t^2=\varepsilon_t^2\varepsilon_{t-1}^2$，$EX_t^2=1$，$EX_t^4=E\varepsilon_t^4E\varepsilon_{t-1}^4=9$，$\operatorname{Var}(X_t^2)=8$。
$$E(X_t^2X_{t+1}^2)=E(\varepsilon_{t-1}^2)E(\varepsilon_t^4)E(\varepsilon_{t+1}^2)=3,\qquad\operatorname{Cov}(X_t^2,X_{t+1}^2)=3-1=2,$$
相关系数为 $2/8=0.25$。$X_t$ 本身不相关，平方却相关，所以它们不独立。白噪声只要求 **不相关**，ACF 只能发现线性的依赖；金融收益率常常就是这样：收益率本身几乎不相关，波动（平方）却聚集在一起，这正是 GARCH 模型要刻画的现象。
:::

## 代码实现（Python）

::: details 展开代码：样本 ACF、Ljung–Box 检验与滞后散点图
```python
import matplotlib
matplotlib.use("Agg")                     # 只保存图片、不弹出窗口时使用
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from statsmodels.graphics.tsaplots import plot_acf
from statsmodels.stats.diagnostic import acorr_ljungbox
from statsmodels.tsa.stattools import acf

nile = np.array([1120, 1160, 963, 1210, 1160, 1160, 813, 1230, 1370, 1140, 995, 935, 1110, 994,
                 1020, 960, 1180, 799, 958, 1140, 1100, 1210, 1150, 1250, 1260, 1220, 1030, 1100,
                 774, 840, 874, 694, 940, 833, 701, 916, 692, 1020, 1050, 969, 831, 726, 456, 824,
                 702, 1120, 1100, 832, 764, 821, 768, 845, 864, 862, 698, 845, 744, 796, 1040, 759,
                 781, 865, 845, 944, 984, 897, 822, 1010, 771, 676, 649, 846, 812, 742, 801, 1040,
                 860, 874, 848, 890, 744, 749, 838, 1050, 918, 986, 797, 923, 975, 815, 1020, 906,
                 901, 1170, 912, 746, 919, 718, 714, 740], dtype=float)

r = acf(nile, nlags=10)
print("r1..r5：", r[1:6].round(3), " 界限 ±", round(1.96 / np.sqrt(len(nile)), 3))
print(acorr_ljungbox(nile, lags=[5, 10]))            # lb_stat 与 lb_pvalue

# 白噪声：大约 5% 的 r_k 落在界外，Ljung–Box 检验通常不拒绝
rng = np.random.default_rng(1)
wn = rng.standard_normal(200)
print("白噪声 Q(10) 的 p 值：", acorr_ljungbox(wn, lags=[10])["lb_pvalue"].iloc[0].round(3))

fig, ax = plt.subplots(1, 2, figsize=(9, 3.5))
pd.plotting.lag_plot(pd.Series(nile), lag=1, ax=ax[0])  # 滞后散点图
plot_acf(nile, lags=20, ax=ax[1])                      # 带巴特利特界限的 ACF 图
fig.tight_layout()
fig.savefig("nile_acf.png", dpi=120)
```
:::

::: info 史话：从“相关周期图”到 Box–Jenkins
用序列与自身平移副本的相关来研究时间序列，至少可以追溯到 20 世纪初对气象和经济周期的研究。1926 年，尤尔在讨论“时间序列之间为什么会出现无意义的相关”时，系统地使用了序列相关（serial correlation），这正是今天的自相关。“平稳过程”的严格理论则是 20 世纪 30—40 年代由苏联数学家辛钦（А. Я. Хинчин）和柯尔莫哥洛夫（А. Н. Колмогоров）建立的，沃尔德的分解定理也诞生于这一时期。1970 年 Box 与 Jenkins 把样本 ACF、PACF 作为识别模型的主要工具，1978 年 Ljung 与 Box 提出了改进的混成检验统计量，这些方法从此成为时间序列分析的日常工具。
:::

## 延伸阅读

- P. J. Brockwell, R. A. Davis《时间序列：理论与方法》第 1、7 章：平稳过程、样本自相关的渐近分布（巴特利特公式）。
- J. D. Hamilton《时间序列分析》第 3 章：平稳性与遍历性。
- 王燕《应用时间序列分析》第 2 章：平稳性检验与纯随机性检验。
