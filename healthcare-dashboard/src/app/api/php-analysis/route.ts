import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    console.log('🔬 PHP Analysis API called with', messages.length, 'messages')
    
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY not found in environment variables')
      return NextResponse.json({ 
        error: 'OpenAI API key not configured' 
      }, { status: 500 })
    }

    console.log('🤖 Generating PHP analysis response with gpt-4o')
    const result = await generateText({
      model: openai("gpt-4o"),
      messages,
      maxTokens: 1000,
      temperature: 0.7,
    })

    console.log('✅ PHP analysis completed, response length:', result.text.length)
    
    return NextResponse.json({
      response: result.text,
      usage: result.usage
    })

  } catch (error) {
    console.error('❌ Error in PHP analysis processing:', error)
    
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
} 