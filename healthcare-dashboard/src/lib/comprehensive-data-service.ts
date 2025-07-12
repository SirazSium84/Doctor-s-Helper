import { supabase } from './supabase'
import { mcpClient } from './mcp-client'
import { Patient, AssessmentScore, SubstanceHistory, PHPAssessment, BPSAssessment } from '@/types/assessments'

// Comprehensive data cache with timestamps
interface DataCache {
  patients: Patient[]
  assessments: AssessmentScore[]
  substanceHistory: SubstanceHistory[]
  phpAssessments: PHPAssessment[]
  bpsAssessments: BPSAssessment[]
  dashboardStats: {
    totalPatients: number
    totalAssessments: number
    avgAssessments: number
    highRiskPatients: number
  }
  timestamp: number
}

// Cache duration: 10 minutes
const CACHE_DURATION = 10 * 60 * 1000

class ComprehensiveDataService {
  private cache: DataCache | null = null
  private isLoading = false
  private loadingPromise: Promise<DataCache> | null = null

  // Load all data upfront using optimized Supabase queries
  async loadAllData(): Promise<DataCache> {
    // If already loading, return the existing promise
    if (this.isLoading && this.loadingPromise) {
      return this.loadingPromise
    }

    // Check if cache is still valid
    if (this.cache && Date.now() - this.cache.timestamp < CACHE_DURATION) {
      console.log('✅ Using cached comprehensive data')
      return this.cache
    }

    this.isLoading = true
    this.loadingPromise = this.performDataLoad()

    try {
      this.cache = await this.loadingPromise
      return this.cache
    } finally {
      this.isLoading = false
      this.loadingPromise = null
    }
  }

  private async performDataLoad(): Promise<DataCache> {
    console.log('🚀 Loading comprehensive healthcare data...')
    const startTime = Date.now()

    try {
      // Step 1: Load all patients (fast query)
      console.log('📋 Loading all patients...')
      const patients = await this.loadAllPatients()
      console.log(`✅ Loaded ${patients.length} patients`)

      // Step 2: Load all assessments using bulk queries
      console.log('📊 Loading all assessments...')
      const assessments = await this.loadAllAssessments(patients)
      console.log(`✅ Loaded ${assessments.length} assessments`)

      // Step 3: Load substance history
      console.log('💊 Loading substance history...')
      const substanceHistory = await this.loadSubstanceHistory()
      console.log(`✅ Loaded ${substanceHistory.length} substance history records`)

      // Step 4: Load PHP assessments
      console.log('🏥 Loading PHP assessments...')
      const phpAssessments = await this.loadPHPAssessments()
      console.log(`✅ Loaded ${phpAssessments.length} PHP assessments`)

      // Step 5: Load BPS assessments
      console.log('🧠 Loading BPS assessments...')
      const bpsAssessments = await this.loadBPSAssessments()
      console.log(`✅ Loaded ${bpsAssessments.length} BPS assessments`)

      // Step 6: Calculate dashboard stats
      const dashboardStats = this.calculateDashboardStats(patients, assessments)

      const loadTime = Date.now() - startTime
      console.log(`🎉 Comprehensive data loading completed in ${loadTime}ms`)

      return {
        patients,
        assessments,
        substanceHistory,
        phpAssessments,
        bpsAssessments,
        dashboardStats,
        timestamp: Date.now()
      }
    } catch (error) {
      console.error('💥 Error loading comprehensive data:', error)
      throw error
    }
  }

  // Optimized patient loading using Supabase
  private async loadAllPatients(): Promise<Patient[]> {
    try {
      // Use Supabase directly for fastest loading
      const { data: statsData, error } = await supabase
        .from('STATS TEST')
        .select('group_identifier, program, discharge_type, status')
        .not('group_identifier', 'is', null)
        .order('group_identifier')

      if (error) throw error

      const patients: Patient[] = (statsData || []).map(patient => ({
        id: patient.group_identifier,
        name: patient.group_identifier,
        age: Math.floor(Math.random() * 60) + 18, // Random age for now
        gender: ['Male', 'Female', 'Other'][Math.floor(Math.random() * 3)] as Patient['gender'],
        program: patient.program || 'Outpatient',
        dischargeType: patient.discharge_type || patient.status || 'Ongoing'
      }))

      return patients
    } catch (error) {
      console.error('Error loading patients:', error)
      // Fallback to MCP if Supabase fails
      try {
        const mcpResponse = await mcpClient.getAllPatients()
        if (mcpResponse.success && mcpResponse.data) {
          return mcpResponse.data.map((id: string) => ({
            id,
            name: id,
            age: Math.floor(Math.random() * 60) + 18,
            gender: ['Male', 'Female', 'Other'][Math.floor(Math.random() * 3)] as Patient['gender'],
            program: this.inferProgramFromId(id),
            dischargeType: 'Ongoing' as const
          }))
        }
      } catch (mcpError) {
        console.error('MCP fallback also failed:', mcpError)
      }
      
      return []
    }
  }

