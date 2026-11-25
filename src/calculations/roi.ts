export interface RoiInput {
  initialInvestment: number
  finalValue: number
  additionalCosts?: number
  additionalIncome?: number
  /**
   * Optional holding period in years (fractions allowed, e.g. 2.5).
   * When set (> 0), the result also carries the annualised (compound
   * yearly) ROI. When omitted, only simple cumulative ROI is reported.
   */
  holdingPeriodYears?: number
}

export interface RoiResult {
  totalCost: number
  totalValueReturned: number
  netProfit: number
  roiPercentage: number
  /** Annualised ROI (%) = ((1 + simpleROI/100)^(1/years) − 1) × 100. Only present when a valid holding period was supplied. */
  annualizedRoiPercentage?: number
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
 * - Holding duration: Simple ROI does NOT account for investment duration on its own.
 *   An ROI of 50% over 1 year is vastly superior to 50% over 10 years. When the caller
 *   supplies an optional holding period (years), the result also carries the annualised
 *   ROI — the equivalent compound yearly rate: ((1 + ROI/100)^(1/years) − 1) × 100.
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
  const holdingYears = typeof input.holdingPeriodYears === 'number' && isFinite(input.holdingPeriodYears)
    ? input.holdingPeriodYears
    : undefined

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
  if (holdingYears !== undefined && holdingYears <= 0) {
    errors.push('Holding period must be greater than zero years to annualise the return.')
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

  // Annualised ROI (equivalent compound yearly rate), only when a valid
  // holding period was supplied. Simple ROI stays the primary figure.
  // Guarded: roiPercentage is bounded to >= -100% by construction
  // (totalValueReturned >= 0), so the base (1 + roi/100) is >= 0.
  let annualizedRoiPercentage: number | undefined
  if (holdingYears !== undefined && holdingYears > 0 && totalCost > 0) {
    const base = 1 + roiPercentage / 100
    if (base >= 0) {
      annualizedRoiPercentage = (Math.pow(base, 1 / holdingYears) - 1) * 100
    }
  }

  return {
    totalCost,
    totalValueReturned,
    netProfit,
    roiPercentage,
    annualizedRoiPercentage,
    isProfitable: netProfit > 0,
    isBreakEven: netProfit === 0 && totalCost > 0,
    isValid: errors.length === 0,
    validationErrors: errors
  }
}
