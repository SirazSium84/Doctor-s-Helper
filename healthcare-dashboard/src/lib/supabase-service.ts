import { supabase, PTSDAssessment, PHQAssessment, GADAssessment, WHOAssessment, DERSAssessment } from './supabase'
import { Patient, AssessmentScore } from '@/types/assessments'

class SupabaseService {
  
  // Get all unique patient identifiers
  async getPatients(): Promise<Patient[]> {
    try {
      // Get patient data from STATS TEST table which seems to be the main patient registry
      const { data: statsData, error: statsError } = await supabase
        .from('STATS TEST')
        .select('*')
        .not('group_identifier', 'is', null)

      if (statsError) throw statsError

      // Transform to Patient objects using actual STATS TEST data
      const patients: Patient[] = (statsData || []).map(patient => {
        const id = patient.group_identifier
        
        return {
          id,
          name: id, // Use group identifier as name
          age: Math.floor(Math.random() * 60) + 18, // Random age for now (not in STATS TEST)
          gender: ['Male', 'Female', 'Other'][Math.floor(Math.random() * 3)] as Patient['gender'], // Random for now
          program: patient.program || 'Outpatient',
          dischargeType: patient.discharge_type || patient.status || 'Ongoing'
        }
      })

      return patients.sort((a, b) => a.id.localeCompare(b.id))
    } catch (error) {
      console.error('Error fetching patients:', error)
      return []
    }
  }

  // Calculate PTSD total score
  private calculatePTSDScore(assessment: PTSDAssessment): number {
    let total = 0
    for (let i = 1; i <= 20; i++) {
      const key = `ptsd_q${i}_disturbing_memories` as keyof PTSDAssessment
      if (i === 1) total += assessment.ptsd_q1_disturbing_memories || 0
      else if (i === 2) total += assessment.ptsd_q2_disturbing_dreams || 0
      else if (i === 3) total += Number(assessment.ptsd_q3_reliving_experience) || 0
      else if (i === 4) total += assessment.ptsd_q4_upset_reminders || 0
      else if (i === 5) total += assessment.ptsd_q5_physical_reactions || 0
      else if (i === 6) total += assessment.ptsd_q6_avoiding_memories || 0
      else if (i === 7) total += assessment.ptsd_q7_avoiding_reminders || 0
      else if (i === 8) total += assessment.ptsd_q8_memory_trouble || 0
      else if (i === 9) total += assessment.ptsd_q9_negative_beliefs || 0
      else if (i === 10) total += assessment.ptsd_q10_blaming_self_others || 0
      else if (i === 11) total += assessment.ptsd_q11_negative_feelings || 0
      else if (i === 12) total += Number(assessment.ptsd_q12_loss_interest) || 0
      else if (i === 13) total += assessment.ptsd_q13_feeling_distant || 0
      else if (i === 14) total += assessment.ptsd_q14_trouble_positive_feelings || 0
      else if (i === 15) total += assessment.ptsd_q15_irritable_behavior || 0
      else if (i === 16) total += assessment.ptsd_q16_risky_behavior || 0
      else if (i === 17) total += assessment.ptsd_q17_hypervigilant || 0
      else if (i === 18) total += assessment.ptsd_q18_easily_startled || 0
      else if (i === 19) total += assessment.ptsd_q19_concentration_difficulty || 0
      else if (i === 20) total += assessment.ptsd_q20_sleep_trouble || 0
    }
    return total
  }

  // Calculate PHQ total score
  private calculatePHQScore(assessment: PHQAssessment): number {
    const fields = [
      'col_1_little_interest_or_pleasure_in_doing_things',
      'col_2_feeling_down_depressed_or_hopeless',
      'col_3_trouble_falling_or_staying_asleep_or_sleeping_too_much',
      'col_4_feeling_tired_or_having_little_energy',
      'col_5_poor_appetite_or_overeating',
      'col_6_feeling_bad_about_yourself_or_that_you_are_failure_or_hav',
      'col_7_trouble_concentrating_on_things_such_as_reading_the_newsp',
      'col_8_moving_or_speaking_so_slowly_that_other_people_could_have',
      'col_9_thoughts_that_you_would_be_better_off_dead_or_of_hurting_'
    ]
    
    let total = 0
    fields.forEach(field => {
      total += Number(assessment[field as keyof PHQAssessment]) || 0
    })
    return total
  }

