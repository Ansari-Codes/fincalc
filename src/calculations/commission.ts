export type CommissionMode = 'percentage' | 'fixed' | 'tiered'

export interface CommissionTier {
  id: string
  threshold: number // Upper bound of this tier, or Infinity / 0 for no upper limit
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
  isValid: boolean
  validationErrors: string[]
  tierBreakdown?: TierBreakdownItem[]
}

/**
 * ============================================================================
 * Sales Commission Calculator
 * ============================================================================
 * 
 * Mathematical Models:
 * 1. Percentage Mode:
 *    Commission Earned = Sales Amount * (Rate / 100)
 *    Effective Rate = Commission Rate
 * 
 * 2. Fixed Fee Mode:
 *    Commission Earned = Number of Sales * Fixed Fee Per Sale
 * 
 * 3. Graduated / Marginal Tiered Mode:
 *    Sales are partitioned across consecutive, ascending tier brackets.
 *    For each tier i:
 *      Applicable Amount = min(Remaining Sales, Tier_Threshold_i - Tier_Threshold_{i-1})
 *      Tier Commission = Applicable Amount * (Tier_Rate_i / 100)
 *    Total Commission = Sum of Tier Commissions
 *    Effective Rate (%) = (Total Commission / Total Sales) * 100
 * 
 * Core Financial Assumptions:
 * - Marginal Rate Tiers: Higher rates apply EXCLUSIVELY to sales revenue falling
 *   within that specific tier bracket (identical to progressive tax brackets).
 *   This is distinct from "retroactive" tiers where reaching a milestone increases
 *   the commission rate on 100% of volume from dollar one.
 * - Gross vs. Net: Assumes entered sales volume is already adjusted according to the
 *   relevant employment contract (after or before refunds, shipping, or merchant fees).
 * - Taxes & Withholding: Calculations show gross pre-tax earnings before payroll withholding.
 * 
 * Numerical Precision & Boundary Rules:
 * - Negative sales amounts, negative deals, or negative commission rates are guarded.
 * - Tier thresholds are automatically sorted in ascending order to prevent bracket overlap.
 * - The final tier automatically captures all sales above the previous threshold.
 */
export function calculateCommission(input: CommissionInput): CommissionResult {
  const errors: string[] = []

  if (!input) {
    return {
      commissionEarned: 0,
      salesAmountUsed: 0,
      effectiveRate: 0,
      isValid: false,
      validationErrors: ['No calculation input provided.']
    }
  }

  // 1. Percentage mode
  if (input.mode === 'percentage') {
    const rawSales = typeof input.salesAmount === 'number' && isFinite(input.salesAmount) ? input.salesAmount : 0
    const rawRate = typeof input.commissionRate === 'number' && isFinite(input.commissionRate) ? input.commissionRate : 0

    if (rawSales < 0) {
      errors.push('Sales volume cannot be negative.')
    }
    if (rawRate < 0) {
      errors.push('Commission rate cannot be negative.')
    }

    const sales = Math.max(0, rawSales)
    const rate = Math.max(0, rawRate)
    const commissionEarned = sales * (rate / 100)
    const effectiveRate = sales > 0 ? (commissionEarned / sales) * 100 : rate

    return {
      commissionEarned,
      salesAmountUsed: sales,
      effectiveRate,
      isValid: errors.length === 0,
      validationErrors: errors
    }
  }

  // 2. Fixed fee mode
  if (input.mode === 'fixed') {
    const rawCount = typeof input.numberOfSales === 'number' && isFinite(input.numberOfSales) ? input.numberOfSales : 0
    const rawFee = typeof input.fixedPerSale === 'number' && isFinite(input.fixedPerSale) ? input.fixedPerSale : 0

    if (rawCount < 0) {
      errors.push('Number of sales cannot be negative.')
    }
    if (rawFee < 0) {
      errors.push('Fixed fee per sale cannot be negative.')
    }

    const salesCount = Math.max(0, Math.floor(rawCount))
    const fixedFee = Math.max(0, rawFee)
    const commissionEarned = salesCount * fixedFee

    return {
      commissionEarned,
      salesAmountUsed: 0,
      effectiveRate: 0,
      isValid: errors.length === 0,
      validationErrors: errors
    }
  }

  // 3. Tiered marginal mode
  const rawTieredSales = typeof input.tieredSalesAmount === 'number' && isFinite(input.tieredSalesAmount)
    ? input.tieredSalesAmount
    : 0

  if (rawTieredSales < 0) {
    errors.push('Total sales volume cannot be negative.')
  }

  const sales = Math.max(0, rawTieredSales)
  const rawTiers = input.tiers && Array.isArray(input.tiers) && input.tiers.length > 0 ? [...input.tiers] : []

  if (rawTiers.length === 0) {
    return {
      commissionEarned: 0,
      salesAmountUsed: sales,
      effectiveRate: 0,
      isValid: false,
      validationErrors: ['At least one commission tier is required.']
    }
  }

  // Normalize thresholds: replace 0, NaN, negative, or Infinity with proper values
  const normalizedTiers = rawTiers.map((t, idx) => {
    const rate = typeof t.rate === 'number' && isFinite(t.rate) ? Math.max(0, t.rate) : 0
    let threshold = typeof t.threshold === 'number' ? t.threshold : Infinity
    if (!isFinite(threshold) || threshold <= 0) {
      threshold = Infinity
    }
    if (t.rate < 0) {
      errors.push(`Tier ${idx + 1}: Rate cannot be negative.`)
    }
    return { ...t, threshold, rate }
  })

  // Sort tiers ascending by threshold (Infinity always places at the end)
  const sortedTiers = normalizedTiers.sort((a, b) => {
    if (!isFinite(a.threshold)) return 1
    if (!isFinite(b.threshold)) return -1
    return a.threshold - b.threshold
  })

  let commissionEarned = 0
  let remainingSales = sales
  let previousThreshold = 0
  const breakdown: TierBreakdownItem[] = []

  sortedTiers.forEach((tier, index) => {
    const isUncapped = !isFinite(tier.threshold)
    const tierCapacity = isUncapped ? Infinity : tier.threshold - previousThreshold

    if (tierCapacity > 0 && remainingSales > 0) {
      const applicableAmount = isUncapped ? remainingSales : Math.min(remainingSales, tierCapacity)
      const tierComm = applicableAmount * (tier.rate / 100)
      commissionEarned += tierComm
      remainingSales -= applicableAmount

      breakdown.push({
        tierNumber: index + 1,
        rangeLabel: isUncapped
          ? `Over $${previousThreshold.toLocaleString('en-US')}`
          : `$${previousThreshold.toLocaleString('en-US')} – $${tier.threshold.toLocaleString('en-US')}`,
        applicableAmount,
        rate: tier.rate,
        commission: tierComm
      })
    } else {
      breakdown.push({
        tierNumber: index + 1,
        rangeLabel: isUncapped
          ? `Over $${previousThreshold.toLocaleString('en-US')}`
          : `$${previousThreshold.toLocaleString('en-US')} – $${tier.threshold.toLocaleString('en-US')}`,
        applicableAmount: 0,
        rate: tier.rate,
        commission: 0
      })
    }

    if (isFinite(tier.threshold)) {
      previousThreshold = tier.threshold
    }
  })

  // Catch-all for residual sales if the user did not specify an uncapped tier
  if (remainingSales > 0) {
    const lastTier = sortedTiers[sortedTiers.length - 1]
    const fallbackRate = lastTier ? lastTier.rate : 0
    const extraComm = remainingSales * (fallbackRate / 100)
    commissionEarned += extraComm

    breakdown.push({
      tierNumber: sortedTiers.length + 1,
      rangeLabel: `Over $${previousThreshold.toLocaleString('en-US')}`,
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
    tierBreakdown: breakdown,
    isValid: errors.length === 0,
    validationErrors: errors
  }
}
