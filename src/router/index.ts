import { createRouter, createWebHistory } from 'vue-router'

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
      component: () => import('@/pages/StockAveragePage.vue')
    },
    {
      path: '/roi-calculator/',
      name: 'roi-calculator',
      component: () => import('@/pages/RoiPage.vue')
    },
    {
      path: '/commission-calculator/',
      name: 'commission-calculator',
      component: () => import('@/pages/CommissionPage.vue')
    },
    {
      path: '/credit-card-apr-calculator/',
      name: 'credit-card-apr-calculator',
      component: () => import('@/pages/CreditCardAprPage.vue')
    },
    {
      path: '/compound-interest-calculator/',
      name: 'compound-interest-calculator',
      component: () => import('@/pages/CompoundInterestPage.vue')
    },
    {
      path: '/how-long-will-my-money-last/',
      name: 'how-long-will-my-money-last',
      component: () => import('@/pages/RetirementLongevityPage.vue')
    },
    {
      path: '/retirement-savings-calculator/',
      name: 'retirement-savings-calculator',
      component: () => import('@/pages/RetirementGoalPage.vue')
    },
    {
      path: '/loan-payment-calculator/',
      name: 'loan-payment-calculator',
      component: () => import('@/pages/LoanPaymentPage.vue')
    },
    {
      path: '/debt-payoff-planner/',
      name: 'debt-payoff-planner',
      component: () => import('@/pages/DebtPayoffPage.vue')
    },
    {
      path: '/break-even-calculator/',
      name: 'break-even-calculator',
      component: () => import('@/pages/BreakEvenPage.vue')
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
      component: () => import('@/pages/ArticlePage.vue')
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
