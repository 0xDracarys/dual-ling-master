"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { 
  BookOpen, 
  Users, 
  TrendingUp, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  BarChart3, 
  Clock, 
  Star,
  MessageCircle,
  Award,
  Target,
  Sparkles,
  Video
} from "lucide-react"
import { UpcomingClassesWidget } from "@/components/teacher/upcoming-classes-widget"

interface Course {
  id: string
  title: string
  description: string
  isPublished: boolean
  enrollmentCount: number
  lessonsCount: number
  averageRating?: number
  reviewCount?: number
  createdAt: any
  teacherId: string
  teacherName: string
  language: string
  targetLanguage: string
  level: string
}

interface TeacherStats {
  totalCourses: number
  totalStudents: number
  totalLessons: number
  averageRating: number
  publishedCourses: number
  draftCourses: number
}

interface RecentEnrollment {
  id: string
  userName: string
  courseTitle: string
  enrolledAt: Date | null
}

interface RecentCourse {
  id: string
  title: string
  createdAt: Date | null
}

interface RecentActivity {
  type: 'enrollment' | 'course_created'
  message: string
  time: string
  icon: any
  timestamp: Date
}

export default function TeacherDashboard() {
  const [courses, setCourses] = useState<Course[]>([])
  const [stats, setStats] = useState<TeacherStats>({
    totalCourses: 0,
    totalStudents: 0,
    totalLessons: 0,
    averageRating: 0,
    publishedCourses: 0,
    draftCourses: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null)
  const { token, user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        // Fetch teacher's courses and recent activity in parallel
        const [coursesResponse, activityResponse] = await Promise.all([
          fetch("/api/teacher/courses", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch("/api/teacher/recent-activity", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ])

        if (coursesResponse.ok) {
          const coursesData = await coursesResponse.json()
          setCourses(coursesData.data.courses || [])
          
          // Calculate stats
          const totalStudents = coursesData.data.courses.reduce((sum: number, course: Course) => sum + course.enrollmentCount, 0)
          const totalLessons = coursesData.data.courses.reduce((sum: number, course: Course) => sum + course.lessonsCount, 0)
          const publishedCourses = coursesData.data.courses.filter((course: Course) => course.isPublished).length
          const averageRating = coursesData.data.courses.length > 0 
            ? coursesData.data.courses.reduce((sum: number, course: Course) => sum + (course.averageRating || 0), 0) / coursesData.data.courses.length 
            : 0

          setStats({
            totalCourses: coursesData.data.courses.length,
            totalStudents,
            totalLessons,
            averageRating: Math.round(averageRating * 100) / 100,
            publishedCourses,
            draftCourses: coursesData.data.courses.length - publishedCourses
          })
        }

        if (activityResponse.ok) {
          const activityData = await activityResponse.json()
          const enrollments: RecentEnrollment[] = activityData.data.recentEnrollments || []
          const courses: RecentCourse[] = activityData.data.recentCourses || []

          // Combine and format activity
          const activities: RecentActivity[] = []

          // Add enrollments
          enrollments.forEach((enrollment) => {
            if (enrollment.enrolledAt) {
              const enrolledDate = new Date(enrollment.enrolledAt)
              activities.push({
                type: 'enrollment',
                message: `${enrollment.userName} enrolled in "${enrollment.courseTitle}"`,
                time: formatTimeAgo(enrolledDate),
                icon: Users,
                timestamp: enrolledDate,
              })
            }
          })

          // Add course creations
          courses.forEach((course) => {
            if (course.createdAt) {
              const createdDate = new Date(course.createdAt)
              activities.push({
                type: 'course_created',
                message: `You created a new course "${course.title}"`,
                time: formatTimeAgo(createdDate),
                icon: BookOpen,
                timestamp: createdDate,
              })
            }
          })

          // Sort by timestamp descending
          activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

          setRecentActivity(activities.slice(0, 10)) // Show only 10 most recent
        }
      } catch (error) {
        console.error("Error fetching teacher data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (token) {
      fetchTeacherData()
    }
  }, [token])

  // Helper function to format relative time
  const formatTimeAgo = (date: Date): string => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  // Delete course handler
  const handleDeleteCourse = async (courseId: string, courseTitle: string) => {
    const confirmed = confirm(
      `Are you sure you want to delete "${courseTitle}"?\n\nThis action cannot be undone.`
    )
    
    if (!confirmed) return

    setDeletingCourseId(courseId)

    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle specific error cases
        if (data.error?.includes('enrollments')) {
          toast({
            title: "Cannot Delete Course",
            description: "This course has active enrollments. Please unpublish it first to prevent new enrollments.",
            variant: "destructive",
          })
        } else {
          throw new Error(data.error || 'Failed to delete course')
        }
        return
      }

      // Success - remove from local state
      const deletedCourse = courses.find(c => c.id === courseId)
      setCourses(prevCourses => prevCourses.filter(c => c.id !== courseId))
      
      // Update stats
      setStats(prevStats => ({
        ...prevStats,
        totalCourses: prevStats.totalCourses - 1,
        publishedCourses: prevStats.publishedCourses - (deletedCourse?.isPublished ? 1 : 0),
        draftCourses: prevStats.draftCourses - (deletedCourse?.isPublished ? 0 : 1),
      }))

      toast({
        title: "Course Deleted",
        description: `"${courseTitle}" has been permanently deleted`,
      })
    } catch (error: any) {
      console.error('Delete course error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete course",
        variant: "destructive",
      })
    } finally {
      setDeletingCourseId(null)
    }
  }

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={["teacher"]}>
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
    <ProtectedRoute allowedRoles={["teacher"]}>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user?.username}!
            </h1>
            <p className="text-base text-gray-600">Manage your courses and track student progress</p>
          </div>

          {/* Stats Overview */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Courses</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalCourses}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Students</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
                  </div>
                  <Users className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Lessons</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalLessons}</p>
                  </div>
                  <Target className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.averageRating}</p>
                  </div>
                  <Star className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
            <Card className="card-interactive group border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
              <Link href="/teacher/ai-assistant">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-base font-semibold mb-2 text-indigo-900">AI Course Assistant</h3>
                  <p className="text-sm text-indigo-700">Create courses faster with AI</p>
                  <Badge variant="secondary" className="mt-2">✨ NEW</Badge>
                </CardContent>
              </Link>
            </Card>

            <Card className="card-interactive group">
              <Link href="/teacher/course/create">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 gradient-accent rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Plus className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-base font-semibold mb-2">Create New Course</h3>
                  <p className="text-sm text-gray-600">Start building your next language course</p>
                </CardContent>
              </Link>
            </Card>

            <Card className="card-interactive group border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
              <Link href="/teacher/settings/google">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg">
                    <MessageCircle className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-base font-semibold mb-2 text-blue-900">Google Meet & Calendar</h3>
                  <p className="text-sm text-blue-700">Schedule classes and meetings</p>
                  <Badge variant="secondary" className="mt-2">✨ NEW</Badge>
                </CardContent>
              </Link>
            </Card>

            <Card className="card-interactive group">
              <Link href="/teacher/dashboard">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <BarChart3 className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-base font-semibold mb-2">View Analytics</h3>
                  <p className="text-sm text-gray-600">Track student progress and engagement</p>
                </CardContent>
              </Link>
            </Card>

            <Card className="card-interactive group">
              <Link href="/teacher/students">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 gradient-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-base font-semibold mb-2">Manage Students</h3>
                  <p className="text-sm text-gray-600">View and communicate with your students</p>
                </CardContent>
              </Link>
            </Card>

            <Card className="card-interactive group border-2 border-green-200 bg-gradient-to-br from-green-50 to-teal-50">
              <Link href="/teacher/classes">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg">
                    <Video className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-base font-semibold mb-2 text-green-900">View All Classes</h3>
                  <p className="text-sm text-green-700">Manage scheduled classes</p>
                </CardContent>
              </Link>
            </Card>
          </div>

          {/* Upcoming Classes Widget */}
          <div className="mb-8">
            <UpcomingClassesWidget />
          </div>

        {/* Courses Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">My Courses</h2>
            <Link href="/teacher/course/create">
              <Button className="btn-primary">
                <Plus className="mr-2 h-4 w-4" />
                Create Course
              </Button>
            </Link>
          </div>

          {courses.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="text-4xl mb-4">📚</div>
                <h3 className="text-lg font-semibold mb-2">No courses created yet</h3>
                <p className="text-base text-gray-600 mb-4">Start your teaching journey by creating your first course</p>
                <Link href="/teacher/course/create">
                  <Button>Create Your First Course</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Card key={course.id} className="card-interactive">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1">{course.title}</CardTitle>
                        <CardDescription className="text-sm line-clamp-2">
                          {course.description}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Badge variant={course.isPublished ? "default" : "secondary"}>
                          {course.isPublished ? "Published" : "Draft"}
                        </Badge>
                        {course.averageRating && course.averageRating > 0 && (
                          <div className="flex items-center gap-1 text-sm">
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            <span>{course.averageRating.toFixed(1)}</span>
                            {course.reviewCount && <span className="text-gray-500">({course.reviewCount})</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{course.enrollmentCount} students</span>
                          <span>•</span>
                          <span>{course.lessonsCount} lessons</span>
                        </div>                      <div className="flex gap-2">
                        <Link href={`/course/${course.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </Link>
                        <Link href={`/teacher/course/edit/${course.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700 hover:bg-red-100 border-red-200"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleDeleteCourse(course.id, course.title)
                          }}
                          disabled={deletingCourseId === course.id}
                        >
                          {deletingCourseId === course.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Recent Activity */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Activity</h2>
          <Card>
            <CardContent className="p-6">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-base text-gray-500">No recent activity yet</p>
                  <p className="text-sm text-gray-400 mt-1">Activity will appear here when students enroll or you create courses</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <activity.icon className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
        </div>
      </div>
    </ProtectedRoute>
  )
}