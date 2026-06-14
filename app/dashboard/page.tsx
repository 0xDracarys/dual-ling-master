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
import { useLanguage } from "@/hooks/use-language"
import { BookOpen, Clock, Trophy, TrendingUp, Play, CheckCircle, Flame, ArrowRight, Star, Zap, Target, BarChart3, Award } from "lucide-react"

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

function getGreetingEmoji() {
  const hour = new Date().getHours()
  if (hour < 12) return "☀️"
  if (hour < 17) return "🌤️"
  return "🌙"
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
  const { t } = useLanguage()
  const d = t.dashboard
  const greetingEmoji = getGreetingEmoji()
  const hour = new Date().getHours()
  const greetingText = hour < 12 ? d.greetingMorning : hour < 17 ? d.greetingAfternoon : d.greetingEvening

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [enrollmentsResponse, progressResponse] = await Promise.all([
          fetch("/api/students/enrolled-courses", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/students/progress", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])

        if (enrollmentsResponse.ok && progressResponse.ok) {
          const enrollmentsData = await enrollmentsResponse.json()
          const progressData = await progressResponse.json()
          const enrollments = enrollmentsData.data.enrollments || []

          const courseProgressData: CourseProgress[] = await Promise.all(
            enrollments.map(async (enrollment: any) => {
              let firstLessonId = null
              try {
                const lessonsResponse = await fetch(`/api/courses/${enrollment.courseId}/lessons`)
                if (lessonsResponse.ok) {
                  const lessonsData = await lessonsResponse.json()
                  const lessons = lessonsData.lessons || []
                  if (lessons.length > 0) {
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

          const totalCourses = progressData.data.totalCourses || 0
          const completedCourses = progressData.data.completedCourses || 0
          const averageProgress = courseProgressData.length > 0
            ? courseProgressData.reduce((sum, course) => sum + course.progressPercentage, 0) / courseProgressData.length
            : 0

          setStats({
            totalCourses,
            completedCourses,
            averageProgress: Math.round(averageProgress * 100) / 100,
            totalTimeSpent: 0,
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
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
          <div className="container-custom section-padding-sm">
            <Skeleton className="h-10 w-72 mb-2" />
            <Skeleton className="h-5 w-96 mb-10" />
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="card-elevated">
                  <CardContent className="p-6">
                    <Skeleton className="h-4 w-24 mb-3" />
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="card-elevated">
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-3 w-full mb-4" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  const statCards = [
    {
      label: d.statTotalCourses,
      value: stats.totalCourses,
      icon: BookOpen,
      gradient: "from-violet-500 to-indigo-600",
      bgLight: "bg-violet-50",
      textColor: "text-violet-700",
      suffix: ""
    },
    {
      label: d.statCompleted,
      value: stats.completedCourses,
      icon: Trophy,
      gradient: "from-amber-500 to-orange-500",
      bgLight: "bg-amber-50",
      textColor: "text-amber-700",
      suffix: ""
    },
    {
      label: d.statAvgProgress,
      value: stats.averageProgress,
      icon: TrendingUp,
      gradient: "from-emerald-500 to-green-500",
      bgLight: "bg-emerald-50",
      textColor: "text-emerald-700",
      suffix: "%"
    },
    {
      label: d.statTimeSpent,
      value: stats.totalTimeSpent,
      icon: Clock,
      gradient: "from-pink-500 to-rose-500",
      bgLight: "bg-pink-50",
      textColor: "text-pink-700",
      suffix: "h"
    },
  ]

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        {/* ─── Hero Header ─── */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white py-12 px-4">
          <div className="container-custom">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{greetingEmoji}</span>
                  <span className="text-indigo-200 font-medium">{greetingText},</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold mb-2">
                  {user?.username || "Student"}!
                </h1>
                <p className="text-indigo-200 text-lg">
                  {d.subtitle}
                </p>
              </div>
              {/* Gamification Stats */}
              <div className="hidden md:flex items-center gap-4">
                {/* XP Card */}
                <div className="flex items-center gap-3 bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
                  <div className="w-10 h-10 bg-[#1CB0F6] rounded-xl flex items-center justify-center border-b-2 border-[#1899D6]">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-indigo-200 font-medium uppercase tracking-wider">{d.xpLabel}</p>
                    <p className="text-2xl font-black text-white">
                      {user?.xp || 0}
                    </p>
                  </div>
                </div>

                {/* Streak Card */}
                <div className="flex items-center gap-3 bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
                  <div className="w-10 h-10 bg-[#FFC800] rounded-xl flex items-center justify-center border-b-2 border-[#E5B400]">
                    <Flame className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-indigo-200 font-medium uppercase tracking-wider">{d.streakLabel}</p>
                    <div className="flex items-baseline gap-1">
                      <p className="text-2xl font-black text-white">
                        {user?.streak || 0}
                      </p>
                      <p className="text-sm font-bold text-indigo-200">{d.streakDays}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container-custom section-padding-sm">

          {/* ─── Stats Overview ─── */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 -mt-8">
            {statCards.map((stat, i) => (
              <Card key={i} className="card-elevated group hover:scale-105 transition-all duration-300 overflow-hidden">
                <div className={`h-1.5 bg-gradient-to-r ${stat.gradient}`}></div>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{stat.label}</p>
                      <p className="text-3xl font-black text-gray-900">
                        {stat.value}{stat.suffix}
                      </p>
                    </div>
                    <div className={`w-12 h-12 bg-gradient-to-r ${stat.gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ─── My Courses ─── */}
          <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{d.myCourses}</h2>
                <p className="text-gray-500 mt-1">{d.myCoursesSubtitle}</p>
              </div>
              <Link href="/courses">
                <Button variant="outline" className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-400">
                  <BookOpen className="mr-2 h-4 w-4" />
                  {d.browseCourses}
                </Button>
              </Link>
            </div>

            {courseProgress.length === 0 ? (
              <Card className="card-elevated text-center py-20 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                <CardContent>
                  <div className="w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <BookOpen className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{d.noCourses}</h3>
                  <p className="text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
                    {d.noCoursesDesc}
                  </p>
                  <Link href="/courses">
                    <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                      {d.noCoursesBtn}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courseProgress.map((course) => (
                  <Card key={course.courseId} className="card-interactive group overflow-hidden flex flex-col">
                    {/* Progress accent top bar */}
                    <div className="h-1 bg-gray-100">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                        style={{ width: `${course.progressPercentage}%` }}
                      ></div>
                    </div>

                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors leading-snug truncate">
                            {course.courseTitle}
                          </CardTitle>
                          <CardDescription className="mt-1">su {course.teacherName}</CardDescription>
                        </div>
                        <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 ml-2 flex-shrink-0">
                          {course.totalLessons} pamokos
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="flex-1 flex flex-col gap-4">
                      {/* Progress */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm font-semibold">
                          <span className="text-gray-600">Pažanga</span>
                          <span className="text-indigo-600">{Math.round(course.progressPercentage)}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                          <div
                            className="h-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700"
                            style={{ width: `${course.progressPercentage}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-400">
                          {course.completedLessons} iš {course.totalLessons} pamokų baigta
                        </p>
                      </div>

                      {/* Quiz score */}
                      {course.averageQuizScore > 0 && (
                        <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                          <Trophy className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                          <span className="text-sm font-semibold text-emerald-700">
                            Vidutinis viktorinos rezultatas: {Math.round(course.averageQuizScore)}%
                          </span>
                        </div>
                      )}

                      {/* Current lesson */}
                      {course.currentLesson && (
                        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                          <Play className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          <span className="text-sm font-semibold text-blue-700 truncate">
                            Kita: {course.currentLesson}
                          </span>
                        </div>
                      )}

                      {/* CTA */}
                      <Link href={course.firstLessonId ? `/course/${course.courseId}/lesson/${course.firstLessonId}` : `/course/${course.courseId}`} className="mt-auto">
                        <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                          {course.progressPercentage > 0 ? (
                            <>
                              <Play className="mr-2 h-4 w-4" />
                              {d.continue}
                            </>
                          ) : (
                            <>
                              <Zap className="mr-2 h-4 w-4" />
                              {d.start}
                            </>
                          )}
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* ─── Quick Actions ─── */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Greiti veiksmai</h2>
            <p className="text-gray-500 mb-8">Ką norėtumėte daryti toliau?</p>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  href: "/courses",
                  icon: BookOpen,
                  gradient: "from-violet-500 to-indigo-600",
                  title: "Naršyti kursus",
                  desc: "Atrask naujus kursus ir praplėsk žinias"
                },
                {
                  href: "/profile",
                  icon: BarChart3,
                  gradient: "from-emerald-500 to-green-600",
                  title: "Mano pažanga",
                  desc: "Peržiūrėk detalius mokymosi pasiekimus"
                },
                {
                  href: "/settings",
                  icon: Award,
                  gradient: "from-amber-500 to-orange-600",
                  title: "Pasiekimai",
                  desc: "Peržiūrėk badges ir mokymosi etapus"
                }
              ].map((action, i) => (
                <Link href={action.href} key={i}>
                  <Card className="card-interactive group h-full">
                    <CardContent className="p-8 text-center">
                      <div className={`w-16 h-16 bg-gradient-to-r ${action.gradient} rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <action.icon className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-500 leading-relaxed">{action.desc}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </ProtectedRoute>
  )
}
