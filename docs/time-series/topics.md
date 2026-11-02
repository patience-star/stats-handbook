# 拓展：谱、GARCH、协整与卡尔曼

到这里，一元线性的 ARIMA 框架已经完整了。这一章向四个方向各迈出一步，每一个方向都是一个独立的大领域：

- **谱分析**：换一个角度，从“频率”而不是“滞后”来看平稳序列；
- **ARCH 与 GARCH**：均值不可预测，但 **波动** 可以预测；
- **协整与误差修正**：几条各自游荡的序列之间，可能存在稳定的长期关系；
- **状态空间模型与卡尔曼滤波**：把看不见的“状态”与带噪声的观测分开，统一地处理预测、平滑与缺失值。

每一节都只讲最核心的思想，并配一个实验。

## 谱分析：从频率看时间序列 {.core}

::: core 周期图
长度为 $n$ 的序列总可以 **精确地** 写成一组正弦波之和，频率取 **傅里叶频率** $f_j=j/n$：
$$x_t=\bar x+\sum_j\big[a_j\cos(2\pi f_jt)+b_j\sin(2\pi f_jt)\big].$$
**周期图** 衡量各个频率的“能量”：
$$I(f_j)=\frac1n\Big|\sum_{t=1}^n(x_t-\bar x)\,e^{-2\pi if_jt}\Big|^2=\frac n4\big(a_j^2+b_j^2\big).$$
由帕塞瓦尔恒等式，$\sum_{j=1}^{n-1}I(f_j)=\sum_t(x_t-\bar x)^2$：周期图把样本方差 **分解到各个频率上**，峰所在的频率对应序列中最主要的周期 $1/f$。
:::

::: core 谱密度
设平稳序列的自协方差绝对可和，它的 **谱密度** 是自协方差函数的傅里叶变换：
$$f(\omega)=\frac1{2\pi}\sum_{k=-\infty}^{\infty}\gamma_ke^{-ik\omega},\qquad \gamma_k=\int_{-\pi}^{\pi}e^{ik\omega}f(\omega)\,\mathrm d\omega,\qquad \omega\in[-\pi,\pi].$$
特别地 $\gamma_0=\int f(\omega)\mathrm d\omega$：方差被分配到各个频率上。ARMA 模型的谱密度为
$$f(\omega)=\frac{\sigma^2}{2\pi}\,\frac{|\theta(e^{-i\omega})|^2}{|\phi(e^{-i\omega})|^2}.$$
白噪声的谱密度是常数 $\sigma^2/2\pi$，各个频率的能量相同，就像白光包含了所有颜色——“白噪声”因此得名。$\phi>0$ 的 AR(1) 能量集中在低频，路径缓慢起伏；有一对复根的 AR(2) 在伪周期附近有一个峰。
:::

::: geo 几何直观：ACF 与谱是同一件事的两种语言
ACF 告诉我们“相隔 $k$ 期的值有多相关”，谱密度告诉我们“各种周期的波动各占多少方差”，两者通过傅里叶变换一一对应。ACF 是衰减余弦波的序列，谱就在相应的频率处有峰；ACF 衰减得越慢（越接近确定的周期），峰就越尖。
:::

::: pitfall 周期图不是谱密度的相合估计
$n$ 增大时，周期图的点变密了，但每个点的波动 **并不减小**：在适当条件下 $I(f_j)$ 近似服从均值为 $2\pi f(\omega_j)$ 的指数分布。所以原始周期图总是参差不齐。常用的办法是把相邻的若干个值平均（Daniell 窗等核平滑），以略微模糊频率为代价换取稳定性；或者先拟合 AR 模型，再用模型的谱密度作估计。
:::

<Periodogram />

**试一试**

1. 太阳黑子：最高峰对应的周期是多少年？（著名的太阳活动周期约为 11 年。）低频处还有一个峰，周期接近一百年，这与“格莱斯伯格周期”有关。
2. 猞猁：峰在哪里？与“[ARMA 模型](/time-series/arma)”一章的伪周期相比如何？
3. 模拟 AR(2)：把平滑窗口调大，平滑后的曲线是否逐渐接近理论谱？为什么谱的峰值对应的周期（约 8.7 期）与 ACF 的伪周期（8 期）不完全相同？
4. 白噪声：理论谱是一条水平线，原始周期图却高低悬殊——这就是“不相合”。打开对数纵轴看看。

