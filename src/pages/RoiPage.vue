<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { updatePageSeo } from '@/utils/seo'
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
  ArrowRight 
} from 'lucide-vue-next'

const currentTool = tools.find(t => t.slug === 'roi-calculator')!

onMounted(() => {
  updatePageSeo({
    title: currentTool.title,
    description: currentTool.fullDescription
  })
})

const currency = ref('USD')
const copied = ref(false)

const initialInvestment = ref<number | null>(10000)
const finalValue = ref<number | null>(14500)
const additionalCosts = ref<number | null>(500)
const additionalIncome = ref<number | null>(0)

function resetForm() {
  initialInvestment.value = null
  finalValue.value = null
  additionalCosts.value = null
  additionalIncome.value = null
}

const result = computed(() => {
  return calculateRoi({
    initialInvestment: initialInvestment.value || 0,
    finalValue: finalValue.value || 0,
    additionalCosts: additionalCosts.value || 0,
    additionalIncome: additionalIncome.value || 0
  })
})

async function handleCopy() {
  const summary = [
    'Return on Investment (ROI) Calculation',
    '----------------------------------------',
    `Initial Investment: ${formatCurrency(initialInvestment.value || 0, currency.value)}`,
    `Total Cost Basis: ${formatCurrency(result.value.totalCost, currency.value)}`,
    `Total Value Returned: ${formatCurrency(result.value.totalValueReturned, currency.value)}`,
    `Net Profit / Loss: ${formatCurrency(result.value.netProfit, currency.value)}`,
    `ROI Percentage: ${formatPercent(result.value.roiPercentage)}`
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

    <!-- Page Header -->
    <div class="mb-8">
      <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0F766E] mb-2">
        <Percent class="w-4 h-4" />
        <span>Performance &amp; Return</span>
      </div>
      <h1 class="text-2xl sm:text-4xl font-extrabold text-[#172033] tracking-tight mb-3">
        {{ currentTool.name }}
      </h1>
      <p class="text-base sm:text-lg text-[#667085] max-w-3xl leading-relaxed">
        {{ currentTool.fullDescription }}
      </p>
    </div>

    <!-- Main Calculator Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
      <!-- Input Panel (7 Cols) -->
      <div class="lg:col-span-7 bg-white rounded-2xl border border-[#E4E9F0] p-6 sm:p-8 shadow-sm">
        <div class="flex items-center justify-between pb-5 mb-6 border-b border-[#E4E9F0]">
          <div class="flex items-center gap-3">
            <span class="text-sm font-semibold text-[#172033]">Display Currency:</span>
            <select
              v-model="currency"
              class="text-sm border border-[#E4E9F0] rounded-lg px-2.5 py-1.5 bg-[#F7F9FC] text-[#172033] focus:outline-none focus:border-[#0F766E]"
              aria-label="Currency selection"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>

          <button
            type="button"
            class="inline-flex items-center gap-1.5 text-xs text-[#667085] hover:text-[#172033] py-1.5 px-3 rounded-lg hover:bg-[#F7F9FC] transition-colors"
            @click="resetForm"
          >
            <RotateCcw class="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        <div class="space-y-5">
          <!-- Initial Outlay -->
          <div>
            <label class="block text-sm font-semibold text-[#172033] mb-1.5">
              Initial Investment / Purchase Cost
            </label>
            <div class="relative">
              <span class="absolute left-3.5 top-2.5 text-sm text-[#667085]">{{ currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$' }}</span>
              <input
                v-model.number="initialInvestment"
                type="number"
                min="0"
                step="any"
                placeholder="10,000"
                class="w-full pl-8 pr-4 py-2.5 text-base bg-white border border-[#E4E9F0] rounded-xl num-tabular focus:border-[#0F766E]"
              />
            </div>
            <p class="text-xs text-[#667085] mt-1">Starting purchase price or initial capital committed.</p>
          </div>

          <!-- Final Value -->
          <div>
            <label class="block text-sm font-semibold text-[#172033] mb-1.5">
              Final Value / Revenue Received
            </label>
            <div class="relative">
              <span class="absolute left-3.5 top-2.5 text-sm text-[#667085]">{{ currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$' }}</span>
              <input
                v-model.number="finalValue"
                type="number"
                min="0"
                step="any"
                placeholder="14,500"
                class="w-full pl-8 pr-4 py-2.5 text-base bg-white border border-[#E4E9F0] rounded-xl num-tabular focus:border-[#0F766E]"
              />
            </div>
            <p class="text-xs text-[#667085] mt-1">Selling price, liquidation amount, or total proceeds returned.</p>
          </div>

          <!-- Advanced: Additional Costs & Income -->
          <div class="pt-4 border-t border-[#E4E9F0] grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-[#172033] mb-1">
                Additional Costs (Optional)
              </label>
              <div class="relative">
                <span class="absolute left-3 top-2 text-xs text-[#667085]">{{ currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$' }}</span>
                <input
                  v-model.number="additionalCosts"
                  type="number"
                  min="0"
                  placeholder="0.00"
                  class="w-full pl-7 pr-3 py-2 text-sm bg-[#F7F9FC] border border-[#E4E9F0] rounded-lg num-tabular"
                />
              </div>
              <span class="text-[11px] text-[#667085]">Setup fees, repairs, marketing, or maintenance.</span>
            </div>

            <div>
              <label class="block text-xs font-semibold text-[#172033] mb-1">
                Additional Income (Optional)
              </label>
              <div class="relative">
                <span class="absolute left-3 top-2 text-xs text-[#667085]">{{ currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$' }}</span>
                <input
                  v-model.number="additionalIncome"
                  type="number"
                  min="0"
                  placeholder="0.00"
                  class="w-full pl-7 pr-3 py-2 text-sm bg-[#F7F9FC] border border-[#E4E9F0] rounded-lg num-tabular"
                />
              </div>
              <span class="text-[11px] text-[#667085]">Dividends, rental cash flow, or residual payouts.</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Results Panel (5 Cols) -->
      <div class="lg:col-span-5 bg-white rounded-2xl border border-[#E4E9F0] p-6 sm:p-8 shadow-sm lg:sticky lg:top-24">
        <div class="flex items-center justify-between pb-4 mb-6 border-b border-[#E4E9F0]">
          <h2 class="text-lg font-bold text-[#172033]">ROI Results</h2>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#E4E9F0] hover:bg-[#F7F9FC] text-[#172033] transition-colors"
            @click="handleCopy"
          >
            <Check v-if="copied" class="w-3.5 h-3.5 text-[#15803D]" />
            <Copy v-else class="w-3.5 h-3.5 text-[#667085]" />
            <span>{{ copied ? 'Copied!' : 'Copy results' }}</span>
          </button>
        </div>

        <!-- Primary Output Callout -->
        <div 
          class="rounded-xl p-6 text-center mb-6 border"
          :class="result.netProfit >= 0 ? 'bg-[#E7F4F1] border-[#0F766E]/20' : 'bg-red-50 border-red-200'"
        >
          <div 
            class="text-xs font-semibold uppercase tracking-wider mb-1"
            :class="result.netProfit >= 0 ? 'text-[#0F766E]' : 'text-[#B42318]'"
          >
            Return on Investment (ROI)
          </div>
          <div 
            class="text-3xl sm:text-4xl font-extrabold num-tabular"
            :class="result.netProfit >= 0 ? 'text-[#172033]' : 'text-[#B42318]'"
          >
            {{ formatPercent(result.roiPercentage) }}
          </div>
          <div class="text-xs text-[#667085] mt-1.5 font-medium">
            {{ result.netProfit >= 0 ? 'Profitable Return' : 'Net Loss' }}
          </div>
        </div>

        <!-- Metric Breakdown -->
        <dl class="space-y-3.5 text-sm">
          <div class="flex items-center justify-between py-2 border-b border-[#E4E9F0]/60">
            <dt class="text-[#667085]">Total Capital Invested (Cost)</dt>
            <dd class="font-semibold text-[#172033] num-tabular">{{ formatCurrency(result.totalCost, currency) }}</dd>
          </div>
          <div class="flex items-center justify-between py-2 border-b border-[#E4E9F0]/60">
            <dt class="text-[#667085]">Total Proceeds Returned</dt>
            <dd class="font-semibold text-[#172033] num-tabular">{{ formatCurrency(result.totalValueReturned, currency) }}</dd>
          </div>
          <div class="flex items-center justify-between py-2 border-b border-[#E4E9F0]/60">
            <dt class="font-semibold text-[#172033]">Net Profit / Loss</dt>
            <dd 
              class="font-bold text-base num-tabular"
              :class="result.netProfit >= 0 ? 'text-[#15803D]' : 'text-[#B42318]'"
            >
              {{ result.netProfit >= 0 ? '+' : '' }}{{ formatCurrency(result.netProfit, currency) }}
            </dd>
          </div>
        </dl>

        <div v-if="result.totalCost === 0" class="mt-4 p-3 bg-amber-50 border border-amber-200 text-xs text-amber-800 rounded-lg">
          Please enter an initial cost greater than zero to calculate a valid percentage ROI.
        </div>

        <div class="mt-6">
          <DisclaimerNotice />
        </div>
      </div>
    </div>

    <!-- Explanatory & Guides -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
      <div class="lg:col-span-8 space-y-10">
        <section class="bg-white rounded-2xl border border-[#E4E9F0] p-6 sm:p-8">
          <h2 class="text-xl font-bold text-[#172033] mb-4">How ROI is Calculated</h2>
          <p class="text-sm text-[#667085] leading-relaxed mb-4">
            Return on Investment compares net economic gains to the total capital invested. Net profit is computed by subtracting total costs from total gross proceeds.
          </p>
          <div class="bg-[#F7F9FC] border border-[#E4E9F0] p-4 rounded-xl num-tabular text-sm text-[#172033] mb-4 font-mono">
            {{ currentTool.formula }}
          </div>
          <p class="text-sm text-[#667085] leading-relaxed">
            Note: Standard ROI measures total cumulative return. It does not measure annualized velocity (how many years the gain required).
          </p>
        </section>

        <!-- Worked Example -->
        <section class="bg-white rounded-2xl border border-[#E4E9F0] p-6 sm:p-8">
          <h2 class="text-xl font-bold text-[#172033] mb-4">Worked Example</h2>
          <div class="space-y-3 text-sm text-[#667085] leading-relaxed">
            <p>Suppose you spend $5,000 to launch an e-commerce product line, plus $1,000 on digital advertising ($6,000 total cost). In 12 months, the inventory produces $9,600 in total sales revenue:</p>
            <ul class="list-disc list-inside space-y-1.5 pl-2 font-mono text-xs text-[#172033]">
              <li>Total Cost = $5,000 + $1,000 = $6,000.00</li>
              <li>Total Value Returned = $9,600.00</li>
              <li>Net Profit = $9,600 − $6,000 = $3,600.00</li>
            </ul>
            <div class="p-3 bg-[#E7F4F1] rounded-lg font-mono text-sm text-[#0F766E] font-semibold">
              ROI = ($3,600 ÷ $6,000) × 100 = 60.0%
            </div>
          </div>
        </section>

        <!-- Assumptions & Limitations -->
        <section class="bg-white rounded-2xl border border-[#E4E9F0] p-6 sm:p-8">
          <h2 class="text-xl font-bold text-[#172033] mb-4">Assumptions &amp; Limitations</h2>
          <ul class="space-y-2 text-sm text-[#667085] list-disc list-inside leading-relaxed">
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
        <div class="bg-white rounded-2xl border border-[#E4E9F0] p-6">
          <h3 class="text-base font-bold text-[#172033] mb-2">Learn More About ROI</h3>
          <p class="text-xs text-[#667085] leading-relaxed mb-4">
            Read our in-depth guide on interpreting ROI versus annualized returns (CAGR).
          </p>
          <RouterLink
            to="/learn/how-to-calculate-roi/"
            class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F766E] hover:underline"
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
