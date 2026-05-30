"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Plus, Edit, Trash2, BookOpen, Play, CheckCircle, Eye, EyeOff, ArrowUp, ArrowDown, Users, X } from "lucide-react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { LessonModal } from "@/components/teacher/lesson-modal"
import { Skeleton } from "@/components/ui/skeleton"

interface Lesson {
  id: string
  title: string
  type: "video" | "reading" | "quiz" | "exercise"
  order: number
  description?: string
  content?: any
}

interface Enrollment {
  id: string
  userId: string
  courseId: string
  userName: string
  userEmail: string
  status: 'active' | 'completed' | 'dropped'
  enrolledAt: any
  progressPercentage: number
  completedLessonsCount: number
  totalLessonsCount: number
  lastAccessedAt: any
}

interface CourseData {
  id: string
  title: string
  description: string
  language: 'en' | 'lt'
  targetLanguage: 'en' | 'lt'
  level: 'beginner' | 'intermediate' | 'advanced'
  estimatedHours: number
  thumbnailUrl?: string
  lessons?: Lesson[]
  lessonsCount?: number
  isPublished: boolean
  enrollmentCount: number
}

export default function EditCoursePage() {
  const params = useParams()
  const courseId = params.id as string
  const router = useRouter()
  const { token } = useAuth()
  const { toast } = useToast()

  const [course, setCourse] = useState<CourseData | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [enrolledStudents, setEnrolledStudents] = useState<Enrollment[]>([])
  const [loadingStudents, setLoadingStudents] = useState(true)
  const [removingStudentId, setRemovingStudentId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    language: "en" as 'en' | 'lt',
    targetLanguage: "lt" as 'en' | 'lt',
    level: "beginner" as 'beginner' | 'intermediate' | 'advanced',
    estimatedHours: 5,
    thumbnailUrl: "",
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [showLessonModal, setShowLessonModal] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)

  useEffect(() => {
    const fetchCourseAndLessons = async () => {
      try {
        // Fetch course details and lessons in parallel
        const [courseResponse, lessonsResponse] = await Promise.all([
          fetch(`/api/courses/${courseId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`/api/courses/${courseId}/lessons`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ])

        if (courseResponse.ok) {
          const courseData = await courseResponse.json()
          setCourse(courseData.course)
          setFormData({
            title: courseData.course.title,
            description: courseData.course.description,
            language: courseData.course.language || 'en',
            targetLanguage: courseData.course.targetLanguage || 'lt',
            level: courseData.course.level || 'beginner',
            estimatedHours: courseData.course.estimatedHours || 5,
            thumbnailUrl: courseData.course.thumbnailUrl || '',
          })
        }

        if (lessonsResponse.ok) {
          const lessonsData = await lessonsResponse.json()
          setLessons(lessonsData.lessons || [])
        }
      } catch (error) {
        console.error("Error fetching course:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (token) {
      fetchCourseAndLessons()
      fetchEnrolledStudents()
    }
  }, [courseId, token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSaving(true)

    try {
      // Validate language mismatch
      if (formData.language === formData.targetLanguage) {
        throw new Error("Teaching language and target language must be different")
      }

      const response = await fetch(`/api/courses/${courseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update course")
      }

      setCourse((prev) => (prev ? { ...prev, ...formData } : null))
      
      toast({
        title: "Course updated",
        description: "Your changes have been saved successfully",
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update course",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublishToggle = async () => {
    if (!course) return
    
    // Check if course has lessons before publishing
    if (!course.isPublished && lessons.length === 0) {
      toast({
        title: "Cannot publish",
        description: "Please add at least one lesson before publishing the course",
        variant: "destructive",
      })
      return
    }

    const action = course.isPublished ? "unpublish" : "publish"
    const confirmed = confirm(
      `Are you sure you want to ${action} this course? ${
        course.isPublished
          ? "Students will no longer be able to enroll."
          : "The course will become visible to students."
      }`
    )

    if (!confirmed) return

    setIsPublishing(true)

    try {
      const response = await fetch(`/api/courses/${courseId}/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${action} course`)
      }

      setCourse((prev) => (prev ? { ...prev, isPublished: !prev.isPublished } : null))
      
      toast({
        title: `Course ${action}ed`,
        description: `Your course has been ${action}ed successfully`,
      })
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : `Failed to ${action} course`,
        variant: "destructive",
      })
    } finally {
      setIsPublishing(false)
    }
  }

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm("Are you sure you want to delete this lesson?")) return

    try {
      const response = await fetch(`/api/courses/${course?.id}/lessons/${lessonId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error("Failed to delete lesson")

      toast({
        title: "Lesson deleted",
        description: "The lesson has been removed from the course",
      })
      
      // Update local state
      if (course) {
        setLessons((prev) => prev.filter((lesson) => lesson.id !== lessonId))
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete lesson",
        variant: "destructive",
      })
    }
  }

  const handleLessonSaved = (savedLesson: Lesson) => {
    if (editingLesson) {
      // Update existing lesson
      setLessons((prev) => prev.map((lesson) => (lesson.id === savedLesson.id ? savedLesson : lesson)))
    } else {
      // Add new lesson
      setLessons((prev) => [...prev, savedLesson])
    }

    setShowLessonModal(false)
    setEditingLesson(null)
  }

  const handleMoveLesson = async (lessonId: string, direction: 'up' | 'down') => {
    const sortedLessons = [...lessons].sort((a, b) => a.order - b.order)
    const currentIndex = sortedLessons.findIndex(l => l.id === lessonId)
    
    if (currentIndex === -1) return
    if (direction === 'up' && currentIndex === 0) return
    if (direction === 'down' && currentIndex === sortedLessons.length - 1) return

    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    const currentLesson = sortedLessons[currentIndex]
    const swapLesson = sortedLessons[swapIndex]

    // Optimistic UI update
    const updatedLessons = lessons.map(lesson => {
      if (lesson.id === currentLesson.id) {
        return { ...lesson, order: swapLesson.order }
      }
      if (lesson.id === swapLesson.id) {
        return { ...lesson, order: currentLesson.order }
      }
      return lesson
    })
    setLessons(updatedLessons)

    try {
      // Update both lessons in backend
      const updates = [
        fetch(`/api/courses/${courseId}/lessons/${currentLesson.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ order: swapLesson.order })
        }),
        fetch(`/api/courses/${courseId}/lessons/${swapLesson.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ order: currentLesson.order })
        })
      ]

      const responses = await Promise.all(updates)
      
      if (!responses.every(r => r.ok)) {
        throw new Error('Failed to update lesson order')
      }

      toast({
        title: "Lesson reordered",
        description: "Lesson order has been updated successfully",
      })
    } catch (error) {
      // Rollback on error
      setLessons(lessons)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reorder lesson",
        variant: "destructive",
      })
    }
  }

  const fetchEnrolledStudents = async () => {
    try {
      setLoadingStudents(true)
      
      const response = await fetch(`/api/courses/${courseId}/enrollments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch students')
      }

      const data = await response.json()
      setEnrolledStudents(data.data.enrollments || [])
    } catch (error: any) {
      console.error('Fetch students error:', error)
      toast({
        title: "Error",
        description: "Failed to load enrolled students",
        variant: "destructive",
      })
    } finally {
      setLoadingStudents(false)
    }
  }

  const handleRemoveStudent = async (enrollmentId: string, studentName: string) => {
    const confirmed = confirm(
      `Remove ${studentName} from this course?\n\n` +
      `This will:\n` +
      `• Remove their enrollment\n` +
      `• Delete their progress data\n` +
      `• Prevent them from accessing course content\n\n` +
      `This action cannot be undone.`
    )

    if (!confirmed) return

    setRemovingStudentId(enrollmentId)

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

      // Optimistic UI update - remove from local state
      setEnrolledStudents(prev => prev.filter(e => e.id !== enrollmentId))

      // Update course enrollment count in UI
      setCourse(prev => prev ? {
        ...prev,
        enrollmentCount: Math.max(0, prev.enrollmentCount - 1),
      } : null)

      toast({
        title: "Student Removed",
        description: data.message || `${studentName} has been removed from the course`,
      })
    } catch (error: any) {
      console.error('Remove student error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to remove student",
        variant: "destructive",
      })
    } finally {
      setRemovingStudentId(null)
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

  const getLessonIcon = (type: string) => {
    switch (type) {
      case "text":
        return <BookOpen className="h-4 w-4 text-blue-600" />
      case "quiz":
        return <CheckCircle className="h-4 w-4 text-purple-600" />
      case "video":
        return <Play className="h-4 w-4 text-red-600" />
      default:
        return <BookOpen className="h-4 w-4 text-gray-600" />
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading course...</p>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="text-center py-12">
          <CardContent>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Course Not Found</h1>
            <p className="text-gray-600">
              The course you're looking for doesn't exist or you don't have permission to edit it.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["teacher"]}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.push("/teacher/dashboard")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Course</h1>
              <p className="text-gray-600">Manage your course content and settings</p>
            </div>
            <Badge variant={course.isPublished ? "default" : "secondary"}>
              {course.isPublished ? "Published" : "Draft"}
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Course Information */}
          <Card>
            <CardHeader>
              <CardTitle>Course Information</CardTitle>
              <CardDescription>Update your course details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="title">Course Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Course Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="language">Teaching Language</Label>
                    <Select
                      value={formData.language}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, language: value as 'en' | 'lt' }))}
                    >
                      <SelectTrigger id="language">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="lt">Lithuanian</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="targetLanguage">Target Language</Label>
                    <Select
                      value={formData.targetLanguage}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, targetLanguage: value as 'en' | 'lt' }))}
                    >
                      <SelectTrigger id="targetLanguage">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="lt">Lithuanian</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="level">Difficulty Level</Label>
                    <Select
                      value={formData.level}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, level: value as 'beginner' | 'intermediate' | 'advanced' }))}
                    >
                      <SelectTrigger id="level">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estimatedHours">Estimated Hours</Label>
                    <Input
                      id="estimatedHours"
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={formData.estimatedHours}
                      onChange={(e) => setFormData((prev) => ({ ...prev, estimatedHours: parseFloat(e.target.value) || 0 }))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thumbnailUrl">Course Thumbnail URL</Label>
                  <Input
                    id="thumbnailUrl"
                    type="url"
                    value={formData.thumbnailUrl}
                    onChange={(e) => setFormData((prev) => ({ ...prev, thumbnailUrl: e.target.value }))}
                    placeholder="https://example.com/image.jpg"
                  />
                  {formData.thumbnailUrl && (
                    <div className="mt-2">
                      <img
                        src={formData.thumbnailUrl}
                        alt="Course thumbnail preview"
                        className="w-full max-w-xs h-auto object-cover rounded-lg border"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const previewUrl = `/course/${courseId}`;
                      window.open(previewUrl, '_blank', 'noopener,noreferrer');
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview as Student
                  </Button>
                  
                  <Button
                    type="button"
                    variant={course?.isPublished ? "destructive" : "default"}
                    onClick={handlePublishToggle}
                    disabled={isPublishing}
                  >
                    {isPublishing ? (
                      "Processing..."
                    ) : course?.isPublished ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-2" />
                        Unpublish
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Publish
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Course Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Course Statistics</CardTitle>
              <CardDescription>Overview of your course performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Lessons</span>
                <span className="font-medium">{lessons.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Enrolled Students</span>
                <span className="font-medium">{course.enrollmentCount || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <Badge variant={course.isPublished ? "default" : "secondary"}>
                  {course.isPublished ? "Published" : "Draft"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lessons Management */}
        <Card className="mt-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Course Lessons</CardTitle>
                <CardDescription>Manage the content of your course</CardDescription>
              </div>
              <Button onClick={() => setShowLessonModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Lesson
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {lessons.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No lessons yet</h3>
                <p className="text-gray-600 mb-4">Start building your course by adding your first lesson</p>
                <Button onClick={() => setShowLessonModal(true)}>Add Your First Lesson</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {lessons
                  .sort((a, b) => a.order - b.order)
                  .map((lesson, index) => (
                    <div key={lesson.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getLessonIcon(lesson.type)}
                        <div>
                          <h4 className="font-medium">
                            {index + 1}. {lesson.title}
                          </h4>
                          <Badge variant="outline" className="text-xs mt-1">
                            {lesson.type}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMoveLesson(lesson.id, 'up')}
                          disabled={index === 0}
                          title="Move up"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMoveLesson(lesson.id, 'down')}
                          disabled={index === lessons.length - 1}
                          title="Move down"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingLesson(lesson)
                            setShowLessonModal(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteLesson(lesson.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Students Section */}
        <Card className="mt-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Enrolled Students</CardTitle>
                <CardDescription>Manage students enrolled in this course</CardDescription>
              </div>
              <Badge variant="secondary" className="text-base px-4 py-2">
                {enrolledStudents.length} {enrolledStudents.length === 1 ? 'Student' : 'Students'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loadingStudents ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : enrolledStudents.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Enrolled Yet</h3>
                <p className="text-sm text-gray-600">
                  {course.isPublished 
                    ? "Students will appear here once they enroll in your course" 
                    : "Publish your course to allow students to enroll"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {enrolledStudents.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {/* Student Avatar */}
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-indigo-600 font-semibold text-sm">
                          {enrollment.userName.charAt(0).toUpperCase()}
                        </span>
                      </div>

                      {/* Student Info */}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{enrollment.userName}</p>
                        <p className="text-sm text-gray-600">{enrollment.userEmail}</p>
                      </div>

                      {/* Enrollment Stats */}
                      <div className="hidden md:flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <p className="text-gray-500">Progress</p>
                          <p className="font-semibold text-gray-900">
                            {enrollment.progressPercentage}%
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-500">Enrolled</p>
                          <p className="font-semibold text-gray-900">
                            {formatDate(enrollment.enrolledAt)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-500">Status</p>
                          <Badge variant={enrollment.status === 'active' ? 'default' : 'secondary'}>
                            {enrollment.status}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Remove Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-100 border-red-200 ml-4"
                      onClick={() => handleRemoveStudent(enrollment.id, enrollment.userName)}
                      disabled={removingStudentId === enrollment.id}
                    >
                      {removingStudentId === enrollment.id ? (
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
            )}
          </CardContent>
        </Card>

        {/* Lesson Modal */}
        <LessonModal
          isOpen={showLessonModal}
          onClose={() => {
            setShowLessonModal(false)
            setEditingLesson(null)
          }}
          onSave={handleLessonSaved}
          courseId={courseId}
          lesson={editingLesson}
          token={token}
        />
      </div>
    </ProtectedRoute>
  )
}