::: example 例 1　太阳黑子的周期
1700—1988 年的年均太阳黑子数（$n=289$）的周期图在 $j=26$ 处最高，$f=26/289\approx0.090$，对应周期 $289/26\approx11.1$ 年。其次的几个峰对应约 10.0 年、12.0 年和约 96 年。尤尔在 1927 年用 AR(2) 模型拟合太阳黑子数，得到了与约 11 年的太阳周期相近的伪周期；谱分析从另一个方向印证了这一结果。
:::

## ARCH 与 GARCH：波动的聚集 {.core}

股票、汇率等金融资产的收益率有几个共同的特征：收益率本身几乎不相关（难以预测涨跌），但收益率的平方或绝对值有明显的正相关——**大的波动后面往往跟着大的波动，平静之后往往还是平静**，称为 **波动聚集**；收益率的分布比正态分布有更厚的尾部。ARMA 模型假定冲击的方差不变，描述不了这些特征。

::: core ARCH 与 GARCH 模型
设收益率 $r_t=\sigma_tz_t$，$z_t$ 独立同分布于 $N(0,1)$，$\sigma_t$ 是 **条件标准差**（已知过去时对今天波动的预期）。

- **ARCH($q$)**（Engle，1982）：$\sigma_t^2=\omega+\alpha_1r_{t-1}^2+\cdots+\alpha_qr_{t-q}^2$；
- **GARCH(1,1)**（Bollerslev，1986）：$\sigma_t^2=\omega+\alpha\,r_{t-1}^2+\beta\,\sigma_{t-1}^2$。

要求 $\omega>0$，$\alpha,\beta\ge0$，$\alpha+\beta<1$。这时 $r_t$ 是方差为 $\dfrac{\omega}{1-\alpha-\beta}$ 的白噪声：不相关，但并不独立。
:::

::: geo 几何直观：一个会自己调整宽窄的包络
把 $\pm2\sigma_t$ 画在收益率的两侧，就是一条宽窄不断变化的包络。今天出现一个大的冲击，$r_t^2$ 很大，明天的 $\sigma_{t+1}^2$ 就被抬高（$\alpha$ 控制抬高的幅度）；此后包络逐渐收窄，每期以 $\alpha+\beta$ 的比率回到长期水平（$\beta$ 控制记忆的长短）。$\alpha+\beta$ 称为 **持续性**，越接近 1，波动聚集越明显。
:::

::: insight 平方的 ARMA 表示
记 $v_t=r_t^2-\sigma_t^2$，它的条件期望为 0。代入 GARCH(1,1) 得
$$r_t^2=\omega+(\alpha+\beta)\,r_{t-1}^2+v_t-\beta\,v_{t-1},$$
即 **$r_t^2$ 是一个 ARMA(1,1)**：它的 ACF 以 $\alpha+\beta$ 的比率衰减。这解释了为什么在实验中 $r$ 的 ACF 落在界限内、$r^2$ 的 ACF 却明显为正。四阶矩存在时，$r_t$ 的峰度为
$$\frac{3\big[1-(\alpha+\beta)^2\big]}{1-(\alpha+\beta)^2-2\alpha^2}>3,$$
条件正态的冲击，经过波动的随机变化，就产生了厚尾的边际分布。
:::

<GarchLab />

**试一试**

1. “同方差”（$\alpha=\beta=0$）：$r$ 与 $r^2$ 的 ACF 都落在界限内，峰度接近 3。
2. “典型的日收益率”（$\alpha=0.08$，$\beta=0.9$）：包络时宽时窄，$r^2$ 的 ACF 缓慢衰减，Ljung–Box 检验对 $r$ 不显著、对 $r^2$ 高度显著。
3. “ARCH(1)”（$\alpha=0.5$）：冲击后的波动来得快、去得也快，$r^2$ 的 ACF 很快衰减；峰度的理论值是多少？
4. 让 $\alpha+\beta$ 接近 1：波动冲击的半衰期怎样变化？

