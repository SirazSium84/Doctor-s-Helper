"use client"

import { useDashboardStore } from "@/store/dashboard-store"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

interface PatientSelectorProps {
  showViewMode?: boolean
  currentTab?: string
  forceShowPatientSelector?: boolean
  minimal?: boolean
}

export function PatientSelector({ showViewMode = true, currentTab, forceShowPatientSelector = false, minimal = false }: PatientSelectorProps) {
  const { patients, selectedPatient, viewMode, setSelectedPatient, setViewMode } = useDashboardStore()

  // For risk analysis, always show individual mode and patient selector
  const isRiskAnalysis = currentTab === "risk"
  const shouldShowViewMode = showViewMode && !isRiskAnalysis
  const shouldShowPatientSelector = isRiskAnalysis || (showViewMode && viewMode === "individual") || (forceShowPatientSelector && viewMode === "individual")

  return (
    <div className={minimal ? "space-y-2" : "bg-gray-800 p-4 rounded-lg space-y-4"}>
      {shouldShowViewMode && (
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-300">View Mode</Label>
          <RadioGroup
            value={viewMode}
            onValueChange={(value) => setViewMode(value as "all" | "individual")}
            className="flex space-x-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="all" />
              <Label htmlFor="all" className="text-sm text-gray-300">
                All Patients
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="individual" id="individual" />
              <Label htmlFor="individual" className="text-sm text-gray-300">
                Individual Patient
              </Label>
            </div>
          </RadioGroup>
        </div>
      )}

      {shouldShowPatientSelector && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-300">
            {isRiskAnalysis ? "Select Patient for Risk Analysis" : "Select Patient"}
          </Label>
          <Select value={selectedPatient || ""} onValueChange={setSelectedPatient}>
            <SelectTrigger className="btn btn-ghost justify-between h-auto py-3 px-4 border-gray-600 hover:bg-gray-600 text-white">
              <SelectValue placeholder={isRiskAnalysis ? "Choose a patient to analyze..." : "Choose a patient..."} />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600">
              {patients.map((patient) => (
                <SelectItem key={patient.id} value={patient.id} className="text-white hover:bg-gray-600">
                  {patient.name} (ID: {patient.id})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}
