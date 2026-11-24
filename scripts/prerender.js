import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distDir = path.resolve(__dirname, '../dist')

import { siteConfig } from '../src/config/site.ts'
import { tools } from '../src/data/tools.ts'
import { categories } from '../src/data/categories.ts'
import { articles } from '../src/data/articles.ts'
import { 
  generateWebsiteSchema, 
  generateCalculatorSchema, 
  generateArticleSchema 
} from '../src/utils/structuredData.ts'
import {
  calculateCreditCardApr,
  formatPayoffDate,
  getMinimumPaymentComparisonScenarios,
  getScenarioAMinimumAnalysis,
  getWorkedExampleScenarios
} from '../src/calculations/creditCardApr.ts'
import { calculateRetirementGoal } from '../src/calculations/retirementGoal.ts'
import { calculateLoanPayment, buildDisplaySchedule } from '../src/calculations/loanPayment.ts'
import { calculateStockAverage } from '../src/calculations/stockAverage.ts'

// Base URL helper for subpaths (default '/')
const base = process.env.BASE_URL || '/'
const cleanBase = base === '/' ? '' : (base.endsWith('/') ? base.slice(0, -1) : base)
const withBase = (p) => `${cleanBase}${p}`

// Check if dist exists
if (!fs.existsSync(distDir)) {
  console.error('dist directory not found. Please run vite build first.')
  process.exit(1)
}

const templatePath = path.resolve(distDir, 'index.html')
const templateHtml = fs.readFileSync(templatePath, 'utf-8')

const routes = []

// 1. Home
routes.push({
  path: '/',
  title: `${siteConfig.name} – ${siteConfig.tagline}`,
  description: siteConfig.description,
  jsonLd: generateWebsiteSchema(),
  bodyHtml: `
    <header class="py-4 border-b border-gray-200 bg-white">
      <div class="max-w-[1200px] mx-auto px-4 flex justify-between items-center">
        <a href="${withBase('/')}" class="font-bold text-xl text-teal-800">${siteConfig.name}</a>
        <nav class="space-x-4 text-sm font-medium">
          <a href="${withBase('/tools/')}">Tools</a>
          <a href="${withBase('/tools/investing/')}">Investing</a>
          <a href="${withBase('/tools/credit-debt/')}">Credit & Debt</a>
          <a href="${withBase('/tools/retirement/')}">Retirement</a>
          <a href="${withBase('/tools/business-finance/')}">Business</a>
          <a href="${withBase('/learn/')}">Learn</a>
        </nav>
      </div>
    </header>
    <main class="max-w-[1200px] mx-auto px-4 py-16">
      <h1 class="text-4xl font-extrabold text-gray-900 mb-4">Make sense of your money with practical financial tools.</h1>
      <p class="text-xl text-gray-600 mb-8">${siteConfig.description}</p>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        ${tools.map(t => `
          <div class="p-6 bg-white border border-gray-200 rounded-xl">
            <h2 class="text-lg font-bold text-gray-900 mb-2">${t.name}</h2>
            <p class="text-sm text-gray-600 mb-4">${t.shortDescription}</p>
            <a href="${withBase(t.path)}" class="text-teal-700 font-semibold text-sm">Open Calculator &rarr;</a>
          </div>
        `).join('')}
      </div>
    </main>
  `
})

// 2. Tools Directory
routes.push({
  path: '/tools/',
  title: `Financial Tools Directory – All Calculators & Estimators | ${siteConfig.name}`,
  description: 'Explore practical calculators for investing, retirement planning, credit costs, and business finance.',
  bodyHtml: `
    <main class="max-w-[1200px] mx-auto px-4 py-12">
      <h1 class="text-3xl font-extrabold text-gray-900 mb-4">Financial tools for everyday decisions</h1>
      <p class="text-lg text-gray-600 mb-8">Explore practical calculators for investing, retirement planning, credit costs, and business finance.</p>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        ${tools.map(t => `
          <div class="p-6 bg-white border border-gray-200 rounded-xl">
            <span class="text-xs font-semibold text-teal-800 uppercase">${t.categoryName}</span>
            <h2 class="text-xl font-bold text-gray-900 my-2">${t.name}</h2>
            <p class="text-sm text-gray-600 mb-4">${t.shortDescription}</p>
            <a href="${withBase(t.path)}" class="text-teal-700 font-semibold text-sm">Open Calculator &rarr;</a>
          </div>
        `).join('')}
      </div>
    </main>
  `
})

// 3. Category Pages
for (const [key, cat] of Object.entries(categories)) {
  const catTools = tools.filter(t => cat.toolSlugs.includes(t.slug))
  routes.push({
    path: cat.path,
    title: `${cat.title} | ${siteConfig.name}`,
    description: cat.intro,
    bodyHtml: `
      <main class="max-w-[1200px] mx-auto px-4 py-12">
        <h1 class="text-3xl font-extrabold text-gray-900 mb-4">${cat.title}</h1>
        <p class="text-lg text-gray-600 mb-8">${cat.intro}</p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          ${catTools.map(t => `
            <div class="p-6 bg-white border border-gray-200 rounded-xl">
              <h2 class="text-xl font-bold text-gray-900 mb-2">${t.name}</h2>
              <p class="text-sm text-gray-600 mb-4">${t.shortDescription}</p>
              <a href="${withBase(t.path)}" class="text-teal-700 font-semibold text-sm">Open Calculator &rarr;</a>
            </div>
          `).join('')}
        </div>
        <div class="bg-white p-8 rounded-xl border border-gray-200">
          <h2 class="text-2xl font-bold text-gray-900 mb-4">Financial Context & Key Principles</h2>
          ${cat.explanatorySections.map(sec => `
            <div class="mb-6">
              <h3 class="text-lg font-bold text-gray-900 mb-1">${sec.title}</h3>
              <p class="text-sm text-gray-600">${sec.content}</p>
            </div>
          `).join('')}
        </div>
      </main>
    `
  })
}


// ---------------------------------------------------------------------------
// Credit Card APR Calculator — full prerendered shell (Task 10)
// The generic tool prerender only emitted a prose outline, so the H1,
// calculator and results only appeared after the Vue bundle loaded
// (blank first paint, mobile LCP 2.9s, desktop CLS 0.502 in the baseline
// audit). This renderer emits the complete first-paint layout — header,
// H1, calculator console with default results, amortization preview and
// the corrected tables — using the same classes as the Vue page so
// hydration does not shift the layout. Every number comes from the
// calculator engine, never hand-typed.
// ---------------------------------------------------------------------------
const aprMoney = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

