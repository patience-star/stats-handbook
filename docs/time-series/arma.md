# ARMA 模型

黄书把时间序列分解为长期趋势、季节变动、循环变动和不规则变动，其中“不规则变动”被当作无法分析的残余。现代时间序列分析的出发点恰好相反：剩下的波动往往 **有结构**——今天的值和昨天相关，今天的冲击会在明天留下回声。ARMA 模型是描述这种结构的基本语言。

本章假定序列已经平稳（必要时先去掉趋势和季节）。平稳性、自协方差和自相关函数的系统讨论在“[平稳性与自相关](/time-series/stationarity)”一章；下面先把要用到的概念过一遍。

## 预备：白噪声、自相关与滞后算子

::: core 白噪声与自相关函数
若 $\{\varepsilon_t\}$ 满足 $E\varepsilon_t=0$，$\operatorname{Var}(\varepsilon_t)=\sigma^2$，且 $t\neq s$ 时 $\operatorname{Cov}(\varepsilon_t,\varepsilon_s)=0$，称为 **白噪声**，记作 $\varepsilon_t\sim WN(0,\sigma^2)$。

对（宽）平稳序列 $\{X_t\}$，均值 $\mu$ 不随时间变化，协方差只依赖于时间间隔 $k$：
$$\gamma_k=\operatorname{Cov}(X_t,X_{t+k}),\qquad \rho_k=\frac{\gamma_k}{\gamma_0}.$$
$\gamma_k$ 称为 **自协方差函数**，$\rho_k$ 称为 **自相关函数（ACF）**。白噪声的 ACF 在 $k\ge1$ 时全为 0：它没有记忆。
:::

::: core 滞后算子
**滞后算子** $B$ 把序列向后推一期：$BX_t=X_{t-1}$，$B^kX_t=X_{t-k}$。差分算子 $\nabla=1-B$，即 $\nabla X_t=X_t-X_{t-1}$。有了滞后算子，多项式可以直接作用在序列上，例如 $(1-0.5B)X_t=X_t-0.5X_{t-1}$。
:::

::: pitfall MA 系数的符号约定
本站把 MA 部分写成 $X_t=\varepsilon_t+\theta_1\varepsilon_{t-1}+\cdots$，取加号，与 statsmodels 以及 Brockwell–Davis 的教材一致。Box 与 Jenkins 的原著和国内不少教材写作 $X_t=\varepsilon_t-\theta_1\varepsilon_{t-1}-\cdots$。两种写法的 $\theta$ 差一个负号，对照公式和软件输出时要留意。
:::

## MA(q)：冲击的有限回声 {.core}

::: core 定义（滑动平均模型）
$$X_t=\varepsilon_t+\theta_1\varepsilon_{t-1}+\cdots+\theta_q\varepsilon_{t-q}=\theta(B)\,\varepsilon_t,$$
其中 $\varepsilon_t\sim WN(0,\sigma^2)$，$\theta(B)=1+\theta_1B+\cdots+\theta_qB^q$，$\theta_q\neq0$。称 $\{X_t\}$ 为 **$q$ 阶滑动平均模型**，记作 MA($q$)。
:::

MA($q$) 总是平稳的：它是有限个白噪声的线性组合，均值为 0，方差和协方差都不随时间变化。记 $\theta_0=1$，直接计算得
$$\gamma_k=\begin{cases}\sigma^2\sum_{j=0}^{q-k}\theta_j\theta_{j+k}, & 0\le k\le q,\\[2pt] 0, & k>q.\end{cases}$$

::: geo 几何直观：滑动窗口的重叠
$X_t$ 和 $X_{t+k}$ 各是一个长度为 $q+1$ 的“窗口”里冲击的加权和。两个窗口重叠的部分，也就是共同的冲击，带来了相关性。$k>q$ 时窗口不再重叠，没有共同的冲击，相关性就消失了。**ACF 在 $q$ 步之后截尾**，正是窗口不再重叠的结果。

以 MA(1) 为例：$X_t=\varepsilon_t+\theta\varepsilon_{t-1}$ 与 $X_{t+1}=\varepsilon_{t+1}+\theta\varepsilon_t$ 共享 $\varepsilon_t$，所以
$$\rho_1=\frac{\theta}{1+\theta^2},\qquad \rho_k=0\ \ (k\ge2).$$
:::

