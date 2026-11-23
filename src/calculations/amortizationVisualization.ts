import type { LoanAmortizationRow } from './loanPayment'

export interface AnnualAmortizationSummary {
  year: number
  startingBalance: number
  endingBalance: number
  totalPrincipalPaid: number
  totalInterestPaid: number
  totalAdditionalPaid: number
  totalPaid: number
  cumulativeInterest: number
  cumulativePrincipal: number
}

export interface AmortizationMilestones {
  crossoverPoint: {
    month: number
    year: number
    monthInYear: number
    principal: number
    interest: number
  } | null
  halfwayBalancePoint: {
    month: number
    year: number
    balance: number
  } | null
  seventyFivePercentInterestPoint: {
    month: number
    year: number
    cumulativeInterest: number
    threshold: number
  } | null
  payoffPoint: {
    month: number
    year: number
    totalInterest: number
    totalRepayment: number
  }
  comparisonWithBaseline?: {
    baselinePayoffMonth: number
    monthsSaved: number
    interestSaved: number
    percentageInterestSaved: number
  }
}

export interface ChartCoordinate {
  x: number
  y: number
}

/**
 * Identifies the first month in an amortization schedule where the regular principal portion
 * of the payment meets or exceeds the accrued monthly interest charge (the "crossover point").
 */
export function findCrossoverPoint(schedule: LoanAmortizationRow[]): {
  month: number
  year: number
  monthInYear: number
  principal: number
  interest: number
} | null {
  if (!schedule || schedule.length === 0) return null

  for (const row of schedule) {
    if (row.principalRepaid >= row.interest) {
      const month = row.paymentNumber
      const year = Math.floor((month - 1) / 12) + 1
      const monthInYear = ((month - 1) % 12) + 1
      return {
        month,
        year,
        monthInYear,
        principal: row.principalRepaid,
        interest: row.interest
      }
    }
  }

  return null
}

/**
 * Aggregates monthly amortization schedule into annual calendar blocks (12-month periods).
 */
export function aggregateScheduleByYear(schedule: LoanAmortizationRow[]): AnnualAmortizationSummary[] {
  if (!schedule || schedule.length === 0) return []

  const annuals: AnnualAmortizationSummary[] = []
  const totalMonths = schedule.length

  for (let startIdx = 0; startIdx < totalMonths; startIdx += 12) {
    const slice = schedule.slice(startIdx, Math.min(startIdx + 12, totalMonths))
    const year = Math.floor(startIdx / 12) + 1
    const startingBalance = slice[0].startingBalance
    const lastRow = slice[slice.length - 1]
    const endingBalance = lastRow.endingBalance

    const totalPrincipalPaid = slice.reduce((sum, r) => sum + r.principalRepaid, 0)
    const totalAdditionalPaid = slice.reduce((sum, r) => sum + r.additionalPayment, 0)
    const totalInterestPaid = slice.reduce((sum, r) => sum + r.interest, 0)
    const totalPaid = slice.reduce((sum, r) => sum + r.totalPaymentThisMonth, 0)

    annuals.push({
      year,
      startingBalance,
      endingBalance,
      totalPrincipalPaid: totalPrincipalPaid + totalAdditionalPaid,
      totalInterestPaid,
      totalAdditionalPaid,
      totalPaid,
      cumulativeInterest: lastRow.totalInterestPaidToDate,
      cumulativePrincipal: lastRow.totalPrincipalPaidToDate
    })
  }

  return annuals
}

/**
 * Computes major financial milestones for visualization and summary cards.
 */
export function calculateAmortizationMilestones(
  schedule: LoanAmortizationRow[],
  baselineSchedule?: LoanAmortizationRow[]
): AmortizationMilestones | null {
  if (!schedule || schedule.length === 0) return null

  const crossoverPoint = findCrossoverPoint(schedule)

  const initialPrincipal = schedule[0].startingBalance
  const halfPrincipal = initialPrincipal / 2

  let halfwayBalancePoint: { month: number; year: number; balance: number } | null = null
  for (const row of schedule) {
    if (row.endingBalance <= halfPrincipal) {
      halfwayBalancePoint = {
        month: row.paymentNumber,
        year: Number((row.paymentNumber / 12).toFixed(1)),
        balance: row.endingBalance
      }
      break
    }
  }

  const finalRow = schedule[schedule.length - 1]
  const lifetimeInterest = finalRow.totalInterestPaidToDate
  const interest75Threshold = lifetimeInterest * 0.75

  let seventyFivePercentInterestPoint: AmortizationMilestones['seventyFivePercentInterestPoint'] = null
  if (lifetimeInterest > 0) {
    for (const row of schedule) {
      if (row.totalInterestPaidToDate >= interest75Threshold) {
        seventyFivePercentInterestPoint = {
          month: row.paymentNumber,
          year: Number((row.paymentNumber / 12).toFixed(1)),
          cumulativeInterest: row.totalInterestPaidToDate,
          threshold: interest75Threshold
        }
        break
      }
    }
  }

  const payoffPoint = {
    month: finalRow.paymentNumber,
    year: Number((finalRow.paymentNumber / 12).toFixed(1)),
    totalInterest: finalRow.totalInterestPaidToDate,
    totalRepayment: finalRow.totalPrincipalPaidToDate + finalRow.totalInterestPaidToDate
  }

  let comparisonWithBaseline: AmortizationMilestones['comparisonWithBaseline'] = undefined

  if (baselineSchedule && baselineSchedule.length > 0 && baselineSchedule.length !== schedule.length) {
    const baselineFinal = baselineSchedule[baselineSchedule.length - 1]
    const monthsSaved = Math.max(0, baselineSchedule.length - schedule.length)
    const interestSaved = Math.max(0, baselineFinal.totalInterestPaidToDate - finalRow.totalInterestPaidToDate)
    const percentageInterestSaved = baselineFinal.totalInterestPaidToDate > 0
      ? (interestSaved / baselineFinal.totalInterestPaidToDate) * 100
      : 0

    comparisonWithBaseline = {
      baselinePayoffMonth: baselineSchedule.length,
      monthsSaved,
      interestSaved,
      percentageInterestSaved
    }
  }

  return {
    crossoverPoint,
    halfwayBalancePoint,
    seventyFivePercentInterestPoint,
    payoffPoint,
    comparisonWithBaseline
  }
}

/**
 * Builds an SVG path `d` string from a sequence of (x, y) coordinates.
 */
export function generateSvgPath(points: ChartCoordinate[]): string {
  if (!points || points.length === 0) return ''
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')
}

/**
 * Builds an SVG closed area path `d` string between points and a bottom baseline Y.
 */
export function generateAreaPath(points: ChartCoordinate[], baselineY: number): string {
  if (!points || points.length === 0) return ''
  const linePath = generateSvgPath(points)
  const first = points[0]
  const last = points[points.length - 1]
  return `${linePath} L ${last.x.toFixed(2)} ${baselineY.toFixed(2)} L ${first.x.toFixed(2)} ${baselineY.toFixed(2)} Z`
}

/**
 * Builds an SVG closed stacked area path between a bottom curve and top curve.
 */
export function generateStackAreaPath(bottomPoints: ChartCoordinate[], topPoints: ChartCoordinate[]): string {
  if (!bottomPoints || !topPoints || bottomPoints.length === 0 || topPoints.length === 0) return ''
  const topLine = generateSvgPath(topPoints)
  const reversedBottom = [...bottomPoints].reverse()
  const bottomLine = reversedBottom.map((p) => `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')
  return `${topLine} ${bottomLine} Z`
}
