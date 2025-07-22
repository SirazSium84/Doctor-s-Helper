/**
 * Test clinical recommendations search with Vectorize
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import { searchClinicalRecommendations } from '../lib/vectorize-recommendations';

async function testClinicalSearch() {
  console.log('🧪 Testing clinical recommendations search...\n');

  const testQueries = [
    'PTSD trauma treatment therapy',
    'depression symptoms diagnosis criteria',
    'anxiety disorder treatment options',
    'cognitive behavioral therapy CBT',
    'assessment interview evaluation'
  ];

  for (const query of testQueries) {
    try {
      console.log(`\n🔍 Testing query: "${query}"`);
      console.log('─'.repeat(50));
      
      const results = await searchClinicalRecommendations(query, {
        topK: 3,
        minScore: 0.3
      });

      console.log(`📄 Found ${results.length} recommendations:`);
      
      results.forEach((result, index) => {
        console.log(`\n${index + 1}. ${result.recommendation.title}`);
        console.log(`   Domain: ${result.recommendation.domain}`);
        console.log(`   Category: ${result.recommendation.category}`);
        console.log(`   Score: ${(result.score * 100).toFixed(1)}%`);
        console.log(`   Content: ${result.recommendation.content.substring(0, 150)}...`);
      });
      
      if (results.length === 0) {
        console.log('   ⚠️  No recommendations found for this query');
      }

    } catch (error) {
      console.error(`❌ Error searching for "${query}":`, error.message);
    }
  }

  console.log('\n🎉 Clinical search test completed!');
}

testClinicalSearch()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });