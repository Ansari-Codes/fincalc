export type LoanTermUnit = 'years' | 'months'

export interface LoanPaymentInput {
  principal: number
  annualRate: number // APR percent e.g. 6.5 for 6.5%
  term: number
  termUnit: LoanTermUnit
  extraMonthlyPayment?: number
}

export interface LoanAmortizationRow {
  paymentNumber: number
  startingBalance: number
  interest: number
  principalRepaid: number
  additionalPayment: number
  totalPaymentThisMonth: number
  endingBalance: number
  totalInterestPaidToDate: number
  totalPrincipalPaidToDate: number
}

export interface LoanPaymentResult {
  regularMonthlyPayment: number
  totalMonthlyPayment: number
  totalInterest: number
  totalRepayment: number
  principal: number
  originalMonths: number
  actualPayoffMonths: number
  monthsSaved: number
  interestSaved: number
  schedule: LoanAmortizationRow[]
  isValid: boolean
  validationErrors: string[]
}

/**
 * ============================================================================
 * Fixed-Rate Loan Payment Calculator Engine
 * ============================================================================
 * 
 * Mathematical Formulation:
 * 1. Standard Monthly Amortization Formula:
 *    M = P * [ r(1 + r)^n / ((1 + r)^n - 1) ]
 *    equivalent to:
 *    M = P * [ r / (1 - (1 + r)^(-n)) ]
 *    where:
 *      P = Principal loan amount
 *      r = Monthly periodic interest rate = APR / 12 / 100
 *      n = Total number of monthly installments
 * 
 * 2. Zero-Interest Amortization (r = 0):
 *    M = P / n
 * 
 * 3. Additional Monthly Principal Prepayments:
 *    Each month, actual principal applied = (M - monthly_interest) + extraPayment.
 *    Balances compound strictly monthly. Early payoff terminates the schedule
 *    as soon as ending balance reaches zero.
 * 
 * Assumptions & Limitations:
 * - Constant APR and standard 30/360 or uniform monthly interest compounding (APR / 12).
 * - Excludes loan origination fees, closing costs, escrow (taxes/insurance), and early payoff penalties.
 */
