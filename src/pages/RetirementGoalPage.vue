<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { updatePageSeo } from '@/utils/seo'
import { generateCalculatorSchema } from '@/utils/structuredData'
import { formatCurrency, formatPercent, copyToClipboard } from '@/utils/formatters'
import { calculateRetirementGoal, type ContributionFrequency, type ContributionTiming } from '@/calculations/retirementGoal'
import Breadcrumbs from '@/components/ui/Breadcrumbs.vue'
import FAQAccordion from '@/components/ui/FAQAccordion.vue'
import RelatedTools from '@/components/ui/RelatedTools.vue'
import DisclaimerNotice from '@/components/ui/DisclaimerNotice.vue'
import { tools } from '@/data/tools'
import {
  Target,
  RotateCcw,
  Copy,
  Check,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Calendar,
  PiggyBank,
  CheckCircle2,
  Sliders,
  PieChart
} from '@lucide/vue'

const currentTool = tools.find(t => t.slug === 'retirement-savings-calculator')!

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

// Input form states
const currentSavings = ref<number | null>(50000)
const targetAmount = ref<number | null>(1000000)
const currentAge = ref<number | null>(35)
const retirementAge = ref<number | null>(65)
const expectedAnnualReturn = ref<number | null>(7.0)
const contributionFrequency = ref<ContributionFrequency>('monthly')
const contributionTiming = ref<ContributionTiming>('end')
const annualContributionIncreasePct = ref<number | null>(0)
const showSchedule = ref(false)

// Presets
function setSavings(val: number) {
  currentSavings.value = val
}

function setTarget(val: number) {
  targetAmount.value = val
}

function setReturn(val: number) {
  expectedAnnualReturn.value = val
}

function resetForm() {
  currentSavings.value = null
  targetAmount.value = null
  currentAge.value = null
  retirementAge.value = 65
  expectedAnnualReturn.value = null
  contributionFrequency.value = 'monthly'
  contributionTiming.value = 'end'
  annualContributionIncreasePct.value = 0
}

const result = computed(() => {
  return calculateRetirementGoal({
    currentSavings: currentSavings.value ?? 0,
    targetAmount: targetAmount.value ?? 0,
    currentAge: currentAge.value !== null ? currentAge.value : undefined,
    retirementAge: retirementAge.value ?? 65,
    expectedAnnualReturn: expectedAnnualReturn.value ?? 0,
    contributionFrequency: contributionFrequency.value,
    contributionTiming: contributionTiming.value,
    annualContributionIncreasePct: annualContributionIncreasePct.value ?? 0
  })
})

// Visual 3-way distribution breakdown
const totalProjected = computed(() => Math.max(1, result.value.projectedFinalBalance))
const initialSharePct = computed(() => ((currentSavings.value || 0) / totalProjected.value) * 100)
const contribSharePct = computed(() => (result.value.totalPersonalContributions / totalProjected.value) * 100)
const growthSharePct = computed(() => (result.value.estimatedInvestmentGrowth / totalProjected.value) * 100)

async function handleCopy() {
  const lines = [
    'Retirement Savings Goal Summary',
    '--------------------------------',
    `Current Savings: ${formatCurrency(currentSavings.value || 0, currency.value)}`,
    `Target Retirement Nest Egg: ${formatCurrency(targetAmount.value || 0, currency.value)}`,
    `Investment Horizon: ${result.value.yearsToRetirement} years (${result.value.numberOfPeriods} periods)`,
    `Expected Annual Return: ${formatPercent(expectedAnnualReturn.value || 0)}`,
    `Required Monthly Contribution: ${formatCurrency(result.value.requiredMonthlyContribution, currency.value)}`,
    `Required Annual Contribution: ${formatCurrency(result.value.requiredAnnualContribution, currency.value)}`,
    `Total Personal Contributions: ${formatCurrency(result.value.totalPersonalContributions, currency.value)}`,
    `Estimated Investment Growth: ${formatCurrency(result.value.estimatedInvestmentGrowth, currency.value)}`,
    `Projected Final Balance: ${formatCurrency(result.value.projectedFinalBalance, currency.value)}`
  ]

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
      { name: 'Retirement', path: '/tools/retirement/' },
      { name: 'Retirement Savings Goal Calculator' }
    ]" />

    <!-- Tool Instrument Header -->
    <div class="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div>
        <div class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0F766E] bg-[#E7F4F1] px-3 py-1 rounded-full mb-2.5">
          <Target class="w-3.5 h-3.5" />
          <span>Interactive Savings Instrument</span>
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

    <!-- Main Instrument Console Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
      <!-- Left Panel: Interactive Console Controls -->
      <div class="lg:col-span-7 bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
        <div class="flex items-center justify-between pb-4 mb-6 border-b border-[#F1F5F9]">
          <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#475569]">
            <Sliders class="w-4 h-4 text-[#0F766E]" />
            <span>Target Parameters</span>
          </div>
          <span class="text-[11px] text-[#94A3B8] font-medium">Drag sliders or enter values</span>
        </div>

        <form @submit.prevent class="space-y-6">
          <!-- Target Amount Slider -->
          <div class="bg-[#F8FAFC] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] space-y-3">
            <div class="flex items-center justify-between">
              <label for="target-amount" class="text-xs font-bold uppercase tracking-wider text-[#334155]">
                Target Retirement Nest Egg
              </label>
              <div class="relative w-40">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#94A3B8]">$</span>
                <input
                  id="target-amount"
                  v-model.number="targetAmount"
                  type="number"
                  min="0"
                  step="25000"
                  class="w-full pl-6 pr-2.5 py-1.5 text-right font-bold text-sm bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>
            </div>

            <input
              type="range"
              min="100000"
              max="3000000"
              step="25000"
              :value="targetAmount || 0"
              @input="targetAmount = Number(($event.target as HTMLInputElement).value)"
              class="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#0F766E]"
            />

            <!-- Presets -->
            <div class="flex flex-wrap items-center gap-1.5 pt-1">
              <span class="text-[11px] font-semibold text-[#94A3B8] mr-1">Presets:</span>
              <button
                v-for="amt in [250000, 500000, 1000000, 1500000, 2000000]"
                :key="amt"
                type="button"
                @click="setTarget(amt)"
                :class="targetAmount === amt ? 'bg-[#0F766E] text-white' : 'bg-white text-[#475569] hover:bg-[#E2E8F0]'"
                class="text-[11px] font-bold px-2.5 py-1 rounded-md border border-[#CBD5E1] transition-colors"
              >
                ${{ amt >= 1000000 ? (amt / 1000000) + 'M' : (amt / 1000) + 'k' }}
              </button>
            </div>
          </div>

          <!-- Current Savings Slider -->
          <div class="bg-[#F8FAFC] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] space-y-3">
            <div class="flex items-center justify-between">
              <label for="current-savings" class="text-xs font-bold uppercase tracking-wider text-[#334155]">
                Current Retirement Savings
              </label>
              <div class="relative w-36">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#94A3B8]">$</span>
                <input
                  id="current-savings"
                  v-model.number="currentSavings"
                  type="number"
                  min="0"
                  step="5000"
                  class="w-full pl-6 pr-2.5 py-1.5 text-right font-bold text-sm bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>
            </div>

            <input
              type="range"
              min="0"
              max="500000"
              step="5000"
              :value="currentSavings || 0"
              @input="currentSavings = Number(($event.target as HTMLInputElement).value)"
              class="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#0F766E]"
            />

            <!-- Presets -->
            <div class="flex flex-wrap items-center gap-1.5 pt-1">
              <span class="text-[11px] font-semibold text-[#94A3B8] mr-1">Presets:</span>
              <button
                v-for="amt in [0, 25000, 50000, 100000, 200000]"
                :key="amt"
                type="button"
                @click="setSavings(amt)"
                :class="currentSavings === amt ? 'bg-[#0F766E] text-white' : 'bg-white text-[#475569] hover:bg-[#E2E8F0]'"
                class="text-[11px] font-bold px-2.5 py-1 rounded-md border border-[#CBD5E1] transition-colors"
              >
                ${{ amt >= 1000000 ? (amt / 1000000) + 'M' : (amt / 1000) + 'k' }}
              </button>
            </div>
          </div>

          <!-- Ages Row -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0]">
              <label for="current-age" class="block text-xs font-bold uppercase tracking-wider text-[#334155] mb-1.5">
                Current Age
              </label>
              <input
                id="current-age"
                v-model.number="currentAge"
                type="number"
                min="18"
                max="90"
                class="w-full px-3 py-2 text-sm font-bold bg-white border border-[#CBD5E1] rounded-xl text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              />
            </div>

            <div class="bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0]">
              <label for="retirement-age" class="block text-xs font-bold uppercase tracking-wider text-[#334155] mb-1.5">
                Retirement Age
              </label>
              <input
                id="retirement-age"
                v-model.number="retirementAge"
                type="number"
                min="20"
                max="100"
                class="w-full px-3 py-2 text-sm font-bold bg-white border border-[#CBD5E1] rounded-xl text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              />
            </div>
          </div>

          <!-- Expected Annual Return Slider -->
          <div class="bg-[#F8FAFC] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] space-y-3">
            <div class="flex items-center justify-between">
              <label for="expected-return" class="text-xs font-bold uppercase tracking-wider text-[#334155]">
                Expected Annual Return
              </label>
              <div class="relative w-28">
                <input
                  id="expected-return"
                  v-model.number="expectedAnnualReturn"
                  type="number"
                  min="0"
                  max="25"
                  step="0.1"
                  class="w-full pl-2.5 pr-6 py-1.5 text-right font-bold text-sm bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
                <span class="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#94A3B8]">%</span>
              </div>
            </div>

            <input
              type="range"
              min="0"
              max="15"
              step="0.25"
              :value="expectedAnnualReturn || 0"
              @input="expectedAnnualReturn = Number(($event.target as HTMLInputElement).value)"
              class="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#0F766E]"
            />

            <!-- Presets -->
            <div class="flex flex-wrap items-center gap-1.5 pt-1">
              <span class="text-[11px] font-semibold text-[#94A3B8] mr-1">Presets:</span>
              <button
                v-for="r in [4.0, 5.5, 7.0, 8.5, 10.0]"
                :key="r"
                type="button"
                @click="setReturn(r)"
                :class="expectedAnnualReturn === r ? 'bg-[#0F766E] text-white' : 'bg-white text-[#475569] hover:bg-[#E2E8F0]'"
                class="text-[11px] font-bold px-2.5 py-1 rounded-md border border-[#CBD5E1] transition-colors"
              >
                {{ r }}%
              </button>
            </div>
          </div>

          <!-- Contribution Options Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0]">
              <label for="freq" class="block text-xs font-bold uppercase tracking-wider text-[#334155] mb-1.5">
                Frequency
              </label>
              <select
                id="freq"
                v-model="contributionFrequency"
                class="w-full px-3 py-2 text-xs font-bold bg-white border border-[#CBD5E1] rounded-xl text-[#0F172A]"
              >
                <option value="monthly">Monthly Deposits</option>
                <option value="annually">Annual Deposits</option>
              </select>
            </div>

            <div class="bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0]">
              <label for="timing" class="block text-xs font-bold uppercase tracking-wider text-[#334155] mb-1.5">
                Timing
              </label>
              <select
                id="timing"
                v-model="contributionTiming"
                class="w-full px-3 py-2 text-xs font-bold bg-white border border-[#CBD5E1] rounded-xl text-[#0F172A]"
              >
                <option value="end">End of Period (Ordinary)</option>
                <option value="beginning">Beginning of Period (Due)</option>
              </select>
            </div>
          </div>
        </form>

        <!-- Validation Errors -->
        <div v-if="!result.isValid && result.validationErrors.length > 0" class="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200">
          <div class="flex items-start gap-2.5">
            <AlertCircle class="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div class="text-xs text-amber-900 space-y-1">
              <p class="font-bold">Please check your inputs:</p>
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
              <PiggyBank class="w-4 h-4 text-[#99F6E4]" />
              <span class="text-xs font-bold uppercase tracking-wider text-[#99F6E4]">Required Periodic Deposit</span>
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

          <!-- Highlight Status: Target Achieved -->
          <div v-if="result.alreadyAchieved" class="mb-6 p-4 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-100 flex items-start gap-3">
            <CheckCircle2 class="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
            <div>
              <p class="font-bold text-xs text-white uppercase tracking-wider">Target Met by Compounding!</p>
              <p class="text-xs text-emerald-100 mt-1 leading-relaxed">
                At {{ expectedAnnualReturn }}% return, your {{ formatCurrency(currentSavings || 0, currency) }} will reach {{ formatCurrency(targetAmount || 0, currency) }} without additional deposits.
              </p>
            </div>
          </div>

          <!-- Hero Required Contribution Display -->
          <div class="mb-6">
            <span class="text-xs uppercase tracking-wider text-white/70 font-semibold block mb-1">
              {{ contributionFrequency === 'monthly' ? 'Required Monthly Contribution' : 'Required Annual Contribution' }}
            </span>
            <div class="text-4xl sm:text-5xl font-black tracking-tight text-white flex items-baseline gap-2">
              <span>{{ formatCurrency(contributionFrequency === 'monthly' ? result.requiredMonthlyContribution : result.requiredAnnualContribution, currency) }}</span>
              <span class="text-sm font-semibold text-[#99F6E4]">/{{ contributionFrequency === 'monthly' ? 'mo' : 'yr' }}</span>
            </div>
            <p class="text-xs text-[#99F6E4] mt-2">
              {{ contributionFrequency === 'monthly'
                ? `Equivalent to ${formatCurrency(result.requiredAnnualContribution, currency)} per year`
                : `Equivalent to ${formatCurrency(result.requiredMonthlyContribution, currency)} per month` }}
            </p>
          </div>

          <!-- 3-Way Portfolio Accumulation Visual Bar -->
          <div class="mb-6 bg-black/20 p-4 rounded-2xl border border-white/10">
            <div class="flex items-center justify-between text-xs mb-2">
              <span class="font-bold text-white flex items-center gap-1.5">
                <PieChart class="w-3.5 h-3.5 text-[#99F6E4]" />
                <span>Nest Egg Accumulation Sources</span>
              </span>
              <span class="text-xs text-white/70 font-semibold">
                {{ formatCurrency(result.projectedFinalBalance, currency) }}
              </span>
            </div>

            <!-- Proportional 3-Segment Bar -->
            <div class="w-full h-3 rounded-full overflow-hidden flex bg-white/20">
              <div
                class="bg-[#2DD4BF] transition-all duration-300"
                :style="{ width: `${initialSharePct}%` }"
                title="Current Savings"
              ></div>
              <div
                class="bg-[#38BDF8] transition-all duration-300"
                :style="{ width: `${contribSharePct}%` }"
                title="Your Contributions"
              ></div>
              <div
                class="bg-[#34D399] transition-all duration-300"
                :style="{ width: `${growthSharePct}%` }"
                title="Compound Market Growth"
              ></div>
            </div>

            <!-- 3-Way Legend -->
            <div class="grid grid-cols-3 gap-1 text-[10px] mt-2.5">
              <div class="flex items-center gap-1 text-teal-200">
                <span class="w-2 h-2 rounded-full bg-[#2DD4BF] shrink-0"></span>
                <span class="truncate">Start: {{ initialSharePct.toFixed(0) }}%</span>
              </div>
              <div class="flex items-center gap-1 text-sky-200">
                <span class="w-2 h-2 rounded-full bg-[#38BDF8] shrink-0"></span>
                <span class="truncate">Deposits: {{ contribSharePct.toFixed(0) }}%</span>
              </div>
              <div class="flex items-center gap-1 text-emerald-200">
                <span class="w-2 h-2 rounded-full bg-[#34D399] shrink-0"></span>
                <span class="truncate">Growth: {{ growthSharePct.toFixed(0) }}%</span>
              </div>
            </div>
          </div>

          <!-- Secondary Metric HUD Grid -->
          <div class="grid grid-cols-2 gap-3 mb-6">
            <div class="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
              <div class="flex items-center gap-1.5 text-xs text-[#99F6E4] mb-1">
                <DollarSign class="w-3.5 h-3.5" />
                <span>Your Deposits</span>
              </div>
              <div class="text-lg sm:text-xl font-black">
                {{ formatCurrency(result.totalPersonalContributions, currency) }}
              </div>
              <span class="text-[10px] text-white/60">Out-of-pocket</span>
            </div>

            <div class="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
              <div class="flex items-center gap-1.5 text-xs text-emerald-300 mb-1">
                <TrendingUp class="w-3.5 h-3.5" />
                <span>Compound Growth</span>
              </div>
              <div class="text-lg sm:text-xl font-black text-emerald-200">
                {{ formatCurrency(result.estimatedInvestmentGrowth, currency) }}
              </div>
              <span class="text-[10px] text-white/60">Market returns</span>
            </div>

            <div class="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
              <div class="flex items-center gap-1.5 text-xs text-[#99F6E4] mb-1">
                <Calendar class="w-3.5 h-3.5" />
                <span>Horizon</span>
              </div>
              <div class="text-lg sm:text-xl font-black">
                {{ result.yearsToRetirement }} Years
              </div>
              <span class="text-[10px] text-white/60">{{ result.numberOfPeriods }} contributions</span>
            </div>

            <div class="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
              <div class="flex items-center gap-1.5 text-xs text-[#99F6E4] mb-1">
                <Target class="w-3.5 h-3.5" />
                <span>Final Projected</span>
              </div>
              <div class="text-lg sm:text-xl font-black">
                {{ formatCurrency(result.projectedFinalBalance, currency) }}
              </div>
              <span class="text-[10px] text-white/60">Target achieved</span>
            </div>
          </div>
        </div>

        <!-- Schedule Toggle Button -->
        <button
          type="button"
          @click="showSchedule = !showSchedule"
          class="relative z-10 w-full py-3 px-4 text-xs font-bold rounded-2xl bg-white text-[#0B3B39] hover:bg-[#F0FDFA] transition-all text-center shadow-md active:scale-98"
        >
          {{ showSchedule ? '▲ Hide Annual Schedule' : '▼ View Year-by-Year Growth Schedule' }}
        </button>
      </div>
    </div>

    <!-- Annual Accumulation Schedule Table -->
    <div v-if="showSchedule && result.yearlyBreakdown.length > 0" class="mb-12 bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-lg font-bold text-[#0F172A]">Annual Accumulation Progression</h3>
          <p class="text-xs text-[#64748B] mt-0.5">Yearly expansion showing deposits vs compound market returns.</p>
        </div>
      </div>
      <div class="overflow-x-auto max-h-[500px] border border-[#E2E8F0] rounded-2xl">
        <table class="w-full text-left text-xs border-collapse">
          <thead class="sticky top-0 bg-[#F8FAFC]">
            <tr class="border-b border-[#E2E8F0] text-[#64748B] font-bold">
              <th class="py-3 px-4">Year</th>
              <th v-if="currentAge" class="py-3 px-4">Age</th>
              <th class="py-3 px-4">Starting Balance</th>
              <th class="py-3 px-4">Yearly Deposits</th>
              <th class="py-3 px-4">Interest Earned</th>
              <th class="py-3 px-4">Ending Balance</th>
              <th class="py-3 px-4 text-right">Cumulative Growth</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#F1F5F9] text-[#334155]">
            <tr v-for="row in result.yearlyBreakdown" :key="row.year" class="hover:bg-[#F8FAFC] transition-colors">
              <td class="py-2.5 px-4 font-bold text-[#0F766E]">Year {{ row.year }}</td>
              <td v-if="currentAge" class="py-2.5 px-4 font-medium">{{ row.age }}</td>
              <td class="py-2.5 px-4">{{ formatCurrency(row.startingBalance, currency) }}</td>
              <td class="py-2.5 px-4 text-sky-700 font-semibold">+{{ formatCurrency(row.contributions, currency) }}</td>
              <td class="py-2.5 px-4 text-emerald-700 font-semibold">+{{ formatCurrency(row.interestEarned, currency) }}</td>
              <td class="py-2.5 px-4 font-bold text-[#0F172A]">{{ formatCurrency(row.endingBalance, currency) }}</td>
              <td class="py-2.5 px-4 text-right font-medium text-[#64748B]">{{ formatCurrency(row.totalInterestSoFar, currency) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Educational Content & Formula Explanation -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
      <div class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-7 shadow-xs">
        <h3 class="text-xs font-bold text-[#0F766E] uppercase tracking-wider mb-2">
          Sinking Fund Annuity Formula
        </h3>
        <p class="text-xs text-[#64748B] leading-relaxed mb-3">
          Calculates the periodic contribution PMT needed to bridge future value requirements:
        </p>
        <div class="bg-[#F8FAFC] p-4 rounded-xl border border-[#CBD5E1] font-mono text-xs text-[#1E293B] overflow-x-auto mb-3">
          PMT = [FV − PV(1+r)^n] × [r ÷ ((1+r)^n − 1)]
        </div>
        <ul class="text-xs text-[#64748B] space-y-1">
          <li><strong>FV:</strong> Desired target nest egg</li>
          <li><strong>PV:</strong> Current accumulated capital</li>
          <li><strong>r:</strong> Periodic interest rate</li>
          <li><strong>n:</strong> Total periods until retirement</li>
        </ul>
      </div>

      <div class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-7 shadow-xs">
        <h3 class="text-xs font-bold text-[#0F766E] uppercase tracking-wider mb-2">
          Key Assumptions &amp; Disclosures
        </h3>
        <ul class="text-xs text-[#64748B] space-y-2 list-disc pl-4 leading-relaxed">
          <li v-for="(assumption, idx) in currentTool.assumptions" :key="idx">
            {{ assumption }}
          </li>
        </ul>
      </div>
    </div>

    <!-- FAQ Accordion -->
    <div class="mb-12">
      <h2 class="text-xl font-bold text-[#0F172A] mb-4">Frequently Asked Questions</h2>
      <FAQAccordion :items="currentTool.faqs" />
    </div>

    <!-- Related Tools -->
    <div class="mb-12">
      <h2 class="text-xl font-bold text-[#0F172A] mb-4">Related Financial Calculators</h2>
      <RelatedTools :tool-slugs="currentTool.relatedToolSlugs" />
    </div>

    <!-- Disclaimer -->
    <DisclaimerNotice />
  </div>
</template>
