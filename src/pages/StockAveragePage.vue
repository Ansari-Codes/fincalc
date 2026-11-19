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
  AlertCircle,
  Layers,
  Sparkles
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
    { id: '1', price: 100, shares: 10, fee: 0 },
    { id: '2', price: 120, shares: 15, fee: 0 }
  ]
  hypothetical.value = { price: 90, shares: 10, fee: 0 }
  showHypothetical.value = false
}

function loadSample(scenario: 'dca' | 'dip' | 'growth') {
  if (scenario === 'dca') {
    purchases.value = [
      { id: '1', price: 150, shares: 20, fee: 0 },
      { id: '2', price: 140, shares: 25, fee: 0 },
      { id: '3', price: 130, shares: 30, fee: 0 }
    ]
  } else if (scenario === 'dip') {
    purchases.value = [
      { id: '1', price: 220, shares: 15, fee: 0 },
      { id: '2', price: 180, shares: 35, fee: 0 }
    ]
  } else {
    purchases.value = [
      { id: '1', price: 50, shares: 100, fee: 5 },
      { id: '2', price: 75, shares: 50, fee: 5 },
      { id: '3', price: 95, shares: 40, fee: 5 }
    ]
  }
}

const result = computed(() => {
  return calculateStockAverage({
    purchases: purchases.value,
    includeFees: includeFees.value,
    hypothetical: showHypothetical.value ? hypothetical.value : undefined
  })
})