::: insight 为什么 MA 模型要求“可逆”
注意 $\dfrac{\theta}{1+\theta^2}=\dfrac{1/\theta}{1+1/\theta^2}$：参数 $\theta$ 与 $1/\theta$（配上适当的 $\sigma^2$）给出 **完全相同** 的自协方差函数，单凭数据无法区分。约定取 $|\theta|<1$ 的那一个，这时
$$\varepsilon_t=X_t-\theta X_{t-1}+\theta^2X_{t-2}-\cdots,$$
冲击 $\varepsilon_t$ 可以由现在和过去的观测值恢复出来，它就是一步预测的误差，称为 **新息**。这个条件叫 **可逆性**。一般地，MA($q$) 可逆 ⟺ $\theta(z)=0$ 的根都在单位圆外。
:::

::: quiz 0.4
MA(1) 模型 $X_t=\varepsilon_t+0.5\,\varepsilon_{t-1}$ 的一阶自相关系数 $\rho_1$ 是多少？
> $\rho_1=\theta/(1+\theta^2)=0.5/1.25=0.4$。$\theta/(1+\theta^2)$ 的最大值是 $1/2$，所以任何 MA(1) 的 $|\rho_1|$ 都不超过 0.5。
:::

## AR(1)：带漏损的记忆 {.core}

::: core 定义（一阶自回归模型）
$$X_t=\phi X_{t-1}+\varepsilon_t,\qquad\text{即}\quad (1-\phi B)\,X_t=\varepsilon_t.$$
:::

把模型反复代入自身：
$$X_t=\varepsilon_t+\phi\varepsilon_{t-1}+\phi^2\varepsilon_{t-2}+\cdots+\phi^{k-1}\varepsilon_{t-k+1}+\phi^{k}X_{t-k}.$$
当 $|\phi|<1$ 时，最后一项随 $k\to\infty$ 消失，$X_t=\sum_{j\ge0}\phi^j\varepsilon_{t-j}$ 是一个 MA($\infty$)，并且
$$\operatorname{Var}(X_t)=\frac{\sigma^2}{1-\phi^2},\qquad \rho_k=\phi^k.$$

::: geo 几何直观：冲击按几何级数衰减
在第 0 期加入一个单位冲击，它对第 $k$ 期的影响是 $\phi^k$，这叫 **脉冲响应**：

- $|\phi|<1$：影响按几何级数衰减，过去渐渐被遗忘，序列平稳；
- $\phi=1$：$X_t=X_{t-1}+\varepsilon_t$ 是 **随机游走**，冲击永不衰减，方差随时间线性增长，序列不平稳；
- $|\phi|>1$：冲击被不断放大，序列发散。

$\phi$ 越接近 1，记忆越长，ACF 衰减越慢，路径越“黏”；$\phi<0$ 时序列在均值两侧来回跳动，ACF 正负交替。
:::

::: insight AR 与 MA 的对偶
AR(1) 可以写成 MA($\infty$)，可逆的 MA(1) 可以写成 AR($\infty$)。这种对偶决定了它们的“指纹”：

- AR($p$) 的 ACF **拖尾**（无穷多项不为 0，但逐渐衰减），PACF 在 $p$ 步之后 **截尾**；
- MA($q$) 的 ACF 在 $q$ 步之后 **截尾**，PACF **拖尾**。

这是识别模型阶数的主要依据，本章后面的实验可以直观地对比。
:::

## AR(2) 与平稳三角形 {.hard}

::: core 定义（二阶自回归模型）
$$X_t=\phi_1X_{t-1}+\phi_2X_{t-2}+\varepsilon_t,\qquad\text{即}\quad\phi(B)\,X_t=\varepsilon_t,\quad \phi(z)=1-\phi_1z-\phi_2z^2.$$
$\phi(z)$ 称为 **自回归多项式**。
:::

::: core 平稳（因果）条件
AR($p$) 存在平稳的因果解（$X_t$ 能写成现在与过去冲击的组合）⟺ $\phi(z)=0$ 的根全部在单位圆 **外**。对 AR(2)，这等价于参数落在三角形
$$\phi_1+\phi_2<1,\qquad \phi_2-\phi_1<1,\qquad |\phi_2|<1$$
之内。
:::

为什么是单位圆？$\phi(z)$ 可以分解为 $(1-\lambda_1z)(1-\lambda_2z)$，其中 $\lambda_1,\lambda_2$ 是方程 $\lambda^2-\phi_1\lambda-\phi_2=0$ 的根，也就是 $\phi(z)$ 的根的 **倒数**。于是
$$X_t=\frac{1}{(1-\lambda_1B)(1-\lambda_2B)}\,\varepsilon_t,$$
相当于把白噪声依次送进两个 AR(1) 型的“滤波器”。每个滤波器稳定的条件是 $|\lambda_i|<1$，即 $\phi(z)$ 的根 $1/\lambda_i$ 在单位圆外。

