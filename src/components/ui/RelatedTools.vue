<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { tools } from '@/data/tools'
import { articles } from '@/data/articles'
import ToolCard from './ToolCard.vue'
import ArticleCard from './ArticleCard.vue'

const props = defineProps<{
  toolSlugs?: string[]
  articleSlugs?: string[]
  currentSlug?: string
}>()

const relatedToolList = computed(() => {
  if (props.toolSlugs && props.toolSlugs.length > 0) {
    return tools.filter(t => props.toolSlugs?.includes(t.slug) && t.slug !== props.currentSlug)
  }
  return tools.filter(t => t.slug !== props.currentSlug).slice(0, 3)
})

const relatedArticleList = computed(() => {
  if (props.articleSlugs && props.articleSlugs.length > 0) {
    return articles.filter(a => props.articleSlugs?.includes(a.slug))
  }
  return articles.slice(0, 2)
})
</script>

<template>
  <div class="space-y-12 pt-12 border-t border-[#E4E9F0]">
    <!-- Related Tools Section -->
    <div v-if="relatedToolList.length > 0">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-bold text-[#172033]">Related Financial Tools</h2>
          <p class="text-sm text-[#667085]">Explore connected calculators to evaluate other aspects of your finances.</p>
        </div>
        <RouterLink to="/tools/" class="text-sm font-semibold text-[#0F766E] hover:underline hidden sm:block">
          All tools &rarr;
        </RouterLink>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ToolCard v-for="t in relatedToolList" :key="t.slug" :tool="t" />
      </div>
    </div>

    <!-- Related Educational Guides Section -->
    <div v-if="relatedArticleList.length > 0">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-bold text-[#172033]">Helpful Educational Guides</h2>
          <p class="text-sm text-[#667085]">Understand the formulas, methodology, and financial context behind these calculations.</p>
        </div>
        <RouterLink to="/learn/" class="text-sm font-semibold text-[#0F766E] hover:underline hidden sm:block">
          All guides &rarr;
        </RouterLink>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ArticleCard v-for="a in relatedArticleList" :key="a.slug" :article="a" />
      </div>
    </div>
  </div>
</template>
