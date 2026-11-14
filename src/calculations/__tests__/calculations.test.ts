import { describe, it, expect } from 'vitest'
import { calculateStockAverage } from '../stockAverage'
import { calculateRoi } from '../roi'
import { calculateCommission } from '../commission'
import { calculateCreditCardApr } from '../creditCardApr'
import { calculateCompoundInterest } from '../compoundInterest'
import { calculateRetirementLongevity } from '../retirementLongevity'

describe('Stock Average Calculator', () => {
  it('calculates weighted average without fees for two purchases', () => {
    // 10 shares at $100 ($1000) + 20 shares at $130 ($2600) = 30 shares for $3600 => $120/share
    const result = calculateStockAverage({
      purchases: [
        { id: '1', price: 100, shares: 10 },
        { id: '2', price: 130, shares: 20 }
      ],
      includeFees: false
    })

    expect(result.totalShares).toBe(30)
    expect(result.totalCostBeforeFees).toBe(3600)
    expect(result.totalCost).toBe(3600)
    expect(result.weightedAverageCost).toBe(120)
  })

  it('includes transaction fees when enabled', () => {
    // 10 shares at $100 + $10 fee; 20 shares at $130 + $20 fee = $3600 + $30 = $3630 / 30 = $121/share
    const result = calculateStockAverage({
      purchases: [
        { id: '1', price: 100, shares: 10, fee: 10 },
        { id: '2', price: 130, shares: 20, fee: 20 }
      ],
      includeFees: true
    })

    expect(result.totalShares).toBe(30)
    expect(result.totalFees).toBe(30)
    expect(result.totalCost).toBe(3630)
    expect(result.weightedAverageCost).toBe(121)
  })

  it('handles hypothetical additional purchase correctly', () => {
    const result = calculateStockAverage({
      purchases: [
        { id: '1', price: 100, shares: 10 }
      ],
      includeFees: false,
      hypothetical: {
        price: 80,
        shares: 10
      }
    })

    expect(result.totalShares).toBe(10)
    expect(result.weightedAverageCost).toBe(100)
    expect(result.hypotheticalProjected).toBeDefined()
    expect(result.hypotheticalProjected?.newTotalShares).toBe(20)
    expect(result.hypotheticalProjected?.newTotalCost).toBe(1800)
    expect(result.hypotheticalProjected?.newWeightedAverageCost).toBe(90)
  })

  it('handles empty or zero purchases without throwing or returning NaN', () => {
    const result = calculateStockAverage({
      purchases: [],
      includeFees: true
    })

    expect(result.totalShares).toBe(0)
    expect(result.totalCost).toBe(0)
    expect(result.weightedAverageCost).toBe(0)
  })
})

describe('ROI Calculator', () => {
  it('calculates standard positive ROI', () => {
    // Cost $1,000, Returned $1,500 => Profit $500, ROI 50%
    const result = calculateRoi({
      initialInvestment: 1000,
      finalValue: 1500
    })

    expect(result.totalCost).toBe(1000)
    expect(result.totalValueReturned).toBe(1500)
    expect(result.netProfit).toBe(500)
    expect(result.roiPercentage).toBe(50)
    expect(result.isProfitable).toBe(true)
  })

  it('accounts for additional costs and income', () => {
    // Initial $1000 + $200 costs = $1200; Final $1500 + $300 dividends = $1800
    // Profit = $600, ROI = (600 / 1200) * 100 = 50%
    const result = calculateRoi({
      initialInvestment: 1000,
      additionalCosts: 200,
      finalValue: 1500,
      additionalIncome: 300
    })

    expect(result.totalCost).toBe(1200)
    expect(result.totalValueReturned).toBe(1800)
    expect(result.netProfit).toBe(600)
    expect(result.roiPercentage).toBe(50)
  })

  it('handles negative ROI (loss)', () => {
    // Cost $2,000, Returned $1,500 => Net loss -$500, ROI -25%
    const result = calculateRoi({
      initialInvestment: 2000,
      finalValue: 1500
    })

    expect(result.netProfit).toBe(-500)
    expect(result.roiPercentage).toBe(-25)
    expect(result.isProfitable).toBe(false)
  })

  it('safely handles zero total cost without dividing by zero', () => {
    const result = calculateRoi({
      initialInvestment: 0,
      finalValue: 500
    })

    expect(result.roiPercentage).toBe(0)
    expect(result.netProfit).toBe(500)
  })
})

