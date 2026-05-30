"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  ChevronLeft, 
  ChevronRight,
  BookOpen, 
  Play, 
  CheckCircle2,
  CircleDot,
  Lock,
  Menu,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Lesson {
  _id: string
  id?: string
  title: string
  type: "text" | "quiz" | "video" | "reading" | "exercise"
  duration?: number
  order: number
  isCompleted?: boolean
  isLocked?: boolean
}

interface LessonNavigationSidebarProps {
  courseTitle: string
  lessons: Lesson[]
  currentLessonId: string
  totalLessons: number
  completedLessons: number
  onNavigateToLesson: (lessonId: string) => void
  className?: string
}

export function LessonNavigationSidebar({
  courseTitle,
  lessons,
  currentLessonId,
  totalLessons,
  completedLessons,
  onNavigateToLesson,
  className
}: LessonNavigationSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0

  const getLessonIcon = (type: string, isCompleted?: boolean, isLocked?: boolean) => {
    if (isLocked) {
      return <Lock className="h-4 w-4 text-gray-400" />
    }
    if (isCompleted) {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />
    }

    switch (type) {
      case "video":
        return <Play className="h-4 w-4 text-red-500" />
      case "quiz":
        return <CircleDot className="h-4 w-4 text-purple-500" />
      case "reading":
      case "text":
        return <BookOpen className="h-4 w-4 text-blue-500" />
      default:
        return <BookOpen className="h-4 w-4 text-gray-500" />
    }
  }

  const SidebarContent = () => (
    <>
      {/* Header */}
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold line-clamp-2">
              {courseTitle}
            </CardTitle>
            <p className="text-xs text-gray-500 mt-1">
              {totalLessons} lessons
            </p>
          </div>
          
          {/* Desktop collapse button */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex flex-shrink-0 h-8 w-8"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>

          {/* Mobile close button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden flex-shrink-0 h-8 w-8"
            onClick={() => setIsMobileOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {/* Progress */}
      {!isCollapsed && (
        <div className="px-6 pb-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600 font-medium">Your Progress</span>
            <span className="text-indigo-600 font-semibold">
              {completedLessons} / {totalLessons}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <p className="text-xs text-gray-500">
            {Math.round(progressPercentage)}% complete
          </p>
        </div>
      )}

      {/* Lessons List */}
      <CardContent className="p-0">
        <div className="space-y-1 max-h-[calc(100vh-280px)] overflow-y-auto px-3 pb-4">
          {lessons
            .sort((a, b) => a.order - b.order)
            .map((lesson, index) => {
              const lessonId = lesson._id || lesson.id
              const isCurrent = lessonId === currentLessonId
              const isLocked = lesson.isLocked || false
              
              return (
                <button
                  key={lessonId}
                  onClick={() => {
                    if (!isLocked) {
                      onNavigateToLesson(lessonId!)
                      setIsMobileOpen(false)
                    }
                  }}
                  disabled={isLocked}
                  className={cn(
                    "w-full text-left p-3 rounded-lg transition-all duration-200",
                    "hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500",
                    isCurrent && "bg-indigo-50 border-2 border-indigo-600",
                    !isCurrent && !isLocked && "border border-gray-200",
                    isLocked && "opacity-50 cursor-not-allowed bg-gray-50",
                    isCollapsed && "hidden"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={cn(
                      "flex-shrink-0 mt-0.5",
                      isCurrent && "text-indigo-600"
                    )}>
                      {getLessonIcon(lesson.type, lesson.isCompleted, isLocked)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-500">
                          {index + 1}
                        </span>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-[10px] px-1.5 py-0 h-4 capitalize",
                            lesson.isCompleted && "bg-green-50 text-green-700 border-green-200",
                            isCurrent && !lesson.isCompleted && "bg-indigo-50 text-indigo-700 border-indigo-200"
                          )}
                        >
                          {lesson.type}
                        </Badge>
                      </div>
                      
                      <h4 className={cn(
                        "text-sm font-medium line-clamp-2 mb-1",
                        isCurrent ? "text-indigo-900" : "text-gray-900",
                        isLocked && "text-gray-500"
                      )}>
                        {lesson.title}
                      </h4>
                      
                      {lesson.duration && (
                        <p className="text-xs text-gray-500">
                          {lesson.duration} min
                        </p>
                      )}
                    </div>

                    {/* Status indicator */}
                    {lesson.isCompleted && (
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    )}
                    {isCurrent && !lesson.isCompleted && (
                      <div className="h-2 w-2 rounded-full bg-indigo-600 flex-shrink-0 mt-2 animate-pulse" />
                    )}
                  </div>
                </button>
              )
            })}
        </div>
      </CardContent>
    </>
  )

  return (
    <>
      {/* Mobile Menu Button - Fixed at top */}
      <Button
        variant="outline"
        size="sm"
        className="lg:hidden fixed top-20 left-4 z-40 bg-white shadow-lg"
        onClick={() => setIsMobileOpen(true)}
      >
        <Menu className="h-4 w-4 mr-2" />
        Lessons
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <Card 
        className={cn(
          "hidden lg:block h-full sticky top-4 transition-all duration-300",
          isCollapsed ? "w-16" : "w-80",
          className
        )}
      >
        <SidebarContent />
      </Card>

      {/* Mobile Drawer */}
      <Card
        className={cn(
          "lg:hidden fixed top-0 left-0 bottom-0 z-50 w-80 transition-transform duration-300",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </Card>
    </>
  )
}