::: example 例 2　波动的半衰期
对股票指数的日收益率，GARCH(1,1) 的估计值常在 $\alpha\approx0.05\sim0.10$、$\beta\approx0.85\sim0.94$ 之间，$\alpha+\beta$ 接近 1。若 $\alpha=0.08$，$\beta=0.90$，则波动冲击的半衰期为 $\ln0.5/\ln0.98\approx34$ 个交易日，约一个半月。这样的模型被广泛用于风险价值（VaR）的计算和期权定价中的波动率预测。
:::

## 协整与误差修正模型 {.core}

上一章看到，两条独立的随机游走之间的回归是伪回归。但经济中也有许多 $I(1)$ 序列 **一起游荡**：同一种商品在两个市场的价格、现货与期货价格、收入与消费。它们各自没有固定的均值，相互之间的差距却稳定在某个范围内。

::: core 定义（协整）
设 $x_t,y_t$ 都是 $I(1)$ 序列。若存在常数 $\beta$，使 $y_t-\beta x_t$ 是平稳的 $I(0)$ 序列，称 $x_t$ 与 $y_t$ **协整**，$(1,-\beta)$ 称为 **协整向量**，$y_t=\beta x_t$ 描述了二者的 **长期均衡关系**，$u_t=y_t-\beta x_t$ 是对均衡的偏离。
:::

::: geo 几何直观：一根绳子
把两条序列想象成一个醉汉和一条狗，各自都在随机游走，谁也预测不了下一步去哪里；但它们之间拴着一根绳子，彼此的距离不会无限增大。没有协整时，两条路径会越走越远；有协整时，散点图沿着一条直线分布，回归残差在 0 附近来回波动。
:::

::: core Engle–Granger 两步法
1. 用最小二乘回归 $y_t=a+\beta x_t+u_t$，得到残差 $\hat u_t$。协整时 $\hat\beta$ 以 $1/n$ 的速度收敛（**超相合**），比通常的 $1/\sqrt n$ 快得多。
2. 对 $\hat u_t$ 作（不含常数项的）ADF 检验，原假设为“无协整”。由于 $\hat u_t$ 是用估计的 $\beta$ 得到的，临界值比普通的 DF 检验更低：两个变量、$n=100$ 时 5% 的临界值约为 −3.40。
:::

<RandomWalkPair initial="coint" />

::: core 误差修正模型
Granger 表示定理指出：协整的序列一定可以写成 **误差修正模型**（ECM）
$$\nabla y_t=\gamma\,(y_{t-1}-\beta x_{t-1})+\delta\,\nabla x_t+\varepsilon_t,\qquad\gamma<0.$$
上一期偏离均衡（$y_{t-1}-\beta x_{t-1}>0$）时，本期的 $y$ 倾向于下降，把偏离修正回来；$|\gamma|$ 是每期修正的比例。它同时描述了 **短期的动态**（差分）与 **长期的均衡**（水平），避免了“只用差分就丢掉长期关系”的问题。
:::

::: pitfall 协整分析的注意事项
- 两步法的结果依赖于把哪个变量放在左边，变量多于两个时可能有多个协整向量，这时应使用 Johansen 的极大似然方法。
- 协整检验与单位根检验一样，势较低，样本期太短或有结构突变时容易得出错误的结论。
:::

## 状态空间模型与卡尔曼滤波 {.core}

::: core 状态空间模型
把序列分成两层：看不见的 **状态** $\alpha_t$ 按 **状态方程** 演化，观测值 $y_t$ 是状态加上噪声：
$$y_t=Z\alpha_t+\varepsilon_t,\qquad \alpha_{t+1}=T\alpha_t+\eta_t.$$
最简单的例子是 **局部水平模型**：
$$y_t=\mu_t+\varepsilon_t,\quad \varepsilon_t\sim N(0,\sigma_\varepsilon^2);\qquad \mu_{t+1}=\mu_t+\eta_t,\quad \eta_t\sim N(0,\sigma_\eta^2).$$
真实的水平 $\mu_t$ 是一条随机游走，我们只能透过噪声看到它。ARIMA 模型、指数平滑以及带有时变参数的回归，都可以写成状态空间的形式。
:::

