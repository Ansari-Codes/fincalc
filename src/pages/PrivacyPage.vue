<script setup lang="ts">
import { onMounted } from 'vue'
import { updatePageSeo } from '@/utils/seo'
import { siteConfig } from '@/config/site'
import Breadcrumbs from '@/components/ui/Breadcrumbs.vue'

onMounted(() => {
  updatePageSeo({
    title: 'Privacy Policy',
    description: `Privacy policy for ${siteConfig.name}. We prioritize user privacy with client-side calculations and no account requirements.`
  })
})
</script>

<template>
  <div class="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
    <Breadcrumbs :items="[{ name: 'Privacy Policy' }]" />

    <div class="max-w-3xl mx-auto py-6">
      <div class="text-xs font-semibold uppercase tracking-wider text-[#0F766E] mb-2">Legal Documentation</div>
      <h1 class="text-3xl sm:text-5xl font-extrabold text-[#172033] tracking-tight mb-4">
        Privacy Policy
      </h1>
      <p class="text-xs text-[#667085] mb-8">Last Updated: November 2026</p>

      <div class="space-y-6 text-[#172033] leading-relaxed text-base sm:text-lg">
        <p class="text-[#667085]">
          At {{ siteConfig.name }}, accessible from {{ siteConfig.name }}, we respect your privacy and are committed to protecting personal information. This Privacy Policy details what information is collected and how it is used.
        </p>

        <h2 class="text-xl font-bold text-[#172033]">1. Client-Side Financial Calculations</h2>
        <p class="text-[#667085]">
          All values you enter into our financial tools (including balances, interest rates, stock purchases, salary figures, and projected savings) are processed exclusively on your device inside your web browser. <strong>We do not transmit, record, or store your entered numbers on our servers.</strong>
        </p>

        <h2 class="text-xl font-bold text-[#172033]">2. No Account Registration Required</h2>
        <p class="text-[#667085]">
          You do not need to create an account, log in, or provide an email address to use any tool on this website. We do not maintain user databases of names, passwords, or personal financial profiles.
        </p>

        <h2 class="text-xl font-bold text-[#172033]">3. Log Files &amp; Hosting Analytics</h2>
        <p class="text-[#667085]">
          Like most modern websites, our hosting servers automatically record standard HTTP request logs (such as IP addresses, browser types, referring pages, and timestamps) for security, server performance monitoring, and DDOS mitigation. These logs do not contain user-entered calculator inputs.
        </p>

        <h2 class="text-xl font-bold text-[#172033]">4. Cookies &amp; Storage</h2>
        <p class="text-[#667085]">
          {{ siteConfig.name }} does not set tracking cookies to build marketing profiles. Temporary browser memory is used solely to maintain your interactive inputs during an active browsing session. When you close your browser tab or click "Reset", entered data is immediately discarded.
        </p>

        <h2 class="text-xl font-bold text-[#172033]">5. Contact Us</h2>
        <p class="text-[#667085]">
          If you have questions about this privacy statement, you may reach our team at <a :href="`mailto:${siteConfig.contactEmail}`" class="text-[#0F766E] hover:underline font-medium">{{ siteConfig.contactEmail }}</a>.
        </p>
      </div>
    </div>
  </div>
</template>
