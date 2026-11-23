<script setup lang="ts">
import { ref, computed } from 'vue'
import { formatCurrency, formatPercent } from '@/utils/formatters'
import type { LoanAmortizationRow } from '@/calculations/loanPayment'
import {
  aggregateScheduleByYear,
  calculateAmortizationMilestones,
  generateSvgPath,
  generateAreaPath,
  generateStackAreaPath,
  type ChartCoordinate
} from '@/calculations/amortizationVisualization'
import {
  TrendingDown,
  PieChart,
  Layers,
  Sparkles,
  Info
} from '@lucide/vue'

export type AmortizationViewMode = 'balance' | 'breakdown' | 'cumulative'

interface Props {
  schedule: LoanAmortizationRow[]
  baselineSchedule?: LoanAmortizationRow[]
  principal: number
  annualRate: number
  extraMonthlyPayment?: number
  currency?: string
  title?: string
  interactive?: boolean
  initialView?: AmortizationViewMode
}

const props = withDefaults(defineProps<Props>(), {
  baselineSchedule: () => [],
  extraMonthlyPayment: 0,
  currency: 'USD',
  title: 'Interactive Mortgage Amortization Trajectory',
  interactive: true,
  initialView: 'balance'
})

const activeView = ref<AmortizationViewMode>(props.initialView)
const breakdownMode = ref<'monthly' | 'annual'>('monthly')
const hoveredMonth = ref<number | null>(null)
const hoveredYear = ref<number | null>(null)

// Milestones
const milestones = computed(() => {
  return calculateAmortizationMilestones(props.schedule, props.baselineSchedule)
})

const annualSummary = computed(() => {
  return aggregateScheduleByYear(props.schedule)
})

// Timeline bounds
const totalMonths = computed(() => {
  return Math.max(props.schedule.length, props.baselineSchedule.length, 1)
})

// SVG Canvas dimensions
const svgWidth = 800
const svgHeight = 360
const padLeft = 70
const padRight = 30
const padTop = 35
const padBottom = 45
const plotW = svgWidth - padLeft - padRight
const plotH = svgHeight - padTop - padBottom

// X coordinate mapping (month 0..totalMonths -> padLeft..padLeft+plotW)
function getX(m: number): number {
  return padLeft + (m / totalMonths.value) * plotW
}

// Y coordinate mapping for Balance ($0..principal)
function getYBalance(val: number): number {
  const max = Math.max(props.principal, 1)
  const normalized = Math.min(1, Math.max(0, val / max))
  return (padTop + plotH) - (normalized * plotH)
}

// ----------------------------------------------------------------------------
// VIEW A: Remaining Balance Paths
// ----------------------------------------------------------------------------
const balancePoints = computed<ChartCoordinate[]>(() => {
  if (props.schedule.length === 0) return []
  const pts: ChartCoordinate[] = [{ x: getX(0), y: getYBalance(props.principal) }]
  for (const row of props.schedule) {
    pts.push({ x: getX(row.paymentNumber), y: getYBalance(row.endingBalance) })
  }
  return pts
})

const balanceLinePath = computed(() => generateSvgPath(balancePoints.value))
const balanceAreaPath = computed(() => generateAreaPath(balancePoints.value, padTop + plotH))

const baselineBalancePoints = computed<ChartCoordinate[]>(() => {
  if (!props.baselineSchedule || props.baselineSchedule.length === 0) return []
  const pts: ChartCoordinate[] = [{ x: getX(0), y: getYBalance(props.principal) }]
  for (const row of props.baselineSchedule) {
    pts.push({ x: getX(row.paymentNumber), y: getYBalance(row.endingBalance) })
  }
  return pts
})

const baselineBalanceLinePath = computed(() => generateSvgPath(baselineBalancePoints.value))

// ----------------------------------------------------------------------------
// VIEW B: Monthly / Annual Principal vs. Interest Breakdown
// ----------------------------------------------------------------------------
// Max monthly payment for scaling
const maxMonthlyPayment = computed(() => {
  if (props.schedule.length === 0) return 1
  return Math.max(...props.schedule.map(r => r.totalPaymentThisMonth), 1)
})

function getYPayment(val: number): number {
  const normalized = Math.min(1, Math.max(0, val / maxMonthlyPayment.value))
  return (padTop + plotH) - (normalized * plotH)
}

// Max annual payment for annual bar scaling
const maxAnnualPaid = computed(() => {
  if (annualSummary.value.length === 0) return 1
  return Math.max(...annualSummary.value.map(y => y.totalPaid), 1)
})

// Principal baseline curve (0 to principal)
const breakdownPrincipalPoints = computed<ChartCoordinate[]>(() => {
  if (props.schedule.length === 0) return []
  return props.schedule.map(r => ({
    x: getX(r.paymentNumber),
    y: getYPayment(r.principalRepaid + r.additionalPayment)
  }))
})

