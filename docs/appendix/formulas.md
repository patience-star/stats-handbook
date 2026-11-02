# 公式与符号速查

本页按部分汇总全站最常用的公式，供复习和查阅；每张表都只列结论，条件、推导和例题请回到相应的章节。记号与茆书一致，第一节对照了经管类教材（包括黄书）中常见的不同写法。

## 记号对照 {.core}

| 含义 | 本站（茆书） | 经管类教材的常见写法 |
| --- | --- | --- |
| 概率密度函数 | $p(x)$ | $f(x)$ |
| 方差 | $\operatorname{Var}(X)$ | $D(X)$ 或 $\sigma^2$ |
| 二项分布 / 泊松分布 | $b(n,p)$ / $P(\lambda)$ | $B(n,p)$ / $P(\lambda)$ 或 $\pi(\lambda)$ |
| 标准正态分位数 | 下侧 $u_p$：$P(U\le u_p)=p$ | 上侧 $z_\alpha$：$P(Z>z_\alpha)=\alpha$；$z_\alpha=u_{1-\alpha}$ |
| $t$、$\chi^2$、$F$ 分位数 | 下侧 $t_p(n)$、$\chi^2_p(n)$、$F_p(m,n)$ | 多为上侧，如 $t_{\alpha/2}(n-1)$ |
| 样本方差 | $s^2=\frac1{n-1}\sum(x_i-\bar x)^2$；$s_n^2$ 除以 $n$ | $s^2$（除以 $n-1$） |
| 均值的标准误 | $\sigma/\sqrt n$ | 抽样平均误差 $\mu_{\bar x}$ |
| 区间半宽 | $u_{1-\alpha/2}\,\sigma/\sqrt n$ | 抽样极限误差 $\Delta=z_{\alpha/2}\,\mu_{\bar x}$ |
| 一元线性回归 | $\hat y=\hat\beta_0+\hat\beta_1x$ | 也写作 $\hat y=a+bx$ |
| 时间序列 | 发展水平 $a_0,\dots,a_n$；模型中写作 $x_t$ | 发展水平 $a_0,\dots,a_n$ |
| MA 部分的符号 | $X_t=\varepsilon_t+\theta\varepsilon_{t-1}$（与 statsmodels 一致） | Box–Jenkins 原著与部分教材：$\varepsilon_t-\theta\varepsilon_{t-1}$ |

## 一、描述统计

| 指标 | 公式 |
| --- | --- |
| 加权算术平均 | $\bar x=\sum x_if_i/\sum f_i$ |
| 加权调和平均（已知总量 $m_i$） | $\sum m_i/\sum(m_i/x_i)$ |
| 几何平均 | $\sqrt[n]{x_1x_2\cdots x_n}$ |
| 分组数据的中位数 | $L+\dfrac{n/2-S_{m-1}}{f_m}\,d$ |
| 分组数据的众数 | $L+\dfrac{\Delta_1}{\Delta_1+\Delta_2}\,d$ |
| 样本方差、标准差 | $s^2=\frac1{n-1}\sum(x_i-\bar x)^2$，$s=\sqrt{s^2}$ |
| 变异系数、标准分数 | $v=s/\bar x$；$z=(x-\bar x)/s$ |
| 四分位距与离群值界限 | $IQR=Q_3-Q_1$；$Q_1-1.5IQR$，$Q_3+1.5IQR$ |
| 斯特奇斯分组数 | $k\approx1+\log_2n$ |

## 二、概率论

