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
  DollarSign,
  Sliders,
  PieChart
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
    balance: 1500,
    apr: 18.0,
    minimumPayment: 45
  })
}

function removeDebt(index: number) {
  if (debts.value.length > 1) {
    debts.value.splice(index, 1)
  }
}

function setExtra(val: number) {
  extraMonthlyPayment.value = val
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

    <!-- Tool Instrument Header -->
    <div class="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div>
        <div class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0F766E] bg-[#E7F4F1] px-3 py-1 rounded-full mb-2.5">
          <TrendingDown class="w-3.5 h-3.5" />
          <span>Multi-Debt Repayment Console</span>
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

    <!-- Strategy Selection Cards (Interactive Segmented Controller) -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      <div
        @click="selectedStrategy = 'avalanche'"
        :class="selectedStrategy === 'avalanche'
          ? 'border-[#0F766E] bg-[#F0FDFA] ring-2 ring-[#0F766E] shadow-sm'
          : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'"
        class="cursor-pointer rounded-3xl p-5 sm:p-6 border transition-all relative overflow-hidden"
      >
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <Zap class="w-5 h-5 text-[#0F766E]" />
            <span class="font-bold text-base text-[#0F172A]">Debt Avalanche (Highest APR)</span>
          </div>
          <span class="text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-1 rounded-full bg-[#0F766E] text-white shadow-2xs">
            Saves Most Money
          </span>
        </div>
        <p class="text-xs text-[#64748B] leading-relaxed">
          Mathematically optimal: attacks highest-rate debts first to slash compounding interest and accelerate total debt elimination.
        </p>
      </div>

      <div
        @click="selectedStrategy = 'snowball'"
        :class="selectedStrategy === 'snowball'
          ? 'border-[#0F766E] bg-[#F0FDFA] ring-2 ring-[#0F766E] shadow-sm'
          : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'"
        class="cursor-pointer rounded-3xl p-5 sm:p-6 border transition-all relative overflow-hidden"
      >
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <Sparkles class="w-5 h-5 text-teal-600" />
            <span class="font-bold text-base text-[#0F172A]">Debt Snowball (Lowest Balance)</span>
          </div>
          <span class="text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-1 rounded-full bg-slate-200 text-[#334155]">
            Quick Wins
          </span>
        </div>
        <p class="text-xs text-[#64748B] leading-relaxed">
          Behaviorally motivating: knocks out small balances rapidly to deliver early psychological momentum and simplify your bills.
        </p>
      </div>
    </div>

    <!-- Main Instrument Console Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
      <!-- Left Panel: Interactive Debts Manager -->
      <div class="lg:col-span-7 bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
        <div class="flex items-center justify-between pb-4 mb-6 border-b border-[#F1F5F9]">
          <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#475569]">
            <Sliders class="w-4 h-4 text-[#0F766E]" />
            <span>Active Debt Accounts ({{ debts.length }})</span>
          </div>
          <span class="text-[11px] text-[#94A3B8] font-medium">Add all loans &amp; cards</span>
        </div>

        <form @submit.prevent class="space-y-4">
          <!-- Debts Cards -->
          <div
            v-for="(debt, idx) in debts"
            :key="debt.id"
            class="p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] relative space-y-3 shadow-2xs hover:border-[#CBD5E1] transition-all"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-black text-[#0F766E] uppercase tracking-wider flex items-center gap-1.5">
                <span class="w-5 h-5 rounded-full bg-[#E7F4F1] flex items-center justify-center text-[10px] font-bold text-[#0F766E]">{{ idx + 1 }}</span>
                <span>{{ debt.name || `Debt ${idx + 1}` }}</span>
              </span>
              <button
                v-if="debts.length > 1"
                type="button"
                @click="removeDebt(idx)"
                class="text-xs text-red-500 hover:text-red-700 inline-flex items-center gap-1 font-semibold transition-colors"
              >
                <Trash2 class="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div class="sm:col-span-1">
                <label :for="`debt-name-${idx}`" class="block text-[11px] font-bold uppercase tracking-wider text-[#475569] mb-1">
                  Name
                </label>
                <input
                  :id="`debt-name-${idx}`"
                  v-model="debt.name"
                  type="text"
                  placeholder="e.g. Card A"
                  class="w-full px-3 py-2 text-xs font-semibold bg-white border border-[#CBD5E1] rounded-xl text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>

              <div>
                <label :for="`debt-bal-${idx}`" class="block text-[11px] font-bold uppercase tracking-wider text-[#475569] mb-1">
                  Balance ($)
                </label>
                <input
                  :id="`debt-bal-${idx}`"
                  v-model.number="debt.balance"
                  type="number"
                  min="0"
                  step="50"
                  class="w-full px-3 py-2 text-xs font-bold bg-white border border-[#CBD5E1] rounded-xl text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>

              <div>
                <label :for="`debt-apr-${idx}`" class="block text-[11px] font-bold uppercase tracking-wider text-[#475569] mb-1">
                  APR (%)
                </label>
                <input
                  :id="`debt-apr-${idx}`"
                  v-model.number="debt.apr"
                  type="number"
                  min="0"
                  max="40"
                  step="0.1"
                  class="w-full px-3 py-2 text-xs font-bold bg-white border border-[#CBD5E1] rounded-xl text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>

              <div>
                <label :for="`debt-min-${idx}`" class="block text-[11px] font-bold uppercase tracking-wider text-[#475569] mb-1">
                  Min Pay ($)
                </label>
                <input
                  :id="`debt-min-${idx}`"
                  v-model.number="debt.minimumPayment"
                  type="number"
                  min="0"
                  step="5"
                  class="w-full px-3 py-2 text-xs font-bold bg-white border border-[#CBD5E1] rounded-xl text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>
            </div>
          </div>

          <!-- Add Account Button -->
          <button
            type="button"
            @click="addDebt"
            class="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-[#0F766E]/40 text-[#0F766E] hover:bg-[#F0FDFA] hover:border-[#0F766E] transition-all font-bold text-xs inline-flex items-center justify-center gap-2"
          >
            <Plus class="w-4 h-4" />
            <span>Add Another Loan or Credit Card</span>
          </button>

          <!-- Extra Monthly Payment Slider & Presets -->
          <div class="mt-6 pt-6 border-t border-[#F1F5F9] bg-[#F8FAFC] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <label for="extra-monthly-plan" class="text-xs font-bold uppercase tracking-wider text-[#334155] flex items-center gap-1.5">
                  <Sparkles class="w-3.5 h-3.5 text-teal-600" />
                  <span>Extra Monthly Repayment Budget</span>
                </label>
                <p class="text-[11px] text-[#64748B]">Cash above minimums to accelerate freedom</p>
              </div>
              <div class="relative w-32">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#94A3B8]">$</span>
                <input
                  id="extra-monthly-plan"
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
              max="1500"
              step="25"
              :value="extraMonthlyPayment || 0"
              @input="extraMonthlyPayment = Number(($event.target as HTMLInputElement).value)"
              class="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#0F766E]"
            />

            <!-- Presets -->
            <div class="flex flex-wrap items-center gap-1.5 pt-1">
              <span class="text-[11px] font-semibold text-[#94A3B8] mr-1">Presets:</span>
              <button
                v-for="amt in [0, 50, 100, 200, 500]"
                :key="amt"
                type="button"
                @click="setExtra(amt)"
                :class="extraMonthlyPayment === amt ? 'bg-[#0F766E] text-white' : 'bg-white text-[#475569] hover:bg-[#E2E8F0]'"
                class="text-[11px] font-bold px-2.5 py-1 rounded-md border border-[#CBD5E1] transition-colors"
              >
                +${{ amt }}
              </button>
            </div>
          </div>
        </form>

        <!-- Warnings Banner -->
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

      <!-- Right Panel: High-Impact Financial HUD / Result Console -->
      <div class="lg:col-span-5 flex flex-col justify-between bg-gradient-to-br from-[#0B3B39] via-[#0F766E] to-[#115E59] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div class="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>

        <div class="relative z-10">
          <!-- Console Top Status -->
          <div class="flex items-center justify-between pb-4 mb-6 border-b border-white/15">
            <div class="flex items-center gap-2">
              <Calendar class="w-4 h-4 text-[#99F6E4]" />
              <span class="text-xs font-bold uppercase tracking-wider text-[#99F6E4]">Debt-Free Horizon</span>
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

          <!-- Hero Time to Freedom Display -->
          <div class="mb-6">
            <span class="text-xs uppercase tracking-wider text-white/70 font-semibold block mb-1">
              Estimated Debt-Free Timeline
            </span>
            <div class="text-4xl sm:text-5xl font-black tracking-tight text-white flex items-baseline gap-2">
              <span>{{ activeResult.payoffMonths }}</span>
              <span class="text-sm font-semibold text-[#99F6E4]">Months</span>
            </div>
            <p class="text-xs text-[#99F6E4] mt-2">
              Approximately <strong>{{ activeResult.debtFreeYears }} years</strong> to completely eliminate all {{ debts.length }} accounts.
            </p>
          </div>

          <!-- Strategy Head-to-Head Comparison Box -->
          <div class="mb-6 bg-black/25 rounded-2xl p-4 border border-white/10">
            <div class="flex items-center justify-between text-xs mb-2">
              <span class="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <PieChart class="w-3.5 h-3.5 text-[#99F6E4]" />
                <span>Avalanche vs. Snowball</span>
              </span>
              <span class="text-[11px] text-[#99F6E4] font-bold">Side-by-Side</span>
            </div>

            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="bg-white/10 p-3 rounded-xl border border-white/5">
                <span class="text-white/70 block text-[10px] font-semibold">Avalanche (APR)</span>
                <span class="font-black text-sm block mt-0.5">{{ formatCurrency(comparison.avalanche.totalInterestPaid, currency) }}</span>
                <span class="block text-[10px] text-teal-200 mt-0.5">{{ comparison.avalanche.payoffMonths }} months</span>
              </div>
              <div class="bg-white/10 p-3 rounded-xl border border-white/5">
                <span class="text-white/70 block text-[10px] font-semibold">Snowball (Balance)</span>
                <span class="font-black text-sm block mt-0.5">{{ formatCurrency(comparison.snowball.totalInterestPaid, currency) }}</span>
                <span class="block text-[10px] text-teal-200 mt-0.5">{{ comparison.snowball.payoffMonths }} months</span>
              </div>
            </div>

            <div v-if="comparison.interestSavingsWithAvalanche > 5" class="mt-3 text-xs text-emerald-200 flex items-center gap-1.5 bg-emerald-500/20 p-2.5 rounded-xl border border-emerald-400/30">
              <CheckCircle2 class="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Avalanche saves <strong class="text-white">{{ formatCurrency(comparison.interestSavingsWithAvalanche, currency) }}</strong> in interest charges!</span>
            </div>
          </div>

          <!-- Secondary Metric HUD Grid -->
          <div class="grid grid-cols-2 gap-3 mb-6">
            <div class="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
              <div class="flex items-center gap-1.5 text-xs text-[#99F6E4] mb-1">
                <DollarSign class="w-3.5 h-3.5" />
                <span>Starting Debt</span>
              </div>
              <div class="text-lg sm:text-xl font-black">
                {{ formatCurrency(activeResult.totalInitialBalance, currency) }}
              </div>
              <span class="text-[10px] text-white/60">Across {{ debts.length }} loans</span>
            </div>

            <div class="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
              <div class="flex items-center gap-1.5 text-xs text-amber-300 mb-1">
                <TrendingDown class="w-3.5 h-3.5" />
                <span>Total Interest</span>
              </div>
              <div class="text-lg sm:text-xl font-black text-amber-200">
                {{ formatCurrency(activeResult.totalInterestPaid, currency) }}
              </div>
              <span class="text-[10px] text-white/60">Financing cost</span>
            </div>
          </div>

          <!-- Target Payoff Sequence Order -->
          <div class="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
            <h4 class="text-xs font-bold uppercase tracking-wider text-[#99F6E4] mb-2.5">Priority Payoff Order</h4>
            <ol class="space-y-2 text-xs">
              <li
                v-for="(name, index) in activeResult.debtPayoffOrder"
                :key="index"
                class="flex items-center justify-between"
              >
                <span class="flex items-center gap-2">
                  <span class="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">{{ index + 1 }}</span>
                  <span class="font-bold text-white">{{ name }}</span>
                </span>
                <span class="text-white/70 text-[11px] font-semibold">Priority #{{ index + 1 }}</span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>

    <!-- Individual Account Payoff Schedule Table -->
    <div v-if="activeResult.individualResults.length > 0" class="mb-12 bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
      <h3 class="text-lg font-bold text-[#0F172A] mb-1">Individual Account Payoff Milestones</h3>
      <p class="text-xs text-[#64748B] mb-4">When each account reaches zero balance under {{ activeResult.strategyName }}.</p>
      <div class="overflow-x-auto border border-[#E2E8F0] rounded-2xl">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="border-b border-[#E2E8F0] text-[#64748B] font-bold bg-[#F8FAFC]">
              <th class="py-3 px-4">Account Name</th>
              <th class="py-3 px-4">Initial Balance</th>
              <th class="py-3 px-4">APR</th>
              <th class="py-3 px-4">Payoff Month</th>
              <th class="py-3 px-4">Interest Paid</th>
              <th class="py-3 px-4 text-right">Total Repaid</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#F1F5F9] text-[#334155]">
            <tr v-for="debt in activeResult.individualResults" :key="debt.id" class="hover:bg-[#F8FAFC] transition-colors">
              <td class="py-2.5 px-4 font-bold text-[#0F172A]">{{ debt.name }}</td>
              <td class="py-2.5 px-4 font-medium">{{ formatCurrency(debt.initialBalance, currency) }}</td>
              <td class="py-2.5 px-4 font-semibold">{{ formatPercent(debt.apr) }}</td>
              <td class="py-2.5 px-4 font-bold text-[#0F766E]">Month {{ debt.payoffMonth }} (~{{ (debt.payoffMonth / 12).toFixed(1) }} yrs)</td>
              <td class="py-2.5 px-4 text-amber-700 font-semibold">{{ formatCurrency(debt.totalInterestPaid, currency) }}</td>
              <td class="py-2.5 px-4 text-right font-bold">{{ formatCurrency(debt.initialBalance + debt.totalInterestPaid, currency) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Educational Content & Formula Explanation -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
      <div class="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-7 shadow-xs">
        <h3 class="text-xs font-bold text-[#0F766E] uppercase tracking-wider mb-2">
          How Rollover Accelerates Debt Freedom
        </h3>
        <p class="text-xs text-[#64748B] leading-relaxed mb-3">
          When an account is paid off, its minimum monthly payment is not pocketed—it rolls immediately into the next priority debt. Over time, your accelerated payment grows larger like a rolling snowball, rapidly eliminating remaining balances.
        </p>
        <ul class="text-xs text-[#64748B] space-y-1">
          <li><strong>Avalanche:</strong> Minimizes total interest expenses by eradicating highest APR debts first.</li>
          <li><strong>Snowball:</strong> Generates early psychological momentum by eliminating small balance accounts quickly.</li>
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
