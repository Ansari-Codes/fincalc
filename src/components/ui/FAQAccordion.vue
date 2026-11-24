<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDown } from '@lucide/vue'

export interface FAQItem {
  question: string
  answer: string
}

const props = defineProps<{
  items: FAQItem[]
  title?: string
}>()

const openIndices = ref<number[]>([0]) // first item open by default

function toggle(index: number) {
  if (openIndices.value.includes(index)) {
    openIndices.value = openIndices.value.filter(i => i !== index)
  } else {
    openIndices.value.push(index)
  }
}
</script>

<template>
  <div class="space-y-3">
    <h3 v-if="title" class="text-xl font-bold text-[#172033] mb-4">
      {{ title }}
    </h3>

    <div
      v-for="(faq, index) in items"
      :key="index"
      class="border border-[#E4E9F0] rounded-xl bg-white overflow-hidden transition-colors"
    >
      <button
        type="button"
        class="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-semibold text-[#172033] hover:text-[#0F766E] transition-colors focus-visible:ring-2 focus-visible:ring-[#0F766E]"
        :aria-expanded="openIndices.includes(index)"
        @click="toggle(index)"
      >
        <span class="text-base text-left">{{ faq.question }}</span>
        <ChevronDown
          class="w-5 h-5 text-[#667085] shrink-0 transition-transform duration-200"
          :class="{ 'rotate-180 text-[#0F766E]': openIndices.includes(index) }"
        />
      </button>

      <!-- Answers are site-authored data (never user input) and intentionally
           contain links, so render them as HTML. -->
      <div
        v-if="openIndices.includes(index)"
        class="px-5 pb-5 text-sm text-[#667085] leading-relaxed border-t border-[#E4E9F0]/60 pt-3"
        v-html="faq.answer"
      ></div>
    </div>
  </div>
</template>
