"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen, Play, CheckCircle, ArrowLeft, ArrowRight, Clock } from "lucide-react"
import { QuizComponent } from "./quiz-component"
import { ResourceList } from "./resource-list"
import { useAuth } from "@/hooks/use-auth"

/**
 * Convert YouTube URLs to embed format
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID (already embed)
 * - https://www.youtube.com/ (homepage - returns null)
 */
function convertToYouTubeEmbed(url: string): string | null {
  if (!url) return null
  
  // Already an embed URL
  if (url.includes('/embed/')) {
    return url
  }
  
  // Homepage or invalid URL
  if (url === 'https://www.youtube.com/' || url === 'https://www.youtube.com') {
    return null
  }
  
  // Watch URL: https://www.youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/)
  if (watchMatch) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`
  }
  
  // Short URL: https://youtu.be/VIDEO_ID
  const shortMatch = url.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (shortMatch) {
    return `https://www.youtube.com/embed/${shortMatch[1]}`
  }
  
  // Vimeo URL (pass through)
  if (url.includes('vimeo.com')) {
    return url
  }
  
  return null
}

/**
 * Convert Markdown to HTML with proper styling
 */
function formatMarkdownContent(markdown: string): string {
  if (!markdown) return "<p>No content available</p>"
  
  let html = markdown
  
  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold text-gray-900 mt-6 mb-3">$1</h3>')
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">$1</h2>')
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold text-gray-900 mt-8 mb-4">$1</h1>')
  
  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
  
  // Italic
  html = html.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>')
  
  // Lists - wrap consecutive list items
  const lines = html.split('\n')
  let inList = false
  const processed: string[] = []
  
  lines.forEach(line => {
    if (line.match(/^\* (.*)$/)) {
      if (!inList) {
        processed.push('<ul class="list-disc space-y-1 my-4 ml-6">')
        inList = true
      }
      processed.push(line.replace(/^\* (.*)$/, '<li class="mb-2">$1</li>'))
    } else {
      if (inList) {
        processed.push('</ul>')
        inList = false
      }
      processed.push(line)
    }
  })
  
  if (inList) processed.push('</ul>')
  html = processed.join('\n')
  
  // Code blocks
  html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-mono">$1</code>')
  
  // Paragraphs (only for lines that aren't already HTML tags)
  html = html.replace(/^(?!<)([^<\n].*)$/gim, '<p class="text-gray-700 leading-relaxed mb-4">$1</p>')
  
  return html
}

interface Lesson {
  _id: string
  title: string
  type: "text" | "quiz" | "video" | "reading" | "exercise"
  content: {
    text?: string
    videoUrl?: string
    videoTitle?: string
    videoCreator?: string
    sourceUrl?: string
    duration?: number
  }
  quizQuestions?: Array<{
    id: string
    question: string
    type: string
    options?: string[]
    correctAnswer: string
    explanation?: string
    points: number
  }>
  order: number
  isPublished: boolean
}

interface Course {
  _id: string
  title: string
  lessons: Lesson[]
}

interface LessonViewerProps {
  courseId: string
  course: Course
  currentLessonId: string
  onLessonComplete?: (lessonId: string, completed: boolean, quizScore?: number) => void
  onNavigateToLesson?: (lessonId: string) => void
}

export function LessonViewer({ 
  courseId, 
  course, 
  currentLessonId, 
  onLessonComplete,
  onNavigateToLesson 
}: LessonViewerProps) {
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCompleted, setIsCompleted] = useState(false)
  const [timeSpent, setTimeSpent] = useState(0)
  const { token } = useAuth()

  useEffect(() => {
    // Safety check: ensure lessons array exists
    if (!course.lessons || !Array.isArray(course.lessons)) {
      console.error('Course lessons not loaded:', course)
      setCurrentLesson(null)
      setIsLoading(false)
      return
    }
    
    const lesson = course.lessons.find(l => l._id === currentLessonId)
    
    if (!lesson) {
      console.error('Lesson not found:', currentLessonId)
      setCurrentLesson(null)
      setIsLoading(false)
      return
    }
    
    // Debug: Log lesson data structure
    console.log('Raw lesson data:', JSON.stringify(lesson, null, 2))
    
    // Map content.quizQuestions to root level for quiz component compatibility
    if (lesson.type === 'quiz') {
      // Check all possible locations for quiz data
      const quizDataFromContent = (lesson as any).content?.quizQuestions
      const quizDataFromRoot = (lesson as any).quizQuestions
      const quizData = quizDataFromContent || quizDataFromRoot
      
      console.log('Full lesson object keys:', Object.keys(lesson))
      console.log('Content object:', (lesson as any).content)
      console.log('Quiz data from content.quizQuestions:', quizDataFromContent)
      console.log('Quiz data from root quizQuestions:', quizDataFromRoot)
      
      if (quizData && Array.isArray(quizData)) {
        const mappedLesson = {
          ...lesson,
          quizQuestions: quizData
        }
        console.log('✅ Mapped lesson with quiz questions:', quizData.length, 'questions')
        setCurrentLesson(mappedLesson)
      } else {
        console.error('❌ No quiz questions found in any expected location')
        console.error('Lesson type:', lesson.type)
        console.error('Has content?:', !!(lesson as any).content)
        console.error('Content keys:', (lesson as any).content ? Object.keys((lesson as any).content) : 'N/A')
        setCurrentLesson(lesson)
      }
    } else {
      setCurrentLesson(lesson)
    }
    
    setIsLoading(false)
  }, [currentLessonId, course.lessons, course])

  // Timer effect
  useEffect(() => {
    if (currentLesson && !isCompleted) {
      const timer = setInterval(() => {
        setTimeSpent(prev => prev + 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [currentLesson, isCompleted])

  const getCurrentLessonIndex = () => {
    if (!course.lessons || !Array.isArray(course.lessons)) return -1
    return course.lessons.findIndex(l => l._id === currentLessonId)
  }

  const getNextLesson = () => {
    if (!course.lessons || !Array.isArray(course.lessons)) return null
    const currentIndex = getCurrentLessonIndex()
    return currentIndex < course.lessons.length - 1 ? course.lessons[currentIndex + 1] : null
  }

  const getPreviousLesson = () => {
    if (!course.lessons || !Array.isArray(course.lessons)) return null
    const currentIndex = getCurrentLessonIndex()
    return currentIndex > 0 ? course.lessons[currentIndex - 1] : null
  }

  const handleNavigateToLesson = (lessonId: string) => {
    setTimeSpent(0)
    setIsCompleted(false)
    onNavigateToLesson?.(lessonId)
  }

  const handleLessonComplete = async (completed: boolean, quizScore?: number) => {
    if (!currentLesson || !token) return

    try {
      const response = await fetch("/api/students/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId,
          lessonId: currentLesson._id,
          completed,
          quizScore,
          timeSpent,
        }),
      })

      if (response.ok) {
        setIsCompleted(completed)
        onLessonComplete?.(currentLesson._id, completed, quizScore)
      }
    } catch (error) {
      console.error("Error updating progress:", error)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getProgressPercentage = () => {
    const currentIndex = getCurrentLessonIndex()
    return ((currentIndex + 1) / course.lessons.length) * 100
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!currentLesson) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Lesson Not Found</h2>
          <p className="text-gray-600">The lesson you're looking for doesn't exist.</p>
        </CardContent>
      </Card>
    )
  }

  const nextLesson = getNextLesson()
  const previousLesson = getPreviousLesson()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Lesson Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle className="text-2xl">{currentLesson.title}</CardTitle>
              <CardDescription>
                Lesson {getCurrentLessonIndex() + 1} of {course.lessons.length} • {course.title}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">{formatTime(timeSpent)}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Course Progress</span>
              <span>{Math.round(getProgressPercentage())}%</span>
            </div>
            <Progress value={getProgressPercentage()} className="h-2" />
          </div>
        </CardHeader>
      </Card>

      {/* Lesson Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            {(currentLesson.type === "text" || currentLesson.type === "reading") && <BookOpen className="h-5 w-5 text-blue-600" />}
            {currentLesson.type === "video" && <Play className="h-5 w-5 text-red-600" />}
            {currentLesson.type === "quiz" && <CheckCircle className="h-5 w-5 text-purple-600" />}
            <Badge variant="outline" className="capitalize">
              {currentLesson.type}
            </Badge>
            {isCompleted && (
              <Badge variant="default" className="bg-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Completed
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {(currentLesson.type === "text" || currentLesson.type === "reading") && (
            <div className="prose prose-lg max-w-none">
              <div 
                className="lesson-content space-y-4"
                dangerouslySetInnerHTML={{ 
                  __html: formatMarkdownContent(currentLesson.content?.text || (currentLesson as any).contentMarkdown || "No content available")
                }}
              />
            </div>
          )}

          {currentLesson.type === "video" && (
            <div className="space-y-4">
              {(() => {
                const rawUrl = currentLesson.content?.videoUrl || (currentLesson as any).videoUrl
                const embedUrl = convertToYouTubeEmbed(rawUrl)
                const videoTitle = currentLesson.content?.videoTitle || (currentLesson as any).videoTitle
                const videoCreator = currentLesson.content?.videoCreator || (currentLesson as any).videoCreator
                const sourceUrl = currentLesson.content?.sourceUrl || (currentLesson as any).sourceUrl
                
                return embedUrl ? (
                  <>
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <iframe
                        src={embedUrl}
                        className="w-full h-full"
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        title={videoTitle || currentLesson.title}
                      />
                    </div>
                    {/* Video Attribution */}
                    {(videoTitle || videoCreator) && (
                      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex-shrink-0 mt-0.5">
                          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          {videoTitle && (
                            <p className="text-sm font-medium text-gray-900 line-clamp-2">
                              {videoTitle}
                            </p>
                          )}
                          {videoCreator && (
                            <p className="text-xs text-gray-600 mt-1">
                              by <span className="font-medium">{videoCreator}</span>
                            </p>
                          )}
                          {sourceUrl && (
                            <a 
                              href={sourceUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-2 font-medium"
                            >
                              Watch on YouTube
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center p-6 text-center">
                    <div className="space-y-2">
                      <p className="text-gray-500">Video URL is invalid or not yet configured</p>
                      {rawUrl && (
                        <p className="text-xs text-gray-400">URL: {rawUrl}</p>
                      )}
                    </div>
                  </div>
                )
              })()}
              {(currentLesson.content?.duration || (currentLesson as any).duration) && (
                <p className="text-sm text-gray-600">
                  Duration: {Math.floor((currentLesson.content?.duration || (currentLesson as any).duration) / 60)} minutes
                </p>
              )}
            </div>
          )}

          {currentLesson.type === "quiz" && currentLesson.quizQuestions && (
            <QuizComponent
              courseId={courseId}
              lessonId={currentLesson._id}
              questions={currentLesson.quizQuestions.map((q, index) => ({
                id: q.id || `question-${index}`, // Fallback ID for legacy questions
                question: q.question,
                options: q.options || [],
                correctAnswer: parseInt(q.correctAnswer),
                explanation: q.explanation,
                points: q.points || 1
              }))}
              onComplete={(score, timeSpent) => {
                handleLessonComplete(true, score)
              }}
            />
          )}

          {/* Lesson Resources Section */}
          {currentLesson._id && courseId && (
            <div className="mt-8">
              <ResourceList
                courseId={courseId}
                lessonId={currentLesson._id}
                showTitle={true}
              />
            </div>
          )}

          {/* Mark as Complete Button for text and video lessons */}
          {currentLesson.type !== "quiz" && !isCompleted && (
            <div className="mt-6 text-center">
              <Button
                onClick={() => handleLessonComplete(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Complete
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => previousLesson && handleNavigateToLesson(previousLesson._id)}
              disabled={!previousLesson}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                {getCurrentLessonIndex() + 1} of {course.lessons.length} lessons
              </p>
            </div>

            <Button
              onClick={() => nextLesson && handleNavigateToLesson(nextLesson._id)}
              disabled={!nextLesson}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
