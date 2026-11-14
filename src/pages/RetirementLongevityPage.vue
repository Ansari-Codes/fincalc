<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { updatePageSeo } from '@/utils/seo'
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
  ArrowRight 
} from 'lucide-vue-next'

const currentTool = tools.find(t => t.slug === 'how-long-will-my-money-last')!

onMounted(() => {
  updatePageSeo({
    title: currentTool.title,
    description: currentTool.fullDescription
  })
})

const currency = ref('USD')
const copied = ref(false)

const startingBalance = ref<number | null>(450000)
const plannedWithdrawal = ref<number | null>(2500)
const withdrawalFrequency = ref<'monthly' | 'annually'>('monthly')
const expectedAnnualReturn = ref<number | null>(5.5)
const expectedAnnualInflation = ref<number | null>(2.5)
const adjustWithdrawalsForInflation = ref(true)
const horizonYears = ref<number | null>(40)
const withdrawalTiming = ref<'beginning' | 'end'>('beginning')

function resetForm() {
  startingBalance.value = null
  plannedWithdrawal.value = null
  expectedAnnualReturn.value = null
  expectedAnnualInflation.value = null
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

async function handleCopy() {
  const summary = [
    'Retirement Money Longevity Estimate',
    '-------------------------------------',
    `Starting Portfolio Balance: ${formatCurrency(startingBalance.value || 0, currency.value)}`,
    `Planned Withdrawal: ${formatCurrency(plannedWithdrawal.value || 0, currency.value)} (${withdrawalFrequency.value})`,
    `Assumed Annual Return: ${formatPercent(expectedAnnualReturn.value || 0)}`,
    `Assumed Annual Inflation: ${formatPercent(expectedAnnualInflation.value || 0)} (Adjusted: ${adjustWithdrawalsForInflation.value ? 'Yes' : 'No'})`,
    `Projection Horizon: ${horizonYears.value} Years`,
    `Outcome: ${result.value.message}`,
    `Total Estimated Withdrawals: ${formatCurrency(result.value.totalWithdrawn, currency.value)}`,
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

    <!-- Page Header -->
    <div class="mb-8">
      <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0F766E] mb-2">
        <Clock class="w-4 h-4" />
        <span>Retirement Planning &amp; Longevity</span>
      </div>
      <h1 class="text-2xl sm:text-4xl font-extrabold text-[#172033] tracking-tight mb-3">
        {{ currentTool.name }}
      </h1>
      <p class="text-base sm:text-lg text-[#667085] max-w-3xl leading-relaxed">
        {{ currentTool.fullDescription }}
      </p>
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
          <!-- Starting Balance -->
          <div>
            <label class="block text-sm font-semibold text-[#172033] mb-1.5">
              Starting Savings / Portfolio Balance
            </label>
            <div class="relative">
              <span class="absolute left-3.5 top-2.5 text-sm text-[#667085]">{{ currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$' }}</span>
              <input
                v-model.number="startingBalance"
                type="number"
                min="0"
                placeholder="450,000"
                class="w-full pl-8 pr-4 py-2.5 text-base bg-white border border-[#E4E9F0] rounded-xl num-tabular focus:border-[#0F766E]"
              />
            </div>
            <p class="text-xs text-[#667085] mt-1">Total accumulated retirement capital across all accounts.</p>
          </div>

          <!-- Planned Withdrawal & Frequency -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-[#172033] mb-1.5">
                Planned Withdrawal Amount
              </label>
              <div class="relative">
                <span class="absolute left-3.5 top-2.5 text-sm text-[#667085]">{{ currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$' }}</span>
                <input
                  v-model.number="plannedWithdrawal"
                  type="number"
                  min="0"
                  placeholder="2,500"
                  class="w-full pl-8 pr-4 py-2.5 text-base bg-white border border-[#E4E9F0] rounded-xl num-tabular focus:border-[#0F766E]"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-semibold text-[#172033] mb-1.5">
                Withdrawal Frequency
              </label>
              <select
                v-model="withdrawalFrequency"
                class="w-full px-3 py-2.5 text-base bg-white border border-[#E4E9F0] rounded-xl text-[#172033] focus:border-[#0F766E]"
              >
                <option value="monthly">Monthly</option>
                <option value="annually">Annually</option>
              </select>
            </div>
          </div>

          <!-- Return & Inflation -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-[#172033] mb-1.5">
                Expected Annual Return (%)
              </label>
              <div class="relative">
                <input
                  v-model.number="expectedAnnualReturn"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="5.5"
                  class="w-full px-4 py-2.5 text-base bg-white border border-[#E4E9F0] rounded-xl num-tabular focus:border-[#0F766E]"
                />
                <span class="absolute right-3.5 top-2.5 text-sm text-[#667085]">%</span>
              </div>
              <span class="text-xs text-[#667085] mt-1 block">Assumed annual rate of return.</span>
            </div>

            <div>
              <label class="block text-sm font-semibold text-[#172033] mb-1.5">
                Expected Annual Inflation (%)
              </label>
              <div class="relative">
                <input
                  v-model.number="expectedAnnualInflation"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="2.5"
                  class="w-full px-4 py-2.5 text-base bg-white border border-[#E4E9F0] rounded-xl num-tabular focus:border-[#0F766E]"
                />
                <span class="absolute right-3.5 top-2.5 text-sm text-[#667085]">%</span>
              </div>
              <span class="text-xs text-[#667085] mt-1 block">Used to model cost-of-living increases.</span>
            </div>
          </div>

          <!-- Inflation toggle & Horizon -->
          <div class="pt-4 border-t border-[#E4E9F0] space-y-4">
            <label class="flex items-center gap-2 cursor-pointer text-sm text-[#172033]">
              <input
                v-model="adjustWithdrawalsForInflation"
                type="checkbox"
                class="w-4 h-4 rounded text-[#0F766E] focus:ring-[#0F766E]"
              />
              <span class="font-medium">Increase planned withdrawals annually for inflation</span>
            </label>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label class="block text-xs font-semibold text-[#172033] mb-1">
                  Projection Horizon (Years)
                </label>
                <input
                  v-model.number="horizonYears"
                  type="number"
                  min="5"
                  max="80"
                  class="w-full px-3 py-2 text-sm bg-[#F7F9FC] border border-[#E4E9F0] rounded-lg num-tabular"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-[#172033] mb-1">
                  Withdrawal Timing
                </label>
                <select
                  v-model="withdrawalTiming"
                  class="w-full px-3 py-2 text-sm bg-[#F7F9FC] border border-[#E4E9F0] rounded-lg text-[#172033]"
                >
                  <option value="beginning">Beginning of month (Default)</option>
                  <option value="end">End of month</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Results Panel (5 Cols) -->
      <div class="lg:col-span-5 bg-white rounded-2xl border border-[#E4E9F0] p-6 sm:p-8 shadow-sm lg:sticky lg:top-24">
        <div class="flex items-center justify-between pb-4 mb-6 border-b border-[#E4E9F0]">
          <h2 class="text-lg font-bold text-[#172033]">Longevity Estimate</h2>
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
        <div 
          class="rounded-xl p-6 text-center mb-6 border"
          :class="result.isDepleted ? 'bg-amber-50 border-amber-200' : 'bg-[#E7F4F1] border-[#0F766E]/20'"
        >
          <div 
            class="text-xs font-semibold uppercase tracking-wider mb-1"
            :class="result.isDepleted ? 'text-amber-800' : 'text-[#0F766E]'"
          >
            Portfolio Longevity Status
          </div>
          <div 
            class="text-2xl sm:text-3xl font-extrabold num-tabular"
            :class="result.isDepleted ? 'text-amber-900' : 'text-[#172033]'"
          >
            {{ result.isDepleted ? `~${result.depletedYears} Years` : 'Sustained' }}
          </div>
          <div class="text-xs text-[#667085] mt-2 font-medium">
            {{ result.message }}
          </div>
        </div>

        <!-- Metric Details -->
        <dl class="space-y-3.5 text-sm">
          <div class="flex items-center justify-between py-2 border-b border-[#E4E9F0]/60">
            <dt class="text-[#667085]">Total Withdrawals Delivered</dt>
            <dd class="font-semibold text-[#172033] num-tabular">{{ formatCurrency(result.totalWithdrawn, currency) }}</dd>
          </div>
          <div class="flex items-center justify-between py-2 border-b border-[#E4E9F0]/60">
            <dt class="text-[#667085]">Total Investment Growth Generated</dt>
            <dd class="font-semibold text-[#0F766E] num-tabular">+{{ formatCurrency(result.totalGrowth, currency) }}</dd>
          </div>
          <div class="flex items-center justify-between py-2 border-b border-[#E4E9F0]/60">
            <dt class="text-[#667085]">Ending Balance at Horizon (Y{{ horizonYears }})</dt>
            <dd class="font-bold text-[#172033] num-tabular">{{ formatCurrency(result.endingBalanceAtHorizon, currency) }}</dd>
          </div>
        </dl>

        <div class="mt-6">
          <DisclaimerNotice custom-text="Constant returns are a simplifying assumption. Real market returns fluctuate, and sequence of returns significantly affects longevity." />
        </div>
      </div>
    </div>

    <!-- Visual Scenario Chart & Table -->
    <div class="mb-16 bg-white rounded-2xl border border-[#E4E9F0] p-6 sm:p-8">
      <div class="mb-6">
        <h2 class="text-xl font-bold text-[#172033]">Balance Trajectory Over Time</h2>
        <p class="text-xs text-[#667085]">Review projected portfolio balance across each year of retirement.</p>
      </div>

      <!-- Accessible SVG Trajectory Chart -->
      <div class="w-full h-48 sm:h-64 mb-8 relative border-b border-l border-[#E4E9F0] flex items-end justify-between px-2 pt-6">
        <div
          v-for="item in result.yearlyBreakdown.filter((_, i) => result.yearlyBreakdown.length <= 15 || i % Math.ceil(result.yearlyBreakdown.length / 15) === 0 || i === result.yearlyBreakdown.length - 1)"
          :key="item.year"
          class="flex-1 max-w-[40px] flex flex-col items-center justify-end h-full group relative"
        >
          <!-- Tooltip on hover -->
          <div class="absolute -top-12 hidden group-hover:block bg-[#172033] text-white text-[10px] py-1 px-2 rounded shadow whitespace-nowrap z-10 num-tabular">
            Year {{ item.year }}: {{ formatCurrency(item.endingBalance, currency) }}
          </div>

          <!-- Bar -->
          <div class="w-3 sm:w-5 flex flex-col justify-end h-full">
            <div
              class="w-full rounded-t-sm transition-all"
              :class="item.endingBalance > 0 ? 'bg-[#0F766E]' : 'bg-[#CBD5E1]'"
              :style="{ height: `${startingBalance && startingBalance > 0 ? Math.min(100, (item.endingBalance / startingBalance) * 100) : 0}%` }"
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
              <th class="py-3 px-4">Annual Withdrawals</th>
              <th class="py-3 px-4">Investment Growth</th>
              <th class="py-3 px-4">Ending Balance</th>
              <th class="py-3 px-4">Cumulative Withdrawn</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#E4E9F0]">
            <tr v-for="item in result.yearlyBreakdown" :key="item.year" class="hover:bg-[#F7F9FC]/50">
              <td class="py-2.5 px-4 font-semibold text-[#172033]">Year {{ item.year }}</td>
              <td class="py-2.5 px-4 num-tabular text-[#667085]">{{ formatCurrency(item.startingBalance, currency) }}</td>
              <td class="py-2.5 px-4 num-tabular text-[#B42318] font-medium">-{{ formatCurrency(item.withdrawals, currency) }}</td>
              <td class="py-2.5 px-4 num-tabular text-[#0F766E] font-medium">+{{ formatCurrency(item.investmentGrowth, currency) }}</td>
              <td class="py-2.5 px-4 num-tabular font-bold" :class="item.endingBalance > 0 ? 'text-[#172033]' : 'text-[#B42318]'">
                {{ formatCurrency(item.endingBalance, currency) }}
              </td>
              <td class="py-2.5 px-4 num-tabular text-[#667085]">{{ formatCurrency(item.totalWithdrawnSoFar, currency) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Explanatory & Guides -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
      <div class="lg:col-span-8 space-y-10">
        <section class="bg-white rounded-2xl border border-[#E4E9F0] p-6 sm:p-8">
          <h2 class="text-xl font-bold text-[#172033] mb-4">How Retirement Longevity is Modeled</h2>
          <p class="text-sm text-[#667085] leading-relaxed mb-4">
            The calculator projects portfolio sustainability month by month. At the start of each month, your scheduled living withdrawal is deducted from principal. The remaining balance earns a monthly effective compounding return.
          </p>
          <div class="bg-[#F7F9FC] border border-[#E4E9F0] p-4 rounded-xl num-tabular text-sm text-[#172033] mb-4 font-mono">
            {{ currentTool.formula }}
          </div>
          <p class="text-sm text-[#667085] leading-relaxed">
            When inflation adjustment is active, annual withdrawal amounts increase at the start of each year by the assumed inflation rate to preserve real purchasing power.
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
          <h3 class="text-base font-bold text-[#172033] mb-2">Sequence-of-Returns Risk</h3>
          <p class="text-xs text-[#667085] leading-relaxed mb-4">
            Learn why early bear markets pose higher risks than late ones and how cash buffers help protect retirees.
          </p>
          <RouterLink
            to="/learn/how-long-will-retirement-savings-last/"
            class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F766E] hover:underline"
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