  // Optimized assessment loading using bulk Supabase queries
  private async loadAllAssessments(patients: Patient[]): Promise<AssessmentScore[]> {
    try {
      console.log('📊 Using bulk Supabase queries for all assessments...')
      
      // Get all patient IDs for bulk queries
      const patientIds = patients.map(p => p.id)
      
      // Execute all assessment queries in parallel
      const [ptsdResult, phqResult, gadResult, whoResult, dersResult] = await Promise.all([
        supabase
          .from('PTSD')
          .select('group_identifier, assessment_date, calculated_total, ptsd_q1_disturbing_memories, ptsd_q2_disturbing_dreams, ptsd_q3_reliving_experience, ptsd_q4_upset_reminders, ptsd_q5_physical_reactions, ptsd_q6_avoiding_memories, ptsd_q7_avoiding_reminders, ptsd_q8_memory_trouble, ptsd_q9_negative_beliefs, ptsd_q10_blaming_self_others, ptsd_q11_negative_feelings, ptsd_q12_loss_interest, ptsd_q13_feeling_distant, ptsd_q14_trouble_positive_feelings, ptsd_q15_irritable_behavior, ptsd_q16_risky_behavior, ptsd_q17_hypervigilant, ptsd_q18_easily_startled, ptsd_q19_concentration_difficulty, ptsd_q20_sleep_trouble')
          .in('group_identifier', patientIds)
          .not('assessment_date', 'is', null)
          .order('assessment_date', { ascending: false }),
        
        supabase
          .from('PHQ')
          .select('group_identifier, assessment_date, calculated_total, col_1_little_interest_or_pleasure_in_doing_things, col_2_feeling_down_depressed_or_hopeless, col_3_trouble_falling_or_staying_asleep_or_sleeping_too_much, col_4_feeling_tired_or_having_little_energy, col_5_poor_appetite_or_overeating, col_6_feeling_bad_about_yourself_or_that_you_are_failure_or_hav, col_7_trouble_concentrating_on_things_such_as_reading_the_newsp, col_8_moving_or_speaking_so_slowly_that_other_people_could_have, col_9_thoughts_that_you_would_be_better_off_dead_or_of_hurting_')
          .in('group_identifier', patientIds)
          .not('assessment_date', 'is', null)
          .order('assessment_date', { ascending: false }),
        
        supabase
          .from('GAD')
          .select('group_identifier, assessment_date, calculated_total, col_1_feeling_nervous_anxious_or_on_edge, col_2_not_being_able_to_stop_or_control_worrying, col_3_worrying_too_much_about_different_things, col_4_trouble_relaxing, col_5_being_so_restless_that_it_is_too_hard_to_sit_still, col_6_becoming_easily_annoyed_or_irritable, col_7_feeling_afraid_as_if_something_awful_might_happen')
          .in('group_identifier', patientIds)
          .not('assessment_date', 'is', null)
          .order('assessment_date', { ascending: false }),
        
        supabase
          .from('WHO')
          .select('group_identifier, assessment_date, calculated_total, col_1_i_have_felt_cheerful_in_good_spirits, col_2_i_have_felt_calm_and_relaxed, col_3_i_have_felt_active_and_vigorous, col_4_i_woke_up_feeling_fresh_and_rested, col_5_my_daily_life_has_been_filled_with_things_that_interest_m')
          .in('group_identifier', patientIds)
          .not('assessment_date', 'is', null)
          .order('assessment_date', { ascending: false }),
        
        supabase
          .from('DERS')
          .select('group_identifier, assessment_date, calculated_total')
          .in('group_identifier', patientIds)
          .not('assessment_date', 'is', null)
          .order('assessment_date', { ascending: false })
      ])

      // Check for errors
      if (ptsdResult.error) console.warn('PTSD query error:', ptsdResult.error)
      if (phqResult.error) console.warn('PHQ query error:', phqResult.error)
      if (gadResult.error) console.warn('GAD query error:', gadResult.error)
      if (whoResult.error) console.warn('WHO query error:', whoResult.error)
      if (dersResult.error) console.warn('DERS query error:', dersResult.error)

      // Combine assessments by patient and date
      const assessmentMap = new Map<string, AssessmentScore>()

      // Process each assessment type
      const processAssessments = (data: any[], type: 'ptsd' | 'phq' | 'gad' | 'who' | 'ders') => {
        data?.forEach((assessment: any) => {
          const key = `${assessment.group_identifier}_${assessment.assessment_date}`
          
          if (!assessmentMap.has(key)) {
            assessmentMap.set(key, {
              patientId: assessment.group_identifier,
              date: assessment.assessment_date,
              who: 0,
              gad: 0,
              phq: 0,
              pcl: 0,
              ders: 0
            })
          }

          const score = assessmentMap.get(key)!
          const totalScore = assessment.calculated_total || this.calculateScore(assessment, type)

          switch (type) {
            case 'ptsd':
              score.pcl = totalScore
              break
            case 'phq':
              score.phq = totalScore
              break
            case 'gad':
              score.gad = totalScore
              break
            case 'who':
              score.who = totalScore
              break
            case 'ders':
              score.ders = totalScore
              break
          }
        })
      }

      processAssessments(ptsdResult.data, 'ptsd')
      processAssessments(phqResult.data, 'phq')
      processAssessments(gadResult.data, 'gad')
      processAssessments(whoResult.data, 'who')
      processAssessments(dersResult.data, 'ders')

      const assessments = Array.from(assessmentMap.values())
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      return assessments
    } catch (error) {
      console.error('Error loading assessments:', error)
      return []
    }
  }

