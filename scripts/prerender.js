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
        <section class="bg-white p-8 rounded-xl border border-gray-200">
          <h2 class="text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          ${t.faqs.map(faq => `
            <div class="mb-4">
              <h3 class="font-bold text-base text-gray-900">${faq.question}</h3>
              <p class="text-sm text-gray-600 mt-1">${faq.answer}</p>
            </div>
          `).join('')}
        </section>
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
      <p class="text-lg text-gray-600 mb-6">All calculations run locally on your device. We do not store or transmit your financial inputs.</p>
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
