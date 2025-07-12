"use client"

import { useEffect, useState } from "react"
import { useDashboardStore } from "@/store/dashboard-store"
import { comprehensiveDataService } from "@/lib/comprehensive-data-service"
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
  const [isLoading, setIsLoading] = useState(true)
  const [loadingStatus, setLoadingStatus] = useState("Initializing...")
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
        setIsLoading(true)
        setLoadingStatus("Loading comprehensive healthcare data...")
        console.log('🚀 Loading all dashboard data using optimized Supabase queries...')
        
        // Load all data at once using comprehensive data service
        const dataCache = await comprehensiveDataService.loadAllData()
        
        setLoadingStatus("Setting up dashboard...")
        
        // Set all data from cache
        setPatients(dataCache.patients)
        setAssessmentScores(dataCache.assessments)
        setSubstanceHistory(dataCache.substanceHistory)
        setBPSAssessments(dataCache.bpsAssessments)
        setPHPDailyAssessments(dataCache.phpAssessments)
        setDashboardStats(dataCache.dashboardStats)
        
        // AHCM assessments not yet implemented
        setAHCMAssessments([])

        setLoadingStatus("Complete!")
        console.log(`🎉 Comprehensive dashboard data loading completed:`)
        console.log(`  📋 ${dataCache.patients.length} patients`)
        console.log(`  📊 ${dataCache.assessments.length} assessments`)
        console.log(`  💊 ${dataCache.substanceHistory.length} substance history records`)
        console.log(`  🏥 ${dataCache.phpAssessments.length} PHP assessments`)
        console.log(`  🧠 ${dataCache.bpsAssessments.length} BPS assessments`)
        
        // Start background refresh for keeping data up-to-date
        comprehensiveDataService.startBackgroundRefresh()
      } catch (error) {
        console.error('💥 Error loading comprehensive dashboard data:', error)
        setLoadingStatus("Error loading data")
        // Set empty states to prevent UI crashes
        setPatients([])
        setAssessmentScores([])
        setSubstanceHistory([])
        setBPSAssessments([])
        setPHPDailyAssessments([])
        setAHCMAssessments([])
        setDashboardStats({
          totalPatients: 0,
          totalAssessments: 0,
          avgAssessments: 0,
          highRiskPatients: 0
        })
      } finally {
        setIsLoading(false)
      }
    }

    // Start loading data immediately
    loadData()
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

  // Show loading screen while data is being loaded
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-white mb-2">Loading Healthcare Dashboard</h2>
          <p className="text-gray-400">{loadingStatus}</p>
        </div>
      </div>
    )
  }

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