| 公式 | 表达式 |
| --- | --- |
| 加法公式 | $P(A\cup B)=P(A)+P(B)-P(AB)$ |
| 条件概率、乘法公式 | $P(A\mid B)=P(AB)/P(B)$；$P(AB)=P(B)P(A\mid B)$ |
| 全概率公式 | $P(A)=\sum_iP(B_i)P(A\mid B_i)$ |
| 贝叶斯公式 | $P(B_i\mid A)=\dfrac{P(B_i)P(A\mid B_i)}{\sum_jP(B_j)P(A\mid B_j)}$ |
| 独立 | $P(AB)=P(A)P(B)$ |
| 期望与方差 | $EX=\sum x_ip_i$ 或 $\int xp(x)\mathrm dx$；$\operatorname{Var}X=E(X^2)-(EX)^2$ |
| 线性变换 | $E(aX+b)=aEX+b$；$\operatorname{Var}(aX+b)=a^2\operatorname{Var}X$ |
| 切比雪夫不等式 | $P(\lvert X-\mu\rvert\ge\varepsilon)\le\sigma^2/\varepsilon^2$ |
| 协方差、相关系数 | $\operatorname{Cov}(X,Y)=E(XY)-EXEY$；$\rho=\operatorname{Cov}(X,Y)/(\sigma_X\sigma_Y)$ |
| 和的方差 | $\operatorname{Var}(X\pm Y)=\operatorname{Var}X+\operatorname{Var}Y\pm2\operatorname{Cov}(X,Y)$ |
| 卷积公式 | $p_{X+Y}(z)=\int p_X(x)p_Y(z-x)\,\mathrm dx$（独立） |
| 单调变换的密度 | $p_Y(y)=p_X\big(h(y)\big)\,\lvert h'(y)\rvert$，$h$ 为反函数 |
| 重期望、全方差公式 | $E[E(Y\mid X)]=EY$；$\operatorname{Var}Y=\operatorname{Var}E(Y\mid X)+E\operatorname{Var}(Y\mid X)$ |
| 中心极限定理 | $\dfrac{S_n-n\mu}{\sigma\sqrt n}\xrightarrow{L}N(0,1)$ |

| 分布 | 分布列或密度 | 期望 | 方差 |
| --- | --- | --- | --- |
| 二项 $b(n,p)$ | $\binom nkp^k(1-p)^{n-k}$ | $np$ | $np(1-p)$ |
| 泊松 $P(\lambda)$ | $\frac{\lambda^k}{k!}e^{-\lambda}$ | $\lambda$ | $\lambda$ |
| 几何 $Ge(p)$ | $(1-p)^{k-1}p$ | $1/p$ | $(1-p)/p^2$ |
| 超几何 $h(n,N,M)$ | $\binom Mk\binom{N-M}{n-k}/\binom Nn$ | $nM/N$ | $n\frac MN\left(1-\frac MN\right)\frac{N-n}{N-1}$ |
| 均匀 $U(a,b)$ | $\frac1{b-a}$ | $\frac{a+b}2$ | $\frac{(b-a)^2}{12}$ |
| 指数 $\mathrm{Exp}(\lambda)$ | $\lambda e^{-\lambda x}$ | $1/\lambda$ | $1/\lambda^2$ |
| 正态 $N(\mu,\sigma^2)$ | $\frac1{\sqrt{2\pi}\sigma}e^{-(x-\mu)^2/(2\sigma^2)}$ | $\mu$ | $\sigma^2$ |
| 伽马 $\mathrm{Ga}(\alpha,\lambda)$ | $\frac{\lambda^\alpha}{\Gamma(\alpha)}x^{\alpha-1}e^{-\lambda x}$ | $\alpha/\lambda$ | $\alpha/\lambda^2$ |
| 贝塔 $\mathrm{Be}(a,b)$ | $\frac{x^{a-1}(1-x)^{b-1}}{B(a,b)}$ | $\frac a{a+b}$ | $\frac{ab}{(a+b)^2(a+b+1)}$ |

## 三、数理统计

**抽样分布**（样本来自 $N(\mu,\sigma^2)$）

| 统计量 | 分布 |
| --- | --- |
| $\dfrac{\bar X-\mu}{\sigma/\sqrt n}$ | $N(0,1)$ |
| $\dfrac{(n-1)S^2}{\sigma^2}$ | $\chi^2(n-1)$，且与 $\bar X$ 独立 |
| $\dfrac{\bar X-\mu}{S/\sqrt n}$ | $t(n-1)$ |
| $\dfrac{S_x^2/\sigma_1^2}{S_y^2/\sigma_2^2}$（两独立样本） | $F(m-1,n-1)$ |

**估计**

