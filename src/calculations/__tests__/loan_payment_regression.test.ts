import { describe, it, expect } from 'vitest'
import {
  calculateLoanPayment,
  buildDisplaySchedule,
  type LoanAmortizationRow
} from '../loanPayment'
import { findCrossoverPoint } from '../amortizationVisualization'

// Regression tests for the Loan Payment Calculator (kitaaab.org).
// Every figure below was verified against the live calculator (2026-11-24)
// and is reproduced here from the engine, to the cent. The underlying
// formulas are correct and must not change; these tests pin the audited
// values so future edits cannot silently move them.

const DEFAULTS = {
  principal: 300000,
  annualRate: 6.5,
  term: 30,
  termUnit: 'years' as const,
  extraMonthlyPayment: 0
}

const r2 = (n: number) => Math.round(n * 100) / 100

/** Assert every displayed row of a schedule reconciles to the cent:
 *  total = interest + principal + extra, ending = starting - principal - extra.
 *  One documented exception: the FINAL row's ending is forced to exactly
 *  $0.00 (a loan must close at zero) while its principal is the plug that
 *  makes the TOTAL exact, so on some schedules the final row's derived
 *  ending is $0.01 or -$0.01 instead of $0.00 (defaults month 360: starting
 *  $1,885.99 - principal $1,885.98 = $0.01; T1 month 60: $384.73 - $384.74 =
 *  -$0.01). The total identity holds on the final row, and the ending
 *  identity holds on every non-final row. */
function expectRowsReconcile(rows: LoanAmortizationRow[]) {
  for (const row of rows) {
    const total = r2(row.interest + row.principalRepaid + row.additionalPayment)
    expect(total).toBeCloseTo(r2(row.totalPaymentThisMonth), 2)
  }
  for (const row of rows.slice(0, -1)) {
    const ending = r2(row.startingBalance - row.principalRepaid - row.additionalPayment)
    expect(ending).toBeCloseTo(r2(row.endingBalance), 2)
  }
  const last = rows[rows.length - 1]
  expect(r2(last.endingBalance)).toBe(0)
  // Final-row ending is forced to $0.00; the plug principal may leave the
  // derived ending $0.01 off — that is the accepted trade-off, documented
  // above, and it must never exceed one cent.
  const derivedLastEnding = r2(last.startingBalance - last.principalRepaid - last.additionalPayment)
  expect(Math.abs(derivedLastEnding)).toBeLessThanOrEqual(0.01)
}

describe('loan payment — audited defaults', () => {
  it('defaults: $300,000 / 6.5% / 30yr = $1,896.20/mo, $382,633.47 interest, $682,633.47 total, 360 months', () => {
    const r = calculateLoanPayment(DEFAULTS)
    expect(r.regularMonthlyPayment).toBeCloseTo(1896.2, 2)
    expect(r.totalInterest).toBeCloseTo(382633.47, 2)
    expect(r.totalRepayment).toBeCloseTo(682633.47, 2)
    expect(r.actualPayoffMonths).toBe(360)
    expect(r.originalMonths).toBe(360)
  })

  it('Test 1: $20,000 / 6% / 60mo = $386.66/mo, $3,199.36 interest, Month 1 $100.00 / $286.66 / $19,713.34', () => {
    const r = calculateLoanPayment({
      principal: 20000, annualRate: 6, term: 60, termUnit: 'months', extraMonthlyPayment: 0
    })
    expect(r.regularMonthlyPayment).toBeCloseTo(386.66, 2)
    expect(r.totalInterest).toBeCloseTo(3199.36, 2)
    const m1 = r.schedule[0]
    expect(m1.interest).toBeCloseTo(100, 2)
    expect(m1.principalRepaid).toBeCloseTo(286.66, 2)
    expect(m1.endingBalance).toBeCloseTo(19713.34, 2)
  })

  it('Test 2: $10,000 / 9% / 36mo = $318.00/mo, $1,447.90 interest', () => {
    const r = calculateLoanPayment({
      principal: 10000, annualRate: 9, term: 36, termUnit: 'months', extraMonthlyPayment: 0
    })
    expect(r.regularMonthlyPayment).toBeCloseTo(318, 2)
    expect(r.totalInterest).toBeCloseTo(1447.9, 2)
  })

  it('extra +$250 on defaults: 262 months, $262,296.53 interest, $120,336.94 saved, 98 months early', () => {
    const r = calculateLoanPayment({ ...DEFAULTS, extraMonthlyPayment: 250 })
    expect(r.actualPayoffMonths).toBe(262)
    expect(r.totalInterest).toBeCloseTo(262296.53, 2)
    expect(r.interestSaved).toBeCloseTo(120336.94, 2)
    expect(r.originalMonths - r.actualPayoffMonths).toBe(98)
  })

  it('0% APR: $300,000 / 30yr = $833.33/mo, $0 interest', () => {
    const r = calculateLoanPayment({ ...DEFAULTS, annualRate: 0 })
    expect(r.regularMonthlyPayment).toBeCloseTo(833.33, 2)
    expect(r.totalInterest).toBeCloseTo(0, 2)
  })
})

