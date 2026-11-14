<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { updatePageSeo } from '@/utils/seo'
import { generateCalculatorSchema } from '@/utils/structuredData'
import { formatCurrency, formatPercent, formatNumber, copyToClipboard } from '@/utils/formatters'
import { calculateCommission, type CommissionMode, type CommissionTier } from '@/calculations/commission'
import Breadcrumbs from '@/components/ui/Breadcrumbs.vue'
import FAQAccordion from '@/components/ui/FAQAccordion.vue'
import RelatedTools from '@/components/ui/RelatedTools.vue'
import DisclaimerNotice from '@/components/ui/DisclaimerNotice.vue'
import { tools } from '@/data/tools'
import { 
  RotateCcw, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  ArrowRight,
  AlertCircle,
  Sliders,
  Award
} from '@lucide/vue'

const currentTool = tools.find(t => t.slug === 'commission-calculator')!

onMounted(() => {
  updatePageSeo({
    title: currentTool.title,
    description: currentTool.fullDescription,
    path: currentTool.path,
    jsonLd: generateCalculatorSchema(currentTool)
  })
})

const currency = ref('USD')
const mode = ref<CommissionMode>('percentage')
const copied = ref(false)

// Percentage mode state
const salesAmount = ref<number | null>(75000)
const commissionRate = ref<number | null>(7.5)

// Fixed mode state
const numberOfSales = ref<number | null>(12)
const fixedPerSale = ref<number | null>(350)

// Tiered mode state
const tieredSalesAmount = ref<number | null>(125000)
const tiers = ref<CommissionTier[]>([
  { id: '1', threshold: 50000, rate: 5 },
  { id: '2', threshold: 100000, rate: 8 },
  { id: '3', threshold: Infinity, rate: 12 }
])

function addTier() {
  const uncappedIndex = tiers.value.findIndex(t => !isFinite(t.threshold))
  if (uncappedIndex !== -1) {
    const prevThreshold = uncappedIndex > 0 ? tiers.value[uncappedIndex - 1].threshold : 0
    const newThreshold = prevThreshold + 50000
    tiers.value.splice(uncappedIndex, 0, {
      id: Date.now().toString(),
      threshold: newThreshold,
      rate: 10
    })
  } else {
    const last = tiers.value[tiers.value.length - 1]
    const lastThreshold = last && isFinite(last.threshold) ? last.threshold : 100000
    tiers.value.push({
      id: Date.now().toString(),
      threshold: lastThreshold + 50000,
      rate: 12
    })
  }
}

function removeTier(index: number) {
  if (tiers.value.length > 1) {
    tiers.value.splice(index, 1)
  }
}

function resetForm() {
  salesAmount.value = 75000
  commissionRate.value = 7.5
  numberOfSales.value = 12
  fixedPerSale.value = 350
  tieredSalesAmount.value = 125000
}

const result = computed(() => {
  return calculateCommission({
    mode: mode.value,
    salesAmount: salesAmount.value || 0,
    commissionRate: commissionRate.value || 0,
    numberOfSales: numberOfSales.value || 0,
    fixedPerSale: fixedPerSale.value || 0,
    tieredSalesAmount: tieredSalesAmount.value || 0,
    tiers: tiers.value
  })
})

// Visual share of commission vs company revenue
const commissionSharePct = computed(() => {
  const sales = result.value.salesAmountUsed
  if (sales <= 0) return 10
  return Math.min(100, Math.max(0, (result.value.commissionEarned / sales) * 100))
})

const companyRetainedSharePct = computed(() => {
  return Math.max(0, 100 - commissionSharePct.value)
})

