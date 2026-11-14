<script setup lang="ts">
import { onMounted } from 'vue'
import { updatePageSeo } from '@/utils/seo'
import { RouterLink } from 'vue-router'
import { AlertCircle, Home, Calculator } from '@lucide/vue'

onMounted(() => {
  updatePageSeo({
    title: 'Page Not Found (404)',
    description: 'The requested page or calculator could not be found.'
  })
})
</script>

<template>
  <div class="max-w-[1200px] mx-auto px-4 sm:px-6 py-20 text-center">
    <div class="w-16 h-16 rounded-2xl bg-amber-50 text-[#D99A45] flex items-center justify-center mx-auto mb-6">
      <AlertCircle class="w-8 h-8" />
    </div>

    <div class="text-xs font-semibold uppercase tracking-wider text-[#667085] mb-2">Error 404</div>
    <h1 class="text-3xl sm:text-5xl font-extrabold text-[#172033] tracking-tight mb-4">
      Page Not Found
    </h1>

    <p class="text-base sm:text-lg text-[#667085] max-w-md mx-auto mb-8 leading-relaxed">
      The calculator or article you requested does not exist or may have been relocated.
    </p>

    <div class="flex flex-wrap items-center justify-center gap-4">
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F766E] text-white font-semibold text-sm hover:bg-[#115E59] transition-colors"
      >
        <Home class="w-4 h-4" />
        <span>Back to homepage</span>
      </RouterLink>

      <RouterLink
        to="/tools/"
        class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-[#E4E9F0] text-[#172033] font-semibold text-sm hover:bg-[#F7F9FC] transition-colors"
      >
        <Calculator class="w-4 h-4" />
        <span>Browse all tools</span>
      </RouterLink>
    </div>
  </div>
</template>
