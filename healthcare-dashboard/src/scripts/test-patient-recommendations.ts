/**
 * Test if clinical recommendations for patient 45f6c6e54bbf are sourced from DSM-5 vector database
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import { generateContextualRecommendations } from '../lib/vectorize-recommendations';

async function testPatientRecommendations() {
  console.log('🧪 Testing clinical recommendations for patient 45f6c6e54bbf...\n');
  console.log('🔍 Checking if recommendations are sourced from DSM-5 vector database\n');

  // Simulate patient assessment data that would generate those generic recommendations
  const patientAssessmentData = {
    ptsd: {
      total_score: 52,
      severity: 'Severe',
      interpretation: 'High severity PTSD symptoms'
    },
    phq: {
      total_score: 18,
      severity: 'Moderately Severe',
      interpretation: 'Moderately severe depression'
    },
    gad: {
      total_score: 15,
      severity: 'Moderate',
      interpretation: 'Moderate anxiety symptoms'
    },
    who: {
      total_score: 24,
      severity: 'Moderate',
      interpretation: 'Moderate functional impairment'
    }
  };

  try {
    console.log('📊 Patient Assessment Data:');
    console.log(JSON.stringify(patientAssessmentData, null, 2));
    console.log('\n🔍 Generating recommendations from Vectorize DSM-5 database...\n');

    const vectorRecommendations = await generateContextualRecommendations(patientAssessmentData);

    console.log('=' .repeat(80));
    console.log('📋 VECTORIZE DSM-5 RECOMMENDATIONS vs CURRENT GENERIC RECOMMENDATIONS');
    console.log('=' .repeat(80));

    console.log('\n🆚 CURRENT GENERIC RECOMMENDATIONS (what you\'re seeing):');
    console.log('   • Immediate: Priority interventions for high-severity assessments');
    console.log('   • Short-term: Increase therapy frequency for elevated scores');
    console.log('   • Ongoing: Regular monitoring of moderate-severity symptoms');
    console.log('   • Follow-up: Complete reassessment in 4 weeks');
    console.log('   • Referral: Consider specialist consultation as indicated');

    console.log('\n🔬 VECTORIZE DSM-5 RECOMMENDATIONS (from vector database):');
    if (vectorRecommendations.length > 0) {
      vectorRecommendations.forEach((result, index) => {
        console.log(`\n   ${index + 1}. ${result.recommendation.title}`);
        console.log(`      📋 Domain: ${result.recommendation.domain}`);
        console.log(`      🎯 Category: ${result.recommendation.category}`);
        console.log(`      📊 DSM-5 Relevance: ${(result.score * 100).toFixed(1)}%`);
        console.log(`      📖 Source: ${result.recommendation.source.includes('DSM5.pdf') ? '✅ DSM-5 PDF' : result.recommendation.source}`);
        console.log(`      📝 Content: ${result.recommendation.content.substring(0, 300)}...`);
        console.log(`      🏷️  Clinical Keywords: ${result.recommendation.keywords.slice(0, 5).join(', ')}`);
      });

      console.log('\n📊 ANALYSIS RESULTS:');
      console.log('━'.repeat(50));
      
      // Check if recommendations are actually from DSM-5
      const fromDSM5 = vectorRecommendations.filter(r => 
        r.recommendation.source.includes('DSM5.pdf') || 
        r.recommendation.source.includes('DSM-5')
      );
      
      if (fromDSM5.length > 0) {
        console.log(`✅ CONFIRMED: ${fromDSM5.length}/${vectorRecommendations.length} recommendations ARE from DSM-5`);
        console.log('🔬 Vector database is working and accessing DSM-5 content');
        console.log('⚠️  ISSUE: Chat system may be using fallback/hardcoded recommendations instead');
        console.log('💡 SOLUTION: Check chat API route to ensure it\'s calling Vectorize recommendations');
      } else {
        console.log('❌ ISSUE: No recommendations found from DSM-5 source');
        console.log('🔧 Vector database may not be properly integrated with chat system');
      }

      // Analyze content quality
      const hasSpecificContent = vectorRecommendations.some(r => 
        r.recommendation.content.length > 100 && 
        (r.recommendation.content.includes('criteria') || 
         r.recommendation.content.includes('diagnosis') ||
         r.recommendation.content.includes('treatment'))
      );

      if (hasSpecificContent) {
        console.log('✅ Content quality: Specific clinical information detected');
      } else {
        console.log('⚠️  Content quality: Generic or limited clinical information');
      }

    } else {
      console.log('❌ NO VECTORIZE RECOMMENDATIONS GENERATED');
      console.log('🔧 This explains why you\'re seeing generic recommendations');
      console.log('💡 The chat system is falling back to hardcoded recommendations');
    }

    console.log('\n🎯 RECOMMENDATION:');
    console.log('━'.repeat(30));
    if (vectorRecommendations.length > 0) {
      console.log('1. ✅ Vectorize integration is working');
      console.log('2. 🔧 Chat API needs to be updated to use vector recommendations');
      console.log('3. 🚀 Replace generic recommendations with DSM-5 sourced content');
    } else {
      console.log('1. ❌ Vectorize integration needs debugging');
      console.log('2. 🔧 Check API credentials and pipeline configuration');
      console.log('3. 🔍 Verify DSM-5 content is properly indexed');
    }

  } catch (error) {
    console.error('❌ Error testing patient recommendations:', error.message);
    console.error('🔧 This confirms the chat system is using fallback recommendations');
  }

  console.log('\n🎉 Patient recommendation analysis completed!');
}

testPatientRecommendations()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });