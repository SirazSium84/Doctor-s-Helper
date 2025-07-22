/**
 * Test the chat system with proper authorization
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function testAuthChat() {
  console.log('🧪 Testing chat system with authorization...\n');

  try {
    // First message - request the report
    console.log('📨 Sending first message: Request comprehensive report...');
    let response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: 'Comprehensive analytical report for patient 45f6c6e54bbf'
          }
        ]
      })
    });

    let reader = response.body?.getReader();
    let decoder = new TextDecoder();
    let firstResponse = '';

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        firstResponse += decoder.decode(value);
      }
    }

    console.log('📄 First response:', firstResponse.substring(0, 200) + '...\n');

    // Second message - provide authorization
    console.log('🔐 Sending authorization confirmation...');
    response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: 'Comprehensive analytical report for patient 45f6c6e54bbf'
          },
          {
            role: 'assistant',
            content: firstResponse
          },
          {
            role: 'user',
            content: 'Yes, I am authorized to access this patient data. I am a licensed healthcare provider with proper credentials. Please proceed with the comprehensive analytical report.'
          }
        ]
      })
    });

    if (!response.ok) {
      console.error(`❌ API request failed: ${response.status} ${response.statusText}`);
      return;
    }

    console.log('📡 Reading comprehensive report response...\n');

    reader = response.body?.getReader();
    let fullResponse = '';

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        fullResponse += chunk;
        process.stdout.write(chunk);
      }
    }

    console.log('\n\n' + '='.repeat(80));
    console.log('📊 COMPREHENSIVE ANALYSIS OF CLINICAL RECOMMENDATIONS');
    console.log('='.repeat(80));

    // Detailed analysis of the response
    const hasDSM5Content = fullResponse.includes('DSM-5') || 
                          fullResponse.includes('DSM5.pdf') ||
                          fullResponse.includes('diagnostic criteria') ||
                          fullResponse.includes('Posttraumatic Stress') ||
                          fullResponse.includes('similarity') ||
                          fullResponse.includes('relevance');

    const hasSpecificClinicalContent = fullResponse.includes('delayed expression') ||
                                      fullResponse.includes('traumatic event') ||
                                      fullResponse.includes('Specify if:') ||
                                      fullResponse.includes('Diagnostic Features');

    const hasGenericContent = fullResponse.includes('Priority interventions for high-severity') ||
                             fullResponse.includes('Increase therapy frequency') ||
                             fullResponse.includes('Complete reassessment in 4 weeks') ||
                             fullResponse.includes('Consider specialist consultation');

    const hasToolCall = fullResponse.includes('get_clinical_recommendations') ||
                       fullResponse.includes('clinical_recommendations') ||
                       fullResponse.includes('🎯 Getting clinical recommendations');

    const hasSourceAttribution = fullResponse.includes('Source:') ||
                                 fullResponse.includes('DSM-5') ||
                                 fullResponse.includes('Relevance:') ||
                                 fullResponse.includes('%');

    console.log(`🔍 Contains DSM-5 specific content: ${hasDSM5Content ? '✅ YES' : '❌ NO'}`);
    console.log(`📋 Contains specific clinical details: ${hasSpecificClinicalContent ? '✅ YES' : '❌ NO'}`);
    console.log(`⚠️  Contains generic recommendations: ${hasGenericContent ? '❌ YES (Problem!)' : '✅ NO (Good!)'}`);
    console.log(`🛠️  Shows tool call evidence: ${hasToolCall ? '✅ YES' : '❌ NO'}`);
    console.log(`📖 Has source attribution: ${hasSourceAttribution ? '✅ YES' : '❌ NO'}`);

    console.log('\n📊 VERDICT:');
    console.log('━'.repeat(50));

    if (hasDSM5Content && hasSpecificClinicalContent && !hasGenericContent) {
      console.log('🎉 SUCCESS: Chat system is using Vectorize DSM-5 recommendations!');
      console.log('✅ Clinical recommendations are sourced from evidence-based content');
      console.log('✅ Specific diagnostic information is being provided');
      console.log('✅ Generic fallback recommendations are not being used');
    } else if (hasGenericContent) {
      console.log('❌ ISSUE: Chat system is still using generic fallback recommendations');
      console.log('🔧 The Vectorize integration exists but may not be triggered properly');
      console.log('💡 Possible solutions:');
      console.log('   1. Strengthen system prompt to force tool usage');
      console.log('   2. Add error handling to prevent fallback to generic content');
      console.log('   3. Check if tool execution is failing silently');
    } else if (hasDSM5Content) {
      console.log('🔄 PARTIAL SUCCESS: Some DSM-5 content detected');
      console.log('💡 The integration may be working but needs optimization');
    } else {
      console.log('❌ FAILURE: No evidence of Vectorize DSM-5 integration in chat');
      console.log('🔧 The tool may not be called or may be failing');
    }

    // Count recommendation types in response
    const immediateCount = (fullResponse.match(/immediate/gi) || []).length;
    const shortTermCount = (fullResponse.match(/short.?term/gi) || []).length;
    const ongoingCount = (fullResponse.match(/ongoing/gi) || []).length;
    const followUpCount = (fullResponse.match(/follow.?up/gi) || []).length;

    console.log(`\n📈 Recommendation patterns detected:`);
    console.log(`   - "Immediate" mentions: ${immediateCount}`);
    console.log(`   - "Short-term" mentions: ${shortTermCount}`);  
    console.log(`   - "Ongoing" mentions: ${ongoingCount}`);
    console.log(`   - "Follow-up" mentions: ${followUpCount}`);

  } catch (error) {
    console.error('❌ Error testing authorized chat:', error.message);
    console.log('\n💡 Make sure the development server is running on localhost:3000');
    console.log('   Run: npm run dev');
  }

  console.log('\n🎉 Authorized chat test completed!');
}

testAuthChat()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });