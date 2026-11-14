<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { updatePageSeo } from '@/utils/seo'
import { generateCalculatorSchema } from '@/utils/structuredData'
import { formatCurrency, formatPercent, copyToClipboard } from '@/utils/formatters'
import { 
  calculateCompoundInterest, 
  type CompoundingFrequency, 
  type ContributionFrequency, 
  type ContributionTiming 
} from '@/calculations/compoundInterest'
import Breadcrumbs from '@/components/ui/Breadcrumbs.vue'
import FAQAccordion from '@/components/ui/FAQAccordion.vue'
import RelatedTools from '@/components/ui/RelatedTools.vue'
import DisclaimerNotice from '@/components/ui/DisclaimerNotice.vue'
import { tools } from '@/data/tools'
import { 
  LineChart, 
  RotateCcw, 
  Copy, 
  Check, 
  ArrowRight,
  AlertCircle,
  Sliders,
  TrendingUp,
  Table as TableIcon
} from '@lucide/vue'

const currentTool = tools.find(t => t.slug === 'compound-interest-calculator')!

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
const showFullTable = ref(false)

const initialPrincipal = ref<number | null>(10000)
const contributionAmount = ref<number | null>(500)
const contributionFrequency = ref<ContributionFrequency>('monthly')
const annualInterestRate = ref<number | null>(7.5)
const compoundingFrequency = ref<CompoundingFrequency>('monthly')
const years = ref<number | null>(20)
const contributionTiming = ref<ContributionTiming>('end')

function resetForm() {
  initialPrincipal.value = 10000
  contributionAmount.value = 500
  contributionFrequency.value = 'monthly'
  annualInterestRate.value = 7.5
  compoundingFrequency.value = 'monthly'
  years.value = 20
  contributionTiming.value = 'end'
}

const result = computed(() => {
  return calculateCompoundInterest({
    initialPrincipal: initialPrincipal.value || 0,
    contributionAmount: contributionAmount.value || 0,
    contributionFrequency: contributionFrequency.value,
    annualInterestRate: annualInterestRate.value || 0,
    compoundingFrequency: compoundingFrequency.value,
    years: years.value || 1,
    contributionTiming: contributionTiming.value
  })
})

// Visual breakdown shares
const principalSharePct = computed(() => {
  if (result.value.futureValue <= 0) return 0
  return (result.value.totalPrincipal / result.value.futureValue) * 100
})

const contributionsSharePct = computed(() => {
  if (result.value.futureValue <= 0) return 0
  return (result.value.totalContributions / result.value.futureValue) * 100
})

const interestSharePct = computed(() => {
  if (result.value.futureValue <= 0) return 0
  return (result.value.totalInterestEarned / result.value.futureValue) * 100
})

const growthMultiplier = computed(() => {
  const totalInvested = result.value.totalPrincipal + result.value.totalContributions
  if (totalInvested <= 0) return 1
  return (result.value.futureValue / totalInvested).toFixed(2)
})

