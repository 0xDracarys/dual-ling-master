"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Trash2 } from "lucide-react"
import { ResourceUpload } from "@/components/teacher/resource-upload"
import { ResourceList } from "@/components/lessons/resource-list"

interface QuizQuestion {
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
}

interface Lesson {
  id: string
  title: string
  type: "video" | "reading" | "quiz" | "exercise"
  order: number
  description?: string
  content?: {
    text?: string
    questions?: QuizQuestion[]
    videoUrl?: string
  }
}

interface LessonModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (lesson: Lesson) => void
  courseId: string
  lesson?: Lesson | null
  token: string | null
}

export function LessonModal({ isOpen, onClose, onSave, courseId, lesson, token }: LessonModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    type: "reading" as "video" | "reading" | "quiz" | "exercise",
    content: {
      text: "",
      questions: [] as QuizQuestion[],
      videoUrl: "",
    },
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Debug log to track modal state
  console.log('🔍 [LessonModal] Rendered:', { 
    isOpen, 
    hasLesson: !!lesson, 
    lessonId: lesson?.id,
    courseId,
    showUploadSection: !!(lesson && lesson.id)
  })

  useEffect(() => {
    if (lesson) {
      // Handle multiple quiz data structures (AI-generated vs manual courses)
      let quizQuestions: QuizQuestion[] = [];
      if (lesson.type === 'quiz') {
        // Check all possible locations for quiz data
        const questionsFromContent = lesson.content?.questions;
        const quizQuestionsFromContent = (lesson as any).content?.quizQuestions;
        const quizQuestionsFromRoot = (lesson as any).quizQuestions;
        
        // Use the first available data source
        quizQuestions = questionsFromContent || quizQuestionsFromContent || quizQuestionsFromRoot || [];
        
        console.log('📝 Loading quiz questions for editing:', {
          source: questionsFromContent ? 'content.questions' : 
                  quizQuestionsFromContent ? 'content.quizQuestions' : 
                  quizQuestionsFromRoot ? 'root.quizQuestions' : 'none',
          count: quizQuestions.length
        });
      }
      
      setFormData({
        title: lesson.title,
        type: lesson.type,
        content: {
          text: lesson.content?.text || "",
          questions: quizQuestions,
          videoUrl: lesson.content?.videoUrl || "",
        },
      })
    } else {
      setFormData({
        title: "",
        type: "reading",
        content: {
          text: "",
          questions: [],
          videoUrl: "",
        },
      })
    }
    setError("")
  }, [lesson, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const url = lesson ? `/api/courses/${courseId}/lessons/${lesson.id}` : `/api/courses/${courseId}/lessons`

      const method = lesson ? "PUT" : "POST"

      // Prepare request body based on lesson type
      const requestBody: any = {
        title: formData.title,
        type: formData.type,
      };

      // Add type-specific content
      if (formData.type === 'reading' && formData.content.text) {
        requestBody.content = { text: formData.content.text };
      } else if (formData.type === 'video' && formData.content.videoUrl) {
        requestBody.content = { videoUrl: formData.content.videoUrl };
      } else if (formData.type === 'quiz' && formData.content.questions.length > 0) {
        // Store quiz questions at root level (standard format)
        requestBody.quizQuestions = formData.content.questions;
        console.log('💾 Saving quiz questions to root level:', formData.content.questions.length);
      } else if (formData.type === 'exercise') {
        requestBody.content = { text: formData.content.text };
      }

      // Only include description and order for updates
      if (lesson) {
        if (lesson.description) requestBody.description = lesson.description;
        if (lesson.order) requestBody.order = lesson.order;
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (!response.ok) {
        // Show detailed validation errors if available
        if (data.details && Array.isArray(data.details)) {
          const errorMessages = data.details.map((err: any) => 
            `${err.path.join('.')}: ${err.message}`
          ).join(', ');
          throw new Error(errorMessages);
        }
        throw new Error(data.error || "Failed to save lesson")
      }

      // Create the lesson object to return
      const savedLesson: Lesson = {
        id: lesson?.id || data.lessonId || data.lesson?.id,
        title: formData.title,
        type: formData.type,
        order: lesson?.order || data.lesson?.order || 1,
        description: lesson?.description || data.lesson?.description,
        content: requestBody.content,
      }

      onSave(savedLesson)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const addQuestion = () => {
    setFormData((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        questions: [
          ...prev.content.questions,
          {
            question: "",
            options: ["", "", "", ""],
            correctAnswer: 0,
            explanation: "",
          },
        ],
      },
    }))
  }

  const updateQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
    setFormData((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        questions: prev.content.questions.map((q, i) => (i === index ? { ...q, [field]: value } : q)),
      },
    }))
  }

  const updateQuestionOption = (questionIndex: number, optionIndex: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        questions: prev.content.questions.map((q, i) =>
          i === questionIndex
            ? {
                ...q,
                options: q.options.map((opt, j) => (j === optionIndex ? value : opt)),
              }
            : q,
        ),
      },
    }))
  }

  const removeQuestion = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        questions: prev.content.questions.filter((_, i) => i !== index),
      },
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lesson ? "Edit Lesson" : "Add New Lesson"}</DialogTitle>
          <DialogDescription>
            {lesson ? "Update your lesson content" : "Create a new lesson for your course"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Lesson Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Enter lesson title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Lesson Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: "video" | "reading" | "quiz" | "exercise") => setFormData((prev) => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reading">Reading Lesson</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="exercise">Exercise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Content based on type */}
          {formData.type === "reading" && (
            <div className="space-y-2">
              <Label htmlFor="text-content">Lesson Content</Label>
              <Textarea
                id="text-content"
                value={formData.content.text}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    content: { ...prev.content, text: e.target.value },
                  }))
                }
                placeholder="Enter your lesson content here..."
                rows={8}
                required
              />
            </div>
          )}

          {formData.type === "video" && (
            <div className="space-y-2">
              <Label htmlFor="video-url">Video URL</Label>
              <Input
                id="video-url"
                value={formData.content.videoUrl}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    content: { ...prev.content, videoUrl: e.target.value },
                  }))
                }
                placeholder="Enter video URL (YouTube, Vimeo, etc.)"
                type="url"
                required
              />
            </div>
          )}

          {formData.type === "quiz" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Quiz Questions</Label>
                <Button type="button" onClick={addQuestion} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>

              {formData.content.questions.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-gray-600 mb-4">No questions added yet</p>
                    <Button type="button" onClick={addQuestion} variant="outline">
                      Add Your First Question
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {formData.content.questions.map((question, questionIndex) => (
                    <Card key={questionIndex}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">Question {questionIndex + 1}</CardTitle>
                          <Button
                            type="button"
                            onClick={() => removeQuestion(questionIndex)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label>Question</Label>
                          <Input
                            value={question.question}
                            onChange={(e) => updateQuestion(questionIndex, "question", e.target.value)}
                            placeholder="Enter your question"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Answer Options</Label>
                          {question.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center gap-2">
                              <Input
                                value={option}
                                onChange={(e) => updateQuestionOption(questionIndex, optionIndex, e.target.value)}
                                placeholder={`Option ${optionIndex + 1}`}
                                required
                              />
                              <Button
                                type="button"
                                variant={question.correctAnswer === optionIndex ? "default" : "outline"}
                                size="sm"
                                onClick={() => updateQuestion(questionIndex, "correctAnswer", optionIndex)}
                              >
                                {question.correctAnswer === optionIndex ? "Correct" : "Mark Correct"}
                              </Button>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-2">
                          <Label>Explanation (Optional)</Label>
                          <Textarea
                            value={question.explanation || ""}
                            onChange={(e) => updateQuestion(questionIndex, "explanation", e.target.value)}
                            placeholder="Explain why this is the correct answer"
                            rows={2}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Resource Upload/Management Section - Only for existing lessons and when modal is open */}
          {isOpen && lesson && lesson.id && (
            <div className="space-y-4 border-t pt-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Lesson Resources</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add PDF files, documents, or other resources for students to download
                </p>
              </div>

              {/* Existing Resources List */}
              <ResourceList
                courseId={courseId}
                lessonId={lesson.id}
                showTitle={false}
                className="mb-4"
              />

              {/* Upload New Resource */}
              <ResourceUpload
                key={`resource-upload-${lesson.id}`}
                courseId={courseId}
                lessonId={lesson.id}
                onUploadComplete={() => {
                  // Optionally refresh the resource list or show success message
                  console.log('Resource uploaded successfully');
                }}
                onError={(error) => {
                  console.error('Upload error:', error);
                }}
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : lesson ? "Update Lesson" : "Create Lesson"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
