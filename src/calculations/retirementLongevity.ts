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
  yearlyBreakdown: RetirementYearCheckpoint[]
  message: string
}

/**
 * Calculates how long retirement savings will last.
 * Uses a monthly effective compounding rate model:
 * monthlyReturn = (1 + annualReturn / 100)^(1/12) - 1
 */
export function calculateRetirementLongevity(input: RetirementLongevityInput): RetirementLongevityResult {
  const startBal = Math.max(0, Number(input.startingBalance) || 0)
  const withdrawalInput = Math.max(0, Number(input.plannedWithdrawal) || 0)
  const freq = input.withdrawalFrequency || 'monthly'
  const annualReturnPct = Math.max(0, Number(input.expectedAnnualReturn) || 0)
  const annualInflationPct = Math.max(0, Number(input.expectedAnnualInflation) || 0)
  const adjustInflation = Boolean(input.adjustWithdrawalsForInflation)
  const horizon = Math.min(80, Math.max(1, Math.floor(Number(input.horizonYears) || 40)))
  const timing = input.withdrawalTiming || 'beginning'

  // Monthly base withdrawal
  const baseMonthlyWithdrawal = freq === 'monthly' ? withdrawalInput : withdrawalInput / 12

  // Monthly rates
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

    // Adjust withdrawal for inflation annually at the start of each year after year 1
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
        // End of period withdrawal
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
    message = `Estimated savings depleted after ${depletedYears} year${depletedYears === 1 ? '' : 's'}${depletedMonths > 0 ? ` and ${depletedMonths} month${depletedMonths === 1 ? '' : 's'}` : ''}.`
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
    yearlyBreakdown,
    message
  }
}
