import { describe, it, expect } from 'vitest'
import { calculateLoanPayment } from '../loanPayment'
import {
  findCrossoverPoint,
  aggregateScheduleByYear,
  calculateAmortizationMilestones,
  generateSvgPath,
  generateAreaPath,
  generateStackAreaPath
} from '../amortizationVisualization'

describe('Amortization Visualization Engine & Milestones', () => {
  const baseMortgage = calculateLoanPayment({
    principal: 300000,
    annualRate: 6.5,
    term: 30,
    termUnit: 'years'
  })

  const acceleratedMortgage = calculateLoanPayment({
    principal: 300000,
    annualRate: 6.5,
    term: 30,
    termUnit: 'years',
    extraMonthlyPayment: 250
  })

  it('accurately identifies the principal/interest crossover point at Month 233', () => {
    const crossover = findCrossoverPoint(baseMortgage.schedule)
    expect(crossover).not.toBeNull()
    expect(crossover?.month).toBe(233)
    expect(crossover?.year).toBe(20)
    expect(crossover?.monthInYear).toBe(5)

    // Month 232: interest still exceeds principal
    const month232 = baseMortgage.schedule[231]
    expect(month232.interest).toBeGreaterThan(month232.principalRepaid)
    expect(month232.interest).toBeCloseTo(951.62, 1)
    expect(month232.principalRepaid).toBeCloseTo(944.58, 1)

    // Month 233: principalRepaid ($949.70) surpasses interest ($946.50)
    const month233 = baseMortgage.schedule[232]
    expect(month233.principalRepaid).toBeGreaterThan(month233.interest)
    expect(month233.principalRepaid).toBeCloseTo(949.70, 1)
    expect(month233.interest).toBeCloseTo(946.50, 1)
  })

  it('aggregates monthly schedule into exactly 30 annual blocks for standard mortgage', () => {
    const annuals = aggregateScheduleByYear(baseMortgage.schedule)
    expect(annuals.length).toBe(30)

    // Year 1 starting balance must be $300,000
    expect(annuals[0].year).toBe(1)
    expect(annuals[0].startingBalance).toBe(300000)

    // Sum of annual interest across 30 years must match total interest
    const totalAnnualInterest = annuals.reduce((sum, y) => sum + y.totalInterestPaid, 0)
    expect(totalAnnualInterest).toBeCloseTo(382633.47, 1)

    // Sum of annual principal across 30 years must match principal
    const totalAnnualPrincipal = annuals.reduce((sum, y) => sum + y.totalPrincipalPaid, 0)
    expect(totalAnnualPrincipal).toBeCloseTo(300000, 1)

    // Final year ending balance must be 0
    expect(annuals[29].endingBalance).toBe(0)
  })

  it('independently verifies Year 1 annual totals against the standard monthly schedule', () => {
    const annuals = aggregateScheduleByYear(baseMortgage.schedule)
    const yr1 = annuals[0]

    // Reference values under standard monthly compounding (0.065 / 12)
    // Monthly payment M = $1,896.20407...
    // Total Year 1 payment = 12 * 1,896.20407 = $22,754.45
    expect(yr1.year).toBe(1)
    expect(yr1.startingBalance).toBe(300000)
    expect(yr1.totalInterestPaid).toBeCloseTo(19401.27, 2)
    expect(yr1.totalPrincipalPaid).toBeCloseTo(3353.18, 2)
    expect(yr1.totalPaid).toBeCloseTo(22754.45, 2)
    expect(yr1.endingBalance).toBeCloseTo(296646.82, 2)

    // Verify against manual slice sum of the first 12 monthly rows
    const first12 = baseMortgage.schedule.slice(0, 12)
    const manualInterest = first12.reduce((s, r) => s + r.interest, 0)
    const manualPrincipal = first12.reduce((s, r) => s + r.principalRepaid, 0)
    const manualPaid = first12.reduce((s, r) => s + r.totalPaymentThisMonth, 0)

    expect(yr1.totalInterestPaid).toBeCloseTo(manualInterest, 4)
    expect(yr1.totalPrincipalPaid).toBeCloseTo(manualPrincipal, 4)
    expect(yr1.totalPaid).toBeCloseTo(manualPaid, 4)
    expect(yr1.endingBalance).toBe(first12[11].endingBalance)
  })

  it('independently establishes Month 257 as the 50% principal reduction milestone', () => {
    const milestones = calculateAmortizationMilestones(baseMortgage.schedule)
    expect(milestones).not.toBeNull()

    // Threshold is 50% of $300,000 = $150,000.00
    const halfPrincipal = 150000.00

    // Month 256: ending balance is still above $150k
    const month256 = baseMortgage.schedule[255]
    expect(month256.paymentNumber).toBe(256)
    expect(month256.endingBalance).toBeGreaterThan(halfPrincipal)
    expect(month256.endingBalance).toBeCloseTo(150468.40, 2)

    // Month 257: ending balance crosses below $150k for the first time
    const month257 = baseMortgage.schedule[256]
    expect(month257.paymentNumber).toBe(257)
    expect(month257.endingBalance).toBeLessThanOrEqual(halfPrincipal)
    expect(month257.endingBalance).toBeCloseTo(149387.24, 2)

    // Amortization milestone must accurately identify Month 257
    expect(milestones?.halfwayBalancePoint?.month).toBe(257)
    expect(milestones?.halfwayBalancePoint?.balance).toBeCloseTo(149387.24, 2)
    expect(milestones?.halfwayBalancePoint?.year).toBeCloseTo(21.4, 1)
  })

  it('independently establishes Month 205 as the 75% cumulative interest milestone', () => {
    const milestones = calculateAmortizationMilestones(baseMortgage.schedule)
    expect(milestones).not.toBeNull()

    // Standard lifetime interest is $382,633.47; 75% threshold is $286,975.10
    const totalLifetimeInterest = baseMortgage.totalInterest
    expect(totalLifetimeInterest).toBeCloseTo(382633.47, 2)
    const threshold75 = totalLifetimeInterest * 0.75
    expect(threshold75).toBeCloseTo(286975.10, 2)

    // Month 204: cumulative interest is below 75% threshold ($286,176.31 < $286,975.10)
    const month204 = baseMortgage.schedule[203]
    expect(month204.paymentNumber).toBe(204)
    expect(month204.totalInterestPaidToDate).toBeLessThan(threshold75)
    expect(month204.totalInterestPaidToDate).toBeCloseTo(286176.31, 2)

    // Month 205: cumulative interest reaches or exceeds 75% for the first time ($287,256.12 >= $286,975.10)
    const month205 = baseMortgage.schedule[204]
    expect(month205.paymentNumber).toBe(205)
    expect(month205.totalInterestPaidToDate).toBeGreaterThanOrEqual(threshold75)
    expect(month205.totalInterestPaidToDate).toBeCloseTo(287256.12, 2)

    // Milestone must identify Month 205
    expect(milestones?.seventyFivePercentInterestPoint?.month).toBe(205)
    expect(milestones?.seventyFivePercentInterestPoint?.cumulativeInterest).toBeCloseTo(287256.12, 2)
    expect(milestones?.seventyFivePercentInterestPoint?.threshold).toBeCloseTo(286975.10, 2)
  })

  it('strictly reconciles all 30 annual blocks against monthly schedule and total loan sums', () => {
    const annuals = aggregateScheduleByYear(baseMortgage.schedule)
    expect(annuals.length).toBe(30)

    let runningPrincipalSum = 0
    let runningInterestSum = 0
    let runningPaymentSum = 0

    for (let y = 0; y < 30; y++) {
      const yearSummary = annuals[y]
      const yearNum = y + 1
      expect(yearSummary.year).toBe(yearNum)

      // 12 monthly rows corresponding to this year
      const monthlySlice = baseMortgage.schedule.slice(y * 12, (y + 1) * 12)
      expect(monthlySlice.length).toBe(12)

      // Check boundary balance continuity
      expect(yearSummary.startingBalance).toBe(monthlySlice[0].startingBalance)
      expect(yearSummary.endingBalance).toBe(monthlySlice[11].endingBalance)

      // Check sum of principal, interest, and payments within the year
      const slicePrincipal = monthlySlice.reduce((s, r) => s + r.principalRepaid + r.additionalPayment, 0)
      const sliceInterest = monthlySlice.reduce((s, r) => s + r.interest, 0)
      const sliceTotal = monthlySlice.reduce((s, r) => s + r.totalPaymentThisMonth, 0)

      expect(yearSummary.totalPrincipalPaid).toBeCloseTo(slicePrincipal, 4)
      expect(yearSummary.totalInterestPaid).toBeCloseTo(sliceInterest, 4)
      expect(yearSummary.totalPaid).toBeCloseTo(sliceTotal, 4)

      // In a fixed-rate loan without prepayments, yearly payment equals 12 * monthly installment
      expect(yearSummary.totalPaid).toBeCloseTo(12 * baseMortgage.regularMonthlyPayment, 4)

      runningPrincipalSum += yearSummary.totalPrincipalPaid
      runningInterestSum += yearSummary.totalInterestPaid
      runningPaymentSum += yearSummary.totalPaid
    }

    // Cumulative 30-year totals must match loan totals exactly
    expect(runningPrincipalSum).toBeCloseTo(300000.00, 2)
    expect(runningInterestSum).toBeCloseTo(382633.47, 2)
    expect(runningPaymentSum).toBeCloseTo(682633.47, 2)

    // Final balance at end of Year 30 must be zero
    expect(annuals[29].endingBalance).toBe(0)
    expect(baseMortgage.schedule[359].endingBalance).toBe(0)
  })

  it('computes accurate milestones and baseline comparisons for extra $250 payment', () => {
    const milestones = calculateAmortizationMilestones(acceleratedMortgage.schedule, baseMortgage.schedule)
    expect(milestones).not.toBeNull()

    // Halfway balance ($150,000) point: reached at Month 174 (Year 14.5)
    expect(milestones?.halfwayBalancePoint?.month).toBe(174)
    expect(milestones?.halfwayBalancePoint?.balance).toBeLessThanOrEqual(150000)

    // Payoff point: 262 months
    expect(milestones?.payoffPoint.month).toBe(262)
    expect(milestones?.payoffPoint.year).toBeCloseTo(21.8, 1)

    // Comparison with baseline: 98 months saved and $120,336.94 interest saved
    expect(milestones?.comparisonWithBaseline).toBeDefined()
    expect(milestones?.comparisonWithBaseline?.baselinePayoffMonth).toBe(360)
    expect(milestones?.comparisonWithBaseline?.monthsSaved).toBe(98)
    expect(milestones?.comparisonWithBaseline?.interestSaved).toBeCloseTo(120336.94, 1)
    expect(milestones?.comparisonWithBaseline?.percentageInterestSaved).toBeCloseTo(31.45, 1)
  })

  it('generates valid, closed SVG path syntax', () => {
    const points = [
      { x: 0, y: 100 },
      { x: 50, y: 50 },
      { x: 100, y: 0 }
    ]

    const linePath = generateSvgPath(points)
    expect(linePath).toBe('M 0.00 100.00 L 50.00 50.00 L 100.00 0.00')

    const areaPath = generateAreaPath(points, 200)
    expect(areaPath).toBe('M 0.00 100.00 L 50.00 50.00 L 100.00 0.00 L 100.00 200.00 L 0.00 200.00 Z')

    const bottomPoints = [
      { x: 0, y: 150 },
      { x: 50, y: 120 },
      { x: 100, y: 100 }
    ]
    const stackArea = generateStackAreaPath(bottomPoints, points)
    expect(stackArea).toContain('M 0.00 100.00')
    expect(stackArea).toContain('L 100.00 100.00')
    expect(stackArea).toContain('Z')
  })

  it('gracefully handles empty or single-month loan schedules', () => {
    expect(findCrossoverPoint([])).toBeNull()
    expect(aggregateScheduleByYear([])).toEqual([])
    expect(calculateAmortizationMilestones([])).toBeNull()
    expect(generateSvgPath([])).toBe('')
    expect(generateAreaPath([], 100)).toBe('')
    expect(generateStackAreaPath([], [])).toBe('')
  })
})

