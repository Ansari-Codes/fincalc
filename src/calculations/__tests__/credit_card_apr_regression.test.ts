import { describe, it, expect } from 'vitest'
import {
  calculateCreditCardApr,
  calculateDailyInterest,
  calculateMinimumPaymentSchedule,
  formatPayoffDate,
  getMinimumPaymentComparisonScenarios,
  getScenarioAMinimumAnalysis,
  getWorkedExampleScenarios
} from '../creditCardApr'

/**
 * Regression guard for the Credit Card APR Calculator page
 * (kitaaab.org/credit-card-apr-calculator/).
 *
 * Every payoff number published on that page — the worked-examples table,
 * the minimum-payment comparison table, and Scenario A — is generated from
 * the calculator engine, and these tests fail if any published figure
 * disagrees with the engine by more than $0.01 or 0 months.
 *
 * Calculation model (do not change silently): monthly rate = APR ÷ 12,
 * payment applied to interest first, remainder to principal, final payment
 * capped at balance + interest. Minimum payment = 3% of the STARTING
 * balance for the month (never of the balance after interest), or $25
 * floor, whichever is greater.
 */
describe('Credit Card APR Calculator page — regression guard', () => {
  describe('Worked-examples table (every row matches the engine)', () => {
    it('matches the engine for $4,500 at 22.9% with $200/mo', () => {
      const scenarios = getWorkedExampleScenarios()
      const row = scenarios.find((s) => s.balance === 4500 && s.monthlyPayment === 200)!
      expect(row.payoffMonths).toBe(30)
      expect(row.totalInterestPaid).toBeCloseTo(1436.05, 2)
      expect(row.totalAmountPaid).toBeCloseTo(5936.05, 2)
    })

    it('matches the engine for $4,500 at 22.9% with $350/mo', () => {
      const scenarios = getWorkedExampleScenarios()
      const row = scenarios.find((s) => s.balance === 4500 && s.monthlyPayment === 350)!
      expect(row.payoffMonths).toBe(15)
      expect(row.totalInterestPaid).toBeCloseTo(712.51, 2)
      expect(row.totalAmountPaid).toBeCloseTo(5212.51, 2)
    })

    it('matches the engine for every worked-example row', () => {
      for (const row of getWorkedExampleScenarios()) {
        const engine = calculateCreditCardApr({
          balance: row.balance,
          apr: row.apr,
          monthlyPayment: row.monthlyPayment
        })
        expect(row.payoffMonths).toBe(engine.payoffMonths)
        expect(row.totalInterestPaid).toBeCloseTo(engine.totalInterestPaid, 2)
        expect(row.totalAmountPaid).toBeCloseTo(engine.totalAmountPaid, 2)
      }
    })

    it('has the $8,000 and $2,000 rows the page publishes', () => {
      const scenarios = getWorkedExampleScenarios()
      const row8000 = scenarios.find((s) => s.balance === 8000)!
      expect(row8000.payoffMonths).toBe(77)
      expect(row8000.totalInterestPaid).toBeCloseTo(7247.25, 2)
      expect(row8000.totalAmountPaid).toBeCloseTo(15247.25, 2)
      const row2000 = scenarios.find((s) => s.balance === 2000)!
      expect(row2000.payoffMonths).toBe(16)
      expect(row2000.totalInterestPaid).toBeCloseTo(262.7, 2)
      expect(row2000.totalAmountPaid).toBeCloseTo(2262.7, 2)
    })
  })

  describe('Minimum-payment comparison table ($4,500 at 22.9%)', () => {
    it('minimum-only row is 208 months, $6,913.23 interest, $11,413.23 total', () => {
      const scenarios = getMinimumPaymentComparisonScenarios()
      expect(scenarios[0].payoffMonths).toBe(208)
      expect(scenarios[0].totalInterestPaid).toBeCloseTo(6913.23, 2)
      expect(scenarios[0].totalAmountPaid).toBeCloseTo(11413.23, 2)
    })

    it('fixed-payment rows match the engine', () => {
      const scenarios = getMinimumPaymentComparisonScenarios()
      expect(scenarios[1].payoffMonths).toBe(30)
      expect(scenarios[1].totalInterestPaid).toBeCloseTo(1436.05, 2)
      expect(scenarios[1].totalAmountPaid).toBeCloseTo(5936.05, 2)
      expect(scenarios[2].payoffMonths).toBe(15)
      expect(scenarios[2].totalInterestPaid).toBeCloseTo(712.51, 2)
      expect(scenarios[2].totalAmountPaid).toBeCloseTo(5212.51, 2)
    })
  })

  describe('Scenario A — $5,000 at 24% APR, 3% minimum, $25 floor', () => {
    it('pays off in 234 months with $8,886.95 interest and $13,886.95 total', () => {
      const analysis = getScenarioAMinimumAnalysis()
      expect(analysis.payoffMonths).toBe(234)
      expect(analysis.totalInterestPaid).toBeCloseTo(8886.95, 2)
      expect(analysis.totalAmountPaid).toBeCloseTo(13886.95, 2)
    })

    it('has month 1 at $100.00 interest, $150.00 payment, $4,950.00 balance', () => {
      const analysis = getScenarioAMinimumAnalysis()
      const m1 = analysis.schedule[0]
      expect(m1.interestCharged).toBeCloseTo(100.0, 2)
      expect(m1.payment).toBeCloseTo(150.0, 2)
      expect(m1.endBalance).toBeCloseTo(4950.0, 2)
    })

    it('has month 2 at $99.00 interest, $148.50 payment, $4,900.50 balance', () => {
      const analysis = getScenarioAMinimumAnalysis()
      const m2 = analysis.schedule[1]
      expect(m2.interestCharged).toBeCloseTo(99.0, 2)
      expect(m2.payment).toBeCloseTo(148.5, 2)
      expect(m2.endBalance).toBeCloseTo(4900.5, 2)
    })

    it('hits the $25 floor in month 180 at a starting balance of $827.31', () => {
      const analysis = getScenarioAMinimumAnalysis()
      expect(analysis.floorMonth).toBe(180)
      expect(analysis.floorStartBalance).toBeCloseTo(827.31, 2)
      const m180 = analysis.schedule[179]
      expect(m180.payment).toBeCloseTo(25.0, 2)
      expect(m180.endBalance).toBeCloseTo(818.86, 2)
    })

    it('ends in month 234 with a final payment of $18.89', () => {
      const analysis = getScenarioAMinimumAnalysis()
      expect(analysis.finalPayment).toBeCloseTo(18.89, 2)
      const m234 = analysis.schedule[233]
      expect(m234.payment).toBeCloseTo(18.89, 2)
      expect(m234.endBalance).toBeCloseTo(0, 2)
    })

    it('agrees with the payMinimumOnly engine mode', () => {
      const engine = calculateCreditCardApr({
        balance: 5000,
        apr: 24,
        monthlyPayment: 200,
        payMinimumOnly: true
      })
      const analysis = getScenarioAMinimumAnalysis()
      expect(engine.payoffMonths).toBe(analysis.payoffMonths)
      expect(engine.totalInterestPaid).toBeCloseTo(analysis.totalInterestPaid, 2)
      expect(engine.totalAmountPaid).toBeCloseTo(analysis.totalAmountPaid, 2)
    })
  })

  describe('Daily interest cost (balance × APR ÷ 365)', () => {
    it('is $2.82/day at $4,500 / 22.9% and $2.63/day at $4,000 / 24%', () => {
      expect(calculateDailyInterest(4500, 22.9)).toBeCloseTo(2.82, 2)
      expect(calculateDailyInterest(4000, 24)).toBeCloseTo(2.63, 2)
      expect(calculateDailyInterest(5000, 24)).toBeCloseTo(3.29, 2)
    })

    it('is exposed on the engine result and updates with the inputs', () => {
      const result = calculateCreditCardApr({ balance: 4500, apr: 22.9, monthlyPayment: 200 })
      expect(result.dailyInterestCost).toBeCloseTo(2.82, 2)
    })
  })

  describe('"Pay minimum only" toggle behaviour', () => {
    it('returns the minimum-only outcome for $4,500 at 22.9%', () => {
      const result = calculateCreditCardApr({
        balance: 4500,
        apr: 22.9,
        monthlyPayment: 200,
        payMinimumOnly: true
      })
      expect(result.isMinimumOnly).toBe(true)
      expect(result.payoffMonths).toBe(208)
      expect(result.totalInterestPaid).toBeCloseTo(6913.23, 2)
      expect(result.totalAmountPaid).toBeCloseTo(11413.23, 2)
    })

    it('returns the fixed-payment outcome when the toggle is off', () => {
      const result = calculateCreditCardApr({
        balance: 4500,
        apr: 22.9,
        monthlyPayment: 200,
        payMinimumOnly: false
      })
      expect(result.isMinimumOnly).toBe(false)
      expect(result.payoffMonths).toBe(30)
      expect(result.totalInterestPaid).toBeCloseTo(1436.05, 2)
    })
  })

  describe('Published baselines must not move', () => {
    it('$4,000 at 24% with $200/mo is still 26 months and $1,159.49 interest', () => {
      const result = calculateCreditCardApr({ balance: 4000, apr: 24, monthlyPayment: 200 })
      expect(result.payoffMonths).toBe(26)
      expect(result.totalInterestPaid).toBeCloseTo(1159.49, 2)
      expect(result.totalAmountPaid).toBeCloseTo(5159.49, 2)
      expect(result.firstMonthInterest).toBeCloseTo(80.0, 2)
      expect(result.firstMonthPrincipal).toBeCloseTo(120.0, 2)
    })

    it('$4,500 at 22.9% with $200/mo is still 30 months and $1,436.05 interest', () => {
      const result = calculateCreditCardApr({ balance: 4500, apr: 22.9, monthlyPayment: 200 })
      expect(result.payoffMonths).toBe(30)
      expect(result.totalInterestPaid).toBeCloseTo(1436.05, 2)
      expect(result.totalAmountPaid).toBeCloseTo(5936.05, 2)
    })

    it('formats the payoff date from the payoff months, never hard-coded', () => {
      expect(formatPayoffDate(30, new Date(2026, 10, 24))).toBe('May 2029')
      expect(formatPayoffDate(26, new Date(2026, 10, 24))).toBe('January 2029')
    })
  })

  describe('Minimum-payment schedule helper agrees with the engine', () => {
    it('matches calculateCreditCardApr totals for $4,500 at 22.9%', () => {
      const analysis = calculateMinimumPaymentSchedule(4500, 22.9)
      const engine = calculateCreditCardApr({
        balance: 4500,
        apr: 22.9,
        monthlyPayment: 0,
        payMinimumOnly: true
      })
      expect(analysis.payoffMonths).toBe(engine.payoffMonths)
      expect(analysis.totalInterestPaid).toBeCloseTo(engine.totalInterestPaid, 2)
      expect(analysis.totalAmountPaid).toBeCloseTo(engine.totalAmountPaid, 2)
      expect(analysis.floorMonth).toBe(155)
    })
  })
})
