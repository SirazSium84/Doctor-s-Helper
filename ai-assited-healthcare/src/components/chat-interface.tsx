"use client"

import type React from "react"
import { useRef, useEffect } from "react"
import { useChat } from 'ai/react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Bot, User } from "lucide-react"

export function ChatInterface() {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    initialMessages: [
      {
        id: '1',
        role: 'assistant',
        content: 'Hello! I\'m your healthcare analytics assistant. I can help you understand patient data, assessment scores, and provide insights about your dashboard. I have access to your MCP server with tools for analyzing PTSD, PHQ-9, GAD-7, WHO-5, and DERS assessments, as well as substance use patterns and risk analysis. How can I assist you today?'
      }
    ]
  })

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  return (
    <Card className="bg-gray-800 border-gray-700 h-[500px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center space-x-2">
          <Bot className="w-5 h-5 text-blue-400" />
          <span>Healthcare Analytics Assistant</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col space-y-4 p-4">
        <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === "user" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-100"
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(message.createdAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                {message.role === "user" && (
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-700 p-3 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            value={input}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Ask about patient data, assessments, or analytics..."
            className="flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  )
} 