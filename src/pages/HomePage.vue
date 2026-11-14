<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { updatePageSeo } from '@/utils/seo'
import { generateWebsiteSchema } from '@/utils/structuredData'
import { siteConfig } from '@/config/site'
import { tools } from '@/data/tools'
import { articles } from '@/data/articles'
import ToolCard from '@/components/ui/ToolCard.vue'
import CategoryCard from '@/components/ui/CategoryCard.vue'
import ArticleCard from '@/components/ui/ArticleCard.vue'
import FAQAccordion from '@/components/ui/FAQAccordion.vue'
import { 
  Search, 
  ArrowRight, 
  ShieldCheck, 
  Lock 
} from '@lucide/vue'

const router = useRouter()
const searchQuery = ref('')

onMounted(() => {
  updatePageSeo({
    title: 'Financial Tools – Practical Calculators for Everyday Decisions',
    description: siteConfig.description,
    path: '/',
    jsonLd: generateWebsiteSchema()
  })
})

const filteredSearchResults = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return []
  return tools.filter(t => 
    t.name.toLowerCase().includes(q) ||
    t.shortDescription.toLowerCase().includes(q) ||
    t.categoryName.toLowerCase().includes(q)
  )
})

function onSearchEnter() {
  if (filteredSearchResults.value.length > 0) {
    router.push(filteredSearchResults.value[0].path)
  } else if (searchQuery.value.trim()) {
    router.push({ path: '/tools/', query: { q: searchQuery.value.trim() } })
  }
}

const homeFaqs = [
  {
    question: 'Are the tools free to use?',
    answer: 'Yes. All financial calculators and educational guides on this platform are 100% free to access with no paywalls or hidden trial periods.'
  },
  {
    question: 'Do I need to create an account or sign up?',
    answer: 'No registration is required. You can immediately open any tool, input your assumptions, and view the calculations without providing an email address or password.'
  },
  {
    question: 'Are calculations performed locally in my browser?',
    answer: 'Yes. All financial formulas run client-side directly on your device. We do not transmit or store your entered financial values, account balances, or interest rates on any remote server.'
  },
  {
    question: 'Are the results considered financial or tax advice?',
    answer: 'No. Outputs are educational estimates based on standard mathematical formulas and the numbers you enter. Because individual tax laws, account rules, and financial circumstances vary, results should not be used as personalized legal, tax, or investment advice.'
  },
  {
    question: 'How do I report a calculation issue or suggestion?',
    answer: `We welcome user feedback. You can reach out via our contact page or email us at ${siteConfig.contactEmail} to submit questions or methodology suggestions.`
  }
]
</script>