::: core 卡尔曼滤波（局部水平模型）
设已知到 $t-1$ 期为止的信息时，$\mu_t$ 的预测为 $a_t$，预测方差为 $P_t$。观测到 $y_t$ 后：
$$v_t=y_t-a_t,\quad F_t=P_t+\sigma_\varepsilon^2,\quad K_t=\frac{P_t}{F_t},$$
$$a_{t|t}=a_t+K_tv_t,\qquad P_{t|t}=P_t(1-K_t),$$
再向前一步：$a_{t+1}=a_{t|t}$，$P_{t+1}=P_{t|t}+\sigma_\eta^2$。$K_t$ 称为 **卡尔曼增益**。同时，由预测误差分解，对数似然为
$$\ln L=-\frac12\sum_t\Big(\ln(2\pi F_t)+\frac{v_t^2}{F_t}\Big),$$
最大化它就得到 $\sigma_\varepsilon^2$ 与 $\sigma_\eta^2$ 的极大似然估计。
:::

::: geo 几何直观：按精度加权的平均
$a_{t|t}=(1-K_t)\,a_t+K_t\,y_t$ 是“原来的预测”与“新的观测”的加权平均，权数与各自的方差成反比：原来的预测越不确定（$P_t$ 大），越相信新观测；观测噪声越大（$\sigma_\varepsilon^2$ 大），越相信原来的预测。这与“[贝叶斯估计](/inference/bayesian)”一章的正态–正态共轭完全相同：先验是 $N(a_t,P_t)$，似然来自 $y_t$，后验均值就是二者按精度加权。卡尔曼滤波就是 **逐期进行的贝叶斯更新**。
:::

::: insight 卡尔曼滤波与指数平滑
增益 $K_t$ 会很快收敛到稳态值 $\bar K=\dfrac{\bar P}{\bar P+\sigma_\varepsilon^2}$，其中 $\bar P=\sigma_\varepsilon^2\,\dfrac{q+\sqrt{q^2+4q}}{2}$，$q=\sigma_\eta^2/\sigma_\varepsilon^2$ 是 **信噪比**。稳态下 $a_{t+1}=a_t+\bar K(y_t-a_t)$——这正是平滑系数 $\alpha=\bar K$ 的简单指数平滑！局部水平模型、ARIMA(0,1,1) 与简单指数平滑是同一个模型的三种写法，而状态空间形式额外给出了似然函数、预测区间，以及处理缺失值的自然方法（缺失时只做预测、不做更新）。
:::

<KalmanNile />

**试一试**

1. 点“水平不变”：$\sigma_\eta^2=0$，滤波值逐渐稳定在全部数据的均值附近，增益趋于 0。
2. 点“紧跟数据”：$q$ 很大，滤波值几乎就是观测值本身，增益接近 1，对数似然也变差了。
3. 点“极大似然估计”：估计值是多少？1898 年前后滤波水平怎样变化？
4. 在极大似然估计的基础上只增大 $\sigma_\varepsilon^2$：阴影变宽还是变窄？滤波值变得更平滑还是更曲折？

::: example 例 3　尼罗河的水平
对 1871—1970 年的尼罗河流量拟合局部水平模型，极大似然估计为 $\hat\sigma_\varepsilon^2=15099$，$\hat\sigma_\eta^2=1469.1$，信噪比 $q\approx0.097$，对数似然 −632.54。（似然曲面沿某个方向很平，不同的优化算法会停在略有不同的位置：下面代码中 statsmodels 给出 15078 与 1478.8，对数似然相同。）稳态增益 $\bar K\approx0.267$，与“[指数平滑与预测评价](/time-series/smoothing)”一章对尼罗河拟合 ARIMA(0,1,1) 得到的 $\alpha=1+\hat\theta\approx0.267$ 一致。

滤波得到的水平在 1897 年约为 1145，1899 年降到约 1037，1901 年约 955，此后大致在 800 到 900 之间缓慢波动。流量在 19 世纪末出现了一次持久的下降，对它的原因有不同的解释：有人归于那一时期的气候变化，也有人联系到同一时期开工的阿斯旺第一座水坝。局部水平模型不必事先知道突变的时刻，就能自动地“跟上”水平的变化。
:::

## 本章小结

