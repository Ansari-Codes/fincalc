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
    intro: 'Estimate credit-card interest and understand how an annual percentage rate can affect borrowing costs.',
    description: 'Estimate card interest, test monthly payoff amounts, and understand the real financial impact of credit card APRs.',
    explanatorySections: [
      {
        title: 'APR vs. periodic interest rate',
        content: 'The Annual Percentage Rate (APR) is annualized. Credit card issuers divide this rate by 365 (daily rate) or 12 (monthly approximation) to determine the interest levied during each billing cycle.'
      },
      {
        title: 'Why actual card interest can differ from a simple estimate',
        content: 'Credit card issuers typically calculate finance charges using average daily balance methods across the exact calendar days of the cycle. Variable payment dates, grace periods, and compounding can introduce minor differences.'
      },
      {
        title: 'The impact of payments, fees, and new purchases',
        content: 'When you continue making purchases on a card carrying a balance, you forfeit the interest-free grace period. Higher monthly payments allocate more dollars directly toward reducing principal, dramatically cutting cumulative interest.'
      }
    ],
    relatedArticles: [
      'apr-vs-interest-rate'
    ],
    toolSlugs: ['credit-card-apr-calculator']
  },
  'business-finance': {
    id: 'business-finance',
    slug: 'business-finance',
    name: 'Business Finance',
    path: '/tools/business-finance/',
    title: 'Business finance tools',
    intro: 'Estimate commission earnings and measure the return on a project, campaign, or business expense.',
    description: 'Practical tools for salespeople, managers, and entrepreneurs to forecast commissions and quantify project returns.',
    explanatorySections: [
      {
        title: 'Percentage vs. fixed commission',
        content: 'Percentage commission scales directly with gross or net sales volume, rewarding larger deals. Fixed commission pays a predetermined dollar amount per transaction regardless of invoice total.'
      },
      {
        title: 'Flat vs. tiered commission',
        content: 'In tiered structures with progressive (marginal) thresholds, accelerated commission rates apply only to revenue exceeding each milestone, motivating higher quotas without paying high rates retroactively on base sales.'
      },
      {
        title: 'ROI assumptions and costs',
        content: 'When evaluating business investments, remember to capture overhead, setup costs, recurring vendor fees, and marketing spend alongside the primary initial capital expenditure.'
      }
    ],
    relatedArticles: [
      'flat-vs-tiered-commission',
      'how-to-calculate-roi'
    ],
    toolSlugs: ['commission-calculator', 'roi-calculator']
  },
  retirement: {
    id: 'retirement',
    slug: 'retirement',
    name: 'Retirement',
    path: '/tools/retirement/',
    title: 'Retirement planning tools',
    intro: 'Explore how savings, withdrawals, inflation, and assumed returns can affect the length of a retirement plan.',
    description: 'Model savings longevity, explore withdrawal rates, and understand how inflation and portfolio returns shape retirement security.',
    explanatorySections: [
      {
        title: 'Why retirement projections are estimates',
        content: 'All retirement tools apply assumed rates of return. In reality, market returns fluctuate unpredictably year to year, and market downturns early in retirement can significantly alter portfolio longevity.'
      },
      {
        title: 'Inflation and purchasing power',
        content: 'Even modest 2.5% to 3% annual inflation gradually erodes purchasing power over 20 to 30 years. Increasing withdrawal amounts annually to maintain living standards accelerates portfolio depletion.'
      },
      {
        title: 'How withdrawal assumptions change the result',
        content: 'Withdrawing capital at the beginning of each month versus the end of each month impacts compounding, because withdrawn funds do not participate in that period’s market growth.'
      },
      {
        title: 'Why real investment returns are not constant',
        content: 'A steady 6% annual return is an idealized model. Real portfolios experience bull and bear cycles, requiring prudent cash buffers and flexible spending plans.'
      }
    ],
    relatedArticles: [
      'how-long-will-retirement-savings-last'
    ],
    toolSlugs: ['how-long-will-my-money-last', 'compound-interest-calculator']
  }
}
