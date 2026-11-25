import type { BreakEvenResult } from '../calculations/breakEven'

/**
 * Break-even chart (SVG + legend) for the hoodie worked example in the
 * break-even guide. Every number is computed, never hand-typed:
 * - The break-even point is passed in as the engine's result
 *   (calculateBreakEven): 500 units / $40,000. The helper takes the result
 *   as a parameter (rather than importing the engine) so this module has
 *   no runtime engine import — it is imported by both the Vue app and the
 *   Node prerender script, which resolve modules differently.
 * - Inputs match the article's worked example exactly: price $80, variable
 *   cost $28, monthly fixed costs $26,000.
 * - Revenue line: R(q) = 80q. Total-cost line: C(q) = 26,000 + 28q.
 * - Axis maxima come from the article's projected volume (800 units):
 *   max revenue = 800 × $80 = $64,000; max total cost = $26,000 + 28 × 800.
 * The same helper is used by ArticlePage.vue (live) and scripts/prerender.js
 * (static shell), so the chart is identical in both.
 */
export const BREAK_EVEN_CHART_INPUTS = {
  price: 80,
  variableCost: 28,
  fixedCosts: 26000,
  maxUnits: 800
}

export function breakEvenChartSvg(be: BreakEvenResult): string {
  const { price: P, variableCost: V, fixedCosts: F, maxUnits } = BREAK_EVEN_CHART_INPUTS
  const beUnits = be.breakEvenUnitsRounded
  const beRevenue = be.breakEvenRevenue

  const maxRevenue = maxUnits * P
  const maxCost = F + V * maxUnits
  const maxY = Math.max(maxRevenue, maxCost)

  // Plot area inside a 660x440 viewBox.
  const W = 660
  const H = 440
  const left = 70
  const right = 640
  const top = 25
  const bottom = 390
  const px = (q: number) => left + (q / maxUnits) * (right - left)
  const py = (d: number) => bottom - (d / maxY) * (bottom - top)
  const f2 = (n: number) => n.toFixed(2)

  const xTicks = [0, 200, 400, 600, 800]
  const yTicks = [0, 16000, 32000, 48000, 64000]

  const grid = [
    ...xTicks.map(
      (q) =>
        `<line x1="${f2(px(q))}" y1="${top}" x2="${f2(px(q))}" y2="${bottom}" stroke="#E2E8F0" stroke-width="1" />` +
        `<text x="${f2(px(q))}" y="${bottom + 18}" text-anchor="middle" font-size="11" fill="#64748B">${q}</text>`
    ),
    ...yTicks.map(
      (d) =>
        `<line x1="${left}" y1="${f2(py(d))}" x2="${right}" y2="${f2(py(d))}" stroke="#E2E8F0" stroke-width="1" />` +
        `<text x="${left - 8}" y="${f2(py(d) + 4)}" text-anchor="end" font-size="11" fill="#64748B">$${(d / 1000).toFixed(0)}k</text>`
    )
  ].join('')

  // Loss/profit region labels sit between the two lines.
  const lossQ = beUnits / 2
  const lossMid = ((P * lossQ) + (F + V * lossQ)) / 2
  const profitQ = beUnits + (maxUnits - beUnits) / 2
  const profitMid = ((P * profitQ) + (F + V * profitQ)) / 2

  return `<svg viewBox="0 0 ${W} ${H}" class="w-full h-auto" role="img" aria-label="Break-even chart for the hoodie example: revenue and total cost cross at ${beUnits} units and $${beRevenue.toLocaleString('en-US')}">
  <title>Break-even chart: revenue vs total cost for the hoodie example</title>
  ${grid}
  <line x1="${left}" y1="${f2(py(F))}" x2="${right}" y2="${f2(py(F))}" stroke="#94A3B8" stroke-width="1.5" stroke-dasharray="6 4" />
  <text x="${right - 4}" y="${f2(py(F) - 8)}" text-anchor="end" font-size="11" fill="#64748B">Fixed costs $${F.toLocaleString('en-US')}</text>
  <line x1="${f2(px(0))}" y1="${f2(py(0))}" x2="${f2(px(maxUnits))}" y2="${f2(py(maxRevenue))}" stroke="#0F766E" stroke-width="3" />
  <line x1="${f2(px(0))}" y1="${f2(py(F))}" x2="${f2(px(maxUnits))}" y2="${f2(py(maxCost))}" stroke="#D97706" stroke-width="3" />
  <text x="${f2(px(lossQ))}" y="${f2(py(lossMid))}" text-anchor="middle" font-size="13" font-weight="700" fill="#DC2626">LOSS</text>
  <text x="${f2(px(profitQ))}" y="${f2(py(profitMid))}" text-anchor="middle" font-size="13" font-weight="700" fill="#0F766E">PROFIT</text>
  <circle cx="${f2(px(beUnits))}" cy="${f2(py(beRevenue))}" r="6" fill="#DC2626" stroke="#fff" stroke-width="2" />
  <text x="${f2(px(beUnits))}" y="${f2(py(beRevenue) - 14)}" text-anchor="middle" font-size="12" font-weight="700" fill="#172033">Break-even: ${beUnits} units · $${beRevenue.toLocaleString('en-US')}</text>
  <text x="${f2((left + right) / 2)}" y="${H - 6}" text-anchor="middle" font-size="12" font-weight="600" fill="#334155">Units sold per month</text>
  <text x="16" y="${f2((top + bottom) / 2)}" text-anchor="middle" font-size="12" font-weight="600" fill="#334155" transform="rotate(-90 16 ${f2((top + bottom) / 2)})">Dollars per month</text>
</svg>
<div class="flex flex-wrap items-center gap-4 mt-3 text-xs text-[#64748B]">
  <span class="flex items-center gap-1.5"><span class="w-6 h-1 rounded bg-[#0F766E] inline-block"></span>Revenue — $${P} per hoodie</span>
  <span class="flex items-center gap-1.5"><span class="w-6 h-1 rounded bg-[#D97706] inline-block"></span>Total cost — $${F.toLocaleString('en-US')} fixed + $${V} per hoodie</span>
  <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-[#DC2626] inline-block"></span>Break-even: ${beUnits} units · $${beRevenue.toLocaleString('en-US')}</span>
</div>`
}