// Interest curve (stacked on top of principal, reaching total payment)
const breakdownTotalPoints = computed<ChartCoordinate[]>(() => {
  if (props.schedule.length === 0) return []
  return props.schedule.map(r => ({
    x: getX(r.paymentNumber),
    y: getYPayment(r.totalPaymentThisMonth)
  }))
})

const principalAreaPath = computed(() => {
  return generateAreaPath(breakdownPrincipalPoints.value, padTop + plotH)
})

const interestAreaPath = computed(() => {
  return generateStackAreaPath(breakdownPrincipalPoints.value, breakdownTotalPoints.value)
})

// ----------------------------------------------------------------------------
// VIEW C: Cumulative Outlays Paths
// ----------------------------------------------------------------------------
const maxCumulativeOutlay = computed(() => {
  if (props.schedule.length === 0) return 1
  const lastRow = props.schedule[props.schedule.length - 1]
  const lastBase = props.baselineSchedule.length > 0
    ? props.baselineSchedule[props.baselineSchedule.length - 1]
    : null

  const out1 = lastRow.totalPrincipalPaidToDate + lastRow.totalInterestPaidToDate
  const out2 = lastBase ? lastBase.totalPrincipalPaidToDate + lastBase.totalInterestPaidToDate : 0
  return Math.max(out1, out2, 1)
})

function getYCumulative(val: number): number {
  const normalized = Math.min(1, Math.max(0, val / maxCumulativeOutlay.value))
  return (padTop + plotH) - (normalized * plotH)
}

const cumulativePrincipalPoints = computed<ChartCoordinate[]>(() => {
  if (props.schedule.length === 0) return []
  const pts: ChartCoordinate[] = [{ x: getX(0), y: getYCumulative(0) }]
  for (const row of props.schedule) {
    pts.push({ x: getX(row.paymentNumber), y: getYCumulative(row.totalPrincipalPaidToDate) })
  }
  return pts
})

const cumulativeInterestPoints = computed<ChartCoordinate[]>(() => {
  if (props.schedule.length === 0) return []
  const pts: ChartCoordinate[] = [{ x: getX(0), y: getYCumulative(0) }]
  for (const row of props.schedule) {
    pts.push({ x: getX(row.paymentNumber), y: getYCumulative(row.totalInterestPaidToDate) })
  }
  return pts
})

const cumulativeTotalPoints = computed<ChartCoordinate[]>(() => {
  if (props.schedule.length === 0) return []
  const pts: ChartCoordinate[] = [{ x: getX(0), y: getYCumulative(0) }]
  for (const row of props.schedule) {
    pts.push({
      x: getX(row.paymentNumber),
      y: getYCumulative(row.totalPrincipalPaidToDate + row.totalInterestPaidToDate)
    })
  }
  return pts
})

const baselineCumulativeInterestPoints = computed<ChartCoordinate[]>(() => {
  if (props.baselineSchedule.length === 0) return []
  const pts: ChartCoordinate[] = [{ x: getX(0), y: getYCumulative(0) }]
  for (const row of props.baselineSchedule) {
    pts.push({ x: getX(row.paymentNumber), y: getYCumulative(row.totalInterestPaidToDate) })
  }
  return pts
})

// Grid ticks
const xYearTicks = computed(() => {
  const years = Math.ceil(totalMonths.value / 12)
  const step = years <= 5 ? 1 : years <= 15 ? 2 : 5
  const ticks: { month: number; label: string; x: number }[] = []
  for (let y = 0; y <= years; y += step) {
    const m = Math.min(y * 12, totalMonths.value)
    ticks.push({ month: m, label: `Yr ${y}`, x: getX(m) })
  }
  return ticks
})

const yTicks = computed(() => {
  let maxVal = props.principal
  if (activeView.value === 'breakdown') {
    maxVal = breakdownMode.value === 'annual' ? maxAnnualPaid.value : maxMonthlyPayment.value
  }
  if (activeView.value === 'cumulative') maxVal = maxCumulativeOutlay.value

  const step = maxVal / 4
  const ticks: { val: number; label: string; y: number }[] = []
  for (let i = 0; i <= 4; i++) {
    const v = step * i
    let y = 0
    if (activeView.value === 'balance') y = getYBalance(v)
    else if (activeView.value === 'breakdown') {
      if (breakdownMode.value === 'annual') {
        const norm = Math.min(1, Math.max(0, v / maxAnnualPaid.value))
        y = (padTop + plotH) - (norm * plotH)
      } else {
        y = getYPayment(v)
      }
    } else {
      y = getYCumulative(v)
    }

    let label = ''
    if (v >= 1000000) label = `$${(v / 1000000).toFixed(1)}M`
    else if (v >= 1000) label = `$${Math.round(v / 1000)}k`
    else label = `$${Math.round(v)}`

    ticks.push({ val: v, label, y })
  }
  return ticks
})

// Crossover Point X coordinate
const crossoverPoint = computed(() => milestones.value?.crossoverPoint || null)
const crossoverX = computed(() => {
  return crossoverPoint.value ? getX(crossoverPoint.value.month) : null
})

// 75% Cumulative Interest Milestone
const seventyFivePercentInterestPoint = computed(() => milestones.value?.seventyFivePercentInterestPoint || null)
const seventyFiveInterestX = computed(() => {
  return seventyFivePercentInterestPoint.value ? getX(seventyFivePercentInterestPoint.value.month) : null
})

// Interactive Inspection & Scrubbing
const inspectedMonth = computed(() => {
  if (hoveredMonth.value !== null) return hoveredMonth.value
  if (crossoverPoint.value) return crossoverPoint.value.month
  return Math.min(120, props.schedule.length)
})

const inspectedRow = computed<LoanAmortizationRow | null>(() => {
  if (props.schedule.length === 0) return null
  const idx = Math.min(Math.max(0, (inspectedMonth.value || 1) - 1), props.schedule.length - 1)
  return props.schedule[idx]
})

const inspectedBaselineRow = computed<LoanAmortizationRow | null>(() => {
  if (props.baselineSchedule.length === 0) return null
  const idx = Math.min(Math.max(0, (inspectedMonth.value || 1) - 1), props.baselineSchedule.length - 1)
  return props.baselineSchedule[idx]
})

const inspectedYearSummary = computed(() => {
  if (annualSummary.value.length === 0) return null
  const targetYear = hoveredYear.value || Math.floor(((inspectedMonth.value || 1) - 1) / 12) + 1
  return annualSummary.value.find(y => y.year === targetYear) || annualSummary.value[0]
})

function handleSvgMouseMove(e: MouseEvent) {
  const svgEl = e.currentTarget as SVGSVGElement
  const rect = svgEl.getBoundingClientRect()
  const mouseX = e.clientX - rect.left
  const svgMouseX = (mouseX / rect.width) * svgWidth

  const clampedX = Math.max(padLeft, Math.min(padLeft + plotW, svgMouseX))
  const month = Math.round(((clampedX - padLeft) / plotW) * totalMonths.value)
  hoveredMonth.value = Math.max(1, Math.min(totalMonths.value, month))
  hoveredYear.value = Math.floor((Math.max(1, month) - 1) / 12) + 1
}

function handleSvgMouseLeave() {
  hoveredMonth.value = null
  hoveredYear.value = null
}
</script>

<template>
  <section class="bg-white rounded-3xl border border-[#E2E8F0] p-5 sm:p-8 shadow-sm">
    <!-- Header: Title & View Tabs -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-[#F1F5F9]">
      <div>
        <div class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0F766E] bg-[#E7F4F1] px-3 py-1 rounded-full mb-1.5">
          <TrendingDown class="w-3.5 h-3.5" />
          <span>Interactive Visualization Engine</span>
        </div>
        <h2 class="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
          {{ title }}
        </h2>
        <p class="text-xs sm:text-sm text-[#64748B] mt-1">
          Explore how loan principal decumulates, when the interest-to-principal crossover occurs, and how extra prepayments compress the amortization curve.
        </p>
      </div>

      <!-- Segmented View Tabs -->
      <div class="flex items-center gap-1.5 p-1 bg-[#F1F5F9] rounded-2xl self-start md:self-center shrink-0" role="tablist" aria-label="Amortization visualization views">
        <button
          type="button"
          role="tab"
          :aria-selected="activeView === 'balance'"
          @click="activeView = 'balance'"
          :class="activeView === 'balance' ? 'bg-white text-[#0F766E] shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'"
          class="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all"
        >
          <TrendingDown class="w-3.5 h-3.5" />
          <span>Remaining Balance</span>
        </button>

        <button
          type="button"
          role="tab"
          :aria-selected="activeView === 'breakdown'"
          @click="activeView = 'breakdown'"
          :class="activeView === 'breakdown' ? 'bg-white text-[#0F766E] shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'"
          class="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all"
        >
          <PieChart class="w-3.5 h-3.5" />
          <span>Principal vs. Interest</span>
        </button>

        <button
          type="button"
          role="tab"
          :aria-selected="activeView === 'cumulative'"
          @click="activeView = 'cumulative'"
          :class="activeView === 'cumulative' ? 'bg-white text-[#0F766E] shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'"
          class="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all"
        >
          <Layers class="w-3.5 h-3.5" />
          <span>Cumulative Outlays</span>
        </button>
      </div>
    </div>

    <!-- Active Milestone & Acceleration Highlight Banner -->
    <div class="my-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
      <!-- Card 1: Initial Loan Baseline -->
      <div class="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
        <div class="text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-1">Mortgage Principal</div>
        <div class="text-base font-extrabold text-[#0F172A]">
          {{ formatCurrency(principal, currency) }}
        </div>
        <div class="text-[11px] text-[#64748B] mt-0.5">Fixed at {{ formatPercent(annualRate) }} APR</div>
      </div>

      <!-- Card 2: Crossover Point Milestone -->
      <div class="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200">
        <div class="text-[11px] font-bold uppercase tracking-wider text-[#0F766E] mb-1 flex items-center justify-between">
          <span>Crossover Month</span>
          <span v-if="crossoverPoint" class="px-1.5 py-0.5 rounded bg-[#0F766E] text-white text-[10px] font-bold">Month {{ crossoverPoint.month }}</span>
        </div>
        <div v-if="crossoverPoint" class="text-base font-extrabold text-[#0F172A]">
          Year {{ crossoverPoint.year }}, Month {{ crossoverPoint.monthInYear }}
        </div>
        <div v-else class="text-base font-extrabold text-[#0F172A]">N/A</div>
        <div class="text-[11px] text-[#0F766E] mt-0.5">Principal repaid surpasses interest fee</div>
      </div>

      <!-- Card 3: Milestone Horizon (50% Balance Point or 75% Cumulative Interest) -->
      <div class="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
        <template v-if="activeView === 'cumulative' && milestones?.seventyFivePercentInterestPoint">
          <div class="text-[11px] font-bold uppercase tracking-wider text-amber-700 mb-1">75% Interest Milestone</div>
          <div class="text-base font-extrabold text-[#0F172A]">
            Month {{ milestones.seventyFivePercentInterestPoint.month }} (~{{ milestones.seventyFivePercentInterestPoint.year }} Yrs)
          </div>
          <div class="text-[11px] text-[#64748B] mt-0.5">
            {{ formatCurrency(milestones.seventyFivePercentInterestPoint.cumulativeInterest, currency) }} of interest paid
          </div>
        </template>
        <template v-else>
          <div class="text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-1">50% Balance Point</div>
          <div v-if="milestones?.halfwayBalancePoint" class="text-base font-extrabold text-[#0F172A]">
            Month {{ milestones.halfwayBalancePoint.month }} (~{{ milestones.halfwayBalancePoint.year }} Yrs)
          </div>
          <div v-else class="text-base font-extrabold text-[#0F172A]">N/A</div>
          <div class="text-[11px] text-[#64748B] mt-0.5">Balance drops below {{ formatCurrency(principal / 2, currency) }}</div>
        </template>
      </div>

      <!-- Card 4: Acceleration Savings Callout -->
      <div
        :class="milestones?.comparisonWithBaseline ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B]'"
        class="p-3.5 rounded-2xl border"
      >
        <div class="text-[11px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
          <Sparkles v-if="milestones?.comparisonWithBaseline" class="w-3.5 h-3.5 text-emerald-600" />
          <span>Prepayment Impact</span>
        </div>
        <div v-if="milestones?.comparisonWithBaseline" class="text-base font-extrabold text-emerald-800">
          Save {{ formatCurrency(milestones.comparisonWithBaseline.interestSaved, currency) }}
        </div>
        <div v-else class="text-base font-extrabold text-[#0F172A]">Scheduled Terms</div>
        <div class="text-[11px] mt-0.5">
          {{ milestones?.comparisonWithBaseline ? `Retires ${milestones.comparisonWithBaseline.monthsSaved} months early` : 'Add extra payment to compare' }}
        </div>
      </div>
    </div>

    <!-- Chart Legend & Controls -->
    <div class="flex flex-wrap items-center justify-between gap-3 mb-3 text-xs">
      <!-- Legend for View A -->
      <div v-if="activeView === 'balance'" class="flex items-center gap-4 text-[#475569]">
        <div class="flex items-center gap-2">
          <span class="w-3.5 h-1.5 rounded-full bg-[#0F766E]"></span>
          <span class="font-bold text-[#0F172A]">{{ extraMonthlyPayment ? 'Accelerated Balance' : 'Outstanding Balance' }}</span>
        </div>
        <div v-if="baselineSchedule.length > 0 && extraMonthlyPayment > 0" class="flex items-center gap-2">
          <span class="w-4 h-0.5 border-t-2 border-dashed border-[#94A3B8]"></span>
          <span>Standard 30-Yr Baseline</span>
        </div>
        <div v-if="crossoverPoint" class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          <span>Crossover (Mo {{ crossoverPoint.month }})</span>
        </div>
      </div>

      <!-- Legend for View B -->
      <div v-else-if="activeView === 'breakdown'" class="flex items-center gap-4 text-[#475569]">
        <div class="flex items-center gap-2">
          <span class="w-3.5 h-3.5 rounded-md bg-[#0F766E]"></span>
          <span class="font-bold text-[#0F172A]">Principal Reduction</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-3.5 h-3.5 rounded-md bg-amber-500"></span>
          <span class="font-bold text-[#0F172A]">Monthly Interest Charge</span>
        </div>
        <div v-if="crossoverPoint" class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          <span>Crossover Milestone</span>
        </div>

        <!-- Mode toggle for View B (Monthly curve vs Annual bars) -->
        <div class="flex items-center gap-1 bg-[#F1F5F9] p-0.5 rounded-lg ml-auto">
          <button
            type="button"
            @click="breakdownMode = 'monthly'"
            :class="breakdownMode === 'monthly' ? 'bg-white text-[#0F766E] shadow-2xs font-bold' : 'text-[#64748B]'"
            class="px-2 py-1 rounded-md text-[11px] transition-all"
          >
            Monthly Curve
          </button>
          <button
            type="button"
            @click="breakdownMode = 'annual'"
            :class="breakdownMode === 'annual' ? 'bg-white text-[#0F766E] shadow-2xs font-bold' : 'text-[#64748B]'"
            class="px-2 py-1 rounded-md text-[11px] transition-all"
          >
            Annual Bars
          </button>
        </div>
      </div>

      <!-- Legend for View C -->
      <div v-else class="flex items-center gap-4 text-[#475569]">
        <div class="flex items-center gap-2">
          <span class="w-3.5 h-1.5 rounded-full bg-[#0F172A]"></span>
          <span class="font-bold text-[#0F172A]">Total Outlay (P + I)</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-3.5 h-1.5 rounded-full bg-[#0F766E]"></span>
          <span class="font-bold text-[#0F766E]">Cumulative Principal</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-3.5 h-1.5 rounded-full bg-amber-500"></span>
          <span class="font-bold text-amber-600">Cumulative Interest</span>
        </div>
        <div v-if="seventyFivePercentInterestPoint" class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
          <span>75% Interest (Mo {{ seventyFivePercentInterestPoint.month }})</span>
        </div>
        <div v-if="baselineSchedule.length > 0 && extraMonthlyPayment > 0" class="flex items-center gap-2">
          <span class="w-4 h-0.5 border-t-2 border-dashed border-[#94A3B8]"></span>
          <span>Standard Baseline Interest</span>
        </div>
      </div>

      <!-- Live Inspection Prompt -->
      <div v-if="activeView !== 'breakdown' || breakdownMode === 'monthly'" class="text-[11px] text-[#64748B] flex items-center gap-1.5 bg-[#F8FAFC] px-2.5 py-1 rounded-lg border border-[#E2E8F0]">
        <Info class="w-3.5 h-3.5 text-[#0F766E]" />
        <span>Hover or touch chart to inspect any month</span>
      </div>
    </div>

    <!-- Main SVG Chart Container -->
    <div class="relative w-full bg-[#FAFCFC] border border-[#E2E8F0] rounded-2xl overflow-hidden select-none">
      <svg
        :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
        class="w-full h-auto cursor-crosshair block"
        preserveAspectRatio="xMidYMid meet"
        @mousemove="handleSvgMouseMove"
        @mouseleave="handleSvgMouseLeave"
        role="img"
        :aria-label="`Mortgage amortization chart: ${title}`"
      >
        <defs>
          <!-- Gradient for Remaining Balance -->
          <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#0F766E" stop-opacity="0.28" />
            <stop offset="100%" stop-color="#0F766E" stop-opacity="0.02" />
          </linearGradient>

          <!-- Gradient for Principal Layer -->
          <linearGradient id="principalGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#14B8A6" stop-opacity="0.75" />
            <stop offset="100%" stop-color="#0F766E" stop-opacity="0.9" />
          </linearGradient>

          <!-- Gradient for Interest Layer -->
          <linearGradient id="interestGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#F59E0B" stop-opacity="0.8" />
            <stop offset="100%" stop-color="#D97706" stop-opacity="0.9" />
          </linearGradient>
        </defs>

        <!-- Horizontal Gridlines & Y-Axis Ticks -->
        <g class="grid-y text-[#94A3B8]">
          <g v-for="tick in yTicks" :key="tick.label">
            <line
              :x1="padLeft"
              :y1="tick.y"
              :x2="svgWidth - padRight"
              :y2="tick.y"
              stroke="#E2E8F0"
              stroke-width="1"
              stroke-dasharray="3 3"
            />
            <text
              :x="padLeft - 8"
              :y="tick.y + 4"
              text-anchor="end"
              class="text-[10px] font-medium fill-[#64748B]"
            >
              {{ tick.label }}
            </text>
          </g>
        </g>

        <!-- Vertical Gridlines & X-Axis Ticks -->
        <g class="grid-x text-[#94A3B8]">
          <g v-for="tick in xYearTicks" :key="tick.label">
            <line
              :x1="tick.x"
              :y1="padTop"
              :x2="tick.x"
              :y2="padTop + plotH"
              stroke="#E2E8F0"
              stroke-width="1"
              stroke-dasharray="3 3"
            />
            <text
              :x="tick.x"
              :y="padTop + plotH + 18"
              text-anchor="middle"
              class="text-[10px] font-medium fill-[#64748B]"
            >
              {{ tick.label }}
            </text>
          </g>
        </g>

        <!-- Axes lines -->
        <line
          :x1="padLeft"
          :y1="padTop + plotH"
          :x2="svgWidth - padRight"
          :y2="padTop + plotH"
          stroke="#CBD5E1"
          stroke-width="1.5"
        />
        <line
          :x1="padLeft"
          :y1="padTop"
          :x2="padLeft"
          :y2="padTop + plotH"
          stroke="#CBD5E1"
          stroke-width="1.5"
        />

        <!-- ============================================================ -->
        <!-- VIEW A: Remaining Balance Curves                             -->
        <!-- ============================================================ -->
        <g v-if="activeView === 'balance'">
          <!-- Baseline standard curve if extra payment active -->
          <path
            v-if="baselineSchedule.length > 0 && extraMonthlyPayment > 0"
            :d="baselineBalanceLinePath"
            fill="none"
            stroke="#94A3B8"
            stroke-width="2"
            stroke-dasharray="4 4"
          />

          <!-- Active balance area fill -->
          <path
            :d="balanceAreaPath"
            fill="url(#balanceGradient)"
          />

          <!-- Active balance line -->
          <path
            :d="balanceLinePath"
            fill="none"
            stroke="#0F766E"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          />

          <!-- Crossover vertical guide if available -->
          <g v-if="crossoverX !== null && crossoverPoint">
            <line
              :x1="crossoverX"
              :y1="padTop"
              :x2="crossoverX"
              :y2="padTop + plotH"
              stroke="#F43F5E"
              stroke-width="1.5"
              stroke-dasharray="4 3"
            />
            <!-- Crossover circle on curve -->
            <circle
              :cx="crossoverX"
              :cy="getYBalance(schedule[crossoverPoint.month - 1]?.endingBalance || 0)"
              r="4.5"
              fill="#F43F5E"
              stroke="#FFFFFF"
              stroke-width="2"
            />
          </g>
        </g>

        <!-- ============================================================ -->
        <!-- VIEW B: Principal vs. Interest Distribution                 -->
        <!-- ============================================================ -->
        <g v-else-if="activeView === 'breakdown'">
          <!-- Mode 1: Continuous Monthly Stacked Area -->
          <g v-if="breakdownMode === 'monthly'">
            <!-- Stacked Interest Area (Top layer) -->
            <path
              :d="interestAreaPath"
              fill="url(#interestGradient)"
            />

            <!-- Stacked Principal Area (Bottom layer) -->
            <path
              :d="principalAreaPath"
              fill="url(#principalGradient)"
            />

            <!-- Crossover marker line -->
            <g v-if="crossoverX !== null && crossoverPoint">
              <line
                :x1="crossoverX"
                :y1="padTop"
                :x2="crossoverX"
                :y2="padTop + plotH"
                stroke="#F43F5E"
                stroke-width="2"
                stroke-dasharray="4 3"
              />
              <rect
                :x="crossoverX - 45"
                :y="padTop + 6"
                width="90"
                height="20"
                rx="6"
                fill="#F43F5E"
              />
              <text
                :x="crossoverX"
                :y="padTop + 20"
                text-anchor="middle"
                class="text-[10px] font-bold fill-white"
              >
                Crossover Mo {{ crossoverPoint.month }}
              </text>
            </g>
          </g>

          <!-- Mode 2: Annual Stacked Bars -->
          <g v-else>
            <g v-for="y in annualSummary" :key="y.year">
              <!-- Bar X and Width calculation -->
              <!-- X position centered on the year -->
              <g :transform="`translate(${getX(y.year * 12 - 6)}, 0)`">
                <!-- Interest Bar (top portion) -->
                <rect
                  :x="-Math.max(2, (plotW / annualSummary.length) * 0.35)"
                  :y="(padTop + plotH) - ((y.totalPaid / maxAnnualPaid) * plotH)"
                  :width="Math.max(4, (plotW / annualSummary.length) * 0.7)"
                  :height="Math.max(1, ((y.totalInterestPaid) / maxAnnualPaid) * plotH)"
                  fill="#F59E0B"
                  rx="1"
                />
                <!-- Principal Bar (bottom portion) -->
                <rect
                  :x="-Math.max(2, (plotW / annualSummary.length) * 0.35)"
                  :y="(padTop + plotH) - ((y.totalPrincipalPaid / maxAnnualPaid) * plotH)"
                  :width="Math.max(4, (plotW / annualSummary.length) * 0.7)"
                  :height="Math.max(1, (y.totalPrincipalPaid / maxAnnualPaid) * plotH)"
                  fill="#0F766E"
                  rx="1"
                />
              </g>
            </g>
          </g>
        </g>

        <!-- ============================================================ -->
        <!-- VIEW C: Cumulative Outlay Curves                            -->
        <!-- ============================================================ -->
        <g v-else>
          <!-- Baseline standard interest curve (if extra payment active) -->
          <path
            v-if="baselineSchedule.length > 0 && extraMonthlyPayment > 0"
            :d="generateSvgPath(baselineCumulativeInterestPoints)"
            fill="none"
            stroke="#94A3B8"
            stroke-width="2"
            stroke-dasharray="4 4"
          />

          <!-- Cumulative Principal Line -->
          <path
            :d="generateSvgPath(cumulativePrincipalPoints)"
            fill="none"
            stroke="#0F766E"
            stroke-width="2.5"
            stroke-linecap="round"
          />

          <!-- Cumulative Interest Line -->
          <path
            :d="generateSvgPath(cumulativeInterestPoints)"
            fill="none"
            stroke="#F59E0B"
            stroke-width="2.5"
            stroke-linecap="round"
          />

          <!-- Total Outlay Line (P + I) -->
          <path
            :d="generateSvgPath(cumulativeTotalPoints)"
            fill="none"
            stroke="#0F172A"
            stroke-width="3"
            stroke-linecap="round"
          />

          <!-- 75% Cumulative Interest Marker -->
          <g v-if="seventyFiveInterestX !== null && seventyFivePercentInterestPoint">
            <line
              :x1="seventyFiveInterestX"
              :y1="padTop"
              :x2="seventyFiveInterestX"
              :y2="padTop + plotH"
              stroke="#F59E0B"
              stroke-width="1.5"
              stroke-dasharray="3 3"
            />
            <rect
              :x="seventyFiveInterestX - 42"
              :y="padTop + 6"
              width="84"
              height="20"
              rx="6"
              fill="#D97706"
            />
            <text
              :x="seventyFiveInterestX"
              :y="padTop + 20"
              text-anchor="middle"
              class="text-[10px] font-bold fill-white"
            >
              75% Int Mo {{ seventyFivePercentInterestPoint.month }}
            </text>
          </g>
        </g>

        <!-- Active Inspection Crosshair -->
        <g v-if="inspectedMonth !== null && inspectedRow">
          <line
            :x1="getX(inspectedMonth)"
            :y1="padTop"
            :x2="getX(inspectedMonth)"
            :y2="padTop + plotH"
            stroke="#0F172A"
            stroke-width="1.5"
            stroke-dasharray="2 2"
          />
          <circle
            :cx="getX(inspectedMonth)"
            :cy="activeView === 'balance'
              ? getYBalance(inspectedRow.endingBalance)
              : activeView === 'breakdown'
                ? getYPayment(inspectedRow.totalPaymentThisMonth)
                : getYCumulative(inspectedRow.totalPrincipalPaidToDate + inspectedRow.totalInterestPaidToDate)"
            r="5"
            fill="#0F766E"
            stroke="#FFFFFF"
            stroke-width="2.5"
          />
        </g>
      </svg>
    </div>

    <!-- Interactive Inspection HUD / Summary Strip -->
    <div v-if="inspectedRow" class="mt-4 p-4 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1] text-xs">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 mb-3 border-b border-[#E2E8F0]">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-[#0F766E]"></span>
          <span class="font-bold text-[#0F172A] text-sm">
            Month {{ inspectedRow.paymentNumber }}
            <span class="text-[#64748B] font-normal text-xs">
              (Year {{ Math.floor((inspectedRow.paymentNumber - 1) / 12) + 1 }}, Month {{ ((inspectedRow.paymentNumber - 1) % 12) + 1 }})
            </span>
          </span>
        </div>

        <div class="flex items-center gap-3 text-xs">
          <div>
            <span class="text-[#64748B]">Remaining Balance:</span>
            <strong class="text-[#0F172A] ml-1">{{ formatCurrency(inspectedRow.endingBalance, currency) }}</strong>
          </div>
          <div v-if="inspectedBaselineRow && extraMonthlyPayment > 0" class="text-[#64748B]">
            <span>Standard:</span>
            <span class="line-through ml-1">{{ formatCurrency(inspectedBaselineRow.endingBalance, currency) }}</span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
        <div>
          <span class="text-[#64748B] block">Principal Repaid:</span>
          <strong class="text-[#0F766E] text-xs sm:text-sm font-black">
            {{ formatCurrency(inspectedRow.principalRepaid + inspectedRow.additionalPayment, currency) }}
          </strong>
        </div>

        <div>
          <span class="text-[#64748B] block">Interest Charged:</span>
          <strong class="text-amber-700 text-xs sm:text-sm font-black">
            {{ formatCurrency(inspectedRow.interest, currency) }}
          </strong>
        </div>

        <div>
          <span class="text-[#64748B] block">Cumulative Principal:</span>
          <strong class="text-[#0F172A] text-xs sm:text-sm font-bold">
            {{ formatCurrency(inspectedRow.totalPrincipalPaidToDate, currency) }}
          </strong>
        </div>

        <div>
          <span class="text-[#64748B] block">Cumulative Interest:</span>
          <strong class="text-[#0F172A] text-xs sm:text-sm font-bold">
            {{ formatCurrency(inspectedRow.totalInterestPaidToDate, currency) }}
          </strong>
        </div>
      </div>

      <!-- Additional Annual Snapshot if Annual mode is active in Breakdown -->
      <div v-if="activeView === 'breakdown' && breakdownMode === 'annual' && inspectedYearSummary" class="mt-3 pt-3 border-t border-[#E2E8F0] grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-[#475569]">
        <div>
          <span>Year {{ inspectedYearSummary.year }} Total Principal:</span>
          <strong class="text-[#0F766E] ml-1">{{ formatCurrency(inspectedYearSummary.totalPrincipalPaid, currency) }}</strong>
        </div>
        <div>
          <span>Year {{ inspectedYearSummary.year }} Total Interest:</span>
          <strong class="text-amber-700 ml-1">{{ formatCurrency(inspectedYearSummary.totalInterestPaid, currency) }}</strong>
        </div>
        <div>
          <span>Year {{ inspectedYearSummary.year }} Total Paid:</span>
          <strong class="text-[#0F172A] ml-1">{{ formatCurrency(inspectedYearSummary.totalPaid, currency) }}</strong>
        </div>
      </div>
    </div>

    <!-- Accompanying Static Educational Text & Accessibility Summary -->
    <div class="mt-6 pt-5 border-t border-[#F1F5F9] text-xs text-[#64748B] leading-relaxed space-y-2">
      <div class="font-bold text-[#0F172A]">Amortization Dynamics &amp; Structural Insights:</div>
      <p>
        In a standard fixed-rate amortizing mortgage of <strong>{{ formatCurrency(principal, currency) }} at {{ formatPercent(annualRate) }} APR</strong> over <strong>{{ Math.round(totalMonths / 12) }} years</strong>,
        monthly installments begin with interest charges comprising the dominant share of payments. The mathematical <em>crossover point</em> occurs at
        <strong class="text-[#0F172A]" v-if="crossoverPoint">Month {{ crossoverPoint.month }} (Year {{ crossoverPoint.year }}, Month {{ crossoverPoint.monthInYear }})</strong>
        <span v-else>later in the schedule</span>,
        where the principal reduction portion (${{ crossoverPoint ? crossoverPoint.principal.toFixed(2) : '' }}) finally overtakes accrued monthly interest (${{ crossoverPoint ? crossoverPoint.interest.toFixed(2) : '' }}).
      </p>
      <p v-if="extraMonthlyPayment > 0 && milestones?.comparisonWithBaseline">
        By contributing an extra <strong class="text-[#0F766E]">{{ formatCurrency(extraMonthlyPayment, currency) }} per month</strong> toward principal,
        the loan reaches full payoff in <strong>{{ milestones.payoffPoint.month }} months (~{{ milestones.payoffPoint.year }} years)</strong> instead of {{ milestones.comparisonWithBaseline.baselinePayoffMonth }} months—eliminating
        <strong class="text-[#0F766E]">{{ milestones.comparisonWithBaseline.monthsSaved }} months ({{ (milestones.comparisonWithBaseline.monthsSaved / 12).toFixed(1) }} years)</strong>
        of mandatory debt service and saving <strong class="text-[#0F766E]">{{ formatCurrency(milestones.comparisonWithBaseline.interestSaved, currency) }}</strong> in lifetime finance charges.
      </p>
      <p class="text-[11px] text-[#94A3B8] pt-1">
        * Note: Calculations maintain full floating-point precision internally across all schedule intervals. Displayed currency figures are rounded to two decimal places; individual rounded principal and interest components may occasionally differ by ±$0.01 from the rounded payment installment due to independent cent rounding.
      </p>
    </div>
  </section>
</template>
