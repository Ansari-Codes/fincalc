<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { siteConfig } from '@/config/site'
import { Calculator } from '@lucide/vue'

const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="bg-white border-t border-[#E4E9F0] mt-20">
    <div class="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 lg:py-16">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
        <!-- Brand Info -->
        <div class="lg:col-span-2 space-y-4">
          <RouterLink to="/" class="flex items-center gap-2.5 text-[#172033] font-semibold text-lg">
            <div class="w-7 h-7 rounded-lg bg-[#0F766E] text-white flex items-center justify-center font-bold text-sm">
              <Calculator class="w-4 h-4" />
            </div>
            <span>{{ siteConfig.name }}</span>
          </RouterLink>
          <p class="text-sm text-[#667085] max-w-sm leading-relaxed">
            {{ siteConfig.tagline }}
          </p>
          <p class="text-xs text-[#667085] leading-relaxed pt-2 border-t border-[#E4E9F0]/60">
            {{ siteConfig.disclaimerShort }}
          </p>
        </div>

        <!-- Tool Categories -->
        <div>
          <h3 class="text-xs font-semibold uppercase tracking-wider text-[#172033] mb-3">Tool Categories</h3>
          <ul class="space-y-2 text-sm text-[#667085]">
            <li><RouterLink to="/tools/investing/" class="hover:text-[#0F766E] transition-colors">Investing Tools</RouterLink></li>
            <li><RouterLink to="/tools/credit-debt/" class="hover:text-[#0F766E] transition-colors">Credit & Debt</RouterLink></li>
            <li><RouterLink to="/tools/retirement/" class="hover:text-[#0F766E] transition-colors">Retirement Planning</RouterLink></li>
            <li><RouterLink to="/tools/business-finance/" class="hover:text-[#0F766E] transition-colors">Business Finance</RouterLink></li>
            <li><RouterLink to="/tools/" class="hover:text-[#0F766E] font-medium text-[#0F766E]">All Calculators &rarr;</RouterLink></li>
          </ul>
        </div>

        <!-- Educational Guides -->
        <div>
          <h3 class="text-xs font-semibold uppercase tracking-wider text-[#172033] mb-3">Learn</h3>
          <ul class="space-y-2 text-sm text-[#667085]">
            <li><RouterLink to="/learn/how-to-calculate-average-stock-cost/" class="hover:text-[#0F766E] transition-colors">Average Stock Cost</RouterLink></li>
            <li><RouterLink to="/learn/how-to-calculate-roi/" class="hover:text-[#0F766E] transition-colors">How to Calculate ROI</RouterLink></li>
            <li><RouterLink to="/learn/apr-vs-interest-rate/" class="hover:text-[#0F766E] transition-colors">APR vs. Interest Rate</RouterLink></li>
            <li><RouterLink to="/learn/flat-vs-tiered-commission/" class="hover:text-[#0F766E] transition-colors">Tiered Commission</RouterLink></li>
            <li><RouterLink to="/learn/how-long-will-retirement-savings-last/" class="hover:text-[#0F766E] transition-colors">Retirement Longevity</RouterLink></li>
          </ul>
        </div>

        <!-- Trust & Policies -->
        <div>
          <h3 class="text-xs font-semibold uppercase tracking-wider text-[#172033] mb-3">Platform</h3>
          <ul class="space-y-2 text-sm text-[#667085]">
            <li><RouterLink to="/about/" class="hover:text-[#0F766E] transition-colors">About</RouterLink></li>
            <li><RouterLink to="/methodology/" class="hover:text-[#0F766E] transition-colors">Calculation Methodology</RouterLink></li>
            <li><RouterLink to="/financial-disclaimer/" class="hover:text-[#0F766E] transition-colors">Financial Disclaimer</RouterLink></li>
            <li><RouterLink to="/contact/" class="hover:text-[#0F766E] transition-colors">Contact</RouterLink></li>
            <li><RouterLink to="/privacy/" class="hover:text-[#0F766E] transition-colors">Privacy Policy</RouterLink></li>
            <li><RouterLink to="/terms/" class="hover:text-[#0F766E] transition-colors">Terms of Use</RouterLink></li>
          </ul>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div class="mt-12 pt-8 border-t border-[#E4E9F0] flex flex-col sm:flex-row items-center justify-between text-xs text-[#667085] gap-4">
        <div>
          &copy; {{ currentYear }} {{ siteConfig.name }}. All rights reserved.
        </div>
        <div class="flex items-center gap-4">
          <RouterLink to="/privacy/" class="hover:underline">Privacy</RouterLink>
          <span class="text-[#E4E9F0]">&bull;</span>
          <RouterLink to="/terms/" class="hover:underline">Terms</RouterLink>
          <span class="text-[#E4E9F0]">&bull;</span>
          <RouterLink to="/financial-disclaimer/" class="hover:underline">Disclaimer</RouterLink>
        </div>
      </div>
    </div>
  </footer>
</template>