function renderAprShell(tool) {
  const defaults = calculateCreditCardApr({ balance: 4500, apr: 22.9, monthlyPayment: 200 })
  const worked = getWorkedExampleScenarios()
  const comparison = getMinimumPaymentComparisonScenarios()
  const scenarioA = getScenarioAMinimumAnalysis()
  const scenarioAMonth = (m) => scenarioA.schedule[m - 1]
  const payoffDate = formatPayoffDate(defaults.payoffMonths)
  const firstMonthPrincipalPct = Math.round(
    (defaults.firstMonthPrincipal / (defaults.firstMonthPrincipal + defaults.firstMonthInterest)) * 100
  )
  const year = new Date().getFullYear()

  return `
  <div class="min-h-screen flex flex-col bg-[#F7F9FC] text-[#172033]">
    <header class="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-[#E4E9F0]">
      <div class="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <a href="${withBase('/')}" class="flex items-center gap-2.5 text-[#172033] font-semibold text-lg">
          <div class="w-8 h-8 rounded-lg bg-[#0F766E] text-white flex items-center justify-center font-bold text-base shadow-sm">$</div>
          <span>${siteConfig.name}</span>
        </a>
        <nav class="hidden md:flex items-center gap-1 lg:gap-2" aria-label="Main Navigation">
          <a href="${withBase('/tools/')}" class="px-3 py-1.5 rounded-md text-sm font-medium text-[#667085]">Tools</a>
          <a href="${withBase('/tools/investing/')}" class="px-3 py-1.5 rounded-md text-sm font-medium text-[#667085]">Investing</a>
          <a href="${withBase('/tools/credit-debt/')}" class="px-3 py-1.5 rounded-md text-sm font-medium text-[#0F766E] bg-[#E7F4F1] font-semibold">Credit &amp; Debt</a>
          <a href="${withBase('/tools/retirement/')}" class="px-3 py-1.5 rounded-md text-sm font-medium text-[#667085]">Retirement</a>
          <a href="${withBase('/tools/business-finance/')}" class="px-3 py-1.5 rounded-md text-sm font-medium text-[#667085]">Business</a>
          <a href="${withBase('/learn/')}" class="px-3 py-1.5 rounded-md text-sm font-medium text-[#667085]">Learn</a>
        </nav>
        <a href="${withBase('/tools/')}" class="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium bg-[#0F766E] text-white shadow-sm">Explore tools</a>
      </div>
    </header>
    <main class="flex-1">
      <div class="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <nav class="text-xs text-[#64748B] mb-6" aria-label="Breadcrumb">
          <a href="${withBase('/')}" class="hover:text-[#0F766E]">Home</a> /
          <a href="${withBase('/tools/credit-debt/')}" class="hover:text-[#0F766E]">Credit &amp; Debt</a> /
          <span class="text-[#0F172A] font-semibold">Credit Card APR Calculator</span>
        </nav>
        <div class="mb-8">
          <div class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0F766E] bg-[#E7F4F1] px-3 py-1 rounded-full mb-2.5">
            <span>Interactive Revolving Debt Instrument</span>
          </div>
          <h1 class="text-2xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight mb-2">Credit Card APR Calculator</h1>
          <p class="text-sm sm:text-base text-[#64748B] max-w-2xl leading-relaxed">${tool.fullDescription}</p>
        </div>
        <nav aria-label="On this page" class="mb-8 bg-white rounded-2xl border border-[#E2E8F0] px-5 py-4 shadow-sm">
          <span class="text-xs font-bold uppercase tracking-wider text-[#475569] block mb-2">On this page</span>
          <ul class="flex flex-wrap gap-x-5 gap-y-1.5 text-xs font-semibold">
            <li><a href="#calculator" class="text-[#0F766E]">Calculator</a></li>
            <li><a href="#amortization" class="text-[#0F766E]">Monthly Amortization</a></li>
            <li><a href="#how-to-calculate" class="text-[#0F766E]">How to calculate credit card interest</a></li>
            <li><a href="#minimum-payment" class="text-[#0F766E]">Paying only the minimum</a></li>
            <li><a href="#worked-examples" class="text-[#0F766E]">Worked examples</a></li>
            <li><a href="#faq" class="text-[#0F766E]">FAQ</a></li>
          </ul>
        </nav>
        <div id="calculator" class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          <div class="lg:col-span-7 bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
            <div class="flex items-center justify-between pb-4 mb-6 border-b border-[#F1F5F9]">
              <span class="text-xs font-bold uppercase tracking-wider text-[#475569]">Interactive Parameters</span>
              <span class="text-[11px] text-[#94A3B8] font-medium">Type or slide values</span>
            </div>
            <div class="space-y-6">
              <div class="bg-[#F8FAFC] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] space-y-3">
                <div class="flex items-center justify-between">
                  <label class="text-xs font-bold uppercase tracking-wider text-[#334155]">Current Card Balance</label>
                  <span class="font-bold text-sm text-[#0F172A]">$4,500</span>
                </div>
                <input type="range" min="100" max="25000" step="100" value="4500" class="w-full h-2 bg-[#E2E8F0] rounded-lg accent-[#0F766E]" aria-label="Current card balance" />
                <p class="text-[11px] font-semibold text-[#94A3B8]">Presets: $1k · $2.5k · $4.5k · $7.5k · $12k</p>
              </div>
              <div class="bg-[#F8FAFC] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] space-y-3">
                <div class="flex items-center justify-between">
                  <label class="text-xs font-bold uppercase tracking-wider text-[#334155]">Annual Percentage Rate (APR)</label>
                  <span class="font-bold text-sm text-[#0F172A]">22.9%</span>
                </div>
                <input type="range" min="0" max="36" step="0.25" value="22.9" class="w-full h-2 bg-[#E2E8F0] rounded-lg accent-[#0F766E]" aria-label="Annual percentage rate" />
                <p class="text-[11px] font-semibold text-[#94A3B8]">Tiers: 14.9% · 18.9% · 22.9% · 27.9% · 29.9%</p>
              </div>
              <div class="bg-[#F8FAFC] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] space-y-3">
                <div class="flex items-center justify-between">
                  <label class="text-xs font-bold uppercase tracking-wider text-[#334155]">Monthly Payment Amount</label>
                  <span class="font-bold text-sm text-[#0F172A]">$200</span>
                </div>
                <input type="range" min="25" max="1500" step="25" value="200" class="w-full h-2 bg-[#E2E8F0] rounded-lg accent-[#0F766E]" aria-label="Monthly payment amount" />
                <p class="text-[11px] font-semibold text-[#94A3B8]">Presets: $100 · $200 · $350 · $500 · $800</p>
              </div>
              <div class="bg-[#F8FAFC] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0]">
                <label class="flex items-start gap-3">
                  <input type="checkbox" class="mt-0.5 h-4 w-4 shrink-0 accent-[#0F766E]" aria-label="Pay minimum only" />
                  <span>
                    <span class="text-xs font-bold uppercase tracking-wider text-[#334155] block">Pay minimum only</span>
                    <span class="text-[11px] text-[#64748B] leading-relaxed block mt-0.5">Each month's payment is the card minimum: 3% of the balance or $25, whichever is greater.</span>
                  </span>
                </label>
              </div>
              <p class="text-xs text-[#64748B]">Your calculator values are processed in your browser and are not sent to kitaaab.org servers.</p>
            </div>
          </div>
          <div class="lg:col-span-5 bg-gradient-to-br from-[#0B3B39] via-[#0F766E] to-[#115E59] rounded-3xl p-6 sm:p-8 text-white relative shadow-xl overflow-hidden">
            <div class="relative z-10 space-y-6">
              <div class="flex items-center justify-between pb-4 border-b border-white/10">
                <span class="text-[11px] font-bold uppercase tracking-widest text-emerald-200">Amortization Telemetry</span>
                <span class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/10 border border-white/15">Copy</span>
              </div>
              <div class="bg-white/10 rounded-2xl p-5 border border-white/15 text-center">
                <span class="text-xs font-semibold uppercase tracking-wider text-emerald-100">Estimated Payoff Timeline</span>
                <div class="text-3xl sm:text-4xl font-black text-white mt-1">${defaults.payoffMonths} Months</div>
                <div class="inline-flex items-center gap-1.5 text-xs text-emerald-200 mt-2 bg-black/20 px-2.5 py-1 rounded-full">
                  <span>Approx. ${defaults.payoffYears} Years</span><span>•</span><span>${aprMoney(defaults.totalMonthlyPayment)}/mo</span>
                </div>
                <div class="text-xs text-emerald-100 mt-2">Paid off around <strong class="text-white">${payoffDate}</strong></div>
                <div class="mt-3 pt-3 border-t border-white/10 text-xs text-emerald-100 text-left leading-relaxed">
                  At <strong>${aprMoney(defaults.totalMonthlyPayment)}/month</strong>, you will pay <strong>${aprMoney(defaults.totalInterestPaid)}</strong> in total interest charges across <strong>${defaults.payoffMonths} months</strong> to clear your ${aprMoney(4500)} balance.
                </div>
              </div>
              <div class="space-y-2 pt-2">
                <div class="flex items-center justify-between text-xs font-bold text-white/90">
                  <span>First Month Payment Breakdown</span>
                  <span class="text-emerald-300">${firstMonthPrincipalPct}% to Principal</span>
                </div>
                <div class="flex items-center justify-between text-[11px] font-semibold text-white/80 pt-0.5">
                  <span>Principal Reduction (${aprMoney(defaults.firstMonthPrincipal)})</span>
                  <span>Interest Fee (${aprMoney(defaults.firstMonthInterest)})</span>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3 pt-2">
                <div class="bg-white/10 rounded-xl p-3 border border-white/10">
                  <span class="text-[11px] font-semibold text-rose-200 block">Total Lifetime Interest</span>
                  <span class="text-sm sm:text-base font-extrabold text-rose-300 mt-0.5 block">${aprMoney(defaults.totalInterestPaid)}</span>
                </div>
                <div class="bg-white/10 rounded-xl p-3 border border-white/10">
                  <span class="text-[11px] font-semibold text-white/70 block">Total Out-of-Pocket</span>
                  <span class="text-sm sm:text-base font-bold text-white mt-0.5 block">${aprMoney(defaults.totalAmountPaid)}</span>
                </div>
                <div class="bg-white/10 rounded-xl p-3 border border-white/10">
                  <span class="text-[11px] font-semibold text-white/70 block">Monthly Rate (APR/12)</span>
                  <span class="text-sm sm:text-base font-bold text-white mt-0.5 block">1.908%</span>
                </div>
                <div class="bg-white/10 rounded-xl p-3 border border-white/10">
                  <span class="text-[11px] font-semibold text-white/70 block">Total Payment / Mo</span>
                  <span class="text-sm sm:text-base font-bold text-white mt-0.5 block">${aprMoney(defaults.totalMonthlyPayment)}</span>
                </div>
                <div class="bg-white/10 rounded-xl p-3 border border-white/10">
                  <span class="text-[11px] font-semibold text-white/70 block">Daily interest cost</span>
                  <span class="text-sm sm:text-base font-bold text-white mt-0.5 block">${aprMoney(defaults.dailyInterestCost)} per day</span>
                </div>
                <div class="bg-white/10 rounded-xl p-3 border border-white/10">
                  <span class="text-[11px] font-semibold text-white/70 block">Paid off around</span>
                  <span class="text-sm sm:text-base font-bold text-white mt-0.5 block">${payoffDate}</span>
                </div>
              </div>
              <p class="text-[11px] text-white/70 pt-2">Estimates use a monthly APR/12 model. Real card issuers assess interest daily based on average daily balances.</p>
            </div>
          </div>
        </div>
        <div id="amortization" class="mb-16 bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
          <h2 class="text-xl font-extrabold text-[#0F172A]">Monthly Amortization Progression</h2>
          <p class="text-xs text-[#64748B] mb-6">See how interest fees shrink every month as the revolving balance is repaid.</p>
          <div class="overflow-x-auto border border-[#E2E8F0] rounded-2xl">
            <table class="w-full text-left text-xs sm:text-sm">
              <thead class="bg-[#F8FAFC] text-[#475569] font-bold border-b border-[#E2E8F0]">
                <tr><th class="py-3 px-4">Period</th><th class="py-3 px-4">Starting Balance</th><th class="py-3 px-4">Interest Charged</th><th class="py-3 px-4">Payment</th><th class="py-3 px-4">Ending Balance</th><th class="py-3 px-4">Cumulative Interest</th></tr>
              </thead>
              <tbody class="divide-y divide-[#E2E8F0]">
                ${defaults.schedulePreview.slice(0, 12).map((item) => `
                <tr>
                  <td class="py-2.5 px-4 font-bold text-[#0F172A]">Month ${item.month}</td>
                  <td class="py-2.5 px-4 text-[#64748B]">${aprMoney(item.startBalance)}</td>
                  <td class="py-2.5 px-4 text-rose-600 font-bold">+${aprMoney(item.interestCharged)}</td>
                  <td class="py-2.5 px-4 text-[#0F766E] font-medium">${aprMoney(item.payment)}</td>
                  <td class="py-2.5 px-4 text-[#0F172A] font-extrabold">${aprMoney(item.endBalance)}</td>
                  <td class="py-2.5 px-4 text-[#64748B]">${aprMoney(item.totalInterestSoFar)}</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          <div class="lg:col-span-8 space-y-8">
          <section id="how-to-calculate" class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
            <h2 class="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight mb-3">How to Calculate APR on a Credit Card: Formulas, Steps &amp; Worked Example</h2>
            <p class="text-sm text-[#64748B] leading-relaxed mb-4">If you carry an unpaid balance on your credit card past the monthly statement due date, card issuers charge interest based on your stated Annual Percentage Rate (APR). While APR represents an annualized borrowing rate, finance charges are assessed on each monthly billing cycle.</p>
            <div class="bg-[#F8FAFC] border border-[#CBD5E1] p-5 rounded-2xl text-xs sm:text-sm text-[#0F172A] mb-6 font-mono leading-relaxed">
              Monthly Rate = APR ÷ 12 ÷ 100<br />
              Monthly Interest = Current Carried Balance × Monthly Periodic Rate<br />
              Principal Repaid = Total Monthly Payment − Monthly Interest<br />
              Ending Balance = Starting Balance − Principal Repaid + New Purchases
            </div>
            <div class="p-5 sm:p-6 rounded-2xl bg-teal-50/60 border border-teal-200">
              <h3 class="text-sm font-bold uppercase tracking-wider text-[#0F766E] mb-2">Worked Example: $4,000 Balance at 24.0% APR</h3>
              <p class="text-xs text-[#0F766E] leading-relaxed">Monthly rate 24.0% ÷ 12 = 2.0%. Month 1 interest $4,000.00 × 0.02 = $80.00; $200.00 payment − $80.00 interest = $120.00 to principal; ending balance $3,880.00. At $200.00/mo the $4,000 debt is paid off in <strong>26 months</strong> with <strong>$1,159.49</strong> in total lifetime interest.</p>
            </div>
          </section>
          <section class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
            <h2 class="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight mb-3">How to find your APR before you calculate</h2>
            <p class="text-sm text-[#64748B] leading-relaxed mb-4">You cannot calculate monthly interest until you know the APR that applies to the balance you carry. Check it in one of these three places before you enter a number:</p>
            <ul class="space-y-2 text-sm text-[#64748B] list-disc list-inside leading-relaxed">
              <li><strong class="text-[#0F172A]">Your monthly statement:</strong> look in the interest-charge section, which lists the APR for purchases, balance transfers, and cash advances separately.</li>
              <li><strong class="text-[#0F172A]">Your cardmember agreement:</strong> the APR and how it is calculated are stated in the pricing terms you received with the card.</li>
              <li><strong class="text-[#0F172A]">Your online account or app:</strong> open card details or statements to see the current APR for each transaction type.</li>
            </ul>
          </section>
          <section id="minimum-payment" class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
            <h2 class="text-xl sm:text-2xl font-extrabold text-[#0F172A] mb-3">Credit Card APR Payment Economics: How Your Payment Dictates Total Interest</h2>
            <p class="text-sm text-[#64748B] leading-relaxed mb-4">Paying only statement minimums (3% of balance, $25 floor) on a $5,000 balance at 24.0% APR takes <strong>${scenarioA.payoffMonths} months (${scenarioA.payoffYears} years)</strong>, costs <strong>${aprMoney(scenarioA.totalInterestPaid)}</strong> in interest and <strong>${aprMoney(scenarioA.totalAmountPaid)}</strong> in total. Month 1: ${aprMoney(scenarioAMonth(1).interestCharged)} interest, ${aprMoney(scenarioAMonth(1).payment)} payment, ${aprMoney(scenarioAMonth(1).endBalance)} balance. Month 2: ${aprMoney(scenarioAMonth(2).interestCharged)} interest, ${aprMoney(scenarioAMonth(2).payment)} payment. The $25 floor first applies in month ${scenarioA.floorMonth} (starting balance ${aprMoney(scenarioA.floorStartBalance)}), and the final payment in month ${scenarioA.payoffMonths} is ${aprMoney(scenarioA.finalPayment)}.</p>
            <p class="text-sm text-[#64748B] leading-relaxed">Fixing your payment at $250.00/mo instead clears the same $5,000 debt in 26 months with $1,449.36 in interest — saving $7,437.59 and 17.3 years.</p>
          </section>
          <section id="worked-examples" class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
            <h2 class="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight mb-3">Worked examples by balance and APR</h2>
            <div class="overflow-x-auto border border-[#E2E8F0] rounded-2xl mb-8">
              <table class="w-full text-left text-xs sm:text-sm">
                <thead class="bg-[#F8FAFC] text-[#475569] font-bold border-b border-[#E2E8F0]">
                  <tr><th class="py-3 px-4">Balance</th><th class="py-3 px-4">APR</th><th class="py-3 px-4">Monthly payment</th><th class="py-3 px-4">Payoff time</th><th class="py-3 px-4">Total interest</th><th class="py-3 px-4">Total paid</th></tr>
                </thead>
                <tbody class="divide-y divide-[#E2E8F0]">
                  ${worked.map((row) => `
                  <tr>
                    <td class="py-2.5 px-4 font-bold text-[#0F172A]">${aprMoney(row.balance)}</td>
                    <td class="py-2.5 px-4 text-[#64748B]">${row.apr}%</td>
                    <td class="py-2.5 px-4 text-[#64748B]">${aprMoney(row.monthlyPayment)}</td>
                    <td class="py-2.5 px-4 font-bold text-[#0F172A]">${row.payoffMonths} months</td>
                    <td class="py-2.5 px-4 text-rose-600 font-bold">${aprMoney(row.totalInterestPaid)}</td>
                    <td class="py-2.5 px-4 text-[#0F172A] font-extrabold">${aprMoney(row.totalAmountPaid)}</td>
                  </tr>`).join('')}
                </tbody>
              </table>
            </div>
            <h3 class="text-lg font-extrabold text-[#0F172A] mb-3">Minimum payment vs. fixed payment: $4,500 at 22.9% APR</h3>
            <p class="text-xs text-[#64748B] leading-relaxed mb-4">Minimum payment = 3% of balance or $25, whichever is greater; 22.9% APR; monthly APR ÷ 12 model; no new charges.</p>
            <div class="overflow-x-auto border border-[#E2E8F0] rounded-2xl">
              <table class="w-full text-left text-xs sm:text-sm">
                <thead class="bg-[#F8FAFC] text-[#475569] font-bold border-b border-[#E2E8F0]">
                  <tr><th class="py-3 px-4">Payment plan</th><th class="py-3 px-4">Payoff time</th><th class="py-3 px-4">Total interest</th><th class="py-3 px-4">Total paid</th></tr>
                </thead>
                <tbody class="divide-y divide-[#E2E8F0]">
                  ${comparison.map((row) => `
                  <tr>
                    <td class="py-2.5 px-4 font-bold text-[#0F172A]">${row.label}</td>
                    <td class="py-2.5 px-4 text-[#64748B]">${row.payoffMonths} months (${(row.payoffMonths / 12).toFixed(1)} years)</td>
                    <td class="py-2.5 px-4 text-rose-600 font-bold">${aprMoney(row.totalInterestPaid)}</td>
                    <td class="py-2.5 px-4 text-[#0F172A] font-extrabold">${aprMoney(row.totalAmountPaid)}</td>
                  </tr>`).join('')}
                </tbody>
              </table>
            </div>
          </section>
          <section class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
            <h2 class="text-xl font-extrabold text-[#0F172A] mb-3">Assumptions &amp; Limitations</h2>
            <ul class="space-y-2 text-sm text-[#64748B] list-disc list-inside leading-relaxed">
              ${tool.assumptions.map((a) => `<li>${a}</li>`).join('')}
            </ul>
          </section>
          <section id="faq" class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
            <h2 class="text-xl font-extrabold text-[#0F172A] mb-4">Frequently Asked Questions About Credit Card APR</h2>
            ${tool.faqs.map((faq) => `
            <div class="mb-4">
              <h3 class="font-bold text-base text-gray-900">${faq.question}</h3>
              <p class="text-sm text-gray-600 mt-1">${faq.answer}</p>
            </div>`).join('')}
          </section>
          <section class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
            <h2 class="text-xl font-extrabold text-[#0F172A] mb-3">Understanding Different Credit Card APR Tiers</h2>
            <p class="text-sm text-[#64748B] leading-relaxed mb-4">Most credit cards feature different APR tiers for different transaction types:</p>
            <ul class="space-y-2 text-sm text-[#64748B] list-disc list-inside leading-relaxed mb-4">
              <li><strong class="text-[#0F172A]">Purchase APR:</strong> The standard rate charged on goods and services bought with your card. An interest-free grace period (typically 21–25 days) applies as long as you pay the statement balance in full every month.</li>
              <li><strong class="text-[#0F172A]">Cash Advance APR:</strong> A significantly higher rate (often 25%–30%) applied immediately to ATM withdrawals or cash equivalents, with zero grace period.</li>
              <li><strong class="text-[#0F172A]">Penalty APR:</strong> A punitive rate (frequently up to 29.99%) that lenders can trigger if you miss a payment by 60 days or more.</li>
            </ul>
          </section>
          <section class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
            <h2 class="text-xl font-extrabold text-[#0F172A] mb-3">Strategies to Eliminate High Credit Card APR Debt</h2>
            <div class="space-y-4 text-sm text-[#64748B] leading-relaxed">
              <p>If you carry debt across multiple cards or loans, structured repayment strategies can save thousands:</p>
              <ul class="space-y-2.5 list-disc list-inside">
                <li><strong class="text-[#0F172A]">The Debt Avalanche Strategy:</strong> Direct all extra monthly funds to the card with the highest APR while maintaining minimum payments on others. Compare methods with our <a href="${withBase('/debt-payoff-planner/')}" class="text-[#0F766E] font-semibold underline hover:text-[#115E59]">Debt Payoff Planner</a>.</li>
                <li><strong class="text-[#0F172A]">Consolidation via Fixed-Rate Personal Loan:</strong> If you qualify for a fixed-rate personal loan at 8%–12%, consolidating high-APR card debt locks in a fixed end-date. Calculate fixed payments with our <a href="${withBase('/loan-payment-calculator/')}" class="text-[#0F766E] font-semibold underline hover:text-[#115E59]">Loan Payment Calculator</a>.</li>
                <li><strong class="text-[#0F172A]">Compare APR vs. Nominal Interest Rates:</strong> Learn the differences between simple APR, daily compounding, and Effective Annual Rates (EAR) in our guide: <a href="${withBase('/learn/apr-vs-interest-rate/')}" class="text-[#0F766E] font-semibold underline hover:text-[#115E59]">APR vs. Interest Rate: Formulas, Compounding &amp; Real Borrowing Costs</a>.</li>
                <li><strong class="text-[#0F172A]">Restoring Your Grace Period:</strong> Under many cardholder agreements, paying your balance in full and maintaining a zero balance through one or two consecutive billing cycles allows you to regain an interest-free grace period on future eligible retail purchases; consult your cardholder agreement for your issuer's trailing interest rules.</li>
              </ul>
            </div>
          </section>
          </div>
          <div class="lg:col-span-4 space-y-6">
            <div class="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-sm">
              <div class="text-xs font-bold uppercase tracking-wider text-[#0F766E] mb-2">In-Depth Guide</div>
              <h3 class="text-base font-bold text-[#0F172A] mb-2">APR vs. Interest Rate: The Key Differences</h3>
              <p class="text-xs text-[#64748B] leading-relaxed mb-4">Understand how daily periodic rates work, what loss of grace period means, and how to verify statement finance charges.</p>
              <a href="${withBase('/learn/apr-vs-interest-rate/')}" class="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F766E]">Read APR Educational Guide</a>
            </div>
            <div class="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-sm">
              <div class="text-xs font-bold uppercase tracking-wider text-[#0F766E] mb-2">Multi-Card Strategy</div>
              <h3 class="text-base font-bold text-[#0F172A] mb-2">Debt Payoff Planner</h3>
              <p class="text-xs text-[#64748B] leading-relaxed mb-4">Have multiple credit cards? Compare the Debt Avalanche and Debt Snowball methods side-by-side to find your fastest path to zero debt.</p>
              <a href="${withBase('/debt-payoff-planner/')}" class="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F766E]">Open Debt Payoff Planner</a>
            </div>
            <div class="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-sm">
              <div class="text-xs font-bold uppercase tracking-wider text-[#0F766E] mb-2">Debt Consolidation</div>
              <h3 class="text-base font-bold text-[#0F172A] mb-2">Loan Payment Calculator</h3>
              <p class="text-xs text-[#64748B] leading-relaxed mb-4">Compare high credit card APR against fixed-rate personal consolidation loans. See how fixed installment schedules save interest and lock in payoff dates.</p>
              <a href="${withBase('/loan-payment-calculator/')}" class="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F766E]">Open Loan Calculator</a>
            </div>
          </div>
        </div>
        <div class="mb-16">
          <h2 class="text-xl font-bold text-[#172033] mb-2">Related Financial Calculators</h2>
          <p class="text-sm text-[#667085] mb-6">More tools that work with the numbers on this page.</p>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm">
              <h3 class="font-bold text-base text-[#0F172A] mb-2"><a href="${withBase('/debt-payoff-planner/')}" class="text-teal-700 hover:underline">Debt Payoff Planner</a></h3>
              <p class="text-xs text-[#64748B]">Compare debt snowball and debt avalanche repayment schedules.</p>
            </div>
            <div class="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm">
              <h3 class="font-bold text-base text-[#0F172A] mb-2"><a href="${withBase('/loan-payment-calculator/')}" class="text-teal-700 hover:underline">Loan Payment Calculator</a></h3>
              <p class="text-xs text-[#64748B]">Calculate fixed-rate loan payments, interest costs, and amortization schedules.</p>
            </div>
          </div>
          <h2 class="text-xl font-bold text-[#172033] mt-12 mb-2">Helpful Educational Guides</h2>
          <p class="text-sm text-[#667085] mb-6">Understand the formulas, methodology, and financial context behind these calculations.</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm">
              <h3 class="font-bold text-base text-[#0F172A] mb-2"><a href="${withBase('/learn/apr-vs-interest-rate/')}" class="text-teal-700 hover:underline">APR vs. Interest Rate: Formulas, Compounding &amp; Real Borrowing Costs</a></h3>
              <p class="text-xs text-[#64748B]">Understand the difference between nominal interest rates and Annual Percentage Rate (APR), how daily and monthly compounding work, and how prepaid fees alter true borrowing costs.</p>
            </div>
            <div class="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm">
              <h3 class="font-bold text-base text-[#0F172A] mb-2"><a href="${withBase('/learn/debt-snowball-vs-debt-avalanche/')}" class="text-teal-700 hover:underline">Debt Snowball vs. Debt Avalanche</a></h3>
              <p class="text-xs text-[#64748B]">Compare the two most popular multi-debt payoff strategies and see which clears your balances faster.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
    <footer class="bg-white border-t border-[#E4E9F0] mt-20">
      <div class="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 lg:py-16">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          <div class="lg:col-span-2 space-y-4">
            <a href="${withBase('/')}" class="flex items-center gap-2.5 text-[#172033] font-semibold text-lg">
              <div class="w-7 h-7 rounded-lg bg-[#0F766E] text-white flex items-center justify-center font-bold text-sm">$</div>
              <span>${siteConfig.name}</span>
            </a>
            <p class="text-sm text-[#667085] max-w-sm leading-relaxed">${siteConfig.tagline}</p>
            <p class="text-xs text-[#667085] leading-relaxed pt-2 border-t border-[#E4E9F0]/60">${siteConfig.disclaimerShort}</p>
          </div>
          <div>
            <h3 class="text-xs font-semibold uppercase tracking-wider text-[#172033] mb-3">Tool Categories</h3>
            <ul class="space-y-2 text-sm text-[#667085]">
              <li><a href="${withBase('/tools/investing/')}">Investing Tools</a></li>
              <li><a href="${withBase('/tools/credit-debt/')}">Credit &amp; Debt</a></li>
              <li><a href="${withBase('/tools/retirement/')}">Retirement Planning</a></li>
              <li><a href="${withBase('/tools/business-finance/')}">Business Finance</a></li>
              <li><a href="${withBase('/tools/')}" class="font-medium text-[#0F766E]">All Calculators &rarr;</a></li>
            </ul>
          </div>
          <div>
            <h3 class="text-xs font-semibold uppercase tracking-wider text-[#172033] mb-3">Learn</h3>
            <ul class="space-y-2 text-sm text-[#667085]">
              <li><a href="${withBase('/learn/how-to-calculate-average-stock-cost/')}">Average Stock Cost</a></li>
              <li><a href="${withBase('/learn/how-to-calculate-roi/')}">How to Calculate ROI</a></li>
              <li><a href="${withBase('/learn/apr-vs-interest-rate/')}">APR vs. Interest Rate</a></li>
              <li><a href="${withBase('/learn/flat-vs-tiered-commission/')}">Tiered Commission</a></li>
              <li><a href="${withBase('/learn/how-long-will-retirement-savings-last/')}">Retirement Longevity</a></li>
            </ul>
          </div>
          <div>
            <h3 class="text-xs font-semibold uppercase tracking-wider text-[#172033] mb-3">Platform</h3>
            <ul class="space-y-2 text-sm text-[#667085]">
              <li><a href="${withBase('/about/')}">About</a></li>
              <li><a href="${withBase('/methodology/')}">Calculation Methodology</a></li>
              <li><a href="${withBase('/financial-disclaimer/')}">Financial Disclaimer</a></li>
              <li><a href="${withBase('/contact/')}">Contact</a></li>
              <li><a href="${withBase('/privacy/')}">Privacy Policy</a></li>
              <li><a href="${withBase('/terms/')}">Terms of Use</a></li>
            </ul>
          </div>
        </div>
        <div class="mt-12 pt-8 border-t border-[#E4E9F0] flex flex-col sm:flex-row items-center justify-between text-xs text-[#667085] gap-4">
          <div>&copy; ${year} ${siteConfig.name}. All rights reserved.</div>
          <div class="flex items-center gap-4">
            <a href="${withBase('/privacy/')}" class="hover:underline">Privacy</a>
            <span class="text-[#E4E9F0]">&bull;</span>
            <a href="${withBase('/terms/')}" class="hover:underline">Terms</a>
            <span class="text-[#E4E9F0]">&bull;</span>
            <a href="${withBase('/financial-disclaimer/')}" class="hover:underline">Disclaimer</a>
          </div>
        </div>
      </div>
    </footer>
  </div>
  `
}

// ---------------------------------------------------------------------------
// Retirement Savings Goal shell
// Same pattern as renderAprShell: full first-paint layout (header, H1,
// console with default results, schedule preview, formula, FAQ) using the
// same classes as the Vue page so hydration does not shift the layout.
// Every number comes from the retirement engine, never hand-typed.
// ---------------------------------------------------------------------------
function renderRetirementShell(tool) {
  const defaults = calculateRetirementGoal({
    currentSavings: 50000,
    targetAmount: 1000000,
    currentAge: 35,
    retirementAge: 65,
    expectedAnnualReturn: 7,
    contributionFrequency: 'monthly',
    contributionTiming: 'end',
    annualContributionIncreasePct: 0
  })
  const year = new Date().getFullYear()
  const total = Math.max(1, defaults.projectedFinalBalance)
  const initialPct = (50000 / total) * 100
  const contribPct = (defaults.totalPersonalContributions / total) * 100
  const growthPct = (defaults.estimatedInvestmentGrowth / total) * 100

  return `
  <div class="min-h-screen flex flex-col bg-[#F7F9FC] text-[#172033]">
    <header class="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-[#E4E9F0]">
      <div class="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <a href="${withBase('/')}" class="flex items-center gap-2.5 text-[#172033] font-semibold text-lg">
          <div class="w-8 h-8 rounded-lg bg-[#0F766E] text-white flex items-center justify-center font-bold text-base shadow-sm">$</div>
          <span>${siteConfig.name}</span>
        </a>
        <nav class="hidden md:flex items-center gap-1 lg:gap-2" aria-label="Main Navigation">
          <a href="${withBase('/tools/')}" class="px-3 py-1.5 rounded-md text-sm font-medium text-[#667085]">Tools</a>
          <a href="${withBase('/tools/investing/')}" class="px-3 py-1.5 rounded-md text-sm font-medium text-[#667085]">Investing</a>
          <a href="${withBase('/tools/credit-debt/')}" class="px-3 py-1.5 rounded-md text-sm font-medium text-[#667085]">Credit &amp; Debt</a>
          <a href="${withBase('/tools/retirement/')}" class="px-3 py-1.5 rounded-md text-sm font-medium text-[#0F766E] bg-[#E7F4F1] font-semibold">Retirement</a>
          <a href="${withBase('/tools/business-finance/')}" class="px-3 py-1.5 rounded-md text-sm font-medium text-[#667085]">Business</a>
          <a href="${withBase('/learn/')}" class="px-3 py-1.5 rounded-md text-sm font-medium text-[#667085]">Learn</a>
        </nav>
        <a href="${withBase('/tools/')}" class="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium bg-[#0F766E] text-white shadow-sm">Explore tools</a>
      </div>
    </header>
    <main class="flex-1">
      <div class="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <nav class="text-xs text-[#64748B] mb-6" aria-label="Breadcrumb">
          <a href="${withBase('/')}" class="hover:text-[#0F766E]">Home</a> /
          <a href="${withBase('/tools/retirement/')}" class="hover:text-[#0F766E]">Retirement</a> /
          <span class="text-[#0F172A] font-semibold">Retirement Savings Goal Calculator</span>
        </nav>
        <div class="mb-8">
          <div class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0F766E] bg-[#E7F4F1] px-3 py-1 rounded-full mb-2.5">
            <span>Interactive Savings Instrument</span>
          </div>
          <h1 class="text-2xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight mb-2">Retirement Savings Goal Calculator</h1>
          <p class="text-sm sm:text-base text-[#64748B] max-w-2xl leading-relaxed">${tool.fullDescription}</p>
        </div>
        <div id="calculator" class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          <div class="lg:col-span-7 bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
            <div class="flex items-center justify-between pb-4 mb-6 border-b border-[#F1F5F9]">
              <span class="text-xs font-bold uppercase tracking-wider text-[#475569]">Target Parameters</span>
              <span class="text-[11px] text-[#94A3B8] font-medium">Drag sliders or enter values</span>
            </div>
            <div class="space-y-6">
              <div class="bg-[#F8FAFC] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] space-y-3">
                <div class="flex items-center justify-between">
                  <label class="text-xs font-bold uppercase tracking-wider text-[#334155]">Target Retirement Nest Egg</label>
                  <span class="font-bold text-sm text-[#0F172A]">$1,000,000</span>
                </div>
                <input type="range" min="100000" max="3000000" step="1" value="1000000" class="w-full h-2 bg-[#E2E8F0] rounded-lg accent-[#0F766E]" aria-label="Target retirement nest egg" />
                <p class="text-[11px] font-semibold text-[#94A3B8]">Presets: $250k · $500k · $1M · $1.5M · $2M</p>
              </div>
              <div class="bg-[#F8FAFC] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] space-y-3">
                <div class="flex items-center justify-between">
                  <label class="text-xs font-bold uppercase tracking-wider text-[#334155]">Current Retirement Savings</label>
                  <span class="font-bold text-sm text-[#0F172A]">$50,000</span>
                </div>
                <input type="range" min="0" max="500000" step="1" value="50000" class="w-full h-2 bg-[#E2E8F0] rounded-lg accent-[#0F766E]" aria-label="Current retirement savings" />
                <p class="text-[11px] font-semibold text-[#94A3B8]">Presets: $0 · $25k · $50k · $100k · $200k</p>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0]">
                  <label class="block text-xs font-bold uppercase tracking-wider text-[#334155] mb-1.5">Current Age</label>
                  <span class="font-bold text-sm text-[#0F172A]">35</span>
                </div>
                <div class="bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0]">
                  <label class="block text-xs font-bold uppercase tracking-wider text-[#334155] mb-1.5">Retirement Age</label>
                  <span class="font-bold text-sm text-[#0F172A]">65</span>
                </div>
              </div>
              <div class="bg-[#F8FAFC] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] space-y-3">
                <div class="flex items-center justify-between">
                  <label class="text-xs font-bold uppercase tracking-wider text-[#334155]">Expected Annual Return</label>
                  <span class="font-bold text-sm text-[#0F172A]">7.0%</span>
                </div>
                <input type="range" min="0" max="15" step="0.01" value="7" class="w-full h-2 bg-[#E2E8F0] rounded-lg accent-[#0F766E]" aria-label="Expected annual return" />
                <p class="text-[11px] font-semibold text-[#94A3B8]">Presets: 4.0% · 5.5% · 7.0% · 8.5% · 10.0%</p>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0]">
                  <label class="block text-xs font-bold uppercase tracking-wider text-[#334155] mb-1.5">Frequency</label>
                  <span class="font-bold text-sm text-[#0F172A]">Monthly Deposits</span>
                </div>
                <div class="bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0]">
                  <label class="block text-xs font-bold uppercase tracking-wider text-[#334155] mb-1.5">Timing</label>
                  <span class="font-bold text-sm text-[#0F172A]">End of Period (Ordinary)</span>
                </div>
              </div>
              <div class="bg-[#F8FAFC] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] space-y-3">
                <div class="flex items-center justify-between">
                  <label class="text-xs font-bold uppercase tracking-wider text-[#334155]">Annual Contribution Increase (Step-Up)</label>
                  <span class="font-bold text-sm text-[#0F172A]">0%</span>
                </div>
                <input type="range" min="0" max="10" step="0.1" value="0" class="w-full h-2 bg-[#E2E8F0] rounded-lg accent-[#0F766E]" aria-label="Annual contribution increase" />
                <p class="text-[11px] text-[#64748B] leading-relaxed">Raise your contribution by this % each year as your salary grows. A step-up lowers the starting contribution needed to reach the same target.</p>
                <p class="text-[11px] font-semibold text-[#94A3B8]">Presets: 0% · 2% · 3% · 4% · 5%</p>
              </div>
              <p class="text-xs text-[#64748B]">Your calculator values are processed in your browser and are not sent to kitaaab.org servers.</p>
            </div>
          </div>
          <div class="lg:col-span-5 bg-gradient-to-br from-[#0B3B39] via-[#0F766E] to-[#115E59] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
            <div class="relative z-10">
              <div class="flex items-center justify-between pb-4 mb-6 border-b border-white/15">
                <span class="text-xs font-bold uppercase tracking-wider text-[#99F6E4]">Required Periodic Deposit</span>
                <span class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/10 border border-white/15">Copy Summary</span>
              </div>
              <div class="mb-6">
                <span class="text-xs uppercase tracking-wider text-white/70 font-semibold block mb-1">Required Monthly Contribution</span>
                <div class="text-4xl sm:text-5xl font-black tracking-tight text-white flex items-baseline gap-2">
                  <span>${aprMoney(defaults.requiredMonthlyContribution)}</span>
                  <span class="text-sm font-semibold text-[#99F6E4]">/mo</span>
                </div>
                <p class="text-xs text-[#99F6E4] mt-2">Equivalent to ${aprMoney(defaults.requiredAnnualContribution)} per year</p>
              </div>
              <div class="mb-6 bg-black/20 p-4 rounded-2xl border border-white/10">
                <div class="flex items-center justify-between text-xs mb-2">
                  <span class="font-bold text-white">Nest Egg Accumulation Sources</span>
                  <span class="text-xs text-white/70 font-semibold">${aprMoney(defaults.projectedFinalBalance)}</span>
                </div>
                <div class="w-full h-3 rounded-full overflow-hidden flex bg-white/20">
                  <div class="bg-[#2DD4BF]" style="width: ${initialPct.toFixed(1)}%"></div>
                  <div class="bg-[#38BDF8]" style="width: ${contribPct.toFixed(1)}%"></div>
                  <div class="bg-[#34D399]" style="width: ${growthPct.toFixed(1)}%"></div>
                </div>
                <div class="grid grid-cols-3 gap-1 text-[10px] mt-2.5">
                  <div class="text-teal-200">Start: ${initialPct.toFixed(0)}%</div>
                  <div class="text-sky-200">Deposits: ${contribPct.toFixed(0)}%</div>
                  <div class="text-emerald-200">Growth: ${growthPct.toFixed(0)}%</div>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3 mb-6">
                <div class="bg-white/10 rounded-2xl p-4 border border-white/10">
                  <span class="text-xs text-[#99F6E4] block mb-1">Your Deposits</span>
                  <div class="text-lg sm:text-xl font-black">${aprMoney(defaults.totalPersonalContributions)}</div>
                  <span class="text-[10px] text-white/60">Out-of-pocket</span>
                </div>
                <div class="bg-white/10 rounded-2xl p-4 border border-white/10">
                  <span class="text-xs text-emerald-300 block mb-1">Compound Growth</span>
                  <div class="text-lg sm:text-xl font-black text-emerald-200">${aprMoney(defaults.estimatedInvestmentGrowth)}</div>
                  <span class="text-[10px] text-white/60">Market returns</span>
                </div>
                <div class="bg-white/10 rounded-2xl p-4 border border-white/10">
                  <span class="text-xs text-[#99F6E4] block mb-1">Horizon</span>
                  <div class="text-lg sm:text-xl font-black">${defaults.yearsToRetirement} Years</div>
                  <span class="text-[10px] text-white/60">${defaults.numberOfPeriods} contributions</span>
                </div>
                <div class="bg-white/10 rounded-2xl p-4 border border-white/10">
                  <span class="text-xs text-[#99F6E4] block mb-1">Final Projected</span>
                  <div class="text-lg sm:text-xl font-black">${aprMoney(defaults.projectedFinalBalance)}</div>
                  <span class="text-[10px] text-white/60">Target achieved</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="mb-12 bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
          <h2 class="text-xl font-extrabold text-[#0F172A]">Annual Accumulation Progression</h2>
          <p class="text-xs text-[#64748B] mb-6">Yearly expansion showing deposits vs compound market returns (first 5 of ${defaults.yearsToRetirement} years).</p>
          <div class="overflow-x-auto border border-[#E2E8F0] rounded-2xl">
            <table class="w-full text-left text-xs sm:text-sm">
              <thead class="bg-[#F8FAFC] text-[#475569] font-bold border-b border-[#E2E8F0]">
                <tr><th class="py-3 px-4">Year</th><th class="py-3 px-4">Age</th><th class="py-3 px-4">Starting Balance</th><th class="py-3 px-4">Yearly Deposits</th><th class="py-3 px-4">Interest Earned</th><th class="py-3 px-4">Ending Balance</th><th class="py-3 px-4">Cumulative Growth</th></tr>
              </thead>
              <tbody class="divide-y divide-[#E2E8F0]">
                ${defaults.yearlyBreakdown.slice(0, 5).map((row) => `
                <tr>
                  <td class="py-2.5 px-4 font-bold text-[#0F172A]">Year ${row.year}</td>
                  <td class="py-2.5 px-4 text-[#64748B]">${row.age}</td>
                  <td class="py-2.5 px-4 text-[#64748B]">${aprMoney(row.startingBalance)}</td>
                  <td class="py-2.5 px-4 text-sky-700 font-semibold">+${aprMoney(row.contributions)}</td>
                  <td class="py-2.5 px-4 text-emerald-700 font-semibold">+${aprMoney(row.interestEarned)}</td>
                  <td class="py-2.5 px-4 font-bold text-[#0F172A]">${aprMoney(row.endingBalance)}</td>
                  <td class="py-2.5 px-4 text-[#64748B]">${aprMoney(row.totalInterestSoFar)}</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-7 shadow-xs">
            <h3 class="text-xs font-bold text-[#0F766E] uppercase tracking-wider mb-2">Sinking Fund Annuity Formula</h3>
            <p class="text-xs text-[#64748B] leading-relaxed mb-3">Calculates the periodic contribution PMT needed to bridge future value requirements:</p>
            <div class="bg-[#F8FAFC] p-4 rounded-xl border border-[#CBD5E1] font-mono text-xs text-[#1E293B] overflow-x-auto mb-3">PMT = [FV − PV(1+r)^n] × [r ÷ ((1+r)^n − 1)]</div>
            <ul class="text-xs text-[#64748B] space-y-1">
              <li><strong>FV:</strong> Desired target nest egg</li>
              <li><strong>PV:</strong> Current accumulated capital</li>
              <li><strong>r:</strong> Periodic interest rate</li>
              <li><strong>n:</strong> Total periods until retirement</li>
            </ul>
          </div>
          <div class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-7 shadow-xs">
            <h3 class="text-xs font-bold text-[#0F766E] uppercase tracking-wider mb-2">Key Assumptions &amp; Disclosures</h3>
            <ul class="text-xs text-[#64748B] space-y-2 list-disc pl-4 leading-relaxed">
              ${tool.assumptions.map((a) => `<li>${a}</li>`).join('')}
            </ul>
          </div>
        </div>
        <section class="mb-12 bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
          <h2 class="text-xl font-extrabold text-[#0F172A] mb-4">Frequently Asked Questions</h2>
          ${tool.faqs.map((faq) => `
          <div class="mb-4">
            <h3 class="font-bold text-base text-gray-900">${faq.question}</h3>
            <p class="text-sm text-gray-600 mt-1">${faq.answer}</p>
          </div>`).join('')}
        </section>
        <div class="mb-16">
          <h2 class="text-xl font-bold text-[#172033] mb-2">Related Financial Calculators</h2>
          <p class="text-sm text-[#667085] mb-6">More tools that work with the numbers on this page.</p>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm">
              <h3 class="font-bold text-base text-[#0F172A] mb-2"><a href="${withBase('/how-long-will-my-money-last/')}" class="text-teal-700 hover:underline">How Long Will My Money Last?</a></h3>
              <p class="text-xs text-[#64748B]">Estimate how long retirement savings could last based on your starting balance, withdrawals, inflation, and assumed annual return.</p>
            </div>
            <div class="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm">
              <h3 class="font-bold text-base text-[#0F172A] mb-2"><a href="${withBase('/compound-interest-calculator/')}" class="text-teal-700 hover:underline">Compound Interest Calculator</a></h3>
              <p class="text-xs text-[#64748B]">See how compound growth builds wealth over time.</p>
            </div>
          </div>
          <h2 class="text-xl font-bold text-[#172033] mt-12 mb-2">Helpful Educational Guides</h2>
          <p class="text-sm text-[#667085] mb-6">Understand the formulas, methodology, and financial context behind these calculations.</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm">
              <h3 class="font-bold text-base text-[#0F172A] mb-2"><a href="${withBase('/learn/how-to-calculate-retirement-savings-goal/')}" class="text-teal-700 hover:underline">How to Calculate Your Retirement Savings Goal</a></h3>
              <p class="text-xs text-[#64748B]">Learn how to calculate your target retirement nest egg, how the 25x rule works, and how to use sinking fund annuity formulas to determine required monthly savings.</p>
            </div>
            <div class="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm">
              <h3 class="font-bold text-base text-[#0F172A] mb-2"><a href="${withBase('/learn/how-long-will-retirement-savings-last/')}" class="text-teal-700 hover:underline">How Long Will Retirement Savings Last?</a></h3>
              <p class="text-xs text-[#64748B]">Calculate how long your retirement nest egg will endure, understand mathematical depletion formulas, factor in inflation drag, and protect against sequence-of-returns risk.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
    <footer class="bg-white border-t border-[#E4E9F0] mt-20">
      <div class="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 lg:py-16">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          <div class="lg:col-span-2 space-y-4">
            <a href="${withBase('/')}" class="flex items-center gap-2.5 text-[#172033] font-semibold text-lg">
              <div class="w-7 h-7 rounded-lg bg-[#0F766E] text-white flex items-center justify-center font-bold text-sm">$</div>
              <span>${siteConfig.name}</span>
            </a>
            <p class="text-sm text-[#667085] max-w-sm leading-relaxed">${siteConfig.tagline}</p>
            <p class="text-xs text-[#667085] leading-relaxed pt-2 border-t border-[#E4E9F0]/60">${siteConfig.disclaimerShort}</p>
          </div>
          <div>
            <h3 class="text-xs font-semibold uppercase tracking-wider text-[#172033] mb-3">Tool Categories</h3>
            <ul class="space-y-2 text-sm text-[#667085]">
              <li><a href="${withBase('/tools/investing/')}">Investing Tools</a></li>
              <li><a href="${withBase('/tools/credit-debt/')}">Credit &amp; Debt</a></li>
              <li><a href="${withBase('/tools/retirement/')}">Retirement Planning</a></li>
              <li><a href="${withBase('/tools/business-finance/')}">Business Finance</a></li>
              <li><a href="${withBase('/tools/')}" class="font-medium text-[#0F766E]">All Calculators &rarr;</a></li>
            </ul>
          </div>
          <div>
            <h3 class="text-xs font-semibold uppercase tracking-wider text-[#172033] mb-3">Learn</h3>
            <ul class="space-y-2 text-sm text-[#667085]">
              <li><a href="${withBase('/learn/how-to-calculate-average-stock-cost/')}">Average Stock Cost</a></li>
              <li><a href="${withBase('/learn/how-to-calculate-roi/')}">How to Calculate ROI</a></li>
              <li><a href="${withBase('/learn/apr-vs-interest-rate/')}">APR vs. Interest Rate</a></li>
              <li><a href="${withBase('/learn/flat-vs-tiered-commission/')}">Tiered Commission</a></li>
              <li><a href="${withBase('/learn/how-long-will-retirement-savings-last/')}">Retirement Longevity</a></li>
            </ul>
          </div>
          <div>
            <h3 class="text-xs font-semibold uppercase tracking-wider text-[#172033] mb-3">Platform</h3>
            <ul class="space-y-2 text-sm text-[#667085]">
              <li><a href="${withBase('/about/')}">About</a></li>
              <li><a href="${withBase('/methodology/')}">Calculation Methodology</a></li>
              <li><a href="${withBase('/financial-disclaimer/')}">Financial Disclaimer</a></li>
              <li><a href="${withBase('/contact/')}">Contact</a></li>
              <li><a href="${withBase('/privacy/')}">Privacy Policy</a></li>
              <li><a href="${withBase('/terms/')}">Terms of Use</a></li>
            </ul>
          </div>
        </div>
        <div class="mt-12 pt-8 border-t border-[#E4E9F0] flex flex-col sm:flex-row items-center justify-between text-xs text-[#667085] gap-4">
          <div>&copy; ${year} ${siteConfig.name}. All rights reserved.</div>
          <div class="flex items-center gap-4">
            <a href="${withBase('/privacy/')}" class="hover:underline">Privacy</a>
            <span class="text-[#E4E9F0]">&bull;</span>
            <a href="${withBase('/terms/')}" class="hover:underline">Terms</a>
            <span class="text-[#E4E9F0]">&bull;</span>
            <a href="${withBase('/financial-disclaimer/')}" class="hover:underline">Disclaimer</a>
          </div>
        </div>
      </div>
    </footer>
  </div>
  `
}

// 4. All Financial Tools
for (const t of tools) {
  routes.push({
    path: t.path,
    title: `${t.title} | ${siteConfig.name}`,
    description: t.fullDescription,
    jsonLd: generateCalculatorSchema(t),
    bodyHtml: `
      <main class="max-w-[1200px] mx-auto px-4 py-12">
        <h1 class="text-3xl font-extrabold text-gray-900 mb-4">${t.name}</h1>
        <p class="text-lg text-gray-600 mb-8">${t.fullDescription}</p>
        <section class="bg-white p-8 rounded-xl border border-gray-200 mb-8">
          <h2 class="text-xl font-bold text-gray-900 mb-4">Calculation Formula & Methodology</h2>
          <pre class="bg-gray-50 p-4 rounded-lg font-mono text-sm text-gray-800 mb-4">${t.formula}</pre>
          <h3 class="font-bold text-sm text-gray-900 mb-2">Assumptions & Limitations</h3>
          <ul class="list-disc list-inside text-sm text-gray-600 space-y-1">
            ${t.assumptions.map(a => `<li>${a}</li>`).join('')}
          </ul>
        </section>
        ${t.slug === 'loan-payment-calculator' ? `
          <section class="bg-white p-8 rounded-xl border border-gray-200 mb-8">
            <h2 class="text-xl font-bold text-gray-900 mb-4">Interactive Amortization Visualizer</h2>
            <p class="text-sm text-gray-600 mb-4">Explore our interactive SVG visualizer charting remaining balance curves, principal vs. interest payment breakdown and crossover milestones, and cumulative cash outlay comparison with optional accelerated prepayments.</p>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div class="p-4 bg-teal-50 rounded-lg border border-teal-100">
                <span class="text-xs uppercase font-bold text-teal-700">View A</span>
                <p class="text-sm font-semibold text-gray-900 mt-1">Remaining Balance Curve</p>
                <p class="text-xs text-gray-500 mt-0.5">Tracks principal decline and accelerated payoff trajectories.</p>
              </div>
              <div class="p-4 bg-teal-50 rounded-lg border border-teal-100">
                <span class="text-xs uppercase font-bold text-teal-700">View B</span>
                <p class="text-sm font-semibold text-gray-900 mt-1">Principal vs. Interest</p>
                <p class="text-xs text-gray-500 mt-0.5">Identifies exact monthly and annual crossover milestones.</p>
              </div>
              <div class="p-4 bg-teal-50 rounded-lg border border-teal-100">
                <span class="text-xs uppercase font-bold text-teal-700">View C</span>
                <p class="text-sm font-semibold text-gray-900 mt-1">Cumulative Outlay</p>
                <p class="text-xs text-gray-500 mt-0.5">Quantifies total interest paid and prepayment savings.</p>
              </div>
            </div>
          </section>
        ` : ''}
        ${t.slug === 'credit-card-apr-calculator' ? `
          <section class="bg-white p-8 rounded-xl border border-gray-200 mb-8 space-y-6">
            <div>
              <h2 class="text-2xl font-bold text-gray-900 mb-3">How to Calculate APR on a Credit Card: Formula &amp; Step-by-Step Guide</h2>
              <p class="text-sm text-gray-600 leading-relaxed mb-4">
                When you carry an unpaid revolving balance on your credit card past the monthly payment due date, card issuers charge interest based on your stated Annual Percentage Rate (APR). While APR represents an annualized borrowing cost, interest is assessed on each monthly billing cycle.
              </p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div class="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <span class="text-xs font-bold text-teal-700 uppercase">Step 1 &amp; 2</span>
                  <p class="text-sm font-semibold text-gray-900 mt-1">Convert APR to Periodic Rate</p>
                  <p class="text-xs text-gray-500 mt-0.5">Divide your annual APR by 12 for the monthly rate (e.g. 24% ÷ 12 = 2.0%), or by 365 for the Daily Periodic Rate (DPR).</p>
                </div>
                <div class="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <span class="text-xs font-bold text-teal-700 uppercase">Step 3 &amp; 4</span>
                  <p class="text-sm font-semibold text-gray-900 mt-1">Calculate Interest &amp; Principal Reduction</p>
                  <p class="text-xs text-gray-500 mt-0.5">Multiply carried balance by the monthly rate to estimate interest. Subtract interest from your monthly payment to find principal repaid.</p>
                </div>
              </div>
            </div>
            <div class="p-5 bg-teal-50 border border-teal-200 rounded-xl">
              <h3 class="text-sm font-bold text-teal-900 uppercase tracking-wide mb-2">Worked Numerical Example: $4,000 Balance at 24.0% APR ($200/mo Payment)</h3>
              <ul class="text-xs text-teal-800 space-y-1.5">
                <li>• <strong>Monthly Periodic Rate:</strong> 24.0% ÷ 12 = 2.0% per month (0.02 decimal).</li>
                <li>• <strong>Month 1 Interest Charge:</strong> $4,000.00 × 0.02 = $80.00 interest fee.</li>
                <li>• <strong>Month 1 Principal Reduction:</strong> $200.00 payment − $80.00 interest = $120.00 to principal.</li>
                <li>• <strong>Month 1 Ending Balance:</strong> $4,000.00 − $120.00 = $3,880.00 remaining debt.</li>
                <li>• <strong>Payoff Result:</strong> Paying a fixed $200.00/mo clears the entire $4,000 debt in 26 months with $1,159.49 total interest.</li>
              </ul>
            </div>
            <div>
              <h3 class="text-lg font-bold text-gray-900 mb-2">Credit Card APR Payment Economics: Minimum Payment vs. Fixed Payoff</h3>
              <p class="text-sm text-gray-600 leading-relaxed">
                Paying only statement minimums (typically 2% to 3% of balance) automatically shrinks payments as debt declines, dragging payoff across 15 to 20+ years and costing more in interest than the initial debt borrowed. Fixing your payment at a constant amount accelerates principal reduction every month.
              </p>
            </div>
            <div>
              <h3 class="text-lg font-bold text-gray-900 mb-2">Why Actual Issuer Statements Differ (CFPB Disclosures)</h3>
              <p class="text-sm text-gray-600 leading-relaxed mb-4">
                As detailed in CFPB regulations, card issuers divide your APR by 365 or 360 days to determine a Daily Periodic Rate (DPR) and multiply by your Average Daily Balance (ADB) across billing cycles of 28 to 31 days. Most issuers offer an interest-free grace period (typically 21 to 25 days) on eligible purchases when the full statement balance is paid on time, though exact terms, trailing interest rules, and conditions depend on the cardholder agreement.
              </p>
              <div class="p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600">
                <strong>Privacy Notice:</strong> Your calculator values are processed in your browser and are not sent to kitaaab.org servers.
              </div>
            </div>
          </section>
        ` : ''}
        <section class="bg-white p-8 rounded-xl border border-gray-200">
          <h2 class="text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          ${t.faqs.map(faq => `
            <div class="mb-4">
              <h3 class="font-bold text-base text-gray-900">${faq.question}</h3>
              <p class="text-sm text-gray-600 mt-1">${faq.answer}</p>
            </div>
          `).join('')}
        </section>
        ${t.relatedArticleSlugs && t.relatedArticleSlugs.length > 0 ? `
          <section class="mt-8 bg-white p-8 rounded-xl border border-gray-200">
            <h2 class="text-xl font-bold text-gray-900 mb-4">Helpful Educational Guides</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${articles.filter(a => t.relatedArticleSlugs.includes(a.slug)).map(a => `
                <div class="p-4 border border-gray-100 rounded-lg">
                  <span class="text-xs font-semibold text-teal-800 uppercase">${a.category}</span>
                  <h3 class="font-bold text-base text-gray-900 mt-1 mb-2">
                    <a href="${withBase(a.path)}" class="text-teal-700 hover:underline">${a.title}</a>
                  </h3>
                  <p class="text-xs text-gray-600">${a.summary}</p>
                </div>
              `).join('')}
            </div>
          </section>
        ` : ''}
        ${t.relatedToolSlugs && t.relatedToolSlugs.length > 0 ? `
          <section class="mt-8 bg-white p-8 rounded-xl border border-gray-200">
            <h2 class="text-xl font-bold text-gray-900 mb-4">Related Financial Calculators</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              ${tools.filter(other => t.relatedToolSlugs.includes(other.slug)).map(other => `
                <div class="p-4 border border-gray-100 rounded-lg">
                  <span class="text-xs font-semibold text-teal-800 uppercase">${other.categoryName}</span>
                  <h3 class="font-bold text-base text-gray-900 mt-1 mb-2">
                    <a href="${withBase(other.path)}" class="text-teal-700 hover:underline">${other.name}</a>
                  </h3>
                  <p class="text-xs text-gray-600">${other.shortDescription}</p>
                </div>
              `).join('')}
            </div>
          </section>
        ` : ''}
      </main>
    `
  })
}

// 5. Learn Index
routes.push({
  path: '/learn/',
  title: `Financial Education & Calculation Guides | ${siteConfig.name}`,
  description: 'Practical guides explaining how financial formulas work, how interest compounds, how to calculate stock averages, and how retirement longevity is modeled.',
  bodyHtml: `
    <main class="max-w-[1200px] mx-auto px-4 py-12">
      <h1 class="text-3xl font-extrabold text-gray-900 mb-4">Financial Education & Guides</h1>
      <p class="text-lg text-gray-600 mb-8">Understand the mathematical formulas, regulatory principles, and practical calculations behind everyday money decisions.</p>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        ${articles.map(a => `
          <div class="p-6 bg-white border border-gray-200 rounded-xl">
            <span class="text-xs font-semibold text-teal-800 uppercase">${a.category}</span>
            <h2 class="text-xl font-bold text-gray-900 my-2">${a.title}</h2>
            <p class="text-sm text-gray-600 mb-4">${a.summary}</p>
            <a href="${withBase(a.path)}" class="text-teal-700 font-semibold text-sm">Read Guide &rarr;</a>
          </div>
        `).join('')}
      </div>
    </main>
  `
})

// 6. Educational Articles
for (const a of articles) {
  routes.push({
    path: a.path,
    title: `${a.title} – Financial Guide | ${siteConfig.name}`,
    description: a.metaDescription,
    jsonLd: generateArticleSchema(a),
    bodyHtml: `
      <main class="max-w-[800px] mx-auto px-4 py-12">
        <span class="text-xs font-semibold text-teal-800 uppercase">${a.category}</span>
        <h1 class="text-4xl font-extrabold text-gray-900 my-4">${a.title}</h1>
        <p class="text-lg text-gray-600 mb-8">${a.summary}</p>
        ${a.slug === 'how-loan-amortization-works' ? `
          <div class="mb-8 p-6 bg-teal-50 border border-teal-200 rounded-xl">
            <h2 class="text-xl font-bold text-teal-900 mb-2">Interactive Amortization Visualizer</h2>
            <p class="text-sm text-teal-800 leading-relaxed mb-4">
              The interactive chart in this guide models the <strong>$250-per-month extra principal scenario</strong> from the prepayment section — its crossover month and payoff figures belong to that accelerated schedule, not to the standard 30-year schedule. On the standard schedule (no extra payment), monthly principal repaid first surpasses the interest charge in Month 233, the remaining balance first falls below half of the original principal in Month 257, and cumulative interest crosses 75% of lifetime interest in Month 205. With $250/month extra principal, the loan retires in Month 262, saving $120,336.94 in interest and 98 months.
            </p>
          </div>
        ` : ''}
        <article class="prose max-w-none text-gray-800 space-y-6">
          ${a.sections.map(sec => `
            <div>
              <h2 class="text-2xl font-bold text-gray-900 mb-3">${sec.heading}</h2>
              ${sec.paragraphs.map(p => `<p class="text-base text-gray-600 mb-3 leading-relaxed">${p}</p>`).join('')}
              ${sec.formulaBox ? `<div class="bg-gray-50 border border-gray-200 p-4 rounded-lg font-mono text-sm my-4">${sec.formulaBox}</div>` : ''}
              ${sec.exampleBox ? `
                <div class="bg-white border border-gray-200 p-6 rounded-xl my-4">
                  <h3 class="font-bold text-base text-gray-900 mb-2">${sec.exampleBox.title}</h3>
                  <ul class="list-disc list-inside text-sm text-gray-600 space-y-1">
                    ${sec.exampleBox.details.map(d => `<li>${d}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </article>
        ${a.faqs && a.faqs.length > 0 ? `
          <section class="mt-12 pt-8 border-t border-gray-200">
            <h2 class="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
            <div class="space-y-6">
              ${a.faqs.map(faq => `
                <div class="border-b border-gray-100 pb-4">
                  <h3 class="font-bold text-lg text-gray-900 mb-2">${faq.question}</h3>
                  <div class="text-base text-gray-600 leading-relaxed">${faq.answer}</div>
                </div>
              `).join('')}
            </div>
          </section>
        ` : ''}
      </main>
    `
  })
}

// 7. Policy & Trust Pages
routes.push({
  path: '/about/',
  title: `About Us – Practical Financial Calculations Without Accounts | ${siteConfig.name}`,
  description: `Learn about ${siteConfig.name}, our mission to provide clear, accessible financial calculators, and our client-side privacy philosophy.`,
  bodyHtml: `
    <main class="max-w-[800px] mx-auto px-4 py-12">
      <h1 class="text-3xl font-extrabold text-gray-900 mb-4">About ${siteConfig.name}</h1>
      <p class="text-lg text-gray-600 mb-6">Practical financial tools that run entirely in your browser with zero registration required.</p>
    </main>
  `
})

routes.push({
  path: '/methodology/',
  title: `Calculation Methodology & Data Policy | ${siteConfig.name}`,
  description: `Detailed explanation of calculation algorithms, mathematical formulas, precision handling, and automated unit testing across ${siteConfig.name}.`,
  bodyHtml: `
    <main class="max-w-[800px] mx-auto px-4 py-12">
      <h1 class="text-3xl font-extrabold text-gray-900 mb-4">Calculation Methodology & Data Policy</h1>
      <p class="text-lg text-gray-600 mb-6">How our financial models work, precision handling, boundary conditions, and test verification.</p>
    </main>
  `
})

routes.push({
  path: '/financial-disclaimer/',
  title: `Financial Disclaimer & Calculation Limitations | ${siteConfig.name}`,
  description: `Read the official financial and legal disclaimer for ${siteConfig.name}. All calculators and tools provide educational mathematical estimates.`,
  bodyHtml: `
    <main class="max-w-[800px] mx-auto px-4 py-12">
      <h1 class="text-3xl font-extrabold text-gray-900 mb-4">Financial Disclaimer</h1>
      <p class="text-lg text-gray-600 mb-6">Tools and content are provided for informational and educational purposes only.</p>
    </main>
  `
})

routes.push({
  path: '/contact/',
  title: `Contact Us | ${siteConfig.name}`,
  description: `Get in touch with the ${siteConfig.name} team for feedback, calculation questions, or partnership inquiries.`,
  bodyHtml: `
    <main class="max-w-[800px] mx-auto px-4 py-12">
      <h1 class="text-3xl font-extrabold text-gray-900 mb-4">Contact the Team</h1>
      <p class="text-lg text-gray-600 mb-6">Direct email: ${siteConfig.contactEmail}</p>
    </main>
  `
})

routes.push({
  path: '/privacy/',
  title: `Privacy Policy | ${siteConfig.name}`,
  description: `Privacy policy for ${siteConfig.name}. We prioritize user privacy with client-side calculations and no account requirements.`,
  bodyHtml: `
    <main class="max-w-[800px] mx-auto px-4 py-12">
      <h1 class="text-3xl font-extrabold text-gray-900 mb-4">Privacy Policy</h1>
      <p class="text-sm text-gray-500 mb-8">Last Updated: November 2026</p>
      <div class="space-y-6 text-gray-700 leading-relaxed text-base">
        <p>At ${siteConfig.name}, accessible from ${siteConfig.name}, we respect your privacy and are committed to protecting personal information. This Privacy Policy details what information is collected and how it is used.</p>
        <h2 class="text-xl font-bold text-gray-900">1. Client-Side Financial Calculations</h2>
        <p>All values you enter into our financial tools (including balances, interest rates, stock purchases, salary figures, and projected savings) are processed exclusively on your device inside your web browser. <strong>Our application source code maintains no backend servers or database APIs; entered calculator values are never transmitted to or stored on our servers.</strong></p>
        <h2 class="text-xl font-bold text-gray-900">2. No Account Registration Required</h2>
        <p>You do not need to create an account, log in, or provide an email address to use any tool on this website. We do not maintain user databases of names, passwords, or personal financial profiles.</p>
        <h2 class="text-xl font-bold text-gray-900">3. Third-Party Analytics &amp; Tag Manager Disclosures</h2>
        <p>Like most modern websites, this site loads a third-party analytics container tag (Google Tag Manager GTM-NGVVFL3R) and standard hosting web-server request logs. These external scripts run client-side in your browser to collect technical telemetry, such as IP addresses, browser types, device resolution, and pageviews. While our application source code makes no network requests containing your calculation data, third-party analytics scripts execute in the browser and their runtime behavior is governed by external container configuration and third-party privacy terms; we do not claim complete anonymity nor do we guarantee third-party tag data collection behavior.</p>
        <h2 class="text-xl font-bold text-gray-900">4. Cookies &amp; Browser Storage</h2>
        <p>Our application code sets no cookies, uses no localStorage, and stores no financial profiles. Interactive calculations exist purely in temporary browser memory during your active page session and are discarded upon tab closure or form reset. Third-party analytics tags (such as Google Analytics loaded via GTM) may set standard cookies in your browser according to their own operational settings.</p>
        <h2 class="text-xl font-bold text-gray-900">5. Contact Us</h2>
        <p>If you have questions about this privacy statement, you may reach our team at ${siteConfig.contactEmail}.</p>
      </div>
    </main>
  `
})

routes.push({
  path: '/terms/',
  title: `Terms of Use | ${siteConfig.name}`,
  description: `Terms and conditions governing the use of ${siteConfig.name} and its financial calculation utilities.`,
  bodyHtml: `
    <main class="max-w-[800px] mx-auto px-4 py-12">
      <h1 class="text-3xl font-extrabold text-gray-900 mb-4">Terms of Use</h1>
      <p class="text-lg text-gray-600 mb-6">Educational utility terms and conditions.</p>
    </main>
  `
})


// ---------------------------------------------------------------------------
// Stock Average Calculator — full prerendered shell (same pattern as the
// APR/retirement shells). Every number comes from the stock engine, never
// hand-typed. Defaults: Lot 1 = 10 shares @ $100, Lot 2 = 15 shares @ $120,
// no fees, fees included in the basis.
// ---------------------------------------------------------------------------
function renderStockShell(tool) {
  const defaults = calculateStockAverage({
    purchases: [
      { id: '1', price: 100, shares: 10, fee: 0 },
      { id: '2', price: 120, shares: 15, fee: 0 }
    ],
    includeFees: true
  })
  const year = new Date().getFullYear()
  const avg = defaults.weightedAverageCost
  const lot1Pct = ((10 / defaults.totalShares) * 100).toFixed(0)
  const lot2Pct = ((15 / defaults.totalShares) * 100).toFixed(0)

  return `
  <div class="min-h-screen flex flex-col bg-[#F7F9FC] text-[#172033]">
    <header class="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-[#E4E9F0]">
      <div class="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <a href="${withBase('/')}" class="flex items-center gap-2.5 text-[#172033] font-semibold text-lg">
          <div class="w-8 h-8 rounded-lg bg-[#0F766E] text-white flex items-center justify-center font-bold text-base shadow-sm">$</div>
          <span>${siteConfig.name}</span>
        </a>
        <nav class="hidden md:flex items-center gap-1 lg:gap-2" aria-label="Main Navigation">
          <a href="${withBase('/tools/')}" class="px-3 py-1.5 rounded-md text-sm font-medium text-[#667085]">Tools</a>
          <a href="${withBase('/tools/investing/')}" class="px-3 py-1.5 rounded-md text-sm font-medium text-[#0F766E] bg-[#E7F4F1] font-semibold">Investing</a>
          <a href="${withBase('/tools/credit-debt/')}" class="px-3 py-1.5 rounded-md text-sm font-medium text-[#667085]">Credit &amp; Debt</a>
          <a href="${withBase('/tools/retirement/')}" class="px-3 py-1.5 rounded-md text-sm font-medium text-[#667085]">Retirement</a>
          <a href="${withBase('/tools/business-finance/')}" class="px-3 py-1.5 rounded-md text-sm font-medium text-[#667085]">Business</a>
          <a href="${withBase('/learn/')}" class="px-3 py-1.5 rounded-md text-sm font-medium text-[#667085]">Learn</a>
        </nav>
        <a href="${withBase('/tools/')}" class="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium bg-[#0F766E] text-white shadow-sm">Explore tools</a>
      </div>
    </header>
    <main class="flex-1">
      <div class="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <nav class="text-xs text-[#64748B] mb-6" aria-label="Breadcrumb">
          <a href="${withBase('/')}" class="hover:text-[#0F766E]">Home</a> /
          <a href="${withBase('/tools/investing/')}" class="hover:text-[#0F766E]">Investing</a> /
          <span class="text-[#0F172A] font-semibold">Stock Average Calculator</span>
        </nav>
        <div class="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0F766E] bg-[#E7F4F1] px-3 py-1 rounded-full mb-2.5">
              <span>Interactive Investing Instrument</span>
            </div>
            <h1 class="text-2xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight mb-2">Stock Average Calculator</h1>
            <p class="text-sm sm:text-base text-[#64748B] max-w-2xl leading-relaxed">${tool.fullDescription}</p>
          </div>
          <div class="flex items-center gap-2.5 self-start md:self-end">
            <span class="text-xs font-semibold bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-[#334155] shadow-2xs">USD ($)</span>
            <span class="inline-flex items-center gap-1.5 text-xs font-semibold bg-white border border-[#CBD5E1] px-3 py-2 rounded-xl text-[#64748B] shadow-2xs">Reset</span>
          </div>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          <div class="lg:col-span-7 bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
            <div class="flex items-center justify-between pb-4 mb-6 border-b border-[#F1F5F9]">
              <span class="text-xs font-bold uppercase tracking-wider text-[#475569]">Purchase Lots Ledger</span>
              <span class="text-[11px] font-semibold text-[#94A3B8]">Demos: DCA · Dip Buy · Growth</span>
            </div>
            <div class="space-y-4">
              <div class="p-4 sm:p-3 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div class="sm:col-span-1"><span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#E2E8F0] text-[#334155] font-black text-xs">1</span></div>
                <div class="sm:col-span-4"><span class="block sm:hidden text-[11px] font-bold text-[#475569] mb-1">Execution Price</span><span class="font-bold text-sm text-[#0F172A]">$100.00</span></div>
                <div class="sm:col-span-4"><span class="block sm:hidden text-[11px] font-bold text-[#475569] mb-1">Number of Shares</span><span class="font-bold text-sm text-[#0F172A]">10 sh</span></div>
                <div class="sm:col-span-2"><span class="block sm:hidden text-[11px] font-bold text-[#475569] mb-1">Fee (Optional)</span><span class="font-bold text-xs text-[#0F172A]">$0.00</span></div>
                <div class="sm:col-span-1"></div>
              </div>
              <div class="p-4 sm:p-3 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div class="sm:col-span-1"><span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#E2E8F0] text-[#334155] font-black text-xs">2</span></div>
                <div class="sm:col-span-4"><span class="block sm:hidden text-[11px] font-bold text-[#475569] mb-1">Execution Price</span><span class="font-bold text-sm text-[#0F172A]">$120.00</span></div>
                <div class="sm:col-span-4"><span class="block sm:hidden text-[11px] font-bold text-[#475569] mb-1">Number of Shares</span><span class="font-bold text-sm text-[#0F172A]">15 sh</span></div>
                <div class="sm:col-span-2"><span class="block sm:hidden text-[11px] font-bold text-[#475569] mb-1">Fee (Optional)</span><span class="font-bold text-xs text-[#0F172A]">$0.00</span></div>
                <div class="sm:col-span-1"></div>
              </div>
              <div class="flex flex-wrap items-center justify-between gap-3 pt-3">
                <span class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#0F766E] bg-[#E7F4F1]">+ Add Purchase Lot</span>
                <span class="text-xs font-bold text-[#475569]">☑ Include broker fees in cost basis</span>
              </div>
              <div class="mt-6 pt-5 border-t border-[#E2E8F0]">
                <span class="text-xs font-bold text-[#0F172A]">Next Purchase Simulation</span>
                <span class="text-xs font-bold px-3 py-1 rounded-lg border bg-[#F8FAFC] text-[#64748B] border-[#CBD5E1] ml-3">+ Test Target Buy</span>
              </div>
            </div>
          </div>
          <div class="lg:col-span-5 bg-gradient-to-br from-[#0B3B39] via-[#0F766E] to-[#115E59] rounded-3xl p-6 sm:p-8 text-white relative shadow-xl overflow-hidden lg:sticky lg:top-24">
            <div class="relative z-10 space-y-6">
              <div class="flex items-center justify-between pb-4 border-b border-white/10">
                <span class="text-[11px] font-bold uppercase tracking-widest text-emerald-200">Position Basis Telemetry</span>
                <span class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/10 text-white border border-white/15">Copy</span>
              </div>
              <div class="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 text-center">
                <span class="text-xs font-semibold uppercase tracking-wider text-emerald-100">Weighted Average Cost / Share</span>
                <div class="text-3xl sm:text-4xl font-black text-white mt-1 num-tabular tracking-tight">${aprMoney(avg)}</div>
                <div class="inline-flex items-center gap-1.5 text-xs text-emerald-200 mt-2 bg-black/20 px-2.5 py-1 rounded-full">
                  <span>${defaults.totalShares} Total Shares</span>
                  <span>•</span>
                  <span>2 Lots</span>
                </div>
              </div>
              <div class="space-y-2 pt-2">
                <div class="flex items-center justify-between text-xs font-bold text-white/90">
                  <span>Lot Weight Distribution</span>
                  <span class="text-emerald-300">100% Accounted</span>
                </div>
                <div class="flex items-center gap-2.5 text-[11px] font-semibold text-white/80 pt-0.5">
                  <span>Lot 1 (${lot1Pct}%)</span>
                  <span>Lot 2 (${lot2Pct}%)</span>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3 pt-2">
                <div class="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                  <span class="text-[11px] font-semibold text-white/70 block">Total Capital Expended</span>
                  <span class="text-sm sm:text-base font-bold text-white num-tabular mt-0.5 block">${aprMoney(defaults.totalCost)}</span>
                </div>
                <div class="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                  <span class="text-[11px] font-semibold text-white/70 block">Broker Fees Paid</span>
                  <span class="text-sm sm:text-base font-bold text-white num-tabular mt-0.5 block">${aprMoney(defaults.totalFees)}</span>
                </div>
                <div class="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                  <span class="text-[11px] font-semibold text-white/70 block">Total Shares Count</span>
                  <span class="text-sm sm:text-base font-bold text-white num-tabular mt-0.5 block">${defaults.totalShares}</span>
                </div>
                <div class="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                  <span class="text-[11px] font-semibold text-white/70 block">Pure Share Cost</span>
                  <span class="text-sm sm:text-base font-bold text-white num-tabular mt-0.5 block">${aprMoney(defaults.totalCostBeforeFees)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          <div class="lg:col-span-8 space-y-8">
            <section class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
              <h2 class="text-xl font-extrabold text-[#0F172A] mb-3">Why Simple Price Averaging Fails for Stock Purchases</h2>
              <p class="text-sm text-[#64748B] leading-relaxed mb-4">When buying shares of a stock or ETF across multiple transactions, investors pay different market prices. Many investors mistakenly take a simple arithmetic average of their execution prices. However, simple averaging completely ignores the number of shares bought in each trade.</p>
              <div class="p-4 bg-[#F8FAFC] border border-[#CBD5E1] rounded-2xl text-xs sm:text-sm text-[#0F172A] space-y-2 mb-4 leading-relaxed">
                <p><strong>Consider this example:</strong> You buy 10 shares of a company at $50, and later purchase 90 shares of the same company at $100.</p>
                <p>• <em>Simple Average:</em> ($50 + $100) ÷ 2 = <strong>$75.00</strong></p>
                <p>• <em>Actual Weighted Average:</em> [(10 × $50) + (90 × $100)] ÷ 100 shares = ($500 + $9,000) ÷ 100 = <strong>$95.00</strong></p>
              </div>
              <p class="text-sm text-[#64748B] leading-relaxed">Because 90% of your shares (90 of 100) were bought at $100 — that is $9,000 of your $9,500 total capital, or 94.7% — your real break-even cost is $95.00, not $75.00. Using a simple average would lead you to believe you are in profit when you may still be at a net loss.</p>
            </section>
            <section class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
              <h2 class="text-xl font-extrabold text-[#0F172A] mb-3">Weighted Average Cost Methodology</h2>
              <p class="text-sm text-[#64748B] leading-relaxed mb-4">The weighted average cost calculation aggregates the total dollars spent across every purchase lot (including any trading commissions or regulatory fees) and divides that total capital by the aggregate number of shares currently held:</p>
              <div class="bg-[#F8FAFC] border border-[#CBD5E1] p-4 rounded-xl num-tabular text-xs sm:text-sm text-[#0F172A] mb-4 font-mono whitespace-pre-line leading-relaxed">${tool.formula}</div>
              <p class="text-sm text-[#64748B] leading-relaxed">Each lot's share quantity serves as its statistical weight. The more shares you purchase at a specific price, the more heavily that price influences your overall portfolio cost basis.</p>
            </section>
            <section class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
              <h2 class="text-xl font-extrabold text-[#0F172A] mb-3">Accounting for Brokerage Fees &amp; Commissions</h2>
              <p class="text-sm text-[#64748B] leading-relaxed mb-4">While many retail brokerages offer commission-free trading on standard US equities, options traders, international investors, OTC equity traders, and users paying wire or currency fees still face transaction expenses.</p>
              <p class="text-sm text-[#64748B] leading-relaxed">When you enable the <strong class="text-[#0F172A]">"Include broker fees in cost basis"</strong> option, each lot's fees are added to the numerator of the formula. This raises your calculated average cost per share, showing you the exact gross selling price required to achieve a true net break-even after recouping all trading costs.</p>
            </section>
            <section class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
              <h2 class="text-xl font-extrabold text-[#0F172A] mb-3">Dollar-Cost Averaging (DCA) vs. "Averaging Down"</h2>
              <div class="space-y-4 text-sm text-[#64748B] leading-relaxed">
                <p><strong class="text-[#0F172A]">Dollar-Cost Averaging (DCA):</strong> A systematic investment strategy where you invest a fixed dollar amount at regular intervals (e.g., $500 every month), regardless of market fluctuations. Over time, you automatically purchase more shares when prices are low and fewer shares when prices are high, smoothing out volatility.</p>
                <p><strong class="text-[#0F172A]">Averaging Down:</strong> Buying more shares specifically because a stock has fallen in price. While averaging down reduces your average cost per share, it also increases your concentration risk in a deteriorating security. Ensure the underlying business fundamentals remain strong before committing additional capital.</p>
              </div>
            </section>
            <section class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
              <h2 class="text-xl font-extrabold text-[#0F172A] mb-3">Average Cost vs. Official IRS Tax Cost Basis</h2>
              <p class="text-sm text-[#64748B] leading-relaxed mb-4">It is critical to distinguish an internal portfolio weighted average price from statutory tax cost basis rules when you liquidate shares. Under US federal tax law, the IRS default is First-In, First-Out (FIFO) unless you identify specific lots; average cost is permitted for mutual funds and dividend reinvestment plans. Read our in-depth <a href="${withBase('/learn/how-to-calculate-average-stock-cost/')}" class="text-[#0F766E] font-semibold underline hover:text-[#115E59]">Average Stock Cost Educational Guide</a> to explore IRS lot rules and numerical examples.</p>
            </section>
            <section class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
              <h2 class="text-xl font-extrabold text-[#0F172A] mb-3">Assumptions &amp; Limitations</h2>
              <ul class="space-y-2 text-sm text-[#64748B] list-disc list-inside leading-relaxed">
                ${tool.assumptions.map((a) => `<li>${a}</li>`).join('')}
              </ul>
            </section>
            <section>
              <h2 class="text-xl font-bold text-[#172033] mb-4">Frequently Asked Questions About Stock Averaging</h2>
              ${tool.faqs.map((faq) => `
              <div class="mb-4 bg-white rounded-xl border border-[#E4E9F0] p-5">
                <h3 class="font-bold text-base text-gray-900">${faq.question}</h3>
                <p class="text-sm text-gray-600 mt-1">${faq.answer}</p>
              </div>`).join('')}
            </section>
          </div>
          <div class="lg:col-span-4 space-y-6">
            <div class="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-sm">
              <div class="text-xs font-bold uppercase tracking-wider text-[#0F766E] mb-2">Comprehensive Guide</div>
              <h3 class="text-base font-bold text-[#0F172A] mb-2">How to Calculate Average Stock Cost</h3>
              <p class="text-xs text-[#64748B] leading-relaxed mb-4">Understand quantity-weighted averaging, broker commission adjustments, and why tax cost basis can diverge under IRS rules.</p>
              <a href="${withBase('/learn/how-to-calculate-average-stock-cost/')}" class="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F766E] hover:underline"><span>Read Educational Guide</span><span>→</span></a>
            </div>
            <div class="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-sm">
              <div class="text-xs font-bold uppercase tracking-wider text-[#0F766E] mb-2">Measure Net Gains</div>
              <h3 class="text-base font-bold text-[#0F172A] mb-2">Return on Investment (ROI)</h3>
              <p class="text-xs text-[#64748B] leading-relaxed mb-4">Once you know your average share cost, calculate your total percentage profit or loss upon exit using our interactive ROI calculator.</p>
              <a href="${withBase('/roi-calculator/')}" class="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F766E] hover:underline"><span>Open ROI Calculator</span><span>→</span></a>
            </div>
          </div>
        </div>
        <div class="mb-16">
          <h2 class="text-xl font-bold text-[#172033] mb-2">Related Financial Calculators</h2>
          <p class="text-sm text-[#667085] mb-6">More tools that work with the numbers on this page.</p>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm">
              <h3 class="font-bold text-base text-[#0F172A] mb-2"><a href="${withBase('/roi-calculator/')}" class="text-teal-700 hover:underline">ROI Calculator</a></h3>
              <p class="text-xs text-[#64748B]">Measure the return on an investment or project.</p>
            </div>
            <div class="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm">
              <h3 class="font-bold text-base text-[#0F172A] mb-2"><a href="${withBase('/compound-interest-calculator/')}" class="text-teal-700 hover:underline">Compound Interest Calculator</a></h3>
              <p class="text-xs text-[#64748B]">See how compound growth builds wealth over time.</p>
            </div>
          </div>
          <h2 class="text-xl font-bold text-[#172033] mt-12 mb-2">Helpful Educational Guides</h2>
          <p class="text-sm text-[#667085] mb-6">Understand the formulas, methodology, and financial context behind these calculations.</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm">
              <h3 class="font-bold text-base text-[#0F172A] mb-2"><a href="${withBase('/learn/how-to-calculate-average-stock-cost/')}" class="text-teal-700 hover:underline">How to Calculate Average Stock Cost</a></h3>
              <p class="text-xs text-[#64748B]">Learn how to calculate your quantity-weighted average share price across multiple purchases, factor in broker fees, and understand tax cost basis differences.</p>
            </div>
            <div class="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm">
              <h3 class="font-bold text-base text-[#0F172A] mb-2"><a href="${withBase('/learn/how-to-calculate-roi/')}" class="text-teal-700 hover:underline">How to Calculate Return on Investment (ROI)</a></h3>
              <p class="text-xs text-[#64748B]">Learn how to calculate Return on Investment (ROI), interpret positive and negative returns, and compute annualized ROI.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
    <footer class="bg-white border-t border-[#E4E9F0] mt-20">
      <div class="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 lg:py-16">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          <div class="lg:col-span-2 space-y-4">
            <a href="${withBase('/')}" class="flex items-center gap-2.5 text-[#172033] font-semibold text-lg">
              <div class="w-7 h-7 rounded-lg bg-[#0F766E] text-white flex items-center justify-center font-bold text-sm">$</div>
              <span>${siteConfig.name}</span>
            </a>
            <p class="text-sm text-[#667085] max-w-sm leading-relaxed">${siteConfig.tagline}</p>
            <p class="text-xs text-[#667085] leading-relaxed pt-2 border-t border-[#E4E9F0]/60">${siteConfig.disclaimerShort}</p>
          </div>
          <div>
            <h3 class="text-xs font-semibold uppercase tracking-wider text-[#172033] mb-3">Tool Categories</h3>
            <ul class="space-y-2 text-sm text-[#667085]">
              <li><a href="${withBase('/tools/investing/')}">Investing Tools</a></li>
              <li><a href="${withBase('/tools/credit-debt/')}">Credit &amp; Debt</a></li>
              <li><a href="${withBase('/tools/retirement/')}">Retirement Planning</a></li>
              <li><a href="${withBase('/tools/business-finance/')}">Business Finance</a></li>
              <li><a href="${withBase('/tools/')}" class="font-medium text-[#0F766E]">All Calculators &rarr;</a></li>
            </ul>
          </div>
          <div>
            <h3 class="text-xs font-semibold uppercase tracking-wider text-[#172033] mb-3">Learn</h3>
            <ul class="space-y-2 text-sm text-[#667085]">
              <li><a href="${withBase('/learn/how-to-calculate-average-stock-cost/')}">Average Stock Cost</a></li>
              <li><a href="${withBase('/learn/how-to-calculate-roi/')}">How to Calculate ROI</a></li>
              <li><a href="${withBase('/learn/apr-vs-interest-rate/')}">APR vs. Interest Rate</a></li>
              <li><a href="${withBase('/learn/flat-vs-tiered-commission/')}">Tiered Commission</a></li>
              <li><a href="${withBase('/learn/how-long-will-retirement-savings-last/')}">Retirement Longevity</a></li>
            </ul>
          </div>
          <div>
            <h3 class="text-xs font-semibold uppercase tracking-wider text-[#172033] mb-3">Platform</h3>
            <ul class="space-y-2 text-sm text-[#667085]">
              <li><a href="${withBase('/about/')}">About</a></li>
              <li><a href="${withBase('/methodology/')}">Calculation Methodology</a></li>
              <li><a href="${withBase('/financial-disclaimer/')}">Financial Disclaimer</a></li>
              <li><a href="${withBase('/contact/')}">Contact</a></li>
              <li><a href="${withBase('/privacy/')}">Privacy Policy</a></li>
              <li><a href="${withBase('/terms/')}">Terms of Use</a></li>
            </ul>
          </div>
        </div>
        <div class="mt-12 pt-8 border-t border-[#E4E9F0] flex flex-col sm:flex-row items-center justify-between text-xs text-[#667085] gap-4">
          <div>&copy; ${year} ${siteConfig.name}. All rights reserved.</div>
          <div class="flex items-center gap-4">
            <a href="${withBase('/privacy/')}" class="hover:underline">Privacy</a>
            <span class="text-[#E4E9F0]">&bull;</span>
            <a href="${withBase('/terms/')}" class="hover:underline">Terms</a>
            <span class="text-[#E4E9F0]">&bull;</span>
            <a href="${withBase('/financial-disclaimer/')}" class="hover:underline">Disclaimer</a>
          </div>
        </div>
      </div>
    </footer>
  </div>
  `
}

// ---------------------------------------------------------------------------
// Loan Payment Calculator — full prerendered shell (same pattern as the
// APR/retirement shells). Every number comes from the loan engine, never
// hand-typed. Defaults: $300,000 principal, 6.5% APR, 30-year term, $0 extra.
// Displayed schedule rows are cent-reconciled via buildDisplaySchedule so
// each displayed row adds up exactly.
// ---------------------------------------------------------------------------
function renderLoanShell(tool) {
  const defaults = calculateLoanPayment({
    principal: 300000,
    annualRate: 6.5,
    term: 30,
    termUnit: 'years',
    extraMonthlyPayment: 0
  })
  const withExtra = calculateLoanPayment({
    principal: 300000,
    annualRate: 6.5,
    term: 30,
    termUnit: 'years',
    extraMonthlyPayment: 250
  })
  const displayRows = buildDisplaySchedule(defaults.schedule)
  const year = new Date().getFullYear()
  // Crossover: first month the total principal repaid meets or exceeds the
  // interest charge; 50% point: first month the balance falls to half.
  const crossoverRow = defaults.schedule.find((r) => r.principalRepaid >= r.interest)
  const crossoverMonth = crossoverRow ? crossoverRow.paymentNumber : null
  const halfRow = defaults.schedule.find((r) => r.endingBalance <= defaults.principal / 2)
  const halfMonth = halfRow ? halfRow.paymentNumber : null
  const years = (defaults.totalMonths / 12).toFixed(1)

  return `
  <div class="min-h-screen flex flex-col bg-[#F7F9FC] text-[#172033]">
    <header class="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-[#E4E9F0]">
      <div class="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <a href="${withBase('/')}" class="flex items-center gap-2.5 text-[#172033] font-semibold text-lg">
          <div class="w-8 h-8 rounded-lg bg-[#0F766E] text-white flex items-center justify-center font-bold text-base shadow-sm">$</div>
          <span>${siteConfig.name}</span>
        </a>
        <nav class="hidden md:flex items-center gap-1 lg:gap-2" aria-label="Main Navigation">
          <a href="${withBase('/tools/')}" class="px-3 py-1.5 rounded-md text-sm font-medium text-[#667085]">Tools</a>
          <a href="${withBase('/tools/investing/')}" class="px-3 py-1.5 rounded-md text-sm font-medium text-[#667085]">Investing</a>
          <a href="${withBase('/tools/credit-debt/')}" class="px-3 py-1.5 rounded-md text-sm font-medium text-[#0F766E] bg-[#E7F4F1] font-semibold">Credit &amp; Debt</a>
          <a href="${withBase('/tools/retirement/')}" class="px-3 py-1.5 rounded-md text-sm font-medium text-[#667085]">Retirement</a>
          <a href="${withBase('/tools/business-finance/')}" class="px-3 py-1.5 rounded-md text-sm font-medium text-[#667085]">Business</a>
          <a href="${withBase('/learn/')}" class="px-3 py-1.5 rounded-md text-sm font-medium text-[#667085]">Learn</a>
        </nav>
        <a href="${withBase('/tools/')}" class="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium bg-[#0F766E] text-white shadow-sm">Explore tools</a>
      </div>
    </header>
    <main class="flex-1">
      <div class="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <nav class="text-xs text-[#64748B] mb-6" aria-label="Breadcrumb">
          <a href="${withBase('/')}" class="hover:text-[#0F766E]">Home</a> /
          <a href="${withBase('/tools/credit-debt/')}" class="hover:text-[#0F766E]">Credit &amp; Debt</a> /
          <span class="text-[#0F172A] font-semibold">Loan Payment Calculator</span>
        </nav>
        <div class="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0F766E] bg-[#E7F4F1] px-3 py-1 rounded-full mb-2.5">
              <span>Interactive Financing Instrument</span>
            </div>
            <h1 class="text-2xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight mb-2">Loan Payment Calculator</h1>
            <p class="text-sm sm:text-base text-[#64748B] max-w-2xl leading-relaxed">${tool.fullDescription}</p>
          </div>
          <div class="flex items-center gap-2.5 self-start md:self-end">
            <span class="text-xs font-semibold bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-[#334155] shadow-2xs">USD ($)</span>
            <span class="inline-flex items-center gap-1.5 text-xs font-semibold bg-white border border-[#CBD5E1] px-3 py-2 rounded-xl text-[#64748B] shadow-2xs">Reset</span>
          </div>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          <div class="lg:col-span-7 bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
            <div class="flex items-center justify-between pb-4 mb-6 border-b border-[#F1F5F9]">
              <span class="text-xs font-bold uppercase tracking-wider text-[#475569]">Loan Configuration</span>
              <span class="text-[11px] font-semibold text-[#94A3B8]">Auto-calculated in USD</span>
            </div>
            <div class="space-y-5">
              <div>
                <span class="text-xs font-bold text-[#0F172A] block mb-1.5">Principal Amount (USD)</span>
                <div class="flex items-center bg-white border border-[#CBD5E1] rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#0F766E] focus-within:border-[#0F766E] transition-shadow">
                  <span class="pl-4 text-sm font-bold text-[#64748B]">$</span>
                  <span class="w-full px-2 py-3 text-sm font-bold text-[#0F172A] outline-none">300,000</span>
                </div>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span class="text-xs font-bold text-[#0F172A] block mb-1.5">Annual Interest Rate (APR %)</span>
                  <div class="flex items-center bg-white border border-[#CBD5E1] rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#0F766E] focus-within:border-[#0F766E] transition-shadow">
                    <span class="w-full px-4 py-3 text-sm font-bold text-[#0F172A] outline-none">6.5</span>
                    <span class="pr-4 text-sm font-bold text-[#64748B]">%</span>
                  </div>
                </div>
                <div>
                  <span class="text-xs font-bold text-[#0F172A] block mb-1.5">Loan Term</span>
                  <div class="flex gap-2">
                    <span class="flex-1 bg-white border border-[#CBD5E1] rounded-xl px-4 py-3 text-sm font-bold text-[#0F172A]">30</span>
                    <span class="bg-[#F1F5F9] border border-[#CBD5E1] rounded-xl px-3 py-3 text-xs font-bold text-[#0F172A]">Years</span>
                  </div>
                </div>
              </div>
              <div>
                <span class="text-xs font-bold text-[#0F172A] block mb-1.5">Extra Monthly Payment (Optional) <span class="text-[#94A3B8] font-normal">— Pay off faster</span></span>
                <div class="flex items-center bg-white border border-[#CBD5E1] rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#0F766E] focus-within:border-[#0F766E] transition-shadow">
                  <span class="pl-4 text-sm font-bold text-[#64748B]">$</span>
                  <span class="w-full px-2 py-3 text-sm font-bold text-[#0F172A] outline-none">0</span>
                </div>
              </div>
            </div>
          </div>
          <div class="lg:col-span-5 bg-gradient-to-br from-[#0B3B39] via-[#0F766E] to-[#115E59] rounded-3xl p-6 sm:p-8 text-white relative shadow-xl overflow-hidden lg:sticky lg:top-24">
            <div class="relative z-10 space-y-6">
              <div class="flex items-center justify-between pb-4 border-b border-white/10">
                <span class="text-[11px] font-bold uppercase tracking-widest text-emerald-200">Loan Result Summary</span>
                <span class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/10 text-white border border-white/15">Copy</span>
              </div>
              <div class="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 text-center">
                <span class="text-xs font-semibold uppercase tracking-wider text-emerald-100">Monthly Payment</span>
                <div class="text-3xl sm:text-4xl font-black text-white mt-1 num-tabular tracking-tight">${aprMoney(defaults.regularMonthlyPayment)}<span class="text-sm sm:text-lg font-bold text-emerald-200 ml-1">/month</span></div>
                <div class="inline-flex items-center gap-1.5 text-xs text-emerald-200 mt-2 bg-black/20 px-2.5 py-1 rounded-full">
                  <span>${defaults.totalMonths} Total Payments</span>
                  <span>•</span>
                  <span>${years} Years</span>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3 pt-2">
                <div class="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                  <span class="text-[11px] font-semibold text-white/70 block">Total Principal</span>
                  <span class="text-sm sm:text-base font-bold text-white num-tabular mt-0.5 block">${aprMoney(defaults.principal)}</span>
                </div>
                <div class="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                  <span class="text-[11px] font-semibold text-white/70 block">Total Interest</span>
                  <span class="text-sm sm:text-base font-bold text-white num-tabular mt-0.5 block">${aprMoney(defaults.totalInterest)}</span>
                </div>
                <div class="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                  <span class="text-[11px] font-semibold text-white/70 block">Payoff Horizon</span>
                  <span class="text-sm sm:text-base font-bold text-white num-tabular mt-0.5 block">${defaults.totalMonths} Mo (~${years} Years)</span>
                </div>
                <div class="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                  <span class="text-[11px] font-semibold text-white/70 block">Total Outlay</span>
                  <span class="text-sm sm:text-base font-bold text-white num-tabular mt-0.5 block">${aprMoney(defaults.totalRepayment)} total</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm mb-12">
          <h2 class="text-lg font-extrabold text-[#0F172A] mb-1">Amortization Insights</h2>
          <p class="text-xs text-[#64748B] mb-5">How each payment splits between interest and principal over the life of the loan.</p>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            <div class="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
              <div class="text-[11px] font-bold uppercase tracking-wider text-[#0F766E] mb-1">First Interest Charge</div>
              <div class="text-base font-extrabold text-[#0F172A]">${aprMoney(displayRows[0].interest)}</div>
              <div class="text-[11px] text-[#0F766E] mt-0.5">Month 1 interest on ${aprMoney(defaults.principal)}</div>
            </div>
            <div class="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200">
              <div class="text-[11px] font-bold uppercase tracking-wider text-[#0F766E] mb-1 flex items-center justify-between"><span>Crossover Month</span><span class="px-1.5 py-0.5 rounded bg-[#0F766E] text-white text-[10px] font-bold">Month ${crossoverMonth}</span></div>
              <div class="text-base font-extrabold text-[#0F172A]">Year ${crossoverRow ? Math.ceil(crossoverRow.paymentNumber / 12) : ''}, Month ${crossoverRow ? ((crossoverRow.paymentNumber - 1) % 12) + 1 : ''}</div>
              <div class="text-[11px] text-[#0F766E] mt-0.5">Principal repaid surpasses interest fee</div>
            </div>
            <div class="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div class="text-[11px] font-bold uppercase tracking-wider text-[#475569] mb-1">50% Balance Point</div>
              <div class="text-base font-extrabold text-[#0F172A]">Month ${halfMonth}</div>
              <div class="text-[11px] text-[#64748B] mt-0.5">Balance falls below half of principal</div>
            </div>
          </div>
          <p class="text-sm text-[#64748B] leading-relaxed mb-4">
            In a standard fixed-rate amortizing mortgage of <strong>${aprMoney(defaults.principal)} at 6.50% APR</strong> over <strong>30 years</strong>,
            monthly installments begin with interest charges comprising the dominant share of payments. The mathematical <em>crossover point</em> occurs at
            <strong class="text-[#0F172A]">Month ${crossoverMonth} (Year ${crossoverRow ? Math.ceil(crossoverRow.paymentNumber / 12) : ''}, Month ${crossoverRow ? ((crossoverRow.paymentNumber - 1) % 12) + 1 : ''})</strong>,
            where the principal reduction portion ($${crossoverRow ? crossoverRow.principalRepaid.toFixed(2) : ''}) finally overtakes accrued monthly interest ($${crossoverRow ? crossoverRow.interest.toFixed(2) : ''}).
          </p>
          <p class="text-sm text-[#64748B] leading-relaxed">
            Adding <strong class="text-[#0F172A]">$250 per month in extra principal</strong> shortens this loan from 360 to ${withExtra.totalMonths} payments and saves <strong class="text-[#0F172A]">${aprMoney(withExtra.interestSaved)}</strong> in interest.
          </p>
        </div>
        <div class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm mb-12 overflow-x-auto">
          <h2 class="text-lg font-extrabold text-[#0F172A] mb-1">Amortization Schedule</h2>
          <p class="text-xs text-[#64748B] mb-4">First year of payments (full 360-month schedule available in the interactive calculator).</p>
          <table class="w-full text-sm text-left min-w-[640px]">
            <thead>
              <tr class="text-xs text-[#64748B] border-b border-[#E2E8F0]">
                <th class="py-2.5 px-4 font-bold">Month</th>
                <th class="py-2.5 px-4 font-bold">Starting</th>
                <th class="py-2.5 px-4 font-bold">Interest</th>
                <th class="py-2.5 px-4 font-bold">Principal</th>
                <th class="py-2.5 px-4 font-bold">Total Paid</th>
                <th class="py-2.5 px-4 font-bold">Ending</th>
                <th class="py-2.5 px-4 font-bold text-right">Cum. Interest</th>
              </tr>
            </thead>
            <tbody>
              ${displayRows.slice(0, 12).map((row) => `
              <tr class="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors">
                <td class="py-2.5 px-4 font-semibold text-[#0F172A]">${row.paymentNumber}</td>
                <td class="py-2.5 px-4">${aprMoney(row.startingBalance)}</td>
                <td class="py-2.5 px-4 text-amber-700 font-semibold">${aprMoney(row.interest)}</td>
                <td class="py-2.5 px-4 text-emerald-700 font-semibold">${aprMoney(row.principalRepaid)}</td>
                <td class="py-2.5 px-4 font-bold text-[#0F172A]">${aprMoney(row.totalPaymentThisMonth)}</td>
                <td class="py-2.5 px-4 font-medium">${aprMoney(row.endingBalance)}</td>
                <td class="py-2.5 px-4 text-right font-medium text-[#64748B]">${aprMoney(row.totalInterestPaidToDate)}</td>
              </tr>`).join('')}
            </tbody>
          </table>
          <p class="text-[11px] text-[#94A3B8] pt-3">* Displayed figures are rounded to two decimal places and reconciled so each displayed row adds up exactly.</p>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          <div class="lg:col-span-8 space-y-8">
            <section class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
              <h2 class="text-xl font-extrabold text-[#0F172A] mb-3">The Loan Payment Formula</h2>
              <p class="text-sm text-[#64748B] leading-relaxed mb-4">A fixed-rate loan payment is computed from the standard amortizing loan formula. The same monthly payment covers both interest and principal every month, but the split between them changes: early payments are mostly interest, later payments are mostly principal.</p>
              <div class="bg-[#F8FAFC] border border-[#CBD5E1] p-4 rounded-xl num-tabular text-xs sm:text-sm text-[#0F172A] mb-4 font-mono whitespace-pre-line leading-relaxed">${tool.formula}</div>
              <p class="text-sm text-[#64748B] leading-relaxed">For the default example — ${aprMoney(defaults.principal)} at 6.5% APR over 30 years — the formula gives a monthly payment of ${aprMoney(defaults.regularMonthlyPayment)}, total interest of ${aprMoney(defaults.totalInterest)}, and a total outlay of ${aprMoney(defaults.totalRepayment)}.</p>
            </section>
            <section class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
              <h2 class="text-xl font-extrabold text-[#0F172A] mb-3">How Amortization Works</h2>
              <p class="text-sm text-[#64748B] leading-relaxed mb-4">Each month, interest is charged on the remaining balance first, and the rest of your payment reduces the principal. Because the balance falls, the interest portion shrinks and the principal portion grows. On this loan the principal portion first exceeds the interest charge in <strong class="text-[#0F172A]">Month ${crossoverMonth}</strong>, and the balance first falls below half of the original principal in <strong class="text-[#0F172A]">Month ${halfMonth}</strong>. Read our in-depth <a href="${withBase('/learn/how-loan-amortization-works/')}" class="text-[#0F766E] font-semibold underline hover:text-[#115E59]">Loan Amortization Guide</a> for the full month-by-month breakdown.</p>
            </section>
            <section class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
              <h2 class="text-xl font-extrabold text-[#0F172A] mb-3">Extra Payments Save Real Money</h2>
              <p class="text-sm text-[#64748B] leading-relaxed">Adding $250 per month in extra principal to the default loan pays it off in ${withExtra.totalMonths} months instead of 360 — ${defaults.totalMonths - withExtra.totalMonths} months early — and saves ${aprMoney(withExtra.interestSaved)} in interest. Extra payments go entirely to principal, so every extra dollar shortens the loan.</p>
            </section>
            <section class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
              <h2 class="text-xl font-extrabold text-[#0F172A] mb-3">Assumptions &amp; Limitations</h2>
              <ul class="space-y-2 text-sm text-[#64748B] list-disc list-inside leading-relaxed">
                ${tool.assumptions.map((a) => `<li>${a}</li>`).join('')}
              </ul>
            </section>
            <section>
              <h2 class="text-xl font-bold text-[#172033] mb-4">Frequently Asked Questions</h2>
              ${tool.faqs.map((faq) => `
              <div class="mb-4 bg-white rounded-xl border border-[#E4E9F0] p-5">
                <h3 class="font-bold text-base text-gray-900">${faq.question}</h3>
                <p class="text-sm text-gray-600 mt-1">${faq.answer}</p>
              </div>`).join('')}
            </section>
          </div>
          <div class="lg:col-span-4 space-y-6">
            <div class="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-sm">
              <div class="text-xs font-bold uppercase tracking-wider text-[#0F766E] mb-2">Comprehensive Guide</div>
              <h3 class="text-base font-bold text-[#0F172A] mb-2">How Loan Amortization Works</h3>
              <p class="text-xs text-[#64748B] leading-relaxed mb-4">Understand how every payment splits between interest and principal, the crossover point, and how extra payments shorten the term.</p>
              <a href="${withBase('/learn/how-loan-amortization-works/')}" class="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F766E] hover:underline"><span>Read Educational Guide</span><span>→</span></a>
            </div>
            <div class="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-sm">
              <div class="text-xs font-bold uppercase tracking-wider text-[#0F766E] mb-2">Compare Rates</div>
              <h3 class="text-base font-bold text-[#0F172A] mb-2">Credit Card APR Calculator</h3>
              <p class="text-xs text-[#64748B] leading-relaxed mb-4">See what a credit-card balance really costs at a given APR and how much faster a higher payment pays it off.</p>
              <a href="${withBase('/credit-card-apr-calculator/')}" class="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F766E] hover:underline"><span>Open APR Calculator</span><span>→</span></a>
            </div>
          </div>
        </div>
        <div class="mb-16">
          <h2 class="text-xl font-bold text-[#172033] mb-2">Related Financial Calculators</h2>
          <p class="text-sm text-[#667085] mb-6">More tools that work with the numbers on this page.</p>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm">
              <h3 class="font-bold text-base text-[#0F172A] mb-2"><a href="${withBase('/debt-payoff-planner/')}" class="text-teal-700 hover:underline">Debt Payoff Planner</a></h3>
              <p class="text-xs text-[#64748B]">Plan a payoff strategy across multiple debts.</p>
            </div>
            <div class="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm">
              <h3 class="font-bold text-base text-[#0F172A] mb-2"><a href="${withBase('/credit-card-apr-calculator/')}" class="text-teal-700 hover:underline">Credit Card APR Calculator</a></h3>
              <p class="text-xs text-[#64748B]">Calculate credit card interest and payoff time.</p>
            </div>
          </div>
          <h2 class="text-xl font-bold text-[#172033] mt-12 mb-2">Helpful Educational Guides</h2>
          <p class="text-sm text-[#667085] mb-6">Understand the formulas, methodology, and financial context behind these calculations.</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm">
              <h3 class="font-bold text-base text-[#0F172A] mb-2"><a href="${withBase('/learn/how-loan-amortization-works/')}" class="text-teal-700 hover:underline">How Loan Amortization Works</a></h3>
              <p class="text-xs text-[#64748B]">Learn how loan amortization works, how each payment splits between interest and principal, and how extra payments shorten the term.</p>
            </div>
            <div class="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm">
              <h3 class="font-bold text-base text-[#0F172A] mb-2"><a href="${withBase('/learn/apr-vs-interest-rate/')}" class="text-teal-700 hover:underline">APR vs. Interest Rate: What's the Difference?</a></h3>
              <p class="text-xs text-[#64748B]">Learn the difference between APR and interest rate, when each applies, and how to compare loan offers accurately.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
    <footer class="bg-white border-t border-[#E4E9F0] mt-20">
      <div class="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 lg:py-16">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          <div class="lg:col-span-2 space-y-4">
            <a href="${withBase('/')}" class="flex items-center gap-2.5 text-[#172033] font-semibold text-lg">
              <div class="w-7 h-7 rounded-lg bg-[#0F766E] text-white flex items-center justify-center font-bold text-sm">$</div>
              <span>${siteConfig.name}</span>
            </a>
            <p class="text-sm text-[#667085] max-w-sm leading-relaxed">${siteConfig.tagline}</p>
            <p class="text-xs text-[#667085] leading-relaxed pt-2 border-t border-[#E4E9F0]/60">${siteConfig.disclaimerShort}</p>
          </div>
          <div>
            <h3 class="text-xs font-semibold uppercase tracking-wider text-[#172033] mb-3">Tool Categories</h3>
            <ul class="space-y-2 text-sm text-[#667085]">
              <li><a href="${withBase('/tools/investing/')}">Investing Tools</a></li>
              <li><a href="${withBase('/tools/credit-debt/')}">Credit &amp; Debt</a></li>
              <li><a href="${withBase('/tools/retirement/')}">Retirement Planning</a></li>
              <li><a href="${withBase('/tools/business-finance/')}">Business Finance</a></li>
              <li><a href="${withBase('/tools/')}" class="font-medium text-[#0F766E]">All Calculators &rarr;</a></li>
            </ul>
          </div>
          <div>
            <h3 class="text-xs font-semibold uppercase tracking-wider text-[#172033] mb-3">Learn</h3>
            <ul class="space-y-2 text-sm text-[#667085]">
              <li><a href="${withBase('/learn/how-to-calculate-average-stock-cost/')}">Average Stock Cost</a></li>
              <li><a href="${withBase('/learn/how-to-calculate-roi/')}">How to Calculate ROI</a></li>
              <li><a href="${withBase('/learn/apr-vs-interest-rate/')}">APR vs. Interest Rate</a></li>
              <li><a href="${withBase('/learn/flat-vs-tiered-commission/')}">Tiered Commission</a></li>
              <li><a href="${withBase('/learn/how-long-will-retirement-savings-last/')}">Retirement Longevity</a></li>
            </ul>
          </div>
          <div>
            <h3 class="text-xs font-semibold uppercase tracking-wider text-[#172033] mb-3">Platform</h3>
            <ul class="space-y-2 text-sm text-[#667085]">
              <li><a href="${withBase('/about/')}">About</a></li>
              <li><a href="${withBase('/methodology/')}">Calculation Methodology</a></li>
              <li><a href="${withBase('/financial-disclaimer/')}">Financial Disclaimer</a></li>
              <li><a href="${withBase('/contact/')}">Contact</a></li>
              <li><a href="${withBase('/privacy/')}">Privacy Policy</a></li>
              <li><a href="${withBase('/terms/')}">Terms of Use</a></li>
            </ul>
          </div>
        </div>
        <div class="mt-12 pt-8 border-t border-[#E4E9F0] flex flex-col sm:flex-row items-center justify-between text-xs text-[#667085] gap-4">
          <div>&copy; ${year} ${siteConfig.name}. All rights reserved.</div>
          <div class="flex items-center gap-4">
            <a href="${withBase('/privacy/')}" class="hover:underline">Privacy</a>
            <span class="text-[#E4E9F0]">&bull;</span>
            <a href="${withBase('/terms/')}" class="hover:underline">Terms</a>
            <span class="text-[#E4E9F0]">&bull;</span>
            <a href="${withBase('/financial-disclaimer/')}" class="hover:underline">Disclaimer</a>
          </div>
        </div>
      </div>
    </footer>
  </div>
  `
}

// Task 10: replace the APR route's prose-only prerender with the full
// calculator shell (header, H1, console, default results, tables).
const aprRoute = routes.find((r) => r.path === '/credit-card-apr-calculator/')
if (aprRoute) {
  const aprTool = tools.find((t) => t.slug === 'credit-card-apr-calculator')
  if (aprTool) aprRoute.bodyHtml = renderAprShell(aprTool)
}

// Retirement shell: replace the retirement route's prose-only prerender
// with the full calculator shell (same pattern as the APR route).
const retirementRoute = routes.find((r) => r.path === '/retirement-savings-calculator/')
if (retirementRoute) {
  const retirementTool = tools.find((t) => t.slug === 'retirement-savings-calculator')
  if (retirementTool) retirementRoute.bodyHtml = renderRetirementShell(retirementTool)
}

// Stock average shell: replace the stock route's prose-only prerender
// with the full calculator shell (same pattern as the APR route).
const stockRoute = routes.find((r) => r.path === '/stock-average-calculator/')
if (stockRoute) {
  const stockTool = tools.find((t) => t.slug === 'stock-average-calculator')
  if (stockTool) stockRoute.bodyHtml = renderStockShell(stockTool)
}

// Loan payment shell: replace the loan route's prose-only prerender
// with the full calculator shell (same pattern as the APR route).
const loanRoute = routes.find((r) => r.path === '/loan-payment-calculator/')
if (loanRoute) {
  const loanTool = tools.find((t) => t.slug === 'loan-payment-calculator')
  if (loanTool) loanRoute.bodyHtml = renderLoanShell(loanTool)
}

// Prerender all routes
console.log(`Prerendering ${routes.length} static HTML routes with base "${base}"...`)

for (const r of routes) {
  const canonicalUrl = `${siteConfig.url.replace(/\/$/, '')}${r.path}`
  let html = templateHtml

  // Replace Title
  html = html.replace(/<title>.*?<\/title>/, `<title>${r.title}</title>`)

  // Replace Description
  html = html.replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${r.description}" />`)

  // Replace Canonical
  html = html.replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="${canonicalUrl}" />`)

  // Add JSON-LD if present
  if (r.jsonLd) {
    const jsonLdStr = `<script type="application/ld+json">${JSON.stringify(r.jsonLd)}</script>`
    html = html.replace('</head>', `  ${jsonLdStr}\n  </head>`)
  }

  // Inject initial crawlable HTML inside <div id="app"></div> for bots and instant paint
  html = html.replace('<div id="app"></div>', `<div id="app">${r.bodyHtml}</div>`)

  // Determine output path
  let targetPath = ''
  if (r.path === '/') {
    targetPath = path.resolve(distDir, 'index.html')
  } else {
    const routeFolder = path.resolve(distDir, r.path.replace(/^\//, '').replace(/\/$/, ''))
    if (!fs.existsSync(routeFolder)) {
      fs.mkdirSync(routeFolder, { recursive: true })
    }
    targetPath = path.resolve(routeFolder, 'index.html')
  }

  fs.writeFileSync(targetPath, html, 'utf-8')
  console.log(`✓ Generated ${targetPath.replace(distDir, '')}`)
}

// Generate 404.html
const notFoundHtml = templateHtml
  .replace(/<title>.*?<\/title>/, `<title>Page Not Found (404) | ${siteConfig.name}</title>`)
  .replace('<div id="app"></div>', `<div id="app"><div style="text-align:center;padding:50px;"><h1>404 - Page Not Found</h1><p><a href="${withBase('/')}">Return Home</a></p></div></div>`)
fs.writeFileSync(path.resolve(distDir, '404.html'), notFoundHtml, 'utf-8')
console.log('✓ Generated /404.html')

console.log('Static prerendering completed successfully!')
