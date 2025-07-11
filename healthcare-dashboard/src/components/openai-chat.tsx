"use client"

import { useChat } from 'ai/react'
import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Send, Bot, User, Brain, Loader2 } from 'lucide-react'

export function OpenAIChat() {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: '/api/chat',
    streamProtocol: 'text', // Use text stream protocol as fallback
    onError: (error) => {
      console.error('🚨 Chat error:', error)
    },
    onFinish: (message) => {
      console.log('✅ Chat message finished:', message)
    },
    onResponse: (response) => {
      console.log('📡 Raw response received:', response)
      console.log('📡 Response headers:', response.headers)
      console.log('📡 Response status:', response.status)
    },
    initialMessages: [],
    })

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Debug: Track message changes
  useEffect(() => {
    console.log('💬 Messages updated:', messages.length, 'messages')
    console.log('💬 Latest messages:', messages.slice(-2))
    console.log('💬 Loading state:', isLoading)
    console.log('💬 Error state:', error)
  }, [messages, isLoading, error])

  return (
    <Card className="bg-gray-800 border-gray-700 w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-white flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-400" />
          AI Healthcare Analytics Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="flex flex-col space-y-4">
          {/* Messages */}
          <div className="min-h-[300px] max-h-[75vh] lg:max-h-[70vh] overflow-y-auto space-y-4 p-2 transition-all duration-300 ease-in-out border border-gray-700 rounded-lg bg-gray-900/50">
            {messages.length === 0 && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div className="p-3 rounded-lg bg-gray-700 text-gray-100 border border-gray-600">
                  <div className="text-sm">
                    <strong>AI Healthcare Analytics Assistant</strong><br/>
                    I can analyze patient risk profiles, identify high-risk patients, and provide clinical insights.<br/>
                    Try asking: <em>"Analyze the risk profile for patient 0156b2ff0c18"</em>
                  </div>
                </div>
              </div>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`flex items-start gap-3 max-w-[85%] ${
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div
                    className={`p-2 rounded-full ${
                      message.role === 'user'
                        ? 'bg-blue-600'
                        : 'bg-gradient-to-r from-purple-600 to-blue-600'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Brain className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div
                    className={`p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-100 border border-gray-600'
                    }`}
                  >
                    <div className="prose prose-sm prose-invert max-w-none">
                      {/* Debug: Show raw content if formatting fails */}
                      {message.content ? (
                        <div 
                          className="whitespace-pre-wrap text-sm"
                          dangerouslySetInnerHTML={{
                            __html: message.content
                              .replace(/\*\*(.*?)\*\*/g, '<strong class="text-blue-300">$1</strong>')
                              .replace(/• (.*?)(\n|$)/g, '<div class="flex items-start gap-2 my-1"><span class="text-blue-400 mt-1">•</span><span>$1</span></div>')
                              .replace(/- (.*?)(\n|$)/g, '<div class="flex items-start gap-2 my-1"><span class="text-blue-400 mt-1">-</span><span>$1</span></div>')
                              .replace(/\n\n/g, '<br/><br/>')
                          }}
                        />
                      ) : (
                        <div className="text-gray-400 text-xs">
                          [Empty response - check browser console for details]
                          <br/>
                          Message ID: {message.id}
                          <br/>
                          Role: {message.role}
                          <br/>
                          Content length: {message.content?.length || 0}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div className="p-3 rounded-lg bg-gray-700 text-gray-100 border border-gray-600">
                  <div className="flex items-center gap-2">
                    <Loader2 className="animate-spin h-4 w-4 text-blue-400" />
                    <span className="text-sm">AI is analyzing healthcare data...</span>
                  </div>
                </div>
              </div>
            )}
            
            {error && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-red-600">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div className="p-3 rounded-lg bg-red-900 text-red-100 border border-red-600">
                  <div className="text-sm">
                    <strong>Error:</strong> {error.message}
                  </div>
                </div>
              </div>
            )}
            
            {/* Auto-scroll target */}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={(e) => {
            console.log('📤 Submitting form with input:', input)
            handleSubmit(e)
          }} className="flex gap-2">
            <Input
              id="chat-input"
              name="message"
              value={input}
              onChange={handleInputChange}
              placeholder="Ask about patient risk analysis, clinical insights, or treatment recommendations..."
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              disabled={isLoading}
              autoComplete="off"
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
} 