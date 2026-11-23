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
