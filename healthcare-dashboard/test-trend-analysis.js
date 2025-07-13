// Test script to debug trend analysis with real patient data
const testTrendAnalysis = async (patientId) => {
  console.log(`🔍 Testing trend analysis for patient: ${patientId}`)
  
  try {
    // Test 1: Check if patient exists
    const response = await fetch('http://localhost:3001/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{
          role: 'user',
          content: `Show comprehensive clinical assessment of patient ${patientId}`
        }]
      })
    })
    
    const result = await response.text()
    console.log('📊 Response received:', result.substring(0, 500) + '...')
    
    // Test 2: Check for trend data tags
    const trendDataMatch = result.match(/\[TREND_DATA\]([\s\S]*?)\[\/TREND_DATA\]/)
    if (trendDataMatch) {
      console.log('✅ Trend data found:', JSON.parse(trendDataMatch[1]))
    } else {
      console.log('❌ No trend data found in response')
    }
    
    // Test 3: Check for timeline data tags
    const timelineDataMatch = result.match(/\[TIMELINE_DATA\]([\s\S]*?)\[\/TIMELINE_DATA\]/)
    if (timelineDataMatch) {
      console.log('✅ Timeline data found:', JSON.parse(timelineDataMatch[1]))
    } else {
      console.log('❌ No timeline data found in response')
    }
    
    // Test 4: Check if real data flag is set
    const isRealDataMatch = result.match(/Data Source: (REAL CLINICAL DATA|DEMONSTRATION DATA)/)
    console.log('📋 Data source:', isRealDataMatch ? isRealDataMatch[1] : 'Unknown')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Test with real patient IDs from database
const testPatients = ['01cb6dae438c', '0f31f8511e2c', '216266668847']
testPatients.forEach(patientId => {
  setTimeout(() => testTrendAnalysis(patientId), 1000)
}) 