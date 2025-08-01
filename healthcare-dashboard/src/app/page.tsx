"use client"

import { useEffect, useState } from "react"
import { useDashboardStore } from "@/store/dashboard-store"
import { comprehensiveDataService } from "@/lib/comprehensive-data-service"
import { Header } from "@/components/header"
import { NavigationTabs } from "@/components/navigation-tabs"
import { WelcomePage } from "@/components/pages/welcome-page"
import { AssessmentScoresPage } from "@/components/pages/assessment-scores-page"
import { SpiderChartPage } from "@/components/pages/spider-chart-page"
import { RiskAnalysisPage } from "@/components/pages/risk-analysis-page"
import { BiopsychosocialPage } from "@/components/pages/biopsychosocial-page"
import { PHPEmotionalAnalyticsPage } from "@/components/pages/php-emotional-analytics-page"
import { Home, BarChart3, Radar, TrendingUp, User, Brain } from "lucide-react"

const tabs = [
  { id: "welcome", label: "Clinical Overview", icon: <Home className="w-4 h-4" /> },
  { id: "scores", label: "Patient Assessments", icon: <BarChart3 className="w-4 h-4" /> },
  { id: "spider", label: "Multi-Domain Analysis", icon: <Radar className="w-4 h-4" /> },
  { id: "risk", label: "Risk Stratification", icon: <TrendingUp className="w-4 h-4" /> },
  { id: "bps", label: "BPS Assessment", icon: <User className="w-4 h-4" /> },
  { id: "php", label: "Behavioral Health Analytics", icon: <Brain className="w-4 h-4" /> },
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
    setDashboardStats,
    patients,
    assessmentScores,
    phpDailyAssessments
  } = useDashboardStore()

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        setLoadingStatus("Loading comprehensive healthcare data...")
        
        // Load all data at once using the comprehensive service
        const dataCache = await comprehensiveDataService.loadAllData()
        
        // Update store with loaded data
        setPatients(dataCache.patients)
        setAssessmentScores(dataCache.assessments)
        setBPSAssessments(dataCache.bpsAssessments)
        setSubstanceHistory(dataCache.substanceHistory)
        setPHPDailyAssessments(dataCache.phpAssessments)
        setAHCMAssessments([]) // Not loaded yet
        
        // Calculate dashboard stats
        const stats = {
          totalPatients: dataCache.patients.length,
          totalAssessments: dataCache.assessments.length,
          avgAssessments: dataCache.patients.length > 0 ? Math.round(dataCache.assessments.length / dataCache.patients.length) : 0,
          highRiskPatients: dataCache.assessments.filter(a => 
            (a.phq && a.phq > 15) || 
            (a.gad && a.gad > 15) || 
            (a.pcl && a.pcl > 50)
          ).length
        }
        setDashboardStats(stats)
        
        setLoadingStatus("Data loaded successfully!")
        
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
        setLoadingStatus("Failed to load data")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Debug: Log store state changes
  useEffect(() => {
    console.log('🔍 Store state updated:', {
      patients: patients.length,
      assessmentScores: assessmentScores.length,
      phpDailyAssessments: phpDailyAssessments.length,
      isLoading
    })
  }, [patients, assessmentScores, phpDailyAssessments, isLoading])

  const renderActiveTab = () => {
    switch (activeTab) {
      case "welcome":
        return <WelcomePage />
      case "scores":
        return <AssessmentScoresPage />
      case "spider":
        return <SpiderChartPage />
      case "risk":
        return <RiskAnalysisPage />
      case "bps":
        return <BiopsychosocialPage />
      case "php":
        return <PHPEmotionalAnalyticsPage />
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

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-9xl">
        {isLoading && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-800 border border-gray-600 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-blue-500"></div>
              <p className="text-sm sm:text-base text-gray-300">{loadingStatus}</p>
            </div>
          </div>
        )}



        <main>{renderActiveTab()}</main>
      </div>
    </div>
  )
}
