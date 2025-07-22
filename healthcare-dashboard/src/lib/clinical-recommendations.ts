import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';
import { 
  getRecommendationsIndex, 
  ClinicalRecommendation, 
  RecommendationSearchResult,
  ensureRecommendationsIndexExists 
} from './pinecone-client';

// Generate embeddings for text using OpenAI
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const { embedding } = await embed({
      model: openai.embedding('text-embedding-ada-002'),
      value: text,
    });
    
    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

// Search for relevant clinical recommendations based on patient data from DSM-5
export async function searchClinicalRecommendations(
  query: string,
  options: {
    topK?: number;
    minScore?: number;
    domain?: string;
    severity?: string;
    category?: string;
  } = {}
): Promise<RecommendationSearchResult[]> {
  try {
    const {
      topK = 5,
      minScore = 0.7,
      domain,
      severity,
      category
    } = options;

    // Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(query);

    // Get the Pinecone index
    const index = await getRecommendationsIndex();

    // Build filter for metadata
    const filter: any = {};
    if (domain) filter.domain = domain;
    if (severity) filter.severity = severity;
    if (category) filter.category = category;

    // Perform vector search
    const searchResponse = await index.query({
      vector: queryEmbedding,
      topK,
      includeMetadata: true,
      filter: Object.keys(filter).length > 0 ? filter : undefined,
    });

    console.log(`🔍 Search query: "${query}"`);
    console.log(`🔍 Search response: ${searchResponse.matches?.length || 0} matches found`);
    if (searchResponse.matches && searchResponse.matches.length > 0) {
      console.log(`🔍 Top match score: ${searchResponse.matches[0].score}`);
      console.log(`🔍 Top match metadata keys: ${Object.keys(searchResponse.matches[0].metadata || {})}`);
    }

    // Process results and filter by minimum score
    const results: RecommendationSearchResult[] = [];
    
    if (searchResponse.matches) {
      for (const match of searchResponse.matches) {
        if (match.score && match.score >= minScore && match.metadata) {
          // Adapt to DSM-5 metadata structure - be flexible with field names
          const metadata = match.metadata;
          
          const recommendation: ClinicalRecommendation = {
            id: match.id,
            title: metadata.title || metadata.section || metadata.chapter || 'DSM-5 Content',
            description: metadata.description || metadata.summary || 'Clinical information from DSM-5',
            domain: metadata.domain || metadata.disorder || metadata.category || 'General',
            severity: metadata.severity || metadata.level || 'General',
            evidenceLevel: metadata.evidenceLevel || metadata.level || 'DSM-5',
            category: metadata.category || metadata.type || 'Diagnostic',
            content: metadata.content || metadata.text || metadata.chunk || '',
            keywords: metadata.keywords ? (metadata.keywords as string).split(',') : [],
            source: metadata.source || metadata.page || 'DSM-5',
            lastUpdated: metadata.lastUpdated || new Date().toISOString(),
            priority: metadata.priority as number || 5,
          };

          results.push({
            recommendation,
            score: match.score,
          });
        }
      }
    }

    // Sort by score (highest first) and then by priority
    results.sort((a, b) => {
      if (Math.abs(a.score - b.score) < 0.01) {
        return b.recommendation.priority - a.recommendation.priority;
      }
      return b.score - a.score;
    });

    return results;
  } catch (error) {
    console.error('Error searching clinical recommendations:', error);
    throw error;
  }
}

// Store a clinical recommendation in the vector database
export async function storeClinicalRecommendation(
  recommendation: ClinicalRecommendation
): Promise<void> {
  try {
    // Ensure index exists
    await ensureRecommendationsIndexExists();

    // Create searchable text from recommendation
    const searchableText = `
      ${recommendation.title}
      ${recommendation.description}
      ${recommendation.content}
      ${recommendation.keywords.join(' ')}
      Domain: ${recommendation.domain}
      Severity: ${recommendation.severity}
      Category: ${recommendation.category}
    `.trim();

    // Generate embedding
    const embedding = await generateEmbedding(searchableText);

    // Get the index and upsert the recommendation
    const index = await getRecommendationsIndex();
    
    await index.upsert([
      {
        id: recommendation.id,
        values: embedding,
        metadata: {
          title: recommendation.title,
          description: recommendation.description,
          domain: recommendation.domain,
          severity: recommendation.severity,
          evidenceLevel: recommendation.evidenceLevel,
          category: recommendation.category,
          content: recommendation.content,
          keywords: recommendation.keywords.join(','),
          source: recommendation.source,
          lastUpdated: recommendation.lastUpdated,
          priority: recommendation.priority,
        },
      },
    ]);

    console.log(`Stored clinical recommendation: ${recommendation.id}`);
  } catch (error) {
    console.error('Error storing clinical recommendation:', error);
    throw error;
  }
}

// Generate contextual recommendations based on assessment data from DSM-5
export async function generateContextualRecommendations(
  assessmentData: any
): Promise<RecommendationSearchResult[]> {
  try {
    // Extract key information from assessment data
    const domains = [];
    const severities = [];
    const scores = [];
    const conditions = [];

    // Handle different data structures
    if (assessmentData && typeof assessmentData === 'object') {
      // Handle assessment breakdown format
      Object.keys(assessmentData).forEach(key => {
        const assessment = assessmentData[key];
        if (assessment) {
          // Map assessment types to clinical conditions
          const conditionMapping = {
            'ptsd': 'PTSD Post-Traumatic Stress Disorder trauma',
            'phq': 'depression major depressive disorder mood',
            'gad': 'anxiety generalized anxiety disorder panic',
            'who': 'functional impairment disability',
            'ders': 'emotion regulation emotional dysregulation'
          };
          
          if (conditionMapping[key.toLowerCase()]) {
            conditions.push(conditionMapping[key.toLowerCase()]);
          }
          
          if (assessment.severity) severities.push(assessment.severity);
          if (assessment.total_score || assessment.score) {
            scores.push(assessment.total_score || assessment.score);
          }
        }
      });
    }

    // Build DSM-5 specific search queries
    const searchQueries = [];
    
    // Primary condition-based queries
    if (conditions.length > 0) {
      conditions.forEach(condition => {
        searchQueries.push(`${condition} diagnosis criteria treatment`);
        searchQueries.push(`${condition} differential diagnosis`);
        searchQueries.push(`${condition} clinical features symptoms`);
      });
    }

    // Severity-based queries
    if (severities.length > 0) {
      const uniqueSeverities = [...new Set(severities)];
      uniqueSeverities.forEach(severity => {
        searchQueries.push(`${severity} symptoms treatment intervention`);
      });
    }

    // Default queries if no specific data
    if (searchQueries.length === 0) {
      searchQueries.push('mental health disorder diagnosis treatment');
      searchQueries.push('clinical assessment psychological evaluation');
    }

    // Search DSM-5 with multiple queries
    const allRecommendations = [];
    
    for (const query of searchQueries.slice(0, 3)) { // Limit to first 3 queries to avoid too many API calls
      const results = await searchClinicalRecommendations(query, {
        topK: 5,
        minScore: 0.3, // Even lower threshold for DSM-5 content to get some results
      });
      allRecommendations.push(...results);
    }

    // Deduplicate results by ID
    const uniqueResults = allRecommendations.filter((result, index, array) => 
      array.findIndex(r => r.recommendation.id === result.recommendation.id) === index
    );

    // Sort by relevance score and limit to top 5
    uniqueResults.sort((a, b) => b.score - a.score);

    console.log(`🔍 Generated ${uniqueResults.length} DSM-5 recommendations from queries:`, searchQueries.slice(0, 3));
    
    return uniqueResults.slice(0, 5);
  } catch (error) {
    console.error('Error generating contextual recommendations from DSM-5:', error);
    return [];
  }
}