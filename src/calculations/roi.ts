export interface RoiInput {
  initialInvestment: number
  finalValue: number
  additionalCosts?: number
  additionalIncome?: number
}

export interface RoiResult {
  totalCost: number
  totalValueReturned: number
  netProfit: number
  roiPercentage: number
  isProfitable: boolean
  isBreakEven: boolean
  isValid: boolean
  validationErrors: string[]
}

/**
 * ============================================================================
 * Return on Investment (ROI) Calculator
 * ============================================================================
 * 
 * Mathematical Model:
 * 1. Total Cost Basis:
 *    Total Cost = Initial Investment + Additional Costs
 * 
 * 2. Total Value Returned:
 *    Total Value Returned = Final Value + Additional Income (Dividends/Cash Flow)
 * 
 * 3. Net Profit / Loss:
 *    Net Profit = Total Value Returned - Total Cost
 * 
 * 4. Percentage ROI:
 *    ROI (%) = (Net Profit / Total Cost) * 100
 * 
 * Core Financial Assumptions:
 * - Simple cumulative ROI: Measures total percentage gain or loss relative to capital invested.
 * - Time Horizon Exclusion: Basic ROI does NOT account for investment duration or annualized
 *   compounding (CAGR). An ROI of 50% over 1 year is vastly superior to 50% over 10 years.
 * - Cash-on-cash evaluation: Assumes nominal dollars without automatic inflation or tax adjustments.
 * - Losses: Negative net profit produces a negative ROI (down to -100% for total loss, or beyond
 *   if additional ongoing liabilities were incurred).
 * 
 * Numerical Precision & Boundary Rules:
 * - When Total Cost is 0, ROI percentage is mathematically undefined (division by zero).
 *   The function safely returns 0% with an explicit validation error explaining that cost must exceed 0.
 * - Negative costs or proceeds are guarded and validated.
 */
export function calculateRoi(input: RoiInput): RoiResult {
  const errors: string[] = []

  const initial = typeof input.initialInvestment === 'number' && isFinite(input.initialInvestment)
    ? input.initialInvestment
    : 0
  const addCosts = typeof input.additionalCosts === 'number' && isFinite(input.additionalCosts)
    ? input.additionalCosts
    : 0
  const finalVal = typeof input.finalValue === 'number' && isFinite(input.finalValue)
    ? input.finalValue
    : 0
  const addIncome = typeof input.additionalIncome === 'number' && isFinite(input.additionalIncome)
    ? input.additionalIncome
    : 0

  if (initial < 0) {
    errors.push('Initial investment cannot be negative.')
  }
  if (addCosts < 0) {
    errors.push('Additional costs cannot be negative.')
  }
  if (finalVal < 0) {
    errors.push('Final value cannot be negative.')
  }
  if (addIncome < 0) {
    errors.push('Additional income cannot be negative.')
  }

  const safeInitial = Math.max(0, initial)
  const safeCosts = Math.max(0, addCosts)
  const safeFinal = Math.max(0, finalVal)
  const safeIncome = Math.max(0, addIncome)

  const totalCost = safeInitial + safeCosts
  const totalValueReturned = safeFinal + safeIncome
  const netProfit = totalValueReturned - totalCost

  if (totalCost === 0) {
    errors.push('Total investment cost must be greater than zero to calculate percentage ROI.')
  }

  let roiPercentage = 0
  if (totalCost > 0) {
    roiPercentage = (netProfit / totalCost) * 100
  }

  return {
    totalCost,
    totalValueReturned,
    netProfit,
    roiPercentage,
    isProfitable: netProfit > 0,
    isBreakEven: netProfit === 0 && totalCost > 0,
    isValid: errors.length === 0,
    validationErrors: errors
  }
}