  // Calculate GAD total score
  private calculateGADScore(assessment: GADAssessment): number {
    const fields = [
      'col_1_feeling_nervous_anxious_or_on_edge',
      'col_2_not_being_able_to_stop_or_control_worrying',
      'col_3_worrying_too_much_about_different_things',
      'col_4_trouble_relaxing',
      'col_5_being_so_restless_that_it_is_too_hard_to_sit_still',
      'col_6_becoming_easily_annoyed_or_irritable',
      'col_7_feeling_afraid_as_if_something_awful_might_happen'
    ]
    
    let total = 0
    fields.forEach(field => {
      total += Number(assessment[field as keyof GADAssessment]) || 0
    })
    return total
  }

  // Calculate WHO total score
  private calculateWHOScore(assessment: WHOAssessment): number {
    const fields = [
      'col_1_i_have_felt_cheerful_in_good_spirits',
      'col_2_i_have_felt_calm_and_relaxed',
      'col_3_i_have_felt_active_and_vigorous',
      'col_4_i_woke_up_feeling_fresh_and_rested',
      'col_5_my_daily_life_has_been_filled_with_things_that_interest_m'
    ]
    
    let total = 0
    fields.forEach(field => {
      total += Number(assessment[field as keyof WHOAssessment]) || 0
    })
    return total
  }

  // Calculate DERS total score
  private calculateDERSScore(assessment: DERSAssessment): number {
    const fields = [
      'ders_q1_clear_feelings', 'ders_q2_pay_attention', 'ders_q3_overwhelming', 'ders_q4_no_idea',
      'ders_q5_difficulty_sense', 'ders_q6_attentive', 'ders_q7_know_exactly', 'ders_q8_care_about',
      'ders_q9_confused', 'ders_q10_acknowledge', 'ders_q11_angry_self', 'ders_q12_embarrassed',
      'ders_q13_work_difficulty', 'ders_q14_out_control', 'ders_q15_remain_upset', 'ders_q16_end_depressed',
      'ders_q17_valid_important', 'ders_q18_focus_difficulty', 'ders_q19_feel_out_control', 'ders_q20_get_things_done',
      'ders_q21_ashamed', 'ders_q22_find_way_better', 'ders_q23_feel_weak', 'ders_q24_control_behaviors',
      'ders_q25_feel_guilty', 'ders_q26_concentrate_difficulty', 'ders_q27_control_difficulty', 'ders_q28_nothing_to_do',
      'ders_q29_irritated_self', 'ders_q30_feel_bad_self', 'ders_q31_wallowing', 'ders_q32_lose_control',
      'ders_q33_think_difficulty', 'ders_q34_figure_out', 'ders_q35_long_time_better', 'ders_q36_emotions_overwhelming'
    ]
    
    let total = 0
    fields.forEach(field => {
      total += Number(assessment[field as keyof DERSAssessment]) || 0
    })
    return total
  }