// Visual share distribution of lots
const lotShares = computed(() => {
  const total = result.value.totalShares
  if (total <= 0) return []
  return purchases.value.map((p, idx) => {
    const s = Number(p.shares) || 0
    const pct = (s / total) * 100
    // Distinct colors for up to 6 lots
    const colors = ['bg-emerald-400', 'bg-sky-400', 'bg-amber-300', 'bg-purple-400', 'bg-pink-400', 'bg-teal-300']
    return {
      lotNumber: idx + 1,
      shares: s,
      pct,
      color: colors[idx % colors.length]
    }
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

    <!-- Tool Instrument Header -->
    <div class="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div>
        <div class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0F766E] bg-[#E7F4F1] px-3 py-1 rounded-full mb-2.5">
          <TrendingUp class="w-3.5 h-3.5" />
          <span>Interactive Cost Basis Instrument</span>
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
        <div class="flex flex-wrap items-center justify-between pb-4 mb-6 border-b border-[#F1F5F9] gap-3">
          <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#475569]">
            <Layers class="w-4 h-4 text-[#0F766E]" />
            <span>Purchase Lots Ledger</span>
          </div>

          <!-- Quick Scenario Presets -->
          <div class="flex items-center gap-1.5">
            <span class="text-[11px] font-semibold text-[#94A3B8]">Demos:</span>
            <button
              type="button"
              @click="loadSample('dca')"
              class="text-[11px] font-bold px-2 py-0.5 rounded bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] transition-colors"
            >
              DCA
            </button>
            <button
              type="button"
              @click="loadSample('dip')"
              class="text-[11px] font-bold px-2 py-0.5 rounded bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] transition-colors"
            >
              Dip Buy
            </button>
            <button
              type="button"
              @click="loadSample('growth')"
              class="text-[11px] font-bold px-2 py-0.5 rounded bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] transition-colors"
            >
              Growth
            </button>
          </div>
        </div>

        <form @submit.prevent class="space-y-4">
          <!-- Table Header -->
          <div class="hidden sm:grid sm:grid-cols-12 gap-3 text-[11px] font-bold uppercase tracking-wider text-[#64748B] px-3">
            <div class="col-span-1">Lot</div>
            <div class="col-span-4">Execution Price</div>
            <div class="col-span-4">Share Count</div>
            <div class="col-span-2">Fee (Opt)</div>
            <div class="col-span-1 text-center">Del</div>
          </div>

          <!-- Purchase Rows -->
          <div
            v-for="(row, index) in purchases"
            :key="row.id"
            class="p-4 sm:p-3 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] grid grid-cols-1 sm:grid-cols-12 gap-3 items-center hover:border-[#CBD5E1] transition-colors"
          >
            <div class="sm:col-span-1 flex items-center justify-between sm:justify-start">
              <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#E2E8F0] text-[#334155] font-black text-xs">
                {{ index + 1 }}
              </span>
              <span class="sm:hidden text-xs font-bold text-[#64748B]">Purchase Lot {{ index + 1 }}</span>
            </div>

            <!-- Price -->
            <div class="sm:col-span-4">
              <label class="block sm:hidden text-[11px] font-bold text-[#475569] mb-1">Execution Price</label>
              <div class="relative">
                <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#94A3B8]">$</span>
                <input
                  v-model.number="row.price"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  class="w-full pl-6 pr-2 py-1.5 text-right font-bold text-sm bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>
            </div>

            <!-- Shares -->
            <div class="sm:col-span-4">
              <label class="block sm:hidden text-[11px] font-bold text-[#475569] mb-1">Number of Shares</label>
              <div class="relative">
                <input
                  v-model.number="row.shares"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  class="w-full pl-2 pr-7 py-1.5 text-right font-bold text-sm bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
                <span class="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-bold text-[#94A3B8]">sh</span>
              </div>
            </div>

            <!-- Fee -->
            <div class="sm:col-span-2">
              <label class="block sm:hidden text-[11px] font-bold text-[#475569] mb-1">Fee (Optional)</label>
              <input
                v-model.number="row.fee"
                type="number"
                min="0"
                step="any"
                placeholder="0"
                class="w-full px-2 py-1.5 text-right font-bold text-xs bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              />
            </div>

            <!-- Delete -->
            <div class="sm:col-span-1 flex justify-end sm:justify-center">
              <button
                type="button"
                :disabled="purchases.length === 1"
                class="p-1.5 text-[#94A3B8] hover:text-rose-600 disabled:opacity-20 disabled:hover:text-[#94A3B8] transition-colors rounded-lg"
                title="Remove lot"
                aria-label="Remove lot"
                @click="removeRow(index)"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Add Lot & Options Bar -->
          <div class="flex flex-wrap items-center justify-between gap-3 pt-3">
            <button
              type="button"
              @click="addRow"
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#0F766E] bg-[#E7F4F1] hover:bg-[#d0ece5] transition-colors"
            >
              <Plus class="w-4 h-4" />
              <span>Add Purchase Lot</span>
            </button>

            <label class="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#475569]">
              <input
                v-model="includeFees"
                type="checkbox"
                class="w-4 h-4 rounded text-[#0F766E] focus:ring-[#0F766E]"
              />
              <span>Include broker fees in cost basis</span>
            </label>
          </div>

          <!-- Hypothetical Scenario Simulator -->
          <div class="mt-6 pt-5 border-t border-[#E2E8F0]">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-1.5">
                <Sparkles class="w-4 h-4 text-[#0F766E]" />
                <span class="text-xs font-bold text-[#0F172A]">Next Purchase Simulation</span>
              </div>
              <button
                type="button"
                @click="showHypothetical = !showHypothetical"
                class="text-xs font-bold px-3 py-1 rounded-lg border transition-all"
                :class="showHypothetical ? 'bg-[#0F766E] text-white border-[#0F766E]' : 'bg-[#F8FAFC] text-[#64748B] border-[#CBD5E1] hover:bg-[#E2E8F0]'"
              >
                {{ showHypothetical ? 'Simulation Active' : '+ Test Target Buy' }}
              </button>
            </div>

            <div v-if="showHypothetical" class="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/60 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-[#0F172A] mb-1">Planned Buy Price</label>
                <div class="relative">
                  <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#94A3B8]">$</span>
                  <input
                    v-model.number="hypothetical.price"
                    type="number"
                    min="0"
                    class="w-full pl-6 pr-2 py-1.5 text-right font-bold text-sm bg-white border border-[#CBD5E1] rounded-lg"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-[#0F172A] mb-1">Planned Shares to Buy</label>
                <div class="relative">
                  <input
                    v-model.number="hypothetical.shares"
                    type="number"
                    min="0"
                    class="w-full pl-2 pr-7 py-1.5 text-right font-bold text-sm bg-white border border-[#CBD5E1] rounded-lg"
                    placeholder="0"
                  />
                  <span class="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-[#94A3B8]">sh</span>
                </div>
              </div>
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
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              <span class="text-[11px] font-bold uppercase tracking-widest text-emerald-200">Position Basis Telemetry</span>
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
            <span class="text-xs font-semibold uppercase tracking-wider text-emerald-100">Weighted Average Cost / Share</span>
            <div class="text-3xl sm:text-4xl font-black text-white mt-1 num-tabular tracking-tight">
              {{ formatCurrency(result.weightedAverageCost, currency) }}
            </div>
            <div class="inline-flex items-center gap-1.5 text-xs text-emerald-200 mt-2 bg-black/20 px-2.5 py-1 rounded-full">
              <span>{{ formatNumber(result.totalShares) }} Total Shares</span>
              <span>•</span>
              <span>{{ purchases.length }} {{ purchases.length === 1 ? 'Lot' : 'Lots' }}</span>
            </div>
          </div>

          <!-- Visual Position Allocation Bar by Lot -->
          <div v-if="lotShares.length > 0" class="space-y-2 pt-2">
            <div class="flex items-center justify-between text-xs font-bold text-white/90">
              <span>Lot Weight Distribution</span>
              <span class="text-emerald-300">100% Accounted</span>
            </div>

            <!-- Proportional Multi-Segment Bar -->
            <div class="h-3.5 w-full bg-black/20 rounded-full overflow-hidden flex p-0.5 border border-white/20">
              <div
                v-for="lot in lotShares"
                :key="lot.lotNumber"
                :class="lot.color"
                class="h-full transition-all duration-300 first:rounded-l-full last:rounded-r-full"
                :style="{ width: `${lot.pct}%` }"
                :title="`Lot ${lot.lotNumber}: ${lot.pct.toFixed(1)}%`"
              ></div>
            </div>

            <!-- Legend with Percentages -->
            <div class="flex flex-wrap items-center gap-2.5 text-[11px] font-semibold text-white/80 pt-0.5">
              <div v-for="lot in lotShares" :key="lot.lotNumber" class="flex items-center gap-1">
                <span :class="lot.color" class="w-2.5 h-2.5 rounded-sm shrink-0"></span>
                <span>Lot {{ lot.lotNumber }} ({{ lot.pct.toFixed(0) }}%)</span>
              </div>
            </div>
          </div>

          <!-- Secondary Metric 2x2 Grid -->
          <div class="grid grid-cols-2 gap-3 pt-2">
            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <span class="text-[11px] font-semibold text-white/70 block">Total Capital Expended</span>
              <span class="text-sm sm:text-base font-bold text-white num-tabular mt-0.5 block">
                {{ formatCurrency(result.totalCost, currency) }}
              </span>
            </div>

            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <span class="text-[11px] font-semibold text-white/70 block">Broker Fees Paid</span>
              <span class="text-sm sm:text-base font-bold text-white num-tabular mt-0.5 block">
                {{ formatCurrency(result.totalFees, currency) }}
              </span>
            </div>

            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <span class="text-[11px] font-semibold text-white/70 block">Total Shares Count</span>
              <span class="text-sm sm:text-base font-bold text-white num-tabular mt-0.5 block">
                {{ formatNumber(result.totalShares) }}
              </span>
            </div>

            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <span class="text-[11px] font-semibold text-white/70 block">Pure Share Cost</span>
              <span class="text-sm sm:text-base font-bold text-white num-tabular mt-0.5 block">
                {{ formatCurrency(result.totalCostBeforeFees, currency) }}
              </span>
            </div>
          </div>

          <!-- Hypothetical Projection Card in HUD -->
          <div v-if="result.hypotheticalProjected" class="bg-emerald-950/40 border border-emerald-400/30 rounded-2xl p-4 space-y-2">
            <span class="text-[11px] font-bold uppercase tracking-wider text-emerald-300 block">
              Simulation: Next Buy Impact
            </span>
            <div class="flex items-center justify-between">
              <span class="text-xs text-white/80">Projected New Average:</span>
              <span class="text-base font-black text-white num-tabular">
                {{ formatCurrency(result.hypotheticalProjected.newWeightedAverageCost, currency) }}
              </span>
            </div>
            <div class="flex items-center justify-between text-xs text-emerald-200/80">
              <span>Projected Total Shares:</span>
              <span class="font-bold text-white num-tabular">{{ formatNumber(result.hypotheticalProjected.newTotalShares) }}</span>
            </div>
          </div>

          <div class="pt-2">
            <DisclaimerNotice />
          </div>
        </div>
      </div>
    </div>

    <!-- Educational & Explanatory Sections Below Calculator -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
      <div class="lg:col-span-8 space-y-8">
        <!-- Section 1: Simple vs Weighted Averaging -->
        <section class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
          <h2 class="text-xl font-extrabold text-[#0F172A] mb-3">Why Simple Price Averaging Fails for Stock Purchases</h2>
          <p class="text-sm text-[#64748B] leading-relaxed mb-4">
            When buying shares of a stock or ETF across multiple transactions, investors pay different market prices. Many investors mistakenly take a simple arithmetic average of their execution prices. However, simple averaging completely ignores the number of shares bought in each trade.
          </p>
          <div class="p-4 bg-[#F8FAFC] border border-[#CBD5E1] rounded-2xl text-xs sm:text-sm text-[#0F172A] space-y-2 mb-4 leading-relaxed">
            <p><strong>Consider this example:</strong> You buy 10 shares of a company at $50, and later purchase 90 shares of the same company at $100.</p>
            <p>• <em>Simple Average:</em> ($50 + $100) ÷ 2 = <strong>$75.00</strong></p>
            <p>• <em>Actual Weighted Average:</em> [(10 × $50) + (90 × $100)] ÷ 100 shares = ($500 + $9,000) ÷ 100 = <strong>$95.00</strong></p>
          </div>
          <p class="text-sm text-[#64748B] leading-relaxed">
            Because 90% of your capital was invested at $100, your real break-even cost is $95.00, not $75.00. Using a simple average would lead you to believe you are in profit when you may still be at a net loss.
          </p>
        </section>

        <!-- Section 2: Mathematical Methodology -->
        <section class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
          <h2 class="text-xl font-extrabold text-[#0F172A] mb-3">Weighted Average Cost Methodology</h2>
          <p class="text-sm text-[#64748B] leading-relaxed mb-4">
            The weighted average cost calculation aggregates the total dollars spent across every purchase lot (including any trading commissions or regulatory fees) and divides that total capital by the aggregate number of shares currently held:
          </p>
          <div class="bg-[#F8FAFC] border border-[#CBD5E1] p-4 rounded-xl num-tabular text-xs sm:text-sm text-[#0F172A] mb-4 font-mono whitespace-pre-line leading-relaxed">
            {{ currentTool.formula }}
          </div>
          <p class="text-sm text-[#64748B] leading-relaxed">
            Each lot's share quantity serves as its statistical weight. The more shares you purchase at a specific price, the more heavily that price influences your overall portfolio cost basis.
          </p>
        </section>

        <!-- Section 3: Handling Transaction Fees -->
        <section class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
          <h2 class="text-xl font-extrabold text-[#0F172A] mb-3">Accounting for Brokerage Fees &amp; Commissions</h2>
          <p class="text-sm text-[#64748B] leading-relaxed mb-4">
            While many retail brokerages offer commission-free trading on standard US equities, options traders, international investors, OTC equity traders, and users paying wire or currency fees still face transaction expenses.
          </p>
          <p class="text-sm text-[#64748B] leading-relaxed mb-4">
            When you enable the <strong class="text-[#0F172A]">"Include broker fees in cost basis"</strong> option, each lot's fees are added to the numerator of the formula. This raises your calculated average cost per share, showing you the exact gross selling price required to achieve a true net break-even after recouping all trading costs.
          </p>
        </section>

        <!-- Section 4: DCA vs Averaging Down -->
        <section class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
          <h2 class="text-xl font-extrabold text-[#0F172A] mb-3">Dollar-Cost Averaging (DCA) vs. "Averaging Down"</h2>
          <div class="space-y-4 text-sm text-[#64748B] leading-relaxed">
            <p>
              <strong class="text-[#0F172A]">Dollar-Cost Averaging (DCA):</strong> A systematic investment strategy where you invest a fixed dollar amount at regular intervals (e.g., $500 every month), regardless of market fluctuations. Over time, you automatically purchase more shares when prices are low and fewer shares when prices are high, smoothing out volatility.
            </p>
            <p>
              <strong class="text-[#0F172A]">Averaging Down:</strong> Buying more shares specifically because a stock has fallen in price. While averaging down reduces your average cost per share, it also increases your concentration risk in a deteriorating security. Ensure the underlying business fundamentals remain strong before committing additional capital.
            </p>
          </div>
        </section>

        <!-- Section 5: Tax Cost Basis vs Average Cost -->
        <section class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
          <h2 class="text-xl font-extrabold text-[#0F172A] mb-3">Average Cost vs. Official IRS Tax Cost Basis</h2>
          <p class="text-sm text-[#64748B] leading-relaxed mb-4">
            It is critical to distinguish an internal portfolio weighted average price from statutory tax cost basis rules when you liquidate shares:
          </p>
          <ul class="space-y-2.5 text-sm text-[#64748B] list-disc list-inside leading-relaxed mb-4">
            <li>
              <strong class="text-[#0F172A]">IRS Default (FIFO – Treas. Reg. § 1.1012-1(c)):</strong> Under US federal tax law (IRS Publication 550), if an investor does not adequately identify which specific lot is being sold, the IRS mandates the First-In, First-Out (FIFO) method. Oldest purchases are deemed sold first, resulting in capital gain/loss figures that often deviate widely from an arithmetic average.
            </li>
            <li>
              <strong class="text-[#0F172A]">Specific Identification (SpecID):</strong> Investors can instruct their brokerage before trade settlement to sell designated lots (e.g., Highest-In, First-Out / HIFO to harvest losses, or long-term holdings to secure lower capital gains rates).
            </li>
            <li>
              <strong class="text-[#0F172A]">Mutual Funds &amp; DRIPs (Treas. Reg. § 1.1012-1(e)):</strong> The average cost basis method is explicitly permitted for regulated investment company (mutual fund) shares and qualifying dividend reinvestment plans. However, for individual corporate stocks, average basis is not permitted for US tax reporting unless specific custodial exceptions apply.
            </li>
            <li>
              <strong class="text-[#0F172A]">International Caveat:</strong> Tax laws differ outside the United States. For example, the UK HMRC requires "Section 104 holding" pooling (which is a form of average cost basis), while the Canada Revenue Agency (CRA) mandates an Adjusted Cost Base (ACB) pooling calculation. Always consult a licensed tax professional or relevant tax code for your jurisdiction.
            </li>
          </ul>
          <p class="text-sm text-[#64748B] leading-relaxed">
            Read our in-depth <RouterLink to="/learn/how-to-calculate-average-stock-cost/" class="text-[#0F766E] font-semibold underline hover:text-[#115E59]">Average Stock Cost Educational Guide</RouterLink> to explore IRS lot rules and numerical examples.
          </p>
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

        <!-- Tool FAQs -->
        <section>
          <FAQAccordion :items="currentTool.faqs" title="Frequently Asked Questions About Stock Averaging" />
        </section>
      </div>

      <!-- Sidebar Context / Quick Links (4 Cols) -->
      <div class="lg:col-span-4 space-y-6">
        <div class="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-sm">
          <div class="text-xs font-bold uppercase tracking-wider text-[#0F766E] mb-2">Comprehensive Guide</div>
          <h3 class="text-base font-bold text-[#0F172A] mb-2">How to Calculate Average Stock Cost</h3>
          <p class="text-xs text-[#64748B] leading-relaxed mb-4">
            Understand quantity-weighted averaging, broker commission adjustments, and why tax cost basis can diverge under IRS rules.
          </p>
          <RouterLink
            to="/learn/how-to-calculate-average-stock-cost/"
            class="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F766E] hover:underline"
          >
            <span>Read Educational Guide</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </RouterLink>
        </div>

        <div class="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-sm">
          <div class="text-xs font-bold uppercase tracking-wider text-[#0F766E] mb-2">Measure Net Gains</div>
          <h3 class="text-base font-bold text-[#0F172A] mb-2">Return on Investment (ROI)</h3>
          <p class="text-xs text-[#64748B] leading-relaxed mb-4">
            Once you know your average share cost, calculate your total percentage profit or loss upon exit using our interactive ROI calculator.
          </p>
          <RouterLink
            to="/roi-calculator/"
            class="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F766E] hover:underline"
          >
            <span>Open ROI Calculator</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </RouterLink>
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
