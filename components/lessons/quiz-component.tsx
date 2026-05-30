"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { CheckCircle, XCircle, Clock, Trophy, RotateCcw } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
  points: number
}

interface QuizProps {
  courseId: string
  lessonId: string
  questions: QuizQuestion[]
  onComplete?: (score: number, timeSpent: number) => void
}

interface QuizResult {
  score: number
  scorePercentage: number
  correctAnswers?: number
  totalQuestions: number
  timeSpent: number
  passed: boolean
  bestScore?: number
  results: Array<{
    questionIndex?: number
    question?: string
    userAnswer: number
    correctAnswer: number
    isCorrect?: boolean
    correct?: boolean
    explanation?: string
    points: number
  }>
}

export function QuizComponent({ courseId, lessonId, questions, onComplete }: QuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<number[]>(new Array(questions.length).fill(-1))
  const [timeSpent, setTimeSpent] = useState(0)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [result, setResult] = useState<QuizResult | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { token } = useAuth()

  const handleRetakeQuiz = () => {
    setCurrentQuestion(0)
    setAnswers(new Array(questions.length).fill(-1))
    setTimeSpent(0)
    setIsSubmitted(false)
    setResult(null)
    setIsSubmitting(false)
  }

  // Timer effect
  useEffect(() => {
    if (!isSubmitted) {
      const timer = setInterval(() => {
        setTimeSpent(prev => prev + 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [isSubmitted])

  const handleAnswerChange = (questionIndex: number, answer: number) => {
    const newAnswers = [...answers]
    newAnswers[questionIndex] = answer
    setAnswers(newAnswers)
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      console.log('Quiz questions:', questions)
      console.log('Answers (indices):', answers)

      // Convert answers array to API format
      const formattedAnswers = answers.map((answerIndex, questionIndex) => {
        const question = questions[questionIndex]
        const answerText = question.options[answerIndex]
        console.log(`Question ${questionIndex}: ID=${question.id}, answerIndex=${answerIndex}, answerText=${answerText}`)
        return {
          questionId: question.id,
          answer: answerText,
        }
      })

      // Build correct answers array
      const correctAnswers = questions.map(q => {
        const correctAnswerText = q.options[q.correctAnswer]
        console.log(`Correct for ${q.id}: index=${q.correctAnswer}, text=${correctAnswerText}`)
        return {
          questionId: q.id,
          answer: correctAnswerText,
          explanation: q.explanation,
        }
      })

      const payload = {
        courseId,
        lessonId,
        answers: formattedAnswers,
        correctAnswers,
        timeSpent,
      }

      console.log('Submitting quiz with payload:', JSON.stringify(payload, null, 2))

      const response = await fetch(`/api/quiz/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Quiz submission successful:', data)
        setResult(data.data)
        setIsSubmitted(true)
        onComplete?.(data.data.score, timeSpent)
      } else {
        const errorData = await response.json()
        console.error("Failed to submit quiz", errorData)
      }
    } catch (error) {
      console.error("Error submitting quiz:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getProgressPercentage = () => {
    return ((currentQuestion + 1) / questions.length) * 100
  }

  const getAnsweredCount = () => {
    return answers.filter(answer => answer !== -1).length
  }

  if (isSubmitted && result) {
    const showBestScore = result.bestScore !== undefined && result.bestScore > result.scorePercentage

    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {result.passed ? (
              <CheckCircle className="h-16 w-16 text-green-600" />
            ) : (
              <XCircle className="h-16 w-16 text-red-600" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {result.passed ? "Congratulations!" : "Keep Learning!"}
          </CardTitle>
          <CardDescription>
            You scored {Math.round(result.scorePercentage)}% ({result.score}/{result.totalQuestions} correct)
            {showBestScore && result.bestScore && (
              <span className="block text-xs text-gray-500 mt-1">
                Your best score: {Math.round(result.bestScore)}%
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Trophy className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{Math.round(result.scorePercentage)}%</p>
              <p className="text-sm text-gray-600">Final Score</p>
              {showBestScore && result.bestScore && (
                <p className="text-xs text-green-600 mt-1">Best: {Math.round(result.bestScore)}%</p>
              )}
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{result.score}/{result.totalQuestions}</p>
              <p className="text-sm text-gray-600">Correct Answers</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{formatTime(result.timeSpent)}</p>
              <p className="text-sm text-gray-600">Time Spent</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Question Review</h3>
            {result.results.map((questionResult, index) => {
              const isCorrect = questionResult.correct ?? questionResult.isCorrect ?? false
              const question = questions.find(q => q.id === (questionResult as any).questionId)
              const questionText = questionResult.question || question?.question || `Question ${index + 1}`
              const points = question?.points || 1
              
              return (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">{questionText}</h4>
                    <div className="flex items-center gap-2">
                      {isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <Badge variant={isCorrect ? "default" : "destructive"}>
                        {points} pts
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      Your answer: {typeof questionResult.userAnswer === 'string' ? questionResult.userAnswer : 
                        (questionResult.userAnswer !== -1 && question ? question.options[questionResult.userAnswer] : "Not answered")}
                    </p>
                    <p className="text-sm text-gray-600">
                      Correct answer: {typeof questionResult.correctAnswer === 'string' ? questionResult.correctAnswer : 
                        (question ? question.options[questionResult.correctAnswer] : "N/A")}
                    </p>
                    {questionResult.explanation && (
                      <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                        <strong>Explanation:</strong> {questionResult.explanation}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Retake Quiz Button */}
          <div className="flex justify-center pt-4">
            <Button
              onClick={handleRetakeQuiz}
              variant="outline"
              className="w-full md:w-auto"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Retake Quiz
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardTitle>Quiz: Question {currentQuestion + 1} of {questions.length}</CardTitle>
            <CardDescription>
              {getAnsweredCount()} of {questions.length} questions answered
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-500">{formatTime(timeSpent)}</span>
          </div>
        </div>
        <Progress value={getProgressPercentage()} className="h-2" />
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">{questions[currentQuestion].question}</h3>
          <p className="text-sm text-gray-600">
            Points: {questions[currentQuestion].points} | 
            Select the best answer below
          </p>
          
          <RadioGroup
            value={answers[currentQuestion]?.toString() || ""}
            onValueChange={(value) => handleAnswerChange(currentQuestion, parseInt(value))}
            className="space-y-3"
          >
            {questions[currentQuestion].options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>
          
          <div className="flex gap-2">
            {currentQuestion === questions.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || getAnsweredCount() !== questions.length}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? "Submitting..." : "Submit Quiz"}
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Next
              </Button>
            )}
          </div>
        </div>

        <div className="text-center text-sm text-gray-500">
          Make sure to answer all questions before submitting
        </div>
      </CardContent>
    </Card>
  )
}
