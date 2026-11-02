// 时间序列工具。约定：X_t = Σ φ_i X_{t−i} + ε_t + Σ θ_j ε_{t−j}（MA 部分取加号，与 statsmodels 一致）
import jStat from 'jstat'

// n 个标准正态随机数
export const noise = (n) => Array.from({ length: n }, () => jStat.normal.sample(0, 1))

// 用给定噪声模拟 ARMA。噪声由调用方传入，参数变化时可以复用同一组冲击，让路径连续变形
export function simulateArma(phi, theta, eps) {
  const x = []
  for (let t = 0; t < eps.length; t++) {
    let v = eps[t]
    for (let i = 0; i < phi.length && i < t; i++) v += phi[i] * x[t - 1 - i]
    for (let j = 0; j < theta.length && j < t; j++) v += theta[j] * eps[t - 1 - j]
    x.push(v)
  }
  return x
}

// ψ 权重（X_t = Σ ψ_j ε_{t−j}）：ψ_0 = 1，ψ_j = θ_j + Σ_{i=1}^{min(j,p)} φ_i ψ_{j−i}
export function psiWeights(phi, theta, n) {
  const psi = [1]
  for (let j = 1; j < n; j++) {
    let v = theta[j - 1] ?? 0
    for (let i = 1; i <= Math.min(j, phi.length); i++) v += phi[i - 1] * psi[j - i]
    psi.push(v)
  }
  return psi
}

// 理论自相关 ρ_0 … ρ_maxLag，要求模型平稳
// ponytail: ψ 权重截断到 terms 项求和，根贴近单位圆时会偏小；需要时改为解 Yule–Walker 线性方程组
export function armaAcf(phi, theta, maxLag, terms = 3000) {
  const psi = psiWeights(phi, theta, terms + maxLag)
  const g = (k) => {
    let s = 0
    for (let j = 0; j < terms; j++) s += psi[j] * psi[j + k]
    return s
  }
  const g0 = g(0)
  return Array.from({ length: maxLag + 1 }, (_, k) => g(k) / g0)
}

// Durbin–Levinson 递推：由自相关 ρ_0 … ρ_K 依次解出 AR(1) … AR(K) 的 Yule–Walker 方程。
// 第 k 项为 { phi: [φ_k1 … φ_kk], v: Π_{j≤k}(1 − φ_jj²) }，v 是 k 阶预测误差方差与 γ_0 之比
export function durbinLevinson(rho) {
  const out = []
  let prev = [], v = 1
  for (let k = 1; k < rho.length; k++) {
    let num = rho[k], den = 1
    for (let j = 1; j < k; j++) {
      num -= prev[j - 1] * rho[k - j]
      den -= prev[j - 1] * rho[j]
    }
    const pkk = num / den
    prev = [...prev.map((c, i) => c - pkk * prev[k - 2 - i]), pkk]
    v *= 1 - pkk * pkk
    out.push({ phi: prev, v })
  }
  return out
}

// 由自相关求偏自相关，返回 [φ_11, φ_22, …]
export const pacfFromAcf = (rho) => durbinLevinson(rho).map((s) => s.phi.at(-1))

// 样本自相关 r_0 … r_maxLag
export function acf(x, maxLag) {
  const n = x.length
  const m = x.reduce((s, v) => s + v, 0) / n
  const d = x.map((v) => v - m)
  const c0 = d.reduce((s, v) => s + v * v, 0)
  return Array.from({ length: maxLag + 1 }, (_, k) => {
    let s = 0
    for (let t = k; t < n; t++) s += d[t] * d[t - k]
    return s / c0
  })
}

const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length

// 差分 x_t − x_{t−lag}
export const diff = (x, lag = 1) => x.slice(lag).map((v, i) => v - x[i])

// 中心化移动平均，两端各 ⌊k/2⌋ 期为 null。k 为偶数时是 2×k 移动平均：窗口两端的项各取一半权重
export function movingAverage(x, k) {
  const n = x.length, h = Math.floor(k / 2), out = Array(n).fill(null)
  for (let t = h; t < n - h; t++) {
    let s = 0
    for (let j = -h; j <= h; j++) s += (k % 2 === 0 && Math.abs(j) === h ? 0.5 : 1) * x[t + j]
    out[t] = s / k
  }
  return out
}

// 经典分解（移动平均趋势剔除法）：趋势取中心化移动平均；季节因子是去趋势后同一季节的平均，
// 再标准化，使乘法模型的季节指数平均为 1、加法模型的季节项平均为 0。假定序列从第 0 季（如 1 月）开始
export function decompose(x, period, type = 'mult') {
  const mult = type === 'mult'
  const trend = movingAverage(x, period)
  const raw = Array.from({ length: period }, (_, s) => {
    const v = []
    for (let t = s; t < x.length; t += period) if (trend[t] != null) v.push(mult ? x[t] / trend[t] : x[t] - trend[t])
    return mean(v)
  })
  const m = mean(raw)
  const seasonal = raw.map((v) => (mult ? v / m : v - m))
  const S = x.map((_, t) => seasonal[t % period])
  const remainder = x.map((v, t) => (trend[t] == null ? null : mult ? v / (trend[t] * S[t]) : v - trend[t] - S[t]))
  return { trend, seasonal, S, remainder }
}

// 以下三种指数平滑都返回 { fit, fc }：fit[t] 是只用 t 之前的数据对第 t 期的一步预测，fc 是向前 h 步的预测
export function ses(x, a, h = 0) {
  let l = x[0]
  const fit = []
  for (const v of x) {
    fit.push(l)
    l = a * v + (1 - a) * l
  }
  return { fit, fc: Array(h).fill(l) }
}

// Holt 线性趋势法：水平与斜率各自指数平滑
export function holt(x, a, b, h = 0) {
  let l = x[0], tr = x[1] - x[0]
  const fit = [x[0]]
  for (let t = 1; t < x.length; t++) {
    fit.push(l + tr)
    const prev = l
    l = a * x[t] + (1 - a) * (l + tr)
    tr = b * (l - prev) + (1 - b) * tr
  }
  return { fit, fc: Array.from({ length: h }, (_, k) => l + (k + 1) * tr) }
}

// Holt–Winters 季节方法（type：'mult' 乘法 | 'add' 加法）。用前两个季节定初值：斜率 = 两季均值之差 / m，
// 水平 = 第一季末的趋势值，季节因子 = 第一季各期与趋势之比（或之差）。fit 的前 m 期为 null
export function holtWinters(x, m, a, b, g, h = 0, type = 'mult') {
  const mult = type === 'mult', n = x.length
  const m1 = mean(x.slice(0, m))
  let tr = (mean(x.slice(m, 2 * m)) - m1) / m
  let l = m1 + (tr * (m - 1)) / 2
  const s = x.slice(0, m).map((v, i) => {
    const T = m1 + tr * (i - (m - 1) / 2)
    return mult ? v / T : v - T
  })
  const fit = Array(m).fill(null)
  for (let t = m; t < n; t++) {
    const st = s[t % m]
    fit.push(mult ? (l + tr) * st : l + tr + st)
    const prev = l
    l = mult ? (a * x[t]) / st + (1 - a) * (l + tr) : a * (x[t] - st) + (1 - a) * (l + tr)
    tr = b * (l - prev) + (1 - b) * tr
    s[t % m] = mult ? (g * x[t]) / l + (1 - g) * st : g * (x[t] - l) + (1 - g) * st
  }
  const fc = Array.from({ length: h }, (_, k) => {
    const st = s[(n + k) % m]
    return mult ? (l + (k + 1) * tr) * st : l + (k + 1) * tr + st
  })
  return { fit, fc }
}

// Ljung–Box 统计量 Q = n(n+2) Σ_{k=1}^{h} r_k² / (n − k)；白噪声下近似 χ²(h)，检验模型残差时自由度再减去参数个数
export function ljungBox(x, h) {
  const r = acf(x, h), n = x.length
  let q = 0
  for (let k = 1; k <= h; k++) q += (r[k] * r[k]) / (n - k)
  return n * (n + 2) * q
}

// 最小二乘：X 的每行是一个观测。返回系数、标准误、残差方差（除以 n − p）与残差；(XᵀX)⁻¹ 用高斯–若尔当消元求
export function ols(X, y) {
  const p = X[0].length, n = X.length
  const A = Array.from({ length: p }, (_, i) => [
    ...Array.from({ length: p }, (_, j) => X.reduce((s, row) => s + row[i] * row[j], 0)),
    ...Array.from({ length: p }, (_, j) => (i === j ? 1 : 0)),
  ])
  for (let c = 0; c < p; c++) {
    let piv = c
    for (let r = c + 1; r < p; r++) if (Math.abs(A[r][c]) > Math.abs(A[piv][c])) piv = r
    ;[A[c], A[piv]] = [A[piv], A[c]]
    const d = A[c][c]
    for (let j = 0; j < 2 * p; j++) A[c][j] /= d
    for (let r = 0; r < p; r++) {
      if (r === c) continue
      const f = A[r][c]
      for (let j = 0; j < 2 * p; j++) A[r][j] -= f * A[c][j]
    }
  }
  const inv = A.map((row) => row.slice(p))
  const Xty = Array.from({ length: p }, (_, i) => X.reduce((s, row, k) => s + row[i] * y[k], 0))
  const beta = inv.map((row) => row.reduce((s, v, j) => s + v * Xty[j], 0))
  const resid = X.map((row, k) => y[k] - row.reduce((s, v, j) => s + v * beta[j], 0))
  const sigma2 = resid.reduce((s, v) => s + v * v, 0) / (n - p)
  return { beta, se: inv.map((row, i) => Math.sqrt(sigma2 * row[i])), sigma2, resid }
}

// ARMA(p, q) 的 Hannan–Rissanen 两步估计：先用长自回归估计新息 ε̂_t，再把 y_t 对 y 的滞后与 ε̂ 的滞后作最小二乘。
// 残差按模型递推（开头未知的值取 0）。skip 是计算 σ² 与 AIC/BIC 时略去的开头期数，比较不同阶数时应取同一个值
export function fitArma(x, p, q, skip = Math.max(p, q)) {
  const n = x.length, mu = mean(x), y = x.map((v) => v - mu)
  let phi = [], theta = []
  if (p + q > 0) {
    const e = Array(n).fill(0)
    let start = p
    if (q > 0) {
      const m = Math.min(p + q + 10, Math.floor(n / 4))
      const rows = [], ys = []
      for (let t = m; t < n; t++) {
        rows.push(Array.from({ length: m }, (_, i) => y[t - 1 - i]))
        ys.push(y[t])
      }
      const a = ols(rows, ys).beta
      for (let t = m; t < n; t++) e[t] = y[t] - a.reduce((s, c, i) => s + c * y[t - 1 - i], 0)
      start = Math.max(p, m + q)
    }
    const rows = [], ys = []
    for (let t = start; t < n; t++) {
      rows.push([...Array.from({ length: p }, (_, i) => y[t - 1 - i]), ...Array.from({ length: q }, (_, j) => e[t - 1 - j])])
      ys.push(y[t])
    }
    const b = ols(rows, ys).beta
    phi = b.slice(0, p)
    theta = b.slice(p)
  }
  const resid = []
  for (let t = 0; t < n; t++) {
    let v = y[t]
    for (let i = 0; i < p && i < t; i++) v -= phi[i] * y[t - 1 - i]
    for (let j = 0; j < q && j < t; j++) v -= theta[j] * resid[t - 1 - j]
    resid.push(v)
  }
  const use = resid.slice(skip), N = use.length, k = p + q + 1
  const sigma2 = use.reduce((s, v) => s + v * v, 0) / N
  return { mu, phi, theta, sigma2, resid, aic: N * Math.log(sigma2) + 2 * k, bic: N * Math.log(sigma2) + k * Math.log(N) }
}

// ARMA 向前 h 步预测：未来的冲击取 0；第 k 步预测误差的方差为 σ² Σ_{j<k} ψ_j²
export function forecastArma(x, { mu, phi, theta, sigma2, resid }, h) {
  const y = x.map((v) => v - mu), e = [...resid], n = x.length
  const psi = psiWeights(phi, theta, h)
  const out = []
  let cum = 0
  for (let k = 0; k < h; k++) {
    const t = n + k
    let v = 0
    for (let i = 0; i < phi.length; i++) v += phi[i] * y[t - 1 - i]
    for (let j = 0; j < theta.length; j++) v += theta[j] * e[t - 1 - j]
    y.push(v)
    e.push(0)
    cum += psi[k] ** 2
    out.push({ mean: mu + v, se: Math.sqrt(sigma2 * cum) })
  }
  return out
}

// (A)DF 检验统计量：回归 Δy_t = ρ y_{t−1} [+ α] [+ βt] + Σ_{i≤lags} γ_i Δy_{t−i} + ε_t 中 ρ 的 t 值
export function dfStat(y, { constant = true, trend = false, lags = 0 } = {}) {
  const rows = [], ys = []
  for (let t = lags + 1; t < y.length; t++) {
    const row = [y[t - 1]]
    if (constant) row.push(1)
    if (trend) row.push(t)
    for (let i = 1; i <= lags; i++) row.push(y[t - i] - y[t - i - 1])
    rows.push(row)
    ys.push(y[t] - y[t - 1])
  }
  const r = ols(rows, ys)
  return r.beta[0] / r.se[0]
}

// 周期图 I(f_j) = |Σ_t (x_t − x̄) e^{−2πi f_j t}|² / n，f_j = j/n（j = 1 … ⌊n/2⌋，单位：周期/期）
// ponytail: 直接计算 DFT，O(n²)，几千个点以内够快；更长的序列改用 FFT
export function periodogram(x) {
  const n = x.length, m = mean(x), d = x.map((v) => v - m), out = []
  for (let j = 1; j <= Math.floor(n / 2); j++) {
    let re = 0, im = 0
    for (let t = 0; t < n; t++) {
      const w = (2 * Math.PI * j * t) / n
      re += d[t] * Math.cos(w)
      im -= d[t] * Math.sin(w)
    }
    out.push({ freq: j / n, power: (re * re + im * im) / n })
  }
  return out
}

// 局部水平模型 y_t = μ_t + ε_t，μ_{t+1} = μ_t + η_t 的卡尔曼滤波（ε、η 的方差为 s2eps、s2eta）。
// 返回滤波值 level 及其方差 P、一步预测 pred 及其方差 F、对数似然 loglik。
// 初值取 y_0、方差 P0 取很大的数（近似扩散初值），第一期不计入似然
export function kalmanLevel(y, s2eps, s2eta, P0 = 1e7) {
  let a = y[0], P = P0, loglik = 0
  const level = [], Pt = [], pred = [], F = []
  y.forEach((v, t) => {
    const f = P + s2eps, K = P / f, u = v - a
    pred.push(a)
    F.push(f)
    if (t > 0) loglik -= 0.5 * (Math.log(2 * Math.PI * f) + (u * u) / f)
    a += K * u
    P *= 1 - K
    level.push(a)
    Pt.push(P)
    P += s2eta
  })
  return { level, P: Pt, pred, F, loglik }
}

// GARCH(1,1)：r_t = σ_t z_t，σ²_t = ω + α r²_{t−1} + β σ²_{t−1}。z 为标准正态噪声，σ²_0 取无条件方差 ω/(1 − α − β)
export function garch(z, omega, alpha, beta) {
  let s2 = omega / Math.max(0.01, 1 - alpha - beta), r = 0
  return z.map((zt, t) => {
    if (t > 0) s2 = omega + alpha * r * r + beta * s2
    r = Math.sqrt(s2) * zt
    return { r, sigma: Math.sqrt(s2) }
  })
}
