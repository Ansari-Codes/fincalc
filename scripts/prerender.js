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
              Explore dynamic interactive charts below modeling our reference $300,000 30-year fixed mortgage at 6.50% APR with an optional $250/mo extra prepayment. Key illustrated milestones include: Month 205 (cumulative interest crosses 75% of lifetime interest), Month 233 (monthly principal repaid surpasses interest fee), Month 257 (remaining balance crosses below 50% of original principal), and Month 262 accelerated debt retirement (saving $120,336.94 in interest and 98 months).
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


// Task 10: replace the APR route's prose-only prerender with the full
// calculator shell (header, H1, console, default results, tables).
const aprRoute = routes.find((r) => r.path === '/credit-card-apr-calculator/')
if (aprRoute) {
  const aprTool = tools.find((t) => t.slug === 'credit-card-apr-calculator')
  if (aprTool) aprRoute.bodyHtml = renderAprShell(aprTool)
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
