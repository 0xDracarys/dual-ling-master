"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { BookOpen, Users, Clock, Star, CheckCircle, AlertCircle } from "lucide-react"

interface CourseEnrollmentProps {
  course: {
    id: string // Changed from _id to match Firebase
    title: string
    description: string
    teacherName: string
    level: string // Changed from difficulty
    estimatedHours: number // Changed from estimatedDuration
    enrollmentCount: number // Changed from enrolledStudents
    averageRating?: number // Changed from rating
    reviewCount?: number // Changed from totalRatings
    isEnrolled?: boolean
  }
  onEnroll?: (courseId: string) => void
  firstLessonId?: string
  isCheckingEnrollment?: boolean
}

export function CourseEnrollment({ course, onEnroll, firstLessonId, isCheckingEnrollment = false }: CourseEnrollmentProps) {
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [enrollmentStatus, setEnrollmentStatus] = useState<'idle' | 'success' | 'error' | 'already-enrolled'>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const { token, user } = useAuth()
  const router = useRouter()

  const handleEnroll = async () => {
    if (!token || !user) {
      // Redirect to login
      router.push('/auth/login')
      return
    }

    setIsEnrolling(true)
    setEnrollmentStatus('idle')
    setErrorMessage('')

    try {
      const response = await fetch(`/api/courses/${course.id}/enroll`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      const responseData = await response.json()

      if (response.ok) {
        setEnrollmentStatus('success')
        onEnroll?.(course.id)
        // Redirect to dashboard after successful enrollment
        setTimeout(() => {
          router.push('/dashboard')
        }, 1000)
      } else {
        // Check if already enrolled
        if (response.status === 400 && responseData.error?.includes('already enrolled')) {
          setEnrollmentStatus('already-enrolled')
          setErrorMessage('You are already enrolled in this course')
          // Redirect to dashboard if already enrolled
          setTimeout(() => {
            router.push('/dashboard')
          }, 2000)
        } else {
          setEnrollmentStatus('error')
          setErrorMessage(responseData.error || 'Enrollment failed. Please try again.')
        }
        console.error('Enrollment failed:', responseData)
      }
    } catch (error) {
      setEnrollmentStatus('error')
      setErrorMessage('Network error. Please check your connection and try again.')
      console.error('Enrollment error:', error)
    } finally {
      setIsEnrolling(false)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800'
      case 'advanced':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-2xl mb-2">{course.title}</CardTitle>
            <CardDescription className="text-base mb-4">
              by {course.teacherName}
            </CardDescription>
            <p className="text-gray-600 mb-4">{course.description}</p>
          </div>
          <Badge className={getDifficultyColor(course.level)}>
            {course.level}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Course Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            <span>{course.enrollmentCount} students</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{course.estimatedHours}h</span>
          </div>
          {course.averageRating && course.averageRating > 0 ? (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
              <span>{course.averageRating.toFixed(1)} ({course.reviewCount || 0})</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Star className="h-4 w-4 text-gray-400" />
              <span>No ratings yet</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <BookOpen className="h-4 w-4" />
            <span>Self-paced</span>
          </div>
        </div>

        {/* Enrollment Status */}
        {enrollmentStatus === 'success' && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800 font-medium">
              Successfully enrolled! Redirecting to course...
            </span>
          </div>
        )}

        {enrollmentStatus === 'already-enrolled' && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            <span className="text-blue-800 font-medium">
              {errorMessage}. Refreshing page...
            </span>
          </div>
        )}

        {enrollmentStatus === 'error' && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-800 font-medium">
              {errorMessage || 'Enrollment failed. Please try again.'}
            </span>
          </div>
        )}

        {/* Enrollment Button */}
        <div className="flex gap-4">
          {isCheckingEnrollment ? (
            <Button className="flex-1" disabled>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
              Checking enrollment...
            </Button>
          ) : course.isEnrolled ? (
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => {
                if (firstLessonId) {
                  router.push(`/course/${course.id}/lesson/${firstLessonId}`)
                } else {
                  router.push('/dashboard')
                }
              }}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              {firstLessonId ? 'Start Course' : 'Go to Dashboard'}
            </Button>
          ) : (
            <Button 
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={handleEnroll}
              disabled={isEnrolling || enrollmentStatus === 'success' || enrollmentStatus === 'already-enrolled'}
            >
              {isEnrolling ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enrolling...
                </>
              ) : enrollmentStatus === 'success' || enrollmentStatus === 'already-enrolled' ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Enrolled!
                </>
              ) : (
                <>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Enroll Now
                </>
              )}
            </Button>
          )}
        </div>

        {/* Course Features */}
        <div className="border-t pt-4">
          <h3 className="font-semibold text-gray-900 mb-3">What you'll learn:</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Interactive lessons with real-world examples</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Quizzes to test your understanding</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Progress tracking and certificates</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Lifetime access to course materials</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
