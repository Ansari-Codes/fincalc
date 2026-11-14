import { describe, it, expect } from 'vitest'
import { calculateRetirementGoal } from '../retirementGoal'
import { calculateLoanPayment } from '../loanPayment'
import { calculateDebtPayoff } from '../debtPayoff'
import { calculateBreakEven } from '../breakEven'

describe('v0.2 Calculator 1: Retirement Savings Goal Calculator', () => {
  it('calculates standard ordinary monthly annuity correctly', () => {
    // Current savings: $50,000, Target: $1,000,000, 30 years (age 35 to 65), 7% annual return
    const result = calculateRetirementGoal({
      currentSavings: 50000,
      targetAmount: 1000000,
      currentAge: 35,
      retirementAge: 65,
      expectedAnnualReturn: 7,
      contributionFrequency: 'monthly',
      contributionTiming: 'end'
    })

    expect(result.isValid).toBe(true)
    expect(result.alreadyAchieved).toBe(false)
    expect(result.yearsToRetirement).toBe(30)
    expect(result.numberOfPeriods).toBe(360)
    // Monthly contribution should be roughly around $490-$500/mo
    expect(result.requiredMonthlyContribution).toBeGreaterThan(450)
    expect(result.requiredMonthlyContribution).toBeLessThan(550)
    expect(result.projectedFinalBalance).toBeGreaterThan(999000)
    expect(result.yearlyBreakdown.length).toBe(30)
    expect(result.yearlyBreakdown[29].endingBalance).toBeGreaterThan(999000)
  })

  it('calculates with zero interest rate (0% return)', () => {
    // Target: $120,000 in 10 years with 0% interest and 0 starting savings => $12,000/yr = $1,000/mo
    const result = calculateRetirementGoal({
      currentSavings: 0,
      targetAmount: 120000,
      currentAge: 30,
      retirementAge: 40,
      expectedAnnualReturn: 0,
      contributionFrequency: 'monthly',
      contributionTiming: 'end'
    })

    expect(result.isValid).toBe(true)
    expect(result.requiredMonthlyContribution).toBeCloseTo(1000, 2)
    expect(result.requiredAnnualContribution).toBeCloseTo(12000, 2)
    expect(result.totalPersonalContributions).toBeCloseTo(120000, 2)
    expect(result.estimatedInvestmentGrowth).toBeCloseTo(0, 2)
    expect(result.projectedFinalBalance).toBeCloseTo(120000, 2)
  })

  it('calculates annuity due (beginning of period) vs ordinary annuity (end of period)', () => {
    const endResult = calculateRetirementGoal({
      currentSavings: 10000,
      targetAmount: 500000,
      currentAge: 25,
      retirementAge: 65,
      expectedAnnualReturn: 8,
      contributionFrequency: 'monthly',
      contributionTiming: 'end'
    })

    const begResult = calculateRetirementGoal({
      currentSavings: 10000,
      targetAmount: 500000,
      currentAge: 25,
      retirementAge: 65,
      expectedAnnualReturn: 8,
      contributionFrequency: 'monthly',
      contributionTiming: 'beginning'
    })

    // Beginning of period contributions compound an extra period, requiring lower monthly contributions
    expect(begResult.requiredMonthlyContribution).toBeLessThan(endResult.requiredMonthlyContribution)
    expect(begResult.projectedFinalBalance).toBeGreaterThanOrEqual(499990)
  })

  it('handles annual contribution frequency', () => {
    const result = calculateRetirementGoal({
      currentSavings: 0,
      targetAmount: 100000,
      currentAge: 40,
      retirementAge: 50,
      expectedAnnualReturn: 6,
      contributionFrequency: 'annually',
      contributionTiming: 'end'
    })

    expect(result.isValid).toBe(true)
    expect(result.numberOfPeriods).toBe(10)
    // PMT = 100000 * 0.06 / ((1.06)^10 - 1) = 6000 / 0.7908477 = ~7,586.80
    expect(result.requiredAnnualContribution).toBeCloseTo(7586.8, 0)
    expect(result.requiredMonthlyContribution).toBeCloseTo(7586.8 / 12, 0)
  })

  it('supports annual step-up contribution scaling', () => {
    const flatResult = calculateRetirementGoal({
      currentSavings: 10000,
      targetAmount: 500000,
      currentAge: 30,
      retirementAge: 55,
      expectedAnnualReturn: 7,
      annualContributionIncreasePct: 0
    })

    const stepUpResult = calculateRetirementGoal({
      currentSavings: 10000,
      targetAmount: 500000,
      currentAge: 30,
      retirementAge: 55,
      expectedAnnualReturn: 7,
      annualContributionIncreasePct: 3 // 3% annual increase
    })

    // Initial contribution with annual step-up will be lower because contributions grow each year
    expect(stepUpResult.requiredMonthlyContribution).toBeLessThan(flatResult.requiredMonthlyContribution)
    expect(stepUpResult.projectedFinalBalance).toBeGreaterThanOrEqual(499000)
  })

  it('detects when target is already achieved by existing savings compounding alone', () => {
    const result = calculateRetirementGoal({
      currentSavings: 500000,
      targetAmount: 500000,
      currentAge: 40,
      retirementAge: 65,
      expectedAnnualReturn: 7
    })

    expect(result.alreadyAchieved).toBe(true)
    expect(result.requiredMonthlyContribution).toBe(0)
    expect(result.requiredAnnualContribution).toBe(0)
  })

  it('validates negative values and impossible age inputs', () => {
    const result = calculateRetirementGoal({
      currentSavings: -1000,
      targetAmount: -500,
      currentAge: 65,
      retirementAge: 55,
      expectedAnnualReturn: -5,
      annualContributionIncreasePct: -2
    })

    expect(result.isValid).toBe(false)
    expect(result.validationErrors.length).toBeGreaterThanOrEqual(4)
  })

  it('handles extremely large portfolio targets ($50,000,000)', () => {
    const result = calculateRetirementGoal({
      currentSavings: 2000000,
      targetAmount: 50000000,
      currentAge: 30,
      retirementAge: 70,
      expectedAnnualReturn: 8
    })

    expect(result.isValid).toBe(true)
    expect(isFinite(result.requiredMonthlyContribution)).toBe(true)
    expect(result.projectedFinalBalance).toBeGreaterThan(49000000)
  })
})

