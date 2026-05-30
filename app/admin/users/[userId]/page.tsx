"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/hooks/use-auth"
import {
  Users, BookOpen, ArrowLeft, Mail, Calendar,
  Shield, GraduationCap, Edit, Ban, CheckCircle, AlertTriangle, TrendingUp
} from "lucide-react"

interface UserProfile {
  _id: string
  username: string
  email: string
  role: "student" | "teacher" | "admin"
  createdAt: string
  isActive: boolean
  enrolledCourses?: {
    courseId: string
    courseTitle: string
    progressPercentage: number
    completedLessons: number
    totalLessons: number
  }[]
  createdCourses?: {
    _id: string
    title: string
    enrolledStudents: number
    isPublished: boolean
  }[]
}

export default function AdminUserProfile() {
  const params = useParams()
  const userId = params?.userId as string
  const { token } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/admin/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setProfile(data.data)
        }
      } catch (e) {
        console.error("Failed to fetch user profile", e)
      } finally {
        setIsLoading(false)
      }
    }
    if (token && userId) fetchProfile()
  }, [token, userId])

  const roleColor = (role: string) => {
    if (role === "admin") return "bg-red-100 text-red-700 border-red-200"
    if (role === "teacher") return "bg-purple-100 text-purple-700 border-purple-200"
    return "bg-blue-100 text-blue-700 border-blue-200"
  }

  const RoleIcon = profile?.role === "admin" ? Shield : profile?.role === "teacher" ? GraduationCap : Users

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          {/* Back */}
          <Link href="/admin/users">
            <Button variant="ghost" className="mb-6 hover:bg-indigo-50 text-indigo-700">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Users
            </Button>
          </Link>

          {isLoading ? (
            <div className="space-y-6">
              <Card><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
              <Card><CardContent className="p-6"><Skeleton className="h-40 w-full" /></CardContent></Card>
            </div>
          ) : !profile ? (
            <Card className="text-center p-12">
              <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <p className="text-xl font-semibold text-gray-700">User not found</p>
              <p className="text-gray-500 mt-2">This user may have been deleted or the ID is invalid.</p>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Profile Header */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    {/* Avatar */}
                    <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg flex-shrink-0">
                      {profile.username.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h1 className="text-2xl font-bold text-gray-900">{profile.username}</h1>
                        <Badge className={`${roleColor(profile.role)} border capitalize font-medium`}>
                          <RoleIcon className="h-3 w-3 mr-1" />
                          {profile.role}
                        </Badge>
                        {profile.isActive ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" /> Active
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700 border-red-200">
                            <Ban className="h-3 w-3 mr-1" /> Suspended
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-600 flex items-center gap-2 mb-1">
                        <Mail className="h-4 w-4 text-indigo-400" />
                        {profile.email}
                      </p>
                      <p className="text-sm text-gray-400 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Member since {new Date(profile.createdAt).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 min-w-[140px]">
                      <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                      <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                        {profile.isActive ? (
                          <><Ban className="h-4 w-4 mr-2" /> Suspend</>
                        ) : (
                          <><CheckCircle className="h-4 w-4 mr-2" /> Reactivate</>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Student View — enrolled courses */}
              {profile.role === "student" && (
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-indigo-600" />
                      Enrolled Courses
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!profile.enrolledCourses?.length ? (
                      <p className="text-gray-500 text-center py-8">No courses enrolled yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {profile.enrolledCourses.map((course) => (
                          <div key={course.courseId} className="p-4 rounded-xl bg-gray-50 hover:bg-indigo-50 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-semibold text-gray-900">{course.courseTitle}</p>
                              <span className="text-sm font-bold text-indigo-600">{Math.round(course.progressPercentage)}%</span>
                            </div>
                            <Progress value={course.progressPercentage} className="h-2 mb-1" />
                            <p className="text-xs text-gray-500">
                              {course.completedLessons} of {course.totalLessons} lessons completed
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Teacher View — created courses */}
              {profile.role === "teacher" && (
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-purple-600" />
                      Created Courses
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!profile.createdCourses?.length ? (
                      <p className="text-gray-500 text-center py-8">No courses created yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {profile.createdCourses.map((course) => (
                          <div key={course._id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-purple-50 transition-colors">
                            <div>
                              <p className="font-semibold text-gray-900">{course.title}</p>
                              <p className="text-sm text-gray-500">
                                <TrendingUp className="inline h-3 w-3 mr-1" />
                                {course.enrolledStudents} enrolled students
                              </p>
                            </div>
                            <Badge
                              className={course.isPublished
                                ? "bg-green-100 text-green-700 border-green-200"
                                : "bg-yellow-100 text-yellow-700 border-yellow-200"
                              }
                            >
                              {course.isPublished ? "Published" : "Draft"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
