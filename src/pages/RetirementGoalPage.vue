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
  CheckCircle2
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

    <!-- Page Header -->
    <div class="mb-8">
      <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0F766E] mb-2">
        <Target class="w-4 h-4" />
        <span>Retirement Planning</span>
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
          <h2 class="text-lg font-bold text-[#172033]">Retirement Target Inputs</h2>
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
          <!-- Current Savings & Target Amount -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label for="current-savings" class="block text-xs font-semibold text-[#344054] mb-1.5">
                Current Retirement Savings
              </label>
              <div class="relative">
                <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#94A3B8] font-medium">$</span>
                <input
                  id="current-savings"
                  v-model.number="currentSavings"
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="50000"
                  class="w-full pl-8 pr-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-xl text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:border-transparent"
                />
              </div>
              <p class="text-[11px] text-[#64748B] mt-1">Existing 401(k), IRA, or brokerage assets.</p>
            </div>

            <div>
              <label for="target-amount" class="block text-xs font-semibold text-[#344054] mb-1.5">
                Target Retirement Amount
              </label>
              <div class="relative">
                <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#94A3B8] font-medium">$</span>
                <input
                  id="target-amount"
                  v-model.number="targetAmount"
                  type="number"
                  min="0"
                  step="50000"
                  placeholder="1000000"
                  class="w-full pl-8 pr-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-xl text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:border-transparent"
                />
              </div>
              <p class="text-[11px] text-[#64748B] mt-1">Desired portfolio balance at retirement.</p>
            </div>
          </div>

          <!-- Ages -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label for="current-age" class="block text-xs font-semibold text-[#344054] mb-1.5">
                Current Age (Optional)
              </label>
              <input
                id="current-age"
                v-model.number="currentAge"
                type="number"
                min="18"
                max="90"
                placeholder="35"
                class="w-full px-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-xl text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:border-transparent"
              />
              <p class="text-[11px] text-[#64748B] mt-1">Helps show years until retirement.</p>
            </div>

            <div>
              <label for="retirement-age" class="block text-xs font-semibold text-[#344054] mb-1.5">
                Target Retirement Age
              </label>
              <input
                id="retirement-age"
                v-model.number="retirementAge"
                type="number"
                min="20"
                max="100"
                placeholder="65"
                class="w-full px-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-xl text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:border-transparent"
              />
              <p class="text-[11px] text-[#64748B] mt-1">Target age to cease regular contributions.</p>
            </div>
          </div>

          <!-- Expected Return & Contribution Frequency -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label for="expected-return" class="block text-xs font-semibold text-[#344054] mb-1.5">
                Expected Annual Return (%)
              </label>
              <div class="relative">
                <input
                  id="expected-return"
                  v-model.number="expectedAnnualReturn"
                  type="number"
                  min="0"
                  max="25"
                  step="0.1"
                  placeholder="7.0"
                  class="w-full pl-3.5 pr-8 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-xl text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:border-transparent"
                />
                <span class="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-[#94A3B8] font-medium">%</span>
              </div>
              <p class="text-[11px] text-[#64748B] mt-1">Historical US stock/bond mix ~6-8%.</p>
            </div>

            <div>
              <label for="contribution-frequency" class="block text-xs font-semibold text-[#344054] mb-1.5">
                Contribution Frequency
              </label>
              <select
                id="contribution-frequency"
                v-model="contributionFrequency"
                class="w-full px-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-xl text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:border-transparent"
              >
                <option value="monthly">Monthly Deposits</option>
                <option value="annually">Annual Deposits</option>
              </select>
              <p class="text-[11px] text-[#64748B] mt-1">Schedule for recurring additions.</p>
            </div>
          </div>

          <!-- Timing & Step-Up -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label for="contribution-timing" class="block text-xs font-semibold text-[#344054] mb-1.5">
                Contribution Timing
              </label>
              <select
                id="contribution-timing"
                v-model="contributionTiming"
                class="w-full px-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-xl text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:border-transparent"
              >
                <option value="end">End of Period (Ordinary Annuity)</option>
                <option value="beginning">Beginning of Period (Annuity Due)</option>
              </select>
              <p class="text-[11px] text-[#64748B] mt-1">Beginning deposits compound an extra period.</p>
            </div>

            <div>
              <label for="step-up-pct" class="block text-xs font-semibold text-[#344054] mb-1.5">
                Annual Contribution Step-Up (%)
              </label>
              <div class="relative">
                <input
                  id="step-up-pct"
                  v-model.number="annualContributionIncreasePct"
                  type="number"
                  min="0"
                  max="15"
                  step="0.5"
                  placeholder="0"
                  class="w-full pl-3.5 pr-8 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-xl text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:border-transparent"
                />
                <span class="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-[#94A3B8] font-medium">%</span>
              </div>
              <p class="text-[11px] text-[#64748B] mt-1">Annual salary raise / savings escalator.</p>
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

      <!-- Results Panel -->
      <div class="lg:col-span-6 flex flex-col justify-between bg-gradient-to-br from-[#0B3B39] to-[#0F766E] rounded-2xl p-6 sm:p-8 text-white shadow-lg">
        <div>
          <div class="flex items-center justify-between pb-4 mb-6 border-b border-white/15">
            <div class="flex items-center gap-2">
              <PiggyBank class="w-5 h-5 text-[#99F6E4]" />
              <h2 class="text-base sm:text-lg font-bold tracking-tight">Required Contribution</h2>
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

          <!-- Highlight Status -->
          <div v-if="result.alreadyAchieved" class="mb-6 p-4 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-100 flex items-start gap-3">
            <CheckCircle2 class="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
            <div>
              <p class="font-bold text-sm text-white">Target Already Achieved!</p>
              <p class="text-xs text-emerald-100 mt-0.5 leading-relaxed">
                At {{ expectedAnnualReturn }}% return, your current savings of {{ formatCurrency(currentSavings || 0, currency) }} will grow to reach or exceed your target of {{ formatCurrency(targetAmount || 0, currency) }} without requiring any additional periodic contributions.
              </p>
            </div>
          </div>

          <!-- Primary Hero Metrics -->
          <div class="mb-6">
            <span class="text-xs uppercase tracking-wider text-[#99F6E4] font-semibold">
              {{ contributionFrequency === 'monthly' ? 'Required Monthly Contribution' : 'Required Annual Contribution' }}
            </span>
            <div class="text-3xl sm:text-5xl font-black tracking-tight mt-1">
              {{ formatCurrency(contributionFrequency === 'monthly' ? result.requiredMonthlyContribution : result.requiredAnnualContribution, currency) }}
            </div>
            <p class="text-xs text-white/70 mt-1.5">
              {{ contributionFrequency === 'monthly'
                ? `Equivalent to ${formatCurrency(result.requiredAnnualContribution, currency)} per year`
                : `Equivalent to ${formatCurrency(result.requiredMonthlyContribution, currency)} per month` }}
            </p>
          </div>

          <!-- Progress toward target -->
          <div class="mb-6 bg-black/15 p-4 rounded-xl border border-white/10">
            <div class="flex justify-between items-center text-xs mb-2">
              <span class="font-medium text-white/80">Current Savings Coverage</span>
              <span class="font-bold text-[#99F6E4]">{{ result.progressTowardTarget.toFixed(1) }}% of target</span>
            </div>
            <div class="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
              <div
                class="bg-emerald-400 h-2.5 rounded-full transition-all duration-500"
                :style="{ width: `${Math.min(100, result.progressTowardTarget)}%` }"
              ></div>
            </div>
          </div>

          <!-- Breakdown Metric Cards -->
          <div class="grid grid-cols-2 gap-3 mb-6">
            <div class="bg-white/10 backdrop-blur-xs rounded-xl p-3.5 border border-white/10">
              <div class="flex items-center gap-1.5 text-xs text-[#99F6E4] mb-1">
                <DollarSign class="w-3.5 h-3.5" />
                <span>Personal Contributions</span>
              </div>
              <div class="text-base sm:text-xl font-bold">
                {{ formatCurrency(result.totalPersonalContributions, currency) }}
              </div>
              <span class="text-[11px] text-white/60">Deposited out of pocket</span>
            </div>

            <div class="bg-white/10 backdrop-blur-xs rounded-xl p-3.5 border border-white/10">
              <div class="flex items-center gap-1.5 text-xs text-[#99F6E4] mb-1">
                <TrendingUp class="w-3.5 h-3.5" />
                <span>Estimated Growth</span>
              </div>
              <div class="text-base sm:text-xl font-bold">
                {{ formatCurrency(result.estimatedInvestmentGrowth, currency) }}
              </div>
              <span class="text-[11px] text-white/60">Compound market earnings</span>
            </div>

            <div class="bg-white/10 backdrop-blur-xs rounded-xl p-3.5 border border-white/10">
              <div class="flex items-center gap-1.5 text-xs text-[#99F6E4] mb-1">
                <Calendar class="w-3.5 h-3.5" />
                <span>Accumulation Horizon</span>
              </div>
              <div class="text-base sm:text-xl font-bold">
                {{ result.yearsToRetirement }} Years
              </div>
              <span class="text-[11px] text-white/60">{{ result.numberOfPeriods }} contribution cycles</span>
            </div>

            <div class="bg-white/10 backdrop-blur-xs rounded-xl p-3.5 border border-white/10">
              <div class="flex items-center gap-1.5 text-xs text-[#99F6E4] mb-1">
                <Target class="w-3.5 h-3.5" />
                <span>Final Projected Total</span>
              </div>
              <div class="text-base sm:text-xl font-bold">
                {{ formatCurrency(result.projectedFinalBalance, currency) }}
              </div>
              <span class="text-[11px] text-white/60">Meets or matches goal</span>
            </div>
          </div>
        </div>

        <!-- Toggle Schedule Button -->
        <button
          type="button"
          @click="showSchedule = !showSchedule"
          class="w-full py-2.5 px-4 text-xs font-semibold rounded-xl bg-white text-[#0B3B39] hover:bg-[#F0FDFA] transition-colors text-center"
        >
          {{ showSchedule ? 'Hide Annual Accumulation Schedule' : 'View Annual Accumulation Schedule' }}
        </button>
      </div>
    </div>

    <!-- Annual Accumulation Schedule Table -->
    <div v-if="showSchedule && result.yearlyBreakdown.length > 0" class="mb-12 bg-white rounded-2xl border border-[#E4E7EC] p-6 shadow-xs">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-base font-bold text-[#172033]">Year-by-Year Savings &amp; Growth Schedule</h3>
          <p class="text-xs text-[#667085] mt-0.5">Projected balance expansion assuming consistent periodic deposits and steady {{ expectedAnnualReturn }}% returns.</p>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="border-b border-[#E4E7EC] text-[#64748B] font-semibold bg-[#F8FAFC]">
              <th class="py-2.5 px-3">Year</th>
              <th v-if="currentAge" class="py-2.5 px-3">Age</th>
              <th class="py-2.5 px-3">Starting Balance</th>
              <th class="py-2.5 px-3">Yearly Contributions</th>
              <th class="py-2.5 px-3">Interest Earned</th>
              <th class="py-2.5 px-3">Ending Balance</th>
              <th class="py-2.5 px-3 text-right">Cumulative Growth</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#F1F5F9] text-[#334155]">
            <tr v-for="row in result.yearlyBreakdown" :key="row.year" class="hover:bg-[#F8FAFC]">
              <td class="py-2 px-3 font-medium text-[#0F766E]">Year {{ row.year }}</td>
              <td v-if="currentAge" class="py-2 px-3">{{ row.age }}</td>
              <td class="py-2 px-3">{{ formatCurrency(row.startingBalance, currency) }}</td>
              <td class="py-2 px-3 text-emerald-700">+{{ formatCurrency(row.contributions, currency) }}</td>
              <td class="py-2 px-3 text-teal-700">+{{ formatCurrency(row.interestEarned, currency) }}</td>
              <td class="py-2 px-3 font-semibold text-[#172033]">{{ formatCurrency(row.endingBalance, currency) }}</td>
              <td class="py-2 px-3 text-right font-medium text-[#64748B]">{{ formatCurrency(row.totalInterestSoFar, currency) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Educational Content & Formula Explanation -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
      <div class="bg-white rounded-2xl border border-[#E4E7EC] p-6 shadow-xs">
        <h3 class="text-sm font-bold text-[#172033] uppercase tracking-wider mb-2 text-[#0F766E]">
          Mathematical Formula
        </h3>
        <p class="text-xs text-[#667085] leading-relaxed mb-3">
          This calculator uses the sinking fund ordinary annuity formula to determine the regular deposit PMT required to bridge the shortfall between the future value of current savings and your target amount:
        </p>
        <div class="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#CBD5E1] font-mono text-xs text-[#1E293B] overflow-x-auto mb-3">
          PMT = [FV − PV(1+r)^n] × [r ÷ ((1+r)^n − 1)]
        </div>
        <ul class="text-xs text-[#64748B] space-y-1">
          <li><strong>FV:</strong> Target retirement nest egg</li>
          <li><strong>PV:</strong> Current retirement savings balance</li>
          <li><strong>r:</strong> Periodic interest rate (Annual Return ÷ 12 for monthly)</li>
          <li><strong>n:</strong> Total number of compounding periods</li>
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
