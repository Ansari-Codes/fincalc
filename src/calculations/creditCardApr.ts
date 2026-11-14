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
  warningMessage?: string
  schedulePreview: AmortizationMonth[]
}

/**
 * Calculates credit card APR interest and payoff timeline.
 * Uses a monthly approximation with monthly periodic rate = (APR / 100) / 12.
 * Explains clearly that issuers calculate based on average daily balance and daily rates.
 */
export function calculateCreditCardApr(input: CreditCardAprInput): CreditCardAprResult {
  const balance = Math.max(0, Number(input.balance) || 0)
  const apr = Math.max(0, Number(input.apr) || 0)
  const basePayment = Math.max(0, Number(input.monthlyPayment) || 0)
  const addPayment = Math.max(0, Number(input.additionalPayment) || 0)
  const newPurchases = Math.max(0, Number(input.plannedNewPurchases) || 0)

  const totalMonthlyPayment = basePayment + addPayment
  const monthlyRate = (apr / 100) / 12

  const firstMonthInterest = balance * monthlyRate
  const firstMonthPrincipal = Math.max(0, totalMonthlyPayment - firstMonthInterest)

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
      schedulePreview: []
    }
  }

  // Check if monthly payment is less than or equal to monthly interest plus new purchases
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
    const interest = currentBalance * monthlyRate
    totalInterest += interest
    currentBalance += interest + newPurchases

    let paymentThisMonth = totalMonthlyPayment
    if (paymentThisMonth > currentBalance) {
      paymentThisMonth = currentBalance
    }

    currentBalance -= paymentThisMonth
    totalPaid += paymentThisMonth

    if (month <= 12 || month % 12 === 0 || currentBalance <= 0.005) {
      schedule.push({
        month,
        startBalance: currentBalance + paymentThisMonth - interest,
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
    warningMessage: isPayingOff ? undefined : 'Balance was not fully paid off within 50 years.',
    schedulePreview: schedule
  }
}
