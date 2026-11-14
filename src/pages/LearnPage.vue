<script setup lang="ts">
import { onMounted } from 'vue'
import { updatePageSeo } from '@/utils/seo'
import { articles } from '@/data/articles'
import ArticleCard from '@/components/ui/ArticleCard.vue'
import Breadcrumbs from '@/components/ui/Breadcrumbs.vue'
import { BookOpen } from 'lucide-vue-next'

onMounted(() => {
  updatePageSeo({
    title: 'Financial Education & Calculation Guides',
    description: 'Practical guides explaining how financial formulas work, how interest compounds, how to calculate stock averages, and how retirement longevity is modeled.'
  })
})
</script>

<template>
  <div class="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
    <Breadcrumbs :items="[{ name: 'Learn' }]" />

    <!-- Page Header -->
    <div class="mb-12">
      <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0F766E] mb-2">
        <BookOpen class="w-4 h-4" />
        <span>Educational Resources</span>
      </div>
      <h1 class="text-3xl sm:text-5xl font-extrabold text-[#172033] tracking-tight mb-4">
        Financial Education &amp; Guides
      </h1>
      <p class="text-base sm:text-xl text-[#667085] max-w-3xl leading-relaxed">
        Understand the mathematical formulas, regulatory principles, and practical calculations behind everyday money decisions.
      </p>
    </div>

    <!-- Article Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
      <ArticleCard v-for="a in articles" :key="a.slug" :article="a" />
    </div>

    <!-- Methodology Link Notice -->
    <div class="bg-white rounded-2xl border border-[#E4E9F0] p-8 text-center max-w-2xl mx-auto">
      <h3 class="text-lg font-bold text-[#172033] mb-2">Looking for Calculation Methodology?</h3>
      <p class="text-sm text-[#667085] leading-relaxed mb-4">
        Our methodology page details the exact formulas, rounding procedures, and boundary tests used across all calculators.
      </p>
      <RouterLink
        to="/methodology/"
        class="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F766E] hover:underline"
      >
        <span>View Calculation Methodology &rarr;</span>
      </RouterLink>
    </div>
  </div>
</template>
