"use client"

import { useDashboardStore } from "@/store/dashboard-store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts"
import { Users, Activity, TrendingUp, AlertTriangle } from "lucide-react"
import { OpenAIChat } from "@/components/openai-chat"

export function WelcomePage() {
  const { patients, dashboardStats } = useDashboardStore()

  // Use accurate statistics from the store
  const { totalPatients, totalAssessments, avgAssessments, highRiskPatients } = dashboardStats

  // Program distribution data
  const programData = patients.reduce(
    (acc, patient) => {
      acc[patient.program] = (acc[patient.program] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const programChartData = Object.entries(programData).map(([program, count]) => ({
    program,
    count,
  }))

  // Discharge type distribution with professional formatting
  const dischargeData = patients.reduce(
    (acc, patient) => {
      acc[patient.dischargeType] = (acc[patient.dischargeType] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )



  // Helper function to get display name for discharge type - handle both old and new data formats
  const getDisplayName = (type: string) => {
    switch (type.toLowerCase()) {
      case 'ongoing':
      case 'current':
        return 'Currently Active'
      case 'completed':
      case 'successful discharge':
        return 'Successfully Completed'
      case 'ama':
      case 'against medical advice':
        return 'Against Medical Advice'
      case 'transfer':
      case 'transferred':
      case 'transferred to other facility':
        return 'Transferred to Other Facility'
      case 'involuntary discharge':
        return 'Involuntary Discharge'
      case 'unsuccessful discharge':
        return 'Unsuccessful Discharge'
      case 'other':
        return 'Other'
      default:
        return type
    }
  }

  // Professional color palette for discharge status with distinct colors
  const getDischargeColor = (displayName: string) => {
    switch (displayName) {
      case 'Currently Active':
        return '#3B82F6'      // Blue - Active patients
      case 'Successfully Completed':
        return '#10B981'      // Green - Successful completion
      case 'Against Medical Advice':
        return '#EF4444'      // Red - AMA (concerning outcome)
      case 'Transferred to Other Facility':
        return '#F59E0B'      // Orange - Transfers (neutral outcome)
      case 'Involuntary Discharge':
        return '#DC2626'      // Dark Red - Involuntary discharge
      case 'Unsuccessful Discharge':
        return '#F97316'      // Orange-Red - Unsuccessful discharge
      case 'Other':
        return '#6B7280'      // Gray - Other/Unknown
      default:
        return '#8B5CF6'      // Purple - Fallback
    }
  }

  const dischargeChartData = Object.entries(dischargeData).map(([type, count]) => ({
    name: getDisplayName(type),
    value: count,
    originalType: type,
    percentage: ((count / patients.length) * 100).toFixed(1)
  }))

  // Mock motivation words for wordcloud effect
  const motivationWords = [
    { text: "Recovery", size: 32, color: "#3B82F6" },
    { text: "Family", size: 28, color: "#10B981" },
    { text: "Health", size: 24, color: "#F59E0B" },
    { text: "Future", size: 20, color: "#EF4444" },
    { text: "Hope", size: 18, color: "#8B5CF6" },
    { text: "Strength", size: 16, color: "#06B6D4" },
    { text: "Support", size: 14, color: "#84CC16" },
    { text: "Growth", size: 12, color: "#F97316" },
  ]

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalPatients}</div>
            <p className="text-xs text-gray-400">Active in system</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total Assessments</CardTitle>
            <Activity className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalAssessments}</div>
            <p className="text-xs text-gray-400">Completed assessments</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Avg Assessments</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{avgAssessments}</div>
            <p className="text-xs text-gray-400">Per patient</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">High Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{highRiskPatients}</div>
            <p className="text-xs text-gray-400">Patients requiring attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Charts */}
        <div className="xl:col-span-2 space-y-6">
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Program Distribution */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Program Enrollment</CardTitle>
                <CardDescription className="text-gray-400">Distribution of patients across treatment programs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={programChartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.6} />
                      <XAxis 
                        dataKey="program" 
                        stroke="#9CA3AF"
                        fontSize={11}
                        tick={{ fill: "#9CA3AF" }}
                        axisLine={{ stroke: "#4B5563" }}
                        tickLine={{ stroke: "#4B5563" }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis 
                        stroke="#9CA3AF"
                        fontSize={11}
                        tick={{ fill: "#9CA3AF" }}
                        axisLine={{ stroke: "#4B5563" }}
                        tickLine={{ stroke: "#4B5563" }}
                      />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          `${value} patients`,
                          'Program Enrollment'
                        ]}
                        labelFormatter={(label: string) => `Program: ${label}`}
                        contentStyle={{
                          backgroundColor: "#1F2937",
                          border: "1px solid #374151",
                          borderRadius: "8px",
                          color: "#F9FAFB",
                          fontSize: "12px",
                          fontWeight: "500"
                        }}
                        labelStyle={{ color: "#E5E7EB" }}
                      />
                      <Bar 
                        dataKey="count" 
                        fill="#3B82F6" 
                        radius={[4, 4, 0, 0]}
                        stroke="#1E40AF"
                        strokeWidth={1}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Discharge Type Distribution */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Patient Status Distribution</CardTitle>
                <CardDescription className="text-gray-400">Current patient outcomes and status overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dischargeChartData}
                        cx="50%"
                        cy="45%"
                        labelLine={false}
                        outerRadius={85}
                        innerRadius={30}
                        dataKey="value"
                        stroke="#1F2937"
                        strokeWidth={2}
                      >
                        {dischargeChartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={getDischargeColor(entry.name)}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          `${value} patients (${((value / patients.length) * 100).toFixed(1)}%)`,
                          name
                        ]}
                        contentStyle={{
                          backgroundColor: "#1F2937",
                          border: "1px solid #374151",
                          borderRadius: "8px",
                          color: "#F9FAFB",
                          fontSize: "12px",
                          fontWeight: "500"
                        }}
                        labelStyle={{ color: "#E5E7EB" }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        wrapperStyle={{
                          fontSize: "11px",
                          color: "#D1D5DB",
                          paddingTop: "10px"
                        }}
                        formatter={(value: string) => (
                          <span style={{ color: "#D1D5DB", fontSize: "11px" }}>{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Patient Motivations Wordcloud */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Motivation Themes</CardTitle>
              <CardDescription className="text-gray-400">
                Key motivational factors identified in patient assessments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center justify-center gap-6 py-12 px-4">
                {motivationWords.map((word, index) => (
                  <span
                    key={index}
                    className="font-bold transition-all duration-200 hover:scale-110 cursor-pointer select-none"
                    style={{
                      fontSize: `${word.size}px`,
                      color: word.color,
                      textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                    }}
                  >
                    {word.text}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - AI Analysis Chat */}
        <div className="xl:col-span-1 flex flex-col">
          <OpenAIChat />
        </div>
      </div>
    </div>
  )
}
