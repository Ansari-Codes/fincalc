export interface CategoryInfo {
  id: string
  slug: string
  name: string
  path: string
  title: string
  intro: string
  description: string
  explanatorySections: {
    title: string
    content: string
  }[]
  relatedArticles: string[] // article slugs
  toolSlugs: string[]
}

export const categories: Record<string, CategoryInfo> = {
  investing: {
    id: 'investing',
    slug: 'investing',
    name: 'Investing',
    path: '/tools/investing/',
    title: 'Investing tools and calculators',
    intro: 'Understand purchase costs, estimate investment returns, and explore how compounding can affect long-term growth.',
    description: 'Tools to help analyze stock purchase lots, evaluate project return on investment, and model long-term compound growth.',
    explanatorySections: [
      {
        title: 'Average cost vs. current market price',
        content: 'Your weighted average purchase price reflects the exact dollar amount you paid per share over time. Comparing your average cost against current live quotes indicates whether an open position is currently at an unrealized gain or loss.'
      },
      {
        title: 'What ROI does and does not measure',
        content: 'Return on Investment (ROI) evaluates capital efficiency by comparing net profit against initial outlay. However, basic ROI does not account for the holding period length—an investment with a 20% return over 1 year is vastly different from a 20% return over 10 years.'
      },
      {
        title: 'How compounding works',
        content: 'Compounding generates earnings on both initial principal and accumulated past earnings. Over multi-year horizons, regular additions paired with reinvested returns accelerate capital accumulation exponentially.'
      }
    ],
    relatedArticles: [
      'how-to-calculate-average-stock-cost',
      'how-to-calculate-roi',
      'how-long-will-retirement-savings-last'
    ],
    toolSlugs: ['stock-average-calculator', 'roi-calculator', 'compound-interest-calculator']
  },
  'credit-debt': {
    id: 'credit-debt',
    slug: 'credit-debt',
    name: 'Credit & Debt',
    path: '/tools/credit-debt/',
    title: 'Credit and borrowing cost tools',
    intro: 'Estimate credit-card interest, calculate fixed-rate monthly loan payments, and optimize your multi-debt repayment plan.',
    description: 'Estimate card interest, compare fixed-rate amortization schedules, and evaluate debt snowball versus debt avalanche strategies.',
    explanatorySections: [
      {
        title: 'APR vs. periodic interest rate',
        content: 'The Annual Percentage Rate (APR) is annualized. Credit card and loan providers divide this rate by 12 (monthly periodic rate) or 365 (daily rate) to determine the interest charged during each repayment cycle.'
      },
      {
        title: 'How amortization distributes principal and interest',
        content: 'In standard fixed-rate loans, early payments are predominantly interest charges. As the principal balance diminishes over the loan term, an increasing portion of every monthly installment reduces the actual principal.'
      },
      {
        title: 'Accelerating debt freedom with the rollover method',
        content: 'Whether prioritizing smallest balances (Snowball) or highest interest rates (Avalanche), rolling payments from retired debts into remaining obligations accelerates debt elimination exponentially.'
      }
    ],
    relatedArticles: [
      'apr-vs-interest-rate',
      'how-loan-amortization-works',
      'debt-snowball-vs-debt-avalanche'
    ],
    toolSlugs: ['credit-card-apr-calculator', 'loan-payment-calculator', 'debt-payoff-planner']
  },
  'business-finance': {
    id: 'business-finance',
    slug: 'business-finance',
    name: 'Business Finance',
    path: '/tools/business-finance/',
    title: 'Business finance tools',
    intro: 'Estimate commission earnings, measure the return on a project, and determine business break-even sales volume.',
    description: 'Practical tools for salespeople, entrepreneurs, and managers to forecast commissions, evaluate project ROI, and calculate break-even units.',
    explanatorySections: [
      {
        title: 'Contribution margin and fixed overhead',
        content: 'Every product sold yields a unit contribution margin (Price minus Variable Cost). This margin pays down fixed business overhead until break-even is achieved, after which all further sales generate net operating profit.'
      },
      {
        title: 'Flat vs. tiered commission',
        content: 'In tiered structures with progressive marginal thresholds, accelerated commission rates apply only to revenue exceeding each milestone, motivating higher quotas without paying high rates retroactively on base sales.'
      },
      {
        title: 'Evaluating Margin of Safety',
        content: 'The margin of safety reveals the buffer between current sales performance and the break-even threshold, indicating how much sales volume can contract before operations suffer financial losses.'
      }
    ],
    relatedArticles: [
      'flat-vs-tiered-commission',
      'how-to-calculate-roi',
      'how-to-calculate-break-even-point'
    ],
    toolSlugs: ['commission-calculator', 'roi-calculator', 'break-even-calculator']
  },
  retirement: {
    id: 'retirement',
    slug: 'retirement',
    name: 'Retirement',
    path: '/tools/retirement/',
    title: 'Retirement planning tools',
    intro: 'Plan your target retirement savings goal, test savings longevity, and explore how inflation and compound returns shape your future nest egg.',
    description: 'Model savings longevity, determine required periodic contributions to reach your retirement target, and understand the impact of inflation.',
    explanatorySections: [
      {
        title: 'Accumulation vs. decumulation phases',
        content: 'During your working years (accumulation), compound interest works in your favor as regular contributions expand your portfolio. During retirement (decumulation), regular withdrawals draw down capital while remaining assets continue to generate returns.'
      },
      {
        title: 'Why retirement projections are estimates',
        content: 'All retirement tools apply assumed rates of return. In reality, market returns fluctuate unpredictably year to year, and market downturns early in retirement can significantly alter portfolio longevity.'
      },
      {
        title: 'Inflation and purchasing power',
        content: 'Even modest 2.5% to 3% annual inflation gradually erodes purchasing power over 20 to 30 years. Increasing withdrawal amounts annually to maintain living standards accelerates portfolio depletion.'
      },
      {
        title: 'Annual contribution step-ups',
        content: 'Starting with smaller contributions and stepping them up by a fixed percentage each year allows savers to align contributions with career earnings growth while still attaining ambitious retirement targets.'
      }
    ],
    relatedArticles: [
      'how-long-will-retirement-savings-last',
      'how-to-calculate-retirement-savings-goal'
    ],
    toolSlugs: ['how-long-will-my-money-last', 'compound-interest-calculator', 'retirement-savings-calculator']
  }
}
