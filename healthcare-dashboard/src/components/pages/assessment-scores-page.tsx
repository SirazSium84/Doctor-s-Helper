"use client"

import { useDashboardStore } from "@/store/dashboard-store"
import { getAssessmentThreshold, getThresholdColor } from "@/lib/assessment-utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useState, useMemo } from "react"

export function AssessmentScoresPage() {
  const { patients, assessmentScores, selectedPatient, viewMode } = useDashboardStore()
  const [searchTerm, setSearchTerm] = useState("")

  const filteredScores = useMemo(() => {
    let scores = assessmentScores

    if (viewMode === "individual" && selectedPatient) {
      scores = scores.filter((score) => score.patientId === selectedPatient)
    }

    if (searchTerm) {
      scores = scores.filter((score) => {
        const patient = patients.find((p) => p.id === score.patientId)
        return (
          patient?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          score.patientId.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })
    }

    return scores.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [assessmentScores, patients, selectedPatient, viewMode, searchTerm])

  const getPatientName = (patientId: string) => {
    return patients.find((p) => p.id === patientId)?.name || patientId
  }

  const renderScoreCell = (score: number, type: "who" | "gad" | "phq" | "pcl" | "ders") => {
    const threshold = getAssessmentThreshold(type, score)
    const colorClass = getThresholdColor(threshold)

    return (
      <TableCell>
        <Badge className={colorClass}>{score}</Badge>
      </TableCell>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Assessment Scores</CardTitle>
          <div className="flex items-center space-x-4">
            <Input
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm bg-gray-700 border-gray-600 text-white"
            />
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-400 rounded"></div>
                <span>Good</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-yellow-400 rounded"></div>
                <span>Moderate</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-red-400 rounded"></div>
                <span>Concerning</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">Patient</TableHead>
                  <TableHead className="text-gray-300">Date</TableHead>
                  <TableHead className="text-gray-300">WHO (0-25)</TableHead>
                  <TableHead className="text-gray-300">GAD (0-21)</TableHead>
                  <TableHead className="text-gray-300">PHQ (0-27)</TableHead>
                  <TableHead className="text-gray-300">PCL (0-80)</TableHead>
                  <TableHead className="text-gray-300">DERS (0-180)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredScores.map((score, index) => (
                  <TableRow key={index} className="border-gray-700 hover:bg-gray-700/50">
                    <TableCell className="text-white font-medium">{getPatientName(score.patientId)}</TableCell>
                    <TableCell className="text-gray-300">{new Date(score.date).toLocaleDateString()}</TableCell>
                    {renderScoreCell(score.who, "who")}
                    {renderScoreCell(score.gad, "gad")}
                    {renderScoreCell(score.phq, "phq")}
                    {renderScoreCell(score.pcl, "pcl")}
                    {renderScoreCell(score.ders, "ders")}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredScores.length === 0 && (
            <div className="text-center py-8 text-gray-400">No assessment scores found.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
