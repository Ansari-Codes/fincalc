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
}

/**
 * Calculates Return on Investment (ROI)
 * Formula:
 * Total Cost = initialInvestment + additionalCosts
 * Total Value Returned = finalValue + additionalIncome
 * Net Profit = Total Value Returned - Total Cost
 * ROI (%) = (Net Profit / Total Cost) * 100
 */
export function calculateRoi(input: RoiInput): RoiResult {
  const initial = Number(input.initialInvestment) || 0
  const addCosts = Number(input.additionalCosts) || 0
  const finalVal = Number(input.finalValue) || 0
  const addIncome = Number(input.additionalIncome) || 0

  const totalCost = initial + (addCosts > 0 ? addCosts : 0)
  const totalValueReturned = finalVal + (addIncome > 0 ? addIncome : 0)
  const netProfit = totalValueReturned - totalCost

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
    isBreakEven: netProfit === 0
  }
}