| 内容 | 公式 |
| --- | --- |
| 均方误差 | $\operatorname{MSE}(\hat\theta)=\operatorname{Var}\hat\theta+(\text{偏差})^2$ |
| 费希尔信息与 C–R 下界 | $I(\theta)=E\big[(\partial_\theta\ln p)^2\big]$；$\operatorname{Var}\hat\theta\ge\frac1{nI(\theta)}$ |
| 最大似然估计的渐近分布 | $\hat\theta\approx N\big(\theta,1/(nI(\theta))\big)$ |
| 贝塔–二项共轭 | 先验 $\mathrm{Be}(a,b)$，$n$ 次中 $k$ 次成功 ⇒ 后验 $\mathrm{Be}(a+k,b+n-k)$ |
| 均值的置信区间 | $\sigma$ 已知 $\bar x\pm u_{1-\alpha/2}\sigma/\sqrt n$；未知 $\bar x\pm t_{1-\alpha/2}(n-1)\,s/\sqrt n$ |
| 方差的置信区间 | $\left[\frac{(n-1)s^2}{\chi^2_{1-\alpha/2}(n-1)},\ \frac{(n-1)s^2}{\chi^2_{\alpha/2}(n-1)}\right]$ |
| 比例的置信区间（大样本） | $\hat p\pm u_{1-\alpha/2}\sqrt{\hat p(1-\hat p)/n}$ |
| 样本量 | 均值 $n\ge\left(u_{1-\alpha/2}\sigma/E\right)^2$；比例 $n\ge u_{1-\alpha/2}^2\,p(1-p)/E^2$ |
| 不重复抽样的修正 | 方差乘以 $\frac{N-n}{N-1}\approx1-\frac nN$ |

**检验**

| 检验 | 统计量 | 原假设下的分布 |
| --- | --- | --- |
| 单样本 $u$ / $t$ 检验 | $\frac{\bar x-\mu_0}{\sigma/\sqrt n}$ / $\frac{\bar x-\mu_0}{s/\sqrt n}$ | $N(0,1)$ / $t(n-1)$ |
| 两样本 $t$ 检验（方差相等） | $\frac{\bar x-\bar y}{s_w\sqrt{1/m+1/n}}$，$s_w^2=\frac{(m-1)s_x^2+(n-1)s_y^2}{m+n-2}$ | $t(m+n-2)$ |
| 方差的 $\chi^2$ 检验 / 方差比的 $F$ 检验 | $\frac{(n-1)s^2}{\sigma_0^2}$ / $\frac{s_x^2}{s_y^2}$ | $\chi^2(n-1)$ / $F(m-1,n-1)$ |
| 比例的检验（大样本） | $\frac{\hat p-p_0}{\sqrt{p_0(1-p_0)/n}}$ | 近似 $N(0,1)$ |
| 似然比检验 | $-2\ln\Lambda$ | 近似 $\chi^2(k)$ |
| 拟合优度 / 列联表独立性 | $\sum\frac{(O-E)^2}{E}$ | 近似 $\chi^2(k-1-r)$ / $\chi^2\big((r-1)(c-1)\big)$ |
| 单因素方差分析 | $F=\frac{S_A/(r-1)}{S_e/(n-r)}$，$S_T=S_A+S_e$ | $F(r-1,n-r)$ |

**回归**

| 量 | 公式 |
| --- | --- |
| 最小二乘估计 | $\hat\beta_1=l_{xy}/l_{xx}$，$\hat\beta_0=\bar y-\hat\beta_1\bar x$ |
| 误差方差 | $\hat\sigma^2=S_e/(n-2)$ |
| 斜率的检验 | $t=\frac{\hat\beta_1}{\hat\sigma/\sqrt{l_{xx}}}\sim t(n-2)$ |
| 平方和分解与判定系数 | $S_T=S_R+S_e$；$R^2=S_R/S_T=r^2$ |
| 均值的置信区间 / 预测区间 | $\hat y_0\pm t_{1-\alpha/2}(n-2)\,\hat\sigma\sqrt{\frac1n+\frac{(x_0-\bar x)^2}{l_{xx}}}$ / 根号内再加 1 |
| 多元回归 | $\hat\beta=(X^\top X)^{-1}X^\top y$，$\hat y=Hy$，$H=X(X^\top X)^{-1}X^\top$ |

