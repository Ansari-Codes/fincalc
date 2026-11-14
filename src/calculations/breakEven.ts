export interface BreakEvenInput {
  sellingPricePerUnit: number // P
  variableCostPerUnit: number // V
  totalFixedCosts: number // F
  targetProfit?: number
  expectedSalesVolume?: number // units
}

export interface BreakEvenResult {
  contributionMarginPerUnit: number
  contributionMarginRatio: number // 0 to 1 (or 0 to 100%)
  breakEvenUnitsExact: number
  breakEvenUnitsRounded: number // ceil for physical units
  breakEvenRevenue: number
  targetProfitUnitsExact?: number
  targetProfitUnitsRounded?: number
  targetProfitRevenue?: number
  expectedProfitOrLoss?: number
  marginOfSafetyUnits?: number
  marginOfSafetyRevenue?: number
  marginOfSafetyPercentage?: number
  isViable: boolean
  isLossMakingPerUnit: boolean
  isValid: boolean
  validationErrors: string[]
}

/**
 * ============================================================================
 * Business Break-Even & Cost-Volume-Profit (CVP) Calculator Engine
 * ============================================================================
 * 
 * Standard Economic / Accounting Formulations:
 * 1. Unit Contribution Margin:
 *    CM = Price (P) - Variable Cost per Unit (V)
 * 
 * 2. Contribution Margin Ratio:
 *    CMR = CM / P = (P - V) / P
 * 
 * 3. Break-Even Sales Volume:
 *    Q_be = Fixed Costs (F) / CM
 *    Note: In managerial accounting, physical products require rounding UP
 *    to the next integer: ceil(Q_be).
 * 
 * 4. Break-Even Dollar Revenue:
 *    Revenue_be = Q_be * P = F / CMR
 * 
 * 5. Target Profit Analysis:
 *    Q_target = (F + Target Profit) / CM
 *    Revenue_target = Q_target * P
 * 
 * 6. Margin of Safety (MoS):
 *    When expected sales Q_exp are provided:
 *    MoS_units = Q_exp - Q_be
 *    MoS_dollars = MoS_units * P
 *    MoS_ratio = MoS_units / Q_exp (for Q_exp > 0)
 * 
 * Assumptions & Limitations:
 * - Linear Cost Structure: Variable costs per unit and unit sales price remain constant across all output levels.
 * - Single-product or stable sales mix.
 * - Inventory constancy: Number of units produced equals units sold.
 * - Excludes non-operating income, taxes, and price elasticity fluctuations.
 */
export function calculateBreakEven(input: BreakEvenInput): BreakEvenResult {
  const errors: string[] = []

  if (!input) {
    return {
      contributionMarginPerUnit: 0,
      contributionMarginRatio: 0,
      breakEvenUnitsExact: 0,
      breakEvenUnitsRounded: 0,
      breakEvenRevenue: 0,
      isViable: false,
      isLossMakingPerUnit: false,
      isValid: false,
      validationErrors: ['No calculation input provided.']
    }
  }

  const rawP = typeof input.sellingPricePerUnit === 'number' && isFinite(input.sellingPricePerUnit) ? input.sellingPricePerUnit : 0
  const rawV = typeof input.variableCostPerUnit === 'number' && isFinite(input.variableCostPerUnit) ? input.variableCostPerUnit : 0
  const rawF = typeof input.totalFixedCosts === 'number' && isFinite(input.totalFixedCosts) ? input.totalFixedCosts : 0
  const rawTargetProfit = typeof input.targetProfit === 'number' && isFinite(input.targetProfit) ? input.targetProfit : undefined
  const rawExpectedVol = typeof input.expectedSalesVolume === 'number' && isFinite(input.expectedSalesVolume) ? input.expectedSalesVolume : undefined

  if (rawP <= 0) errors.push('Selling price per unit must be greater than zero.')
  if (rawV < 0) errors.push('Variable cost per unit cannot be negative.')
  if (rawF < 0) errors.push('Total fixed costs cannot be negative.')
  if (rawTargetProfit !== undefined && rawTargetProfit < 0) errors.push('Target profit cannot be negative.')
  if (rawExpectedVol !== undefined && rawExpectedVol < 0) errors.push('Expected sales volume cannot be negative.')

  const P = Math.max(0, rawP)
  const V = Math.max(0, rawV)
  const F = Math.max(0, rawF)

  const cm = P - V
  const cmr = P > 0 ? (cm / P) : 0

  let isLossMaking = false
  let isViable = true
  let breakEvenExact = 0
  let breakEvenRounded = 0
  let breakEvenRevenue = 0

  if (cm <= 0) {
    isLossMaking = true
    isViable = false
    if (cm === 0) {
      errors.push('Selling price exactly equals variable cost ($0 contribution margin). You will never cover fixed costs.')
    } else {
      errors.push(`Variable cost exceeds selling price by $${Math.abs(cm).toFixed(2)} per unit. Every unit sold increases your net loss.`)
    }
  } else {
    // Normal viable scenario
    breakEvenExact = F / cm
    breakEvenRounded = Math.ceil(breakEvenExact)
    breakEvenRevenue = breakEvenRounded * P
  }

  // Target profit calculations
  let targetProfitUnitsExact: number | undefined
  let targetProfitUnitsRounded: number | undefined
  let targetProfitRevenue: number | undefined

  if (rawTargetProfit !== undefined && cm > 0) {
    targetProfitUnitsExact = (F + rawTargetProfit) / cm
    targetProfitUnitsRounded = Math.ceil(targetProfitUnitsExact)
    targetProfitRevenue = targetProfitUnitsRounded * P
  }

  // Margin of safety and expected profit/loss
  let expectedProfitOrLoss: number | undefined
  let marginOfSafetyUnits: number | undefined
  let marginOfSafetyRevenue: number | undefined
  let marginOfSafetyPercentage: number | undefined

  if (rawExpectedVol !== undefined) {
    expectedProfitOrLoss = (rawExpectedVol * cm) - F

    if (cm > 0) {
      marginOfSafetyUnits = rawExpectedVol - breakEvenRounded
      marginOfSafetyRevenue = marginOfSafetyUnits * P
      marginOfSafetyPercentage = rawExpectedVol > 0 ? (marginOfSafetyUnits / rawExpectedVol) * 100 : 0
    }
  }

  return {
    contributionMarginPerUnit: cm,
    contributionMarginRatio: cmr * 100, // percentage e.g. 40 for 40%
    breakEvenUnitsExact: breakEvenExact,
    breakEvenUnitsRounded: breakEvenRounded,
    breakEvenRevenue,
    targetProfitUnitsExact,
    targetProfitUnitsRounded,
    targetProfitRevenue,
    expectedProfitOrLoss,
    marginOfSafetyUnits,
    marginOfSafetyRevenue,
    marginOfSafetyPercentage,
    isViable,
    isLossMakingPerUnit: isLossMaking,
    isValid: errors.length === 0,
    validationErrors: errors
  }
}