  // Calculate scores if not pre-calculated
  private calculateScore(assessment: any, type: 'ptsd' | 'phq' | 'gad' | 'who' | 'ders'): number {
    let total = 0
    
    switch (type) {
      case 'ptsd':
        // Sum all PTSD questions
        for (let i = 1; i <= 20; i++) {
          const fieldName = `ptsd_q${i}_`
          for (const [key, value] of Object.entries(assessment)) {
            if (key.startsWith(fieldName)) {
              total += Number(value) || 0
            }
          }
        }
        break
      
      case 'phq':
        // Sum all PHQ questions
        for (let i = 1; i <= 9; i++) {
          const value = assessment[`col_${i}_`] || 0
          total += Number(value) || 0
        }
        break
      
      case 'gad':
        // Sum all GAD questions
        for (let i = 1; i <= 7; i++) {
          const value = assessment[`col_${i}_`] || 0
          total += Number(value) || 0
        }
        break
      
      case 'who':
        // Sum all WHO questions
        for (let i = 1; i <= 5; i++) {
          const value = assessment[`col_${i}_`] || 0
          total += Number(value) || 0
        }
        break
      
      case 'ders':
        // DERS total should be pre-calculated
        total = assessment.calculated_total || 0
        break
    }
    
    return total
  }

  // Load substance history using optimized queries
  private async loadSubstanceHistory(): Promise<SubstanceHistory[]> {
    try {
      const [substanceHistoryResult, bpsResult] = await Promise.all([
        supabase
          .from('Patient Substance History')
          .select('group_identifier, substance, pattern_of_use, pattern_of_use_consolidated, use_flag')
          .eq('use_flag', 1),
        
        supabase
          .from('BPS')
          .select('group_identifier, drugs_of_choice, drug_craving_score')
          .not('drugs_of_choice', 'is', null)
      ])

      const substanceHistory: SubstanceHistory[] = []

      // Process Patient Substance History
      substanceHistoryResult.data?.forEach((record: any) => {
        substanceHistory.push({
          patientId: record.group_identifier,
          substance: record.substance,
          pattern: record.pattern_of_use_consolidated || record.pattern_of_use || 'Unknown',
          useFlag: record.use_flag,
          frequency: this.mapPatternToFrequency(record.pattern_of_use),
          duration: 'Unknown',
          lastUse: 'Current',
          primarySubstance: false,
          ageOfFirstUse: undefined,
          routeOfAdministration: undefined,
          consequences: [],
          treatmentHistory: []
        })
      })

      // Process BPS data
      bpsResult.data?.forEach((record: any) => {
        if (record.drugs_of_choice) {
          try {
            const drugsArray = Array.isArray(record.drugs_of_choice) 
              ? record.drugs_of_choice 
              : JSON.parse(record.drugs_of_choice)

            drugsArray.forEach((drug: string, index: number) => {
              substanceHistory.push({
                patientId: record.group_identifier,
                substance: drug,
                pattern: this.mapCravingToPattern(record.drug_craving_score),
                useFlag: 1,
                frequency: 'Unknown',
                duration: 'Unknown',
                lastUse: 'Current',
                primarySubstance: index === 0,
                ageOfFirstUse: undefined,
                routeOfAdministration: undefined,
                consequences: [],
                treatmentHistory: []
              })
            })
          } catch (parseError) {
            console.warn('Failed to parse drugs_of_choice:', parseError)
          }
        }
      })

      return substanceHistory
    } catch (error) {
      console.error('Error loading substance history:', error)
      return []
    }
  }

