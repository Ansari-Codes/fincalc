<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { updatePageSeo } from '@/utils/seo'
import { generateCalculatorSchema } from '@/utils/structuredData'
import { formatCurrency, formatPercent, formatNumber, copyToClipboard } from '@/utils/formatters'
import { calculateCommission, type CommissionMode, type CommissionTier } from '@/calculations/commission'
import Breadcrumbs from '@/components/ui/Breadcrumbs.vue'
import FAQAccordion from '@/components/ui/FAQAccordion.vue'
import RelatedTools from '@/components/ui/RelatedTools.vue'
import DisclaimerNotice from '@/components/ui/DisclaimerNotice.vue'
import { tools } from '@/data/tools'
import { 
  DollarSign, 
  RotateCcw, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  ArrowRight,
  AlertCircle 
} from '@lucide/vue'

const currentTool = tools.find(t => t.slug === 'commission-calculator')!

onMounted(() => {
  updatePageSeo({
    title: currentTool.title,
    description: currentTool.fullDescription,
    path: currentTool.path,
    jsonLd: generateCalculatorSchema(currentTool)
  })
})

const currency = ref('USD')
const mode = ref<CommissionMode>('percentage')
const copied = ref(false)

// Percentage mode state
const salesAmount = ref<number | null>(75000)
const commissionRate = ref<number | null>(7.5)

// Fixed mode state
const numberOfSales = ref<number | null>(12)
const fixedPerSale = ref<number | null>(350)

// Tiered mode state
const tieredSalesAmount = ref<number | null>(125000)
const tiers = ref<CommissionTier[]>([
  { id: '1', threshold: 50000, rate: 5 },
  { id: '2', threshold: 100000, rate: 8 },
  { id: '3', threshold: Infinity, rate: 12 }
])

function addTier() {
  const uncappedIndex = tiers.value.findIndex(t => !isFinite(t.threshold))
  if (uncappedIndex !== -1) {
    const prevThreshold = uncappedIndex > 0 ? tiers.value[uncappedIndex - 1].threshold : 0
    const newThreshold = prevThreshold + 50000
    tiers.value.splice(uncappedIndex, 0, {
      id: Date.now().toString(),
      threshold: newThreshold,
      rate: 10
    })
  } else {
    const last = tiers.value[tiers.value.length - 1]
    const lastThreshold = last && isFinite(last.threshold) ? last.threshold : 100000
    tiers.value.push({
      id: Date.now().toString(),
      threshold: lastThreshold + 50000,
      rate: 12
    })
  }
}

function removeTier(index: number) {
  if (tiers.value.length > 1) {
    tiers.value.splice(index, 1)
  }
}

function resetForm() {
  salesAmount.value = null
  commissionRate.value = null
  numberOfSales.value = null
  fixedPerSale.value = null
  tieredSalesAmount.value = null
}

const result = computed(() => {
  return calculateCommission({
    mode: mode.value,
    salesAmount: salesAmount.value || 0,
    commissionRate: commissionRate.value || 0,
    numberOfSales: numberOfSales.value || 0,
    fixedPerSale: fixedPerSale.value || 0,
    tieredSalesAmount: tieredSalesAmount.value || 0,
    tiers: tiers.value
  })
})

async function handleCopy() {
  const summary = [
    'Sales Commission Calculation',
    '------------------------------',
    `Calculation Mode: ${mode.value.toUpperCase()}`,
    `Commission Earned: ${formatCurrency(result.value.commissionEarned, currency.value)}`,
    mode.value !== 'fixed' ? `Sales Volume: ${formatCurrency(result.value.salesAmountUsed, currency.value)}` : '',
    mode.value !== 'fixed' ? `Effective Commission Rate: ${formatPercent(result.value.effectiveRate)}` : ''
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
      { name: 'Business Finance', path: '/tools/business-finance/' },
      { name: 'Commission Calculator' }
    ]" />

    <!-- Page Header -->
    <div class="mb-8">
      <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0F766E] mb-2">
        <DollarSign class="w-4 h-4" />
        <span>Sales &amp; Earnings</span>
      </div>
      <h1 class="text-2xl sm:text-4xl font-extrabold text-[#172033] tracking-tight mb-3">
        {{ currentTool.name }}
      </h1>
      <p class="text-base sm:text-lg text-[#667085] max-w-3xl leading-relaxed">
        {{ currentTool.fullDescription }}
      </p>
    </div>

    <!-- Mode Switcher Tabs -->
    <div class="flex items-center gap-2 mb-8 border-b border-[#E4E9F0] pb-4">
      <button
        type="button"
        class="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        :class="mode === 'percentage' ? 'bg-[#0F766E] text-white shadow-sm' : 'bg-white text-[#667085] hover:text-[#172033] border border-[#E4E9F0]'"
        @click="mode = 'percentage'"
      >
        Percentage Rate
      </button>
      <button
        type="button"
        class="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        :class="mode === 'fixed' ? 'bg-[#0F766E] text-white shadow-sm' : 'bg-white text-[#667085] hover:text-[#172033] border border-[#E4E9F0]'"
        @click="mode = 'fixed'"
      >
        Fixed Per Sale
      </button>
      <button
        type="button"
        class="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        :class="mode === 'tiered' ? 'bg-[#0F766E] text-white shadow-sm' : 'bg-white text-[#667085] hover:text-[#172033] border border-[#E4E9F0]'"
        @click="mode = 'tiered'"
      >
        Graduated Tiers (Marginal)
      </button>
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

        <!-- Mode 1: Percentage -->
        <div v-if="mode === 'percentage'" class="space-y-5">
          <div>
            <label class="block text-sm font-semibold text-[#172033] mb-1.5">
              Total Sales Volume
            </label>
            <div class="relative">
              <span class="absolute left-3.5 top-2.5 text-sm text-[#667085]">{{ currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$' }}</span>
              <input
                v-model.number="salesAmount"
                type="number"
                min="0"
                placeholder="75,000"
                class="w-full pl-8 pr-4 py-2.5 text-base bg-white border border-[#E4E9F0] rounded-xl num-tabular focus:border-[#0F766E]"
              />
            </div>
            <p class="text-xs text-[#667085] mt-1">Gross or net sales volume generated during the period.</p>
          </div>

          <div>
            <label class="block text-sm font-semibold text-[#172033] mb-1.5">
              Commission Rate (%)
            </label>
            <div class="relative">
              <input
                v-model.number="commissionRate"
                type="number"
                min="0"
                step="any"
                placeholder="7.5"
                class="w-full px-4 py-2.5 text-base bg-white border border-[#E4E9F0] rounded-xl num-tabular focus:border-[#0F766E]"
              />
              <span class="absolute right-3.5 top-2.5 text-sm text-[#667085]">%</span>
            </div>
            <p class="text-xs text-[#667085] mt-1">Contractual percentage earned per deal.</p>
          </div>
        </div>

        <!-- Mode 2: Fixed -->
        <div v-else-if="mode === 'fixed'" class="space-y-5">
          <div>
            <label class="block text-sm font-semibold text-[#172033] mb-1.5">
              Number of Completed Deals / Sales
            </label>
            <input
              v-model.number="numberOfSales"
              type="number"
              min="0"
              placeholder="12"
              class="w-full px-4 py-2.5 text-base bg-white border border-[#E4E9F0] rounded-xl num-tabular focus:border-[#0F766E]"
            />
            <p class="text-xs text-[#667085] mt-1">Total units, closed accounts, or qualified transactions.</p>
          </div>

          <div>
            <label class="block text-sm font-semibold text-[#172033] mb-1.5">
              Fixed Commission Per Unit
            </label>
            <div class="relative">
              <span class="absolute left-3.5 top-2.5 text-sm text-[#667085]">{{ currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$' }}</span>
              <input
                v-model.number="fixedPerSale"
                type="number"
                min="0"
                placeholder="350"
                class="w-full pl-8 pr-4 py-2.5 text-base bg-white border border-[#E4E9F0] rounded-xl num-tabular focus:border-[#0F766E]"
              />
            </div>
            <p class="text-xs text-[#667085] mt-1">Predetermined bounty paid per closed deal.</p>
          </div>
        </div>

        <!-- Mode 3: Tiered (Marginal) -->
        <div v-else-if="mode === 'tiered'" class="space-y-5">
          <div>
            <label class="block text-sm font-semibold text-[#172033] mb-1.5">
              Total Sales Volume to Partition
            </label>
            <div class="relative">
              <span class="absolute left-3.5 top-2.5 text-sm text-[#667085]">{{ currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$' }}</span>
              <input
                v-model.number="tieredSalesAmount"
                type="number"
                min="0"
                placeholder="125,000"
                class="w-full pl-8 pr-4 py-2.5 text-base bg-white border border-[#E4E9F0] rounded-xl num-tabular focus:border-[#0F766E]"
              />
            </div>
          </div>

          <div class="pt-4 border-t border-[#E4E9F0]">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-xs font-semibold uppercase text-[#667085]">Marginal Rate Tiers</h3>
              <button
                type="button"
                class="inline-flex items-center gap-1 text-xs font-semibold text-[#0F766E] hover:underline"
                @click="addTier"
              >
                <Plus class="w-3.5 h-3.5" />
                <span>Add tier</span>
              </button>
            </div>

            <div class="space-y-3">
              <div
                v-for="(tier, idx) in tiers"
                :key="tier.id"
                class="p-3 bg-[#F7F9FC] rounded-xl border border-[#E4E9F0] grid grid-cols-12 gap-3 items-center"
              >
                <div class="col-span-2 text-xs font-bold text-[#667085]">
                  Tier {{ idx + 1 }}
                </div>
                <div class="col-span-5">
                  <label class="block text-[11px] text-[#667085] mb-0.5">Threshold (Up To)</label>
                  <div v-if="!isFinite(tier.threshold)" class="py-1 px-2.5 text-xs bg-white border border-dashed border-[#CBD5E1] rounded-lg text-[#0F766E] font-medium">
                    Over previous (Uncapped)
                  </div>
                  <input
                    v-else
                    v-model.number="tier.threshold"
                    type="number"
                    min="0"
                    class="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E4E9F0] rounded-lg num-tabular"
                    placeholder="50,000"
                  />
                </div>
                <div class="col-span-4">
                  <label class="block text-[11px] text-[#667085] mb-0.5">Rate (%)</label>
                  <input
                    v-model.number="tier.rate"
                    type="number"
                    min="0"
                    step="any"
                    class="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E4E9F0] rounded-lg num-tabular"
                    placeholder="Rate %"
                  />
                </div>
                <div class="col-span-1 flex justify-end">
                  <button
                    type="button"
                    :disabled="tiers.length === 1"
                    class="text-[#667085] hover:text-[#B42318] disabled:opacity-30 p-1"
                    title="Remove tier"
                    @click="removeTier(idx)"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            <p class="text-[11px] text-[#667085] mt-2">
              Each rate applies strictly to sales within that tier slice (marginal rate model).
            </p>
          </div>
        </div>
      </div>

      <!-- Results Panel (5 Cols) -->
      <div class="lg:col-span-5 bg-white rounded-2xl border border-[#E4E9F0] p-6 sm:p-8 shadow-sm lg:sticky lg:top-24">
        <div class="flex items-center justify-between pb-4 mb-6 border-b border-[#E4E9F0]">
          <h2 class="text-lg font-bold text-[#172033]">Commission Earned</h2>
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
            Total Commission Earnings
          </div>
          <div class="text-3xl sm:text-4xl font-extrabold text-[#172033] num-tabular">
            {{ formatCurrency(result.commissionEarned, currency) }}
          </div>
          <div v-if="mode !== 'fixed'" class="text-xs text-[#667085] mt-1.5">
            Effective Blended Rate: <span class="font-bold text-[#0F766E]">{{ formatPercent(result.effectiveRate) }}</span>
          </div>
        </div>

        <!-- Metric Details -->
        <dl class="space-y-3.5 text-sm">
          <div v-if="mode !== 'fixed'" class="flex items-center justify-between py-2 border-b border-[#E4E9F0]/60">
            <dt class="text-[#667085]">Sales Volume Modeled</dt>
            <dd class="font-semibold text-[#172033] num-tabular">{{ formatCurrency(result.salesAmountUsed, currency) }}</dd>
          </div>
          <div v-else class="flex items-center justify-between py-2 border-b border-[#E4E9F0]/60">
            <dt class="text-[#667085]">Completed Units / Deals</dt>
            <dd class="font-semibold text-[#172033] num-tabular">{{ formatNumber(numberOfSales || 0) }}</dd>
          </div>

          <!-- Tier Breakdown in Results -->
          <div v-if="mode === 'tiered' && result.tierBreakdown" class="pt-3">
            <div class="text-xs font-semibold text-[#172033] mb-2 uppercase tracking-wide">
              Tier-By-Tier Breakdown:
            </div>
            <div class="space-y-2 text-xs">
              <div
                v-for="item in result.tierBreakdown"
                :key="item.tierNumber"
                class="p-2.5 rounded-lg bg-[#F7F9FC] border border-[#E4E9F0] flex items-center justify-between"
              >
                <div>
                  <span class="font-semibold text-[#172033]">Tier {{ item.tierNumber }}: </span>
                  <span class="text-[#667085]">{{ item.rangeLabel }} ({{ item.rate }}%)</span>
                </div>
                <div class="font-mono font-semibold text-[#0F766E]">
                  {{ formatCurrency(item.commission, currency) }}
                </div>
              </div>
            </div>
          </div>
        </dl>

        <div class="mt-6">
          <DisclaimerNotice />
        </div>
      </div>
    </div>

    <!-- Explanatory & Guides -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
      <div class="lg:col-span-8 space-y-10">
        <section class="bg-white rounded-2xl border border-[#E4E9F0] p-6 sm:p-8">
          <h2 class="text-xl font-bold text-[#172033] mb-4">How Sales Commission Works</h2>
          <p class="text-sm text-[#667085] leading-relaxed mb-4">
            Sales commissions vary from simple flat-rate agreements to sophisticated progressive milestone ladders. In a marginal tier structure, each rate applies only to revenue generated between designated lower and upper tier bounds.
          </p>
          <div class="bg-[#F7F9FC] border border-[#E4E9F0] p-4 rounded-xl num-tabular text-sm text-[#172033] mb-4 font-mono">
            {{ currentTool.formula }}
          </div>
        </section>

        <!-- Worked Example -->
        <section class="bg-white rounded-2xl border border-[#E4E9F0] p-6 sm:p-8">
          <h2 class="text-xl font-bold text-[#172033] mb-4">Worked Example: Tiered Commission</h2>
          <div class="space-y-3 text-sm text-[#667085] leading-relaxed">
            <p>Suppose you generate $120,000 in monthly sales with the following marginal tier structure:</p>
            <ul class="list-disc list-inside space-y-1.5 pl-2 font-mono text-xs text-[#172033]">
              <li>Tier 1 ($0 to $50,000 at 5%): $50,000 × 5% = $2,500.00</li>
              <li>Tier 2 ($50,000 to $100,000 at 8%): $50,000 × 8% = $4,000.00</li>
              <li>Tier 3 ($100,000 to $120,000 at 12%): $20,000 × 12% = $2,400.00</li>
            </ul>
            <div class="p-3 bg-[#E7F4F1] rounded-lg font-mono text-sm text-[#0F766E] font-semibold">
              Total Commission = $2,500 + $4,000 + $2,400 = $8,900.00 (Effective Rate: 7.42%)
            </div>
          </div>
        </section>

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
          <h3 class="text-base font-bold text-[#172033] mb-2">Flat vs. Tiered Guide</h3>
          <p class="text-xs text-[#667085] leading-relaxed mb-4">
            Learn how marginal tiers contrast with retroactive tiers and gross vs. net sales stipulations.
          </p>
          <RouterLink
            to="/learn/flat-vs-tiered-commission/"
            class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F766E] hover:underline"
          >
            <span>Read Commission Structures Guide</span>
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
