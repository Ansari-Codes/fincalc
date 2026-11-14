<script setup lang="ts">
import { AlertCircle } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'

defineProps<{
  customText?: string
}>()
</script>

<template>
  <div class="rounded-xl border border-[#E4E9F0] bg-white p-5 flex items-start gap-3 text-xs sm:text-sm text-[#667085] leading-relaxed">
    <AlertCircle class="w-5 h-5 text-[#D99A45] shrink-0 mt-0.5" />
    <div>
      <span class="font-semibold text-[#172033]">Important Disclaimer: </span>
      <span v-if="customText">{{ customText }} </span>
      <span v-else>
        Calculations are estimates generated in your browser for informational and educational purposes only. They do not constitute personalized financial, tax, or investment advice.
      </span>
      <RouterLink to="/financial-disclaimer/" class="text-[#0F766E] hover:underline font-medium ml-1">
        Read full methodology &amp; disclaimer
      </RouterLink>
    </div>
  </div>
</template>
