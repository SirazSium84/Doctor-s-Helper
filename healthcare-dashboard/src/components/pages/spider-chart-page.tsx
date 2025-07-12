"use client"

import { useDashboardStore } from "@/store/dashboard-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PatientSelector } from "@/components/patient-selector"
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { useMemo, useEffect } from "react"
import { TrendingUp, TrendingDown, AlertTriangle, Info, Users, Database } from "lucide-react"

export function SpiderChartPage() {
  const { patients, assessmentScores, selectedPatient, viewMode, setViewMode } = useDashboardStore()

  // Assessment configurations with enhanced metadata
  const assessmentConfig = {
    WHO: { 
      max: 25, 
      label: "WHO-DAS 2.0", 
      fullName: "World Health Organization Disability Assessment",
      color: "#3B82F6",
      gradientId: "whoGradient",
      thresholds: { minimal: 8, moderate: 15, severe: 20 }
    },
    GAD: { 
      max: 21, 
      label: "GAD-7", 
      fullName: "Generalized Anxiety Disorder Scale",
      color: "#10B981",
      gradientId: "gadGradient",
      thresholds: { minimal: 5, moderate: 10, severe: 15 }
    },
    PHQ: { 
      max: 27, 
      label: "PHQ-9", 
      fullName: "Patient Health Questionnaire",
      color: "#F59E0B",
      gradientId: "phqGradient",
      thresholds: { minimal: 5, moderate: 15, severe: 20 }
    },
    PCL: { 
      max: 80, 
      label: "PCL-5", 
      fullName: "PTSD Checklist for DSM-5",
      color: "#EF4444",
      gradientId: "pclGradient",
      thresholds: { minimal: 30, moderate: 50, severe: 65 }
    },
    DERS: { 
      max: 180, 
      label: "DERS", 
      fullName: "Difficulties in Emotion Regulation Scale",
      color: "#8B5CF6",
      gradientId: "dersGradient",
      thresholds: { minimal: 60, moderate: 120, severe: 150 }
    },
  }

  // Process data for spider chart
  const chartData = useMemo(() => {
    if (viewMode === "individual" && selectedPatient) {
      // Individual patient data
      const patientScores = assessmentScores.filter((score) => score.patientId === selectedPatient)
      if (patientScores.length === 0) return []

      // Get the most recent score
      const latestScore = patientScores.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]

      return Object.entries(assessmentConfig).map(([key, config]) => {
        const rawScore = latestScore[key.toLowerCase() as keyof typeof latestScore] as number
        const normalizedScore = (rawScore / config.max) * 100
        const severity = rawScore >= config.thresholds.severe ? "severe" : 
                        rawScore >= config.thresholds.moderate ? "moderate" : 
                        rawScore >= config.thresholds.minimal ? "mild" : "minimal"

        return {
          assessment: config.label,
          fullName: config.fullName,
          score: Math.round(normalizedScore * 10) / 10, // Round to 1 decimal
          rawScore,
          maxScore: config.max,
          severity,
          color: config.color,
          fullMark: 100,
        }
      })
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

      return Object.entries(assessmentConfig).map(([key, config]) => {
        const avgRawScore = avgScores[key.toLowerCase() as keyof typeof avgScores] as number / avgScores.count
        const normalizedScore = (avgRawScore / config.max) * 100
        const severity = avgRawScore >= config.thresholds.severe ? "severe" : 
                        avgRawScore >= config.thresholds.moderate ? "moderate" : 
                        avgRawScore >= config.thresholds.minimal ? "mild" : "minimal"

        return {
          assessment: config.label,
          fullName: config.fullName,
          score: Math.round(normalizedScore * 10) / 10,
          rawScore: Math.round(avgRawScore * 10) / 10,
          maxScore: config.max,
          severity,
          color: config.color,
          fullMark: 100,
        }
      })
    }
  }, [assessmentScores, selectedPatient, viewMode])

  const getPatientName = (patientId: string) => {
    return patients.find((p) => p.id === patientId)?.name || patientId
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "severe": return "bg-red-500/20 text-red-300 border-red-500/30"
      case "moderate": return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
      case "mild": return "bg-blue-500/20 text-blue-300 border-blue-500/30"
      default: return "bg-green-500/20 text-green-300 border-green-500/30"
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "severe": return <AlertTriangle className="w-3 h-3" />
      case "moderate": return <TrendingUp className="w-3 h-3" />
      case "mild": return <TrendingDown className="w-3 h-3" />
      default: return <Info className="w-3 h-3" />
    }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-600/50 rounded-xl p-4 shadow-2xl">
          <div className="space-y-2">
            <div className="font-semibold text-white text-sm">{data.fullName}</div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold" style={{ color: data.color }}>
                {data.rawScore}
              </span>
              <span className="text-gray-400 text-sm">/ {data.maxScore}</span>
              <Badge className={`${getSeverityColor(data.severity)} text-xs flex items-center gap-1`}>
                {getSeverityIcon(data.severity)}
                {data.severity}
              </Badge>
            </div>
            <div className="text-gray-300 text-xs">
              Normalized: {data.score}%
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  const averageScore = useMemo(() => {
    if (chartData.length === 0) return 0
    return Math.round((chartData.reduce((acc, item) => acc + item.score, 0) / chartData.length) * 10) / 10
  }, [chartData])

  const criticalScores = useMemo(() => {
    return chartData.filter(item => item.severity === "severe" || item.severity === "moderate").length
  }, [chartData])

  // Show loading state if no data is available yet
  if (patients.length === 0 && assessmentScores.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading assessment data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in-0 duration-700" style={{ willChange: 'opacity' }}>
      {/* Header Card */}
      <Card className="bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900 border border-gray-700/50 shadow-2xl">
        <CardHeader className="pb-6">
          {/* Top Section: Title and Controls */}
          <div className="flex items-start justify-between gap-8 mb-6">
            <div className="flex-1">
              <CardTitle className="text-white text-3xl font-bold flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-600/20 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-blue-400" />
                </div>
                <span className="bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                  Multi-Domain Assessment Analysis
                </span>
              </CardTitle>
              
              <p className="text-gray-300 text-base leading-relaxed max-w-2xl mb-4">
                {viewMode === "individual" && selectedPatient
                  ? `Comprehensive assessment profile for ${getPatientName(selectedPatient)}`
                  : `Population-wide assessment averages across ${patients.length} ${patients.length === 1 ? 'patient' : 'patients'}`
                }
              </p>
              
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-700/50 rounded-lg inline-flex">
                <Database className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400 font-medium">
                  {assessmentScores.length} assessment records available
                </span>
              </div>
            </div>
            
            {/* Professional Controls Panel */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-lg min-w-[400px]">
              <div className="space-y-6">
                {/* View Mode */}
                <div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setViewMode('all')}
                      className={`btn ${viewMode === 'all' ? 'btn-primary' : 'btn-ghost'} flex items-center justify-center gap-2`}
                    >
                      <Users className="w-4 h-4" />
                      All Patients
                    </button>
                    <button
                      onClick={() => setViewMode('individual')}
                      className={`btn ${viewMode === 'individual' ? 'btn-primary' : 'btn-ghost'} flex items-center justify-center gap-2`}
                    >
                      <Users className="w-4 h-4" />
                      Individual Patient
                    </button>
                  </div>
                </div>
                
                {/* Patient Selector - Show when Individual Patient is selected */}
                {viewMode === 'individual' && (
                  <div>
                    <PatientSelector showViewMode={false} forceShowPatientSelector={true} minimal={true} />
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Bottom Section: Key Metrics */}
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gradient-to-br from-blue-900/50 to-blue-800/30 rounded-xl border border-blue-700/30">
              <div className="text-3xl font-bold text-blue-400 mb-1">
                {chartData.length}
              </div>
              <div className="text-sm text-blue-300 font-medium">Assessment Types</div>
              <div className="text-xs text-gray-400 mt-1">Multi-domain coverage</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-emerald-900/50 to-emerald-800/30 rounded-xl border border-emerald-700/30">
              <div className="text-3xl font-bold text-emerald-400 mb-1">{averageScore}%</div>
              <div className="text-sm text-emerald-300 font-medium">Overall Score</div>
              <div className="text-xs text-gray-400 mt-1">Normalized average</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-violet-900/50 to-violet-800/30 rounded-xl border border-violet-700/30">
              <div className="text-3xl font-bold text-violet-400 mb-1">{criticalScores}</div>
              <div className="text-sm text-violet-300 font-medium">High Risk Areas</div>
              <div className="text-xs text-gray-400 mt-1">Moderate/Severe scores</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Chart Card */}
      <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50 shadow-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white text-xl font-semibold">
                Assessment Radar Analysis
                {viewMode === "individual" && selectedPatient && (
                  <span className="text-blue-400 ml-2 font-normal">- {getPatientName(selectedPatient)}</span>
                )}
              </CardTitle>
              <p className="text-gray-400 text-sm mt-1">
                {viewMode === "individual" 
                  ? "Individual patient assessment profile" 
                  : "Population-wide assessment averages"}
              </p>
            </div>
            {chartData.length > 0 && (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-gray-400">Overall Score</div>
                  <div className="text-xl font-bold text-blue-400">{averageScore}%</div>
                </div>
                {criticalScores > 0 && (
                  <div className="text-right">
                    <div className="text-sm text-gray-400">High Risk Areas</div>
                    <div className="text-xl font-bold text-red-400">{criticalScores}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <div className="space-y-6">
              <ResponsiveContainer width="100%" height={600}>
                <RadarChart data={chartData} margin={{ top: 40, right: 80, bottom: 40, left: 80 }}>
                  <defs>
                    {/* Enhanced gradients for professional look */}
                    <radialGradient id="radarGradient" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.4} />
                      <stop offset="50%" stopColor="#3B82F6" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.05} />
                    </radialGradient>
                  </defs>
                  
                  {/* Enhanced polar grid with multiple rings */}
                  <PolarGrid 
                    stroke="#374151" 
                    strokeWidth={1}
                    strokeOpacity={0.6}
                    radialLines={true}
                    gridType="polygon"
                  />
                  
                  {/* Enhanced angle axis */}
                  <PolarAngleAxis 
                    dataKey="assessment" 
                    tick={{ 
                      fill: "#E5E7EB", 
                      fontSize: 13, 
                      fontWeight: 600,
                      textAnchor: "middle" 
                    }}
                    tickLine={false}
                    axisLine={false}
                  />
                  
                  {/* Enhanced radius axis */}
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 100]} 
                    tick={{ 
                      fill: "#9CA3AF", 
                      fontSize: 11,
                      fontWeight: 500 
                    }}
                    tickCount={6}
                    tickLine={{ stroke: "#4B5563", strokeWidth: 1 }}
                    axisLine={false}
                  />
                  
                  <Tooltip content={<CustomTooltip />} />
                  
                  {/* Main radar area with enhanced styling */}
                  <Radar
                    name={viewMode === "individual" ? "Patient Scores" : "Average Scores"}
                    dataKey="score"
                    stroke="#3B82F6"
                    fill="url(#radarGradient)"
                    strokeWidth={3}
                    dot={{ 
                      fill: "#3B82F6", 
                      strokeWidth: 2, 
                      r: 6, 
                      stroke: "#1E40AF" 
                    }}
                    connectNulls={false}
                  />
                  
                  <Legend 
                    wrapperStyle={{ 
                      color: "#F9FAFB",
                      fontSize: "14px",
                      fontWeight: "500",
                      paddingTop: "20px"
                    }}
                    iconType="circle"
                  />
                </RadarChart>
              </ResponsiveContainer>

              {/* Score Breakdown Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6">
                {chartData.map((item, index) => (
                  <Card key={index} className="bg-gray-800/50 border-gray-700/50 hover:bg-gray-800/70 transition-all duration-200">
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-white text-sm">{item.assessment}</span>
                          {getSeverityIcon(item.severity)}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-baseline gap-1">
                            <span className="text-lg font-bold" style={{ color: item.color }}>
                              {item.rawScore}
                            </span>
                            <span className="text-xs text-gray-400">/{item.maxScore}</span>
                          </div>
                          <Badge className={`${getSeverityColor(item.severity)} text-xs w-full justify-center`}>
                            {item.severity}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-96 text-gray-400">
              <div className="text-center">
                <AlertTriangle className="w-16 h-16 mx-auto mb-4 opacity-50" />
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

      {/* Enhanced Assessment Reference Guide */}
      <Card className="bg-gradient-to-r from-gray-800 to-gray-900 border-gray-700/50 shadow-xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-400" />
            Assessment Scale Reference Guide
          </CardTitle>
          <p className="text-gray-400 text-sm">
            Understanding severity thresholds and clinical significance
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {Object.entries(assessmentConfig).map(([key, config]) => (
              <div key={key} className="space-y-3 p-4 bg-gray-800/30 rounded-lg border border-gray-700/30">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: config.color }}
                  />
                  <h4 className="font-semibold text-white">{config.label}</h4>
                  <span className="text-xs text-gray-400">(0-{config.max})</span>
                </div>
                <p className="text-sm text-gray-300">{config.fullName}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      <span className="text-gray-300">Minimal: 0-{config.thresholds.minimal}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                      <span className="text-gray-300">Mild: {config.thresholds.minimal + 1}-{config.thresholds.moderate}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                      <span className="text-gray-300">Moderate: {config.thresholds.moderate + 1}-{config.thresholds.severe}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-400"></div>
                      <span className="text-gray-300">Severe: {config.thresholds.severe + 1}+</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
