/**
 * Test the get_clinical_recommendations tool directly
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function testChatTool() {
  console.log('🧪 Testing get_clinical_recommendations tool directly...\n');

  try {
    // Make a direct API call to the chat endpoint with a comprehensive report request
    const response = await fetch('http://localhost:3000/api/chat', {
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

    if (!response.ok) {
      console.error(`❌ API request failed: ${response.status} ${response.statusText}`);
      return;
    }

    console.log('📡 API call successful, reading response stream...\n');

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
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
    console.log('📊 ANALYSIS OF RESPONSE');
    console.log('='.repeat(80));

    // Check if the response contains DSM-5 specific content
    const hasDSM5Content = fullResponse.includes('DSM-5') || 
                          fullResponse.includes('diagnostic criteria') ||
                          fullResponse.includes('Posttraumatic Stress') ||
                          fullResponse.includes('similarity');

    const hasGenericContent = fullResponse.includes('Priority interventions for high-severity') ||
                             fullResponse.includes('Increase therapy frequency') ||
                             fullResponse.includes('Complete reassessment in 4 weeks');

    const hasToolCall = fullResponse.includes('get_clinical_recommendations') ||
                       fullResponse.includes('clinical_recommendations');

    console.log(`🔍 Contains DSM-5 specific content: ${hasDSM5Content ? '✅ YES' : '❌ NO'}`);
    console.log(`⚠️  Contains generic recommendations: ${hasGenericContent ? '❌ YES' : '✅ NO'}`);
    console.log(`🛠️  Shows tool call evidence: ${hasToolCall ? '✅ YES' : '❌ NO'}`);

    if (hasDSM5Content) {
      console.log('\n✅ SUCCESS: Chat system is using Vectorize DSM-5 recommendations!');
    } else if (hasGenericContent) {
      console.log('\n❌ ISSUE: Chat system is still using generic fallback recommendations');
      console.log('💡 Possible causes:');
      console.log('   - AI model not calling the get_clinical_recommendations tool');
      console.log('   - Tool execution failing and falling back to generic content');
      console.log('   - System prompt not emphasizing tool usage strongly enough');
    } else {
      console.log('\n🔍 INCONCLUSIVE: Response doesn\'t match expected patterns');
    }

  } catch (error) {
    console.error('❌ Error testing chat tool:', error.message);
    console.log('\n💡 Make sure the development server is running on localhost:3000');
    console.log('   Run: npm run dev');
  }

  console.log('\n🎉 Chat tool test completed!');
}

testChatTool()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });