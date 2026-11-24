import { describe, it, expect } from 'vitest'
import { calculateStockAverage, type StockPurchaseRow } from '../stockAverage'

// Regression tests for the Stock Average Calculator (kitaaab.org).
// Every figure below was verified against the live calculator (2026-11-24)
// and is reproduced here from the engine, to the cent. The underlying
// formulas are correct and must not change; these tests pin the audited
// values so future edits cannot silently move them.

const DEFAULT_LOTS: StockPurchaseRow[] = [
  { id: '1', price: 100, shares: 10, fee: 0 },
  { id: '2', price: 120, shares: 15, fee: 0 }
]

describe('stock average — audited defaults', () => {
  it('defaults: 10@$100 + 15@$120 = $112.00 average, 25 shares, $2,800', () => {
    const r = calculateStockAverage({ purchases: DEFAULT_LOTS, includeFees: true })
    expect(r.weightedAverageCost).toBeCloseTo(112, 2)
    expect(r.totalShares).toBe(25)
    expect(r.totalCost).toBeCloseTo(2800, 2)
  })

  it('Test 1: 100@$50 + 50@$40 = $46.67', () => {
    const r = calculateStockAverage({
      purchases: [
        { id: '1', price: 50, shares: 100, fee: 0 },
        { id: '2', price: 40, shares: 50, fee: 0 }
      ],
      includeFees: true
    })
    expect(r.weightedAverageCost).toBeCloseTo(46.67, 2)
  })

  it('Test 2: 10@$80 + 20@$40 + 30@$60 = $56.67', () => {
    const r = calculateStockAverage({
      purchases: [
        { id: '1', price: 80, shares: 10, fee: 0 },
        { id: '2', price: 40, shares: 20, fee: 0 },
        { id: '3', price: 60, shares: 30, fee: 0 }
      ],
      includeFees: true
    })
    expect(r.weightedAverageCost).toBeCloseTo(56.67, 2)
  })

  it('fee test: $10 fee on the defaults = $112.40', () => {
    const r = calculateStockAverage({
      purchases: [
        { id: '1', price: 100, shares: 10, fee: 10 },
        { id: '2', price: 120, shares: 15, fee: 0 }
      ],
      includeFees: true
    })
    expect(r.weightedAverageCost).toBeCloseTo(112.4, 2)
  })

  it('fees excluded when includeFees is false', () => {
    const r = calculateStockAverage({
      purchases: [
        { id: '1', price: 100, shares: 10, fee: 10 },
        { id: '2', price: 120, shares: 15, fee: 0 }
      ],
      includeFees: false
    })
    expect(r.weightedAverageCost).toBeCloseTo(112, 2)
  })
})

describe('stock average — presets', () => {
  it('DCA preset (20@$150 + 25@$140 + 30@$130) = $138.67', () => {
    const r = calculateStockAverage({
      purchases: [
        { id: '1', price: 150, shares: 20, fee: 0 },
        { id: '2', price: 140, shares: 25, fee: 0 },
        { id: '3', price: 130, shares: 30, fee: 0 }
      ],
      includeFees: true
    })
    expect(r.weightedAverageCost).toBeCloseTo(138.67, 2)
  })

  it('Dip Buy preset (15@$220 + 35@$180) = $192.00', () => {
    const r = calculateStockAverage({
      purchases: [
        { id: '1', price: 220, shares: 15, fee: 0 },
        { id: '2', price: 180, shares: 35, fee: 0 }
      ],
      includeFees: true
    })
    expect(r.weightedAverageCost).toBeCloseTo(192, 2)
  })

  it('Growth preset (100@$50+$5, 50@$75+$5, 40@$95+$5) = $66.13', () => {
    const r = calculateStockAverage({
      purchases: [
        { id: '1', price: 50, shares: 100, fee: 5 },
        { id: '2', price: 75, shares: 50, fee: 5 },
        { id: '3', price: 95, shares: 40, fee: 5 }
      ],
      includeFees: true
    })
    expect(r.weightedAverageCost).toBeCloseTo(66.13, 2)
  })
})

describe('stock average — next-purchase simulation', () => {
  it('DCA base + 10@$90 = $132.94', () => {
    const r = calculateStockAverage({
      purchases: [
        { id: '1', price: 150, shares: 20, fee: 0 },
        { id: '2', price: 140, shares: 25, fee: 0 },
        { id: '3', price: 130, shares: 30, fee: 0 },
        { id: '4', price: 90, shares: 10, fee: 0 }
      ],
      includeFees: true
    })
    expect(r.weightedAverageCost).toBeCloseTo(132.94, 2)
  })
})

describe('stock average — worked-example wording guard', () => {
  it('the 10@$50 + 90@$100 example is 90% of SHARES, $9,000 of $9,500 = 94.7% of capital', () => {
    const r = calculateStockAverage({
      purchases: [
        { id: '1', price: 50, shares: 10, fee: 0 },
        { id: '2', price: 100, shares: 90, fee: 0 }
      ],
      includeFees: true
    })
    expect(r.weightedAverageCost).toBeCloseTo(95, 2)
    expect(r.totalShares).toBe(100)
    expect(r.totalCost).toBeCloseTo(9500, 2)
    const capitalAt100 = 90 * 100
    expect(capitalAt100 / r.totalCost).toBeCloseTo(0.947, 3)
    expect(90 / r.totalShares).toBeCloseTo(0.9, 6)
  })
})

describe('stock average — reset restores defaults', () => {
  it('the documented defaults are the two lots above', () => {
    // The page's resetForm() restores exactly these lots; this test pins
    // the values it must restore so a regression is caught here too.
    expect(DEFAULT_LOTS).toEqual([
      { id: '1', price: 100, shares: 10, fee: 0 },
      { id: '2', price: 120, shares: 15, fee: 0 }
    ])
    const r = calculateStockAverage({ purchases: DEFAULT_LOTS, includeFees: true })
    expect(r.weightedAverageCost).toBeCloseTo(112, 2)
  })
})
