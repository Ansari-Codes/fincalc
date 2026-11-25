<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { updatePageSeo } from '@/utils/seo'
import { generateArticleSchema } from '@/utils/structuredData'
import { articles } from '@/data/articles'
import { tools } from '@/data/tools'
import Breadcrumbs from '@/components/ui/Breadcrumbs.vue'
import FAQAccordion from '@/components/ui/FAQAccordion.vue'
import ArticleCard from '@/components/ui/ArticleCard.vue'
import AmortizationChart from '@/components/ui/AmortizationChart.vue'
import { calculateLoanPayment, buildDisplaySchedule } from '@/calculations/loanPayment'
import { calculateBreakEven } from '@/calculations/breakEven'
import { breakEvenChartSvg, BREAK_EVEN_CHART_INPUTS } from '@/utils/breakEvenChart'
import { ArrowRight, Calculator, Calendar, Clock } from '@lucide/vue'

const route = useRoute()
const router = useRouter()
const slug = computed(() => String(route.params.slug || ''))
const article = computed(() => articles.find(a => a.slug === slug.value))

function handleArticleClick(event: MouseEvent) {
  const target = (event.target as HTMLElement)?.closest('a')
  if (!target) return
  const href = target.getAttribute('href')
  if (
    href &&
    href.startsWith('/') &&
    !href.startsWith('//') &&
    !target.hasAttribute('target') &&
    !target.hasAttribute('download') &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey &&
    !event.altKey &&
    event.button === 0
  ) {
    event.preventDefault()
    router.push(href)
  }
}

watchEffect(() => {
  if (article.value) {
    updatePageSeo({
      // seoTitle (when set) is the short <title> tag; the H1 keeps the full
      // article title. Without it, fall back to the old suffixed title.
      title: article.value.seoTitle ?? `${article.value.title} – Financial Guide`,
      description: article.value.metaDescription,
      path: article.value.path,
      jsonLd: generateArticleSchema(article.value)
    })
  }
})

// Engine-computed break-even chart HTML (hoodie example), rendered wherever
// a section carries chart: 'break-even-hoodie'. The break-even point comes
// from the engine, not from hand-typed numbers.
const beChartHtml = breakEvenChartSvg(
  calculateBreakEven({
    sellingPricePerUnit: BREAK_EVEN_CHART_INPUTS.price,
    variableCostPerUnit: BREAK_EVEN_CHART_INPUTS.variableCost,
    totalFixedCosts: BREAK_EVEN_CHART_INPUTS.fixedCosts
  })
)

const relatedTool = computed(() => {
  if (!article.value) return undefined
  return tools.find(t => t.slug === article.value?.relatedToolSlug)
})

const otherArticles = computed(() => {
  return articles.filter(a => a.slug !== slug.value).slice(0, 2)
})

const isAmortizationArticle = computed(() => slug.value === 'how-loan-amortization-works')

const educationalMortgageSchedule = computed(() => {
  if (!isAmortizationArticle.value) return undefined
  return calculateLoanPayment({
    principal: 300000,
    annualRate: 6.5,
    term: 30,
    termUnit: 'years',
    extraMonthlyPayment: 250
  })
})

const educationalBaselineSchedule = computed(() => {
  if (!isAmortizationArticle.value) return undefined
  return calculateLoanPayment({
    principal: 300000,
    annualRate: 6.5,
    term: 30,
    termUnit: 'years',
    extraMonthlyPayment: 0
  })
})
</script>

<template>
  <div v-if="article" class="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
    <Breadcrumbs :items="[
      { name: 'Learn', path: '/learn/' },
      { name: article.title }
    ]" />

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-4 mb-20">
      <!-- Article Content (8 Cols) -->
      <article class="lg:col-span-8" @click="handleArticleClick">
        <!-- Metadata Header -->
        <div class="mb-8 border-b border-[#E4E9F0] pb-8">
          <div class="flex items-center gap-3 text-xs text-[#667085] mb-3">
            <span class="font-semibold text-[#0F766E] bg-[#E7F4F1] px-2.5 py-1 rounded-full">
              {{ article.category }}
            </span>
            <span class="flex items-center gap-1">
              <Clock class="w-3.5 h-3.5" />
              {{ article.readTime }}
            </span>
            <span class="flex items-center gap-1">
              <Calendar class="w-3.5 h-3.5" />
              Reviewed: {{ article.lastReviewed }}
            </span>
          </div>

          <h1 class="text-3xl sm:text-5xl font-extrabold text-[#172033] tracking-tight mb-4 leading-tight">
            {{ article.title }}
          </h1>

          <p class="text-base sm:text-xl text-[#667085] leading-relaxed font-normal">
            {{ article.summary }}
          </p>
        </div>

        <!-- Inline Calculator Shortcut Box -->
        <div v-if="relatedTool" class="mb-10 p-5 rounded-2xl bg-[#E7F4F1] border border-[#0F766E]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-[#0F766E] text-white flex items-center justify-center shrink-0">
              <Calculator class="w-5 h-5" />
            </div>
            <div>
              <div class="text-xs uppercase font-semibold text-[#0F766E]">Interactive Tool</div>
              <div class="text-sm font-bold text-[#172033]">{{ relatedTool.name }}</div>
            </div>
          </div>
          <RouterLink
            :to="relatedTool.path"
            class="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#0F766E] text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-[#115E59] transition-colors shrink-0"
          >
            <span>Open calculator</span>
            <ArrowRight class="w-4 h-4" />
          </RouterLink>
        </div>

        <!-- Section Content -->
        <div class="space-y-10 text-[#172033]">
          <section v-for="(section, idx) in article.sections" :key="idx" class="space-y-4">
            <h2 class="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
              {{ section.heading }}
            </h2>

            <p v-for="(para, pIdx) in section.paragraphs" :key="pIdx" class="text-base sm:text-lg text-[#667085] leading-relaxed" v-html="para" />

            <!-- Formula Callout Box -->
            <div v-if="section.formulaBox" class="my-6 p-5 rounded-xl bg-[#F7F9FC] border border-[#E4E9F0]">
              <div class="text-xs font-semibold uppercase text-[#0F766E] mb-1">Standard Formula:</div>
              <div class="font-mono text-sm sm:text-base font-semibold text-[#172033] whitespace-pre-line leading-relaxed">
                {{ section.formulaBox }}
              </div>
            </div>

            <!-- Example Callout Box -->
            <div v-if="section.exampleBox" class="my-6 p-6 rounded-2xl bg-white border border-[#E4E9F0] shadow-sm">
              <h3 class="text-base font-bold text-[#172033] mb-3 flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-[#0F766E]"></span>
                <span>{{ section.exampleBox.title }}</span>
              </h3>
              <ul class="space-y-2 text-sm text-[#667085]">
                <li v-for="(detail, dIdx) in section.exampleBox.details" :key="dIdx" class="leading-relaxed">
                  {{ detail }}
                </li>
              </ul>
            </div>

            <!-- Table Block -->
            <div v-if="section.tableHtml" class="my-6 overflow-x-auto" v-html="section.tableHtml" />

            <!-- Engine-computed Break-Even Chart -->
            <div v-if="section.chart === 'break-even-hoodie'" class="my-6 p-5 rounded-xl bg-white border border-[#E4E9F0] shadow-sm overflow-x-auto" v-html="beChartHtml" />

            <!-- Optional Educational Visualization for Amortization Guide -->
            <div v-if="isAmortizationArticle && section.exampleBox && educationalMortgageSchedule" class="my-8">
              <p class="text-xs text-[#64748B] mb-3 leading-relaxed">The chart below models the <strong class="text-[#0F172A]">$250-per-month extra principal scenario</strong> from the prepayment section — its crossover month and payoff figures belong to that accelerated schedule, not to the standard 30-year schedule (crossover Month 233, 50% point Month 257).</p>
              <AmortizationChart
                :schedule="buildDisplaySchedule(educationalMortgageSchedule.schedule)"
                :baseline-schedule="educationalBaselineSchedule ? buildDisplaySchedule(educationalBaselineSchedule.schedule) : undefined"
                :principal="300000"
                :annual-rate="6.5"
                :extra-monthly-payment="250"
                title="Illustrative $300,000 Mortgage Amortization Trajectory (6.50% APR, with $250/month extra principal)"
              />
            </div>
          </section>
        </div>

        <!-- FAQs -->
        <div v-if="article.faqs.length > 0" class="mt-14 pt-10 border-t border-[#E4E9F0]">
          <FAQAccordion :items="article.faqs" title="Frequently Asked Questions" />
        </div>
      </article>

      <!-- Sidebar (4 Cols) -->
      <aside class="lg:col-span-4 space-y-6">
        <!-- Interactive Tool Card in Sidebar -->
        <div v-if="relatedTool" class="bg-white rounded-2xl border border-[#E4E9F0] p-6 shadow-sm">
          <div class="text-xs font-semibold uppercase tracking-wider text-[#0F766E] mb-2">Practice With Real Data</div>
          <h3 class="text-lg font-bold text-[#172033] mb-2">{{ relatedTool.name }}</h3>
          <p class="text-xs text-[#667085] leading-relaxed mb-4">{{ relatedTool.shortDescription }}</p>
          <RouterLink
            :to="relatedTool.path"
            class="flex items-center justify-center gap-1.5 w-full py-2.5 px-4 bg-[#0F766E] text-white text-sm font-semibold rounded-xl hover:bg-[#115E59] transition-colors"
          >
            <span>Launch calculator</span>
            <ArrowRight class="w-4 h-4" />
          </RouterLink>
        </div>

        <!-- Review & Sources Info -->
        <div class="bg-white rounded-2xl border border-[#E4E9F0] p-6 text-xs text-[#667085] space-y-2">
          <div class="font-semibold text-[#172033]">Editorial Review &amp; Sources</div>
          <div>Calculations and guidelines verified against authoritative US financial standards.</div>
          <div>Last reviewed: {{ article.lastReviewed }}.</div>
        </div>
      </aside>
    </div>

    <!-- Related Articles -->
    <div class="pt-12 border-t border-[#E4E9F0] mb-16">
      <h2 class="text-xl font-bold text-[#172033] mb-6">More Financial Education Guides</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ArticleCard v-for="a in otherArticles" :key="a.slug" :article="a" />
      </div>
    </div>
  </div>

  <!-- Fallback if not found -->
  <div v-else class="max-w-[1200px] mx-auto px-4 sm:px-6 py-20 text-center">
    <h2 class="text-2xl font-bold text-[#172033] mb-2">Article Not Found</h2>
    <p class="text-sm text-[#667085] mb-6">The educational guide you requested could not be located.</p>
    <RouterLink to="/learn/" class="px-4 py-2 bg-[#0F766E] text-white rounded-lg text-sm font-semibold">
      Browse all guides
    </RouterLink>
  </div>
</template>
