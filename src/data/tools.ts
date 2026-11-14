export interface ToolItem {
  id: string
  slug: string
  path: string
  name: string
  title: string
  shortDescription: string
  fullDescription: string
  category: 'investing' | 'credit-debt' | 'business-finance' | 'retirement'
  categoryName: string
  icon: string
  formula: string
  assumptions: string[]
  faqs: { question: string; answer: string }[]
  relatedToolSlugs: string[]
  relatedArticleSlugs: string[]
}

export const tools: ToolItem[] = [
  {
    id: 'stock-average-calculator',
    slug: 'stock-average-calculator',
    path: '/stock-average-calculator/',
    name: 'Stock Average Calculator',
    title: 'Stock Average Calculator – Calculate Your Average Share Cost',
    shortDescription: 'Find the weighted average cost of multiple stock purchases.',
    fullDescription: 'Calculate the average cost of shares across multiple purchases. Add purchase prices, quantities, and optional transaction costs to see total shares and average cost per share.',
    category: 'investing',
    categoryName: 'Investing',
    icon: 'TrendingUp',
    formula: 'Weighted Average Cost = (Sum of Price × Shares + Fees) / Total Shares',
    assumptions: [
      'Calculates quantity-weighted arithmetic mean of purchase prices.',
      'Optional transaction fees are included in average share cost when the toggle is enabled.',
      'Does not imply or substitute for official tax-lot accounting (such as FIFO, LIFO, or Specific Identification) required by tax authorities.',
      'Calculations run client-side in your browser; no portfolio holdings or quantities are sent to a server.'
    ],
    faqs: [
      {
        question: 'How do I calculate my average stock price?',
        answer: 'Multiply the share count of each purchase lot by its purchase price to determine the total dollars spent on that lot. Add all lot costs together, add any trading fees if desired, and divide the sum by your total number of shares.'
      },
      {
        question: 'What happens when I buy more shares at a lower price?',
        answer: 'Buying additional shares at a price below your current average cost reduces your overall weighted average cost per share. This strategy is commonly known as dollar-cost averaging down.'
      },
      {
        question: 'Are transaction fees included in average cost?',
        answer: 'Yes, this calculator includes an option to incorporate broker commissions and exchange fees into your average cost per share, helping you evaluate your true break-even price.'
      },
      {
        question: 'Is average purchase cost the same as tax cost basis?',
        answer: 'Not necessarily. While average cost is standard for mutual funds in the US, individual stocks typically default to First-In, First-Out (FIFO) or specific share identification unless you have elected a specific accounting method recognized by the IRS.'
      }
    ],
    relatedToolSlugs: ['roi-calculator', 'compound-interest-calculator'],
    relatedArticleSlugs: ['how-to-calculate-average-stock-cost', 'how-to-calculate-roi']
  },
  {
    id: 'roi-calculator',
    slug: 'roi-calculator',
    path: '/roi-calculator/',
    name: 'ROI Calculator',
    title: 'ROI Calculator – Calculate Return on Investment',
    shortDescription: 'Measure the return on an investment or project.',
    fullDescription: 'Calculate return on investment using your initial cost and final value. Review net profit, ROI percentage, and the assumptions behind the result.',
    category: 'investing',
    categoryName: 'Investing',
    icon: 'Percent',
    formula: 'Net Profit = Final Value − Total Cost\nROI (%) = (Net Profit / Total Cost) × 100',
    assumptions: [
      'ROI reflects total percentage gain or loss relative to the initial cost basis.',
      'Does not account for holding duration or annualized compounding rate.',
      'Taxes, inflation, and opportunity costs are excluded from the basic formula.',
      'A negative result represents an investment loss.'
    ],
    faqs: [
      {
        question: 'What is ROI?',
        answer: 'Return on Investment (ROI) is a standard financial metric that measures the profitability or efficiency of an investment relative to its cost.'
      },
      {
        question: 'How do I calculate ROI?',
        answer: 'Subtract the total initial cost (including fees) from the total ending value to find net profit. Then divide net profit by the total initial cost and multiply by 100 to get a percentage.'
      },
      {
        question: 'Can ROI be negative?',
        answer: 'Yes. If the ending value of the investment is less than what you invested, net profit is negative, resulting in a negative ROI percentage (a loss).'
      },
      {
        question: 'Is ROI the same as annualized return?',
        answer: 'No. Standard ROI measures total cumulative return regardless of whether it took 6 months or 10 years. Annualized return (CAGR) measures the geometric yearly growth rate.'
      },
      {
        question: 'Should fees be included in ROI?',
        answer: 'Yes. Transaction fees, maintenance costs, and commissions reduce your net profit and increase your total cost basis, directly affecting real ROI.'
      }
    ],
    relatedToolSlugs: ['stock-average-calculator', 'commission-calculator'],
    relatedArticleSlugs: ['how-to-calculate-roi', 'how-to-calculate-average-stock-cost']
  },
  {
    id: 'commission-calculator',
    slug: 'commission-calculator',
    path: '/commission-calculator/',
    name: 'Commission Calculator',
    title: 'Commission Calculator – Estimate Sales Commission',
    shortDescription: 'Estimate earnings from a sale or commission structure.',
    fullDescription: 'Estimate commission from a sale using a percentage, fixed amount, or tiered rate. Review commission earned and total sales value.',
    category: 'business-finance',
    categoryName: 'Business Finance',
    icon: 'DollarSign',
    formula: 'Percentage: Sales Amount × (Rate / 100)\nTiered: Sum of (Tier Applicable Amount × Tier Rate)',
    assumptions: [
      'Tiered mode calculates marginal tiers where higher rates apply exclusively to dollars above each threshold.',
      'Does not account for payroll taxes, employer withholdings, or split splits unless entered manually.',
      'Assumes sales numbers are clean net or gross figures as specified by the user.'
    ],
    faqs: [
      {
        question: 'How is sales commission calculated?',
        answer: 'For a flat commission, multiply the transaction sales volume by the agreed percentage rate. For tiered commission, partition the sales volume across specified tiers and apply the corresponding rate to each portion.'
      },
      {
        question: 'What is the difference between flat and tiered commission?',
        answer: 'Flat commission applies a constant percentage across all sales. Tiered commission increases or decreases the rate as sales volume surpasses predefined milestones.'
      },
      {
        question: 'Does commission apply to gross or net sales?',
        answer: 'That depends on your employment or affiliate agreement. Some organizations pay on gross invoice revenue, while others deduct refunds, shipping, discounts, or cost of goods to calculate commission on net sales.'
      },
      {
        question: 'How do marginal commission tiers work?',
        answer: 'In a marginal tiered structure, you only earn the higher commission rate on the dollar amount that falls within that specific tier bracket, rather than retroactively increasing the commission on earlier dollars.'
      }
    ],
    relatedToolSlugs: ['roi-calculator', 'stock-average-calculator'],
    relatedArticleSlugs: ['flat-vs-tiered-commission', 'how-to-calculate-roi']
  },
  {
    id: 'credit-card-apr-calculator',
    slug: 'credit-card-apr-calculator',
    path: '/credit-card-apr-calculator/',
    name: 'Credit Card APR Calculator',
    title: 'Credit Card APR Calculator – Estimate Monthly Interest',
    shortDescription: 'Estimate interest costs from an APR and balance.',
    fullDescription: 'Estimate credit-card interest from your balance and APR. Explore how payments may affect interest costs and payoff time.',
    category: 'credit-debt',
    categoryName: 'Credit & Debt',
    icon: 'CreditCard',
    formula: 'Monthly Periodic Rate = APR / 12 / 100\nFirst Month Interest ≈ Current Balance × Monthly Periodic Rate',
    assumptions: [
      'Uses a monthly periodic rate approximation (APR / 12). Actual card issuers calculate interest using daily periodic rates (APR / 365) and average daily balance.',
      'Assumes no penalty APRs, cash advance rates, late fees, or deferred interest rules are triggered.',
      'Assumes regular on-time monthly payments.',
      'This calculation is an estimate for educational purposes and does not connect to your bank or card issuer.'
    ],
    faqs: [
      {
        question: 'What is APR on a credit card?',
        answer: 'Annual Percentage Rate (APR) represents the annualized interest rate charged on unpaid credit card balances carried past the monthly billing grace period.'
      },
      {
        question: 'How is monthly credit-card interest estimated?',
        answer: 'A standard monthly approximation divides the APR by 12 and multiplies that fraction by your balance. For instance, a 24% APR yields an approximate 2% monthly rate ($20 on a $1,000 balance).'
      },
      {
        question: 'Is APR divided by 12 or 365?',
        answer: 'Most US card issuers divide APR by 365 to establish a Daily Periodic Rate (DPR), calculating daily charges based on your Average Daily Balance across the month. Dividing by 12 gives a close monthly approximation.'
      },
      {
        question: 'Why can my statement interest differ from this estimate?',
        answer: 'Exact statement charges vary depending on the exact number of days in the statement billing cycle, the timing of mid-month payments, new purchase dates, and whether an interest-free grace period applies.'
      }
    ],
    relatedToolSlugs: ['compound-interest-calculator', 'roi-calculator'],
    relatedArticleSlugs: ['apr-vs-interest-rate']
  },
  {
    id: 'compound-interest-calculator',
    slug: 'compound-interest-calculator',
    path: '/compound-interest-calculator/',
    name: 'Compound Interest Calculator',
    title: 'Compound Interest Calculator – Estimate Growth Over Time',
    shortDescription: 'Explore how money may grow over time.',
    fullDescription: 'Estimate how an initial amount and regular contributions may grow with compound interest. Compare compounding frequencies and review the assumptions.',
    category: 'investing',
    categoryName: 'Investing',
    icon: 'LineChart',
    formula: 'Single Deposit: A = P × (1 + r/n)^(n×t)\nRecurring: Compound recurrence step model based on contribution frequency and timing.',
    assumptions: [
      'Assumes an unvarying rate of return throughout the entire projection period.',
      'Excludes taxes, administrative fees, trading expenses, and inflation unless explicitly noted.',
      'Contributions are assumed to arrive consistently according to the chosen schedule.',
      'This is an idealized mathematical projection, not a guarantee of future market performance.'
    ],
    faqs: [
      {
        question: 'What is compound interest?',
        answer: 'Compound interest is the interest calculated on the initial principal plus all the accumulated interest from previous periods. Over time, it accelerates portfolio growth exponentially.'
      },
      {
        question: 'How does compounding frequency change the result?',
        answer: 'The more frequently interest is compounded (e.g., daily vs. annually), the sooner accrued interest begins generating its own interest, resulting in a slightly higher effective annual yield.'
      },
      {
        question: 'What is the difference between simple and compound interest?',
        answer: 'Simple interest is calculated solely on the original principal amount. Compound interest is calculated on the principal plus past accumulated interest.'
      },
      {
        question: 'Are regular contributions included in compounding?',
        answer: 'Yes. When you enable regular monthly or annual contributions, each addition starts compounding from the moment it is contributed through the remainder of the timeline.'
      }
    ],
    relatedToolSlugs: ['how-long-will-my-money-last', 'stock-average-calculator', 'roi-calculator'],
    relatedArticleSlugs: ['how-long-will-retirement-savings-last', 'how-to-calculate-roi']
  },
  {
    id: 'how-long-will-my-money-last',
    slug: 'how-long-will-my-money-last',
    path: '/how-long-will-my-money-last/',
    name: 'Retirement Money Longevity Calculator',
    title: 'How Long Will My Money Last? Retirement Calculator',
    shortDescription: 'Estimate how long savings could last under your assumptions.',
    fullDescription: 'Estimate how long retirement savings could last based on your starting balance, withdrawals, inflation, and assumed annual return.',
    category: 'retirement',
    categoryName: 'Retirement',
    icon: 'Clock',
    formula: 'Monthly Simulation: Balance = (Balance − Withdrawal) × (1 + Monthly Effective Return)',
    assumptions: [
      'Applies a steady assumed rate of return across all projection years without market volatility.',
      'Does not capture sequence-of-returns risk, where market drops early in retirement accelerate capital depletion.',
      'Tax brackets, Required Minimum Distributions (RMDs), and healthcare shocks are excluded.',
      'Intended for educational scenario exploration, not individualized retirement or actuarial advice.'
    ],
    faqs: [
      {
        question: 'How do I estimate how long retirement savings will last?',
        answer: 'Balance your initial nest egg against monthly living expenditures, your assumed investment growth rate, and anticipated inflation. If withdrawals exceed investment growth, savings will eventually be drawn down.'
      },
      {
        question: 'How does inflation affect retirement withdrawals?',
        answer: 'Over a 25 to 30 year retirement, inflation raises everyday prices. If you adjust annual withdrawals upward to preserve your standard of living, your portfolio diminishes faster than in a static withdrawal model.'
      },
      {
        question: 'What rate of return should I enter?',
        answer: 'Most retirees model conservative assumptions (such as 4% to 6%) reflecting balanced portfolios of stocks, bonds, and cash, rather than aggressive equity growth rates.'
      },
      {
        question: 'Does this calculator predict investment performance?',
        answer: 'No. Real market returns fluctuate significantly from year to year. A steady average return does not simulate bear markets or the timing of market downturns.'
      }
    ],
    relatedToolSlugs: ['compound-interest-calculator', 'roi-calculator'],
    relatedArticleSlugs: ['how-long-will-retirement-savings-last']
  }
]
