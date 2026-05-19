export interface GoalCalculationFactors {
  weight: number
  activityLevel?: "low" | "moderate" | "high"
  climate?: "cool" | "moderate" | "hot"
  customGoal?: number
}

export function calculateDailyGoal(factors: GoalCalculationFactors): number {
  if (factors.customGoal) return factors.customGoal

  let base = factors.weight * 35 // Base calculation: 35ml per kg

  // Activity level multipliers
  if (factors.activityLevel === "high") base *= 1.3
  else if (factors.activityLevel === "moderate") base *= 1.15

  // Climate multipliers
  if (factors.climate === "hot") base *= 1.2
  else if (factors.climate === "cool") base *= 0.95

  return Math.round(base)
}
