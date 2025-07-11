"use client"

import { useDashboardStore } from "@/store/dashboard-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { useState, useMemo } from "react"
import { TrendingDown, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react"
import type { AssessmentType } from "@/types/assessments"

export function RiskAnalysisPage() {
  const { patients, assessmentScores, selectedPatient, viewMode } = useDashboardStore()
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentType>("phq")

  // Assessment thresholds for reference lines
  const thresholds = {
    who: { severe: 20, moderate: 15, mild: 8, minimal: 0 },
    gad: { severe: 15, moderate: 10, mild: 5, minimal: 0 },
    phq: { severe: 20, moderate: 15, mild: 10, minimal: 5 },
    pcl: { severe: 65, moderate: 50, mild: 30, minimal: 0 },
    ders: { severe: 150, moderate: 120, mild: 60, minimal: 0 },
  }

  // Assessment ranges for scaling
  const ranges = {
    who: 25,
    gad: 21,
    phq: 27,
    pcl: 80,
    ders: 180,
  }

  const chartData = useMemo(() => {
    if (!selectedPatient) return []

    // Individual patient time series only
    const patientScores = assessmentScores
      .filter((score) => score.patientId === selectedPatient)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return patientScores.map((score, index) => {
      const date = new Date(score.date)
      return {
        date: score.date,
        score: score[selectedAssessment],
        formattedDate: date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: index === 0 || index === patientScores.length - 1 ? '2-digit' : undefined
        }),
        fullDate: date.toLocaleDateString('en-US', { 
          weekday: 'long',
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        assessmentNumber: index + 1,
      }
    })
  }, [assessmentScores, selectedPatient, selectedAssessment])

  // Calculate improvement metrics
  const improvementMetrics = useMemo(() => {
    if (chartData.length < 2) return null

    const firstScore = chartData[0].score
    const lastScore = chartData[chartData.length - 1].score
    const isImproving = lastScore < firstScore
    
    // Calculate improvement more conservatively
    let improvement: number
    if (firstScore === 0) {
      // If starting score is 0, use absolute change
      improvement = Math.abs(lastScore - firstScore)
    } else if (lastScore === 0 && firstScore > 0) {
      // If ending score is 0, cap improvement at 95% to be more realistic
      improvement = Math.min(95, ((firstScore - lastScore) / firstScore) * 100)
    } else {
      // Normal percentage calculation
      improvement = Math.abs(((firstScore - lastScore) / firstScore) * 100)
    }

    // Additional context about the change
    const changeType = isImproving ? 'improvement' : 'increase'
    const scoreDirection = isImproving ? 'decreased' : 'increased'

    return {
      improvement: Math.round(improvement * 10) / 10, // Round to 1 decimal
      isImproving,
      firstScore,
      lastScore,
      changeType,
      scoreDirection,
      absoluteChange: Math.abs(firstScore - lastScore),
    }
  }, [chartData])

  const getPatientName = (patientId: string) => {
    return patients.find((p) => p.id === patientId)?.name || patientId
  }

  const getAssessmentLabel = (type: AssessmentType) => {
    const labels = {
      who: "WHO Disability",
      gad: "GAD-7 Anxiety",
      phq: "PHQ-9 Depression",
      pcl: "PCL-5 PTSD",
      ders: "DERS Emotion Regulation",
    }
    return labels[type]
  }

  const currentThresholds = thresholds[selectedAssessment]

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Risk Analysis Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Assessment Type</label>
              <Select
                value={selectedAssessment}
                onValueChange={(value) => setSelectedAssessment(value as AssessmentType)}
              >
                <SelectTrigger className="w-48 bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="phq" className="text-white hover:bg-gray-600">
                    PHQ-9 Depression
                  </SelectItem>
                  <SelectItem value="gad" className="text-white hover:bg-gray-600">
                    GAD-7 Anxiety
                  </SelectItem>
                  <SelectItem value="who" className="text-white hover:bg-gray-600">
                    WHO Disability
                  </SelectItem>
                  <SelectItem value="pcl" className="text-white hover:bg-gray-600">
                    PCL-5 PTSD
                  </SelectItem>
                  <SelectItem value="ders" className="text-white hover:bg-gray-600">
                    DERS Emotion Regulation
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {improvementMetrics && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {improvementMetrics.isImproving ? (
                    <TrendingDown className="w-5 h-5 text-green-400" />
                  ) : (
                    <TrendingUp className="w-5 h-5 text-red-400" />
                  )}
                  <span className="text-sm text-gray-300">
                    {improvementMetrics.isImproving ? "Improving" : "Worsening"}
                  </span>
                </div>
                <div className="text-sm text-gray-300">
                  <span className={improvementMetrics.isImproving ? "text-green-400" : "text-red-400"}>
                    {improvementMetrics.improvement.toFixed(1)}%
                  </span>{" "}
                  change
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Chart */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">
            {getAssessmentLabel(selectedAssessment)} Scores{" "}
            {selectedPatient && <span className="text-blue-400">for {getPatientName(selectedPatient)}</span>}
          </CardTitle>
          {improvementMetrics && (
            <p className="text-gray-400 text-sm">
              Scores have{" "}
              <span className={improvementMetrics.isImproving ? "text-green-400" : "text-red-400"}>
                {improvementMetrics.scoreDirection} by {improvementMetrics.absoluteChange} points
              </span>{" "}
              ({improvementMetrics.improvement}% {improvementMetrics.changeType}) from initial to latest assessment
            </p>
          )}
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={550}>
              <LineChart data={chartData} margin={{ top: 30, right: 80, left: 20, bottom: 80 }}>
                <CartesianGrid 
                  strokeDasharray="1 3" 
                  stroke="#374151" 
                  strokeOpacity={0.3}
                  horizontal={true}
                  vertical={false}
                />
                <XAxis
                  dataKey="formattedDate"
                  stroke="#9CA3AF"
                  fontSize={11}
                  fontWeight={500}
                  angle={-35}
                  textAnchor="end"
                  height={80}
                  interval={0}
                  tick={{ fill: "#D1D5DB" }}
                  axisLine={{ stroke: "#4B5563", strokeWidth: 1 }}
                  tickLine={{ stroke: "#6B7280", strokeWidth: 1 }}
                />
                <YAxis 
                  stroke="#9CA3AF" 
                  fontSize={12} 
                  fontWeight={500}
                  domain={[0, ranges[selectedAssessment]]} 
                  tick={{ fill: "#D1D5DB" }}
                  axisLine={{ stroke: "#4B5563", strokeWidth: 1 }}
                  tickLine={{ stroke: "#6B7280", strokeWidth: 1 }}
                  label={{ 
                    value: `${getAssessmentLabel(selectedAssessment)} Score`, 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle', fill: '#9CA3AF', fontSize: '12px', fontWeight: 500 }
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111827",
                    border: "1px solid #4B5563",
                    borderRadius: "12px",
                    color: "#F9FAFB",
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                  labelStyle={{ color: "#E5E7EB", fontWeight: 600, marginBottom: "8px" }}
                  formatter={(value: number, name: string, props: any) => {
                    const risk = value >= currentThresholds.severe ? "Severe" :
                                value >= currentThresholds.moderate ? "Moderate" :
                                value >= currentThresholds.mild ? "Mild" : "Minimal"
                    const riskColor = value >= currentThresholds.severe ? "#EF4444" :
                                     value >= currentThresholds.moderate ? "#F59E0B" :
                                     value >= currentThresholds.mild ? "#10B981" : "#06B6D4"
                    
                    return [
                      <div key="score" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#3B82F6', fontWeight: 700, fontSize: '16px' }}>{value}</span>
                        <span style={{ color: riskColor, fontWeight: 600, fontSize: '12px' }}>({risk})</span>
                      </div>,
                      "Score"
                    ]
                  }}
                  labelFormatter={(value, payload) => {
                    if (payload && payload[0]) {
                      const data = payload[0].payload
                      return `Assessment #${data.assessmentNumber} • ${data.fullDate}`
                    }
                    return value
                  }}
                />

                {/* Reference lines for thresholds with improved styling */}
                <ReferenceLine
                  y={currentThresholds.severe}
                  stroke="#EF4444"
                  strokeDasharray="4 4"
                  strokeOpacity={0.7}
                  label={{ 
                    value: "Severe", 
                    position: "topRight", 
                    fill: "#EF4444",
                    fontSize: 11,
                    fontWeight: 600,
                    offset: 5
                  }}
                />
                <ReferenceLine
                  y={currentThresholds.moderate}
                  stroke="#F59E0B"
                  strokeDasharray="4 4"
                  strokeOpacity={0.7}
                  label={{ 
                    value: "Moderate", 
                    position: "topRight", 
                    fill: "#F59E0B",
                    fontSize: 11,
                    fontWeight: 600,
                    offset: 5
                  }}
                />
                <ReferenceLine
                  y={currentThresholds.mild}
                  stroke="#10B981"
                  strokeDasharray="4 4"
                  strokeOpacity={0.7}
                  label={{ 
                    value: "Mild", 
                    position: "topRight", 
                    fill: "#10B981",
                    fontSize: 11,
                    fontWeight: 600,
                    offset: 5
                  }}
                />
                {currentThresholds.minimal > 0 && (
                  <ReferenceLine
                    y={currentThresholds.minimal}
                    stroke="#06B6D4"
                    strokeDasharray="4 4"
                    strokeOpacity={0.7}
                    label={{ 
                      value: "Minimal", 
                      position: "topRight", 
                      fill: "#06B6D4",
                      fontSize: 11,
                      fontWeight: 600,
                      offset: 5
                    }}
                  />
                )}

                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ 
                    fill: "#3B82F6", 
                    strokeWidth: 2, 
                    r: 5,
                    stroke: "#1E40AF"
                  }}
                  activeDot={{ 
                    r: 8, 
                    stroke: "#1E40AF", 
                    strokeWidth: 3,
                    fill: "#60A5FA",
                    style: { filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }
                  }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-96 text-gray-400">
              <div className="text-center">
                <AlertTriangle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No patient selected</p>
                <p className="text-sm">Please select a patient to view their assessment timeline and risk analysis</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Risk Summary Cards */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Current Score</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{chartData[chartData.length - 1]?.score || 0}</div>
              <p className="text-xs text-gray-400">Latest assessment</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Risk Level</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {(() => {
                  const currentScore = chartData[chartData.length - 1]?.score || 0
                  if (currentScore >= currentThresholds.severe) return "Severe"
                  if (currentScore >= currentThresholds.moderate) return "Moderate"
                  if (currentScore >= currentThresholds.mild) return "Mild"
                  return "Minimal"
                })()}
              </div>
              <p className="text-xs text-gray-400">Current risk category</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Change</CardTitle>
              {improvementMetrics?.isImproving ? (
                <TrendingDown className="h-4 w-4 text-green-400" />
              ) : (
                <TrendingUp className="h-4 w-4 text-red-400" />
              )}
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${improvementMetrics?.isImproving ? "text-green-400" : "text-red-400"}`}
              >
                {improvementMetrics?.isImproving ? "-" : "+"}{improvementMetrics?.absoluteChange}
              </div>
              <p className="text-xs text-gray-400">
                {improvementMetrics?.improvement}% {improvementMetrics?.changeType}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Assessments</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{chartData.length}</div>
              <p className="text-xs text-gray-400">Total completed</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Assessment Scale Reference */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">{getAssessmentLabel(selectedAssessment)} Scale Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <h4 className="font-semibold text-red-400">Severe</h4>
              </div>
              <p className="text-sm text-gray-300">{currentThresholds.severe}+ points</p>
              <p className="text-xs text-gray-400">Requires immediate attention</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <h4 className="font-semibold text-yellow-400">Moderate</h4>
              </div>
              <p className="text-sm text-gray-300">
                {currentThresholds.moderate}-{currentThresholds.severe - 1} points
              </p>
              <p className="text-xs text-gray-400">Monitor closely</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <h4 className="font-semibold text-green-400">Mild</h4>
              </div>
              <p className="text-sm text-gray-300">
                {currentThresholds.mild}-{currentThresholds.moderate - 1} points
              </p>
              <p className="text-xs text-gray-400">Some symptoms present</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-cyan-500 rounded"></div>
                <h4 className="font-semibold text-cyan-400">Minimal</h4>
              </div>
              <p className="text-sm text-gray-300">
                {currentThresholds.minimal}-{currentThresholds.mild - 1} points
              </p>
              <p className="text-xs text-gray-400">Low or no symptoms</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
