"use client"

/**
 * CooldownBanner
 * 
 * Visual countdown UI displayed during API cooldown periods.
 * Shows remaining time, operation description, and progress bar.
 * 
 * Features:
 * - Real-time countdown (updates every second)
 * - Progress bar visualization
 * - User-friendly operation descriptions
 * - Auto-hide when complete
 * 
 * @see docs/ai-chatbot/AI_COOLDOWN_AND_EDITING_FIXES.md
 */

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Clock, Loader2 } from "lucide-react"

interface CooldownBannerProps {
  /**
   * Remaining cooldown time in seconds
   */
  remainingSeconds: number
  
  /**
   * User-friendly operation description
   * e.g., "Creating 4 lessons", "Updating lesson"
   */
  operationDescription: string
  
  /**
   * Callback when cooldown completes
   */
  onComplete?: () => void
}

export function CooldownBanner({ 
  remainingSeconds, 
  operationDescription,
  onComplete 
}: CooldownBannerProps) {
  const [seconds, setSeconds] = useState(remainingSeconds)
  const [totalSeconds] = useState(remainingSeconds)
  
  // Update seconds when prop changes (e.g., new cooldown started)
  useEffect(() => {
    setSeconds(remainingSeconds)
  }, [remainingSeconds])
  
  // Countdown timer effect
  useEffect(() => {
    if (seconds <= 0) {
      onComplete?.()
      return
    }
    
    const timer = setInterval(() => {
      setSeconds(prev => {
        const next = prev - 1
        if (next <= 0) {
          clearInterval(timer)
          onComplete?.()
        }
        return Math.max(0, next)
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [seconds, onComplete])
  
  // Calculate progress percentage
  const progress = totalSeconds > 0 
    ? ((totalSeconds - seconds) / totalSeconds) * 100 
    : 0
  
  // Hide banner when countdown complete
  if (seconds <= 0) {
    return null
  }
  
  return (
    <Alert className="mb-4 border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950">
      <Loader2 className="h-4 w-4 animate-spin text-indigo-600 dark:text-indigo-400" />
      <AlertTitle className="text-indigo-900 dark:text-indigo-100">
        {operationDescription}...
      </AlertTitle>
      <AlertDescription className="space-y-2">
        <p className="text-indigo-700 dark:text-indigo-300 flex items-center">
          <Clock className="h-3 w-3 inline mr-1" />
          Please wait <strong className="mx-1">{seconds}s</strong> before sending next message
        </p>
        <Progress 
          value={progress} 
          className="h-2 bg-indigo-100 dark:bg-indigo-900" 
        />
      </AlertDescription>
    </Alert>
  )
}
