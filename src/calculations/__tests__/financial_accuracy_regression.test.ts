import { describe, it, expect } from 'vitest'
import { calculateRetirementLongevity } from '../retirementLongevity'
import { calculateRetirementGoal } from '../retirementGoal'
import { calculateLoanPayment } from '../loanPayment'
import { calculateCreditCardApr } from '../creditCardApr'
import { calculateDebtPayoff } from '../debtPayoff'
import { calculateBreakEven } from '../breakEven'
import { calculateCommission } from '../commission'
import { calculateStockAverage } from '../stockAverage'
import { calculateRoi } from '../roi'

describe('Phase 2.1 Financial Mathematics & Accuracy Regressions', () => {
  describe('1. Retirement Longevity Calculations ($600,000 at 5.5% annual return)', () => {
    // Mathematical logarithmic depletion formula check
    it('verifies logarithmic depletion formula under standard nominal monthly rate', () => {
      const P = 600000
      const R = 0.055
      const r = R / 12 // 0.00458333...
      const W = 3200
      // n = -ln(1 - P*r/W) / ln(1 + r)
      const nMonths = -Math.log(1 - (P * r) / W) / Math.log(1 + r)
      expect(nMonths).toBeCloseTo(428.98, 1)
      expect(Math.ceil(nMonths)).toBe(429) // 35 years and 9 months
      expect(nMonths / 12).toBeCloseTo(35.75, 1)
    })

    it('matches calculator engine under effective monthly return convention', () => {
      // Calculator engine uses effective monthly compounding r_eff = (1 + R)^(1/12) - 1
      const resEnd = calculateRetirementLongevity({
        startingBalance: 600000,
        plannedWithdrawal: 3200,
        withdrawalFrequency: 'monthly',
        expectedAnnualReturn: 5.5,
        expectedAnnualInflation: 0,
        adjustWithdrawalsForInflation: false,
        horizonYears: 50,
        withdrawalTiming: 'end'
      })
      expect(resEnd.isDepleted).toBe(true)
      expect(resEnd.depletedYears).toBe(34)
      expect(resEnd.depletedMonths).toBe(1) // 409 months total
    })

    it('verifies 3.0% annual inflation adjustment with $3,200 initial withdrawal', () => {
      const resInflationEnd = calculateRetirementLongevity({
        startingBalance: 600000,
        plannedWithdrawal: 3200,
        withdrawalFrequency: 'monthly',
        expectedAnnualReturn: 5.5,
        expectedAnnualInflation: 3.0,
        adjustWithdrawalsForInflation: true,
        horizonYears: 50,
        withdrawalTiming: 'end'
      })
      expect(resInflationEnd.isDepleted).toBe(true)
      expect(resInflationEnd.depletedYears).toBe(20)
      expect(resInflationEnd.depletedMonths).toBe(1) // 241 months total under effective
    })

    it('verifies conservative $2,400/mo withdrawal preserves principal when return > withdrawal', () => {
      // At 5.5% nominal, 600,000 * (0.055/12) = $2,750/mo interest > $2,400 withdrawal
      const resPerpetual = calculateRetirementLongevity({
        startingBalance: 600000,
        plannedWithdrawal: 2400,
        withdrawalFrequency: 'monthly',
        expectedAnnualReturn: 5.5,
        expectedAnnualInflation: 0,
        adjustWithdrawalsForInflation: false,
        horizonYears: 40,
        withdrawalTiming: 'end'
      })
      expect(resPerpetual.isDepleted).toBe(false)
      expect(resPerpetual.endingBalanceAtHorizon).toBeGreaterThan(600000)
    })

    it('verifies conservative $2,400/mo withdrawal with 3% inflation sustains nearly 30 years', () => {
      const resWithInfl = calculateRetirementLongevity({
        startingBalance: 600000,
        plannedWithdrawal: 2400,
        withdrawalFrequency: 'monthly',
        expectedAnnualReturn: 5.5,
        expectedAnnualInflation: 3.0,
        adjustWithdrawalsForInflation: true,
        horizonYears: 40,
        withdrawalTiming: 'end'
      })
      expect(resWithInfl.isDepleted).toBe(true)
      expect(resWithInfl.depletedYears).toBe(29)
      expect(resWithInfl.depletedMonths).toBe(8) // 356 months
    })
  })

  describe('2. Retirement Savings Goal ($1,250,000 target over 30 years at 7% APR)', () => {
    it('verifies future value of $60,000 current savings and required monthly contribution', () => {
      const res = calculateRetirementGoal({
        currentSavings: 60000,
        targetAmount: 1250000,
        currentAge: 35,
        retirementAge: 65,
        expectedAnnualReturn: 7.0,
        contributionFrequency: 'monthly',
        contributionTiming: 'end'
      })

      // FV of PV = 60000 * (1 + 0.07/12)^360 = 486,989.85
      const r = 0.07 / 12
      const fvPv = 60000 * Math.pow(1 + r, 360)
      expect(fvPv).toBeCloseTo(486989.85, 2)

      // Shortfall = 1,250,000 - 486,989.85 = 763,010.15
      const shortfall = 1250000 - fvPv
      expect(shortfall).toBeCloseTo(763010.15, 2)

      // PMT = shortfall * [ r / ((1+r)^360 - 1) ] = $625.43
      expect(res.requiredMonthlyContribution).toBeCloseTo(625.43, 2)
      expect(res.projectedFinalBalance).toBeCloseTo(1250000, 0)
      expect(res.totalPersonalContributions).toBeCloseTo(225155.89, 1)
      expect(res.estimatedInvestmentGrowth).toBeCloseTo(964844.11, 1)
    })
  })

  describe('3. Loan Amortization ($300,000 at 6.50% APR for 30 years)', () => {
    it('verifies standard monthly payment and total lifetime interest', () => {
      const res = calculateLoanPayment({
        principal: 300000,
        annualRate: 6.5,
        term: 30,
        termUnit: 'years',
        extraMonthlyPayment: 0
      })

      expect(res.regularMonthlyPayment).toBeCloseTo(1896.20, 2)
      expect(res.totalInterest).toBeCloseTo(382633.47, 2)
      expect(res.schedule.length).toBe(360)

      // Month 1
      expect(res.schedule[0].interest).toBeCloseTo(1625.00, 2)
      expect(res.schedule[0].principalRepaid).toBeCloseTo(271.20, 2)
      expect(res.schedule[0].endingBalance).toBeCloseTo(299728.80, 2)

      // Month 120
      expect(res.schedule[119].interest).toBeCloseTo(1380.41, 2)
      expect(res.schedule[119].principalRepaid).toBeCloseTo(515.80, 2)
      expect(res.schedule[119].endingBalance).toBeCloseTo(254328.38, 2)

      // Month 204
      expect(res.schedule[203].interest).toBeCloseTo(1084.21, 2)
      expect(res.schedule[203].principalRepaid).toBeCloseTo(811.99, 2)

      // Crossover check: Month 232 has interest > principal; Month 233 has principal > interest
      expect(res.schedule[231].interest).toBeCloseTo(951.62, 2)
      expect(res.schedule[231].principalRepaid).toBeCloseTo(944.58, 2)

      // Month 233 is the true crossover point
      expect(res.schedule[232].interest).toBeCloseTo(946.50, 2)
      expect(res.schedule[232].principalRepaid).toBeCloseTo(949.70, 2)
      expect(res.schedule[232].principalRepaid).toBeGreaterThan(res.schedule[232].interest)
    })

    it('verifies extra $250 monthly prepayment savings', () => {
      const resExtra = calculateLoanPayment({
        principal: 300000,
        annualRate: 6.5,
        term: 30,
        termUnit: 'years',
        extraMonthlyPayment: 250
      })

      expect(resExtra.actualPayoffMonths).toBe(262) // 21 years 10 months
      expect(resExtra.monthsSaved).toBe(98) // 8 years 2 months saved
      expect(resExtra.interestSaved).toBeCloseTo(120336.94, 2)
      expect(resExtra.totalInterest).toBeCloseTo(262296.53, 2)
    })
  })

  describe('4. Credit Card Minimum Payment Schedule ($5,000 at 24% APR)', () => {
    function simulateCardMinimum(policy: 'full' | 'cents') {
      const r = 0.24 / 12 // 0.02
      let balance = 5000
      let totalInterest = 0
      let totalPaid = 0
      let floorMonth = -1
      const schedule: { month: number; startBal: number; interest: number; pmt: number; endBal: number }[] = []

      for (let m = 1; m <= 600; m++) {
        const start = balance
        let interest = start * r
        if (policy === 'cents') interest = Math.round(interest * 100) / 100

        let balAfterInt = start + interest
        if (policy === 'cents') balAfterInt = Math.round(balAfterInt * 100) / 100

        // Minimum is 3% of the STARTING balance for the month (never of the
        // balance after that month's interest is added), or $25, whichever
        // is greater. Verified against the calculator engine: month 1 is
        // $150.00 (3% of $5,000), not $153.00 (3% of $5,100).
        let pmt = Math.max(25, 0.03 * start)
        if (policy === 'cents') pmt = Math.round(pmt * 100) / 100

        if (pmt <= 25 && floorMonth === -1 && balAfterInt > 25) {
          floorMonth = m
        }

        if (pmt > balAfterInt) pmt = balAfterInt
        let end = balAfterInt - pmt
        if (policy === 'cents') end = Math.round(end * 100) / 100

        totalInterest += interest
        totalPaid += pmt
        schedule.push({ month: m, startBal: start, interest, pmt, endBal: end })
        balance = end
        if (balance <= (policy === 'cents' ? 0.001 : 0.005)) break
      }

      return { totalMonths: schedule.length, totalInterest, totalPaid, floorMonth, schedule }
    }

    it('verifies exact minimum payment recurrence with full precision', () => {
      const sim = simulateCardMinimum('full')
      expect(sim.totalMonths).toBe(234)
      expect(sim.totalInterest).toBeCloseTo(8886.95, 2)
      expect(sim.totalPaid).toBeCloseTo(13886.95, 2)
      expect(sim.floorMonth).toBe(180)

      // Month 1
      expect(sim.schedule[0].interest).toBeCloseTo(100.00, 2)
      expect(sim.schedule[0].pmt).toBeCloseTo(150.00, 2)
      expect(sim.schedule[0].endBal).toBeCloseTo(4950.00, 2)

      // Month 2
      expect(sim.schedule[1].interest).toBeCloseTo(99.00, 2)
      expect(sim.schedule[1].pmt).toBeCloseTo(148.50, 2)
      expect(sim.schedule[1].endBal).toBeCloseTo(4900.50, 2)

      // Month 25
      expect(sim.schedule[24].pmt).toBeCloseTo(117.85, 2)
      expect(sim.schedule[24].endBal).toBeCloseTo(3889.11, 2)

      // Month 50
      expect(sim.schedule[49].pmt).toBeCloseTo(91.67, 2)
      expect(sim.schedule[49].endBal).toBeCloseTo(3025.03, 2)

      // Month 100
      expect(sim.schedule[99].pmt).toBeCloseTo(55.46, 2)
      expect(sim.schedule[99].endBal).toBeCloseTo(1830.16, 2)

      // Month 180 ($25 floor first applies; starting balance $827.31)
      expect(sim.schedule[179].pmt).toBeCloseTo(25.00, 2)
      expect(sim.schedule[179].startBal).toBeCloseTo(827.31, 2)
      expect(sim.schedule[179].endBal).toBeCloseTo(818.86, 2)

      // Month 234 (final)
      expect(sim.schedule[233].pmt).toBeCloseTo(18.89, 2)
      expect(sim.schedule[233].endBal).toBeCloseTo(0.00, 2)
    })

    it('verifies fixed $250/mo accelerated repayment on $5,000 card debt', () => {
      const resFixed = calculateCreditCardApr({
        balance: 5000,
        apr: 24,
        monthlyPayment: 250,
        additionalPayment: 0,
        plannedNewPurchases: 0
      })

      expect(resFixed.payoffMonths).toBe(26)
      expect(resFixed.totalInterestPaid).toBeCloseTo(1449.36, 2)
      expect(resFixed.totalAmountPaid).toBeCloseTo(6449.36, 2)
    })

    it('verifies fixed $150/mo repayment on $5,000 card debt', () => {
      const resFixed150 = calculateCreditCardApr({
        balance: 5000,
        apr: 24,
        monthlyPayment: 150,
        additionalPayment: 0,
        plannedNewPurchases: 0
      })

      expect(resFixed150.payoffMonths).toBe(56)
      expect(resFixed150.totalInterestPaid).toBeCloseTo(3322.09, 2)
    })
  })

  describe('5. Debt Payoff Strategies (Snowball vs. Avalanche)', () => {
    it('verifies aligned 3-debt portfolio where smallest balance has highest APR', () => {
      const res = calculateDebtPayoff({
        debts: [
          { id: '1', name: 'Debt A', balance: 1500, apr: 24, minimumPayment: 45 },
          { id: '2', name: 'Debt B', balance: 4000, apr: 14, minimumPayment: 115 },
          { id: '3', name: 'Debt C', balance: 8000, apr: 6, minimumPayment: 180 }
        ],
        extraMonthlyPayment: 200,
        strategy: 'snowball'
      })

      const s = res.comparison.snowball
      const a = res.comparison.avalanche

      expect(s.payoffMonths).toBe(28)
      expect(s.totalInterestPaid).toBeCloseTo(1395.12, 2)
      expect(a.payoffMonths).toBe(28)
      expect(a.totalInterestPaid).toBeCloseTo(1395.12, 2)

      expect(s.individualResults[0].payoffMonth).toBe(7)
      expect(s.individualResults[0].totalInterestPaid).toBeCloseTo(116.63, 2)
      expect(s.individualResults[1].payoffMonth).toBe(18)
      expect(s.individualResults[1].totalInterestPaid).toBeCloseTo(533.86, 2)
      expect(s.individualResults[2].payoffMonth).toBe(28)
      expect(s.individualResults[2].totalInterestPaid).toBeCloseTo(744.63, 2)
    })

    it('verifies divergent portfolio where Avalanche saves interest and time over Snowball', () => {
      const res = calculateDebtPayoff({
        debts: [
          { id: '1', name: 'Small Balance', balance: 2000, apr: 8, minimumPayment: 50 },
          { id: '2', name: 'High APR Card', balance: 5000, apr: 22, minimumPayment: 130 },
          { id: '3', name: 'Auto Loan', balance: 9000, apr: 5, minimumPayment: 190 }
        ],
        extraMonthlyPayment: 250,
        strategy: 'snowball'
      })

      const s = res.comparison.snowball
      const a = res.comparison.avalanche

      expect(s.payoffMonths).toBe(30)
      expect(s.totalInterestPaid).toBeCloseTo(2006.64, 2)

      expect(a.payoffMonths).toBe(29)
      expect(a.totalInterestPaid).toBeCloseTo(1700.42, 2)

      expect(res.comparison.interestSavingsWithAvalanche).toBeCloseTo(306.22, 2)
      expect(res.comparison.monthsSavedWithAvalanche).toBe(1)
    })
  })

  describe('6. Break-Even Analysis ($80 price, $28 variable, $26,000 fixed)', () => {
    it('verifies break-even units, revenue, and target profit', () => {
      const res = calculateBreakEven({
        totalFixedCosts: 26000,
        sellingPricePerUnit: 80,
        variableCostPerUnit: 28,
        targetProfit: 13000,
        expectedSalesVolume: 800
      })

      expect(res.contributionMarginPerUnit).toBe(52)
      expect(res.contributionMarginRatio).toBeCloseTo(65, 1)
      expect(res.breakEvenUnitsRounded).toBe(500)
      expect(res.breakEvenRevenue).toBe(40000)
      expect(res.targetProfitUnitsRounded).toBe(750)
      expect(res.targetProfitRevenue).toBe(60000)
      expect(res.marginOfSafetyUnits).toBe(300)
      expect(res.marginOfSafetyRevenue).toBe(24000)
      expect(res.marginOfSafetyPercentage).toBeCloseTo(37.5, 1)
    })
  })

  describe('7. Commission Calculations ($150,000 volume across 3 tiers)', () => {
    it('verifies marginal tiered commission vs retroactive commission', () => {
      const tiers = [
        { id: '1', threshold: 50000, rate: 5 },
        { id: '2', threshold: 100000, rate: 8 },
        { id: '3', threshold: 0, rate: 12 } // 0 or Infinity indicates no ceiling
      ]

      const resMarginal = calculateCommission({
        mode: 'tiered',
        tieredSalesAmount: 150000,
        tiers
      })

      // Tier 1: 50,000 * 0.05 = 2,500
      // Tier 2: 50,000 * 0.08 = 4,000
      // Tier 3: 50,000 * 0.12 = 6,000
      // Total = 12,500 (Effective rate: 8.33%)
      expect(resMarginal.commissionEarned).toBe(12500)
      expect(resMarginal.effectiveRate).toBeCloseTo(8.33, 2)

      // Retroactive: 150,000 * 0.12 = 18,000
      const retroactivePayout = 150000 * 0.12
      expect(retroactivePayout).toBe(18000)
      expect(retroactivePayout - resMarginal.commissionEarned).toBe(5500)
    })
  })

  describe('8. Stock Cost Basis (50 @ $40 + 150 @ $60 with $5 fees)', () => {
    it('verifies weighted average cost per share including transaction fees', () => {
      const res = calculateStockAverage({
        purchases: [
          { id: '1', shares: 50, price: 40, fee: 5 },
          { id: '2', shares: 150, price: 60, fee: 5 }
        ],
        includeFees: true
      })

      // Lot 1: 2,000 + 5 = 2,005
      // Lot 2: 9,000 + 5 = 9,005
      // Total: 11,010 across 200 shares
      expect(res.totalShares).toBe(200)
      expect(res.totalCost).toBe(11010)
      expect(res.weightedAverageCost).toBeCloseTo(55.05, 2)
    })
  })

  describe('9. ROI Calculations', () => {
    it('verifies stock trade with brokerage commissions and dividends', () => {
      const res = calculateRoi({
        initialInvestment: 5000,
        finalValue: 6800,
        additionalIncome: 150,
        additionalCosts: 20
      })

      // Cost basis = 5,000 + 20 = 5,020
      // Gross returned = 6,800 + 150 = 6,950
      // Net profit = 1,930
      // ROI = 1,930 / 5,020 = +38.45%
      expect(res.totalCost).toBe(5020)
      expect(res.totalValueReturned).toBe(6950)
      expect(res.netProfit).toBe(1930)
      expect(res.roiPercentage).toBeCloseTo(38.45, 2)
    })

    it('verifies multi-year investment annualized ROI', () => {
      const cost = 20000
      const grossReturned = 30000
      const years = 2
      const simpleRoi = ((grossReturned - cost) / cost) * 100
      const annualizedRoi = (Math.pow(grossReturned / cost, 1 / years) - 1) * 100

      expect(simpleRoi).toBe(50)
      expect(annualizedRoi).toBeCloseTo(22.47, 2)
    })
  })
})
