export type ContributionFrequency = 'monthly' | 'annually'
export type CompoundingFrequency = 'daily' | 'monthly' | 'quarterly' | 'annually'
export type ContributionTiming = 'beginning' | 'end'

export interface CompoundInterestInput {
  initialPrincipal: number
  contributionAmount?: number
  contributionFrequency?: ContributionFrequency
  annualInterestRate: number // in percent, e.g. 7 for 7%
  compoundingFrequency?: CompoundingFrequency
  years: number
  contributionTiming?: ContributionTiming
}

export interface CompoundYearData {
  year: number
  startingBalance: number
  contributions: number
  interestEarned: number
  endingBalance: number
  totalContributionsSoFar: number
  totalInterestSoFar: number
}

export interface CompoundInterestResult {
  futureValue: number
  totalPrincipal: number
  totalContributions: number
  totalInterestEarned: number
  isValid: boolean
  validationErrors: string[]
  yearlyBreakdown: CompoundYearData[]
}

/**
 * ============================================================================
 * Compound Interest Calculator
 * ============================================================================
 * 
 * Mathematical Models:
 * 1. Single Deposit (No regular additions):
 *    A = P * (1 + r / n)^(n * t)
 *    Where:
 *      P = Initial Principal
 *      r = Annual interest rate (decimal)
 *      n = Compounding periods per year (365 for daily, 12 for monthly, 4 for quarterly, 1 for annually)
 *      t = Years
 * 
 * 2. Regular Additions with Periodic Compounding:
 *    Simulated period-by-period where contributions occur at the beginning or end
 *    of each period, and interest is calculated on the running balance at rate = r / n.
 * 
 * Core Financial Assumptions:
 * - Constant Rate: The specified return rate remains static across all projection years.
 * - Reinvestment: 100% of interest earned is reinvested without cash distributions.
 * - Tax & Fee Exclusions: Calculations reflect gross nominal growth before income taxes,
 *   capital gains taxes, or investment management fees.
 * - Timing: Contributions are credited either at the beginning or end of each interval.
 * 
 * Numerical Precision & Boundary Rules:
 * - 0% Interest Rate: Supported; growth consists purely of principal + contributions.
 * - $0 Starting Principal: Supported; growth begins solely with regular additions.
 * - Maximum Horizon: Capped at 100 years.
 * - Negative inputs are guarded and produce clear validation errors.
 */
export function calculateCompoundInterest(input: CompoundInterestInput): CompoundInterestResult {
  const errors: string[] = []

  if (!input) {
    return {
      futureValue: 0,
      totalPrincipal: 0,
      totalContributions: 0,
      totalInterestEarned: 0,
      isValid: false,
      validationErrors: ['No calculation input provided.'],
      yearlyBreakdown: []
    }
  }

  const rawPrincipal = typeof input.initialPrincipal === 'number' && isFinite(input.initialPrincipal) ? input.initialPrincipal : 0
  const rawContribution = typeof input.contributionAmount === 'number' && isFinite(input.contributionAmount) ? input.contributionAmount : 0
  const rawRate = typeof input.annualInterestRate === 'number' && isFinite(input.annualInterestRate) ? input.annualInterestRate : 0
  const rawYears = typeof input.years === 'number' && isFinite(input.years) ? input.years : 1

  if (rawPrincipal < 0) {
    errors.push('Initial principal cannot be negative.')
  }
  if (rawContribution < 0) {
    errors.push('Contribution amount cannot be negative.')
  }
  if (rawRate < 0) {
    errors.push('Interest rate cannot be negative.')
  }
  if (rawYears <= 0) {
    errors.push('Time period must be at least 1 year.')
  }

  const principal = Math.max(0, rawPrincipal)
  const contribution = Math.max(0, rawContribution)
  const contribFreq = input.contributionFrequency || 'monthly'
  const annualRate = Math.max(0, rawRate) / 100
  const compoundFreq = input.compoundingFrequency || 'monthly'
  const years = Math.min(100, Math.max(1, Math.floor(rawYears)))
  const timing = input.contributionTiming || 'end'

  const n = {
    daily: 365,
    monthly: 12,
    quarterly: 4,
    annually: 1
  }[compoundFreq]

  // If no regular contributions, use direct closed-form formula for mathematical exactness
  if (contribution === 0) {
    let currentBalance = principal
    let totalInterestSoFar = 0
    const yearlyBreakdown: CompoundYearData[] = []

    for (let y = 1; y <= years; y++) {
      const yearStartBalance = currentBalance
      // Formula: P * (1 + r/n)^(n*y)
      const yearEndBalance = principal * Math.pow(1 + annualRate / n, n * y)
      const yearInterest = yearEndBalance - yearStartBalance
      totalInterestSoFar += yearInterest
      currentBalance = yearEndBalance

      yearlyBreakdown.push({
        year: y,
        startingBalance: yearStartBalance,
        contributions: 0,
        interestEarned: yearInterest,
        endingBalance: yearEndBalance,
        totalContributionsSoFar: 0,
        totalInterestSoFar
      })
    }

    return {
      futureValue: currentBalance,
      totalPrincipal: principal,
      totalContributions: 0,
      totalInterestEarned: totalInterestSoFar,
      isValid: errors.length === 0,
      validationErrors: errors,
      yearlyBreakdown
    }
  }

  // With recurring contributions, simulate period-by-period
  let balance = principal
  let totalContributions = 0
  let totalInterestSoFar = 0
  const yearlyBreakdown: CompoundYearData[] = []

  const contribsPerYear = contribFreq === 'monthly' ? 12 : 1
  const periodRate = annualRate / n

  for (let y = 1; y <= years; y++) {
    const yearStartBalance = balance
    let yearContrib = 0
    let yearInterest = 0

    for (let p = 1; p <= n; p++) {
      const contribsInThisPeriod = (contribsPerYear >= n)
        ? contribsPerYear / n
        : ((p * contribsPerYear) % n < contribsPerYear ? 1 : 0)

      const periodContribAmount = contribsInThisPeriod * contribution

      if (periodContribAmount > 0 && timing === 'beginning') {
        balance += periodContribAmount
        yearContrib += periodContribAmount
        totalContributions += periodContribAmount
      }

      const interestStep = balance * periodRate
      balance += interestStep
      yearInterest += interestStep
      totalInterestSoFar += interestStep

      if (periodContribAmount > 0 && timing === 'end') {
        balance += periodContribAmount
        yearContrib += periodContribAmount
        totalContributions += periodContribAmount
      }
    }

    yearlyBreakdown.push({
      year: y,
      startingBalance: yearStartBalance,
      contributions: yearContrib,
      interestEarned: yearInterest,
      endingBalance: balance,
      totalContributionsSoFar: totalContributions,
      totalInterestSoFar: totalInterestSoFar
    })
  }

  return {
    futureValue: balance,
    totalPrincipal: principal,
    totalContributions,
    totalInterestEarned: totalInterestSoFar,
    isValid: errors.length === 0,
    validationErrors: errors,
    yearlyBreakdown
  }
}
