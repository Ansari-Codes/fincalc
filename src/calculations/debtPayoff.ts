export type DebtStrategy = 'snowball' | 'avalanche'

export interface DebtItem {
  id: string
  name: string
  balance: number
  apr: number // e.g. 18.99 for 18.99%
  minimumPayment: number
}

export interface DebtPayoffInput {
  debts: DebtItem[]
  extraMonthlyPayment: number
  strategy?: DebtStrategy
}

export interface IndividualDebtResult {
  id: string
  name: string
  initialBalance: number
  apr: number
  payoffMonth: number
  totalInterestPaid: number
  totalPrincipalPaid: number
}

export interface MonthlyDebtSnapshot {
  month: number
  totalStartingBalance: number
  totalInterestPaid: number
  totalPrincipalPaid: number
  totalEndingBalance: number
  debtBalances: Record<string, number>
}

export interface StrategyResult {
  strategy: DebtStrategy
  strategyName: string
  payoffMonths: number
  debtFreeYears: number
  totalInterestPaid: number
  totalAmountRepaid: number
  totalInitialBalance: number
  debtPayoffOrder: string[]
  individualResults: IndividualDebtResult[]
  monthlySchedule: MonthlyDebtSnapshot[]
  hasNegativeAmortization: boolean
  warningMessages: string[]
}

export interface DebtPayoffComparison {
  snowball: StrategyResult
  avalanche: StrategyResult
  interestSavingsWithAvalanche: number
  monthsSavedWithAvalanche: number
  recommendedStrategy: DebtStrategy
}

export interface DebtPayoffOverallResult {
  selectedStrategyResult: StrategyResult
  comparison: DebtPayoffComparison
  isValid: boolean
  validationErrors: string[]
}

/**
 * ============================================================================
 * Debt Payoff Planner Simulation Engine (Snowball & Avalanche)
 * ============================================================================
 * 
 * Strategies:
 * 1. Debt Snowball:
 *    Ranks debts by current balance ascending (lowest balance first).
 *    Accelerates psychological momentum by eliminating loan accounts quickly.
 * 
 * 2. Debt Avalanche:
 *    Ranks debts by APR descending (highest interest rate first).
 *    Mathematically optimal strategy that minimizes aggregate interest expenditure.
 * 
 * Rollover ("Snowballing") Mechanics:
 * - Each active debt requires at least its minimum payment.
 * - Any available extra monthly cashflow plus the minimum payments of already retired debts
 *   are pooled and poured into the top priority debt until satisfied.
 * - Balances are calculated monthly with r = APR / 12 / 100.
 * 
 * Guard Rails:
 * - Max simulation cap: 600 months (50 years).
 * - Minimum payment validity checks: flags accounts whose minimum payment fails to cover monthly interest.
 */
function simulateStrategy(
  inputDebts: DebtItem[],
  extraMonthlyPayment: number,
  strategy: DebtStrategy
): StrategyResult {
  const warnings: string[] = []
  let hasNegativeAmortization = false

  // Filter out non-positive balances
  const activeDebts = inputDebts
    .filter(d => d.balance > 0.005)
    .map(d => ({
      ...d,
      currentBalance: d.balance,
      totalInterest: 0,
      totalPrincipal: 0,
      payoffMonth: 0
    }))

  const totalInitial = activeDebts.reduce((sum, d) => sum + d.balance, 0)

  if (activeDebts.length === 0) {
    return {
      strategy,
      strategyName: strategy === 'avalanche' ? 'Debt Avalanche (Highest APR)' : 'Debt Snowball (Lowest Balance)',
      payoffMonths: 0,
      debtFreeYears: 0,
      totalInterestPaid: 0,
      totalAmountRepaid: 0,
      totalInitialBalance: 0,
      debtPayoffOrder: [],
      individualResults: [],
      monthlySchedule: [],
      hasNegativeAmortization: false,
      warningMessages: ['No active debts with an outstanding balance.']
    }
  }

  // Pre-check for negative amortization
  for (const d of activeDebts) {
    const monthlyInterest = d.balance * (d.apr / 100 / 12)
    if (d.minimumPayment <= monthlyInterest) {
      hasNegativeAmortization = true
      warnings.push(`Minimum payment for "${d.name}" ($${d.minimumPayment.toFixed(2)}) is less than or equal to monthly interest ($${monthlyInterest.toFixed(2)}). Total payment must exceed interest to reduce principal.`)
    }
  }

  const payoffOrder: string[] = []
  const monthlySchedule: MonthlyDebtSnapshot[] = []
  let month = 0
  const maxMonths = 600

  // Total monthly commitment capacity = sum of all initial minimum payments + extra payment
  const totalMonthlyBudget = activeDebts.reduce((sum, d) => sum + d.minimumPayment, 0) + extraMonthlyPayment

  while (activeDebts.some(d => d.currentBalance > 0.005) && month < maxMonths) {
    month++

    const totalStartMonth = activeDebts.reduce((sum, d) => sum + d.currentBalance, 0)
    let monthInterest = 0
    let monthPrincipal = 0

    // Step 1: Accrue interest for all active accounts
    for (const debt of activeDebts) {
      if (debt.currentBalance > 0.005) {
        const monthlyRate = debt.apr / 100 / 12
        const interest = debt.currentBalance * monthlyRate
        debt.currentBalance += interest
        debt.totalInterest += interest
        monthInterest += interest
      }
    }

    // Step 2: Apply required minimum payments to each active debt
    let totalPaymentThisMonth = 0

    for (const debt of activeDebts) {
      if (debt.currentBalance > 0.005) {
        // Payment cannot exceed total balance
        const payment = Math.min(debt.currentBalance, debt.minimumPayment)
        debt.currentBalance -= payment
        debt.totalPrincipal += payment
        monthPrincipal += payment
        totalPaymentThisMonth += payment

        if (debt.currentBalance <= 0.005 && debt.payoffMonth === 0) {
          debt.currentBalance = 0
          debt.payoffMonth = month
          payoffOrder.push(debt.name)
        }
      }
    }

    // Step 3: Determine available acceleration pool (total monthly budget minus minimums already applied)
    let availableExtra = Math.max(0, totalMonthlyBudget - totalPaymentThisMonth)

    // Step 4: Sort remaining active debts based on strategy
    const remainingDebts = activeDebts.filter(d => d.currentBalance > 0.005)

    if (strategy === 'snowball') {
      // Lowest balance first; secondary sort by highest APR
      remainingDebts.sort((a, b) => a.currentBalance - b.currentBalance || b.apr - a.apr)
    } else {
      // Avalanche: Highest APR first; secondary sort by lowest balance
      remainingDebts.sort((a, b) => b.apr - a.apr || a.currentBalance - b.currentBalance)
    }

    // Step 5: Allocate acceleration pool to priority debts
    for (const target of remainingDebts) {
      if (availableExtra <= 0.005) break

      const payment = Math.min(target.currentBalance, availableExtra)
      target.currentBalance -= payment
      target.totalPrincipal += payment
      monthPrincipal += payment
      availableExtra -= payment

      if (target.currentBalance <= 0.005 && target.payoffMonth === 0) {
        target.currentBalance = 0
        target.payoffMonth = month
        payoffOrder.push(target.name)
      }
    }

    const totalEndMonth = activeDebts.reduce((sum, d) => sum + d.currentBalance, 0)

    // Check if progress is stalling (aggregate balance is growing despite payments)
    if (totalEndMonth >= totalStartMonth && month > 1) {
      warnings.push('Your total monthly payment budget is insufficient to reduce overall debt. Principal is expanding due to accrued interest.')
      break
    }

    const debtBalances: Record<string, number> = {}
    for (const d of activeDebts) {
      debtBalances[d.id] = Math.max(0, d.currentBalance)
    }

    monthlySchedule.push({
      month,
      totalStartingBalance: totalStartMonth,
      totalInterestPaid: monthInterest,
      totalPrincipalPaid: monthPrincipal,
      totalEndingBalance: totalEndMonth,
      debtBalances
    })
  }

  // Any debts not fully paid off mark their payoff month
  for (const d of activeDebts) {
    if (d.payoffMonth === 0 && d.currentBalance <= 0.005) {
      d.payoffMonth = month
      if (!payoffOrder.includes(d.name)) payoffOrder.push(d.name)
    }
  }

  const totalInterestPaid = activeDebts.reduce((sum, d) => sum + d.totalInterest, 0)
  const totalAmountRepaid = totalInitial + totalInterestPaid

  const individualResults: IndividualDebtResult[] = activeDebts.map(d => ({
    id: d.id,
    name: d.name,
    initialBalance: d.balance,
    apr: d.apr,
    payoffMonth: d.payoffMonth || month,
    totalInterestPaid: d.totalInterest,
    totalPrincipalPaid: d.totalPrincipal
  }))

  return {
    strategy,
    strategyName: strategy === 'avalanche' ? 'Debt Avalanche (Highest APR)' : 'Debt Snowball (Lowest Balance)',
    payoffMonths: month,
    debtFreeYears: Number((month / 12).toFixed(1)),
    totalInterestPaid,
    totalAmountRepaid,
    totalInitialBalance: totalInitial,
    debtPayoffOrder: payoffOrder,
    individualResults,
    monthlySchedule,
    hasNegativeAmortization,
    warningMessages: warnings
  }
}

