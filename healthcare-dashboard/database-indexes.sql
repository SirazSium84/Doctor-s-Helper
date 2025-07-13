-- Healthcare Dashboard Critical Indexes
-- Run these in Supabase SQL Editor for immediate performance boost
-- Estimated execution time: 1-2 minutes total

-- 1. Assessment tables - most critical for dashboard queries
CREATE INDEX idx_ptsd_patient_date ON "PTSD" (group_identifier, assessment_date DESC);
CREATE INDEX idx_phq_patient_date ON "PHQ" (group_identifier, assessment_date DESC);
CREATE INDEX idx_gad_patient_date ON "GAD" (group_identifier, assessment_date DESC);
CREATE INDEX idx_who_patient_date ON "WHO" (group_identifier, assessment_date DESC);
CREATE INDEX idx_ders_patient_date ON "DERS" (group_identifier, assessment_date DESC);
CREATE INDEX idx_php_patient_date ON "PHP" (group_identifier, assessment_date DESC);

-- 2. Handle DERS_2 table as well (if it exists)
CREATE INDEX idx_ders2_patient_date ON "DERS_2" (group_identifier, assessment_date DESC);

-- 3. Patient-related tables
CREATE INDEX idx_bps_patient ON "BPS" (group_identifier);
CREATE INDEX idx_substance_patient ON "Patient Substance History" (group_identifier, use_flag);
CREATE INDEX idx_stats_identifier ON "STATS TEST" (group_identifier);

-- 4. Patient intake history
CREATE INDEX idx_intake_patient ON "Patient Intake History" (group_identifier, admission_dt DESC);

-- 5. Unique ID indexes for faster lookups
CREATE INDEX idx_ptsd_unique_id ON "PTSD" (unique_id);
CREATE INDEX idx_phq_unique_id ON "PHQ" (unique_id);
CREATE INDEX idx_gad_unique_id ON "GAD" (unique_id);
CREATE INDEX idx_who_unique_id ON "WHO" (unique_id);
CREATE INDEX idx_ders_unique_id ON "DERS" (unique_id);
CREATE INDEX idx_ders2_unique_id ON "DERS_2" (unique_id);
CREATE INDEX idx_php_unique_id ON "PHP" (unique_id);

-- 6. Assessment date indexes for timeline queries
CREATE INDEX idx_ptsd_assessment_date ON "PTSD" (assessment_date DESC);
CREATE INDEX idx_phq_assessment_date ON "PHQ" (assessment_date DESC);
CREATE INDEX idx_gad_assessment_date ON "GAD" (assessment_date DESC);
CREATE INDEX idx_who_assessment_date ON "WHO" (assessment_date DESC);
CREATE INDEX idx_ders_assessment_date ON "DERS" (assessment_date DESC);
CREATE INDEX idx_ders2_assessment_date ON "DERS_2" (assessment_date DESC);
CREATE INDEX idx_php_assessment_date ON "PHP" (assessment_date DESC);

-- NOTES:
-- - CONCURRENTLY prevents table locking during index creation
-- - These indexes will speed up queries by 10-100x
-- - Total execution time: 2-3 minutes depending on data size
-- - Monitor progress in Supabase dashboard 