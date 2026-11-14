export type ContributionFrequency = 'monthly' | 'annually'
export type ContributionTiming = 'beginning' | 'end'

export interface RetirementGoalInput {
  currentSavings: number // PV
  targetAmount: number // FV
  currentAge?: number
  retirementAge: number
  expectedAnnualReturn: number // percent e.g. 7 for 7%
  contributionFrequency?: ContributionFrequency
  contributionTiming?: ContributionTiming
  annualContributionIncreasePct?: number // optional annual % step up
}

export interface RetirementGoalYear {
  year: number
  age?: number
  startingBalance: number
  contributions: number
  interestEarned: number
  endingBalance: number
  totalContributionsSoFar: number
  totalInterestSoFar: number
}

export interface RetirementGoalResult {
  requiredMonthlyContribution: number
  requiredAnnualContribution: number
  projectedFinalBalance: number
  totalPersonalContributions: number
  estimatedInvestmentGrowth: number
  numberOfPeriods: number
  yearsToRetirement: number
  progressTowardTarget: number
  alreadyAchieved: boolean
  isValid: boolean
  validationErrors: string[]
  yearlyBreakdown: RetirementGoalYear[]
}

/**
 * ============================================================================
 * Retirement Savings Goal Calculator Engine
 * ============================================================================
 * 
 * Mathematical Models:
 * 1. Future Value of Initial Lump Sum:
 *    FV_current = PV * (1 + r)^N
 * 
 * 2. Required Net Accumulation from Periodic Contributions:
 *    FV_needed = max(0, TargetAmount - FV_current)
 * 
 * 3. Ordinary Annuity (End of Period):
 *    PMT = FV_needed * [ r / ((1 + r)^N - 1) ]
 * 
 * 4. Annuity Due (Beginning of Period):
 *    PMT_due = PMT / (1 + r)
 * 
 * 5. Zero Interest Rate (r = 0):
 *    PMT = FV_needed / N
 * 
 * 6. Annual Step-Up Scaling:
 *    When contributions increase annually by g%, the initial contribution
 *    is calculated via linear proportionality factor F = FV(PMT=1),
 *    yielding PMT_1 = FV_needed / F.
 * 
 * Assumptions & Limitations:
 * - Constant rate of return throughout the entire horizon.
 * - Tax exclusions: Does not calculate Roth vs. Traditional IRA/401(k) tax brackets,
 *   capital gains taxes, or statutory IRS annual contribution limits (e.g. IRC 402(g)).
 * - All additions are assumed to occur consistently per chosen schedule.
 */
