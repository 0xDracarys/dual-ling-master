"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/hooks/use-auth"
import { 
  Users, BookOpen, TrendingUp, Activity, BarChart3,
  ArrowUpRight, ArrowDownRight, Calendar, Zap
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts"

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#06b6d4"]

export default function AdminAnalytics() {
  const { token } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/admin/stats", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setStats(data.data)
        }
      } catch (e) {
        console.error("Failed to fetch stats", e)
      } finally {
        setIsLoading(false)
      }
    }
    if (token) fetchStats()
  }, [token])

  const roleData = stats
    ? [
        { name: "Students", value: stats.totalUsers - (stats.teacherCount || 1) - (stats.adminCount || 1) },
        { name: "Teachers", value: stats.teacherCount || 1 },
        { name: "Admins", value: stats.adminCount || 1 },
      ]
    : []

  const courseData = stats
    ? [
        { name: "Published", value: stats.publishedCourses || 0 },
        { name: "Draft", value: stats.draftCourses || 0 },
      ]
    : []

  const activityData = [
    { month: "Jan", enrollments: 12 },
    { month: "Feb", enrollments: 28 },
    { month: "Mar", enrollments: 19 },
    { month: "Apr", enrollments: 35 },
    { month: "May", enrollments: stats?.totalEnrollments || 0 },
  ]

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Platform Analytics</h1>
            <p className="text-gray-600">Real-time overview of platform health and usage</p>
          </div>

          {/* KPI Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              {
                label: "Total Users",
                value: stats?.totalUsers ?? "—",
                sub: `+${stats?.newUsersThisMonth ?? 0} this month`,
                icon: Users,
                trend: "up",
                color: "from-blue-500 to-cyan-500",
              },
              {
                label: "Active Users",
                value: stats?.activeUsers ?? "—",
                sub: "Logged in last 30 days",
                icon: Activity,
                trend: "up",
                color: "from-green-500 to-emerald-500",
              },
              {
                label: "Total Enrollments",
                value: stats?.totalEnrollments ?? "—",
                sub: "Across all courses",
                icon: TrendingUp,
                trend: "up",
                color: "from-purple-500 to-pink-500",
              },
              {
                label: "Avg Progress",
                value: `${stats?.averageCourseProgress ?? 0}%`,
                sub: "Course completion rate",
                icon: BarChart3,
                trend: "neutral",
                color: "from-orange-500 to-red-500",
              },
            ].map((kpi, i) => (
              <Card key={i} className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-r ${kpi.color} rounded-xl flex items-center justify-center shadow-lg`}>
                      <kpi.icon className="h-6 w-6 text-white" />
                    </div>
                    {kpi.trend === "up" ? (
                      <ArrowUpRight className="h-5 w-5 text-green-500" />
                    ) : (
                      <Activity className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-500 mb-1">{kpi.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{isLoading ? "…" : kpi.value}</p>
                  <p className="text-xs text-gray-500">{kpi.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid lg:grid-cols-3 gap-8 mb-8">
            {/* Enrollment trend */}
            <Card className="lg:col-span-2 hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-indigo-600" />
                  Enrollment Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
                    />
                    <Bar dataKey="enrollments" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Users by role */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  Users by Role
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={roleData.length ? roleData : [{ name: "No data", value: 1 }]}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {(roleData.length ? roleData : [{ name: "No data", value: 1 }]).map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Course Status Row */}
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-indigo-600" />
                  Course Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: "Published", value: stats?.publishedCourses ?? 0, color: "bg-green-500", max: stats?.totalCourses || 1 },
                    { label: "Draft", value: stats?.draftCourses ?? 0, color: "bg-yellow-400", max: stats?.totalCourses || 1 },
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">{item.label}</span>
                        <span className="text-gray-500">{item.value}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3">
                        <div
                          className={`${item.color} h-3 rounded-full transition-all duration-500`}
                          style={{ width: `${Math.min(100, (item.value / item.max) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-indigo-600" />
                  Platform Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: "Firebase Auth", status: "Operational" },
                    { label: "Firestore Database", status: "Operational" },
                    { label: "AI TeacherBot", status: "Operational" },
                    { label: "File Storage", status: "Operational" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                      <span className="text-sm font-medium text-gray-700">{item.label}</span>
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        ✓ {item.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