- **谱分析**：周期图把方差分解到各个频率上；谱密度是 ACF 的傅里叶变换；周期图不相合，需要平滑。太阳黑子约 11 年的周期在周期图上一目了然。
- **GARCH(1,1)**：$\sigma_t^2=\omega+\alpha r_{t-1}^2+\beta\sigma_{t-1}^2$；收益率不相关但不独立，$r_t^2$ 是 ARMA(1,1)，持续性 $\alpha+\beta$；厚尾。
- **协整**：$I(1)$ 序列的线性组合平稳，表示长期均衡；Engle–Granger 两步法；误差修正模型同时刻画短期动态与长期均衡。
- **卡尔曼滤波**：逐期的贝叶斯更新，增益由信噪比决定；用预测误差分解计算似然；局部水平模型 ⟺ ARIMA(0,1,1) ⟺ 简单指数平滑。

| 主题 | 核心公式 |
| --- | --- |
| 周期图 | $I(f_j)=\frac1n\lvert\sum(x_t-\bar x)e^{-2\pi if_jt}\rvert^2$ |
| ARMA 的谱密度 | $f(\omega)=\frac{\sigma^2}{2\pi}\lvert\theta(e^{-i\omega})\rvert^2/\lvert\phi(e^{-i\omega})\rvert^2$ |
| GARCH(1,1) | $\sigma_t^2=\omega+\alpha r_{t-1}^2+\beta\sigma_{t-1}^2$，无条件方差 $\omega/(1-\alpha-\beta)$ |
| 误差修正模型 | $\nabla y_t=\gamma(y_{t-1}-\beta x_{t-1})+\delta\nabla x_t+\varepsilon_t$ |
| 卡尔曼更新 | $a_{t\mid t}=a_t+K_t(y_t-a_t)$，$K_t=P_t/(P_t+\sigma_\varepsilon^2)$ |

## 分层练习

### 基础

**1.** AR(1) 模型 $x_t=\phi x_{t-1}+\varepsilon_t$ 的谱密度为 $f(\omega)=\dfrac{\sigma^2}{2\pi(1-2\phi\cos\omega+\phi^2)}$。求 $\phi=0.5$ 时 $f(0)/f(\pi)$，并说明 $\phi>0$ 与 $\phi<0$ 时路径的差别。

::: details 解答
$f(0)/f(\pi)=\dfrac{1+2\phi+\phi^2}{1-2\phi+\phi^2}=\dfrac{(1+\phi)^2}{(1-\phi)^2}=\dfrac{2.25}{0.25}=9$。$\phi>0$ 时能量集中在低频，路径缓慢起伏；$\phi<0$ 时能量集中在高频（$\omega=\pi$，即周期 2 期），路径在均值两侧来回跳动。
:::

**2.** GARCH(1,1) 模型 $\omega=0.02$，$\alpha=0.08$，$\beta=0.90$。求无条件方差、波动冲击的半衰期和收益率的峰度。

::: details 解答
无条件方差 $0.02/(1-0.98)=1$；半衰期 $\ln0.5/\ln0.98\approx34.3$ 期；峰度 $\dfrac{3(1-0.9604)}{1-0.9604-0.0128}=\dfrac{0.1188}{0.0268}\approx4.43$。
:::

**3.** 设 $x_t$ 是随机游走，$y_t=2+0.8x_t+u_t$，$u_t=0.5u_{t-1}+e_t$。说明 $x_t,y_t$ 协整，并写出 $y_t$ 的误差修正形式。

::: details 解答
$x_t\sim I(1)$，$y_t$ 含有 $0.8x_t$，也是 $I(1)$；而 $y_t-0.8x_t=2+u_t$ 平稳，所以协整，协整向量 $(1,-0.8)$。差分：
$$\nabla y_t=0.8\nabla x_t+u_t-u_{t-1}=0.8\nabla x_t-0.5\,u_{t-1}+e_t=0.8\nabla x_t-0.5\,(y_{t-1}-2-0.8x_{t-1})+e_t.$$
误差修正系数 $\gamma=-0.5$：每期修正上一期偏离的一半。
:::

**4.** 局部水平模型中，$\mu_t$ 的预测为 $a_t=1000$，预测方差 $P_t=5000$，$\sigma_\varepsilon^2=15000$。观测到 $y_t=800$ 后，求卡尔曼增益、更新后的估计 $a_{t|t}$ 及其方差。

::: details 解答
$K_t=5000/(5000+15000)=0.25$；$a_{t|t}=1000+0.25\times(800-1000)=950$；$P_{t|t}=5000\times0.75=3750$。观测值比预测低 200，但观测噪声较大，估计只下调了四分之一，即 50。
:::

### 提高