async function handleCopy() {
  const summary = [
    'Sales Commission Calculation',
    '------------------------------',
    `Calculation Mode: ${mode.value.toUpperCase()}`,
    `Commission Earned: ${formatCurrency(result.value.commissionEarned, currency.value)}`,
    mode.value !== 'fixed' ? `Sales Volume: ${formatCurrency(result.value.salesAmountUsed, currency.value)}` : '',
    mode.value !== 'fixed' ? `Effective Commission Rate: ${formatPercent(result.value.effectiveRate)}` : '',
    mode.value === 'fixed' ? `Deals Closed: ${numberOfSales.value} at ${formatCurrency(fixedPerSale.value || 0, currency.value)} / deal` : ''
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
      { name: 'Business Finance', path: '/tools/business-finance/' },
      { name: 'Commission Calculator' }
    ]" />

    <!-- Tool Instrument Header -->
    <div class="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div>
        <div class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0F766E] bg-[#E7F4F1] px-3 py-1 rounded-full mb-2.5">
          <Award class="w-3.5 h-3.5" />
          <span>Interactive Sales Incentive Instrument</span>
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

    <!-- Mode Switcher Tabs -->
    <div class="flex flex-wrap items-center gap-2 mb-8 bg-[#F1F5F9] p-1.5 rounded-2xl w-fit">
      <button
        type="button"
        class="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all"
        :class="mode === 'percentage' ? 'bg-[#0F766E] text-white shadow-sm' : 'text-[#475569] hover:text-[#0F172A]'"
        @click="mode = 'percentage'"
      >
        Percentage Rate
      </button>
      <button
        type="button"
        class="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all"
        :class="mode === 'fixed' ? 'bg-[#0F766E] text-white shadow-sm' : 'text-[#475569] hover:text-[#0F172A]'"
        @click="mode = 'fixed'"
      >
        Fixed Per Sale
      </button>
      <button
        type="button"
        class="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all"
        :class="mode === 'tiered' ? 'bg-[#0F766E] text-white shadow-sm' : 'text-[#475569] hover:text-[#0F172A]'"
        @click="mode = 'tiered'"
      >
        Graduated Marginal Tiers
      </button>
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

        <!-- Mode 1: Percentage -->
        <form v-if="mode === 'percentage'" @submit.prevent class="space-y-6">
          <div class="bg-[#F8FAFC] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] space-y-3">
            <div class="flex items-center justify-between">
              <label for="comm-sales-amount" class="text-xs font-bold uppercase tracking-wider text-[#334155]">
                Total Sales Volume
              </label>
              <div class="relative w-36">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#94A3B8]">$</span>
                <input
                  id="comm-sales-amount"
                  v-model.number="salesAmount"
                  type="number"
                  min="0"
                  step="1000"
                  class="w-full pl-6 pr-2.5 py-1.5 text-right font-bold text-sm bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>
            </div>

            <input
              type="range"
              min="1000"
              max="500000"
              step="1000"
              :value="salesAmount || 0"
              @input="salesAmount = Number(($event.target as HTMLInputElement).value)"
              class="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#0F766E]"
            />

            <div class="flex flex-wrap items-center gap-1.5 pt-1">
              <span class="text-[11px] font-semibold text-[#94A3B8] mr-1">Presets:</span>
              <button
                v-for="amt in [25000, 50000, 75000, 100000, 250000]"
                :key="amt"
                type="button"
                @click="salesAmount = amt"
                :class="salesAmount === amt ? 'bg-[#0F766E] text-white' : 'bg-white text-[#475569] hover:bg-[#E2E8F0]'"
                class="text-[11px] font-bold px-2.5 py-1 rounded-md border border-[#CBD5E1] transition-colors"
              >
                ${{ amt >= 1000 ? (amt / 1000) + 'k' : amt }}
              </button>
            </div>
          </div>

          <div class="bg-[#F8FAFC] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] space-y-3">
            <div class="flex items-center justify-between">
              <label for="comm-rate" class="text-xs font-bold uppercase tracking-wider text-[#334155]">
                Commission Rate (%)
              </label>
              <div class="relative w-28">
                <input
                  id="comm-rate"
                  v-model.number="commissionRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.25"
                  class="w-full pl-2.5 pr-6 py-1.5 text-right font-bold text-sm bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
                <span class="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#94A3B8]">%</span>
              </div>
            </div>

            <input
              type="range"
              min="0.5"
              max="25"
              step="0.25"
              :value="commissionRate || 0"
              @input="commissionRate = Number(($event.target as HTMLInputElement).value)"
              class="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#0F766E]"
            />

            <div class="flex flex-wrap items-center gap-1.5 pt-1">
              <span class="text-[11px] font-semibold text-[#94A3B8] mr-1">Standards:</span>
              <button
                v-for="r in [3, 5, 7.5, 10, 15]"
                :key="r"
                type="button"
                @click="commissionRate = r"
                :class="commissionRate === r ? 'bg-[#0F766E] text-white' : 'bg-white text-[#475569] hover:bg-[#E2E8F0]'"
                class="text-[11px] font-bold px-2.5 py-1 rounded-md border border-[#CBD5E1] transition-colors"
              >
                {{ r }}%
              </button>
            </div>
          </div>
        </form>

        <!-- Mode 2: Fixed Per Sale -->
        <form v-else-if="mode === 'fixed'" @submit.prevent class="space-y-6">
          <div class="bg-[#F8FAFC] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] space-y-3">
            <div class="flex items-center justify-between">
              <label for="comm-sales-count" class="text-xs font-bold uppercase tracking-wider text-[#334155]">
                Completed Sales / Deals
              </label>
              <div class="relative w-28">
                <input
                  id="comm-sales-count"
                  v-model.number="numberOfSales"
                  type="number"
                  min="0"
                  step="1"
                  class="w-full pl-2.5 pr-7 py-1.5 text-right font-bold text-sm bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
                <span class="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-[#94A3B8]">dl</span>
              </div>
            </div>

            <input
              type="range"
              min="1"
              max="100"
              step="1"
              :value="numberOfSales || 0"
              @input="numberOfSales = Number(($event.target as HTMLInputElement).value)"
              class="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#0F766E]"
            />

            <div class="flex flex-wrap items-center gap-1.5 pt-1">
              <span class="text-[11px] font-semibold text-[#94A3B8] mr-1">Deals:</span>
              <button
                v-for="n in [5, 10, 12, 25, 50]"
                :key="n"
                type="button"
                @click="numberOfSales = n"
                :class="numberOfSales === n ? 'bg-[#0F766E] text-white' : 'bg-white text-[#475569] hover:bg-[#E2E8F0]'"
                class="text-[11px] font-bold px-2.5 py-1 rounded-md border border-[#CBD5E1] transition-colors"
              >
                {{ n }} deals
              </button>
            </div>
          </div>

          <div class="bg-[#F8FAFC] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] space-y-3">
            <div class="flex items-center justify-between">
              <label for="comm-fixed-bounty" class="text-xs font-bold uppercase tracking-wider text-[#334155]">
                Fixed Bounty Per Deal
              </label>
              <div class="relative w-36">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#94A3B8]">$</span>
                <input
                  id="comm-fixed-bounty"
                  v-model.number="fixedPerSale"
                  type="number"
                  min="0"
                  step="25"
                  class="w-full pl-6 pr-2.5 py-1.5 text-right font-bold text-sm bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>
            </div>

            <input
              type="range"
              min="25"
              max="2500"
              step="25"
              :value="fixedPerSale || 0"
              @input="fixedPerSale = Number(($event.target as HTMLInputElement).value)"
              class="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#0F766E]"
            />

            <div class="flex flex-wrap items-center gap-1.5 pt-1">
              <span class="text-[11px] font-semibold text-[#94A3B8] mr-1">Bounties:</span>
              <button
                v-for="b in [150, 250, 350, 500, 1000]"
                :key="b"
                type="button"
                @click="fixedPerSale = b"
                :class="fixedPerSale === b ? 'bg-[#0F766E] text-white' : 'bg-white text-[#475569] hover:bg-[#E2E8F0]'"
                class="text-[11px] font-bold px-2.5 py-1 rounded-md border border-[#CBD5E1] transition-colors"
              >
                ${{ b }}
              </button>
            </div>
          </div>
        </form>

        <!-- Mode 3: Graduated Marginal Tiers -->
        <form v-else-if="mode === 'tiered'" @submit.prevent class="space-y-6">
          <div class="bg-[#F8FAFC] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] space-y-3">
            <div class="flex items-center justify-between">
              <label for="comm-tiered-amount" class="text-xs font-bold uppercase tracking-wider text-[#334155]">
                Sales Volume to Partition
              </label>
              <div class="relative w-36">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#94A3B8]">$</span>
                <input
                  id="comm-tiered-amount"
                  v-model.number="tieredSalesAmount"
                  type="number"
                  min="0"
                  step="5000"
                  class="w-full pl-6 pr-2.5 py-1.5 text-right font-bold text-sm bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>
            </div>

            <input
              type="range"
              min="5000"
              max="500000"
              step="5000"
              :value="tieredSalesAmount || 0"
              @input="tieredSalesAmount = Number(($event.target as HTMLInputElement).value)"
              class="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#0F766E]"
            />

            <div class="flex flex-wrap items-center gap-1.5 pt-1">
              <span class="text-[11px] font-semibold text-[#94A3B8] mr-1">Presets:</span>
              <button
                v-for="amt in [50000, 100000, 125000, 200000, 350000]"
                :key="amt"
                type="button"
                @click="tieredSalesAmount = amt"
                :class="tieredSalesAmount === amt ? 'bg-[#0F766E] text-white' : 'bg-white text-[#475569] hover:bg-[#E2E8F0]'"
                class="text-[11px] font-bold px-2.5 py-1 rounded-md border border-[#CBD5E1] transition-colors"
              >
                ${{ amt >= 1000 ? (amt / 1000) + 'k' : amt }}
              </button>
            </div>
          </div>

          <!-- Tier Ledger -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="text-xs font-bold uppercase tracking-wider text-[#475569]">Marginal Tiers Ladder</h3>
              <button
                type="button"
                class="inline-flex items-center gap-1 text-xs font-bold text-[#0F766E] hover:underline"
                @click="addTier"
              >
                <Plus class="w-3.5 h-3.5" />
                <span>Add Tier</span>
              </button>
            </div>

            <div
              v-for="(tier, idx) in tiers"
              :key="tier.id"
              class="p-3.5 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] grid grid-cols-12 gap-3 items-center hover:border-[#CBD5E1] transition-colors"
            >
              <div class="col-span-2 text-xs font-bold text-[#334155]">
                Tier {{ idx + 1 }}
              </div>
              <div class="col-span-5">
                <label class="block text-[11px] font-bold text-[#64748B] mb-0.5">Threshold (Up To)</label>
                <div v-if="!isFinite(tier.threshold)" class="py-1 px-2.5 text-xs bg-white border border-dashed border-[#CBD5E1] rounded-lg text-[#0F766E] font-bold">
                  Remaining (Uncapped)
                </div>
                <input
                  v-else
                  v-model.number="tier.threshold"
                  type="number"
                  min="0"
                  class="w-full px-2.5 py-1 text-xs font-bold bg-white border border-[#CBD5E1] rounded-lg num-tabular"
                  placeholder="50,000"
                />
              </div>
              <div class="col-span-4">
                <label class="block text-[11px] font-bold text-[#64748B] mb-0.5">Rate (%)</label>
                <div class="relative">
                  <input
                    v-model.number="tier.rate"
                    type="number"
                    min="0"
                    step="any"
                    class="w-full pl-2 pr-5 py-1 text-xs font-bold bg-white border border-[#CBD5E1] rounded-lg num-tabular"
                    placeholder="Rate %"
                  />
                  <span class="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#94A3B8]">%</span>
                </div>
              </div>
              <div class="col-span-1 flex justify-end">
                <button
                  type="button"
                  :disabled="tiers.length === 1"
                  class="text-[#94A3B8] hover:text-rose-600 disabled:opacity-20 p-1 transition-colors"
                  title="Remove tier"
                  @click="removeTier(idx)"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
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
              <span class="text-[11px] font-bold uppercase tracking-widest text-emerald-200">Earnings Telemetry</span>
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
            <span class="text-xs font-semibold uppercase tracking-wider text-emerald-100">Total Commission Earnings</span>
            <div class="text-3xl sm:text-4xl font-black text-white mt-1 num-tabular tracking-tight">
              {{ formatCurrency(result.commissionEarned, currency) }}
            </div>
            <div v-if="mode !== 'fixed'" class="inline-flex items-center gap-1.5 text-xs text-emerald-200 mt-2 bg-black/20 px-2.5 py-1 rounded-full">
              <span>Effective Blended Rate:</span>
              <span class="font-extrabold text-white">{{ formatPercent(result.effectiveRate) }}</span>
            </div>
            <div v-else class="inline-flex items-center gap-1.5 text-xs text-emerald-200 mt-2 bg-black/20 px-2.5 py-1 rounded-full">
              <span>{{ numberOfSales }} Deals Closed</span>
              <span>•</span>
              <span>{{ formatCurrency(fixedPerSale || 0, currency) }} / deal</span>
            </div>
          </div>

          <!-- Proportional Share Bar (Commission vs Retained) -->
          <div v-if="mode !== 'fixed' && result.salesAmountUsed > 0" class="space-y-2 pt-2">
            <div class="flex items-center justify-between text-xs font-bold text-white/90">
              <span>Take-Home Share of Sales</span>
              <span class="text-emerald-300">{{ commissionSharePct.toFixed(1) }}% of Gross</span>
            </div>

            <!-- Proportional 2-Segment Bar -->
            <div class="h-3.5 w-full bg-black/20 rounded-full overflow-hidden flex p-0.5 border border-white/20">
              <div
                class="bg-emerald-300 h-full rounded-l-full transition-all duration-300"
                :style="{ width: `${commissionSharePct}%` }"
                title="Your Commission"
              ></div>
              <div
                class="bg-white/30 h-full rounded-r-full transition-all duration-300"
                :style="{ width: `${companyRetainedSharePct}%` }"
                title="Company Retained"
              ></div>
            </div>

            <!-- Legend with Percentages -->
            <div class="flex items-center justify-between text-[11px] font-semibold text-white/80 pt-0.5">
              <div class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-sm bg-emerald-300 shrink-0"></span>
                <span>Commission ({{ formatCurrency(result.commissionEarned, currency) }})</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-sm bg-white/40 shrink-0"></span>
                <span>Retained ({{ formatCurrency(result.salesAmountUsed - result.commissionEarned, currency) }})</span>
              </div>
            </div>
          </div>

          <!-- Secondary Metric 2x2 Grid -->
          <div class="grid grid-cols-2 gap-3 pt-2">
            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <span class="text-[11px] font-semibold text-white/70 block">
                {{ mode !== 'fixed' ? 'Sales Volume' : 'Deals Closed' }}
              </span>
              <span class="text-sm sm:text-base font-bold text-white num-tabular mt-0.5 block">
                {{ mode !== 'fixed' ? formatCurrency(result.salesAmountUsed, currency) : formatNumber(numberOfSales || 0) }}
              </span>
            </div>

            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <span class="text-[11px] font-semibold text-emerald-200 block">Average Per Day (30d)</span>
              <span class="text-sm sm:text-base font-extrabold text-emerald-300 num-tabular mt-0.5 block">
                {{ formatCurrency(result.commissionEarned / 30, currency) }}
              </span>
            </div>

            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <span class="text-[11px] font-semibold text-white/70 block">Pricing Structure</span>
              <span class="text-sm sm:text-base font-bold text-white capitalize mt-0.5 block">
                {{ mode }}
              </span>
            </div>

            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <span class="text-[11px] font-semibold text-white/70 block">Effective Rate</span>
              <span class="text-sm sm:text-base font-bold text-white num-tabular mt-0.5 block">
                {{ mode !== 'fixed' ? formatPercent(result.effectiveRate) : 'Flat Bounty' }}
              </span>
            </div>
          </div>

          <!-- Tier Breakdown in HUD if tiered mode -->
          <div v-if="mode === 'tiered' && result.tierBreakdown" class="bg-black/20 rounded-2xl p-4 border border-white/10 space-y-2">
            <span class="text-[11px] font-bold uppercase tracking-wider text-emerald-300 block">
              Tier-By-Tier Payout
            </span>
            <div class="space-y-1.5 text-xs">
              <div
                v-for="item in result.tierBreakdown"
                :key="item.tierNumber"
                class="flex items-center justify-between text-white/90"
              >
                <span>Tier {{ item.tierNumber }} ({{ item.rate }}%):</span>
                <span class="font-bold text-emerald-300 num-tabular">{{ formatCurrency(item.commission, currency) }}</span>
              </div>
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
          <h2 class="text-xl font-extrabold text-[#0F172A] mb-3">How Sales Commission Works</h2>
          <p class="text-sm text-[#64748B] leading-relaxed mb-4">
            Sales commissions vary from simple flat-rate agreements to sophisticated progressive milestone ladders. In a marginal tier structure, each rate applies only to revenue generated between designated lower and upper tier bounds.
          </p>
          <div class="bg-[#F8FAFC] border border-[#CBD5E1] p-4 rounded-xl num-tabular text-xs sm:text-sm text-[#0F172A] mb-4 font-mono">
            {{ currentTool.formula }}
          </div>
        </section>

        <!-- Worked Example -->
        <section class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
          <h2 class="text-xl font-extrabold text-[#0F172A] mb-3">Worked Example: Tiered Commission</h2>
          <div class="space-y-3 text-sm text-[#64748B] leading-relaxed">
            <p>Suppose you generate $120,000 in monthly sales with the following marginal tier structure:</p>
            <ul class="list-disc list-inside space-y-1.5 pl-2 font-mono text-xs text-[#0F172A]">
              <li>Tier 1 ($0 to $50,000 at 5%): $50,000 × 5% = $2,500.00</li>
              <li>Tier 2 ($50,000 to $100,000 at 8%): $50,000 × 8% = $4,000.00</li>
              <li>Tier 3 ($100,000 to $120,000 at 12%): $20,000 × 12% = $2,400.00</li>
            </ul>
            <div class="p-3 bg-[#E7F4F1] rounded-xl font-mono text-sm text-[#0F766E] font-bold">
              Total Commission = $2,500 + $4,000 + $2,400 = $8,900.00 (Effective Rate: 7.42%)
            </div>
          </div>
        </section>

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
          <h3 class="text-base font-bold text-[#0F172A] mb-2">Flat vs. Tiered Guide</h3>
          <p class="text-xs text-[#64748B] leading-relaxed mb-4">
            Learn how marginal tiers contrast with retroactive tiers and gross vs. net sales stipulations.
          </p>
          <RouterLink
            to="/learn/flat-vs-tiered-commission/"
            class="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F766E] hover:underline"
          >
            <span>Read Commission Structures Guide</span>
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
