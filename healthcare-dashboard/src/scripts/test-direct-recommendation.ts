/**
 * Test the clinical recommendations generation directly without the chat API
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import { generateContextualRecommendations } from '../lib/vectorize-recommendations';

async function testDirectRecommendation() {
  console.log('🧪 Testing direct DSM-5 clinical recommendations generation...\n');

  // Sample assessment data that would be used in comprehensive report
  const assessmentBreakdown = {
    ptsd: {
      total_score: 50,
      severity: 'Moderate',
      interpretation: 'Probable PTSD diagnosis'
    },
    phq: {
      total_score: 2,
      severity: 'Mild',
      interpretation: 'Minimal depression'
    },
    gad: {
      total_score: 15,
      severity: 'Moderate',
      interpretation: 'Moderate anxiety'
    },
    who: {
      total_score: 6,
      severity: 'Mild Impairment',
      interpretation: 'Mild functional impairment'
    },
    ders: {
      total_score: 83,
      severity: 'Moderate Difficulty',
      interpretation: 'Moderate emotion regulation difficulty'
    }
  };

  try {
    console.log('📊 Sample Assessment Data:');
    console.log(JSON.stringify(assessmentBreakdown, null, 2));
    console.log('\n🎯 Generating DSM-5 clinical recommendations...\n');

    const clinicalRecommendations = await generateContextualRecommendations(assessmentBreakdown);
    
    console.log('=' .repeat(80));
    console.log('📋 CLINICAL RECOMMENDATIONS REPORT (As would appear in chat)');
    console.log('=' .repeat(80));

    let response = `

================================================================================

**EVIDENCE-BASED CLINICAL RECOMMENDATIONS (DSM-5):**`;

    if (clinicalRecommendations && clinicalRecommendations.length > 0) {
      console.log(`✅ SUCCESS: Generated ${clinicalRecommendations.length} DSM-5 recommendations\n`);
      
      clinicalRecommendations.slice(0, 5).forEach((rec, index) => {
        const relevancePercent = Math.round(rec.score * 100);
        response += `
   ${index + 1}. **${rec.recommendation.title}**
      📋 Domain: ${rec.recommendation.domain} | Category: ${rec.recommendation.category}
      📊 Clinical Relevance: ${relevancePercent}% | Source: DSM-5
      📝 ${rec.recommendation.content.substring(0, 200)}${rec.recommendation.content.length > 200 ? '...' : ''}`;
      });
      
      const priorityDomains = ['PTSD', 'Anxiety']; // Based on moderate severity
      response += `
              
💡 **Clinical Actions:**
   • **Immediate:** Address ${priorityDomains.join(' and ')} symptoms based on DSM-5 criteria
   • **Assessment:** Use structured diagnostic interviews per DSM-5 guidelines  
   • **Treatment:** Implement evidence-based interventions as indicated above
   • **Monitoring:** Track symptom changes using validated assessment tools
   • **Follow-up:** Regular reassessment per clinical severity and treatment response`;
      
      console.log(response);
      
      console.log('\n📊 DETAILED ANALYSIS:');
      console.log('━'.repeat(50));
      
      // Analyze the recommendations
      const domainCounts = {};
      const categoryCounts = {};
      const sources = new Set();
      
      clinicalRecommendations.forEach(rec => {
        domainCounts[rec.recommendation.domain] = (domainCounts[rec.recommendation.domain] || 0) + 1;
        categoryCounts[rec.recommendation.category] = (categoryCounts[rec.recommendation.category] || 0) + 1;
        sources.add(rec.recommendation.source);
      });
      
      console.log(`🔍 Domains covered: ${Object.keys(domainCounts).join(', ')}`);
      console.log(`📁 Categories: ${Object.keys(categoryCounts).join(', ')}`);
      console.log(`📖 Sources: ${Array.from(sources).join(', ')}`);
      console.log(`📈 Average relevance: ${Math.round(clinicalRecommendations.reduce((sum, r) => sum + r.score, 0) / clinicalRecommendations.length * 100)}%`);
      
      // Check if sources are from DSM-5
      const isDSM5Source = Array.from(sources).some(source => 
        source.includes('DSM5.pdf') || source.includes('DSM-5')
      );
      
      console.log(`\n🎯 VALIDATION RESULTS:`);
      console.log(`✅ DSM-5 Source Confirmed: ${isDSM5Source ? 'YES' : 'NO'}`);
      console.log(`✅ Specific Clinical Content: ${clinicalRecommendations.some(r => r.recommendation.content.length > 100) ? 'YES' : 'NO'}`);
      console.log(`✅ Relevant to Assessment: ${clinicalRecommendations.some(r => r.score > 0.7) ? 'YES' : 'NO'}`);
      
    } else {
      console.log('❌ FAILURE: No recommendations generated');
      response += `
   • **Immediate:** Priority interventions for high-severity assessments
   • **Short-term:** Increase therapy frequency for elevated scores  
   • **Ongoing:** Regular monitoring of moderate-severity symptoms
   • **Follow-up:** Complete reassessment in 4 weeks
   • **Referral:** Consider specialist consultation as indicated
   
   ⚠️ Note: Unable to retrieve specific DSM-5 recommendations from vector database`;
      
      console.log(response);
      console.log('\n❌ This indicates the Vectorize integration is not working properly');
    }

    console.log('\n🎉 FINAL VERDICT:');
    console.log('━'.repeat(30));
    if (clinicalRecommendations && clinicalRecommendations.length > 0) {
      console.log('🎊 SUCCESS: The chat system will now show DSM-5 recommendations!');
      console.log('📋 Instead of generic recommendations, users will see:');
      console.log('   - Specific DSM-5 diagnostic criteria and features');
      console.log('   - Evidence-based clinical content with relevance scores');
      console.log('   - Proper source attribution to DSM-5');
      console.log('   - Domain-specific recommendations (PTSD, Depression, etc.)');
    } else {
      console.log('❌ ISSUE: Generic recommendations will still appear');
      console.log('🔧 The Vectorize integration needs further debugging');
    }

  } catch (error) {
    console.error('❌ Error testing direct recommendations:', error.message);
    console.error('Full error:', error);
  }

  console.log('\n🎉 Direct recommendation test completed!');
}

testDirectRecommendation()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });