export interface CreditCardAprInput {
  balance: number
  apr: number
  monthlyPayment: number
  additionalPayment?: number
  plannedNewPurchases?: number
  /**
   * When true, the fixed monthlyPayment is ignored and each month's payment
   * is the card minimum: max(minimumPaymentPercent % of the starting
   * balance, minimumPaymentFloor), capped at balance + interest.
   */
  payMinimumOnly?: boolean
  /** Minimum-payment percentage of balance. Default 3. */
  minimumPaymentPercent?: number
  /** Minimum-payment dollar floor. Default 25. */
  minimumPaymentFloor?: number
}

export interface AmortizationMonth {
  month: number
  startBalance: number
  interestCharged: number
  payment: number
  endBalance: number
  totalInterestSoFar: number
}

export interface CreditCardAprResult {
  firstMonthInterest: number
  firstMonthPrincipal: number
  totalMonthlyPayment: number
  payoffMonths: number
  payoffYears: number
  totalInterestPaid: number
  totalAmountPaid: number
  /** Interest charged per day on the starting balance: balance × APR ÷ 365. */
  dailyInterestCost: number
  /** True when the result was computed with payMinimumOnly. */
  isMinimumOnly: boolean
  isPayingOff: boolean
  isValid: boolean
  validationErrors: string[]
  warningMessage?: string
  schedulePreview: AmortizationMonth[]
}

export interface MinimumPaymentAnalysis {
  balance: number
  apr: number
  minimumPercent: number
  minimumFloor: number
  payoffMonths: number
  payoffYears: number
  totalInterestPaid: number
  totalAmountPaid: number
  /** First month whose minimum payment is the $ floor (3% of balance < floor). */
  floorMonth: number
  /** Balance at the start of the floor month. */
  floorStartBalance: number
  /** Final (payoff) month's payment. */
  finalPayment: number
  schedule: AmortizationMonth[]
}

export interface WorkedExampleScenario {
  balance: number
  apr: number
  monthlyPayment: number
  payoffMonths: number
  totalInterestPaid: number
  totalAmountPaid: number
}

export interface ComparisonScenario {
  label: string
  payoffMonths: number
  totalInterestPaid: number
  totalAmountPaid: number
}

/** Daily interest on the starting balance: balance × APR ÷ 365. */
export function calculateDailyInterest(balance: number, apr: number): number {
  if (!isFinite(balance) || !isFinite(apr) || balance <= 0 || apr <= 0) return 0
  return (balance * apr) / 100 / 365
}

/**
 * Calendar payoff month, e.g. "May 2029", for a payoff `months` from now.
 * Computed live from the given date (defaults to today) — never hard-coded.
 */
