import { describe, it, expect } from 'vitest'
import { calculateStockAverage } from '../stockAverage'
import { calculateRoi } from '../roi'
import { calculateCommission } from '../commission'
import { calculateCreditCardApr } from '../creditCardApr'
import { calculateCompoundInterest } from '../compoundInterest'
import { calculateRetirementLongevity } from '../retirementLongevity'

describe('1. Stock Average Calculator Audit', () => {
  it('calculates weighted average without fees for two purchases', () => {
    // 10 shares at $100 ($1,000) + 20 shares at $130 ($2,600) = 30 shares for $3,600 => $120.00/share
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
    expect(result.isValid).toBe(true)
  })

  it('includes transaction fees when enabled', () => {
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

  it('handles fractional shares accurately (DRIP scenarios)', () => {
    // 12.5 shares at $80 ($1,000) + 7.5 shares at $120 ($900) = 20 shares for $1,900 => $95.00/share
    const result = calculateStockAverage({
      purchases: [
        { id: '1', price: 80, shares: 12.5 },
        { id: '2', price: 120, shares: 7.5 }
      ],
      includeFees: false
    })

    expect(result.totalShares).toBe(20)
    expect(result.totalCost).toBe(1900)
    expect(result.weightedAverageCost).toBe(95)
  })

  it('safely handles zero shares and empty purchase arrays without division by zero', () => {
    const result = calculateStockAverage({
      purchases: [],
      includeFees: true
    })

    expect(result.totalShares).toBe(0)
    expect(result.weightedAverageCost).toBe(0)
    expect(result.isValid).toBe(false)
  })

  it('guards against negative shares and prices', () => {
    const result = calculateStockAverage({
      purchases: [
        { id: '1', price: -50, shares: 10 },
        { id: '2', price: 100, shares: -5 }
      ],
      includeFees: false
    })

    expect(result.isValid).toBe(false)
    expect(result.validationErrors.length).toBeGreaterThan(0)
    expect(result.totalShares).toBe(0)
  })

  it('calculates with extremely large values (billion-dollar institutional lots)', () => {
    const result = calculateStockAverage({
      purchases: [
        { id: '1', price: 500, shares: 100000000 }, // 100M shares * $500 = $50B
        { id: '2', price: 600, shares: 100000000 }  // 100M shares * $600 = $60B
      ],
      includeFees: false
    })

    expect(result.totalShares).toBe(200000000)
    expect(result.totalCost).toBe(110000000000)
    expect(result.weightedAverageCost).toBe(550)
  })

  it('calculates hypothetical additional purchase projections', () => {
    const result = calculateStockAverage({
      purchases: [{ id: '1', price: 100, shares: 10 }],
      includeFees: false,
      hypothetical: { price: 80, shares: 10 }
    })

    expect(result.hypotheticalProjected?.newTotalShares).toBe(20)
    expect(result.hypotheticalProjected?.newTotalCost).toBe(1800)
    expect(result.hypotheticalProjected?.newWeightedAverageCost).toBe(90)
  })
})

describe('2. ROI Calculator Audit', () => {
  it('calculates standard positive ROI', () => {
    const result = calculateRoi({
      initialInvestment: 1000,
      finalValue: 1500
    })

    expect(result.totalCost).toBe(1000)
    expect(result.totalValueReturned).toBe(1500)
    expect(result.netProfit).toBe(500)
    expect(result.roiPercentage).toBe(50)
    expect(result.isProfitable).toBe(true)
    expect(result.isValid).toBe(true)
  })

  it('handles negative ROI and 100% complete loss', () => {
    const result = calculateRoi({
      initialInvestment: 5000,
      finalValue: 0
    })

    expect(result.netProfit).toBe(-5000)
    expect(result.roiPercentage).toBe(-100)
    expect(result.isProfitable).toBe(false)
  })

  it('handles break-even investment', () => {
    const result = calculateRoi({
      initialInvestment: 2500,
      finalValue: 2500
    })

    expect(result.netProfit).toBe(0)
    expect(result.roiPercentage).toBe(0)
    expect(result.isBreakEven).toBe(true)
  })

  it('safely handles zero total cost without dividing by zero', () => {
    const result = calculateRoi({
      initialInvestment: 0,
      finalValue: 500
    })

    expect(result.roiPercentage).toBe(0)
    expect(result.isValid).toBe(false)
    expect(result.validationErrors).toContain('Total investment cost must be greater than zero to calculate percentage ROI.')
  })

  it('guards against negative input values', () => {
    const result = calculateRoi({
      initialInvestment: -1000,
      finalValue: 2000
    })

    expect(result.isValid).toBe(false)
    expect(result.validationErrors).toContain('Initial investment cannot be negative.')
  })

  it('handles extremely large commercial investments', () => {
    const result = calculateRoi({
      initialInvestment: 1000000000, // $1B
      finalValue: 1250000000        // $1.25B
    })

    expect(result.netProfit).toBe(250000000)
    expect(result.roiPercentage).toBe(25)
  })
})

describe('3. Commission Calculator Audit', () => {
  it('calculates flat percentage commission with fractional rates', () => {
    const result = calculateCommission({
      mode: 'percentage',
      salesAmount: 85500,
      commissionRate: 6.25
    })

    expect(result.commissionEarned).toBeCloseTo(5343.75, 2)
    expect(result.effectiveRate).toBe(6.25)
  })

  it('calculates fixed unit commission', () => {
    const result = calculateCommission({
      mode: 'fixed',
      numberOfSales: 24,
      fixedPerSale: 175
    })

    expect(result.commissionEarned).toBe(4200)
  })

  it('calculates marginal progressive tiers correctly', () => {
    // $150,000 sales
    // Tier 1: $0 - $50,000 at 5% => $2,500
    // Tier 2: $50,000 - $100,000 at 8% => $4,000
    // Tier 3: Over $100,000 at 12% => $50,000 * 12% = $6,000
    // Total = $12,500. Effective rate = 12,500 / 150,000 = 8.333%
    const result = calculateCommission({
      mode: 'tiered',
      tieredSalesAmount: 150000,
      tiers: [
        { id: 't1', threshold: 50000, rate: 5 },
        { id: 't2', threshold: 100000, rate: 8 },
        { id: 't3', threshold: Infinity, rate: 12 }
      ]
    })

    expect(result.commissionEarned).toBe(12500)
    expect(result.effectiveRate).toBeCloseTo(8.333, 2)
    expect(result.tierBreakdown).toHaveLength(3)
    expect(result.tierBreakdown?.[0].commission).toBe(2500)
    expect(result.tierBreakdown?.[1].commission).toBe(4000)
    expect(result.tierBreakdown?.[2].commission).toBe(6000)
  })

  it('auto-sorts unordered tiers defensively', () => {
    const result = calculateCommission({
      mode: 'tiered',
      tieredSalesAmount: 80000,
      tiers: [
        { id: 't2', threshold: 100000, rate: 8 },
        { id: 't1', threshold: 50000, rate: 5 }
      ]
    })

    // $50k at 5% ($2,500) + $30k at 8% ($2,400) = $4,900
    expect(result.commissionEarned).toBe(4900)
    expect(result.tierBreakdown?.[0].rate).toBe(5)
    expect(result.tierBreakdown?.[1].rate).toBe(8)
  })

  it('handles zero sales amount', () => {
    const result = calculateCommission({
      mode: 'percentage',
      salesAmount: 0,
      commissionRate: 10
    })

    expect(result.commissionEarned).toBe(0)
    expect(result.effectiveRate).toBe(10)
  })
})

describe('4. Credit Card APR Calculator Audit', () => {
  it('calculates first month interest and principal reduction', () => {
    // $5,000 balance at 24% APR => monthly periodic rate = 2% => $100 interest
    // $250 payment => $150 principal reduction
    const result = calculateCreditCardApr({
      balance: 5000,
      apr: 24,
      monthlyPayment: 250
    })

    expect(result.firstMonthInterest).toBe(100)
    expect(result.firstMonthPrincipal).toBe(150)
    expect(result.isPayingOff).toBe(true)
    expect(result.payoffMonths).toBeGreaterThan(0)
    expect(result.schedulePreview.length).toBeGreaterThan(0)
    // Verify first month startBalance in schedule
    expect(result.schedulePreview[0].startBalance).toBe(5000)
  })

  it('handles 0% APR promotional rate', () => {
    // $1,200 balance at 0% APR, $100/month payment => 12 months, 0 interest
    const result = calculateCreditCardApr({
      balance: 1200,
      apr: 0,
      monthlyPayment: 100
    })

    expect(result.firstMonthInterest).toBe(0)
    expect(result.firstMonthPrincipal).toBe(100)
    expect(result.payoffMonths).toBe(12)
    expect(result.totalInterestPaid).toBe(0)
    expect(result.totalAmountPaid).toBe(1200)
  })

  it('safely handles zero balance', () => {
    const result = calculateCreditCardApr({
      balance: 0,
      apr: 19.99,
      monthlyPayment: 100
    })

    expect(result.payoffMonths).toBe(0)
    expect(result.totalInterestPaid).toBe(0)
    expect(result.isPayingOff).toBe(true)
  })

  it('detects when payment is less than interest and prevents infinite loop', () => {
    // $10,000 at 24% APR => $200 monthly interest. Payment is $100
    const result = calculateCreditCardApr({
      balance: 10000,
      apr: 24,
      monthlyPayment: 100
    })

    expect(result.isPayingOff).toBe(false)
    expect(result.payoffMonths).toBe(Infinity)
    expect(result.warningMessage).toContain('too low')
  })

  it('factors in ongoing planned new purchases', () => {
    // $5,000 balance, $300 payment, $150 new purchases per month
    const result = calculateCreditCardApr({
      balance: 5000,
      apr: 18,
      monthlyPayment: 300,
      plannedNewPurchases: 150
    })

    expect(result.isPayingOff).toBe(true)
    expect(result.payoffMonths).toBeGreaterThan(20)
  })
})

describe('5. Compound Interest Calculator Audit', () => {
  it('matches exact closed-form lump sum compound growth formula', () => {
    // $10,000 at 10% compounded annually for 3 years:
    // A = 10,000 * (1 + 0.10)^3 = 10,000 * 1.331 = $13,310
    const result = calculateCompoundInterest({
      initialPrincipal: 10000,
      annualInterestRate: 10,
      compoundingFrequency: 'annually',
      years: 3,
      contributionAmount: 0
    })

    expect(result.futureValue).toBeCloseTo(13310, 0)
    expect(result.totalInterestEarned).toBeCloseTo(3310, 0)
    expect(result.yearlyBreakdown).toHaveLength(3)
  })

  it('tests all compounding frequencies (daily, monthly, quarterly, annual)', () => {
    const baseInput = {
      initialPrincipal: 10000,
      annualInterestRate: 8,
      years: 5,
      contributionAmount: 0
    }

    const annual = calculateCompoundInterest({ ...baseInput, compoundingFrequency: 'annually' })
    const quarterly = calculateCompoundInterest({ ...baseInput, compoundingFrequency: 'quarterly' })
    const monthly = calculateCompoundInterest({ ...baseInput, compoundingFrequency: 'monthly' })
    const daily = calculateCompoundInterest({ ...baseInput, compoundingFrequency: 'daily' })

    // Higher frequency produces higher yield: Daily > Monthly > Quarterly > Annual
    expect(daily.futureValue).toBeGreaterThan(monthly.futureValue)
    expect(monthly.futureValue).toBeGreaterThan(quarterly.futureValue)
    expect(quarterly.futureValue).toBeGreaterThan(annual.futureValue)
  })

  it('handles 0% interest rate without crashing', () => {
    const result = calculateCompoundInterest({
      initialPrincipal: 5000,
      contributionAmount: 200,
      contributionFrequency: 'monthly',
      annualInterestRate: 0,
      years: 5
    })

    // $5,000 + $200 * 12 * 5 = $17,000
    expect(result.futureValue).toBe(17000)
    expect(result.totalInterestEarned).toBe(0)
  })

  it('handles zero initial principal with regular contributions', () => {
    const result = calculateCompoundInterest({
      initialPrincipal: 0,
      contributionAmount: 500,
      contributionFrequency: 'monthly',
      annualInterestRate: 7,
      years: 10
    })

    expect(result.totalPrincipal).toBe(0)
    expect(result.totalContributions).toBe(60000)
    expect(result.futureValue).toBeGreaterThan(60000)
  })

  it('compares beginning of period vs end of period timing', () => {
    const input = {
      initialPrincipal: 1000,
      contributionAmount: 100,
      contributionFrequency: 'monthly' as const,
      annualInterestRate: 8,
      compoundingFrequency: 'monthly' as const,
      years: 5
    }

    const endTiming = calculateCompoundInterest({ ...input, contributionTiming: 'end' })
    const beginningTiming = calculateCompoundInterest({ ...input, contributionTiming: 'beginning' })

    // Beginning timing earns interest on contributions in the period, producing higher future value
    expect(beginningTiming.futureValue).toBeGreaterThan(endTiming.futureValue)
  })
})

describe('6. Retirement Money Longevity Calculator Audit', () => {
  it('calculates depletion timeline under inflation-adjusted spending', () => {
    // $300,000 starting, withdrawing $3,000/month, 5% annual return, 2.5% inflation
    const result = calculateRetirementLongevity({
      startingBalance: 300000,
      plannedWithdrawal: 3000,
      withdrawalFrequency: 'monthly',
      expectedAnnualReturn: 5,
      expectedAnnualInflation: 2.5,
      adjustWithdrawalsForInflation: true,
      horizonYears: 40
    })

    expect(result.isDepleted).toBe(true)
    expect(result.depletedYears).toBeGreaterThan(0)
    expect(result.depletedYears).toBeLessThan(15)
    expect(result.message).toMatch(/Estimated savings depleted after \d+ years/)
  })

  it('handles zero starting balance edge case', () => {
    const result = calculateRetirementLongevity({
      startingBalance: 0,
      plannedWithdrawal: 2000,
      expectedAnnualReturn: 5,
      horizonYears: 30
    })

    expect(result.isDepleted).toBe(true)
    expect(result.depletedYears).toBe(0)
    expect(result.message).toContain('starting balance is $0')
  })

  it('handles zero planned withdrawal edge case (infinite longevity)', () => {
    const result = calculateRetirementLongevity({
      startingBalance: 500000,
      plannedWithdrawal: 0,
      expectedAnnualReturn: 6,
      horizonYears: 20
    })

    expect(result.isDepleted).toBe(false)
    expect(result.depletedYears).toBeNull()
    expect(result.endingBalanceAtHorizon).toBeGreaterThan(500000)
    expect(result.message).toContain('did not run out')
  })

  it('handles 0% annual return (pure cash drawdown)', () => {
    // $120,000 starting, $1,000/month ($12,000/yr), 0% return, 0% inflation
    // Exactly 10 years (120 months)
    const result = calculateRetirementLongevity({
      startingBalance: 120000,
      plannedWithdrawal: 1000,
      withdrawalFrequency: 'monthly',
      expectedAnnualReturn: 0,
      expectedAnnualInflation: 0,
      adjustWithdrawalsForInflation: false,
      horizonYears: 30
    })

    expect(result.isDepleted).toBe(true)
    expect(result.depletedYears).toBe(10)
    expect(result.depletedMonths).toBe(0)
    expect(result.totalWithdrawn).toBe(120000)
  })

  it('detects when returns exceed withdrawals (perpetual endowment)', () => {
    // $2,000,000 starting, $2,000/month withdrawal ($24,000/yr = 1.2%), 7% return
    const result = calculateRetirementLongevity({
      startingBalance: 2000000,
      plannedWithdrawal: 2000,
      withdrawalFrequency: 'monthly',
      expectedAnnualReturn: 7,
      expectedAnnualInflation: 0,
      horizonYears: 30
    })

    expect(result.isDepleted).toBe(false)
    expect(result.endingBalanceAtHorizon).toBeGreaterThan(2000000)
    expect(result.message).toContain('did not run out')
  })
})
