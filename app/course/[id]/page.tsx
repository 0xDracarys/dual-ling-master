"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { CourseEnrollment } from "@/components/course-enrollment"
import { ArrowLeft, BookOpen, Users, Clock, Star, Play, CheckCircle } from "lucide-react"

interface Lesson {
  id: string
  title: string
  description: string
  type: "reading" | "quiz" | "video"
  order: number
  duration: number
}

interface Course {
  id: string
  title: string
  description: string
  teacherName: string
  teacherId: string
  language: "en" | "lt"
  targetLanguage: "en" | "lt"
  level: "beginner" | "intermediate" | "advanced"
  estimatedHours: number
  enrollmentCount: number
  averageRating?: number
  reviewCount?: number
  thumbnailUrl?: string
  lessonsCount: number
  isPublished: boolean
  createdAt: any
}

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string
  const [course, setCourse] = useState<Course | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEnrolled, setIsEnrolled] = useState(false)

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        // Fetch course details
        const courseResponse = await fetch(`/api/courses/${courseId}`)
        if (courseResponse.ok) {
          const courseData = await courseResponse.json()
          setCourse(courseData.course)
        } else {
          console.error('Failed to fetch course')
        }

        // Fetch lessons
        const lessonsResponse = await fetch(`/api/courses/${courseId}/lessons`)
        if (lessonsResponse.ok) {
          const lessonsData = await lessonsResponse.json()
          setLessons(lessonsData.lessons || [])
        }

        // Check enrollment status
        const token = localStorage.getItem('token')
        if (token) {
          const enrollmentResponse = await fetch(`/api/students/enrolled-courses`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          if (enrollmentResponse.ok) {
            const enrollmentData = await enrollmentResponse.json()
            // API returns { data: { enrollments: [...] } }
            const enrollments = enrollmentData.data?.enrollments || enrollmentData.enrollments || []
            const enrolled = enrollments.some(
              (e: any) => e.courseId === courseId
            )
            setIsEnrolled(enrolled)
            console.log('Enrollment check:', { courseId, enrolled, enrollments })
          }
        }
      } catch (error) {
        console.error('Error fetching course:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCourse()
  }, [courseId])

  const handleEnroll = (enrolledCourseId: string) => {
    setIsEnrolled(true)
    // Optionally redirect to the course or show success message
  }

  const getDifficultyColor = (level: string) => {
    switch (level) {
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

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'reading':
        return <BookOpen className="h-4 w-4 text-blue-600" />
      case 'video':
        return <Play className="h-4 w-4 text-red-600" />
      case 'quiz':
        return <CheckCircle className="h-4 w-4 text-purple-600" />
      default:
        return <BookOpen className="h-4 w-4 text-gray-600" />
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Skeleton className="h-8 w-32 mb-4" />
          <Skeleton className="h-8 w-96 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-32 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Course Not Found</h1>
          <p className="text-gray-600 mb-4">The course you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/courses')}>
            Browse Courses
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.back()} 
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Course Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
                  <p className="text-lg text-gray-600 mb-4">by {course.teacherName}</p>
                  <div className="flex items-center gap-4 mb-4">
                    <Badge className={getDifficultyColor(course.level)}>
                      {course.level}
                    </Badge>
                    {course.averageRating && course.averageRating > 0 && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span>{course.averageRating.toFixed(1)} ({course.reviewCount || 0} ratings)</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      <span>{course.enrollmentCount} students</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <BookOpen className="h-4 w-4" />
                      <span>{course.lessonsCount} lessons</span>
                    </div>
                  </div>
                </div>
                {course.thumbnailUrl && (
                  <div className="w-32 h-24 bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
              
              <p className="text-gray-700 leading-relaxed">{course.description}</p>
            </CardHeader>
          </Card>

          {/* Course Content */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Course Content</CardTitle>
              <CardDescription>
                {lessons.length} lessons • {course.estimatedHours} hours total
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lessons.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No lessons available yet. Check back soon!
                </p>
              ) : (
                <div className="space-y-3">
                  {lessons
                    .sort((a, b) => a.order - b.order)
                    .map((lesson, index) => (
                      <div key={lesson.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex-shrink-0 bg-gray-100 rounded-full p-2">
                          {getLessonIcon(lesson.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 font-medium">
                              Lesson {index + 1}
                            </span>
                          </div>
                          <h3 className="font-medium text-gray-900">{lesson.title}</h3>
                          {isEnrolled && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{lesson.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          <span>{lesson.duration} min</span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
              {!isEnrolled && lessons.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Enroll now</strong> to access full lesson descriptions and start learning!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <CourseEnrollment 
            course={{
              id: course.id,
              title: course.title,
              description: course.description,
              teacherName: course.teacherName,
              level: course.level,
              estimatedHours: course.estimatedHours,
              enrollmentCount: course.enrollmentCount,
              averageRating: course.averageRating,
              reviewCount: course.reviewCount,
              isEnrolled: isEnrolled
            }}
            onEnroll={handleEnroll}
            firstLessonId={lessons.length > 0 ? lessons.sort((a, b) => a.order - b.order)[0].id : undefined}
            isCheckingEnrollment={isLoading}
          />
        </div>
      </div>
    </div>
  )
}