describe('v0.2 Calculator 2: Loan Payment Calculator', () => {
  it('calculates standard 30-year fixed-rate mortgage accurately', () => {
    // $300,000 loan, 6.0% APR, 30 years (360 months)
    // Monthly payment formula M = 300,000 * (0.005) / (1 - (1.005)^-360) = $1,798.65
    const result = calculateLoanPayment({
      principal: 300000,
      annualRate: 6.0,
      term: 30,
      termUnit: 'years'
    })

    expect(result.isValid).toBe(true)
    expect(result.regularMonthlyPayment).toBeCloseTo(1798.65, 1)
    expect(result.actualPayoffMonths).toBe(360)
    expect(result.schedule.length).toBe(360)
    expect(result.totalInterest).toBeCloseTo(347514, -2) // ~$347,514 total interest
    expect(result.schedule[0].interest).toBeCloseTo(1500, 1) // First month interest = 300,000 * 0.005 = 1500
    expect(result.schedule[359].endingBalance).toBeCloseTo(0, 1)
  })

  it('calculates zero-interest loan (0% APR)', () => {
    // $12,000 loan, 0% APR, 12 months => $1,000/month, $0 interest
    const result = calculateLoanPayment({
      principal: 12000,
      annualRate: 0,
      term: 12,
      termUnit: 'months'
    })

    expect(result.isValid).toBe(true)
    expect(result.regularMonthlyPayment).toBeCloseTo(1000, 2)
    expect(result.totalInterest).toBe(0)
    expect(result.totalRepayment).toBe(12000)
    expect(result.actualPayoffMonths).toBe(12)
  })

  it('calculates acceleration with extra monthly payments', () => {
    // $300,000 loan, 6% APR, 30 years + $500/mo extra payment
    const result = calculateLoanPayment({
      principal: 300000,
      annualRate: 6.0,
      term: 30,
      termUnit: 'years',
      extraMonthlyPayment: 500
    })

    expect(result.isValid).toBe(true)
    expect(result.regularMonthlyPayment).toBeCloseTo(1798.65, 1)
    expect(result.totalMonthlyPayment).toBeCloseTo(2298.65, 1)
    // Extra payment should shave off over 10 years (120+ months) and save over $100k interest
    expect(result.actualPayoffMonths).toBeLessThan(240)
    expect(result.monthsSaved).toBeGreaterThan(120)
    expect(result.interestSaved).toBeGreaterThan(100000)
  })

  it('handles fractional interest rates (e.g. 6.875% APR) and auto loan terms', () => {
    // $35,000 car loan, 6.875% APR, 60 months
    const result = calculateLoanPayment({
      principal: 35000,
      annualRate: 6.875,
      term: 60,
      termUnit: 'months'
    })

    expect(result.isValid).toBe(true)
    expect(result.actualPayoffMonths).toBe(60)
    expect(result.regularMonthlyPayment).toBeGreaterThan(690)
    expect(result.regularMonthlyPayment).toBeLessThan(700)
    expect(result.schedule[59].endingBalance).toBeCloseTo(0, 1)
  })

  it('safely handles zero principal and empty inputs', () => {
    const result = calculateLoanPayment({
      principal: 0,
      annualRate: 5,
      term: 15,
      termUnit: 'years'
    })

    expect(result.isValid).toBe(true)
    expect(result.regularMonthlyPayment).toBe(0)
    expect(result.totalInterest).toBe(0)
    expect(result.actualPayoffMonths).toBe(0)
  })

  it('validates negative inputs and enforces 50-year maximum loan safety cap', () => {
    const result = calculateLoanPayment({
      principal: -10000,
      annualRate: -5,
      term: -10,
      termUnit: 'years',
      extraMonthlyPayment: -50
    })

    expect(result.isValid).toBe(false)
    expect(result.validationErrors.length).toBeGreaterThanOrEqual(4)
  })
})

