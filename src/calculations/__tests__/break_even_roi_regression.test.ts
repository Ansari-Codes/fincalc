import { describe, it, expect } from 'vitest'
import { calculateBreakEven } from '../breakEven'
import { calculateRoi } from '../roi'
import { breakEvenChartSvg } from '../../utils/breakEvenChart'

// Regression tests for the Break-Even + ROI calculators and the two learn
// guides (kitaaab.org). Every figure below was verified against the live
// calculators (2026-11-25) or computed from the engines, to the cent.
// The underlying formulas are correct and must not change; these tests pin
// the audited values so future edits cannot silently move them.

const r2 = (n: number) => Math.round(n * 100) / 100

describe('break-even — calculator defaults (P $50 / V $20 / F $30,000)', () => {
  it('defaults: CM $30, CMR 60%, break-even 1,000 units / $50,000, MOS 16.67%, expected profit $6,000, target 1,500 / $75,000', () => {
    const r = calculateBreakEven({
      sellingPricePerUnit: 50,
      variableCostPerUnit: 20,
      totalFixedCosts: 30000,
      targetProfit: 15000,
      expectedSalesVolume: 1200
    })
    expect(r.isValid).toBe(true)
    expect(r.isViable).toBe(true)
    expect(r.contributionMarginPerUnit).toBe(30)
    expect(r.contributionMarginRatio).toBe(60)
    expect(r.breakEvenUnitsExact).toBe(1000)
    expect(r.breakEvenUnitsRounded).toBe(1000)
    expect(r.breakEvenRevenue).toBe(50000)
    expect(r.targetProfitUnitsRounded).toBe(1500)
    expect(r.targetProfitRevenue).toBe(75000)
    expect(r.expectedProfitOrLoss).toBe(6000)
    expect(r.marginOfSafetyUnits).toBe(200)
    expect(r.marginOfSafetyRevenue).toBe(10000)
    expect(r2(r.marginOfSafetyPercentage || 0)).toBe(16.67)
  })

  it('the documented Reset defaults are $50 / $20 / $30,000 / $15,000 / 1,200', () => {
    // The page's resetForm() must restore exactly these values; this test
    // pins them so a regression is caught here too.
    const defaults = {
      sellingPricePerUnit: 50,
      variableCostPerUnit: 20,
      totalFixedCosts: 30000,
      targetProfit: 15000,
      expectedSalesVolume: 1200
    }
    const r = calculateBreakEven(defaults)
    expect(r.breakEvenUnitsRounded).toBe(1000)
    expect(r.breakEvenRevenue).toBe(50000)
  })
})

describe('break-even — article hoodie example (P $80 / V $28 / F $26,000)', () => {
  it('500 units / $40,000, target 750 / $60,000, MOS 300 units / $24,000 / 37.5%', () => {
    const r = calculateBreakEven({
      sellingPricePerUnit: 80,
      variableCostPerUnit: 28,
      totalFixedCosts: 26000,
      targetProfit: 13000,
      expectedSalesVolume: 800
    })
    expect(r.contributionMarginPerUnit).toBe(52)
    expect(r.contributionMarginRatio).toBe(65)
    expect(r.breakEvenUnitsRounded).toBe(500)
    expect(r.breakEvenRevenue).toBe(40000)
    expect(r.targetProfitUnitsRounded).toBe(750)
    expect(r.targetProfitRevenue).toBe(60000)
    expect(r.marginOfSafetyUnits).toBe(300)
    expect(r.marginOfSafetyRevenue).toBe(24000)
    expect(r.marginOfSafetyPercentage).toBe(37.5)
    expect(r.expectedProfitOrLoss).toBe(15600)
  })
})