export function calculateRetirementGoal(input: RetirementGoalInput): RetirementGoalResult {
  const errors: string[] = []

  if (!input) {
    return {
      requiredMonthlyContribution: 0,
      requiredAnnualContribution: 0,
      projectedFinalBalance: 0,
      totalPersonalContributions: 0,
      estimatedInvestmentGrowth: 0,
      numberOfPeriods: 0,
      yearsToRetirement: 0,
      progressTowardTarget: 0,
      alreadyAchieved: false,
      isValid: false,
      validationErrors: ['No calculation input provided.'],
      yearlyBreakdown: []
    }
  }

  const rawPV = typeof input.currentSavings === 'number' && isFinite(input.currentSavings) ? input.currentSavings : 0
  const rawFV = typeof input.targetAmount === 'number' && isFinite(input.targetAmount) ? input.targetAmount : 0
  const currentAge = typeof input.currentAge === 'number' && isFinite(input.currentAge) ? input.currentAge : undefined
  const rawRetireAge = typeof input.retirementAge === 'number' && isFinite(input.retirementAge) ? input.retirementAge : 65
  const rawReturn = typeof input.expectedAnnualReturn === 'number' && isFinite(input.expectedAnnualReturn) ? input.expectedAnnualReturn : 0
  const rawStepUp = typeof input.annualContributionIncreasePct === 'number' && isFinite(input.annualContributionIncreasePct)
    ? input.annualContributionIncreasePct
    : 0

  if (rawPV < 0) errors.push('Current savings cannot be negative.')
  if (rawFV <= 0) errors.push('Target retirement amount must be greater than zero.')
  if (rawReturn < 0) errors.push('Expected annual return cannot be negative.')
  if (rawStepUp < 0) errors.push('Annual contribution increase percentage cannot be negative.')

  const yearsToRetire = currentAge !== undefined
    ? rawRetireAge - currentAge
    : Math.max(1, rawRetireAge)

  if (yearsToRetire <= 0) {
    errors.push('Retirement age must be greater than current age.')
  }

  const years = Math.min(70, Math.max(1, Math.floor(yearsToRetire)))
  const currentSavings = Math.max(0, rawPV)
  const targetAmount = Math.max(0, rawFV)
  const annualReturnRate = Math.max(0, rawReturn) / 100
  const freq = input.contributionFrequency || 'monthly'
  const timing = input.contributionTiming || 'end'
  const stepUpRate = Math.max(0, rawStepUp) / 100

  const periodsPerYear = freq === 'monthly' ? 12 : 1
  const totalPeriods = years * periodsPerYear
  const periodicRate = freq === 'monthly' ? annualReturnRate / 12 : annualReturnRate

  // Calculate future value of current savings
  let fvCurrent = currentSavings
  if (periodicRate > 0) {
    fvCurrent = currentSavings * Math.pow(1 + periodicRate, totalPeriods)
  }

  const shortfall = Math.max(0, targetAmount - fvCurrent)
  const alreadyAchieved = shortfall <= 0.005

  let initialPeriodicPmt = 0

  if (!alreadyAchieved) {
    // Determine required initial payment
    if (stepUpRate === 0) {
      if (periodicRate === 0) {
        initialPeriodicPmt = shortfall / totalPeriods
      } else {
        const factor = Math.pow(1 + periodicRate, totalPeriods) - 1
        let pmtEnd = shortfall * (periodicRate / factor)
        initialPeriodicPmt = timing === 'beginning' ? pmtEnd / (1 + periodicRate) : pmtEnd
      }
    } else {
      // With annual step-up: compute proportional multiplier factor F when initial PMT = 1
      let testBal = 0
      let currentUnitPmt = 1

      for (let y = 1; y <= years; y++) {
        if (y > 1) {
          currentUnitPmt *= (1 + stepUpRate)
        }
        for (let p = 1; p <= periodsPerYear; p++) {
          if (timing === 'beginning') testBal += currentUnitPmt
          testBal += testBal * periodicRate
          if (timing === 'end') testBal += currentUnitPmt
        }
      }

      initialPeriodicPmt = testBal > 0 ? shortfall / testBal : 0
    }
  }

  // Monthly and annual equivalences
  const requiredMonthlyContribution = freq === 'monthly' ? initialPeriodicPmt : initialPeriodicPmt / 12
  const requiredAnnualContribution = freq === 'annually' ? initialPeriodicPmt : initialPeriodicPmt * 12

  // Simulate year-by-year schedule
  let balance = currentSavings
  let totalContributions = 0
  let totalInterest = 0
  const yearlyBreakdown: RetirementGoalYear[] = []
  let currentPeriodPmt = initialPeriodicPmt

  for (let y = 1; y <= years; y++) {
    const yearStart = balance
    let yearContribs = 0
    let yearInterest = 0

    if (stepUpRate > 0 && y > 1) {
      currentPeriodPmt *= (1 + stepUpRate)
    }

    for (let p = 1; p <= periodsPerYear; p++) {
      if (!alreadyAchieved && currentPeriodPmt > 0 && timing === 'beginning') {
        balance += currentPeriodPmt
        yearContribs += currentPeriodPmt
        totalContributions += currentPeriodPmt
      }

      const interestStep = balance * periodicRate
      balance += interestStep
      yearInterest += interestStep
      totalInterest += interestStep

      if (!alreadyAchieved && currentPeriodPmt > 0 && timing === 'end') {
        balance += currentPeriodPmt
        yearContribs += currentPeriodPmt
        totalContributions += currentPeriodPmt
      }
    }

    yearlyBreakdown.push({
      year: y,
      age: currentAge !== undefined ? currentAge + y : undefined,
      startingBalance: yearStart,
      contributions: yearContribs,
      interestEarned: yearInterest,
      endingBalance: balance,
      totalContributionsSoFar: totalContributions,
      totalInterestSoFar: totalInterest
    })
  }

  const projectedFinalBalance = balance
  const progressTowardTarget = targetAmount > 0
    ? Math.min(100, (currentSavings / targetAmount) * 100)
    : 0

  return {
    requiredMonthlyContribution,
    requiredAnnualContribution,
    projectedFinalBalance,
    totalPersonalContributions: totalContributions,
    estimatedInvestmentGrowth: totalInterest,
    numberOfPeriods: totalPeriods,
    yearsToRetirement: years,
    progressTowardTarget,
    alreadyAchieved,
    isValid: errors.length === 0,
    validationErrors: errors,
    yearlyBreakdown
  }
}