describe('v0.2 Calculator 3: Debt Payoff Planner', () => {
  const sampleDebts = [
    { id: '1', name: 'Credit Card A', balance: 5000, apr: 24.99, minimumPayment: 150 },
    { id: '2', name: 'Store Card B', balance: 1200, apr: 18.00, minimumPayment: 40 },
    { id: '3', name: 'Personal Loan C', balance: 8000, apr: 9.50, minimumPayment: 180 }
  ]

  it('runs snowball and avalanche strategies and compares them correctly', () => {
    const result = calculateDebtPayoff({
      debts: sampleDebts,
      extraMonthlyPayment: 200,
      strategy: 'avalanche'
    })

    expect(result.isValid).toBe(true)
    const snowball = result.comparison.snowball
    const avalanche = result.comparison.avalanche

    // Total initial balance = 5000 + 1200 + 8000 = $14,200
    expect(snowball.totalInitialBalance).toBe(14200)
    expect(avalanche.totalInitialBalance).toBe(14200)

    // Avalanche must save equal or more in interest than Snowball
    expect(avalanche.totalInterestPaid).toBeLessThanOrEqual(snowball.totalInterestPaid)
    expect(result.comparison.interestSavingsWithAvalanche).toBeGreaterThanOrEqual(0)

    // Snowball payoff order should target lowest balance first (Store Card B: 1200)
    expect(snowball.debtPayoffOrder[0]).toBe('Store Card B')

    // Avalanche payoff order should target highest APR first (Credit Card A: 24.99%)
    expect(avalanche.debtPayoffOrder[0]).toBe('Credit Card A')
  })

  it('handles zero-interest debt in the payoff stack', () => {
    const debtsWithZeroApr = [
      { id: '1', name: 'Promo 0% APR Card', balance: 2000, apr: 0, minimumPayment: 100 },
      { id: '2', name: 'High APR Card', balance: 3000, apr: 22, minimumPayment: 100 }
    ]

    const result = calculateDebtPayoff({
      debts: debtsWithZeroApr,
      extraMonthlyPayment: 100,
      strategy: 'avalanche'
    })

    expect(result.isValid).toBe(true)
    // Avalanche targets 22% card first before 0% card
    expect(result.comparison.avalanche.debtPayoffOrder[0]).toBe('High APR Card')
  })

  it('detects negative amortization when minimum payment is lower than accrued interest', () => {
    // $10,000 balance at 24% APR accrues $200/month interest. Min payment $50 causes debt to grow.
    const underpaidDebt = [
      { id: '1', name: 'Underwater Card', balance: 10000, apr: 24, minimumPayment: 50 }
    ]

    const result = calculateDebtPayoff({
      debts: underpaidDebt,
      extraMonthlyPayment: 0
    })

    expect(result.selectedStrategyResult.hasNegativeAmortization).toBe(true)
    expect(result.selectedStrategyResult.warningMessages.length).toBeGreaterThan(0)
  })

  it('handles single debt scenario cleanly', () => {
    const singleDebt = [
      { id: '1', name: 'Single Card', balance: 2500, apr: 15, minimumPayment: 75 }
    ]

    const result = calculateDebtPayoff({
      debts: singleDebt,
      extraMonthlyPayment: 50
    })

    expect(result.isValid).toBe(true)
    expect(result.selectedStrategyResult.payoffMonths).toBeGreaterThan(0)
    expect(result.selectedStrategyResult.totalAmountRepaid).toBeGreaterThan(2500)
  })

  it('validates empty debt lists and negative entries', () => {
    const emptyResult = calculateDebtPayoff({
      debts: [],
      extraMonthlyPayment: 0
    })
    expect(emptyResult.isValid).toBe(false)

    const negResult = calculateDebtPayoff({
      debts: [{ id: '1', name: 'Card', balance: -500, apr: -10, minimumPayment: -20 }],
      extraMonthlyPayment: -100
    })
    expect(negResult.isValid).toBe(false)
  })
})

