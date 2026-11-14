<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { updatePageSeo } from '@/utils/seo'
import { tools } from '@/data/tools'
import ToolCard from '@/components/ui/ToolCard.vue'
import Breadcrumbs from '@/components/ui/Breadcrumbs.vue'
import { Search } from 'lucide-vue-next'

const route = useRoute()

onMounted(() => {
  updatePageSeo({
    title: 'Financial Tools Directory – All Calculators & Estimators',
    description: 'Explore practical calculators for investing, retirement planning, credit costs, and business finance.'
  })
  if (route.query.q) {
    searchQuery.value = String(route.query.q)
  }
})

const searchQuery = ref('')
const selectedCategory = ref<string>('all')
const sortBy = ref<'az' | 'recent'>('az')

const categoriesList = [
  { id: 'all', label: 'All Tools' },
  { id: 'investing', label: 'Investing' },
  { id: 'credit-debt', label: 'Credit & Debt' },
  { id: 'retirement', label: 'Retirement' },
  { id: 'business-finance', label: 'Business Finance' }
]

const filteredTools = computed(() => {
  let list = [...tools]

  // Filter by category
  if (selectedCategory.value !== 'all') {
    list = list.filter(t => t.category === selectedCategory.value)
  }

  // Filter by search query
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.shortDescription.toLowerCase().includes(q) ||
      t.categoryName.toLowerCase().includes(q)
    )
  }

  // Sort
  if (sortBy.value === 'az') {
    list.sort((a, b) => a.name.localeCompare(b.name))
  }

  return list
})
</script>

<template>
  <div class="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
    <Breadcrumbs :items="[{ name: 'Tools Directory' }]" />

    <!-- Page Header -->
    <div class="mb-10">
      <h1 class="text-3xl sm:text-4xl font-extrabold text-[#172033] tracking-tight mb-3">
        Financial tools for everyday decisions
      </h1>
      <p class="text-base sm:text-lg text-[#667085] max-w-2xl leading-relaxed">
        Explore practical calculators for investing, retirement planning, credit costs, and business finance.
      </p>
    </div>

    <!-- Filter & Search Controls Bar -->
    <div class="bg-white rounded-2xl border border-[#E4E9F0] p-4 sm:p-6 mb-10 shadow-sm space-y-4">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <!-- Search Input -->
        <div class="relative flex-1">
          <Search class="w-4 h-4 text-[#667085] absolute left-3.5 top-3" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by tool name or keyword..."
            class="w-full pl-10 pr-4 py-2 text-sm bg-[#F7F9FC] border border-[#E4E9F0] rounded-xl focus:outline-none focus:border-[#0F766E]"
            aria-label="Filter calculators"
          />
        </div>

        <!-- Sort Control -->
        <div class="flex items-center gap-2 shrink-0">
          <span class="text-xs font-semibold text-[#667085]">Sort:</span>
          <select
            v-model="sortBy"
            class="text-xs font-medium border border-[#E4E9F0] rounded-lg px-2.5 py-2 bg-[#F7F9FC] text-[#172033] focus:outline-none focus:border-[#0F766E]"
            aria-label="Sort tools"
          >
            <option value="az">A–Z Alphabetical</option>
            <option value="recent">Recently Added</option>
          </select>
        </div>
      </div>

      <!-- Category Filter Pills -->
      <div class="flex items-center gap-2 overflow-x-auto pt-2 border-t border-[#E4E9F0]/60">
        <button
          v-for="cat in categoriesList"
          :key="cat.id"
          type="button"
          class="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap"
          :class="selectedCategory === cat.id ? 'bg-[#0F766E] text-white shadow-sm' : 'bg-[#F7F9FC] text-[#667085] hover:text-[#172033] border border-[#E4E9F0]'"
          @click="selectedCategory = cat.id"
        >
          {{ cat.label }}
        </button>
      </div>
    </div>

    <!-- Results Count -->
    <div class="flex items-center justify-between text-xs text-[#667085] mb-6 px-1">
      <span>Showing {{ filteredTools.length }} calculator{{ filteredTools.length === 1 ? '' : 's' }}</span>
    </div>

    <!-- Tools Grid -->
    <div v-if="filteredTools.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
      <ToolCard v-for="t in filteredTools" :key="t.slug" :tool="t" />
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-16 bg-white rounded-2xl border border-[#E4E9F0] p-8 max-w-lg mx-auto">
      <div class="w-12 h-12 rounded-full bg-[#F7F9FC] text-[#667085] flex items-center justify-center mx-auto mb-4">
        <Search class="w-6 h-6" />
      </div>
      <h3 class="text-base font-bold text-[#172033] mb-2">No tools match your criteria</h3>
      <p class="text-sm text-[#667085] mb-6 leading-relaxed">
        We couldn't find any financial calculators matching "{{ searchQuery }}". Try clearing the search query or selecting a different category.
      </p>
      <button
        type="button"
        class="px-4 py-2 bg-[#0F766E] text-white rounded-xl text-xs font-semibold hover:bg-[#115E59]"
        @click="searchQuery = ''; selectedCategory = 'all'"
      >
        Clear Filters
      </button>
    </div>
  </div>
</template>
