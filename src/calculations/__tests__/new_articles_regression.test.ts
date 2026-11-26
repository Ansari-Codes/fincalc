import { describe, it, expect } from 'vitest'
import { calculateCreditCardApr, calculateDailyInterest } from '../creditCardApr'
import { calculateLoanPayment, buildDisplaySchedule } from '../loanPayment'
import { calculateStockAverage } from '../stockAverage'
import { articles } from '../../data/articles'

// Regression tests for the three new learn articles added 2026-11-26
// (how-to-calculate-apr-on-a-credit-card, how-to-calculate-a-loan-payment,
// how-to-calculate-average-stock-price-after-selling) plus the new
// "how to choose the order" section in debt-snowball-vs-debt-avalanche.
// Every figure below is reproduced here from the engine, to the cent.
// The articles must quote these exact values.

const r2 = (n: number) => Math.round(n * 100) / 100

describe('Article A — How to Calculate APR on a Credit Card', () => {
  const result = calculateCreditCardApr({ balance: 4000, apr: 24, monthlyPayment: 200 })

  it('daily periodic rate at 24% APR is 0.0658%/day', () => {
    expect(24 / 365).toBeCloseTo(0.065753, 6)
    expect((24 / 365).toFixed(4)).toBe('0.0658')
  })

  it('daily interest on a $4,000 balance at 24% APR is $2.63/day', () => {
    expect(r2(calculateDailyInterest(4000, 24))).toBe(2.63)
    expect(r2(result.dailyInterestCost)).toBe(2.63)
  })

  it('one month of interest on a steady $4,000 balance at 24% APR is $80.00', () => {
    expect(r2(result.firstMonthInterest)).toBe(80)
    expect(r2(4000 * (24 / 100 / 12))).toBe(80)
  })

  it('30-day daily-rate interest is $78.90 (vs $80.00 for the APR/12 shortcut)', () => {
    expect(r2(calculateDailyInterest(4000, 24) * 30)).toBe(78.9)
  })

  it('first $200 payment splits $80.00 interest / $120.00 principal', () => {
    expect(r2(result.firstMonthPrincipal)).toBe(120)
  })

  it('$4,000 at 24% APR paying $200/month pays off in 26 months with $1,159.49 interest', () => {
    expect(result.payoffMonths).toBe(26)
    expect(r2(result.totalInterestPaid)).toBe(1159.49)
    expect(r2(result.totalAmountPaid)).toBe(5159.49)
  })
})

describe('Article B — How to Calculate a Loan Payment', () => {
  it('$20,000 at 6% for 5 years by hand: (1.005)^60 = 1.34885 and M = $386.66', () => {
    const r = 0.06 / 12
    const n = 60
    const factor = Math.pow(1 + r, n)
    expect(factor.toFixed(5)).toBe('1.34885')
    expect(r * factor).toBeCloseTo(0.00674425, 8)
    expect(factor - 1).toBeCloseTo(0.34885, 5)
    expect(20000 * ((r * factor) / (factor - 1))).toBeCloseTo(386.656, 3)
    const loan = calculateLoanPayment({ principal: 20000, annualRate: 6, term: 5, termUnit: 'years' })
    expect(r2(loan.regularMonthlyPayment)).toBe(386.66)
    expect(r2(loan.totalInterest)).toBe(3199.36)
    expect(r2(loan.regularMonthlyPayment * 60)).toBe(23199.36)
  })

  it('$300,000 at 6.5% for 30 years is $1,896.20/month', () => {
    const loan = calculateLoanPayment({ principal: 300000, annualRate: 6.5, term: 30, termUnit: 'years' })
    expect(r2(loan.regularMonthlyPayment)).toBe(1896.2)
    expect(r2(loan.totalInterest)).toBe(382633.47)
  })

  it('first three display schedule rows match the article table', () => {
    const loan = calculateLoanPayment({ principal: 300000, annualRate: 6.5, term: 30, termUnit: 'years' })
    const rows = buildDisplaySchedule(loan.schedule).slice(0, 3)
    expect(rows[0]).toMatchObject({ paymentNumber: 1, startingBalance: 300000, interest: 1625, principalRepaid: 271.2, endingBalance: 299728.8 })
    expect(rows[1]).toMatchObject({ paymentNumber: 2, startingBalance: 299728.8, interest: 1623.53, principalRepaid: 272.67, endingBalance: 299456.13 })
    // Month 3 starting balance reads $299,456.12 (one cent below Month 2's
    // ending balance) because each row is rounded to cents independently.
    expect(rows[2]).toMatchObject({ paymentNumber: 3, startingBalance: 299456.12, interest: 1622.05, principalRepaid: 274.15, endingBalance: 299181.97 })
  })

  it('extra $250/month retires the mortgage in 262 months and saves $120,336.94', () => {
    const loan = calculateLoanPayment({ principal: 300000, annualRate: 6.5, term: 30, termUnit: 'years', extraMonthlyPayment: 250 })
    expect(loan.actualPayoffMonths).toBe(262)
    expect(loan.monthsSaved).toBe(98)
    expect(r2(loan.interestSaved)).toBe(120336.94)
    expect(r2(loan.totalInterest)).toBe(262296.53)
  })
})

