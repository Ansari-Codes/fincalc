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
  Sparkles
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

// Filtered schedule display (annual summary vs every month)
const displayedSchedule = computed(() => {
  if (scheduleFilter.value === 'all') {
    return result.value.schedule
  }
  // Annual summary: take month 12, 24, 36... and the final month
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

    <!-- Page Header -->
    <div class="mb-8">
      <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0F766E] mb-2">
        <Calculator class="w-4 h-4" />
        <span>Fixed-Rate Borrowing &amp; Amortization</span>
      </div>
      <h1 class="text-2xl sm:text-4xl font-extrabold text-[#172033] tracking-tight mb-3">
        {{ currentTool.name }}
      </h1>
      <p class="text-base sm:text-lg text-[#667085] max-w-3xl leading-relaxed">
        {{ currentTool.fullDescription }}
      </p>
    </div>

    <!-- Calculator Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
      <!-- Input Panel -->
      <div class="lg:col-span-6 bg-white rounded-2xl border border-[#E4E7EC] p-6 sm:p-7 shadow-xs">
        <div class="flex items-center justify-between pb-4 mb-6 border-b border-[#F2F4F7]">
          <h2 class="text-lg font-bold text-[#172033]">Loan Parameters</h2>
          <div class="flex items-center gap-3">
            <select
              v-model="currency"
              aria-label="Display currency"
              class="text-xs font-semibold bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-2.5 py-1 text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CAD">CAD ($)</option>
            </select>
            <button
              type="button"
              @click="resetForm"
              class="inline-flex items-center gap-1.5 text-xs font-medium text-[#64748B] hover:text-[#0F766E] transition-colors"
            >
              <RotateCcw class="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        <form @submit.prevent class="space-y-5">
          <!-- Loan Principal -->
          <div>
            <label for="loan-principal" class="block text-xs font-semibold text-[#344054] mb-1.5">
              Loan Principal Amount
            </label>
            <div class="relative">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#94A3B8] font-medium">$</span>
              <input
                id="loan-principal"
                v-model.number="principal"
                type="number"
                min="0"
                step="5000"
                placeholder="300000"
                class="w-full pl-8 pr-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-xl text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:border-transparent"
              />
            </div>
            <p class="text-[11px] text-[#64748B] mt-1">Total borrowed amount (mortgage, auto loan, or personal loan).</p>
          </div>

          <!-- Annual Interest Rate (APR) -->
          <div>
            <label for="loan-apr" class="block text-xs font-semibold text-[#344054] mb-1.5">
              Annual Interest Rate (APR %)
            </label>
            <div class="relative">
              <input
                id="loan-apr"
                v-model.number="annualRate"
                type="number"
                min="0"
                max="35"
                step="0.05"
                placeholder="6.5"
                class="w-full pl-3.5 pr-8 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-xl text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:border-transparent"
              />
              <span class="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-[#94A3B8] font-medium">%</span>
            </div>
            <p class="text-[11px] text-[#64748B] mt-1">Fixed nominal annual borrowing rate.</p>
          </div>

          <!-- Term & Term Unit -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label for="loan-term" class="block text-xs font-semibold text-[#344054] mb-1.5">
                Loan Term
              </label>
              <input
                id="loan-term"
                v-model.number="term"
                type="number"
                min="1"
                max="600"
                placeholder="30"
                class="w-full px-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-xl text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:border-transparent"
              />
            </div>

            <div>
              <label for="loan-term-unit" class="block text-xs font-semibold text-[#344054] mb-1.5">
                Term Unit
              </label>
              <select
                id="loan-term-unit"
                v-model="termUnit"
                class="w-full px-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-xl text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:border-transparent"
              >
                <option value="years">Years (e.g. 15, 30)</option>
                <option value="months">Months (e.g. 36, 60)</option>
              </select>
            </div>
          </div>

          <!-- Optional Extra Payment -->
          <div>
            <label for="extra-monthly" class="block text-xs font-semibold text-[#344054] mb-1.5">
              Additional Monthly Payment (Optional)
            </label>
            <div class="relative">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#94A3B8] font-medium">$</span>
              <input
                id="extra-monthly"
                v-model.number="extraMonthlyPayment"
                type="number"
                min="0"
                step="50"
                placeholder="0"
                class="w-full pl-8 pr-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-xl text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:border-transparent"
              />
            </div>
            <p class="text-[11px] text-[#64748B] mt-1">Extra cash applied directly toward reducing principal each month.</p>
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

      <!-- Results Panel -->
      <div class="lg:col-span-6 flex flex-col justify-between bg-gradient-to-br from-[#0B3B39] to-[#0F766E] rounded-2xl p-6 sm:p-8 text-white shadow-lg">
        <div>
          <div class="flex items-center justify-between pb-4 mb-6 border-b border-white/15">
            <div class="flex items-center gap-2">
              <DollarSign class="w-5 h-5 text-[#99F6E4]" />
              <h2 class="text-base sm:text-lg font-bold tracking-tight">Monthly Payment</h2>
            </div>
            <button
              type="button"
              @click="handleCopy"
              class="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <component :is="copied ? Check : Copy" class="w-3.5 h-3.5" />
              <span>{{ copied ? 'Copied' : 'Copy' }}</span>
            </button>
          </div>

          <!-- Extra Payment Acceleration Highlight -->
          <div v-if="(extraMonthlyPayment || 0) > 0 && result.monthsSaved > 0" class="mb-6 p-4 rounded-xl bg-teal-500/20 border border-teal-400/40 text-teal-100 flex items-start gap-3">
            <Sparkles class="w-5 h-5 text-teal-300 shrink-0 mt-0.5" />
            <div>
              <p class="font-bold text-sm text-white">Early Payoff Acceleration!</p>
              <p class="text-xs text-teal-100 mt-0.5 leading-relaxed">
                Paying an extra {{ formatCurrency(extraMonthlyPayment || 0, currency) }}/month saves 
                <strong class="text-white">{{ formatCurrency(result.interestSaved, currency) }}</strong> in interest 
                and eliminates your debt 
                <strong class="text-white">{{ result.monthsSaved }} months (~{{ (result.monthsSaved / 12).toFixed(1) }} years)</strong> earlier.
              </p>
            </div>
          </div>

          <!-- Hero Payment -->
          <div class="mb-6">
            <span class="text-xs uppercase tracking-wider text-[#99F6E4] font-semibold">
              {{ (extraMonthlyPayment || 0) > 0 ? 'Total Monthly Payment (With Extra)' : 'Monthly Principal & Interest Payment' }}
            </span>
            <div class="text-3xl sm:text-5xl font-black tracking-tight mt-1">
              {{ formatCurrency(result.totalMonthlyPayment, currency) }}
            </div>
            <p v-if="(extraMonthlyPayment || 0) > 0" class="text-xs text-white/70 mt-1.5">
              Includes regular payment of {{ formatCurrency(result.regularMonthlyPayment, currency) }} + {{ formatCurrency(extraMonthlyPayment || 0, currency) }} extra principal.
            </p>
          </div>

          <!-- Metric Cards Grid -->
          <div class="grid grid-cols-2 gap-3 mb-6">
            <div class="bg-white/10 backdrop-blur-xs rounded-xl p-3.5 border border-white/10">
              <div class="flex items-center gap-1.5 text-xs text-[#99F6E4] mb-1">
                <DollarSign class="w-3.5 h-3.5" />
                <span>Total Principal</span>
              </div>
              <div class="text-base sm:text-xl font-bold">
                {{ formatCurrency(result.principal, currency) }}
              </div>
              <span class="text-[11px] text-white/60">Original borrowed sum</span>
            </div>

            <div class="bg-white/10 backdrop-blur-xs rounded-xl p-3.5 border border-white/10">
              <div class="flex items-center gap-1.5 text-xs text-[#99F6E4] mb-1">
                <TrendingDown class="w-3.5 h-3.5" />
                <span>Total Interest</span>
              </div>
              <div class="text-base sm:text-xl font-bold">
                {{ formatCurrency(result.totalInterest, currency) }}
              </div>
              <span class="text-[11px] text-white/60">Lifetime financing charge</span>
            </div>

            <div class="bg-white/10 backdrop-blur-xs rounded-xl p-3.5 border border-white/10">
              <div class="flex items-center gap-1.5 text-xs text-[#99F6E4] mb-1">
                <Calendar class="w-3.5 h-3.5" />
                <span>Payoff Timeline</span>
              </div>
              <div class="text-base sm:text-xl font-bold">
                {{ result.actualPayoffMonths }} Months
              </div>
              <span class="text-[11px] text-white/60">~{{ (result.actualPayoffMonths / 12).toFixed(1) }} Years</span>
            </div>

            <div class="bg-white/10 backdrop-blur-xs rounded-xl p-3.5 border border-white/10">
              <div class="flex items-center gap-1.5 text-xs text-[#99F6E4] mb-1">
                <Calculator class="w-3.5 h-3.5" />
                <span>Total Repayment</span>
              </div>
              <div class="text-base sm:text-xl font-bold">
                {{ formatCurrency(result.totalRepayment, currency) }}
              </div>
              <span class="text-[11px] text-white/60">Principal + interest</span>
            </div>
          </div>
        </div>

        <!-- Toggle Schedule Button -->
        <button
          type="button"
          @click="showSchedule = !showSchedule"
          class="w-full py-2.5 px-4 text-xs font-semibold rounded-xl bg-white text-[#0B3B39] hover:bg-[#F0FDFA] transition-colors text-center"
        >
          {{ showSchedule ? 'Hide Amortization Schedule' : 'View Full Amortization Schedule' }}
        </button>
      </div>
    </div>

    <!-- Amortization Schedule Table -->
    <div v-if="showSchedule && result.schedule.length > 0" class="mb-12 bg-white rounded-2xl border border-[#E4E7EC] p-6 shadow-xs">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h3 class="text-base font-bold text-[#172033]">Loan Amortization Schedule</h3>
          <p class="text-xs text-[#667085] mt-0.5">Month-by-month principal and interest allocation breakdown.</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="scheduleFilter = 'annual'"
            :class="scheduleFilter === 'annual' ? 'bg-[#0F766E] text-white' : 'bg-[#F1F5F9] text-[#475569]'"
            class="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            Annual Milestones
          </button>
          <button
            type="button"
            @click="scheduleFilter = 'all'"
            :class="scheduleFilter === 'all' ? 'bg-[#0F766E] text-white' : 'bg-[#F1F5F9] text-[#475569]'"
            class="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            All {{ result.schedule.length }} Months
          </button>
        </div>
      </div>

      <div class="overflow-x-auto max-h-[500px]">
        <table class="w-full text-left text-xs border-collapse">
          <thead class="sticky top-0 bg-[#F8FAFC]">
            <tr class="border-b border-[#E4E7EC] text-[#64748B] font-semibold">
              <th class="py-2.5 px-3">Payment #</th>
              <th class="py-2.5 px-3">Starting Balance</th>
              <th class="py-2.5 px-3">Interest</th>
              <th class="py-2.5 px-3">Principal</th>
              <th v-if="(extraMonthlyPayment || 0) > 0" class="py-2.5 px-3">Extra Paid</th>
              <th class="py-2.5 px-3">Total Payment</th>
              <th class="py-2.5 px-3">Ending Balance</th>
              <th class="py-2.5 px-3 text-right">Cumulative Interest</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#F1F5F9] text-[#334155]">
            <tr v-for="row in displayedSchedule" :key="row.paymentNumber" class="hover:bg-[#F8FAFC]">
              <td class="py-2 px-3 font-medium text-[#0F766E]">Month {{ row.paymentNumber }}</td>
              <td class="py-2 px-3">{{ formatCurrency(row.startingBalance, currency) }}</td>
              <td class="py-2 px-3 text-red-600 font-medium">{{ formatCurrency(row.interest, currency) }}</td>
              <td class="py-2 px-3 text-emerald-700 font-medium">{{ formatCurrency(row.principalRepaid, currency) }}</td>
              <td v-if="(extraMonthlyPayment || 0) > 0" class="py-2 px-3 text-teal-700 font-medium">+{{ formatCurrency(row.additionalPayment, currency) }}</td>
              <td class="py-2 px-3 font-semibold text-[#172033]">{{ formatCurrency(row.totalPaymentThisMonth, currency) }}</td>
              <td class="py-2 px-3 font-medium">{{ formatCurrency(row.endingBalance, currency) }}</td>
              <td class="py-2 px-3 text-right font-medium text-[#64748B]">{{ formatCurrency(row.totalInterestPaidToDate, currency) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Educational Content & Formula Explanation -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
      <div class="bg-white rounded-2xl border border-[#E4E7EC] p-6 shadow-xs">
        <h3 class="text-sm font-bold text-[#172033] uppercase tracking-wider mb-2 text-[#0F766E]">
          Fixed-Rate Amortization Formula
        </h3>
        <p class="text-xs text-[#667085] leading-relaxed mb-3">
          The monthly installment M is calculated using the standard annuity formula:
        </p>
        <div class="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#CBD5E1] font-mono text-xs text-[#1E293B] overflow-x-auto mb-3">
          M = P × [r(1 + r)^n ÷ ((1 + r)^n − 1)]
        </div>
        <ul class="text-xs text-[#64748B] space-y-1">
          <li><strong>P:</strong> Principal loan balance</li>
          <li><strong>r:</strong> Monthly periodic interest rate (APR ÷ 12 ÷ 100)</li>
          <li><strong>n:</strong> Total number of scheduled monthly payments</li>
        </ul>
      </div>

      <div class="bg-white rounded-2xl border border-[#E4E7EC] p-6 shadow-xs">
        <h3 class="text-sm font-bold text-[#172033] uppercase tracking-wider mb-2 text-[#0F766E]">
          Key Assumptions &amp; Disclosures
        </h3>
        <ul class="text-xs text-[#667085] space-y-2 list-disc pl-4 leading-relaxed">
          <li v-for="(assumption, idx) in currentTool.assumptions" :key="idx">
            {{ assumption }}
          </li>
        </ul>
      </div>
    </div>

    <!-- FAQ Accordion -->
    <div class="mb-12">
      <h2 class="text-xl font-bold text-[#172033] mb-4">Frequently Asked Questions</h2>
      <FAQAccordion :items="currentTool.faqs" />
    </div>

    <!-- Related Tools -->
    <div class="mb-12">
      <h2 class="text-xl font-bold text-[#172033] mb-4">Related Financial Calculators</h2>
      <RelatedTools :tool-slugs="currentTool.relatedToolSlugs" />
    </div>

    <!-- Disclaimer -->
    <DisclaimerNotice />
  </div>
</template>
