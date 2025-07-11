import { create } from "zustand"
import type {
  Patient,
  AssessmentScore,
  BPSAssessment,
  PHPDailyAssessment,
  AHCMAssessment,
  ViewMode,
} from "@/types/assessments"

interface DashboardStats {
  totalPatients: number
  totalAssessments: number
  avgAssessments: number
  highRiskPatients: number
}

interface DashboardState {
  patients: Patient[]
  assessmentScores: AssessmentScore[]
  bpsAssessments: BPSAssessment[]
  phpDailyAssessments: PHPDailyAssessment[]
  ahcmAssessments: AHCMAssessment[]
  dashboardStats: DashboardStats
  selectedPatient: string | null
  viewMode: ViewMode
  setSelectedPatient: (patientId: string | null) => void
  setViewMode: (mode: ViewMode) => void
  setPatients: (patients: Patient[]) => void
  setAssessmentScores: (scores: AssessmentScore[]) => void
  setBPSAssessments: (assessments: BPSAssessment[]) => void
  setPHPDailyAssessments: (assessments: PHPDailyAssessment[]) => void
  setAHCMAssessments: (assessments: AHCMAssessment[]) => void
  setDashboardStats: (stats: DashboardStats) => void
}

export const useDashboardStore = create<DashboardState>((set) => ({
  patients: [],
  assessmentScores: [],
  bpsAssessments: [],
  phpDailyAssessments: [],
  ahcmAssessments: [],
  dashboardStats: {
    totalPatients: 0,
    totalAssessments: 0,
    avgAssessments: 0,
    highRiskPatients: 0
  },
  selectedPatient: null,
  viewMode: "all",
  setSelectedPatient: (patientId) => set({ selectedPatient: patientId }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setPatients: (patients) => set({ patients }),
  setAssessmentScores: (scores) => set({ assessmentScores: scores }),
  setBPSAssessments: (assessments) => set({ bpsAssessments: assessments }),
  setPHPDailyAssessments: (assessments) => set({ phpDailyAssessments: assessments }),
  setAHCMAssessments: (assessments) => set({ ahcmAssessments: assessments }),
  setDashboardStats: (stats) => set({ dashboardStats: stats }),
}))