export function calculateDebtPayoff(input: DebtPayoffInput): DebtPayoffOverallResult {
  const errors: string[] = []

  if (!input || !Array.isArray(input.debts) || input.debts.length === 0) {
    errors.push('Please enter at least one debt.')
    const emptyStrategy: StrategyResult = {
      strategy: 'avalanche',
      strategyName: 'Debt Avalanche',
      payoffMonths: 0,
      debtFreeYears: 0,
      totalInterestPaid: 0,
      totalAmountRepaid: 0,
      totalInitialBalance: 0,
      debtPayoffOrder: [],
      individualResults: [],
      monthlySchedule: [],
      hasNegativeAmortization: false,
      warningMessages: []
    }

    return {
      selectedStrategyResult: emptyStrategy,
      comparison: {
        snowball: emptyStrategy,
        avalanche: emptyStrategy,
        interestSavingsWithAvalanche: 0,
        monthsSavedWithAvalanche: 0,
        recommendedStrategy: 'avalanche'
      },
      isValid: false,
      validationErrors: errors
    }
  }

  const cleanDebts: DebtItem[] = input.debts.map((d, index) => {
    const rawBal = typeof d.balance === 'number' && isFinite(d.balance) ? d.balance : 0
    const rawApr = typeof d.apr === 'number' && isFinite(d.apr) ? d.apr : 0
    const rawMin = typeof d.minimumPayment === 'number' && isFinite(d.minimumPayment) ? d.minimumPayment : 0

    if (rawBal < 0) errors.push(`Debt "${d.name || `Debt ${index + 1}`}" balance cannot be negative.`)
    if (rawApr < 0) errors.push(`Debt "${d.name || `Debt ${index + 1}`}" APR cannot be negative.`)
    if (rawMin < 0) errors.push(`Debt "${d.name || `Debt ${index + 1}`}" minimum payment cannot be negative.`)

    return {
      id: d.id || `debt-${index + 1}`,
      name: d.name?.trim() || `Debt ${index + 1}`,
      balance: Math.max(0, rawBal),
      apr: Math.max(0, rawApr),
      minimumPayment: Math.max(0, rawMin)
    }
  })

  const extra = typeof input.extraMonthlyPayment === 'number' && isFinite(input.extraMonthlyPayment)
    ? Math.max(0, input.extraMonthlyPayment)
    : 0

  if (input.extraMonthlyPayment < 0) {
    errors.push('Extra monthly payment cannot be negative.')
  }

  const chosenStrategy = input.strategy || 'avalanche'

  const snowballResult = simulateStrategy(cleanDebts, extra, 'snowball')
  const avalancheResult = simulateStrategy(cleanDebts, extra, 'avalanche')

  const interestDiff = Math.max(0, snowballResult.totalInterestPaid - avalancheResult.totalInterestPaid)
  const monthsDiff = Math.max(0, snowballResult.payoffMonths - avalancheResult.payoffMonths)

  const selectedStrategyResult = chosenStrategy === 'snowball' ? snowballResult : avalancheResult

  return {
    selectedStrategyResult,
    comparison: {
      snowball: snowballResult,
      avalanche: avalancheResult,
      interestSavingsWithAvalanche: interestDiff,
      monthsSavedWithAvalanche: monthsDiff,
      recommendedStrategy: interestDiff > 5 ? 'avalanche' : 'snowball'
    },
    isValid: errors.length === 0,
    validationErrors: errors
  }
}
