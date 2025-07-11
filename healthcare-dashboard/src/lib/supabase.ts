import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database types
export interface PTSDAssessment {
  unique_id: string
  group_identifier: string
  assessment_date: string
  ptsd_q1_disturbing_memories?: number
  ptsd_q2_disturbing_dreams?: number
  ptsd_q3_reliving_experience?: number
  ptsd_q4_upset_reminders?: number
  ptsd_q5_physical_reactions?: number
  ptsd_q6_avoiding_memories?: number
  ptsd_q7_avoiding_reminders?: number
  ptsd_q8_memory_trouble?: number
  ptsd_q9_negative_beliefs?: number
  ptsd_q10_blaming_self_others?: number
  ptsd_q11_negative_feelings?: number
  ptsd_q12_loss_interest?: number
  ptsd_q13_feeling_distant?: number
  ptsd_q14_trouble_positive_feelings?: number
  ptsd_q15_irritable_behavior?: number
  ptsd_q16_risky_behavior?: number
  ptsd_q17_hypervigilant?: number
  ptsd_q18_easily_startled?: number
  ptsd_q19_concentration_difficulty?: number
  ptsd_q20_sleep_trouble?: number
}

export interface PHQAssessment {
  unique_id: string
  group_identifier: string
  assessment_date: string
  col_1_little_interest_or_pleasure_in_doing_things?: number
  col_2_feeling_down_depressed_or_hopeless?: number
  col_3_trouble_falling_or_staying_asleep_or_sleeping_too_much?: number
  col_4_feeling_tired_or_having_little_energy?: number
  col_5_poor_appetite_or_overeating?: number
  col_6_feeling_bad_about_yourself_or_that_you_are_failure_or_hav?: number
  col_7_trouble_concentrating_on_things_such_as_reading_the_newsp?: number
  col_8_moving_or_speaking_so_slowly_that_other_people_could_have?: number
  col_9_thoughts_that_you_would_be_better_off_dead_or_of_hurting_?: number
  col_10_if_you_checked_off_any_problems_how_difficult_have_these?: number
}

export interface GADAssessment {
  unique_id: string
  group_identifier: string
  assessment_date: string
  col_1_feeling_nervous_anxious_or_on_edge?: number
  col_2_not_being_able_to_stop_or_control_worrying?: number
  col_3_worrying_too_much_about_different_things?: number
  col_4_trouble_relaxing?: number
  col_5_being_so_restless_that_it_is_too_hard_to_sit_still?: number
  col_5_being_so_restless_that_its_hard_to_sit_still?: string
  col_6_becoming_easily_annoyed_or_irritable?: number
  col_7_feeling_afraid_as_if_something_awful_might_happen?: number
}

export interface WHOAssessment {
  unique_id: string
  group_identifier: string
  assessment_date: string
  col_1_i_have_felt_cheerful_in_good_spirits?: number
  col_2_i_have_felt_calm_and_relaxed?: number
  col_3_i_have_felt_active_and_vigorous?: number
  col_4_i_woke_up_feeling_fresh_and_rested?: string | number
  col_5_my_daily_life_has_been_filled_with_things_that_interest_m?: number
}

export interface DERSAssessment {
  unique_id: string
  group_identifier: string
  assessment_date: string
  ders_q1_clear_feelings?: number
  ders_q2_pay_attention?: number
  ders_q3_overwhelming?: number
  ders_q4_no_idea?: number
  ders_q5_difficulty_sense?: number
  ders_q6_attentive?: number
  ders_q7_know_exactly?: number
  ders_q8_care_about?: number
  ders_q9_confused?: number
  ders_q10_acknowledge?: number
  ders_q11_angry_self?: number
  ders_q12_embarrassed?: number
  ders_q13_work_difficulty?: number
  ders_q14_out_control?: number
  ders_q15_remain_upset?: number
  ders_q16_end_depressed?: number
  ders_q17_valid_important?: number
  ders_q18_focus_difficulty?: number
  ders_q19_feel_out_control?: number
  ders_q20_get_things_done?: number
  ders_q21_ashamed?: number
  ders_q22_find_way_better?: number
  ders_q23_feel_weak?: number
  ders_q24_control_behaviors?: number
  ders_q25_feel_guilty?: number
  ders_q26_concentrate_difficulty?: number
  ders_q27_control_difficulty?: number
  ders_q28_nothing_to_do?: number
  ders_q29_irritated_self?: number
  ders_q30_feel_bad_self?: number
  ders_q31_wallowing?: number
  ders_q32_lose_control?: number
  ders_q33_think_difficulty?: number
  ders_q34_figure_out?: number
  ders_q35_long_time_better?: number
  ders_q36_emotions_overwhelming?: number
}

export interface PatientSubstanceHistory {
  group_identifier: string
  substance: string
  use_flag: number
  pattern_of_use?: string
  pattern_of_use_consolidated?: string
}

export interface BPSAssessment {
  group_identifier: string
  assmt_dt?: string
  birthdate?: string
  age?: number
  ext_motivation?: string
  int_motivation?: any // JSONB
  num_prev_treatments?: string
  drugs_of_choice?: any // JSONB
  drug_craving_score?: number
  bps_problems?: number
  bps_medical?: string
  bps_employment?: number
  bps_peer_support?: number
  bps_drug_alcohol?: number
  bps_legal?: string
  bps_family?: number
  bps_mh?: number
  bps_total?: number
}

export interface PHPSupabaseRow {
  unique_id: string
  group_identifier: string
  assessment_date: string
  matched_emotion_words?: string
  match_skill_words?: string
  match_support_words?: string
  craving?: string
  // Emotional states
  pain?: boolean
  sad?: boolean
  content?: boolean
  anger?: boolean
  shame?: boolean
  fear?: boolean
  joy?: boolean
  anxiety?: boolean
  depressed?: boolean
  alone?: boolean
  // Coping skills
  mindfulnessmeditation?: boolean
  distress_tolerance?: boolean
  opposite_action?: boolean
  take_my_meds?: boolean
  ask_for_help?: boolean
  improve_moment?: boolean
  parts_work?: boolean
  play_the_tape_thru?: boolean
  values?: boolean
  // Self-care activities
  sleep?: boolean
  nutrition?: boolean
  exercise?: boolean
  fun?: boolean
  connection?: boolean
  warmth?: boolean
  water?: boolean
  love?: boolean
  therapy?: boolean
} 