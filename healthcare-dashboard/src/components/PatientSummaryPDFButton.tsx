"use client";
import React from "react";
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { marked } from "marked";

const styles = StyleSheet.create({
  page: { 
    padding: 40, 
    fontFamily: "Helvetica",
    fontSize: 11,
    lineHeight: 1.4,
    backgroundColor: "#ffffff"
  },
  section: { 
    marginBottom: 20, 
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  title: { 
    fontSize: 28, 
    fontWeight: "bold", 
    marginBottom: 20,
    textAlign: "center",
    color: "#1e40af",
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: "#3b82f6"
  },
  subtitle: { 
    fontSize: 18, 
    fontWeight: "bold", 
    marginBottom: 12, 
    marginTop: 16,
    color: "#1e40af"
  },
  text: { fontSize: 11, marginBottom: 8, lineHeight: 1.5 },
  bold: { fontWeight: "bold" },
  italic: { fontStyle: "italic" },
  heading1: { 
    fontSize: 22, 
    fontWeight: "bold", 
    marginBottom: 16, 
    marginTop: 24,
    color: "#1e40af",
    paddingLeft: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 8
  },
  heading2: { 
    fontSize: 18, 
    fontWeight: "bold", 
    marginBottom: 12, 
    marginTop: 18,
    color: "#1f2937",
    paddingLeft: 0,
    backgroundColor: "#f8fafc",
    padding: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6"
  },
  heading3: { 
    fontSize: 16, 
    fontWeight: "bold", 
    marginBottom: 10, 
    marginTop: 14,
    color: "#374151",
    paddingLeft: 0
  },
  list: { marginLeft: 20, marginBottom: 8 },
  listItem: { fontSize: 11, marginBottom: 3, lineHeight: 1.4 },
  table: { 
    display: "table", 
    width: "100%", 
    marginBottom: 16
  },
  tableRow: { flexDirection: "row", minHeight: 22 },
  tableHeader: { backgroundColor: "#1e40af" },
  tableCell: { 
    padding: 6, 
    fontSize: 9, 
    border: "0.5pt solid #e5e7eb", 
    flex: 1,
    textAlign: "left",
    backgroundColor: "#ffffff",
    lineHeight: 1.2
  },
  tableCellHeader: { 
    padding: 6, 
    fontSize: 9, 
    fontWeight: "bold", 
    color: "#ffffff", 
    backgroundColor: "#1e40af", 
    border: "0.5pt solid #1e40af", 
    flex: 1,
    textAlign: "center"
  },
  chartTitle: { 
    fontSize: 18, 
    fontWeight: "bold", 
    color: "#1e40af", 
    marginBottom: 10,
    textAlign: "center"
  },
  chartLabel: { 
    fontSize: 11, 
    width: 120, 
    textAlign: "left", 
    marginRight: 10, 
    color: "#374151",
    fontWeight: "500"
  },
  chartValue: { 
    fontSize: 12, 
    color: "#111827", 
    fontWeight: "bold", 
    minWidth: 30, 
    textAlign: "right", 
    marginLeft: 10 
  },
  chartBar: { 
    height: 20, 
    backgroundColor: "#3b82f6", 
    marginVertical: 6, 
    borderRadius: 6,
    boxShadow: "0 1px 2px rgba(59,130,246,0.2)"
  },
  chartRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 10,
    paddingVertical: 2
  },
  chartSection: { 
    marginTop: 12, 
    marginBottom: 16,
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 6,
    border: "1pt solid #e2e8f0"
  },
  trendTable: { display: "table", width: "100%", marginBottom: 16 },
  trendHeader: { backgroundColor: "#0891b2" },
  trendCellHeader: { padding: 6, fontSize: 9, fontWeight: "bold", color: "#ffffff", backgroundColor: "#1e40af", border: "0.5pt solid #1e40af", flex: 1, textAlign: "center" },
  trendCell: { padding: 5, fontSize: 9, border: "0.5pt solid #e5e7eb", flex: 1, textAlign: "left", backgroundColor: "#ffffff", lineHeight: 1.2 },
  timelineSection: { marginTop: 16, marginBottom: 16 },
  header: {
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#1e40af',
    padding: 24,
    marginBottom: 32
  },
  headerText: {
    color: '#1e40af',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 8
  },
  subHeaderText: {
    color: '#374151',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
    fontWeight: 'normal'
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 12
  },
  riskHigh: {
    backgroundColor: '#dc2626',
    color: '#ffffff'
  },
  riskModerate: {
    backgroundColor: '#ea580c',
    color: '#ffffff'
  },
  riskLow: {
    backgroundColor: '#16a34a',
    color: '#ffffff'
  },
  pageNumber: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    fontSize: 10,
    color: '#6b7280'
  },
  riskSection: {
    backgroundColor: '#fef2f2',
    padding: 16,
    marginVertical: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626'
  },
  riskLevelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 8
  },
  riskScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8
  },
  riskScoreText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937'
  },
  prioritySection: {
    marginVertical: 16
  },
  priorityHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6
  },
  highPriority: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626'
  },
  mediumPriority: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b'
  },
  lowPriority: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
    borderLeftWidth: 4,
    borderLeftColor: '#10b981'
  },
  priorityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingLeft: 16
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    marginRight: 10
  },
  priorityText: {
    fontSize: 12,
    lineHeight: 1.5,
    flex: 1
  }
});

// Utility function to truncate text safely
function truncateText(text: string, maxLength: number = 50): string {
  if (!text || typeof text !== 'string') return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

// Utility function to safely parse JSON with error handling
function safeJsonParse(jsonString: string): any {
  try {
    return JSON.parse(jsonString);
  } catch {
    console.warn('Failed to parse JSON data for PDF generation');
    return null;
  }
}

function parseStructuredData(text: string) {
  if (!text || typeof text !== 'string') {
    return { plainText: '', assessmentTable: null, chartData: null, trendData: null, timelineData: null };
  }

  const assessmentMatch = text.match(/\[ASSESSMENT_TABLE\]([\s\S]*?)\[\/ASSESSMENT_TABLE\]/);
  const chartMatch = text.match(/\[CHART_DATA\]([\s\S]*?)\[\/CHART_DATA\]/);
  const trendMatch = text.match(/\[TREND_DATA\]([\s\S]*?)\[\/TREND_DATA\]/);
  const timelineMatch = text.match(/\[TIMELINE_DATA\]([\s\S]*?)\[\/TIMELINE_DATA\]/);

  const plainText = text
    .replace(/\[ASSESSMENT_TABLE\][\s\S]*?\[\/ASSESSMENT_TABLE\]/g, "")
    .replace(/\[CHART_DATA\][\s\S]*?\[\/CHART_DATA\]/g, "")
    .replace(/\[TREND_DATA\][\s\S]*?\[\/TREND_DATA\]/g, "")
    .replace(/\[TIMELINE_DATA\][\s\S]*?\[\/TIMELINE_DATA\]/g, "")
    .trim();

  const assessmentTable = assessmentMatch ? safeJsonParse(assessmentMatch[1]) : null;
  const chartData = chartMatch ? safeJsonParse(chartMatch[1]) : null;
  const trendData = trendMatch ? safeJsonParse(trendMatch[1]) : null;
  const timelineData = timelineMatch ? safeJsonParse(timelineMatch[1]) : null;

  return { plainText, assessmentTable, chartData, trendData, timelineData };
}

// Markdown to react-pdf renderer
function renderMarkdownToPDF(md: string) {
  const tokens = marked.lexer(md);
  function renderTokens(tokens: any[]): any[] {
    return tokens.map((token, idx) => {
      switch (token.type) {
        case "heading":
          // Apply professional styling based on content and depth
          const headingText = token.text.toUpperCase();
          if (token.depth === 1) {
            if (headingText.includes('RISK STRATIFICATION')) {
              return (
                <View key={idx} style={styles.riskSection}>
                  <Text style={[styles.heading1, { color: '#dc2626', borderBottomWidth: 0 }]}>{token.text}</Text>
                </View>
              );
            }
            return <Text key={idx} style={styles.heading1}>{token.text}</Text>;
          }
          if (token.depth === 2) {
            if (headingText.includes('HIGH PRIORITY')) {
              return <Text key={idx} style={[styles.priorityHeader, styles.highPriority]}>{token.text}</Text>;
            }
            if (headingText.includes('MEDIUM PRIORITY')) {
              return <Text key={idx} style={[styles.priorityHeader, styles.mediumPriority]}>{token.text}</Text>;
            }
            if (headingText.includes('LOW PRIORITY')) {
              return <Text key={idx} style={[styles.priorityHeader, styles.lowPriority]}>{token.text}</Text>;
            }
            return <Text key={idx} style={styles.heading2}>{token.text}</Text>;
          }
          return <Text key={idx} style={styles.heading3}>{token.text}</Text>;
        case "paragraph":
          return <Text key={idx} style={styles.text}>{renderInline(token.tokens)}</Text>;
        case "list":
          return (
            <View key={idx} style={[styles.list, { marginLeft: 0 }]}>
              {token.items.map((item: any, i: number) => {
                const itemText = renderInline(item.tokens);
                const isHighPriority = typeof itemText === 'string' && itemText.includes('PTSD') || itemText.includes('Anxiety');
                const isMediumPriority = typeof itemText === 'string' && itemText.includes('Depression') || itemText.includes('Functional');
                const isLowPriority = typeof itemText === 'string' && itemText.includes('Emotion');
                
                return (
                  <View key={i} style={styles.priorityItem}>
                    <View style={[
                      styles.bulletPoint, 
                      { backgroundColor: isHighPriority ? '#dc2626' : isMediumPriority ? '#f59e0b' : isLowPriority ? '#10b981' : '#6b7280' }
                    ]} />
                    <Text style={styles.priorityText}>{itemText}</Text>
                  </View>
                );
              })}
            </View>
          );
        case "space":
          return <Text key={idx} style={styles.text}> </Text>;
        default:
          return null;
      }
    });
  }
  function renderInline(tokens: any[]): any {
    return tokens.map((token, idx) => {
      switch (token.type) {
        case "text":
          // Handle special formatting for risk levels and scores
          if (/Overall Risk Level/i.test(token.text)) {
            const riskLevel = token.text.split(' ').pop();
            const riskColor = riskLevel === 'HIGH' ? '#dc2626' : riskLevel === 'MODERATE' ? '#f59e0b' : '#10b981';
            return (
              <Text key={idx} style={[styles.riskLevelText, { color: riskColor }]}>
                {token.text}
              </Text>
            );
          }
          if (/Composite Risk Score/i.test(token.text)) {
            const scoreMatch = token.text.match(/(\d+)\/(\d+)/);
            if (scoreMatch) {
              return (
                <View key={idx} style={styles.riskScoreContainer}>
                  <Text style={styles.text}>Composite Risk Score: </Text>
                  <Text style={[styles.riskScoreText, { color: '#dc2626' }]}>{scoreMatch[1]}</Text>
                  <Text style={styles.riskScoreText}>/{scoreMatch[2]}</Text>
                </View>
              );
            }
          }
          // Color-code risk levels
          if (/\bHIGH\b/i.test(token.text) && /risk/i.test(token.text)) {
            return <Text key={idx} style={[styles.riskBadge, styles.riskHigh]}>{token.text}</Text>;
          }
          if (/\bMODERATE\b/i.test(token.text) && /risk/i.test(token.text)) {
            return <Text key={idx} style={[styles.riskBadge, styles.riskModerate]}>{token.text}</Text>;
          }
          if (/\bLOW\b/i.test(token.text) && /risk/i.test(token.text)) {
            return <Text key={idx} style={[styles.riskBadge, styles.riskLow]}>{token.text}</Text>;
          }
          // Emphasize important numbers and scores
          if (/\b\d+\/\d+\b/.test(token.text)) {
            return <Text key={idx} style={{ fontWeight: 'bold', color: '#1e40af', fontSize: 14 }}>{token.text}</Text>;
          }
          return token.text;
        case "strong":
          return <Text key={idx} style={styles.bold}>{renderInline(token.tokens)}</Text>;
        case "em":
          return <Text key={idx} style={styles.italic}>{renderInline(token.tokens)}</Text>;
        case "codespan":
          return <Text key={idx} style={{ fontFamily: "monospace", backgroundColor: "#eee", fontSize: 10 }}>{token.text}</Text>;
        case "link":
          return <Text key={idx} style={{ color: "#3B82F6", textDecoration: "underline" }}>{renderInline(token.tokens)}</Text>;
        default:
          return token.raw || "";
      }
    });
  }
  return renderTokens(tokens);
}

function preprocessMarkdown(md: string): string {
  // Convert lines like '**HEADING:**' or '**HEADING**' to '## HEADING'
  let cleaned = md.replace(/^(\*\*|__)([A-Za-z0-9 \-()]+):?(\*\*|__)/gm, '## $2');
  cleaned = cleaned.replace(/^[^\w\n]*\*+(.*?)\*+$/gm, '## $1');
  // Remove stray leading characters like '<', '=', '≠', etc. before headings
  cleaned = cleaned.replace(/^[<>=≠\s]+(#+|\*+)(.*?)$/gm, (match, hashes, rest) => {
    if (hashes.startsWith('#')) return `${hashes} ${rest.trim()}`;
    return `## ${rest.trim()}`;
  });
  cleaned = cleaned.replace(/^[<>=≠\s]+/gm, '');
  return cleaned;
}

function extractSummaryBlock(md: string) {
  // Extract lines like 'Patient ID: ...' etc. from the start of the report
  const summaryLines: { label: string, value: string }[] = [];
  let rest = md;
  const summaryRegex = /^(Patient ID|Assessment Date|Data Source|Total Assessments Reviewed):?\s*(.*)$/gim;
  let match;
  while ((match = summaryRegex.exec(md)) !== null) {
    summaryLines.push({ label: match[1], value: match[2] });
  }
  // Remove these lines from the markdown
  rest = md.replace(summaryRegex, '').replace(/^\s*\n/gm, '');
  return { summaryLines, rest };
}

function SummaryBlockPDF({ summaryLines }: { summaryLines: { label: string, value: string }[] }) {
  if (!summaryLines || summaryLines.length === 0) return null;
  return (
    <View style={{ 
      marginBottom: 24, 
      marginTop: 8, 
      borderWidth: 1, 
      borderColor: '#d1d5db', 
      borderRadius: 8, 
      backgroundColor: '#f9fafb', 
      padding: 16,
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <Text style={{ 
        fontSize: 14, 
        fontWeight: 'bold', 
        color: '#374151', 
        marginBottom: 10,
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 0.5
      }}>Patient Information</Text>
      {summaryLines.map((item, idx) => (
        <View key={idx} style={{ 
          flexDirection: 'row', 
          marginBottom: 6, 
          backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f3f4f6', 
          paddingVertical: 6, 
          paddingHorizontal: 8,
          borderRadius: 4,
          borderLeftWidth: 3,
          borderLeftColor: '#3b82f6'
        }}>
          <Text style={{ 
            fontWeight: 'bold', 
            fontSize: 11, 
            minWidth: 180,
            color: '#374151'
          }}>{item.label}:</Text>
          <Text style={{ 
            fontSize: 11, 
            marginLeft: 8,
            color: '#111827',
            fontWeight: '500'
          }}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

function HeaderPDF() {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  return (
    <View style={styles.header}>
      {/* Top accent line */}
      <View style={{
        width: '100%',
        height: 4,
        backgroundColor: '#1e40af',
        marginBottom: 16
      }} />
      
      <Text style={styles.headerText}>HEALTHCARE DASHBOARD</Text>
      
      {/* Decorative line under main title */}
      <View style={{
        width: 120,
        height: 2,
        backgroundColor: '#3b82f6',
        alignSelf: 'center',
        marginVertical: 8
      }} />
      
      <Text style={styles.subHeaderText}>Comprehensive Clinical Assessment Report</Text>
      <Text style={[styles.subHeaderText, { marginTop: 12, fontSize: 12, color: '#6b7280', fontStyle: 'italic' }]}>Generated on {currentDate}</Text>
      
      {/* Bottom accent line */}
      <View style={{
        width: '100%',
        height: 2,
        backgroundColor: '#e5e7eb',
        marginTop: 16
      }} />
    </View>
  );
}

function DividerPDF() {
  return (
    <View style={{
      marginVertical: 24,
      alignItems: 'center'
    }}>
      <View style={{ 
        borderBottomWidth: 1, 
        borderBottomColor: '#e5e7eb', 
        width: '80%'
      }} />
      <View style={{
        position: 'absolute',
        top: -6,
        backgroundColor: '#ffffff',
        paddingHorizontal: 16
      }}>
        <View style={{
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: '#3b82f6'
        }} />
      </View>
    </View>
  );
}

function AssessmentTablePDF({ data }: { data: any[] }) {
  if (!data || !Array.isArray(data) || data.length === 0) return null;
  
  const getSeverityColor = (severity: string) => {
    if (severity?.toLowerCase().includes('severe')) return '#dc2626';
    if (severity?.toLowerCase().includes('moderate')) return '#ea580c';
    if (severity?.toLowerCase().includes('mild')) return '#eab308';
    return '#16a34a';
  };
  
  const getPriorityLevel = (priority: string) => {
    if (priority?.toLowerCase().includes('high')) return 'High';
    if (priority?.toLowerCase().includes('medium')) return 'Medium';
    if (priority?.toLowerCase().includes('low')) return 'Low';
    return priority || 'N/A';
  };
  
  const getPriorityColor = (priority: string) => {
    if (priority?.toLowerCase().includes('high')) return '#dc2626';
    if (priority?.toLowerCase().includes('medium')) return '#f59e0b';
    return '#16a34a';
  };
  
  return (
    <View style={[styles.section, { break: 'avoid' }]} wrap={false}>
      <Text style={[styles.subtitle, { marginBottom: 8, marginTop: 12 }]}>Multi-Domain Assessment Summary</Text>
      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={styles.tableCellHeader}>Clinical Domain</Text>
          <Text style={styles.tableCellHeader}>Score</Text>
          <Text style={styles.tableCellHeader}>Max</Text>
          <Text style={styles.tableCellHeader}>Severity Level</Text>
          <Text style={styles.tableCellHeader}>Trend</Text>
          <Text style={styles.tableCellHeader}>Priority</Text>
        </View>
        {data.map((row, idx) => (
          <View 
            style={[
              styles.tableRow, 
              { backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }
            ]} 
            key={idx}
          >
            <Text style={[styles.tableCell, { fontWeight: '600' }]}>{truncateText(row.domain || 'N/A', 30)}</Text>
            <Text style={[styles.tableCell, { fontWeight: 'bold', color: '#1e40af', textAlign: 'center' }]}>
              {row.score || '0'}
            </Text>
            <Text style={[styles.tableCell, { textAlign: 'center', color: '#6b7280' }]}>
              {row.maxScore || 'N/A'}
            </Text>
            <Text style={[
              styles.tableCell, 
              { 
                color: getSeverityColor(row.severity),
                fontWeight: '600',
                textAlign: 'center'
              }
            ]}>
              {row.severity || 'Unknown'}
            </Text>
            <Text style={[styles.tableCell, { textAlign: 'center' }]}>
              {row.trend || 'Stable'}
            </Text>
            <Text style={[
              styles.tableCell, 
              { 
                textAlign: 'center', 
                fontWeight: '600',
                color: getPriorityColor(row.priority || 'low')
              }
            ]}>
              {getPriorityLevel(row.priority || 'low')}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ChartBarPDF({ data }: { data: any[] }) {
  if (!data || !Array.isArray(data) || data.length === 0) return null;
  
  // Ensure all data has valid numeric values
  const validData = data.filter(d => d && typeof d.value === 'number' && !isNaN(d.value));
  if (validData.length === 0) return null;
  
  const maxValue = Math.max(...validData.map(d => d.value), 1);
  
  const getBarColor = (value: number, maxValue: number) => {
    const percentage = (value / maxValue) * 100;
    if (percentage >= 80) return '#dc2626'; // High - Red
    if (percentage >= 60) return '#ea580c'; // Moderate-High - Orange
    if (percentage >= 40) return '#eab308'; // Moderate - Yellow
    return '#16a34a'; // Low - Green
  };
  
  const fullNames: Record<string, string> = {
    "PTSD": "PTSD (PCL-5)",
    "Depression": "Depression (PHQ-9)",
    "Anxiety": "Anxiety (GAD-7)",
    "Function": "Function (WHO-DAS)",
    "Emotion Reg": "Emotion Regulation (DERS)",
    "EmotionReg": "Emotion Regulation (DERS)",
  };
  
  return (
    <View style={[styles.chartSection, { break: 'avoid' }]} wrap={false}>
      <Text style={styles.chartTitle}>Assessment Scores Visualization</Text>
      {/* Chart container with fixed height */}
      <View style={{
        marginTop: 16,
        marginBottom: 12,
        paddingHorizontal: 10,
        backgroundColor: '#ffffff',
        borderRadius: 6,
        paddingVertical: 12
      }}>
        {/* Chart area with bars */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          height: 120,
          marginBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: '#e5e7eb'
        }}>
          {validData.map((d, idx) => {
            const barColor = getBarColor(d.value, maxValue);
            const barHeight = Math.max((d.value / maxValue) * 100, 10);
            
            return (
              <View key={idx} style={{ 
                flex: 1, 
                alignItems: 'center',
                height: 120,
                justifyContent: 'flex-end',
                marginHorizontal: 4
              }}>
                {/* Bar */}
                <View style={{
                  width: 32,
                  height: barHeight,
                  backgroundColor: barColor,
                  borderRadius: 4,
                  marginBottom: 2
                }} />
                {/* Value label */}
                <Text style={{ 
                  fontSize: 11, 
                  color: '#111827', 
                  fontWeight: 'bold',
                  marginBottom: 4,
                  textAlign: 'center'
                }}>{d.value}</Text>
              </View>
            );
          })}
        </View>
        
        {/* Domain labels */}
        <View style={{
          flexDirection: 'row',
          marginTop: 4
        }}>
          {validData.map((d, idx) => (
            <View key={idx} style={{ 
              flex: 1, 
              alignItems: 'center',
              marginHorizontal: 4
            }}>
              <Text style={{ 
                fontSize: 9, 
                color: '#374151', 
                textAlign: 'center',
                lineHeight: 1.2,
                fontWeight: '500'
              }}>{fullNames[d.name] || d.name}</Text>
            </View>
          ))}
        </View>
      </View>
      <Text style={{ fontSize: 10, color: '#6b7280', textAlign: 'center', marginTop: 8, fontStyle: 'italic' }}>
        Color coding: High Risk (80%+) | Moderate-High (60-79%) | Moderate (40-59%) | Low Risk (less than 40%)
      </Text>
    </View>
  );
}

function TrendTablePDF({ data }: { data: any }) {
  if (!data || typeof data !== 'object') return null;
  const keys = Object.keys(data);
  if (keys.length === 0) return null;
  
  const getTrendIcon = (direction: string) => {
    if (direction?.toLowerCase().includes('up') || direction?.toLowerCase().includes('increase')) return '^';
    if (direction?.toLowerCase().includes('down') || direction?.toLowerCase().includes('decrease')) return 'v';
    return '-';
  };
  
  return (
    <View style={[styles.section, { break: 'avoid' }]} wrap={false}>
      <Text style={[styles.subtitle, { marginBottom: 8, marginTop: 12 }]}>Historical Trend Analysis</Text>
      <View style={styles.trendTable}>
        <View style={[styles.tableRow, styles.trendHeader]}>
          <Text style={styles.trendCellHeader}>Domain</Text>
          <Text style={styles.trendCellHeader}>Change</Text>
          <Text style={styles.trendCellHeader}>% Change</Text>
          <Text style={styles.trendCellHeader}>Direction</Text>
          <Text style={styles.trendCellHeader}>Trend Pattern</Text>
          <Text style={styles.trendCellHeader}>Data Points</Text>
        </View>
        {keys.map((key, idx) => (
          <View 
            style={[
              styles.tableRow, 
              { backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f0f9ff' }
            ]} 
            key={idx}
          >
            <Text style={[styles.trendCell, { fontWeight: '600' }]}>{key}</Text>
            <Text style={[styles.trendCell, { textAlign: 'center', fontWeight: 'bold' }]}>
              {data[key]?.change || 'N/A'}
            </Text>
            <Text style={[styles.trendCell, { textAlign: 'center', color: '#0891b2', fontWeight: '600' }]}>
              {data[key]?.percentChange || 'N/A'}
            </Text>
            <Text style={[styles.trendCell, { textAlign: 'center' }]}>
              {getTrendIcon(data[key]?.direction)} {data[key]?.direction || 'Stable'}
            </Text>
            <Text style={[styles.trendCell, { fontSize: 9, textAlign: 'center' }]}>
              {data[key]?.trend || 'No trend'}
            </Text>
            <Text style={[styles.trendCell, { textAlign: 'center', color: '#6b7280' }]}>
              {data[key]?.assessmentCount || '0'}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function SimpleTimelineTablePDF({ data }: { data: any[] }) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <View style={[styles.section]}>
        <Text style={[styles.subtitle, { marginBottom: 12 }]}>Historical Assessment Timeline</Text>
        <Text style={{ fontSize: 10, color: '#6b7280', fontStyle: 'italic' }}>
          No historical assessment data available in this report.
        </Text>
      </View>
    );
  }

  // Sort by date, most recent first
  const sortedData = [...data].sort((a, b) => {
    const dateA = new Date(a.date || 0).getTime();
    const dateB = new Date(b.date || 0).getTime();
    return dateB - dateA;
  });

  return (
    <View style={[styles.section]}>
      <Text style={[styles.subtitle, { marginBottom: 12 }]}>Historical Assessment Timeline</Text>
      
      {/* Simple row-by-row display */}
      {sortedData.map((item, index) => (
        <View key={index} style={{
          flexDirection: 'row',
          paddingVertical: 6,
          paddingHorizontal: 8,
          marginBottom: 4,
          backgroundColor: index % 2 === 0 ? '#f8fafc' : '#ffffff',
          borderRadius: 4,
          border: '0.5pt solid #e5e7eb'
        }}>
          <Text style={{ fontSize: 10, flex: 2, fontWeight: 'bold', color: '#374151' }}>
            {item.date || 'Unknown Date'}
          </Text>
          <Text style={{ fontSize: 10, flex: 3, color: '#374151' }}>
            {item.domain || item.type || 'Unknown Assessment'}
          </Text>
          <Text style={{ fontSize: 10, flex: 1, textAlign: 'center', fontWeight: 'bold', color: '#1e40af' }}>
            {item.score || '0'}
          </Text>
        </View>
      ))}
      
      <Text style={{ fontSize: 9, color: '#6b7280', textAlign: 'center', marginTop: 8, fontStyle: 'italic' }}>
        Total: {sortedData.length} assessment records
      </Text>
    </View>
  );
}

function TimelineTablePDF({ data }: { data: any[] }) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <View style={[styles.section]} wrap={true}>
        <Text style={[styles.subtitle, { marginBottom: 12 }]}>Historical Assessment Timeline</Text>
        <Text style={{ fontSize: 10, color: '#6b7280', fontStyle: 'italic' }}>
          No historical assessment data available in this report.
        </Text>
      </View>
    );
  }
  
  // Sort data by date (most recent first) with safe date parsing
  const sortedData = [...data].sort((a, b) => {
    const dateA = new Date(a.date || 0);
    const dateB = new Date(b.date || 0);
    return dateB.getTime() - dateA.getTime();
  });
  
  return (
    <View style={[styles.section]} wrap={true}>
      <Text style={[styles.subtitle, { marginBottom: 12 }]}>Historical Assessment Timeline</Text>
      
      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={styles.tableCellHeader}>Date</Text>
          <Text style={styles.tableCellHeader}>Assessment Domain</Text>
          <Text style={styles.tableCellHeader}>Score</Text>
        </View>
        
        {sortedData.map((item, index) => (
          <View key={`timeline-${index}`} style={[styles.tableRow, { backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc' }]}>
            <Text style={styles.tableCell}>{item.date || 'N/A'}</Text>
            <Text style={styles.tableCell}>{item.domain || item.type || 'Unknown Domain'}</Text>
            <Text style={[styles.tableCell, { textAlign: 'center', fontWeight: 'bold', color: '#1e40af' }]}>
              {item.score || '0'}
            </Text>
          </View>
        ))}
      </View>
      
      <Text style={{ fontSize: 9, color: '#6b7280', textAlign: 'center', marginTop: 8, fontStyle: 'italic' }}>
        Total: {sortedData.length} historical assessments
      </Text>
    </View>
  );
}

function PatientSummaryPDF({ content }: { content: string }) {
  const { plainText, assessmentTable, chartData, trendData, timelineData } = parseStructuredData(content);
  const cleanedText = preprocessMarkdown(plainText);
  const { summaryLines, rest } = extractSummaryBlock(cleanedText);
  
  return (
    <Document
      title="Healthcare Dashboard - Clinical Assessment Report"
      author="Healthcare Dashboard System"
      subject="Comprehensive Clinical Assessment"
      creator="Healthcare Dashboard"
    >
      <Page size="A4" style={styles.page}>
        <HeaderPDF />
        
        <SummaryBlockPDF summaryLines={summaryLines} />
        
        <DividerPDF />
        
        <View style={styles.section}>
          {renderMarkdownToPDF(rest)}
        </View>
        
        {assessmentTable && (
          <>
            <DividerPDF />
            <AssessmentTablePDF data={assessmentTable} />
          </>
        )}
        
        {chartData && (
          <>
            <DividerPDF />
            <ChartBarPDF data={chartData} />
          </>
        )}
        
        {trendData && (
          <>
            <DividerPDF />
            <TrendTablePDF data={trendData} />
          </>
        )}
        
        <DividerPDF />
        <SimpleTimelineTablePDF data={timelineData || []} />
        
        <Text 
          style={styles.pageNumber} 
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}

export default function PatientSummaryPDFButton({ summaryText }: { summaryText: string }) {
  return (
    <PDFDownloadLink
      document={<PatientSummaryPDF content={summaryText} />}
      fileName="patient-summary.pdf"
      className="inline-block"
    >
      {({ loading }) => (
        <Button
          variant="outline"
          size="sm"
          className="bg-blue-600/80 border-blue-500 text-white hover:bg-blue-700/90 hover:border-blue-600 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          {loading ? "Preparing PDF..." : "Download as PDF"}
        </Button>
      )}
    </PDFDownloadLink>
  );
} 