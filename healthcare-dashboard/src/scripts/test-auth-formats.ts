/**
 * Test different authentication formats for Vectorize API
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function testAuthFormats() {
  console.log('🔐 Testing different authentication formats...\n');

  const token = process.env.VECTORIZE_PIPELINE_ACCESS_TOKEN;
  const orgId = process.env.VECTORIZE_ORGANIZATION_ID;

  if (!token || !orgId) {
    console.error('❌ Missing token or organization ID');
    return;
  }

  // Different auth header formats to try
  const authFormats = [
    { name: 'Bearer Token', headers: { 'Authorization': `Bearer ${token}` } },
    { name: 'API Key', headers: { 'x-api-key': token } },
    { name: 'API Token', headers: { 'x-api-token': token } },
    { name: 'Authorization Token', headers: { 'Authorization': token } },
    { name: 'Bearer + Content-Type', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } },
    { name: 'Token Header', headers: { 'Token': token } },
    { name: 'Access Token', headers: { 'Access-Token': token } }
  ];

  const baseUrls = [
    'https://platform.vectorize.io/api/v1',
    'https://api.vectorize.io/v1',
    'https://vectorize.io/api/v1'
  ];

  for (const baseUrl of baseUrls) {
    console.log(`🌐 Testing base URL: ${baseUrl}`);
    
    for (const authFormat of authFormats) {
      try {
        console.log(`  🔑 Testing ${authFormat.name}...`);
        
        const response = await fetch(`${baseUrl}/organizations/${orgId}/pipelines`, {
          method: 'GET',
          headers: authFormat.headers
        });

        console.log(`    Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`    ✅ SUCCESS with ${authFormat.name}!`);
          console.log(`    📄 Response: ${JSON.stringify(data, null, 2).substring(0, 200)}...`);
          return { baseUrl, headers: authFormat.headers };
        } else if (response.status !== 401 && response.status !== 403) {
          const errorText = await response.text();
          console.log(`    ⚠️  Different error (${response.status}): ${errorText.substring(0, 100)}...`);
        }
      } catch (error) {
        console.log(`    ❌ Request failed: ${error.message}`);
      }
    }
    console.log();
  }

  // Test if the token might need to be URL-decoded or processed
  console.log('🔍 Testing token variations...');
  
  try {
    // Check if token is URL-encoded
    const decodedToken = decodeURIComponent(token);
    if (decodedToken !== token) {
      console.log('  🔄 Testing URL-decoded token...');
      const response = await fetch(`https://platform.vectorize.io/api/v1/organizations/${orgId}/pipelines`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${decodedToken}` }
      });
      console.log(`    Status: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log(`  ❌ Token decode test failed: ${error.message}`);
  }

  console.log('\n🏁 Authentication format testing completed');
  console.log('💡 If all tests fail, the token might be expired or the API endpoint might be different');
}

// Run the test
testAuthFormats()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });