export interface Patient {
  id: string
  name: string
  age: number
  gender: "Male" | "Female" | "Other"
  program: string
  dischargeType: string
}

export interface AssessmentScore {
  patientId: string
  date: string
  who: number // 0-25
  gad: number // 0-21
  phq: number // 0-27
  pcl: number // 0-80
  ders: number // 0-180
}

export interface BPSAssessment {
  patientId: string
  date: string
  medical: number
  employment: number
  peerSupport: number
  drugAlcohol: number
  legal: number
  familySocial: number
  mentalHealth: number
  substanceUseHistory: string[]
}

export interface SubstanceHistory {
  patientId: string
  substance: string
  pattern: string
  useFlag: number
  frequency?: string
  duration?: string
  lastUse?: string
  primarySubstance: boolean
  ageOfFirstUse?: number
  routeOfAdministration?: string
  consequences?: string[]
  treatmentHistory?: string[]
}


export interface AHCMAssessment {
  patientId: string
  date: string
  housing: "Stable" | "Unstable" | "Homeless"
  foodSecurity: "Secure" | "Insecure" | "Very Insecure"
  transportation: "Reliable" | "Limited" | "None"
  employment: "Employed" | "Unemployed" | "Disabled"
  insurance: "Private" | "Public" | "None"
  socialSupport: number // 1-10
}

export interface PHPAssessment {
  uniqueId: string
  groupIdentifier: string
  assessmentDate: string
  matchedEmotionWords?: string
  matchSkillWords?: string
  matchSupportWords?: string
  craving?: string
  // Emotional states
  pain: boolean
  sad: boolean
  content: boolean
  anger: boolean
  shame: boolean
  fear: boolean
  joy: boolean
  anxiety: boolean
  depressed: boolean
  alone: boolean
  // Coping skills
  mindfulnessmeditation: boolean
  distressTolerance: boolean
  oppositeAction: boolean
  takeMyMeds: boolean
  askForHelp: boolean
  improveMoment: boolean
  partsWork: boolean
  playTheTapeThru: boolean
  values: boolean
  // Self-care activities
  sleep: boolean
  nutrition: boolean
  exercise: boolean
  fun: boolean
  connection: boolean
  warmth: boolean
  water: boolean
  love: boolean
  therapy: boolean
}

export interface EmotionalStateMetrics {
  positive: number
  negative: number
  total: number
  riskScore: number
}

export interface CopingSkillsMetrics {
  totalSkills: number
  skillsUsed: number
  utilizationRate: number
  mostUsedSkills: string[]
}

export interface SelfCareMetrics {
  totalActivities: number
  activitiesCompleted: number
  completionRate: number
  topActivities: string[]
}

export type AssessmentType = "who" | "gad" | "phq" | "pcl" | "ders"
export type ViewMode = "all" | "individual"
