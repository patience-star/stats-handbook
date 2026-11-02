# 统计表计算器

教材书后都附有正态分布、$t$ 分布、$\chi^2$ 分布、$F$ 分布等数值表。这些表只能列出有限的几个概率和自由度，查表时还要留意它给的是哪一种分位数。下面的计算器可以代替它们：输入任意参数，既可以由数值求概率，也可以由概率求分位数。

<DistCalculator />

## 两种分位数 {.core}

::: core 下侧分位数与上侧分位数
- **下侧 $p$ 分位数**（茆书，本站采用）：满足 $P(X\le x_p)=p$ 的数 $x_p$。标准正态分布记作 $u_p$，例如 $u_{0.975}=1.96$。
- **上侧 $\alpha$ 分位数**（经管类教材常用）：满足 $P(X>x)=\alpha$ 的数，标准正态分布常记作 $z_\alpha$，例如 $z_{0.025}=1.96$。

两者的关系是 **上侧 $\alpha$ 分位数 = 下侧 $1-\alpha$ 分位数**，即 $z_\alpha=u_{1-\alpha}$，$t_\alpha(n)_{\text{上侧}}=t_{1-\alpha}(n)$，其余分布同理。区间估计与假设检验中的“$z_{\alpha/2}$”就是本站的“$u_{1-\alpha/2}$”。
:::

::: pitfall 查 $F$ 分布表的小技巧
$F$ 分布表通常只列出右侧的分位数。左侧的分位数用倒数关系求：
$$F_\alpha(m,n)=\frac{1}{F_{1-\alpha}(n,m)}.$$
例如 $F_{0.025}(4,9)=1/F_{0.975}(9,4)$，约为 0.1123。用计算器可以直接得到，不必换算。
:::

## 用计算器核对几个常用的值

| 要求的量 | 输入 | 结果 |
| --- | --- | --- |
| $u_{0.975}$（即 $z_{0.025}$） | 正态，$\mu=0$，$\sigma=1$，已知概率 0.975 | 1.9600 |
| $t_{0.975}(15)$ | $t$，$n=15$，已知概率 0.975 | 2.1314 |
| $\chi^2_{0.025}(8)$，$\chi^2_{0.975}(8)$ | $\chi^2$，$n=8$ | 2.1797，17.5345 |
| $F_{0.95}(2,12)$ | $F$，$m=2$，$n=12$，已知概率 0.95 | 3.8853 |
| $P(Z>2.5)$ | 正态，已知数值 2.5 | 0.0062 |
| $P(\lvert t(10)\rvert\ge2.228)$ | $t$，$n=10$，已知数值 2.228，看双侧概率 | 0.0500 |
| $P(X\le2)$，$X\sim b(10,0.3)$ | 二项，已知数值 2 | 0.3828 |
| $P(X\ge8)$，$X\sim P(4)$ | 泊松，已知数值 8 | 0.0511 |

这些值在“[区间估计](/inference/interval)”“[假设检验](/inference/testing)”“[方差分析](/inference/anova)”各章的例题中都出现过。

::: quiz 2.306 0.002
用计算器求 $t_{0.975}(8)$（保留三位小数）。
> 选 $t$ 分布，$n=8$，“已知概率，求分位数”，输入 0.975，得 2.306。这是 9 个观测值时 95% 置信区间要用的 $t$ 值。
:::

::: quiz 15 0
把一枚硬币抛 20 次，规定正面次数不少于 $k$ 时就判定“硬币偏向正面”。要使硬币其实均匀时被误判的概率不超过 5%，$k$ 至少取多少？
> 硬币均匀时正面次数 $X\sim b(20,0.5)$。选二项分布，“已知概率”输入 0.05，读第二行：使 $P(X\ge k)\le0.05$ 的最小 $k$ 为 15。验证：$P(X\ge14)=1-P(X\le13)\approx0.0577>0.05$，$P(X\ge15)=1-P(X\le14)\approx0.0207\le0.05$。这就是右侧检验的拒绝域 $\{X\ge15\}$，实际的显著性水平约为 2.1%。
:::

## 软件中的对应函数

| 量 | Python（SciPy） | Excel |
| --- | --- | --- |
| 标准正态 $\Phi(x)$ / $u_p$ | `norm.cdf(x)` / `norm.ppf(p)` | `NORM.S.DIST(x, TRUE)` / `NORM.S.INV(p)` |
| $t$ 分布 | `t.cdf(x, n)` / `t.ppf(p, n)` | `T.DIST(x, n, TRUE)` / `T.INV(p, n)` |
| $\chi^2$ 分布 | `chi2.cdf(x, n)` / `chi2.ppf(p, n)` | `CHISQ.DIST(x, n, TRUE)` / `CHISQ.INV(p, n)` |
| $F$ 分布 | `f.cdf(x, m, n)` / `f.ppf(p, m, n)` | `F.DIST(x, m, n, TRUE)` / `F.INV(p, m, n)` |
| 二项分布 | `binom.pmf(k, n, p)` / `binom.cdf(k, n, p)` | `BINOM.DIST(k, n, p, FALSE/TRUE)` |
| 泊松分布 | `poisson.pmf(k, λ)` / `poisson.cdf(k, λ)` | `POISSON.DIST(k, λ, FALSE/TRUE)` |

SciPy 的函数都在 `scipy.stats` 中；`ppf` 是下侧分位数（分布函数的反函数），`sf(x)` 是上侧概率 $1-F(x)$，`isf(α)` 是上侧 $\alpha$ 分位数。

::: details 展开代码：用 SciPy 代替统计表
```python
from scipy import stats

print("u_0.975 =", round(stats.norm.ppf(0.975), 4))
print("t_0.975(15) =", round(stats.t.ppf(0.975, 15), 4))
print("chi2_0.025(8), chi2_0.975(8) =", stats.chi2.ppf([0.025, 0.975], 8).round(4))
print("F_0.95(2, 12) =", round(stats.f.ppf(0.95, 2, 12), 4))
print("上侧 0.025 分位数 z_0.025 =", round(stats.norm.isf(0.025), 4))
print("P(|t(10)| >= 2.228) =", round(2 * stats.t.sf(2.228, 10), 4))
print("P(X <= 2), X ~ b(10, 0.3) =", round(stats.binom.cdf(2, 10, 0.3), 4))
print("P(X >= 8), X ~ P(4) =", round(stats.poisson.sf(7, 4), 4))
```
:::