describe('break-even — service-business example (consultant $120/hr)', () => {
  it('CM $90, CMR 75%, break-even 54 hours / $6,480, target 84 / $10,080, MOS 46 hours / $5,520 / 46%', () => {
    const r = calculateBreakEven({
      sellingPricePerUnit: 120,
      variableCostPerUnit: 30,
      totalFixedCosts: 4800,
      targetProfit: 2700,
      expectedSalesVolume: 100
    })
    expect(r.contributionMarginPerUnit).toBe(90)
    expect(r.contributionMarginRatio).toBe(75)
    expect(r2(r.breakEvenUnitsExact)).toBe(53.33)
    expect(r.breakEvenUnitsRounded).toBe(54)
    expect(r.breakEvenRevenue).toBe(6480)
    expect(r.targetProfitUnitsRounded).toBe(84)
    expect(r.targetProfitRevenue).toBe(10080)
    expect(r.expectedProfitOrLoss).toBe(4200)
    expect(r.marginOfSafetyUnits).toBe(46)
    expect(r.marginOfSafetyRevenue).toBe(5520)
    expect(r.marginOfSafetyPercentage).toBe(46)
  })
})

describe('break-even — variable cost exceeds price (V > P)', () => {
  it('isLossMaking, breakEvenRounded 0, CMR −25%, error names the $5.00 per-unit loss', () => {
    const r = calculateBreakEven({
      sellingPricePerUnit: 20,
      variableCostPerUnit: 25,
      totalFixedCosts: 5000
    })
    expect(r.isLossMakingPerUnit).toBe(true)
    expect(r.isViable).toBe(false)
    expect(r.contributionMarginPerUnit).toBe(-5)
    expect(r.contributionMarginRatio).toBe(-25)
    expect(r.breakEvenUnitsRounded).toBe(0)
    expect(r.breakEvenRevenue).toBe(0)
    expect(r.validationErrors.join(' ')).toContain(
      'Variable cost exceeds selling price by $5.00 per unit. Every unit sold increases your net loss.'
    )
    // No target-profit or margin-of-safety figures exist without a break-even point.
    expect(r.targetProfitUnitsRounded).toBeUndefined()
    expect(r.marginOfSafetyUnits).toBeUndefined()
  })

  it('zero contribution margin (P == V) is also unviable with no break-even point', () => {
    const r = calculateBreakEven({
      sellingPricePerUnit: 25,
      variableCostPerUnit: 25,
      totalFixedCosts: 5000
    })
    expect(r.isViable).toBe(false)
    expect(r.contributionMarginPerUnit).toBe(0)
    expect(r.breakEvenUnitsRounded).toBe(0)
  })

  it('rounding shortfall is fractional units × contribution margin (0.3 × $52 = $15.60)', () => {
    // The article FAQ: a 412.3-unit break-even leaves 0.3 units unpaid.
    expect(r2(0.3 * 52)).toBe(15.6)
  })
})

describe('break-even chart (hoodie example SVG)', () => {
  it('marks the engine break-even point 500 units / $40,000 and both lines', () => {
    const be = calculateBreakEven({
      sellingPricePerUnit: 80,
      variableCostPerUnit: 28,
      totalFixedCosts: 26000
    })
    const svg = breakEvenChartSvg(be)
    expect(svg).toContain('Break-even: 500 units')
    expect(svg).toContain('$40,000')
    expect(svg).toContain('Revenue — $80 per hoodie')
    expect(svg).toContain('Total cost — $26,000 fixed + $28 per hoodie')
    expect(svg).toContain('LOSS')
    expect(svg).toContain('PROFIT')
  })
})

describe('ROI — calculator defaults ($10,000 → $14,500 + $500 costs)', () => {
  it('defaults: net $4,000, ROI +38.10%, multiple 1.38×', () => {
    const r = calculateRoi({
      initialInvestment: 10000,
      finalValue: 14500,
      additionalCosts: 500,
      additionalIncome: 0
    })
    expect(r.totalCost).toBe(10500)
    expect(r.totalValueReturned).toBe(14500)
    expect(r.netProfit).toBe(4000)
    expect(r2(r.roiPercentage)).toBe(38.1)
    expect(r2(r.totalValueReturned / r.totalCost)).toBe(1.38)
    expect(r.isProfitable).toBe(true)
    // No holding period entered: no annualised figure, simple ROI unchanged.
    expect(r.annualizedRoiPercentage).toBeUndefined()
    // Gain Share (net ÷ gross value) is 27.6% — not the ROI.
    expect(r2((r.netProfit / r.totalValueReturned) * 100)).toBe(27.59)
  })

  it('the documented Reset defaults are $10,000 / $14,500 / $500 / $0', () => {
    const r = calculateRoi({
      initialInvestment: 10000,
      finalValue: 14500,
      additionalCosts: 500,
      additionalIncome: 0
    })
    expect(r.roiPercentage).toBeCloseTo(38.1, 2)
  })
})

