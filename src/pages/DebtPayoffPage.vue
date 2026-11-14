<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { updatePageSeo } from '@/utils/seo'
import { generateCalculatorSchema } from '@/utils/structuredData'
import { formatCurrency, formatPercent, copyToClipboard } from '@/utils/formatters'
import { calculateDebtPayoff, type DebtItem, type DebtStrategy } from '@/calculations/debtPayoff'
import Breadcrumbs from '@/components/ui/Breadcrumbs.vue'
import FAQAccordion from '@/components/ui/FAQAccordion.vue'
import RelatedTools from '@/components/ui/RelatedTools.vue'
import DisclaimerNotice from '@/components/ui/DisclaimerNotice.vue'
import { tools } from '@/data/tools'
import {
  TrendingDown,
  RotateCcw,
  Copy,
  Check,
  AlertCircle,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  Zap,
  CheckCircle2,
  DollarSign
} from '@lucide/vue'

const currentTool = tools.find(t => t.slug === 'debt-payoff-planner')!

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

// Input debts list
const debts = ref<DebtItem[]>([
  { id: '1', name: 'Credit Card A', balance: 4500, apr: 24.99, minimumPayment: 135 },
  { id: '2', name: 'Store Card B', balance: 1200, apr: 19.99, minimumPayment: 40 },
  { id: '3', name: 'Personal Loan', balance: 7500, apr: 9.50, minimumPayment: 175 }
])

const extraMonthlyPayment = ref<number | null>(200)
const selectedStrategy = ref<DebtStrategy>('avalanche')

function addDebt() {
  const newId = String(Date.now())
  debts.value.push({
    id: newId,
    name: `Debt ${debts.value.length + 1}`,
    balance: 1000,
    apr: 18.0,
    minimumPayment: 35
  })
}

function removeDebt(index: number) {
  if (debts.value.length > 1) {
    debts.value.splice(index, 1)
  }
}

function resetForm() {
  debts.value = [
    { id: '1', name: 'Credit Card A', balance: 4500, apr: 24.99, minimumPayment: 135 },
    { id: '2', name: 'Store Card B', balance: 1200, apr: 19.99, minimumPayment: 40 },
    { id: '3', name: 'Personal Loan', balance: 7500, apr: 9.50, minimumPayment: 175 }
  ]
  extraMonthlyPayment.value = 200
  selectedStrategy.value = 'avalanche'
}

const overallResult = computed(() => {
  return calculateDebtPayoff({
    debts: debts.value,
    extraMonthlyPayment: extraMonthlyPayment.value ?? 0,
    strategy: selectedStrategy.value
  })
})

const activeResult = computed(() => overallResult.value.selectedStrategyResult)
const comparison = computed(() => overallResult.value.comparison)

async function handleCopy() {
  const res = activeResult.value
  const comp = comparison.value
  const lines = [
    'Debt Payoff Plan Summary',
    '------------------------',
    `Strategy: ${res.strategyName}`,
    `Total Initial Balance: ${formatCurrency(res.totalInitialBalance, currency.value)}`,
    `Extra Monthly Payment: ${formatCurrency(extraMonthlyPayment.value || 0, currency.value)}`,
    `Debt-Free Horizon: ${res.payoffMonths} months (~${res.debtFreeYears} years)`,
    `Total Interest Paid: ${formatCurrency(res.totalInterestPaid, currency.value)}`,
    `Total Amount Repaid: ${formatCurrency(res.totalAmountRepaid, currency.value)}`,
    `Payoff Sequence: ${res.debtPayoffOrder.join(' -> ')}`,
    '------------------------',
    `Avalanche vs. Snowball Interest Savings: ${formatCurrency(comp.interestSavingsWithAvalanche, currency.value)}`,
    `Months Saved with Avalanche: ${comp.monthsSavedWithAvalanche} months`
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
      { name: 'Credit & Debt', path: '/tools/credit-debt/' },
      { name: 'Debt Payoff Planner' }
    ]" />

    <!-- Page Header -->
    <div class="mb-8">
      <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0F766E] mb-2">
        <TrendingDown class="w-4 h-4" />
        <span>Multi-Debt Repayment Strategy</span>
      </div>
      <h1 class="text-2xl sm:text-4xl font-extrabold text-[#172033] tracking-tight mb-3">
        {{ currentTool.name }}
      </h1>
      <p class="text-base sm:text-lg text-[#667085] max-w-3xl leading-relaxed">
        {{ currentTool.fullDescription }}
      </p>
    </div>

    <!-- Strategy Selection Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      <div
        @click="selectedStrategy = 'avalanche'"
        :class="selectedStrategy === 'avalanche'
          ? 'border-[#0F766E] bg-[#F0FDFA] ring-2 ring-[#0F766E]'
          : 'border-[#E4E7EC] bg-white hover:border-[#CBD5E1]'"
        class="cursor-pointer rounded-2xl p-5 border transition-all"
      >
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <Zap class="w-5 h-5 text-[#0F766E]" />
            <span class="font-bold text-sm text-[#172033]">Debt Avalanche (Highest APR)</span>
          </div>
          <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#0F766E] text-white">
            Mathematically Optimal
          </span>
        </div>
        <p class="text-xs text-[#64748B] leading-relaxed">
          Targets highest-interest debts first. Minimizes lifetime interest paid and helps you become debt-free in the shortest mathematical timeframe.
        </p>
      </div>

      <div
        @click="selectedStrategy = 'snowball'"
        :class="selectedStrategy === 'snowball'
          ? 'border-[#0F766E] bg-[#F0FDFA] ring-2 ring-[#0F766E]'
          : 'border-[#E4E7EC] bg-white hover:border-[#CBD5E1]'"
        class="cursor-pointer rounded-2xl p-5 border transition-all"
      >
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <Sparkles class="w-5 h-5 text-teal-600" />
            <span class="font-bold text-sm text-[#172033]">Debt Snowball (Lowest Balance)</span>
          </div>
          <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-200 text-[#334155]">
            Psychological Wins
          </span>
        </div>
        <p class="text-xs text-[#64748B] leading-relaxed">
          Targets smallest outstanding balances first. Eliminates individual accounts rapidly to generate quick momentum and behavioral motivation.
        </p>
      </div>
    </div>

    <!-- Calculator Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
      <!-- Input Panel: Debts List -->
      <div class="lg:col-span-7 bg-white rounded-2xl border border-[#E4E7EC] p-6 sm:p-7 shadow-xs">
        <div class="flex items-center justify-between pb-4 mb-6 border-b border-[#F2F4F7]">
          <div>
            <h2 class="text-lg font-bold text-[#172033]">Your Debts &amp; Loans</h2>
            <p class="text-xs text-[#64748B]">Add each credit card, personal loan, or auto debt.</p>
          </div>
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

        <form @submit.prevent class="space-y-4">
          <!-- Debts Rows -->
          <div
            v-for="(debt, idx) in debts"
            :key="debt.id"
            class="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] relative space-y-3"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-[#0F766E]">Debt Account #{{ idx + 1 }}</span>
              <button
                v-if="debts.length > 1"
                type="button"
                @click="removeDebt(idx)"
                class="text-xs text-red-500 hover:text-red-700 inline-flex items-center gap-1 font-medium"
              >
                <Trash2 class="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div class="sm:col-span-1">
                <label :for="`debt-name-${idx}`" class="block text-[11px] font-semibold text-[#475569] mb-1">
                  Name / Label
                </label>
                <input
                  :id="`debt-name-${idx}`"
                  v-model="debt.name"
                  type="text"
                  placeholder="e.g. Card A"
                  class="w-full px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>

              <div>
                <label :for="`debt-bal-${idx}`" class="block text-[11px] font-semibold text-[#475569] mb-1">
                  Balance ($)
                </label>
                <input
                  :id="`debt-bal-${idx}`"
                  v-model.number="debt.balance"
                  type="number"
                  min="0"
                  step="50"
                  placeholder="3000"
                  class="w-full px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>

              <div>
                <label :for="`debt-apr-${idx}`" class="block text-[11px] font-semibold text-[#475569] mb-1">
                  APR (%)
                </label>
                <input
                  :id="`debt-apr-${idx}`"
                  v-model.number="debt.apr"
                  type="number"
                  min="0"
                  max="40"
                  step="0.1"
                  placeholder="22.5"
                  class="w-full px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>

              <div>
                <label :for="`debt-min-${idx}`" class="block text-[11px] font-semibold text-[#475569] mb-1">
                  Min Payment ($)
                </label>
                <input
                  :id="`debt-min-${idx}`"
                  v-model.number="debt.minimumPayment"
                  type="number"
                  min="0"
                  step="5"
                  placeholder="75"
                  class="w-full px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>
            </div>
          </div>

          <!-- Add Debt Button -->
          <button
            type="button"
            @click="addDebt"
            class="w-full py-2.5 px-4 rounded-xl border border-dashed border-[#0F766E] text-[#0F766E] hover:bg-[#F0FDFA] transition-colors font-semibold text-xs inline-flex items-center justify-center gap-1.5"
          >
            <Plus class="w-4 h-4" />
            <span>Add Another Debt Account</span>
          </button>

          <!-- Extra Monthly Payment -->
          <div class="pt-4 border-t border-[#F2F4F7]">
            <label for="extra-monthly-plan" class="block text-xs font-semibold text-[#344054] mb-1.5">
              Extra Monthly Payment Available ($)
            </label>
            <div class="relative">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#94A3B8] font-medium">$</span>
              <input
                id="extra-monthly-plan"
                v-model.number="extraMonthlyPayment"
                type="number"
                min="0"
                step="25"
                placeholder="200"
                class="w-full pl-8 pr-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-xl text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              />
            </div>
            <p class="text-[11px] text-[#64748B] mt-1">Extra cash above required minimums applied to accelerate debt elimination.</p>
          </div>
        </form>

        <!-- Negative Amortization / Warnings -->
        <div v-if="activeResult.warningMessages.length > 0" class="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200">
          <div class="flex items-start gap-2.5">
            <AlertCircle class="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div class="text-xs text-amber-900 space-y-1">
              <p class="font-bold">Attention Required:</p>
              <ul class="list-disc pl-4 space-y-0.5">
                <li v-for="(warn, i) in activeResult.warningMessages" :key="i">{{ warn }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Results & Comparison Panel -->
      <div class="lg:col-span-5 flex flex-col justify-between bg-gradient-to-br from-[#0B3B39] to-[#0F766E] rounded-2xl p-6 sm:p-8 text-white shadow-lg">
        <div>
          <div class="flex items-center justify-between pb-4 mb-6 border-b border-white/15">
            <div class="flex items-center gap-2">
              <Calendar class="w-5 h-5 text-[#99F6E4]" />
              <h2 class="text-base sm:text-lg font-bold tracking-tight">Payoff Timeline</h2>
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

          <!-- Hero Time to Freedom -->
          <div class="mb-6">
            <span class="text-xs uppercase tracking-wider text-[#99F6E4] font-semibold">
              Estimated Debt-Free Horizon
            </span>
            <div class="text-3xl sm:text-5xl font-black tracking-tight mt-1">
              {{ activeResult.payoffMonths }} Months
            </div>
            <p class="text-xs text-white/70 mt-1.5">
              Approximately {{ activeResult.debtFreeYears }} years to complete financial freedom.
            </p>
          </div>

          <!-- Avalanche vs Snowball Comparison Box -->
          <div class="mb-6 bg-black/20 rounded-xl p-4 border border-white/10">
            <div class="flex items-center justify-between text-xs mb-2">
              <span class="font-bold text-white uppercase tracking-wider">Strategy Comparison</span>
              <span class="text-[11px] text-[#99F6E4] font-semibold">Avalanche vs Snowball</span>
            </div>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="bg-white/10 p-2.5 rounded-lg">
                <span class="text-white/60 block text-[10px]">Avalanche Interest</span>
                <span class="font-bold text-sm">{{ formatCurrency(comparison.avalanche.totalInterestPaid, currency) }}</span>
                <span class="block text-[10px] text-white/60">{{ comparison.avalanche.payoffMonths }} mo</span>
              </div>
              <div class="bg-white/10 p-2.5 rounded-lg">
                <span class="text-white/60 block text-[10px]">Snowball Interest</span>
                <span class="font-bold text-sm">{{ formatCurrency(comparison.snowball.totalInterestPaid, currency) }}</span>
                <span class="block text-[10px] text-white/60">{{ comparison.snowball.payoffMonths }} mo</span>
              </div>
            </div>
            <div v-if="comparison.interestSavingsWithAvalanche > 5" class="mt-2.5 text-xs text-teal-200 flex items-center gap-1.5">
              <CheckCircle2 class="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Avalanche saves <strong>{{ formatCurrency(comparison.interestSavingsWithAvalanche, currency) }}</strong> in interest!</span>
            </div>
          </div>

          <!-- Metric Cards Grid -->
          <div class="grid grid-cols-2 gap-3 mb-6">
            <div class="bg-white/10 backdrop-blur-xs rounded-xl p-3.5 border border-white/10">
              <div class="flex items-center gap-1.5 text-xs text-[#99F6E4] mb-1">
                <DollarSign class="w-3.5 h-3.5" />
                <span>Total Starting Debt</span>
              </div>
              <div class="text-base sm:text-xl font-bold">
                {{ formatCurrency(activeResult.totalInitialBalance, currency) }}
              </div>
              <span class="text-[11px] text-white/60">Across {{ debts.length }} accounts</span>
            </div>

            <div class="bg-white/10 backdrop-blur-xs rounded-xl p-3.5 border border-white/10">
              <div class="flex items-center gap-1.5 text-xs text-[#99F6E4] mb-1">
                <TrendingDown class="w-3.5 h-3.5" />
                <span>Total Interest Cost</span>
              </div>
              <div class="text-base sm:text-xl font-bold">
                {{ formatCurrency(activeResult.totalInterestPaid, currency) }}
              </div>
              <span class="text-[11px] text-white/60">Lifetime finance fees</span>
            </div>
          </div>

          <!-- Payoff Sequence Order -->
          <div class="bg-white/10 backdrop-blur-xs rounded-xl p-4 border border-white/10 mb-6">
            <h4 class="text-xs font-bold uppercase tracking-wider text-[#99F6E4] mb-2">Target Payoff Sequence</h4>
            <ol class="space-y-1.5 text-xs">
              <li
                v-for="(name, index) in activeResult.debtPayoffOrder"
                :key="index"
                class="flex items-center justify-between"
              >
                <span class="flex items-center gap-2">
                  <span class="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">{{ index + 1 }}</span>
                  <span class="font-medium text-white">{{ name }}</span>
                </span>
                <span class="text-white/60 text-[11px]">Priority #{{ index + 1 }}</span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>

    <!-- Debt-by-Debt Individual Results Table -->
    <div v-if="activeResult.individualResults.length > 0" class="mb-12 bg-white rounded-2xl border border-[#E4E7EC] p-6 shadow-xs">
      <h3 class="text-base font-bold text-[#172033] mb-1">Individual Account Payoff Schedule</h3>
      <p class="text-xs text-[#667085] mb-4">Breakdown of when each individual balance reaches zero under {{ activeResult.strategyName }}.</p>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="border-b border-[#E4E7EC] text-[#64748B] font-semibold bg-[#F8FAFC]">
              <th class="py-2.5 px-3">Account Name</th>
              <th class="py-2.5 px-3">Starting Balance</th>
              <th class="py-2.5 px-3">APR</th>
              <th class="py-2.5 px-3">Payoff Month</th>
              <th class="py-2.5 px-3">Interest Incurred</th>
              <th class="py-2.5 px-3 text-right">Total Repaid</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#F1F5F9] text-[#334155]">
            <tr v-for="debt in activeResult.individualResults" :key="debt.id" class="hover:bg-[#F8FAFC]">
              <td class="py-2.5 px-3 font-semibold text-[#172033]">{{ debt.name }}</td>
              <td class="py-2.5 px-3">{{ formatCurrency(debt.initialBalance, currency) }}</td>
              <td class="py-2.5 px-3">{{ formatPercent(debt.apr) }}</td>
              <td class="py-2.5 px-3 font-medium text-[#0F766E]">Month {{ debt.payoffMonth }} (~{{ (debt.payoffMonth / 12).toFixed(1) }} yrs)</td>
              <td class="py-2.5 px-3 text-red-600 font-medium">{{ formatCurrency(debt.totalInterestPaid, currency) }}</td>
              <td class="py-2.5 px-3 text-right font-semibold">{{ formatCurrency(debt.initialBalance + debt.totalInterestPaid, currency) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Educational Content & Formula Explanation -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
      <div class="bg-white rounded-2xl border border-[#E4E7EC] p-6 shadow-xs">
        <h3 class="text-sm font-bold text-[#172033] uppercase tracking-wider mb-2 text-[#0F766E]">
          How Rollover Accelerates Debt Freedom
        </h3>
        <p class="text-xs text-[#667085] leading-relaxed mb-3">
          When an account is paid off, its minimum monthly payment is not pocketed—it rolls immediately into the next priority debt. Over time, your accelerated payment grows larger like a rolling snowball, rapidly eliminating remaining balances.
        </p>
        <ul class="text-xs text-[#64748B] space-y-1">
          <li><strong>Avalanche:</strong> Minimizes total interest expenses by eradicating highest APR debts first.</li>
          <li><strong>Snowball:</strong> Generates early psychological momentum by eliminating small balance accounts quickly.</li>
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
