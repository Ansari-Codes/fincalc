<script setup lang="ts">
import { onMounted } from 'vue'
import { updatePageSeo } from '@/utils/seo'
import { siteConfig } from '@/config/site'
import Breadcrumbs from '@/components/ui/Breadcrumbs.vue'

onMounted(() => {
  updatePageSeo({
    title: 'Terms of Use',
    description: `Terms and conditions governing the use of ${siteConfig.name} and its financial calculation utilities.`
  })
})
</script>

<template>
  <div class="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
    <Breadcrumbs :items="[{ name: 'Terms of Use' }]" />

    <div class="max-w-3xl mx-auto py-6">
      <div class="text-xs font-semibold uppercase tracking-wider text-[#0F766E] mb-2">Legal Terms</div>
      <h1 class="text-3xl sm:text-5xl font-extrabold text-[#172033] tracking-tight mb-4">
        Terms of Use
      </h1>
      <p class="text-xs text-[#667085] mb-8">Effective Date: November 2026</p>

      <div class="space-y-6 text-[#172033] leading-relaxed text-base sm:text-lg">
        <h2 class="text-xl font-bold text-[#172033]">1. Agreement to Terms</h2>
        <p class="text-[#667085]">
          By accessing and using {{ siteConfig.name }} (the "Site"), you agree to be bound by these Terms of Use and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
        </p>

        <h2 class="text-xl font-bold text-[#172033]">2. Use License &amp; Educational Purpose</h2>
        <p class="text-[#667085]">
          Permission is granted to use our web calculators, tables, charts, and articles for personal, educational, and business scenario evaluation. The tools provided are mathematical approximations and do not constitute professional financial advice.
        </p>

        <h2 class="text-xl font-bold text-[#172033]">3. Disclaimer of Warranties</h2>
        <p class="text-[#667085]">
          The materials and tools on {{ siteConfig.name }} are provided on an "as is" and "as available" basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property.
        </p>

        <h2 class="text-xl font-bold text-[#172033]">4. Limitation of Liability</h2>
        <p class="text-[#667085]">
          In no event shall {{ siteConfig.name }} or its operators be liable for any damages (including, without limitation, damages for loss of capital, data, or profit, or due to business interruption) arising out of the use or inability to use the calculation tools on this website.
        </p>

        <h2 class="text-xl font-bold text-[#172033]">5. Governing Law</h2>
        <p class="text-[#667085]">
          These terms and conditions are governed by and construed in accordance with the laws of the United States.
        </p>
      </div>
    </div>
  </div>
</template>
