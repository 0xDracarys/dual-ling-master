"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen, Users, Star, Clock, Search, Filter, Globe, Award } from "lucide-react"

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

export default function CoursesPage() {
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

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.teacherName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by category (targetLanguage)
    if (selectedCategory !== "all") {
      filtered = filtered.filter(course => course.targetLanguage === selectedCategory)
    }

    // Filter by difficulty (level)
    if (selectedDifficulty !== "all") {
      filtered = filtered.filter(course => course.level === selectedDifficulty)
    }

    // Sort courses
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

  const categories = [
    { value: "all", label: "All Languages" },
    { value: "lt", label: "Lithuanian" },
    { value: "en", label: "English" }
  ]

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-800"
      case "intermediate":
        return "bg-yellow-100 text-yellow-800"
      case "advanced":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="container-custom section-padding-sm">
          <div className="mb-12">
            <Skeleton className="h-12 w-80 mb-4" />
            <Skeleton className="h-6 w-96" />
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="card">
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

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="card">
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
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container-custom section-padding-sm">
        <div className="mb-12">
          <h1 className="heading-1 mb-4">
            Lithuanian ↔ English <span className="gradient-text">Language Courses</span>
          </h1>
          <p className="body-large max-w-2xl">
            Discover specialized courses designed specifically for Lithuanian-English language learning. 
            Master both languages with expert instructors and culturally-aware curriculum.
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="card-elevated mb-8">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 bg-white hover:border-gray-400"
                />
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-12 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 bg-white hover:border-gray-400">
                  <SelectValue placeholder="Target Language" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger className="h-12 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 bg-white hover:border-gray-400">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-12 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 bg-white hover:border-gray-400">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="students">Most Popular</SelectItem>
                  <SelectItem value="duration">Shortest Duration</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="mb-6">
          <p className="body-medium text-gray-700">
            Showing {filteredCourses.length} of {courses.length} courses
          </p>
        </div>

        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <Card className="card-elevated text-center py-12">
            <CardContent>
              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="heading-3 mb-2">No courses found</h3>
              <p className="body-medium text-gray-700 mb-4">
                Try adjusting your search criteria or browse all courses
              </p>
              <Button onClick={() => {
                setSearchTerm("")
                setSelectedCategory("all")
                setSelectedDifficulty("all")
              }} className="btn-primary">
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Card key={course.id} className="card-interactive group">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <CardTitle className="heading-4 mb-1 group-hover:text-indigo-600 transition-colors">
                        {course.title}
                      </CardTitle>
                      <CardDescription className="body-small text-gray-700">
                        by {course.teacherName}
                      </CardDescription>
                    </div>
                    <Badge className={getDifficultyColor(course.level)}>
                      {course.level}
                    </Badge>
                  </div>

                  {course.thumbnailUrl && (
                    <div className="aspect-video bg-gray-100 rounded-lg mb-4 overflow-hidden">
                      <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}

                  <p className="body-small text-gray-700 line-clamp-2">
                    {course.description}
                  </p>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 body-small text-gray-600">
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
                  </div>

                  <div className="flex flex-wrap gap-1">
                    <Badge className="text-xs border border-gray-200 text-gray-600 bg-white">
                      {course.lessonsCount} lessons
                    </Badge>
                    <Badge className="text-xs border border-gray-200 text-gray-600 bg-white">
                      {course.targetLanguage === 'lt' ? 'Lithuanian' : 'English'}
                    </Badge>
                  </div>

                  <Link href={`/course/${course.id}`}>
                    <Button className="w-full btn-primary">
                      View Course
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}