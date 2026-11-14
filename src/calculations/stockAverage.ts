export interface StockPurchaseRow {
  id: string
  price: number
  shares: number
  fee?: number
}

export interface StockAverageInput {
  purchases: StockPurchaseRow[]
  includeFees: boolean
  hypothetical?: {
    price: number
    shares: number
    fee?: number
  }
}

export interface StockAverageResult {
  totalShares: number
  totalCostBeforeFees: number
  totalFees: number
  totalCost: number
  weightedAverageCost: number
  isValid: boolean
  validationErrors: string[]
  hypotheticalProjected?: {
    additionalShares: number
    additionalCost: number
    newTotalShares: number
    newTotalCost: number
    newWeightedAverageCost: number
  }
}

/**
 * ============================================================================
 * Stock Average Cost Calculator
 * ============================================================================
 * 
 * Mathematical Model:
 * 1. Quantity-Weighted Average Cost (without fees):
 *    Average Cost Per Share = Sum(Price_i * Shares_i) / Sum(Shares_i)
 * 
 * 2. Quantity-Weighted Average Cost (with fees included):
 *    Average Cost Per Share = (Sum(Price_i * Shares_i) + Sum(Fee_i)) / Sum(Shares_i)
 * 
 * Core Financial Assumptions:
 * - Each purchase lot represents an acquisition of identical equity units.
 * - Fractional shares (e.g., from Dividend Reinvestment Plans / DRIP) are fully supported.
 * - This tool computes the arithmetic weighted average price for portfolio tracking.
 * - TAX DISCLAIMER: This is an internal weighted average. It does NOT automatically
 *   substitute for IRS-mandated tax accounting methods (e.g., FIFO, LIFO, Specific
 *   Identification) unless permitted for specific asset classes (such as mutual funds).
 * 
 * Numerical Precision & Boundary Rules:
 * - Only lots with valid positive shares (> 0) and non-negative price (>= 0) contribute.
 * - Total shares equal to 0 safely produces an average of 0 (guards against 0/0 NaN).
 * - Finite number checks guard against Infinity and NaN inputs.
 */
export function calculateStockAverage(input: StockAverageInput): StockAverageResult {
  const errors: string[] = []

  if (!input || !Array.isArray(input.purchases) || input.purchases.length === 0) {
    return {
      totalShares: 0,
      totalCostBeforeFees: 0,
      totalFees: 0,
      totalCost: 0,
      weightedAverageCost: 0,
      isValid: false,
      validationErrors: ['No purchase lots provided.']
    }
  }

  let totalShares = 0
  let totalCostBeforeFees = 0
  let totalFees = 0
  let hasValidRow = false

  for (let i = 0; i < input.purchases.length; i++) {
    const row = input.purchases[i]
    if (!row) continue

    const price = typeof row.price === 'number' && isFinite(row.price) ? row.price : 0
    const shares = typeof row.shares === 'number' && isFinite(row.shares) ? row.shares : 0
    const fee = typeof row.fee === 'number' && isFinite(row.fee) ? Math.max(0, row.fee) : 0

    if (row.shares < 0) {
      errors.push(`Lot ${i + 1}: Shares cannot be negative.`)
    }
    if (row.price < 0) {
      errors.push(`Lot ${i + 1}: Price cannot be negative.`)
    }

    if (shares > 0 && price >= 0) {
      hasValidRow = true
      totalShares += shares
      totalCostBeforeFees += price * shares
      totalFees += fee
    }
  }

  const totalCost = input.includeFees ? totalCostBeforeFees + totalFees : totalCostBeforeFees
  const weightedAverageCost = totalShares > 0 ? totalCost / totalShares : 0

  let hypotheticalProjected: StockAverageResult['hypotheticalProjected'] = undefined

  if (input.hypothetical) {
    const hShares = typeof input.hypothetical.shares === 'number' && isFinite(input.hypothetical.shares)
      ? input.hypothetical.shares
      : 0
    const hPrice = typeof input.hypothetical.price === 'number' && isFinite(input.hypothetical.price)
      ? input.hypothetical.price
      : 0
    const hFee = typeof input.hypothetical.fee === 'number' && isFinite(input.hypothetical.fee)
      ? Math.max(0, input.hypothetical.fee)
      : 0

    if (hShares > 0 && hPrice >= 0) {
      const addCostBeforeFees = hPrice * hShares
      const addCost = input.includeFees ? addCostBeforeFees + hFee : addCostBeforeFees
      const newTotalShares = totalShares + hShares
      const newTotalCost = totalCost + addCost
      const newWeightedAverageCost = newTotalShares > 0 ? newTotalCost / newTotalShares : 0

      hypotheticalProjected = {
        additionalShares: hShares,
        additionalCost: addCost,
        newTotalShares,
        newTotalCost,
        newWeightedAverageCost
      }
    }
  }

  return {
    totalShares,
    totalCostBeforeFees,
    totalFees,
    totalCost,
    weightedAverageCost,
    hypotheticalProjected,
    isValid: hasValidRow && errors.length === 0,
    validationErrors: errors
  }
}
