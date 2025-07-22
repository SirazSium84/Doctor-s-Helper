/**
 * Test Vectorize integration using the provided code example
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const {Configuration, PipelinesApi} = require("@vectorize-io/vectorize-client");

async function main() {
    try {
        console.log('🧪 Testing Vectorize with provided example...\n');
        
        // Log configuration details
        console.log('Configuration:');
        console.log(`- Token: ${process.env.VECTORIZE_PIPELINE_ACCESS_TOKEN ? 'Present' : 'Missing'}`);
        console.log(`- Organization: 482f9043-dee3-44cd-909b-76478df65851`);
        console.log(`- Pipeline: aip052a5-6a10-412c-9924-bada448cbfe3\n`);

        const api = new Configuration({
            accessToken: process.env.VECTORIZE_PIPELINE_ACCESS_TOKEN,
            basePath: "https://api.vectorize.io/v1",
        });
        const pipelinesApi = new PipelinesApi(api);
        
        console.log('📡 Making API call...');
        const response = await pipelinesApi.retrieveDocuments({
            organization: "482f9043-dee3-44cd-909b-76478df65851",
            pipeline: "aip052a5-6a10-412c-9924-bada448cbfe3",
            retrieveDocumentsRequest: {
                question: "How to call the API?",
                numResults: 5,
            }
        });
        
        console.log('✅ Success! Retrieved documents:');
        console.log('📄 Number of documents:', response.documents?.length || 0);
        console.log('📋 Documents:', JSON.stringify(response.documents, null, 2));
        
    } catch (error) {
        console.error('❌ Error occurred:');
        console.error('Error details:', error?.response?.status, error?.response?.statusText);
        if (error?.response) {
            try {
                const errorText = await error.response.text();
                console.error('Response body:', errorText);
            } catch (textError) {
                console.error('Could not read response text:', textError.message);
            }
        }
        console.error('Full error:', error.message);
        throw error;
    }
}

main()
    .then(() => {
        console.log('\n🎉 Test completed successfully!');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n💥 Test failed:', error.message);
        process.exit(1);
    });