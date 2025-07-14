"use client"

import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'

interface AssessmentData {
  domain: string
  score: number
  maxScore: number
  severity: string
  trend: string
  priority: string
  assessmentCount?: number
  trendDirection?: string
}

interface ChartData {
  name: string
  value: number
  color?: string
}

interface TimelineData {
  date: string
  domain: string
  score: number
  type: string
}

interface TrendData {
  [key: string]: {
    trend: string
    change: number
    percentChange: number
    direction: string
    assessmentCount: number
    dateRange: string
    scores: any[]
  }
}

interface EnhancedMessageProps {
  content: string
  role: 'user' | 'assistant' | 'system' | 'data'
}

const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

export function EnhancedChatRenderer({ content, role }: EnhancedMessageProps) {
  // Parse structured data from content
  const parseStructuredData = (text: string) => {
    console.log('🔍 Debug - Full text content length:', text.length);
    console.log('🔍 Debug - Text contains TREND_DATA:', text.includes('[TREND_DATA]'));
    console.log('🔍 Debug - Text sample:', text.substring(Math.max(0, text.length - 500)));
    
    const structuredData = {
      assessmentTable: null as AssessmentData[] | null,
      chartData: null as ChartData[] | null,
      timelineData: null as any[] | null,
      trendData: null as any | null,
      plainText: text
    }

    // Parse assessment table data - using multiline flag instead of 's' flag for compatibility
    const assessmentMatch = text.match(/\[ASSESSMENT_TABLE\]([\s\S]*?)\[\/ASSESSMENT_TABLE\]/)
    if (assessmentMatch) {
      try {
        console.log('🔍 Debug - Assessment table JSON:', assessmentMatch[1])
        structuredData.assessmentTable = JSON.parse(assessmentMatch[1])
        structuredData.plainText = text.replace(assessmentMatch[0], '')
      } catch (e) {
        console.error('Failed to parse assessment table:', e)
        console.error('Assessment table content:', assessmentMatch[1])
      }
    }

    // Parse chart data - using multiline flag instead of 's' flag for compatibility
    const chartMatch = text.match(/\[CHART_DATA\]([\s\S]*?)\[\/CHART_DATA\]/)
    if (chartMatch) {
      try {
        console.log('🔍 Debug - Chart data JSON:', chartMatch[1])
        structuredData.chartData = JSON.parse(chartMatch[1])
        structuredData.plainText = structuredData.plainText.replace(chartMatch[0], '')
      } catch (e) {
        console.error('Failed to parse chart data:', e)
        console.error('Chart data content:', chartMatch[1])
      }
    }

    // Parse timeline data - using multiline flag instead of 's' flag for compatibility
    const timelineMatch = text.match(/\[TIMELINE_DATA\]([\s\S]*?)\[\/TIMELINE_DATA\]/)
    if (timelineMatch) {
      try {
        console.log('🔍 Debug - Timeline data JSON:', timelineMatch[1])
        structuredData.timelineData = JSON.parse(timelineMatch[1])
        structuredData.plainText = structuredData.plainText.replace(timelineMatch[0], '')
      } catch (e) {
        console.error('Failed to parse timeline data:', e)
        console.error('Timeline data content:', timelineMatch[1])
      }
    }

    // Parse trend data - using multiline flag instead of 's' flag for compatibility
    console.log('🔍 Debug - Searching for TREND_DATA in text...');
    console.log('🔍 Debug - Text includes [TREND_DATA]:', text.includes('[TREND_DATA]'));
    console.log('🔍 Debug - Text includes [/TREND_DATA]:', text.includes('[/TREND_DATA]'));
    
    if (text.includes('[TREND_DATA]')) {
      const startIndex = text.indexOf('[TREND_DATA]');
      const endIndex = text.indexOf('[/TREND_DATA]');
      console.log('🔍 Debug - TREND_DATA start index:', startIndex);
      console.log('🔍 Debug - TREND_DATA end index:', endIndex);
      console.log('🔍 Debug - TREND_DATA section:', text.substring(startIndex, endIndex + 13));
    }
    
    const trendMatch = text.match(/\[TREND_DATA\]([\s\S]*?)\[\/TREND_DATA\]/)
    console.log('🔍 Debug - trendMatch found:', !!trendMatch);
    if (trendMatch) {
      console.log('🔍 Debug - trendMatch content:', trendMatch[1].substring(0, 200) + '...');
      try {
        structuredData.trendData = JSON.parse(trendMatch[1])
        console.log('🔍 Debug - Parsed trendData successfully:', Object.keys(structuredData.trendData));
        structuredData.plainText = structuredData.plainText.replace(trendMatch[0], '')
      } catch (e) {
        console.error('Failed to parse trend data:', e)
        console.error('Trend data content:', trendMatch[1])
      }
    }

    return structuredData
  }

  const renderAssessmentTable = (data: AssessmentData[]) => (
    <div className="mt-4 mb-4 bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900 border border-gray-700/50 shadow-2xl overflow-hidden rounded-lg max-w-full">
      <div className="bg-gray-700/50 px-3 py-2 border-b border-gray-600/50">
        <h3 className="text-xs font-semibold text-blue-400 flex items-center gap-1">
          📊 Assessment Summary
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-full">
          <thead className="bg-gray-700/30 border-b border-gray-600/50">
            <tr>
              <th className="text-left px-2 py-1.5 text-gray-300 font-medium text-xs w-1/4">Domain</th>
              <th className="text-left px-2 py-1.5 text-gray-300 font-medium text-xs w-1/6">Score</th>
              <th className="text-left px-2 py-1.5 text-gray-300 font-medium text-xs w-1/4">Severity</th>
              <th className="text-center px-2 py-1.5 text-gray-300 font-medium text-xs w-1/12">Trend</th>
              <th className="text-left px-2 py-1.5 text-gray-300 font-medium text-xs w-1/4">Priority</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr 
                key={index} 
                className="border-b border-gray-700/50 hover:bg-gray-700/20 transition-all duration-200 ease-out"
              >
                <td className="px-2 py-1.5 text-gray-100 font-medium text-xs truncate">{row.domain.replace(' (', '\n(')}</td>
                <td className="px-2 py-1.5 text-gray-100">
                  <span className="font-mono bg-gray-700/50 px-1 py-0.5 rounded text-blue-200 font-medium text-xs">
                    {row.score}/{row.maxScore}
                  </span>
                </td>
                <td className="px-2 py-1.5">
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium shadow-sm ${
                    row.severity === 'Severe' ? 'bg-red-900/80 text-red-100' :
                    row.severity === 'Moderate' ? 'bg-yellow-900/80 text-yellow-100' :
                    row.severity === 'Mild' ? 'bg-blue-900/80 text-blue-100' :
                    row.severity === 'Poor' ? 'bg-red-900/80 text-red-100' :
                    row.severity === 'Low Difficulty' ? 'bg-green-900/80 text-green-100' :
                    'bg-green-900/80 text-green-100'
                  }`}>
                    {row.severity.split(' ')[0]}
                  </span>
                </td>
                <td className="px-2 py-1.5 text-center">
                  <span className={`text-sm font-bold ${
                    row.trend === '↑' ? 'text-red-400' :
                    row.trend === '↓' ? 'text-green-400' :
                    'text-gray-400'
                  }`}>
                    {row.trend}
                  </span>
                </td>
                <td className="px-2 py-1.5">
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium shadow-sm ${
                    row.priority === 'High' ? 'bg-red-900/80 text-red-100' :
                    row.priority === 'Medium' ? 'bg-yellow-900/80 text-yellow-100' :
                    'bg-green-900/80 text-green-100'
                  }`}>
                    {row.priority}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderChart = (data: ChartData[]) => (
    <div className="mt-4 mb-4 bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900 border border-gray-700/50 shadow-2xl overflow-hidden rounded-lg max-w-full">
      <div className="bg-gray-700/50 px-3 py-2 border-b border-gray-600/50">
        <h3 className="text-xs font-semibold text-blue-400 flex items-center gap-1">
          📈 Assessment Scores
        </h3>
      </div>
      <div className="p-3">
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={data} 
              margin={{ top: 10, right: 15, left: 10, bottom: 35 }}
              barCategoryGap="10%"
              barGap={2}
            >
              <defs>
                <linearGradient id="clinicalBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.9}/>
                  <stop offset="100%" stopColor="#1E40AF" stopOpacity={0.7}/>
                </linearGradient>
                <filter id="chartGlow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge> 
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid 
                strokeDasharray="1 3" 
                stroke="#374151" 
                strokeOpacity={0.4}
                horizontal={true}
                vertical={false}
              />
              <XAxis 
                dataKey="name" 
                stroke="#9CA3AF" 
                fontSize={9}
                fontWeight={500}
                tick={{ fill: "#D1D5DB" }}
                axisLine={{ stroke: "#4B5563", strokeWidth: 1 }}
                tickLine={{ stroke: "#6B7280", strokeWidth: 1 }}
                angle={-20}
                textAnchor="end"
                height={55}
                interval={0}
              />
              <YAxis 
                stroke="#9CA3AF" 
                fontSize={10}
                fontWeight={500}
                tick={{ fill: "#D1D5DB" }}
                axisLine={{ stroke: "#4B5563", strokeWidth: 1 }}
                tickLine={{ stroke: "#6B7280", strokeWidth: 1 }}
                label={{ 
                  value: 'Score', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fill: '#9CA3AF', fontSize: '10px', fontWeight: 500 }
                }}
              />
              <Tooltip 
                cursor={false}
                contentStyle={{
                  backgroundColor: '#111827',
                  border: '1px solid #6B7280',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                  color: '#F9FAFB',
                  fontSize: '12px',
                  fontWeight: '500',
                  padding: '8px 12px',
                  backdropFilter: 'blur(8px)'
                }}
                labelStyle={{
                  color: '#E5E7EB',
                  fontSize: '13px',
                  fontWeight: '600',
                  marginBottom: '2px'
                }}
                itemStyle={{
                  color: '#D1D5DB',
                  fontSize: '11px',
                  fontWeight: '500'
                }}
              />
              <Bar 
                dataKey="value" 
                fill="url(#clinicalBarGradient)" 
                radius={[6, 6, 0, 0]}
                stroke="#3B82F6"
                strokeWidth={1}
                style={{
                  filter: "drop-shadow(0 4px 15px rgba(59, 130, 246, 0.3)) drop-shadow(0 2px 8px rgba(0, 0, 0, 0.2))"
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )

  const renderPieChart = (data: ChartData[]) => (
    <div className="mt-4 mb-4 bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900 border border-gray-700/50 shadow-2xl overflow-hidden rounded-lg max-w-full">
      <div className="bg-gray-700/50 px-3 py-2 border-b border-gray-600/50">
        <h3 className="text-xs font-semibold text-blue-400 flex items-center gap-1">
          🥧 Assessment Distribution
        </h3>
      </div>
      <div className="p-3">
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                <filter id="pieGlow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge> 
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name.split(' ')[0]} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                outerRadius={70}
                innerRadius={18}
                paddingAngle={2}
                dataKey="value"
                style={{ cursor: 'pointer', fontSize: '11px' }}
                animationBegin={0}
                animationDuration={1200}
                animationEasing="ease-out"
                isAnimationActive={true}
              >
                {data.map((entry, index) => {
                  const color = entry.color || CHART_COLORS[index % CHART_COLORS.length]
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={color}
                      stroke="#1F2937"
                      strokeWidth={2}
                      style={{
                        filter: `drop-shadow(0 4px 15px ${color}30) drop-shadow(0 2px 8px rgba(0, 0, 0, 0.2))`,
                        transition: 'all 0.3s cubic-bezier(0.23, 1, 0.32, 1)'
                      }}
                    />
                  )
                })}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#111827',
                  border: '1px solid #6B7280',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                  color: '#F9FAFB',
                  fontSize: '14px',
                  fontWeight: '500',
                  padding: '12px 16px',
                  backdropFilter: 'blur(8px)'
                }}
                labelStyle={{
                  color: '#E5E7EB',
                  fontSize: '15px',
                  fontWeight: '600',
                  marginBottom: '4px'
                }}
                itemStyle={{
                  color: '#D1D5DB',
                  fontSize: '13px',
                  fontWeight: '500'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )

  const renderTimelineData = (data: any[]) => {
    console.log('🔍 Debug - Timeline data structure:', data);
    console.log('🔍 Debug - First timeline entry:', data[0]);
    
    // Group data by date
    const groupedByDate = data.reduce((acc: any, entry) => {
      const date = entry.date
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(entry)
      return acc
    }, {})

    // Sort dates in descending order (most recent first)
    const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    
    console.log('🔍 Debug - Grouped by date:', groupedByDate);
    console.log('🔍 Debug - Sample grouped entry:', Object.values(groupedByDate)[0]);

    return (
      <div className="mt-4 mb-4 bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900 border border-gray-700/50 shadow-2xl overflow-hidden rounded-lg max-w-full">
        <div className="bg-gray-700/50 px-3 py-2 border-b border-gray-600/50">
          <h3 className="text-xs font-semibold text-blue-400 flex items-center gap-1">
            📅 Historical Assessment Timeline
          </h3>
        </div>
        <div className="p-3">
          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-4">
              {sortedDates.map((date, dateIndex) => (
                <div key={dateIndex} className="border border-gray-600/40 rounded-lg overflow-hidden bg-gray-750/30">
                  {/* Date Header */}
                  <div className="bg-gray-700/40 px-3 py-2 border-b border-gray-600/30">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                      <span className="text-sm font-semibold text-gray-200">{date}</span>
                      <span className="text-xs text-gray-400">({groupedByDate[date].length} assessments)</span>
                    </div>
                  </div>
                  
                  {/* Assessment Cards for this date */}
                  <div className="p-2 space-y-2">
                    {groupedByDate[date].map((entry: any, entryIndex: number) => (
                      <div key={entryIndex} className="flex items-center justify-between p-2 rounded bg-gray-700/20 border border-gray-600/20">
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-200">{entry.domain}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono bg-gray-600/50 px-2 py-0.5 rounded text-blue-200 font-medium">
                            Score: {entry.score !== undefined ? entry.score : (entry.value !== undefined ? entry.value : 'N/A')}
                          </span>
                          <span className="text-xs text-gray-400 bg-gray-600/30 px-1.5 py-0.5 rounded">
                            {entry.type?.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderTrendData = (data: any) => {
    console.log('🔍 Debug - renderTrendData called with:', data);
    console.log('🔍 Debug - data is object:', typeof data === 'object');
    console.log('🔍 Debug - data keys:', Object.keys(data));
    
    const trendChartData = Object.entries(data).map(([key, value]: [string, any]) => ({
      name: key === 'ptsd' ? 'PTSD' : 
            key === 'phq' ? 'Depression' :
            key === 'gad' ? 'Anxiety' :
            key === 'who' ? 'Function' :
            key === 'ders' ? 'Emotion Reg' : key,
      change: value.change,
      percentChange: value.percentChange,
      assessmentCount: value.assessmentCount,
      direction: value.direction,
      trend: value.trend
    }))

    return (
      <div className="mt-4 mb-4 bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900 border border-gray-700/50 shadow-2xl overflow-hidden rounded-lg max-w-full">
        <div className="bg-gray-700/50 px-3 py-2 border-b border-gray-600/50">
          <h3 className="text-xs font-semibold text-blue-400 flex items-center gap-1">
            📊 Trend Analysis Chart
          </h3>
        </div>
        <div className="p-3">
          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={trendChartData} 
                margin={{ top: 10, right: 15, left: 10, bottom: 35 }}
                barCategoryGap="10%"
                barGap={2}
              >
                <defs>
                  <linearGradient id="trendBarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.9}/>
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.7}/>
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="1 3" 
                  stroke="#374151" 
                  strokeOpacity={0.4}
                  horizontal={true}
                  vertical={false}
                />
                <XAxis 
                  dataKey="name" 
                  stroke="#9CA3AF" 
                  fontSize={9}
                  fontWeight={500}
                  tick={{ fill: "#D1D5DB" }}
                  axisLine={{ stroke: "#4B5563", strokeWidth: 1 }}
                  tickLine={{ stroke: "#6B7280", strokeWidth: 1 }}
                  angle={-20}
                  textAnchor="end"
                  height={55}
                  interval={0}
                />
                <YAxis 
                  stroke="#9CA3AF" 
                  fontSize={10}
                  fontWeight={500}
                  tick={{ fill: "#D1D5DB" }}
                  axisLine={{ stroke: "#4B5563", strokeWidth: 1 }}
                  tickLine={{ stroke: "#6B7280", strokeWidth: 1 }}
                  label={{ 
                    value: 'Change', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle', fill: '#9CA3AF', fontSize: '10px', fontWeight: 500 }
                  }}
                />
                <Tooltip 
                  cursor={false}
                  contentStyle={{
                    backgroundColor: '#111827',
                    border: '1px solid #6B7280',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                    color: '#F9FAFB',
                    fontSize: '12px',
                    fontWeight: '500',
                    padding: '8px 12px',
                    backdropFilter: 'blur(8px)'
                  }}
                  labelStyle={{
                    color: '#E5E7EB',
                    fontSize: '13px',
                    fontWeight: '600',
                    marginBottom: '2px'
                  }}
                  itemStyle={{
                    color: '#D1D5DB',
                    fontSize: '11px',
                    fontWeight: '500'
                  }}
                  formatter={(value: number, name: string, props: any) => [
                    `${value} points (${props.payload.percentChange}%)`,
                    `${props.payload.direction} ${props.payload.trend}`
                  ]}
                />
                <Bar 
                  dataKey="change" 
                  fill="url(#trendBarGradient)" 
                  radius={[6, 6, 0, 0]}
                  stroke="#10B981"
                  strokeWidth={1}
                  style={{
                    filter: "drop-shadow(0 4px 15px rgba(16, 185, 129, 0.3)) drop-shadow(0 2px 8px rgba(0, 0, 0, 0.2))"
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    )
  }

  const renderFormattedText = (text: string) => (
    <div className="leading-relaxed">
      {text.split('\n').map((line, i) => (
        <p key={i} className="mb-2 last:mb-0 text-sm">
          {line.includes('**') ? (
            line.split('**').map((part, j) => 
              j % 2 === 1 ? <strong key={j} className="text-blue-400 font-semibold">{part}</strong> : part
            )
          ) : line}
        </p>
      ))}
    </div>
  )

  if (role === 'user') {
    return (
      <div className="prose prose-sm prose-invert max-w-none">
        <p className="text-sm font-medium">{content}</p>
      </div>
    )
  }

  const { assessmentTable, chartData, timelineData, trendData, plainText } = parseStructuredData(content)
  console.log('🔍 Debug - trendData:', trendData);
  console.log('🔍 Debug - trendData type:', typeof trendData);
  console.log('🔍 Debug - trendData keys:', trendData ? Object.keys(trendData) : 'null');
  return (
    <div className="prose prose-sm prose-invert max-w-none">
      {/* Render formatted text */}
      {plainText && renderFormattedText(plainText)}
      
      {/* Render assessment table if present */}
      {assessmentTable && renderAssessmentTable(assessmentTable)}
      
      {/* Render chart if present */}
      {chartData && (
        chartData.length > 0 && chartData[0].name && chartData[0].value !== undefined
          ? renderChart(chartData)
          : null
      )}
      
      {/* Render timeline if present */}
      {timelineData && timelineData.length > 0 && renderTimelineData(timelineData)}
      
      {/* Render trend data if present */}
      {trendData && (() => {
        console.log('🔍 Debug - Rendering trend data!', trendData);
        return renderTrendData(trendData);
      })()}
    </div>
  )
}