::: geo 几何直观：参数平面上的三角形
在 $(\phi_1,\phi_2)$ 平面上，平稳区域是以 $(-2,-1)$、$(2,-1)$、$(0,1)$ 为顶点的三角形。抛物线 $\phi_1^2+4\phi_2=0$ 把它分成两部分：

- 抛物线 **上方**：两个实根，ACF 是两个指数衰减的混合，可能正负交替；
- 抛物线 **下方**：一对共轭复根，ACF 是 **衰减的余弦波**，序列呈现“伪周期”。

三角形的三条边各对应一种根落到单位圆上的情形：$\phi_1+\phi_2=1$ 对应 $\lambda=1$，$\phi_2-\phi_1=1$ 对应 $\lambda=-1$，$\phi_2=-1$ 对应一对模为 1 的复根。
:::

<Ar2Lab />

**试一试**

1. 依次点“复根·周期 8”和“复根·慢衰减”：左图的点都在抛物线下方，右图出现一对共轭复根。比较两者的路径与 ACF，模 $r$ 和辐角 $\omega$ 分别控制什么？
2. 在右图中沿着单位圆内侧绕圈拖动复根（模不变、辐角改变），伪周期怎样变化？
3. 把左图的点慢慢拖向三角形的右边（$\phi_1+\phi_2\to1$），路径和 ACF 有什么变化？拖出三角形又会怎样？
4. 点“负根·正负交替”：ACF 为什么正负交替？两个倒数根各在哪里？

::: insight 复根与伪周期
ACF 满足与模型本身相同的差分方程 $\rho_k=\phi_1\rho_{k-1}+\phi_2\rho_{k-2}$，通解是 $c_1\lambda_1^k+c_2\lambda_2^k$。若倒数根是一对复根 $\lambda=re^{\pm i\omega}$（$0<r<1$），化成实数形式为
$$\rho_k=C\,r^k\cos(\omega k-\vartheta),$$
常数 $C,\vartheta$ 由 $\rho_0=1$ 和 $\rho_1=\phi_1/(1-\phi_2)$ 决定。**模 $r$ 控制衰减速度，辐角 $\omega$ 控制振荡频率**，伪周期为 $2\pi/\omega$。由韦达定理 $\lambda_1\lambda_2=-\phi_2$，$\lambda_1+\lambda_2=\phi_1$，得
$$r=\sqrt{-\phi_2},\qquad \cos\omega=\frac{\phi_1}{2\sqrt{-\phi_2}}.$$
这说明“周期”不一定来自确定性的正弦波：一个由随机冲击驱动的 AR(2) 就会表现出相当规律的起伏，只是周期和振幅都在漂移。
:::

::: example 例 1　猞猁的“十年周期”
加拿大猞猁的年捕获量（取以 10 为底的对数）是时间序列分析的经典数据，以约 10 年的周期起伏著称。Moran（1953）为它拟合的 AR(2) 模型系数约为 $\phi_1\approx1.41$，$\phi_2\approx-0.77$。求伪周期。

**解** $\phi_1^2+4\phi_2\approx1.99-3.08<0$，倒数根是一对复根，模 $r=\sqrt{0.77}\approx0.88$，
$$\cos\omega=\frac{1.41}{2\times0.88}\approx0.80,\qquad \omega\approx0.64,\qquad \frac{2\pi}{\omega}\approx9.9\ \text{年}.$$
一个只有两个参数的线性模型，就复现了著名的猞猁十年周期。
:::

::: pitfall 两种“特征根”
有的教材讨论方程 $\lambda^2-\phi_1\lambda-\phi_2=0$ 的根 $\lambda$，平稳条件是根在单位圆 **内**；有的教材讨论 $\phi(z)=1-\phi_1z-\phi_2z^2=0$ 的根 $z$，平稳条件是根在单位圆 **外**。二者互为倒数，说的是同一件事。statsmodels 的 `arroots` 给出的是 $z$；上面实验的复平面画的是 $\lambda$，读数里两者都有。
:::

::: quiz
下列 AR(2) 模型中，哪一个 **不** 平稳？
- [ ] $X_t=0.5X_{t-1}+0.3X_{t-2}+\varepsilon_t$
- [ ] $X_t=1.2X_{t-1}-0.5X_{t-2}+\varepsilon_t$
- [x] $X_t=0.6X_{t-1}+0.5X_{t-2}+\varepsilon_t$
- [ ] $X_t=-0.6X_{t-1}+0.2X_{t-2}+\varepsilon_t$

> 逐个检查三角形条件。C 中 $\phi_1+\phi_2=1.1>1$，有一个倒数根 $\lambda=(0.6+\sqrt{0.36+2})/2\approx1.07$ 在单位圆外，不平稳。其余三个都满足 $\phi_1+\phi_2<1$、$\phi_2-\phi_1<1$、$|\phi_2|<1$。
:::

