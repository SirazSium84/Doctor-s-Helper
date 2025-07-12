'use client'

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PatientSelector } from '@/components/patient-selector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, AreaChart, Area, ComposedChart } from 'recharts'
import { TrendingUp, TrendingDown, Brain, Heart, Shield, Activity, Calendar, Users, AlertTriangle, CheckCircle, Target, Zap, Pill, Clock, MessageSquare, Filter, X } from 'lucide-react'
import { useDashboardStore } from '@/store/dashboard-store'
import { comprehensiveDataService } from '@/lib/comprehensive-data-service'
import { calculateEmotionalMetrics, calculateCopingSkillsMetrics, calculateSelfCareMetrics } from '@/lib/supabase-service'
import { PHPAssessment, EmotionalStateMetrics, CopingSkillsMetrics, SelfCareMetrics } from '@/types/assessments'

interface MonthlyTrend {
  month: string
  assessments: number
  avgSkillsUsed: number
  avgSelfCare: number
  positiveEmotions: number
  negativeEmotions: number
  therapyAttendance: number // Count of assessments with therapy
  medicationAdherence: number // Count of assessments with medication adherence
}

interface PatientEngagement {
  patientId: string
  assessmentCount: number
  dateRange: string
  avgSkills: number
  avgSelfCare: number
  topEmotion: string
  engagementLevel: 'High' | 'Medium' | 'Low'
}

interface TextInsights {
  emotionWordsAvailable: number // Now represents assessments with emotional data
  skillWordsAvailable: number // Now represents assessments with skills data
  supportWordsAvailable: number
  cravingDataAvailable: number
  totalRecords: number
  sampleEmotionWords?: string
  sampleSkillWords?: string
}

interface PHPAssessmentAgentProps {
  assessmentData: PHPAssessment[]
  patientEngagement: PatientEngagement[]
  monthlyTrends: MonthlyTrend[]
  emotionalBreakdown: any[]
  copingStrategies: any[]
  dataSource: 'live' | 'demo'
}

