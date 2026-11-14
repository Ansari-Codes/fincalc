<script setup lang="ts">
import { onMounted } from 'vue'
import { updatePageSeo } from '@/utils/seo'
import { siteConfig } from '@/config/site'
import Breadcrumbs from '@/components/ui/Breadcrumbs.vue'
import { ShieldCheck, Lock, Cpu, BookOpen } from 'lucide-vue-next'

onMounted(() => {
  updatePageSeo({
    title: 'About Us – Practical Financial Calculations Without Accounts',
    description: `Learn about ${siteConfig.name}, our mission to provide clear, accessible financial calculators, and our client-side privacy philosophy.`
  })
})
</script>

<template>
  <div class="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
    <Breadcrumbs :items="[{ name: 'About' }]" />

    <div class="max-w-3xl mx-auto py-6">
      <div class="text-xs font-semibold uppercase tracking-wider text-[#0F766E] mb-2">Platform Overview</div>
      <h1 class="text-3xl sm:text-5xl font-extrabold text-[#172033] tracking-tight mb-6">
        About {{ siteConfig.name }}
      </h1>

      <div class="space-y-6 text-[#172033] leading-relaxed text-base sm:text-lg">
        <p class="text-xl text-[#667085] font-normal leading-relaxed">
          {{ siteConfig.name }} was created to give individuals, investors, retirees, and business owners straightforward, trustworthy tools for everyday financial questions—without paywalls, account requirements, or data collection.
        </p>

        <h2 class="text-2xl font-bold text-[#172033] pt-6">Our Mission &amp; Purpose</h2>
        <p class="text-[#667085]">
          Most online financial calculators are buried inside complex spreadsheets, gated behind mandatory email signups, or wrapped in aggressive marketing for personal loans and brokerage services.
        </p>
        <p class="text-[#667085]">
          Our approach is different: provide clear mathematical models that run entirely in your web browser, document the underlying assumptions and formulas, and let you get the answer you need quickly and privately.
        </p>

        <h2 class="text-2xl font-bold text-[#172033] pt-6">Core Product Principles</h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          <div class="p-6 rounded-2xl bg-white border border-[#E4E9F0]">
            <div class="w-10 h-10 rounded-xl bg-[#E7F4F1] text-[#0F766E] flex items-center justify-center mb-3">
              <Lock class="w-5 h-5" />
            </div>
            <h3 class="font-bold text-[#172033] mb-1">Client-Side Privacy</h3>
            <p class="text-xs text-[#667085] leading-relaxed">
              All financial inputs (balances, interest rates, share quantities) are processed locally on your device. We do not store or transmit your sensitive numbers to any server.
            </p>
          </div>

          <div class="p-6 rounded-2xl bg-white border border-[#E4E9F0]">
            <div class="w-10 h-10 rounded-xl bg-[#E7F4F1] text-[#0F766E] flex items-center justify-center mb-3">
              <Cpu class="w-5 h-5" />
            </div>
            <h3 class="font-bold text-[#172033] mb-1">Mathematical Rigor</h3>
            <p class="text-xs text-[#667085] leading-relaxed">
              Every formula is isolated in unit-tested TypeScript engines, guarded against zero divisions, infinite loops, and floating-point display artifacts.
            </p>
          </div>

          <div class="p-6 rounded-2xl bg-white border border-[#E4E9F0]">
            <div class="w-10 h-10 rounded-xl bg-[#E7F4F1] text-[#0F766E] flex items-center justify-center mb-3">
              <ShieldCheck class="w-5 h-5" />
            </div>
            <h3 class="font-bold text-[#172033] mb-1">No Login Required</h3>
            <p class="text-xs text-[#667085] leading-relaxed">
              Every calculator is free to use immediately. We do not ask for bank credentials, Social Security numbers, or account registrations.
            </p>
          </div>

          <div class="p-6 rounded-2xl bg-white border border-[#E4E9F0]">
            <div class="w-10 h-10 rounded-xl bg-[#E7F4F1] text-[#0F766E] flex items-center justify-center mb-3">
              <BookOpen class="w-5 h-5" />
            </div>
            <h3 class="font-bold text-[#172033] mb-1">Transparent Assumptions</h3>
            <p class="text-xs text-[#667085] leading-relaxed">
              We explicitly state what is included and what is excluded—such as taxes, inflation, or issuer-specific billing practices.
            </p>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-[#172033] pt-6">What This Platform Is Not</h2>
        <p class="text-[#667085]">
          {{ siteConfig.name }} is an independent financial technology utility. We are not a licensed bank, investment advisory firm, Certified Financial Planner (CFP), CPA accounting practice, tax preparer, or lender. Our outputs represent educational mathematical models, not individualized investment, legal, or tax advice.
        </p>
      </div>
    </div>
  </div>
</template>
