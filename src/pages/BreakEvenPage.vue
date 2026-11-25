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
import { RouterLink } from 'vue-router'
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
  Target,
  Sliders,
  Layers,
  ArrowRight
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

// Amounts are always USD — the currency selector only relabelled the symbol
// without converting values, so it was removed (same as stock/loan pages).
const currency = 'USD'
const copied = ref(false)

// Input fields
const sellingPricePerUnit = ref<number | null>(50)
const variableCostPerUnit = ref<number | null>(20)
const totalFixedCosts = ref<number | null>(30000)
const targetProfit = ref<number | null>(15000)
const expectedSalesVolume = ref<number | null>(1200)

// Quick preset setters
function setPrice(val: number) {
  sellingPricePerUnit.value = val
}

function setVarCost(val: number) {
  variableCostPerUnit.value = val
}

function setFixedCosts(val: number) {
  totalFixedCosts.value = val
}

function resetForm() {
  sellingPricePerUnit.value = 50
  variableCostPerUnit.value = 20
  totalFixedCosts.value = 30000
  targetProfit.value = 15000
  expectedSalesVolume.value = 1200
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

// Unit economics visual bar. Bar WIDTHS must stay in 0–100% (a bar cannot be
// negative or wider than the track), but the DISPLAYED ratios are the true
// values — never clamped. When variable cost exceeds price the true margin
// ratio is negative (e.g. −25% for P $20 / V $25) and the variable-cost
// share exceeds 100% (125%); both are shown exactly, matching the
// Margin Ratio (CMR) box below.
const cmRatioBar = computed(() => Math.max(0, Math.min(100, result.value.contributionMarginRatio)))
const vcRatioBar = computed(() => Math.max(0, Math.min(100, 100 - result.value.contributionMarginRatio)))
const vcRatioTrue = computed(() => 100 - result.value.contributionMarginRatio)

async function handleCopy() {
  const lines = [
    'Business Break-Even Analysis Summary',
    '-------------------------------------',
    `Selling Price per Unit: ${formatCurrency(sellingPricePerUnit.value || 0, currency)}`,
    `Variable Cost per Unit: ${formatCurrency(variableCostPerUnit.value || 0, currency)}`,
    `Total Fixed Costs: ${formatCurrency(totalFixedCosts.value || 0, currency)}`,
    `Contribution Margin: ${formatCurrency(result.value.contributionMarginPerUnit, currency)} per unit (${formatPercent(result.value.contributionMarginRatio)})`,
    `Break-Even Quantity: ${result.value.breakEvenUnitsRounded.toLocaleString()} units`,
    `Break-Even Revenue: ${formatCurrency(result.value.breakEvenRevenue, currency)}`,
    result.value.targetProfitUnitsRounded ? `Target Profit Units: ${result.value.targetProfitUnitsRounded.toLocaleString()} units (${formatCurrency(result.value.targetProfitRevenue || 0, currency)})` : '',
    result.value.marginOfSafetyUnits !== undefined ? `Margin of Safety: ${result.value.marginOfSafetyUnits.toLocaleString()} units (${formatPercent(result.value.marginOfSafetyPercentage || 0)})` : '',
    result.value.expectedProfitOrLoss !== undefined ? `Estimated Net Profit: ${formatCurrency(result.value.expectedProfitOrLoss, currency)}` : ''
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

    <!-- Tool Instrument Header -->
    <div class="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div>
        <div class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0F766E] bg-[#E7F4F1] px-3 py-1 rounded-full mb-2.5">
          <PieChart class="w-3.5 h-3.5" />
          <span>Cost-Volume-Profit Instrument</span>
        </div>
        <h1 class="text-2xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight mb-2">
          {{ currentTool.name }}
        </h1>
        <p class="text-sm sm:text-base text-[#64748B] max-w-2xl leading-relaxed">
          {{ currentTool.fullDescription }}
        </p>
      </div>

      <!-- Controls: Reset (amounts are always USD — the selector only relabelled the symbol without converting values, so it was removed) -->
      <div class="flex items-center gap-2.5 self-start md:self-end">
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

    <!-- Main Instrument Console Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
      <!-- Left Panel: Interactive Console Controls -->
      <div class="lg:col-span-7 bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
        <div class="flex items-center justify-between pb-4 mb-6 border-b border-[#F1F5F9]">
          <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#475569]">
            <Sliders class="w-4 h-4 text-[#0F766E]" />
            <span>Pricing &amp; Cost Controls</span>
          </div>
          <span class="text-[11px] text-[#94A3B8] font-medium">Drag sliders or enter values</span>
        </div>

        <form @submit.prevent class="space-y-6">
          <!-- Selling Price Slider -->
          <div class="bg-[#F8FAFC] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] space-y-3">
            <div class="flex items-center justify-between">
              <label for="unit-price" class="text-xs font-bold uppercase tracking-wider text-[#334155]">
                Selling Price per Unit (P)
              </label>
              <div class="relative w-32">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#94A3B8]">$</span>
                <input
                  id="unit-price"
                  v-model.number="sellingPricePerUnit"
                  type="number"
                  min="0.01"
                  step="1"
                  class="w-full pl-6 pr-2.5 py-1.5 text-right font-bold text-sm bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>
            </div>

            <input
              type="range"
              min="1"
              max="500"
              step="1"
              :value="sellingPricePerUnit || 0"
              @input="sellingPricePerUnit = Number(($event.target as HTMLInputElement).value)"
              class="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#0F766E]"
            />

            <!-- Presets -->
            <div class="flex flex-wrap items-center gap-1.5 pt-1">
              <span class="text-[11px] font-semibold text-[#94A3B8] mr-1">Presets:</span>
              <button
                v-for="p in [15, 25, 50, 100, 250]"
                :key="p"
                type="button"
                @click="setPrice(p)"
                :class="sellingPricePerUnit === p ? 'bg-[#0F766E] text-white' : 'bg-white text-[#475569] hover:bg-[#E2E8F0]'"
                class="text-[11px] font-bold px-2.5 py-1 rounded-md border border-[#CBD5E1] transition-colors"
              >
                ${{ p }}
              </button>
            </div>
          </div>

          <!-- Variable Cost Slider -->
          <div class="bg-[#F8FAFC] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <label for="var-cost" class="text-xs font-bold uppercase tracking-wider text-[#334155]">
                  Variable Cost per Unit (V)
                </label>
                <p class="text-[11px] text-[#64748B]">Direct materials, labor, fees</p>
              </div>
              <div class="relative w-32">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#94A3B8]">$</span>
                <input
                  id="var-cost"
                  v-model.number="variableCostPerUnit"
                  type="number"
                  min="0"
                  step="1"
                  class="w-full pl-6 pr-2.5 py-1.5 text-right font-bold text-sm bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>
            </div>

            <input
              type="range"
              min="0"
              max="300"
              step="1"
              :value="variableCostPerUnit || 0"
              @input="variableCostPerUnit = Number(($event.target as HTMLInputElement).value)"
              class="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#0F766E]"
            />

            <!-- Presets -->
            <div class="flex flex-wrap items-center gap-1.5 pt-1">
              <span class="text-[11px] font-semibold text-[#94A3B8] mr-1">Presets:</span>
              <button
                v-for="v in [5, 10, 20, 45, 100]"
                :key="v"
                type="button"
                @click="setVarCost(v)"
                :class="variableCostPerUnit === v ? 'bg-[#0F766E] text-white' : 'bg-white text-[#475569] hover:bg-[#E2E8F0]'"
                class="text-[11px] font-bold px-2.5 py-1 rounded-md border border-[#CBD5E1] transition-colors"
              >
                ${{ v }}
              </button>
            </div>
          </div>

          <!-- Total Fixed Costs Slider -->
          <div class="bg-[#F8FAFC] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <label for="fixed-costs" class="text-xs font-bold uppercase tracking-wider text-[#334155]">
                  Total Fixed Overhead (F)
                </label>
                <p class="text-[11px] text-[#64748B]">Rent, software, insurance, salaries</p>
              </div>
              <div class="relative w-36">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#94A3B8]">$</span>
                <input
                  id="fixed-costs"
                  v-model.number="totalFixedCosts"
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
              max="200000"
              step="1000"
              :value="totalFixedCosts || 0"
              @input="totalFixedCosts = Number(($event.target as HTMLInputElement).value)"
              class="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#0F766E]"
            />

            <!-- Presets -->
            <div class="flex flex-wrap items-center gap-1.5 pt-1">
              <span class="text-[11px] font-semibold text-[#94A3B8] mr-1">Presets:</span>
              <button
                v-for="f in [5000, 15000, 30000, 60000, 100000]"
                :key="f"
                type="button"
                @click="setFixedCosts(f)"
                :class="totalFixedCosts === f ? 'bg-[#0F766E] text-white' : 'bg-white text-[#475569] hover:bg-[#E2E8F0]'"
                class="text-[11px] font-bold px-2.5 py-1 rounded-md border border-[#CBD5E1] transition-colors"
              >
                ${{ (f / 1000) }}k
              </button>
            </div>
          </div>

          <!-- Target Profit & Expected Volume Row -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0]">
              <label for="target-profit" class="block text-xs font-bold uppercase tracking-wider text-[#334155] mb-1.5">
                Target Operating Profit
              </label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#94A3B8]">$</span>
                <input
                  id="target-profit"
                  v-model.number="targetProfit"
                  type="number"
                  min="0"
                  step="1000"
                  class="w-full pl-6 pr-2.5 py-1.5 text-sm font-bold bg-white border border-[#CBD5E1] rounded-xl text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>
            </div>

            <div class="bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0]">
              <label for="expected-volume" class="block text-xs font-bold uppercase tracking-wider text-[#334155] mb-1.5">
                Expected Volume (Units)
              </label>
              <input
                id="expected-volume"
                v-model.number="expectedSalesVolume"
                type="number"
                min="0"
                step="50"
                class="w-full px-3 py-1.5 text-sm font-bold bg-white border border-[#CBD5E1] rounded-xl text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              />
            </div>
          </div>
        </form>

        <!-- Validation Errors / Loss Making Alert -->
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

      <!-- Right Panel: High-Impact Financial HUD / Result Console -->
      <div class="lg:col-span-5 flex flex-col justify-between bg-gradient-to-br from-[#0B3B39] via-[#0F766E] to-[#115E59] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div class="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>

        <div class="relative z-10">
          <!-- Console Top Status -->
          <div class="flex items-center justify-between pb-4 mb-6 border-b border-white/15">
            <div class="flex items-center gap-2">
              <Package class="w-4 h-4 text-[#99F6E4]" />
              <span class="text-xs font-bold uppercase tracking-wider text-[#99F6E4]">Break-Even Volume</span>
            </div>
            <button
              type="button"
              @click="handleCopy"
              class="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all active:scale-95 border border-white/10"
            >
              <component :is="copied ? Check : Copy" class="w-3.5 h-3.5 text-[#99F6E4]" />
              <span>{{ copied ? 'Copied' : 'Copy Summary' }}</span>
            </button>
          </div>

          <!-- Hero Break-Even Units Display (only when a break-even point exists) -->
          <div v-if="result.isViable" class="mb-6">
            <span class="text-xs uppercase tracking-wider text-white/70 font-semibold block mb-1">
              Break-Even Sales Requirement
            </span>
            <div class="text-4xl sm:text-5xl font-black tracking-tight text-white flex items-baseline gap-2">
              <span>{{ result.breakEvenUnitsRounded.toLocaleString() }}</span>
              <span class="text-sm font-semibold text-[#99F6E4]">Units</span>
            </div>
            <p class="text-xs text-[#99F6E4] mt-2">
              Requires <strong>{{ formatCurrency(result.breakEvenRevenue, currency) }}</strong> in gross revenue to cover fixed overhead.
            </p>
          </div>

          <!-- No break-even point: variable cost meets or exceeds price, so the
               contribution margin is zero or negative and no sales volume can
               ever cover fixed costs. Never display "0 Units / $0.00" as if
               zero were a real break-even point. -->
          <div v-else class="mb-6">
            <span class="text-xs uppercase tracking-wider text-white/70 font-semibold block mb-1">
              Break-Even Sales Requirement
            </span>
            <div class="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              No break-even point
            </div>
            <p class="text-xs text-[#FECACA] mt-2 leading-relaxed">
              Every unit sold loses <strong>{{ formatCurrency(Math.abs(result.contributionMarginPerUnit), currency) }}</strong>
              <template v-if="result.contributionMarginPerUnit === 0">(contribution margin is $0.00 — price exactly equals variable cost)</template>
              <template v-else>({{ formatPercent(result.contributionMarginRatio) }} margin)</template>
              — no sales volume can cover fixed costs. Raise the selling price or cut variable costs to create a positive contribution margin.
            </p>
          </div>

          <!-- Interactive Unit Economics Visual Bar -->
          <div class="mb-6 bg-black/20 p-4 rounded-2xl border border-white/10">
            <div class="flex items-center justify-between text-xs mb-2">
              <span class="font-bold text-white flex items-center gap-1.5">
                <PieChart class="w-3.5 h-3.5 text-[#99F6E4]" />
                <span>Unit Revenue Split</span>
              </span>
              <span class="text-xs text-white/70 font-semibold">
                {{ formatCurrency(sellingPricePerUnit || 0, currency) }} price
              </span>
            </div>

            <!-- Proportional Unit Bar (widths clamped to 0–100%; legend shows true ratios) -->
            <div class="w-full h-3 rounded-full overflow-hidden flex bg-white/20">
              <div
                class="bg-[#F59E0B] transition-all duration-300"
                :style="{ width: `${vcRatioBar}%` }"
                title="Variable Cost"
              ></div>
              <div
                class="bg-[#2DD4BF] transition-all duration-300"
                :style="{ width: `${cmRatioBar}%` }"
                title="Contribution Margin"
              ></div>
            </div>

            <!-- Legend (true ratios, never clamped) -->
            <div class="flex items-center justify-between text-[11px] mt-2.5">
              <div class="flex items-center gap-1.5 text-amber-200">
                <span class="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span>
                <span>Var Cost: <strong>{{ formatCurrency(variableCostPerUnit || 0, currency) }} ({{ vcRatioTrue.toFixed(0) }}%)</strong></span>
              </div>
              <div class="flex items-center gap-1.5 text-emerald-200">
                <span class="w-2.5 h-2.5 rounded-full bg-[#2DD4BF]"></span>
                <span>Margin: <strong>{{ formatCurrency(result.contributionMarginPerUnit, currency) }} ({{ result.contributionMarginRatio.toFixed(0) }}%)</strong></span>
              </div>
            </div>
          </div>

          <!-- Margin of Safety Callout Card -->
          <div v-if="result.marginOfSafetyUnits !== undefined" class="mb-6 bg-black/25 p-4 rounded-2xl border border-white/10">
            <div class="flex items-center justify-between text-xs mb-1.5">
              <span class="font-bold text-[#99F6E4] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck class="w-4 h-4 text-emerald-300" />
                <span>Margin of Safety Buffer</span>
              </span>
              <span class="font-black text-sm text-white">{{ formatPercent(result.marginOfSafetyPercentage || 0) }}</span>
            </div>
            <p class="text-xs text-white/80 leading-relaxed">
              At {{ expectedSalesVolume }} expected units, sales can fall by <strong>{{ result.marginOfSafetyUnits.toLocaleString() }} units</strong> ({{ formatCurrency(result.marginOfSafetyRevenue || 0, currency) }}) before entering loss territory.
            </p>
            <div v-if="result.expectedProfitOrLoss !== undefined" class="mt-2.5 pt-2 border-t border-white/10 flex justify-between text-xs">
              <span class="text-white/70">Expected Net Operating Profit:</span>
              <span :class="(result.expectedProfitOrLoss || 0) >= 0 ? 'text-emerald-300 font-extrabold' : 'text-red-300 font-extrabold'">
                {{ formatCurrency(result.expectedProfitOrLoss || 0, currency) }}
              </span>
            </div>
          </div>

          <!-- Secondary Metric HUD Grid -->
          <div class="grid grid-cols-2 gap-3 mb-6">
            <div class="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
              <div class="flex items-center gap-1.5 text-xs text-[#99F6E4] mb-1">
                <DollarSign class="w-3.5 h-3.5" />
                <span>Unit Margin</span>
              </div>
              <div class="text-lg sm:text-xl font-black">
                {{ formatCurrency(result.contributionMarginPerUnit, currency) }}
              </div>
              <span class="text-[10px] text-white/60">Covers overhead</span>
            </div>

            <div class="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
              <div class="flex items-center gap-1.5 text-xs text-[#99F6E4] mb-1">
                <TrendingUp class="w-3.5 h-3.5" />
                <span>Margin Ratio (CMR)</span>
              </div>
              <div class="text-lg sm:text-xl font-black">
                {{ formatPercent(result.contributionMarginRatio) }}
              </div>
              <span class="text-[10px] text-white/60">Of sales revenue</span>
            </div>

            <div v-if="result.targetProfitUnitsRounded" class="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
              <div class="flex items-center gap-1.5 text-xs text-[#99F6E4] mb-1">
                <Target class="w-3.5 h-3.5" />
                <span>Target Profit Units</span>
              </div>
              <div class="text-lg sm:text-xl font-black">
                {{ result.targetProfitUnitsRounded.toLocaleString() }}
              </div>
              <span class="text-[10px] text-white/60">For {{ formatCurrency(targetProfit || 0, currency) }} profit</span>
            </div>

            <div v-if="result.targetProfitRevenue" class="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
              <div class="flex items-center gap-1.5 text-xs text-[#99F6E4] mb-1">
                <Layers class="w-3.5 h-3.5" />
                <span>Target Revenue</span>
              </div>
              <div class="text-lg sm:text-xl font-black">
                {{ formatCurrency(result.targetProfitRevenue, currency) }}
              </div>
              <span class="text-[10px] text-white/60">Required sales</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Educational Content & Formula Explanation -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
      <div class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-7 shadow-xs">
        <h2 class="text-xs font-bold text-[#0F766E] uppercase tracking-wider mb-2">
          Cost-Volume-Profit Formulas
        </h2>
        <p class="text-xs text-[#64748B] leading-relaxed mb-3">
          Break-even analysis calculates the point where total revenues equal total expenses:
        </p>
        <div class="bg-[#F8FAFC] p-4 rounded-xl border border-[#CBD5E1] font-mono text-xs text-[#1E293B] overflow-x-auto mb-3 space-y-1">
          <div>Contribution Margin (CM) = Price − Variable Cost</div>
          <div>Break-Even Units (Q) = Fixed Costs ÷ CM</div>
          <div>Break-Even Revenue = Q × Price = Fixed Costs ÷ CMR</div>
        </div>
        <ul class="text-xs text-[#64748B] space-y-1">
          <li><strong>CM:</strong> Dollars from each sale that contribute to paying fixed overhead.</li>
          <li><strong>CMR:</strong> Percentage of each sales dollar remaining after variable costs.</li>
        </ul>
      </div>

      <div class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-7 shadow-xs">
        <h2 class="text-xs font-bold text-[#0F766E] uppercase tracking-wider mb-2">
          Key Assumptions &amp; Disclosures
        </h2>
        <ul class="text-xs text-[#64748B] space-y-2 list-disc pl-4 leading-relaxed">
          <li v-for="(assumption, idx) in currentTool.assumptions" :key="idx">
            {{ assumption }}
          </li>
        </ul>
      </div>
    </div>

    <!-- Learn More About Break-Even -->
    <div class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-7 shadow-xs mb-12">
      <h2 class="text-xl font-bold text-[#0F172A] mb-2">Learn More About Break-Even Analysis</h2>
      <p class="text-sm text-[#64748B] leading-relaxed mb-4">
        Read our in-depth guide on break-even formulas, contribution margin, margin of safety, and worked examples for product and service businesses.
      </p>
      <RouterLink
        to="/learn/how-to-calculate-break-even-point/"
        class="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F766E] hover:underline"
      >
        <span>Read How to Calculate Break-Even Point</span>
        <ArrowRight class="w-3.5 h-3.5" />
      </RouterLink>
    </div>

    <!-- FAQ Accordion -->
    <div class="mb-12">
      <h2 class="text-xl font-bold text-[#0F172A] mb-4">Frequently Asked Questions</h2>
      <FAQAccordion :items="currentTool.faqs" />
    </div>

    <!-- Related Tools & Guides -->
    <RelatedTools
      :current-slug="currentTool.slug"
      :tool-slugs="currentTool.relatedToolSlugs"
      :article-slugs="currentTool.relatedArticleSlugs"
      class="mb-12"
    />

    <!-- Disclaimer -->
    <DisclaimerNotice />
  </div>
</template>
