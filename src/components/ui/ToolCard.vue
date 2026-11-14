<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { ToolItem } from '@/data/tools'
import { 
  TrendingUp, 
  Percent, 
  DollarSign, 
  CreditCard, 
  LineChart, 
  Clock, 
  ArrowRight 
} from '@lucide/vue'

const props = defineProps<{
  tool: ToolItem
}>()

const iconComponent = computed(() => {
  switch (props.tool.icon) {
    case 'TrendingUp': return TrendingUp
    case 'Percent': return Percent
    case 'DollarSign': return DollarSign
    case 'CreditCard': return CreditCard
    case 'LineChart': return LineChart
    case 'Clock': return Clock
    default: return LineChart
  }
})
</script>

<template>
  <div class="group bg-white rounded-xl border border-[#E4E9F0] p-6 hover:border-[#0F766E]/40 hover:shadow-md transition-all flex flex-col justify-between">
    <div>
      <div class="flex items-center justify-between mb-4">
        <div class="w-10 h-10 rounded-lg bg-[#E7F4F1] text-[#0F766E] flex items-center justify-center group-hover:scale-105 transition-transform">
          <component :is="iconComponent" class="w-5 h-5" />
        </div>
        <span class="text-xs font-medium px-2.5 py-1 rounded-full bg-[#F7F9FC] text-[#667085] border border-[#E4E9F0]">
          {{ tool.categoryName }}
        </span>
      </div>

      <h3 class="text-lg font-semibold text-[#172033] group-hover:text-[#0F766E] transition-colors mb-2">
        {{ tool.name }}
      </h3>
      <p class="text-sm text-[#667085] leading-relaxed mb-6">
        {{ tool.shortDescription }}
      </p>
    </div>

    <div class="pt-4 border-t border-[#E4E9F0]/60">
      <RouterLink
        :to="tool.path"
        class="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F766E] group-hover:text-[#115E59] transition-colors"
      >
        <span>Open calculator</span>
        <ArrowRight class="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
      </RouterLink>
    </div>
  </div>
</template>
