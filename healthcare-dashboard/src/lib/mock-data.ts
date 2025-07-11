import type { Patient, AssessmentScore, BPSAssessment, PHPDailyAssessment, AHCMAssessment } from "@/types/assessments"

const firstNames = ["John", "Jane", "Michael", "Sarah", "David", "Emily", "Robert", "Lisa", "James", "Maria"]
const lastNames = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
]

export function generateMockPatients(count = 50): Patient[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `patient-${i + 1}`,
    name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
    age: Math.floor(Math.random() * 60) + 18,
    gender: ["Male", "Female", "Other"][Math.floor(Math.random() * 3)] as "Male" | "Female" | "Other",
    program: ["Inpatient", "Outpatient", "PHP", "IOP"][Math.floor(Math.random() * 4)] as Patient["program"],
    dischargeType: ["Completed", "AMA", "Transfer", "Ongoing"][
      Math.floor(Math.random() * 4)
    ] as Patient["dischargeType"],
  }))
}

export function generateMockAssessmentScores(patients: Patient[]): AssessmentScore[] {
  const scores: AssessmentScore[] = []

  patients.forEach((patient) => {
    // Generate 3-5 assessments per patient over the last 6 months
    const assessmentCount = Math.floor(Math.random() * 3) + 3

    for (let i = 0; i < assessmentCount; i++) {
      const date = new Date()
      date.setDate(date.getDate() - Math.floor(Math.random() * 180))

      scores.push({
        patientId: patient.id,
        date: date.toISOString().split("T")[0],
        who: Math.floor(Math.random() * 26),
        gad: Math.floor(Math.random() * 22),
        phq: Math.floor(Math.random() * 28),
        pcl: Math.floor(Math.random() * 81),
        ders: Math.floor(Math.random() * 181),
      })
    }
  })

  return scores.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function generateMockBPSAssessments(patients: Patient[]): BPSAssessment[] {
  const substances = ["Alcohol", "Cannabis", "Cocaine", "Opioids", "Stimulants", "Benzodiazepines"]

  return patients.map((patient) => ({
    patientId: patient.id,
    date: new Date().toISOString().split("T")[0],
    medical: Math.floor(Math.random() * 10) + 1,
    employment: Math.floor(Math.random() * 10) + 1,
    peerSupport: Math.floor(Math.random() * 10) + 1,
    drugAlcohol: Math.floor(Math.random() * 10) + 1,
    legal: Math.floor(Math.random() * 10) + 1,
    familySocial: Math.floor(Math.random() * 10) + 1,
    mentalHealth: Math.floor(Math.random() * 10) + 1,
    substanceUseHistory: substances.filter(() => Math.random() > 0.7),
  }))
}

export function generateMockPHPDailyAssessments(patients: Patient[]): PHPDailyAssessment[] {
  const assessments: PHPDailyAssessment[] = []
  const notes = [
    "Feeling more positive today",
    "Struggled with cravings",
    "Good support from group",
    "Practiced coping skills",
    "Challenging day but managed well",
    "Feeling grateful for progress",
  ]

  patients.forEach((patient) => {
    // Generate daily assessments for the last 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)

      assessments.push({
        patientId: patient.id,
        date: date.toISOString().split("T")[0],
        mood: Math.floor(Math.random() * 10) + 1,
        support: Math.floor(Math.random() * 10) + 1,
        skills: Math.floor(Math.random() * 10) + 1,
        craving: Math.floor(Math.random() * 10) + 1,
        notes: notes[Math.floor(Math.random() * notes.length)],
      })
    }
  })

  return assessments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function generateMockAHCMAssessments(patients: Patient[]): AHCMAssessment[] {
  return patients.map((patient) => ({
    patientId: patient.id,
    date: new Date().toISOString().split("T")[0],
    housing: ["Stable", "Unstable", "Homeless"][Math.floor(Math.random() * 3)] as AHCMAssessment["housing"],
    foodSecurity: ["Secure", "Insecure", "Very Insecure"][
      Math.floor(Math.random() * 3)
    ] as AHCMAssessment["foodSecurity"],
    transportation: ["Reliable", "Limited", "None"][Math.floor(Math.random() * 3)] as AHCMAssessment["transportation"],
    employment: ["Employed", "Unemployed", "Disabled"][Math.floor(Math.random() * 3)] as AHCMAssessment["employment"],
    insurance: ["Private", "Public", "None"][Math.floor(Math.random() * 3)] as AHCMAssessment["insurance"],
    socialSupport: Math.floor(Math.random() * 10) + 1,
  }))
}
