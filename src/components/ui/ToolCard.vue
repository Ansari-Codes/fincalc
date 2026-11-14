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
  Target,
  Calculator,
  TrendingDown,
  PieChart,
  ArrowRight,
  Sliders,
  Sparkles
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
    case 'Target': return Target
    case 'Calculator': return Calculator
    case 'TrendingDown': return TrendingDown
    case 'PieChart': return PieChart
    default: return LineChart
  }
})
</script>

<template>
  <div class="group relative bg-white rounded-2xl border border-[#E2E8F0] p-6 hover:border-[#0F766E] hover:shadow-xl hover:shadow-[#0F766E]/5 transition-all duration-300 flex flex-col justify-between overflow-hidden">
    <!-- Subtle top decorative gradient line on hover -->
    <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0F766E] via-[#14B8A6] to-[#5EEAD4] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

    <div>
      <!-- Header row with instrument icon & live badge -->
      <div class="flex items-center justify-between mb-4">
        <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-[#E7F4F1] to-[#CCFBF1] text-[#0F766E] border border-[#0F766E]/15 flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:border-[#0F766E]/30 transition-all duration-300">
          <component :is="iconComponent" class="w-5 h-5 text-[#0F766E]" />
        </div>
        <div class="flex items-center gap-1.5">
          <span class="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#F0FDFA] text-[#0F766E] border border-[#0F766E]/20">
            <Sliders class="w-3 h-3 text-[#0F766E]" />
            <span>Interactive</span>
          </span>
          <span class="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]">
            {{ tool.categoryName }}
          </span>
        </div>
      </div>

      <!-- Title & Description -->
      <h3 class="text-base sm:text-lg font-bold text-[#0F172A] group-hover:text-[#0F766E] transition-colors duration-200 mb-2 leading-snug">
        {{ tool.name }}
      </h3>
      <p class="text-xs sm:text-sm text-[#64748B] leading-relaxed mb-6 line-clamp-2">
        {{ tool.shortDescription }}
      </p>
    </div>

    <!-- Bottom Action Row: Tactile launch button -->
    <div class="pt-4 border-t border-[#F1F5F9] flex items-center justify-between">
      <span class="inline-flex items-center gap-1 text-[11px] font-medium text-[#94A3B8]">
        <Sparkles class="w-3 h-3 text-teal-600" />
        <span>Client-side instant</span>
      </span>
      <RouterLink
        :to="tool.path"
        class="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#0F766E] bg-[#F0FDFA] hover:bg-[#0F766E] hover:text-white px-3 py-1.5 rounded-xl border border-[#0F766E]/20 transition-all duration-200 group-hover:border-transparent group-hover:shadow-sm"
      >
        <span>Open Tool</span>
        <ArrowRight class="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform duration-200" />
      </RouterLink>
    </div>
  </div>
</template>
