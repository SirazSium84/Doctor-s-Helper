/**
 * Test script to debug Vectorize API connection
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function testVectorizeConnection() {
  console.log('🔍 Testing Vectorize API connection...\n');

  // Check environment variables
  const token = process.env.VECTORIZE_PIPELINE_ACCESS_TOKEN;
  const orgId = process.env.VECTORIZE_ORGANIZATION_ID;
  const pipelineId = process.env.VECTORIZE_PIPELINE_ID;

  console.log('Environment variables:');
  console.log(`- Token: ${token ? `${token.substring(0, 20)}...` : 'MISSING'}`);
  console.log(`- Organization ID: ${orgId || 'MISSING'}`);
  console.log(`- Pipeline ID: ${pipelineId || 'MISSING'}\n`);

  if (!token || !orgId || !pipelineId) {
    console.error('❌ Missing required environment variables');
    return;
  }

  // Test basic API connection
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  console.log('📡 Testing API endpoints...\n');

  // Test 1: List pipelines
  try {
    console.log('1️⃣ Testing pipelines list endpoint...');
    const response = await fetch(`https://platform.vectorize.io/api/v1/organizations/${orgId}/pipelines`, {
      method: 'GET',
      headers
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Success! Found ${data.pipelines?.length || 0} pipelines`);
      
      // Look for our specific pipeline
      const pipeline = data.pipelines?.find((p: any) => p.id === pipelineId);
      if (pipeline) {
        console.log(`   ✅ Found target pipeline: ${pipeline.name || pipelineId}`);
        console.log(`   📋 Pipeline status: ${pipeline.status || 'unknown'}`);
      } else {
        console.log(`   ⚠️  Target pipeline ${pipelineId} not found in list`);
      }
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Error: ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ Request failed: ${error}`);
  }

  console.log();

  // Test 2: Test pipeline-specific retrieve endpoint
  try {
    console.log('2️⃣ Testing pipeline retrieve endpoint...');
    const response = await fetch(`https://platform.vectorize.io/api/v1/organizations/${orgId}/pipelines/${pipelineId}/retrieve`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        question: 'test query',
        top_k: 1
      })
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Retrieve endpoint working!`);
      console.log(`   📄 Response keys: ${Object.keys(data)}`);
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Error: ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ Request failed: ${error}`);
  }

  console.log();

  // Test 3: Test alternative API base URLs
  const alternativeUrls = [
    'https://api.vectorize.io/v1',
    'https://vectorize.io/api/v1',
    'https://app.vectorize.io/api/v1'
  ];

  for (const baseUrl of alternativeUrls) {
    try {
      console.log(`3️⃣ Testing alternative base URL: ${baseUrl}...`);
      const response = await fetch(`${baseUrl}/organizations/${orgId}/pipelines`, {
        method: 'GET',
        headers
      });

      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        console.log(`   ✅ Alternative URL works!`);
        break;
      }
    } catch (error) {
      console.log(`   ❌ URL not reachable`);
    }
  }

  console.log('\n🏁 Connection test completed');
}

// Run the test
testVectorizeConnection()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });