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
  AlertCircle 
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

const balance = ref<number | null>(4500)
const apr = ref<number | null>(22.9)
const monthlyPayment = ref<number | null>(200)
const additionalPayment = ref<number | null>(0)
const plannedNewPurchases = ref<number | null>(0)

function resetForm() {
  balance.value = null
  apr.value = null
  monthlyPayment.value = null
  additionalPayment.value = null
  plannedNewPurchases.value = null
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

async function handleCopy() {
  const summary = [
    'Credit Card APR & Payoff Estimate',
    '----------------------------------',
    `Current Balance: ${formatCurrency(balance.value || 0, currency.value)}`,
    `APR: ${formatPercent(apr.value || 0)}`,
    `Total Monthly Payment: ${formatCurrency(result.value.totalMonthlyPayment, currency.value)}`,
    `Estimated First Month Interest: ${formatCurrency(result.value.firstMonthInterest, currency.value)}`,
    `First Month Principal Reduction: ${formatCurrency(result.value.firstMonthPrincipal, currency.value)}`,
    result.value.isPayingOff ? `Payoff Timeline: ${result.value.payoffMonths} months (~${result.value.payoffYears} years)` : 'Payoff: Payment too low to cover interest',
    result.value.isPayingOff ? `Total Interest Cost: ${formatCurrency(result.value.totalInterestPaid, currency.value)}` : ''
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

    <!-- Page Header -->
    <div class="mb-8">
      <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0F766E] mb-2">
        <CreditCard class="w-4 h-4" />
        <span>Borrowing Cost &amp; Interest</span>
      </div>
      <h1 class="text-2xl sm:text-4xl font-extrabold text-[#172033] tracking-tight mb-3">
        {{ currentTool.name }}
      </h1>
      <p class="text-base sm:text-lg text-[#667085] max-w-3xl leading-relaxed">
        {{ currentTool.fullDescription }}
      </p>
    </div>

    <!-- Validation Warning Banner -->
    <div v-if="!result.isValid && result.validationErrors.length > 0" class="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5">
      <div v-for="(err, i) in result.validationErrors" :key="i" class="flex items-center gap-2">
        <AlertCircle class="w-4 h-4 text-amber-600 shrink-0" />
        <span>{{ err }}</span>
      </div>
    </div>

    <!-- Main Calculator Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
      <!-- Input Panel (7 Cols) -->
      <div class="lg:col-span-7 bg-white rounded-2xl border border-[#E4E9F0] p-6 sm:p-8 shadow-sm">
        <div class="flex items-center justify-between pb-5 mb-6 border-b border-[#E4E9F0]">
          <div class="flex items-center gap-3">
            <span class="text-sm font-semibold text-[#172033]">Display Currency:</span>
            <select
              v-model="currency"
              class="text-sm border border-[#E4E9F0] rounded-lg px-2.5 py-1.5 bg-[#F7F9FC] text-[#172033] focus:outline-none focus:border-[#0F766E]"
              aria-label="Currency selection"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>

          <button
            type="button"
            class="inline-flex items-center gap-1.5 text-xs text-[#667085] hover:text-[#172033] py-1.5 px-3 rounded-lg hover:bg-[#F7F9FC] transition-colors"
            @click="resetForm"
          >
            <RotateCcw class="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        <div class="space-y-5">
          <!-- Current Balance -->
          <div>
            <label class="block text-sm font-semibold text-[#172033] mb-1.5">
              Current Card Balance
            </label>
            <div class="relative">
              <span class="absolute left-3.5 top-2.5 text-sm text-[#667085]">{{ currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$' }}</span>
              <input
                v-model.number="balance"
                type="number"
                min="0"
                placeholder="4,500"
                class="w-full pl-8 pr-4 py-2.5 text-base bg-white border border-[#E4E9F0] rounded-xl num-tabular focus:border-[#0F766E]"
              />
            </div>
            <p class="text-xs text-[#667085] mt-1">Outstanding revolving balance from your statement.</p>
          </div>

          <!-- APR -->
          <div>
            <label class="block text-sm font-semibold text-[#172033] mb-1.5">
              Annual Percentage Rate (APR)
            </label>
            <div class="relative">
              <input
                v-model.number="apr"
                type="number"
                min="0"
                step="any"
                placeholder="22.9"
                class="w-full px-4 py-2.5 text-base bg-white border border-[#E4E9F0] rounded-xl num-tabular focus:border-[#0F766E]"
              />
              <span class="absolute right-3.5 top-2.5 text-sm text-[#667085]">%</span>
            </div>
            <p class="text-xs text-[#667085] mt-1">Your card's purchase interest rate (found on your statement or agreement).</p>
          </div>

          <!-- Monthly Payment -->
          <div>
            <label class="block text-sm font-semibold text-[#172033] mb-1.5">
              Planned Monthly Payment Amount
            </label>
            <div class="relative">
              <span class="absolute left-3.5 top-2.5 text-sm text-[#667085]">{{ currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$' }}</span>
              <input
                v-model.number="monthlyPayment"
                type="number"
                min="0"
                placeholder="200"
                class="w-full pl-8 pr-4 py-2.5 text-base bg-white border border-[#E4E9F0] rounded-xl num-tabular focus:border-[#0F766E]"
              />
            </div>
            <p class="text-xs text-[#667085] mt-1">Total dollars you intend to send each billing period.</p>
          </div>

          <!-- Additional monthly and new purchases -->
          <div class="pt-4 border-t border-[#E4E9F0] grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-[#172033] mb-1">
                Extra Monthly Payment (Optional)
              </label>
              <div class="relative">
                <span class="absolute left-3 top-2 text-xs text-[#667085]">{{ currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$' }}</span>
                <input
                  v-model.number="additionalPayment"
                  type="number"
                  min="0"
                  placeholder="0.00"
                  class="w-full pl-7 pr-3 py-2 text-sm bg-[#F7F9FC] border border-[#E4E9F0] rounded-lg num-tabular"
                />
              </div>
              <span class="text-[11px] text-[#667085]">Accelerate debt reduction.</span>
            </div>

            <div>
              <label class="block text-xs font-semibold text-[#172033] mb-1">
                Planned New Purchases / Mo.
              </label>
              <div class="relative">
                <span class="absolute left-3 top-2 text-xs text-[#667085]">{{ currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$' }}</span>
                <input
                  v-model.number="plannedNewPurchases"
                  type="number"
                  min="0"
                  placeholder="0.00"
                  class="w-full pl-7 pr-3 py-2 text-sm bg-[#F7F9FC] border border-[#E4E9F0] rounded-lg num-tabular"
                />
              </div>
              <span class="text-[11px] text-[#667085]">Default 0. New charges increase balance.</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Results Panel (5 Cols) -->
      <div class="lg:col-span-5 bg-white rounded-2xl border border-[#E4E9F0] p-6 sm:p-8 shadow-sm lg:sticky lg:top-24">
        <div class="flex items-center justify-between pb-4 mb-6 border-b border-[#E4E9F0]">
          <h2 class="text-lg font-bold text-[#172033]">Payoff &amp; Interest Estimate</h2>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#E4E9F0] hover:bg-[#F7F9FC] text-[#172033] transition-colors"
            @click="handleCopy"
          >
            <Check v-if="copied" class="w-3.5 h-3.5 text-[#15803D]" />
            <Copy v-else class="w-3.5 h-3.5 text-[#667085]" />
            <span>{{ copied ? 'Copied!' : 'Copy results' }}</span>
          </button>
        </div>

        <!-- Warning Callout if payment too low -->
        <div v-if="!result.isPayingOff" class="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
          <AlertTriangle class="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div class="text-xs leading-relaxed">
            <span class="font-bold">Payment Insufficient: </span>
            {{ result.warningMessage }}
          </div>
        </div>

        <!-- Primary Output Callout -->
        <div v-else class="bg-[#E7F4F1] border border-[#0F766E]/20 rounded-xl p-6 text-center mb-6">
          <div class="text-xs font-semibold uppercase tracking-wider text-[#0F766E] mb-1">
            Estimated Payoff Timeline
          </div>
          <div class="text-3xl sm:text-4xl font-extrabold text-[#172033] num-tabular">
            {{ result.payoffMonths }} Months
          </div>
          <div class="text-xs text-[#667085] mt-1.5">
            Approximately <span class="font-bold text-[#172033]">{{ result.payoffYears }} Years</span> to zero balance
          </div>
        </div>

        <!-- Breakdown List -->
        <dl class="space-y-3.5 text-sm">
          <div class="flex items-center justify-between py-2 border-b border-[#E4E9F0]/60">
            <dt class="text-[#667085]">Estimated First Month Interest</dt>
            <dd class="font-semibold text-[#172033] num-tabular">{{ formatCurrency(result.firstMonthInterest, currency) }}</dd>
          </div>
          <div class="flex items-center justify-between py-2 border-b border-[#E4E9F0]/60">
            <dt class="text-[#667085]">First Month Principal Reduction</dt>
            <dd class="font-semibold text-[#0F766E] num-tabular">{{ formatCurrency(result.firstMonthPrincipal, currency) }}</dd>
          </div>
          <div v-if="result.isPayingOff" class="flex items-center justify-between py-2 border-b border-[#E4E9F0]/60">
            <dt class="text-[#667085]">Total Interest Over Payoff</dt>
            <dd class="font-bold text-[#B42318] num-tabular">{{ formatCurrency(result.totalInterestPaid, currency) }}</dd>
          </div>
          <div v-if="result.isPayingOff" class="flex items-center justify-between py-2 border-b border-[#E4E9F0]/60">
            <dt class="font-medium text-[#172033]">Total Paid (Principal + Interest)</dt>
            <dd class="font-bold text-[#172033] num-tabular">{{ formatCurrency(result.totalAmountPaid, currency) }}</dd>
          </div>
        </dl>

        <div class="mt-6">
          <DisclaimerNotice custom-text="This is an estimate using monthly APR/12 approximation. Card issuers calculate charges daily using average daily balances." />
        </div>
      </div>
    </div>

    <!-- Amortization Schedule Preview Table -->
    <div v-if="result.schedulePreview.length > 0" class="mb-16 bg-white rounded-2xl border border-[#E4E9F0] p-6 sm:p-8">
      <h2 class="text-xl font-bold text-[#172033] mb-2">Estimated Payoff Schedule Breakdown</h2>
      <p class="text-xs text-[#667085] mb-6">
        Review monthly progression showing how interest diminishes as principal is repaid.
      </p>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs sm:text-sm">
          <thead class="bg-[#F7F9FC] text-[#667085] font-semibold border-y border-[#E4E9F0]">
            <tr>
              <th class="py-3 px-4">Period</th>
              <th class="py-3 px-4">Starting Balance</th>
              <th class="py-3 px-4">Interest Charged</th>
              <th class="py-3 px-4">Payment</th>
              <th class="py-3 px-4">Ending Balance</th>
              <th class="py-3 px-4">Cumulative Interest</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#E4E9F0]">
            <tr v-for="item in result.schedulePreview" :key="item.month" class="hover:bg-[#F7F9FC]/50">
              <td class="py-2.5 px-4 font-semibold text-[#172033]">Month {{ item.month }}</td>
              <td class="py-2.5 px-4 num-tabular text-[#667085]">{{ formatCurrency(item.startBalance, currency) }}</td>
              <td class="py-2.5 px-4 num-tabular text-[#B42318] font-medium">{{ formatCurrency(item.interestCharged, currency) }}</td>
              <td class="py-2.5 px-4 num-tabular text-[#0F766E] font-medium">{{ formatCurrency(item.payment, currency) }}</td>
              <td class="py-2.5 px-4 num-tabular text-[#172033] font-semibold">{{ formatCurrency(item.endBalance, currency) }}</td>
              <td class="py-2.5 px-4 num-tabular text-[#667085]">{{ formatCurrency(item.totalInterestSoFar, currency) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Explanatory & Guides -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
      <div class="lg:col-span-8 space-y-10">
        <section class="bg-white rounded-2xl border border-[#E4E9F0] p-6 sm:p-8">
          <h2 class="text-xl font-bold text-[#172033] mb-4">How Credit Card Interest is Modeled</h2>
          <p class="text-sm text-[#667085] leading-relaxed mb-4">
            Under this educational model, annual percentage rate (APR) is divided by 12 to generate a periodic monthly rate. Monthly interest is assessed on the outstanding balance before deducting your scheduled monthly payment.
          </p>
          <div class="bg-[#F7F9FC] border border-[#E4E9F0] p-4 rounded-xl num-tabular text-sm text-[#172033] mb-4 font-mono">
            {{ currentTool.formula }}
          </div>
          <p class="text-sm text-[#667085] leading-relaxed">
            Because interest charges are calculated on remaining debt, each payment you make reduces the principal, thereby decreasing the next month’s finance charge.
          </p>
        </section>

        <!-- Assumptions & Limitations -->
        <section class="bg-white rounded-2xl border border-[#E4E9F0] p-6 sm:p-8">
          <h2 class="text-xl font-bold text-[#172033] mb-4">Assumptions &amp; Limitations</h2>
          <ul class="space-y-2 text-sm text-[#667085] list-disc list-inside leading-relaxed">
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
        <div class="bg-white rounded-2xl border border-[#E4E9F0] p-6">
          <h3 class="text-base font-bold text-[#172033] mb-2">APR vs. Interest Rate</h3>
          <p class="text-xs text-[#667085] leading-relaxed mb-4">
            Understand how daily periodic rates work, what loss of grace period means, and how to verify statement charges.
          </p>
          <RouterLink
            to="/learn/apr-vs-interest-rate/"
            class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F766E] hover:underline"
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
