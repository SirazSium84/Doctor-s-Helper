import { openai } from '@ai-sdk/openai';
import { streamText, convertToCoreMessages } from 'ai';
import { z } from 'zod';
import { mcpClient } from '@/lib/mcp-client';

// Tool schemas matching your MCP server
const mcpTools = {
  get_patient_ptsd_scores: z.object({
    patient_id: z.string().describe('Patient ID to get PTSD scores for')
  }),
  get_patient_phq_scores: z.object({
    patient_id: z.string().describe('Patient ID to get PHQ-9 scores for')
  }),
  get_patient_gad_scores: z.object({
    patient_id: z.string().describe('Patient ID to get GAD-7 scores for')
  }),
  get_patient_who_scores: z.object({
    patient_id: z.string().describe('Patient ID to get WHO-5 scores for')
  }),
  get_patient_ders_scores: z.object({
    patient_id: z.string().describe('Patient ID to get DERS scores for')
  }),
  get_all_patient_assessments: z.object({
    patient_id: z.string().describe('Patient ID to get all assessments for')
  }),
  list_all_patients: z.object({
    limit: z.number().optional().describe('Limit number of patients returned')
  }),
  get_assessment_summary_stats: z.object({
    assessment_type: z.string().describe('Type of assessment (ptsd, phq, gad, who, ders)')
  }),
  analyze_patient_progress: z.object({
    patient_id: z.string().describe('Patient ID to analyze progress for')
  }),
  calculate_composite_risk_score: z.object({
    patient_id: z.string().describe('Patient ID to calculate risk score for')
  }),
  compare_patient_to_population: z.object({
    patient_id: z.string().describe('Patient ID to compare to population')
  }),
  identify_patients_needing_attention: z.object({
    risk_threshold: z.number().optional().describe('Risk threshold for identification')
  }),
  get_patient_substance_history: z.object({
    patient_id: z.string().describe('Patient ID to get substance history for')
  }),
  analyze_substance_patterns_across_patients: z.object({
    limit: z.number().optional().describe('Limit number of patients to analyze')
  }),
  get_high_risk_substance_users: z.object({
    risk_level: z.string().optional().describe('Risk level filter (high, medium, low)')
  })
};

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Check MCP server health
    await mcpClient.checkServerHealth();

    const result = await streamText({
      model: openai('gpt-4o-mini'),
      messages: convertToCoreMessages(messages),
      system: `You are a healthcare analytics assistant with access to a comprehensive MCP server for healthcare data.
      
      You have access to the following healthcare data tools:
      - Patient assessment scores (PTSD, PHQ-9, GAD-7, WHO-5, DERS)
      - Patient substance use history and patterns
      - Risk assessment and population comparison tools
      - Patient progress analysis
      
      When users ask about patient data, assessments, or analytics, use the appropriate tools to get real data.
      Always provide helpful, accurate, and professional responses about healthcare data.
      
      Key assessment thresholds:
      - PHQ-9: 0-4 minimal, 5-9 mild, 10-14 moderate, 15-19 moderately severe, 20-27 severe
      - GAD-7: 0-4 minimal, 5-9 mild, 10-14 moderate, 15-21 severe
      - WHO-5: 0-13 poor wellbeing, 14-17 below average, 18+ good wellbeing
      - PTSD: Higher scores indicate more severe symptoms
      - DERS: Higher scores indicate greater emotion regulation difficulties

      Available patient IDs for testing: PT001, PT002, PT003, PT004, PT005
      
      When presenting data, format it clearly and provide context about what the scores mean.`,
      tools: Object.keys(mcpTools).reduce((acc, toolName) => {
        acc[toolName] = {
          description: `Call ${toolName} from the healthcare MCP server`,
          parameters: mcpTools[toolName as keyof typeof mcpTools],
          execute: async (parameters: any) => {
            const response = await mcpClient.callTool(toolName, parameters);
            if (!response.success) {
              throw new Error(response.error || 'MCP tool call failed');
            }
            return response.data;
          }
        };
        return acc;
      }, {} as any),
      maxToolRoundtrips: 3,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
} 