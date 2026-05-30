"use client"

/**
 * Teacher AI Assistant Page
 * 
 * Interactive chatbot interface for course creation assistance.
 * Features:
 * - Real-time chat with TeacherBot
 * - Course structure planning
 * - Lesson generation
 * - Quiz creation
 * - Conversation history
 * 
 * Phase 1 MVP Implementation
 * @see docs/TEACHER_CHATBOT_PRD.md
 */

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/hooks/use-auth"
import { 
  Bot, 
  Send, 
  Sparkles, 
  Trash2, 
  MessageCircle,
  Loader2,
  User,
  AlertCircle,
  Brain,
  Zap
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { TokenUsageBadge } from "@/components/ai-chatbot/token-usage-badge"
import { CooldownBanner } from "@/components/ai-chatbot/cooldown-banner"
import { CooldownManager } from "@/lib/services/ai/cooldown-manager"

interface Message {
  id: string
  role: 'user' | 'model'
  content: string
  timestamp: Date
  status?: 'pending' | 'sending' | 'sent'
  functionCalls?: Array<{
    name: string
    response: {
      success: boolean
      data?: any
      error?: string
    }
  }>
  tokenUsage?: {
    inputTokens: number
    outputTokens: number
    cachedTokens?: number
    model?: string
  }
}

type ChatMode = 'planning' | 'building'

interface PendingQueueItem {
  id: string
  content: string
  mode: ChatMode
}

export default function TeacherAIAssistant() {
  const { user, token } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [mode, setMode] = useState<ChatMode>('planning')
  const [error, setError] = useState<string | null>(null)
  const [showModeSwitchDialog, setShowModeSwitchDialog] = useState(false)
  const [modeSwitchReason, setModeSwitchReason] = useState<string>('')
  const [pendingMessage, setPendingMessage] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<Message[]>([])
  
  // Cooldown state management
  const [cooldownManager] = useState(() => new CooldownManager())
  const [cooldownRemaining, setCooldownRemaining] = useState(0)
  const [cooldownOperation, setCooldownOperation] = useState('')
  const [pendingQueue, setPendingQueue] = useState<PendingQueueItem[]>([])
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null)

  /**
   * Calculate cumulative token usage and cost across all messages
   * Returns running totals up to and including the specified message index
   */
  const calculateCumulativeUsage = (upToIndex: number) => {
    let totalTokens = 0
    let totalCost = 0

    // EUR pricing (converted from USD)
    const INPUT_COST = 0.070 / 1000000
    const OUTPUT_COST = 0.28 / 1000000
    const CACHED_COST = 0.0175 / 1000000

    for (let i = 0; i <= upToIndex; i++) {
      const msg = messages[i]
      if (msg.tokenUsage) {
        const { inputTokens, outputTokens, cachedTokens = 0 } = msg.tokenUsage
        totalTokens += inputTokens + outputTokens
        
        const regularInputCost = (inputTokens - cachedTokens) * INPUT_COST
        const cachedInputCost = cachedTokens * CACHED_COST
        const outputCost = outputTokens * OUTPUT_COST
        totalCost += regularInputCost + cachedInputCost + outputCost
      }
    }

    return { totalTokens, totalCost }
  }

  // Update cooldown state every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCooldownRemaining(cooldownManager.getRemainingTime())
      setCooldownOperation(cooldownManager.getOperationDescription())
    }, 1000)
    
    return () => clearInterval(interval)
  }, [cooldownManager])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load conversation history from localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem('teacher-chatbot-history')
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages)
        setMessages(parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
          status: msg.status === 'pending' ? 'sent' : msg.status || 'sent'
        })))
      } catch (e) {
        console.error('Failed to parse saved messages:', e)
      }
    }
  }, [])

  // Save conversation history to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('teacher-chatbot-history', JSON.stringify(messages))
    }
  }, [messages])

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const sendMessageNow = useCallback(async (queueItem: PendingQueueItem) => {
    if (!token) {
      setError('You must be signed in to use the AI assistant')
      return
    }

    setActiveRequestId(queueItem.id)
    setIsLoading(true)
    setError(null)
    setMessages(prev => prev.map(msg =>
      msg.id === queueItem.id ? { ...msg, status: 'sending' } : msg
    ))

    const abortController = new AbortController()
    const timeoutId = setTimeout(() => abortController.abort(), 120000)

    const filteredMessages = messagesRef.current.filter(msg =>
      msg.status !== 'pending' || msg.id === queueItem.id
    )

    const historyHasCurrent = filteredMessages.some(msg => msg.id === queueItem.id)
    const conversationHistory = filteredMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }))

    if (!historyHasCurrent) {
      conversationHistory.push({ role: 'user', content: queueItem.content })
    }

    try {
      const response = await fetch('/api/ai/teacher-bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: queueItem.content,
          conversationHistory,
          mode: queueItem.mode
        }),
        signal: abortController.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        cooldownManager.clear()
        setCooldownRemaining(0)
        setCooldownOperation('')

        const data = await response.json()
        throw new Error(data.error || 'Failed to get response from AI')
      }

      const data = await response.json()

      setMessages(prev => prev.map(msg =>
        msg.id === queueItem.id ? { ...msg, status: 'sent' } : msg
      ))

      if (data.modeSwitchSuggested) {
        setShowModeSwitchDialog(true)
        setModeSwitchReason(data.modeSwitchReason || 'This action requires Building Mode')
        setPendingMessage(queueItem.content)

        const suggestionMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'model',
          content: data.message,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, suggestionMessage])
        return
      }

      let finalContent = data.message || ''

      if (!finalContent && data.conversationHistory && Array.isArray(data.conversationHistory)) {
        const lastUserIndex = data.conversationHistory.findLastIndex((msg: any) => msg.role === 'user')

        if (lastUserIndex !== -1) {
          const messagesAfterUser = data.conversationHistory.slice(lastUserIndex + 1)
          const modelResponses = messagesAfterUser.filter((msg: any) => msg.role === 'model')

          if (modelResponses.length > 0) {
            const lastResponse = modelResponses[modelResponses.length - 1]
            finalContent = lastResponse.parts?.[0]?.text || ''
          }
        }
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'model',
        content: finalContent,
        timestamp: new Date(),
        functionCalls: data.functionCalls,
        tokenUsage: data.tokenUsage
      }

      setMessages(prev => [...prev, assistantMessage])

      if (data.functionCalls && data.functionCalls.length > 0) {
        cooldownManager.startCooldown(data.functionCalls)
        setCooldownRemaining(cooldownManager.getRemainingTime())
        setCooldownOperation(cooldownManager.getOperationDescription())
      }

    } catch (err: any) {
      clearTimeout(timeoutId)
      console.error('Chatbot error:', err)

      cooldownManager.clear()
      setCooldownRemaining(0)
      setCooldownOperation('')
      setMessages(prev => prev.map(msg =>
        msg.id === queueItem.id ? { ...msg, status: 'sent' } : msg
      ))

      let errorMsg = 'Failed to communicate with AI assistant'
      if (err.name === 'AbortError') {
        errorMsg = 'Request timed out. The AI is taking too long to respond. Please try a simpler request or try again.'
      } else if (err.message) {
        errorMsg = err.message
      }

      setError(errorMsg)

      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'model',
        content: `⚠️ Sorry, I encountered an error: ${errorMsg}. Please try again.`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setActiveRequestId(null)
    }
  }, [token, cooldownManager])

  useEffect(() => {
    if (pendingQueue.length === 0) return
    if (isLoading || activeRequestId) return
    if (cooldownManager.isActive() || cooldownRemaining > 0) return

    const nextItem = pendingQueue[0]
    setPendingQueue(prev => prev.slice(1))
    sendMessageNow(nextItem)
  }, [pendingQueue, isLoading, activeRequestId, cooldownRemaining, cooldownManager, sendMessageNow])

  // Send message to chatbot (queues when cooldown is active)
  const handleSendMessage = (customMessage?: string, customMode?: ChatMode) => {
    const messageToSend = customMessage || input.trim()
    const modeToUse = customMode || mode

    if (!messageToSend || !token) return

    const requiresQueue =
      cooldownManager.isActive() ||
      cooldownRemaining > 0 ||
      isLoading ||
      activeRequestId !== null ||
      pendingQueue.length > 0
    const messageId = `user-${Date.now()}`

    const userMessage: Message = {
      id: messageId,
      role: 'user',
      content: messageToSend,
      timestamp: new Date(),
      status: requiresQueue ? 'pending' : 'sending'
    }

    setMessages(prev => [...prev, userMessage])

    if (!customMessage) {
      setInput('')
    }

    if (requiresQueue) {
      setPendingQueue(prev => [...prev, { id: messageId, content: messageToSend, mode: modeToUse }])
      return
    }

    sendMessageNow({ id: messageId, content: messageToSend, mode: modeToUse })
  }

  // Clear conversation
  const handleClearConversation = () => {
    if (confirm('Are you sure you want to clear the conversation history?')) {
      setMessages([])
      localStorage.removeItem('teacher-chatbot-history')
      setPendingQueue([])
      setActiveRequestId(null)
      setIsLoading(false)
      cooldownManager.clear()
      setCooldownRemaining(0)
      setCooldownOperation('')
    }
  }

  // Handle mode switch confirmation
  const handleConfirmModeSwitch = async () => {
    setMode('building')
    setShowModeSwitchDialog(false)
    
    // Auto-retry the pending message in building mode
    if (pendingMessage) {
      await handleSendMessage(pendingMessage, 'building')
      setPendingMessage(null)
    }
  }
  
  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <ProtectedRoute allowedRoles={['teacher']}>
      <div className="container max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-indigo-600" />
              AI Course Assistant
            </h1>
            <p className="text-muted-foreground mt-1">
              Create courses faster with AI-powered assistance
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Mode Toggle */}
            <Badge 
              variant={mode === 'planning' ? 'secondary' : 'default'}
              className="cursor-pointer"
              onClick={() => setMode(mode === 'planning' ? 'building' : 'planning')}
            >
              {mode === 'planning' ? '🧠 Planning Mode' : '⚡ Building Mode'}
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearConversation}
              disabled={messages.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Chat
            </Button>
          </div>
        </div>

        {/* Info Alert */}
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>How to use the AI Assistant</AlertTitle>
          <AlertDescription>
            <strong>Planning Mode:</strong> Discuss ideas, get advice, structure your course (no actions taken).<br />
            <strong>Building Mode:</strong> Create courses and lessons directly in the platform (requires confirmation).
          </AlertDescription>
        </Alert>

        {/* Cooldown Banner */}
        {cooldownRemaining > 0 && (
          <CooldownBanner
            remainingSeconds={cooldownRemaining}
            operationDescription={cooldownOperation}
            onComplete={() => {
              setCooldownRemaining(0)
              setCooldownOperation('')
            }}
          />
        )}

        {/* Chat Interface */}
        <Card className="h-[600px] flex flex-col">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              TeacherBot
            </CardTitle>
            <CardDescription>
              Your AI assistant for course creation
            </CardDescription>
          </CardHeader>

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <MessageCircle className="h-16 w-16 mb-4 opacity-20" />
                <h3 className="text-lg font-semibold mb-2">Start a conversation</h3>
                <p className="text-sm max-w-md">
                  Try: "I want to create a Spanish course for beginners" or "Help me structure a business English course"
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => {
                  const { totalTokens, totalCost } = calculateCumulativeUsage(index)
                  return (
                    <MessageBubble 
                      key={message.id} 
                      message={message} 
                      cumulativeTokens={totalTokens}
                      cumulativeCost={totalCost}
                    />
                  )
                })}
                {isLoading && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-indigo-100">
                      <Loader2 className="h-5 w-5 text-indigo-600 animate-spin" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input Area */}
          <CardContent className="border-t p-4">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>{error}</span>
                  {cooldownRemaining > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        cooldownManager.clear()
                        setCooldownRemaining(0)
                        setCooldownOperation('')
                        setError(null)
                      }}
                      className="ml-4"
                    >
                      Clear Cooldown
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            )}
            <div className="flex gap-2 mb-2">
              {/* Mode Toggle Button (always visible near input) */}
              <Button
                variant={mode === 'planning' ? 'secondary' : 'default'}
                size="sm"
                onClick={() => setMode(mode === 'planning' ? 'building' : 'planning')}
                className="flex items-center gap-1 whitespace-nowrap"
              >
                {mode === 'planning' ? (
                  <>
                    <Brain className="h-3 w-3" />
                    Planning
                  </>
                ) : (
                  <>
                    <Zap className="h-3 w-3" />
                    Building
                  </>
                )}
              </Button>
              
              {/* Input Field */}
              <Input
                placeholder={
                  cooldownRemaining > 0 
                    ? `Cooldown active (${cooldownRemaining}s) — new messages will queue automatically` 
                    : "Type your message... (Press Enter to send)"
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={!token}
                className="flex-1"
              />
              
              {/* Send Button */}
              <Button 
                onClick={() => handleSendMessage()} 
                disabled={!input.trim() || !token}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {mode === 'planning' ? (
                <>💡 <strong>Planning Mode:</strong> Discuss ideas, get advice (no actions)</>
              ) : (
                <>⚡ <strong>Building Mode:</strong> Create courses and lessons (with confirmation)</>
              )}
            </p>
          </CardContent>
        </Card>
        
        {/* Mode Switch Dialog */}
        <AlertDialog open={showModeSwitchDialog} onOpenChange={setShowModeSwitchDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-indigo-600" />
                Switch to Building Mode?
              </AlertDialogTitle>
              <AlertDialogDescription>
                {modeSwitchReason}
                <br /><br />
                <strong>Building Mode</strong> allows the AI to create courses and lessons directly in your account. Would you like to switch now and execute your request?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setShowModeSwitchDialog(false)
                setPendingMessage(null)
              }}>
                Stay in Planning
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmModeSwitch}>
                Switch & Execute
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ProtectedRoute>
  )
}

/**
 * Message Bubble Component
 */
function MessageBubble({ 
  message, 
  cumulativeTokens, 
  cumulativeCost 
}: { 
  message: Message
  cumulativeTokens: number
  cumulativeCost: number
}) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="p-2 rounded-full bg-indigo-100 flex-shrink-0">
          <Bot className="h-5 w-5 text-indigo-600" />
        </div>
      )}
      
      <div className={`flex-1 max-w-[80%] ${isUser ? 'order-first' : ''}`}>
        <div
          className={`rounded-lg p-4 ${
            isUser
              ? 'bg-indigo-600 text-white ml-auto'
              : 'bg-gray-100 text-gray-900'
          }`}
        >
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
          {isUser && message.status && (
            <div className={`mt-2 text-xs opacity-80 ${isUser ? 'text-white' : 'text-muted-foreground'}`}>
              {message.status === 'pending' && '⏳ Pending — will send after cooldown'}
              {message.status === 'sending' && '📤 Sending...'}
            </div>
          )}
          
          {/* Function Call Results */}
          {message.functionCalls && message.functionCalls.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-300 space-y-2">
              {message.functionCalls.map((fc, idx) => (
                <div key={idx} className="text-sm">
                  <Badge variant={fc.response.success ? 'default' : 'destructive'} className="mr-2">
                    {fc.name}
                  </Badge>
                  {fc.response.success ? (
                    <span className="text-green-700">✓ Success</span>
                  ) : (
                    <span className="text-red-700">✗ {fc.response.error}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-muted-foreground">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          {!isUser && message.tokenUsage && (
            <TokenUsageBadge
              inputTokens={message.tokenUsage.inputTokens}
              outputTokens={message.tokenUsage.outputTokens}
              cachedTokens={message.tokenUsage.cachedTokens}
              model={message.tokenUsage.model}
              cumulativeTokens={cumulativeTokens}
              cumulativeCost={cumulativeCost}
              showCurrency={true}
            />
          )}
        </div>
      </div>

      {isUser && (
        <div className="p-2 rounded-full bg-gray-200 flex-shrink-0">
          <User className="h-5 w-5 text-gray-600" />
        </div>
      )}
    </div>
  )
}
