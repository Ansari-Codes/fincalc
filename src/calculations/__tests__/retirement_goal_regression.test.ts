import { describe, it, expect } from 'vitest'
import { calculateRetirementGoal } from '../retirementGoal'
import {
  createRetirementGoalForm,
  RETIREMENT_GOAL_DEFAULTS
} from '../../composables/useRetirementGoalForm'

/**
 * Regression tests for the Retirement Savings Goal Calculator page.
 * The engine math was verified correct against the live calculator
 * (2026-11-24 audit) in every mode; these tests pin the audited values,
 * the step-up behaviour, the Reset-to-defaults fix and the
 * Frequency/Timing state-preservation fix so a future edit cannot
 * silently reintroduce the wrong hand-typed numbers.
 */

const DEFAULTS = {
  currentSavings: 50000,
  targetAmount: 1000000,
  currentAge: 35,
  retirementAge: 65,
  expectedAnnualReturn: 7,
  contributionFrequency: 'monthly' as const,
  contributionTiming: 'end' as const
}

describe('retirement goal — audited default and scenario values', () => {
  it('defaults produce $487.04/mo ($5,844.48/yr) over 30 years / 360 periods', () => {
    const result = calculateRetirementGoal(DEFAULTS)
    expect(result.isValid).toBe(true)
    expect(result.requiredMonthlyContribution).toBeCloseTo(487.04, 2)
    expect(result.requiredAnnualContribution).toBeCloseTo(5844.48, 2)
    expect(result.yearsToRetirement).toBe(30)
    expect(result.numberOfPeriods).toBe(360)
    expect(result.projectedFinalBalance).toBeGreaterThanOrEqual(999999)
  })

  it('audit Test 1 (age 30→65, $10,000, $1,000,000, 7%) produces $491.34/mo', () => {
    const result = calculateRetirementGoal({
      currentSavings: 10000,
      targetAmount: 1000000,
      currentAge: 30,
      retirementAge: 65,
      expectedAnnualReturn: 7,
      contributionFrequency: 'monthly',
      contributionTiming: 'end'
    })
    expect(result.isValid).toBe(true)
    expect(result.requiredMonthlyContribution).toBeCloseTo(491.34, 2)
  })

  it('audit Test 2 (age 40→65, $50,000, $750,000, 6%) produces $760.11/mo', () => {
    const result = calculateRetirementGoal({
      currentSavings: 50000,
      targetAmount: 750000,
      currentAge: 40,
      retirementAge: 65,
      expectedAnnualReturn: 6,
      contributionFrequency: 'monthly',
      contributionTiming: 'end'
    })
    expect(result.isValid).toBe(true)
    expect(result.requiredMonthlyContribution).toBeCloseTo(760.11, 2)
  })

  it('article worked example (age 35→65, $60,000, $1,250,000, 7%) produces $625.43/mo end / $621.81/mo due', () => {
    const end = calculateRetirementGoal({
      currentSavings: 60000,
      targetAmount: 1250000,
      currentAge: 35,
      retirementAge: 65,
      expectedAnnualReturn: 7,
      contributionFrequency: 'monthly',
      contributionTiming: 'end'
    })
    const due = calculateRetirementGoal({
      currentSavings: 60000,
      targetAmount: 1250000,
      currentAge: 35,
      retirementAge: 65,
      expectedAnnualReturn: 7,
      contributionFrequency: 'monthly',
      contributionTiming: 'beginning'
    })
    expect(end.requiredMonthlyContribution).toBeCloseTo(625.43, 2)
    expect(due.requiredMonthlyContribution).toBeCloseTo(621.81, 2)
    // Article totals use the unrounded PMT ($625.433): 360 × $625.433 ≈ $225,155.89
    expect(end.totalPersonalContributions).toBeCloseTo(225155.89, 2)
    expect(end.estimatedInvestmentGrowth).toBeCloseTo(964844.11, 2)
    // The year-by-year schedule must end exactly at the target
    expect(end.yearlyBreakdown[29].endingBalance).toBeCloseTo(1250000, 0)
  })
})

describe('retirement goal — annual contribution step-up', () => {
  it('a step-up lowers the required initial contribution and the schedule still ends at the target', () => {
    const flat = calculateRetirementGoal({ ...DEFAULTS, annualContributionIncreasePct: 0 })
    const stepUp = calculateRetirementGoal({ ...DEFAULTS, annualContributionIncreasePct: 3 })
    expect(stepUp.requiredMonthlyContribution).toBeLessThan(flat.requiredMonthlyContribution)
    expect(stepUp.requiredMonthlyContribution).toBeCloseTo(356.4, 1)
    expect(stepUp.projectedFinalBalance).toBeGreaterThanOrEqual(999999)
    expect(stepUp.yearlyBreakdown[29].endingBalance).toBeCloseTo(1000000, 0)
    // Contributions actually grow year over year under a step-up
    expect(stepUp.yearlyBreakdown[1].contributions).toBeGreaterThan(
      stepUp.yearlyBreakdown[0].contributions
    )
    expect(stepUp.yearlyBreakdown[1].contributions).toBeCloseTo(
      stepUp.yearlyBreakdown[0].contributions * 1.03,
      1
    )
  })

  it('a 2% step-up starts at ~$397.63/mo for the defaults', () => {
    const stepUp = calculateRetirementGoal({ ...DEFAULTS, annualContributionIncreasePct: 2 })
    expect(stepUp.requiredMonthlyContribution).toBeCloseTo(397.63, 1)
    expect(stepUp.projectedFinalBalance).toBeGreaterThanOrEqual(999999)
  })
})

