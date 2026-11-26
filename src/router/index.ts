import { createRouter, createWebHistory } from 'vue-router'
// Eagerly imported (not lazy): this is the top SEO landing page and it has a
// full prerendered shell. If the route were lazy, Vue would mount the app
// shell (header + footer, empty RouterView) and only render the page once the
// chunk arrived ~2s later — the footer jumping to the top of the viewport and
// back is a ~0.84 CLS hit on mobile. Eager import makes the first mount
// render the whole page in one synchronous pass, so the prerendered shell is
// replaced without any visible gap.
import CreditCardAprPage from '@/pages/CreditCardAprPage.vue'
// Same treatment for the retirement calculator: it also has a full
// prerendered shell now, and it is the closest page to page 1 (pos 11.89).
import RetirementGoalPage from '@/pages/RetirementGoalPage.vue'
// Same treatment for the stock average and loan payment calculators: both
// have full prerendered shells now (pos 32.97 and 39.93).
import StockAveragePage from '@/pages/StockAveragePage.vue'
import LoanPaymentPage from '@/pages/LoanPaymentPage.vue'
// Same treatment for the ROI and break-even calculators and the article
// pages: the ROI calculator page was refused indexing (thin content) and
// the articles showed a blank white main area on first load because the
// route was lazy — the mount gap emptied RouterView until the chunk arrived.
import RoiPage from '@/pages/RoiPage.vue'
import BreakEvenPage from '@/pages/BreakEvenPage.vue'
import ArticlePage from '@/pages/ArticlePage.vue'
// Same treatment for the compound-interest calculator: it was crawled but
// not indexed (thin content), and the lazy route left the same mount gap.
import CompoundInterestPage from '@/pages/CompoundInterestPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/pages/HomePage.vue')
    },
    {
      path: '/tools/',
      name: 'tools',
      component: () => import('@/pages/ToolsPage.vue')
    },
    {
      path: '/tools/:category/',
      name: 'category',
      component: () => import('@/pages/CategoryPage.vue')
    },
    // Working Financial Tools
    {
      path: '/stock-average-calculator/',
      name: 'stock-average-calculator',
      component: StockAveragePage
    },
    {
      path: '/roi-calculator/',
      name: 'roi-calculator',
      component: RoiPage
    },
    {
      path: '/commission-calculator/',
      name: 'commission-calculator',
      component: () => import('@/pages/CommissionPage.vue')
    },
    {
      path: '/credit-card-apr-calculator/',
      name: 'credit-card-apr-calculator',
      component: CreditCardAprPage
    },
    {
      path: '/compound-interest-calculator/',
      name: 'compound-interest-calculator',
      component: CompoundInterestPage
    },
    {
      path: '/how-long-will-my-money-last/',
      name: 'how-long-will-my-money-last',
      component: () => import('@/pages/RetirementLongevityPage.vue')
    },
    {
      path: '/retirement-savings-calculator/',
      name: 'retirement-savings-calculator',
      component: RetirementGoalPage
    },
    {
      path: '/loan-payment-calculator/',
      name: 'loan-payment-calculator',
      component: LoanPaymentPage
    },
    {
      path: '/debt-payoff-planner/',
      name: 'debt-payoff-planner',
      component: () => import('@/pages/DebtPayoffPage.vue')
    },
    {
      path: '/break-even-calculator/',
      name: 'break-even-calculator',
      component: BreakEvenPage
    },
    // Educational Section
    {
      path: '/learn/',
      name: 'learn',
      component: () => import('@/pages/LearnPage.vue')
    },
    {
      path: '/learn/:slug/',
      name: 'article',
      component: ArticlePage
    },
    // Trust & Policy Pages
    {
      path: '/about/',
      name: 'about',
      component: () => import('@/pages/AboutPage.vue')
    },
    {
      path: '/methodology/',
      name: 'methodology',
      component: () => import('@/pages/MethodologyPage.vue')
    },
    {
      path: '/financial-disclaimer/',
      name: 'financial-disclaimer',
      component: () => import('@/pages/FinancialDisclaimerPage.vue')
    },
    {
      path: '/contact/',
      name: 'contact',
      component: () => import('@/pages/ContactPage.vue')
    },
    {
      path: '/privacy/',
      name: 'privacy',
      component: () => import('@/pages/PrivacyPage.vue')
    },
    {
      path: '/terms/',
      name: 'terms',
      component: () => import('@/pages/TermsPage.vue')
    },
    // 404 Fallback
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/pages/NotFoundPage.vue')
    }
  ]
})

export default router
