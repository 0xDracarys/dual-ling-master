"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { LessonViewer } from "@/components/lessons/lesson-viewer"
import { LessonNavigationSidebar } from "@/components/lessons/lesson-navigation-sidebar"

interface Lesson {
  _id: string
  id?: string
  title: string
  type: "text" | "quiz" | "video" | "reading" | "exercise"
  content: {
    text?: string
    questions?: Array<{
      question: string
      options: string[]
      correctAnswer: number
      explanation?: string
      points: number
    }>
    videoUrl?: string
    duration?: number
  }
  order: number
  isPublished: boolean
}

interface CourseData {
  _id: string
  title: string
  lessons: Lesson[]
}

export default function LessonPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string
  const lessonId = params.lessonId as string
  const [course, setCourse] = useState<CourseData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [progressMap, setProgressMap] = useState<Record<string, any>>({})
  const { token } = useAuth()

  // Fetch progress data
  const fetchProgress = async () => {
    if (!token) return

    try {
      const response = await fetch(`/api/progress?courseId=${courseId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setProgressMap(data.progress || {})
        console.log('Progress loaded:', Object.keys(data.progress || {}).length, 'lessons tracked')
      }
    } catch (error) {
      console.error('Failed to fetch progress:', error)
    }
  }

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        // Fetch course details
        const courseResponse = await fetch(`/api/courses/${courseId}`)
        if (!courseResponse.ok) {
          console.error('Failed to fetch course:', courseResponse.status)
          setIsLoading(false)
          return
        }

        const courseData = await courseResponse.json()
        
        // Fetch lessons separately
        const lessonsResponse = await fetch(`/api/courses/${courseId}/lessons`)
        if (!lessonsResponse.ok) {
          console.error('Failed to fetch lessons:', lessonsResponse.status)
          setIsLoading(false)
          return
        }

        const lessonsData = await lessonsResponse.json()
        
        // Map Firestore 'id' to MongoDB legacy '_id' for compatibility
        const mappedLessons = (lessonsData.lessons || []).map((lesson: any) => ({
          ...lesson,
          _id: lesson.id || lesson._id  // Support both formats
        }))
        
        // Combine course and lessons
        const courseWithLessons = {
          _id: courseData.course.id || courseData.course._id,
          title: courseData.course.title,
          lessons: mappedLessons
        }
        
        setCourse(courseWithLessons)
        console.log('Lesson player - Course loaded:', courseData.course?.title, 'with', mappedLessons.length, 'lessons')
        console.log('First lesson ID:', mappedLessons[0]?._id, 'Current lesson ID:', lessonId)

        // Fetch progress after course is loaded
        await fetchProgress()
      } catch (error) {
        console.error("Error fetching course:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCourseData()
  }, [courseId, token])

  const handleNavigateToLesson = (newLessonId: string) => {
    router.push(`/course/${courseId}/lesson/${newLessonId}`)
  }

  const handleLessonComplete = async (completedLessonId: string, completed: boolean, quizScore?: number) => {
    console.log(`Lesson ${completedLessonId} completed:`, completed, quizScore)
    
    // Immediately update progress map for instant UI feedback
    if (completed) {
      setProgressMap(prev => ({
        ...prev,
        [completedLessonId]: {
          ...prev[completedLessonId],
          status: 'completed',
          videoCompleted: true,
          completedAt: new Date(),
        }
      }))
    }

    // Refetch progress from server to get accurate data
    await fetchProgress()
  }

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={["student"]}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading lesson...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!course) {
    return (
      <ProtectedRoute allowedRoles={["student"]}>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Course Not Found</h1>
            <p className="text-gray-600">The course you're looking for doesn't exist.</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  // Calculate completed lessons from progress map
  const completedLessonsCount = Object.values(progressMap).filter(
    (p: any) => p.status === 'completed'
  ).length

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6">
          {/* Back button */}
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => router.push(`/course/${courseId}`)} 
              className="hover:bg-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Course
            </Button>
          </div>

          {/* Main layout with sidebar */}
          <div className="grid lg:grid-cols-[320px_1fr] gap-6">
            {/* Sidebar Navigation */}
            {course && (
              <LessonNavigationSidebar
                courseTitle={course.title}
                lessons={course.lessons.map(l => {
                  const lessonProgress = progressMap[l._id] || progressMap[l.id || '']
                  return {
                    ...l,
                    isLocked: false, // All lessons are unlocked for enrolled students
                    isCompleted: lessonProgress?.status === 'completed' || false
                  }
                })}
                currentLessonId={lessonId}
                totalLessons={course.lessons.length}
                completedLessons={completedLessonsCount}
                onNavigateToLesson={handleNavigateToLesson}
              />
            )}

            {/* Main Content */}
            <div className="lg:col-span-1">
              <LessonViewer
                courseId={courseId}
                course={course}
                currentLessonId={lessonId}
                onLessonComplete={handleLessonComplete}
                onNavigateToLesson={handleNavigateToLesson}
              />
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
