export interface CreditCardAprInput {
  balance: number
  apr: number
  monthlyPayment: number
  additionalPayment?: number
  plannedNewPurchases?: number
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
  isPayingOff: boolean
  isValid: boolean
  validationErrors: string[]
  warningMessage?: string
  schedulePreview: AmortizationMonth[]
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
 *      Balance_m = Balance_{m-1} + Interest_m + NewPurchases - min(Total Payment, Balance_{m-1} + Interest_m)
 *      Stop when Balance <= 0.005.
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

  if (!input) {
    return {
      firstMonthInterest: 0,
      firstMonthPrincipal: 0,
      totalMonthlyPayment: 0,
      payoffMonths: 0,
      payoffYears: 0,
      totalInterestPaid: 0,
      totalAmountPaid: 0,
      isPayingOff: false,
      isValid: false,
      validationErrors: ['No calculation input provided.'],
      schedulePreview: []
    }
  }

  const rawBalance = typeof input.balance === 'number' && isFinite(input.balance) ? input.balance : 0
  const rawApr = typeof input.apr === 'number' && isFinite(input.apr) ? input.apr : 0
  const rawBasePayment = typeof input.monthlyPayment === 'number' && isFinite(input.monthlyPayment) ? input.monthlyPayment : 0
  const rawAddPayment = typeof input.additionalPayment === 'number' && isFinite(input.additionalPayment) ? input.additionalPayment : 0
  const rawNewPurchases = typeof input.plannedNewPurchases === 'number' && isFinite(input.plannedNewPurchases) ? input.plannedNewPurchases : 0

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
  const totalMonthlyPayment = Math.max(0, rawBasePayment) + Math.max(0, rawAddPayment)
  const newPurchases = Math.max(0, rawNewPurchases)

  const monthlyRate = (apr / 100) / 12
  const firstMonthInterest = balance * monthlyRate
  const firstMonthPrincipal = Math.max(0, Math.min(balance, totalMonthlyPayment - firstMonthInterest))

  if (balance <= 0) {
    return {
      firstMonthInterest: 0,
      firstMonthPrincipal: 0,
      totalMonthlyPayment,
      payoffMonths: 0,
      payoffYears: 0,
      totalInterestPaid: 0,
      totalAmountPaid: 0,
      isPayingOff: true,
      isValid: errors.length === 0,
      validationErrors: errors,
      schedulePreview: []
    }
  }

  // Check if monthly payment is insufficient to pay monthly interest and new purchases
  if (totalMonthlyPayment <= firstMonthInterest + newPurchases) {
    return {
      firstMonthInterest,
      firstMonthPrincipal: 0,
      totalMonthlyPayment,
      payoffMonths: Infinity,
      payoffYears: Infinity,
      totalInterestPaid: Infinity,
      totalAmountPaid: Infinity,
      isPayingOff: false,
      isValid: errors.length === 0,
      validationErrors: errors,
      warningMessage: 'Your monthly payment is too low to cover monthly interest. Under this model, the balance will never decrease.',
      schedulePreview: [
        {
          month: 1,
          startBalance: balance,
          interestCharged: firstMonthInterest,
          payment: totalMonthlyPayment,
          endBalance: balance + firstMonthInterest + newPurchases - totalMonthlyPayment,
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

    let paymentThisMonth = totalMonthlyPayment
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
    isPayingOff,
    isValid: errors.length === 0,
    validationErrors: errors,
    warningMessage: isPayingOff ? undefined : 'Balance was not fully paid off within 50 years under current assumptions.',
    schedulePreview: schedule
  }
}
