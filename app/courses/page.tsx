"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useLanguage } from "@/hooks/use-language"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen, Users, Star, Clock, Search, Globe, Award, Sparkles, TrendingUp, ArrowRight, Layers } from "lucide-react"

interface Course {
  id: string
  title: string
  description: string
  teacherName: string
  language: 'en' | 'lt'
  targetLanguage: 'en' | 'lt'
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

const levelConfig = {
  beginner: { label: "Pradedantysis", color: "bg-emerald-100 text-emerald-800 border-emerald-200", dot: "bg-emerald-500", gradient: "from-emerald-400 to-teal-500" },
  intermediate: { label: "Vidutinis", color: "bg-amber-100 text-amber-800 border-amber-200", dot: "bg-amber-500", gradient: "from-amber-400 to-orange-500" },
  advanced: { label: "Pažengęs", color: "bg-rose-100 text-rose-800 border-rose-200", dot: "bg-rose-500", gradient: "from-rose-400 to-pink-500" },
}

const coursePlaceholderGradients = [
  "from-violet-500 to-indigo-600",
  "from-blue-500 to-cyan-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-amber-600",
  "from-pink-500 to-rose-600",
  "from-purple-500 to-fuchsia-600",
]

export default function CoursesPage() {
  const { t } = useLanguage()
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedDifficulty, setSelectedDifficulty] = useState("all")
  const [sortBy, setSortBy] = useState("newest")

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch("/api/courses")
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
    fetchCourses()
  }, [])

  useEffect(() => {
    let filtered = [...courses]
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.teacherName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    if (selectedCategory !== "all") {
      filtered = filtered.filter(course => course.targetLanguage === selectedCategory)
    }
    if (selectedDifficulty !== "all") {
      filtered = filtered.filter(course => course.level === selectedDifficulty)
    }
    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => {
          const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime()
          const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime()
          return bTime - aTime
        })
        break
      case "oldest":
        filtered.sort((a, b) => {
          const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime()
          const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime()
          return aTime - bTime
        })
        break
      case "rating":
        filtered.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
        break
      case "students":
        filtered.sort((a, b) => b.enrollmentCount - a.enrollmentCount)
        break
      case "duration":
        filtered.sort((a, b) => a.estimatedHours - b.estimatedHours)
        break
    }
    setFilteredCourses(filtered)
  }, [courses, searchTerm, selectedCategory, selectedDifficulty, sortBy])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        {/* Skeleton hero */}
        <div className="py-16 px-4 bg-gradient-to-r from-indigo-600 to-purple-700">
          <div className="container-custom">
            <Skeleton className="h-12 w-80 mb-4 bg-white/20" />
            <Skeleton className="h-6 w-96 bg-white/20" />
          </div>
        </div>
        <div className="container-custom section-padding-sm">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="card-elevated overflow-hidden">
                <Skeleton className="h-48 w-full rounded-none" />
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-16 w-full mb-4" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">

      {/* ─── Hero Banner ─── */}
      <section className="relative py-16 px-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white overflow-hidden">
        {/* Decorative bg */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/5 rounded-full"></div>
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/5 rounded-full"></div>
        </div>
        <div className="container-custom relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              {t.coursesPage.badge}
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
              {t.coursesPage.titleMain}
              <span className="block text-indigo-200 mt-1">{t.coursesPage.titleSub}</span>
            </h1>
            <p className="text-lg text-indigo-100 mb-8 max-w-2xl">
              {t.coursesPage.description}
            </p>
            {/* Mini stats */}
            <div className="flex flex-wrap gap-6">
              {[
                { icon: BookOpen, value: `${courses.length}`, label: t.coursesPage.stats.courses },
                { icon: Layers, value: "3", label: t.coursesPage.stats.levels },
                { icon: Globe, value: "2", label: t.coursesPage.stats.languages },
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                  <stat.icon className="h-5 w-5 text-indigo-200" />
                  <span className="font-bold text-white text-lg">{stat.value}</span>
                  <span className="text-indigo-200 text-sm">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Sticky Filter Bar ─── */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="container-custom py-4">
          <div className="grid md:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t.coursesPage.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 bg-white"
              />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-11 border-gray-200 focus:border-indigo-500 text-gray-900 bg-white">
                <Globe className="h-4 w-4 mr-2 text-gray-400" />
                <SelectValue placeholder={t.coursesPage.filterLang} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.coursesPage.filterLangAll}</SelectItem>
                <SelectItem value="lt">{t.coursesPage.filterLangLt}</SelectItem>
                <SelectItem value="en">{t.coursesPage.filterLangEn}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger className="h-11 border-gray-200 focus:border-indigo-500 text-gray-900 bg-white">
                <Layers className="h-4 w-4 mr-2 text-gray-400" />
                <SelectValue placeholder={t.coursesPage.filterLevel} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.coursesPage.filterLevelAll}</SelectItem>
                <SelectItem value="beginner">🟢 {t.coursesPage.filterLevelBeginner}</SelectItem>
                <SelectItem value="intermediate">🟡 {t.coursesPage.filterLevelIntermediate}</SelectItem>
                <SelectItem value="advanced">🔴 {t.coursesPage.filterLevelAdvanced}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-11 border-gray-200 focus:border-indigo-500 text-gray-900 bg-white">
                <TrendingUp className="h-4 w-4 mr-2 text-gray-400" />
                <SelectValue placeholder={t.coursesPage.sortLabel} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{t.coursesPage.sortNewest}</SelectItem>
                <SelectItem value="oldest">{t.coursesPage.sortOldest}</SelectItem>
                <SelectItem value="rating">{t.coursesPage.sortRating}</SelectItem>
                <SelectItem value="students">{t.coursesPage.sortPopular}</SelectItem>
                <SelectItem value="duration">{t.coursesPage.sortDuration}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ─── Results + Grid ─── */}
      <div className="container-custom section-padding-sm">
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600 font-medium">
            {t.coursesPage.showingText1} <span className="text-indigo-600 font-bold">{filteredCourses.length}</span> {t.coursesPage.showingText2}{" "}
            <span className="font-bold">{courses.length}</span> {t.coursesPage.showingText3}
          </p>
          {(searchTerm || selectedCategory !== "all" || selectedDifficulty !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSearchTerm(""); setSelectedCategory("all"); setSelectedDifficulty("all") }}
              className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
            >
              {t.coursesPage.clearFilters}
            </Button>
          )}
        </div>

        {filteredCourses.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-24 h-24 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="h-12 w-12 text-indigo-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">{t.coursesPage.notFoundTitle}</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {t.coursesPage.notFoundDesc}
            </p>
            <Button
              onClick={() => { setSearchTerm(""); setSelectedCategory("all"); setSelectedDifficulty("all") }}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700"
            >
              {t.coursesPage.showAllBtn}
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course, courseIndex) => {
              const level = levelConfig[course.level] || levelConfig.beginner
              const placeholderGradient = coursePlaceholderGradients[courseIndex % coursePlaceholderGradients.length]
              return (
                <Card key={course.id} className="card-interactive group overflow-hidden flex flex-col">
                  {/* Thumbnail / Placeholder */}
                  <div className="relative aspect-video overflow-hidden">
                    {course.thumbnailUrl ? (
                      <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${placeholderGradient} flex items-center justify-center`}>
                        <div className="text-center text-white">
                          <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-80" />
                          <p className="text-sm font-medium opacity-80">
                            {course.targetLanguage === 'lt' ? '🇱🇹 Lietuvių' : '🇬🇧 Anglų'}
                          </p>
                        </div>
                      </div>
                    )}
                    {/* Level badge overlay */}
                    <div className="absolute top-3 left-3">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${level.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${level.dot}`}></span>
                        {course.level === 'beginner' && t.coursesPage.filterLevelBeginner}
                        {course.level === 'intermediate' && t.coursesPage.filterLevelIntermediate}
                        {course.level === 'advanced' && t.coursesPage.filterLevelAdvanced}
                      </span>
                    </div>
                    {/* Language flag overlay */}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 text-sm">
                      {course.targetLanguage === 'lt' ? '🇱🇹' : '🇬🇧'}
                    </div>
                  </div>

                  <CardHeader className="pb-2 pt-4">
                    <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors leading-snug">
                      {course.title}
                    </CardTitle>
                    <p className="text-sm text-gray-500">{t.coursesPage.teacherPrefix} {course.teacherName}</p>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col gap-4">
                    <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>

                    {/* Stats row */}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{course.enrollmentCount}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{course.estimatedHours}h</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span>{(course.averageRating || 0).toFixed(1)}</span>
                        <span className="text-gray-400">({course.reviewCount || 0})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        <span>{course.lessonsCount}</span>
                      </div>
                    </div>

                    {/* CTA */}
                    <Link href={`/course/${course.id}`} className="mt-auto">
                      <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group/btn">
                        {t.coursesPage.viewCourseBtn}
                        <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}