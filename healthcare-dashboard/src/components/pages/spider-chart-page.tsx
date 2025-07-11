"use client"

import { useDashboardStore } from "@/store/dashboard-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from "recharts"
import { useMemo } from "react"

export function SpiderChartPage() {
  const { patients, assessmentScores, selectedPatient, viewMode } = useDashboardStore()

  const chartData = useMemo(() => {
    if (viewMode === "individual" && selectedPatient) {
      // Individual patient data
      const patientScores = assessmentScores.filter((score) => score.patientId === selectedPatient)
      if (patientScores.length === 0) return []

      // Get the most recent score
      const latestScore = patientScores.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]

      return [
        {
          assessment: "WHO",
          score: (latestScore.who / 25) * 100, // Normalize to 0-100
          fullMark: 100,
        },
        {
          assessment: "GAD",
          score: (latestScore.gad / 21) * 100,
          fullMark: 100,
        },
        {
          assessment: "PHQ",
          score: (latestScore.phq / 27) * 100,
          fullMark: 100,
        },
        {
          assessment: "PCL",
          score: (latestScore.pcl / 80) * 100,
          fullMark: 100,
        },
        {
          assessment: "DERS",
          score: (latestScore.ders / 180) * 100,
          fullMark: 100,
        },
      ]
    } else {
      // All patients average
      if (assessmentScores.length === 0) return []

      const avgScores = assessmentScores.reduce(
        (acc, score) => {
          acc.who += score.who
          acc.gad += score.gad
          acc.phq += score.phq
          acc.pcl += score.pcl
          acc.ders += score.ders
          acc.count += 1
          return acc
        },
        { who: 0, gad: 0, phq: 0, pcl: 0, ders: 0, count: 0 },
      )

      return [
        {
          assessment: "WHO",
          score: (avgScores.who / avgScores.count / 25) * 100,
          fullMark: 100,
        },
        {
          assessment: "GAD",
          score: (avgScores.gad / avgScores.count / 21) * 100,
          fullMark: 100,
        },
        {
          assessment: "PHQ",
          score: (avgScores.phq / avgScores.count / 27) * 100,
          fullMark: 100,
        },
        {
          assessment: "PCL",
          score: (avgScores.pcl / avgScores.count / 80) * 100,
          fullMark: 100,
        },
        {
          assessment: "DERS",
          score: (avgScores.ders / avgScores.count / 180) * 100,
          fullMark: 100,
        },
      ]
    }
  }, [assessmentScores, selectedPatient, viewMode])

  const getPatientName = (patientId: string) => {
    return patients.find((p) => p.id === patientId)?.name || patientId
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">
            Assessment Radar Chart
            {viewMode === "individual" && selectedPatient && (
              <span className="text-blue-400 ml-2">- {getPatientName(selectedPatient)}</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={500}>
              <RadarChart data={chartData}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="assessment" tick={{ fill: "#9CA3AF", fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#9CA3AF", fontSize: 10 }} />
                <Radar
                  name={viewMode === "individual" ? "Patient Score" : "Average Score"}
                  dataKey="score"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Legend wrapperStyle={{ color: "#F9FAFB" }} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-96 text-gray-400">
              <div className="text-center">
                <p className="text-lg mb-2">No data available</p>
                <p className="text-sm">
                  {viewMode === "individual"
                    ? "Please select a patient with assessment data"
                    : "No assessment scores found in the system"}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assessment Scale Reference */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Assessment Scale Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-400">WHO (0-25)</h4>
              <p className="text-sm text-gray-300">World Health Organization Disability Assessment</p>
              <div className="text-xs text-gray-400">
                <div>0-8: Good</div>
                <div>9-15: Moderate</div>
                <div>16-25: Concerning</div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-green-400">GAD (0-21)</h4>
              <p className="text-sm text-gray-300">Generalized Anxiety Disorder Scale</p>
              <div className="text-xs text-gray-400">
                <div>0-5: Good</div>
                <div>6-10: Moderate</div>
                <div>11-21: Concerning</div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-yellow-400">PHQ (0-27)</h4>
              <p className="text-sm text-gray-300">Patient Health Questionnaire</p>
              <div className="text-xs text-gray-400">
                <div>0-5: Good</div>
                <div>6-15: Moderate</div>
                <div>16-27: Concerning</div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-red-400">PCL (0-80)</h4>
              <p className="text-sm text-gray-300">PTSD Checklist</p>
              <div className="text-xs text-gray-400">
                <div>0-30: Good</div>
                <div>31-50: Moderate</div>
                <div>51-80: Concerning</div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-purple-400">DERS (0-180)</h4>
              <p className="text-sm text-gray-300">Difficulties in Emotion Regulation</p>
              <div className="text-xs text-gray-400">
                <div>0-60: Good</div>
                <div>61-120: Moderate</div>
                <div>121-180: Concerning</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