  // Load PHP assessments
  private async loadPHPAssessments(): Promise<PHPAssessment[]> {
    try {
      const { data, error } = await supabase
        .from('PHP')
        .select('*')
        .order('assessment_date', { ascending: false })

      if (error) throw error

      return data?.map(this.transformPHPData) || []
    } catch (error) {
      console.error('Error loading PHP assessments:', error)
      return []
    }
  }

  // Load BPS assessments
  private async loadBPSAssessments(): Promise<BPSAssessment[]> {
    try {
      const { data, error } = await supabase
        .from('BPS')
        .select('*')
        .order('group_identifier')

      if (error) throw error

      return data?.map(this.transformBPSData) || []
    } catch (error) {
      console.error('Error loading BPS assessments:', error)
      return []
    }
  }

  // Calculate dashboard statistics
  private calculateDashboardStats(patients: Patient[], assessments: AssessmentScore[]) {
    const totalPatients = patients.length
    const totalAssessments = assessments.length
    const avgAssessments = totalPatients > 0 ? totalAssessments / totalPatients : 0

    // Calculate high-risk patients
    const patientRiskMap = new Map<string, AssessmentScore>()
    assessments.forEach(assessment => {
      const existing = patientRiskMap.get(assessment.patientId)
      if (!existing || new Date(assessment.date) > new Date(existing.date)) {
        patientRiskMap.set(assessment.patientId, assessment)
      }
    })

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

    return {
      totalPatients,
      totalAssessments,
      avgAssessments: Math.round(avgAssessments * 10) / 10,
      highRiskPatients
    }
  }

  // Public methods to access cached data
  async getPatients(): Promise<Patient[]> {
    const cache = await this.loadAllData()
    return cache.patients
  }

  async getAssessments(): Promise<AssessmentScore[]> {
    const cache = await this.loadAllData()
    return cache.assessments
  }

  async getSubstanceHistory(): Promise<SubstanceHistory[]> {
    const cache = await this.loadAllData()
    return cache.substanceHistory
  }

  async getPHPAssessments(): Promise<PHPAssessment[]> {
    const cache = await this.loadAllData()
    return cache.phpAssessments
  }

  async getBPSAssessments(): Promise<BPSAssessment[]> {
    const cache = await this.loadAllData()
    return cache.bpsAssessments
  }

  async getDashboardStats() {
    const cache = await this.loadAllData()
    return cache.dashboardStats
  }

  // Get assessments for a specific patient (from cache)
  async getPatientAssessments(patientId: string): Promise<AssessmentScore[]> {
    const cache = await this.loadAllData()
    return cache.assessments.filter(a => a.patientId === patientId)
  }

  // Clear cache to force refresh
  clearCache(): void {
    this.cache = null
    console.log('🧹 Comprehensive data cache cleared')
  }

  // Background refresh - update cache without blocking UI
  async refreshInBackground(): Promise<void> {
    try {
      console.log('🔄 Starting background data refresh...')
      const oldCache = this.cache
      
      // Clear cache to force fresh load
      this.cache = null
      
      // Load fresh data
      await this.loadAllData()
      
      console.log('✅ Background data refresh completed')
    } catch (error) {
      console.error('💥 Background refresh failed:', error)
      // Restore old cache if refresh fails
      if (oldCache) {
        this.cache = oldCache
      }
    }
  }

  // Start automatic background refresh every 10 minutes
  startBackgroundRefresh(): void {
    // Refresh every 10 minutes
    setInterval(() => {
      this.refreshInBackground()
    }, 10 * 60 * 1000)
    
    console.log('🔄 Background refresh scheduled every 10 minutes')
  }

