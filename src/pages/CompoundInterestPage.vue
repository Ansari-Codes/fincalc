<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { updatePageSeo } from '@/utils/seo'
import { generateCalculatorSchema } from '@/utils/structuredData'
import { formatCurrency, formatPercent, copyToClipboard } from '@/utils/formatters'
import { 
  calculateCompoundInterest, 
  type CompoundingFrequency, 
  type ContributionFrequency, 
  type ContributionTiming 
} from '@/calculations/compoundInterest'
import Breadcrumbs from '@/components/ui/Breadcrumbs.vue'
import FAQAccordion from '@/components/ui/FAQAccordion.vue'
import RelatedTools from '@/components/ui/RelatedTools.vue'
import DisclaimerNotice from '@/components/ui/DisclaimerNotice.vue'
import { tools } from '@/data/tools'
import { 
  LineChart, 
  RotateCcw, 
  Copy, 
  Check, 
  ArrowRight,
  AlertCircle 
} from '@lucide/vue'

const currentTool = tools.find(t => t.slug === 'compound-interest-calculator')!

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

const initialPrincipal = ref<number | null>(10000)
const contributionAmount = ref<number | null>(500)
const contributionFrequency = ref<ContributionFrequency>('monthly')
const annualInterestRate = ref<number | null>(7.5)
const compoundingFrequency = ref<CompoundingFrequency>('monthly')
const years = ref<number | null>(20)
const contributionTiming = ref<ContributionTiming>('end')

function resetForm() {
  initialPrincipal.value = null
  contributionAmount.value = null
  annualInterestRate.value = null
  years.value = null
}

const result = computed(() => {
  return calculateCompoundInterest({
    initialPrincipal: initialPrincipal.value || 0,
    contributionAmount: contributionAmount.value || 0,
    contributionFrequency: contributionFrequency.value,
    annualInterestRate: annualInterestRate.value || 0,
    compoundingFrequency: compoundingFrequency.value,
    years: years.value || 1,
    contributionTiming: contributionTiming.value
  })
})

async function handleCopy() {
  const summary = [
    'Compound Interest Projection',
    '------------------------------',
    `Initial Principal: ${formatCurrency(initialPrincipal.value || 0, currency.value)}`,
    `Regular Contribution: ${formatCurrency(contributionAmount.value || 0, currency.value)} (${contributionFrequency.value})`,
    `Annual Growth Rate: ${formatPercent(annualInterestRate.value || 0)}`,
    `Compounding Frequency: ${compoundingFrequency.value}`,
    `Investment Horizon: ${years.value} Years`,
    `Estimated Future Value: ${formatCurrency(result.value.futureValue, currency.value)}`,
    `Total Principal & Additions: ${formatCurrency(result.value.totalPrincipal + result.value.totalContributions, currency.value)}`,
    `Total Compound Interest Earned: ${formatCurrency(result.value.totalInterestEarned, currency.value)}`
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
      { name: 'Investing', path: '/tools/investing/' },
      { name: 'Compound Interest Calculator' }
    ]" />

    <!-- Page Header -->
    <div class="mb-8">
      <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0F766E] mb-2">
        <LineChart class="w-4 h-4" />
        <span>Long-Term Wealth Accumulation</span>
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
          <!-- Initial Principal -->
          <div>
            <label class="block text-sm font-semibold text-[#172033] mb-1.5">
              Initial Principal Deposit
            </label>
            <div class="relative">
              <span class="absolute left-3.5 top-2.5 text-sm text-[#667085]">{{ currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$' }}</span>
              <input
                v-model.number="initialPrincipal"
                type="number"
                min="0"
                placeholder="10,000"
                class="w-full pl-8 pr-4 py-2.5 text-base bg-white border border-[#E4E9F0] rounded-xl num-tabular focus:border-[#0F766E]"
              />
            </div>
            <p class="text-xs text-[#667085] mt-1">Starting balance before future regular contributions.</p>
          </div>

          <!-- Recurring Contributions -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-[#172033] mb-1.5">
                Regular Contribution
              </label>
              <div class="relative">
                <span class="absolute left-3.5 top-2.5 text-sm text-[#667085]">{{ currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$' }}</span>
                <input
                  v-model.number="contributionAmount"
                  type="number"
                  min="0"
                  placeholder="500"
                  class="w-full pl-8 pr-4 py-2.5 text-base bg-white border border-[#E4E9F0] rounded-xl num-tabular focus:border-[#0F766E]"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-semibold text-[#172033] mb-1.5">
                Contribution Frequency
              </label>
              <select
                v-model="contributionFrequency"
                class="w-full px-3 py-2.5 text-base bg-white border border-[#E4E9F0] rounded-xl text-[#172033] focus:border-[#0F766E]"
              >
                <option value="monthly">Monthly</option>
                <option value="annually">Annually</option>
              </select>
            </div>
          </div>

          <!-- Interest Rate & Years -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-[#172033] mb-1.5">
                Annual Interest Rate (%)
              </label>
              <div class="relative">
                <input
                  v-model.number="annualInterestRate"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="7.5"
                  class="w-full px-4 py-2.5 text-base bg-white border border-[#E4E9F0] rounded-xl num-tabular focus:border-[#0F766E]"
                />
                <span class="absolute right-3.5 top-2.5 text-sm text-[#667085]">%</span>
              </div>
            </div>

            <div>
              <label class="block text-sm font-semibold text-[#172033] mb-1.5">
                Investment Horizon (Years)
              </label>
              <input
                v-model.number="years"
                type="number"
                min="1"
                max="100"
                placeholder="20"
                class="w-full px-4 py-2.5 text-base bg-white border border-[#E4E9F0] rounded-xl num-tabular focus:border-[#0F766E]"
              />
            </div>
          </div>

          <!-- Compounding Frequency & Timing -->
          <div class="pt-4 border-t border-[#E4E9F0] grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-[#172033] mb-1">
                Compounding Frequency
              </label>
              <select
                v-model="compoundingFrequency"
                class="w-full px-3 py-2 text-sm bg-[#F7F9FC] border border-[#E4E9F0] rounded-lg text-[#172033]"
              >
                <option value="daily">Daily (365 times/year)</option>
                <option value="monthly">Monthly (12 times/year)</option>
                <option value="quarterly">Quarterly (4 times/year)</option>
                <option value="annually">Annually (1 time/year)</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-[#172033] mb-1">
                Contribution Timing
              </label>
              <select
                v-model="contributionTiming"
                class="w-full px-3 py-2 text-sm bg-[#F7F9FC] border border-[#E4E9F0] rounded-lg text-[#172033]"
              >
                <option value="end">End of each period</option>
                <option value="beginning">Beginning of each period</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Results Panel (5 Cols) -->
      <div class="lg:col-span-5 bg-white rounded-2xl border border-[#E4E9F0] p-6 sm:p-8 shadow-sm lg:sticky lg:top-24">
        <div class="flex items-center justify-between pb-4 mb-6 border-b border-[#E4E9F0]">
          <h2 class="text-lg font-bold text-[#172033]">Projected Growth</h2>
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

        <!-- Primary Output Callout -->
        <div class="bg-[#E7F4F1] border border-[#0F766E]/20 rounded-xl p-6 text-center mb-6">
          <div class="text-xs font-semibold uppercase tracking-wider text-[#0F766E] mb-1">
            Estimated Future Value
          </div>
          <div class="text-3xl sm:text-4xl font-extrabold text-[#172033] num-tabular">
            {{ formatCurrency(result.futureValue, currency) }}
          </div>
          <div class="text-xs text-[#667085] mt-1.5">
            After {{ years }} years at {{ annualInterestRate }}% annual rate
          </div>
        </div>

        <!-- Metric Details -->
        <dl class="space-y-3.5 text-sm">
          <div class="flex items-center justify-between py-2 border-b border-[#E4E9F0]/60">
            <dt class="text-[#667085]">Starting Principal</dt>
            <dd class="font-semibold text-[#172033] num-tabular">{{ formatCurrency(result.totalPrincipal, currency) }}</dd>
          </div>
          <div class="flex items-center justify-between py-2 border-b border-[#E4E9F0]/60">
            <dt class="text-[#667085]">Total Additional Contributions</dt>
            <dd class="font-semibold text-[#172033] num-tabular">{{ formatCurrency(result.totalContributions, currency) }}</dd>
          </div>
          <div class="flex items-center justify-between py-2 border-b border-[#E4E9F0]/60">
            <dt class="text-[#667085]">Total Principal Contributed</dt>
            <dd class="font-semibold text-[#172033] num-tabular">{{ formatCurrency(result.totalPrincipal + result.totalContributions, currency) }}</dd>
          </div>
          <div class="flex items-center justify-between py-2 border-b border-[#E4E9F0]/60">
            <dt class="font-semibold text-[#0F766E]">Total Compound Interest Earned</dt>
            <dd class="font-bold text-base text-[#0F766E] num-tabular">{{ formatCurrency(result.totalInterestEarned, currency) }}</dd>
          </div>
        </dl>

        <div class="mt-6">
          <DisclaimerNotice />
        </div>
      </div>
    </div>

    <!-- Visual Chart & Year-By-Year Table -->
    <div class="mb-16 bg-white rounded-2xl border border-[#E4E9F0] p-6 sm:p-8">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
        <div>
          <h2 class="text-xl font-bold text-[#172033]">Growth Trajectory &amp; Year-By-Year Breakdown</h2>
          <p class="text-xs text-[#667085]">Visualize how interest overtakes annual contributions over time.</p>
        </div>
        <div class="flex items-center gap-4 text-xs font-semibold">
          <div class="flex items-center gap-1.5 text-[#667085]">
            <span class="w-3 h-3 rounded-full bg-[#CBD5E1]"></span>
            <span>Total Contributed</span>
          </div>
          <div class="flex items-center gap-1.5 text-[#0F766E]">
            <span class="w-3 h-3 rounded-full bg-[#0F766E]"></span>
            <span>Interest Earned</span>
          </div>
        </div>
      </div>

      <!-- Accessible SVG Chart -->
      <div 
        role="img" 
        :aria-label="`Compound growth trajectory chart showing total principal versus accumulated interest over ${years} years. A complete data table follows below.`"
        class="w-full h-48 sm:h-64 mb-8 relative border-b border-l border-[#E4E9F0] flex items-end justify-between px-2 pt-6"
      >
        <span class="sr-only">Growth chart showing portfolio value scaling from initial principal to {{ formatCurrency(result.futureValue, currency) }}.</span>
        <div
          v-for="item in result.yearlyBreakdown.filter((_, i) => result.yearlyBreakdown.length <= 15 || i % Math.ceil(result.yearlyBreakdown.length / 15) === 0 || i === result.yearlyBreakdown.length - 1)"
          :key="item.year"
          class="flex-1 max-w-[40px] flex flex-col items-center justify-end h-full group relative"
          :aria-label="`Year ${item.year}: Ending balance ${formatCurrency(item.endingBalance, currency)}, Cumulative interest ${formatCurrency(item.totalInterestSoFar, currency)}`"
        >
          <!-- Tooltip on hover -->
          <div class="absolute -top-12 hidden group-hover:block bg-[#172033] text-white text-[10px] py-1 px-2 rounded shadow whitespace-nowrap z-10 num-tabular">
            Year {{ item.year }}: {{ formatCurrency(item.endingBalance, currency) }}
          </div>

          <!-- Stacked Bar -->
          <div class="w-3 sm:w-5 flex flex-col justify-end h-full">
            <div
              class="w-full bg-[#0F766E] rounded-t-sm"
              :style="{ height: `${result.futureValue > 0 ? (item.totalInterestSoFar / result.futureValue) * 100 : 0}%` }"
            ></div>
            <div
              class="w-full bg-[#94A3B8]"
              :style="{ height: `${result.futureValue > 0 ? (item.totalContributionsSoFar / result.futureValue) * 100 : 0}%` }"
            ></div>
          </div>
          <span class="text-[10px] text-[#667085] mt-2 num-tabular">Y{{ item.year }}</span>
        </div>
      </div>

      <!-- Year-by-Year Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs sm:text-sm">
          <thead class="bg-[#F7F9FC] text-[#667085] font-semibold border-y border-[#E4E9F0]">
            <tr>
              <th class="py-3 px-4">Year</th>
              <th class="py-3 px-4">Starting Balance</th>
              <th class="py-3 px-4">Contributions</th>
              <th class="py-3 px-4">Interest Earned</th>
              <th class="py-3 px-4">Ending Balance</th>
              <th class="py-3 px-4">Cumulative Interest</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#E4E9F0]">
            <tr v-for="item in result.yearlyBreakdown" :key="item.year" class="hover:bg-[#F7F9FC]/50">
              <td class="py-2.5 px-4 font-semibold text-[#172033]">Year {{ item.year }}</td>
              <td class="py-2.5 px-4 num-tabular text-[#667085]">{{ formatCurrency(item.startingBalance, currency) }}</td>
              <td class="py-2.5 px-4 num-tabular text-[#667085]">{{ formatCurrency(item.contributions, currency) }}</td>
              <td class="py-2.5 px-4 num-tabular text-[#0F766E] font-medium">+{{ formatCurrency(item.interestEarned, currency) }}</td>
              <td class="py-2.5 px-4 num-tabular text-[#172033] font-semibold">{{ formatCurrency(item.endingBalance, currency) }}</td>
              <td class="py-2.5 px-4 num-tabular text-[#0F766E]">{{ formatCurrency(item.totalInterestSoFar, currency) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Explanatory & Guides -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
      <div class="lg:col-span-8 space-y-10">
        <section class="bg-white rounded-2xl border border-[#E4E9F0] p-6 sm:p-8">
          <h2 class="text-xl font-bold text-[#172033] mb-4">The Mathematical Power of Compounding</h2>
          <p class="text-sm text-[#667085] leading-relaxed mb-4">
            Unlike simple interest (which only rewards the initial principal), compound interest calculates interest on top of past accumulated gains. Over decades, interest earned begins to dwarf the original principal and annual contributions combined.
          </p>
          <div class="bg-[#F7F9FC] border border-[#E4E9F0] p-4 rounded-xl num-tabular text-sm text-[#172033] mb-4 font-mono">
            {{ currentTool.formula }}
          </div>
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
          <h3 class="text-base font-bold text-[#172033] mb-2">Retirement Longevity Tool</h3>
          <p class="text-xs text-[#667085] leading-relaxed mb-4">
            Explore what happens when you switch from accumulating wealth to taking regular retirement withdrawals.
          </p>
          <RouterLink
            to="/how-long-will-my-money-last/"
            class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F766E] hover:underline"
          >
            <span>Retirement Money Longevity</span>
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
