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
  hypotheticalProjected?: {
    additionalShares: number
    additionalCost: number
    newTotalShares: number
    newTotalCost: number
    newWeightedAverageCost: number
  }
}

/**
 * Calculates weighted average cost per share.
 * Formula without fees: Sum(price * shares) / Sum(shares)
 * Formula with fees: (Sum(price * shares) + totalFees) / Sum(shares)
 */
export function calculateStockAverage(input: StockAverageInput): StockAverageResult {
  let totalShares = 0
  let totalCostBeforeFees = 0
  let totalFees = 0

  for (const row of input.purchases) {
    const shares = Number(row.shares) || 0
    const price = Number(row.price) || 0
    const fee = Number(row.fee) || 0

    if (shares > 0 && price >= 0) {
      totalShares += shares
      totalCostBeforeFees += price * shares
      if (fee > 0) {
        totalFees += fee
      }
    }
  }

  const totalCost = input.includeFees ? totalCostBeforeFees + totalFees : totalCostBeforeFees
  const weightedAverageCost = totalShares > 0 ? totalCost / totalShares : 0

  let hypotheticalProjected: StockAverageResult['hypotheticalProjected'] = undefined

  if (input.hypothetical) {
    const hypoShares = Number(input.hypothetical.shares) || 0
    const hypoPrice = Number(input.hypothetical.price) || 0
    const hypoFee = Number(input.hypothetical.fee) || 0

    if (hypoShares > 0 && hypoPrice >= 0) {
      const addCostBeforeFees = hypoPrice * hypoShares
      const addCost = input.includeFees ? addCostBeforeFees + (hypoFee > 0 ? hypoFee : 0) : addCostBeforeFees
      const newTotalShares = totalShares + hypoShares
      const newTotalCost = totalCost + addCost
      const newWeightedAverageCost = newTotalShares > 0 ? newTotalCost / newTotalShares : 0

      hypotheticalProjected = {
        additionalShares: hypoShares,
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
    hypotheticalProjected
  }
}