## 四、统计指数

| 指数 | 公式 |
| --- | --- |
| 拉氏数量指数 / 帕氏价格指数 | $\frac{\sum q_1p_0}{\sum q_0p_0}$ / $\frac{\sum p_1q_1}{\sum p_0q_1}$ |
| 费希尔理想指数 | $\sqrt{L_pP_p}$ |
| 指数体系 | $\frac{\sum p_1q_1}{\sum p_0q_0}=\frac{\sum q_1p_0}{\sum q_0p_0}\times\frac{\sum p_1q_1}{\sum p_0q_1}$ |
| 加权算术 / 调和平均指数 | $\frac{\sum k_qp_0q_0}{\sum p_0q_0}$ / $\frac{\sum p_1q_1}{\sum p_1q_1/k_p}$ |
| 可变构成 = 固定构成 × 结构影响 | $\frac{\bar x_1}{\bar x_0}=\frac{\sum x_1f_1/\sum f_1}{\sum x_0f_1/\sum f_1}\times\frac{\sum x_0f_1/\sum f_1}{\sum x_0f_0/\sum f_0}$ |

## 五、时间序列

| 内容 | 公式 |
| --- | --- |
| 首末折半法 | $\bar a=\frac{a_1/2+a_2+\cdots+a_{n-1}+a_n/2}{n-1}$ |
| 间隔不等的时点序列 | $\bar a=\sum\frac{a_i+a_{i+1}}{2}f_i\big/\sum f_i$ |
| 平均发展速度（水平法 / 方程式法） | $\sqrt[n]{a_n/a_0}$ / $\sum_{i=1}^n\bar x^i=\sum a_i/a_0$ |
| 移动平均的增益 | $H(f)=\sum_jw_j\cos(2\pi fj)$ |
| 简单指数平滑 | $\hat y_{t+1}=\alpha y_t+(1-\alpha)\hat y_t$，平均滞后 $(1-\alpha)/\alpha$ |
| 样本自相关 / Ljung–Box | $r_k=\frac{\sum(x_t-\bar x)(x_{t+k}-\bar x)}{\sum(x_t-\bar x)^2}$ / $n(n+2)\sum\frac{r_k^2}{n-k}\sim\chi^2(h)$ |
| AR(1) | $\rho_k=\phi^k$，$\operatorname{Var}X_t=\sigma^2/(1-\phi^2)$ |
| MA(1) | $\rho_1=\theta/(1+\theta^2)$，$\rho_k=0\ (k\ge2)$ |
| AR(2) 平稳三角形 | $\phi_1+\phi_2<1$，$\phi_2-\phi_1<1$，$\lvert\phi_2\rvert<1$ |
| Yule–Walker / PACF | $\rho_k=\sum_i\phi_i\rho_{k-i}$；$\phi_{kk}$ 为 $k$ 阶方程组的最后一个解 |
| 信息准则 | AIC $=-2\ln\hat L+2k$，BIC $=-2\ln\hat L+k\ln n$ |
| 预测误差方差 | $\sigma^2\sum_{j=0}^{h-1}\psi_j^2$ |
| ARIMA / 航空模型 | $\phi(B)(1-B)^dx_t=\theta(B)\varepsilon_t$ / $\nabla\nabla_{12}\ln x_t=(1+\theta B)(1+\Theta B^{12})\varepsilon_t$ |
| DF 检验 | $\nabla y_t=\alpha+\beta t+\rho y_{t-1}+\varepsilon_t$，5% 临界值约 −2.86（含常数，渐近） |
| GARCH(1,1) | $\sigma_t^2=\omega+\alpha r_{t-1}^2+\beta\sigma_{t-1}^2$ |
| 卡尔曼增益（局部水平） | $K_t=P_t/(P_t+\sigma_\varepsilon^2)$ |

## 常用分位数

| | $p=0.90$ | $0.95$ | $0.975$ | $0.99$ | $0.995$ |
| --- | --- | --- | --- | --- | --- |
| $u_p$ | 1.2816 | 1.6449 | 1.9600 | 2.3263 | 2.5758 |

其余分布的分位数请用“[统计表计算器](/appendix/calculator)”一章的计算器查询。