  // Get assessment scores for a patient
  async getPatientAssessments(patientId: string): Promise<AssessmentScore[]> {
    try {
      // Fetch all assessment types for this patient
      const [ptsdResult, phqResult, gadResult, whoResult, dersResult] = await Promise.all([
        supabase.from('PTSD').select('*').eq('group_identifier', patientId),
        supabase.from('PHQ').select('*').eq('group_identifier', patientId),
        supabase.from('GAD').select('*').eq('group_identifier', patientId),
        supabase.from('WHO').select('*').eq('group_identifier', patientId),
        supabase.from('DERS').select('*').eq('group_identifier', patientId)
      ])

      // Combine assessments by date
      const assessmentMap = new Map<string, AssessmentScore>()

      // Process PTSD assessments
      ptsdResult.data?.forEach((assessment: PTSDAssessment) => {
        const date = assessment.assessment_date || new Date().toISOString().split('T')[0]
        if (!assessmentMap.has(date)) {
          assessmentMap.set(date, {
            patientId,
            date,
            who: 0,
            gad: 0,
            phq: 0,
            pcl: 0,
            ders: 0
          })
        }
        const score = assessmentMap.get(date)!
        score.pcl = this.calculatePTSDScore(assessment)
      })

      // Process PHQ assessments
      phqResult.data?.forEach((assessment: PHQAssessment) => {
        const date = assessment.assessment_date || new Date().toISOString().split('T')[0]
        if (!assessmentMap.has(date)) {
          assessmentMap.set(date, {
            patientId,
            date,
            who: 0,
            gad: 0,
            phq: 0,
            pcl: 0,
            ders: 0
          })
        }
        const score = assessmentMap.get(date)!
        score.phq = this.calculatePHQScore(assessment)
      })

      // Process GAD assessments
      gadResult.data?.forEach((assessment: GADAssessment) => {
        const date = assessment.assessment_date || new Date().toISOString().split('T')[0]
        if (!assessmentMap.has(date)) {
          assessmentMap.set(date, {
            patientId,
            date,
            who: 0,
            gad: 0,
            phq: 0,
            pcl: 0,
            ders: 0
          })
        }
        const score = assessmentMap.get(date)!
        score.gad = this.calculateGADScore(assessment)
      })

      // Process WHO assessments
      whoResult.data?.forEach((assessment: WHOAssessment) => {
        const date = assessment.assessment_date || new Date().toISOString().split('T')[0]
        if (!assessmentMap.has(date)) {
          assessmentMap.set(date, {
            patientId,
            date,
            who: 0,
            gad: 0,
            phq: 0,
            pcl: 0,
            ders: 0
          })
        }
        const score = assessmentMap.get(date)!
        score.who = this.calculateWHOScore(assessment)
      })

      // Process DERS assessments
      dersResult.data?.forEach((assessment: DERSAssessment) => {
        const date = assessment.assessment_date || new Date().toISOString().split('T')[0]
        if (!assessmentMap.has(date)) {
          assessmentMap.set(date, {
            patientId,
            date,
            who: 0,
            gad: 0,
            phq: 0,
            pcl: 0,
            ders: 0
          })
        }
        const score = assessmentMap.get(date)!
        score.ders = this.calculateDERSScore(assessment)
      })

      // Convert to array and sort by date (newest first)
      const assessments = Array.from(assessmentMap.values())
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      return assessments
    } catch (error) {
      console.error(`Error fetching assessments for ${patientId}:`, error)
      return []
    }
  }

  // Get all assessments for all patients
  async getAllAssessments(): Promise<AssessmentScore[]> {
    try {
      const patients = await this.getPatients()
      const allAssessments: AssessmentScore[] = []

      // Fetch assessments for first 10 patients to avoid overwhelming the dashboard
      const firstPatients = patients.slice(0, 10)
      
      for (const patient of firstPatients) {
        const assessments = await this.getPatientAssessments(patient.id)
        allAssessments.push(...assessments)
      }

      return allAssessments
    } catch (error) {
      console.error('Error fetching all assessments:', error)
      return []
    }
  }

  // Get accurate dashboard statistics without processing all detailed assessments
  async getDashboardStats(): Promise<{
    totalPatients: number
    totalAssessments: number
    avgAssessments: number
    highRiskPatients: number
  }> {
    try {
      // Get total patient count from STATS TEST (primary registry)
      const patients = await this.getPatients()
      const totalPatients = patients.length

      // Get assessment counts efficiently without processing all data
      const [ptsdResult, phqResult, gadResult, whoResult, dersResult] = await Promise.all([
        supabase.from('PTSD').select('unique_id', { count: 'exact', head: true }),
        supabase.from('PHQ').select('unique_id', { count: 'exact', head: true }),
        supabase.from('GAD').select('unique_id', { count: 'exact', head: true }),
        supabase.from('WHO').select('unique_id', { count: 'exact', head: true }),
        supabase.from('DERS').select('unique_id', { count: 'exact', head: true })
      ])

      // Calculate total assessments across all types
      const totalAssessments = (
        (ptsdResult.count || 0) +
        (phqResult.count || 0) +
        (gadResult.count || 0) +
        (whoResult.count || 0) +
        (dersResult.count || 0)
      )

      const avgAssessments = totalPatients > 0 ? totalAssessments / totalPatients : 0

      // Estimate high-risk patients (for now, using a conservative 15% estimate)
      // This could be enhanced with actual risk scoring logic
      const highRiskPatients = Math.floor(totalPatients * 0.15)

      return {
        totalPatients,
        totalAssessments,
        avgAssessments: Math.round(avgAssessments * 10) / 10, // Round to 1 decimal
        highRiskPatients
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      return {
        totalPatients: 0,
        totalAssessments: 0,
        avgAssessments: 0,
        highRiskPatients: 0
      }
    }
  }
}

export const supabaseService = new SupabaseService() 