## ARMA(p, q) 与因果性、可逆性 {.core}

::: core 定义（自回归滑动平均模型）
$$X_t-\phi_1X_{t-1}-\cdots-\phi_pX_{t-p}=\varepsilon_t+\theta_1\varepsilon_{t-1}+\cdots+\theta_q\varepsilon_{t-q},\qquad\text{即}\quad\phi(B)\,X_t=\theta(B)\,\varepsilon_t,$$
称为 ARMA($p,q$) 模型。要求 $\phi(z)$ 与 $\theta(z)$ 没有公共根，否则可以约去，模型有冗余。

- **因果性（平稳性）**：$\phi(z)$ 的根都在单位圆外。此时 $X_t=\psi(B)\varepsilon_t=\sum_{j\ge0}\psi_j\varepsilon_{t-j}$，且 $\sum_j|\psi_j|<\infty$；
- **可逆性**：$\theta(z)$ 的根都在单位圆外。此时 $\varepsilon_t=\pi(B)X_t=\sum_{j\ge0}\pi_jX_{t-j}$。
:::

**$\psi$ 权重**（也叫格林函数、脉冲响应）由 $\phi(z)\psi(z)=\theta(z)$ 比较系数得到：
$$\psi_0=1,\qquad \psi_j=\theta_j+\sum_{i=1}^{\min(j,p)}\phi_i\psi_{j-i}\quad(j\ge1),$$
其中 $j>q$ 时 $\theta_j=0$。例如 ARMA(1,1) 有 $\psi_j=(\phi+\theta)\phi^{j-1}$（$j\ge1$）。有了 $\psi$ 权重，自协方差就是 $\gamma_k=\sigma^2\sum_j\psi_j\psi_{j+k}$。

::: key 识别表：ACF 与 PACF 的“指纹”
| 模型 | ACF | PACF |
| --- | --- | --- |
| AR($p$) | 拖尾：指数衰减或衰减振荡 | $p$ 步后截尾 |
| MA($q$) | $q$ 步后截尾 | 拖尾 |
| ARMA($p,q$) | 拖尾：$k>q$ 后满足 AR 部分的递推 | 拖尾 |
:::

<AcfPacfLab />

**试一试**

1. 在 AR(1)、AR(2)、MA(1)、MA(2) 之间切换，对照识别表看理论值（竖线）的截尾与拖尾。
2. 再看样本值（空心点）：落在阴影带内的样本 ACF 大致可以看作 0。理论上截尾的地方，样本值会恰好为 0 吗？换几组随机冲击试试——实际识别总是带着噪声。
3. 选 MA(1)，分别令 $\theta_1=2$ 和 $\theta_1=0.5$，理论 ACF 有什么关系？哪一个可逆？
4. 选 ARMA(1,1)，令 $\theta_1=-\phi_1$，会发生什么？（提示：公共根。）

::: quiz 0.9
ARMA(1,1) 模型 $X_t=0.5X_{t-1}+\varepsilon_t+0.4\varepsilon_{t-1}$ 的 $\psi_1$ 是多少？
> $\psi_1=\theta_1+\phi_1\psi_0=0.4+0.5=0.9$；此后 $\psi_j=0.5\,\psi_{j-1}$，即 $0.45,\ 0.225,\dots$。
:::

## 偏自相关函数与 Yule–Walker 方程 {.hard}

把 AR($p$) 模型两边同乘 $X_{t-k}$（$k\ge1$）再取期望。由于 $\varepsilon_t$ 与过去的 $X$ 不相关，得到 **Yule–Walker 方程**：
$$\rho_k=\phi_1\rho_{k-1}+\phi_2\rho_{k-2}+\cdots+\phi_p\rho_{k-p},\qquad k\ge1.$$
取 $k=1,\dots,p$，写成矩阵形式
$$\begin{pmatrix}1&\rho_1&\cdots&\rho_{p-1}\\ \rho_1&1&\cdots&\rho_{p-2}\\ \vdots&&\ddots&\vdots\\ \rho_{p-1}&\rho_{p-2}&\cdots&1\end{pmatrix}\begin{pmatrix}\phi_1\\ \phi_2\\ \vdots\\ \phi_p\end{pmatrix}=\begin{pmatrix}\rho_1\\ \rho_2\\ \vdots\\ \rho_p\end{pmatrix}.$$
已知 $\rho_k$ 就能解出 $\phi$；用样本自相关 $r_k$ 代替 $\rho_k$，就得到参数的 **矩估计**，即 Yule–Walker 估计。

