import { mcpClient } from './mcp-client'
import { Patient, AssessmentScore, SubstanceHistory } from '@/types/assessments'

// Simple in-memory cache for MCP responses
const mcpCache = new Map<string, { data: any, timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

class MCPDataService {
  private patientCache: Patient[] | null = null
  private assessmentCache: Map<string, AssessmentScore[]> = new Map()
  private isLoadingPatients = false
  private isLoadingAssessments = false

  // Get cached data if available and not expired
  private getCachedData(key: string): any | null {
    const cached = mcpCache.get(key)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data
    }
    return null
  }

  // Set cached data
  private setCachedData(key: string, data: any): void {
    mcpCache.set(key, { data, timestamp: Date.now() })
  }

  // Get all patients from MCP server with caching
  async getPatients(): Promise<Patient[]> {
    // Return cached patients if available
    if (this.patientCache) {
      return this.patientCache
    }

    // Prevent multiple simultaneous requests
    if (this.isLoadingPatients) {
      // Wait for ongoing request to complete
      while (this.isLoadingPatients) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      return this.patientCache || this.getFallbackPatients()
    }

    this.isLoadingPatients = true

    try {
      console.log('🚀 Loading patients from MCP server...')
      
      // Check cache first
      const cachedPatients = this.getCachedData('patients')
      if (cachedPatients) {
        console.log('✅ Using cached patient data')
        this.patientCache = cachedPatients
        return cachedPatients
      }

      // Use MCP client to get patient list
      const response = await mcpClient.getAllPatients()
      
      if (!response.success || !response.data) {
        console.log('❌ Failed to load patients from MCP, using fallback')
        this.patientCache = this.getFallbackPatients()
        return this.patientCache
      }

      // Transform MCP patient data to Patient interface
      const patients: Patient[] = response.data.map((patientId: string) => ({
        id: patientId,
        name: patientId, // Use patient ID as name
        age: Math.floor(Math.random() * 60) + 18, // Random age for now
        gender: ['Male', 'Female', 'Other'][Math.floor(Math.random() * 3)] as Patient['gender'],
        program: this.inferProgramFromId(patientId),
        dischargeType: 'Ongoing' as const
      }))

      // Cache the results
      this.patientCache = patients.sort((a, b) => a.id.localeCompare(b.id))
      this.setCachedData('patients', this.patientCache)

      console.log(`✅ Loaded ${patients.length} patients from MCP server`)
      return this.patientCache
    } catch (error) {
      console.error('💥 Error loading patients from MCP:', error)
      this.patientCache = this.getFallbackPatients()
      return this.patientCache
    } finally {
      this.isLoadingPatients = false
    }
  }

  // Get assessment scores for all patients using optimized approach
  async getAllAssessments(): Promise<AssessmentScore[]> {
    // Prevent multiple simultaneous requests
    if (this.isLoadingAssessments) {
      console.log('⏳ Assessment loading already in progress, waiting...')
      while (this.isLoadingAssessments) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      // Return cached assessments
      const allCached: AssessmentScore[] = []
      this.assessmentCache.forEach(assessments => allCached.push(...assessments))
      return allCached
    }

    this.isLoadingAssessments = true

    try {
      console.log('🚀 Loading assessments with optimized approach...')
      
      // Check if we have cached assessments
      const cachedAssessments = this.getCachedData('all_assessments')
      if (cachedAssessments) {
        console.log('✅ Using cached assessment data')
        return cachedAssessments
      }

      // Get patients first
      const patients = await this.getPatients()
      
      // Load assessments for only the most important patients first (limit to 10 for performance)
      const priorityPatients = patients.slice(0, 10)
      console.log(`📊 Loading assessments for ${priorityPatients.length} priority patients...`)
      
      const allAssessments: AssessmentScore[] = []

      // Use Promise.all with limited concurrency to avoid overwhelming the server
      const batchSize = 3 // Process 3 patients at a time
      for (let i = 0; i < priorityPatients.length; i += batchSize) {
        const batch = priorityPatients.slice(i, i + batchSize)
        
        const batchPromises = batch.map(async (patient) => {
          try {
            const assessments = await this.getPatientAssessments(patient.id)
            return { patientId: patient.id, assessments }
          } catch (error) {
            console.log(`⚠️ Failed to load assessments for patient ${patient.id}:`, error)
            return { patientId: patient.id, assessments: [] }
          }
        })

        const batchResults = await Promise.all(batchPromises)
        
        batchResults.forEach(result => {
          this.assessmentCache.set(result.patientId, result.assessments)
          allAssessments.push(...result.assessments)
        })

        console.log(`✅ Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(priorityPatients.length / batchSize)}`)
      }

      // Cache the results
      this.setCachedData('all_assessments', allAssessments)

      console.log(`✅ Loaded ${allAssessments.length} total assessments from MCP server`)
      return allAssessments
    } catch (error) {
      console.error('💥 Error loading all assessments from MCP:', error)
      return []
    } finally {
      this.isLoadingAssessments = false
    }
  }

  // Get assessment scores for a specific patient with caching
  async getPatientAssessments(patientId: string): Promise<AssessmentScore[]> {
    // Return cached assessments if available
    if (this.assessmentCache.has(patientId)) {
      return this.assessmentCache.get(patientId)!
    }

    // Check cache
    const cacheKey = `assessments_${patientId}`
    const cachedAssessments = this.getCachedData(cacheKey)
    if (cachedAssessments) {
      this.assessmentCache.set(patientId, cachedAssessments)
      return cachedAssessments
    }

    try {
      console.log(`🔍 Loading assessments for patient ${patientId} from MCP...`)
      
      const response = await mcpClient.getPatientAssessments(patientId)
      
      if (!response.success || !response.data) {
        console.log(`❌ No assessment data found for patient ${patientId}`)
        return []
      }

      // Extract data from MCP response (handle structuredContent wrapper)
      const data = response.data.structuredContent || response.data
      
      if (!data.assessment_breakdown) {
        console.log(`❌ No assessment breakdown found for patient ${patientId}`)
        return []
      }

      // Transform MCP assessment data to AssessmentScore format
      const assessments: AssessmentScore[] = []
      const assessmentBreakdown = data.assessment_breakdown

      // Collect all unique dates from all assessment types
      const dateMap = new Map<string, AssessmentScore>()

      // Process each assessment type
      const assessmentTypes = ['ptsd', 'phq', 'gad', 'who', 'ders']
      
      assessmentTypes.forEach(type => {
        const typeData = assessmentBreakdown[type]
        // Handle both 'assessments' and 'data' properties from MCP response
        const assessments = typeData?.assessments || typeData?.data || []
        
        if (assessments && assessments.length > 0) {
          assessments.forEach((assessment: any) => {
            const date = assessment.assessment_date
            if (!date || date.trim() === '') return // Skip assessments without dates

            // Initialize assessment score for this date if not exists
            if (!dateMap.has(date)) {
              dateMap.set(date, {
                patientId,
                date,
                who: 0,
                gad: 0,
                phq: 0,
                pcl: 0,
                ders: 0
              })
            }

            const assessmentScore = dateMap.get(date)!
            const score = assessment.calculated_total || assessment.total_score || 0

            // Map assessment type to correct field
            switch (type) {
              case 'ptsd':
                assessmentScore.pcl = score
                break
              case 'phq':
                assessmentScore.phq = score
                break
              case 'gad':
                assessmentScore.gad = score
                break
              case 'who':
                assessmentScore.who = score
                break
              case 'ders':
                assessmentScore.ders = score
                break
            }
          })
        }
      })

      // Convert map to array and sort by date (newest first)
      const result = Array.from(dateMap.values())
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      // Cache the results
      this.assessmentCache.set(patientId, result)
      this.setCachedData(cacheKey, result)

      console.log(`✅ Loaded ${result.length} assessments for patient ${patientId}`)
      return result
    } catch (error) {
      console.error(`💥 Error loading assessments for patient ${patientId}:`, error)
      return []
    }
  }

  // Get dashboard statistics with optimized calculation
  async getDashboardStats(): Promise<{
    totalPatients: number
    totalAssessments: number
    avgAssessments: number
    highRiskPatients: number
  }> {
    try {
      console.log('📊 Calculating dashboard stats with optimized approach...')
      
      // Check cache first
      const cachedStats = this.getCachedData('dashboard_stats')
      if (cachedStats) {
        console.log('✅ Using cached dashboard stats')
        return cachedStats
      }

      // Get patients (cached)
      const patients = await this.getPatients()
      const totalPatients = patients.length

      // Get assessments (cached or limited load)
      const assessments = await this.getAllAssessments()
      const totalAssessments = assessments.length
      const avgAssessments = totalPatients > 0 ? totalAssessments / totalPatients : 0

      // Estimate high-risk patients based on available data
      const patientRiskMap = new Map<string, AssessmentScore>()
      
      // Get latest assessment for each patient
      assessments.forEach(assessment => {
        const existing = patientRiskMap.get(assessment.patientId)
        if (!existing || new Date(assessment.date) > new Date(existing.date)) {
          patientRiskMap.set(assessment.patientId, assessment)
        }
      })

      // Count high-risk patients (using simple threshold-based approach)
      let highRiskPatients = 0
      patientRiskMap.forEach(assessment => {
        const isHighRisk = 
          assessment.pcl >= 50 || // PTSD severe
          assessment.phq >= 15 || // Depression moderate-severe
          assessment.gad >= 10 || // Anxiety moderate-severe
          assessment.who >= 20 || // WHO severe impairment
          assessment.ders >= 120   // DERS severe difficulties
        
        if (isHighRisk) highRiskPatients++
      })

      const stats = {
        totalPatients,
        totalAssessments,
        avgAssessments: Math.round(avgAssessments * 10) / 10,
        highRiskPatients
      }

      // Cache the results
      this.setCachedData('dashboard_stats', stats)

      console.log('✅ Dashboard stats calculated:', stats)
      return stats
    } catch (error) {
      console.error('💥 Error calculating dashboard stats:', error)
      return {
        totalPatients: 0,
        totalAssessments: 0,
        avgAssessments: 0,
        highRiskPatients: 0
      }
    }
  }

  // Get substance history (fallback to empty for now, can be enhanced later)
  async getSubstanceHistory(patientId?: string): Promise<SubstanceHistory[]> {
    try {
      console.log('🔍 Loading substance history from MCP...')
      // For now, return empty array as MCP doesn't have substance history tools yet
      // This can be enhanced when MCP server adds substance history support
      return []
    } catch (error) {
      console.error('💥 Error loading substance history from MCP:', error)
      return []
    }
  }

  // Clear all caches (useful for testing or when data needs to be refreshed)
  clearCache(): void {
    this.patientCache = null
    this.assessmentCache.clear()
    mcpCache.clear()
    console.log('🧹 MCP data cache cleared')
  }

  // Helper methods
  private inferProgramFromId(patientId: string): Patient['program'] {
    if (patientId.startsWith('AHCM')) return 'Outpatient'
    if (patientId.startsWith('BPS')) return 'PHP'
    if (patientId.startsWith('IOP')) return 'IOP'
    if (patientId.startsWith('IP')) return 'Inpatient'
    return 'Outpatient'
  }

  private getFallbackPatients(): Patient[] {
    // Fallback patient list based on known patients from logs
    const knownPatients = [
      '0156b2ff0c18', 'DEMO001', 'AHCM001', 'AHCM002', 'AHCM003', 
      'BPS001', 'BPS002', 'PAT-001', 'PAT-002', 'PAT-003'
    ]

    return knownPatients.map(id => ({
      id,
      name: id,
      age: Math.floor(Math.random() * 60) + 18,
      gender: ['Male', 'Female', 'Other'][Math.floor(Math.random() * 3)] as Patient['gender'],
      program: this.inferProgramFromId(id),
      dischargeType: 'Ongoing' as const
    }))
  }
}

export const mcpDataService = new MCPDataService() 