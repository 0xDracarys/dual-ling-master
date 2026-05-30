"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Search, Eye, Trash2, BookOpen } from "lucide-react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/hooks/use-auth"

interface Course {
  _id: string
  title: string
  description: string
  teacher: {
    username: string
    email: string
  }
  lessonsCount: number
  enrolledStudents: number
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const { token } = useAuth()

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch("/api/admin/courses", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setCourses(data.courses || [])
          setFilteredCourses(data.courses || [])
        }
      } catch (error) {
        console.error("Error fetching courses:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (token) {
      fetchCourses()
    }
  }, [token])

  useEffect(() => {
    let filtered = courses

    if (searchTerm) {
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.teacher.username.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      const isPublished = statusFilter === "published"
      filtered = filtered.filter((course) => course.isPublished === isPublished)
    }

    setFilteredCourses(filtered)
  }, [courses, searchTerm, statusFilter])

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setCourses(courses.filter((course) => course._id !== courseId))
      }
    } catch (error) {
      console.error("Error deleting course:", error)
    }
  }

  const togglePublishStatus = async (courseId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isPublished: !currentStatus,
        }),
      })

      if (response.ok) {
        setCourses(
          courses.map((course) => (course._id === courseId ? { ...course, isPublished: !currentStatus } : course)),
        )
      }
    } catch (error) {
      console.error("Error updating course status:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading courses...</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/admin/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Course Management</h1>
          <p className="text-gray-600">Oversee all courses on the platform</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  All Courses ({filteredCourses.length})
                </CardTitle>
                <CardDescription>View and manage all courses</CardDescription>
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mt-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Lessons</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCourses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No courses found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCourses.map((course) => (
                      <TableRow key={course._id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{course.title}</p>
                            <p className="text-sm text-gray-500 line-clamp-1">{course.description}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{course.teacher.username}</p>
                            <p className="text-xs text-gray-500">{course.teacher.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={course.isPublished ? "default" : "secondary"}>
                            {course.isPublished ? "Published" : "Draft"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{course.enrolledStudents}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{course.lessonsCount}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{new Date(course.createdAt).toLocaleDateString()}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/course/${course._id}`}>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => togglePublishStatus(course._id, course.isPublished)}
                            >
                              {course.isPublished ? "Unpublish" : "Publish"}
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteCourse(course._id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
