import { NextRequest, NextResponse } from 'next/server'
import { mcpClient } from '@/lib/mcp-client'
import { supabaseService } from '@/lib/supabase-service'

export async function GET(request: NextRequest) {
  try {
    console.log('🎯 Testing motivation themes MCP tool...')
    
    // Get patient_id from query parameters if provided
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient_id')
    
    console.log(`📊 Fetching motivation themes${patientId ? ` for patient ${patientId}` : ' for all patients'}`)
    
    // First try the MCP server
    const mcpResponse = await mcpClient.getMotivationThemes(patientId || undefined)
    
    if (mcpResponse.success && mcpResponse.data && 
        mcpResponse.data.metadata?.data_sources && 
        !mcpResponse.data.metadata.data_sources.includes('FALLBACK')) {
      console.log('✅ Successfully retrieved motivation themes from MCP server')
      console.log('📈 Data sources:', mcpResponse.data.metadata?.data_sources || 'Unknown')
      console.log('👥 Total patients with motivation data:', mcpResponse.data.metadata?.patients_with_motivation_data || 'Unknown')
      
      return NextResponse.json({
        success: true,
        data: mcpResponse.data,
        source: 'MCP_SERVER'
      })
    } else {
      console.warn('⚠️ MCP server not available or returned fallback data, using direct database extraction...')
      
      // Fallback to direct database extraction
      try {
        const realData = await supabaseService.getMotivationThemes(patientId || undefined)
        
        console.log('✅ Successfully extracted motivation themes from database')
        console.log('📊 Real data sources:', realData.metadata.data_sources.join(', '))
        console.log('👥 Patients with motivation data:', realData.metadata.patients_with_motivation_data)
        
        return NextResponse.json({
          success: true,
          data: realData,
          source: 'DIRECT_DATABASE'
        })
        
      } catch (dbError) {
        console.error('❌ Database extraction also failed:', dbError)
        return NextResponse.json({
          success: false,
          error: `Both MCP server and database extraction failed: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`,
          source: 'DATABASE_ERROR'
        }, { status: 500 })
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing motivation themes tool:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      source: 'API_ERROR'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patient_id } = body
    
    console.log('🎯 Testing motivation themes MCP tool via POST...')
    console.log(`📊 Fetching motivation themes${patient_id ? ` for patient ${patient_id}` : ' for all patients'}`)
    
    // First try the MCP server
    const mcpResponse = await mcpClient.getMotivationThemes(patient_id)
    
    if (mcpResponse.success && mcpResponse.data && 
        mcpResponse.data.metadata?.data_sources && 
        !mcpResponse.data.metadata.data_sources.includes('FALLBACK')) {
      console.log('✅ Successfully retrieved motivation themes from MCP server')
      
      // Enhanced response with debugging info
      return NextResponse.json({
        success: true,
        data: mcpResponse.data,
        debug: {
          themes_count: mcpResponse.data.themes?.length || 0,
          data_sources: mcpResponse.data.metadata?.data_sources || [],
          coverage_percentage: mcpResponse.data.metadata?.coverage_percentage || 0,
          total_patients: mcpResponse.data.metadata?.total_patients || 0
        },
        source: 'MCP_SERVER'
      })
    } else {
      console.warn('⚠️ MCP server not available or returned fallback data, using direct database extraction...')
      
      // Fallback to direct database extraction
      try {
        const realData = await supabaseService.getMotivationThemes(patient_id)
        
        console.log('✅ Successfully extracted motivation themes from database')
        
        return NextResponse.json({
          success: true,
          data: realData,
          debug: {
            themes_count: realData.themes?.length || 0,
            data_sources: realData.metadata?.data_sources || [],
            coverage_percentage: realData.metadata?.coverage_percentage || 0,
            total_patients: realData.metadata?.total_patients || 0
          },
          source: 'DIRECT_DATABASE'
        })
        
      } catch (dbError) {
        console.error('❌ Database extraction also failed:', dbError)
        return NextResponse.json({
          success: false,
          error: `Both MCP server and database extraction failed: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`,
          source: 'DATABASE_ERROR'
        }, { status: 500 })
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing motivation themes tool:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      source: 'API_ERROR'
    }, { status: 500 })
  }
} 