**5.** 推导局部水平模型的稳态预测方差 $\bar P$，并用例 3 的估计值验证 $\bar K\approx0.267$。

::: details 解答
稳态时 $\bar P=\dfrac{\bar P\sigma_\varepsilon^2}{\bar P+\sigma_\varepsilon^2}+\sigma_\eta^2$，整理得 $\bar P^2-\sigma_\eta^2\bar P-\sigma_\eta^2\sigma_\varepsilon^2=0$，取正根 $\bar P=\dfrac{\sigma_\eta^2+\sqrt{\sigma_\eta^4+4\sigma_\eta^2\sigma_\varepsilon^2}}{2}=\sigma_\varepsilon^2\dfrac{q+\sqrt{q^2+4q}}{2}$。

例 3 中 $q=1469.1/15099\approx0.0973$，$\bar P\approx15099\times\dfrac{0.0973+0.6313}{2}\approx5501$，$\bar K=5501/(5501+15099)\approx0.267$。
:::

**6.** 证明 GARCH(1,1) 的 $r_t^2$ 满足 ARMA(1,1) 方程 $r_t^2=\omega+(\alpha+\beta)r_{t-1}^2+v_t-\beta v_{t-1}$，其中 $v_t=r_t^2-\sigma_t^2$，并说明 $v_t$ 的条件期望为 0。

::: details 解答
$E(r_t^2\mid\text{过去})=\sigma_t^2E(z_t^2)=\sigma_t^2$，所以 $E(v_t\mid\text{过去})=0$。把 $\sigma_t^2=r_t^2-v_t$、$\sigma_{t-1}^2=r_{t-1}^2-v_{t-1}$ 代入 $\sigma_t^2=\omega+\alpha r_{t-1}^2+\beta\sigma_{t-1}^2$：
$$r_t^2-v_t=\omega+\alpha r_{t-1}^2+\beta(r_{t-1}^2-v_{t-1}),$$
移项即得。AR 系数是 $\alpha+\beta$，所以 $r_t^2$ 的 ACF 按 $(\alpha+\beta)^k$ 的速度衰减（从滞后 1 起）。
:::

### 挑战

**7.** 证明周期图的帕塞瓦尔恒等式：$\sum_{j=0}^{n-1}I(f_j)=\sum_{t=1}^n(x_t-\bar x)^2$，其中 $I(f_0)=0$。

::: details 解答
记 $d_t=x_t-\bar x$，$D_j=\sum_td_te^{-2\pi ijt/n}$。则
$$\sum_{j=0}^{n-1}|D_j|^2=\sum_{s,t}d_sd_t\sum_{j=0}^{n-1}e^{-2\pi ij(s-t)/n}=\sum_{s,t}d_sd_t\cdot n\,\mathbb 1(s=t)=n\sum_td_t^2,$$
因为单位根之和 $\sum_je^{-2\pi ijm/n}$ 在 $m\not\equiv0$ 时为 0。两边除以 $n$ 即得；$D_0=\sum d_t=0$，所以 $I(f_0)=0$。
:::

**8.** 设先验 $\mu\sim N(a,P)$，观测 $y\mid\mu\sim N(\mu,\sigma^2)$。证明后验分布为 $N\big(a+K(y-a),\ P(1-K)\big)$，$K=P/(P+\sigma^2)$，从而说明卡尔曼更新就是贝叶斯公式。

