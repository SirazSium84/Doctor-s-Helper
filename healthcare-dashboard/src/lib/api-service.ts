import type { Patient, AssessmentScore, BPSAssessment, PHPDailyAssessment, AHCMAssessment } from "@/types/assessments"
import { mcpClient } from "./mcp-client"

class APIService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || ''

  async fetchPatients(): Promise<Patient[]> {
    try {
      console.log('Starting fetchPatients...')
      // Try to fetch from MCP server first
      const mcpResponse = await mcpClient.getAllPatients()
      console.log('MCP response received:', mcpResponse)
      
      if (mcpResponse.success && mcpResponse.data) {
        // Transform MCP patient IDs to Patient objects using actual group identifiers as names
        const patients: Patient[] = mcpResponse.data.map((patientId: string) => {
          // Determine program type based on patient identifier prefix
          let program: Patient["program"] = "Outpatient"
          if (patientId.startsWith("AHCM")) {
            program = "Outpatient" // AHCM = Adult Healthcare Management
          } else if (patientId.startsWith("BPS")) {
            program = "PHP" // BPS = Behavioral Program Services
          } else if (patientId.startsWith("IOP")) {
            program = "IOP" // Intensive Outpatient Program
          } else if (patientId.startsWith("IP")) {
            program = "Inpatient"
          }

          return {
            id: patientId,
            name: patientId, // Use actual group identifier as name
            age: Math.floor(Math.random() * 60) + 18, // This would come from Supabase patient demographics table eventually
            gender: ["Male", "Female", "Other"][Math.floor(Math.random() * 3)] as "Male" | "Female" | "Other",
            program,
            dischargeType: "Ongoing" as Patient["dischargeType"], // Most patients are ongoing unless specified otherwise
          }
        })
        
        console.log(`Fetched ${patients.length} patients from MCP server`)
        return patients
      }
      
      // Fallback to API route if MCP server is not available
      const response = await fetch('/api/patients')
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch patients')
      }
      
      return data.patients
    } catch (error) {
      console.error('Error fetching patients:', error)
      throw error
    }
  }

  async fetchAssessments(patientId?: string): Promise<AssessmentScore[]> {
    try {
      console.log('Starting fetchAssessments for:', patientId || 'all patients')
      if (patientId) {
        // Fetch assessments for specific patient from MCP server
        const mcpResponse = await mcpClient.getPatientAssessments(patientId)
        console.log('MCP assessment response for', patientId, ':', mcpResponse)
        
        if (mcpResponse.success && mcpResponse.data) {
          const assessments = mcpClient.transformToAssessmentScores(mcpResponse.data)
          console.log(`Fetched ${assessments.length} assessments for patient ${patientId} from MCP server`)
          return assessments
        }
      } else {
        // Fetch all patients first, then get their assessments
        const patients = await this.fetchPatients()
        const allAssessments: AssessmentScore[] = []
        
        for (const patient of patients) {
          try {
            const mcpResponse = await mcpClient.getPatientAssessments(patient.id)
            if (mcpResponse.success && mcpResponse.data) {
              const patientAssessments = mcpClient.transformToAssessmentScores(mcpResponse.data)
              allAssessments.push(...patientAssessments)
            }
          } catch (error) {
            console.warn(`Failed to fetch assessments for patient ${patient.id}:`, error)
          }
        }
        
        console.log(`Fetched ${allAssessments.length} total assessments from MCP server`)
        return allAssessments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      }
      
      // Fallback to API route if MCP server is not available
      const url = patientId ? `/api/assessments?patientId=${patientId}` : '/api/assessments'
      const response = await fetch(url)
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch assessments')
      }
      
      return data.assessments
    } catch (error) {
      console.error('Error fetching assessments:', error)
      throw error
    }
  }

  // Real data methods - these will be implemented when Supabase tables for these assessments are available
  async fetchBPSAssessments(patients: Patient[]): Promise<BPSAssessment[]> {
    // These assessments will be fetched from Supabase when the tables are available
    // For now, return empty array to avoid mock data
    console.log('BPS assessments not yet available in Supabase - returning empty array')
    return []
  }

  async fetchPHPDailyAssessments(patients: Patient[]): Promise<PHPDailyAssessment[]> {
    // These assessments will be fetched from Supabase when the tables are available
    // For now, return empty array to avoid mock data
    console.log('PHP daily assessments not yet available in Supabase - returning empty array')
    return []
  }

  async fetchAHCMAssessments(patients: Patient[]): Promise<AHCMAssessment[]> {
    // These assessments will be fetched from Supabase when the tables are available
    // For now, return empty array to avoid mock data
    console.log('AHCM assessments not yet available in Supabase - returning empty array')
    return []
  }
}

export const apiService = new APIService() 