export function formatPayoffDate(months: number, fromDate: Date = new Date()): string {
  if (!isFinite(months) || months <= 0) return ''
  const d = new Date(fromDate.getFullYear(), fromDate.getMonth() + months, 1)
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

/**
 * ============================================================================
 * Credit Card APR & Payoff Calculator
 * ============================================================================
 *
 * Mathematical Model:
 * 1. Monthly Periodic Rate Approximation:
 *    Monthly Periodic Rate = (APR / 100) / 12
 *
 * 2. First Month Estimated Interest:
 *    First Month Interest = Balance * Monthly Periodic Rate
 *
 * 3. Principal Allocation:
 *    First Month Principal Reduction = max(0, Total Payment - First Month Interest)
 *
 * 4. Month-by-Month Amortization Recurrence:
 *    For month m = 1 to max 600:
 *      Interest_m = Balance_{m-1} * Monthly Periodic Rate
 *      Balance_m = Balance_{m-1} + Interest_m + NewPurchases - min(Payment_m, Balance_{m-1} + Interest_m)
 *      Stop when Balance <= 0.005.
 *    Fixed mode: Payment_m is the constant total monthly payment.
 *    Minimum-only mode: Payment_m = max(minimumPercent % of Balance_{m-1},
 *    minimumFloor), capped at Balance_{m-1} + Interest_m. The minimum is
 *    a percentage of the STARTING balance for the month — never of the
 *    balance after that month's interest is added.
 *
 * Core Financial Assumptions:
 * - Monthly Periodic Rate (APR / 12): Standard educational approximation.
 *   CARD ISSUER DIFFERENCES: In practice, US credit card issuers assess finance charges
 *   using a Daily Periodic Rate (DPR = APR / 365) applied to the Average Daily Balance (ADB)
 *   across the exact number of days in the billing cycle (28 to 31 days).
 * - Constant APR: Assumes APR remains unchanged throughout the payoff period (no variable
 *   prime rate adjustments or penalty APR triggers).
 * - Timely Payments: Assumes all scheduled monthly payments are received on or before the due date.
 * - Fees & Grace Periods: Excludes annual card fees, late payment charges, and balance transfer fees.
 *
 * Numerical Precision & Boundary Rules:
 * - 0% APR: Supported (e.g. promotional balance transfers); payoff timeline equals Balance / Payment.
 * - Non-converging Warning: If Monthly Payment <= Monthly Interest + New Purchases, debt will
 *   never decrease; the loop aborts immediately without hanging.
 * - 50-year cap (600 months): Prevents infinite loops on micro-amortizations.
 */
export function calculateCreditCardApr(input: CreditCardAprInput): CreditCardAprResult {
  const errors: string[] = []

  const emptyResult = (isValid: boolean): CreditCardAprResult => ({
    firstMonthInterest: 0,
    firstMonthPrincipal: 0,
    totalMonthlyPayment: 0,
    payoffMonths: 0,
    payoffYears: 0,
    totalInterestPaid: 0,
    totalAmountPaid: 0,
    dailyInterestCost: 0,
    isMinimumOnly: false,
    isPayingOff: false,
    isValid,
    validationErrors: errors,
    schedulePreview: []
  })

  if (!input) {
    return emptyResult(false)
  }

  const rawBalance = typeof input.balance === 'number' && isFinite(input.balance) ? input.balance : 0
  const rawApr = typeof input.apr === 'number' && isFinite(input.apr) ? input.apr : 0
  const rawBasePayment = typeof input.monthlyPayment === 'number' && isFinite(input.monthlyPayment) ? input.monthlyPayment : 0
  const rawAddPayment = typeof input.additionalPayment === 'number' && isFinite(input.additionalPayment) ? input.additionalPayment : 0
  const rawNewPurchases = typeof input.plannedNewPurchases === 'number' && isFinite(input.plannedNewPurchases) ? input.plannedNewPurchases : 0
  const payMinimumOnly = input.payMinimumOnly === true
  const minimumPercent =
    typeof input.minimumPaymentPercent === 'number' && isFinite(input.minimumPaymentPercent) && input.minimumPaymentPercent > 0
      ? input.minimumPaymentPercent
      : 3
  const minimumFloor =
    typeof input.minimumPaymentFloor === 'number' && isFinite(input.minimumPaymentFloor) && input.minimumPaymentFloor >= 0
      ? input.minimumPaymentFloor
      : 25

  if (rawBalance < 0) {
    errors.push('Card balance cannot be negative.')
  }
  if (rawApr < 0) {
    errors.push('APR cannot be negative.')
  }
  if (rawBasePayment < 0) {
    errors.push('Monthly payment cannot be negative.')
  }
  if (rawAddPayment < 0) {
    errors.push('Additional payment cannot be negative.')
  }
  if (rawNewPurchases < 0) {
    errors.push('Planned new purchases cannot be negative.')
  }

  const balance = Math.max(0, rawBalance)
  const apr = Math.max(0, rawApr)
  const fixedMonthlyPayment = Math.max(0, rawBasePayment) + Math.max(0, rawAddPayment)
  const newPurchases = Math.max(0, rawNewPurchases)
  const dailyInterestCost = calculateDailyInterest(balance, apr)

  const monthlyRate = (apr / 100) / 12
  const firstMonthInterest = balance * monthlyRate
  // Month-1 payment under the active mode. In minimum-only mode the first
  // month's minimum is based on the starting balance.
  const firstMonthPayment = payMinimumOnly
    ? Math.min(Math.max((minimumPercent / 100) * balance, minimumFloor), balance + firstMonthInterest + newPurchases)
    : fixedMonthlyPayment
  const totalMonthlyPayment = firstMonthPayment
  const firstMonthPrincipal = Math.max(0, Math.min(balance, firstMonthPayment - firstMonthInterest))

  if (balance <= 0) {
    return {
      firstMonthInterest: 0,
      firstMonthPrincipal: 0,
      totalMonthlyPayment,
      payoffMonths: 0,
      payoffYears: 0,
      totalInterestPaid: 0,
      totalAmountPaid: 0,
      dailyInterestCost,
      isMinimumOnly: payMinimumOnly,
      isPayingOff: true,
      isValid: errors.length === 0,
      validationErrors: errors,
      schedulePreview: []
    }
  }

  // Check if monthly payment is insufficient to pay monthly interest and new purchases
  if (firstMonthPayment <= firstMonthInterest + newPurchases) {
    return {
      firstMonthInterest,
      firstMonthPrincipal: 0,
      totalMonthlyPayment,
      payoffMonths: Infinity,
      payoffYears: Infinity,
      totalInterestPaid: Infinity,
      totalAmountPaid: Infinity,
      dailyInterestCost,
      isMinimumOnly: payMinimumOnly,
      isPayingOff: false,
      isValid: errors.length === 0,
      validationErrors: errors,
      warningMessage: 'Your monthly payment is too low to cover monthly interest. Under this model, the balance will never decrease.',
      schedulePreview: [
        {
          month: 1,
          startBalance: balance,
          interestCharged: firstMonthInterest,
          payment: firstMonthPayment,
          endBalance: balance + firstMonthInterest + newPurchases - firstMonthPayment,
          totalInterestSoFar: firstMonthInterest
        }
      ]
    }
  }

  // Month-by-month simulation
  const maxMonths = 600 // 50 years safety cap
  let currentBalance = balance
  let totalInterest = 0
  let totalPaid = 0
  let month = 0
  const schedule: AmortizationMonth[] = []

  while (currentBalance > 0.005 && month < maxMonths) {
    month++
    const monthStartBalance = currentBalance
    const interest = monthStartBalance * monthlyRate
    totalInterest += interest

    currentBalance = monthStartBalance + interest + newPurchases

    let paymentThisMonth = payMinimumOnly
      ? Math.max((minimumPercent / 100) * monthStartBalance, minimumFloor)
      : fixedMonthlyPayment
    if (paymentThisMonth > currentBalance) {
      paymentThisMonth = currentBalance
    }

    currentBalance -= paymentThisMonth
    totalPaid += paymentThisMonth

    if (month <= 12 || month % 12 === 0 || currentBalance <= 0.005) {
      schedule.push({
        month,
        startBalance: monthStartBalance,
        interestCharged: interest,
        payment: paymentThisMonth,
        endBalance: Math.max(0, currentBalance),
        totalInterestSoFar: totalInterest
      })
    }
  }

  const isPayingOff = currentBalance <= 0.01

  return {
    firstMonthInterest,
    firstMonthPrincipal,
    totalMonthlyPayment,
    payoffMonths: isPayingOff ? month : Infinity,
    payoffYears: isPayingOff ? Math.round((month / 12) * 10) / 10 : Infinity,
    totalInterestPaid: isPayingOff ? totalInterest : Infinity,
    totalAmountPaid: isPayingOff ? totalPaid : Infinity,
    dailyInterestCost,
    isMinimumOnly: payMinimumOnly,
    isPayingOff,
    isValid: errors.length === 0,
    validationErrors: errors,
    warningMessage: isPayingOff ? undefined : 'Balance was not fully paid off within 50 years under current assumptions.',
    schedulePreview: schedule
  }
}

/**
 * Full minimum-payment analysis for a balance/APR pair, with the complete
 * month-by-month schedule (not just the preview). Single source of truth for
 * Scenario A and the minimum-payment comparison table on the APR page.
 */
export function calculateMinimumPaymentSchedule(
  balance: number,
  apr: number,
  minimumPercent: number = 3,
  minimumFloor: number = 25
): MinimumPaymentAnalysis {
  const result = calculateCreditCardApr({
    balance,
    apr,
    monthlyPayment: 0,
    payMinimumOnly: true,
    minimumPaymentPercent: minimumPercent,
    minimumPaymentFloor: minimumFloor
  })

  // Re-run the recurrence keeping every month, so milestones (months 25/50/
  // 100, floor month, final month) are available to the page and tests.
  const monthlyRate = (apr / 100) / 12
  const schedule: AmortizationMonth[] = []
  let currentBalance = balance
  let totalInterest = 0
  let totalPaid = 0
  let month = 0
  let floorMonth = 0
  let floorStartBalance = 0

  while (currentBalance > 0.005 && month < 600) {
    month++
    const startBalance = currentBalance
    const interest = startBalance * monthlyRate
    totalInterest += interest
    const rawPayment = Math.max((minimumPercent / 100) * startBalance, minimumFloor)
    if (rawPayment === minimumFloor && floorMonth === 0) {
      floorMonth = month
      floorStartBalance = startBalance
    }
    const payment = Math.min(rawPayment, startBalance + interest)
    totalPaid += payment
    currentBalance = startBalance + interest - payment
    schedule.push({
      month,
      startBalance,
      interestCharged: interest,
      payment,
      endBalance: Math.max(0, currentBalance),
      totalInterestSoFar: totalInterest
    })
  }

  return {
    balance,
    apr,
    minimumPercent,
    minimumFloor,
    payoffMonths: result.payoffMonths,
    payoffYears: result.payoffYears,
    totalInterestPaid: result.totalInterestPaid,
    totalAmountPaid: result.totalAmountPaid,
    floorMonth,
    floorStartBalance,
    finalPayment: schedule.length > 0 ? schedule[schedule.length - 1].payment : 0,
    schedule
  }
}

/** Worked-examples table rows, computed from the engine — never hand-typed. */
export function getWorkedExampleScenarios(): WorkedExampleScenario[] {
  const inputs = [
    { balance: 4500, apr: 22.9, monthlyPayment: 200 },
    { balance: 4500, apr: 22.9, monthlyPayment: 350 },
    { balance: 8000, apr: 22.9, monthlyPayment: 200 },
    { balance: 2000, apr: 18.9, monthlyPayment: 150 }
  ]
  return inputs.map((input) => {
    const r = calculateCreditCardApr(input)
    return {
      ...input,
      payoffMonths: r.payoffMonths,
      totalInterestPaid: r.totalInterestPaid,
      totalAmountPaid: r.totalAmountPaid
    }
  })
}

/** Minimum-only vs fixed-payment comparison for the $4,500 / 22.9% default. */
export function getMinimumPaymentComparisonScenarios(): ComparisonScenario[] {
  const minOnly = calculateMinimumPaymentSchedule(4500, 22.9)
  const fixed200 = calculateCreditCardApr({ balance: 4500, apr: 22.9, monthlyPayment: 200 })
  const fixed350 = calculateCreditCardApr({ balance: 4500, apr: 22.9, monthlyPayment: 350 })
  return [
    {
      label: 'Minimum payment only (3% of balance, $25 floor)',
      payoffMonths: minOnly.payoffMonths,
      totalInterestPaid: minOnly.totalInterestPaid,
      totalAmountPaid: minOnly.totalAmountPaid
    },
    {
      label: 'Fixed $200 / month',
      payoffMonths: fixed200.payoffMonths,
      totalInterestPaid: fixed200.totalInterestPaid,
      totalAmountPaid: fixed200.totalAmountPaid
    },
    {
      label: 'Fixed $350 / month',
      payoffMonths: fixed350.payoffMonths,
      totalInterestPaid: fixed350.totalInterestPaid,
      totalAmountPaid: fixed350.totalAmountPaid
    }
  ]
}

/** Scenario A: $5,000 balance at 24% APR, paying only the 3% minimum ($25 floor). */
export function getScenarioAMinimumAnalysis(): MinimumPaymentAnalysis {
  return calculateMinimumPaymentSchedule(5000, 24, 3, 25)
}
