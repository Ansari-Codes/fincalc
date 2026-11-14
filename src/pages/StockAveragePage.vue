<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { updatePageSeo } from '@/utils/seo'
import { generateCalculatorSchema } from '@/utils/structuredData'
import { formatCurrency, formatNumber, copyToClipboard } from '@/utils/formatters'
import { calculateStockAverage, type StockPurchaseRow } from '@/calculations/stockAverage'
import Breadcrumbs from '@/components/ui/Breadcrumbs.vue'
import FAQAccordion from '@/components/ui/FAQAccordion.vue'
import RelatedTools from '@/components/ui/RelatedTools.vue'
import DisclaimerNotice from '@/components/ui/DisclaimerNotice.vue'
import { tools } from '@/data/tools'
import { 
  Plus, 
  Trash2, 
  RotateCcw, 
  Copy, 
  Check, 
  TrendingUp, 
  ArrowRight,
  AlertCircle 
} from '@lucide/vue'

const currentTool = tools.find(t => t.slug === 'stock-average-calculator')!

onMounted(() => {
  updatePageSeo({
    title: currentTool.title,
    description: currentTool.fullDescription,
    path: currentTool.path,
    jsonLd: generateCalculatorSchema(currentTool)
  })
})

const currency = ref('USD')
const includeFees = ref(true)
const showHypothetical = ref(false)
const copied = ref(false)

const purchases = ref<StockPurchaseRow[]>([
  { id: '1', price: 100, shares: 10, fee: 0 },
  { id: '2', price: 120, shares: 15, fee: 0 }
])

const hypothetical = ref({
  price: 90,
  shares: 10,
  fee: 0
})

function addRow() {
  purchases.value.push({
    id: Date.now().toString(),
    price: 0,
    shares: 0,
    fee: 0
  })
}

function removeRow(index: number) {
  if (purchases.value.length > 1) {
    purchases.value.splice(index, 1)
  }
}

function resetForm() {
  purchases.value = [
    { id: '1', price: 0, shares: 0, fee: 0 }
  ]
  hypothetical.value = { price: 0, shares: 0, fee: 0 }
  showHypothetical.value = false
}

const result = computed(() => {
  return calculateStockAverage({
    purchases: purchases.value,
    includeFees: includeFees.value,
    hypothetical: showHypothetical.value ? hypothetical.value : undefined
  })
})