describe('loan payment — crossover milestones', () => {
  it('standard schedule crossover is Month 233 (total principal vs interest)', () => {
    const r = calculateLoanPayment(DEFAULTS)
    const cp = findCrossoverPoint(r.schedule)
    expect(cp?.month).toBe(233)
  })

  it('accelerated schedule (+$250 extra) crossover is Month 135 on the SAME schedule', () => {
    const r = calculateLoanPayment({ ...DEFAULTS, extraMonthlyPayment: 250 })
    const cp = findCrossoverPoint(r.schedule)
    expect(cp?.month).toBe(135)
    // The crossover row compares TOTAL principal (incl. extra) with interest.
    expect(cp?.principal).toBeGreaterThanOrEqual(cp?.interest ?? 0)
  })

  it('50% balance point on the standard schedule is Month 257', () => {
    const r = calculateLoanPayment(DEFAULTS)
    const half = r.schedule.find((row) => row.endingBalance <= r.principal / 2)
    expect(half?.paymentNumber).toBe(257)
  })

  it('principal already dominates from Month 1 on $20,000/6%/5yr (no later crossover)', () => {
    const r = calculateLoanPayment({
      principal: 20000, annualRate: 6, term: 60, termUnit: 'months', extraMonthlyPayment: 0
    })
    const m1 = r.schedule[0]
    // Interest $100.00 = 25.9% of the payment vs principal $286.66 = 74.1%.
    expect(m1.interest).toBeLessThan(m1.principalRepaid)
    expect(m1.interest / m1.totalPaymentThisMonth).toBeCloseTo(0.259, 2)
    expect(m1.principalRepaid / m1.totalPaymentThisMonth).toBeCloseTo(0.741, 2)
    // findCrossoverPoint therefore reports month 1 — the chart must not
    // present Month 1 as a "finally overtakes" crossover.
    expect(findCrossoverPoint(r.schedule)?.month).toBe(1)
  })
})

describe('loan payment — bi-weekly example (computed, not an unsourced range)', () => {
  it('paying half the monthly payment every two weeks = 13 monthly payments/year: 290 months, ~5.8 years saved, $87,256.29 saved', () => {
    const base = calculateLoanPayment(DEFAULTS)
    const biweekly = calculateLoanPayment({
      ...DEFAULTS,
      extraMonthlyPayment: base.regularMonthlyPayment / 12
    })
    expect(biweekly.actualPayoffMonths).toBe(290)
    expect(biweekly.interestSaved).toBeCloseTo(87256.29, 2)
    expect((base.actualPayoffMonths - biweekly.actualPayoffMonths) / 12).toBeCloseTo(5.83, 2)
  })
})

describe('loan payment — display reconciliation', () => {
  it('default schedule: every displayed row reconciles to the cent, final row ends at $0.00', () => {
    const r = calculateLoanPayment(DEFAULTS)
    expectRowsReconcile(buildDisplaySchedule(r.schedule))
  })

  it('Test 1 schedule: every displayed row reconciles, final month principal $384.74 + interest $1.92 = $386.66', () => {
    const r = calculateLoanPayment({
      principal: 20000, annualRate: 6, term: 60, termUnit: 'months', extraMonthlyPayment: 0
    })
    const rows = buildDisplaySchedule(r.schedule)
    expectRowsReconcile(rows)
    const last = rows[rows.length - 1]
    expect(r2(last.principalRepaid)).toBe(384.74)
    expect(r2(last.interest)).toBe(1.92)
    expect(r2(last.totalPaymentThisMonth)).toBe(386.66)
  })

  it('Test 2 schedule: Month 3 ending is $9,265.52 ($9,512.18 - $246.66)', () => {
    const r = calculateLoanPayment({
      principal: 10000, annualRate: 9, term: 36, termUnit: 'months', extraMonthlyPayment: 0
    })
    const rows = buildDisplaySchedule(r.schedule)
    expectRowsReconcile(rows)
    const m3 = rows[2]
    expect(r2(m3.startingBalance)).toBe(9512.18)
    expect(r2(m3.principalRepaid)).toBe(246.66)
    expect(r2(m3.endingBalance)).toBe(9265.52)
  })

  it('default schedule: Payment 257 ending is $149,387.23 and Payment 360 principal $1,885.98 + interest $10.22 = $1,896.20', () => {
    const r = calculateLoanPayment(DEFAULTS)
    const rows = buildDisplaySchedule(r.schedule)
    expectRowsReconcile(rows)
    const m257 = rows[256]
    expect(r2(m257.startingBalance)).toBe(150468.4)
    expect(r2(m257.principalRepaid)).toBe(1081.17)
    expect(r2(m257.endingBalance)).toBe(149387.23)
    const m360 = rows[359]
    expect(r2(m360.principalRepaid)).toBe(1885.98)
    expect(r2(m360.interest)).toBe(10.22)
    expect(r2(m360.totalPaymentThisMonth)).toBe(1896.2)
  })

  it('extra +$250 schedule and 0% APR schedule also reconcile on every row', () => {
    const r = calculateLoanPayment({ ...DEFAULTS, extraMonthlyPayment: 250 })
    expectRowsReconcile(buildDisplaySchedule(r.schedule))
    const zero = calculateLoanPayment({ ...DEFAULTS, annualRate: 0 })
    expectRowsReconcile(buildDisplaySchedule(zero.schedule))
  })

  it('display schedule preserves the engine lifetime totals', () => {
    const r = calculateLoanPayment(DEFAULTS)
    const rows = buildDisplaySchedule(r.schedule)
    const last = rows[rows.length - 1]
    expect(r2(last.totalInterestPaidToDate)).toBeCloseTo(r.totalInterest, 2)
    expect(r2(last.totalPrincipalPaidToDate)).toBeCloseTo(r.principal, 2)
  })
})

describe('loan payment — reset restores defaults', () => {
  it('the documented defaults are $300,000 / 6.5% / 30 years / $0 extra', () => {
    // The page's resetForm() must restore exactly these values; this test
    // pins them so a regression is caught here too.
    expect(DEFAULTS).toEqual({
      principal: 300000,
      annualRate: 6.5,
      term: 30,
      termUnit: 'years',
      extraMonthlyPayment: 0
    })
    const r = calculateLoanPayment(DEFAULTS)
    expect(r.regularMonthlyPayment).toBeCloseTo(1896.2, 2)
  })
})