describe('Phase 3.1.2 Regression Suite: Numerical Schedule Milestones & Aggregations', () => {
  const mortgage = calculateLoanPayment({
    principal: 300000,
    annualRate: 6.5,
    term: 30,
    termUnit: 'years'
  })

  // Full-precision scheduled monthly payment: ~1,896.2040704789
  it('confirms full-precision monthly payment', () => {
    expect(mortgage.regularMonthlyPayment).toBeCloseTo(1896.20407, 4)
  })

  // Regression Test 1: Month 256 balance ($150,468.40)
  it('verifies Month 256 ending balance is exactly $150,468.40', () => {
    const row256 = mortgage.schedule[255]
    expect(row256.paymentNumber).toBe(256)
    expect(row256.endingBalance).toBeCloseTo(150468.40, 2)
    expect(row256.endingBalance).toBeGreaterThan(150000.00)
  })

  // Regression Test 2: Month 257 balance ($149,387.24) and 50% milestone
  it('verifies Month 257 ending balance is $149,387.24 (first month below 50% of initial principal)', () => {
    const row257 = mortgage.schedule[256]
    expect(row257.paymentNumber).toBe(257)
    expect(row257.endingBalance).toBeCloseTo(149387.24, 2)
    expect(row257.endingBalance).toBeLessThanOrEqual(150000.00)

    const milestones = calculateAmortizationMilestones(mortgage.schedule)
    expect(milestones?.halfwayBalancePoint?.month).toBe(257)
    expect(milestones?.halfwayBalancePoint?.balance).toBeCloseTo(149387.24, 2)
  })

  // Regression Test 3: Month 204 cumulative interest ($286,176.31)
  it('verifies Month 204 cumulative interest is $286,176.31 (below 75% lifetime threshold)', () => {
    const row204 = mortgage.schedule[203]
    const threshold75 = mortgage.totalInterest * 0.75 // 382,633.47 * 0.75 = 286,975.10
    expect(row204.paymentNumber).toBe(204)
    expect(row204.totalInterestPaidToDate).toBeCloseTo(286176.31, 2)
    expect(row204.totalInterestPaidToDate).toBeLessThan(threshold75)
  })

  // Regression Test 4: Month 205 cumulative interest ($287,256.12) and 75% milestone
  it('verifies Month 205 cumulative interest is $287,256.12 (first month reaching 75% threshold)', () => {
    const row205 = mortgage.schedule[204]
    const threshold75 = mortgage.totalInterest * 0.75
    expect(row205.paymentNumber).toBe(205)
    expect(row205.totalInterestPaidToDate).toBeCloseTo(287256.12, 2)
    expect(row205.totalInterestPaidToDate).toBeGreaterThanOrEqual(threshold75)

    const milestones = calculateAmortizationMilestones(mortgage.schedule)
    expect(milestones?.seventyFivePercentInterestPoint?.month).toBe(205)
    expect(milestones?.seventyFivePercentInterestPoint?.cumulativeInterest).toBeCloseTo(287256.12, 2)
  })

  // Regression Test 5: Month 232 interest ($951.62) and principal ($944.58)
  it('verifies Month 232 interest is $951.62 and principal is $944.58 (interest exceeds principal)', () => {
    const row232 = mortgage.schedule[231]
    expect(row232.paymentNumber).toBe(232)
    expect(row232.interest).toBeCloseTo(951.62, 2)
    expect(row232.principalRepaid).toBeCloseTo(944.58, 2)
    expect(row232.interest).toBeGreaterThan(row232.principalRepaid)
    expect(row232.endingBalance).toBeCloseTo(174739.06, 2)
  })

  // Regression Test 6: Month 233 interest ($946.50) and principal ($949.70) (crossover point)
  it('verifies Month 233 interest is $946.50 and principal is $949.70 (crossover point)', () => {
    const row233 = mortgage.schedule[232]
    expect(row233.paymentNumber).toBe(233)
    expect(row233.interest).toBeCloseTo(946.50, 2)
    expect(row233.principalRepaid).toBeCloseTo(949.70, 2)
    expect(row233.principalRepaid).toBeGreaterThan(row233.interest)
    expect(row233.endingBalance).toBeCloseTo(173789.36, 2)

    const crossover = findCrossoverPoint(mortgage.schedule)
    expect(crossover?.month).toBe(233)
    expect(crossover?.principal).toBeCloseTo(949.70, 2)
    expect(crossover?.interest).toBeCloseTo(946.50, 2)
  })

  // Regression Test 7: First-year aggregation
  it('verifies first-year annual aggregation matches exact schedule sums', () => {
    const annuals = aggregateScheduleByYear(mortgage.schedule)
    const yr1 = annuals[0]

    expect(yr1.year).toBe(1)
    expect(yr1.startingBalance).toBe(300000.00)
    expect(yr1.totalPrincipalPaid).toBeCloseTo(3353.18, 2)
    expect(yr1.totalInterestPaid).toBeCloseTo(19401.27, 2)
    expect(yr1.totalPaid).toBeCloseTo(22754.45, 2)
    expect(yr1.endingBalance).toBeCloseTo(296646.82, 2)

    // Verify directly against independent sum of months 1 through 12
    const first12 = mortgage.schedule.slice(0, 12)
    const sumPrincipal = first12.reduce((s, r) => s + r.principalRepaid, 0)
    const sumInterest = first12.reduce((s, r) => s + r.interest, 0)
    const sumPaid = first12.reduce((s, r) => s + r.totalPaymentThisMonth, 0)

    expect(sumPrincipal).toBeCloseTo(3353.18, 2)
    expect(sumInterest).toBeCloseTo(19401.27, 2)
    expect(sumPaid).toBeCloseTo(22754.45, 2)
    expect(first12[11].endingBalance).toBeCloseTo(296646.82, 2)
  })

  // Regression Test 8: Total lifetime interest ($382,633.47)
  it('verifies total lifetime interest is $382,633.47', () => {
    expect(mortgage.totalInterest).toBeCloseTo(382633.47, 2)
    const finalRow = mortgage.schedule[mortgage.schedule.length - 1]
    expect(finalRow.totalInterestPaidToDate).toBeCloseTo(382633.47, 2)
  })

  // Regression Test 9: Final balance of zero ($0.00)
  it('verifies final balance of zero at Month 360', () => {
    const finalRow = mortgage.schedule[mortgage.schedule.length - 1]
    expect(finalRow.paymentNumber).toBe(360)
    expect(finalRow.endingBalance).toBe(0)
    expect(finalRow.totalPrincipalPaidToDate).toBeCloseTo(300000.00, 2)
  })
})

