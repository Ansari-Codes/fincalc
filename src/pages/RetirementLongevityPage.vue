<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { updatePageSeo } from '@/utils/seo'
import { generateCalculatorSchema } from '@/utils/structuredData'
import { formatCurrency, formatPercent, copyToClipboard } from '@/utils/formatters'
import { calculateRetirementLongevity } from '@/calculations/retirementLongevity'
import Breadcrumbs from '@/components/ui/Breadcrumbs.vue'
import FAQAccordion from '@/components/ui/FAQAccordion.vue'
import RelatedTools from '@/components/ui/RelatedTools.vue'
import DisclaimerNotice from '@/components/ui/DisclaimerNotice.vue'
import { tools } from '@/data/tools'
import { 
  Clock, 
  RotateCcw, 
  Copy, 
  Check, 
  ArrowRight,
  AlertCircle,
  Sliders,
  ShieldCheck,
  AlertTriangle,
  Table as TableIcon
} from '@lucide/vue'

const currentTool = tools.find(t => t.slug === 'how-long-will-my-money-last')!

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
const showFullSchedule = ref(false)

const startingBalance = ref<number | null>(450000)
const plannedWithdrawal = ref<number | null>(2500)
const withdrawalFrequency = ref<'monthly' | 'annually'>('monthly')
const expectedAnnualReturn = ref<number | null>(5.5)
const expectedAnnualInflation = ref<number | null>(2.5)
const adjustWithdrawalsForInflation = ref(true)
const horizonYears = ref<number | null>(40)
const withdrawalTiming = ref<'beginning' | 'end'>('beginning')

function resetForm() {
  startingBalance.value = 450000
  plannedWithdrawal.value = 2500
  withdrawalFrequency.value = 'monthly'
  expectedAnnualReturn.value = 5.5
  expectedAnnualInflation.value = 2.5
  adjustWithdrawalsForInflation.value = true
  horizonYears.value = 40
  withdrawalTiming.value = 'beginning'
}

const result = computed(() => {
  return calculateRetirementLongevity({
    startingBalance: startingBalance.value || 0,
    plannedWithdrawal: plannedWithdrawal.value || 0,
    withdrawalFrequency: withdrawalFrequency.value,
    expectedAnnualReturn: expectedAnnualReturn.value || 0,
    expectedAnnualInflation: expectedAnnualInflation.value || 0,
    adjustWithdrawalsForInflation: adjustWithdrawalsForInflation.value,
    horizonYears: horizonYears.value || 40,
    withdrawalTiming: withdrawalTiming.value
  })
})

// Initial annual withdrawal rate (SWR metric)
const initialWithdrawalRate = computed(() => {
  if (!startingBalance.value || startingBalance.value <= 0) return 0
  const annualW = withdrawalFrequency.value === 'monthly' ? (plannedWithdrawal.value || 0) * 12 : (plannedWithdrawal.value || 0)
  return (annualW / startingBalance.value) * 100
})

// Visual preservation share
const preservationRatioPct = computed(() => {
  if (!startingBalance.value || startingBalance.value <= 0) return 0
  if (result.value.isDepleted) return 0
  return Math.min(100, (result.value.endingBalanceAtHorizon / startingBalance.value) * 100)
})

async function handleCopy() {
  const summary = [
    'Retirement Money Longevity Estimate',
    '-------------------------------------',
    `Starting Portfolio Balance: ${formatCurrency(startingBalance.value || 0, currency.value)}`,
    `Planned Withdrawal: ${formatCurrency(plannedWithdrawal.value || 0, currency.value)} (${withdrawalFrequency.value})`,
    `Initial Withdrawal Rate: ${formatPercent(initialWithdrawalRate.value)}`,
    `Assumed Annual Return: ${formatPercent(expectedAnnualReturn.value || 0)}`,
    `Assumed Annual Inflation: ${formatPercent(expectedAnnualInflation.value || 0)} (Adjusted: ${adjustWithdrawalsForInflation.value ? 'Yes' : 'No'})`,
    `Projection Horizon: ${horizonYears.value} Years`,
    `Outcome: ${result.value.message}`,
    `Total Estimated Withdrawals: ${formatCurrency(result.value.totalWithdrawn, currency.value)}`,
    `Total Portfolio Growth Generated: ${formatCurrency(result.value.totalGrowth, currency.value)}`,
    `Ending Balance at Year ${horizonYears.value}: ${formatCurrency(result.value.endingBalanceAtHorizon, currency.value)}`
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
      { name: 'Retirement', path: '/tools/retirement/' },
      { name: 'Retirement Money Longevity' }
    ]" />

    <!-- Tool Instrument Header -->
    <div class="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div>
        <div class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0F766E] bg-[#E7F4F1] px-3 py-1 rounded-full mb-2.5">
          <Clock class="w-3.5 h-3.5" />
          <span>Interactive Decumulation Instrument</span>
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
          <!-- 1. Starting Portfolio Nest Egg -->
          <div class="bg-[#F8FAFC] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] space-y-3">
            <div class="flex items-center justify-between">
              <label for="starting-balance" class="text-xs font-bold uppercase tracking-wider text-[#334155]">
                Starting Savings / Nest Egg
              </label>
              <div class="relative w-36">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#94A3B8]">$</span>
                <input
                  id="starting-balance"
                  v-model.number="startingBalance"
                  type="number"
                  min="0"
                  step="10000"
                  class="w-full pl-6 pr-2.5 py-1.5 text-right font-bold text-sm bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>
            </div>

            <input
              type="range"
              min="25000"
              max="2500000"
              step="25000"
              :value="startingBalance || 0"
              @input="startingBalance = Number(($event.target as HTMLInputElement).value)"
              class="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#0F766E]"
            />

            <div class="flex flex-wrap items-center gap-1.5 pt-1">
              <span class="text-[11px] font-semibold text-[#94A3B8] mr-1">Presets:</span>
              <button
                v-for="amt in [250000, 450000, 750000, 1000000, 1500000]"
                :key="amt"
                type="button"
                @click="startingBalance = amt"
                :class="startingBalance === amt ? 'bg-[#0F766E] text-white' : 'bg-white text-[#475569] hover:bg-[#E2E8F0]'"
                class="text-[11px] font-bold px-2.5 py-1 rounded-md border border-[#CBD5E1] transition-colors"
              >
                ${{ amt >= 1000000 ? (amt / 1000000) + 'M' : (amt / 1000) + 'k' }}
              </button>
            </div>
          </div>

          <!-- 2. Planned Living Withdrawal -->
          <div class="bg-[#F8FAFC] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] space-y-3">
            <div class="flex items-center justify-between">
              <label for="planned-withdrawal" class="text-xs font-bold uppercase tracking-wider text-[#334155]">
                Planned Withdrawal
              </label>
              <div class="flex items-center gap-2">
                <select
                  v-model="withdrawalFrequency"
                  aria-label="Withdrawal Frequency"
                  class="text-xs font-semibold bg-white border border-[#CBD5E1] rounded-lg px-2.5 py-1.5 text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                >
                  <option value="monthly">Monthly</option>
                  <option value="annually">Annually</option>
                </select>
                <div class="relative w-32">
                  <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#94A3B8]">$</span>
                  <input
                    id="planned-withdrawal"
                    v-model.number="plannedWithdrawal"
                    type="number"
                    min="0"
                    step="100"
                    class="w-full pl-6 pr-2.5 py-1.5 text-right font-bold text-sm bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  />
                </div>
              </div>
            </div>

            <input
              type="range"
              min="500"
              max="15000"
              step="100"
              :value="plannedWithdrawal || 0"
              @input="plannedWithdrawal = Number(($event.target as HTMLInputElement).value)"
              class="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#0F766E]"
            />

            <div class="flex flex-wrap items-center gap-1.5 pt-1">
              <span class="text-[11px] font-semibold text-[#94A3B8] mr-1">Withdrawals:</span>
              <button
                v-for="w in [1500, 2500, 3500, 5000, 7500]"
                :key="w"
                type="button"
                @click="plannedWithdrawal = w"
                :class="plannedWithdrawal === w ? 'bg-[#0F766E] text-white' : 'bg-white text-[#475569] hover:bg-[#E2E8F0]'"
                class="text-[11px] font-bold px-2.5 py-1 rounded-md border border-[#CBD5E1] transition-colors"
              >
                ${{ w }}/mo
              </button>
            </div>
          </div>

          <!-- 3. Return & Inflation Assumed -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0] space-y-3">
              <div class="flex items-center justify-between">
                <label for="annual-return" class="text-xs font-bold uppercase tracking-wider text-[#334155]">
                  Annual Return
                </label>
                <div class="relative w-24">
                  <input
                    id="annual-return"
                    v-model.number="expectedAnnualReturn"
                    type="number"
                    min="0"
                    max="20"
                    step="0.1"
                    class="w-full pl-2 pr-6 py-1 text-right font-bold text-xs bg-white border border-[#CBD5E1] rounded-lg"
                  />
                  <span class="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-[#94A3B8]">%</span>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="12"
                step="0.25"
                :value="expectedAnnualReturn || 0"
                @input="expectedAnnualReturn = Number(($event.target as HTMLInputElement).value)"
                class="w-full h-1.5 bg-[#E2E8F0] rounded appearance-none cursor-pointer accent-[#0F766E]"
              />
            </div>

            <div class="bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0] space-y-3">
              <div class="flex items-center justify-between">
                <label for="annual-inflation" class="text-xs font-bold uppercase tracking-wider text-[#334155]">
                  Inflation
                </label>
                <div class="relative w-24">
                  <input
                    id="annual-inflation"
                    v-model.number="expectedAnnualInflation"
                    type="number"
                    min="0"
                    max="15"
                    step="0.1"
                    class="w-full pl-2 pr-6 py-1 text-right font-bold text-xs bg-white border border-[#CBD5E1] rounded-lg"
                  />
                  <span class="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-[#94A3B8]">%</span>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="8"
                step="0.25"
                :value="expectedAnnualInflation || 0"
                @input="expectedAnnualInflation = Number(($event.target as HTMLInputElement).value)"
                class="w-full h-1.5 bg-[#E2E8F0] rounded appearance-none cursor-pointer accent-[#0F766E]"
              />
            </div>
          </div>

          <!-- 4. Advanced Mechanics (Horizon & Inflation Toggle) -->
          <div class="pt-4 border-t border-[#E2E8F0] space-y-3">
            <label class="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#334155]">
              <input
                v-model="adjustWithdrawalsForInflation"
                type="checkbox"
                class="w-4 h-4 rounded text-[#0F766E] focus:ring-[#0F766E]"
              />
              <span>Increase withdrawals annually for inflation (Maintain purchasing power)</span>
            </label>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label class="block text-xs font-bold text-[#334155] mb-1">
                  Projection Horizon (Years)
                </label>
                <input
                  v-model.number="horizonYears"
                  type="number"
                  min="5"
                  max="60"
                  class="w-full px-3 py-2 text-xs font-semibold bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F172A]"
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-[#334155] mb-1">
                  Withdrawal Timing
                </label>
                <select
                  v-model="withdrawalTiming"
                  class="w-full px-3 py-2 text-xs font-semibold bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F172A]"
                >
                  <option value="beginning">Beginning of period (Standard living)</option>
                  <option value="end">End of period</option>
                </select>
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
                <span :class="!result.isDepleted ? 'bg-emerald-400' : 'bg-amber-400'" class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"></span>
                <span :class="!result.isDepleted ? 'bg-emerald-400' : 'bg-amber-400'" class="relative inline-flex rounded-full h-2 w-2"></span>
              </span>
              <span class="text-[11px] font-bold uppercase tracking-widest text-emerald-200">
                {{ !result.isDepleted ? 'Sustained Decumulation' : 'Depletion Alert' }}
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
            <span class="text-xs font-semibold uppercase tracking-wider text-emerald-100">Portfolio Sustainability</span>
            <div class="text-3xl sm:text-4xl font-black text-white mt-1 num-tabular tracking-tight">
              {{ result.isDepleted ? `~${result.depletedYears} Years` : 'Sustained' }}
            </div>
            <div class="inline-flex items-center gap-1.5 text-xs text-emerald-200 mt-2 bg-black/20 px-2.5 py-1 rounded-full">
              <component :is="!result.isDepleted ? ShieldCheck : AlertTriangle" class="w-3.5 h-3.5 text-emerald-300" />
              <span>{{ result.message }}</span>
            </div>
          </div>

          <!-- Visual Preservation Meter Bar -->
          <div class="space-y-2 pt-2">
            <div class="flex items-center justify-between text-xs font-bold text-white/90">
              <span>Capital Preservation at Y{{ horizonYears }}</span>
              <span :class="!result.isDepleted ? 'text-emerald-300' : 'text-amber-300'">
                {{ !result.isDepleted ? `${preservationRatioPct.toFixed(0)}% Retained` : 'Depleted' }}
              </span>
            </div>

            <!-- Visual Bar -->
            <div class="h-3.5 w-full bg-black/20 rounded-full overflow-hidden flex p-0.5 border border-white/20">
              <div
                class="h-full rounded-full transition-all duration-300"
                :class="!result.isDepleted ? 'bg-emerald-300' : 'bg-amber-400'"
                :style="{ width: `${preservationRatioPct}%` }"
                title="Preserved Capital Ratio"
              ></div>
            </div>

            <div class="flex items-center justify-between text-[11px] font-semibold text-white/80 pt-0.5">
              <span>Ending: {{ formatCurrency(result.endingBalanceAtHorizon, currency) }}</span>
              <span>Initial SWR: {{ formatPercent(initialWithdrawalRate) }}/yr</span>
            </div>
          </div>

          <!-- Secondary Metric 2x2 Grid -->
          <div class="grid grid-cols-2 gap-3 pt-2">
            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <span class="text-[11px] font-semibold text-white/70 block">Total Living Withdrawals</span>
              <span class="text-sm sm:text-base font-bold text-white num-tabular mt-0.5 block">
                {{ formatCurrency(result.totalWithdrawn, currency) }}
              </span>
            </div>

            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <span class="text-[11px] font-semibold text-emerald-200 block">Growth Generated</span>
              <span class="text-sm sm:text-base font-extrabold text-emerald-300 num-tabular mt-0.5 block">
                +{{ formatCurrency(result.totalGrowth, currency) }}
              </span>
            </div>

            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <span class="text-[11px] font-semibold text-white/70 block">Ending Nest Egg</span>
              <span class="text-sm sm:text-base font-bold text-white num-tabular mt-0.5 block">
                {{ formatCurrency(result.endingBalanceAtHorizon, currency) }}
              </span>
            </div>

            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <span class="text-[11px] font-semibold text-white/70 block">Initial SWR Rate</span>
              <span class="text-sm sm:text-base font-bold text-white num-tabular mt-0.5 block">
                {{ formatPercent(initialWithdrawalRate) }}
              </span>
            </div>
          </div>

          <div class="pt-2">
            <DisclaimerNotice custom-text="Simulations use constant returns. In reality, market sequences and volatile drawdowns impact longevity." />
          </div>
        </div>
      </div>
    </div>

    <!-- Visual Scenario Chart & Table Instrument -->
    <div class="mb-16 bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <div class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0F766E] mb-1">
            <Clock class="w-3.5 h-3.5" />
            <span>Decumulation Trajectory</span>
          </div>
          <h2 class="text-xl font-extrabold text-[#0F172A]">Portfolio Balance Over Time</h2>
          <p class="text-xs text-[#64748B]">Observe the annual balance progression across {{ horizonYears }} years of retirement living.</p>
        </div>

        <button
          type="button"
          @click="showFullSchedule = !showFullSchedule"
          class="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#334155] hover:bg-[#E2E8F0] transition-colors"
        >
          <TableIcon class="w-3.5 h-3.5" />
          <span>{{ showFullSchedule ? 'Collapse Table' : 'Expand Full Schedule' }}</span>
        </button>
      </div>

      <!-- Accessible SVG Trajectory Chart -->
      <div 
        role="img"
        :aria-label="`Retirement balance trajectory chart over ${horizonYears} years.`"
        class="w-full h-52 sm:h-64 mb-8 relative border-b border-l border-[#CBD5E1] flex items-end justify-between px-2 pt-6"
      >
        <span class="sr-only">Retirement portfolio balance trajectory across {{ horizonYears }} years. Outcome: {{ result.message }}.</span>
        <div
          v-for="item in result.yearlyBreakdown.filter((_, i) => result.yearlyBreakdown.length <= 15 || i % Math.ceil(result.yearlyBreakdown.length / 15) === 0 || i === result.yearlyBreakdown.length - 1)"
          :key="item.year"
          class="flex-1 max-w-[42px] flex flex-col items-center justify-end h-full group relative"
        >
          <!-- Tooltip on hover -->
          <div class="absolute -top-14 hidden group-hover:block bg-[#0F172A] text-white text-[11px] py-1 px-2.5 rounded-lg shadow-lg whitespace-nowrap z-20 num-tabular border border-slate-700">
            Year {{ item.year }}: {{ formatCurrency(item.endingBalance, currency) }}
          </div>

          <!-- Bar -->
          <div class="w-3.5 sm:w-6 flex flex-col justify-end h-full rounded-t-md overflow-hidden bg-slate-100">
            <div
              class="w-full transition-all"
              :class="item.endingBalance > 0 ? 'bg-[#0F766E]' : 'bg-rose-400'"
              :style="{ height: `${startingBalance && startingBalance > 0 ? Math.min(100, (item.endingBalance / startingBalance) * 100) : 0}%` }"
            ></div>
          </div>
          <span class="text-[10px] font-bold text-[#64748B] mt-2 num-tabular">Y{{ item.year }}</span>
        </div>
      </div>

      <!-- Year-by-Year Table (Collapsible) -->
      <div v-show="showFullSchedule" class="overflow-x-auto border border-[#E2E8F0] rounded-2xl">
        <table class="w-full text-left text-xs sm:text-sm">
          <thead class="bg-[#F8FAFC] text-[#475569] font-bold border-b border-[#E2E8F0]">
            <tr>
              <th class="py-3 px-4">Year</th>
              <th class="py-3 px-4">Starting Balance</th>
              <th class="py-3 px-4">Annual Withdrawals</th>
              <th class="py-3 px-4">Investment Growth</th>
              <th class="py-3 px-4">Ending Balance</th>
              <th class="py-3 px-4">Cumulative Withdrawn</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#E2E8F0]">
            <tr v-for="item in result.yearlyBreakdown" :key="item.year" class="hover:bg-[#F8FAFC]/60 transition-colors">
              <td class="py-2.5 px-4 font-bold text-[#0F172A]">Year {{ item.year }}</td>
              <td class="py-2.5 px-4 num-tabular text-[#64748B]">{{ formatCurrency(item.startingBalance, currency) }}</td>
              <td class="py-2.5 px-4 num-tabular text-rose-600 font-bold">-{{ formatCurrency(item.withdrawals, currency) }}</td>
              <td class="py-2.5 px-4 num-tabular text-[#0F766E] font-medium">+{{ formatCurrency(item.investmentGrowth, currency) }}</td>
              <td class="py-2.5 px-4 num-tabular font-extrabold" :class="item.endingBalance > 0 ? 'text-[#0F172A]' : 'text-rose-600'">
                {{ formatCurrency(item.endingBalance, currency) }}
              </td>
              <td class="py-2.5 px-4 num-tabular text-[#64748B]">{{ formatCurrency(item.totalWithdrawnSoFar, currency) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Explanatory & Guides -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
      <div class="lg:col-span-8 space-y-8">
        <section class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
          <h2 class="text-xl font-extrabold text-[#0F172A] mb-3">How Retirement Longevity is Modeled</h2>
          <p class="text-sm text-[#64748B] leading-relaxed mb-4">
            The calculator projects portfolio sustainability month by month. At the start of each month, your scheduled living withdrawal is deducted from principal. The remaining balance earns a monthly effective compounding return.
          </p>
          <div class="bg-[#F8FAFC] border border-[#CBD5E1] p-4 rounded-xl num-tabular text-xs sm:text-sm text-[#0F172A] mb-4 font-mono">
            {{ currentTool.formula }}
          </div>
          <p class="text-sm text-[#64748B] leading-relaxed">
            When inflation adjustment is active, annual withdrawal amounts increase at the start of each year by the assumed inflation rate to preserve real purchasing power.
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
          <h3 class="text-base font-bold text-[#0F172A] mb-2">Sequence-of-Returns Risk</h3>
          <p class="text-xs text-[#64748B] leading-relaxed mb-4">
            Learn why early bear markets pose higher risks than late ones and how cash buffers help protect retirees.
          </p>
          <RouterLink
            to="/learn/how-long-will-retirement-savings-last/"
            class="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F766E] hover:underline"
          >
            <span>Read Retirement Longevity Guide</span>
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
