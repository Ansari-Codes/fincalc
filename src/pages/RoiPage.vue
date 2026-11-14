<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { updatePageSeo } from '@/utils/seo'
import { generateCalculatorSchema } from '@/utils/structuredData'
import { formatCurrency, formatPercent, copyToClipboard } from '@/utils/formatters'
import { calculateRoi } from '@/calculations/roi'
import Breadcrumbs from '@/components/ui/Breadcrumbs.vue'
import FAQAccordion from '@/components/ui/FAQAccordion.vue'
import RelatedTools from '@/components/ui/RelatedTools.vue'
import DisclaimerNotice from '@/components/ui/DisclaimerNotice.vue'
import { tools } from '@/data/tools'
import { 
  Percent, 
  RotateCcw, 
  Copy, 
  Check, 
  ArrowRight,
  AlertCircle,
  Sliders,
  TrendingUp,
  TrendingDown
} from '@lucide/vue'

const currentTool = tools.find(t => t.slug === 'roi-calculator')!

onMounted(() => {
  updatePageSeo({
    title: currentTool.title,
    description: currentTool.fullDescription,
    path: currentTool.path,
    jsonLd: generateCalculatorSchema(currentTool)
  })
})

const currency = ref('USD')
const copied = ref(false)

const initialInvestment = ref<number | null>(10000)
const finalValue = ref<number | null>(14500)
const additionalCosts = ref<number | null>(500)
const additionalIncome = ref<number | null>(0)

function resetForm() {
  initialInvestment.value = 10000
  finalValue.value = 14500
  additionalCosts.value = 500
  additionalIncome.value = 0
}

const result = computed(() => {
  return calculateRoi({
    initialInvestment: initialInvestment.value || 0,
    finalValue: finalValue.value || 0,
    additionalCosts: additionalCosts.value || 0,
    additionalIncome: additionalIncome.value || 0
  })
})

// Visual return multiplier
const capitalMultiple = computed(() => {
  if (result.value.totalCost <= 0) return 0
  return (result.value.totalValueReturned / result.value.totalCost).toFixed(2)
})

// Visual share of investment recovered / profit
const costSharePct = computed(() => {
  const sum = result.value.totalCost + Math.max(0, result.value.netProfit)
  if (sum <= 0) return 50
  return (result.value.totalCost / sum) * 100
})

const profitSharePct = computed(() => {
  const sum = result.value.totalCost + Math.max(0, result.value.netProfit)
  if (sum <= 0) return 50
  return (Math.max(0, result.value.netProfit) / sum) * 100
})

async function handleCopy() {
  const summary = [
    'Return on Investment (ROI) Calculation',
    '----------------------------------------',
    `Initial Investment: ${formatCurrency(initialInvestment.value || 0, currency.value)}`,
    `Total Cost Basis: ${formatCurrency(result.value.totalCost, currency.value)}`,
    `Total Value Returned: ${formatCurrency(result.value.totalValueReturned, currency.value)}`,
    `Net Profit / Loss: ${formatCurrency(result.value.netProfit, currency.value)}`,
    `ROI Percentage: ${formatPercent(result.value.roiPercentage)}`,
    `Capital Return Multiplier: ${capitalMultiple.value}x`
  ].join('\n')

  const ok = await copyToClipboard(summary)
  if (ok) {
    copied.value = true
    setTimeout(() => { copied.value = false }, 2500)
  }
}
</script>

<template>
  <div class="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
    <Breadcrumbs :items="[
      { name: 'Investing', path: '/tools/investing/' },
      { name: 'ROI Calculator' }
    ]" />

    <!-- Tool Instrument Header -->
    <div class="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div>
        <div class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0F766E] bg-[#E7F4F1] px-3 py-1 rounded-full mb-2.5">
          <Percent class="w-3.5 h-3.5" />
          <span>Interactive Capital Efficiency Instrument</span>
        </div>
        <h1 class="text-2xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight mb-2">
          {{ currentTool.name }}
        </h1>
        <p class="text-sm sm:text-base text-[#64748B] max-w-2xl leading-relaxed">
          {{ currentTool.fullDescription }}
        </p>
      </div>

      <!-- Controls: Currency & Reset -->
      <div class="flex items-center gap-2.5 self-start md:self-end">
        <select
          v-model="currency"
          aria-label="Display currency"
          class="text-xs font-semibold bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-[#334155] shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
        >
          <option value="USD">USD ($)</option>
          <option value="EUR">EUR (€)</option>
          <option value="GBP">GBP (£)</option>
          <option value="CAD">CAD ($)</option>
        </select>
        <button
          type="button"
          @click="resetForm"
          class="inline-flex items-center gap-1.5 text-xs font-semibold bg-white border border-[#CBD5E1] px-3 py-2 rounded-xl text-[#64748B] hover:text-[#0F766E] hover:border-[#0F766E] transition-all shadow-2xs"
        >
          <RotateCcw class="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>
    </div>

    <!-- Validation Warning Banner -->
    <div v-if="!result.isValid && result.validationErrors.length > 0" class="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5 shadow-2xs">
      <div v-for="(err, i) in result.validationErrors" :key="i" class="flex items-center gap-2">
        <AlertCircle class="w-4 h-4 text-amber-600 shrink-0" />
        <span class="font-medium">{{ err }}</span>
      </div>
    </div>

    <!-- Main Instrument Console Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
      <!-- Left Panel: Interactive Console Controls (7 cols) -->
      <div class="lg:col-span-7 bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
        <div class="flex items-center justify-between pb-4 mb-6 border-b border-[#F1F5F9]">
          <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#475569]">
            <Sliders class="w-4 h-4 text-[#0F766E]" />
            <span>Interactive Parameters</span>
          </div>
          <span class="text-[11px] text-[#94A3B8] font-medium">Type or slide values</span>
        </div>

        <form @submit.prevent class="space-y-6">
          <!-- 1. Initial Investment Outlay -->
          <div class="bg-[#F8FAFC] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] space-y-3">
            <div class="flex items-center justify-between">
              <label for="initial-investment" class="text-xs font-bold uppercase tracking-wider text-[#334155]">
                Initial Capital Committed
              </label>
              <div class="relative w-36">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#94A3B8]">$</span>
                <input
                  id="initial-investment"
                  v-model.number="initialInvestment"
                  type="number"
                  min="0"
                  step="500"
                  class="w-full pl-6 pr-2.5 py-1.5 text-right font-bold text-sm bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>
            </div>

            <!-- Tactile Range Slider -->
            <input
              type="range"
              min="500"
              max="150000"
              step="500"
              :value="initialInvestment || 0"
              @input="initialInvestment = Number(($event.target as HTMLInputElement).value)"
              class="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#0F766E]"
            />

            <!-- Quick Presets -->
            <div class="flex flex-wrap items-center gap-1.5 pt-1">
              <span class="text-[11px] font-semibold text-[#94A3B8] mr-1">Presets:</span>
              <button
                v-for="amt in [2500, 5000, 10000, 25000, 50000, 100000]"
                :key="amt"
                type="button"
                @click="initialInvestment = amt"
                :class="initialInvestment === amt ? 'bg-[#0F766E] text-white' : 'bg-white text-[#475569] hover:bg-[#E2E8F0]'"
                class="text-[11px] font-bold px-2.5 py-1 rounded-md border border-[#CBD5E1] transition-colors"
              >
                ${{ amt >= 1000 ? (amt / 1000) + 'k' : amt }}
              </button>
            </div>
          </div>

          <!-- 2. Final Value / Gross Proceeds -->
          <div class="bg-[#F8FAFC] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] space-y-3">
            <div class="flex items-center justify-between">
              <label for="final-value" class="text-xs font-bold uppercase tracking-wider text-[#334155]">
                Final Value / Revenue Proceeds
              </label>
              <div class="relative w-36">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#94A3B8]">$</span>
                <input
                  id="final-value"
                  v-model.number="finalValue"
                  type="number"
                  min="0"
                  step="500"
                  class="w-full pl-6 pr-2.5 py-1.5 text-right font-bold text-sm bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>
            </div>

            <!-- Tactile Range Slider -->
            <input
              type="range"
              min="0"
              max="250000"
              step="500"
              :value="finalValue || 0"
              @input="finalValue = Number(($event.target as HTMLInputElement).value)"
              class="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#0F766E]"
            />

            <!-- Presets -->
            <div class="flex flex-wrap items-center gap-1.5 pt-1">
              <span class="text-[11px] font-semibold text-[#94A3B8] mr-1">Targets:</span>
              <button
                v-for="amt in [5000, 10000, 14500, 20000, 35000, 75000]"
                :key="amt"
                type="button"
                @click="finalValue = amt"
                :class="finalValue === amt ? 'bg-[#0F766E] text-white' : 'bg-white text-[#475569] hover:bg-[#E2E8F0]'"
                class="text-[11px] font-bold px-2.5 py-1 rounded-md border border-[#CBD5E1] transition-colors"
              >
                ${{ (amt / 1000).toFixed(amt % 1000 === 0 ? 0 : 1) }}k
              </button>
            </div>
          </div>

          <!-- 3. Incidental Costs & Residual Income -->
          <div class="pt-4 border-t border-[#E2E8F0] grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0] space-y-2">
              <div class="flex items-center justify-between">
                <label for="add-costs" class="text-xs font-bold text-[#334155]">
                  Incidental Costs
                </label>
                <div class="relative w-24">
                  <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#94A3B8]">$</span>
                  <input
                    id="add-costs"
                    v-model.number="additionalCosts"
                    type="number"
                    min="0"
                    step="50"
                    class="w-full pl-5 pr-2 py-1 text-right text-xs font-bold bg-white border border-[#CBD5E1] rounded-lg"
                  />
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="10000"
                step="50"
                :value="additionalCosts || 0"
                @input="additionalCosts = Number(($event.target as HTMLInputElement).value)"
                class="w-full h-1.5 bg-[#E2E8F0] rounded appearance-none cursor-pointer accent-[#0F766E]"
              />
            </div>

            <div class="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0] space-y-2">
              <div class="flex items-center justify-between">
                <label for="add-income" class="text-xs font-bold text-[#334155]">
                  Cash Flow / Dividends
                </label>
                <div class="relative w-24">
                  <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#94A3B8]">$</span>
                  <input
                    id="add-income"
                    v-model.number="additionalIncome"
                    type="number"
                    min="0"
                    step="50"
                    class="w-full pl-5 pr-2 py-1 text-right text-xs font-bold bg-white border border-[#CBD5E1] rounded-lg"
                  />
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="10000"
                step="50"
                :value="additionalIncome || 0"
                @input="additionalIncome = Number(($event.target as HTMLInputElement).value)"
                class="w-full h-1.5 bg-[#E2E8F0] rounded appearance-none cursor-pointer accent-[#0F766E]"
              />
            </div>
          </div>
        </form>
      </div>

      <!-- Right Panel: High-Impact Cockpit / HUD Console (5 cols) -->
      <div class="lg:col-span-5 bg-gradient-to-br from-[#0B3B39] via-[#0F766E] to-[#115E59] rounded-3xl p-6 sm:p-8 text-white relative shadow-xl overflow-hidden lg:sticky lg:top-24">
        <!-- Background subtle tech dot grid -->
        <div class="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-40"></div>

        <div class="relative z-10 space-y-6">
          <!-- Console Status Header -->
          <div class="flex items-center justify-between pb-4 border-b border-white/10">
            <div class="flex items-center gap-2">
              <span class="relative flex h-2 w-2">
                <span :class="result.netProfit >= 0 ? 'bg-emerald-400' : 'bg-rose-400'" class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"></span>
                <span :class="result.netProfit >= 0 ? 'bg-emerald-400' : 'bg-rose-400'" class="relative inline-flex rounded-full h-2 w-2"></span>
              </span>
              <span class="text-[11px] font-bold uppercase tracking-widest text-emerald-200">
                {{ result.netProfit >= 0 ? 'Capital Efficiency Status' : 'Loss Position' }}
              </span>
            </div>
            <button
              type="button"
              @click="handleCopy"
              class="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/15"
            >
              <Check v-if="copied" class="w-3.5 h-3.5 text-emerald-300" />
              <Copy v-else class="w-3.5 h-3.5" />
              <span>{{ copied ? 'Copied' : 'Copy' }}</span>
            </button>
          </div>

          <!-- Hero Metric Callout -->
          <div class="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 text-center">
            <span class="text-xs font-semibold uppercase tracking-wider text-emerald-100">Return on Investment</span>
            <div 
              class="text-4xl sm:text-5xl font-black mt-1 num-tabular tracking-tight"
              :class="result.netProfit >= 0 ? 'text-white' : 'text-rose-300'"
            >
              {{ result.netProfit >= 0 ? '+' : '' }}{{ formatPercent(result.roiPercentage) }}
            </div>
            <div class="inline-flex items-center gap-1.5 text-xs text-emerald-200 mt-2 bg-black/20 px-2.5 py-1 rounded-full">
              <span>{{ capitalMultiple }}x Capital Multiple</span>
              <span>•</span>
              <span class="flex items-center gap-1">
                <component :is="result.netProfit >= 0 ? TrendingUp : TrendingDown" class="w-3 h-3" />
                {{ result.netProfit >= 0 ? 'Profitable' : 'Net Loss' }}
              </span>
            </div>
          </div>

          <!-- Proportional Capital vs Profit Bar -->
          <div v-if="result.netProfit > 0" class="space-y-2 pt-2">
            <div class="flex items-center justify-between text-xs font-bold text-white/90">
              <span>Capital Return Breakdown</span>
              <span class="text-emerald-300">+{{ profitSharePct.toFixed(0) }}% Gain Share</span>
            </div>

            <!-- Proportional 2-Segment Bar -->
            <div class="h-3.5 w-full bg-black/20 rounded-full overflow-hidden flex p-0.5 border border-white/20">
              <div
                class="bg-sky-400 h-full rounded-l-full transition-all duration-300"
                :style="{ width: `${costSharePct}%` }"
                title="Cost Basis Recovered"
              ></div>
              <div
                class="bg-emerald-300 h-full rounded-r-full transition-all duration-300"
                :style="{ width: `${profitSharePct}%` }"
                title="Net Profit Earned"
              ></div>
            </div>

            <!-- Legend with Percentages -->
            <div class="flex items-center justify-between text-[11px] font-semibold text-white/80 pt-0.5">
              <div class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-sm bg-sky-400 shrink-0"></span>
                <span>Basis Recovered ({{ formatCurrency(result.totalCost, currency) }})</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-sm bg-emerald-300 shrink-0"></span>
                <span>Net Gain ({{ formatCurrency(result.netProfit, currency) }})</span>
              </div>
            </div>
          </div>

          <!-- Secondary Metric 2x2 Grid -->
          <div class="grid grid-cols-2 gap-3 pt-2">
            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <span class="text-[11px] font-semibold block" :class="result.netProfit >= 0 ? 'text-emerald-200' : 'text-rose-200'">
                Net Dollar Profit / Loss
              </span>
              <span 
                class="text-sm sm:text-base font-extrabold num-tabular mt-0.5 block"
                :class="result.netProfit >= 0 ? 'text-emerald-300' : 'text-rose-300'"
              >
                {{ result.netProfit >= 0 ? '+' : '' }}{{ formatCurrency(result.netProfit, currency) }}
              </span>
            </div>

            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <span class="text-[11px] font-semibold text-white/70 block">Total Invested Cost</span>
              <span class="text-sm sm:text-base font-bold text-white num-tabular mt-0.5 block">
                {{ formatCurrency(result.totalCost, currency) }}
              </span>
            </div>

            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <span class="text-[11px] font-semibold text-white/70 block">Gross Value Returned</span>
              <span class="text-sm sm:text-base font-bold text-white num-tabular mt-0.5 block">
                {{ formatCurrency(result.totalValueReturned, currency) }}
              </span>
            </div>

            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <span class="text-[11px] font-semibold text-white/70 block">Total Return Multiplier</span>
              <span class="text-sm sm:text-base font-bold text-white num-tabular mt-0.5 block">
                {{ capitalMultiple }}x
              </span>
            </div>
          </div>

          <div class="pt-2">
            <DisclaimerNotice />
          </div>
        </div>
      </div>
    </div>

    <!-- Explanatory & Guides -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
      <div class="lg:col-span-8 space-y-8">
        <section class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
          <h2 class="text-xl font-extrabold text-[#0F172A] mb-3">How ROI is Calculated</h2>
          <p class="text-sm text-[#64748B] leading-relaxed mb-4">
            Return on Investment compares net economic gains to the total capital invested. Net profit is computed by subtracting total costs from total gross proceeds.
          </p>
          <div class="bg-[#F8FAFC] border border-[#CBD5E1] p-4 rounded-xl num-tabular text-xs sm:text-sm text-[#0F172A] mb-4 font-mono">
            {{ currentTool.formula }}
          </div>
          <p class="text-sm text-[#64748B] leading-relaxed">
            Note: Standard ROI measures total cumulative return. It does not measure annualized velocity (how many years the gain required).
          </p>
        </section>

        <!-- Worked Example -->
        <section class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
          <h2 class="text-xl font-extrabold text-[#0F172A] mb-3">Worked Example</h2>
          <div class="space-y-3 text-sm text-[#64748B] leading-relaxed">
            <p>Suppose you spend $5,000 to launch an e-commerce product line, plus $1,000 on digital advertising ($6,000 total cost). In 12 months, the inventory produces $9,600 in total sales revenue:</p>
            <ul class="list-disc list-inside space-y-1.5 pl-2 font-mono text-xs text-[#0F172A]">
              <li>Total Cost = $5,000 + $1,000 = $6,000.00</li>
              <li>Total Value Returned = $9,600.00</li>
              <li>Net Profit = $9,600 − $6,000 = $3,600.00</li>
            </ul>
            <div class="p-3 bg-[#E7F4F1] rounded-xl font-mono text-sm text-[#0F766E] font-bold">
              ROI = ($3,600 ÷ $6,000) × 100 = 60.0%
            </div>
          </div>
        </section>

        <!-- Assumptions & Limitations -->
        <section class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
          <h2 class="text-xl font-extrabold text-[#0F172A] mb-3">Assumptions &amp; Limitations</h2>
          <ul class="space-y-2 text-sm text-[#64748B] list-disc list-inside leading-relaxed">
            <li v-for="(item, idx) in currentTool.assumptions" :key="idx">
              {{ item }}
            </li>
          </ul>
        </section>

        <section>
          <FAQAccordion :items="currentTool.faqs" title="Frequently Asked Questions" />
        </section>
      </div>

      <div class="lg:col-span-4 space-y-6">
        <div class="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-sm">
          <h3 class="text-base font-bold text-[#0F172A] mb-2">Learn More About ROI</h3>
          <p class="text-xs text-[#64748B] leading-relaxed mb-4">
            Read our in-depth guide on interpreting ROI versus annualized returns (CAGR).
          </p>
          <RouterLink
            to="/learn/how-to-calculate-roi/"
            class="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F766E] hover:underline"
          >
            <span>Read How to Calculate ROI Guide</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </RouterLink>
        </div>
      </div>
    </div>

    <RelatedTools
      :current-slug="currentTool.slug"
      :tool-slugs="currentTool.relatedToolSlugs"
      :article-slugs="currentTool.relatedArticleSlugs"
    />
  </div>
</template>