export function calculateLoanPayment(input: LoanPaymentInput): LoanPaymentResult {
  const errors: string[] = []

  if (!input) {
    return {
      regularMonthlyPayment: 0,
      totalMonthlyPayment: 0,
      totalInterest: 0,
      totalRepayment: 0,
      principal: 0,
      originalMonths: 0,
      actualPayoffMonths: 0,
      monthsSaved: 0,
      interestSaved: 0,
      schedule: [],
      isValid: false,
      validationErrors: ['No loan calculation input provided.']
    }
  }

  const rawP = typeof input.principal === 'number' && isFinite(input.principal) ? input.principal : 0
  const rawRate = typeof input.annualRate === 'number' && isFinite(input.annualRate) ? input.annualRate : 0
  const rawTerm = typeof input.term === 'number' && isFinite(input.term) ? input.term : 0
  const rawExtra = typeof input.extraMonthlyPayment === 'number' && isFinite(input.extraMonthlyPayment)
    ? input.extraMonthlyPayment
    : 0

  if (rawP < 0) errors.push('Loan principal cannot be negative.')
  if (rawRate < 0) errors.push('Interest rate (APR) cannot be negative.')
  if (rawTerm <= 0) errors.push('Loan term must be greater than zero.')
  if (rawExtra < 0) errors.push('Additional monthly payment cannot be negative.')

  const principal = Math.max(0, rawP)
  const annualRate = Math.max(0, rawRate)
  const extra = Math.max(0, rawExtra)
  const termUnit = input.termUnit || 'years'

  const totalMonths = Math.min(
    600, // Max 50 years safety cap
    Math.max(1, Math.round(termUnit === 'years' ? rawTerm * 12 : rawTerm))
  )

  if (rawTerm > 50 && termUnit === 'years') {
    errors.push('Loan term exceeds maximum limit of 50 years (600 months).')
  }

  // Edge case: zero principal
  if (principal === 0) {
    return {
      regularMonthlyPayment: 0,
      totalMonthlyPayment: 0,
      totalInterest: 0,
      totalRepayment: 0,
      principal: 0,
      originalMonths: totalMonths,
      actualPayoffMonths: 0,
      monthsSaved: 0,
      interestSaved: 0,
      schedule: [],
      isValid: errors.length === 0,
      validationErrors: errors
    }
  }

  const r = annualRate / 100 / 12

  // Baseline standard payment (without extra payments)
  let standardMonthlyPayment = 0
  if (r === 0) {
    standardMonthlyPayment = principal / totalMonths
  } else {
    const factor = Math.pow(1 + r, totalMonths)
    standardMonthlyPayment = principal * (r * factor) / (factor - 1)
  }

  // Baseline total interest without extra payments
  const baselineTotalInterest = (standardMonthlyPayment * totalMonths) - principal

  // Generate actual schedule with optional extra monthly payments
  const schedule: LoanAmortizationRow[] = []
  let balance = principal
  let cumulativeInterest = 0
  let cumulativePrincipal = 0
  let month = 0

  // Guard against infinite iteration: max 1200 months
  const maxIterations = 1200

  while (balance > 0.005 && month < maxIterations) {
    month++
    const startingBal = balance
    const interestCharge = r > 0 ? startingBal * r : 0
    let regularPrincipal = standardMonthlyPayment - interestCharge

    // If remaining balance plus interest is less than regular payment
    if (startingBal + interestCharge <= standardMonthlyPayment) {
      regularPrincipal = startingBal
      const totalPaid = startingBal + interestCharge
      balance = 0
      cumulativeInterest += interestCharge
      cumulativePrincipal += regularPrincipal

      schedule.push({
        paymentNumber: month,
        startingBalance: startingBal,
        interest: interestCharge,
        principalRepaid: regularPrincipal,
        additionalPayment: 0,
        totalPaymentThisMonth: totalPaid,
        endingBalance: 0,
        totalInterestPaidToDate: cumulativeInterest,
        totalPrincipalPaidToDate: cumulativePrincipal
      })
      break
    }

    let actualExtra = extra
    // Check if extra payment overshoots the remaining balance
    if (startingBal - regularPrincipal < actualExtra) {
      actualExtra = Math.max(0, startingBal - regularPrincipal)
    }

    const totalPrincipal = regularPrincipal + actualExtra
    const endingBal = Math.max(0, startingBal - totalPrincipal)
    const totalMonthPaid = interestCharge + totalPrincipal

    cumulativeInterest += interestCharge
    cumulativePrincipal += totalPrincipal
    balance = endingBal

    schedule.push({
      paymentNumber: month,
      startingBalance: startingBal,
      interest: interestCharge,
      principalRepaid: regularPrincipal,
      additionalPayment: actualExtra,
      totalPaymentThisMonth: totalMonthPaid,
      endingBalance: endingBal,
      totalInterestPaidToDate: cumulativeInterest,
      totalPrincipalPaidToDate: cumulativePrincipal
    })
  }

  const actualPayoffMonths = schedule.length
  const totalRepayment = cumulativePrincipal + cumulativeInterest
  const interestSaved = Math.max(0, baselineTotalInterest - cumulativeInterest)
  const monthsSaved = Math.max(0, totalMonths - actualPayoffMonths)

  return {
    regularMonthlyPayment: standardMonthlyPayment,
    totalMonthlyPayment: standardMonthlyPayment + (balance === 0 && actualPayoffMonths === 0 ? 0 : extra),
    totalInterest: cumulativeInterest,
    totalRepayment,
    principal,
    originalMonths: totalMonths,
    actualPayoffMonths,
    monthsSaved,
    interestSaved,
    schedule,
    isValid: errors.length === 0,
    validationErrors: errors
  }
}
