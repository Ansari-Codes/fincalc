export type CommissionMode = 'percentage' | 'fixed' | 'tiered'

export interface CommissionTier {
  id: string
  threshold: number // Upper bound of this tier
  rate: number // Percentage rate for this slice
}

export interface CommissionInput {
  mode: CommissionMode
  // Percentage mode
  salesAmount?: number
  commissionRate?: number
  // Fixed mode
  numberOfSales?: number
  fixedPerSale?: number
  // Tiered mode
  tieredSalesAmount?: number
  tiers?: CommissionTier[]
}

export interface TierBreakdownItem {
  tierNumber: number
  rangeLabel: string
  applicableAmount: number
  rate: number
  commission: number
}

export interface CommissionResult {
  commissionEarned: number
  salesAmountUsed: number
  effectiveRate: number
  tierBreakdown?: TierBreakdownItem[]
}

/**
 * Calculates sales commission based on selected structure.
 * Supports:
 * - Percentage: salesAmount * (rate / 100)
 * - Fixed: numberOfSales * fixedPerSale
 * - Tiered (marginal): rate applies only to the portion within each tier
 */
export function calculateCommission(input: CommissionInput): CommissionResult {
  if (input.mode === 'percentage') {
    const sales = Math.max(0, Number(input.salesAmount) || 0)
    const rate = Math.max(0, Number(input.commissionRate) || 0)
    const commissionEarned = sales * (rate / 100)
    const effectiveRate = sales > 0 ? (commissionEarned / sales) * 100 : rate

    return {
      commissionEarned,
      salesAmountUsed: sales,
      effectiveRate
    }
  }

  if (input.mode === 'fixed') {
    const salesCount = Math.max(0, Math.floor(Number(input.numberOfSales) || 0))
    const fixedFee = Math.max(0, Number(input.fixedPerSale) || 0)
    const commissionEarned = salesCount * fixedFee

    return {
      commissionEarned,
      salesAmountUsed: 0,
      effectiveRate: 0
    }
  }

  // Tiered mode
  const sales = Math.max(0, Number(input.tieredSalesAmount) || 0)
  const rawTiers = input.tiers && input.tiers.length > 0 ? [...input.tiers] : []

  // Sort tiers by threshold ascending
  const sortedTiers = rawTiers.sort((a, b) => a.threshold - b.threshold)

  let commissionEarned = 0
  let remainingSales = sales
  let previousThreshold = 0
  const breakdown: TierBreakdownItem[] = []

  sortedTiers.forEach((tier, index) => {
    const threshold = Number(tier.threshold) || 0
    const rate = Math.max(0, Number(tier.rate) || 0)
    const tierCapacity = threshold - previousThreshold

    if (tierCapacity > 0 && remainingSales > 0) {
      const applicableAmount = Math.min(remainingSales, tierCapacity)
      const tierComm = applicableAmount * (rate / 100)
      commissionEarned += tierComm
      remainingSales -= applicableAmount

      const isInfinite = !isFinite(threshold)
      breakdown.push({
        tierNumber: index + 1,
        rangeLabel: isInfinite
          ? `Over $${previousThreshold.toLocaleString()}`
          : `$${previousThreshold.toLocaleString()} - $${threshold.toLocaleString()}`,
        applicableAmount,
        rate,
        commission: tierComm
      })
    } else {
      breakdown.push({
        tierNumber: index + 1,
        rangeLabel: `$${previousThreshold.toLocaleString()} - $${threshold.toLocaleString()}`,
        applicableAmount: 0,
        rate,
        commission: 0
      })
    }

    previousThreshold = threshold
  })

  // If there are still remaining sales after all tiers, catch-all tier
  if (remainingSales > 0) {
    const lastTier = sortedTiers[sortedTiers.length - 1]
    const fallbackRate = lastTier ? Math.max(0, Number(lastTier.rate) || 0) : 0
    const extraComm = remainingSales * (fallbackRate / 100)
    commissionEarned += extraComm

    breakdown.push({
      tierNumber: sortedTiers.length + 1,
      rangeLabel: `Over $${previousThreshold.toLocaleString()}`,
      applicableAmount: remainingSales,
      rate: fallbackRate,
      commission: extraComm
    })
  }

  const effectiveRate = sales > 0 ? (commissionEarned / sales) * 100 : 0

  return {
    commissionEarned,
    salesAmountUsed: sales,
    effectiveRate,
    tierBreakdown: breakdown
  }
}
