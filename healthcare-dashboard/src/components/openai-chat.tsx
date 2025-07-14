"use client"

import { useChat } from 'ai/react'
import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Send, User, Brain, Loader2, RotateCcw } from 'lucide-react'
import { EnhancedChatRenderer } from './enhanced-chat-renderer'

export function OpenAIChat() {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  
  const { messages, input, handleInputChange, handleSubmit, isLoading, error, setMessages } = useChat({
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

  // Auto-scroll to bottom within chat container when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      // Small delay to ensure content is fully rendered before scrolling
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTo({
            top: chatContainerRef.current.scrollHeight,
            behavior: 'smooth'
          })
        }
      }, 100)
    }
  }, [messages, isLoading])

  // Debug: Track message changes
  useEffect(() => {
    console.log('💬 Messages updated:', messages.length, 'messages')
    console.log('💬 Latest messages:', messages.slice(-2))
    console.log('💬 Loading state:', isLoading)
    console.log('💬 Error state:', error)
  }, [messages, isLoading, error])

  // Clear chat function
  const clearChat = () => {
    setMessages([])
  }

  return (
    <Card className="bg-gray-800 border-gray-700 w-full h-fit">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-400" />
            AI Healthcare Analytics Assistant
          </CardTitle>
          {messages.length > 0 && (
            <Button
              onClick={clearChat}
              variant="outline"
              size="sm"
              className="bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-red-600/20 hover:border-red-500/50 hover:text-red-400 transition-all duration-200 shadow-sm hover:shadow-md"
              disabled={isLoading}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Clear Chat
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="flex flex-col space-y-4">
          {/* Messages */}
          <div 
            ref={chatContainerRef}
            className="min-h-[400px] max-h-[80vh] overflow-y-auto space-y-4 p-6 transition-all duration-500 ease-in-out border border-gray-700 rounded-lg bg-gray-900/50 scroll-smooth"
          >
            {messages.length === 0 && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div className="p-4 rounded-xl bg-gray-700 text-gray-100 border border-gray-600 shadow-lg">
                  <div className="text-sm leading-relaxed">
                    <strong className="text-blue-400 font-semibold">AI Healthcare Analytics Assistant</strong><br/>
                    I can generate clinical reports, patient assessments, and interactive visualizations.<br/>
                    Try asking: <em className="text-gray-300">"Show me a sample clinical report"</em> or <em className="text-gray-300">"Create patient assessment summary"</em>
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
                    className={`p-4 rounded-xl shadow-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-100 border border-gray-600'
                    }`}
                  >
                    {/* Enhanced message rendering with table and chart support */}
                    <EnhancedChatRenderer content={message.content || ''} role={message.role as "user" | "assistant"} />
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div className="p-4 rounded-xl bg-gray-700 text-gray-100 border border-gray-600 shadow-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                    <span className="text-sm text-gray-300 ml-2">AI is analyzing healthcare data...</span>
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
          }} className="flex gap-3 mt-6">
            <Input
              id="chat-input"
              name="message"
              value={input}
              onChange={handleInputChange}
              placeholder="Ask for comprehensive reports, patient assessments, or clinical insights with charts..."
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 h-12 text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              disabled={isLoading}
              autoComplete="off"
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-8 h-12 font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Analyzing</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  <span>Ask AI</span>
                </div>
              )}
            </Button>
          </form>

          {/* Clinical Quick Actions */}
          <div className="mt-4">
            <p className="text-xs text-gray-400 mb-3 font-medium">Quick Clinical Queries:</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                "Show available patients",
                "Comprehensive analytical report for patient 01cb6dae438c", 
                "Historical trends for patient AHCM001",
                "Show me a sample clinical report"
              ].map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleInputChange({ target: { value: suggestion } } as any)}
                  className="text-xs px-4 py-2 bg-gradient-to-r from-gray-700/60 to-gray-600/40 hover:from-gray-600/60 hover:to-gray-500/40 border border-gray-600 rounded-lg text-gray-300 hover:text-white transition-all duration-200 text-left font-medium shadow-sm hover:shadow-md"
                  disabled={isLoading}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 
