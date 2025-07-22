/**
 * Test contextual recommendations generation for chat
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import { generateContextualRecommendations } from '../lib/vectorize-recommendations';

async function testChatRecommendations() {
  console.log('🧪 Testing contextual recommendations for chat system...\n');

  // Sample assessment data like what would come from the healthcare dashboard
  const sampleAssessmentData = {
    ptsd: {
      total_score: 45,
      severity: 'Moderate',
      interpretation: 'Probable PTSD diagnosis'
    },
    phq: {
      total_score: 12,
      severity: 'Moderate',
      interpretation: 'Moderate depression'
    },
    gad: {
      total_score: 8,
      severity: 'Mild',
      interpretation: 'Mild anxiety'
    }
  };

  try {
    console.log('📊 Sample assessment data:');
    console.log(JSON.stringify(sampleAssessmentData, null, 2));
    console.log('\n🔍 Generating contextual recommendations...\n');

    const recommendations = await generateContextualRecommendations(sampleAssessmentData);

    console.log(`📄 Generated ${recommendations.length} clinical recommendations:\n`);

    recommendations.forEach((result, index) => {
      console.log(`${index + 1}. ${result.recommendation.title}`);
      console.log(`   📋 Domain: ${result.recommendation.domain}`);
      console.log(`   🎯 Category: ${result.recommendation.category}`);
      console.log(`   📊 Relevance: ${(result.score * 100).toFixed(1)}%`);
      console.log(`   📖 Source: ${result.recommendation.source}`);
      console.log(`   📝 Content Preview: ${result.recommendation.content.substring(0, 200)}...`);
      console.log(`   🏷️  Keywords: ${result.recommendation.keywords.slice(0, 5).join(', ')}`);
      console.log('');
    });

    if (recommendations.length > 0) {
      console.log('✅ Chat system can now use vector-sourced clinical recommendations!');
      console.log('💡 These will appear in both chat responses and PDF reports');
    } else {
      console.log('⚠️  No recommendations generated - check assessment data or search queries');
    }

  } catch (error) {
    console.error('❌ Error generating contextual recommendations:', error.message);
    console.error('Full error:', error);
  }

  console.log('\n🎉 Chat recommendations test completed!');
}

testChatRecommendations()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });