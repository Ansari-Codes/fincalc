<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { updatePageSeo } from '@/utils/seo'
import { generateCalculatorSchema } from '@/utils/structuredData'
import { formatCurrency, formatPercent, copyToClipboard } from '@/utils/formatters'
import { calculateBreakEven } from '@/calculations/breakEven'
import Breadcrumbs from '@/components/ui/Breadcrumbs.vue'
import FAQAccordion from '@/components/ui/FAQAccordion.vue'
import RelatedTools from '@/components/ui/RelatedTools.vue'
import DisclaimerNotice from '@/components/ui/DisclaimerNotice.vue'
import { tools } from '@/data/tools'
import {
  PieChart,
  RotateCcw,
  Copy,
  Check,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Package,
  ShieldCheck,
  Target
} from '@lucide/vue'

const currentTool = tools.find(t => t.slug === 'break-even-calculator')!

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

// Input fields
const sellingPricePerUnit = ref<number | null>(50)
const variableCostPerUnit = ref<number | null>(20)
const totalFixedCosts = ref<number | null>(30000)
const targetProfit = ref<number | null>(15000)
const expectedSalesVolume = ref<number | null>(1200)

function resetForm() {
  sellingPricePerUnit.value = null
  variableCostPerUnit.value = null
  totalFixedCosts.value = null
  targetProfit.value = null
  expectedSalesVolume.value = null
}

const result = computed(() => {
  return calculateBreakEven({
    sellingPricePerUnit: sellingPricePerUnit.value ?? 0,
    variableCostPerUnit: variableCostPerUnit.value ?? 0,
    totalFixedCosts: totalFixedCosts.value ?? 0,
    targetProfit: targetProfit.value !== null && targetProfit.value !== undefined ? targetProfit.value : undefined,
    expectedSalesVolume: expectedSalesVolume.value !== null && expectedSalesVolume.value !== undefined ? expectedSalesVolume.value : undefined
  })
})

async function handleCopy() {
  const lines = [
    'Business Break-Even Analysis Summary',
    '-------------------------------------',
    `Selling Price per Unit: ${formatCurrency(sellingPricePerUnit.value || 0, currency.value)}`,
    `Variable Cost per Unit: ${formatCurrency(variableCostPerUnit.value || 0, currency.value)}`,
    `Total Fixed Costs: ${formatCurrency(totalFixedCosts.value || 0, currency.value)}`,
    `Contribution Margin: ${formatCurrency(result.value.contributionMarginPerUnit, currency.value)} per unit (${formatPercent(result.value.contributionMarginRatio)})`,
    `Break-Even Quantity: ${result.value.breakEvenUnitsRounded.toLocaleString()} units`,
    `Break-Even Revenue: ${formatCurrency(result.value.breakEvenRevenue, currency.value)}`,
    result.value.targetProfitUnitsRounded ? `Target Profit Units: ${result.value.targetProfitUnitsRounded.toLocaleString()} units (${formatCurrency(result.value.targetProfitRevenue || 0, currency.value)})` : '',
    result.value.marginOfSafetyUnits !== undefined ? `Margin of Safety: ${result.value.marginOfSafetyUnits.toLocaleString()} units (${formatPercent(result.value.marginOfSafetyPercentage || 0)})` : '',
    result.value.expectedProfitOrLoss !== undefined ? `Estimated Net Profit: ${formatCurrency(result.value.expectedProfitOrLoss, currency.value)}` : ''
  ].filter(Boolean)

  const ok = await copyToClipboard(lines.join('\n'))
  if (ok) {
    copied.value = true
    setTimeout(() => { copied.value = false }, 2500)
  }
}
</script>

