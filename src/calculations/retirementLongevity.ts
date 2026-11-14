export interface RetirementLongevityInput {
  startingBalance: number
  plannedWithdrawal: number
  withdrawalFrequency?: 'monthly' | 'annually'
  expectedAnnualReturn: number // percent e.g. 5 for 5%
  expectedAnnualInflation?: number // percent e.g. 2.5 for 2.5%
  adjustWithdrawalsForInflation?: boolean
  horizonYears?: number // default 40
  withdrawalTiming?: 'beginning' | 'end'
}

export interface RetirementYearCheckpoint {
  year: number
  startingBalance: number
  withdrawals: number
  investmentGrowth: number
  endingBalance: number
  totalWithdrawnSoFar: number
}

export interface RetirementLongevityResult {
  isDepleted: boolean
  depletedYears: number | null
  depletedMonths: number | null
  endingBalanceAtHorizon: number
  totalWithdrawn: number
  totalGrowth: number
  isValid: boolean
  validationErrors: string[]
  yearlyBreakdown: RetirementYearCheckpoint[]
  message: string
}

/**
 * ============================================================================
 * Retirement Money Longevity Calculator
 * ============================================================================
 * 
 * Mathematical Model:
 * 1. Monthly Effective Compounding Return Rate:
 *    r_monthly = (1 + Annual_Return / 100)^(1 / 12) - 1
 * 
 * 2. Monthly Inflation Escalation Multiplier:
 *    i_annual = 1 + Annual_Inflation / 100
 * 
 * 3. Monthly Iterative Simulation:
 *    For each month m = 1 to horizon * 12:
 *      If beginning of period:
 *        Balance = Balance - Withdrawal
 *        Growth = Balance * r_monthly
 *        Balance = Balance + Growth
 *      If end of period:
 *        Growth = Balance * r_monthly
 *        Balance = Balance + Growth - Withdrawal
 *      If Balance <= 0.005 -> Portfolio is depleted at month m.
 * 
 * Core Financial Assumptions:
 * - Constant Rate of Return: The model assumes an unvarying annual return across all years.
 *   SEQUENCE OF RETURNS RISK: In reality, real market downturns in early retirement years
 *   can dramatically accelerate depletion compared to a straight-line average return.
 * - Inflation Adjustment: When active, withdrawal amounts step up annually by the assumed
 *   inflation percentage to maintain baseline purchasing power.
 * - Exclusions: Does not model Required Minimum Distributions (RMDs), federal/state income
 *   taxes, Medicare Part B/D surcharges (IRMAA), or unpredictable health shocks.
 * 
 * Numerical Precision & Boundary Rules:
 * - $0 Starting Balance: Flags immediate depletion.
 * - $0 Withdrawal: Savings never deplete; balance compounds according to return rate.
 * - Horizon Limit: Capped between 1 and 80 years.
 * - Negative inputs produce descriptive validation messages.
 */
