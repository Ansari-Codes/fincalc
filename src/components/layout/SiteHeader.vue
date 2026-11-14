<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { siteConfig } from '@/config/site'
import { Menu, X, ArrowRight, Calculator } from 'lucide-vue-next'

const route = useRoute()
const mobileMenuOpen = ref(false)

const navLinks = [
  { name: 'Tools', path: '/tools/' },
  { name: 'Investing', path: '/tools/investing/' },
  { name: 'Credit & Debt', path: '/tools/credit-debt/' },
  { name: 'Retirement', path: '/tools/retirement/' },
  { name: 'Business', path: '/tools/business-finance/' },
  { name: 'Learn', path: '/learn/' }
]

function closeMobileMenu() {
  mobileMenuOpen.value = false
}
</script>

<template>
  <header class="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-[#E4E9F0]">
    <div class="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
      <!-- Brand Logo / Temporary Label -->
      <RouterLink 
        to="/" 
        class="flex items-center gap-2.5 text-[#172033] font-semibold text-lg hover:text-[#0F766E] transition-colors"
        @click="closeMobileMenu"
      >
        <div class="w-8 h-8 rounded-lg bg-[#0F766E] text-white flex items-center justify-center font-bold text-base shadow-sm">
          <Calculator class="w-5 h-5" />
        </div>
        <span>{{ siteConfig.name }}</span>
      </RouterLink>

      <!-- Desktop Nav -->
      <nav class="hidden md:flex items-center gap-1 lg:gap-2" aria-label="Main Navigation">
        <RouterLink
          v-for="link in navLinks"
          :key="link.path"
          :to="link.path"
          class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
          :class="route.path === link.path ? 'text-[#0F766E] bg-[#E7F4F1] font-semibold' : 'text-[#667085] hover:text-[#172033] hover:bg-[#F7F9FC]'"
        >
          {{ link.name }}
        </RouterLink>
      </nav>

      <!-- Desktop Action CTA -->
      <div class="hidden md:flex items-center gap-3">
        <RouterLink
          to="/tools/"
          class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium bg-[#0F766E] text-white hover:bg-[#115E59] transition-colors shadow-sm"
        >
          <span>Explore tools</span>
          <ArrowRight class="w-4 h-4" />
        </RouterLink>
      </div>

      <!-- Mobile Menu Toggle Button -->
      <button
        type="button"
        class="md:hidden p-2 rounded-lg text-[#667085] hover:text-[#172033] hover:bg-[#F7F9FC] transition-colors"
        :aria-expanded="mobileMenuOpen"
        aria-label="Toggle navigation menu"
        @click="mobileMenuOpen = !mobileMenuOpen"
      >
        <Menu v-if="!mobileMenuOpen" class="w-6 h-6" />
        <X v-else class="w-6 h-6" />
      </button>
    </div>

    <!-- Mobile Dropdown Menu -->
    <div
      v-if="mobileMenuOpen"
      class="md:hidden border-b border-[#E4E9F0] bg-white px-4 pt-2 pb-6 space-y-1 shadow-lg"
    >
      <RouterLink
        v-for="link in navLinks"
        :key="link.path"
        :to="link.path"
        class="block px-3 py-2.5 rounded-lg text-base font-medium transition-colors"
        :class="route.path === link.path ? 'text-[#0F766E] bg-[#E7F4F1] font-semibold' : 'text-[#667085] hover:text-[#172033] hover:bg-[#F7F9FC]'"
        @click="closeMobileMenu"
      >
        {{ link.name }}
      </RouterLink>
      <div class="pt-4 mt-2 border-t border-[#E4E9F0]">
        <RouterLink
          to="/tools/"
          class="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-base font-medium bg-[#0F766E] text-white hover:bg-[#115E59] transition-colors"
          @click="closeMobileMenu"
        >
          <span>Explore all tools</span>
          <ArrowRight class="w-4 h-4" />
        </RouterLink>
      </div>
    </div>
  </header>
</template>
