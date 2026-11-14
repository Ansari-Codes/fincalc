<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { TrendingUp, CreditCard, Clock, Briefcase, ArrowRight } from 'lucide-vue-next'

const props = defineProps<{
  id: string
  name: string
  path: string
  description: string
  toolCount: number
}>()

const iconComponent = computed(() => {
  switch (props.id) {
    case 'investing': return TrendingUp
    case 'credit-debt': return CreditCard
    case 'retirement': return Clock
    case 'business-finance': return Briefcase
    default: return TrendingUp
  }
})
</script>

<template>
  <RouterLink
    :to="path"
    class="group bg-white rounded-xl border border-[#E4E9F0] p-6 hover:border-[#0F766E]/50 hover:shadow-md transition-all flex flex-col justify-between"
  >
    <div>
      <div class="flex items-center justify-between mb-4">
        <div class="w-10 h-10 rounded-lg bg-[#E7F4F1] text-[#0F766E] flex items-center justify-center group-hover:scale-105 transition-transform">
          <component :is="iconComponent" class="w-5 h-5" />
        </div>
        <span class="text-xs font-medium text-[#667085]">
          {{ toolCount }} tools
        </span>
      </div>

      <h3 class="text-lg font-semibold text-[#172033] group-hover:text-[#0F766E] transition-colors mb-2">
        {{ name }}
      </h3>
      <p class="text-sm text-[#667085] leading-relaxed mb-4">
        {{ description }}
      </p>
    </div>

    <div class="flex items-center gap-1 text-sm font-semibold text-[#0F766E] group-hover:text-[#115E59]">
      <span>View category</span>
      <ArrowRight class="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
    </div>
  </RouterLink>
</template>
