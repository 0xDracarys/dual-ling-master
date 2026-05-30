"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/hooks/use-auth"
import { ArrowLeft, Plus, X, BookOpen, Play, CheckCircle, AlertCircle } from "lucide-react"

interface Lesson {
  title: string
  type: "text" | "quiz" | "video"
  content: {
    text?: string
    videoUrl?: string
    questions?: Array<{
      id: string
      question: string
      options: string[]
      correctAnswer: number
      explanation?: string
      points: number
    }>
  }
  order: number
}

export default function CreateCourse() {
  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    shortDescription: "",
    learningLanguage: "", // User is learning this language
    nativeLanguage: "", // User already knows this language
    tags: [] as string[],
    difficulty: "beginner" as "beginner" | "intermediate" | "advanced",
    estimatedDuration: 0,
    thumbnail: ""
  })
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [newTag, setNewTag] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [backendError, setBackendError] = useState("")
  const { token } = useAuth()
  const router = useRouter()

  const addLesson = () => {
    const newLesson: Lesson = {
      title: "",
      type: "text",
      content: {},
      order: lessons.length
    }
    setLessons([...lessons, newLesson])
  }

  const updateLesson = (index: number, field: keyof Lesson, value: any) => {
    const updatedLessons = [...lessons]
    updatedLessons[index] = { ...updatedLessons[index], [field]: value }
    setLessons(updatedLessons)
  }

  const updateLessonContent = (index: number, field: string, value: any) => {
    const updatedLessons = [...lessons]
    updatedLessons[index].content = { ...updatedLessons[index].content, [field]: value }
    setLessons(updatedLessons)
  }

  const addQuestion = (lessonIndex: number) => {
    const updatedLessons = [...lessons]
    if (!updatedLessons[lessonIndex].content.questions) {
      updatedLessons[lessonIndex].content.questions = []
    }
    updatedLessons[lessonIndex].content.questions!.push({
      id: crypto.randomUUID(),
      question: "",
      options: ["", ""],
      correctAnswer: 0,
      explanation: "",
      points: 1
    })
    setLessons(updatedLessons)
  }

  const updateQuestion = (lessonIndex: number, questionIndex: number, field: string, value: any) => {
    const updatedLessons = [...lessons]
    const questions = updatedLessons[lessonIndex].content.questions || []
    questions[questionIndex] = { ...questions[questionIndex], [field]: value }
    updatedLessons[lessonIndex].content.questions = questions
    setLessons(updatedLessons)
  }

  const addTag = () => {
    if (newTag.trim() && !courseData.tags.includes(newTag.trim())) {
      setCourseData({ ...courseData, tags: [...courseData.tags, newTag.trim()] })
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setCourseData({ ...courseData, tags: courseData.tags.filter(tag => tag !== tagToRemove) })
  }

  const removeLesson = (index: number) => {
    setLessons(lessons.filter((_, i) => i !== index))
  }

  // Frontend validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!courseData.title || courseData.title.length < 3) {
      errors.title = "Title must be at least 3 characters"
    }

    if (!courseData.description || courseData.description.length < 10) {
      errors.description = "Description must be at least 10 characters"
    }

    if (!courseData.learningLanguage) {
      errors.learningLanguage = "Please select the language students will learn"
    }

    if (!courseData.nativeLanguage) {
      errors.nativeLanguage = "Please select the language students already know"
    }

    if (courseData.learningLanguage && courseData.nativeLanguage &&
        courseData.learningLanguage === courseData.nativeLanguage) {
      errors.sameLanguage = "Learning language and native language cannot be the same"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBackendError("")

    // Validate form
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/teacher/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Teacher-Id": "TEMP_TEACHER_ID", // TODO: Get from auth context
          "X-Teacher-Name": "Teacher User", // TODO: Get from auth context
        },
        body: JSON.stringify({
          title: courseData.title,
          description: courseData.description,
          shortDescription: courseData.shortDescription,
          language: courseData.nativeLanguage, // The language the course is taught IN
          targetLanguage: courseData.learningLanguage, // The language students will LEARN
          difficulty: courseData.difficulty,
          estimatedDuration: courseData.estimatedDuration,
          thumbnail: courseData.thumbnail,
          tags: courseData.tags,
          lessons: lessons.map((lesson, index) => ({ ...lesson, order: index }))
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        router.push(`/teacher/dashboard`)
      } else {
        const errorMessage = data.error || "Unknown error"
        setBackendError(errorMessage)
        console.error("Failed to create course:", errorMessage)

        // If backend returns validation errors, show them
        if (data.details && Array.isArray(data.details)) {
          const newErrors: Record<string, string> = {}
          data.details.forEach((err: any) => {
            if (err.path && err.path.length > 0) {
              newErrors[err.path[0]] = err.message
            }
          })
          setValidationErrors(newErrors)
        }
      }
    } catch (error) {
      console.error("Error creating course:", error)
      setBackendError("Network error. Please check your connection and try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getLessonIcon = (type: string) => {
    switch (type) {
      case "text":
        return <BookOpen className="h-4 w-4 text-blue-600" />
      case "video":
        return <Play className="h-4 w-4 text-red-600" />
      case "quiz":
        return <CheckCircle className="h-4 w-4 text-purple-600" />
      default:
        return <BookOpen className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <ProtectedRoute allowedRoles={["teacher"]}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.back()} 
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Course</h1>
          <p className="text-gray-600">Build an engaging language learning course for your students</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Backend Error Display */}
          {backendError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900">Error Creating Course</h3>
                <p className="text-red-700 text-sm mt-1">{backendError}</p>
              </div>
            </div>
          )}

          {/* Same Language Error */}
          {validationErrors.sameLanguage && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-900">Language Configuration Error</h3>
                <p className="text-amber-700 text-sm mt-1">{validationErrors.sameLanguage}</p>
              </div>
            </div>
          )}

          {/* Course Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Course Information</CardTitle>
              <CardDescription>Basic details about your course</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Course Title *</Label>
                  <Input
                    id="title"
                    value={courseData.title}
                    onChange={(e) => {
                      setCourseData({ ...courseData, title: e.target.value })
                      if (validationErrors.title) {
                        const newErrors = { ...validationErrors }
                        delete newErrors.title
                        setValidationErrors(newErrors)
                      }
                    }}
                    placeholder="e.g., Lithuanian for English Speakers"
                    className={validationErrors.title ? "border-red-500" : ""}
                    required
                  />
                  {validationErrors.title && (
                    <p className="text-red-600 text-sm flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {validationErrors.title}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select value={courseData.difficulty} onValueChange={(value: any) => setCourseData({ ...courseData, difficulty: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Language Selection */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="learningLanguage">Students Will Learn *</Label>
                  <Select
                    value={courseData.learningLanguage}
                    onValueChange={(value) => {
                      setCourseData({ ...courseData, learningLanguage: value })
                      if (validationErrors.learningLanguage) {
                        const newErrors = { ...validationErrors }
                        delete newErrors.learningLanguage
                        setValidationErrors(newErrors)
                      }
                    }}
                  >
                    <SelectTrigger className={validationErrors.learningLanguage ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select target language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">🇺🇸 English</SelectItem>
                      <SelectItem value="lt">🇱🇹 Lithuanian</SelectItem>
                    </SelectContent>
                  </Select>
                  {validationErrors.learningLanguage && (
                    <p className="text-red-600 text-sm flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {validationErrors.learningLanguage}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">The language your students want to learn</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nativeLanguage">Students Already Know *</Label>
                  <Select
                    value={courseData.nativeLanguage}
                    onValueChange={(value) => {
                      setCourseData({ ...courseData, nativeLanguage: value })
                      if (validationErrors.nativeLanguage) {
                        const newErrors = { ...validationErrors }
                        delete newErrors.nativeLanguage
                        setValidationErrors(newErrors)
                      }
                    }}
                  >
                    <SelectTrigger className={validationErrors.nativeLanguage ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select native language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">🇺🇸 English</SelectItem>
                      <SelectItem value="lt">🇱🇹 Lithuanian</SelectItem>
                    </SelectContent>
                  </Select>
                  {validationErrors.nativeLanguage && (
                    <p className="text-red-600 text-sm flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {validationErrors.nativeLanguage}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">The language your course will be taught in</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">Course Description *</Label>
                  <span className={`text-xs ${courseData.description.length < 10 ? "text-red-600 font-medium" : "text-gray-500"}`}>
                    {courseData.description.length} / 10 characters minimum
                  </span>
                </div>
                <Textarea
                  id="description"
                  value={courseData.description}
                  onChange={(e) => {
                    setCourseData({ ...courseData, description: e.target.value })
                    if (validationErrors.description && e.target.value.length >= 10) {
                      const newErrors = { ...validationErrors }
                      delete newErrors.description
                      setValidationErrors(newErrors)
                    }
                  }}
                  placeholder="Describe what students will learn in this course... (minimum 10 characters)"
                  rows={4}
                  className={validationErrors.description ? "border-red-500" : ""}
                  required
                />
                {validationErrors.description && (
                  <p className="text-red-600 text-sm flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {validationErrors.description}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortDescription">Short Description</Label>
                <Input
                  id="shortDescription"
                  value={courseData.shortDescription}
                  onChange={(e) => setCourseData({ ...courseData, shortDescription: e.target.value })}
                  placeholder="Brief one-line description for course cards"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="duration">Estimated Duration (hours)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={courseData.estimatedDuration}
                    onChange={(e) => setCourseData({ ...courseData, estimatedDuration: parseInt(e.target.value) || 0 })}
                    placeholder="10"
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="thumbnail">Thumbnail URL (optional)</Label>
                  <Input
                    id="thumbnail"
                    value={courseData.thumbnail}
                    onChange={(e) => setCourseData({ ...courseData, thumbnail: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag} variant="outline">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {courseData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lessons */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Course Lessons</CardTitle>
                  <CardDescription>Add lessons to your course</CardDescription>
                </div>
                <Button type="button" onClick={addLesson}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lesson
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {lessons.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No lessons added yet. Click "Add Lesson" to get started.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {lessons.map((lesson, index) => (
                    <Card key={index} className="border-2">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getLessonIcon(lesson.type)}
                            <h3 className="font-semibold">Lesson {index + 1}</h3>
                          </div>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => removeLesson(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Lesson Title</Label>
                            <Input
                              value={lesson.title}
                              onChange={(e) => updateLesson(index, "title", e.target.value)}
                              placeholder="Enter lesson title"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Lesson Type</Label>
                            <Select value={lesson.type} onValueChange={(value: any) => updateLesson(index, "type", value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">Text Lesson</SelectItem>
                                <SelectItem value="video">Video Lesson</SelectItem>
                                <SelectItem value="quiz">Quiz Lesson</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {lesson.type === "text" && (
                          <div className="space-y-2">
                            <Label>Content</Label>
                            <Textarea
                              value={lesson.content.text || ""}
                              onChange={(e) => updateLessonContent(index, "text", e.target.value)}
                              placeholder="Enter lesson content..."
                              rows={6}
                            />
                          </div>
                        )}

                        {lesson.type === "video" && (
                          <div className="space-y-2">
                            <Label>Video URL</Label>
                            <Input
                              value={lesson.content.videoUrl || ""}
                              onChange={(e) => updateLessonContent(index, "videoUrl", e.target.value)}
                              placeholder="https://youtube.com/watch?v=..."
                            />
                          </div>
                        )}

                        {lesson.type === "quiz" && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Label>Quiz Questions</Label>
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm"
                                onClick={() => addQuestion(index)}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Question
                              </Button>
                            </div>
                            
                            {lesson.content.questions?.map((question, qIndex) => (
                              <Card key={qIndex} className="p-4">
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <Label>Question {qIndex + 1}</Label>
                                    <Input
                                      value={question.question}
                                      onChange={(e) => updateQuestion(index, qIndex, "question", e.target.value)}
                                      placeholder="Enter your question..."
                                    />
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label>Options</Label>
                                    {question.options.map((option, oIndex) => (
                                      <div key={oIndex} className="flex gap-2">
                                        <Input
                                          value={option}
                                          onChange={(e) => {
                                            const newOptions = [...question.options]
                                            newOptions[oIndex] = e.target.value
                                            updateQuestion(index, qIndex, "options", newOptions)
                                          }}
                                          placeholder={`Option ${oIndex + 1}`}
                                        />
                                        {question.options.length > 2 && (
                                          <Button 
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              const newOptions = question.options.filter((_, i) => i !== oIndex)
                                              updateQuestion(index, qIndex, "options", newOptions)
                                            }}
                                          >
                                            <X className="h-4 w-4" />
                                          </Button>
                                        )}
                                      </div>
                                    ))}
                                    {question.options.length < 4 && (
                                      <Button 
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          const newOptions = [...question.options, ""]
                                          updateQuestion(index, qIndex, "options", newOptions)
                                        }}
                                      >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Option
                                      </Button>
                                    )}
                                  </div>

                                  <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label>Correct Answer</Label>
                                      <Select 
                                        value={question.correctAnswer.toString()} 
                                        onValueChange={(value) => updateQuestion(index, qIndex, "correctAnswer", parseInt(value))}
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {question.options.map((_, oIndex) => (
                                            <SelectItem key={oIndex} value={oIndex.toString()}>
                                              Option {oIndex + 1}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Points</Label>
                                      <Input
                                        type="number"
                                        value={question.points}
                                        onChange={(e) => updateQuestion(index, qIndex, "points", parseInt(e.target.value) || 1)}
                                        min="1"
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Explanation (Optional)</Label>
                                    <Input
                                      value={question.explanation || ""}
                                      onChange={(e) => updateQuestion(index, qIndex, "explanation", e.target.value)}
                                      placeholder="Explain why this is the correct answer..."
                                    />
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !courseData.title ||
                !courseData.description ||
                courseData.description.length < 10 ||
                !courseData.learningLanguage ||
                !courseData.nativeLanguage
              }
            >
              {isSubmitting ? "Creating..." : "Create Course"}
            </Button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  )
}