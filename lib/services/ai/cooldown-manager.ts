/**
 * CooldownManager
 * 
 * Manages API cooldown periods to prevent rate limit errors.
 * Enforces wait times between AI function calls based on operation type.
 * 
 * Features:
 * - Dynamic cooldown durations (1-15s based on operation)
 * - Batch operation detection (4+ functions = 15s)
 * - User-friendly operation descriptions
 * - State persistence support (via sessionStorage)
 * 
 * @see docs/ai-chatbot/AI_COOLDOWN_AND_EDITING_FIXES.md
 */

/**
 * Function call interface from AI response
 */
interface FunctionCall {
  name: string
  args?: Record<string, any>
}

/**
 * Cooldown configuration for each function type
 */
const COOLDOWN_CONFIG: Record<string, number> = {
  createCourse: 5,       // Single Firestore write
  createLesson: 3,       // Single lesson write
  createQuizLesson: 3,   // Single quiz write
  updateLesson: 3,       // Single update operation
  getLesson: 1,          // Read operation (minimal)
  getCourseDetails: 1,   // Read operation (minimal)
}

/**
 * Batch operation threshold
 */
const BATCH_THRESHOLD = 4
const BATCH_COOLDOWN = 15

/**
 * Operation description templates
 */
const OPERATION_DESCRIPTIONS: Record<string, string> = {
  createCourse: 'Creating course',
  createLesson: 'Creating lesson',
  createQuizLesson: 'Creating quiz',
  updateLesson: 'Updating lesson',
  getLesson: 'Retrieving lesson',
  getCourseDetails: 'Loading course details',
}

/**
 * CooldownManager - Manages API cooldown state and timing
 */
export class CooldownManager {
  private cooldownEndTime: Date | null = null
  private currentOperation: string | null = null
  private storageKey = 'ai-cooldown-state'

  /**
   * Initialize and restore state from sessionStorage if available
   */
  constructor() {
    this.restoreState()
  }

  /**
   * Start cooldown period after API call
   * @param functionCalls - Array of function calls from AI response
   */
  startCooldown(functionCalls: FunctionCall[]): void {
    const duration = this.calculateCooldownDuration(functionCalls)
    
    if (duration === 0) {
      // No cooldown needed (e.g., planning mode, no function calls)
      this.clear()
      return
    }

    this.cooldownEndTime = new Date(Date.now() + duration * 1000)
    this.currentOperation = this.describeOperation(functionCalls)
    
    // Persist to sessionStorage for page refresh recovery
    this.saveState()
  }

  /**
   * Calculate cooldown duration based on function types
   * @param functionCalls - Array of function calls from AI response
   * @returns Duration in seconds
   */
  private calculateCooldownDuration(functionCalls: FunctionCall[]): number {
    if (functionCalls.length === 0) {
      return 0 // No function calls = no cooldown
    }

    // Batch operation detection
    if (functionCalls.length >= BATCH_THRESHOLD) {
      return BATCH_COOLDOWN
    }

    // Get max cooldown from all functions
    const durations = functionCalls.map(fc => {
      return COOLDOWN_CONFIG[fc.name] || 0
    })

    return Math.max(...durations)
  }

  /**
   * Get remaining cooldown time in seconds
   * @returns Remaining seconds (0 if cooldown inactive)
   */
  getRemainingTime(): number {
    if (!this.cooldownEndTime) {
      return 0
    }

    const remaining = Math.ceil((this.cooldownEndTime.getTime() - Date.now()) / 1000)
    const result = Math.max(0, remaining)

    // Auto-clear if cooldown expired
    if (result === 0) {
      this.clear()
    }

    return result
  }

  /**
   * Check if cooldown is active
   * @returns True if cooldown is active
   */
  isActive(): boolean {
    return this.getRemainingTime() > 0
  }

  /**
   * Get user-friendly operation description
   * @returns Description string (e.g., "Creating 4 lessons")
   */
  getOperationDescription(): string {
    return this.currentOperation || 'Processing...'
  }

  /**
   * Describe operation for UI display
   * @param functionCalls - Array of function calls
   * @returns User-friendly description
   */
  private describeOperation(functionCalls: FunctionCall[]): string {
    if (functionCalls.length === 0) {
      return 'Processing request'
    }

    // Batch operation description
    if (functionCalls.length >= BATCH_THRESHOLD) {
      const lessonCount = functionCalls.filter(fc => 
        fc.name === 'createLesson' || fc.name === 'createQuizLesson'
      ).length

      if (lessonCount > 0) {
        return `Creating ${lessonCount} lesson${lessonCount > 1 ? 's' : ''}`
      }

      return `Processing ${functionCalls.length} operations`
    }

    // Single operation description
    const fc = functionCalls[0]
    return OPERATION_DESCRIPTIONS[fc.name] || 'Processing request'
  }

  /**
   * Clear cooldown (for manual override or errors)
   */
  clear(): void {
    this.cooldownEndTime = null
    this.currentOperation = null
    this.clearState()
  }

  /**
   * Save cooldown state to sessionStorage
   * Allows recovery after page refresh
   */
  private saveState(): void {
    if (!this.cooldownEndTime || !this.currentOperation) {
      return
    }

    try {
      const state = {
        endTime: this.cooldownEndTime.toISOString(),
        operation: this.currentOperation,
      }
      sessionStorage.setItem(this.storageKey, JSON.stringify(state))
    } catch (error) {
      console.error('Failed to save cooldown state:', error)
    }
  }

  /**
   * Restore cooldown state from sessionStorage
   * Called on initialization
   */
  private restoreState(): void {
    try {
      const stateStr = sessionStorage.getItem(this.storageKey)
      if (!stateStr) {
        return
      }

      const state = JSON.parse(stateStr)
      const endTime = new Date(state.endTime)

      // Only restore if cooldown hasn't expired
      if (endTime.getTime() > Date.now()) {
        this.cooldownEndTime = endTime
        this.currentOperation = state.operation
      } else {
        this.clearState()
      }
    } catch (error) {
      console.error('Failed to restore cooldown state:', error)
      this.clearState()
    }
  }

  /**
   * Clear cooldown state from sessionStorage
   */
  private clearState(): void {
    try {
      sessionStorage.removeItem(this.storageKey)
    } catch (error) {
      console.error('Failed to clear cooldown state:', error)
    }
  }

  /**
   * Get total cooldown duration for current operation
   * Useful for progress bar calculations
   * @returns Total duration in seconds
   */
  getTotalDuration(): number {
    if (!this.cooldownEndTime) {
      return 0
    }

    const remaining = this.getRemainingTime()
    if (remaining === 0) {
      return 0
    }

    // Calculate original duration from end time
    const endTimeMs = this.cooldownEndTime.getTime()
    const startTimeMs = endTimeMs - (this.getOriginalDuration() * 1000)
    return Math.ceil((endTimeMs - startTimeMs) / 1000)
  }

  /**
   * Get original cooldown duration (for progress bar)
   * Estimates based on current operation
   * @returns Original duration in seconds
   */
  private getOriginalDuration(): number {
    if (!this.currentOperation) {
      return 0
    }

    // Parse duration from operation description
    if (this.currentOperation.includes('lesson')) {
      const match = this.currentOperation.match(/(\d+)\s+lesson/)
      if (match) {
        const count = parseInt(match[1], 10)
        if (count >= BATCH_THRESHOLD) {
          return BATCH_COOLDOWN
        }
      }
      return 3 // Single lesson
    }

    if (this.currentOperation.includes('course')) {
      return 5
    }

    if (this.currentOperation.includes('Retrieving') || this.currentOperation.includes('Loading')) {
      return 1
    }

    return 3 // Default
  }
}
