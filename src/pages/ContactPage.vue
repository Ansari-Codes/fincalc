<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { updatePageSeo } from '@/utils/seo'
import { siteConfig } from '@/config/site'
import Breadcrumbs from '@/components/ui/Breadcrumbs.vue'
import { Mail, CheckCircle2 } from 'lucide-vue-next'

onMounted(() => {
  updatePageSeo({
    title: `Contact Us – ${siteConfig.name}`,
    description: `Get in touch with the ${siteConfig.name} team for feedback, calculation questions, or partnership inquiries.`
  })
})

const name = ref('')
const email = ref('')
const subject = ref('')
const message = ref('')
const submitted = ref(false)

function handleSubmit() {
  if (name.value && email.value && message.value) {
    submitted.value = true
  }
}
</script>

<template>
  <div class="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
    <Breadcrumbs :items="[{ name: 'Contact' }]" />

    <div class="max-w-2xl mx-auto py-6">
      <div class="text-xs font-semibold uppercase tracking-wider text-[#0F766E] mb-2">Get in Touch</div>
      <h1 class="text-3xl sm:text-5xl font-extrabold text-[#172033] tracking-tight mb-4">
        Contact the Team
      </h1>
      <p class="text-base sm:text-lg text-[#667085] leading-relaxed mb-8">
        Have feedback about our calculators, noticed a formula discrepancy, or want to suggest a new tool? We'd love to hear from you.
      </p>

      <div class="bg-white rounded-2xl border border-[#E4E9F0] p-6 sm:p-8 shadow-sm">
        <div v-if="submitted" class="p-8 text-center space-y-3">
          <div class="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 class="w-6 h-6" />
          </div>
          <h2 class="text-xl font-bold text-[#172033]">Thank you for your message!</h2>
          <p class="text-sm text-[#667085] leading-relaxed">
            Your inquiry has been recorded. Our team reviews all user submissions and calculation feedback.
          </p>
          <button
            type="button"
            class="mt-4 px-4 py-2 bg-[#0F766E] text-white text-xs font-semibold rounded-lg hover:bg-[#115E59]"
            @click="submitted = false; message = ''; subject = ''"
          >
            Send another message
          </button>
        </div>

        <form v-else class="space-y-4" @submit.prevent="handleSubmit">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-[#172033] mb-1">Your Name</label>
              <input
                v-model="name"
                type="text"
                required
                placeholder="Jane Doe"
                class="w-full px-3 py-2 text-sm bg-white border border-[#E4E9F0] rounded-lg focus:border-[#0F766E]"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-[#172033] mb-1">Your Email</label>
              <input
                v-model="email"
                type="email"
                required
                placeholder="jane@example.com"
                class="w-full px-3 py-2 text-sm bg-white border border-[#E4E9F0] rounded-lg focus:border-[#0F766E]"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-[#172033] mb-1">Subject</label>
            <input
              v-model="subject"
              type="text"
              required
              placeholder="Calculation feedback / Feature request"
              class="w-full px-3 py-2 text-sm bg-white border border-[#E4E9F0] rounded-lg focus:border-[#0F766E]"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-[#172033] mb-1">Message</label>
            <textarea
              v-model="message"
              rows="5"
              required
              placeholder="Describe your inquiry or the tool you are referencing..."
              class="w-full px-3 py-2 text-sm bg-white border border-[#E4E9F0] rounded-lg focus:border-[#0F766E]"
            ></textarea>
          </div>

          <button
            type="submit"
            class="w-full py-2.5 px-4 bg-[#0F766E] text-white font-semibold text-sm rounded-xl hover:bg-[#115E59] transition-colors shadow-sm"
          >
            Submit Message
          </button>
        </form>

        <div class="mt-8 pt-6 border-t border-[#E4E9F0] flex items-center justify-between text-xs text-[#667085]">
          <span class="flex items-center gap-1.5">
            <Mail class="w-4 h-4 text-[#0F766E]" />
            <span>Direct Email: </span>
            <a :href="`mailto:${siteConfig.contactEmail}`" class="text-[#0F766E] hover:underline font-medium">
              {{ siteConfig.contactEmail }}
            </a>
          </span>
          <span>Response time: 1–2 business days</span>
        </div>
      </div>
    </div>
  </div>
</template>
