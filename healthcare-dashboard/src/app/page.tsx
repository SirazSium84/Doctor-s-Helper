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
import { Home, BarChart3, Radar, BoxSelect, TrendingUp, User, Calendar, Heart } from "lucide-react"

const tabs = [
  { id: "welcome", label: "Welcome", icon: <Home className="w-4 h-4" /> },
  { id: "scores", label: "Assessment Scores", icon: <BarChart3 className="w-4 h-4" /> },
  { id: "spider", label: "Spider Chart", icon: <Radar className="w-4 h-4" /> },
  { id: "boxplots", label: "Box Plots", icon: <BoxSelect className="w-4 h-4" /> },
  { id: "risk", label: "Risk Analysis", icon: <TrendingUp className="w-4 h-4" /> },
  { id: "bps", label: "Biopsychosocial", icon: <User className="w-4 h-4" /> },
  { id: "php", label: "PHP Daily", icon: <Calendar className="w-4 h-4" /> },
  { id: "ahcm", label: "AHCM", icon: <Heart className="w-4 h-4" /> },
]

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("welcome")
  // No loading state needed since we load data immediately

  const { setPatients, setAssessmentScores, setBPSAssessments, setPHPDailyAssessments, setAHCMAssessments, setDashboardStats } =
    useDashboardStore()

    useEffect(() => {
    // Load data in the background after component mounts
    const loadData = async () => {
      try {
        console.log('🚀 Loading data from Supabase...')
        
        // Fetch accurate dashboard statistics first
        console.log('📊 Fetching dashboard statistics...')
        const stats = await supabaseService.getDashboardStats()
        console.log(`📈 Dashboard stats:`, stats)
        setDashboardStats(stats)
        
        // Fetch patients directly from Supabase
        console.log('👥 Fetching patients from Supabase...')
        const patients = await supabaseService.getPatients()
        console.log(`✅ Fetched ${patients.length} patients`)
        setPatients(patients)
        
        // Fetch detailed assessments in the background
        console.log('⏰ Starting background assessment loading...')
        setTimeout(async () => {
          try {
            const assessments = await supabaseService.getAllAssessments()
            console.log(`📋 Fetched ${assessments.length} detailed assessments for charts`)
            setAssessmentScores(assessments)
          } catch (error) {
            console.error('❌ Background assessment fetching failed:', error)
          }
        }, 500) // Small delay to let UI render first
        
        // Other assessment types will be empty for now (can be implemented later)
        setBPSAssessments([])
        setPHPDailyAssessments([])
        setAHCMAssessments([])
        
        console.log(`🎉 Data loading completed successfully`)
      } catch (error) {
        console.error('💥 Error loading data from Supabase:', error)
        // Fallback to empty state but still allow dashboard to load
        setPatients([])
      }
    }

    // Start loading data after a short delay to allow UI to render
    setTimeout(loadData, 100)
  }, [setPatients, setAssessmentScores, setBPSAssessments, setPHPDailyAssessments, setAHCMAssessments, setDashboardStats])

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
        return (
          <div className="flex items-center justify-center h-96 text-gray-400">
            <div className="text-center">
              <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Biopsychosocial Assessment Coming Soon</p>
              <p className="text-sm">Individual patient BPS scores and substance use history</p>
            </div>
          </div>
        )
      case "php":
        return (
          <div className="flex items-center justify-center h-96 text-gray-400">
            <div className="text-center">
              <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">PHP Daily Assessments Coming Soon</p>
              <p className="text-sm">Daily assessment tracking with wordclouds</p>
            </div>
          </div>
        )
      case "ahcm":
        return (
          <div className="flex items-center justify-center h-96 text-gray-400">
            <div className="text-center">
              <Heart className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">AHCM Assessment Coming Soon</p>
              <p className="text-sm">Social determinants of health analysis</p>
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
        {/* Only show PatientSelector with view mode for non-welcome pages */}
        {activeTab !== "welcome" && (
          <div className="mb-6">
            <PatientSelector showViewMode={true} currentTab={activeTab} />
          </div>
        )}

        <main>{renderActiveTab()}</main>
      </div>
    </div>
  )
}