describe('v0.2 Calculator 4: Business Break-Even Calculator', () => {
  it('calculates break-even units and revenue accurately for standard business case', () => {
    // Selling price: $50, Variable cost: $20, Fixed costs: $30,000
    // CM = $30, CMR = 60%, Break-even units = 1,000, Break-even revenue = $50,000
    const result = calculateBreakEven({
      sellingPricePerUnit: 50,
      variableCostPerUnit: 20,
      totalFixedCosts: 30000
    })

    expect(result.isValid).toBe(true)
    expect(result.isViable).toBe(true)
    expect(result.isLossMakingPerUnit).toBe(false)
    expect(result.contributionMarginPerUnit).toBe(30)
    expect(result.contributionMarginRatio).toBe(60)
    expect(result.breakEvenUnitsExact).toBe(1000)
    expect(result.breakEvenUnitsRounded).toBe(1000)
    expect(result.breakEvenRevenue).toBe(50000)
  })

  it('computes target profit volume and revenue correctly', () => {
    // Fixed costs: $30,000, CM = $30. Target profit: $15,000
    // Required units = (30,000 + 15,000) / 30 = 1,500 units, Revenue = $75,000
    const result = calculateBreakEven({
      sellingPricePerUnit: 50,
      variableCostPerUnit: 20,
      totalFixedCosts: 30000,
      targetProfit: 15000
    })

    expect(result.isValid).toBe(true)
    expect(result.targetProfitUnitsExact).toBe(1500)
    expect(result.targetProfitUnitsRounded).toBe(1500)
    expect(result.targetProfitRevenue).toBe(75000)
  })

  it('computes expected profit and margin of safety when sales volume is supplied', () => {
    // Price = $50, VC = $20, FC = $30,000 (BE = 1,000 units). Expected volume: 1,500 units.
    // Margin of safety = 500 units (33.33%), MoS Revenue = $25,000
    // Expected profit = (1,500 * $30) - $30,000 = $15,000
    const result = calculateBreakEven({
      sellingPricePerUnit: 50,
      variableCostPerUnit: 20,
      totalFixedCosts: 30000,
      expectedSalesVolume: 1500
    })

    expect(result.isValid).toBe(true)
    expect(result.expectedProfitOrLoss).toBe(15000)
    expect(result.marginOfSafetyUnits).toBe(500)
    expect(result.marginOfSafetyRevenue).toBe(25000)
    expect(result.marginOfSafetyPercentage).toBeCloseTo(33.33, 1)
  })

  it('rounds break-even units upward (ceil) for physical units', () => {
    // Selling price: $10, Variable cost: $7 -> CM = $3. Fixed costs: $10,000
    // Exact BE = 3333.333... Rounded BE = 3334 units
    const result = calculateBreakEven({
      sellingPricePerUnit: 10,
      variableCostPerUnit: 7,
      totalFixedCosts: 10000
    })

    expect(result.isValid).toBe(true)
    expect(result.breakEvenUnitsExact).toBeCloseTo(3333.33, 2)
    expect(result.breakEvenUnitsRounded).toBe(3334)
    expect(result.breakEvenRevenue).toBe(33340)
  })

  it('detects unviable loss-making unit economics (Variable Cost >= Selling Price)', () => {
    const equalCost = calculateBreakEven({
      sellingPricePerUnit: 25,
      variableCostPerUnit: 25,
      totalFixedCosts: 5000
    })

    expect(equalCost.isViable).toBe(false)
    expect(equalCost.contributionMarginPerUnit).toBe(0)
    expect(equalCost.validationErrors.length).toBeGreaterThan(0)

    const higherCost = calculateBreakEven({
      sellingPricePerUnit: 20,
      variableCostPerUnit: 25,
      totalFixedCosts: 5000
    })

    expect(higherCost.isViable).toBe(false)
    expect(higherCost.isLossMakingPerUnit).toBe(true)
    expect(higherCost.contributionMarginPerUnit).toBe(-5)
  })

  it('handles zero fixed costs and zero variable costs', () => {
    const zeroFC = calculateBreakEven({
      sellingPricePerUnit: 100,
      variableCostPerUnit: 40,
      totalFixedCosts: 0
    })
    expect(zeroFC.breakEvenUnitsExact).toBe(0)

    const zeroVC = calculateBreakEven({
      sellingPricePerUnit: 100,
      variableCostPerUnit: 0,
      totalFixedCosts: 5000
    })
    expect(zeroVC.contributionMarginPerUnit).toBe(100)
    expect(zeroVC.breakEvenUnitsExact).toBe(50)
  })

  it('validates negative values and invalid prices', () => {
    const invalid = calculateBreakEven({
      sellingPricePerUnit: -10,
      variableCostPerUnit: -5,
      totalFixedCosts: -100,
      targetProfit: -50,
      expectedSalesVolume: -20
    })

    expect(invalid.isValid).toBe(false)
    expect(invalid.validationErrors.length).toBeGreaterThanOrEqual(4)
  })
})