async function handleCopy() {
  const summary = [
    'Stock Average Cost Calculation',
    '--------------------------------',
    `Total Shares: ${formatNumber(result.value.totalShares)}`,
    `Weighted Average Cost / Share: ${formatCurrency(result.value.weightedAverageCost, currency.value)}`,
    `Total Capital Invested: ${formatCurrency(result.value.totalCost, currency.value)}`,
    `Total Broker Fees: ${formatCurrency(result.value.totalFees, currency.value)}`,
    result.value.hypotheticalProjected ? `Projected Average After Next Buy: ${formatCurrency(result.value.hypotheticalProjected.newWeightedAverageCost, currency.value)}` : ''
  ].filter(Boolean).join('\n')

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
      { name: 'Stock Average Calculator' }
    ]" />

    <!-- Page Header -->
    <div class="mb-8">
      <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0F766E] mb-2">
        <TrendingUp class="w-4 h-4" />
        <span>Investing Calculator</span>
      </div>
      <h1 class="text-2xl sm:text-4xl font-extrabold text-[#172033] tracking-tight mb-3">
        {{ currentTool.name }}
      </h1>
      <p class="text-base sm:text-lg text-[#667085] max-w-3xl leading-relaxed">
        {{ currentTool.fullDescription }}
      </p>
    </div>

    <!-- Validation Warning Banner -->
    <div v-if="!result.isValid && result.validationErrors.length > 0" class="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5">
      <div v-for="(err, i) in result.validationErrors" :key="i" class="flex items-center gap-2">
        <AlertCircle class="w-4 h-4 text-amber-600 shrink-0" />
        <span>{{ err }}</span>
      </div>
    </div>

    <!-- Main Calculator Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
      <!-- Input Panel (7 Cols) -->
      <div class="lg:col-span-7 bg-white rounded-2xl border border-[#E4E9F0] p-6 sm:p-8 shadow-sm">
        <div class="flex flex-wrap items-center justify-between pb-5 mb-6 border-b border-[#E4E9F0] gap-4">
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

          <label class="flex items-center gap-2 cursor-pointer text-sm text-[#172033]">
            <input
              v-model="includeFees"
              type="checkbox"
              class="w-4 h-4 rounded text-[#0F766E] focus:ring-[#0F766E]"
            />
            <span class="font-medium">Include broker fees in cost</span>
          </label>
        </div>

        <!-- Purchase Rows -->
        <div class="space-y-4 mb-6">
          <div class="hidden sm:grid sm:grid-cols-12 gap-3 text-xs font-semibold uppercase text-[#667085] px-1">
            <div class="col-span-1">#</div>
            <div class="col-span-4">Purchase Price</div>
            <div class="col-span-4">Number of Shares</div>
            <div class="col-span-2">Fee (Optional)</div>
            <div class="col-span-1 text-center">Action</div>
          </div>

          <div
            v-for="(row, index) in purchases"
            :key="row.id"
            class="p-4 sm:p-2 bg-[#F7F9FC] sm:bg-transparent rounded-xl sm:rounded-none border sm:border-0 border-[#E4E9F0] grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
          >
            <div class="sm:col-span-1 font-semibold text-xs text-[#667085]">
              Lot {{ index + 1 }}
            </div>

            <div class="sm:col-span-4">
              <label class="block sm:hidden text-xs font-medium text-[#667085] mb-1">Purchase Price</label>
              <div class="relative">
                <span class="absolute left-3 top-2.5 text-xs text-[#667085]">{{ currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$' }}</span>
                <input
                  v-model.number="row.price"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  class="w-full pl-7 pr-3 py-2 text-sm bg-white border border-[#E4E9F0] rounded-lg num-tabular focus:border-[#0F766E]"
                />
              </div>
            </div>

            <div class="sm:col-span-4">
              <label class="block sm:hidden text-xs font-medium text-[#667085] mb-1">Number of Shares</label>
              <input
                v-model.number="row.shares"
                type="number"
                min="0"
                step="any"
                placeholder="Shares"
                class="w-full px-3 py-2 text-sm bg-white border border-[#E4E9F0] rounded-lg num-tabular focus:border-[#0F766E]"
              />
            </div>

            <div class="sm:col-span-2">
              <label class="block sm:hidden text-xs font-medium text-[#667085] mb-1">Fee (Optional)</label>
              <input
                v-model.number="row.fee"
                type="number"
                min="0"
                step="any"
                placeholder="0"
                class="w-full px-3 py-2 text-sm bg-white border border-[#E4E9F0] rounded-lg num-tabular focus:border-[#0F766E]"
              />
            </div>

            <div class="sm:col-span-1 flex justify-end sm:justify-center">
              <button
                type="button"
                :disabled="purchases.length === 1"
                class="p-2 text-[#667085] hover:text-[#B42318] disabled:opacity-30 disabled:hover:text-[#667085] transition-colors rounded-lg"
                title="Remove purchase row"
                aria-label="Remove purchase row"
                @click="removeRow(index)"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- Add Row & Reset Buttons -->
        <div class="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#E4E9F0]">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-[#0F766E] bg-[#E7F4F1] hover:bg-[#d6eee7] transition-colors"
            @click="addRow"
          >
            <Plus class="w-4 h-4" />
            <span>Add purchase lot</span>
          </button>

          <button
            type="button"
            class="inline-flex items-center gap-1.5 text-xs text-[#667085] hover:text-[#172033] py-2 px-3 rounded-lg hover:bg-[#F7F9FC] transition-colors"
            @click="resetForm"
          >
            <RotateCcw class="w-3.5 h-3.5" />
            <span>Reset form</span>
          </button>
        </div>

        <!-- Hypothetical Scenario Toggle & Inputs -->
        <div class="mt-8 pt-6 border-t border-[#E4E9F0]">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-sm font-bold text-[#172033]">Hypothetical Additional Purchase</h3>
              <p class="text-xs text-[#667085]">Explore how buying more shares will change your average cost.</p>
            </div>
            <button
              type="button"
              class="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors"
              :class="showHypothetical ? 'bg-[#0F766E] text-white border-[#0F766E]' : 'bg-[#F7F9FC] text-[#667085] border-[#E4E9F0]'"
              @click="showHypothetical = !showHypothetical"
            >
              {{ showHypothetical ? 'Active' : '+ Test next buy' }}
            </button>
          </div>

          <div v-if="showHypothetical" class="p-4 bg-[#F7F9FC] rounded-xl border border-[#E4E9F0] grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-[#172033] mb-1">Target Price / Share</label>
              <input
                v-model.number="hypothetical.price"
                type="number"
                min="0"
                class="w-full px-3 py-2 text-sm bg-white border border-[#E4E9F0] rounded-lg num-tabular"
                placeholder="0.00"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-[#172033] mb-1">Number of Shares to Buy</label>
              <input
                v-model.number="hypothetical.shares"
                type="number"
                min="0"
                class="w-full px-3 py-2 text-sm bg-white border border-[#E4E9F0] rounded-lg num-tabular"
                placeholder="Shares"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Results Panel (5 Cols) -->
      <div class="lg:col-span-5 bg-white rounded-2xl border border-[#E4E9F0] p-6 sm:p-8 shadow-sm lg:sticky lg:top-24">
        <div class="flex items-center justify-between pb-4 mb-6 border-b border-[#E4E9F0]">
          <h2 class="text-lg font-bold text-[#172033]">Calculation Results</h2>
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
        <div class="bg-[#E7F4F1] border border-[#0F766E]/20 rounded-xl p-6 text-center mb-6">
          <div class="text-xs font-semibold uppercase tracking-wider text-[#0F766E] mb-1">
            Weighted Average Cost Per Share
          </div>
          <div class="text-3xl sm:text-4xl font-extrabold text-[#172033] num-tabular">
            {{ formatCurrency(result.weightedAverageCost, currency) }}
          </div>
          <div class="text-xs text-[#667085] mt-1.5">
            Across {{ formatNumber(result.totalShares) }} total shares
          </div>
        </div>

        <!-- Metric Breakdown List -->
        <dl class="space-y-3.5 text-sm">
          <div class="flex items-center justify-between py-2 border-b border-[#E4E9F0]/60">
            <dt class="text-[#667085]">Total Shares Owned</dt>
            <dd class="font-semibold text-[#172033] num-tabular">{{ formatNumber(result.totalShares) }}</dd>
          </div>
          <div class="flex items-center justify-between py-2 border-b border-[#E4E9F0]/60">
            <dt class="text-[#667085]">Total Cost (Before Fees)</dt>
            <dd class="font-semibold text-[#172033] num-tabular">{{ formatCurrency(result.totalCostBeforeFees, currency) }}</dd>
          </div>
          <div class="flex items-center justify-between py-2 border-b border-[#E4E9F0]/60">
            <dt class="text-[#667085]">Total Transaction Fees</dt>
            <dd class="font-semibold text-[#172033] num-tabular">{{ formatCurrency(result.totalFees, currency) }}</dd>
          </div>
          <div class="flex items-center justify-between py-2 border-b border-[#E4E9F0]/60">
            <dt class="font-medium text-[#172033]">Total Cost Basis</dt>
            <dd class="font-bold text-[#172033] num-tabular">{{ formatCurrency(result.totalCost, currency) }}</dd>
          </div>

          <!-- Hypothetical Callout in Results -->
          <div v-if="result.hypotheticalProjected" class="mt-4 pt-4 border-t border-[#E4E9F0] bg-[#F7F9FC] p-4 rounded-xl">
            <div class="text-xs font-semibold uppercase text-[#0F766E] mb-1">
              Projected If Next Buy Is Completed:
            </div>
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs text-[#667085]">New Weighted Average:</span>
              <span class="font-bold text-[#172033] num-tabular">{{ formatCurrency(result.hypotheticalProjected.newWeightedAverageCost, currency) }}</span>
            </div>
            <div class="flex items-center justify-between text-xs text-[#667085]">
              <span>New Total Shares:</span>
              <span class="num-tabular font-medium text-[#172033]">{{ formatNumber(result.hypotheticalProjected.newTotalShares) }}</span>
            </div>
          </div>
        </dl>

        <div class="mt-6">
          <DisclaimerNotice />
        </div>
      </div>
    </div>

    <!-- Educational & Explanatory Sections Below Calculator -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
      <div class="lg:col-span-8 space-y-10">
        <!-- How it works & Formula -->
        <section class="bg-white rounded-2xl border border-[#E4E9F0] p-6 sm:p-8">
          <h2 class="text-xl font-bold text-[#172033] mb-4">How the Stock Average Calculation Works</h2>
          <p class="text-sm text-[#667085] leading-relaxed mb-4">
            When buying stock at various prices, simple averaging is distorted by share volume. A weighted average cost accounts for the proportion of total capital invested in each lot.
          </p>
          <div class="bg-[#F7F9FC] border border-[#E4E9F0] p-4 rounded-xl num-tabular text-sm text-[#172033] mb-4 font-mono">
            {{ currentTool.formula }}
          </div>
          <p class="text-sm text-[#667085] leading-relaxed">
            By multiplying each lot's share quantity by its execution price, we determine the exact dollar capital expended. Dividing this cumulative expenditure by total shares yields your true break-even price.
          </p>
        </section>

        <!-- Worked Example -->
        <section class="bg-white rounded-2xl border border-[#E4E9F0] p-6 sm:p-8">
          <h2 class="text-xl font-bold text-[#172033] mb-4">Worked Example</h2>
          <div class="space-y-3 text-sm text-[#667085] leading-relaxed">
            <p>Suppose you make two separate purchases of an index ETF:</p>
            <ul class="list-disc list-inside space-y-1.5 pl-2 font-mono text-xs text-[#172033]">
              <li>Lot 1: 20 shares at $150.00 each = $3,000.00</li>
              <li>Lot 2: 30 shares at $130.00 each = $3,900.00</li>
            </ul>
            <p>
              Your total cash spent is $6,900.00 for 50 shares total.
            </p>
            <div class="p-3 bg-[#E7F4F1] rounded-lg font-mono text-sm text-[#0F766E] font-semibold">
              Weighted Average Cost = $6,900.00 ÷ 50 shares = $138.00 / share
            </div>
            <p class="text-xs text-[#667085]">
              (Note: a simple unweighted average of $150 and $130 would be $140.00, which ignores that you bought more shares at $130).
            </p>
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

        <!-- Tool FAQs -->
        <section>
          <FAQAccordion :items="currentTool.faqs" title="Frequently Asked Questions" />
        </section>
      </div>

      <!-- Sidebar Context / Quick Links (4 Cols) -->
      <div class="lg:col-span-4 space-y-6">
        <div class="bg-white rounded-2xl border border-[#E4E9F0] p-6">
          <h3 class="text-base font-bold text-[#172033] mb-2">Need a Related Guide?</h3>
          <p class="text-xs text-[#667085] leading-relaxed mb-4">
            Learn why tax cost basis can diverge from internal average cost under IRS accounting guidelines.
          </p>
          <RouterLink
            to="/learn/how-to-calculate-average-stock-cost/"
            class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F766E] hover:underline"
          >
            <span>Read Stock Cost Basis Guide</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </RouterLink>
        </div>

        <div class="bg-white rounded-2xl border border-[#E4E9F0] p-6 text-xs text-[#667085] space-y-2">
          <div class="font-semibold text-[#172033]">Tool Data &amp; Verification</div>
          <div>Calculations verified against US standard accounting rules.</div>
          <div>Last reviewed: November 2026.</div>
        </div>
      </div>
    </div>

    <!-- Related Tools Section -->
    <RelatedTools
      :current-slug="currentTool.slug"
      :tool-slugs="currentTool.relatedToolSlugs"
      :article-slugs="currentTool.relatedArticleSlugs"
    />
  </div>
</template>