describe('Article C — How to Calculate Average Stock Price After Selling', () => {
  const result = calculateStockAverage({
    purchases: [
      { id: 'lot-1', price: 50, shares: 100 },
      { id: 'lot-2', price: 40, shares: 50 }
    ],
    includeFees: false
  })

  it('buying 100 @ $50 + 50 @ $40 averages $46.67 on 150 shares costing $7,000', () => {
    expect(result.totalShares).toBe(150)
    expect(r2(result.totalCost)).toBe(7000)
    expect(r2(result.weightedAverageCost)).toBe(46.67)
  })

  it('after selling 50 shares, the remaining 100 still average $46.67 with a $4,666.67 basis', () => {
    const remainingShares = result.totalShares - 50
    expect(remainingShares).toBe(100)
    expect(r2(remainingShares * result.weightedAverageCost)).toBe(4666.67)
    // The sold shares carry their share of the basis with them; the split reconciles.
    expect(r2(50 * result.weightedAverageCost)).toBe(2333.33)
    expect(r2(4666.67 + 2333.33)).toBe(7000)
  })

  it('averaging the $55 sale price in as a purchase wrongly gives $48.75', () => {
    expect(r2((7000 + 50 * 55) / 200)).toBe(48.75)
  })

  it('selling 50 shares at $55 realises a $416.67 gain ($2,750 proceeds − $2,333.33 basis)', () => {
    expect(r2(50 * 55 - 50 * result.weightedAverageCost)).toBe(416.67)
    // A $5.00 sale fee cuts that gain to $411.67; the remaining average is untouched.
    expect(r2(50 * 55 - 50 * result.weightedAverageCost - 5)).toBe(411.67)
  })
})

describe('New article entries are well-formed in src/data/articles.ts', () => {
  const bySlug = (slug: string) => articles.find((a) => a.slug === slug)

  it('all three new articles exist with the right paths, tools and 6 FAQs', () => {
    const specs = [
      { slug: 'how-to-calculate-apr-on-a-credit-card', path: '/learn/how-to-calculate-apr-on-a-credit-card/', tool: 'credit-card-apr-calculator' },
      { slug: 'how-to-calculate-a-loan-payment', path: '/learn/how-to-calculate-a-loan-payment/', tool: 'loan-payment-calculator' },
      { slug: 'how-to-calculate-average-stock-price-after-selling', path: '/learn/how-to-calculate-average-stock-price-after-selling/', tool: 'stock-average-calculator' }
    ]
    for (const spec of specs) {
      const article = bySlug(spec.slug)
      expect(article).toBeDefined()
      expect(article!.id).toBe(spec.slug)
      expect(article!.path).toBe(spec.path)
      expect(article!.relatedToolSlug).toBe(spec.tool)
      expect(article!.faqs).toHaveLength(6)
      expect(article!.lastReviewed).toBe('November 2026')
      expect(article!.sections.length).toBeGreaterThanOrEqual(4)
      expect(article!.metaDescription.length).toBeLessThanOrEqual(155)
      expect(article!.title.length).toBeLessThanOrEqual(75)
    }
  })

  it('article A FAQ set covers the target queries', () => {
    const questions = bySlug('how-to-calculate-apr-on-a-credit-card')!.faqs.map((f) => f.question)
    expect(questions).toContain('How do I calculate APR on a credit card balance?')
    expect(questions).toContain('How do I find my APR?')
    expect(questions).toContain('How do I convert APR to a daily rate?')
  })

  it('article B FAQ set covers the target queries', () => {
    const questions = bySlug('how-to-calculate-a-loan-payment')!.faqs.map((f) => f.question)
    expect(questions).toContain('What is the formula to calculate a monthly loan payment?')
    expect(questions).toContain('How do I calculate a loan payment by hand?')
    expect(questions).toContain('What will my loan payment be on $20,000?')
  })

  it('article C FAQ set covers the target queries', () => {
    const questions = bySlug('how-to-calculate-average-stock-price-after-selling')!.faqs.map((f) => f.question)
    expect(questions).toContain('Does selling change my average stock price?')
    expect(questions).toContain('What is my average price on the shares I still own after selling some?')
  })

  it('debt-snowball-vs-debt-avalanche gained the "how to choose the order" section', () => {
    const article = bySlug('debt-snowball-vs-debt-avalanche')!
    const headings = article.sections.map((s) => s.heading)
    expect(headings).toContain('How to choose your Debt Snowball order')
    const section = article.sections.find((s) => s.heading === 'How to choose your Debt Snowball order')!
    expect(section.paragraphs.join(' ')).toContain('smallest balance first')
    expect(section.paragraphs.join(' ')).toContain('tie-breaker')
  })
})
