import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Get the MCP server URL from environment or use default
    const mcpServerUrl = process.env.MCP_SERVER_URL || 'http://localhost:8000'
    const mcpEndpoint = `${mcpServerUrl}/mcp/`

    // Forward the request body to the MCP server
    const body = await request.json()
    
    console.log('Proxying MCP request:', body.params?.name || 'unknown tool')

    const response = await fetch(mcpEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream'
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      console.error(`MCP server error: ${response.status} ${response.statusText}`)
      return NextResponse.json(
        { error: `MCP server error: ${response.status} ${response.statusText}` },
        { status: response.status }
      )
    }

    // Get the response text (SSE format)
    const responseText = await response.text()
    
    // Parse SSE format and return the JSON data
    const lines = responseText.trim().split('\n')
    let result = null
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          result = JSON.parse(line.substring(6))
          break
        } catch (e) {
          console.warn('Failed to parse SSE data line:', line)
        }
      }
    }

    if (!result) {
      console.error('Failed to parse MCP server response:', responseText)
      return NextResponse.json(
        { error: 'Failed to parse MCP server response' },
        { status: 500 }
      )
    }

    // Return the parsed JSON response
    return NextResponse.json(result)

  } catch (error) {
    console.error('MCP proxy error:', error)
    return NextResponse.json(
      { error: `Proxy error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
} 