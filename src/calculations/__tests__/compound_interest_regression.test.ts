import { describe, it, expect } from 'vitest'
import { calculateCompoundInterest } from '../compoundInterest'

// Regression tests for the compound-interest content rewrite (2026-11-26).
// Every figure quoted on /compound-interest-calculator/ is reproduced here
// from the engine, to the cent. The page must quote these exact values.

const r2 = (n: number) => Math.round(n * 100) / 100

const defaults = calculateCompoundInterest({
  initialPrincipal: 10000,
  contributionAmount: 500,
  contributionFrequency: 'monthly',
  annualInterestRate: 7.5,
  compoundingFrequency: 'monthly',
  years: 20,
  contributionTiming: 'end'
})

describe('Worked example 1 — defaults: $10,000 + $500/mo at 7.5%, monthly, 20 years', () => {
  it('future value is $321,473.53 on $130,000 out of pocket', () => {
    expect(r2(defaults.futureValue)).toBe(321473.53)
    expect(r2(defaults.totalPrincipal + defaults.totalContributions)).toBe(130000)
    expect(r2(defaults.totalContributions)).toBe(120000)
    expect(r2(defaults.totalInterestEarned)).toBe(191473.53)
  })

  it('interest accelerates: year 1 earns $986.93, year 20 earns $22,922.13', () => {
    expect(r2(defaults.yearlyBreakdown[0].endingBalance)).toBe(16986.93)
    expect(r2(defaults.yearlyBreakdown[0].interestEarned)).toBe(986.93)
    expect(r2(defaults.yearlyBreakdown[19].interestEarned)).toBe(22922.13)
  })

  it('milestones: year 5 $50,796.50, year 10 $110,085.82, year 15 $196,250.66', () => {
    expect(r2(defaults.yearlyBreakdown[4].endingBalance)).toBe(50796.5)
    expect(r2(defaults.yearlyBreakdown[4].totalInterestSoFar)).toBe(10796.5)
    expect(r2(defaults.yearlyBreakdown[9].endingBalance)).toBe(110085.82)
    expect(r2(defaults.yearlyBreakdown[9].interestEarned)).toBe(7693.77)
    expect(r2(defaults.yearlyBreakdown[9].totalInterestSoFar)).toBe(40085.82)
    expect(r2(defaults.yearlyBreakdown[14].endingBalance)).toBe(196250.66)
    expect(r2(defaults.yearlyBreakdown[14].totalInterestSoFar)).toBe(96250.66)
  })

  it('matches the Excel FV closed form to the cent', () => {
    const i = 0.075 / 12
    const n = 240
    const closed = 10000 * Math.pow(1 + i, n) + 500 * ((Math.pow(1 + i, n) - 1) / i)
    expect(r2(closed)).toBe(321473.53)
    expect(r2(defaults.futureValue)).toBe(r2(closed))
  })

  it('at 3% inflation the $321,473.53 buys what about $177,992 buys today', () => {
    expect(r2(defaults.futureValue / Math.pow(1.03, 20))).toBe(177992.1)
  })
})

describe('Worked example 2 — single $10,000 deposit at 7.5% for 20 years', () => {
  const at = (freq: 'annually' | 'quarterly' | 'monthly' | 'daily') =>
    calculateCompoundInterest({
      initialPrincipal: 10000,
      contributionAmount: 0,
      annualInterestRate: 7.5,
      compoundingFrequency: freq,
      years: 20
    })

  it('compounding frequency ladder: annual < quarterly < monthly < daily', () => {
    expect(r2(at('annually').futureValue)).toBe(42478.51)
    expect(r2(at('quarterly').futureValue)).toBe(44198.72)
    expect(r2(at('monthly').futureValue)).toBe(44608.17)
    expect(r2(at('daily').futureValue)).toBe(44809.99)
    expect(r2(at('daily').futureValue - at('annually').futureValue)).toBe(2331.47)
  })

  it('simple interest on the same deposit is only $25,000', () => {
    expect(r2(10000 * (1 + 0.075 * 20))).toBe(25000)
    expect(r2(at('monthly').futureValue - 25000)).toBe(19608.17)
  })
})

describe('Worked example 3 — starting early: $200/mo at 7% to age 65', () => {
  const early = calculateCompoundInterest({
    initialPrincipal: 0,
    contributionAmount: 200,
    contributionFrequency: 'monthly',
    annualInterestRate: 7,
    compoundingFrequency: 'monthly',
    years: 40,
    contributionTiming: 'end'
  })
  const late = calculateCompoundInterest({
    initialPrincipal: 0,
    contributionAmount: 200,
    contributionFrequency: 'monthly',
    annualInterestRate: 7,
    compoundingFrequency: 'monthly',
    years: 30,
    contributionTiming: 'end'
  })

  it('age 25 starter ends with $524,962.68 vs $243,994.20 for the age 35 starter', () => {
    expect(r2(early.futureValue)).toBe(524962.68)
    expect(r2(early.totalContributions)).toBe(96000)
    expect(r2(early.totalInterestEarned)).toBe(428962.68)
    expect(r2(late.futureValue)).toBe(243994.2)
    expect(r2(late.totalContributions)).toBe(72000)
    expect(r2(late.totalInterestEarned)).toBe(171994.2)
    expect(r2(early.futureValue - late.futureValue)).toBe(280968.48)
  })
})

describe('Contribution timing — beginning vs end of month', () => {
  it('beginning-of-month contributions add $1,730.41 over 20 years on the defaults', () => {
    const beginning = calculateCompoundInterest({
      initialPrincipal: 10000,
      contributionAmount: 500,
      contributionFrequency: 'monthly',
      annualInterestRate: 7.5,
      compoundingFrequency: 'monthly',
      years: 20,
      contributionTiming: 'beginning'
    })
    expect(r2(beginning.futureValue)).toBe(323203.94)
    expect(r2(beginning.futureValue - defaults.futureValue)).toBe(1730.41)
  })
})

describe('Rule of 72 check at 7.5%', () => {
  it('72 / 7.5 = 9.6 years to double, and (1.075)^9.6 is 2.00x', () => {
    expect(r2(72 / 7.5)).toBe(9.6)
    expect(Math.pow(1.075, 9.6)).toBeCloseTo(2.0, 2)
  })

  it('$1,000 at 7.5% compounded monthly is $2,112.06 after 10 years', () => {
    const r = calculateCompoundInterest({
      initialPrincipal: 1000,
      contributionAmount: 0,
      annualInterestRate: 7.5,
      compoundingFrequency: 'monthly',
      years: 10
    })
    expect(r2(r.futureValue)).toBe(2112.06)
  })
})
