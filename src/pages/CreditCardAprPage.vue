<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { updatePageSeo } from '@/utils/seo'
import { generateCalculatorSchema } from '@/utils/structuredData'
import { formatCurrency, formatPercent, copyToClipboard } from '@/utils/formatters'
import {
  calculateCreditCardApr,
  formatPayoffDate,
  getMinimumPaymentComparisonScenarios,
  getScenarioAMinimumAnalysis,
  getWorkedExampleScenarios
} from '@/calculations/creditCardApr'
import Breadcrumbs from '@/components/ui/Breadcrumbs.vue'
import FAQAccordion from '@/components/ui/FAQAccordion.vue'
import RelatedTools from '@/components/ui/RelatedTools.vue'
import DisclaimerNotice from '@/components/ui/DisclaimerNotice.vue'
import { tools } from '@/data/tools'
import { 
  CreditCard, 
  RotateCcw, 
  Copy, 
  Check, 
  AlertTriangle, 
  ArrowRight,
  AlertCircle,
  Sliders,
  Table as TableIcon
} from '@lucide/vue'

const currentTool = tools.find(t => t.slug === 'credit-card-apr-calculator')!

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

const balance = ref<number | null>(4500)
const apr = ref<number | null>(22.9)
const monthlyPayment = ref<number | null>(200)
const additionalPayment = ref<number | null>(0)
const plannedNewPurchases = ref<number | null>(0)
const payMinimumOnly = ref(false)

function resetForm() {
  balance.value = 4500
  apr.value = 22.9
  monthlyPayment.value = 200
  additionalPayment.value = 0
  plannedNewPurchases.value = 0
  payMinimumOnly.value = false
}

const result = computed(() => {
  return calculateCreditCardApr({
    balance: balance.value || 0,
    apr: apr.value || 0,
    monthlyPayment: monthlyPayment.value || 0,
    additionalPayment: additionalPayment.value || 0,
    plannedNewPurchases: plannedNewPurchases.value || 0,
    payMinimumOnly: payMinimumOnly.value
  })
})

// Payoff date, computed live from the payoff months — never hard-coded.
const payoffDateFormatted = computed(() => {
  if (!result.value.isPayingOff || !isFinite(result.value.payoffMonths)) return ''
  return formatPayoffDate(result.value.payoffMonths)
})

// Page tables are generated from the calculator engine — never hand-typed.
const workedExamples = computed(() => getWorkedExampleScenarios())
const comparisonScenarios = computed(() => getMinimumPaymentComparisonScenarios())
const scenarioA = computed(() => getScenarioAMinimumAnalysis())
const scenarioAMonth = (month: number) => scenarioA.value.schedule[month - 1]
// Fixed-payment references used by the Scenario A/B comparison copy.
const scenarioAFixed250 = computed(() =>
  calculateCreditCardApr({ balance: 5000, apr: 24, monthlyPayment: 250 })
)
const scenarioAFixed150 = computed(() =>
  calculateCreditCardApr({ balance: 5000, apr: 24, monthlyPayment: 150 })
)
const scenarioBSaving = computed(
  () => scenarioA.value.totalInterestPaid - scenarioAFixed250.value.totalInterestPaid
)
const scenarioBYearsSooner = computed(
  () => (scenarioA.value.payoffMonths - scenarioAFixed250.value.payoffMonths) / 12
)
const scenarioAFixed150Saving = computed(
  () => scenarioA.value.totalInterestPaid - scenarioAFixed150.value.totalInterestPaid
)

// Visual breakdown shares of first month payment
const firstMonthPrincipalPct = computed(() => {
  const total = result.value.firstMonthPrincipal + result.value.firstMonthInterest
  if (total <= 0) return 50
  return Math.min(100, Math.max(0, (result.value.firstMonthPrincipal / total) * 100))
})

const firstMonthInterestPct = computed(() => {
  const total = result.value.firstMonthPrincipal + result.value.firstMonthInterest
  if (total <= 0) return 50
  return Math.min(100, Math.max(0, (result.value.firstMonthInterest / total) * 100))
})

async function handleCopy() {
  const summary = [
    'Credit Card APR & Payoff Instrument Summary',
    '-------------------------------------------',
    `Current Balance: ${formatCurrency(balance.value || 0, currency.value)}`,
    `APR: ${formatPercent(apr.value || 0)}`,
    `Total Monthly Payment: ${formatCurrency(result.value.totalMonthlyPayment, currency.value)}`,
    `Estimated First Month Interest: ${formatCurrency(result.value.firstMonthInterest, currency.value)}`,
    `First Month Principal Reduction: ${formatCurrency(result.value.firstMonthPrincipal, currency.value)}`,
    result.value.isPayingOff ? `Payoff Timeline: ${result.value.payoffMonths} months (~${result.value.payoffYears} years)` : 'Payoff: Payment insufficient to cover interest',
    payoffDateFormatted.value ? `Paid Off Around: ${payoffDateFormatted.value}` : '',
    `Daily Interest Cost: ${formatCurrency(result.value.dailyInterestCost, currency.value)} per day`,
    payMinimumOnly.value ? 'Payment Mode: Pay minimum only (3% of balance or $25 floor)' : '',
    result.value.isPayingOff ? `Total Lifetime Interest Cost: ${formatCurrency(result.value.totalInterestPaid, currency.value)}` : '',
    result.value.isPayingOff ? `Total Out-of-Pocket Repayment: ${formatCurrency(result.value.totalAmountPaid, currency.value)}` : ''
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
      { name: 'Credit & Debt', path: '/tools/credit-debt/' },
      { name: 'Credit Card APR Calculator' }
    ]" />

    <!-- Tool Instrument Header -->
    <div class="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div>
        <div class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0F766E] bg-[#E7F4F1] px-3 py-1 rounded-full mb-2.5">
          <CreditCard class="w-3.5 h-3.5" />
          <span>Interactive Revolving Debt Instrument</span>
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

    <!-- Table of Contents -->
    <nav aria-label="On this page" class="mb-8 bg-white rounded-2xl border border-[#E2E8F0] px-5 py-4 shadow-sm">
      <span class="text-xs font-bold uppercase tracking-wider text-[#475569] block mb-2">On this page</span>
      <ul class="flex flex-wrap gap-x-5 gap-y-1.5 text-xs font-semibold">
        <li><a href="#calculator" class="text-[#0F766E] hover:underline">Calculator</a></li>
        <li><a href="#amortization" class="text-[#0F766E] hover:underline">Monthly Amortization</a></li>
        <li><a href="#how-to-calculate" class="text-[#0F766E] hover:underline">How to calculate credit card interest</a></li>
        <li><a href="#minimum-payment" class="text-[#0F766E] hover:underline">Paying only the minimum</a></li>
        <li><a href="#worked-examples" class="text-[#0F766E] hover:underline">Worked examples</a></li>
        <li><a href="#faq" class="text-[#0F766E] hover:underline">FAQ</a></li>
      </ul>
    </nav>

    <!-- Validation Warning Banner -->
    <div v-if="!result.isValid && result.validationErrors.length > 0" class="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5 shadow-2xs">
      <div v-for="(err, i) in result.validationErrors" :key="i" class="flex items-center gap-2">
        <AlertCircle class="w-4 h-4 text-amber-600 shrink-0" />
        <span class="font-medium">{{ err }}</span>
      </div>
    </div>

    <!-- Main Instrument Console Grid -->
    <div id="calculator" class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12 scroll-mt-24">
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
          <!-- 1. Current Card Balance -->
          <div class="bg-[#F8FAFC] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] space-y-3">
            <div class="flex items-center justify-between">
              <label for="card-balance" class="text-xs font-bold uppercase tracking-wider text-[#334155]">
                Current Card Balance
              </label>
              <div class="relative w-36">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#94A3B8]">$</span>
                <input
                  id="card-balance"
                  v-model.number="balance"
                  type="number"
                  min="0"
                  step="100"
                  class="w-full pl-6 pr-2.5 py-1.5 text-right font-bold text-sm bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>
            </div>

            <!-- Tactile Range Slider -->
            <input
              type="range"
              min="100"
              max="25000"
              step="100"
              :value="balance || 0"
              @input="balance = Number(($event.target as HTMLInputElement).value)"
              class="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#0F766E]"
            />

            <!-- Presets -->
            <div class="flex flex-wrap items-center gap-1.5 pt-1">
              <span class="text-[11px] font-semibold text-[#94A3B8] mr-1">Presets:</span>
              <button
                v-for="amt in [1000, 2500, 4500, 7500, 12000]"
                :key="amt"
                type="button"
                @click="balance = amt"
                :class="balance === amt ? 'bg-[#0F766E] text-white' : 'bg-white text-[#475569] hover:bg-[#E2E8F0]'"
                class="text-[11px] font-bold px-2.5 py-1 rounded-md border border-[#CBD5E1] transition-colors"
              >
                ${{ (amt / 1000).toFixed(amt % 1000 === 0 ? 0 : 1) }}k
              </button>
            </div>
          </div>

          <!-- 2. Annual Percentage Rate (APR) -->
          <div class="bg-[#F8FAFC] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] space-y-3">
            <div class="flex items-center justify-between">
              <label for="card-apr" class="text-xs font-bold uppercase tracking-wider text-[#334155]">
                Annual Percentage Rate (APR)
              </label>
              <div class="relative w-28">
                <input
                  id="card-apr"
                  v-model.number="apr"
                  type="number"
                  min="0"
                  max="45"
                  step="0.1"
                  class="w-full pl-2.5 pr-6 py-1.5 text-right font-bold text-sm bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
                <span class="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#94A3B8]">%</span>
              </div>
            </div>

            <!-- Tactile Range Slider -->
            <input
              type="range"
              min="0"
              max="36"
              step="0.25"
              :value="apr || 0"
              @input="apr = Number(($event.target as HTMLInputElement).value)"
              class="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#0F766E]"
            />

            <!-- Presets -->
            <div class="flex flex-wrap items-center gap-1.5 pt-1">
              <span class="text-[11px] font-semibold text-[#94A3B8] mr-1">Tiers:</span>
              <button
                v-for="rate in [14.9, 18.9, 22.9, 27.9, 29.9]"
                :key="rate"
                type="button"
                @click="apr = rate"
                :class="apr === rate ? 'bg-[#0F766E] text-white' : 'bg-white text-[#475569] hover:bg-[#E2E8F0]'"
                class="text-[11px] font-bold px-2.5 py-1 rounded-md border border-[#CBD5E1] transition-colors"
              >
                {{ rate }}%
              </button>
            </div>
          </div>

          <!-- 3. Planned Monthly Payment -->
          <div class="bg-[#F8FAFC] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <label for="monthly-payment" class="text-xs font-bold uppercase tracking-wider text-[#334155] block">
                  Monthly Payment Amount
                </label>
                <span class="text-[11px] text-[#64748B]">Planned total monthly payment toward this card</span>
              </div>
              <div class="relative w-36 shrink-0">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#94A3B8]">$</span>
                <input
                  id="monthly-payment"
                  v-model.number="monthlyPayment"
                  :disabled="payMinimumOnly"
                  type="number"
                  min="0"
                  step="25"
                  class="w-full pl-6 pr-2.5 py-1.5 text-right font-bold text-sm bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>
            </div>

            <!-- Tactile Range Slider -->
            <input
              type="range"
              min="25"
              max="1500"
              step="25"
              :disabled="payMinimumOnly"
              :value="monthlyPayment || 0"
              @input="monthlyPayment = Number(($event.target as HTMLInputElement).value)"
              class="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#0F766E]"
            />

            <!-- Presets -->
            <div class="flex flex-wrap items-center gap-1.5 pt-1">
              <span class="text-[11px] font-semibold text-[#94A3B8] mr-1">Presets:</span>
              <button
                v-for="amt in [100, 200, 350, 500, 800]"
                :key="amt"
                type="button"
                @click="monthlyPayment = amt"
                :disabled="payMinimumOnly"
                :class="monthlyPayment === amt ? 'bg-[#0F766E] text-white' : 'bg-white text-[#475569] hover:bg-[#E2E8F0]'"
                class="text-[11px] font-bold px-2.5 py-1 rounded-md border border-[#CBD5E1] transition-colors"
              >
                ${{ amt }}
              </button>
            </div>
          </div>

          <!-- Pay minimum only toggle -->
          <div class="bg-[#F8FAFC] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0]">
            <label class="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                v-model="payMinimumOnly"
                class="mt-0.5 h-4 w-4 shrink-0 accent-[#0F766E]"
              />
              <span>
                <span class="text-xs font-bold uppercase tracking-wider text-[#334155] block">Pay minimum only</span>
                <span class="text-[11px] text-[#64748B] leading-relaxed block mt-0.5">
                  Each month's payment is the card minimum: 3% of the balance or $25, whichever is greater.
                  Fixed and extra payments are paused while this is on.
                </span>
              </span>
            </label>
          </div>

          <!-- 4. Optional Extra Payment & New Purchases -->
          <div class="pt-4 border-t border-[#E2E8F0] grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0] space-y-2">
              <div class="flex items-center justify-between">
                <div>
                  <label for="extra-payment" class="text-xs font-bold text-[#334155] block">
                    Extra Payment / Mo.
                  </label>
                  <span class="text-[10px] text-[#64748B]">Optional principal addition</span>
                </div>
                <div class="relative w-24 shrink-0">
                  <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#94A3B8]">$</span>
                  <input
                    id="extra-payment"
                    v-model.number="additionalPayment"
                    :disabled="payMinimumOnly"
                    type="number"
                    min="0"
                    step="25"
                    class="w-full pl-5 pr-2 py-1 text-right text-xs font-bold bg-white border border-[#CBD5E1] rounded-lg"
                  />
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="500"
                step="25"
                :disabled="payMinimumOnly"
                :value="additionalPayment || 0"
                @input="additionalPayment = Number(($event.target as HTMLInputElement).value)"
                class="w-full h-1.5 bg-[#E2E8F0] rounded appearance-none cursor-pointer accent-[#0F766E]"
              />
            </div>

            <div class="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0] space-y-2">
              <div class="flex items-center justify-between">
                <div>
                  <label for="new-charges" class="text-xs font-bold text-[#334155] block">
                    New Charges / Mo.
                  </label>
                  <span class="text-[10px] text-[#64748B]">Monthly spending added</span>
                </div>
                <div class="relative w-24 shrink-0">
                  <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#94A3B8]">$</span>
                  <input
                    id="new-charges"
                    v-model.number="plannedNewPurchases"
                    type="number"
                    min="0"
                    step="25"
                    class="w-full pl-5 pr-2 py-1 text-right text-xs font-bold bg-white border border-[#CBD5E1] rounded-lg"
                  />
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="1000"
                step="25"
                :value="plannedNewPurchases || 0"
                @input="plannedNewPurchases = Number(($event.target as HTMLInputElement).value)"
                class="w-full h-1.5 bg-[#E2E8F0] rounded appearance-none cursor-pointer accent-[#0F766E]"
              />
            </div>
          </div>

          <!-- Trust & Privacy Disclosure -->
          <div class="pt-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#64748B]">
            <div class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
              <span>Your calculator values are processed in your browser and are not sent to kitaaab.org servers.</span>
            </div>
            <RouterLink to="/privacy/" class="text-[#0F766E] hover:underline font-semibold shrink-0">Privacy Disclosures</RouterLink>
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
                <span :class="result.isPayingOff ? 'bg-emerald-400' : 'bg-rose-400'" class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"></span>
                <span :class="result.isPayingOff ? 'bg-emerald-400' : 'bg-rose-400'" class="relative inline-flex rounded-full h-2 w-2"></span>
              </span>
              <span class="text-[11px] font-bold uppercase tracking-widest text-emerald-200">
                {{ result.isPayingOff ? 'Amortization Telemetry' : 'Payment Alert' }}
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

          <!-- Payment Insufficient Warning if applicable -->
          <div v-if="!result.isPayingOff" class="bg-rose-500/20 border border-rose-300/40 rounded-2xl p-5 text-rose-100 space-y-2">
            <div class="flex items-start gap-3">
              <AlertTriangle class="w-5 h-5 text-rose-300 shrink-0 mt-0.5" />
              <div class="text-xs leading-relaxed">
                <span class="font-extrabold text-white block mb-0.5">Payment Too Low:</span>
                {{ result.warningMessage }}
              </div>
            </div>
            <div class="p-2.5 bg-black/20 rounded-xl text-[11px] text-rose-200">
              Your estimated first month finance charge is <strong>{{ formatCurrency(result.firstMonthInterest, currency) }}</strong>. To make progress against your balance, your monthly payment must exceed this interest amount.
            </div>
          </div>

          <!-- Hero Metric Callout -->
          <div v-else class="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 text-center">
            <span class="text-xs font-semibold uppercase tracking-wider text-emerald-100">Estimated Payoff Timeline</span>
            <div class="text-3xl sm:text-4xl font-black text-white mt-1 num-tabular tracking-tight">
              {{ result.payoffMonths }} Months
            </div>
            <div class="inline-flex items-center gap-1.5 text-xs text-emerald-200 mt-2 bg-black/20 px-2.5 py-1 rounded-full">
              <span>Approx. {{ result.payoffYears }} Years</span>
              <span>•</span>
              <span>{{ formatCurrency(result.totalMonthlyPayment, currency) }}/mo</span>
            </div>
            <div v-if="payoffDateFormatted" class="text-xs text-emerald-100 mt-2">
              Paid off around <strong class="text-white">{{ payoffDateFormatted }}</strong>
              <span v-if="payMinimumOnly"> (paying minimums only)</span>
            </div>
            <div class="mt-3 pt-3 border-t border-white/10 text-xs text-emerald-100 text-left leading-relaxed">
              At <strong>{{ formatCurrency(result.totalMonthlyPayment, currency) }}/month</strong>, you will pay <strong>{{ formatCurrency(result.totalInterestPaid, currency) }}</strong> in total interest charges across <strong>{{ result.payoffMonths }} months</strong> to clear your {{ formatCurrency(balance || 0, currency) }} balance.
            </div>
          </div>

          <!-- First Month Payment Breakdown Visual Bar -->
          <div class="space-y-2 pt-2">
            <div class="flex items-center justify-between text-xs font-bold text-white/90">
              <span>First Month Payment Breakdown</span>
              <span :class="firstMonthPrincipalPct >= 50 ? 'text-emerald-300' : 'text-amber-300'">
                {{ firstMonthPrincipalPct.toFixed(0) }}% to Principal
              </span>
            </div>

            <!-- Proportional 2-Segment Bar -->
            <div class="h-3.5 w-full bg-black/20 rounded-full overflow-hidden flex p-0.5 border border-white/20">
              <div
                class="bg-emerald-400 h-full rounded-l-full transition-all duration-300"
                :style="{ width: `${firstMonthPrincipalPct}%` }"
                title="Principal Reduction"
              ></div>
              <div
                class="bg-rose-400 h-full rounded-r-full transition-all duration-300"
                :style="{ width: `${firstMonthInterestPct}%` }"
                title="Finance Interest Charge"
              ></div>
            </div>

            <!-- Legend with Percentages -->
            <div class="flex items-center justify-between text-[11px] font-semibold text-white/80 pt-0.5">
              <div class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-sm bg-emerald-400 shrink-0"></span>
                <span>Principal Reduction ({{ formatCurrency(result.firstMonthPrincipal, currency) }})</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-sm bg-rose-400 shrink-0"></span>
                <span>Interest Fee ({{ formatCurrency(result.firstMonthInterest, currency) }})</span>
              </div>
            </div>
          </div>

          <!-- Secondary Metric 2x2 Grid -->
          <div class="grid grid-cols-2 gap-3 pt-2">
            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <span class="text-[11px] font-semibold text-rose-200 block">Total Lifetime Interest</span>
              <span class="text-sm sm:text-base font-extrabold text-rose-300 num-tabular mt-0.5 block">
                {{ result.isPayingOff ? formatCurrency(result.totalInterestPaid, currency) : 'N/A' }}
              </span>
            </div>

            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <span class="text-[11px] font-semibold text-white/70 block">Total Out-of-Pocket</span>
              <span class="text-sm sm:text-base font-bold text-white num-tabular mt-0.5 block">
                {{ result.isPayingOff ? formatCurrency(result.totalAmountPaid, currency) : 'N/A' }}
              </span>
            </div>

            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <span class="text-[11px] font-semibold text-white/70 block">Monthly Rate (APR/12)</span>
              <span class="text-sm sm:text-base font-bold text-white num-tabular mt-0.5 block">
                {{ ((apr || 0) / 12).toFixed(3) }}%
              </span>
            </div>

            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <span class="text-[11px] font-semibold text-white/70 block">{{ payMinimumOnly ? 'First Minimum Payment' : 'Total Payment / Mo' }}</span>
              <span class="text-sm sm:text-base font-bold text-white num-tabular mt-0.5 block">
                {{ formatCurrency(result.totalMonthlyPayment, currency) }}
              </span>
            </div>

            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <span class="text-[11px] font-semibold text-white/70 block">Daily interest cost</span>
              <span class="text-sm sm:text-base font-bold text-white num-tabular mt-0.5 block">
                {{ result.isPayingOff || result.firstMonthInterest > 0 ? formatCurrency(result.dailyInterestCost, currency) + ' per day' : 'N/A' }}
              </span>
            </div>

            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <span class="text-[11px] font-semibold text-white/70 block">Paid off around</span>
              <span class="text-sm sm:text-base font-bold text-white num-tabular mt-0.5 block">
                {{ payoffDateFormatted || 'N/A' }}
              </span>
            </div>
          </div>

          <div class="pt-2">
            <DisclaimerNotice custom-text="Estimates use a monthly APR/12 model. Real card issuers assess interest daily based on average daily balances." />
          </div>
        </div>
      </div>
    </div>

    <!-- Amortization Schedule Preview Table Instrument -->
    <div id="amortization" v-if="result.schedulePreview.length > 0" class="mb-16 bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm scroll-mt-24">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <div class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0F766E] mb-1">
            <TableIcon class="w-3.5 h-3.5" />
            <span>Payoff Trajectory</span>
          </div>
          <h2 class="text-xl font-extrabold text-[#0F172A]">Monthly Amortization Progression</h2>
          <p class="text-xs text-[#64748B]">See how interest fees shrink every month as the revolving balance is repaid.</p>
        </div>

        <button
          type="button"
          @click="showFullSchedule = !showFullSchedule"
          class="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#334155] hover:bg-[#E2E8F0] transition-colors"
        >
          <span>{{ showFullSchedule ? 'Show First 12 Months' : 'Expand All Months' }}</span>
        </button>
      </div>

      <div class="overflow-x-auto border border-[#E2E8F0] rounded-2xl">
        <table class="w-full text-left text-xs sm:text-sm">
          <thead class="bg-[#F8FAFC] text-[#475569] font-bold border-b border-[#E2E8F0]">
            <tr>
              <th class="py-3 px-4">Period</th>
              <th class="py-3 px-4">Starting Balance</th>
              <th class="py-3 px-4">Interest Charged</th>
              <th class="py-3 px-4">Payment</th>
              <th class="py-3 px-4">Ending Balance</th>
              <th class="py-3 px-4">Cumulative Interest</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#E2E8F0]">
            <tr
              v-for="item in (showFullSchedule ? result.schedulePreview : result.schedulePreview.slice(0, 12))"
              :key="item.month"
              class="hover:bg-[#F8FAFC]/60 transition-colors"
            >
              <td class="py-2.5 px-4 font-bold text-[#0F172A]">Month {{ item.month }}</td>
              <td class="py-2.5 px-4 num-tabular text-[#64748B]">{{ formatCurrency(item.startBalance, currency) }}</td>
              <td class="py-2.5 px-4 num-tabular text-rose-600 font-bold">+{{ formatCurrency(item.interestCharged, currency) }}</td>
              <td class="py-2.5 px-4 num-tabular text-[#0F766E] font-medium">{{ formatCurrency(item.payment, currency) }}</td>
              <td class="py-2.5 px-4 num-tabular text-[#0F172A] font-extrabold">{{ formatCurrency(item.endBalance, currency) }}</td>
              <td class="py-2.5 px-4 num-tabular text-[#64748B]">{{ formatCurrency(item.totalInterestSoFar, currency) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Explanatory & Guides -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
      <div class="lg:col-span-8 space-y-8">
        <!-- Section 1: How to Calculate APR on a Credit Card (Comprehensive Educational Guide) -->
        <section id="how-to-calculate" class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm scroll-mt-24">
          <div class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0F766E] bg-[#E7F4F1] px-3 py-1 rounded-full mb-3">
            <span>Step-by-Step Educational Guide</span>
          </div>
          <h2 class="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight mb-3">
            How to Calculate APR on a Credit Card: Formulas, Steps &amp; Worked Example
          </h2>
          <p class="text-sm text-[#64748B] leading-relaxed mb-4">
            If you carry an unpaid balance on your credit card past the monthly statement due date, card issuers charge interest based on your stated Annual Percentage Rate (APR). While APR represents an annualized borrowing rate, finance charges are assessed on each monthly billing cycle. To calculate how your APR converts into monthly interest charges and payment reductions, follow this standard 4-step framework:
          </p>

          <!-- 4-Step Process Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div class="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-full bg-[#0F766E] text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
                <h3 class="text-xs font-bold uppercase tracking-wider text-[#0F172A]">Find Stated APR &amp; Carried Balance</h3>
              </div>
              <p class="text-xs text-[#64748B] leading-relaxed">
                Locate your current purchase APR (e.g. 24.0%) and revolving balance on your latest statement under the "Interest Charge Calculation" table.
              </p>
            </div>

            <div class="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-full bg-[#0F766E] text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
                <h3 class="text-xs font-bold uppercase tracking-wider text-[#0F172A]">Convert APR to Periodic Rate</h3>
              </div>
              <p class="text-xs text-[#64748B] leading-relaxed">
                Divide your annual APR by 12 to find your monthly periodic rate (<span class="font-mono text-[#0F766E]">APR ÷ 12</span>), or by 365 days for the Daily Periodic Rate (<span class="font-mono text-[#0F766E]">DPR</span>).
              </p>
            </div>

            <div class="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-full bg-[#0F766E] text-white text-xs font-bold flex items-center justify-center shrink-0">3</span>
                <h3 class="text-xs font-bold uppercase tracking-wider text-[#0F172A]">Estimate Monthly Interest</h3>
              </div>
              <p class="text-xs text-[#64748B] leading-relaxed">
                Multiply your carried balance by the monthly periodic rate to estimate the finance charge assessed for that billing cycle.
              </p>
            </div>

            <div class="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-full bg-[#0F766E] text-white text-xs font-bold flex items-center justify-center shrink-0">4</span>
                <h3 class="text-xs font-bold uppercase tracking-wider text-[#0F172A]">Determine Principal Paid</h3>
              </div>
              <p class="text-xs text-[#64748B] leading-relaxed">
                Subtract the monthly interest from your payment amount. The remaining portion pays down principal, shrinking next month's debt.
              </p>
            </div>
          </div>

          <!-- Formula Callout Box -->
          <div class="bg-[#F8FAFC] border border-[#CBD5E1] p-5 rounded-2xl num-tabular text-xs sm:text-sm text-[#0F172A] mb-6 font-mono whitespace-pre-line leading-relaxed">
1. Monthly Periodic Rate Approximation:
   Monthly Rate = APR ÷ 12 ÷ 100

2. Estimated Monthly Finance Charge:
   Monthly Interest = Current Carried Balance × Monthly Periodic Rate

3. Monthly Principal Reduction:
   Principal Repaid = Total Monthly Payment − Monthly Interest

4. Ending Carried Balance:
   Ending Balance = Starting Balance − Principal Repaid + New Purchases

5. Consumer Banking Daily Periodic Rate (DPR):
   DPR = APR ÷ 365 (or 360 per Cardholder Agreement)
          </div>

          <!-- Worked Numerical Example Card -->
          <div class="p-5 sm:p-6 rounded-2xl bg-teal-50/60 border border-teal-200 mb-6">
            <h3 class="text-sm font-bold uppercase tracking-wider text-[#0F766E] mb-2 flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-[#0F766E]"></span>
              <span>Independently Verifiable Worked Example: $4,000 Balance at 24.0% APR</span>
            </h3>
            <p class="text-xs text-[#0F766E] mb-4 leading-relaxed">
              Suppose a borrower carries an initial balance of <strong>$4,000.00</strong> at a <strong>24.0% APR</strong> and makes a constant monthly payment of <strong>$200.00</strong> with no new charges:
            </p>
            <div class="space-y-2 text-xs sm:text-sm text-[#0F172A]">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-teal-200/80">
                <span class="text-[#64748B]">Step 1: Monthly Periodic Rate</span>
                <span class="font-mono font-bold">24.0% ÷ 12 = 2.0% per month (0.02)</span>
              </div>
              <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-teal-200/80">
                <span class="text-[#64748B]">Step 2: Month 1 Interest Fee</span>
                <span class="font-mono font-bold">$4,000.00 × 0.02 = $80.00 interest</span>
              </div>
              <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-teal-200/80">
                <span class="text-[#64748B]">Step 3: Month 1 Principal Reduction</span>
                <span class="font-mono font-bold">$200.00 payment − $80.00 interest = $120.00 principal</span>
              </div>
              <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-teal-200/80">
                <span class="text-[#64748B]">Step 4: Ending Balance After Month 1</span>
                <span class="font-mono font-bold">$4,000.00 − $120.00 = $3,880.00</span>
              </div>
              <div class="flex flex-col sm:flex-row sm:items-center justify-between pt-1 text-[#0F766E] font-medium">
                <span>Month 2 Progression</span>
                <span class="font-mono font-bold">Interest drops to $3,880 × 0.02 = $77.60 ($122.40 to principal)</span>
              </div>
            </div>
            <p class="text-xs text-[#0F766E] mt-4 leading-relaxed">
              Because interest is recalculated on the reduced balance every month, principal reduction accelerates over time. At this $200.00/mo payment rate, the borrower pays off the entire $4,000 debt in <strong>26 months</strong> with <strong>$1,159.49</strong> in total lifetime interest.
            </p>
          </div>

          <!-- Why Real Statements Differ (DPR, ADB & CFPB References) -->
          <div class="space-y-3 p-5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-2xl text-xs text-[#334155] leading-relaxed">
            <h3 class="font-bold text-sm text-[#0F172A]">Why Your Actual Card Statement May Differ From the Monthly Approximation</h3>
            <p>
              Dividing APR by 12 provides a clean, accurate model for long-term debt payoff planning. However, commercial banks compute finance charges under specific federal regulations documented by the Consumer Financial Protection Bureau (CFPB):
            </p>
            <ul class="space-y-2 list-disc list-inside text-[#64748B]">
              <li>
                <strong class="text-[#0F172A]">Daily Periodic Rate (DPR):</strong> Under <a href="https://www.consumerfinance.gov/ask-cfpb/what-is-a-daily-periodic-rate-on-a-credit-card-en-46/" target="_blank" rel="noopener noreferrer" class="text-[#0F766E] font-bold underline hover:text-[#115E59]">CFPB Daily Periodic Rate Guidance</a>, card issuers divide your annual APR by either 365 or 360 days (depending on your cardholder agreement). For example, a 24.0% APR divided by 365 produces a DPR of 0.065753% per day.
              </li>
              <li>
                <strong class="text-[#0F172A]">Average Daily Balance (ADB) Method:</strong> As detailed in <a href="https://www.consumerfinance.gov/data-research/credit-card-data/know-you-owe-credit-cards/credit-card-contract-definitions/" target="_blank" rel="noopener noreferrer" class="text-[#0F766E] font-bold underline hover:text-[#115E59]">CFPB Credit Card Contract Definitions</a>, most issuers calculate finance charges by totaling your ending balance for each day of the billing cycle (typically 28 to 31 days) and dividing by the number of days to determine your ADB. A payment made on Day 5 reduces your daily balance for the remaining 25 days of the cycle, reducing total interest compared to a payment made on Day 28.
              </li>
              <li>
                <strong class="text-[#0F172A]">Daily Compounding vs. Monthly Assessment:</strong> Certain issuers add each day's accrued interest to the balance before computing the next day's interest (daily compounding), while others accumulate daily charges without compounding, rolling total finance charges into the balance at monthly statement close.
              </li>
              <li>
                <strong class="text-[#0F172A]">Interest-Free Grace Periods &amp; Trailing Interest:</strong> Under most consumer credit card agreements, if you pay your entire statement balance in full on or before the due date each month, issuers provide an interest-free grace period (typically 21 to 25 days) on new eligible purchases. When a balance is carried from a prior cycle, many issuers treat the grace period as lost on subsequent purchases until the full balance is paid over one or two billing cycles, causing interest to begin accruing from the transaction or posting date. However, specific grace period terms, trailing (residual) interest rules, and balance calculation methods depend on your issuer's cardholder agreement. Cash advances and balance transfers generally do not qualify for a grace period and begin accruing interest immediately.
              </li>
            </ul>
          </div>
        </section>

        <!-- How to find your APR before you calculate -->
        <section class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
          <h2 class="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight mb-3">
            How to find your APR before you calculate
          </h2>
          <p class="text-sm text-[#64748B] leading-relaxed mb-4">
            You cannot calculate monthly interest until you know the APR that applies to the balance you carry. Your purchases APR is the rate this calculator uses — check it in one of these three places before you enter a number:
          </p>
          <ul class="space-y-2 text-sm text-[#64748B] list-disc list-inside leading-relaxed mb-4">
            <li><strong class="text-[#0F172A]">Your monthly statement:</strong> look in the interest-charge section, which lists the APR for purchases, balance transfers, and cash advances separately.</li>
            <li><strong class="text-[#0F172A]">Your cardmember agreement:</strong> the APR and how it is calculated are stated in the pricing terms you received with the card.</li>
            <li><strong class="text-[#0F172A]">Your online account or app:</strong> open card details or statements to see the current APR for each transaction type.</li>
          </ul>
          <p class="text-sm text-[#64748B] leading-relaxed">
            If you have more than one APR, use the purchases APR here. To understand why the APR can differ from the plain interest rate on a loan, read
            <RouterLink to="/learn/apr-vs-interest-rate/" class="text-[#0F766E] font-semibold underline hover:text-[#115E59]">APR vs. Interest Rate</RouterLink>.
          </p>
        </section>

        <!-- Section 2: Credit Card APR Payment Economics -->
        <section id="minimum-payment" class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm scroll-mt-24">
          <h2 class="text-xl sm:text-2xl font-extrabold text-[#0F172A] mb-3">
            Credit Card APR Payment Economics: How Your Payment Dictates Total Interest
          </h2>
          <p class="text-sm text-[#64748B] leading-relaxed mb-4">
            When calculating credit card payoff timelines, your monthly payment amount is the single most powerful factor under your control. Many cardholders stay trapped in revolving debt because statement minimum payments are mathematically structured to prolong repayment:
          </p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
            <!-- Scenario A: Statement Minimum Payment Trap (figures generated from the calculator engine) -->
            <div class="p-5 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1]">
              <div class="text-xs font-bold uppercase text-rose-600 mb-1">Scenario A: The Statement Minimum Trap</div>
              <div class="text-2xl font-black text-[#0F172A] mb-1 num-tabular">3% of Balance ($25 floor)</div>
              <p class="text-[11px] text-[#64748B] mb-3">On a $5,000 balance at 24.0% APR paying statement minimums:</p>
              <ul class="text-xs text-[#64748B] space-y-1.5 leading-relaxed">
                <li>• Month 1 Payment: <strong class="text-[#0F172A]">{{ formatCurrency(scenarioAMonth(1).payment, currency) }}</strong> ({{ formatCurrency(scenarioAMonth(1).interestCharged, currency) }} int + {{ formatCurrency(scenarioAMonth(1).payment - scenarioAMonth(1).interestCharged, currency) }} prin)</li>
                <li>• Month 2 Payment: <strong class="text-[#0F172A]">{{ formatCurrency(scenarioAMonth(2).payment, currency) }}</strong> (Bal: {{ formatCurrency(scenarioAMonth(2).endBalance, currency) }})</li>
                <li>• Month 25 Payment: <strong class="text-[#0F172A]">{{ formatCurrency(scenarioAMonth(25).payment, currency) }}</strong> (Bal: {{ formatCurrency(scenarioAMonth(25).endBalance, currency) }})</li>
                <li>• Month 50 Payment: <strong class="text-[#0F172A]">{{ formatCurrency(scenarioAMonth(50).payment, currency) }}</strong> (Bal: {{ formatCurrency(scenarioAMonth(50).endBalance, currency) }})</li>
                <li>• Month 100 Payment: <strong class="text-[#0F172A]">{{ formatCurrency(scenarioAMonth(100).payment, currency) }}</strong> (Bal: {{ formatCurrency(scenarioAMonth(100).endBalance, currency) }})</li>
                <li>• Month 180 ($25 Floor Triggered): <strong class="text-[#0F172A]">{{ formatCurrency(scenarioAMonth(180).payment, currency) }}</strong> (Bal: {{ formatCurrency(scenarioAMonth(180).startBalance, currency) }})</li>
                <li>• Month 234 (Final Payoff): <strong class="text-[#0F172A]">{{ formatCurrency(scenarioA.finalPayment, currency) }}</strong> (Debt cleared)</li>
                <li>• Payoff Timeline: <strong class="text-[#0F172A]">{{ scenarioA.payoffMonths }} Months ({{ scenarioA.payoffYears }} Years)</strong></li>
                <li>• Total Interest Paid: <strong class="text-rose-600 font-bold">{{ formatCurrency(scenarioA.totalInterestPaid, currency) }}</strong></li>
                <li>• Total Cash Paid: <strong class="text-[#0F172A]">{{ formatCurrency(scenarioA.totalAmountPaid, currency) }}</strong></li>
                <li>• <strong class="text-rose-700">You pay {{ formatCurrency(scenarioA.totalInterestPaid - 5000, currency) }} MORE in interest than the original $5,000 balance!</strong></li>
              </ul>
            </div>

            <!-- Scenario B: Fixed Accelerated Payment -->
            <div class="p-5 rounded-2xl bg-emerald-50 border border-emerald-200">
              <div class="text-xs font-bold uppercase text-[#0F766E] mb-1">Scenario B: Fixed $250.00 / Month</div>
              <div class="text-2xl font-black text-[#0F766E] mb-1 num-tabular">$250.00 / mo</div>
              <p class="text-[11px] text-[#0F766E] mb-3">Fixed constant monthly payment until balance hits zero:</p>
              <ul class="text-xs text-[#0F766E] space-y-1.5 leading-relaxed">
                <li>• Payoff Timeline: <strong class="text-[#0F172A]">26 Months (2.2 Years)</strong></li>
                <li>• Total Interest Paid: <strong class="text-[#0F172A]">$1,449.36</strong></li>
                <li>• Total Cash Paid: <strong class="text-[#0F172A]">$6,449.36</strong></li>
                <li>• <strong class="text-[#0F766E]">Saves {{ formatCurrency(scenarioBSaving, currency) }} in interest</strong> and eliminates debt {{ scenarioBYearsSooner.toFixed(1) }} years sooner.</li>
              </ul>
            </div>
          </div>

          <!-- Explanatory Callout Box on Minimum Payment Mechanics -->
          <div class="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-[#475569] leading-relaxed">
            <strong class="text-[#0F172A]">Why does the statement minimum take over 19 years?</strong>
            Credit card companies calculate the required minimum payment each month as a percentage of the remaining balance (commonly 2.5% to 3.0%, or 1% plus monthly finance charges, with a standard $25.00 floor). In Month 1, beginning balance is $5,000.00; monthly interest is $100.00 ($5,000 × 2%); the 3% minimum is <strong>$150.00</strong> ($100.00 interest + $50.00 principal reduction), leaving an ending balance of $4,950.00. In Month 2, interest is $99.00 and the payment automatically shrinks to <strong>$148.50</strong>. Because the required payment falls in tandem with your debt, principal reduction slows to a crawl. By Month 180, 3% falls below $25.00, triggering the $25.00 floor until the debt is cleared in Month 234.
            <div class="mt-2 text-[11px] text-[#64748B]">
              All Scenario A figures are generated from the same calculator engine as the tool above, so they always agree with it. If you instead fix your payment at a modest <strong>$150.00 every month</strong>, you become debt-free in <strong>56 months (4.7 years)</strong> and pay $3,322.09 in interest—saving {{ formatCurrency(scenarioAFixed150Saving, currency) }}.
            </div>
          </div>
        </section>

        <!-- Worked examples & minimum-payment comparison (figures generated from the calculator engine) -->
        <section id="worked-examples" class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm scroll-mt-24">
          <h2 class="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight mb-3">
            Worked examples by balance and APR
          </h2>
          <p class="text-sm text-[#64748B] leading-relaxed mb-4">
            Every row below is calculated by the same engine as the calculator above — change the inputs there and these are the numbers you should get.
          </p>
          <div class="overflow-x-auto border border-[#E2E8F0] rounded-2xl mb-8">
            <table class="w-full text-left text-xs sm:text-sm">
              <thead class="bg-[#F8FAFC] text-[#475569] font-bold border-b border-[#E2E8F0]">
                <tr>
                  <th class="py-3 px-4">Balance</th>
                  <th class="py-3 px-4">APR</th>
                  <th class="py-3 px-4">Monthly payment</th>
                  <th class="py-3 px-4">Payoff time</th>
                  <th class="py-3 px-4">Total interest</th>
                  <th class="py-3 px-4">Total paid</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#E2E8F0]">
                <tr v-for="row in workedExamples" :key="`${row.balance}-${row.apr}-${row.monthlyPayment}`" class="hover:bg-[#F8FAFC]/60 transition-colors">
                  <td class="py-2.5 px-4 num-tabular font-bold text-[#0F172A]">{{ formatCurrency(row.balance, currency) }}</td>
                  <td class="py-2.5 px-4 num-tabular text-[#64748B]">{{ row.apr }}%</td>
                  <td class="py-2.5 px-4 num-tabular text-[#64748B]">{{ formatCurrency(row.monthlyPayment, currency) }}</td>
                  <td class="py-2.5 px-4 num-tabular font-bold text-[#0F172A]">{{ row.payoffMonths }} months</td>
                  <td class="py-2.5 px-4 num-tabular text-rose-600 font-bold">{{ formatCurrency(row.totalInterestPaid, currency) }}</td>
                  <td class="py-2.5 px-4 num-tabular text-[#0F172A] font-extrabold">{{ formatCurrency(row.totalAmountPaid, currency) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 class="text-lg font-extrabold text-[#0F172A] mb-3">
            Minimum payment vs. fixed payment: $4,500 at 22.9% APR
          </h3>
          <p class="text-xs text-[#64748B] leading-relaxed mb-4">
            Minimum payment = 3% of balance or $25, whichever is greater; 22.9% APR; monthly APR ÷ 12 model; no new charges.
          </p>
          <div class="overflow-x-auto border border-[#E2E8F0] rounded-2xl">
            <table class="w-full text-left text-xs sm:text-sm">
              <thead class="bg-[#F8FAFC] text-[#475569] font-bold border-b border-[#E2E8F0]">
                <tr>
                  <th class="py-3 px-4">Payment plan</th>
                  <th class="py-3 px-4">Payoff time</th>
                  <th class="py-3 px-4">Total interest</th>
                  <th class="py-3 px-4">Total paid</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#E2E8F0]">
                <tr v-for="row in comparisonScenarios" :key="row.label" class="hover:bg-[#F8FAFC]/60 transition-colors">
                  <td class="py-2.5 px-4 font-bold text-[#0F172A]">{{ row.label }}</td>
                  <td class="py-2.5 px-4 num-tabular text-[#64748B]">{{ row.payoffMonths }} months ({{ (row.payoffMonths / 12).toFixed(1) }} years)</td>
                  <td class="py-2.5 px-4 num-tabular text-rose-600 font-bold">{{ formatCurrency(row.totalInterestPaid, currency) }}</td>
                  <td class="py-2.5 px-4 num-tabular text-[#0F172A] font-extrabold">{{ formatCurrency(row.totalAmountPaid, currency) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-xs text-[#64748B] leading-relaxed mt-4">
            Try it yourself: turn on <strong class="text-[#0F172A]">Pay minimum only</strong> in the calculator above with a $4,500 balance at 22.9% APR to see the same 208-month, $6,913.23-interest result for your own numbers.
          </p>
        </section>

        <!-- Section 3: Understanding Card APR Tiers -->
        <section class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
          <h2 class="text-xl font-extrabold text-[#0F172A] mb-3">Understanding Different Credit Card APR Tiers</h2>
          <p class="text-sm text-[#64748B] leading-relaxed mb-4">
            Most credit cards feature different APR tiers for different transaction types:
          </p>
          <ul class="space-y-2 text-sm text-[#64748B] list-disc list-inside leading-relaxed mb-4">
            <li><strong class="text-[#0F172A]">Purchase APR:</strong> The standard rate charged on goods and services bought with your card. An interest-free grace period (typically 21–25 days) applies as long as you pay the statement balance in full every month.</li>
            <li><strong class="text-[#0F172A]">Cash Advance APR:</strong> A significantly higher rate (often 25%–30%) applied immediately to ATM withdrawals or cash equivalents, with zero grace period.</li>
            <li><strong class="text-[#0F172A]">Penalty APR:</strong> A punitive rate (frequently up to 29.99%) that lenders can trigger if you miss a payment by 60 days or more.</li>
          </ul>
        </section>

        <!-- Section 4: Repayment Strategies -->
        <section class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
          <h2 class="text-xl font-extrabold text-[#0F172A] mb-3">Strategies to Eliminate High Credit Card APR Debt</h2>
          <div class="space-y-4 text-sm text-[#64748B] leading-relaxed">
            <p>
              If you carry debt across multiple cards or loans, structured repayment strategies can save thousands:
            </p>
            <ul class="space-y-2.5 list-disc list-inside">
              <li>
                <strong class="text-[#0F172A]">The Debt Avalanche Strategy:</strong> Direct all extra monthly funds to the card with the highest APR while maintaining minimum payments on others. This mathematically minimizes total interest paid. Compare this with the Snowball method using our
                <RouterLink to="/debt-payoff-planner/" class="text-[#0F766E] font-semibold underline hover:text-[#115E59]">Debt Payoff Planner</RouterLink>.
              </li>
              <li>
                <strong class="text-[#0F172A]">Consolidation via Fixed-Rate Personal Loan:</strong> If you qualify for an unsecured fixed-rate personal loan with an APR of 8%–12%, consolidating high-APR card debt (22%+) locks in a fixed end-date and lowers interest costs. Calculate fixed payments with our
                <RouterLink to="/loan-payment-calculator/" class="text-[#0F766E] font-semibold underline hover:text-[#115E59]">Loan Payment Calculator</RouterLink>.
              </li>
              <li>
                <strong class="text-[#0F172A]">Compare APR vs. Nominal Interest Rates:</strong> Learn the mathematical differences between simple APR, daily compounding, and Effective Annual Rates (EAR) in our educational guide:
                <RouterLink to="/learn/apr-vs-interest-rate/" class="text-[#0F766E] font-semibold underline hover:text-[#115E59]">APR vs. Interest Rate: Formulas, Compounding &amp; Real Borrowing Costs</RouterLink>.
              </li>
              <li>
                <strong class="text-[#0F172A]">Restoring Your Grace Period:</strong> Under many cardholder agreements, paying your balance in full and maintaining a zero balance through one or two consecutive billing cycles allows you to regain an interest-free grace period on future eligible retail purchases; consult your cardholder agreement for your issuer's trailing interest rules.
              </li>
            </ul>
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

        <section id="faq" class="scroll-mt-24">
          <FAQAccordion :items="currentTool.faqs" title="Frequently Asked Questions About Credit Card APR" />
        </section>
      </div>

      <div class="lg:col-span-4 space-y-6">
        <div class="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-sm">
          <div class="text-xs font-bold uppercase tracking-wider text-[#0F766E] mb-2">In-Depth Guide</div>
          <h3 class="text-base font-bold text-[#0F172A] mb-2">APR vs. Interest Rate: The Key Differences</h3>
          <p class="text-xs text-[#64748B] leading-relaxed mb-4">
            Understand how daily periodic rates work, what loss of grace period means, and how to verify statement finance charges.
          </p>
          <RouterLink
            to="/learn/apr-vs-interest-rate/"
            class="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F766E] hover:underline"
          >
            <span>Read APR Educational Guide</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </RouterLink>
        </div>

        <div class="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-sm">
          <div class="text-xs font-bold uppercase tracking-wider text-[#0F766E] mb-2">Multi-Card Strategy</div>
          <h3 class="text-base font-bold text-[#0F172A] mb-2">Debt Payoff Planner</h3>
          <p class="text-xs text-[#64748B] leading-relaxed mb-4">
            Have multiple credit cards? Compare the Debt Avalanche and Debt Snowball methods side-by-side to find your fastest path to zero debt.
          </p>
          <RouterLink
            to="/debt-payoff-planner/"
            class="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F766E] hover:underline"
          >
            <span>Open Debt Payoff Planner</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </RouterLink>
        </div>

        <div class="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-sm">
          <div class="text-xs font-bold uppercase tracking-wider text-[#0F766E] mb-2">Debt Consolidation</div>
          <h3 class="text-base font-bold text-[#0F172A] mb-2">Loan Payment Calculator</h3>
          <p class="text-xs text-[#64748B] leading-relaxed mb-4">
            Compare high credit card APR against fixed-rate personal consolidation loans. See how fixed installment schedules save interest and lock in payoff dates.
          </p>
          <RouterLink
            to="/loan-payment-calculator/"
            class="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F766E] hover:underline"
          >
            <span>Open Loan Calculator</span>
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
