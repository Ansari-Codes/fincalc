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

const currency = 'USD'
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
    `Initial Principal: ${formatCurrency(initialPrincipal.value || 0, currency)}`,
    `Regular Contribution: ${formatCurrency(contributionAmount.value || 0, currency)} (${contributionFrequency.value})`,
    `Annual Growth Rate: ${formatPercent(annualInterestRate.value || 0)}`,
    `Compounding Frequency: ${compoundingFrequency.value}`,
    `Investment Horizon: ${years.value} Years`,
    `Estimated Future Value: ${formatCurrency(result.value.futureValue, currency)}`,
    `Total Principal & Additions: ${formatCurrency(result.value.totalPrincipal + result.value.totalContributions, currency)}`,
    `Total Compound Interest Earned: ${formatCurrency(result.value.totalInterestEarned, currency)}`,
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

      <!-- Controls: Reset -->
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
          <p class="text-sm text-[#64748B] leading-relaxed mb-4">
            The formula has four moving parts: P is what you start with, r is the annual return as a decimal (7.5% is 0.075), n is how many times a year interest is added, and t is the number of years. Each compounding period, your balance is multiplied by (1 + r/n). With monthly compounding at 7.5%, that is a 0.625% rise every month — small on its own, but it applies to a balance that keeps growing, which is why the curve bends upwards instead of running straight.
          </p>
          <p class="text-sm text-[#64748B] leading-relaxed mb-4">
            When you also add regular contributions, there is no single closed-form line: the calculator simulates each period in turn, adding your contribution first or last depending on the timing setting, then applying that period's interest. That is the same recurrence the Excel FV function uses, so the two agree to the cent — see the Excel section below.
          </p>
          <div class="bg-[#F8FAFC] border border-[#CBD5E1] p-4 rounded-xl num-tabular text-xs sm:text-sm text-[#0F172A] mb-4 font-mono">
            {{ currentTool.formula }}
          </div>
        </section>

        <section class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
          <h2 class="text-xl font-extrabold text-[#0F172A] mb-3">Worked Example: $10,000 Plus $500 a Month for 20 Years</h2>
          <p class="text-sm text-[#64748B] leading-relaxed mb-4">
            Take the calculator's defaults: $10,000 at the start, $500 every month, a 7.5% annual return compounded monthly, for 20 years. The result is $321,473.53. You put in $130,000 in total — $10,000 up front and $120,000 of monthly contributions — and compound interest contributes the other $191,473.53. In other words, the interest earned is almost one and a half times everything you paid in.
          </p>
          <div class="overflow-x-auto border border-[#E2E8F0] rounded-2xl mb-4">
            <table class="w-full text-left text-xs sm:text-sm">
              <thead class="bg-[#F8FAFC] text-[#475569] font-bold border-b border-[#E2E8F0]">
                <tr>
                  <th class="py-3 px-4">Year</th>
                  <th class="py-3 px-4">Ending Balance</th>
                  <th class="py-3 px-4">Interest Earned That Year</th>
                  <th class="py-3 px-4">Total Interest So Far</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#E2E8F0]">
                <tr class="hover:bg-[#F8FAFC]/60 transition-colors">
                  <td class="py-2.5 px-4 font-bold text-[#0F172A]">Year 1</td>
                  <td class="py-2.5 px-4 num-tabular text-[#64748B]">$16,986.93</td>
                  <td class="py-2.5 px-4 num-tabular text-[#64748B]">$986.93</td>
                  <td class="py-2.5 px-4 num-tabular text-[#64748B]">$986.93</td>
                </tr>
                <tr class="hover:bg-[#F8FAFC]/60 transition-colors">
                  <td class="py-2.5 px-4 font-bold text-[#0F172A]">Year 5</td>
                  <td class="py-2.5 px-4 num-tabular text-[#64748B]">$50,796.50</td>
                  <td class="py-2.5 px-4 num-tabular text-[#64748B]">$3,422.57</td>
                  <td class="py-2.5 px-4 num-tabular text-[#64748B]">$10,796.50</td>
                </tr>
                <tr class="hover:bg-[#F8FAFC]/60 transition-colors">
                  <td class="py-2.5 px-4 font-bold text-[#0F172A]">Year 10</td>
                  <td class="py-2.5 px-4 num-tabular text-[#64748B]">$110,085.82</td>
                  <td class="py-2.5 px-4 num-tabular text-[#64748B]">$7,693.77</td>
                  <td class="py-2.5 px-4 num-tabular text-[#64748B]">$40,085.82</td>
                </tr>
                <tr class="hover:bg-[#F8FAFC]/60 transition-colors">
                  <td class="py-2.5 px-4 font-bold text-[#0F172A]">Year 15</td>
                  <td class="py-2.5 px-4 num-tabular text-[#64748B]">$196,250.66</td>
                  <td class="py-2.5 px-4 num-tabular text-[#64748B]">$13,901.08</td>
                  <td class="py-2.5 px-4 num-tabular text-[#64748B]">$96,250.66</td>
                </tr>
                <tr class="hover:bg-[#F8FAFC]/60 transition-colors">
                  <td class="py-2.5 px-4 font-bold text-[#0F172A]">Year 20</td>
                  <td class="py-2.5 px-4 num-tabular text-[#64748B]">$321,473.53</td>
                  <td class="py-2.5 px-4 num-tabular text-[#64748B]">$22,922.13</td>
                  <td class="py-2.5 px-4 num-tabular text-[#64748B]">$191,473.53</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-sm text-[#64748B] leading-relaxed mb-4">
            The acceleration is the story. Year 1 earns $986.93 of interest; year 10 earns $7,693.77; year 20 earns $22,922.13 — more than the entire first year's balance. The second 10 years add $211,387.71, more than double the first 10 years' gain of $100,085.82. That is why the advice is always to start early: time does more work than money.
          </p>
          <p class="text-sm text-[#64748B] leading-relaxed">
            All of this is in nominal dollars. At 3% inflation, $321,473.53 in 20 years buys what about $177,992 buys today — still a real gain, but the headline number overstates what you can actually spend. Taxes and fees would cut it further; the assumptions below list everything the projection leaves out.
          </p>
        </section>

        <section class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
          <h2 class="text-xl font-extrabold text-[#0F172A] mb-3">Simple Interest vs Compound Interest</h2>
          <p class="text-sm text-[#64748B] leading-relaxed mb-4">
            The same $10,000 at 7.5% for 20 years earns $15,000 of simple interest and ends at $25,000 — because simple interest only ever pays on the original $10,000. Compounded monthly, the same deposit ends at $44,608.17: $19,608.17 more, with no extra money paid in. The gap is zero in year 1 and grows every year after, because each year's interest starts earning interest of its own.
          </p>
          <p class="text-sm text-[#64748B] leading-relaxed">
            Any product that quotes interest on your balance without saying how often it compounds is hiding the most important number. A savings account that pays 7.5% compounded annually and one that pays 7.5% compounded monthly are not the same account — on $10,000 over 20 years, the monthly one ends $2,129.66 ahead.
          </p>
        </section>

        <section class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
          <h2 class="text-xl font-extrabold text-[#0F172A] mb-3">Does Compounding Frequency Matter?</h2>
          <p class="text-sm text-[#64748B] leading-relaxed mb-4">
            On that same $10,000 at 7.5% for 20 years, the frequency alone changes the outcome:
          </p>
          <div class="overflow-x-auto border border-[#E2E8F0] rounded-2xl mb-4">
            <table class="w-full text-left text-xs sm:text-sm">
              <thead class="bg-[#F8FAFC] text-[#475569] font-bold border-b border-[#E2E8F0]">
                <tr>
                  <th class="py-3 px-4">Compounding Frequency</th>
                  <th class="py-3 px-4">Periods per Year</th>
                  <th class="py-3 px-4">Value After 20 Years</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#E2E8F0]">
                <tr class="hover:bg-[#F8FAFC]/60 transition-colors">
                  <td class="py-2.5 px-4 font-bold text-[#0F172A]">Annually</td>
                  <td class="py-2.5 px-4 num-tabular text-[#64748B]">1</td>
                  <td class="py-2.5 px-4 num-tabular text-[#64748B]">$42,478.51</td>
                </tr>
                <tr class="hover:bg-[#F8FAFC]/60 transition-colors">
                  <td class="py-2.5 px-4 font-bold text-[#0F172A]">Quarterly</td>
                  <td class="py-2.5 px-4 num-tabular text-[#64748B]">4</td>
                  <td class="py-2.5 px-4 num-tabular text-[#64748B]">$44,198.72</td>
                </tr>
                <tr class="hover:bg-[#F8FAFC]/60 transition-colors">
                  <td class="py-2.5 px-4 font-bold text-[#0F172A]">Monthly</td>
                  <td class="py-2.5 px-4 num-tabular text-[#64748B]">12</td>
                  <td class="py-2.5 px-4 num-tabular text-[#64748B]">$44,608.17</td>
                </tr>
                <tr class="hover:bg-[#F8FAFC]/60 transition-colors">
                  <td class="py-2.5 px-4 font-bold text-[#0F172A]">Daily</td>
                  <td class="py-2.5 px-4 num-tabular text-[#64748B]">365</td>
                  <td class="py-2.5 px-4 num-tabular text-[#64748B]">$44,809.99</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-sm text-[#64748B] leading-relaxed">
            Daily beats annual by $2,331.47. That is real money, but keep it in proportion: the frequency gap is about 5% of the final balance, while raising the return from 7.5% to 8.5% or adding five more years would each move the result far more. Frequency is worth checking when you compare two accounts; it is not worth chasing at the expense of a better rate or an earlier start.
          </p>
        </section>

        <section class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
          <h2 class="text-xl font-extrabold text-[#0F172A] mb-3">Starting Early Beats Saving More</h2>
          <p class="text-sm text-[#64748B] leading-relaxed mb-4">
            Two savers both put aside $200 a month at a 7% return until age 65. The one who starts at 25 ends with $524,962.68, having paid in $96,000; compound interest adds $428,962.68. The one who starts at 35 ends with $243,994.20, having paid in $72,000; interest adds $171,994.20.
          </p>
          <p class="text-sm text-[#64748B] leading-relaxed">
            The early starter paid only $24,000 more but ends with $280,968.48 more — over eleven times the extra contributions. Waiting ten years costs more than half the final balance. If you can only do one thing, start now with a smaller amount rather than waiting until you can afford a bigger one. The same logic is why the retirement calculator rewards an early start even more than a higher monthly figure.
          </p>
        </section>

        <section class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
          <h2 class="text-xl font-extrabold text-[#0F172A] mb-3">How to Calculate Compound Interest in Excel or Google Sheets</h2>
          <p class="text-sm text-[#64748B] leading-relaxed mb-4">
            For the defaults above, put =FV(7.5%/12, 240, -500, -10000) in a cell: it returns $321,473.53, exactly matching this calculator. The arguments are the monthly rate (7.5% divided by 12), the number of months (20 years times 12), the monthly payment (-500, negative because money leaves your pocket), and the present value (-10000). For a single deposit with no contributions, use =FV(7.5%/12, 240, 0, -10000), which gives $44,608.17.
          </p>
          <p class="text-sm text-[#64748B] leading-relaxed">
            Excel's FV assumes end-of-period payments, which is this calculator's default. Switch the timing to beginning here and the equivalent is =FV(7.5%/12, 240, -500, -10000, 1), which gives $323,203.94 — $1,730.41 more, because each contribution gets one extra month of growth.
          </p>
        </section>

        <section class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
          <h2 class="text-xl font-extrabold text-[#0F172A] mb-3">The Rule of 72</h2>
          <p class="text-sm text-[#64748B] leading-relaxed">
            Divide 72 by your annual return to estimate the doubling time: at 7.5%, money doubles in about 72 ÷ 7.5 = 9.6 years. The calculator agrees: $1,000 at 7.5% compounded monthly is $2,112.06 after 10 years — just past double. The rule works best for rates between about 6% and 10%; outside that range it drifts, so treat it as a quick check, not a plan.
          </p>
        </section>

        <section class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
          <h2 class="text-xl font-extrabold text-[#0F172A] mb-3">What This Projection Leaves Out</h2>
          <p class="text-sm text-[#64748B] leading-relaxed">
            The projection assumes one unchanging return for the whole period — real markets do not do that, and a bad sequence of returns early on hurts more than the same bad years late. It ignores taxes, account fees and fund charges, and it counts nominal dollars, not buying power. It also assumes you never withdraw and never miss a contribution. Use it to compare plans and set a savings habit, then check the result against the retirement longevity calculator to see how long the money lasts once you start spending it.
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
