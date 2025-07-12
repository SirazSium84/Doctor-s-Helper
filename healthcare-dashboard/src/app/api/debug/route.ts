import { NextResponse } from 'next/server'
import { comprehensiveDataService } from '@/lib/comprehensive-data-service'

export async function GET() {
  try {
    console.log('🔍 Debug endpoint called - testing comprehensive data service')
    
    // Clear cache first
    comprehensiveDataService.clearCache()
    
    // Load fresh data
    const data = await comprehensiveDataService.loadAllData()
    
    console.log('📊 Debug data loaded:', {
      patients: data.patients.length,
      assessments: data.assessments.length,
      substanceHistory: data.substanceHistory.length,
      phpAssessments: data.phpAssessments.length,
      bpsAssessments: data.bpsAssessments.length
    })
    
    return NextResponse.json({
      success: true,
      data: {
        patients: data.patients.length,
        assessments: data.assessments.length,
        substanceHistory: data.substanceHistory.length,
        phpAssessments: data.phpAssessments.length,
        bpsAssessments: data.bpsAssessments.length,
        samplePatients: data.patients.slice(0, 3).map(p => ({ id: p.id, name: p.name })),
        sampleAssessments: data.assessments.slice(0, 3).map(a => ({ 
          patientId: a.patientId, 
          date: a.date, 
          scores: { who: a.who, gad: a.gad, phq: a.phq, pcl: a.pcl, ders: a.ders }
        }))
      }
    })
  } catch (error) {
    console.error('💥 Debug endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 