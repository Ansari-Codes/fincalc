<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { updatePageSeo } from '@/utils/seo'
import { generateCalculatorSchema } from '@/utils/structuredData'
import { formatCurrency, formatPercent, copyToClipboard } from '@/utils/formatters'
import { calculateLoanPayment, type LoanTermUnit } from '@/calculations/loanPayment'
import Breadcrumbs from '@/components/ui/Breadcrumbs.vue'
import FAQAccordion from '@/components/ui/FAQAccordion.vue'
import RelatedTools from '@/components/ui/RelatedTools.vue'
import DisclaimerNotice from '@/components/ui/DisclaimerNotice.vue'
import { tools } from '@/data/tools'
import {
  Calculator,
  RotateCcw,
  Copy,
  Check,
  AlertCircle,
  Calendar,
  DollarSign,
  TrendingDown,
  Sparkles,
  PieChart,
  Sliders,
  Layers
} from '@lucide/vue'

const currentTool = tools.find(t => t.slug === 'loan-payment-calculator')!

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

// Input fields
const principal = ref<number | null>(300000)
const annualRate = ref<number | null>(6.5)
const term = ref<number | null>(30)
const termUnit = ref<LoanTermUnit>('years')
const extraMonthlyPayment = ref<number | null>(0)
const showSchedule = ref(false)
const scheduleFilter = ref<'all' | 'annual'>('annual')

// Quick preset handlers
function setPrincipal(val: number) {
  principal.value = val
}

function setRate(val: number) {
  annualRate.value = val
}

function setTerm(val: number, unit: LoanTermUnit = 'years') {
  term.value = val
  termUnit.value = unit
}

function setExtra(val: number) {
  extraMonthlyPayment.value = val
}

function resetForm() {
  principal.value = null
  annualRate.value = null
  term.value = null
  termUnit.value = 'years'
  extraMonthlyPayment.value = 0
}

const result = computed(() => {
  return calculateLoanPayment({
    principal: principal.value ?? 0,
    annualRate: annualRate.value ?? 0,
    term: term.value ?? 0,
    termUnit: termUnit.value,
    extraMonthlyPayment: extraMonthlyPayment.value ?? 0
  })
})

// Visual breakdown percentages
const principalSharePct = computed(() => {
  if (result.value.totalRepayment <= 0) return 50
  return (result.value.principal / result.value.totalRepayment) * 100
})

const interestSharePct = computed(() => {
  if (result.value.totalRepayment <= 0) return 50
  return (result.value.totalInterest / result.value.totalRepayment) * 100
})

// Filtered schedule display (annual summary vs every month)
const displayedSchedule = computed(() => {
  if (scheduleFilter.value === 'all') {
    return result.value.schedule
  }
  return result.value.schedule.filter((row, idx, arr) => {
    return row.paymentNumber % 12 === 0 || idx === arr.length - 1
  })
})

async function handleCopy() {
  const lines = [
    'Fixed-Rate Loan Payment Summary',
    '-------------------------------',
    `Loan Principal: ${formatCurrency(result.value.principal, currency.value)}`,
    `Interest Rate (APR): ${formatPercent(annualRate.value || 0)}`,
    `Term: ${term.value} ${termUnit.value}`,
    `Regular Monthly Payment: ${formatCurrency(result.value.regularMonthlyPayment, currency.value)}`,
    extraMonthlyPayment.value ? `Extra Monthly Payment: ${formatCurrency(extraMonthlyPayment.value, currency.value)}` : '',
    extraMonthlyPayment.value ? `Actual Payoff Months: ${result.value.actualPayoffMonths} (Saved ${result.value.monthsSaved} months)` : '',
    extraMonthlyPayment.value ? `Interest Saved: ${formatCurrency(result.value.interestSaved, currency.value)}` : '',
    `Total Interest: ${formatCurrency(result.value.totalInterest, currency.value)}`,
    `Total Cost of Loan: ${formatCurrency(result.value.totalRepayment, currency.value)}`
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
      { name: 'Credit & Debt', path: '/tools/credit-debt/' },
      { name: 'Loan Payment Calculator' }
    ]" />

    <!-- Tool Instrument Header -->
    <div class="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div>
        <div class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0F766E] bg-[#E7F4F1] px-3 py-1 rounded-full mb-2.5">
          <Calculator class="w-3.5 h-3.5" />
          <span>Interactive Financing Instrument</span>
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
            <span>Interactive Parameters</span>
          </div>
          <span class="text-[11px] text-[#94A3B8] font-medium">Type or slide values</span>
        </div>

        <form @submit.prevent class="space-y-6">
          <!-- 1. Principal Control with Slider & Presets -->
          <div class="bg-[#F8FAFC] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] space-y-3">
            <div class="flex items-center justify-between">
              <label for="loan-principal" class="text-xs font-bold uppercase tracking-wider text-[#334155]">
                Loan Principal
              </label>
              <div class="relative w-36">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#94A3B8]">$</span>
                <input
                  id="loan-principal"
                  v-model.number="principal"
                  type="number"
                  min="0"
                  step="1000"
                  class="w-full pl-6 pr-2.5 py-1.5 text-right font-bold text-sm bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>
            </div>

            <!-- Tactile Range Slider -->
            <input
              type="range"
              min="10000"
              max="1500000"
              step="5000"
              :value="principal || 0"
              @input="principal = Number(($event.target as HTMLInputElement).value)"
              class="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#0F766E]"
            />

            <!-- Presets -->
            <div class="flex flex-wrap items-center gap-1.5 pt-1">
              <span class="text-[11px] font-semibold text-[#94A3B8] mr-1">Presets:</span>
              <button
                v-for="amt in [100000, 250000, 400000, 650000, 1000000]"
                :key="amt"
                type="button"
                @click="setPrincipal(amt)"
                :class="principal === amt ? 'bg-[#0F766E] text-white' : 'bg-white text-[#475569] hover:bg-[#E2E8F0]'"
                class="text-[11px] font-bold px-2.5 py-1 rounded-md border border-[#CBD5E1] transition-colors"
              >
                ${{ amt >= 1000000 ? (amt / 1000000) + 'M' : (amt / 1000) + 'k' }}
              </button>
            </div>
          </div>

          <!-- 2. Interest Rate Control with Slider & Presets -->
          <div class="bg-[#F8FAFC] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] space-y-3">
            <div class="flex items-center justify-between">
              <label for="loan-apr" class="text-xs font-bold uppercase tracking-wider text-[#334155]">
                Annual Interest Rate (APR)
              </label>
              <div class="relative w-28">
                <input
                  id="loan-apr"
                  v-model.number="annualRate"
                  type="number"
                  min="0"
                  max="35"
                  step="0.05"
                  class="w-full pl-2.5 pr-6 py-1.5 text-right font-bold text-sm bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
                <span class="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#94A3B8]">%</span>
              </div>
            </div>

            <!-- Tactile Range Slider -->
            <input
              type="range"
              min="0"
              max="15"
              step="0.125"
              :value="annualRate || 0"
              @input="annualRate = Number(($event.target as HTMLInputElement).value)"
              class="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#0F766E]"
            />

            <!-- Presets -->
            <div class="flex flex-wrap items-center gap-1.5 pt-1">
              <span class="text-[11px] font-semibold text-[#94A3B8] mr-1">Presets:</span>
              <button
                v-for="rate in [0.0, 4.5, 5.5, 6.5, 7.0, 8.5]"
                :key="rate"
                type="button"
                @click="setRate(rate)"
                :class="annualRate === rate ? 'bg-[#0F766E] text-white' : 'bg-white text-[#475569] hover:bg-[#E2E8F0]'"
                class="text-[11px] font-bold px-2.5 py-1 rounded-md border border-[#CBD5E1] transition-colors"
              >
                {{ rate }}%
              </button>
            </div>
          </div>

          <!-- 3. Loan Term Segmented Controls -->
          <div class="bg-[#F8FAFC] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase tracking-wider text-[#334155]">Loan Term</span>
              <div class="flex items-center gap-1.5">
                <input
                  v-model.number="term"
                  type="number"
                  min="1"
                  max="600"
                  class="w-20 px-2.5 py-1 text-right font-bold text-sm bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
                <select
                  v-model="termUnit"
                  aria-label="Term Unit"
                  class="text-xs font-bold bg-white border border-[#CBD5E1] rounded-lg px-2 py-1.5 text-[#334155]"
                >
                  <option value="years">Years</option>
                  <option value="months">Months</option>
                </select>
              </div>
            </div>

            <!-- Term Button Presets -->
            <div class="grid grid-cols-4 gap-2">
              <button
                type="button"
                @click="setTerm(15, 'years')"
                :class="term === 15 && termUnit === 'years' ? 'bg-[#0F766E] text-white shadow-xs' : 'bg-white text-[#334155] border-[#CBD5E1] hover:bg-[#E2E8F0]'"
                class="py-2 text-xs font-bold rounded-xl border text-center transition-all"
              >
                15 Years
              </button>
              <button
                type="button"
                @click="setTerm(20, 'years')"
                :class="term === 20 && termUnit === 'years' ? 'bg-[#0F766E] text-white shadow-xs' : 'bg-white text-[#334155] border-[#CBD5E1] hover:bg-[#E2E8F0]'"
                class="py-2 text-xs font-bold rounded-xl border text-center transition-all"
              >
                20 Years
              </button>
              <button
                type="button"
                @click="setTerm(30, 'years')"
                :class="term === 30 && termUnit === 'years' ? 'bg-[#0F766E] text-white shadow-xs' : 'bg-white text-[#334155] border-[#CBD5E1] hover:bg-[#E2E8F0]'"
                class="py-2 text-xs font-bold rounded-xl border text-center transition-all"
              >
                30 Years
              </button>
              <button
                type="button"
                @click="setTerm(60, 'months')"
                :class="term === 60 && termUnit === 'months' ? 'bg-[#0F766E] text-white shadow-xs' : 'bg-white text-[#334155] border-[#CBD5E1] hover:bg-[#E2E8F0]'"
                class="py-2 text-xs font-bold rounded-xl border text-center transition-all"
              >
                5 Yrs Auto
              </button>
            </div>
          </div>

          <!-- 4. Additional Monthly Prepayment Slider -->
          <div class="bg-[#F8FAFC] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <label for="extra-monthly" class="text-xs font-bold uppercase tracking-wider text-[#334155] flex items-center gap-1.5">
                  <Sparkles class="w-3.5 h-3.5 text-teal-600" />
                  <span>Extra Monthly Payment</span>
                </label>
                <p class="text-[11px] text-[#64748B]">Applied 100% to principal</p>
              </div>
              <div class="relative w-32">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#94A3B8]">$</span>
                <input
                  id="extra-monthly"
                  v-model.number="extraMonthlyPayment"
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
              min="0"
              max="2000"
              step="25"
              :value="extraMonthlyPayment || 0"
              @input="extraMonthlyPayment = Number(($event.target as HTMLInputElement).value)"
              class="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#0F766E]"
            />

            <!-- Presets -->
            <div class="flex flex-wrap items-center gap-1.5 pt-1">
              <span class="text-[11px] font-semibold text-[#94A3B8] mr-1">Presets:</span>
              <button
                v-for="ext in [0, 100, 250, 500, 1000]"
                :key="ext"
                type="button"
                @click="setExtra(ext)"
                :class="extraMonthlyPayment === ext ? 'bg-[#0F766E] text-white' : 'bg-white text-[#475569] hover:bg-[#E2E8F0]'"
                class="text-[11px] font-bold px-2.5 py-1 rounded-md border border-[#CBD5E1] transition-colors"
              >
                +${{ ext }}
              </button>
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
        <!-- Background subtle grid pattern -->
        <div class="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>

        <div class="relative z-10">
          <!-- Console Top Status -->
          <div class="flex items-center justify-between pb-4 mb-6 border-b border-white/15">
            <div class="flex items-center gap-2">
              <div class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
              <span class="text-xs font-bold uppercase tracking-wider text-[#99F6E4]">Calculated Installment</span>
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

          <!-- Hero Monthly Payment Display -->
          <div class="mb-6">
            <span class="text-xs uppercase tracking-wider text-white/70 font-semibold block mb-1">
              {{ (extraMonthlyPayment || 0) > 0 ? 'Total Monthly Payment (With Extra)' : 'Monthly Payment (Principal & Interest)' }}
            </span>
            <div class="text-4xl sm:text-5xl font-black tracking-tight text-white flex items-baseline gap-2">
              <span>{{ formatCurrency(result.totalMonthlyPayment, currency) }}</span>
              <span class="text-sm font-semibold text-[#99F6E4]">/month</span>
            </div>
            <p v-if="(extraMonthlyPayment || 0) > 0" class="text-xs text-[#99F6E4] mt-2">
              Base {{ formatCurrency(result.regularMonthlyPayment, currency) }} + {{ formatCurrency(extraMonthlyPayment || 0, currency) }} extra principal.
            </p>
          </div>

          <!-- Interactive Proportional Visual Bar (Principal vs. Interest) -->
          <div class="mb-6 bg-black/20 p-4 rounded-2xl border border-white/10">
            <div class="flex items-center justify-between text-xs mb-2">
              <span class="font-bold text-white flex items-center gap-1.5">
                <PieChart class="w-3.5 h-3.5 text-[#99F6E4]" />
                <span>Lifetime Cost Composition</span>
              </span>
              <span class="text-xs text-white/70 font-semibold">
                {{ formatCurrency(result.totalRepayment, currency) }} total
              </span>
            </div>

            <!-- Proportional Dual-Tone Bar -->
            <div class="w-full h-3 rounded-full overflow-hidden flex bg-white/20">
              <div
                class="bg-[#2DD4BF] transition-all duration-300"
                :style="{ width: `${principalSharePct}%` }"
                title="Principal"
              ></div>
              <div
                class="bg-[#F59E0B] transition-all duration-300"
                :style="{ width: `${interestSharePct}%` }"
                title="Interest"
              ></div>
            </div>

            <!-- Legend -->
            <div class="flex items-center justify-between text-[11px] mt-2.5">
              <div class="flex items-center gap-1.5 text-emerald-200">
                <span class="w-2.5 h-2.5 rounded-full bg-[#2DD4BF]"></span>
                <span>Principal: <strong>{{ principalSharePct.toFixed(1) }}%</strong></span>
              </div>
              <div class="flex items-center gap-1.5 text-amber-200">
                <span class="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span>
                <span>Interest: <strong>{{ interestSharePct.toFixed(1) }}%</strong></span>
              </div>
            </div>
          </div>

          <!-- Extra Payment Callout Highlight -->
          <div v-if="(extraMonthlyPayment || 0) > 0 && result.monthsSaved > 0" class="mb-6 p-4 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-100 flex items-start gap-3">
            <Sparkles class="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
            <div>
              <p class="font-bold text-xs text-white uppercase tracking-wider">Payoff Acceleration Active</p>
              <p class="text-xs text-emerald-100 mt-1 leading-relaxed">
                You save 
                <strong class="text-white font-extrabold">{{ formatCurrency(result.interestSaved, currency) }}</strong> in interest 
                and eliminate debt 
                <strong class="text-white font-extrabold">{{ result.monthsSaved }} months (~{{ (result.monthsSaved / 12).toFixed(1) }} yrs)</strong> sooner!
              </p>
            </div>
          </div>

          <!-- Secondary Metric HUD Grid -->
          <div class="grid grid-cols-2 gap-3 mb-6">
            <div class="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
              <div class="flex items-center gap-1.5 text-xs text-[#99F6E4] mb-1">
                <DollarSign class="w-3.5 h-3.5" />
                <span>Total Principal</span>
              </div>
              <div class="text-lg sm:text-xl font-black">
                {{ formatCurrency(result.principal, currency) }}
              </div>
              <span class="text-[10px] text-white/60">Borrowed capital</span>
            </div>

            <div class="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
              <div class="flex items-center gap-1.5 text-xs text-amber-300 mb-1">
                <TrendingDown class="w-3.5 h-3.5" />
                <span>Total Interest</span>
              </div>
              <div class="text-lg sm:text-xl font-black text-amber-200">
                {{ formatCurrency(result.totalInterest, currency) }}
              </div>
              <span class="text-[10px] text-white/60">Financing expense</span>
            </div>

            <div class="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
              <div class="flex items-center gap-1.5 text-xs text-[#99F6E4] mb-1">
                <Calendar class="w-3.5 h-3.5" />
                <span>Payoff Horizon</span>
              </div>
              <div class="text-lg sm:text-xl font-black">
                {{ result.actualPayoffMonths }} Mo
              </div>
              <span class="text-[10px] text-white/60">~{{ (result.actualPayoffMonths / 12).toFixed(1) }} Years</span>
            </div>

            <div class="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
              <div class="flex items-center gap-1.5 text-xs text-[#99F6E4] mb-1">
                <Layers class="w-3.5 h-3.5" />
                <span>Total Outlay</span>
              </div>
              <div class="text-lg sm:text-xl font-black">
                {{ formatCurrency(result.totalRepayment, currency) }}
              </div>
              <span class="text-[10px] text-white/60">Principal + interest</span>
            </div>
          </div>
        </div>

        <!-- Schedule Toggle Button -->
        <button
          type="button"
          @click="showSchedule = !showSchedule"
          class="relative z-10 w-full py-3 px-4 text-xs font-bold rounded-2xl bg-white text-[#0B3B39] hover:bg-[#F0FDFA] transition-all text-center shadow-md active:scale-98"
        >
          {{ showSchedule ? '▲ Hide Amortization Table' : '▼ View Full Month-by-Month Amortization Table' }}
        </button>
      </div>
    </div>

    <!-- Amortization Schedule Table -->
    <div v-if="showSchedule && result.schedule.length > 0" class="mb-12 bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h3 class="text-lg font-bold text-[#0F172A]">Amortization Breakdown Table</h3>
          <p class="text-xs text-[#64748B] mt-0.5">Observe how the balance shifts from predominantly interest to principal over time.</p>
        </div>
        <div class="flex items-center gap-2 bg-[#F1F5F9] p-1 rounded-xl">
          <button
            type="button"
            @click="scheduleFilter = 'annual'"
            :class="scheduleFilter === 'annual' ? 'bg-white text-[#0F766E] shadow-xs' : 'text-[#64748B]'"
            class="text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
          >
            Annual Milestones
          </button>
          <button
            type="button"
            @click="scheduleFilter = 'all'"
            :class="scheduleFilter === 'all' ? 'bg-white text-[#0F766E] shadow-xs' : 'text-[#64748B]'"
            class="text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
          >
            All {{ result.schedule.length }} Months
          </button>
        </div>
      </div>

      <div class="overflow-x-auto max-h-[500px] border border-[#E2E8F0] rounded-2xl">
        <table class="w-full text-left text-xs border-collapse">
          <thead class="sticky top-0 bg-[#F8FAFC]">
            <tr class="border-b border-[#E2E8F0] text-[#64748B] font-bold">
              <th class="py-3 px-4">Period</th>
              <th class="py-3 px-4">Starting Balance</th>
              <th class="py-3 px-4">Interest Fee</th>
              <th class="py-3 px-4">Principal Paid</th>
              <th v-if="(extraMonthlyPayment || 0) > 0" class="py-3 px-4">Extra Paid</th>
              <th class="py-3 px-4">Total Paid</th>
              <th class="py-3 px-4">Ending Balance</th>
              <th class="py-3 px-4 text-right">Cumulative Interest</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#F1F5F9] text-[#334155]">
            <tr v-for="row in displayedSchedule" :key="row.paymentNumber" class="hover:bg-[#F8FAFC] transition-colors">
              <td class="py-2.5 px-4 font-bold text-[#0F766E]">Month {{ row.paymentNumber }}</td>
              <td class="py-2.5 px-4">{{ formatCurrency(row.startingBalance, currency) }}</td>
              <td class="py-2.5 px-4 text-amber-700 font-semibold">{{ formatCurrency(row.interest, currency) }}</td>
              <td class="py-2.5 px-4 text-emerald-700 font-semibold">{{ formatCurrency(row.principalRepaid, currency) }}</td>
              <td v-if="(extraMonthlyPayment || 0) > 0" class="py-2.5 px-4 text-teal-700 font-semibold">+{{ formatCurrency(row.additionalPayment, currency) }}</td>
              <td class="py-2.5 px-4 font-bold text-[#0F172A]">{{ formatCurrency(row.totalPaymentThisMonth, currency) }}</td>
              <td class="py-2.5 px-4 font-medium">{{ formatCurrency(row.endingBalance, currency) }}</td>
              <td class="py-2.5 px-4 text-right font-medium text-[#64748B]">{{ formatCurrency(row.totalInterestPaidToDate, currency) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Educational Content & Formula Explanation -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
      <div class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-7 shadow-xs">
        <h3 class="text-xs font-bold text-[#0F766E] uppercase tracking-wider mb-2">
          Fixed-Rate Amortization Formula
        </h3>
        <p class="text-xs text-[#64748B] leading-relaxed mb-3">
          The monthly installment M is calculated using the standard annuity formula:
        </p>
        <div class="bg-[#F8FAFC] p-4 rounded-xl border border-[#CBD5E1] font-mono text-xs text-[#1E293B] overflow-x-auto mb-3">
          M = P × [r(1 + r)^n ÷ ((1 + r)^n − 1)]
        </div>
        <ul class="text-xs text-[#64748B] space-y-1">
          <li><strong>P:</strong> Principal loan balance</li>
          <li><strong>r:</strong> Monthly periodic interest rate (APR ÷ 12 ÷ 100)</li>
          <li><strong>n:</strong> Total number of scheduled monthly payments</li>
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
