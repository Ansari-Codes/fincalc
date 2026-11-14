<script setup lang="ts">
import { onMounted } from 'vue'
import { updatePageSeo } from '@/utils/seo'
import { siteConfig } from '@/config/site'
import Breadcrumbs from '@/components/ui/Breadcrumbs.vue'
import { tools } from '@/data/tools'
import { CheckCircle2 } from 'lucide-vue-next'

onMounted(() => {
  updatePageSeo({
    title: 'Calculation Methodology & Data Policy',
    description: `Detailed explanation of calculation algorithms, mathematical formulas, precision handling, and automated unit testing across ${siteConfig.name}.`
  })
})
</script>

<template>
  <div class="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
    <Breadcrumbs :items="[{ name: 'Methodology' }]" />

    <div class="max-w-3xl mx-auto py-6">
      <div class="text-xs font-semibold uppercase tracking-wider text-[#0F766E] mb-2">Technical Standards</div>
      <h1 class="text-3xl sm:text-5xl font-extrabold text-[#172033] tracking-tight mb-6">
        Calculation Methodology &amp; Data Policy
      </h1>

      <p class="text-lg text-[#667085] leading-relaxed mb-10">
        Transparency and mathematical accuracy are foundational to {{ siteConfig.name }}. This document details how formulas are implemented, how numerical precision is maintained, and the testing procedures used to verify calculations.
      </p>

      <div class="space-y-10 text-[#172033]">
        <!-- 1. Pure Deterministic Engine -->
        <section class="space-y-4">
          <h2 class="text-2xl font-bold text-[#172033]">1. Pure Deterministic TypeScript Engines</h2>
          <p class="text-[#667085] leading-relaxed">
            All calculation logic is decoupled completely from UI rendering. Financial computations reside in isolated TypeScript modules that behave as pure functions: identical inputs will strictly and reliably yield identical outputs with zero side effects.
          </p>
        </section>

        <!-- 2. Tool by Tool Formulas -->
        <section class="space-y-6">
          <h2 class="text-2xl font-bold text-[#172033]">2. Mathematical Formulas by Calculator</h2>

          <div v-for="t in tools" :key="t.slug" class="p-6 rounded-2xl bg-white border border-[#E4E9F0] space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="font-bold text-lg text-[#172033]">{{ t.name }}</h3>
              <RouterLink :to="t.path" class="text-xs font-semibold text-[#0F766E] hover:underline">
                View Tool &rarr;
              </RouterLink>
            </div>
            <div class="bg-[#F7F9FC] p-3 rounded-xl font-mono text-xs sm:text-sm text-[#172033] whitespace-pre-line border border-[#E4E9F0]">
              {{ t.formula }}
            </div>
            <ul class="text-xs text-[#667085] space-y-1 list-disc list-inside">
              <li v-for="(assump, i) in t.assumptions" :key="i">
                {{ assump }}
              </li>
            </ul>
          </div>
        </section>

        <!-- 3. Rounding & Numerical Precision -->
        <section class="space-y-4">
          <h2 class="text-2xl font-bold text-[#172033]">3. Precision &amp; Rounding Standards</h2>
          <p class="text-[#667085] leading-relaxed">
            Intermediate mathematical steps are evaluated using full IEEE 754 floating-point double-precision representation. Rounding is never applied mid-calculation to prevent compounded error propagation.
          </p>
          <p class="text-[#667085] leading-relaxed">
            Rounding to standard monetary minor units (cents) is executed strictly at the final display layer using standard half-up or half-even rounding rules appropriate for financial reporting.
          </p>
        </section>

        <!-- 4. Boundary Protection & Guard Rails -->
        <section class="space-y-4">
          <h2 class="text-2xl font-bold text-[#172033]">4. Division by Zero &amp; Infinite Loop Protection</h2>
          <ul class="space-y-2 text-sm text-[#667085] list-disc list-inside leading-relaxed">
            <li><strong>Division by Zero:</strong> When cost or denominator inputs are zero, formulas return safe default zero or alert states rather than producing <code class="text-xs bg-[#F7F9FC] px-1 py-0.5 rounded">NaN</code> or <code class="text-xs bg-[#F7F9FC] px-1 py-0.5 rounded">Infinity</code>.</li>
            <li><strong>Amortization Loop Bounds:</strong> Iterative models (such as credit card repayment and retirement longevity) enforce strict horizon limits (e.g., 50 to 80 years) and detect non-converging scenarios (e.g., payment insufficient to cover monthly interest).</li>
          </ul>
        </section>

        <!-- 5. Verification & Unit Testing -->
        <section class="space-y-4">
          <h2 class="text-2xl font-bold text-[#172033]">5. Automated Test Coverage</h2>
          <p class="text-[#667085] leading-relaxed">
            Every calculation module is covered by automated unit tests using Vitest. Test suites validate:
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#667085]">
            <div class="p-3 bg-white border border-[#E4E9F0] rounded-xl flex items-center gap-2">
              <CheckCircle2 class="w-4 h-4 text-[#15803D]" />
              <span>Standard normal sample scenarios</span>
            </div>
            <div class="p-3 bg-white border border-[#E4E9F0] rounded-xl flex items-center gap-2">
              <CheckCircle2 class="w-4 h-4 text-[#15803D]" />
              <span>Zero, boundary, and negative values</span>
            </div>
            <div class="p-3 bg-white border border-[#E4E9F0] rounded-xl flex items-center gap-2">
              <CheckCircle2 class="w-4 h-4 text-[#15803D]" />
              <span>Known reference benchmark values</span>
            </div>
            <div class="p-3 bg-white border border-[#E4E9F0] rounded-xl flex items-center gap-2">
              <CheckCircle2 class="w-4 h-4 text-[#15803D]" />
              <span>Regression prevention upon code updates</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
