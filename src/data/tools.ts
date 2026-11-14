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
    relatedToolSlugs: ['stock-average-calculator', 'commission-calculator', 'break-even-calculator'],
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
    relatedToolSlugs: ['break-even-calculator', 'roi-calculator'],
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
    relatedToolSlugs: ['debt-payoff-planner', 'loan-payment-calculator'],
    relatedArticleSlugs: ['apr-vs-interest-rate', 'debt-snowball-vs-debt-avalanche']
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
    relatedToolSlugs: ['retirement-savings-calculator', 'how-long-will-my-money-last', 'stock-average-calculator'],
    relatedArticleSlugs: ['how-to-calculate-retirement-savings-goal', 'how-long-will-retirement-savings-last']
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
    relatedToolSlugs: ['retirement-savings-calculator', 'compound-interest-calculator'],
    relatedArticleSlugs: ['how-long-will-retirement-savings-last', 'how-to-calculate-retirement-savings-goal']
  },
  {
    id: 'retirement-savings-calculator',
    slug: 'retirement-savings-calculator',
    path: '/retirement-savings-calculator/',
    name: 'Retirement Savings Goal Calculator',
    title: 'Retirement Savings Goal Calculator – Estimate Required Contributions',
    shortDescription: 'Estimate the periodic contributions needed to reach your retirement target.',
    fullDescription: 'Calculate the monthly or annual contributions needed to achieve your retirement nest egg goal. Factor in existing savings, expected return, timing, and annual step-up contribution increases.',
    category: 'retirement',
    categoryName: 'Retirement',
    icon: 'Target',
    formula: 'Ordinary Annuity: PMT = [FV − PV(1+r)^n] × [r / ((1+r)^n − 1)]\nAnnuity Due: PMT_due = PMT / (1+r)\nZero Interest: PMT = (FV − PV) / n',
    assumptions: [
      'Applies a constant expected annual rate of return across all accumulation years.',
      'Periodic rate is calculated as Annual Return / 12 for monthly contributions, or Annual Return for yearly contributions.',
      'Excludes statutory IRS contribution caps (e.g. IRC 402(g) 401(k) limits or IRA maximums), employer match vesting rules, and tax deductions.',
      'All calculations are performed client-side in your browser for financial privacy.'
    ],
    faqs: [
      {
        question: 'How do I calculate how much I need to save for retirement each month?',
        answer: 'Project the future value of your current savings at your assumed return rate. Subtract that value from your target nest egg to determine the future shortfall. Then use the sinking fund annuity formula to determine the required periodic contribution.'
      },
      {
        question: 'What is the difference between beginning and end of period contributions?',
        answer: 'Contributing at the beginning of each period (annuity due) gives your money one extra compounding cycle to grow, resulting in slightly lower required contributions compared to end-of-period deposits.'
      },
      {
        question: 'What does the annual contribution increase percentage do?',
        answer: 'It models stepping up your contributions each year as your salary grows. Starting with lower contributions that step up annually helps you reach the target while keeping initial contributions manageable.'
      },
      {
        question: 'Does this calculator account for IRS contribution limits?',
        answer: 'No. This calculator computes mathematical requirements. In practice, federal tax-advantaged accounts have annual contribution limits (such as 401(k) and IRA limits).'
      }
    ],
    relatedToolSlugs: ['how-long-will-my-money-last', 'compound-interest-calculator'],
    relatedArticleSlugs: ['how-to-calculate-retirement-savings-goal', 'how-long-will-retirement-savings-last']
  },
  {
    id: 'loan-payment-calculator',
    slug: 'loan-payment-calculator',
    path: '/loan-payment-calculator/',
    name: 'Loan Payment Calculator',
    title: 'Loan Payment Calculator – Estimate Monthly Payments & Payoff Schedule',
    shortDescription: 'Calculate fixed-rate loan payments, interest costs, and amortization schedules.',
    fullDescription: 'Calculate fixed-rate monthly loan payments and generate complete month-by-month amortization schedules. Explore how additional monthly payments accelerate debt payoff and save interest.',
    category: 'credit-debt',
    categoryName: 'Credit & Debt',
    icon: 'CreditCard',
    formula: 'Monthly Payment: M = P × [r / (1 − (1+r)^−n)]\nZero Interest: M = P / n\nwhere r = APR / 12 / 100, n = total months',
    assumptions: [
      'Assumes a fixed interest rate and standard monthly compounding (APR / 12).',
      'Excludes loan origination fees, appraisal charges, closing costs, property taxes, insurance escrow, and prepayment penalties.',
      'Extra monthly payments are applied entirely toward the outstanding principal balance.',
      'Does not model variable interest rate adjustments or complex lender interest-day counting conventions (e.g. 365/360).'
    ],
    faqs: [
      {
        question: 'How is a fixed-rate loan payment calculated?',
        answer: 'The standard amortization formula M = P × [r / (1 − (1+r)^−n)] determines the fixed monthly installment that covers both monthly accrued interest and scheduled principal reduction.'
      },
      {
        question: 'How do extra payments affect my loan?',
        answer: 'Because monthly interest is calculated on your remaining balance, prepaying principal immediately lowers future interest charges, shortening your loan term and reducing total lifetime interest.'
      },
      {
        question: 'What is an amortization schedule?',
        answer: 'An amortization schedule is a complete table showing every payment over the loan lifespan, detailing how each payment is divided between interest and principal, alongside the declining balance.'
      },
      {
        question: 'Does this calculator support 0% APR loans?',
        answer: 'Yes. For 0% financing (such as interest-free automotive or promotional loans), the monthly payment simplifies to principal divided by total term months.'
      }
    ],
    relatedToolSlugs: ['debt-payoff-planner', 'credit-card-apr-calculator'],
    relatedArticleSlugs: ['how-loan-amortization-works', 'apr-vs-interest-rate']
  },
  {
    id: 'debt-payoff-planner',
    slug: 'debt-payoff-planner',
    path: '/debt-payoff-planner/',
    name: 'Debt Payoff Planner',
    title: 'Debt Payoff Planner – Compare Snowball vs. Avalanche Strategies',
    shortDescription: 'Compare debt snowball and debt avalanche repayment schedules.',
    fullDescription: 'Compare Debt Snowball (lowest balance first) and Debt Avalanche (highest APR first) payoff strategies. Simulate month-by-month debt elimination, calculate interest savings, and see your debt-free date.',
    category: 'credit-debt',
    categoryName: 'Credit & Debt',
    icon: 'TrendingDown',
    formula: 'Snowball: Smallest balance prioritized first\nAvalanche: Highest APR prioritized first\nRollover: Paid-off minimums roll into the next priority debt',
    assumptions: [
      'Assumes a monthly APR / 12 periodic interest calculation for each active debt.',
      'All active accounts must meet at least their minimum monthly payments.',
      'Extra monthly cashflow and rolled-over payments from paid-off debts are applied 100% to the top-priority account.',
      'Assumes no new charges, purchases, or balance transfer fees are added during the repayment simulation.'
    ],
    faqs: [
      {
        question: 'What is the difference between Debt Snowball and Debt Avalanche?',
        answer: 'The Debt Snowball prioritizes the smallest outstanding balance first, creating quick psychological wins. The Debt Avalanche prioritizes the highest interest rate (APR) first, saving you the most money in total interest.'
      },
      {
        question: 'What is debt rollover (the snowball effect)?',
        answer: 'When you eliminate a debt, you do not stop spending that money; you roll that account’s entire minimum payment into the next priority debt, accelerating subsequent payoffs exponentially.'
      },
      {
        question: 'Which repayment strategy is mathematically better?',
        answer: 'Mathematically, the Debt Avalanche always results in equal or lower total interest paid and an equal or faster payoff time because it eliminates high-cost compounding interest first.'
      },
      {
        question: 'What happens if my minimum payment does not cover interest?',
        answer: 'If the minimum payment is less than monthly accrued interest, the loan enters negative amortization and your balance grows. The calculator alerts you if any debt has an insufficient minimum payment.'
      }
    ],
    relatedToolSlugs: ['loan-payment-calculator', 'credit-card-apr-calculator'],
    relatedArticleSlugs: ['debt-snowball-vs-debt-avalanche', 'how-loan-amortization-works']
  },
  {
    id: 'break-even-calculator',
    slug: 'break-even-calculator',
    path: '/break-even-calculator/',
    name: 'Business Break-Even Calculator',
    title: 'Break-Even Calculator – Calculate Break-Even Units & Revenue',
    shortDescription: 'Calculate the sales volume or revenue required to cover business costs.',
    fullDescription: 'Determine the exact unit sales and dollar revenue your business needs to cover all fixed and variable costs. Explore contribution margins, target profit volumes, and margin of safety.',
    category: 'business-finance',
    categoryName: 'Business Finance',
    icon: 'PieChart',
    formula: 'Contribution Margin (CM) = Price − Variable Cost\nBreak-Even Units = Fixed Costs ÷ CM\nBreak-Even Revenue = Break-Even Units × Price',
    assumptions: [
      'Assumes constant selling price and constant variable cost per unit regardless of sales volume.',
      'All units produced are assumed to be sold (no change in finished inventory levels).',
      'Assumes fixed costs remain constant over the relevant operating range.',
      'Physical units are rounded upward (ceiling) to the next whole unit for operational feasibility.'
    ],
    faqs: [
      {
        question: 'What is a break-even point?',
        answer: 'The break-even point is the operational stage where total revenue equals total expenses, resulting in zero net profit and zero net loss. Any sales beyond this point generate operating profit.'
      },
      {
        question: 'What is contribution margin?',
        answer: 'Contribution margin is the selling price per unit minus the variable cost per unit. It represents the portion of sales revenue from each unit that contributes toward covering fixed overhead costs and generating profit.'
      },
      {
        question: 'What is the Margin of Safety?',
        answer: 'Margin of Safety is the difference between your expected (or actual) sales volume and your break-even volume. It shows how much sales can drop before the business begins operating at a financial loss.'
      },
      {
        question: 'What happens if variable cost exceeds selling price?',
        answer: 'If variable cost per unit is greater than selling price, contribution margin is negative. Every unit sold loses money, and the business can never reach break-even regardless of sales volume.'
      }
    ],
    relatedToolSlugs: ['commission-calculator', 'roi-calculator'],
    relatedArticleSlugs: ['how-to-calculate-break-even-point', 'how-to-calculate-roi']
  }
]