function PHPAssessmentAgent({
  assessmentData,
  patientEngagement,
  monthlyTrends,
  emotionalBreakdown,
  copingStrategies,
  dataSource
}: PHPAssessmentAgentProps) {
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([
    {
      role: 'assistant',
      content: "Hi! I'm your PHP Assessment Agent. I can help you analyze patient data, emotional patterns, and treatment outcomes. What would you like to know?"
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom within chat container when new messages are added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [messages])

  // Generate intelligent responses using OpenAI
  const generateContextualResponse = useCallback(async (question: string): Promise<string> => {
    // Calculate real-time data summary to match charts
    const totalAssessments = assessmentData.length
    
    // Get unique patients from current filtered data
    const uniquePatients = new Set(assessmentData.map(a => a.groupIdentifier || a.uniqueId)).size
    const totalPatients = uniquePatients || patientEngagement.length
    
    const avgAssessments = totalPatients > 0 ? Math.round(totalAssessments / totalPatients * 10) / 10 : 0
    const topEmotion = emotionalBreakdown[0]?.emotion || 'None'
    const topStrategy = copingStrategies[0]?.strategy || 'None'
    
    // Real-time medication and therapy rates from current filtered data
    const medicationRate = totalAssessments > 0 ? Math.round((assessmentData.filter(a => a.takeMyMeds).length / totalAssessments) * 100) : 0
    const therapyRate = totalAssessments > 0 ? Math.round((assessmentData.filter(a => a.therapy).length / totalAssessments) * 100) : 0
    
    // Prepare comprehensive data context for OpenAI
    const dataContext = {
      overview: {
        totalPatients,
        totalAssessments,
        avgAssessments,
        dataSource: dataSource === 'live' ? 'Live clinical data' : 'Demo data'
      },
      emotions: emotionalBreakdown.slice(0, 5).map(e => ({
        emotion: e.emotion,
        count: e.count,
        percentage: e.percentage
      })),
      copingStrategies: copingStrategies.slice(0, 5).map(s => ({
        strategy: s.strategy,
        count: s.count,
        percentage: s.percentage
      })),
      treatmentMetrics: {
        medicationAdherence: medicationRate,
        therapyAttendance: therapyRate
      },
      monthlyTrends: monthlyTrends.map(m => ({
        month: m.month,
        assessments: m.assessments,
        avgSkillsUsed: m.avgSkillsUsed,
        avgSelfCare: m.avgSelfCare,
        therapyAttendance: m.therapyAttendance,
        medicationAdherence: m.medicationAdherence
      })),
      patientEngagement: patientEngagement.slice(0, 10).map(p => ({
        patientId: p.patientId,
        engagementLevel: p.engagementLevel,
        assessmentCount: p.assessmentCount,
        topEmotion: p.topEmotion,
        avgSkills: p.avgSkills,
        avgSelfCare: p.avgSelfCare,
        dateRange: p.dateRange
      })),
      // Include sample of actual patient IDs from assessments
      recentPatientIds: [...new Set(assessmentData.slice(0, 20).map(a => a.groupIdentifier || a.uniqueId))].filter(Boolean),
      // High-risk patients with actual IDs
      lowEngagementPatients: patientEngagement.filter(p => p.engagementLevel === 'Low').map(p => ({
        patientId: p.patientId,
        assessmentCount: p.assessmentCount,
        topEmotion: p.topEmotion,
        avgSkills: p.avgSkills,
        reasons: [
          p.assessmentCount < 5 ? 'Low assessment frequency' : null,
          p.avgSkills < 1 ? 'Poor coping skills usage' : null,
          p.topEmotion === 'anxiety' || p.topEmotion === 'depressed' ? `Concerning emotion: ${p.topEmotion}` : null
        ].filter(Boolean)
      }))
    }

    try {
      const response = await fetch('/api/php-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are a clinical data analyst for a Primary Health Program (PHP) used by doctors and healthcare professionals. You have access to real-time patient assessment data and should provide accurate, professional insights based on the data provided.

CURRENT DATA CONTEXT:
${JSON.stringify(dataContext, null, 2)}

Guidelines:
- Provide specific, data-driven insights with actual patient IDs when relevant
- Use clinical terminology appropriately
- When identifying patients who need attention, include their specific patient IDs
- Highlight concerning patterns or positive outcomes with patient identifiers
- Reference actual numbers and percentages from the data
- Be concise but comprehensive
- Use markdown formatting for key metrics (bold with **)
- Focus on actionable clinical insights that doctors can act upon
- Include patient IDs in recommendations (e.g., "Patient ABC123 requires immediate intervention")
- This is a secure clinical environment - patient IDs are appropriate to share`
            },
            {
              role: 'user',
              content: question
            }
          ]
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data.response || 'I apologize, but I encountered an issue processing your question. Please try again.'
      
    } catch (error) {
      console.error('Error calling OpenAI:', error)
      
      // Fallback to basic pattern matching if OpenAI fails
      const lowerQuestion = question.toLowerCase()
      
      if (lowerQuestion.includes('patient') && lowerQuestion.includes('total')) {
        return `We currently have **${totalPatients} unique patients** enrolled in the PHP program with **${totalAssessments} total assessments** (${avgAssessments} avg per patient).`
      }
      
      if (lowerQuestion.includes('emotion') || lowerQuestion.includes('feeling')) {
        const emotionsList = emotionalBreakdown.slice(0, 3).map(e => `${e.emotion} (${e.percentage}%)`).join(', ')
        return `The most common emotional states are: **${emotionsList}**. The dominant emotion is **${topEmotion}**.`
      }
      
      // Default overview for any other questions
      return `**PHP Program Overview:**
      
📊 **${totalPatients} patients** with **${totalAssessments} assessments**
😊 **Top emotion:** ${topEmotion} (${emotionalBreakdown[0]?.percentage || 0}%)
🛡️ **Primary strategy:** ${topStrategy} (${copingStrategies[0]?.percentage || 0}%)
💊 **Medication adherence:** ${medicationRate}%
🏥 **Therapy attendance:** ${therapyRate}%

*Note: Enhanced AI analysis temporarily unavailable, showing basic summary.*`
    }
  }, [assessmentData, patientEngagement, monthlyTrends, emotionalBreakdown, copingStrategies, dataSource])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setIsLoading(true)

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])

    try {
      // Get AI response
      const response = await generateContextualResponse(userMessage)
      setMessages(prev => [...prev, { role: 'assistant', content: response }])
    } catch (error) {
      console.error('Error generating response:', error)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I apologize, but I encountered an error while processing your question. Please try again.' 
      }])
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, generateContextualResponse])

  return (
    <div className="flex flex-col h-[650px]">
      {/* Chat Messages */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto space-y-4 p-6 bg-gray-900/50 rounded-lg border border-gray-700 scroll-smooth"
      >
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-xl shadow-lg ${
              message.role === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-100 border border-gray-600'
            }`}>
              {message.role === 'assistant' ? (
                <div className="prose prose-sm prose-invert max-w-none">
                  {message.content.split('\n').map((line, i) => (
                    <p key={i} className="mb-2 last:mb-0 leading-relaxed">
                      {line.includes('**') ? (
                        line.split('**').map((part, j) => 
                          j % 2 === 1 ? <strong key={j} className="text-blue-400 font-semibold">{part}</strong> : part
                        )
                      ) : line}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-sm font-medium">{message.content}</p>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-700 text-gray-100 p-4 rounded-xl border border-gray-600 shadow-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                <span className="text-sm text-gray-300 ml-2">Analyzing clinical data...</span>
              </div>
            </div>
          </div>
        )}
        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-3 mt-6">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about patient patterns, emotional trends, treatment outcomes..."
          className="flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400 h-12 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={isLoading}
        />
        <Button 
          type="submit" 
          disabled={!input.trim() || isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-12 font-semibold shadow-lg hover:shadow-xl transition-all"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 animate-spin" />
              <span>Analyzing</span>
            </div>
          ) : (
            'Ask Agent'
          )}
        </Button>
      </form>

      {/* Clinical Quick Actions */}
      <div className="mt-4">
        <p className="text-xs text-gray-400 mb-3 font-medium">Quick Clinical Queries:</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            "Which patients need immediate attention?",
            "Show medication adherence issues", 
            "Identify high-risk emotional patterns",
            "List patients with low engagement"
          ].map((suggestion, index) => (
            <button
              key={index}
              onClick={() => setInput(suggestion)}
              className="text-xs px-4 py-2 bg-gradient-to-r from-gray-700/60 to-gray-600/40 hover:from-gray-600/60 hover:to-gray-500/40 border border-gray-600 rounded-lg text-gray-300 hover:text-white transition-all duration-200 text-left font-medium shadow-sm hover:shadow-md"
              disabled={isLoading}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function PHPEmotionalAnalyticsPage() {
  const [phpData, setPhpData] = useState<PHPAssessment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dataSource, setDataSource] = useState<'live' | 'demo'>('demo')
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d' | 'all' | 'custom'>('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false)
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null)
  
  const { selectedPatient } = useDashboardStore()

  // Hover handlers for pie chart
  const handleSliceHover = useCallback((data: any, index: number) => {
    setHoveredSlice(data?.emotion || null)
  }, [])

  const handleSliceLeave = useCallback(() => {
    setHoveredSlice(null)
  }, [])

  // Fetch PHP data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      console.log('🔄 Loading PHP Emotional Analytics data from cache...')
      
      try {
        // Get PHP data from comprehensive cache
        const allPhpData = await comprehensiveDataService.getPHPAssessments()
        
        // Filter by selected patient if needed
        const filteredData = selectedPatient === 'all' || !selectedPatient 
          ? allPhpData 
          : allPhpData.filter(assessment => assessment.groupIdentifier === selectedPatient)
        
        setPhpData(filteredData)
        
        // Better detection of data source based on real data patterns
        const isLiveData = filteredData.length > 0 && 
          filteredData[0].uniqueId && 
          !filteredData[0].uniqueId.startsWith('php_') &&
          filteredData[0].uniqueId.length > 10 // Real patient IDs are longer
        
        setDataSource(isLiveData ? 'live' : 'demo')
        console.log(`✅ Loaded ${filteredData.length} PHP assessments from cache (${isLiveData ? 'LIVE' : 'DEMO'} data)`)
        
      } catch (error) {
        console.error('❌ Error loading PHP data from cache:', error)
        setPhpData([])
        setDataSource('demo')
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [selectedPatient])

  // Filter data by time range
  const filteredData = useMemo(() => {
    if (selectedTimeRange === 'all') return phpData
    
    if (selectedTimeRange === 'custom') {
      if (!customStartDate && !customEndDate) return phpData
      
      return phpData.filter(assessment => {
        const assessmentDate = new Date(assessment.assessmentDate)
        const startMatch = !customStartDate || assessmentDate >= new Date(customStartDate)
        const endMatch = !customEndDate || assessmentDate <= new Date(customEndDate + 'T23:59:59')
        return startMatch && endMatch
      })
    }
    
    const days = selectedTimeRange === '7d' ? 7 : selectedTimeRange === '30d' ? 30 : 90
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    
    return phpData.filter(assessment => 
      new Date(assessment.assessmentDate) >= cutoffDate
    )
  }, [phpData, selectedTimeRange, customStartDate, customEndDate])

  // Monthly trends analysis based on real data patterns
  const monthlyTrends = useMemo(() => {
    const monthlyData: Record<string, MonthlyTrend> = {}
    
    filteredData.forEach(assessment => {
      const month = assessment.assessmentDate.substring(0, 7) // YYYY-MM
      
      if (!monthlyData[month]) {
        monthlyData[month] = {
          month,
          assessments: 0,
          avgSkillsUsed: 0,
          avgSelfCare: 0,
          positiveEmotions: 0,
          negativeEmotions: 0,
          therapyAttendance: 0,
          medicationAdherence: 0
        }
      }
      
      const trend = monthlyData[month]
      trend.assessments++
      
      // Count skills used (based on real data showing average 0.4 to 2.7 skills per assessment)
      const skillsUsed = [
        'mindfulnessmeditation', 'distressTolerance', 'oppositeAction', 'takeMyMeds',
        'askForHelp', 'improveMoment', 'partsWork', 'playTheTapeThru', 'values'
      ].reduce((count, skill) => count + (assessment[skill as keyof PHPAssessment] ? 1 : 0), 0)
      
      trend.avgSkillsUsed += skillsUsed
      
      // Count self-care activities
      const selfCareUsed = [
        'sleep', 'nutrition', 'exercise', 'fun', 'connection', 'warmth', 'water', 'love', 'therapy'
      ].reduce((count, activity) => count + (assessment[activity as keyof PHPAssessment] ? 1 : 0), 0)
      
      trend.avgSelfCare += selfCareUsed
      
      // Count emotions (joy is most common at 51.6%, anxiety at 40.6%)
      if (assessment.content || assessment.joy) trend.positiveEmotions++
      if (assessment.sad || assessment.anxiety || assessment.depressed || assessment.anger || 
          assessment.fear || assessment.pain || assessment.shame || assessment.alone) {
        trend.negativeEmotions++
      }
      
      // Track therapy and medication (key insights from real data)
      if (assessment.therapy) trend.therapyAttendance++
      if (assessment.takeMyMeds) trend.medicationAdherence++
    })
    
    // Calculate averages
    Object.values(monthlyData).forEach(trend => {
      if (trend.assessments > 0) {
        trend.avgSkillsUsed = Math.round((trend.avgSkillsUsed / trend.assessments) * 10) / 10
        trend.avgSelfCare = Math.round((trend.avgSelfCare / trend.assessments) * 10) / 10
        // Keep therapyAttendance and medicationAdherence as counts for the bar chart
        // (they are already counts from the accumulation above)
      }
    })
    
    const result = Object.values(monthlyData)
      .filter(trend => trend.assessments > 0) // Only include months with actual data
      .sort((a, b) => a.month.localeCompare(b.month))
    
    console.log('📅 Monthly Trends Data:', result)
    return result
  }, [filteredData])

  // Patient engagement analysis (real data shows 1-25 assessments per patient)
  const patientEngagement = useMemo(() => {
    const patients: Record<string, PatientEngagement> = {}
    
    filteredData.forEach(assessment => {
      // Use the actual properties available on PHPAssessment
      const pid = assessment.groupIdentifier || assessment.uniqueId
      
      if (!pid) {
        console.warn('No patient identifier found in assessment:', assessment)
        return
      }
      
      if (!patients[pid]) {
        patients[pid] = {
          patientId: pid,
          assessmentCount: 0,
          dateRange: '',
          avgSkills: 0,
          avgSelfCare: 0,
          topEmotion: '',
          engagementLevel: 'Low'
        }
      }
      
      patients[pid].assessmentCount++
    })
    
    // Calculate engagement metrics
    Object.entries(patients).forEach(([pid, patient]) => {
      const patientData = filteredData.filter(a => {
        const assessmentPid = a.groupIdentifier || a.uniqueId
        return assessmentPid === pid
      })
      
      // Date range
      const dates = patientData.map(a => a.assessmentDate).sort()
      patient.dateRange = dates.length > 1 ? `${dates[0]} → ${dates[dates.length - 1]}` : dates[0]
      
      // Average skills and self-care
      const totalSkills = patientData.reduce((sum, a) => {
        return sum + ['mindfulnessmeditation', 'distressTolerance', 'oppositeAction', 'takeMyMeds',
                     'askForHelp', 'improveMoment', 'partsWork', 'playTheTapeThru', 'values']
                    .reduce((count, skill) => count + (a[skill as keyof PHPAssessment] ? 1 : 0), 0)
      }, 0)
      
      const totalSelfCare = patientData.reduce((sum, a) => {
        return sum + ['sleep', 'nutrition', 'exercise', 'fun', 'connection', 'warmth', 'water', 'love', 'therapy']
                    .reduce((count, activity) => count + (a[activity as keyof PHPAssessment] ? 1 : 0), 0)
      }, 0)
      
      patient.avgSkills = Math.round((totalSkills / patientData.length) * 10) / 10
      patient.avgSelfCare = Math.round((totalSelfCare / patientData.length) * 10) / 10
      
      // Top emotion (based on real data: joy > anxiety > depressed)
      const emotionCounts = {
        joy: patientData.filter(a => a.joy).length,
        anxiety: patientData.filter(a => a.anxiety).length,
        depressed: patientData.filter(a => a.depressed).length,
        content: patientData.filter(a => a.content).length,
        sad: patientData.filter(a => a.sad).length
      }
      
      patient.topEmotion = Object.entries(emotionCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'none'
      
      // Engagement level based on real data patterns
      if (patient.assessmentCount >= 20) patient.engagementLevel = 'High'
      else if (patient.assessmentCount >= 10) patient.engagementLevel = 'Medium'
      else patient.engagementLevel = 'Low'
    })
    
    console.log(`📊 Patient Engagement Analysis: ${Object.keys(patients).length} unique patients found`)
    
    return Object.values(patients).sort((a, b) => b.assessmentCount - a.assessmentCount)
  }, [filteredData])

  // Real emotional state breakdown (based on actual frequencies) - Enhanced with brighter colors
  const emotionalBreakdown = useMemo(() => {
    const emotions = {
      joy: { count: 0, color: '#FCD34D', label: 'Joy' },           // Brighter amber
      anxiety: { count: 0, color: '#F87171', label: 'Anxiety' },    // Brighter red
      depressed: { count: 0, color: '#818CF8', label: 'Depressed' }, // Brighter indigo
      shame: { count: 0, color: '#A78BFA', label: 'Shame' },        // Brighter purple
      pain: { count: 0, color: '#EF4444', label: 'Pain' },          // Bright red
      content: { count: 0, color: '#34D399', label: 'Content' },    // Brighter emerald
      sad: { count: 0, color: '#C084FC', label: 'Sad' },            // Brighter purple
      alone: { count: 0, color: '#A855F7', label: 'Alone' },        // Bright purple
      fear: { count: 0, color: '#10B981', label: 'Fear' },          // Bright emerald
      anger: { count: 0, color: '#FB923C', label: 'Anger' }         // Brighter orange
    }
    
    filteredData.forEach(assessment => {
      Object.keys(emotions).forEach(emotion => {
        if (assessment[emotion as keyof PHPAssessment]) {
          emotions[emotion as keyof typeof emotions].count++
        }
      })
    })
    
    return Object.entries(emotions)
      .map(([key, data]) => ({
        emotion: data.label,
        count: data.count,
        percentage: filteredData.length > 0 ? Math.round((data.count / filteredData.length) * 100) : 0,
        fill: data.color
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6) // Top 6 emotions
  }, [filteredData])

  // Top coping strategies (based on real usage patterns)
  const topCopingStrategies = useMemo(() => {
    const strategies = {
      takeMyMeds: { count: 0, label: 'Medication Adherence', color: '#ef4444' },
      values: { count: 0, label: 'Values-Based Actions', color: '#10b981' },
      mindfulnessmeditation: { count: 0, label: 'Mindfulness/Meditation', color: '#6366f1' },
      oppositeAction: { count: 0, label: 'Opposite Action', color: '#f59e0b' },
      askForHelp: { count: 0, label: 'Asking for Help', color: '#8b5cf6' },
      playTheTapeThru: { count: 0, label: 'Play the Tape Through', color: '#ec4899' },
      distressTolerance: { count: 0, label: 'Distress Tolerance', color: '#06b6d4' }
    }
    
    console.log('🔍 Debugging Coping Strategies - Total filtered data:', filteredData.length)
    
    filteredData.forEach((assessment, index) => {
      Object.keys(strategies).forEach(strategy => {
        if (assessment[strategy as keyof PHPAssessment]) {
          strategies[strategy as keyof typeof strategies].count++
          if (index < 3) { // Log first few matches for debugging
            console.log(`✓ Found ${strategy} in assessment ${index}`)
          }
        }
      })
    })
    
    const result = Object.entries(strategies)
      .map(([key, data]) => ({
        strategy: data.label,
        count: data.count,
        percentage: filteredData.length > 0 ? Math.round((data.count / filteredData.length) * 100) : 0,
        fill: data.color
      }))
      .filter(item => item.count > 0) // Only include strategies that have data
      .sort((a, b) => b.count - a.count)
    
    console.log('📊 Coping Strategies Data:', result)
    console.log('📊 Detailed breakdown:', result.map(item => `${item.strategy}: ${item.count} (${item.percentage}%)`))
    return result
  }, [filteredData])

  // Enhanced data insights
  const textInsights: TextInsights = useMemo(() => {
    // Count assessments with any emotional state data
    const emotionalDataCount = filteredData.filter(d => 
      d.pain || d.sad || d.content || d.anger || d.shame || d.fear || 
      d.joy || d.anxiety || d.depressed || d.alone
    ).length
    
    // Count assessments with any coping skills data
    const skillsDataCount = filteredData.filter(d => 
      d.mindfulnessmeditation || d.distressTolerance || d.oppositeAction || 
      d.takeMyMeds || d.askForHelp || d.improveMoment || d.partsWork || 
      d.playTheTapeThru || d.values
    ).length
    
    // Count assessments with text data
    const textEmotionCount = filteredData.filter(d => d.matchedEmotionWords && d.matchedEmotionWords.trim()).length
    const textSkillCount = filteredData.filter(d => d.matchSkillWords && d.matchSkillWords.trim()).length
    const supportWordsCount = filteredData.filter(d => d.matchSupportWords && d.matchSupportWords.trim()).length
    const cravingCount = filteredData.filter(d => d.craving && d.craving.trim()).length
    
    // Get sample text data
    const sampleWithEmotions = filteredData.find(d => d.matchedEmotionWords && d.matchedEmotionWords.trim())
    const sampleWithSkills = filteredData.find(d => d.matchSkillWords && d.matchSkillWords.trim())
    
    // Analyze most common emotions and skills
    const emotionCounts = {
      joy: filteredData.filter(d => d.joy).length,
      anxiety: filteredData.filter(d => d.anxiety).length,
      depressed: filteredData.filter(d => d.depressed).length,
      content: filteredData.filter(d => d.content).length,
      pain: filteredData.filter(d => d.pain).length
    }
    
    const skillCounts = {
      medication: filteredData.filter(d => d.takeMyMeds).length,
      mindfulness: filteredData.filter(d => d.mindfulnessmeditation).length,
      values: filteredData.filter(d => d.values).length,
      help: filteredData.filter(d => d.askForHelp).length,
      opposite: filteredData.filter(d => d.oppositeAction).length
    }
    
    const topEmotion = Object.entries(emotionCounts).sort(([,a], [,b]) => b - a)[0]
    const topSkill = Object.entries(skillCounts).sort(([,a], [,b]) => b - a)[0]
    
    return {
      emotionWordsAvailable: emotionalDataCount, // Changed to use structured data count
      skillWordsAvailable: skillsDataCount, // Changed to use structured data count
      supportWordsAvailable: supportWordsCount,
      cravingDataAvailable: cravingCount,
      totalRecords: filteredData.length,
      sampleEmotionWords: sampleWithEmotions?.matchedEmotionWords || 
        (topEmotion ? `${topEmotion[0]} (${topEmotion[1]} assessments)` : undefined),
      sampleSkillWords: sampleWithSkills?.matchSkillWords || 
        (topSkill ? `${topSkill[0]} (${topSkill[1]} assessments)` : undefined)
    }
  }, [filteredData])

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">PHP Emotional State Analytics</h1>
          <PatientSelector />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-8 shadow-2xl">
        {/* Top Section: Title and Controls */}
        <div className="flex items-start justify-between gap-8 mb-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <Brain className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">PHP Emotional Analytics</h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <p className="text-gray-300 font-medium">Real-time Clinical Insights</p>
                </div>
              </div>
            </div>
            <p className="text-gray-400 leading-relaxed max-w-2xl">
              Comprehensive analysis of emotional states, therapeutic engagement, and treatment outcomes for Primary Health Program participants
            </p>
          </div>
          
          {/* Professional Controls Panel */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-lg min-w-[400px]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-1.5 bg-gray-700 rounded-md">
                <Calendar className="h-4 w-4 text-gray-300" />
              </div>
              <h3 className="font-semibold text-white">Analysis Controls</h3>
            </div>
            
            <div className="space-y-4">
              {/* Patient Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Patient Scope</label>
                <PatientSelector />
              </div>
              
              {/* Time Range Controls */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Time Period</label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {(['7d', '30d', '90d'] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => {
                        setSelectedTimeRange(range)
                        setShowCustomDatePicker(false)
                      }}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                        selectedTimeRange === range
                          ? 'bg-blue-600 text-white shadow-md transform scale-[0.98]'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                      }`}
                    >
                      {range.toUpperCase()}
                    </button>
                  ))}
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setSelectedTimeRange('all')
                      setShowCustomDatePicker(false)
                    }}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      selectedTimeRange === 'all'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                    }`}
                  >
                    All Time
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTimeRange('custom')
                      setShowCustomDatePicker(!showCustomDatePicker)
                    }}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                      selectedTimeRange === 'custom'
                        ? 'bg-violet-600 text-white shadow-md'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                    }`}
                  >
                    <Filter className="h-3.5 w-3.5" />
                    Custom
                  </button>
                </div>
              </div>
            </div>
            
            {/* Professional Custom Date Picker */}
            {showCustomDatePicker && (
              <div className="mt-4 p-4 bg-gradient-to-br from-violet-900/50 to-purple-900/50 border border-violet-700 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-violet-600/20 rounded-md">
                      <Calendar className="h-3.5 w-3.5 text-violet-400" />
                    </div>
                    <h4 className="font-semibold text-white">Custom Range</h4>
                  </div>
                  <button
                    onClick={() => setShowCustomDatePicker(false)}
                    className="p-1 text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded-md transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
                    <Input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="text-sm font-medium text-white border-violet-600 focus:border-violet-400 focus:ring-violet-400 bg-gray-700"
                    />
                    {customStartDate && (
                      <p className="text-xs text-violet-400 mt-1.5 font-medium">
                        From: {new Date(customStartDate).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
                    <Input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="text-sm font-medium text-white border-violet-600 focus:border-violet-400 focus:ring-violet-400 bg-gray-700"
                    />
                    {customEndDate && (
                      <p className="text-xs text-violet-400 mt-1.5 font-medium">
                        To: {new Date(customEndDate).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-300">
                      {filteredData.length} assessments
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCustomStartDate('')
                        setCustomEndDate('')
                      }}
                      className="text-sm border-gray-600 text-gray-300 hover:bg-gray-700 bg-gray-800"
                    >
                      Reset
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setShowCustomDatePicker(false)}
                      className="text-sm bg-violet-600 hover:bg-violet-700 text-white"
                    >
                      Apply Range
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Professional Key Metrics - Full Width */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="group hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-blue-900/50 to-indigo-900/50 ring-1 ring-blue-700/50 hover:ring-blue-600/60">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-600/20 rounded-xl group-hover:bg-blue-600/30 transition-colors">
                    <Users className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Total Patients</p>
                    <p className="text-3xl font-bold text-white tracking-tight">{patientEngagement.length}</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-3">Unique individuals enrolled in PHP program</p>
              <div className="flex items-center gap-2 p-2 bg-blue-600/10 rounded-lg">
                <TrendingUp className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-300">
                  {patientEngagement.filter(p => p.engagementLevel === 'High').length} high-engagement patients
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-emerald-900/50 to-green-900/50 ring-1 ring-emerald-700/50 hover:ring-emerald-600/60">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-600/20 rounded-xl group-hover:bg-emerald-600/30 transition-colors">
                    <Heart className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Therapy Attendance</p>
                    <p className="text-3xl font-bold text-white tracking-tight">
                      {filteredData.length > 0 ? Math.round((filteredData.filter(a => a.therapy).length / filteredData.length) * 100) : 0}%
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-3">Sessions with therapeutic participation</p>
              <div className="flex items-center gap-2 p-2 bg-emerald-600/10 rounded-lg">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-300">
                  {filteredData.filter(a => a.therapy).length} total sessions completed
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-violet-900/50 to-purple-900/50 ring-1 ring-violet-700/50 hover:ring-violet-600/60">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-violet-600/20 rounded-xl group-hover:bg-violet-600/30 transition-colors">
                    <Pill className="h-6 w-6 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Medication Adherence</p>
                    <p className="text-3xl font-bold text-white tracking-tight">
                      {filteredData.length > 0 ? Math.round((filteredData.filter(a => a.takeMyMeds).length / filteredData.length) * 100) : 0}%
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-3">Compliance with prescribed medications</p>
              <div className="flex items-center gap-2 p-2 bg-violet-600/10 rounded-lg">
                <Shield className="h-4 w-4 text-violet-400" />
                <span className="text-sm font-medium text-violet-300">
                  Primary therapeutic coping strategy
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>



      {/* Charts Grid - Restructured based on real insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Program Progression */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <TrendingUp className="h-5 w-5 text-blue-400" />
              Program Progression by Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #4B5563',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    color: '#F9FAFB'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="avgSkillsUsed" 
                  stackId="1"
                  stroke="#6366f1" 
                  fill="#6366f1"
                  fillOpacity={0.6}
                  name="Avg Skills Used"
                />
                <Area 
                  type="monotone" 
                  dataKey="avgSelfCare" 
                  stackId="1"
                  stroke="#10b981" 
                  fill="#10b981"
                  fillOpacity={0.6}
                  name="Avg Self-Care"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Emotional State Distribution (Real Frequencies) */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Target className="h-5 w-5 text-purple-400" />
              Emotional State Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <defs>
                  <filter id="emotionGlow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge> 
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <Pie
                  data={emotionalBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="count"
                  nameKey="emotion"
                  onMouseEnter={handleSliceHover}
                  onMouseLeave={handleSliceLeave}
                  style={{ cursor: 'pointer' }}
                  animationBegin={0}
                  animationDuration={1200}
                  animationEasing="ease-out"
                  isAnimationActive={true}
                >
                  {emotionalBreakdown.map((entry, index) => {
                    const isHovered = hoveredSlice === entry.emotion
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.fill}
                        stroke={isHovered ? "#ffffff" : "#1F2937"}
                        strokeWidth={isHovered ? 3 : 2}
                        filter={isHovered ? "url(#emotionGlow)" : undefined}
                        style={{
                          filter: isHovered
                            ? `drop-shadow(0 8px 25px ${entry.fill}60) drop-shadow(0 4px 15px rgba(0, 0, 0, 0.4))` 
                            : `drop-shadow(0 4px 15px ${entry.fill}30) drop-shadow(0 2px 8px rgba(0, 0, 0, 0.2))`,
                          transition: 'all 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
                          willChange: 'transform, filter',
                          transformOrigin: 'center',
                          transform: isHovered ? 'translate3d(0, 0, 0) scale(1.05)' : 'translate3d(0, 0, 0) scale(1)'
                        }}
                      />
                    )
                  })}
                </Pie>
                <Tooltip
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
                  formatter={(value: any, name: any, props: any) => [
                    `${props.payload.percentage}%`,
                    props.payload.emotion
                  ]}
                  labelFormatter={() => ''}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ 
                    fontSize: '12px', 
                    color: '#9CA3AF',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e: any) => {
                    if (e && e.value) {
                      setHoveredSlice(e.value)
                    }
                  }}
                  onMouseLeave={() => setHoveredSlice(null)}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Coping Strategies */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Shield className="h-5 w-5 text-green-400" />
              Most Effective Coping Strategies
            </CardTitle>
          </CardHeader>
          <CardContent>
                        {topCopingStrategies.length > 0 ? (
              <div className="space-y-6">
                {topCopingStrategies.slice(0, 6).map((strategy, index) => (
                  <div key={strategy.strategy} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-300">{strategy.strategy}</span>
                      <span className="text-sm font-semibold text-white">{strategy.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${strategy.percentage}%`,
                          backgroundColor: strategy.fill,
                          backgroundImage: `linear-gradient(90deg, ${strategy.fill}, ${strategy.fill}dd)`
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-400">
                      <span>{strategy.count} assessments</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-400">
                <div className="text-center">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No coping strategy data available</p>
                  <p className="text-sm mt-2">Check browser console for debugging info</p>
                  <p className="text-xs mt-1 text-gray-500">
                    Strategies tracked: Medication, Values, Mindfulness, Opposite Action, Ask for Help
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Patient Engagement Overview */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Clock className="h-5 w-5 text-amber-400" />
              Patient Engagement Levels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {patientEngagement.slice(0, 6).map((patient, index) => (
                <div key={patient.patientId} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">
                        {patient.patientId.substring(0, 8)}...
                      </span>
                      <Badge 
                        variant={patient.engagementLevel === 'High' ? 'default' : patient.engagementLevel === 'Medium' ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        {patient.engagementLevel}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {patient.assessmentCount} assessments • Top emotion: {patient.topEmotion}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">{patient.avgSkills} skills</p>
                    <p className="text-xs text-gray-400">{patient.avgSelfCare} self-care</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Assessment Volume and Quality */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Activity className="h-5 w-5 text-indigo-400" />
            Monthly Medication & Therapy Engagement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart 
              data={monthlyTrends} 
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              barCategoryGap="20%"
              barGap={4}
            >
              <defs>
                <linearGradient id="medicationGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                  <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.6}/>
                </linearGradient>
                <linearGradient id="therapyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.8}/>
                  <stop offset="100%" stopColor="#047857" stopOpacity={0.6}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12, fill: '#9CA3AF' }}
                axisLine={{ stroke: '#4B5563' }}
                tickLine={{ stroke: '#6B7280' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#9CA3AF' }}
                axisLine={{ stroke: '#4B5563' }}
                tickLine={{ stroke: '#6B7280' }}
                label={{ 
                  value: 'Number of Assessments', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fill: '#9CA3AF', fontSize: '12px' }
                }}
              />
              <Tooltip
                cursor={false}
                shared={false}
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
                dataKey="medicationAdherence" 
                fill="url(#medicationGradient)" 
                name="Medication Adherence Assessments"
                radius={[6, 6, 0, 0]}
                stroke="#8B5CF6"
                strokeWidth={1}
                activeBar={{
                  fill: "url(#medicationGradient)",
                  stroke: "#A855F7",
                  strokeWidth: 2,
                  filter: "brightness(1.15)"
                }}
              />
              <Bar 
                dataKey="therapyAttendance" 
                fill="url(#therapyGradient)" 
                name="Therapy Attendance Assessments"
                radius={[6, 6, 0, 0]}
                stroke="#10B981"
                strokeWidth={1}
                activeBar={{
                  fill: "url(#therapyGradient)",
                  stroke: "#34D399",
                  strokeWidth: 2,
                  filter: "brightness(1.15)"
                }}
              />
              <Legend 
                verticalAlign="top" 
                height={36}
                iconType="rect"
                wrapperStyle={{ fontSize: '12px', color: '#9CA3AF', paddingBottom: '20px' }}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Text Data Insights & Clinical Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <MessageSquare className="h-5 w-5 text-blue-400" />
              Data Coverage & Quality
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Primary Data Coverage */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-blue-900/40 to-blue-800/30 rounded-xl border border-blue-700/30">
                  <p className="text-3xl font-bold text-blue-400 mb-1">{textInsights.emotionWordsAvailable}</p>
                  <p className="text-sm text-blue-300 font-medium">Emotional Data Points</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {Math.round((textInsights.emotionWordsAvailable / textInsights.totalRecords) * 100)}% coverage
                  </p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-emerald-900/40 to-emerald-800/30 rounded-xl border border-emerald-700/30">
                  <p className="text-3xl font-bold text-emerald-400 mb-1">{textInsights.skillWordsAvailable}</p>
                  <p className="text-sm text-emerald-300 font-medium">Coping Skills Data</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {Math.round((textInsights.skillWordsAvailable / textInsights.totalRecords) * 100)}% coverage
                  </p>
                </div>
              </div>
              
              {/* Secondary Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-purple-900/30 rounded-lg border border-purple-700/30">
                  <p className="text-xl font-bold text-purple-400">{textInsights.supportWordsAvailable}</p>
                  <p className="text-xs text-purple-300">Support Network Data</p>
                </div>
                <div className="text-center p-3 bg-amber-900/30 rounded-lg border border-amber-700/30">
                  <p className="text-xl font-bold text-amber-400">{textInsights.cravingDataAvailable}</p>
                  <p className="text-xs text-amber-300">Craving Incidents</p>
                </div>
              </div>

              {/* Data Quality Indicators */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                  <span className="text-sm font-medium text-gray-300">Data Source Quality</span>
                  <Badge variant={dataSource === 'live' ? 'default' : 'secondary'} className="text-xs">
                    {dataSource === 'live' ? '🟢 Live Data' : '🟡 Demo Data'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                  <span className="text-sm font-medium text-gray-300">Assessment Completeness</span>
                  <span className="text-sm font-semibold text-emerald-400">
                    {Math.round(((textInsights.emotionWordsAvailable + textInsights.skillWordsAvailable) / (textInsights.totalRecords * 2)) * 100)}%
                  </span>
                </div>
              </div>
              
              {/* Key Insights */}
              {textInsights.sampleEmotionWords && (
                <div className="p-4 bg-gradient-to-r from-gray-700/50 to-gray-600/30 rounded-xl border border-gray-600/50">
                  <p className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-400" />
                    Top Emotional Pattern:
                  </p>
                  <p className="text-sm text-gray-300">{textInsights.sampleEmotionWords}</p>
                </div>
              )}
              
              {textInsights.sampleSkillWords && (
                <div className="p-4 bg-gradient-to-r from-gray-700/50 to-gray-600/30 rounded-xl border border-gray-600/50">
                  <p className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-emerald-400" />
                    Primary Coping Strategy:
                  </p>
                  <p className="text-sm text-gray-300">{textInsights.sampleSkillWords}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Brain className="h-5 w-5 text-indigo-400" />
              PHP Assessment Agent
            </CardTitle>
            <CardDescription className="text-gray-400">
              Ask questions about patient assessments, emotional patterns, and treatment outcomes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PHPAssessmentAgent 
              assessmentData={filteredData}
              patientEngagement={patientEngagement}
              monthlyTrends={monthlyTrends}
              emotionalBreakdown={emotionalBreakdown}
              copingStrategies={topCopingStrategies}
              dataSource={dataSource}
            />
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  )
} 