::: core 定义（偏自相关函数）
用 $X_{t-1},\dots,X_{t-k}$ 对 $X_t$ 作最佳线性预测
$$\hat X_t=\phi_{k1}X_{t-1}+\phi_{k2}X_{t-2}+\cdots+\phi_{kk}X_{t-k},$$
最后一个系数 $\phi_{kk}$ 称为滞后 $k$ 的 **偏自相关函数（PACF）**。它度量的是：去掉中间的 $X_{t-1},\dots,X_{t-k+1}$ 的线性影响之后，$X_t$ 与 $X_{t-k}$ 之间还剩下的相关性。系数 $\phi_{k1},\dots,\phi_{kk}$ 恰好是把 $p$ 换成 $k$ 的 Yule–Walker 方程的解。
:::

对 AR($p$)，当 $k>p$ 时最佳线性预测就是模型本身，多出来的 $X_{t-k}$ 不提供新信息，所以 $\phi_{kk}=0$。这就是 PACF 截尾的原因。

::: example 例 2　Yule–Walker 估计
某平稳序列的样本自相关为 $r_1=0.8$，$r_2=0.5$。用 AR(2) 拟合，求 $\phi_1,\phi_2$ 的 Yule–Walker 估计，并判断平稳性和伪周期。

**解** 解方程组 $\phi_1+r_1\phi_2=r_1$，$r_1\phi_1+\phi_2=r_2$，得
$$\hat\phi_1=\frac{r_1(1-r_2)}{1-r_1^2}=\frac{0.8\times0.5}{0.36}\approx1.111,\qquad \hat\phi_2=\frac{r_2-r_1^2}{1-r_1^2}=\frac{0.5-0.64}{0.36}\approx-0.389.$$
$\hat\phi_1+\hat\phi_2\approx0.722<1$，$\hat\phi_2-\hat\phi_1\approx-1.5<1$，$|\hat\phi_2|<1$，满足平稳条件。$\hat\phi_1^2+4\hat\phi_2\approx-0.32<0$，倒数根是一对复根，模 $r=\sqrt{0.389}\approx0.624$，$\cos\omega=1.111/(2\times0.624)\approx0.891$，$\omega\approx0.47$，伪周期约 $2\pi/0.47\approx13$ 期。由于 $r$ 较小，这个“周期”衰减得很快，在路径上并不明显。
:::

::: quiz -0.389 0.003
例 2 中滞后 2 的样本偏自相关 $\hat\phi_{22}$ 是多少？（保留三位小数）
> 用 AR(2) 拟合时的最后一个系数就是 $\hat\phi_{22}=\dfrac{r_2-r_1^2}{1-r_1^2}=\dfrac{0.5-0.64}{0.36}\approx-0.389$。
:::

:::: l3 深入：PACF 是投影，Durbin–Levinson 递推
把均值为 0、方差有限的随机变量看成向量，内积取 $\langle X,Y\rangle=E(XY)$，即协方差，就得到一个希尔伯特空间 $L^2$。在这个空间里：

- 用 $X_{t-1},\dots,X_{t-k}$ 对 $X_t$ 作 **最佳线性预测**，就是把 $X_t$ **正交投影** 到子空间 $\mathcal H_k=\operatorname{span}\{X_{t-1},\dots,X_{t-k}\}$ 上，预测误差与 $\mathcal H_k$ 正交；
- $\phi_{kk}$ 是 $X_t$ 与 $X_{t-k}$ 各自 **减去在 $\operatorname{span}\{X_{t-1},\dots,X_{t-k+1}\}$ 上的投影之后**，两个残差之间的相关系数。

对 AR($p$)，$\varepsilon_t=X_t-\sum_{i\le p}\phi_iX_{t-i}$ 与全部过去正交，所以 $k>p$ 时 $X_t$ 在 $\mathcal H_k$ 上的投影与在 $\mathcal H_p$ 上的投影相同，新增方向 $X_{t-k}$ 的系数为 0。

逐阶求解 Yule–Walker 方程不必每次重新解线性方程组。**Durbin–Levinson 递推** 利用了投影的嵌套结构：
$$\phi_{kk}=\frac{\rho_k-\sum_{j=1}^{k-1}\phi_{k-1,j}\,\rho_{k-j}}{1-\sum_{j=1}^{k-1}\phi_{k-1,j}\,\rho_j},\qquad \phi_{kj}=\phi_{k-1,j}-\phi_{kk}\,\phi_{k-1,k-j}\quad(j<k).$$
本站实验中的 PACF 就是用这个递推算出来的。