describe('Commission Calculator', () => {
  it('calculates flat percentage commission', () => {
    const result = calculateCommission({
      mode: 'percentage',
      salesAmount: 50000,
      commissionRate: 8
    })

    expect(result.commissionEarned).toBe(4000)
    expect(result.effectiveRate).toBe(8)
  })

  it('calculates fixed commission per sale', () => {
    const result = calculateCommission({
      mode: 'fixed',
      numberOfSales: 15,
      fixedPerSale: 250
    })

    expect(result.commissionEarned).toBe(3750)
  })

  it('calculates marginal tiered commission correctly', () => {
    // Sales: $150,000
    // Tier 1: 0 - 50,000 at 5% => $2,500
    // Tier 2: 50,000 - 100,000 at 8% => $4,000
    // Tier 3: Over 100,000 at 10% => 50,000 * 10% = $5,000
    // Total = $11,500. Effective rate = 11,500 / 150,000 = 7.666...%
    const result = calculateCommission({
      mode: 'tiered',
      tieredSalesAmount: 150000,
      tiers: [
        { id: 't1', threshold: 50000, rate: 5 },
        { id: 't2', threshold: 100000, rate: 8 },
        { id: 't3', threshold: Infinity, rate: 10 }
      ]
    })

    expect(result.commissionEarned).toBe(11500)
    expect(result.effectiveRate).toBeCloseTo(7.666, 2)
    expect(result.tierBreakdown).toHaveLength(3)
    expect(result.tierBreakdown?.[0].commission).toBe(2500)
    expect(result.tierBreakdown?.[1].commission).toBe(4000)
    expect(result.tierBreakdown?.[2].commission).toBe(5000)
  })
})

describe('Credit Card APR Calculator', () => {
  it('calculates first month interest and principal accurately', () => {
    // Balance $5,000, APR 24% => Monthly rate = 2%, Interest = $100
    // Monthly payment $250 => Principal = $150
    const result = calculateCreditCardApr({
      balance: 5000,
      apr: 24,
      monthlyPayment: 250
    })

    expect(result.firstMonthInterest).toBe(100)
    expect(result.firstMonthPrincipal).toBe(150)
    expect(result.isPayingOff).toBe(true)
    expect(result.payoffMonths).toBeGreaterThan(0)
    expect(result.payoffMonths).toBeLessThan(600)
  })

  it('detects when payment is less than interest and prevents infinite loop', () => {
    // Balance $5,000, APR 24% => Monthly interest = $100. Payment $50
    const result = calculateCreditCardApr({
      balance: 5000,
      apr: 24,
      monthlyPayment: 50
    })

    expect(result.isPayingOff).toBe(false)
    expect(result.payoffMonths).toBe(Infinity)
    expect(result.warningMessage).toContain('too low')
  })
})

describe('Compound Interest Calculator', () => {
  it('calculates single lump sum compounding without contributions', () => {
    // $10,000 at 10% compounded annually for 2 years:
    // Year 1: $11,000
    // Year 2: $12,100
    const result = calculateCompoundInterest({
      initialPrincipal: 10000,
      annualInterestRate: 10,
      compoundingFrequency: 'annually',
      years: 2,
      contributionAmount: 0
    })

    expect(result.futureValue).toBeCloseTo(12100, 0)
    expect(result.totalInterestEarned).toBeCloseTo(2100, 0)
    expect(result.yearlyBreakdown).toHaveLength(2)
  })

  it('calculates with monthly contributions', () => {
    const result = calculateCompoundInterest({
      initialPrincipal: 5000,
      contributionAmount: 500,
      contributionFrequency: 'monthly',
      annualInterestRate: 8,
      compoundingFrequency: 'monthly',
      years: 10,
      contributionTiming: 'end'
    })

    expect(result.futureValue).toBeGreaterThan(5000 + 500 * 12 * 10)
    expect(result.totalContributions).toBe(60000)
    expect(result.totalPrincipal).toBe(5000)
    expect(result.yearlyBreakdown).toHaveLength(10)
  })
})

describe('Retirement Longevity Calculator', () => {
  it('calculates depletion timeline under realistic withdrawals', () => {
    // Starting $200,000, withdrawing $4,000/month, 4% annual return, 0% inflation
    const result = calculateRetirementLongevity({
      startingBalance: 200000,
      plannedWithdrawal: 4000,
      withdrawalFrequency: 'monthly',
      expectedAnnualReturn: 4,
      expectedAnnualInflation: 0,
      horizonYears: 30
    })

    expect(result.isDepleted).toBe(true)
    expect(result.depletedYears).toBeGreaterThan(0)
    expect(result.depletedYears).toBeLessThan(10)
  })

  it('detects when savings do not deplete within horizon', () => {
    // Starting $1,000,000, withdrawing $1,000/month, 8% return
    const result = calculateRetirementLongevity({
      startingBalance: 1000000,
      plannedWithdrawal: 1000,
      withdrawalFrequency: 'monthly',
      expectedAnnualReturn: 8,
      horizonYears: 30
    })

    expect(result.isDepleted).toBe(false)
    expect(result.depletedYears).toBeNull()
    expect(result.message).toContain('did not run out')
  })
})
