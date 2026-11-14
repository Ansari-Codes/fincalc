<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { updatePageSeo } from '@/utils/seo'
import { generateCalculatorSchema } from '@/utils/structuredData'
import { formatCurrency, formatPercent, copyToClipboard } from '@/utils/formatters'
import { calculateCreditCardApr } from '@/calculations/creditCardApr'
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

function resetForm() {
  balance.value = 4500
  apr.value = 22.9
  monthlyPayment.value = 200
  additionalPayment.value = 0
  plannedNewPurchases.value = 0
}

const result = computed(() => {
  return calculateCreditCardApr({
    balance: balance.value || 0,
    apr: apr.value || 0,
    monthlyPayment: monthlyPayment.value || 0,
    additionalPayment: additionalPayment.value || 0,
    plannedNewPurchases: plannedNewPurchases.value || 0
  })
})

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
              <label for="monthly-payment" class="text-xs font-bold uppercase tracking-wider text-[#334155]">
                Monthly Payment Amount
              </label>
              <div class="relative w-36">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#94A3B8]">$</span>
                <input
                  id="monthly-payment"
                  v-model.number="monthlyPayment"
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
                :class="monthlyPayment === amt ? 'bg-[#0F766E] text-white' : 'bg-white text-[#475569] hover:bg-[#E2E8F0]'"
                class="text-[11px] font-bold px-2.5 py-1 rounded-md border border-[#CBD5E1] transition-colors"
              >
                ${{ amt }}
              </button>
            </div>
          </div>

          <!-- 4. Optional Extra Payment & New Purchases -->
          <div class="pt-4 border-t border-[#E2E8F0] grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0] space-y-2">
              <div class="flex items-center justify-between">
                <label for="extra-payment" class="text-xs font-bold text-[#334155]">
                  Extra Payment / Mo.
                </label>
                <div class="relative w-24">
                  <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#94A3B8]">$</span>
                  <input
                    id="extra-payment"
                    v-model.number="additionalPayment"
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
                :value="additionalPayment || 0"
                @input="additionalPayment = Number(($event.target as HTMLInputElement).value)"
                class="w-full h-1.5 bg-[#E2E8F0] rounded appearance-none cursor-pointer accent-[#0F766E]"
              />
            </div>

            <div class="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0] space-y-2">
              <div class="flex items-center justify-between">
                <label for="new-charges" class="text-xs font-bold text-[#334155]">
                  New Charges / Mo.
                </label>
                <div class="relative w-24">
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
          <div v-if="!result.isPayingOff" class="bg-rose-500/20 border border-rose-300/40 rounded-2xl p-5 text-rose-100 flex items-start gap-3">
            <AlertTriangle class="w-5 h-5 text-rose-300 shrink-0 mt-0.5" />
            <div class="text-xs leading-relaxed">
              <span class="font-extrabold text-white block mb-0.5">Payment Too Low:</span>
              {{ result.warningMessage }}
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
              <span class="text-[11px] font-semibold text-white/70 block">Total Payment / Mo</span>
              <span class="text-sm sm:text-base font-bold text-white num-tabular mt-0.5 block">
                {{ formatCurrency(result.totalMonthlyPayment, currency) }}
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
    <div v-if="result.schedulePreview.length > 0" class="mb-16 bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
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
        <section class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
          <h2 class="text-xl font-extrabold text-[#0F172A] mb-3">How Credit Card Interest is Modeled</h2>
          <p class="text-sm text-[#64748B] leading-relaxed mb-4">
            Under this educational model, annual percentage rate (APR) is divided by 12 to generate a periodic monthly rate. Monthly interest is assessed on the outstanding balance before deducting your scheduled monthly payment.
          </p>
          <div class="bg-[#F8FAFC] border border-[#CBD5E1] p-4 rounded-xl num-tabular text-xs sm:text-sm text-[#0F172A] mb-4 font-mono">
            {{ currentTool.formula }}
          </div>
          <p class="text-sm text-[#64748B] leading-relaxed">
            Because interest charges are calculated on remaining debt, each payment you make reduces the principal, thereby decreasing the next month’s finance charge.
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
          <h3 class="text-base font-bold text-[#0F172A] mb-2">APR vs. Interest Rate</h3>
          <p class="text-xs text-[#64748B] leading-relaxed mb-4">
            Understand how daily periodic rates work, what loss of grace period means, and how to verify statement charges.
          </p>
          <RouterLink
            to="/learn/apr-vs-interest-rate/"
            class="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F766E] hover:underline"
          >
            <span>Read APR Educational Guide</span>
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
