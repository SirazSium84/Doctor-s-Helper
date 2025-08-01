"use client"

import { useDashboardStore } from "@/store/dashboard-store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts"
import { Users, Activity, TrendingUp, AlertTriangle, Heart, Shield, Brain, Target, Calendar, CheckCircle, Zap } from "lucide-react"
import { OpenAIChat } from "@/components/openai-chat"
import { CacheDebugPanel } from "@/components/cache-debug-panel"
import { useState, useCallback, useEffect, useMemo } from "react"

export function WelcomePage() {
  const { patients, dashboardStats } = useDashboardStore()
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null)

  // Hover handlers
  const handleSliceHover = useCallback((data: any, index: number) => {
    setHoveredSlice(data?.name || null)
  }, [])

  const handleSliceLeave = useCallback(() => {
    setHoveredSlice(null)
  }, [])

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
      case '0':
        return 'Still Under Care'
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

  // Professional gradient palette for discharge status with distinct colors
  const getDischargeGradient = (displayName: string) => {
    switch (displayName) {
      case 'Still Under Care':
        return 'url(#activeGradient)'      // Blue gradient - Still under care
      case 'Currently Active':
        return 'url(#activeGradient)'      // Blue gradient - Active patients
      case 'Successfully Completed':
        return 'url(#completedGradient)'   // Green gradient - Successful completion
      case 'Against Medical Advice':
        return 'url(#amaGradient)'         // Red gradient - AMA (concerning outcome)
      case 'Transferred to Other Facility':
        return 'url(#transferGradient)'    // Orange gradient - Transfers (neutral outcome)
      case 'Involuntary Discharge':
        return 'url(#involuntaryGradient)' // Dark Red gradient - Involuntary discharge
      case 'Unsuccessful Discharge':
        return 'url(#unsuccessfulGradient)' // Orange-Red gradient - Unsuccessful discharge
      case 'Other':
        return 'url(#otherGradient)'       // Gray gradient - Other/Unknown
      default:
        return 'url(#fallbackGradient)'    // Purple gradient - Fallback
    }
  }

  // Keep the original function for legend colors
  const getDischargeColor = (displayName: string) => {
    switch (displayName) {
      case 'Still Under Care':
        return '#3B82F6'      // Blue - Still under care
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

  // Real motivation themes from MCP server
  const [motivationWords, setMotivationWords] = useState([
    { text: "Recovery", size: 32, color: "#3B82F6" },
    { text: "Family", size: 28, color: "#10B981" },
    { text: "Health", size: 24, color: "#F59E0B" },
    { text: "Future", size: 20, color: "#EF4444" },
    { text: "Hope", size: 18, color: "#8B5CF6" },
    { text: "Strength", size: 16, color: "#06B6D4" },
    { text: "Support", size: 14, color: "#84CC16" },
    { text: "Growth", size: 12, color: "#F97316" },
  ])
  const [motivationDataSource, setMotivationDataSource] = useState<string>('LOADING')

  // Fetch real motivation themes from MCP server
  useEffect(() => {
    const fetchMotivationThemes = async () => {
      try {
        const response = await fetch('/api/motivation-themes')
        const result = await response.json()
        
        if (result.success && result.data?.themes) {
          // Transform MCP data to word cloud format
          const themes = result.data.themes.map((theme: any) => ({
            text: theme.name,
            size: theme.size || Math.max(12, Math.min(32, 12 + (theme.percentage || 0) * 0.8)),
            color: theme.color
          }))
          
          setMotivationWords(themes)
          
          // Set data source based on API response (without showing technical details)
          if (result.source === 'DIRECT_DATABASE') {
            setMotivationDataSource('OPENAI_ANALYSIS')
          } else if (result.source === 'MCP_SERVER') {
            setMotivationDataSource('REAL_DATA')
          } else {
            setMotivationDataSource('ANALYZED_DATA')
          }
          
        } else {
          console.warn('⚠️ Failed to load motivation themes, using fallback data')
          setMotivationDataSource('FALLBACK')
        }
      } catch (error) {
        console.error('❌ Error fetching motivation themes:', error)
        setMotivationDataSource('ERROR - Using Mock Data')
      }
    }

    fetchMotivationThemes()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-screen-2xl mx-auto">


        {/* Enhanced Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 items-stretch">
          <Card className="group hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-blue-900/50 to-indigo-900/50 ring-1 ring-blue-700/50 hover:ring-blue-600/60 h-full flex flex-col justify-center">
            <CardContent className="flex-1 flex flex-col justify-center p-4 sm:p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-600/20 rounded-xl group-hover:bg-blue-600/30 transition-colors">
                    <Users className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Total Patients</p>
                    <p className="text-3xl font-bold text-white tracking-tight">{totalPatients}</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-3">Currently enrolled in care programs</p>
              <div className="flex items-center gap-2 p-2 bg-blue-600/10 rounded-lg">
                <TrendingUp className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-300">
                  Active patient population
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-emerald-900/50 to-green-900/50 ring-1 ring-emerald-700/50 hover:ring-emerald-600/60 h-full flex flex-col justify-center">
            <CardContent className="flex-1 flex flex-col justify-center p-4 sm:p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-600/20 rounded-xl group-hover:bg-emerald-600/30 transition-colors">
                    <Activity className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Total Assessments</p>
                    <p className="text-3xl font-bold text-white tracking-tight">{totalAssessments}</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-3">Clinical evaluations completed</p>
              <div className="flex items-center gap-2 p-2 bg-emerald-600/10 rounded-lg">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-300">
                  Data collection active
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-amber-900/50 to-orange-900/50 ring-1 ring-amber-700/50 hover:ring-amber-600/60 h-full flex flex-col justify-center">
            <CardContent className="flex-1 flex flex-col justify-center p-4 sm:p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-600/20 rounded-xl group-hover:bg-amber-600/30 transition-colors">
                    <TrendingUp className="h-6 w-6 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Avg Assessments</p>
                    <p className="text-3xl font-bold text-white tracking-tight">{avgAssessments}</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-3">Average per patient engagement</p>
              <div className="flex items-center gap-2 p-2 bg-amber-600/10 rounded-lg">
                <Zap className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-medium text-amber-300">
                  Engagement metric
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-red-900/50 to-rose-900/50 ring-1 ring-red-700/50 hover:ring-red-600/60 h-full flex flex-col justify-center">
            <CardContent className="flex-1 flex flex-col justify-center p-4 sm:p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-600/20 rounded-xl group-hover:bg-red-600/30 transition-colors">
                    <AlertTriangle className="h-6 w-6 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-300 uppercase tracking-wide">High Risk</p>
                    <p className="text-3xl font-bold text-white tracking-tight">{highRiskPatients}</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-3">Patients requiring immediate attention</p>
              <div className="flex items-center gap-2 p-2 bg-red-600/10 rounded-lg">
                <Shield className="h-4 w-4 text-red-400" />
                <span className="text-sm font-medium text-red-300">
                  Priority monitoring
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row - 3 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 1.5xl:grid-cols-3 gap-4 sm:gap-6">
              {/* Program Distribution */}
              <Card className="bg-gradient-to-br from-slate-800/60 to-gray-800/60 shadow-2xl border-gray-600/40 hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Brain className="h-5 w-5 text-blue-400" />
                    Program Enrollment
                  </CardTitle>
                  <CardDescription className="text-gray-400">Distribution of patients across treatment programs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px] sm:h-[320px] lg:h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                                             <BarChart 
                         data={programChartData}
                         margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                         barCategoryGap="20%"
                         barGap={4}
                       >
                        <defs>
                          <linearGradient id="programGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8}/>
                            <stop offset="100%" stopColor="#1E40AF" stopOpacity={0.6}/>
                          </linearGradient>
                        </defs>
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
                           cursor={false}
                           shared={false}
                           formatter={(value: number, name: string) => [
                             `${value} patients`,
                             'Program Enrollment'
                           ]}
                           labelFormatter={(label: string) => `Program: ${label}`}
                           contentStyle={{
                             backgroundColor: '#111827',
                             border: '1px solid #6B7280',
                             borderRadius: '12px',
                             boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                             color: '#F9FAFB',
                             fontSize: '14px',
                             fontWeight: '500',
                             padding: '12px 16px',
                             backdropFilter: 'blur(8px)'
                           }}
                           labelStyle={{
                             color: '#E5E7EB',
                             fontSize: '15px',
                             fontWeight: '600',
                             marginBottom: '4px'
                           }}
                           itemStyle={{
                             color: '#D1D5DB',
                             fontSize: '13px',
                             fontWeight: '500'
                           }}
                         />
                                                 <Bar 
                           dataKey="count" 
                           fill="url(#programGradient)" 
                           radius={[6, 6, 0, 0]}
                           stroke="#3B82F6"
                           strokeWidth={1}
                           activeBar={{ 
                             fill: "url(#programGradient)", 
                             stroke: "#60A5FA", 
                             strokeWidth: 2,
                             filter: 'brightness(1.15)'
                           }}
                         />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Discharge Type Distribution */}
              <Card className="bg-gradient-to-br from-slate-800/60 to-gray-800/60 shadow-2xl border-gray-600/40 hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Target className="h-5 w-5 text-purple-400" />
                    Patient Status Distribution
                  </CardTitle>
                  <CardDescription className="text-gray-400">Current patient outcomes and status overview</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px] sm:h-[320px] lg:h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <defs>
                          <linearGradient id="activeGradient" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.9}/>
                            <stop offset="100%" stopColor="#1E40AF" stopOpacity={0.7}/>
                          </linearGradient>
                          <linearGradient id="completedGradient" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#10B981" stopOpacity={0.9}/>
                            <stop offset="100%" stopColor="#047857" stopOpacity={0.7}/>
                          </linearGradient>
                          <linearGradient id="amaGradient" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#EF4444" stopOpacity={0.9}/>
                            <stop offset="100%" stopColor="#DC2626" stopOpacity={0.7}/>
                          </linearGradient>
                          <linearGradient id="transferGradient" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.9}/>
                            <stop offset="100%" stopColor="#D97706" stopOpacity={0.7}/>
                          </linearGradient>
                          <linearGradient id="involuntaryGradient" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#DC2626" stopOpacity={0.9}/>
                            <stop offset="100%" stopColor="#991B1B" stopOpacity={0.7}/>
                          </linearGradient>
                          <linearGradient id="unsuccessfulGradient" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#F97316" stopOpacity={0.9}/>
                            <stop offset="100%" stopColor="#EA580C" stopOpacity={0.7}/>
                          </linearGradient>
                          <linearGradient id="otherGradient" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#6B7280" stopOpacity={0.9}/>
                            <stop offset="100%" stopColor="#4B5563" stopOpacity={0.7}/>
                          </linearGradient>
                          <linearGradient id="fallbackGradient" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.9}/>
                            <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.7}/>
                          </linearGradient>
                        </defs>
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
                          style={{ cursor: 'pointer' }}
                          onMouseEnter={handleSliceHover}
                          onMouseLeave={handleSliceLeave}
                        >
                          {dischargeChartData.map((entry, index) => {
                            const isHovered = hoveredSlice === entry.name
                            return (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={getDischargeGradient(entry.name)}
                                stroke={isHovered ? "#ffffff" : "#1F2937"}
                                strokeWidth={isHovered ? 3 : 2}
                                style={{
                                  filter: isHovered
                                    ? `drop-shadow(0 8px 25px ${getDischargeColor(entry.name)}60) drop-shadow(0 4px 15px rgba(0, 0, 0, 0.4))` 
                                    : `drop-shadow(0 4px 15px ${getDischargeColor(entry.name)}30) drop-shadow(0 2px 8px rgba(0, 0, 0, 0.2))`,
                                  transition: 'all 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
                                  transformOrigin: 'center',
                                  transform: isHovered ? 'scale(1.05)' : 'scale(1)'
                                }}
                              />
                            )
                          })}
                        </Pie>
                        <Tooltip
                          formatter={(value: number, name: string) => [
                            `${value} patients (${((value / patients.length) * 100).toFixed(1)}%)`,
                            name
                          ]}
                          contentStyle={{
                            backgroundColor: '#111827',
                            border: '1px solid #6B7280',
                            borderRadius: '12px',
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                            color: '#F9FAFB',
                            fontSize: '14px',
                            fontWeight: '500',
                            padding: '12px 16px',
                            backdropFilter: 'blur(8px)'
                          }}
                          labelStyle={{
                            color: '#E5E7EB',
                            fontSize: '15px',
                            fontWeight: '600',
                            marginBottom: '4px'
                          }}
                          itemStyle={{
                            color: '#D1D5DB',
                            fontSize: '13px',
                            fontWeight: '500'
                          }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          iconType="circle"
                          wrapperStyle={{
                            fontSize: "11px",
                            color: "#D1D5DB",
                            paddingTop: "10px",
                            cursor: 'pointer'
                          }}
                          formatter={(value: string) => (
                            <span style={{ color: "#D1D5DB", fontSize: "11px" }}>{value}</span>
                          )}
                          onMouseEnter={(e: any) => {
                            if (e && e.value) {
                              setHoveredSlice(e.value)
                            }
                          }}
                          onMouseLeave={() => setHoveredSlice(null)}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

          {/* Patient Motivations Wordcloud */}
          <Card className="bg-gradient-to-br from-slate-800/60 to-gray-800/60 shadow-2xl border-gray-600/40 hover:shadow-2xl transition-all duration-300">
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Heart className="h-5 w-5 text-pink-400" />
                  Motivation Themes
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Key motivational factors identified in patient assessments
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center justify-center gap-4 py-8 px-4 bg-gradient-to-br from-gray-900/30 to-gray-800/30 rounded-xl">
                {motivationWords.map((word, index) => (
                  <span
                    key={index}
                    className="font-bold transition-all duration-200 hover:scale-110 cursor-pointer select-none"
                    style={{
                      fontSize: `${Math.max(12, Math.min(word.size, 20))}px`,
                      color: word.color,
                      textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                      filter: `drop-shadow(0 0 8px ${word.color}40)`
                    }}
                  >
                    {word.text}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Chat Section - Separate full-width section */}
        <div className="mt-6 sm:mt-8">
          <OpenAIChat />
        </div>

        {/* Debug Panel - Development only */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6">
            <CacheDebugPanel />
          </div>
        )}
      </div>
    </div>
  )
}
