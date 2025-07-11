"use client"

import { useEffect, useState } from "react"
import { useDashboardStore } from "@/store/dashboard-store"
import { supabaseService } from "@/lib/supabase-service"
import { Header } from "@/components/header"
import { NavigationTabs } from "@/components/navigation-tabs"
import { PatientSelector } from "@/components/patient-selector"
import { WelcomePage } from "@/components/pages/welcome-page"
import { AssessmentScoresPage } from "@/components/pages/assessment-scores-page"
import { SpiderChartPage } from "@/components/pages/spider-chart-page"
import { RiskAnalysisPage } from "@/components/pages/risk-analysis-page"
import { BiopsychosocialPage } from "@/components/pages/biopsychosocial-page"
import { PHPEmotionalAnalyticsPage } from "@/components/pages/php-emotional-analytics-page"
import { Home, BarChart3, Radar, BoxSelect, TrendingUp, User, Calendar, Heart, Brain } from "lucide-react"

const tabs = [
  { id: "welcome", label: "Clinical Overview", icon: <Home className="w-4 h-4" /> },
  { id: "scores", label: "Patient Assessments", icon: <BarChart3 className="w-4 h-4" /> },
  { id: "spider", label: "Multi-Domain Analysis", icon: <Radar className="w-4 h-4" /> },
  { id: "boxplots", label: "Statistical Analysis", icon: <BoxSelect className="w-4 h-4" /> },
  { id: "risk", label: "Risk Stratification", icon: <TrendingUp className="w-4 h-4" /> },
  { id: "bps", label: "BPS Assessment", icon: <User className="w-4 h-4" /> },
  { id: "php", label: "Behavioral Health Analytics", icon: <Brain className="w-4 h-4" /> },
  { id: "ahcm", label: "AHCM", icon: <Heart className="w-4 h-4" /> },
]

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("welcome")
  const { 
    setPatients, 
    setAssessmentScores, 
    setBPSAssessments, 
    setSubstanceHistory,
    setPHPDailyAssessments, 
    setAHCMAssessments, 
    setDashboardStats 
  } = useDashboardStore()

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🚀 Loading dashboard data from Supabase...')
        
        // Load all data concurrently for better performance
        const [patients, assessments, stats] = await Promise.all([
          supabaseService.getPatients(),
          supabaseService.getAllAssessments(),
          supabaseService.getDashboardStats()
        ])

        // Set basic data first
        setPatients(patients)
        setAssessmentScores(assessments)
        setDashboardStats(stats)

        // Load substance history from multiple sources
        console.log('🔍 Loading substance history data...')
        try {
          const [substanceHistory, bpsSubstanceData] = await Promise.all([
            supabaseService.getSubstanceHistory(),
            supabaseService.getBPSSubstanceData()
          ])

          // Combine both data sources, preferring Patient Substance History table
          const combinedSubstanceHistory = [...substanceHistory]
          
          // Add BPS data for patients not in Patient Substance History
          const existingPatients = new Set(substanceHistory.map(item => item.patientId))
          bpsSubstanceData.forEach(item => {
            if (!existingPatients.has(item.patientId)) {
              combinedSubstanceHistory.push(item)
            }
          })

          setSubstanceHistory(combinedSubstanceHistory)
          console.log(`✅ Loaded substance history: ${substanceHistory.length} from Patient Substance History, ${bpsSubstanceData.length} from BPS, ${combinedSubstanceHistory.length} total`)
        } catch (substanceError) {
          console.error('❌ Error loading substance history:', substanceError)
          setSubstanceHistory([])
        }

        // For now, use empty arrays for BPS, PHP, and AHCM assessments
        // These can be replaced with actual Supabase calls when needed
        setBPSAssessments([])
        setPHPDailyAssessments([])
        setAHCMAssessments([])

        console.log(`🎉 Dashboard data loading completed: ${patients.length} patients, ${assessments.length} assessments`)
      } catch (error) {
        console.error('💥 Error loading dashboard data:', error)
        // Set empty states to prevent UI crashes
        setPatients([])
        setAssessmentScores([])
        setSubstanceHistory([])
        setBPSAssessments([])
        setPHPDailyAssessments([])
        setAHCMAssessments([])
      }
    }

    // Start loading data after a short delay to allow UI to render
    setTimeout(loadData, 100)
  }, [setPatients, setAssessmentScores, setBPSAssessments, setSubstanceHistory, setPHPDailyAssessments, setAHCMAssessments, setDashboardStats])

  const renderActiveTab = () => {
    switch (activeTab) {
      case "welcome":
        return <WelcomePage />
      case "scores":
        return <AssessmentScoresPage />
      case "spider":
        return <SpiderChartPage />
      case "boxplots":
        return (
          <div className="flex items-center justify-center h-96 text-gray-400">
            <div className="text-center">
              <BoxSelect className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Box Plots Coming Soon</p>
              <p className="text-sm">Statistical analysis by program and discharge type</p>
            </div>
          </div>
        )
      case "risk":
        return <RiskAnalysisPage />
      case "bps":
        return <BiopsychosocialPage />
      case "php":
        return <PHPEmotionalAnalyticsPage />
      case "ahcm":
        return (
          <div className="flex items-center justify-center h-96 text-gray-400">
            <div className="text-center">
              <Heart className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">AHCM Coming Soon</p>
              <p className="text-sm">Advanced Healthcare Case Management analytics</p>
            </div>
          </div>
        )
      default:
        return <WelcomePage />
    }
  }

  // Remove loading screen - dashboard loads immediately

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      <NavigationTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="container mx-auto px-6 py-6">
        {/* Only show PatientSelector with view mode for specific pages that need it */}
        {activeTab !== "welcome" && activeTab !== "bps" && activeTab !== "php" && (
          <div className="mb-6">
            <PatientSelector showViewMode={true} currentTab={activeTab} />
          </div>
        )}

        <main>{renderActiveTab()}</main>
      </div>
    </div>
  )
}