<template>
  <div>
    <!-- Hero Section -->
    <section class="bg-gradient-to-b from-white via-white to-[#F7F9FC] border-b border-[#E4E9F0] py-16 sm:py-24">
      <div class="max-w-[1200px] mx-auto px-4 sm:px-6 text-center">
        <!-- Trust badge -->
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E7F4F1] border border-[#0F766E]/20 text-[#0F766E] text-xs font-semibold uppercase tracking-wider mb-6">
          <ShieldCheck class="w-4 h-4" />
          <span>{{ siteConfig.promise }}</span>
        </div>

        <h1 class="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#172033] tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight mb-6">
          Make sense of your money with practical financial tools.
        </h1>

        <p class="text-base sm:text-xl text-[#667085] max-w-2xl mx-auto leading-relaxed mb-10">
          Calculate returns, estimate costs, compare scenarios, and plan ahead with simple tools built to make financial questions easier to understand.
        </p>

        <!-- Search Bar with Live Suggestions -->
        <div class="max-w-xl mx-auto mb-10 relative">
          <div class="relative flex items-center shadow-sm rounded-2xl border border-[#E4E9F0] bg-white overflow-hidden focus-within:border-[#0F766E] focus-within:ring-2 focus-within:ring-[#0F766E]/20">
            <Search class="w-5 h-5 text-[#667085] ml-4 shrink-0" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="What do you want to calculate? (e.g. stock average, ROI, APR)"
              class="w-full py-4 pl-3 pr-4 text-sm sm:text-base text-[#172033] placeholder-[#667085] focus:outline-none"
              aria-label="Search tools"
              @keydown.enter="onSearchEnter"
            />
            <button
              type="button"
              class="mr-2 px-4 py-2 bg-[#0F766E] text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-[#115E59] transition-colors shrink-0"
              @click="onSearchEnter"
            >
              Search
            </button>
          </div>

          <!-- Search Dropdown Results -->
          <div
            v-if="searchQuery.trim() && filteredSearchResults.length > 0"
            class="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-[#E4E9F0] shadow-xl z-20 text-left overflow-hidden divide-y divide-[#E4E9F0]"
          >
            <RouterLink
              v-for="item in filteredSearchResults"
              :key="item.slug"
              :to="item.path"
              class="block p-4 hover:bg-[#F7F9FC] transition-colors"
            >
              <div class="font-semibold text-sm text-[#172033]">{{ item.name }}</div>
              <div class="text-xs text-[#667085] line-clamp-1">{{ item.shortDescription }}</div>
            </RouterLink>
          </div>
          <div
            v-else-if="searchQuery.trim() && filteredSearchResults.length === 0"
            class="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-[#E4E9F0] shadow-xl z-20 p-4 text-xs text-[#667085]"
          >
            No calculators directly matching "{{ searchQuery }}". Press enter to browse directory.
          </div>
        </div>

        <!-- CTA Action Buttons -->
        <div class="flex flex-wrap items-center justify-center gap-4">
          <RouterLink
            to="/tools/"
            class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0F766E] text-white font-semibold text-base hover:bg-[#115E59] transition-colors shadow-sm"
          >
            <span>Explore all tools</span>
            <ArrowRight class="w-4 h-4" />
          </RouterLink>

          <RouterLink
            to="/tools/investing/"
            class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-[#E4E9F0] text-[#172033] font-semibold text-base hover:bg-[#F7F9FC] transition-colors"
          >
            <span>Browse investing tools</span>
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- Featured Tools Section -->
    <section class="max-w-[1200px] mx-auto px-4 sm:px-6 py-16 sm:py-20">
      <div class="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
        <div>
          <div class="text-xs font-semibold uppercase tracking-wider text-[#0F766E] mb-2">Practical Calculators</div>
          <h2 class="text-2xl sm:text-3xl font-extrabold text-[#172033]">Featured Financial Tools</h2>
        </div>
        <RouterLink to="/tools/" class="text-sm font-semibold text-[#0F766E] hover:underline flex items-center gap-1">
          <span>View all calculators</span>
          <ArrowRight class="w-4 h-4" />
        </RouterLink>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ToolCard v-for="t in tools" :key="t.slug" :tool="t" />
      </div>
    </section>

    <!-- Browse by Financial Goal Section -->
    <section class="bg-white border-y border-[#E4E9F0] py-16 sm:py-20">
      <div class="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div class="text-center max-w-2xl mx-auto mb-12">
          <div class="text-xs font-semibold uppercase tracking-wider text-[#0F766E] mb-2">Directory</div>
          <h2 class="text-2xl sm:text-3xl font-extrabold text-[#172033] mb-3">Browse by Financial Goal</h2>
          <p class="text-sm text-[#667085]">
            Select a specialized category to find calculators tailored to your current decision.
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <CategoryCard
            id="investing"
            name="Investing"
            path="/tools/investing/"
            description="Understand purchase cost basis, project return on investment, and model compound growth."
            :tool-count="3"
          />
          <CategoryCard
            id="credit-debt"
            name="Credit &amp; Debt"
            path="/tools/credit-debt/"
            description="Estimate borrowing costs, monthly finance charges, and realistic payoff schedules."
            :tool-count="1"
          />
          <CategoryCard
            id="retirement"
            name="Retirement"
            path="/tools/retirement/"
            description="Explore savings longevity, model inflation-adjusted withdrawals, and plan nest egg sustainability."
            :tool-count="2"
          />
          <CategoryCard
            id="business-finance"
            name="Business Finance"
            path="/tools/business-finance/"
            description="Calculate sales commissions across flat or tiered structures and evaluate business ROI."
            :tool-count="2"
          />
        </div>
      </div>
    </section>

    <!-- How It Works Section -->
    <section class="max-w-[1200px] mx-auto px-4 sm:px-6 py-16 sm:py-20">
      <div class="text-center max-w-2xl mx-auto mb-14">
        <div class="text-xs font-semibold uppercase tracking-wider text-[#0F766E] mb-2">Simplicity First</div>
        <h2 class="text-2xl sm:text-3xl font-extrabold text-[#172033] mb-3">How It Works</h2>
        <p class="text-sm text-[#667085]">
          Clear calculations without complicated finance software, bank logins, or software installation.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        <div class="bg-white rounded-2xl border border-[#E4E9F0] p-8 shadow-sm">
          <div class="w-12 h-12 rounded-xl bg-[#E7F4F1] text-[#0F766E] font-bold text-lg flex items-center justify-center mx-auto mb-5">
            1
          </div>
          <h3 class="text-lg font-bold text-[#172033] mb-2">Choose a Tool</h3>
          <p class="text-sm text-[#667085] leading-relaxed">
            Find the specific calculator matching your financial question from our indexed directory.
          </p>
        </div>

        <div class="bg-white rounded-2xl border border-[#E4E9F0] p-8 shadow-sm">
          <div class="w-12 h-12 rounded-xl bg-[#E7F4F1] text-[#0F766E] font-bold text-lg flex items-center justify-center mx-auto mb-5">
            2
          </div>
          <h3 class="text-lg font-bold text-[#172033] mb-2">Enter Your Numbers</h3>
          <p class="text-sm text-[#667085] leading-relaxed">
            Input your numbers into clear, validated fields with visible units and sensible starting samples.
          </p>
        </div>

        <div class="bg-white rounded-2xl border border-[#E4E9F0] p-8 shadow-sm">
          <div class="w-12 h-12 rounded-xl bg-[#E7F4F1] text-[#0F766E] font-bold text-lg flex items-center justify-center mx-auto mb-5">
            3
          </div>
          <h3 class="text-lg font-bold text-[#172033] mb-2">Review Results &amp; Assumptions</h3>
          <p class="text-sm text-[#667085] leading-relaxed">
            Get an instant result, inspect the underlying formulas, and review assumptions before relying on the estimate.
          </p>
        </div>
      </div>
    </section>

    <!-- Helpful Guides Section -->
    <section class="bg-white border-y border-[#E4E9F0] py-16 sm:py-20">
      <div class="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div class="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <div class="text-xs font-semibold uppercase tracking-wider text-[#0F766E] mb-2">Educational Library</div>
            <h2 class="text-2xl sm:text-3xl font-extrabold text-[#172033]">Helpful Financial Guides</h2>
          </div>
          <RouterLink to="/learn/" class="text-sm font-semibold text-[#0F766E] hover:underline flex items-center gap-1">
            <span>View all articles</span>
            <ArrowRight class="w-4 h-4" />
          </RouterLink>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ArticleCard v-for="a in articles.slice(0, 3)" :key="a.slug" :article="a" />
        </div>
      </div>
    </section>

    <!-- Trust & Privacy Section -->
    <section class="max-w-[1200px] mx-auto px-4 sm:px-6 py-16 sm:py-20">
      <div class="bg-[#172033] rounded-3xl p-8 sm:p-12 text-white shadow-lg">
        <div class="max-w-3xl">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Lock class="w-3.5 h-3.5" />
            <span>Private &amp; Local Calculations</span>
          </div>
          <h2 class="text-2xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Understand the numbers behind the result.
          </h2>
          <p class="text-sm sm:text-base text-gray-300 leading-relaxed mb-8">
            Financial decisions shouldn't feel like black boxes. We transparently show formulas, outline assumptions, and process your inputs entirely within your browser for complete privacy.
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-gray-700/60 text-sm">
            <div>
              <div class="font-bold text-white mb-1">Local Processing</div>
              <div class="text-gray-400 text-xs leading-relaxed">
                Calculations execute entirely inside client-side JavaScript. No account or database logs your balance or returns.
              </div>
            </div>
            <div>
              <div class="font-bold text-white mb-1">Open Formulas</div>
              <div class="text-gray-400 text-xs leading-relaxed">
                Every calculator provides its exact mathematical method and worked numerical examples.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section class="max-w-[1200px] mx-auto px-4 sm:px-6 pb-20">
      <div class="max-w-3xl mx-auto">
        <div class="text-center mb-10">
          <div class="text-xs font-semibold uppercase tracking-wider text-[#0F766E] mb-2">Common Inquiries</div>
          <h2 class="text-2xl sm:text-3xl font-extrabold text-[#172033]">Frequently Asked Questions</h2>
        </div>

        <FAQAccordion :items="homeFaqs" />
      </div>
    </section>
  </div>
</template>
