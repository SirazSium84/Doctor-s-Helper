import { NextResponse } from 'next/server'
import { comprehensiveDataService } from '@/lib/comprehensive-data-service'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const patientId = searchParams.get('patientId')

  if (!patientId) {
    return NextResponse.json({
      success: false,
      error: 'Missing patientId query parameter. Use /api/debug?patientId=YOUR_ID'
    }, { status: 400 })
  }

  try {
    console.log(`🔍 Debug endpoint called for patientId: ${patientId}`)
    comprehensiveDataService.clearCache()
    const assessments = await comprehensiveDataService.getPatientAssessments(patientId)
    console.log('📊 Assessments for patient:', patientId, assessments)
    return NextResponse.json({
      success: true,
      patientId,
      assessmentCount: assessments.length,
      assessments
    })
  } catch (error) {
    console.error('💥 Debug endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 