export function calculateRetirementLongevity(input: RetirementLongevityInput): RetirementLongevityResult {
  const errors: string[] = []

  if (!input) {
    return {
      isDepleted: false,
      depletedYears: null,
      depletedMonths: null,
      endingBalanceAtHorizon: 0,
      totalWithdrawn: 0,
      totalGrowth: 0,
      isValid: false,
      validationErrors: ['No calculation input provided.'],
      yearlyBreakdown: [],
      message: 'No input provided.'
    }
  }

  const rawStartBal = typeof input.startingBalance === 'number' && isFinite(input.startingBalance) ? input.startingBalance : 0
  const rawWithdrawal = typeof input.plannedWithdrawal === 'number' && isFinite(input.plannedWithdrawal) ? input.plannedWithdrawal : 0
  const rawReturn = typeof input.expectedAnnualReturn === 'number' && isFinite(input.expectedAnnualReturn) ? input.expectedAnnualReturn : 0
  const rawInflation = typeof input.expectedAnnualInflation === 'number' && isFinite(input.expectedAnnualInflation) ? input.expectedAnnualInflation : 0
  const rawHorizon = typeof input.horizonYears === 'number' && isFinite(input.horizonYears) ? input.horizonYears : 40

  if (rawStartBal < 0) {
    errors.push('Starting portfolio balance cannot be negative.')
  }
  if (rawWithdrawal < 0) {
    errors.push('Planned withdrawal cannot be negative.')
  }
  if (rawReturn < 0) {
    errors.push('Expected annual return cannot be negative.')
  }
  if (rawInflation < 0) {
    errors.push('Expected inflation cannot be negative.')
  }
  if (rawHorizon <= 0) {
    errors.push('Horizon must be at least 1 year.')
  }

  const startBal = Math.max(0, rawStartBal)
  const withdrawalInput = Math.max(0, rawWithdrawal)
  const freq = input.withdrawalFrequency || 'monthly'
  const annualReturnPct = Math.max(0, rawReturn)
  const annualInflationPct = Math.max(0, rawInflation)
  const adjustInflation = Boolean(input.adjustWithdrawalsForInflation)
  const horizon = Math.min(80, Math.max(1, Math.floor(rawHorizon)))
  const timing = input.withdrawalTiming || 'beginning'

  // Immediate depletion edge case
  if (startBal === 0) {
    return {
      isDepleted: true,
      depletedYears: 0,
      depletedMonths: 0,
      endingBalanceAtHorizon: 0,
      totalWithdrawn: 0,
      totalGrowth: 0,
      isValid: errors.length === 0,
      validationErrors: errors,
      yearlyBreakdown: [],
      message: 'Estimated savings depleted immediately (starting balance is $0).'
    }
  }

  // Monthly base withdrawal
  const baseMonthlyWithdrawal = freq === 'monthly' ? withdrawalInput : withdrawalInput / 12

  // Zero withdrawal edge case: savings never deplete
  if (baseMonthlyWithdrawal === 0) {
    const monthlyReturnRate = annualReturnPct > 0 ? Math.pow(1 + annualReturnPct / 100, 1 / 12) - 1 : 0
    let bal = startBal
    let totalGrowth = 0
    const yearlyBreakdown: RetirementYearCheckpoint[] = []

    for (let y = 1; y <= horizon; y++) {
      const yearStart = bal
      const yearEnd = bal * Math.pow(1 + monthlyReturnRate, 12)
      const yearGrowth = yearEnd - yearStart
      totalGrowth += yearGrowth
      bal = yearEnd

      yearlyBreakdown.push({
        year: y,
        startingBalance: yearStart,
        withdrawals: 0,
        investmentGrowth: yearGrowth,
        endingBalance: yearEnd,
        totalWithdrawnSoFar: 0
      })
    }

    return {
      isDepleted: false,
      depletedYears: null,
      depletedMonths: null,
      endingBalanceAtHorizon: bal,
      totalWithdrawn: 0,
      totalGrowth,
      isValid: errors.length === 0,
      validationErrors: errors,
      yearlyBreakdown,
      message: 'Savings did not run out within the selected projection period.'
    }
  }

  // Monthly effective compounding rate
  const monthlyReturnRate = annualReturnPct > 0 ? Math.pow(1 + annualReturnPct / 100, 1 / 12) - 1 : 0
  const annualInflationMultiplier = 1 + annualInflationPct / 100

  let balance = startBal
  let totalWithdrawn = 0
  let totalGrowth = 0
  let isDepleted = false
  let depletedMonthIndex = -1

  const yearlyBreakdown: RetirementYearCheckpoint[] = []
  let currentYearWithdrawalRate = baseMonthlyWithdrawal

  for (let y = 1; y <= horizon; y++) {
    const yearStartBal = balance
    let yearWithdrawals = 0
    let yearGrowth = 0

    // Adjust withdrawal for inflation annually at start of year y > 1
    if (adjustInflation && y > 1) {
      currentYearWithdrawalRate *= annualInflationMultiplier
    }

    for (let m = 1; m <= 12; m++) {
      if (balance <= 0.005) {
        if (!isDepleted) {
          isDepleted = true
          depletedMonthIndex = (y - 1) * 12 + m - 1
        }
        balance = 0
        break
      }

      const withdrawal = currentYearWithdrawalRate

      if (timing === 'beginning') {
        const actualWithdrawal = Math.min(balance, withdrawal)
        balance -= actualWithdrawal
        yearWithdrawals += actualWithdrawal
        totalWithdrawn += actualWithdrawal

        if (balance <= 0.005) {
          isDepleted = true
          depletedMonthIndex = (y - 1) * 12 + m
          balance = 0
          break
        }

        const growth = balance * monthlyReturnRate
        balance += growth
        yearGrowth += growth
        totalGrowth += growth
      } else {
        // End of month withdrawal
        const growth = balance * monthlyReturnRate
        balance += growth
        yearGrowth += growth
        totalGrowth += growth

        const actualWithdrawal = Math.min(balance, withdrawal)
        balance -= actualWithdrawal
        yearWithdrawals += actualWithdrawal
        totalWithdrawn += actualWithdrawal

        if (balance <= 0.005) {
          isDepleted = true
          depletedMonthIndex = (y - 1) * 12 + m
          balance = 0
          break
        }
      }
    }

    yearlyBreakdown.push({
      year: y,
      startingBalance: yearStartBal,
      withdrawals: yearWithdrawals,
      investmentGrowth: yearGrowth,
      endingBalance: Math.max(0, balance),
      totalWithdrawnSoFar: totalWithdrawn
    })

    if (isDepleted) {
      break
    }
  }

  let depletedYears: number | null = null
  let depletedMonths: number | null = null
  let message = ''

  if (isDepleted && depletedMonthIndex >= 0) {
    depletedYears = Math.floor(depletedMonthIndex / 12)
    depletedMonths = depletedMonthIndex % 12

    if (depletedYears === 0) {
      message = `Estimated savings depleted after ${depletedMonths} month${depletedMonths === 1 ? '' : 's'}.`
    } else if (depletedMonths === 0) {
      message = `Estimated savings depleted after ${depletedYears} year${depletedYears === 1 ? '' : 's'}.`
    } else {
      message = `Estimated savings depleted after ${depletedYears} year${depletedYears === 1 ? '' : 's'} and ${depletedMonths} month${depletedMonths === 1 ? '' : 's'}.`
    }
  } else {
    message = 'Savings did not run out within the selected projection period.'
  }

  return {
    isDepleted,
    depletedYears,
    depletedMonths,
    endingBalanceAtHorizon: Math.max(0, balance),
    totalWithdrawn,
    totalGrowth,
    isValid: errors.length === 0,
    validationErrors: errors,
    yearlyBreakdown,
    message
  }
}
