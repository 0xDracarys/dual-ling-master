"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  ArrowLeft, 
  Users, 
  Search, 
  X, 
  BookOpen, 
  TrendingUp, 
  Award,
  Filter,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"

interface StudentEnrollment {
  enrollmentId: string
  courseId: string
  courseTitle: string
  status: 'active' | 'completed' | 'dropped'
  progressPercentage: number
  completedLessonsCount: number
  totalLessonsCount: number
  enrolledAt: any
  lastAccessedAt: any
  averageQuizScore: number
}

interface Student {
  userId: string
  userName: string
  userEmail: string
  enrollments: StudentEnrollment[]
  totalEnrollments: number
  activeEnrollments: number
  completedEnrollments: number
  totalProgressPercentage: number
}

export default function TeacherStudentsPage() {
  const router = useRouter()
  const { token } = useAuth()
  const { toast } = useToast()

  const [students, setStudents] = useState<Student[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [courseFilter, setCourseFilter] = useState<string>("all")
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null)
  const [removingEnrollmentId, setRemovingEnrollmentId] = useState<string | null>(null)
  const [courses, setCourses] = useState<Array<{ id: string; title: string }>>([])

  // Fetch students and courses
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        // Fetch students
        const studentsResponse = await fetch('/api/teacher/students', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!studentsResponse.ok) {
          throw new Error('Failed to fetch students')
        }

        const studentsData = await studentsResponse.json()
        setStudents(studentsData.data.students || [])
        setFilteredStudents(studentsData.data.students || [])

        // Extract unique courses from enrollments
        const uniqueCourses = new Map<string, string>()
        studentsData.data.students.forEach((student: Student) => {
          student.enrollments.forEach((enrollment: StudentEnrollment) => {
            uniqueCourses.set(enrollment.courseId, enrollment.courseTitle)
          })
        })

        setCourses(
          Array.from(uniqueCourses.entries()).map(([id, title]) => ({ id, title }))
        )
      } catch (error: any) {
        console.error('Fetch students error:', error)
        toast({
          title: "Error",
          description: "Failed to load students",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (token) {
      fetchData()
    }
  }, [token, toast])

  // Apply filters
  useEffect(() => {
    let filtered = students

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (s) =>
          s.userName.toLowerCase().includes(query) ||
          s.userEmail.toLowerCase().includes(query)
      )
    }

    // Course filter
    if (courseFilter !== 'all') {
      filtered = filtered.filter((s) =>
        s.enrollments.some((e) => e.courseId === courseFilter)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((s) => {
        if (statusFilter === 'active') {
          return s.activeEnrollments > 0
        } else if (statusFilter === 'completed') {
          return s.completedEnrollments > 0 && s.activeEnrollments === 0
        } else if (statusFilter === 'dropped') {
          return s.enrollments.some((e) => e.status === 'dropped')
        }
        return true
      })
    }

    setFilteredStudents(filtered)
  }, [students, searchQuery, courseFilter, statusFilter])

  const handleRemoveEnrollment = async (
    enrollmentId: string,
    courseId: string,
    studentName: string,
    courseTitle: string
  ) => {
    const confirmed = confirm(
      `Remove ${studentName} from "${courseTitle}"?\n\n` +
      `This will:\n` +
      `• Remove their enrollment\n` +
      `• Delete their progress data\n` +
      `• Prevent them from accessing course content\n\n` +
      `This action cannot be undone.`
    )

    if (!confirmed) return

    setRemovingEnrollmentId(enrollmentId)

    try {
      const response = await fetch(`/api/courses/${courseId}/enrollments/${enrollmentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove student')
      }

      // Optimistic UI update - remove enrollment from local state
      setStudents((prev) =>
        prev
          .map((student) => ({
            ...student,
            enrollments: student.enrollments.filter((e) => e.enrollmentId !== enrollmentId),
          }))
          .filter((student) => student.enrollments.length > 0) // Remove students with no enrollments
      )

      toast({
        title: "Student Removed",
        description: data.message || `${studentName} has been removed from "${courseTitle}"`,
      })
    } catch (error: any) {
      console.error('Remove enrollment error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to remove student",
        variant: "destructive",
      })
    } finally {
      setRemovingEnrollmentId(null)
    }
  }

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return 'Unknown'
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      if (isNaN(date.getTime())) return 'Unknown'
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(date)
    } catch (error) {
      console.error('Date formatting error:', error)
      return 'Unknown'
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default'
      case 'completed':
        return 'secondary'
      case 'dropped':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={["teacher"]}>
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-8">
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-6 w-96" />
          </div>

          <div className="grid gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-20 w-full" />
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
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.push("/teacher/dashboard")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Management</h1>
              <p className="text-gray-600">
                View and manage all students enrolled in your courses
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{filteredStudents.length}</p>
                <p className="text-sm text-gray-600">Total Students</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-600" />
              <CardTitle>Filters</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Course Filter */}
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="dropped">Dropped</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Active Filters Display */}
            {(searchQuery || courseFilter !== 'all' || statusFilter !== 'all') && (
              <div className="flex items-center gap-2 mt-4">
                <p className="text-sm text-gray-600">Active Filters:</p>
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1">
                    Search: {searchQuery}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-red-600"
                      onClick={() => setSearchQuery('')}
                    />
                  </Badge>
                )}
                {courseFilter !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Course: {courses.find((c) => c.id === courseFilter)?.title}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-red-600"
                      onClick={() => setCourseFilter('all')}
                    />
                  </Badge>
                )}
                {statusFilter !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Status: {statusFilter}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-red-600"
                      onClick={() => setStatusFilter('all')}
                    />
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('')
                    setCourseFilter('all')
                    setStatusFilter('all')
                  }}
                  className="text-xs"
                >
                  Clear All
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Students List */}
        {filteredStudents.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {students.length === 0 ? 'No Students Yet' : 'No Students Match Filters'}
              </h3>
              <p className="text-gray-600 mb-4">
                {students.length === 0
                  ? 'Students will appear here once they enroll in your courses'
                  : 'Try adjusting your filters to see more students'}
              </p>
              {students.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('')
                    setCourseFilter('all')
                    setStatusFilter('all')
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredStudents.map((student) => (
              <Card key={student.userId} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  {/* Student Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4 flex-1">
                      {/* Avatar */}
                      <div className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-xl">
                          {student.userName.charAt(0).toUpperCase()}
                        </span>
                      </div>

                      {/* Student Info */}
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{student.userName}</h3>
                        <p className="text-sm text-gray-600">{student.userEmail}</p>
                      </div>

                      {/* Stats */}
                      <div className="hidden md:flex items-center gap-6">
                        <div className="text-center">
                          <div className="flex items-center gap-1 mb-1">
                            <BookOpen className="h-4 w-4 text-indigo-600" />
                            <p className="text-sm font-semibold text-gray-900">
                              {student.totalEnrollments}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500">Courses</p>
                        </div>

                        <div className="text-center">
                          <div className="flex items-center gap-1 mb-1">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <p className="text-sm font-semibold text-gray-900">
                              {student.totalProgressPercentage}%
                            </p>
                          </div>
                          <p className="text-xs text-gray-500">Avg Progress</p>
                        </div>

                        <div className="text-center">
                          <div className="flex items-center gap-1 mb-1">
                            <Award className="h-4 w-4 text-yellow-600" />
                            <p className="text-sm font-semibold text-gray-900">
                              {student.completedEnrollments}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500">Completed</p>
                        </div>
                      </div>
                    </div>

                    {/* Expand Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setExpandedStudentId(
                          expandedStudentId === student.userId ? null : student.userId
                        )
                      }
                    >
                      {expandedStudentId === student.userId ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {/* Enrollment Details (Expandable) */}
                  {expandedStudentId === student.userId && (
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3">Enrolled Courses</h4>
                      <div className="space-y-3">
                        {student.enrollments.map((enrollment) => (
                          <div
                            key={enrollment.enrollmentId}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900 mb-1">
                                {enrollment.courseTitle}
                              </h5>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span>
                                  Progress: {enrollment.progressPercentage}% ({enrollment.completedLessonsCount}/{enrollment.totalLessonsCount} lessons)
                                </span>
                                <span>•</span>
                                <span>Enrolled: {formatDate(enrollment.enrolledAt)}</span>
                                <span>•</span>
                                <Badge variant={getStatusBadgeVariant(enrollment.status)}>
                                  {enrollment.status}
                                </Badge>
                              </div>
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-100 border-red-200 ml-4"
                              onClick={() =>
                                handleRemoveEnrollment(
                                  enrollment.enrollmentId,
                                  enrollment.courseId,
                                  student.userName,
                                  enrollment.courseTitle
                                )
                              }
                              disabled={removingEnrollmentId === enrollment.enrollmentId}
                            >
                              {removingEnrollmentId === enrollment.enrollmentId ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                              ) : (
                                <>
                                  <X className="h-4 w-4 mr-2" />
                                  Remove
                                </>
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
