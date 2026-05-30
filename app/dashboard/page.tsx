"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/hooks/use-auth"
import { BookOpen, Clock, Trophy, TrendingUp, Play, CheckCircle } from "lucide-react"

interface CourseProgress {
  courseId: string
  courseTitle: string
  teacherName: string
  totalLessons: number
  completedLessons: number
  progressPercentage: number
  currentLesson: string | null
  firstLessonId: string | null
  lastAccessedAt: Date
  quizScores: Record<string, number>
  averageQuizScore: number
}

interface DashboardStats {
  totalCourses: number
  completedCourses: number
  averageProgress: number
  totalTimeSpent: number
}

export default function StudentDashboard() {
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    completedCourses: 0,
    averageProgress: 0,
    totalTimeSpent: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const { token, user } = useAuth()

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch student enrollments and progress
        const [enrollmentsResponse, progressResponse] = await Promise.all([
          fetch("/api/students/enrolled-courses", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch("/api/students/progress", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ])

        if (enrollmentsResponse.ok && progressResponse.ok) {
          const enrollmentsData = await enrollmentsResponse.json()
          const progressData = await progressResponse.json()

          // Map enrollments to CourseProgress format
          const enrollments = enrollmentsData.data.enrollments || []
          
          // Fetch lessons for each course to get first lesson ID
          const courseProgressData: CourseProgress[] = await Promise.all(
            enrollments.map(async (enrollment: any) => {
              let firstLessonId = null
              try {
                const lessonsResponse = await fetch(`/api/courses/${enrollment.courseId}/lessons`)
                if (lessonsResponse.ok) {
                  const lessonsData = await lessonsResponse.json()
                  const lessons = lessonsData.lessons || []
                  if (lessons.length > 0) {
                    // Sort by order and get first lesson
                    const sortedLessons = lessons.sort((a: any, b: any) => a.order - b.order)
                    firstLessonId = sortedLessons[0].id
                  }
                }
              } catch (error) {
                console.error(`Error fetching lessons for course ${enrollment.courseId}:`, error)
              }

              return {
                courseId: enrollment.courseId,
                courseTitle: enrollment.courseTitle || 'Untitled Course',
                teacherName: enrollment.teacherName || 'Unknown Teacher',
                totalLessons: enrollment.totalLessonsCount || 0,
                completedLessons: enrollment.completedLessonsCount || 0,
                progressPercentage: enrollment.progressPercentage || 0,
                currentLesson: enrollment.currentLessonId || null,
                firstLessonId,
                lastAccessedAt: enrollment.lastAccessedAt ? new Date(enrollment.lastAccessedAt) : new Date(),
                quizScores: enrollment.quizScores || {},
                averageQuizScore: enrollment.averageQuizScore || 0,
              }
            })
          )

          setCourseProgress(courseProgressData)
          
          // Calculate stats from progress API
          const totalCourses = progressData.data.totalCourses || 0
          const completedCourses = progressData.data.completedCourses || 0
          const averageProgress = courseProgressData.length > 0 
            ? courseProgressData.reduce((sum, course) => sum + course.progressPercentage, 0) / courseProgressData.length 
            : 0

          setStats({
            totalCourses,
            completedCourses,
            averageProgress: Math.round(averageProgress * 100) / 100,
            totalTimeSpent: 0, // This would need to be calculated from individual course data
          })
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (token) {
      fetchDashboardData()
    }
  }, [token])

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={["student"]}>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-16 w-full mb-4" />
                  <Skeleton className="h-2 w-full mb-2" />
                  <Skeleton className="h-4 w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="container-custom section-padding-sm">
          <div className="mb-12">
            <h1 className="heading-1 mb-4">
              Welcome back, <span className="gradient-text">{user?.username}</span>!
            </h1>
            <p className="body-large">Continue your language learning journey with personalized insights</p>
          </div>

          {/* Stats Overview */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Card className="card-elevated group hover:scale-105 transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="body-small font-medium text-gray-500 uppercase tracking-wide">Total Courses</p>
                    <p className="heading-3 text-gray-900">{stats.totalCourses}</p>
                  </div>
                  <div className="w-14 h-14 gradient-primary rounded-2xl flex items-center justify-center shadow-medium group-hover:scale-110 transition-transform">
                    <BookOpen className="h-7 w-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-elevated group hover:scale-105 transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="body-small font-medium text-gray-500 uppercase tracking-wide">Completed</p>
                    <p className="heading-3 text-gray-900">{stats.completedCourses}</p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-medium group-hover:scale-110 transition-transform">
                    <Trophy className="h-7 w-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-elevated group hover:scale-105 transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="body-small font-medium text-gray-500 uppercase tracking-wide">Avg Progress</p>
                    <p className="heading-3 text-gray-900">{stats.averageProgress}%</p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center shadow-medium group-hover:scale-110 transition-transform">
                    <TrendingUp className="h-7 w-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-elevated group hover:scale-105 transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="body-small font-medium text-gray-500 uppercase tracking-wide">Time Spent</p>
                    <p className="heading-3 text-gray-900">{stats.totalTimeSpent}h</p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-medium group-hover:scale-110 transition-transform">
                    <Clock className="h-7 w-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* My Courses Section */}
          <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="heading-2">My Courses</h2>
              <Link href="/courses">
                <Button className="btn-secondary">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Browse Courses
                </Button>
              </Link>
            </div>

            {courseProgress.length === 0 ? (
              <Card className="card-elevated text-center py-16">
                <CardContent>
                  <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-medium">
                    <BookOpen className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="heading-4 mb-4">No courses enrolled yet</h3>
                  <p className="body-large mb-8 max-w-md mx-auto">Start your learning journey by enrolling in a course and unlock your language potential</p>
                  <Link href="/courses">
                    <Button className="btn-primary">
                      Browse Available Courses
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {courseProgress.map((course) => (
                  <Card key={course.courseId} className="card-interactive group">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <CardTitle className="heading-4 mb-2 group-hover:text-indigo-600 transition-colors">
                            {course.courseTitle}
                          </CardTitle>
                          <CardDescription className="body-medium">by {course.teacherName}</CardDescription>
                        </div>
                        <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">
                          {course.totalLessons} lessons
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <div className="flex justify-between body-small font-medium">
                            <span>Progress</span>
                            <span className="text-indigo-600">{Math.round(course.progressPercentage)}%</span>
                          </div>
                          <Progress 
                            value={course.progressPercentage} 
                            className="h-3 bg-gray-100"
                          />
                          <p className="body-small text-gray-500">
                            {course.completedLessons} of {course.totalLessons} lessons completed
                          </p>
                        </div>

                        {course.averageQuizScore > 0 && (
                          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                            <Trophy className="h-5 w-5 text-green-600" />
                            <span className="body-small font-medium text-green-700">
                              Avg Quiz Score: {Math.round(course.averageQuizScore)}%
                            </span>
                          </div>
                        )}

                        {course.currentLesson && (
                          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                            <Play className="h-5 w-5 text-blue-600" />
                            <span className="body-small font-medium text-blue-700">
                              Next: {course.currentLesson}
                            </span>
                          </div>
                        )}

                        <Link href={course.firstLessonId ? `/course/${course.courseId}/lesson/${course.firstLessonId}` : `/course/${course.courseId}`}>
                          <Button className="w-full btn-primary">
                            {course.progressPercentage > 0 ? "Continue Learning" : "Start Course"}
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Quick Actions */}
          <section>
            <h2 className="heading-2 mb-8">Quick Actions</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="card-interactive group">
                <Link href="/courses">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-medium group-hover:scale-110 transition-transform">
                      <BookOpen className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="heading-4 mb-3 group-hover:text-indigo-600 transition-colors">Browse Courses</h3>
                    <p className="body-medium">Discover new courses to expand your knowledge and skills</p>
                  </CardContent>
                </Link>
              </Card>

              <Card className="card-interactive group">
                <Link href="/profile">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-medium group-hover:scale-110 transition-transform">
                      <CheckCircle className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="heading-4 mb-3 group-hover:text-indigo-600 transition-colors">View Progress</h3>
                    <p className="body-medium">Track your learning achievements and detailed progress</p>
                  </CardContent>
                </Link>
              </Card>

              <Card className="card-interactive group">
                <Link href="/settings">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-medium group-hover:scale-110 transition-transform">
                      <Trophy className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="heading-4 mb-3 group-hover:text-indigo-600 transition-colors">Achievements</h3>
                    <p className="body-medium">View your badges and learning milestones</p>
                  </CardContent>
                </Link>
              </Card>
            </div>
          </section>
        </div>
      </div>
    </ProtectedRoute>
  )
}
