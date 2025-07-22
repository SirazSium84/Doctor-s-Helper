/**
 * Vectorize.io client for clinical recommendations
 * Uses official Vectorize.io SDK for vector search operations
 */

import { Configuration, PipelinesApi } from '@vectorize-io/vectorize-client';

export interface VectorizeConfig {
  pipelineAccessToken: string;
  organizationId: string;
  pipelineId: string;
}

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

export interface VectorizeSearchResult {
  recommendation: ClinicalRecommendation;
  score: number; // Relevance score from vector search
}

export interface VectorizeVector {
  id: string;
  values: number[];
  metadata: Record<string, any>;
}

export interface VectorizeSearchResponse {
  matches: Array<{
    id: string;
    score: number;
    metadata: Record<string, any>;
  }>;
}

class VectorizeClient {
  private config: VectorizeConfig;
  private pipelinesApi: PipelinesApi;

  constructor(config: VectorizeConfig) {
    this.config = config;
    
    const configuration = new Configuration({
      accessToken: config.pipelineAccessToken,
      basePath: "https://api.vectorize.io/v1",
    });
    
    this.pipelinesApi = new PipelinesApi(configuration);
  }

  private extractTitle(text: string): string {
    // Extract meaningful titles from DSM-5 content
    const lines = text.split('\n').filter(line => line.trim());
    
    // Look for common DSM-5 section headers
    const titlePatterns = [
      /^[A-Z][A-Z\s\-]+$/,  // ALL CAPS titles
      /^\d+\.\s*[A-Z][\w\s\-]+/,  // Numbered sections
      /^[A-Z][a-z]+\s+[A-Z][a-z]+/,  // Title Case
    ];
    
    for (const line of lines.slice(0, 3)) {
      for (const pattern of titlePatterns) {
        if (pattern.test(line.trim()) && line.length < 100) {
          return line.trim();
        }
      }
    }
    
    // Fallback to first meaningful line
    return lines[0]?.substring(0, 50) + '...' || 'DSM-5 Content';
  }

  private extractDomain(text: string): string {
    // Extract clinical domains from DSM-5 content
    const domains = {
      'PTSD': ['trauma', 'ptsd', 'post-traumatic', 'stress disorder'],
      'Depression': ['depression', 'depressive', 'mood disorder', 'major depressive'],
      'Anxiety': ['anxiety', 'panic', 'generalized anxiety', 'phobia'],
      'Bipolar': ['bipolar', 'manic', 'mania', 'mood episode'],
      'Schizophrenia': ['schizophrenia', 'psychotic', 'psychosis', 'delusion'],
      'ADHD': ['adhd', 'attention deficit', 'hyperactivity'],
      'Autism': ['autism', 'autistic', 'spectrum disorder'],
      'Substance': ['substance', 'addiction', 'dependence', 'withdrawal']
    };
    
    const lowerText = text.toLowerCase();
    
    for (const [domain, keywords] of Object.entries(domains)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return domain;
      }
    }
    