“条件期望是最佳预测，也是投影”的思想在“[协方差、相关与条件期望](/probability/dependence)”一章已经出现过，预测问题会在“[Box–Jenkins 建模与预测](/time-series/box-jenkins)”一章继续展开。
::::

## Wold 分解：ARMA 为什么够用 {.l3}

:::: l3 深入：Wold 分解定理
**Wold 分解定理**（1938）：任何均值为 0 的宽平稳序列都可以分解为
$$X_t=\sum_{j=0}^{\infty}\psi_j\varepsilon_{t-j}+V_t,\qquad \psi_0=1,\quad\sum_{j}\psi_j^2<\infty,$$
其中 $\varepsilon_t$ 是白噪声，恰好是一步线性预测的误差（新息）；$V_t$ 是可以由遥远的过去完全线性预测的“确定性”部分（例如随机振幅的正弦波），两部分互不相关。

对大多数实际序列 $V_t=0$，于是 **每个平稳序列都是一个（可能无穷阶的）MA 过程**。问题在于 MA($\infty$) 有无穷多个参数。ARMA 模型用 **有理函数** $\psi(z)=\theta(z)/\phi(z)$ 去逼近，只用 $p+q$ 个参数就能刻画无穷长的记忆。这就是 ARMA 模型的根本依据，也是 Box–Jenkins 方法强调 **简约**（parsimony）的原因。
::::

## 本章小结

- **MA($q$)**：冲击的有限回声。总是平稳；ACF 在 $q$ 步后截尾；要求可逆（$\theta(z)$ 的根在单位圆外）才能唯一识别。
- **AR($p$)**：带漏损的记忆。平稳 ⟺ $\phi(z)$ 的根在单位圆外 ⟺ 倒数根 $\lambda$ 在单位圆内；PACF 在 $p$ 步后截尾。
- **AR(2)**：平稳三角形；抛物线 $\phi_1^2+4\phi_2=0$ 下方是复根，ACF 是衰减余弦，伪周期 $2\pi/\omega$，衰减率 $r=\sqrt{-\phi_2}$。
- **ARMA($p,q$)**：$\phi(B)X_t=\theta(B)\varepsilon_t$；$\psi$ 权重递推；ACF 与 PACF 都拖尾。
- **PACF**：去掉中间变量影响后的相关，几何上是投影残差之间的相关；Yule–Walker 方程把 ACF 与 AR 系数联系起来。

| 模型 | 平稳条件 | ACF | PACF |
| --- | --- | --- | --- |
| MA(1)：$X_t=\varepsilon_t+\theta\varepsilon_{t-1}$ | 总是平稳（可逆：$\lvert\theta\rvert<1$） | $\rho_1=\dfrac{\theta}{1+\theta^2}$，之后为 0 | 拖尾 |
| AR(1)：$X_t=\phi X_{t-1}+\varepsilon_t$ | $\lvert\phi\rvert<1$ | $\rho_k=\phi^k$ | $\phi_{11}=\phi$，之后为 0 |
| AR(2) | $\phi_1+\phi_2<1$，$\phi_2-\phi_1<1$，$\lvert\phi_2\rvert<1$ | $\rho_1=\dfrac{\phi_1}{1-\phi_2}$，$\rho_k=\phi_1\rho_{k-1}+\phi_2\rho_{k-2}$ | $\phi_{22}=\phi_2$，之后为 0 |
| ARMA(1,1) | $\lvert\phi\rvert<1$（可逆：$\lvert\theta\rvert<1$） | $\rho_1=\dfrac{(1+\phi\theta)(\phi+\theta)}{1+2\phi\theta+\theta^2}$，$\rho_k=\phi\rho_{k-1}$ | 拖尾 |

## 分层练习

### 基础

**1.** 判断下列模型是否平稳：(a) $X_t=0.5X_{t-1}+\varepsilon_t$；(b) $X_t=1.2X_{t-1}-0.5X_{t-2}+\varepsilon_t$；(c) $X_t=X_{t-1}+\varepsilon_t$；(d) $X_t=0.6X_{t-1}+0.5X_{t-2}+\varepsilon_t$。

::: details 解答
(a) 平稳，$|\phi|=0.5<1$。(b) 平稳：$\phi_1+\phi_2=0.7<1$，$\phi_2-\phi_1=-1.7<1$，$|\phi_2|=0.5<1$；倒数根为 $0.6\pm0.374i$，模约 0.707。(c) 不平稳，这是随机游走，倒数根 $\lambda=1$ 在单位圆上。(d) 不平稳，$\phi_1+\phi_2=1.1>1$，有一个倒数根约为 1.07。
:::

**2.** 求 MA(2) 模型 $X_t=\varepsilon_t+0.6\varepsilon_{t-1}-0.3\varepsilon_{t-2}$ 的 $\rho_1,\rho_2,\rho_3$。

::: details 解答
$\gamma_0=\sigma^2(1+0.36+0.09)=1.45\sigma^2$；$\gamma_1=\sigma^2(\theta_1+\theta_1\theta_2)=\sigma^2(0.6-0.18)=0.42\sigma^2$；$\gamma_2=\sigma^2\theta_2=-0.3\sigma^2$；$\gamma_3=0$。所以 $\rho_1\approx0.290$，$\rho_2\approx-0.207$，$\rho_3=0$。
:::

**3.** AR(1) 模型 $X_t=0.8X_{t-1}+\varepsilon_t$，$\sigma^2=1$。求 $\operatorname{Var}(X_t)$ 和 $\rho_3$；一个单位冲击的影响在多少期后降到一半以下？

::: details 解答
$\operatorname{Var}(X_t)=1/(1-0.64)\approx2.778$，$\rho_3=0.8^3=0.512$。由 $0.8^k<0.5$ 得 $k>\ln0.5/\ln0.8\approx3.1$，所以 4 期后影响降到一半以下（“半衰期”约 3.1 期）。
:::

**4.** 某序列的样本 ACF 呈衰减振荡，样本 PACF 在滞后 1、2 显著，滞后 3 以后都落在 $\pm1.96/\sqrt n$ 以内。应初步识别为什么模型？

::: details 解答
ACF 拖尾、PACF 在 2 步后截尾，初步识别为 AR(2)；ACF 呈衰减振荡，说明倒数根很可能是一对复根。
:::

### 提高

**5.** 证明 MA(1) 的 $|\rho_1|\le\dfrac12$，并说明等号何时成立。

::: details 解答
$|\rho_1|=\dfrac{|\theta|}{1+\theta^2}$。由 $1+\theta^2\ge2|\theta|$ 得 $|\rho_1|\le\dfrac12$，等号当且仅当 $|\theta|=1$。这给出一个实用的检查：若样本 $r_1$ 明显超过 0.5、其余 $r_k$ 又都接近 0，那么 MA(1) 不是合适的模型。
:::

**6.** AR(2) 模型 $X_t=X_{t-1}-0.5X_{t-2}+\varepsilon_t$：求倒数根及其模与辐角，并求伪周期。

::: details 解答
$\lambda^2-\lambda+0.5=0$，$\lambda=\dfrac{1\pm i}{2}$，模 $r=\sqrt{0.5}\approx0.707$，辐角 $\omega=\pi/4$，伪周期 $2\pi/\omega=8$ 期。这正是实验中“复根·周期 8”的预设。
:::

**7.** 求 ARMA(1,1) 模型 $X_t=0.5X_{t-1}+\varepsilon_t+0.4\varepsilon_{t-1}$ 的 $\psi$ 权重和 $\rho_1$。

::: details 解答
$\psi_0=1$，$\psi_1=\phi+\theta=0.9$，$\psi_j=0.9\times0.5^{j-1}$（$j\ge1$）。
$$\rho_1=\frac{(1+\phi\theta)(\phi+\theta)}{1+2\phi\theta+\theta^2}=\frac{1.2\times0.9}{1+0.4+0.16}=\frac{1.08}{1.56}\approx0.692.$$
:::

### 挑战

**8.** 从“$\phi(z)=1-\phi_1z-\phi_2z^2$ 的根都在单位圆外”出发，推导 AR(2) 的平稳三角形。

::: details 解答
等价地，要求 $\lambda^2-\phi_1\lambda-\phi_2=0$ 的两根都在单位圆内。

**复根情形**（$\phi_1^2+4\phi_2<0$）：两根模相等，$|\lambda|^2=\lambda_1\lambda_2=-\phi_2$，条件是 $-\phi_2<1$。又因为 $\phi_2<-\phi_1^2/4\le0$，所以就是 $-1<\phi_2<-\phi_1^2/4$。这一块在三角形内：例如 $\phi_1+\phi_2<\phi_1-\phi_1^2/4=1-(\phi_1/2-1)^2\le1$，另一条边同理。

**实根情形**：记 $g(\lambda)=\lambda^2-\phi_1\lambda-\phi_2$。$g(1)>0$ 即 $\phi_1+\phi_2<1$，$g(-1)>0$ 即 $\phi_2-\phi_1<1$。这两条成立时，开口向上的抛物线在 $\pm1$ 处都为正，两个实根要么都在 $(-1,1)$ 内，要么同在 1 的右侧或同在 $-1$ 的左侧。后一种情况下 $|\lambda_1\lambda_2|=|\phi_2|>1$，所以再加上 $|\phi_2|<1$ 就把它排除了；反过来，两根都在 $(-1,1)$ 内时 $|\phi_2|=|\lambda_1\lambda_2|<1$ 自然成立。