::: details 解答
后验密度 $\propto\exp\Big(-\dfrac{(\mu-a)^2}{2P}-\dfrac{(y-\mu)^2}{2\sigma^2}\Big)$，指数是 $\mu$ 的二次式，所以后验是正态分布，精度相加：$\dfrac1{P'}=\dfrac1P+\dfrac1{\sigma^2}$，即 $P'=\dfrac{P\sigma^2}{P+\sigma^2}=P(1-K)$；均值按精度加权：
$$a'=P'\Big(\frac aP+\frac y{\sigma^2}\Big)=\frac{\sigma^2a+Py}{P+\sigma^2}=a+\frac{P}{P+\sigma^2}(y-a)=a+K(y-a).$$
这正是卡尔曼滤波的更新步骤；状态方程 $\mu_{t+1}=\mu_t+\eta_t$ 再把方差加上 $\sigma_\eta^2$，作为下一期的先验。
:::

## 代码实现（Python）

::: details 展开代码：周期图、GARCH 极大似然、协整检验与卡尔曼滤波
```python
import numpy as np
import statsmodels.api as sm
from scipy import optimize, signal
from statsmodels.tsa.stattools import coint
from statsmodels.tsa.statespace.structural import UnobservedComponents

# 1. 周期图：statsmodels 自带的太阳黑子数据（个别年份与 R 的版本有 0.1～0.2 的出入）
sun = sm.datasets.sunspots.load_pandas().data["SUNACTIVITY"].values[:289]   # 1700—1988 年
f, I = signal.periodogram(sun, detrend="constant", scaling="spectrum")
j = np.argmax(I[1:]) + 1
print(f"太阳黑子：最高峰 f = {f[j]:.4f}，周期 {1 / f[j]:.2f} 年")

# 2. GARCH(1,1)：先模拟，再用极大似然估计
rng = np.random.default_rng(0)
n, w, a, b = 3000, 0.02, 0.08, 0.90
r, s2 = np.empty(n), w / (1 - a - b)
for t in range(n):
    s2 = w + a * r[t - 1] ** 2 + b * s2 if t else s2
    r[t] = np.sqrt(s2) * rng.standard_normal()

def negloglik(p):
    w, a, b = p
    if w <= 0 or a < 0 or b < 0 or a + b >= 1:
        return np.inf
    s2 = np.empty(n); s2[0] = r.var()
    for t in range(1, n):
        s2[t] = w + a * r[t - 1] ** 2 + b * s2[t - 1]
    return 0.5 * np.sum(np.log(2 * np.pi * s2) + r ** 2 / s2)

est = optimize.minimize(negloglik, [0.05, 0.1, 0.8], method="Nelder-Mead")
print("GARCH 估计 (ω, α, β)：", est.x.round(3))

# 3. 协整：Engle–Granger 检验与误差修正模型
x = rng.standard_normal(200).cumsum()
u = np.zeros(200)
for t in range(1, 200):
    u[t] = 0.5 * u[t - 1] + rng.standard_normal()
y = 2 + 0.8 * x + u
stat, p, crit = coint(y, x)
print(f"Engle–Granger：统计量 {stat:.2f}，p = {p:.4f}，5% 临界值 {crit[1]:.2f}")
resid = sm.OLS(y, sm.add_constant(x)).fit().resid
X = sm.add_constant(np.column_stack([resid[:-1], np.diff(x)]))
print("误差修正模型 [常数, γ, δ]：", sm.OLS(np.diff(y), X).fit().params.round(3))

# 4. 卡尔曼滤波：尼罗河流量的局部水平模型
nile = sm.datasets.nile.load_pandas().data["volume"].values
res = UnobservedComponents(nile, level="llevel").fit(disp=False)
print("观测噪声与水平变化的方差：", res.params.round(1), " 对数似然", round(res.llf, 2))
print("1897、1899、1901 年的滤波水平：", res.filtered_state[0][[26, 28, 30]].round(1))
```
:::

::: info 史话：四条道路
谱分析的思想可以追溯到 19 世纪末舒斯特（A. Schuster）用周期图寻找气象数据中的“隐周期”，维纳与辛钦在 20 世纪 30 年代建立了平稳过程的谱理论。1960 年，卡尔曼（R. E. Kalman）发表了以他的名字命名的滤波算法，很快被用于阿波罗登月计划的导航；后来 Harvey、Durbin 与 Koopman 等人把它系统地引入时间序列分析。1982 年恩格尔（R. F. Engle）提出 ARCH 模型，1987 年他又与格兰杰（C. W. J. Granger）提出协整与误差修正的检验方法。2003 年，两人因这两项工作共同获得诺贝尔经济学奖。
:::

## 延伸阅读

- P. J. Brockwell, R. A. Davis《时间序列：理论与方法》第 4、10 章：谱分析与谱估计。
- R. S. Tsay《金融时间序列分析》：ARCH/GARCH 模型及其扩展，金融数据的实例丰富。
- J. D. Hamilton《时间序列分析》第 13、19 章：卡尔曼滤波与协整。
- J. Durbin, S. J. Koopman. *Time Series Analysis by State Space Methods*（第 2 版）：局部水平模型与尼罗河数据是全书的第一个例子。
