import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';
import { generateText } from "ai";
import { 
  getVectorizeClient,
  VectorizeSearchResult 
} from './vectorize-client';

// Re-export types for compatibility
export type ClinicalRecommendation = {
  id: string;
  title: string;
  description: string;
  domain: string;
  severity: string;
  evidenceLevel: string;
  category: string;
  content: string;
  keywords: string[];
  source: string;
  lastUpdated: string;
  priority: number;
};

export type RecommendationSearchResult = VectorizeSearchResult;

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

// Helper functions from vectorize-recommendations.ts
function extractActionableContent(text: string): string {
  const lowerContent = text.toLowerCase();
  
  if (lowerContent.includes('ptsd') || lowerContent.includes('trauma') || lowerContent.includes('posttraumatic')) {
    if (lowerContent.includes('severe') || lowerContent.includes('interpersonal')) {
      return `- Primary Intervention: Trauma-focused psychotherapy (CPT, PE, or EMDR)\n- Comorbidity Screening: Assess for depression, substance use, and anxiety disorders\n- Safety Planning: Implement comprehensive safety assessment for suicidal ideation\n- Advanced Options: Consider combination therapy for complex trauma presentations`;
    }
    return `- First-Line Treatment: Evidence-based trauma therapy (CPT, PE, or EMDR)\n- Screening: Assess for substance use and comorbid depression\n- Psychoeducation: Provide trauma response education to patient and family\n- Monitoring: Track symptom reduction using PCL-5 weekly`;
  }
  
  if (lowerContent.includes('depression') || lowerContent.includes('depressive') || lowerContent.includes('mood')) {
    if (lowerContent.includes('severe') || lowerContent.includes('major')) {
      return `- Medication: SSRI/SNRI as first-line pharmacotherapy\n- Psychotherapy: Implement CBT or IPT (2x weekly if severe)\n- Safety Assessment: Screen for suicidal ideation at each visit\n- Response Monitoring: Track PHQ-9 scores bi-weekly`;
    }
    return `- Initial Approach: CBT or interpersonal therapy\n- Medication: Consider if PHQ-9 > 10 or inadequate therapy response\n- Screening: Rule out bipolar spectrum disorders\n- Lifestyle: Address sleep hygiene and exercise`;
  }
  
  if (lowerContent.includes('anxiety') || lowerContent.includes('anxious') || lowerContent.includes('panic')) {
    return `- Psychotherapy: CBT with exposure therapy components\n- Medication: SSRI/SNRI for severe symptoms (GAD-7 > 15)\n- Skills Training: Relaxation techniques and mindfulness practices\n- Behavioral: Systematic approach to reduce avoidance patterns`;
  }
  
  if (lowerContent.includes('substance') || lowerContent.includes('alcohol') || lowerContent.includes('drug')) {
    return `- Assessment: Evaluate readiness to change (stages of change model)\n- Intervention: Motivational interviewing techniques\n- Relapse Prevention: CBT-based relapse prevention strategies\n- Level of Care: Assess need for detox or intensive outpatient treatment`;
  }
  
  if (lowerContent.includes('emotion') && lowerContent.includes('regulation')) {
    return `- Primary Treatment: DBT or emotion-focused therapy\n- Skills Modules: Distress tolerance and emotion regulation training\n- Mindfulness: Implement mindfulness-based interventions\n- Interpersonal: Address interpersonal effectiveness skills`;
  }
  
  if (lowerContent.includes('functional') || lowerContent.includes('disability') || lowerContent.includes('impairment')) {
    return `- Assessment: Comprehensive functional capacity evaluation\n- Intervention: Occupational therapy for daily living skills\n- Barriers: Identify and address functional limitations\n- Vocational: Consider work rehabilitation if appropriate`;
  }
  
  return `- Protocol: Apply evidence-based treatment for diagnosed condition\n- Monitoring: Regular symptom and functional assessment\n- Adjustment: Modify treatment based on response\n- Follow-up: Schedule regular review appointments`;
}

function generateActionableTitle(content: string, originalTitle?: string): string {
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes('ptsd') || lowerContent.includes('trauma')) {
    return 'PTSD Treatment Intervention';
  }
  if (lowerContent.includes('depression') || lowerContent.includes('depressive')) {
    return 'Depression Treatment Protocol';
  }
  if (lowerContent.includes('anxiety') || lowerContent.includes('anxious')) {
    return 'Anxiety Treatment Approach';
  }
  if (lowerContent.includes('emotion') && lowerContent.includes('regulation')) {
    return 'Emotion Regulation Therapy';
  }
  if (lowerContent.includes('functional') || lowerContent.includes('disability')) {
    return 'Functional Rehabilitation';
  }
  
  return originalTitle || 'Clinical Treatment Recommendation';
}

function determineDomain(content: string): string {
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes('ptsd') || lowerContent.includes('trauma')) return 'PTSD';
  if (lowerContent.includes('depression') || lowerContent.includes('depressive')) return 'Depression';
  if (lowerContent.includes('anxiety') || lowerContent.includes('anxious')) return 'Anxiety';
  if (lowerContent.includes('emotion') && lowerContent.includes('regulation')) return 'Emotion Regulation';
  if (lowerContent.includes('functional') || lowerContent.includes('disability')) return 'Functional';
  
  return 'Mental Health';
}

function determineCategory(content: string): string {
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes('psychotherapy') || lowerContent.includes('therapy')) return 'Psychotherapy';
  if (lowerContent.includes('medication') || lowerContent.includes('pharmacological')) return 'Pharmacotherapy';
  if (lowerContent.includes('intervention') || lowerContent.includes('treatment')) return 'Intervention';
  
  return 'Clinical Guidance';
}

function extractClinicalKeywords(text: string): string[] {
  const treatmentTerms = [
    'cognitive behavioral therapy', 'cbt', 'psychotherapy', 'exposure therapy',
    'emdr', 'dialectical behavior therapy', 'dbt', 'mindfulness', 'medication',
    'intervention', 'treatment', 'therapeutic', 'clinical'
  ];
  
  const keywords = [];
  const lowerText = text.toLowerCase();
  
  for (const term of treatmentTerms) {
    if (lowerText.includes(term)) {
      keywords.push(term);
    }
  }
  
  return keywords.slice(0, 8);
}

// Search using Vectorize instead of Pinecone
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
      minScore = 0.3,
    } = options;

    console.log(`🔍 Vectorize text search query: "${query}"`);

    // Get the Vectorize client
    const client = getVectorizeClient();

    // Perform text-based search
    const searchResponse = await client.search(query, {
      topK,
      filter: {},
      includeMetadata: true,
    });

    console.log(`🔍 Vectorize search response: ${searchResponse.matches?.length || 0} matches found`);
    if (searchResponse.matches && searchResponse.matches.length > 0) {
      console.log(`🔍 Top match score: ${searchResponse.matches[0].score}`);
    }

    // Process results
    const results: RecommendationSearchResult[] = [];
    
    if (searchResponse.matches) {
      for (const match of searchResponse.matches) {
        if (match.score && match.score >= minScore && match.metadata) {
          const metadata = match.metadata;
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

    // Sort by score
    results.sort((a, b) => b.score - a.score);

    return results;
  } catch (error) {
    console.error('Error searching clinical recommendations in Vectorize:', error);
    throw error;
  }
}

// Store a clinical recommendation in the vector database
export async function storeClinicalRecommendation(
  recommendation: ClinicalRecommendation
): Promise<void> {
  // This function is here for compatibility but uses Vectorize implementation
  console.log('storeClinicalRecommendation not implemented for Vectorize in this file');
}

// Generate contextual recommendations based on assessment data from DSM-5
export async function generateContextualRecommendations(
  assessmentData: any
): Promise<RecommendationSearchResult[]> {
  try {
    // Helper to safely stringify values
    function safeString(val: unknown): string {
      return (typeof val === 'string' || typeof val === 'number') ? String(val) : '';
    }
    
    // Build domain-specific data for each assessment
    const domainQueries: Array<{domain: string, severity: string, score: number, key: string}> = [];
    
    if (assessmentData && typeof assessmentData === 'object') {
      Object.keys(assessmentData).forEach(key => {
        const assessment = assessmentData[key];
        if (assessment) {
          let isRelevant = false;
          const priorityVal = safeString(assessment.priority).toLowerCase();
          const severityVal = safeString(assessment.severity).toLowerCase();
          const totalScoreVal = typeof assessment.total_score === 'number' ? assessment.total_score : (typeof assessment.score === 'number' ? assessment.score : 0);
          
          if (priorityVal) {
            isRelevant = ['high', 'medium'].includes(priorityVal);
          } else if (severityVal) {
            isRelevant = ['high', 'severe', 'severe impairment', 'moderate-high', 'medium', 'moderate'].some(s => severityVal.includes(s));
          } else if (totalScoreVal > 0) {
            isRelevant = true;
          }
          
          if (isRelevant) {
            const domainMap: Record<string, string> = {
              'ptsd': 'PTSD Post-Traumatic Stress Disorder trauma',
              'phq': 'Depression PHQ-9 depressive disorder mood',
              'gad': 'Anxiety GAD-7 generalized anxiety disorder worry',
              'who': 'Functional impairment disability WHO-DAS functioning',
              'ders': 'Emotion regulation difficulties emotional dysregulation'
            };
            
            const keyStr = safeString(key).toLowerCase();
            const domain = domainMap[keyStr] || keyStr;
            const severity = safeString(assessment.severity || '').toLowerCase();
            
            domainQueries.push({
              domain,
              severity,
              score: totalScoreVal,
              key: keyStr
            });
          }
        }
      });
    }
    
    // Generate per-domain queries for better coverage
    const allResults: RecommendationSearchResult[] = [];
    const uniqueIds = new Set<string>();
    
    console.log(`🔍 Generating recommendations for ${domainQueries.length} domains:`, domainQueries.map(d => d.key));
    
    for (const domainData of domainQueries) {
      // Create specific queries for each domain
      const queries: string[] = [];
      
      // Base domain-specific query
      queries.push(`${domainData.domain} ${domainData.severity} treatment intervention`);
      
      // Add specific query types based on domain
      if (domainData.key === 'ptsd') {
        queries.push(`PTSD Post-Traumatic Stress Disorder trauma therapy intervention psychotherapy CBT`);
        queries.push(`PTSD Post-Traumatic Stress Disorder trauma medication pharmacotherapy treatment protocol`);
      } else if (domainData.key === 'gad') {
        queries.push(`Anxiety GAD-7 generalized anxiety disorder therapy intervention CBT relaxation`);
        queries.push(`Anxiety disorder medication anxiolytic treatment protocol management`);
      } else if (domainData.key === 'phq') {
        queries.push(`Depression PHQ-9 major depressive disorder therapy intervention CBT antidepressant`);
        queries.push(`Depression treatment medication SSRI therapy protocol mood disorder`);
      } else if (domainData.key === 'who') {
        queries.push(`Functional impairment disability rehabilitation occupational therapy intervention`);
        queries.push(`WHO-DAS functional assessment disability support treatment planning`);
      } else if (domainData.key === 'ders') {
        queries.push(`Emotion regulation DBT dialectical behavior therapy emotional dysregulation`);
        queries.push(`Emotion regulation skills training mindfulness distress tolerance intervention`);
      }
      
      // Try LLM-generated query as well
      try {
        const prompt = `Generate a specific clinical search query for ${domainData.domain} with ${domainData.severity} severity (score: ${domainData.score}). Focus on evidence-based treatments and interventions.`;
        const llmResult = await generateText({
          model: openai("gpt-4o"),
          messages: [
            { role: "system", content: "You are a clinical decision support assistant. Generate concise search queries for clinical recommendations." },
            { role: "user", content: prompt }
          ],
          maxTokens: 60,
          temperature: 0.2,
        });
        const llmQuery = llmResult.text.trim();
        if (llmQuery) {
          queries.push(llmQuery);
        }
      } catch (e) {
        console.log(`LLM query generation failed for ${domainData.key}, using defaults`);
      }
      
      // Search with each query and collect unique results
      for (const query of queries) {
        console.log(`🔍 Searching for ${domainData.key}: "${query}"`);
        const results = await searchClinicalRecommendations(query, {
          topK: 5,
          minScore: 0.3,
        });
        
        // Add unique results
        for (const result of results) {
          if (!uniqueIds.has(result.recommendation.id)) {
            uniqueIds.add(result.recommendation.id);
            allResults.push(result);
          }
        }
      }
    }
    
    console.log(`📊 Total unique recommendations found: ${allResults.length}`);
    
    // Sort by relevance score and return top results
    allResults.sort((a, b) => b.score - a.score);
    
    // Limit to top 10 to avoid overwhelming the report
    return allResults.slice(0, 10);
  } catch (error) {
    console.error('Error generating contextual recommendations from DSM-5:', error);
    return [];
  }
}