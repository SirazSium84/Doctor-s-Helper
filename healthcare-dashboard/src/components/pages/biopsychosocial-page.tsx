"use client"

import { useDashboardStore } from "@/store/dashboard-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PatientSelector } from "@/components/patient-selector"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, PolarGrid } from "recharts"
import { useMemo, useState, useCallback } from "react"
import { ArrowLeft, Users, TrendingUp, AlertTriangle, Info, ChevronRight, Database, BarChart3 } from "lucide-react"

export function BiopsychosocialPage() {
  const { patients, substanceHistory, selectedPatient, viewMode } = useDashboardStore()
  const [selectedSubstance, setSelectedSubstance] = useState<string | null>(null)
  const [drillDownData, setDrillDownData] = useState<any[]>([])
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  // Enhanced color scheme for substances - more professional and harmonious
  const substanceColors = {
    'Alcohol': '#4F46E5',        // Indigo - most common, prominent color
    'Marijuana': '#059669',      // Emerald - calming green
    'Cannabis': '#059669',       // Same as Marijuana
    'Cocaine': '#DC2626',        // Red - high alert
    'Opioids': '#7C3AED',        // Violet - serious concern
    'Stimulants': '#EA580C',     // Orange - energetic
    'Benzodiazepines': '#DB2777', // Pink - prescription drugs
    'Hallucinogens': '#0891B2',  // Cyan - unique/different
    'Heroin': '#991B1B',         // Dark red - severe
    'Methamphetamine': '#C2410C', // Dark orange - dangerous
    'Amphetamines': '#D97706',   // Amber
    'Barbiturates': '#BE185D',   // Rose
    'Inhalants': '#0369A1',      // Blue
    'Synthetic': '#7E22CE',      // Purple
    'Prescription': '#1D4ED8',   // Blue
    'Other': '#6B7280'           // Gray - neutral
  }

  // Enhanced pattern colors - using a cohesive gradient-based system
  const patternColors = {
    'Daily': '#DC2626',          // Red - highest frequency/concern
    'Continued': '#EA580C',      // Orange-red - ongoing concern
    'Weekly': '#D97706',         // Amber - moderate frequency
    'Binge/Episodic': '#0891B2', // Cyan - sporadic but concerning
    'Occasional': '#059669',     // Green - lower frequency
    'Experimental': '#4F46E5',   // Indigo - trial/testing
    'Rarely': '#10B981',         // Emerald - minimal use
    'Unknown': '#6B7280',        // Gray - no data
    'Past Use': '#9CA3AF',       // Light gray - historical
    'Social': '#06B6D4'          // Light blue - social context
  }

  // Generate additional harmonious colors for unknown substances/patterns
  const generateHarmonousColor = (index: number): string => {
    const harmonousColors = [
      '#8B5CF6', '#F59E0B', '#EF4444', '#10B981', '#3B82F6', 
      '#EC4899', '#14B8A6', '#F97316', '#84CC16', '#06B6D4',
      '#A855F7', '#EAB308', '#F87171', '#34D399', '#60A5FA',
      '#F472B6', '#2DD4BF', '#FB923C', '#A3E635', '#38BDF8'
    ]
    return harmonousColors[index % harmonousColors.length]
  }

  // Filter data based on view mode and use flag
  const filteredData = useMemo(() => {
    let data = substanceHistory.filter(item => item.useFlag === 1) // Only active users
    
    if (viewMode === "individual" && selectedPatient) {
      data = data.filter(item => item.patientId === selectedPatient)
    }
    return data
  }, [substanceHistory, selectedPatient, viewMode])

  // Main chart data - substance breakdown
  const mainChartData = useMemo(() => {
    const substanceCounts = filteredData.reduce((acc, item) => {
      // Normalize substance names
      const substance = item.substance.charAt(0).toUpperCase() + item.substance.slice(1).toLowerCase()
      acc[substance] = (acc[substance] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(substanceCounts)
      .map(([substance, count], index) => ({
        name: substance,
        value: count,
        percentage: ((count / filteredData.length) * 100).toFixed(1),
        color: substanceColors[substance as keyof typeof substanceColors] || generateHarmonousColor(index)
      }))
      .sort((a, b) => b.value - a.value)
  }, [filteredData])

  // Drill-down chart data - patterns for selected substance
  const drillDownChartData = useMemo(() => {
    if (!selectedSubstance) return []

    const substanceData = filteredData.filter(item => 
      item.substance.toLowerCase() === selectedSubstance.toLowerCase()
    )
    const patternCounts = substanceData.reduce((acc, item) => {
      const pattern = item.pattern || 'Unknown'
      acc[pattern] = (acc[pattern] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(patternCounts)
      .map(([pattern, count], index) => ({
        name: pattern,
        value: count,
        percentage: ((count / substanceData.length) * 100).toFixed(1),
        color: patternColors[pattern as keyof typeof patternColors] || generateHarmonousColor(index)
      }))
      .sort((a, b) => b.value - a.value)
  }, [filteredData, selectedSubstance])

  const getPatientName = (patientId: string) => {
    return patients.find((p) => p.id === patientId)?.name || patientId
  }

  const totalPatients = useMemo(() => {
    if (viewMode === "individual") return 1
    return new Set(filteredData.map(item => item.patientId)).size
  }, [filteredData, viewMode])

  const dataSourceInfo = useMemo(() => {
    const hasRealData = filteredData.some(item => item.substance && item.patientId && item.useFlag !== undefined)
    const hasMockData = filteredData.some(item => item.ageOfFirstUse !== undefined)
    
    if (hasRealData && !hasMockData) {
      return { type: 'real', message: 'Data from Patient Substance History & BPS tables' }
    } else if (hasMockData) {
      return { type: 'mock', message: 'Using generated sample data for demonstration' }
    } else {
      return { type: 'mixed', message: 'Mixed real and sample data' }
    }
  }, [filteredData])

  const handlePieClick = useCallback((data: any, substance: string) => {
    if (isAnimating) return
    
    setIsAnimating(true)
    setSelectedSubstance(substance)
    setDrillDownData(drillDownChartData)
    
    setTimeout(() => setIsAnimating(false), 1000)
  }, [drillDownChartData, isAnimating])

  const handleBackClick = useCallback(() => {
    if (isAnimating) return
    
    setIsAnimating(true)
    setSelectedSubstance(null)
    setDrillDownData([])
    
    setTimeout(() => setIsAnimating(false), 800)
  }, [isAnimating])

  const handleSliceHover = useCallback((data: any, index: number) => {
    setHoveredSlice(data?.name || null)
  }, [])

  const handleSliceLeave = useCallback(() => {
    setHoveredSlice(null)
  }, [])

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div 
          className="bg-gray-900/98 backdrop-blur-md border border-gray-600/60 rounded-2xl p-5 shadow-2xl transform transition-all duration-200 ease-out scale-105"
          style={{
            willChange: 'transform, opacity',
            transform: 'translate3d(0, 0, 0) scale(1.05)',
          }}
        >
          <div className="space-y-3">
            <div className="font-bold text-white text-base tracking-wide">{data.name}</div>
            <div className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded-full shadow-xl ring-2 ring-white/20 transition-all duration-200 ease-out" 
                style={{ 
                  backgroundColor: data.color,
                  boxShadow: `0 0 20px ${data.color}60, 0 0 40px ${data.color}30`,
                  willChange: 'box-shadow, transform',
                  transform: 'translate3d(0, 0, 0)',
                }}
              />
              <div className="flex items-baseline gap-2">
                <span className="text-white font-bold text-xl">{data.value}</span>
                <span className="text-gray-300 text-sm font-medium">
                  patients ({data.percentage}%)
                </span>
              </div>
            </div>
            {!selectedSubstance && (
              <div className="text-blue-400 text-sm flex items-center gap-2 mt-3 p-2 bg-blue-500/10 rounded-lg transition-all duration-200 ease-out">
                <ChevronRight className="w-4 h-4" />
                <span className="font-medium">Click to explore patterns</span>
              </div>
            )}
          </div>
        </div>
      )
    }
    return null
  }

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, percentage }: any) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.65
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    if (parseFloat(percentage) < 3.5) return null // Hide labels for very small slices

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={14}
        fontWeight={800}
        className="transition-all duration-300 ease-out"
        style={{
          textShadow: '0 2px 8px rgba(0, 0, 0, 0.9), 0 1px 3px rgba(0, 0, 0, 0.8)',
          filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8))',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          willChange: 'transform, opacity',
          transform: 'translate3d(0, 0, 0)',
        }}
      >
        {`${percentage}%`}
      </text>
    )
  }

  const renderLegend = (data: any[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-8">
      {data.map((item, index) => (
        <div 
          key={index} 
          className={`flex items-center gap-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700/40 hover:bg-gray-800/80 hover:border-gray-600/60 transition-all duration-300 ease-out cursor-pointer group ${
            hoveredSlice === item.name ? 'bg-gray-800/80 border-gray-600/60' : ''
          }`}
          onMouseEnter={() => setHoveredSlice(item.name)}
          onMouseLeave={() => setHoveredSlice(null)}
          style={{
            boxShadow: hoveredSlice === item.name 
              ? `0 8px 32px ${item.color}20, 0 4px 16px rgba(0, 0, 0, 0.3)` 
              : '0 2px 8px rgba(0, 0, 0, 0.1)',
            willChange: 'transform, box-shadow, background-color',
            transform: hoveredSlice === item.name 
              ? 'translate3d(0, -2px, 0) scale(1.02)' 
              : 'translate3d(0, 0, 0) scale(1)',
          }}
        >
          <div 
            className="w-5 h-5 rounded-full flex-shrink-0 shadow-lg ring-2 ring-white/10 transition-all duration-300 ease-out" 
            style={{ 
              backgroundColor: item.color,
              boxShadow: `0 0 20px ${item.color}50, inset 0 2px 4px rgba(255,255,255,0.2), 0 4px 8px rgba(0,0,0,0.2)`,
              willChange: 'transform, box-shadow',
              transform: hoveredSlice === item.name ? 'translate3d(0, 0, 0) scale(1.1)' : 'translate3d(0, 0, 0) scale(1)',
            }}
          />
          <div className="min-w-0 flex-1">
            <div className="text-white text-sm font-semibold truncate group-hover:text-white transition-colors duration-200">
              {item.name}
            </div>
            <div className="text-gray-400 text-xs font-medium group-hover:text-gray-300 transition-colors duration-200">
              {item.value} patients • {item.percentage}%
            </div>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out" style={{ willChange: 'opacity' }}>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      ))}
    </div>
  )

  const currentData = selectedSubstance ? drillDownChartData : mainChartData

  return (
    <div className="space-y-8 animate-in fade-in-0 duration-700" style={{ willChange: 'opacity' }}>
      {/* Header Card */}
      <Card className="bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900 border border-gray-700/50 shadow-2xl">
        <CardHeader className="pb-6">
          {/* Top Section: Title and Patient Selector */}
          <div className="flex items-start justify-between gap-8 mb-6">
            <div className="flex-1">
              <CardTitle className="text-white text-3xl font-bold flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-600/20 rounded-lg">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                <span className="bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                  {selectedSubstance 
                    ? `${selectedSubstance} Usage Patterns` 
                    : "Substance Use Analysis"
                  }
                </span>
              </CardTitle>
              
              <p className="text-gray-300 text-base leading-relaxed max-w-2xl mb-4">
                {selectedSubstance 
                  ? `Detailed breakdown of ${selectedSubstance.toLowerCase()} usage patterns and treatment insights`
                  : `Comprehensive analysis of substance use patterns across ${totalPatients} ${totalPatients === 1 ? 'patient' : 'patients'}`
                }
              </p>
              
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-700/50 rounded-lg inline-flex">
                <Database className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400 font-medium">{dataSourceInfo.message}</span>
              </div>
            </div>
            
            {/* Professional Controls Panel */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-lg min-w-[400px]">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-1.5 bg-gray-700 rounded-md">
                  <Users className="h-4 w-4 text-gray-300" />
                </div>
                <h3 className="font-semibold text-white">Analysis Controls</h3>
              </div>
              
              <div className="space-y-6">
                {/* Patient Scope */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Patient Scope</label>
                  <PatientSelector />
                </div>
                
                {/* View Mode */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">View Mode</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {/* TODO: Implement view mode toggle */}}
                      className={`px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                        viewMode === 'aggregate'
                          ? 'bg-blue-600 text-white shadow-md transform scale-[0.98]'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      All Patients
                    </button>
                    <button
                      onClick={() => {/* TODO: Implement view mode toggle */}}
                      className={`px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                        viewMode === 'individual'
                          ? 'bg-blue-600 text-white shadow-md transform scale-[0.98]'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      Individual Patient
                    </button>
                  </div>
                </div>
                
                {/* Time Period */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Time Period</label>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {(['7D', '30D', '90D'] as const).map((period) => (
                      <button
                        key={period}
                        onClick={() => {/* TODO: Implement time period filter */}}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                          false // TODO: Add selected state logic
                            ? 'bg-blue-600 text-white shadow-md transform scale-[0.98]'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                        }`}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {/* TODO: Implement all time filter */}}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                        true // TODO: Add selected state logic for "All Time"
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                      }`}
                    >
                      All Time
                    </button>
                    <button
                      onClick={() => {/* TODO: Implement custom date picker */}}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                        false // TODO: Add selected state logic for "Custom"
                          ? 'bg-violet-600 text-white shadow-md'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                      }`}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                      </svg>
                      Custom
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom Section: Key Metrics */}
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gradient-to-br from-blue-900/50 to-blue-800/30 rounded-xl border border-blue-700/30">
              <div className="text-3xl font-bold text-blue-400 mb-1">
                {selectedSubstance ? drillDownChartData.reduce((sum, item) => sum + item.value, 0) : filteredData.length}
              </div>
              <div className="text-sm text-blue-300 font-medium">Total Records</div>
              <div className="text-xs text-gray-400 mt-1">Substance use instances</div>
            </div>
            
            {!selectedSubstance && (
              <div className="text-center p-4 bg-gradient-to-br from-emerald-900/50 to-emerald-800/30 rounded-xl border border-emerald-700/30">
                <div className="text-3xl font-bold text-emerald-400 mb-1">{mainChartData.length}</div>
                <div className="text-sm text-emerald-300 font-medium">Substance Types</div>
                <div className="text-xs text-gray-400 mt-1">Unique substances identified</div>
              </div>
            )}
            
            <div className="text-center p-4 bg-gradient-to-br from-violet-900/50 to-violet-800/30 rounded-xl border border-violet-700/30">
              <div className="text-3xl font-bold text-violet-400 mb-1">{totalPatients}</div>
              <div className="text-sm text-violet-300 font-medium">
                {totalPatients === 1 ? 'Patient' : 'Patients'}
              </div>
              <div className="text-xs text-gray-400 mt-1">In current scope</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Chart Card */}
      <Card className="bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900 border border-gray-700/50 shadow-2xl overflow-hidden">
        <CardContent className="p-8">
          {currentData.length > 0 ? (
            <div className="space-y-8">
              <div className="relative">
                <ResponsiveContainer width="100%" height={600}>
                  <PieChart>
                    <defs>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge> 
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    
                    {/* Remove radial lines */}
                    <PolarGrid radialLines={false} />
                    
                    <Pie
                      data={currentData}
                      cx="50%"
                      cy="50%"
                      outerRadius={200}
                      innerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                      onClick={!selectedSubstance ? (data) => handlePieClick(data, data.name) : undefined}
                      onMouseEnter={handleSliceHover}
                      onMouseLeave={handleSliceLeave}
                      cursor={!selectedSubstance ? "pointer" : "default"}
                      label={CustomLabel}
                      animationBegin={0}
                      animationDuration={1600}
                      animationEasing="ease-out"
                      isAnimationActive={true}
                    >
                      {currentData.map((entry, index) => {
                        const isHovered = hoveredSlice === entry.name
                        return (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color}
                            stroke={isHovered ? "#ffffff" : "#1F2937"}
                            strokeWidth={isHovered ? 3 : 2}
                            filter={isHovered ? "url(#glow)" : undefined}
                            style={{
                              filter: isHovered
                                ? `drop-shadow(0 8px 25px ${entry.color}60) drop-shadow(0 4px 15px rgba(0, 0, 0, 0.4))` 
                                : `drop-shadow(0 4px 15px ${entry.color}30) drop-shadow(0 2px 8px rgba(0, 0, 0, 0.2))`,
                              transition: 'all 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
                              willChange: 'transform, filter',
                              transformOrigin: 'center',
                              transform: isHovered ? 'translate3d(0, 0, 0) scale(1.05)' : 'translate3d(0, 0, 0) scale(1)'
                            }}
                          />
                        )
                      })}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Center Content - Perfectly Circular */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div 
                    className="flex items-center justify-center w-32 h-32 text-center bg-gray-900/90 backdrop-blur-sm rounded-full border border-gray-600/40 shadow-2xl transition-all duration-300 ease-out"
                    style={{
                      willChange: 'transform, box-shadow',
                      transform: 'translate3d(0, 0, 0)',
                    }}
                  >
                    {selectedSubstance ? (
                      // Show selected substance name when in drill-down mode
                      <button 
                        onClick={handleBackClick}
                        disabled={isAnimating}
                        className="pointer-events-auto flex items-center justify-center w-full h-full text-blue-400 hover:text-blue-300 transition-all duration-300 ease-out hover:bg-blue-500/10 rounded-full disabled:opacity-50 group"
                        style={{
                          willChange: 'transform, background-color, color',
                          transform: 'translate3d(0, 0, 0)',
                        }}
                      >
                        <div className="space-y-1">
                          <ArrowLeft 
                            className="w-6 h-6 mx-auto group-hover:scale-110 transition-transform duration-200 ease-out" 
                            style={{
                              willChange: 'transform',
                              transform: 'translate3d(0, 0, 0)',
                            }}
                          />
                          <div className="text-white font-bold text-sm leading-tight px-2">
                            {selectedSubstance}
                          </div>
                          <div className="text-gray-400 text-xs font-medium">
                            patterns
                          </div>
                        </div>
                      </button>
                    ) : (
                      // Default content when showing main view
                      <div className="space-y-1">
                        <BarChart3 className="w-7 h-7 text-blue-400 mx-auto" />
                        <div className="text-white font-bold text-base leading-tight">
                          Substances
                        </div>
                        <div className="text-gray-400 text-xs font-medium">
                          {currentData.length} {currentData.length === 1 ? 'type' : 'types'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Legend */}
              {renderLegend(currentData)}


            </div>
          ) : (
            <div className="flex items-center justify-center h-96 text-gray-400">
              <div className="text-center">
                <AlertTriangle className="w-20 h-20 mx-auto mb-6 opacity-50" />
                <p className="text-xl mb-3 font-semibold">No Data Available</p>
                <p className="text-base text-gray-500">
                  {viewMode === "individual"
                    ? "Please select a patient with substance use history"
                    : "No substance use records found in the system"}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>


    </div>
  )
} 