async function handleCopy() {
  const summary = [
    'Compound Interest Projection',
    '------------------------------',
    `Initial Principal: ${formatCurrency(initialPrincipal.value || 0, currency.value)}`,
    `Regular Contribution: ${formatCurrency(contributionAmount.value || 0, currency.value)} (${contributionFrequency.value})`,
    `Annual Growth Rate: ${formatPercent(annualInterestRate.value || 0)}`,
    `Compounding Frequency: ${compoundingFrequency.value}`,
    `Investment Horizon: ${years.value} Years`,
    `Estimated Future Value: ${formatCurrency(result.value.futureValue, currency.value)}`,
    `Total Principal & Additions: ${formatCurrency(result.value.totalPrincipal + result.value.totalContributions, currency.value)}`,
    `Total Compound Interest Earned: ${formatCurrency(result.value.totalInterestEarned, currency.value)}`,
    `Wealth Growth Multiplier: ${growthMultiplier.value}x`
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
      { name: 'Compound Interest Calculator' }
    ]" />

    <!-- Tool Instrument Header -->
    <div class="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div>
        <div class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0F766E] bg-[#E7F4F1] px-3 py-1 rounded-full mb-2.5">
          <TrendingUp class="w-3.5 h-3.5" />
          <span>Interactive Wealth Instrument</span>
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
          <!-- 1. Initial Principal Deposit -->
          <div class="bg-[#F8FAFC] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] space-y-3">
            <div class="flex items-center justify-between">
              <label for="initial-principal" class="text-xs font-bold uppercase tracking-wider text-[#334155]">
                Initial Principal Deposit
              </label>
              <div class="relative w-36">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#94A3B8]">$</span>
                <input
                  id="initial-principal"
                  v-model.number="initialPrincipal"
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
              max="200000"
              step="1000"
              :value="initialPrincipal || 0"
              @input="initialPrincipal = Number(($event.target as HTMLInputElement).value)"
              class="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#0F766E]"
            />

            <!-- Quick Presets -->
            <div class="flex flex-wrap items-center gap-1.5 pt-1">
              <span class="text-[11px] font-semibold text-[#94A3B8] mr-1">Presets:</span>
              <button
                v-for="amt in [0, 5000, 10000, 25000, 50000, 100000]"
                :key="amt"
                type="button"
                @click="initialPrincipal = amt"
                :class="initialPrincipal === amt ? 'bg-[#0F766E] text-white' : 'bg-white text-[#475569] hover:bg-[#E2E8F0]'"
                class="text-[11px] font-bold px-2.5 py-1 rounded-md border border-[#CBD5E1] transition-colors"
              >
                ${{ amt >= 1000 ? (amt / 1000) + 'k' : amt }}
              </button>
            </div>
          </div>

          <!-- 2. Regular Periodic Contribution -->
          <div class="bg-[#F8FAFC] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] space-y-3">
            <div class="flex items-center justify-between">
              <label for="contribution-amount" class="text-xs font-bold uppercase tracking-wider text-[#334155]">
                Periodic Contribution
              </label>
              <div class="flex items-center gap-2">
                <select
                  v-model="contributionFrequency"
                  aria-label="Contribution Frequency"
                  class="text-xs font-semibold bg-white border border-[#CBD5E1] rounded-lg px-2.5 py-1.5 text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                >
                  <option value="monthly">Monthly</option>
                  <option value="annually">Annually</option>
                </select>
                <div class="relative w-32">
                  <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#94A3B8]">$</span>
                  <input
                    id="contribution-amount"
                    v-model.number="contributionAmount"
                    type="number"
                    min="0"
                    step="50"
                    class="w-full pl-6 pr-2.5 py-1.5 text-right font-bold text-sm bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  />
                </div>
              </div>
            </div>

            <!-- Tactile Range Slider -->
            <input
              type="range"
              min="0"
              max="5000"
              step="50"
              :value="contributionAmount || 0"
              @input="contributionAmount = Number(($event.target as HTMLInputElement).value)"
              class="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#0F766E]"
            />

            <!-- Presets -->
            <div class="flex flex-wrap items-center gap-1.5 pt-1">
              <span class="text-[11px] font-semibold text-[#94A3B8] mr-1">Presets:</span>
              <button
                v-for="amt in [100, 250, 500, 1000, 2000]"
                :key="amt"
                type="button"
                @click="contributionAmount = amt"
                :class="contributionAmount === amt ? 'bg-[#0F766E] text-white' : 'bg-white text-[#475569] hover:bg-[#E2E8F0]'"
                class="text-[11px] font-bold px-2.5 py-1 rounded-md border border-[#CBD5E1] transition-colors"
              >
                ${{ amt }}
              </button>
            </div>
          </div>

          <!-- 3. Annual Return Rate -->
          <div class="bg-[#F8FAFC] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] space-y-3">
            <div class="flex items-center justify-between">
              <label for="interest-rate" class="text-xs font-bold uppercase tracking-wider text-[#334155]">
                Annual Growth Rate
              </label>
              <div class="relative w-28">
                <input
                  id="interest-rate"
                  v-model.number="annualInterestRate"
                  type="number"
                  min="0"
                  max="30"
                  step="0.1"
                  class="w-full pl-2.5 pr-6 py-1.5 text-right font-bold text-sm bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
                <span class="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#94A3B8]">%</span>
              </div>
            </div>

            <!-- Tactile Range Slider -->
            <input
              type="range"
              min="1"
              max="16"
              step="0.25"
              :value="annualInterestRate || 0"
              @input="annualInterestRate = Number(($event.target as HTMLInputElement).value)"
              class="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#0F766E]"
            />

            <!-- Presets -->
            <div class="flex flex-wrap items-center gap-1.5 pt-1">
              <span class="text-[11px] font-semibold text-[#94A3B8] mr-1">Benchmarks:</span>
              <button
                v-for="r in [4, 6, 7.5, 10, 12]"
                :key="r"
                type="button"
                @click="annualInterestRate = r"
                :class="annualInterestRate === r ? 'bg-[#0F766E] text-white' : 'bg-white text-[#475569] hover:bg-[#E2E8F0]'"
                class="text-[11px] font-bold px-2.5 py-1 rounded-md border border-[#CBD5E1] transition-colors"
              >
                {{ r }}%
              </button>
            </div>
          </div>

          <!-- 4. Investment Horizon (Years) -->
          <div class="bg-[#F8FAFC] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] space-y-3">
            <div class="flex items-center justify-between">
              <label for="investment-horizon" class="text-xs font-bold uppercase tracking-wider text-[#334155]">
                Investment Horizon
              </label>
              <div class="relative w-28">
                <input
                  id="investment-horizon"
                  v-model.number="years"
                  type="number"
                  min="1"
                  max="60"
                  step="1"
                  class="w-full pl-2.5 pr-8 py-1.5 text-right font-bold text-sm bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
                <span class="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-[#94A3B8]">yrs</span>
              </div>
            </div>

            <!-- Tactile Range Slider -->
            <input
              type="range"
              min="1"
              max="50"
              step="1"
              :value="years || 1"
              @input="years = Number(($event.target as HTMLInputElement).value)"
              class="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#0F766E]"
            />

            <!-- Presets -->
            <div class="flex flex-wrap items-center gap-1.5 pt-1">
              <span class="text-[11px] font-semibold text-[#94A3B8] mr-1">Horizons:</span>
              <button
                v-for="y in [5, 10, 15, 20, 30, 40]"
                :key="y"
                type="button"
                @click="years = y"
                :class="years === y ? 'bg-[#0F766E] text-white' : 'bg-white text-[#475569] hover:bg-[#E2E8F0]'"
                class="text-[11px] font-bold px-2.5 py-1 rounded-md border border-[#CBD5E1] transition-colors"
              >
                {{ y }} yrs
              </button>
            </div>
          </div>

          <!-- 5. Advanced Mechanics (Compounding & Timing) -->
          <div class="pt-4 border-t border-[#E2E8F0] grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-[#334155] mb-1.5">
                Compounding Frequency
              </label>
              <select
                v-model="compoundingFrequency"
                class="w-full px-3 py-2 text-xs font-semibold bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              >
                <option value="daily">Daily (365x / yr)</option>
                <option value="monthly">Monthly (12x / yr)</option>
                <option value="quarterly">Quarterly (4x / yr)</option>
                <option value="annually">Annually (1x / yr)</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-[#334155] mb-1.5">
                Contribution Timing
              </label>
              <select
                v-model="contributionTiming"
                class="w-full px-3 py-2 text-xs font-semibold bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              >
                <option value="end">End of each period (Ordinary)</option>
                <option value="beginning">Beginning of each period (Due)</option>
              </select>
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
              <span class="text-[11px] font-bold uppercase tracking-widest text-emerald-200">Growth Telemetry</span>
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
            <span class="text-xs font-semibold uppercase tracking-wider text-emerald-100">Projected Portfolio Value</span>
            <div class="text-3xl sm:text-4xl font-black text-white mt-1 num-tabular tracking-tight">
              {{ formatCurrency(result.futureValue, currency) }}
            </div>
            <div class="inline-flex items-center gap-1.5 text-xs text-emerald-200 mt-2 bg-black/20 px-2.5 py-1 rounded-full">
              <span>{{ years }} Years</span>
              <span>•</span>
              <span>{{ annualInterestRate }}% Annual Return</span>
            </div>
          </div>

          <!-- Proportional 3-Way Portfolio Distribution Bar -->
          <div class="space-y-2 pt-2">
            <div class="flex items-center justify-between text-xs font-bold text-white/90">
              <span>Capital Accumulation Breakdown</span>
              <span class="text-emerald-300">{{ growthMultiplier }}x Original Capital</span>
            </div>

            <!-- 3-Segment Proportional Stacked Bar -->
            <div class="h-4 w-full bg-black/20 rounded-full overflow-hidden flex p-0.5 border border-white/20">
              <div
                class="bg-sky-400 h-full rounded-l-full transition-all duration-300"
                :style="{ width: `${principalSharePct}%` }"
                :title="`Initial Principal: ${principalSharePct.toFixed(1)}%`"
              ></div>
              <div
                class="bg-amber-300 h-full transition-all duration-300"
                :style="{ width: `${contributionsSharePct}%` }"
                :title="`Additions: ${contributionsSharePct.toFixed(1)}%`"
              ></div>
              <div
                class="bg-emerald-300 h-full rounded-r-full transition-all duration-300"
                :style="{ width: `${interestSharePct}%` }"
                :title="`Compound Interest: ${interestSharePct.toFixed(1)}%`"
              ></div>
            </div>

            <!-- Legend with Percentages -->
            <div class="grid grid-cols-3 gap-2 text-[10px] sm:text-xs pt-1 font-semibold text-white/80">
              <div class="flex items-center gap-1">
                <span class="w-2.5 h-2.5 rounded-sm bg-sky-400 shrink-0"></span>
                <span class="truncate">Principal ({{ principalSharePct.toFixed(0) }}%)</span>
              </div>
              <div class="flex items-center gap-1">
                <span class="w-2.5 h-2.5 rounded-sm bg-amber-300 shrink-0"></span>
                <span class="truncate">Additions ({{ contributionsSharePct.toFixed(0) }}%)</span>
              </div>
              <div class="flex items-center gap-1">
                <span class="w-2.5 h-2.5 rounded-sm bg-emerald-300 shrink-0"></span>
                <span class="truncate">Interest ({{ interestSharePct.toFixed(0) }}%)</span>
              </div>
            </div>
          </div>

          <!-- Secondary Metric 2x2 Grid -->
          <div class="grid grid-cols-2 gap-3 pt-2">
            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <span class="text-[11px] font-semibold text-white/70 block">Total Out-of-Pocket</span>
              <span class="text-sm sm:text-base font-bold text-white num-tabular mt-0.5 block">
                {{ formatCurrency(result.totalPrincipal + result.totalContributions, currency) }}
              </span>
            </div>

            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <span class="text-[11px] font-semibold text-emerald-200 block">Pure Compound Growth</span>
              <span class="text-sm sm:text-base font-extrabold text-emerald-300 num-tabular mt-0.5 block">
                +{{ formatCurrency(result.totalInterestEarned, currency) }}
              </span>
            </div>

            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <span class="text-[11px] font-semibold text-white/70 block">Starting Principal</span>
              <span class="text-sm sm:text-base font-bold text-white num-tabular mt-0.5 block">
                {{ formatCurrency(result.totalPrincipal, currency) }}
              </span>
            </div>

            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <span class="text-[11px] font-semibold text-white/70 block">Cumulative Additions</span>
              <span class="text-sm sm:text-base font-bold text-white num-tabular mt-0.5 block">
                {{ formatCurrency(result.totalContributions, currency) }}
              </span>
            </div>
          </div>

          <div class="pt-2">
            <DisclaimerNotice />
          </div>
        </div>
      </div>
    </div>

    <!-- Visual Chart & Year-By-Year Table Instrument -->
    <div class="mb-16 bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <div class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0F766E] mb-1">
            <LineChart class="w-3.5 h-3.5" />
            <span>Growth Trajectory</span>
          </div>
          <h2 class="text-xl font-extrabold text-[#0F172A]">Year-By-Year Wealth Accumulation</h2>
          <p class="text-xs text-[#64748B]">Observe how compound gains accelerate and surpass annual contributions.</p>
        </div>

        <div class="flex items-center gap-3">
          <button
            type="button"
            @click="showFullTable = !showFullTable"
            class="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#334155] hover:bg-[#E2E8F0] transition-colors"
          >
            <TableIcon class="w-3.5 h-3.5" />
            <span>{{ showFullTable ? 'Collapse Table' : 'Expand Full Schedule' }}</span>
          </button>
        </div>
      </div>

      <!-- Accessible SVG Trajectory Chart -->
      <div 
        role="img" 
        :aria-label="`Compound growth trajectory chart showing total principal versus accumulated interest over ${years} years.`"
        class="w-full h-52 sm:h-64 mb-8 relative border-b border-l border-[#CBD5E1] flex items-end justify-between px-2 pt-6"
      >
        <span class="sr-only">Growth chart showing portfolio value scaling from initial principal to {{ formatCurrency(result.futureValue, currency) }}.</span>
        <div
          v-for="item in result.yearlyBreakdown.filter((_, i) => result.yearlyBreakdown.length <= 15 || i % Math.ceil(result.yearlyBreakdown.length / 15) === 0 || i === result.yearlyBreakdown.length - 1)"
          :key="item.year"
          class="flex-1 max-w-[42px] flex flex-col items-center justify-end h-full group relative"
        >
          <!-- Tooltip on hover -->
          <div class="absolute -top-14 hidden group-hover:block bg-[#0F172A] text-white text-[11px] py-1 px-2.5 rounded-lg shadow-lg whitespace-nowrap z-20 num-tabular border border-slate-700">
            Year {{ item.year }}: {{ formatCurrency(item.endingBalance, currency) }}
          </div>

          <!-- Stacked Bar Column -->
          <div class="w-3.5 sm:w-6 flex flex-col justify-end h-full rounded-t-md overflow-hidden bg-slate-100">
            <div
              class="w-full bg-[#0F766E] transition-all"
              :style="{ height: `${result.futureValue > 0 ? (item.totalInterestSoFar / result.futureValue) * 100 : 0}%` }"
              title="Interest Earned"
            ></div>
            <div
              class="w-full bg-[#94A3B8] transition-all"
              :style="{ height: `${result.futureValue > 0 ? (item.totalContributionsSoFar / result.futureValue) * 100 : 0}%` }"
              title="Contributions"
            ></div>
          </div>
          <span class="text-[10px] font-bold text-[#64748B] mt-2 num-tabular">Y{{ item.year }}</span>
        </div>
      </div>

      <!-- Year-by-Year Table (Collapsible) -->
      <div v-show="showFullTable" class="overflow-x-auto border border-[#E2E8F0] rounded-2xl">
        <table class="w-full text-left text-xs sm:text-sm">
          <thead class="bg-[#F8FAFC] text-[#475569] font-bold border-b border-[#E2E8F0]">
            <tr>
              <th class="py-3 px-4">Year</th>
              <th class="py-3 px-4">Starting Balance</th>
              <th class="py-3 px-4">Contributions</th>
              <th class="py-3 px-4">Interest Earned</th>
              <th class="py-3 px-4">Ending Balance</th>
              <th class="py-3 px-4">Cumulative Growth</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#E2E8F0]">
            <tr v-for="item in result.yearlyBreakdown" :key="item.year" class="hover:bg-[#F8FAFC]/60 transition-colors">
              <td class="py-2.5 px-4 font-bold text-[#0F172A]">Year {{ item.year }}</td>
              <td class="py-2.5 px-4 num-tabular text-[#64748B]">{{ formatCurrency(item.startingBalance, currency) }}</td>
              <td class="py-2.5 px-4 num-tabular text-[#64748B]">{{ formatCurrency(item.contributions, currency) }}</td>
              <td class="py-2.5 px-4 num-tabular text-[#0F766E] font-bold">+{{ formatCurrency(item.interestEarned, currency) }}</td>
              <td class="py-2.5 px-4 num-tabular text-[#0F172A] font-extrabold">{{ formatCurrency(item.endingBalance, currency) }}</td>
              <td class="py-2.5 px-4 num-tabular text-[#0F766E] font-medium">{{ formatCurrency(item.totalInterestSoFar, currency) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Explanatory & Guides -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
      <div class="lg:col-span-8 space-y-8">
        <section class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
          <h2 class="text-xl font-extrabold text-[#0F172A] mb-3">The Mathematical Mechanics of Compounding</h2>
          <p class="text-sm text-[#64748B] leading-relaxed mb-4">
            Unlike simple interest (which only calculates returns on the initial principal), compound interest calculates gains on both the initial principal and previously accumulated interest. Over long investment horizons, compound gains dramatically outstrip out-of-pocket contributions.
          </p>
          <div class="bg-[#F8FAFC] border border-[#CBD5E1] p-4 rounded-xl num-tabular text-xs sm:text-sm text-[#0F172A] mb-4 font-mono">
            {{ currentTool.formula }}
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
          <h3 class="text-base font-bold text-[#0F172A] mb-2">Retirement Longevity Calculator</h3>
          <p class="text-xs text-[#64748B] leading-relaxed mb-4">
            Explore what happens when you switch from accumulating wealth to taking regular retirement withdrawals.
          </p>
          <RouterLink
            to="/how-long-will-my-money-last/"
            class="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F766E] hover:underline"
          >
            <span>Retirement Longevity Tool</span>
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
