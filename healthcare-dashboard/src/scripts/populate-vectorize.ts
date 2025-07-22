/**
 * Script to populate Vectorize with clinical recommendations
 * Run with: npx tsx src/scripts/populate-vectorize.ts
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import { 
  initializeVectorizeIndex, 
  storeClinicalRecommendation 
} from '../lib/vectorize-recommendations';
import { ClinicalRecommendation } from '../lib/vectorize-client';

// Sample clinical recommendations to populate the database
const sampleRecommendations: ClinicalRecommendation[] = [
  {
    id: 'ptsd-001',
    title: 'PTSD Cognitive Processing Therapy',
    description: 'Evidence-based cognitive processing therapy for PTSD treatment',
    domain: 'PTSD',
    severity: 'Moderate',
    evidenceLevel: 'A',
    category: 'Treatment',
    content: `Cognitive Processing Therapy (CPT) is a highly effective, evidence-based treatment for PTSD. CPT teaches patients how to evaluate and change the upsetting thoughts they have had since their trauma. By changing their thoughts, patients can change how they feel. The treatment involves 12 sessions focusing on challenging stuck points and processing the trauma through writing and discussion.`,
    keywords: ['CPT', 'cognitive therapy', 'trauma processing', 'stuck points', 'PTSD therapy'],
    source: 'APA Clinical Practice Guideline for PTSD',
    lastUpdated: new Date().toISOString(),
    priority: 9
  },
  {
    id: 'ptsd-002',
    title: 'PTSD Prolonged Exposure Therapy',
    description: 'Prolonged exposure therapy for trauma-related avoidance and anxiety',
    domain: 'PTSD',
    severity: 'Severe',
    evidenceLevel: 'A',
    category: 'Treatment',
    content: `Prolonged Exposure (PE) therapy helps patients confront trauma-related memories and situations they have been avoiding. The treatment includes imaginal exposure (revisiting trauma memories) and in vivo exposure (approaching safe situations that are avoided due to trauma). PE typically involves 8-15 sessions and has strong empirical support for reducing PTSD symptoms.`,
    keywords: ['prolonged exposure', 'PE therapy', 'imaginal exposure', 'in vivo exposure', 'avoidance'],
    source: 'VA/DoD Clinical Practice Guideline for PTSD',
    lastUpdated: new Date().toISOString(),
    priority: 9
  },
  {
    id: 'depression-001',
    title: 'Depression Cognitive Behavioral Therapy',
    description: 'CBT for major depressive disorder with moderate to severe symptoms',
    domain: 'Depression',
    severity: 'Moderate',
    evidenceLevel: 'A',
    category: 'Treatment',
    content: `Cognitive Behavioral Therapy (CBT) for depression focuses on identifying and changing negative thought patterns and behaviors that contribute to depression. The treatment typically involves 12-16 sessions covering behavioral activation, cognitive restructuring, and relapse prevention. CBT has extensive empirical support and is considered a first-line treatment for depression.`,
    keywords: ['CBT', 'cognitive behavioral therapy', 'behavioral activation', 'cognitive restructuring', 'depression'],
    source: 'APA Clinical Practice Guideline for Depression',
    lastUpdated: new Date().toISOString(),
    priority: 8
  },
  {
    id: 'depression-002',
    title: 'Depression Interpersonal Therapy',
    description: 'IPT for depression focusing on interpersonal relationships and social functioning',
    domain: 'Depression',
    severity: 'Moderate',
    evidenceLevel: 'A',
    category: 'Treatment',
    content: `Interpersonal Therapy (IPT) for depression focuses on improving interpersonal relationships and social functioning to help relieve symptoms. IPT addresses four main problem areas: grief, role disputes, role transitions, and interpersonal deficits. Treatment typically involves 12-16 sessions and has strong evidence for treating major depression.`,
    keywords: ['IPT', 'interpersonal therapy', 'grief', 'role disputes', 'social functioning'],
    source: 'APA Clinical Practice Guideline for Depression',
    lastUpdated: new Date().toISOString(),
    priority: 7
  },
  {
    id: 'anxiety-001',
    title: 'Generalized Anxiety CBT Protocol',
    description: 'CBT protocol for generalized anxiety disorder with worry management',
    domain: 'Anxiety',
    severity: 'Moderate',
    evidenceLevel: 'A',
    category: 'Treatment',
    content: `CBT for Generalized Anxiety Disorder focuses on worry management, relaxation training, and cognitive restructuring. Key components include psychoeducation about anxiety, worry exposure, problem-solving training, and relapse prevention. Treatment typically involves 12-16 sessions with strong empirical support for reducing GAD symptoms.`,
    keywords: ['GAD', 'worry management', 'relaxation training', 'worry exposure', 'anxiety CBT'],
    source: 'APA Clinical Practice Guideline for Anxiety Disorders',
    lastUpdated: new Date().toISOString(),
    priority: 8
  },
  {
    id: 'assessment-001',
    title: 'PTSD Assessment with PCL-5',
    description: 'Standardized PTSD assessment using PCL-5 screening tool',
    domain: 'PTSD',
    severity: 'General',
    evidenceLevel: 'B',
    category: 'Assessment',
    content: `The PTSD Checklist for DSM-5 (PCL-5) is a 20-item self-report measure that assesses PTSD symptoms. Scores range from 0-80, with higher scores indicating more severe symptoms. A score of 33 or higher suggests a probable PTSD diagnosis. The PCL-5 should be used in conjunction with clinical interview for comprehensive assessment.`,
    keywords: ['PCL-5', 'PTSD assessment', 'screening', 'diagnosis', 'symptoms measure'],
    source: 'National Center for PTSD, VA',
    lastUpdated: new Date().toISOString(),
    priority: 6
  },
  {
    id: 'assessment-002',
    title: 'Depression Assessment with PHQ-9',
    description: 'Depression severity assessment using Patient Health Questionnaire-9',
    domain: 'Depression',
    severity: 'General',
    evidenceLevel: 'B',
    category: 'Assessment',
    content: `The Patient Health Questionnaire-9 (PHQ-9) is a 9-item self-report measure for assessing depression severity. Scores: 1-4 minimal, 5-9 mild, 10-14 moderate, 15-19 moderately severe, 20-27 severe depression. The PHQ-9 can be used for screening, diagnosis, and monitoring treatment response in depression.`,
    keywords: ['PHQ-9', 'depression assessment', 'severity', 'screening', 'monitoring'],
    source: 'Kroenke, Spitzer & Williams (2001)',
    lastUpdated: new Date().toISOString(),
    priority: 6
  },
  {
    id: 'functional-001',
    title: 'Functional Impairment Assessment WHO-DAS',
    description: 'World Health Organization Disability Assessment Schedule for functional impairment',
    domain: 'Functional',
    severity: 'General',
    evidenceLevel: 'B',
    category: 'Assessment',
    content: `The WHO Disability Assessment Schedule (WHO-DAS) measures functioning and disability across six domains: cognition, mobility, self-care, getting along, life activities, and participation. It provides a standardized method for measuring health and disability across cultures and can be used to assess treatment outcomes.`,
    keywords: ['WHO-DAS', 'functional assessment', 'disability', 'functioning', 'impairment'],
    source: 'World Health Organization',
    lastUpdated: new Date().toISOString(),
    priority: 5
  },
  {
    id: 'comorbid-001',
    title: 'PTSD and Depression Comorbidity Treatment',
    description: 'Integrated treatment approach for PTSD and depression comorbidity',
    domain: 'Comorbid',
    severity: 'Severe',
    evidenceLevel: 'B',
    category: 'Treatment',
    content: `When PTSD and depression co-occur, integrated treatment approaches are recommended. This may include trauma-focused therapy (CPT or PE) combined with depression-focused interventions. Sequential or simultaneous treatment of both conditions can be effective, with trauma-focused treatment often leading to improvements in both PTSD and depression symptoms.`,
    keywords: ['comorbidity', 'PTSD depression', 'integrated treatment', 'dual diagnosis', 'trauma depression'],
    source: 'VA/DoD Clinical Practice Guidelines',
    lastUpdated: new Date().toISOString(),
    priority: 7
  },
  {
    id: 'crisis-001',
    title: 'Crisis Intervention and Safety Planning',
    description: 'Crisis intervention protocols and safety planning for high-risk patients',
    domain: 'Crisis',
    severity: 'Severe',
    evidenceLevel: 'C',
    category: 'Treatment',
    content: `Crisis intervention involves immediate assessment of safety, development of safety plans, and coordination of care. Key components include risk assessment, safety planning, crisis resources, emergency contacts, and follow-up protocols. Safety planning should be collaborative and regularly updated based on patient needs and risk factors.`,
    keywords: ['crisis intervention', 'safety planning', 'risk assessment', 'emergency', 'suicide prevention'],
    source: 'APA Practice Guidelines',
    lastUpdated: new Date().toISOString(),
    priority: 10
  }
];

async function populateVectorize() {
  console.log('🚀 Starting Vectorize population with clinical recommendations...\n');

  try {
    // Step 1: Initialize Vectorize index
    console.log('1️⃣ Initializing Vectorize index...');
    await initializeVectorizeIndex();
    console.log('✅ Vectorize index ready\n');

    // Step 2: Store sample recommendations
    console.log('2️⃣ Storing clinical recommendations...');
    let successCount = 0;
    let errorCount = 0;

    for (const recommendation of sampleRecommendations) {
      try {
        await storeClinicalRecommendation(recommendation);
        successCount++;
        console.log(`   ✅ Stored: ${recommendation.title}`);
        
        // Add a small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        errorCount++;
        console.error(`   ❌ Failed to store ${recommendation.title}:`, error);
      }
    }

    console.log(`\n📊 Population Summary:`);
    console.log(`   ✅ Successfully stored: ${successCount} recommendations`);
    console.log(`   ❌ Errors: ${errorCount} recommendations`);
    
    if (successCount > 0) {
      console.log('\n🎉 Vectorize population completed successfully!');
      console.log('📋 The clinical recommendations database is now ready for use.');
    } else {
      console.log('\n⚠️  No recommendations were stored successfully.');
    }

  } catch (error) {
    console.error('❌ Failed to populate Vectorize:', error);
    process.exit(1);
  }
}

// Run the population script if this file is executed directly
if (require.main === module) {
  populateVectorize()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Population script failed:', error);
      process.exit(1);
    });
}

export { populateVectorize };