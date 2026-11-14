<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { updatePageSeo } from '@/utils/seo'
import { categories } from '@/data/categories'
import { tools } from '@/data/tools'
import { articles } from '@/data/articles'
import Breadcrumbs from '@/components/ui/Breadcrumbs.vue'
import ToolCard from '@/components/ui/ToolCard.vue'
import ArticleCard from '@/components/ui/ArticleCard.vue'

const route = useRoute()

const categoryKey = computed(() => String(route.params.category || ''))
const category = computed(() => categories[categoryKey.value])

watchEffect(() => {
  if (category.value) {
    updatePageSeo({
      title: category.value.title,
      description: category.value.intro
    })
  }
})

const categoryTools = computed(() => {
  if (!category.value) return []
  return tools.filter(t => category.value?.toolSlugs.includes(t.slug))
})

const categoryArticles = computed(() => {
  if (!category.value) return []
  return articles.filter(a => category.value?.relatedArticles.includes(a.slug))
})
</script>

<template>
  <div v-if="category" class="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
    <Breadcrumbs :items="[
      { name: 'Tools', path: '/tools/' },
      { name: category.name }
    ]" />

    <!-- Page Header -->
    <div class="mb-12">
      <div class="text-xs font-semibold uppercase tracking-wider text-[#0F766E] mb-2">Category Directory</div>
      <h1 class="text-3xl sm:text-5xl font-extrabold text-[#172033] tracking-tight mb-4">
        {{ category.title }}
      </h1>
      <p class="text-base sm:text-xl text-[#667085] max-w-3xl leading-relaxed">
        {{ category.intro }}
      </p>
    </div>

    <!-- Working Tools in Category -->
    <section class="mb-16">
      <h2 class="text-xl font-bold text-[#172033] mb-6">Calculators in this Category</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ToolCard v-for="t in categoryTools" :key="t.slug" :tool="t" />
      </div>
    </section>

    <!-- Explanatory Practical Guide Sections -->
    <section class="bg-white rounded-2xl border border-[#E4E9F0] p-6 sm:p-10 mb-16 shadow-sm">
      <h2 class="text-2xl font-bold text-[#172033] mb-8">Financial Context &amp; Key Principles</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div v-for="(sec, idx) in category.explanatorySections" :key="idx" class="space-y-2">
          <h3 class="text-base font-bold text-[#172033]">{{ sec.title }}</h3>
          <p class="text-sm text-[#667085] leading-relaxed">{{ sec.content }}</p>
        </div>
      </div>
    </section>

    <!-- Relevant Educational Articles -->
    <section v-if="categoryArticles.length > 0" class="mb-16">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-bold text-[#172033]">Recommended Educational Guides</h2>
          <p class="text-sm text-[#667085]">In-depth articles covering the math, rules, and strategies.</p>
        </div>
        <RouterLink to="/learn/" class="text-sm font-semibold text-[#0F766E] hover:underline hidden sm:block">
          All articles &rarr;
        </RouterLink>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ArticleCard v-for="a in categoryArticles" :key="a.slug" :article="a" />
      </div>
    </section>
  </div>

  <!-- Fallback if not found -->
  <div v-else class="max-w-[1200px] mx-auto px-4 sm:px-6 py-20 text-center">
    <h2 class="text-2xl font-bold text-[#172033] mb-2">Category Not Found</h2>
    <p class="text-sm text-[#667085] mb-6">The category you requested does not exist.</p>
    <RouterLink to="/tools/" class="px-4 py-2 bg-[#0F766E] text-white rounded-lg text-sm font-semibold">
      Browse all tools
    </RouterLink>
  </div>
</template>