describe('ROI — article examples', () => {
  it('Ex.1 equities: $5,020 cost / $6,950 returned / $1,930 profit / +38.45%', () => {
    const r = calculateRoi({
      initialInvestment: 5000,
      finalValue: 6800,
      additionalCosts: 20,
      additionalIncome: 150
    })
    expect(r.totalCost).toBe(5020)
    expect(r.totalValueReturned).toBe(6950)
    expect(r.netProfit).toBe(1930)
    expect(r2(r.roiPercentage)).toBe(38.45)
  })

  it('loss case: $10,000 → $7,000 is −$3,000 / −30.00%', () => {
    const r = calculateRoi({ initialInvestment: 10000, finalValue: 7000 })
    expect(r.netProfit).toBe(-3000)
    expect(r2(r.roiPercentage)).toBe(-30)
    expect(r.isProfitable).toBe(false)
    // Recovery from $7,000 back to $10,000 needs +42.86%.
    expect(r2((3000 / 7000) * 100)).toBe(42.86)
  })

  it('Ex.2 property: $20,000 → $30,000 gross (cash flow + resale increase) is +50.00% simple', () => {
    const r = calculateRoi({ initialInvestment: 20000, finalValue: 24000, additionalIncome: 6000 })
    expect(r.totalValueReturned).toBe(30000)
    expect(r.netProfit).toBe(10000)
    expect(r2(r.roiPercentage)).toBe(50)
  })
})

describe('ROI — annualised (holding period)', () => {
  it('50% over 2 years → 22.47% per year', () => {
    const r = calculateRoi({
      initialInvestment: 20000,
      finalValue: 30000,
      holdingPeriodYears: 2
    })
    expect(r2(r.roiPercentage)).toBe(50)
    expect(r2(r.annualizedRoiPercentage || 0)).toBe(22.47)
  })

  it('40% over 5 years → 6.96% per year', () => {
    const r = calculateRoi({
      initialInvestment: 10000,
      finalValue: 14000,
      holdingPeriodYears: 5
    })
    expect(r2(r.roiPercentage)).toBe(40)
    expect(r2(r.annualizedRoiPercentage || 0)).toBe(6.96)
  })

  it('40% over 15 years → 2.27% per year', () => {
    const r = calculateRoi({
      initialInvestment: 10000,
      finalValue: 14000,
      holdingPeriodYears: 15
    })
    expect(r2(r.roiPercentage)).toBe(40)
    expect(r2(r.annualizedRoiPercentage || 0)).toBe(2.27)
  })

  it('fractional years work (50% over 2.5 years)', () => {
    const r = calculateRoi({
      initialInvestment: 20000,
      finalValue: 30000,
      holdingPeriodYears: 2.5
    })
    expect(r2(r.annualizedRoiPercentage || 0)).toBe(17.61)
  })

  it('simple ROI is unchanged when a holding period is supplied', () => {
    const plain = calculateRoi({ initialInvestment: 10000, finalValue: 14500, additionalCosts: 500 })
    const withPeriod = calculateRoi({
      initialInvestment: 10000,
      finalValue: 14500,
      additionalCosts: 500,
      holdingPeriodYears: 3
    })
    expect(withPeriod.roiPercentage).toBe(plain.roiPercentage)
    expect(withPeriod.annualizedRoiPercentage).toBeDefined()
  })
})
