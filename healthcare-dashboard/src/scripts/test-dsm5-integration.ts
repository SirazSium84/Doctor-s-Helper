/**
 * Test script to verify DSM-5 Pinecone integration
 * Run with: npx tsx src/scripts/test-dsm5-integration.ts
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import { generateContextualRecommendations, searchClinicalRecommendations } from '../lib/clinical-recommendations';
import { ensureRecommendationsIndexExists } from '../lib/pinecone-client';

async function testDSM5Integration() {
  console.log('🧪 Testing DSM-5 Pinecone Integration...\n');

  try {
    // Test 1: Check if DSM-5 index exists
    console.log('1️⃣ Testing DSM-5 index connection...');
    await ensureRecommendationsIndexExists();
    console.log('✅ DSM-5 index connection successful\n');

    // Test 2: Basic search functionality with lower threshold
    console.log('2️⃣ Testing basic search functionality...');
    const basicResults = await searchClinicalRecommendations('depression symptoms diagnosis', {
      topK: 5,
      minScore: 0.3 // Lower threshold to see if there are any matches
    });
    
    console.log(`📊 Found ${basicResults.length} results for depression query:`);
    basicResults.forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.recommendation.title} (Score: ${result.score.toFixed(3)})`);
      console.log(`      Content preview: ${result.recommendation.content.substring(0, 100)}...`);
    });
    console.log('');

    // Test 3: PTSD-specific search with lower threshold
    console.log('3️⃣ Testing PTSD-specific search...');
    const ptsdResults = await searchClinicalRecommendations('PTSD trauma diagnosis criteria', {
      topK: 3,
      minScore: 0.3 // Lower threshold
    });
    
    console.log(`📊 Found ${ptsdResults.length} results for PTSD query:`);
    ptsdResults.forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.recommendation.title} (Score: ${result.score.toFixed(3)})`);
    });
    console.log('');

    // Test 4: Contextual recommendations with mock patient data
    console.log('4️⃣ Testing contextual recommendations with mock patient data...');
    const mockAssessmentData = {
      ptsd: { severity: 'Severe', total_score: 65 },
      phq: { severity: 'Moderate', total_score: 15 },
      gad: { severity: 'Mild', total_score: 8 }
    };

    const contextualResults = await generateContextualRecommendations(mockAssessmentData);
    console.log(`📊 Generated ${contextualResults.length} contextual recommendations:`);
    contextualResults.forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.recommendation.title} (Score: ${result.score.toFixed(3)})`);
      console.log(`      Domain: ${result.recommendation.domain}`);
      console.log(`      Source: ${result.recommendation.source}`);
    });
    console.log('');

    console.log('🎉 All DSM-5 integration tests completed successfully!');
    
  } catch (error) {
    console.error('❌ DSM-5 integration test failed:', error);
    process.exit(1);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testDSM5Integration()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

export { testDSM5Integration };