两种情形合起来，正是 $\phi_1+\phi_2<1$、$\phi_2-\phi_1<1$、$|\phi_2|<1$ 围成的三角形。
:::

**9.** 用投影的观点证明：AR(1) 的偏自相关满足 $\phi_{kk}=0$（$k\ge2$）。

::: details 解答
设 $X_t=\phi X_{t-1}+\varepsilon_t$，$|\phi|<1$。由因果表示 $X_{t-j}=\sum_i\phi^i\varepsilon_{t-j-i}$，它只含 $t-j$ 及以前的冲击，所以 $\varepsilon_t$ 与 $X_{t-1},X_{t-2},\dots$ 都不相关（正交）。

对 $k\ge2$，候选预测 $\phi X_{t-1}$ 属于 $\mathcal H_k=\operatorname{span}\{X_{t-1},\dots,X_{t-k}\}$，且误差 $X_t-\phi X_{t-1}=\varepsilon_t$ 与 $\mathcal H_k$ 正交。由正交投影的唯一性，$\phi X_{t-1}$ 就是 $X_t$ 在 $\mathcal H_k$ 上的投影，系数为 $(\phi,0,\dots,0)$，所以最后一个系数 $\phi_{kk}=0$。
:::

## 代码实现（Python）

::: details 展开代码：用 statsmodels 分析 ARMA 模型
```python
import numpy as np
from statsmodels.tsa.arima_process import ArmaProcess
from statsmodels.tsa.stattools import acf, pacf

# statsmodels 的约定：AR 多项式写成 [1, -φ1, -φ2]，MA 多项式写成 [1, θ1]
proc = ArmaProcess(ar=[1, -1.0, 0.5], ma=[1])
print("平稳：", proc.isstationary, " 可逆：", proc.isinvertible)
print("φ(z) 的根 z：", proc.arroots.round(3), " 模：", np.abs(proc.arroots).round(3))
print("倒数根 λ = 1/z 的模：", (1 / np.abs(proc.arroots)).round(3))
print("理论 ACF： ", proc.acf(lags=9).round(3))
print("理论 PACF：", proc.pacf(lags=9).round(3))

# 模拟 500 期，计算样本 ACF / PACF
rng = np.random.default_rng(0)
x = proc.generate_sample(nsample=500, distrvs=rng.standard_normal)
print("样本 ACF： ", acf(x, nlags=8).round(3))
print("样本 PACF：", pacf(x, nlags=8).round(3))

# Yule–Walker 估计：用样本自相关解正文中的矩阵方程
r = acf(x, nlags=2)
phi_hat = np.linalg.solve([[1, r[1]], [r[1], 1]], r[1:3])
print("Yule–Walker 估计 φ1, φ2 =", phi_hat.round(3))

# ψ 权重（脉冲响应）
print("ψ 权重：", proc.arma2ma(lags=8).round(3))
```
:::

::: info 史话：从太阳黑子到 Box–Jenkins
1927 年，英国统计学家尤尔（G. U. Yule）用二阶自回归模型描述沃尔夫太阳黑子数，得到与约 11 年的太阳活动周期相近的伪周期，自回归模型由此诞生。同年，苏联经济学家斯卢茨基（E. Slutsky）指出：对纯随机冲击作滑动求和，就会产生看似有规律的循环，这为经济周期提供了一种全新的解释。1938 年，瑞典的沃尔德（H. Wold）证明了平稳序列的分解定理。1970 年，博克斯（G. E. P. Box）与詹金斯（G. M. Jenkins）出版《时间序列分析：预测与控制》，把识别、估计、诊断、预测整合成一套完整的建模方法，ARMA 模型从此成为时间序列分析的标准工具。
:::

## 延伸阅读

- 黄良文《统计学》时间序列分析一章：长期趋势、季节变动与循环变动的测定，是本章的出发点。
- 王燕《应用时间序列分析》：国内常用教材，例题丰富。
- P. J. Brockwell, R. A. Davis《时间序列：理论与方法》：第 3 章 ARMA 过程、第 5 章预测与 Durbin–Levinson 算法，严格而清晰。
- J. D. Hamilton《时间序列分析》第 3 章：从经济学角度讲平稳 ARMA 过程。
- R. J. Hyndman, G. Athanasopoulos. *Forecasting: Principles and Practice*（第 3 版，可免费在线阅读）：偏应用，配有大量实例。