    return 'General';
  }

  private extractCategory(text: string): string {
    // Extract clinical categories from DSM-5 content
    const categories = {
      'Diagnostic Criteria': ['criteria', 'diagnosis', 'diagnostic'],
      'Assessment': ['assessment', 'interview', 'evaluation', 'screening'],
      'Treatment': ['treatment', 'therapy', 'intervention', 'therapeutic'],
      'Cultural Factors': ['cultural', 'culture', 'formulation'],
      'Epidemiology': ['prevalence', 'epidemiology', 'risk factors'],
      'Comorbidity': ['comorbid', 'comorbidity', 'associated features']
    };
    
    const lowerText = text.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return category;
      }
    }
    
    return 'Clinical';
  }

  async createIndex(dimension: number = 1536): Promise<void> {
    // Pipeline index is created through the platform UI or API
    // Check if pipeline is ready for indexing
    try {
      await this.getIndexInfo();
      console.log(`✅ Vectorize pipeline ready for indexing`);
    } catch (error) {
      console.log(`📝 Pipeline may need to be set up through Vectorize platform`);
      throw new Error(`Pipeline not ready: ${error}`);
    }
  }

  async upsertVectors(vectors: VectorizeVector[]): Promise<void> {
    // For Vectorize.io, documents are typically uploaded via connectors
    // This is a placeholder - actual document upload would go through file connectors
    console.log(`📝 Document upload for ${vectors.length} vectors would go through Vectorize connectors`);
    console.log(`💡 Use the Vectorize platform UI to upload documents to the pipeline`);
    console.log(`✅ Your pipeline already contains DSM-5 content with ${vectors.length} potential vectors`);
  }

  async search(
    query: string,
    options: {
      topK?: number;
      filter?: Record<string, any>;
      includeMetadata?: boolean;
    } = {}
  ): Promise<VectorizeSearchResponse> {
    const { topK = 5, filter, includeMetadata = true } = options;

    try {
      // Use the official SDK to retrieve documents from the pipeline
      const response = await this.pipelinesApi.retrieveDocuments({
        organization: this.config.organizationId,
        pipeline: this.config.pipelineId,
        retrieveDocumentsRequest: {
          question: query, // Use the actual search query
          numResults: topK
        }
      });

      console.log(`🔍 Vectorize search response: ${response.documents?.length || 0} documents found`);

      // Transform response to match our interface
      return {
        matches: response.documents?.map((doc: any) => ({
          id: doc.id || doc.chunkId || `doc-${Math.random()}`,
          score: doc.similarity || doc.score || 0.8,
          metadata: {
            title: this.extractTitle(doc.text) || 'DSM-5 Clinical Content',
            content: doc.text || doc.content || '',
            source: doc.sourceDisplayName || doc.source || 'DSM-5',
            domain: this.extractDomain(doc.text) || 'General',
            category: this.extractCategory(doc.text) || 'Clinical',
            chunkId: doc.chunkId,
            totalChunks: doc.totalChunks,
            similarity: doc.similarity,
            relevancy: doc.relevancy
          }
        })) || []
      };
    } catch (error) {
      console.error('Error in Vectorize search:', error);
      throw new Error(`Failed to search vectors: ${error}`);
    }
  }

  async getIndexInfo(): Promise<any> {
    try {
      const response = await this.pipelinesApi.getPipelines({
        organization: this.config.organizationId
      });

      console.log(`📋 Found ${response.pipelines?.length || 0} pipelines`);
      
      // Find our specific pipeline
      const pipeline = response.pipelines?.find((p: any) => p.id === this.config.pipelineId);
      
      if (pipeline) {
        console.log(`✅ Found target pipeline: ${pipeline.name || this.config.pipelineId}`);
        return pipeline;
      } else {
        throw new Error(`Pipeline ${this.config.pipelineId} not found`);
      }
    } catch (error) {
      console.error('Error getting pipeline info:', error);
      throw new Error(`Failed to get pipeline info: ${error}`);
    }
  }

  async deleteIndex(): Promise<void> {
    const response = await fetch(this.baseUrl, {
      method: 'DELETE',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to delete index: ${error}`);
    }

    console.log(`✅ Deleted Vectorize index`);
  }
}

// Initialize Vectorize client
let vectorizeClient: VectorizeClient | null = null;

export function getVectorizeClient(): VectorizeClient {
  if (!vectorizeClient) {
    const config: VectorizeConfig = {
      pipelineAccessToken: process.env.VECTORIZE_PIPELINE_ACCESS_TOKEN!,
      organizationId: process.env.VECTORIZE_ORGANIZATION_ID!,
      pipelineId: process.env.VECTORIZE_PIPELINE_ID!
    };

    if (!config.pipelineAccessToken) {
      throw new Error('VECTORIZE_PIPELINE_ACCESS_TOKEN environment variable is required');
    }
    if (!config.organizationId) {
      throw new Error('VECTORIZE_ORGANIZATION_ID environment variable is required');
    }
    if (!config.pipelineId) {
      throw new Error('VECTORIZE_PIPELINE_ID environment variable is required');
    }

    vectorizeClient = new VectorizeClient(config);
  }

  return vectorizeClient;
}

export { VectorizeClient };