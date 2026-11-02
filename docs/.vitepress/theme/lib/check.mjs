// lib 的断言自检：npm run check
import assert from 'node:assert/strict'
import jStat from 'jstat'
import {
  acf, armaAcf, decompose, dfStat, durbinLevinson, fitArma, forecastArma, garch, holt, holtWinters, kalmanLevel, ljungBox,
  movingAverage, noise, ols, pacfFromAcf, periodogram, psiWeights, ses, simulateArma,
} from './ts.js'

const near = (a, b, tol, what) => assert.ok(Math.abs(a - b) <= tol, `${what}: 得到 ${a}，应为 ${b}`)

// 分位数与教材附表一致
near(jStat.normal.inv(0.975, 0, 1), 1.96, 1e-3, 'u_0.975')
near(jStat.studentt.inv(0.975, 10), 2.228, 1e-3, 't_0.975(10)')
near(jStat.studentt.inv(0.975, 8), 2.306, 1e-3, 't_0.975(8)')
near(jStat.chisquare.inv(0.975, 8), 17.535, 1e-3, 'χ²_0.975(8)')
near(jStat.chisquare.inv(0.025, 8), 2.180, 1e-3, 'χ²_0.025(8)')

// AR(1)：ψ_j = φ^j，ρ_k = φ^k，PACF 在滞后 1 之后截尾
near(psiWeights([0.6], [], 5)[4], 0.6 ** 4, 1e-12, 'AR(1) ψ_4')
const r1 = armaAcf([0.6], [], 6)
r1.forEach((v, k) => near(v, 0.6 ** k, 1e-9, `AR(1) ρ_${k}`))
const p1 = pacfFromAcf(r1)
near(p1[0], 0.6, 1e-9, 'AR(1) φ_11')
p1.slice(1).forEach((v, i) => near(v, 0, 1e-9, `AR(1) φ_${i + 2},${i + 2}`))

// AR(2)：ρ_1 = φ1 / (1 − φ2)，PACF 第 2 步等于 φ2，之后为 0
const r2 = armaAcf([0.5, 0.3], [], 6)
near(r2[1], 0.5 / 0.7, 1e-9, 'AR(2) ρ_1')
const p2 = pacfFromAcf(r2)
near(p2[1], 0.3, 1e-9, 'AR(2) φ_22')
near(p2[2], 0, 1e-9, 'AR(2) φ_33')

// MA(1)：ρ_1 = θ / (1 + θ²)，之后截尾
const m1 = armaAcf([], [0.5], 3)
near(m1[1], 0.4, 1e-12, 'MA(1) ρ_1')
near(m1[2], 0, 1e-12, 'MA(1) ρ_2')

// ARMA(1,1)：ρ_1 = (1 + φθ)(φ + θ) / (1 + 2φθ + θ²)，之后 ρ_k = φ ρ_{k−1}
const a11 = armaAcf([0.5], [0.4], 3)
near(a11[1], (1.2 * 0.9) / 1.56, 1e-9, 'ARMA(1,1) ρ_1')
near(a11[2], 0.5 * a11[1], 1e-9, 'ARMA(1,1) ρ_2')

// 正文 Yule–Walker 例题：r1 = 0.8，r2 = 0.5 时 φ_22 = (r2 − r1²) / (1 − r1²)，φ_21 = r1(1 − r2) / (1 − r1²)
near(pacfFromAcf([1, 0.8, 0.5])[1], -0.14 / 0.36, 1e-12, 'Yule–Walker φ_22')
const yw = durbinLevinson([1, 0.8, 0.5])[1]
near(yw.phi[0], 0.4 / 0.36, 1e-12, 'Yule–Walker φ_21')
near(yw.v, (1 - 0.64) * (1 - (0.14 / 0.36) ** 2), 1e-12, 'Durbin–Levinson 误差方差比')

// 模拟 + 样本 ACF：大样本下接近理论值
const x = simulateArma([0.7], [], noise(20000))
near(acf(x, 1)[1], 0.7, 0.03, 'AR(1) 样本 r_1')

// 移动平均不改变直线；按季节周期取移动平均，加法季节项被完全消去
const line = Array.from({ length: 20 }, (_, t) => 3 + 2 * t)
movingAverage(line, 4).forEach((v, t) => v != null && near(v, line[t], 1e-12, `2×4 移动平均 第 ${t} 期`))
movingAverage(line, 5).forEach((v, t) => v != null && near(v, line[t], 1e-12, `5 期移动平均 第 ${t} 期`))
const S4 = [1, -2, 3, -2]
const seasonalLine = line.map((v, t) => v + S4[t % 4])
decompose(seasonalLine, 4, 'add').seasonal.forEach((v, s) => near(v, S4[s], 1e-12, `加法分解 季节项 ${s}`))
const M4 = [0.9, 1.1, 1.2, 0.8]
decompose(Array.from({ length: 24 }, (_, t) => 50 * M4[t % 4]), 4).seasonal.forEach((v, s) => near(v, M4[s], 1e-12, `乘法分解 季节指数 ${s}`))

// 指数平滑：α = 1 的 SES 是朴素预测；直线对 Holt 法、“直线 + 固定季节”对加法 Holt–Winters 法都没有误差
ses(line, 1).fit.slice(1).forEach((v, t) => near(v, line[t], 1e-12, 'SES(α = 1)'))
near(holt(line, 0.3, 0.2, 3).fc[2], 3 + 2 * 22, 1e-9, 'Holt 外推')
const hw = holtWinters(seasonalLine, 4, 0.3, 0.2, 0.4, 4, 'add')
hw.fit.forEach((v, t) => v != null && near(v, seasonalLine[t], 1e-9, `Holt–Winters 第 ${t} 期`))
hw.fc.forEach((v, k) => near(v, 3 + 2 * (20 + k) + S4[k % 4], 1e-9, `Holt–Winters 预测第 ${k + 1} 步`))

// 最小二乘、ARMA 估计与预测
const o = ols(line.map((_, t) => [1, t]), line)
near(o.beta[0], 3, 1e-9, 'OLS 截距')
near(o.beta[1], 2, 1e-9, 'OLS 斜率')
near(fitArma(simulateArma([0.6], [], noise(10000)), 1, 0).phi[0], 0.6, 0.04, 'Hannan–Rissanen：AR(1) 的 φ')
const am = fitArma(simulateArma([0.5], [0.4], noise(20000)), 1, 1)
near(am.phi[0], 0.5, 0.05, 'Hannan–Rissanen：ARMA(1,1) 的 φ')
near(am.theta[0], 0.4, 0.05, 'Hannan–Rissanen：ARMA(1,1) 的 θ')
const fc = forecastArma([0, 0, 2], { mu: 0, phi: [0.5], theta: [], sigma2: 1, resid: [0, 0, 0] }, 2)
near(fc[0].mean, 1, 1e-12, 'AR(1) 一步预测')
near(fc[1].mean, 0.5, 1e-12, 'AR(1) 两步预测')
near(fc[1].se, Math.sqrt(1.25), 1e-12, 'AR(1) 两步预测的标准误')

// 检验统计量
assert.ok(ljungBox(noise(2000), 10) < 40, 'Ljung–Box：白噪声不应显著')
assert.ok(ljungBox(simulateArma([0.5], [], noise(2000)), 10) > 100, 'Ljung–Box：AR(1) 应高度显著')
assert.ok(dfStat(simulateArma([0.5], [], noise(500))) < -5, 'DF：平稳 AR(1) 应强烈拒绝单位根')

// 周期图：余弦波的全部能量集中在它的频率上，幅度 1 时 I = n/4
const pg = periodogram(Array.from({ length: 64 }, (_, t) => Math.cos((2 * Math.PI * 5 * t) / 64)))
near(pg[4].power, 16, 1e-9, '周期图峰值')
near(pg[3].power, 0, 1e-9, '周期图其余频率')

// 卡尔曼滤波：水平不变（σ²_η = 0）且初值扩散时，最后的滤波值就是样本均值
near(kalmanLevel([3, 5, 4, 6, 2], 1, 0).level.at(-1), 4, 1e-5, '卡尔曼滤波 = 样本均值')

// GARCH(1,1) 的无条件方差 ω/(1 − α − β)
const gr = garch(noise(200000), 0.1, 0.1, 0.8)
near(gr.reduce((s, v) => s + v.r * v.r, 0) / gr.length, 1, 0.05, 'GARCH 无条件方差')

console.log('lib 自检通过')
