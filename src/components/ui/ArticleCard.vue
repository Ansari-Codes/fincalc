<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { ArticleItem } from '@/data/articles'
import { ArrowRight } from '@lucide/vue'

defineProps<{
  article: ArticleItem
}>()
</script>

<template>
  <article class="group bg-white rounded-xl border border-[#E4E9F0] p-6 hover:border-[#0F766E]/40 hover:shadow-md transition-all flex flex-col justify-between">
    <div>
      <div class="flex items-center justify-between text-xs text-[#667085] mb-3">
        <span class="font-medium text-[#0F766E] bg-[#E7F4F1] px-2.5 py-0.5 rounded-full">
          {{ article.category }}
        </span>
        <span>{{ article.readTime }}</span>
      </div>

      <h3 class="text-base sm:text-lg font-semibold text-[#172033] group-hover:text-[#0F766E] transition-colors mb-2 leading-snug">
        <RouterLink :to="article.path">
          {{ article.title }}
        </RouterLink>
      </h3>

      <p class="text-sm text-[#667085] line-clamp-3 leading-relaxed mb-6">
        {{ article.summary }}
      </p>
    </div>

    <div class="pt-4 border-t border-[#E4E9F0]/60 flex items-center justify-between">
      <span class="text-xs text-[#667085]">
        Reviewed: {{ article.lastReviewed }}
      </span>
      <RouterLink
        :to="article.path"
        class="inline-flex items-center gap-1 text-sm font-semibold text-[#0F766E] group-hover:text-[#115E59]"
      >
        <span>Read guide</span>
        <ArrowRight class="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
      </RouterLink>
    </div>
  </article>
</template>
