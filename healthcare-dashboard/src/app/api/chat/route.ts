import { openai } from "@ai-sdk/openai"
import { streamText, tool } from "ai"
import { z } from "zod"
import { mcpClient } from "@/lib/mcp-client"

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

      console.log(`📡 Calling MCP server at: ${this.serverUrl}/mcp/`)
      const response = await fetch(`${this.serverUrl}/mcp/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream'
        },
        body: JSON.stringify(requestBody)
      })

      console.log(`📡 MCP Response status: ${response.status}`)
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

  async getPatientAssessments(patientId: string) {
    return this.callMCPTool('get_all_patient_assessments', { patient_id: patientId })
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
      maxSteps: 5, // Allow multiple steps for tool calls + text generation
      onStepFinish: async (step) => {
        console.log(`📋 Step ${step.stepType} finished:`, {
          finishReason: step.finishReason,
          usage: step.usage,
          textLength: step.text.length,
          toolCalls: step.toolCalls?.length || 0,
          toolResults: step.toolResults?.length || 0,
          isContinued: step.response?.isContinued || false
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
      system: `You are a Healthcare Analytics Assistant. When users ask about patient data:

1. FIRST: Use the appropriate tool to get the data
2. SECOND: Always provide a detailed analysis of the results in text form

CRITICAL: After calling any tool, you MUST continue with a comprehensive text response explaining what the data means and providing clinical insights.

Format your response like:
"Based on the risk analysis for patient [ID]:

**Overall Risk Assessment:** [explanation]
**Key Findings:** [bullet points]  
**Clinical Recommendations:** [actionable advice]"

Never stop after just calling a tool - always provide the analysis!`,
    
    tools: {
      get_patient_count: tool({
        description: "Get the total number of patients in the system",
        parameters: z.object({}),
        execute: async () => {
          const result = await serverMcpClient.getAllPatients()
          if (result.success && result.data) {
            return {
              total_patients: result.data.length,
              patient_ids: result.data.slice(0, 5), // Show first 5 as examples
              message: `Found ${result.data.length} patients in the clinical database`
            }
          }
          return { error: "Unable to retrieve patient count" }
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
        description: "Retrieve detailed assessment data for a specific patient",
        parameters: z.object({
          patient_id: z.string().describe("The patient identifier"),
        }),
        execute: async ({ patient_id }) => {
          const result = await serverMcpClient.getPatientAssessments(patient_id)
          if (result.success && result.data) {
            return {
              patient_id,
              total_assessments: result.data.total_assessments,
              assessment_breakdown: result.data.assessment_breakdown,
              summary: result.data.summary
            }
          }
          return { error: `Unable to retrieve assessments for patient ${patient_id}` }
        },
      }),

      identify_high_risk_patients: tool({
        description: "Identify patients who need immediate clinical attention based on risk analysis",
        parameters: z.object({
          sample_size: z.number().optional().describe("Number of patients to analyze (default: 5)"),
        }),
        execute: async ({ sample_size = 5 }) => {
          const patientsResult = await serverMcpClient.getAllPatients()
          if (!patientsResult.success || !patientsResult.data) {
            return { error: "Unable to retrieve patient list" }
          }

          const patientIds = Array.isArray(patientsResult.data) ? 
            patientsResult.data.slice(0, sample_size) : 
            patientsResult.data.patient_ids?.slice(0, sample_size) || []

          const riskPatients = []
          let analyzedCount = 0

          for (const patientId of patientIds) {
            try {
              const riskResult = await serverMcpClient.calculateCompositeRiskScore(patientId)
              if (riskResult.success && riskResult.data) {
                analyzedCount++
                const riskData = riskResult.data
                
                if (riskData.overall_risk !== 'low' || riskData.composite_score > 2.5 || 
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
              console.warn(`Failed to analyze ${patientId}:`, error)
            }
          }

          return {
            analyzed_count: analyzedCount,
            high_risk_patients: riskPatients,
            total_high_risk: riskPatients.length,
            analysis_summary: `Analyzed ${analyzedCount} patients, found ${riskPatients.length} requiring attention`
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