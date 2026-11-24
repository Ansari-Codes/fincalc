import { computed, ref } from 'vue'
import {
  calculateRetirementGoal,
  type ContributionFrequency,
  type ContributionTiming
} from '../calculations/retirementGoal'

/**
 * Single source of truth for the Retirement Savings Goal Calculator's
 * documented defaults. The page initialises from this object AND Reset
 * restores it, so Reset can never drift away from the documented defaults
 * (previously resetForm() nulled the inputs instead of restoring them).
 */
export const RETIREMENT_GOAL_DEFAULTS = {
  currentSavings: 50000,
  targetAmount: 1000000,
  currentAge: 35,
  retirementAge: 65,
  expectedAnnualReturn: 7.0,
  contributionFrequency: 'monthly' as ContributionFrequency,
  contributionTiming: 'end' as ContributionTiming,
  annualContributionIncreasePct: 0
} as const

/** Slider ranges for the calculator inputs. Typed values outside a slider's
 * range are clamped to the range for the thumb position instead of flagging
 * the field invalid (native `step` validation used to reject values such as
 * a $1,015,590 target that is not a multiple of the $25,000 step). */
export const RETIREMENT_GOAL_SLIDER_RANGES = {
  targetAmount: { min: 100000, max: 3000000 },
  currentSavings: { min: 0, max: 500000 },
  expectedAnnualReturn: { min: 0, max: 15 },
  annualContributionIncreasePct: { min: 0, max: 10 }
} as const

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function createRetirementGoalForm() {
  const currentSavings = ref<number | null>(RETIREMENT_GOAL_DEFAULTS.currentSavings)
  const targetAmount = ref<number | null>(RETIREMENT_GOAL_DEFAULTS.targetAmount)
  const currentAge = ref<number | null>(RETIREMENT_GOAL_DEFAULTS.currentAge)
  const retirementAge = ref<number | null>(RETIREMENT_GOAL_DEFAULTS.retirementAge)
  const expectedAnnualReturn = ref<number | null>(RETIREMENT_GOAL_DEFAULTS.expectedAnnualReturn)
  const contributionFrequency = ref<ContributionFrequency>(
    RETIREMENT_GOAL_DEFAULTS.contributionFrequency
  )
  const contributionTiming = ref<ContributionTiming>(RETIREMENT_GOAL_DEFAULTS.contributionTiming)
  const annualContributionIncreasePct = ref<number | null>(
    RETIREMENT_GOAL_DEFAULTS.annualContributionIncreasePct
  )

  /** Restore every input to the documented defaults. Frequency/Timing
   * selects are plain v-model bindings with no watchers or change handlers,
   * so changing them can never alter the savings/target/age/return inputs. */
  function resetForm() {
    currentSavings.value = RETIREMENT_GOAL_DEFAULTS.currentSavings
    targetAmount.value = RETIREMENT_GOAL_DEFAULTS.targetAmount
    currentAge.value = RETIREMENT_GOAL_DEFAULTS.currentAge
    retirementAge.value = RETIREMENT_GOAL_DEFAULTS.retirementAge
    expectedAnnualReturn.value = RETIREMENT_GOAL_DEFAULTS.expectedAnnualReturn
    contributionFrequency.value = RETIREMENT_GOAL_DEFAULTS.contributionFrequency
    contributionTiming.value = RETIREMENT_GOAL_DEFAULTS.contributionTiming
    annualContributionIncreasePct.value = RETIREMENT_GOAL_DEFAULTS.annualContributionIncreasePct
  }

  const result = computed(() =>
    calculateRetirementGoal({
      currentSavings: currentSavings.value ?? 0,
      targetAmount: targetAmount.value ?? 0,
      currentAge: currentAge.value !== null ? currentAge.value : undefined,
      retirementAge: retirementAge.value ?? 65,
      expectedAnnualReturn: expectedAnnualReturn.value ?? 0,
      contributionFrequency: contributionFrequency.value,
      contributionTiming: contributionTiming.value,
      annualContributionIncreasePct: annualContributionIncreasePct.value ?? 0
    })
  )

  // Slider thumb positions: follow the typed value exactly, clamped to the
  // slider's range. step="1" on the range inputs avoids step-snapping.
  const targetSliderValue = computed(() =>
    clamp(
      targetAmount.value ?? RETIREMENT_GOAL_SLIDER_RANGES.targetAmount.min,
      RETIREMENT_GOAL_SLIDER_RANGES.targetAmount.min,
      RETIREMENT_GOAL_SLIDER_RANGES.targetAmount.max
    )
  )
  const savingsSliderValue = computed(() =>
    clamp(
      currentSavings.value ?? RETIREMENT_GOAL_SLIDER_RANGES.currentSavings.min,
      RETIREMENT_GOAL_SLIDER_RANGES.currentSavings.min,
      RETIREMENT_GOAL_SLIDER_RANGES.currentSavings.max
    )
  )
  const returnSliderValue = computed(() =>
    clamp(
      expectedAnnualReturn.value ?? RETIREMENT_GOAL_SLIDER_RANGES.expectedAnnualReturn.min,
      RETIREMENT_GOAL_SLIDER_RANGES.expectedAnnualReturn.min,
      RETIREMENT_GOAL_SLIDER_RANGES.expectedAnnualReturn.max
    )
  )
  const stepUpSliderValue = computed(() =>
    clamp(
      annualContributionIncreasePct.value ??
        RETIREMENT_GOAL_SLIDER_RANGES.annualContributionIncreasePct.min,
      RETIREMENT_GOAL_SLIDER_RANGES.annualContributionIncreasePct.min,
      RETIREMENT_GOAL_SLIDER_RANGES.annualContributionIncreasePct.max
    )
  )

  return {
    currentSavings,
    targetAmount,
    currentAge,
    retirementAge,
    expectedAnnualReturn,
    contributionFrequency,
    contributionTiming,
    annualContributionIncreasePct,
    resetForm,
    result,
    targetSliderValue,
    savingsSliderValue,
    returnSliderValue,
    stepUpSliderValue
  }
}
