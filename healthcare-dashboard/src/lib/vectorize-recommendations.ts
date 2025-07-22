import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';
import { 
  getVectorizeClient, 
  ClinicalRecommendation, 
  VectorizeSearchResult,
  VectorizeVector 
} from './vectorize-client';

// Extract actionable content from DSM-5 text
function extractActionableContent(text: string): string {
  const lowerContent = text.toLowerCase();
  
  // Since DSM-5 contains mainly diagnostic criteria, convert to actionable clinical guidance
  if (lowerContent.includes('ptsd') || lowerContent.includes('trauma') || lowerContent.includes('posttraumatic')) {
    if (lowerContent.includes('severe') || lowerContent.includes('interpersonal')) {
      return 'Consider trauma-focused psychotherapy (CPT, PE, EMDR). Assess for comorbid conditions. Implement safety planning for severe presentations. Consider combination therapy for complex trauma cases.';
    }
    return 'Initiate evidence-based trauma therapy (Cognitive Processing Therapy, Prolonged Exposure, or EMDR). Screen for substance use and depression. Provide psychoeducation about trauma responses.';
  }
  
  if (lowerContent.includes('depression') || lowerContent.includes('depressive') || lowerContent.includes('mood')) {
    if (lowerContent.includes('severe') || lowerContent.includes('major')) {
      return 'Consider antidepressant medication (SSRI/SNRI first-line). Implement CBT or IPT. Assess suicide risk. Monitor treatment response closely.';
    }
    return 'Initiate cognitive behavioral therapy or interpersonal therapy. Consider medication if moderate-severe. Assess for bipolar spectrum disorders.';
  }
  
  if (lowerContent.includes('anxiety') || lowerContent.includes('anxious') || lowerContent.includes('panic')) {
    return 'Implement CBT with exposure therapy components. Consider SSRI/SNRI if severe. Teach relaxation and mindfulness techniques. Address avoidance behaviors.';
  }
  
  if (lowerContent.includes('substance') || lowerContent.includes('alcohol') || lowerContent.includes('drug')) {
    return 'Assess readiness to change. Consider motivational interviewing. Implement cognitive behavioral relapse prevention. Evaluate need for detoxification or intensive treatment.';
  }
  
  if (lowerContent.includes('medication') || lowerContent.includes('drug') || lowerContent.includes('pharmacological')) {
    return 'Follow evidence-based prescribing guidelines. Monitor for side effects and drug interactions. Assess treatment adherence. Consider combination with psychotherapy.';
  }
  
  // For diagnostic content, provide general clinical guidance
  if (lowerContent.includes('criteria') || lowerContent.includes('diagnosis') || lowerContent.includes('symptoms')) {
    return 'Conduct comprehensive diagnostic assessment using structured interviews. Evaluate functional impairment. Screen for comorbid conditions. Develop individualized treatment plan based on severity and patient preferences.';
  }
  
  // Fallback: extract meaningful clinical information
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const clinicalSentence = sentences.find(s => 
    s.toLowerCase().includes('treatment') || 
    s.toLowerCase().includes('therapy') || 
    s.toLowerCase().includes('intervention')
  );
  
  return clinicalSentence?.trim() || 'Apply evidence-based treatment protocols appropriate for diagnosed condition. Monitor symptoms and functional improvement regularly.';
}

// Generate actionable titles from DSM-5 content
function generateActionableTitle(content: string, originalTitle?: string): string {
  const lowerContent = content.toLowerCase();
  
  // Look for specific therapy types or treatments
  if (lowerContent.includes('cognitive behavioral') || lowerContent.includes('cbt')) {
    return 'Cognitive Behavioral Therapy Approach';
  }
  if (lowerContent.includes('psychotherapy') || lowerContent.includes('talk therapy')) {
    return 'Psychotherapy Treatment Protocol';
  }
  if (lowerContent.includes('medication') || lowerContent.includes('pharmacotherapy')) {
    return 'Pharmacological Treatment Options';
  }
  if (lowerContent.includes('exposure') && lowerContent.includes('therapy')) {
    return 'Exposure Therapy Intervention';
  }
  if (lowerContent.includes('group therapy') || lowerContent.includes('group treatment')) {
    return 'Group Therapy Approach';
  }
  if (lowerContent.includes('family therapy') || lowerContent.includes('family intervention')) {
    return 'Family-Based Treatment';
  }
  
  // Default to condition-specific treatment
  if (lowerContent.includes('ptsd') || lowerContent.includes('trauma')) {
    return 'PTSD Treatment Intervention';
  }
  if (lowerContent.includes('depression') || lowerContent.includes('depressive')) {
    return 'Depression Treatment Protocol';
  }
  if (lowerContent.includes('anxiety') || lowerContent.includes('anxious')) {
    return 'Anxiety Treatment Approach';
  }
  
  return originalTitle || 'Clinical Treatment Recommendation';
}

// Determine clinical domain from content
function determineDomain(content: string): string {
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes('ptsd') || lowerContent.includes('trauma') || lowerContent.includes('posttraumatic')) {
    return 'PTSD';
  }
  if (lowerContent.includes('depression') || lowerContent.includes('depressive') || lowerContent.includes('major depressive')) {
    return 'Depression';
  }
  if (lowerContent.includes('anxiety') || lowerContent.includes('anxious') || lowerContent.includes('generalized anxiety')) {
    return 'Anxiety';
  }
  if (lowerContent.includes('bipolar') || lowerContent.includes('manic')) {
    return 'Bipolar';
  }
  if (lowerContent.includes('substance') || lowerContent.includes('addiction') || lowerContent.includes('alcohol')) {
    return 'Substance Use';
  }
  
  return 'Mental Health';
}

// Determine treatment category from content
function determineCategory(content: string): string {
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes('psychotherapy') || lowerContent.includes('therapy') || lowerContent.includes('counseling')) {
    return 'Psychotherapy';
  }
  if (lowerContent.includes('medication') || lowerContent.includes('drug') || lowerContent.includes('pharmacological')) {
    return 'Pharmacotherapy';
  }
  if (lowerContent.includes('assessment') || lowerContent.includes('evaluation') || lowerContent.includes('testing')) {
    return 'Assessment';
  }
  if (lowerContent.includes('intervention') || lowerContent.includes('treatment')) {
    return 'Intervention';
  }
  
  return 'Clinical Guidance';
}

// Extract clinical keywords with treatment focus
function extractClinicalKeywords(text: string): string[] {
  const treatmentTerms = [
    'cognitive behavioral therapy', 'cbt', 'psychotherapy', 'exposure therapy',
    'emdr', 'dialectical behavior therapy', 'dbt', 'acceptance commitment therapy',
    'mindfulness', 'medication', 'antidepressant', 'anxiolytic', 'therapy',
    'intervention', 'treatment', 'therapeutic', 'clinical', 'evidence-based',
    'protocol', 'approach', 'technique', 'strategy', 'management'
  ];
  
  const keywords = [];
  const lowerText = text.toLowerCase();
  
  for (const term of treatmentTerms) {
    if (lowerText.includes(term)) {
      keywords.push(term);
    }
  }
  
  return keywords.slice(0, 8); // Limit to 8 treatment-focused keywords
}

// Legacy function for backward compatibility
function extractKeywords(text: string): string[] {
  return extractClinicalKeywords(text);
}

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

// Search for relevant clinical recommendations using Vectorize
export async function searchClinicalRecommendations(
  query: string,
  options: {
    topK?: number;
    minScore?: number;
    domain?: string;
    severity?: string;
    category?: string;
  } = {}
): Promise<VectorizeSearchResult[]> {
  try {
    const {
      topK = 5,
      minScore = 0.3,
      domain,
      severity,
      category
    } = options;

    console.log(`🔍 Vectorize text search query: "${query}"`);

    // Get the Vectorize client
    const client = getVectorizeClient();

    // Perform text-based search using Vectorize's question-based retrieval
    const searchResponse = await client.search(query, {
      topK,
      filter: {},
      includeMetadata: true,
    });

    console.log(`🔍 Vectorize search response: ${searchResponse.matches?.length || 0} matches found`);
    if (searchResponse.matches && searchResponse.matches.length > 0) {
      console.log(`🔍 Top match score: ${searchResponse.matches[0].score}`);
      console.log(`🔍 Sample content: ${searchResponse.matches[0].metadata?.content?.substring(0, 100)}...`);
    }

    // Process results and filter by minimum score
    const results: VectorizeSearchResult[] = [];
    
    if (searchResponse.matches) {
      for (const match of searchResponse.matches) {
        if (match.score && match.score >= minScore && match.metadata) {
          // Use the structured metadata from our Vectorize client
          const metadata = match.metadata;
          
          // Extract actionable content from DSM-5 text
          const content = metadata.content || '';
          const actionableContent = extractActionableContent(content);
          
          const recommendation: ClinicalRecommendation = {
            id: match.id,
            title: generateActionableTitle(content, metadata.title),
            description: `Evidence-based clinical guidance (Relevance: ${(match.score * 100).toFixed(1)}%)`,
            domain: determineDomain(content),
            severity: metadata.severity || 'General',
            evidenceLevel: 'DSM-5',
            category: determineCategory(content),
            content: actionableContent,
            keywords: extractClinicalKeywords(content),
            source: metadata.source || 'DSM-5',
            lastUpdated: new Date().toISOString(),
            priority: Math.round(match.score * 10),
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
    console.error('Error searching clinical recommendations in Vectorize:', error);
    throw error;
  }
}

// Store a clinical recommendation in Vectorize
export async function storeClinicalRecommendation(
  recommendation: ClinicalRecommendation
): Promise<void> {
  try {
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

    // Get the Vectorize client
    const client = getVectorizeClient();
    
    // Prepare vector data
    const vector: VectorizeVector = {
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
    };

    await client.upsertVectors([vector]);
    console.log(`✅ Stored clinical recommendation in Vectorize: ${recommendation.id}`);
  } catch (error) {
    console.error('Error storing clinical recommendation in Vectorize:', error);
    throw error;
  }
}

// Generate contextual recommendations based on assessment data
export async function generateContextualRecommendations(
  assessmentData: any
): Promise<VectorizeSearchResult[]> {
  try {
    // Extract key information from assessment data
    const conditions = [];
    const severities = [];
    const scores = [];

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

    // Build clinical search queries
    const searchQueries = [];
    
    // Primary condition-based queries focused on actionable treatments
    if (conditions.length > 0) {
      conditions.forEach(condition => {
        searchQueries.push(`${condition} therapy intervention psychotherapy CBT`);
        searchQueries.push(`${condition} medication pharmacotherapy treatment protocol`);
        searchQueries.push(`${condition} therapeutic techniques clinical intervention`);
        searchQueries.push(`${condition} treatment goals recovery plan`);
      });
    }

    // Severity-based queries focused on treatment intensity
    if (severities.length > 0) {
      const uniqueSeverities = [...new Set(severities)];
      uniqueSeverities.forEach(severity => {
        searchQueries.push(`${severity} level treatment intensity therapy frequency`);
        searchQueries.push(`${severity} symptoms intervention strategies clinical approach`);
      });
    }

    // Default queries focused on evidence-based interventions
    if (searchQueries.length === 0) {
      searchQueries.push('evidence-based psychotherapy cognitive behavioral therapy');
      searchQueries.push('clinical intervention therapeutic techniques treatment modalities');
      searchQueries.push('mental health treatment protocols therapy guidelines');
    }

    // Search with multiple queries
    const allRecommendations = [];
    
    for (const query of searchQueries.slice(0, 3)) { // Limit to first 3 queries
      const results = await searchClinicalRecommendations(query, {
        topK: 5,
        minScore: 0.6, // Reasonable threshold for quality results
      });
      allRecommendations.push(...results);
    }

    // Deduplicate results by ID
    const uniqueResults = allRecommendations.filter((result, index, array) => 
      array.findIndex(r => r.recommendation.id === result.recommendation.id) === index
    );

    // Sort by relevance score and limit to top 5
    uniqueResults.sort((a, b) => b.score - a.score);

    console.log(`🔍 Generated ${uniqueResults.length} clinical recommendations from Vectorize queries:`, searchQueries.slice(0, 3));
    
    return uniqueResults.slice(0, 5);
  } catch (error) {
    console.error('Error generating contextual recommendations from Vectorize:', error);
    return [];
  }
}

// Initialize Vectorize index with clinical recommendations
export async function initializeVectorizeIndex(): Promise<void> {
  try {
    const client = getVectorizeClient();
    
    // Try to get index info to check if it exists
    try {
      const indexInfo = await client.getIndexInfo();
      console.log('✅ Vectorize index already exists:', indexInfo.result?.name);
    } catch (error) {
      // Index doesn't exist, create it
      console.log('📝 Creating new Vectorize index...');
      await client.createIndex(1536); // OpenAI embedding dimension
    }
  } catch (error) {
    console.error('Error initializing Vectorize index:', error);
    throw error;
  }
}