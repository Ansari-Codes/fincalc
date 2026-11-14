<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ChevronRight, Home } from '@lucide/vue'

export interface BreadcrumbItem {
  name: string
  path?: string
}

defineProps<{
  items: BreadcrumbItem[]
}>()
</script>

<template>
  <nav aria-label="Breadcrumb" class="flex items-center text-xs text-[#667085] py-4">
    <ol class="flex items-center flex-wrap gap-1.5">
      <li class="flex items-center">
        <RouterLink to="/" class="hover:text-[#0F766E] flex items-center gap-1">
          <Home class="w-3.5 h-3.5" />
          <span>Home</span>
        </RouterLink>
      </li>

      <li v-for="(item, index) in items" :key="index" class="flex items-center gap-1.5">
        <ChevronRight class="w-3.5 h-3.5 text-[#667085]/60" />
        <RouterLink
          v-if="item.path && index < items.length - 1"
          :to="item.path"
          class="hover:text-[#0F766E] transition-colors"
        >
          {{ item.name }}
        </RouterLink>
        <span v-else class="text-[#172033] font-medium" aria-current="page">
          {{ item.name }}
        </span>
      </li>
    </ol>
  </nav>
</template>
