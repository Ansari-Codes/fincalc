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
  yearlyBreakdown: CompoundYearData[]
}

/**
 * Compound Interest Calculator
 * Accurately models compound growth with optional recurring contributions,
 * flexible compounding frequencies (daily, monthly, quarterly, annual),
 * and contribution timing (beginning or end of period).
 */
export function calculateCompoundInterest(input: CompoundInterestInput): CompoundInterestResult {
  const principal = Math.max(0, Number(input.initialPrincipal) || 0)
  const contribution = Math.max(0, Number(input.contributionAmount) || 0)
  const contribFreq = input.contributionFrequency || 'monthly'
  const annualRate = Math.max(0, Number(input.annualInterestRate) || 0) / 100
  const compoundFreq = input.compoundingFrequency || 'monthly'
  const years = Math.min(100, Math.max(1, Math.floor(Number(input.years) || 1)))
  const timing = input.contributionTiming || 'end'

  const n = {
    daily: 365,
    monthly: 12,
    quarterly: 4,
    annually: 1
  }[compoundFreq]

  // If no regular contributions, use the direct closed-form formula per year for exact precision
  if (contribution === 0) {
    let currentBalance = principal
    let totalInterestSoFar = 0
    const yearlyBreakdown: CompoundYearData[] = []

    for (let y = 1; y <= years; y++) {
      const yearStartBalance = currentBalance
      // Balance at end of year y: P * (1 + r/n)^(n*y)
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
      yearlyBreakdown
    }
  }

  // When regular contributions are present, simulate period-by-period
  // We use compounding periods as the base step.
  // Effective periodic rate = annualRate / n
  // Number of compound steps per year = n
  // For monthly contributions, if n=12, each step has 1 contribution.
  // If n=365, monthly contribution occurs every ~30.4 days (or 12 times a year evenly spaced).
  // If n=1 (annually), contributions are added per year.
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

    // Standard simulation: step by step for the n periods of the year
    // Determine how many contributions fall into each compound period
    for (let p = 1; p <= n; p++) {
      // Check contributions occurring in this compounding slice
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
    yearlyBreakdown
  }
}