describe('Phase 3.1.3: Amortization Schedule Data Integrity & Invariant Testing', () => {
  const mortgage = calculateLoanPayment({
    principal: 300000,
    annualRate: 6.5,
    term: 30,
    termUnit: 'years'
  })
  const schedule = mortgage.schedule
  const monthlyRate = 0.065 / 12

  it('guarantees complete monthly schedule continuity across all 360 months', () => {
    expect(schedule.length).toBe(360)
    expect(schedule[0].startingBalance).toBe(300000.00)

    for (let i = 1; i < 360; i++) {
      const prev = schedule[i - 1]
      const curr = schedule[i]
      expect(curr.paymentNumber).toBe(i + 1)
      expect(curr.startingBalance).toBe(prev.endingBalance)
    }
  })

  it('enforces interest equals starting balance multiplied by periodic rate for every row', () => {
    for (let i = 0; i < 360; i++) {
      const row = schedule[i]
      const expectedInterest = row.startingBalance * monthlyRate
      expect(row.interest).toBeCloseTo(expectedInterest, 8)
    }
  })

  it('verifies principal plus interest reconciles with payment within documented tolerance', () => {
    const scheduledPayment = mortgage.regularMonthlyPayment

    // Full precision check for months 1 through 359
    for (let i = 0; i < 359; i++) {
      const row = schedule[i]
      expect(row.interest + row.principalRepaid).toBeCloseTo(scheduledPayment, 8)

      // Cents-rounded presentation check (within ±$0.01 tolerance due to independent rounding)
      const roundedInterest = Math.round(row.interest * 100) / 100
      const roundedPrincipal = Math.round(row.principalRepaid * 100) / 100
      const roundedPayment = Math.round(scheduledPayment * 100) / 100
      const roundedSum = Math.round((roundedInterest + roundedPrincipal) * 100) / 100
      expect(Math.abs(roundedSum - roundedPayment)).toBeLessThanOrEqual(0.01)
    }

    // Final month (Month 360): principalRepaid equals startingBalance, ending balance is 0
    const finalRow = schedule[359]
    expect(finalRow.principalRepaid).toBe(finalRow.startingBalance)
    expect(finalRow.endingBalance).toBe(0)
  })

  it('confirms ending balance never becomes negative throughout the schedule', () => {
    for (let i = 0; i < 360; i++) {
      expect(schedule[i].endingBalance).toBeGreaterThanOrEqual(0)
    }
  })

  it('strictly reconciles running cumulative interest against sum of monthly interest', () => {
    let runningInterestSum = 0
    for (let i = 0; i < 360; i++) {
      const row = schedule[i]
      runningInterestSum += row.interest
      expect(row.totalInterestPaidToDate).toBeCloseTo(runningInterestSum, 8)
    }
    expect(schedule[359].totalInterestPaidToDate).toBeCloseTo(382633.47, 2)
  })

  it('strictly reconciles running cumulative principal against sum of monthly principal', () => {
    let runningPrincipalSum = 0
    for (let i = 0; i < 360; i++) {
      const row = schedule[i]
      runningPrincipalSum += row.principalRepaid
      expect(row.totalPrincipalPaidToDate).toBeCloseTo(runningPrincipalSum, 8)
    }
    expect(schedule[359].totalPrincipalPaidToDate).toBeCloseTo(300000.00, 2)
  })

  it('verifies exact reference schedule values for Months 232, 233, 256, and 257', () => {
    // Month 232
    const row232 = schedule[231]
    expect(row232.paymentNumber).toBe(232)
    expect(row232.startingBalance).toBeCloseTo(175683.65, 2)
    expect(row232.interest).toBeCloseTo(951.62, 2)
    expect(row232.principalRepaid).toBeCloseTo(944.58, 2)
    expect(row232.endingBalance).toBeCloseTo(174739.06, 2)
    expect(row232.totalInterestPaidToDate).toBeCloseTo(314658.41, 2)

    // Month 233 (crossover point)
    const row233 = schedule[232]
    expect(row233.paymentNumber).toBe(233)
    expect(row233.startingBalance).toBeCloseTo(174739.06, 2)
    expect(row233.interest).toBeCloseTo(946.50, 2)
    expect(row233.principalRepaid).toBeCloseTo(949.70, 2)
    expect(row233.endingBalance).toBeCloseTo(173789.36, 2)
    expect(row233.totalInterestPaidToDate).toBeCloseTo(315604.91, 2)

    // Month 256
    const row256 = schedule[255]
    expect(row256.paymentNumber).toBe(256)
    expect(row256.startingBalance).toBeCloseTo(151543.75, 2)
    expect(row256.interest).toBeCloseTo(820.86, 2)
    expect(row256.principalRepaid).toBeCloseTo(1075.34, 2)
    expect(row256.endingBalance).toBeCloseTo(150468.40, 2)
    expect(row256.totalInterestPaidToDate).toBeCloseTo(335896.65, 2)

    // Month 257 (50% principal milestone)
    const row257 = schedule[256]
    expect(row257.paymentNumber).toBe(257)
    expect(row257.startingBalance).toBeCloseTo(150468.40, 2)
    expect(row257.interest).toBeCloseTo(815.04, 2)
    expect(row257.principalRepaid).toBeCloseTo(1081.17, 2)
    expect(row257.endingBalance).toBeCloseTo(149387.24, 2)
    expect(row257.totalInterestPaidToDate).toBeCloseTo(336711.68, 2)
  })

  it('confirms all 30 annual aggregation blocks equal the exact monthly schedule sums', () => {
    const annuals = aggregateScheduleByYear(schedule)
    expect(annuals.length).toBe(30)

    for (let y = 0; y < 30; y++) {
      const annualRow = annuals[y]
      const yearSlice = schedule.slice(y * 12, (y + 1) * 12)

      expect(annualRow.startingBalance).toBe(yearSlice[0].startingBalance)
      expect(annualRow.endingBalance).toBe(yearSlice[11].endingBalance)

      const sumInt = yearSlice.reduce((s, r) => s + r.interest, 0)
      const sumPrin = yearSlice.reduce((s, r) => s + r.principalRepaid, 0)
      const sumTotal = yearSlice.reduce((s, r) => s + r.totalPaymentThisMonth, 0)

      expect(annualRow.totalInterestPaid).toBeCloseTo(sumInt, 6)
      expect(annualRow.totalPrincipalPaid).toBeCloseTo(sumPrin, 6)
      expect(annualRow.totalPaid).toBeCloseTo(sumTotal, 6)
      expect(annualRow.cumulativeInterest).toBeCloseTo(yearSlice[11].totalInterestPaidToDate, 6)
      expect(annualRow.cumulativePrincipal).toBeCloseTo(yearSlice[11].totalPrincipalPaidToDate, 6)
    }
  })
})
