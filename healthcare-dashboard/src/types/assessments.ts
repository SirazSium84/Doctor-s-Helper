export interface Patient {
  id: string
  name: string
  age: number
  gender: "Male" | "Female" | "Other"
  program: "Inpatient" | "Outpatient" | "PHP" | "IOP"
  dischargeType: "Completed" | "AMA" | "Transfer" | "Ongoing"
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

export interface PHPDailyAssessment {
  patientId: string
  date: string
  mood: number // 1-10
  support: number // 1-10
  skills: number // 1-10
  craving: number // 1-10
  notes: string
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

export type AssessmentType = "who" | "gad" | "phq" | "pcl" | "ders"
export type ViewMode = "all" | "individual"