describe('retirement goal form — reset restores documented defaults', () => {
  it('RETIREMENT_GOAL_DEFAULTS matches the documented defaults', () => {
    expect(RETIREMENT_GOAL_DEFAULTS.currentSavings).toBe(50000)
    expect(RETIREMENT_GOAL_DEFAULTS.targetAmount).toBe(1000000)
    expect(RETIREMENT_GOAL_DEFAULTS.currentAge).toBe(35)
    expect(RETIREMENT_GOAL_DEFAULTS.retirementAge).toBe(65)
    expect(RETIREMENT_GOAL_DEFAULTS.expectedAnnualReturn).toBe(7.0)
    expect(RETIREMENT_GOAL_DEFAULTS.contributionFrequency).toBe('monthly')
    expect(RETIREMENT_GOAL_DEFAULTS.contributionTiming).toBe('end')
    expect(RETIREMENT_GOAL_DEFAULTS.annualContributionIncreasePct).toBe(0)
  })

  it('resetForm() restores every input to the defaults (never nulls them)', () => {
    const form = createRetirementGoalForm()
    // Simulate the user changing everything, then hitting Reset
    form.currentSavings.value = 60000
    form.targetAmount.value = 1250000
    form.currentAge.value = 40
    form.retirementAge.value = 70
    form.expectedAnnualReturn.value = 5.5
    form.contributionFrequency.value = 'annually'
    form.contributionTiming.value = 'beginning'
    form.annualContributionIncreasePct.value = 3

    form.resetForm()

    expect(form.currentSavings.value).toBe(50000)
    expect(form.targetAmount.value).toBe(1000000)
    expect(form.currentAge.value).toBe(35)
    expect(form.retirementAge.value).toBe(65)
    expect(form.expectedAnnualReturn.value).toBe(7.0)
    expect(form.contributionFrequency.value).toBe('monthly')
    expect(form.contributionTiming.value).toBe('end')
    expect(form.annualContributionIncreasePct.value).toBe(0)
    // …and the result is the documented default result again
    expect(form.result.value.requiredMonthlyContribution).toBeCloseTo(487.04, 2)
    expect(form.result.value.isValid).toBe(true)
    expect(form.result.value.alreadyAchieved).toBe(false)
  })
})

describe('retirement goal form — frequency/timing changes never alter inputs', () => {
  it('toggling Timing and Frequency leaves savings/target/age/return untouched', () => {
    const form = createRetirementGoalForm()
    // Article example inputs
    form.currentSavings.value = 60000
    form.targetAmount.value = 1250000
    form.currentAge.value = 35
    form.retirementAge.value = 65
    form.expectedAnnualReturn.value = 7.0
    form.annualContributionIncreasePct.value = 0

    const snapshot = () => ({
      savings: form.currentSavings.value,
      target: form.targetAmount.value,
      age: form.currentAge.value,
      retireAge: form.retirementAge.value,
      ret: form.expectedAnnualReturn.value,
      stepUp: form.annualContributionIncreasePct.value
    })
    const before = snapshot()

    // The exact sequence from the audit anomaly: first switch to Beginning,
    // then back, then switch Frequency — inputs must not move.
    form.contributionTiming.value = 'beginning'
    expect(snapshot()).toEqual(before)
    form.contributionTiming.value = 'end'
    expect(snapshot()).toEqual(before)
    form.contributionFrequency.value = 'annually'
    expect(snapshot()).toEqual(before)
    form.contributionFrequency.value = 'monthly'
    expect(snapshot()).toEqual(before)
    form.contributionTiming.value = 'beginning'
    form.contributionFrequency.value = 'annually'
    expect(snapshot()).toEqual(before)
  })
})

describe('retirement goal — empty/invalid inputs must not report "target met"', () => {
  it('engine flags empty inputs invalid even though the shortfall is zero', () => {
    // After the old Reset (all nulls → 0), the engine reported
    // alreadyAchieved=true with $0.00 values; the page must gate the
    // "TARGET MET BY COMPOUNDING!" banner on isValid, which is false here.
    const empty = calculateRetirementGoal({
      currentSavings: 0,
      targetAmount: 0,
      currentAge: undefined,
      retirementAge: 65,
      expectedAnnualReturn: 0,
      contributionFrequency: 'monthly',
      contributionTiming: 'end'
    })
    expect(empty.alreadyAchieved).toBe(true)
    expect(empty.isValid).toBe(false)
    expect(empty.validationErrors.length).toBeGreaterThan(0)
  })
})

describe('retirement goal form — slider positions follow typed values', () => {
  it('clamps typed values to the slider range instead of flagging them invalid', () => {
    const form = createRetirementGoalForm()

    // The audit case: $1,015,590 is not a $25,000 preset multiple
    form.targetAmount.value = 1015590
    expect(form.targetSliderValue.value).toBe(1015590)

    // Above the slider max clamps to the max; below the min clamps to the min
    form.targetAmount.value = 5000000
    expect(form.targetSliderValue.value).toBe(3000000)
    form.targetAmount.value = 50000
    expect(form.targetSliderValue.value).toBe(100000)

    form.currentSavings.value = 600000
    expect(form.savingsSliderValue.value).toBe(500000)
    form.expectedAnnualReturn.value = 20
    expect(form.returnSliderValue.value).toBe(15)
    form.annualContributionIncreasePct.value = 12
    expect(form.stepUpSliderValue.value).toBe(10)
  })
})
