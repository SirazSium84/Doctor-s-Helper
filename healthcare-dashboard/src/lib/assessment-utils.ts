import type { AssessmentType } from "@/types/assessments"

export function getAssessmentThreshold(type: AssessmentType, score: number): "good" | "moderate" | "concerning" {
  const thresholds = {
    who: { good: 8, moderate: 15 },
    gad: { good: 5, moderate: 10 },
    phq: { good: 5, moderate: 15 },
    pcl: { good: 30, moderate: 50 },
    ders: { good: 60, moderate: 120 },
  }

  const threshold = thresholds[type]
  if (score <= threshold.good) return "good"
  if (score <= threshold.moderate) return "moderate"
  return "concerning"
}

export function getThresholdColor(threshold: "good" | "moderate" | "concerning"): string {
  const colors = {
    good: "text-green-400 bg-green-400/10",
    moderate: "text-yellow-400 bg-yellow-400/10",
    concerning: "text-red-400 bg-red-400/10",
  }
  return colors[threshold]
}

export function getAssessmentRange(type: AssessmentType): { min: number; max: number } {
  const ranges = {
    who: { min: 0, max: 25 },
    gad: { min: 0, max: 21 },
    phq: { min: 0, max: 27 },
    pcl: { min: 0, max: 80 },
    ders: { min: 0, max: 180 },
  }
  return ranges[type]
}