  // Get cache info for debugging
  getCacheInfo(): { hasCache: boolean; cacheAge?: number; dataStats?: any } {
    if (!this.cache) {
      return { hasCache: false }
    }

    const cacheAge = Date.now() - this.cache.timestamp
    const dataStats = {
      patients: this.cache.patients.length,
      assessments: this.cache.assessments.length,
      substanceHistory: this.cache.substanceHistory.length,
      phpAssessments: this.cache.phpAssessments.length,
      bpsAssessments: this.cache.bpsAssessments.length
    }

    return {
      hasCache: true,
      cacheAge,
      dataStats
    }
  }

  // Helper methods
  private inferProgramFromId(patientId: string): Patient['program'] {
    if (patientId.startsWith('AHCM')) return 'Outpatient'
    if (patientId.startsWith('BPS')) return 'PHP'
    if (patientId.startsWith('IOP')) return 'IOP'
    if (patientId.startsWith('IP')) return 'Inpatient'
    return 'Outpatient'
  }

  private mapPatternToFrequency(pattern?: string): string {
    if (!pattern) return 'Unknown'
    
    const lowerPattern = pattern.toLowerCase()
    if (lowerPattern.includes('daily')) return 'Daily'
    if (lowerPattern.includes('weekly')) return 'Weekly'
    if (lowerPattern.includes('monthly')) return 'Monthly'
    if (lowerPattern.includes('binge') || lowerPattern.includes('episodic')) return 'Occasionally'
    if (lowerPattern.includes('experimental')) return 'Rarely'
    
    return 'Occasionally'
  }

  private mapCravingToPattern(cravingScore?: number): string {
    if (!cravingScore) return 'Unknown'
    
    if (cravingScore >= 8) return 'Daily'
    if (cravingScore >= 6) return 'Continued'
    if (cravingScore >= 4) return 'Weekly'
    if (cravingScore >= 2) return 'Occasional'
    return 'Experimental'
  }

  private transformPHPData(row: any): PHPAssessment {
    return {
      uniqueId: row.unique_id,
      groupIdentifier: row.group_identifier,
      assessmentDate: row.assessment_date,
      matchedEmotionWords: row.matched_emotion_words,
      matchSkillWords: row.match_skill_words,
      matchSupportWords: row.match_support_words,
      craving: row.craving,
      // Emotional states
      pain: row.pain || false,
      sad: row.sad || false,
      content: row.content || false,
      anger: row.anger || false,
      shame: row.shame || false,
      fear: row.fear || false,
      joy: row.joy || false,
      anxiety: row.anxiety || false,
      depressed: row.depressed || false,
      alone: row.alone || false,
      // Coping skills
      mindfulnessmeditation: row.mindfulnessmeditation || false,
      distressTolerance: row.distress_tolerance || false,
      oppositeAction: row.opposite_action || false,
      takeMyMeds: row.take_my_meds || false,
      askForHelp: row.ask_for_help || false,
      improveMoment: row.improve_moment || false,
      partsWork: row.parts_work || false,
      playTheTapeThru: row.play_the_tape_thru || false,
      values: row.values || false,
      // Self-care activities
      sleep: row.sleep || false,
      nutrition: row.nutrition || false,
      exercise: row.exercise || false,
      fun: row.fun || false,
      connection: row.connection || false,
      warmth: row.warmth || false,
      water: row.water || false,
      love: row.love || false,
      therapy: row.therapy || false,
    }
  }

  private transformBPSData(row: any): BPSAssessment {
    return {
      group_identifier: row.group_identifier,
      assmt_dt: row.assmt_dt,
      birthdate: row.birthdate,
      age: row.age,
      ext_motivation: row.ext_motivation,
      int_motivation: row.int_motivation,
      num_prev_treatments: row.num_prev_treatments,
      drugs_of_choice: row.drugs_of_choice,
      drug_craving_score: row.drug_craving_score,
      bps_problems: row.bps_problems,
      bps_medical: row.bps_medical,
      bps_employment: row.bps_employment,
      bps_peer_support: row.bps_peer_support,
      bps_drug_alcohol: row.bps_drug_alcohol,
      bps_legal: row.bps_legal,
      bps_family: row.bps_family,
      bps_mh: row.bps_mh,
      bps_total: row.bps_total,
    }
  }
}

export const comprehensiveDataService = new ComprehensiveDataService() 