<template>
  <div class="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
    <Breadcrumbs :items="[
      { name: 'Business Finance', path: '/tools/business-finance/' },
      { name: 'Break-Even Calculator' }
    ]" />

    <!-- Page Header -->
    <div class="mb-8">
      <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0F766E] mb-2">
        <PieChart class="w-4 h-4" />
        <span>Cost-Volume-Profit (CVP) Analysis</span>
      </div>
      <h1 class="text-2xl sm:text-4xl font-extrabold text-[#172033] tracking-tight mb-3">
        {{ currentTool.name }}
      </h1>
      <p class="text-base sm:text-lg text-[#667085] max-w-3xl leading-relaxed">
        {{ currentTool.fullDescription }}
      </p>
    </div>

    <!-- Calculator Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
      <!-- Input Panel -->
      <div class="lg:col-span-6 bg-white rounded-2xl border border-[#E4E7EC] p-6 sm:p-7 shadow-xs">
        <div class="flex items-center justify-between pb-4 mb-6 border-b border-[#F2F4F7]">
          <h2 class="text-lg font-bold text-[#172033]">Cost &amp; Price Parameters</h2>
          <div class="flex items-center gap-3">
            <select
              v-model="currency"
              aria-label="Display currency"
              class="text-xs font-semibold bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-2.5 py-1 text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CAD">CAD ($)</option>
            </select>
            <button
              type="button"
              @click="resetForm"
              class="inline-flex items-center gap-1.5 text-xs font-medium text-[#64748B] hover:text-[#0F766E] transition-colors"
            >
              <RotateCcw class="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        <form @submit.prevent class="space-y-5">
          <!-- Price & Variable Cost -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label for="unit-price" class="block text-xs font-semibold text-[#344054] mb-1.5">
                Selling Price per Unit (P)
              </label>
              <div class="relative">
                <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#94A3B8] font-medium">$</span>
                <input
                  id="unit-price"
                  v-model.number="sellingPricePerUnit"
                  type="number"
                  min="0.01"
                  step="1"
                  placeholder="50"
                  class="w-full pl-8 pr-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-xl text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>
              <p class="text-[11px] text-[#64748B] mt-1">Gross sales price billed per unit.</p>
            </div>

            <div>
              <label for="var-cost" class="block text-xs font-semibold text-[#344054] mb-1.5">
                Variable Cost per Unit (V)
              </label>
              <div class="relative">
                <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#94A3B8] font-medium">$</span>
                <input
                  id="var-cost"
                  v-model.number="variableCostPerUnit"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="20"
                  class="w-full pl-8 pr-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-xl text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>
              <p class="text-[11px] text-[#64748B] mt-1">Materials, packaging, direct labor, fees.</p>
            </div>
          </div>

          <!-- Total Fixed Costs -->
          <div>
            <label for="fixed-costs" class="block text-xs font-semibold text-[#344054] mb-1.5">
              Total Fixed Costs (F)
            </label>
            <div class="relative">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#94A3B8] font-medium">$</span>
              <input
                id="fixed-costs"
                v-model.number="totalFixedCosts"
                type="number"
                min="0"
                step="1000"
                placeholder="30000"
                class="w-full pl-8 pr-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-xl text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              />
            </div>
            <p class="text-[11px] text-[#64748B] mt-1">Total overhead: rent, software, insurance, salaries per period.</p>
          </div>

          <!-- Target Profit & Expected Sales Volume -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label for="target-profit" class="block text-xs font-semibold text-[#344054] mb-1.5">
                Target Profit (Optional)
              </label>
              <div class="relative">
                <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#94A3B8] font-medium">$</span>
                <input
                  id="target-profit"
                  v-model.number="targetProfit"
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="15000"
                  class="w-full pl-8 pr-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-xl text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>
              <p class="text-[11px] text-[#64748B] mt-1">Desired net operating income goal.</p>
            </div>

            <div>
              <label for="expected-volume" class="block text-xs font-semibold text-[#344054] mb-1.5">
                Expected Sales Volume (Units)
              </label>
              <input
                id="expected-volume"
                v-model.number="expectedSalesVolume"
                type="number"
                min="0"
                step="50"
                placeholder="1200"
                class="w-full px-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-xl text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              />
              <p class="text-[11px] text-[#64748B] mt-1">Calculates Margin of Safety and profit/loss.</p>
            </div>
          </div>
        </form>

        <!-- Validation Errors / Loss-making Warning -->
        <div v-if="!result.isValid && result.validationErrors.length > 0" class="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200">
          <div class="flex items-start gap-2.5">
            <AlertCircle class="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div class="text-xs text-amber-900 space-y-1">
              <p class="font-bold">Cannot calculate break-even:</p>
              <ul class="list-disc pl-4 space-y-0.5">
                <li v-for="(err, i) in result.validationErrors" :key="i">{{ err }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Results Panel -->
      <div class="lg:col-span-6 flex flex-col justify-between bg-gradient-to-br from-[#0B3B39] to-[#0F766E] rounded-2xl p-6 sm:p-8 text-white shadow-lg">
        <div>
          <div class="flex items-center justify-between pb-4 mb-6 border-b border-white/15">
            <div class="flex items-center gap-2">
              <Package class="w-5 h-5 text-[#99F6E4]" />
              <h2 class="text-base sm:text-lg font-bold tracking-tight">Break-Even Volume</h2>
            </div>
            <button
              type="button"
              @click="handleCopy"
              class="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <component :is="copied ? Check : Copy" class="w-3.5 h-3.5" />
              <span>{{ copied ? 'Copied' : 'Copy' }}</span>
            </button>
          </div>

          <!-- Hero Break-Even Units -->
          <div class="mb-6">
            <span class="text-xs uppercase tracking-wider text-[#99F6E4] font-semibold">
              Break-Even Sales Units
            </span>
            <div class="text-3xl sm:text-5xl font-black tracking-tight mt-1">
              {{ result.breakEvenUnitsRounded.toLocaleString() }} <span class="text-lg font-normal text-white/70">Units</span>
            </div>
            <p class="text-xs text-white/70 mt-1.5">
              Requires <strong>{{ formatCurrency(result.breakEvenRevenue, currency) }}</strong> in gross revenue to cover all fixed expenses.
            </p>
          </div>

          <!-- Margin of Safety Callout (if expected volume provided) -->
          <div v-if="result.marginOfSafetyUnits !== undefined" class="mb-6 bg-black/20 p-4 rounded-xl border border-white/10">
            <div class="flex items-center justify-between text-xs mb-1.5">
              <span class="font-bold text-[#99F6E4] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck class="w-4 h-4 text-emerald-300" />
                <span>Margin of Safety</span>
              </span>
              <span class="font-bold text-white">{{ formatPercent(result.marginOfSafetyPercentage || 0) }}</span>
            </div>
            <p class="text-xs text-white/80 leading-relaxed">
              At {{ expectedSalesVolume }} expected units, you have a cushion of <strong>{{ result.marginOfSafetyUnits.toLocaleString() }} units</strong> ({{ formatCurrency(result.marginOfSafetyRevenue || 0, currency) }}). Sales can fall by {{ (result.marginOfSafetyPercentage || 0).toFixed(1) }}% before you operate at a loss.
            </p>
            <div v-if="result.expectedProfitOrLoss !== undefined" class="mt-2 pt-2 border-t border-white/10 flex justify-between text-xs">
              <span class="text-white/70">Expected Operating Profit:</span>
              <span :class="(result.expectedProfitOrLoss || 0) >= 0 ? 'text-emerald-300 font-bold' : 'text-red-300 font-bold'">
                {{ formatCurrency(result.expectedProfitOrLoss || 0, currency) }}
              </span>
            </div>
          </div>

          <!-- Metric Cards Grid -->
          <div class="grid grid-cols-2 gap-3 mb-6">
            <div class="bg-white/10 backdrop-blur-xs rounded-xl p-3.5 border border-white/10">
              <div class="flex items-center gap-1.5 text-xs text-[#99F6E4] mb-1">
                <DollarSign class="w-3.5 h-3.5" />
                <span>Contribution Margin</span>
              </div>
              <div class="text-base sm:text-xl font-bold">
                {{ formatCurrency(result.contributionMarginPerUnit, currency) }}
              </div>
              <span class="text-[11px] text-white/60">Profit per unit sold</span>
            </div>

            <div class="bg-white/10 backdrop-blur-xs rounded-xl p-3.5 border border-white/10">
              <div class="flex items-center gap-1.5 text-xs text-[#99F6E4] mb-1">
                <TrendingUp class="w-3.5 h-3.5" />
                <span>Margin Ratio (CMR)</span>
              </div>
              <div class="text-base sm:text-xl font-bold">
                {{ formatPercent(result.contributionMarginRatio) }}
              </div>
              <span class="text-[11px] text-white/60">Portion of sales revenue</span>
            </div>

            <div v-if="result.targetProfitUnitsRounded" class="bg-white/10 backdrop-blur-xs rounded-xl p-3.5 border border-white/10">
              <div class="flex items-center gap-1.5 text-xs text-[#99F6E4] mb-1">
                <Target class="w-3.5 h-3.5" />
                <span>Target Profit Units</span>
              </div>
              <div class="text-base sm:text-xl font-bold">
                {{ result.targetProfitUnitsRounded.toLocaleString() }}
              </div>
              <span class="text-[11px] text-white/60">To earn {{ formatCurrency(targetProfit || 0, currency) }}</span>
            </div>

            <div v-if="result.targetProfitRevenue" class="bg-white/10 backdrop-blur-xs rounded-xl p-3.5 border border-white/10">
              <div class="flex items-center gap-1.5 text-xs text-[#99F6E4] mb-1">
                <DollarSign class="w-3.5 h-3.5" />
                <span>Target Revenue</span>
              </div>
              <div class="text-base sm:text-xl font-bold">
                {{ formatCurrency(result.targetProfitRevenue, currency) }}
              </div>
              <span class="text-[11px] text-white/60">Required sales volume</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Educational Content & Formula Explanation -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
      <div class="bg-white rounded-2xl border border-[#E4E7EC] p-6 shadow-xs">
        <h3 class="text-sm font-bold text-[#172033] uppercase tracking-wider mb-2 text-[#0F766E]">
          Cost-Volume-Profit Formulas
        </h3>
        <p class="text-xs text-[#667085] leading-relaxed mb-3">
          Break-even analysis calculates the point where total revenues equal total expenses:
        </p>
        <div class="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#CBD5E1] font-mono text-xs text-[#1E293B] overflow-x-auto mb-3 space-y-1">
          <div>Contribution Margin (CM) = Price − Variable Cost</div>
          <div>Break-Even Units (Q) = Fixed Costs ÷ CM</div>
          <div>Break-Even Revenue = Q × Price = Fixed Costs ÷ CMR</div>
        </div>
        <ul class="text-xs text-[#64748B] space-y-1">
          <li><strong>CM:</strong> Dollars from each sale that contribute to paying fixed overhead.</li>
          <li><strong>CMR:</strong> Percentage of each sales dollar remaining after variable costs.</li>
        </ul>
      </div>

      <div class="bg-white rounded-2xl border border-[#E4E7EC] p-6 shadow-xs">
        <h3 class="text-sm font-bold text-[#172033] uppercase tracking-wider mb-2 text-[#0F766E]">
          Key Assumptions &amp; Disclosures
        </h3>
        <ul class="text-xs text-[#667085] space-y-2 list-disc pl-4 leading-relaxed">
          <li v-for="(assumption, idx) in currentTool.assumptions" :key="idx">
            {{ assumption }}
          </li>
        </ul>
      </div>
    </div>

    <!-- FAQ Accordion -->
    <div class="mb-12">
      <h2 class="text-xl font-bold text-[#172033] mb-4">Frequently Asked Questions</h2>
      <FAQAccordion :items="currentTool.faqs" />
    </div>

    <!-- Related Tools -->
    <div class="mb-12">
      <h2 class="text-xl font-bold text-[#172033] mb-4">Related Financial Calculators</h2>
      <RelatedTools :tool-slugs="currentTool.relatedToolSlugs" />
    </div>

    <!-- Disclaimer -->
    <DisclaimerNotice />
  </div>
</template>
