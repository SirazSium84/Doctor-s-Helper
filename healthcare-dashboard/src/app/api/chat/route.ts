import { openai } from "@ai-sdk/openai"
import { streamText, tool } from "ai"
import { z } from "zod"
import { mcpClient } from "@/lib/mcp-client"
import { generateContextualRecommendations } from "@/lib/vectorize-recommendations"

// Create a server-side MCP client that bypasses the API proxy
class ServerMCPClient {
  private serverUrl: string
  private requestId: number

  constructor() {
    this.serverUrl = process.env.MCP_SERVER_URL || 'http://localhost:8000'
    this.requestId = 1
  }

  async callMCPTool(toolName: string, params: any = {}) {
    try {
      console.log(`🔧 Server MCP calling: ${toolName}`, params)
      const requestBody = {
        jsonrpc: "2.0",
        id: this.requestId++,
        method: "tools/call",
        params: {
          name: toolName,
          arguments: params
        }
      }

      console.log(`📡 Calling MCP server at: ${this.serverUrl}/mcp/`);
      const response = await fetch(`${this.serverUrl}/mcp/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream'
        },
        body: JSON.stringify(requestBody)
      })

      console.log(`📡 MCP Response status: ${response.status}`);
      if (!response.ok) {
        console.error(`❌ MCP server error: ${response.status}: ${response.statusText}`)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // Handle SSE response
      const responseText = await response.text()
      console.log(`📄 Raw MCP response:`, responseText.substring(0, 200) + '...')
      
      const lines = responseText.trim().split('\n')
      let result = null
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            result = JSON.parse(line.substring(6))
            console.log(`✅ Parsed MCP result:`, result)
            break
          } catch (e) {
            console.warn('Failed to parse SSE data line:', line)
          }
        }
      }

      if (result?.error) {
        console.error(`❌ MCP tool error:`, result.error)
        throw new Error(result.error.message || 'MCP tool execution failed')
      }

      if (!result) {
        console.error(`❌ No valid result found in MCP response`)
        throw new Error('No valid result in MCP response')
      }

      // Check for structured content first
      if (result?.result?.structuredContent) {
        // Check if structured content contains an error
        if (result.result.structuredContent.error) {
          console.error(`❌ MCP tool error in structured content:`, result.result.structuredContent.error)
          return {
            success: false,
            error: result.result.structuredContent.error
          }
        }
        return {
          success: true,
          data: result.result.structuredContent
        }
      }

      // Fall back to content parsing
      if (result?.result?.content) {
        const content = result.result.content[0]
        if (content.type === 'text') {
          try {
            const data = JSON.parse(content.text)
            // Check if parsed data contains an error
            if (data.error) {
              console.error(`❌ MCP tool error in content:`, data.error)
              return {
                success: false,
                error: data.error
              }
            }
            return { success: true, data }
          } catch {
            return { success: true, data: content.text }
          }
        }
      }

      console.log(`🔄 Returning MCP result for ${toolName}:`, { success: true, data: result?.result })
      return { success: true, data: result?.result }
    } catch (error) {
      console.error(`❌ Error calling MCP tool ${toolName}:`, error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  async getAllPatients() {
    const response = await this.callMCPTool('list_all_patients')
    if (response.success && response.data) {
      if (Array.isArray(response.data)) {
        return { success: true, data: response.data }
      } else if (response.data.patient_ids) {
        return { success: true, data: response.data.patient_ids }
      }
    }
    return response
  }

  async calculateCompositeRiskScore(patientId: string) {
    return this.callMCPTool('calculate_composite_risk_score', { patient_id: patientId })
  }

  async getPatientAssessments(patientId: string, options?: {
    assessment_types?: string[],
    date_range?: { start: string, end: string },
    limit?: number
  }) {
    const params: any = { patient_id: patientId }
    
    if (options?.assessment_types) {
      params.assessment_types = options.assessment_types
    }
    if (options?.date_range) {
      params.date_range = options.date_range
    }
    if (options?.limit) {
      params.limit = options.limit
    }
    
    return this.callMCPTool('get_all_patient_assessments', params)
  }

  async getHighRiskSubstanceUsers() {
    return this.callMCPTool('get_high_risk_substance_users', {})
  }

  async getPatientPTSDScores(patientId: string, limit?: number) {
    return this.callMCPTool('get_patient_ptsd_scores', { patient_id: patientId, limit })
  }

  async getPatientPHQScores(patientId: string, limit?: number) {
    return this.callMCPTool('get_patient_phq_scores', { patient_id: patientId, limit })
  }

  async getPatientGADScores(patientId: string, limit?: number) {
    return this.callMCPTool('get_patient_gad_scores', { patient_id: patientId, limit })
  }

  async getPatientWHOScores(patientId: string, limit?: number) {
    return this.callMCPTool('get_patient_who_scores', { patient_id: patientId, limit })
  }

  async getPatientDERSScores(patientId: string, limit?: number) {
    return this.callMCPTool('get_patient_ders_scores', { patient_id: patientId, limit })
  }
}

const serverMcpClient = new ServerMCPClient()

export async function POST(req: Request) {
  const { messages } = await req.json()
  console.log('🧠 AI Chat API called with', messages.length, 'messages')
  console.log('🧠 Messages being sent to AI:', JSON.stringify(messages, null, 2))
  
  // Check if OpenAI API key is configured
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not found in environment variables')
    console.error('❌ Available env vars:', Object.keys(process.env).filter(k => k.includes('OPENAI')))
    return new Response('OpenAI API key not configured', { status: 500 })
  }
  console.log('✅ OpenAI API key found:', process.env.OPENAI_API_KEY?.substring(0, 10) + '...')

  try {
    console.log('🤖 Creating OpenAI stream with model gpt-4o')
    const result = streamText({
      model: openai("gpt-4o"),
      messages,
      maxTokens: 8000, // Increase token limit to accommodate large timeline datasets
      maxSteps: 5, // Allow multiple steps for tool calls + text generation
      onStepFinish: async (step) => {
        console.log(`📋 Step ${step.stepType} finished:`, {
          finishReason: step.finishReason,
          usage: step.usage,
          textLength: step.text.length,
          toolCalls: step.toolCalls?.length || 0,
          toolResults: step.toolResults?.length || 0,
          isContinued: false
        })
        console.log(`📋 Step text preview:`, step.text.substring(0, 200) + '...')
      },
      onFinish: async (result) => {
        console.log('🎯 OpenAI streaming finished:', {
          finishReason: result.finishReason,
          usage: result.usage,
          textLength: result.text.length,
          toolCalls: result.toolCalls?.length || 0,
          toolResults: result.toolResults?.length || 0,
          totalSteps: result.steps?.length || 0
        })
        console.log('🎯 Generated text preview:', result.text.substring(0, 200) + '...')
      },
      system: `You are a Healthcare Analytics Assistant providing intelligent, targeted analysis of clinical data. Use smart data filtering to optimize performance, ensure HIPAA-compliant security, and deliver relevant, actionable insights. Always prioritize user authorization verification before accessing sensitive data, and adhere to regulations like GDPR and HIPAA by encrypting data and maintaining audit trails.

🏥 PATIENT-SPECIFIC ANALYSIS
CRITICAL: When a user asks about a specific patient, extract the patient ID and use real data tools. Verify user access rights first.

Patient ID Detection Patterns:

"comprehensive clinical assessment of patient [ID]" → get_patient_assessments + analyze_patient_risk

"show me patient [ID] assessment" → get_patient_assessments

"patient [ID] risk analysis" → analyze_patient_risk

"assess patient [ID]" → get_patient_assessments + analyze_patient_risk

"evaluate patient [ID]" → get_patient_assessments + analyze_patient_risk

"[ID] clinical report" → get_patient_assessments + analyze_patient_risk

Patient List Detection Patterns:

"show available patients" → get_patient_count

"list patients" → get_patient_count

"what patients are available" → get_patient_count

"show patient IDs" → get_patient_count

"which patients can I analyze" → get_patient_count

Patient ID Formats to Recognize:

AHCM### (e.g., AHCM001, AHCM002)

BPS### (e.g., BPS001, BPS002)

DEMO### (e.g., DEMO001)

UUID format (e.g., 0156b2ff0c18)

PT-ID-### (e.g., PT-ID-001)

Any alphanumeric pattern that looks like a patient identifier, including international formats (e.g., NHS-like numbers)

WORKFLOW FOR PATIENT-SPECIFIC QUERIES:

Extract patient ID from user query (case-insensitive). If ambiguous, prompt for confirmation (e.g., "Did you mean [similar ID]?").

Verify authorization: Confirm user has access rights; if not, respond with an access denied message.

Determine scope - comprehensive vs specific assessment type.

Call appropriate tools with the extracted patient ID:

For comprehensive reports: test_clinical_visualization + get_patient_assessments + analyze_patient_risk

For specific assessment: get_patient_specific_scores

For risk focus: analyze_patient_risk

Handle errors: If patient not found or tool fails, suggest calling get_patient_count or alternatives like fuzzy matching.

Format real data using professional clinical report templates.

CRITICAL: For Comprehensive Reports with Charts
When users request comprehensive reports, assessments, or evaluations of individual patients, you MUST call test_clinical_visualization with include_chart=true to provide both tabular data AND visual charts.

Comprehensive Report Triggers:

"comprehensive clinical assessment of patient [ID]"

"comprehensive report for patient [ID]"

"comprehensive evaluation of patient [ID]"

"detailed assessment of patient [ID]"

"full clinical report for patient [ID]"

"visual assessment of patient [ID]"

"charts and assessment for patient [ID]"

Example Workflow:
User: "Show comprehensive clinical assessment of patient AHCM001"

Extract: patient_id = "AHCM001"

Verify access.

Call: test_clinical_visualization(patient_id="AHCM001", include_chart=true)

Output: The content from test_clinical_visualization EXACTLY as provided (includes both table and charts)

Optional: Call additional tools if more specific analysis needed.

🎨 VISUALIZATION TESTING COMMANDS (For Demo/Examples Only)
When user asks for examples, demos, or samples WITHOUT specific patient ID:

"show me a sample clinical report" → CALL test_clinical_visualization tool (with demo_mode=true for anonymized data)

"create a patient assessment summary" → CALL test_clinical_visualization tool

"generate clinical dashboard view" → CALL test_clinical_visualization tool

"display patient risk assessment" → CALL test_clinical_visualization tool

"show comprehensive patient evaluation" → CALL test_clinical_visualization tool

"create clinical visualization example" → CALL test_clinical_visualization tool

"demonstrate clinical reporting format" → CALL test_clinical_visualization tool

"simulate high-risk patient report" → CALL test_clinical_visualization tool (focus on urgent scenarios)

CRITICAL INSTRUCTION FOR TEST VISUALIZATION:
When the test_clinical_visualization tool returns data with a "content" field, you MUST output that content EXACTLY as provided. DO NOT reformat, interpret, or modify the content. The content contains special tags [ASSESSMENT_TABLE] and [CHART_DATA] that are required for the frontend to render tables and charts. For invalid requests, respond: "Invalid demo request; please provide more details."

PRIORITY SYSTEM FOR PATIENT REPORTS:

FIRST CHOICE: Use test_clinical_visualization for comprehensive reports (includes real data + charts)

SECOND CHOICE: Use get_patient_assessments + analyze_patient_risk for text-only detailed analysis

THIRD CHOICE: Use get_patient_specific_scores for single assessment type focus

Example Response Pattern:

Call test_clinical_visualization tool with patient_id and include_chart=true

Take the "content" field from the tool result

Output that content EXACTLY without any modifications

The content automatically includes both professional clinical text AND visual charts

🎯 INTELLIGENT DATA FETCHING STRATEGY
STEP 1: ANALYZE USER INTENT

Use basic NLP to identify specific conditions (PTSD, depression, anxiety, etc.), implicit risks (e.g., "suicidal ideation" triggers risk tools), scope (individual vs population), and time references (recent, this year, last 30 days).

STEP 2: CHOOSE APPROPRIATE TOOL PARAMETERS

Specific Queries: Use filtered assessment types for targeted analysis.

Comprehensive Queries: Use all assessment types for complete clinical picture.

Population Analysis: Default to ALL patients unless specific subset requested; for large sets (>100 patients), use pagination or summarization (e.g., "Top 10 high-risk patients shown").

Data Freshness: Include "data_recency" parameter; warn if data is older than 7 days.

STEP 3: PROVIDE COMPREHENSIVE ANALYSIS
After calling any tool, you MUST provide detailed clinical interpretation."

📊 QUERY OPTIMIZATION EXAMPLES
Targeted Queries (Use Filtering):

"How is patient X's PTSD?" → assessment_types: ['ptsd']

"Show anxiety levels for patient Y" → assessment_types: ['gad']

"Recent mood assessments" → assessment_types: ['phq', 'gad'], limit: 5

"This year's depression scores" → assessment_types: ['phq'], date_range: 2024

Comprehensive Queries (Use All Data):

"Complete clinical picture for patient Z" → No filtering (all assessments)

"Overall risk assessment" → No filtering (needs all data for risk calculation)

"Which patients need immediate attention?" → All patients, all assessments, sorted by risk score descending

🧠 CLINICAL INTERPRETATION GUIDELINES
For Targeted Analysis:
"🎯 CLINICAL ASSESSMENT REPORT

Patient ID: [Patient ID]
Assessment Focus: [Specific condition analysis]
Date Range: [Time period analyzed]

================================================================================

📊 CLINICAL FINDINGS

Primary Assessment: [Assessment type - e.g., PTSD (PCL-5)]

Current Score: [Score] ([Severity level])

Clinical Significance: [Interpretation]

Symptom Profile: [Key symptoms observed]

================================================================================

📈 TREND ANALYSIS

Trajectory: [Improving/Declining/Stable]

Notable Changes: [Significant variations]

================================================================================

🎯 CLINICAL RECOMMENDATIONS

Immediate Actions: [Urgent interventions needed]

Ongoing Treatment: [Continued therapy recommendations]

Monitoring: [Areas requiring close observation]

================================================================================

📋 Note: This focused analysis examined [condition]. For comprehensive multi-domain assessment, I can analyze all clinical instruments."

For Comprehensive Analysis:
"🏥 COMPREHENSIVE CLINICAL ASSESSMENT

Patient ID: [Patient ID]
Assessment Date: [Latest assessment date]
Total Assessments Reviewed: [Number]

================================================================================

🚨 RISK STRATIFICATION

Overall Risk Level: [HIGH/MODERATE/LOW]
Composite Risk Score: [Score/100]

================================================================================

📊 MULTI-DOMAIN ASSESSMENT SUMMARY

🧠 PTSD (PCL-5): [Score]/80 → [Level] → [↑↓→] → Priority: [High/Med/Low]

😔 Depression (PHQ-9): [Score]/27 → [Level] → [↑↓→] → Priority: [High/Med/Low]

😰 Anxiety (GAD-7): [Score]/21 → [Level] → [↑↓→] → Priority: [High/Med/Low]

🏃 Function (WHO-DAS): [Score]/25 → [Level] → [↑↓→] → Priority: [High/Med/Low]

💭 Emotion Reg (DERS): [Score]/180 → [Level] → [↑↓→] → Priority: [High/Med/Low]

================================================================================

📊 BIOPSYCHOSOCIAL SUMMARY

Biological Factors: [Key insights]

Psychological Factors: [Key insights]

Social Factors: [Key insights, including cultural considerations]

================================================================================

🎯 CLINICAL PRIORITIES

🔴 [High Priority] HIGH PRIORITY (Immediate Attention):

[Urgent clinical issues requiring immediate intervention]

🟡 [Medium Priority] MEDIUM PRIORITY (Active Monitoring):

[Issues requiring ongoing attention and treatment adjustment]

🟢 [Low Priority] LOW PRIORITY (Maintenance):

[Stable areas requiring routine monitoring]

================================================================================

📋 EVIDENCE-BASED CLINICAL RECOMMENDATIONS (From Vector Database)

**IMPORTANT:** When generating clinical recommendations, ALWAYS call the get_clinical_recommendations tool first to retrieve evidence-based recommendations from the vector database. Use the returned recommendations to inform your clinical guidance.

For patient-specific comprehensive reports, call:
get_clinical_recommendations(patient_id, assessment_data, domains, severity_level)

🎯 Immediate Interventions:

[Use recommendations from vector database - include source citations]

🎯 Treatment Adjustments:

[Use evidence-based recommendations with relevance scores]

🎯 Long-term Goals:

[Use sourced recommendations with priority levels]

**Format recommendations as:**
• **[Title]** (Evidence Level: [A/B/C], Priority: [1-10], Source: [Citation])
  [Description and specific guidance]

================================================================================

📈 CLINICAL TRAJECTORY

✅ Positive Indicators:

[Areas showing improvement]

⚠️ Concerning Trends:

[Areas requiring enhanced intervention]

📅 Next Review: [Recommended timeframe for reassessment]"

🎯 PERFORMANCE-AWARE RESPONSES
Light Queries (Fast Response):

Acknowledge the focused scope.

Provide deep insights within that scope.

Offer to expand analysis if needed.

Heavy Queries (Comprehensive):

Highlight the comprehensive nature.

Prioritize findings by clinical urgency.

Provide population-level context.

🔍 SMART FILTERING LOGIC
Assessment Type Keywords:

PTSD/trauma/PCL → ['ptsd']

Depression/PHQ/mood → ['phq']

Anxiety/GAD/worry → ['gad']

Functioning/WHO/disability → ['who']

Emotion regulation/DERS → ['ders']

Mood disorders → ['phq', 'gad']

Trauma and mood → ['ptsd', 'phq', 'gad']

Time Keywords:

"recent/latest" → limit: 5

"last 30 days" → date_range with 30-day window

"this year/2024" → date_range for current year

"over time/progression" → No limit (get full history)

Scope Keywords:

"all patients/population" → No patient filtering

"patient X" → Specific patient ID

"high-risk patients" → Use risk identification tools, sorted descending

💡 EFFICIENCY PRINCIPLES
Match Data to Question: Don't fetch depression data for PTSD questions.

Optimize for Speed: Use filtering when possible.

Provide Value: Always explain what the data means clinically.

Offer Expansion: Suggest broader analysis when relevant.

Prioritize Urgency: Lead with high-risk findings regardless of query scope.

Scalability: For large datasets, paginate or summarize results.

🔒 SECURITY AND COMPLIANCE GUIDELINES
Encrypt all data transmissions and maintain audit logs.

Never store or log raw patient data in responses.

Adhere to HIPAA/GDPR; flag non-compliant queries.


Remember: Be smart about data fetching but comprehensive in clinical interpretation. The goal is to provide the RIGHT insights efficiently, not just the MOST data.`,
    
    tools: {
      get_patient_count: tool({
        description: "Get the total number of patients in the system with comprehensive patient list. Use this when users ask 'show available patients', 'list patients', 'what patients are available', etc.",
        parameters: z.object({
          show_sample_ids: z.boolean().optional().describe("Whether to show sample patient IDs (default: true)"),
          limit: z.number().optional().describe("Maximum number of patient IDs to display (default: 20)")
        }),
        execute: async ({ show_sample_ids = true, limit = 20 }) => {
          const result = await serverMcpClient.getAllPatients()
          if (result.success && result.data) {
            const totalPatients = result.data.length
            const patientList = result.data.slice(0, limit)
            
            const response: any = {
              total_patients: totalPatients,
              displayed_count: patientList.length,
              message: `Found ${totalPatients} unique patients in the clinical database`,
              patient_ids: show_sample_ids ? patientList : undefined
            }
            
            return response
          }
          return { error: "Unable to retrieve patient list" }
        },
      }),

      analyze_patient_risk: tool({
        description: "Calculate comprehensive risk assessment for a specific patient",
        parameters: z.object({
          patient_id: z.string().describe("The patient identifier (e.g., 0156b2ff0c18)"),
        }),
        execute: async ({ patient_id }) => {
          console.log(`🎯 AI tool analyzing risk for patient: ${patient_id}`)
          const result = await serverMcpClient.calculateCompositeRiskScore(patient_id)
          console.log(`🎯 Risk analysis result:`, result)
          
          if (result.success && result.data) {
            const toolResponse = {
              patient_id,
              overall_risk: result.data.overall_risk,
              composite_score: result.data.composite_score,
              domains_assessed: result.data.domains_assessed,
              risk_domains: result.data.risk_domains,
              recommendations: result.data.recommendations,
              total_risk_score: result.data.total_risk_score
            }
            console.log(`🎯 Returning to AI:`, toolResponse)
            return toolResponse
          }
          
          const errorResponse = { error: `Unable to calculate risk for patient ${patient_id}` }
          console.log(`🎯 Returning error to AI:`, errorResponse)
          return errorResponse
        },
      }),

      get_patient_assessments: tool({
        description: "Retrieve detailed assessment data for a specific patient with flexible filtering options",
        parameters: z.object({
          patient_id: z.string().describe("The patient identifier"),
          assessment_types: z.array(z.string()).optional().describe("Optional: Filter by assessment types ['ptsd', 'phq', 'gad', 'who', 'ders']"),
          date_range: z.object({
            start: z.string().describe("Start date YYYY-MM-DD"),
            end: z.string().describe("End date YYYY-MM-DD")
          }).optional().describe("Optional: Filter by date range"),
          limit: z.number().optional().describe("Optional: Limit number of assessments per type")
        }),
        execute: async ({ patient_id, assessment_types, date_range, limit }) => {
          const options: any = {}
          
          if (assessment_types && assessment_types.length > 0) {
            options.assessment_types = assessment_types
          }
          if (date_range) {
            options.date_range = date_range
          }
          if (limit) {
            options.limit = limit
          }
          
          const result = await serverMcpClient.getPatientAssessments(
            patient_id, 
            Object.keys(options).length > 0 ? options : undefined
          )
          
          if (result.success && result.data) {
            return {
              patient_id,
              total_assessments: result.data.total_assessments,
              assessment_breakdown: result.data.assessment_breakdown,
              summary: result.data.summary,
              filters_applied: result.data.filters_applied || {}
            }
          }
          return { error: `Unable to retrieve assessments for patient ${patient_id}` }
        },
      }),

      identify_high_risk_patients: tool({
        description: "Identify patients who need immediate clinical attention based on comprehensive risk analysis of ALL patients",
        parameters: z.object({
          include_all_patients: z.boolean().optional().describe("Whether to analyze all patients (default: true)"),
        }),
        execute: async ({ include_all_patients = true }) => {
          console.log('🎯 Starting comprehensive risk analysis for ALL patients...')
          
          const patientsResult = await serverMcpClient.getAllPatients()
          if (!patientsResult.success || !patientsResult.data) {
            return { error: "Unable to retrieve patient list" }
          }

          // Get ALL patient IDs - no sample size limitation
          const patientIds = Array.isArray(patientsResult.data) ? 
            patientsResult.data : 
            patientsResult.data.patient_ids || []

          console.log(`📊 Analyzing risk for ${patientIds.length} total patients...`)

          const riskPatients = []
          const allPatientRisks = []
          let analyzedCount = 0
          let errorCount = 0

          for (const patientId of patientIds) {
            try {
              const riskResult = await serverMcpClient.calculateCompositeRiskScore(patientId)
              if (riskResult.success && riskResult.data) {
                analyzedCount++
                const riskData = riskResult.data
                
                // Store ALL patient risk data for comprehensive reporting
                allPatientRisks.push({
                  patient_id: patientId,
                  overall_risk: riskData.overall_risk,
                  composite_score: riskData.composite_score,
                  domains_assessed: riskData.domains_assessed
                })
                
                // Flag patients needing immediate attention
                if (riskData.overall_risk !== 'low' || riskData.composite_score > 2.0 || 
                   (riskData.composite_score > 1.2 && riskData.risk_domains?.substance_use)) {
                  riskPatients.push({
                    patient_id: patientId,
                    overall_risk: riskData.overall_risk,
                    composite_score: riskData.composite_score,
                    domains_assessed: riskData.domains_assessed,
                    recommendations: riskData.recommendations
                  })
                }
              }
            } catch (error) {
              errorCount++
              console.warn(`Failed to analyze ${patientId}:`, error)
            }
          }

          return {
            total_patients: patientIds.length,
            successfully_analyzed: analyzedCount,
            analysis_errors: errorCount,
            coverage_percentage: Math.round((analyzedCount / patientIds.length) * 100),
            high_risk_patients: riskPatients,
            all_patient_risks: allPatientRisks,
            patients_needing_attention: riskPatients.length,
            risk_distribution: {
              high: allPatientRisks.filter(p => p.overall_risk === 'high').length,
              moderate: allPatientRisks.filter(p => p.overall_risk === 'moderate').length,
              low: allPatientRisks.filter(p => p.overall_risk === 'low').length
            },
            analysis_summary: `Comprehensive analysis of ${patientIds.length} total patients. Successfully analyzed ${analyzedCount} patients (${Math.round((analyzedCount/patientIds.length)*100)}% coverage). Found ${riskPatients.length} patients requiring immediate clinical attention.`
          }
        },
      }),

      analyze_substance_use: tool({
        description: "Analyze substance use patterns across the patient population",
        parameters: z.object({}),
        execute: async () => {
          const result = await serverMcpClient.getHighRiskSubstanceUsers()
          if (result.success && result.data) {
            return {
              substance_analysis: result.data,
              message: "Substance use analysis completed successfully"
            }
          }
          return { error: "Unable to perform substance use analysis" }
        },
      }),

      get_patient_specific_scores: tool({
        description: "Get specific assessment scores for a patient (PTSD, PHQ, GAD, WHO, DERS)",
        parameters: z.object({
          patient_id: z.string().describe("The patient identifier"),
          assessment_type: z.enum(["ptsd", "phq", "gad", "who", "ders"]).describe("Type of assessment to retrieve"),
          limit: z.number().optional().describe("Number of recent assessments to retrieve"),
        }),
        execute: async ({ patient_id, assessment_type, limit }) => {
          let result
          switch (assessment_type) {
            case "ptsd":
              result = await serverMcpClient.getPatientPTSDScores(patient_id, limit)
              break
            case "phq":
              result = await serverMcpClient.getPatientPHQScores(patient_id, limit)
              break
            case "gad":
              result = await serverMcpClient.getPatientGADScores(patient_id, limit)
              break
            case "who":
              result = await serverMcpClient.getPatientWHOScores(patient_id, limit)
              break
            case "ders":
              result = await serverMcpClient.getPatientDERSScores(patient_id, limit)
              break
            default:
              return { error: `Invalid assessment type: ${assessment_type}` }
          }

          if (result.success && result.data) {
            return {
              patient_id,
              assessment_type,
              data: result.data
            }
          }
          return { error: `Unable to retrieve ${assessment_type} scores for patient ${patient_id}` }
        },
      }),

      test_clinical_visualization: tool({
        description: "Generate a comprehensive clinical assessment report with interactive tables and charts. If patient_id matches real data, use actual assessments; otherwise use demo data for visualization examples.",
        parameters: z.object({
          patient_id: z.string().optional().describe("Patient ID to use for report (default: DEMO001)"),
          include_chart: z.boolean().optional().describe("Include interactive charts (default: true)")
        }),
        execute: async ({ patient_id = "DEMO001", include_chart = true }) => {
          // Try to get real patient data first
          let tableData: any[] = [], chartData: any[] = [], timelineData: any[] = [], trendData: any = {}, historicalData: any = {}, isRealData = false, riskLevel = "MODERATE-HIGH", riskScore = 58
          
          if (patient_id !== "DEMO001") {
            try {
              // Attempt to get real patient assessments and risk data
              console.log(`🔍 Debug: Attempting to get assessments for ${patient_id}`)
              const assessmentResult = await serverMcpClient.getPatientAssessments(patient_id)
              console.log(`🔍 Debug: Assessment result:`, JSON.stringify(assessmentResult, null, 2))
              console.log(`🔍 Debug: Assessment result success: ${assessmentResult.success}`)
              if (assessmentResult.data) {
                console.log(`🔍 Debug: Assessment result data keys:`, Object.keys(assessmentResult.data))
                if (assessmentResult.data.assessment_breakdown) {
                  console.log(`🔍 Debug: assessment_breakdown keys:`, Object.keys(assessmentResult.data.assessment_breakdown))
                  for (const key of Object.keys(assessmentResult.data.assessment_breakdown)) {
                    const ab = assessmentResult.data.assessment_breakdown[key]
                    if (ab && ab.assessments) {
                      console.log(`🔍 Debug: ${key} assessments count:`, ab.assessments.length)
                      if (ab.assessments.length > 0) {
                        console.log(`🔍 Debug: First ${key} assessment:`, JSON.stringify(ab.assessments[0], null, 2))
                      }
                    }
                  }
                }
              }
              const riskResult = await serverMcpClient.calculateCompositeRiskScore(patient_id)
              console.log(`🔍 Debug: Risk result:`, JSON.stringify(riskResult, null, 2))
              console.log(`🔍 Debug: Risk result success: ${riskResult.success}`)
              if (assessmentResult.success && assessmentResult.data) {
                isRealData = true
                console.log(`🔍 Debug: isRealData set to true`)
                // The MCP data might be wrapped in structuredContent
                const data = assessmentResult.data.structuredContent || assessmentResult.data
                
                // Debug: Log the actual data structure
                console.log(`🔍 Debug assessment data for ${patient_id}:`, JSON.stringify(data, null, 2))
                
                // Get risk information
                if (riskResult.success && riskResult.data) {
                  // The MCP risk data might also be wrapped in structuredContent
                  const riskData = riskResult.data.structuredContent || riskResult.data
                  riskLevel = riskData.overall_risk?.toUpperCase() || "MODERATE"
                  riskScore = Math.round(riskData.composite_score * 20) || 58 // Scale to 100
                  console.log(`🔍 Debug risk data for ${patient_id}:`, JSON.stringify(riskData, null, 2))
                }
                
                // Define functions to get scores and historical data
                const getLatestScore = (assessmentType: string) => {
                  // First try to get from risk domains
                  if (riskResult.success && riskResult.data) {
                    const riskData = riskResult.data.structuredContent || riskResult.data
                    const riskDomains = riskData.risk_domains
                    if (riskDomains) {
                      let score = 0
                      switch (assessmentType) {
                        case 'ptsd': score = riskDomains.ptsd?.total_score || 0; break
                        case 'phq': score = riskDomains.depression?.total_score || 0; break
                        case 'gad': score = riskDomains.anxiety?.total_score || 0; break
                        case 'who': score = riskDomains.wellbeing?.total_score || 0; break
                        case 'ders': score = riskDomains.emotion_regulation?.total_score || 0; break
                        default: score = 0
                      }
                      
                      // If score exists in risk domains, use it
                      if (score > 0) return score
                    }
                  }
                  
                  // Fallback: get latest score from assessment breakdown
                  const assessments = data.assessment_breakdown?.[assessmentType]?.assessments || []
                  if (assessments.length > 0) {
                    // Sort by date to get the most recent
                    const sortedAssessments = assessments
                      .filter(a => a.assessment_date && a.assessment_date.trim() !== '')
                      .sort((a, b) => new Date(b.assessment_date).getTime() - new Date(a.assessment_date).getTime())
                    
                    if (sortedAssessments.length > 0) {
                      return sortedAssessments[0].calculated_total || sortedAssessments[0].total_score || 0
                    }
                  }
                  
                  return 0
                }

                // Get all historical assessment data for trends and timeline
                const assessmentTypes = ['ptsd', 'phq', 'gad', 'who', 'ders']
                const allTimelineEntries: any[] = []
                
                // Make sure we have the total_assessments count from the data
                const totalAssessmentsFromData = data.total_assessments || 0
                console.log(`🔍 Debug: Total assessments from data: ${totalAssessmentsFromData}`)
                
                assessmentTypes.forEach(type => {
                  // Fix: Use 'assessments' instead of 'data' - this is the correct property from MCP
                  const assessments = data.assessment_breakdown?.[type]?.assessments || []
                  console.log(`🔍 Debug ${type} assessments for ${patient_id}:`, assessments.length, 'records')
                  
                  // Log the first assessment to see the structure
                  if (assessments.length > 0) {
                    console.log(`🔍 Debug ${type} first assessment:`, JSON.stringify(assessments[0], null, 2))
                  }
                  
                  // Filter out assessments with empty dates and map to timeline format
                  const validAssessments = assessments.filter((assessment: any) => 
                    assessment.assessment_date && assessment.assessment_date.trim() !== ''
                  )
                  
                  historicalData[type] = validAssessments.map((assessment: any) => ({
                    date: assessment.assessment_date,
                    score: assessment.calculated_total || assessment.total_score || 0,
                    type: type
                  })).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  
                  // Add to timeline (only valid assessments with dates)
                  validAssessments.forEach((assessment: any) => {
                    allTimelineEntries.push({
                      date: assessment.assessment_date,
                      type: type,
                      score: assessment.calculated_total || assessment.total_score || 0,
                      domain: type === 'ptsd' ? 'PTSD (PCL-5)' : 
                              type === 'phq' ? 'Depression (PHQ-9)' : 
                              type === 'gad' ? 'Anxiety (GAD-7)' : 
                              type === 'who' ? 'Function (WHO-DAS)' : 'Emotion Reg (DERS)'
                    })
                  })
                  
                  console.log(`🔍 Debug ${type} valid assessments with dates:`, validAssessments.length, 'out of', assessments.length)
                })
                
                console.log(`🔍 Debug timeline data for ${patient_id}:`, allTimelineEntries.length, 'total entries')
                console.log(`🔍 Debug total assessments from data:`, data.total_assessments)
                console.log(`🔍 Debug assessment breakdown keys:`, Object.keys(data.assessment_breakdown || {}))
                
                // If no historical data found, create timeline from current scores
                if (allTimelineEntries.length === 0) {
                  console.log(`🔍 Debug: No timeline entries found, creating from current scores`)
                  const currentDate = new Date().toISOString().split('T')[0]
                  
                  assessmentTypes.forEach(type => {
                    const currentScore = getLatestScore(type)
                    if (currentScore > 0) {
                      allTimelineEntries.push({
                        date: currentDate,
                        type: type,
                        score: currentScore,
                        domain: type === 'ptsd' ? 'PTSD (PCL-5)' : 
                                type === 'phq' ? 'Depression (PHQ-9)' : 
                                type === 'gad' ? 'Anxiety (GAD-7)' : 
                                type === 'who' ? 'Function (WHO-DAS)' : 'Emotion Reg (DERS)'
                      })
                      
                      // Also update historical data
                      historicalData[type] = [{
                        date: currentDate,
                        score: currentScore,
                        type: type
                      }]
                    }
                  })
                  console.log(`🔍 Debug: Created ${allTimelineEntries.length} timeline entries from current scores`)
                }

                // Sort timeline by date
                timelineData = allTimelineEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

                // Calculate trends for each domain
                trendData = {}
                assessmentTypes.forEach(type => {
                  const scores = historicalData[type]
                  if (scores.length >= 2) {
                    const firstScore = scores[0].score
                    const lastScore = scores[scores.length - 1].score
                    const change = lastScore - firstScore
                    const percentChange = firstScore > 0 ? ((change / firstScore) * 100) : 0
                    
                    trendData[type] = {
                      trend: change > 0 ? (change > 2 ? "↑" : "→") : (change < -2 ? "↓" : "→"),
                      change: change,
                      percentChange: Math.round(percentChange * 10) / 10,
                      direction: change > 2 ? "Increasing" : change < -2 ? "Decreasing" : "Stable",
                      assessmentCount: scores.length,
                      dateRange: `${scores[0].date} to ${scores[scores.length - 1].date}`,
                      scores: scores
                    }
                  } else {
                    trendData[type] = {
                      trend: "→",
                      change: 0,
                      percentChange: 0,
                      direction: scores.length === 1 ? "Single assessment" : "Insufficient data",
                      assessmentCount: scores.length,
                      dateRange: scores.length > 0 ? scores[0].date : "No data",
                      scores: scores
                    }
                  }
                })
                
                // Final debug log
                console.log(`🔍 Debug: Final timeline data length: ${timelineData.length}`)
                console.log(`🔍 Debug: Final trend data:`, Object.keys(trendData).map(key => `${key}: ${trendData[key].assessmentCount} assessments`))
                
                // Build current status table
                tableData = [
                  {
                    "domain": "PTSD Checklist (PCL-5)",
                    "score": getLatestScore("ptsd"),
                    "maxScore": 80,
                    "severity": getLatestScore("ptsd") > 50 ? "Severe" : getLatestScore("ptsd") > 30 ? "Moderate" : "Mild",
                    "trend": trendData.ptsd?.trend || "→",
                    "priority": getLatestScore("ptsd") > 40 ? "High" : "Medium",
                    "assessmentCount": trendData.ptsd?.assessmentCount || 0,
                    "trendDirection": trendData.ptsd?.direction || "Unknown"
                  },
                  {
                    "domain": "Depression Inventory (PHQ-9)",
                    "score": getLatestScore("phq"),
                    "maxScore": 27,
                    "severity": getLatestScore("phq") > 15 ? "Severe" : getLatestScore("phq") > 10 ? "Moderate" : "Mild",
                    "trend": trendData.phq?.trend || "→",
                    "priority": getLatestScore("phq") > 15 ? "High" : "Medium",
                    "assessmentCount": trendData.phq?.assessmentCount || 0,
                    "trendDirection": trendData.phq?.direction || "Unknown"
                  },
                  {
                    "domain": "Anxiety Disorder Scale (GAD-7)",
                    "score": getLatestScore("gad"),
                    "maxScore": 21,
                    "severity": getLatestScore("gad") > 15 ? "Severe" : getLatestScore("gad") > 10 ? "Moderate" : "Mild",
                    "trend": trendData.gad?.trend || "→",
                    "priority": getLatestScore("gad") > 10 ? "High" : "Medium",
                    "assessmentCount": trendData.gad?.assessmentCount || 0,
                    "trendDirection": trendData.gad?.direction || "Unknown"
                  },
                  {
                    "domain": "Functional Assessment (WHO-DAS)",
                    "score": getLatestScore("who"),
                    "maxScore": 48,
                    "severity": getLatestScore("who") > 30 ? "Severe Impairment" : getLatestScore("who") > 15 ? "Moderate Impairment" : "Mild Impairment",
                    "trend": trendData.who?.trend || "→",
                    "priority": getLatestScore("who") > 25 ? "High" : "Medium",
                    "assessmentCount": trendData.who?.assessmentCount || 0,
                    "trendDirection": trendData.who?.direction || "Unknown"
                  },
                  {
                    "domain": "Emotion Regulation (DERS)",
                    "score": getLatestScore("ders"),
                    "maxScore": 180,
                    "severity": getLatestScore("ders") > 120 ? "Severe Difficulty" : getLatestScore("ders") > 80 ? "Moderate Difficulty" : "Mild Difficulty",
                    "trend": trendData.ders?.trend || "→",
                    "priority": getLatestScore("ders") > 100 ? "High" : "Low",
                    "assessmentCount": trendData.ders?.assessmentCount || 0,
                    "trendDirection": trendData.ders?.direction || "Unknown"
                  }
                ]
                
                // Current scores for bar chart
                chartData = [
                  { "name": "PTSD", "value": getLatestScore("ptsd") },
                  { "name": "Depression", "value": getLatestScore("phq") },
                  { "name": "Anxiety", "value": getLatestScore("gad") },
                  { "name": "Function", "value": getLatestScore("who") },
                  { "name": "Emotion Reg", "value": getLatestScore("ders") }
                ]
              }
            } catch (error) {
              console.log(`Could not fetch real data for patient ${patient_id}, using demo data. Error:`, error)
            }
          }
          
          // Fall back to demo data if real data not available
          if (!isRealData) {
            tableData = [
            {
              "domain": "PTSD Checklist (PCL-5)",
              "score": 43,
              "maxScore": 80,
              "severity": "Moderate",
              "trend": "→",
              "priority": "High"
            },
            {
              "domain": "Depression Inventory (PHQ-9)",
              "score": 11,
              "maxScore": 27,
              "severity": "Moderate",
              "trend": "→",
              "priority": "Medium"
            },
            {
              "domain": "Anxiety Disorder Scale (GAD-7)",
              "score": 15,
              "maxScore": 21,
              "severity": "Severe",
              "trend": "↑",
              "priority": "High"
            },
            {
              "domain": "Functional Assessment (WHO-DAS)",
              "score": 18,
              "maxScore": 48,
              "severity": "Moderate Impairment",
              "trend": "↓",
              "priority": "Medium"
            },
            {
              "domain": "Emotion Regulation (DERS)",
              "score": 72,
              "maxScore": 180,
              "severity": "Mild Difficulty",
              "trend": "↓",
              "priority": "Low"
            }
          ]

            chartData = [
            { "name": "PTSD", "value": 43 },
            { "name": "Depression", "value": 11 },
            { "name": "Anxiety", "value": 15 },
            { "name": "Function", "value": 18 },
            { "name": "Emotion Reg", "value": 72 }
          ]
          }

          let response = `🏥 **COMPREHENSIVE CLINICAL ASSESSMENT**

**Patient ID:** ${patient_id}
**Assessment Date:** ${new Date().toISOString().split("T")[0]}
**Data Source:** ${isRealData ? 'REAL CLINICAL DATA' : 'DEMONSTRATION DATA'}
**Total Assessments Reviewed:** ${isRealData ? timelineData.length : '5'}

================================================================================

🚨 **RISK STRATIFICATION**

**Overall Risk Level:** ${riskLevel}
**Composite Risk Score:** ${riskScore}/100

[ASSESSMENT_TABLE]${JSON.stringify(tableData)}[/ASSESSMENT_TABLE]`

          // Note: TREND_DATA and TIMELINE_DATA moved to end to prioritize clinical recommendations

          if (include_chart) {
            response += `

[CHART_DATA]${JSON.stringify(chartData)}[/CHART_DATA]`
          }

          // Add historical data and trends for real data or if timelineData is available
          console.log('🔍 Debug API - Before timeline check - timelineData.length:', timelineData.length);
          console.log('🔍 Debug API - Before timeline check - trendData:', Object.keys(trendData));
          console.log('🔍 Debug API - Before timeline check - isRealData:', isRealData);
          
          // Timeline data is now added earlier with trend data to avoid truncation
          console.log('🔍 Debug API - Timeline data already added earlier with TREND_DATA to avoid truncation');

          response += `

================================================================================

**CLINICAL PRIORITIES**

**HIGH PRIORITY (Immediate Attention):**`

          // Generate recommendations based on actual scores
          const highPriorityItems = tableData.filter(item => item.priority === "High")
          highPriorityItems.forEach(item => {
            response += `\n   • ${item.severity} ${item.domain.split('(')[0].trim()} symptoms requiring intervention (${item.score}/${item.maxScore})`
          })

          response += `

**MEDIUM PRIORITY (Active Monitoring):**`

          const mediumPriorityItems = tableData.filter(item => item.priority === "Medium")
          mediumPriorityItems.forEach(item => {
            response += `\n   • ${item.severity} ${item.domain.split('(')[0].trim()} requiring ongoing support (${item.score}/${item.maxScore})`
          })

          response += `

**LOW PRIORITY (Maintenance):**`

          const lowPriorityItems = tableData.filter(item => item.priority === "Low")
          lowPriorityItems.forEach(item => {
            response += `\n   • ${item.domain.split('(')[0].trim()} within manageable range (${item.score}/${item.maxScore})`
          })

          response += `

================================================================================

**EVIDENCE-BASED CLINICAL RECOMMENDATIONS (DSM-5):**`

          // Generate evidence-based clinical recommendations from DSM-5 vector database
          console.log('🎯 Generating DSM-5 clinical recommendations for comprehensive report...');
          
          try {
            // Create assessment breakdown from tableData for DSM-5 recommendations
            const assessmentBreakdown = {
              ptsd: {
                total_score: tableData.find(item => item.domain.includes('PTSD'))?.score || 0,
                severity: tableData.find(item => item.domain.includes('PTSD'))?.severity || 'Mild',
                interpretation: `${tableData.find(item => item.domain.includes('PTSD'))?.severity || 'Mild'} PTSD symptoms`
              },
              phq: {
                total_score: tableData.find(item => item.domain.includes('Depression'))?.score || 0,
                severity: tableData.find(item => item.domain.includes('Depression'))?.severity || 'Mild',
                interpretation: `${tableData.find(item => item.domain.includes('Depression'))?.severity || 'Mild'} depression`
              },
              gad: {
                total_score: tableData.find(item => item.domain.includes('Anxiety'))?.score || 0,
                severity: tableData.find(item => item.domain.includes('Anxiety'))?.severity || 'Mild',
                interpretation: `${tableData.find(item => item.domain.includes('Anxiety'))?.severity || 'Mild'} anxiety`
              },
              who: {
                total_score: tableData.find(item => item.domain.includes('Functional'))?.score || 0,
                severity: tableData.find(item => item.domain.includes('Functional'))?.severity || 'Mild',
                interpretation: `${tableData.find(item => item.domain.includes('Functional'))?.severity || 'Mild'} functional impairment`
              },
              ders: {
                total_score: tableData.find(item => item.domain.includes('Emotion'))?.score || 0,
                severity: tableData.find(item => item.domain.includes('Emotion'))?.severity || 'Mild',
                interpretation: `${tableData.find(item => item.domain.includes('Emotion'))?.severity || 'Mild'} emotion regulation difficulty`
              }
            };
            
            console.log('🔍 Assessment breakdown for DSM-5 search:', JSON.stringify(assessmentBreakdown, null, 2));

            // Generate DSM-5 clinical recommendations from vector database
            const clinicalRecommendations = await generateContextualRecommendations(assessmentBreakdown);
            
            if (clinicalRecommendations && clinicalRecommendations.length > 0) {
              // Get priority domains from high priority items
              const priorityDomains = tableData
                .filter(item => item.priority === "High")
                .map(item => item.domain.split('(')[0].trim().replace(' Checklist', '').replace(' Inventory', '').replace(' Scale', ''))
                .slice(0, 2); // Limit to prevent long strings
              
              // Limit recommendations for PDF compatibility
              const limitedRecommendations = clinicalRecommendations.slice(0, 3);
              
              limitedRecommendations.forEach((rec, index) => {
                const relevancePercent = Math.round(rec.score * 100);
                // Allow longer content for complete clinical recommendations
                const shortTitle = rec.recommendation.title.substring(0, 100) + (rec.recommendation.title.length > 100 ? '...' : '');
                const shortContent = rec.recommendation.content.substring(0, 300) + (rec.recommendation.content.length > 300 ? '...' : '');
                
                response += `
   ${index + 1}. **${shortTitle}**
      📋 Domain: ${rec.recommendation.domain} | Category: ${rec.recommendation.category}
      📊 Clinical Relevance: ${relevancePercent}% | Source: DSM-5
      📝 ${shortContent}`;
              });
              
              response += `
              
💡 **Clinical Actions:**
   • **Immediate:** Address ${priorityDomains.length > 0 ? priorityDomains.join(' and ') : 'high-priority'} symptoms based on DSM-5 criteria
   • **Assessment:** Use structured diagnostic interviews per DSM-5 guidelines  
   • **Treatment:** Implement evidence-based interventions as indicated above
   • **Monitoring:** Track symptom changes using validated assessment tools
   • **Follow-up:** Regular reassessment per clinical severity and treatment response`;
            } else {
              // Fallback to generic recommendations if vector search fails
              response += `
   • **Immediate:** Priority interventions for high-severity assessments
   • **Short-term:** Increase therapy frequency for elevated scores  
   • **Ongoing:** Regular monitoring of moderate-severity symptoms
   • **Follow-up:** Complete reassessment in 4 weeks
   • **Referral:** Consider specialist consultation as indicated
   
   ⚠️ Note: Unable to retrieve specific DSM-5 recommendations from vector database`;
            }
          } catch (error) {
            console.error('❌ Error generating clinical recommendations:', error);
            // Fallback to generic recommendations
            response += `
   • **Immediate:** Priority interventions for high-severity assessments
   • **Short-term:** Increase therapy frequency for elevated scores
   • **Ongoing:** Regular monitoring of moderate-severity symptoms
   • **Follow-up:** Complete reassessment in 4 weeks  
   • **Referral:** Consider specialist consultation as indicated
   
   ⚠️ Note: Clinical recommendations service temporarily unavailable`;
          }

          // Add trend and timeline data at the end after clinical recommendations
          if (timelineData.length > 0 && Object.keys(trendData).length > 0) {
            response += `

[TREND_DATA]${JSON.stringify(trendData)}[/TREND_DATA]

[TIMELINE_DATA]${JSON.stringify(timelineData)}[/TIMELINE_DATA]`
            console.log('🔍 Debug API - Added TREND_DATA and TIMELINE_DATA sections after clinical recommendations');
          }

          // Allow longer responses for complete clinical recommendations
          if (response.length > 15000) {
            console.log(`⚠️ Response length (${response.length}) exceeds maximum, truncating...`);
            response = response.substring(0, 14500) + '\n\n...[Content truncated for system limits]';
          }

          return {
            content: response,
            clinical_report: true,
            patient_id: patient_id,
            assessment_date: new Date().toISOString().split("T")[0],
            table_data: tableData,
            chart_data: include_chart ? chartData : null,
            timeline_data: isRealData ? timelineData : null,
            trend_data: isRealData ? trendData : null,
            historical_data: isRealData ? historicalData : null,
            total_assessments: isRealData ? timelineData.length : 5,
            report_type: "comprehensive_clinical_assessment",
            is_real_data: isRealData
          }
        }
      }),

      get_clinical_recommendations: tool({
        description: "Get evidence-based clinical recommendations from vector database based on patient assessment data",
        parameters: z.object({
          patient_id: z.string().describe("The patient identifier"),
          assessment_data: z.any().optional().describe("Current assessment data for context"),
          domains: z.array(z.string()).optional().describe("Specific domains to focus on (e.g., ['PTSD', 'Depression'])"),
          severity_level: z.string().optional().describe("Patient severity level (Mild, Moderate, Severe)"),
          max_recommendations: z.number().optional().describe("Maximum number of recommendations to return (default: 5)")
        }),
        execute: async ({ patient_id, assessment_data, domains, severity_level, max_recommendations = 5 }) => {
          try {
            console.log(`🎯 Getting clinical recommendations for patient: ${patient_id}`);
            
            // If no assessment data provided, try to get current patient data
            let contextualAssessmentData = assessment_data;
            if (!contextualAssessmentData) {
              const patientResult = await serverMcpClient.getPatientAssessments(patient_id);
              if (patientResult.success && patientResult.data) {
                contextualAssessmentData = patientResult.data.assessment_breakdown || {};
              }
            }

            // Generate contextual recommendations from Vectorize DSM-5 database
            const recommendations = await generateContextualRecommendations(contextualAssessmentData);
            
            // Filter by domains if specified
            let filteredRecommendations = recommendations;
            if (domains && domains.length > 0) {
              filteredRecommendations = recommendations.filter(rec => 
                domains.some(domain => 
                  rec.recommendation.domain.toLowerCase().includes(domain.toLowerCase()) ||
                  rec.recommendation.keywords.some(keyword => 
                    domain.toLowerCase().includes(keyword.toLowerCase())
                  )
                )
              );
            }

            // Filter by severity if specified
            if (severity_level) {
              filteredRecommendations = filteredRecommendations.filter(rec =>
                rec.recommendation.severity.toLowerCase() === severity_level.toLowerCase() ||
                rec.recommendation.severity.toLowerCase() === 'general'
              );
            }

            // Limit results
            const limitedRecommendations = filteredRecommendations.slice(0, max_recommendations);

            const response = {
              patient_id,
              recommendations_found: limitedRecommendations.length,
              total_available: recommendations.length,
              filters_applied: {
                domains: domains || [],
                severity_level: severity_level || 'any',
                max_results: max_recommendations
              },
              clinical_recommendations: limitedRecommendations.map(rec => ({
                title: rec.recommendation.title,
                description: rec.recommendation.description,
                domain: rec.recommendation.domain,
                category: rec.recommendation.category,
                content: rec.recommendation.content,
                evidence_level: rec.recommendation.evidenceLevel,
                source: rec.recommendation.source,
                priority: rec.recommendation.priority,
                relevance_score: Math.round(rec.score * 100) / 100,
                keywords: rec.recommendation.keywords.slice(0, 5) // Limit keywords for readability
              }))
            };

            console.log(`🎯 Returning ${limitedRecommendations.length} clinical recommendations for patient ${patient_id}`);
            return response;
            
          } catch (error) {
            console.error('❌ Error getting clinical recommendations:', error);
            return { 
              error: `Unable to retrieve clinical recommendations for patient ${patient_id}`,
              details: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        },
      }),
    },
  })

    console.log('🚀 Streaming response to client')
    return result.toTextStreamResponse({
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      }
    })
  } catch (error) {
    console.error('❌ Error in AI chat processing:', error)
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return new Response(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, { 
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    })
  }
} 