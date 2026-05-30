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
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  BarChart3,
  Settings,
  Eye,
  Edit,
  Trash2,
  Plus,
  Activity,
  Target,
  Award
} from "lucide-react"

interface SystemStats {
  totalUsers: number
  totalCourses: number
  totalEnrollments: number
  averageCourseProgress: number
  activeUsers: number
  newUsersThisMonth: number
  publishedCourses: number
  draftCourses: number
}

interface RecentUser {
  _id: string
  username: string
  email: string
  role: string
  createdAt: string
  isActive: boolean
}

interface RecentCourse {
  _id: string
  title: string
  teacherName: string
  enrolledStudents: number
  isPublished: boolean
  createdAt: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    averageCourseProgress: 0,
    activeUsers: 0,
    newUsersThisMonth: 0,
    publishedCourses: 0,
    draftCourses: 0
  })
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [recentCourses, setRecentCourses] = useState<RecentCourse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { token, user } = useAuth()

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        // Fetch system analytics
        const analyticsResponse = await fetch("/api/admin/stats", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (analyticsResponse.ok) {
          const analyticsData = await analyticsResponse.json()
          setStats(analyticsData.data)
        }

        // Fetch recent users
        const usersResponse = await fetch("/api/admin/users?limit=5", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          setRecentUsers(usersData.data.users || [])
        }

        // Fetch recent courses
        const coursesResponse = await fetch("/api/admin/courses?limit=5", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (coursesResponse.ok) {
          const coursesData = await coursesResponse.json()
          setRecentCourses(coursesData.data.courses || [])
        }
      } catch (error) {
        console.error("Error fetching admin data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (token) {
      fetchAdminData()
    }
  }, [token])

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={["admin"]}>
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

          <div className="grid md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">Monitor and manage the LangExchange platform</p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
                  <p className="text-xs text-green-600">+{stats.newUsersThisMonth} this month</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Courses</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalCourses}</p>
                  <p className="text-xs text-gray-500">{stats.publishedCourses} published</p>
                </div>
                <BookOpen className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Enrollments</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalEnrollments.toLocaleString()}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.averageCourseProgress}%</p>
                </div>
                <Target className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <Link href="/admin/users">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Manage Users</h3>
                <p className="text-gray-600 text-sm">View and manage all users</p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <Link href="/admin/courses">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Manage Courses</h3>
                <p className="text-gray-600 text-sm">Review and moderate courses</p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <Link href="/admin/analytics">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Analytics</h3>
                <p className="text-gray-600 text-sm">View detailed platform analytics</p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <Link href="/admin/settings">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Settings className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Settings</h3>
                <p className="text-gray-600 text-sm">Configure platform settings</p>
              </CardContent>
            </Link>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Recent Users */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Recent Users</CardTitle>
                <Link href="/admin/users">
                  <Button className="btn-outline-primary" size="sm">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentUsers.map((user) => (
                  <div key={user._id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.username}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={user.role === "admin" ? "default" : user.role === "teacher" ? "secondary" : "outline"}>
                        {user.role}
                      </Badge>
                      {user.isActive ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Courses */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Recent Courses</CardTitle>
                <Link href="/admin/courses">
                  <Button className="btn-outline-primary" size="sm">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentCourses.map((course) => (
                  <div key={course._id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{course.title}</p>
                      <p className="text-sm text-gray-500">by {course.teacherName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={course.isPublished ? "default" : "secondary"}>
                        {course.isPublished ? "Published" : "Draft"}
                      </Badge>
                      <span className="text-sm text-gray-500">{course.enrolledStudents} students</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Health */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Database</h3>
                <p className="text-sm text-gray-600">All systems operational</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Activity className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">API</h3>
                <p className="text-sm text-gray-600">Response time: 120ms</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Security</h3>
                <p className="text-sm text-gray-600">All checks passed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}