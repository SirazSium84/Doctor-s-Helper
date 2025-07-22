import { Pinecone } from '@pinecone-database/pinecone';

// Initialize Pinecone client
let pinecone: Pinecone | null = null;

export async function getPineconeClient(): Promise<Pinecone> {
  if (!pinecone) {
    if (!process.env.PINECONE_API_KEY) {
      throw new Error('PINECONE_API_KEY is not set in environment variables');
    }

    pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
  }

  return pinecone;
}

// Clinical recommendations index configuration - using your existing DSM-5 index
export const CLINICAL_RECOMMENDATIONS_INDEX = process.env.PINECONE_INDEX_NAME || 'dsm-5';

export interface ClinicalRecommendation {
  id: string;
  title: string;
  description: string;
  domain: string; // e.g., 'PTSD', 'Depression', 'Anxiety', 'General'
  severity: string; // e.g., 'Mild', 'Moderate', 'Severe'
  evidenceLevel: string; // e.g., 'A', 'B', 'C' (evidence quality)
  category: string; // e.g., 'Treatment', 'Assessment', 'Prevention', 'Monitoring'
  content: string; // Full recommendation text
  keywords: string[]; // Related keywords for better matching
  source: string; // Citation or source reference
  lastUpdated: string; // ISO date string
  priority: number; // 1-10 priority score
}

export interface RecommendationSearchResult {
  recommendation: ClinicalRecommendation;
  score: number; // Relevance score from vector search
}

// Helper function to get the clinical recommendations index
export async function getRecommendationsIndex() {
  const client = await getPineconeClient();
  return client.index(CLINICAL_RECOMMENDATIONS_INDEX);
}

// Function to check if DSM-5 index exists (assuming it's already created)
export async function ensureRecommendationsIndexExists() {
  try {
    const client = await getPineconeClient();
    
    // Check if your DSM-5 index exists
    const existingIndexes = await client.listIndexes();
    const indexExists = existingIndexes.indexes?.some(
      index => index.name === CLINICAL_RECOMMENDATIONS_INDEX
    );

    if (!indexExists) {
      throw new Error(`DSM-5 index '${CLINICAL_RECOMMENDATIONS_INDEX}' not found. Please make sure your index is created and the PINECONE_INDEX_NAME environment variable is set correctly.`);
    }

    console.log(`✅ DSM-5 index '${CLINICAL_RECOMMENDATIONS_INDEX}' found and ready to use`);
    return true;
  } catch (error) {
    console.error('Error checking DSM-5 index:', error);
    throw error;
  }
}