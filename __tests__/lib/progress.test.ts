import { describe, it, expect } from '@jest/globals'

// Mock progress calculation functions
interface Lesson {
  _id: string
  type: 'text' | 'quiz' | 'video'
  points?: number
}

interface CourseProgress {
  courseId: string
  completedLessons: string[]
  quizScores: Record<string, number>
  totalLessons: number
  totalPoints: number
  earnedPoints: number
}

const calculateProgress = (progress: CourseProgress): number => {
  if (progress.totalLessons === 0) return 0
  
  const lessonProgress = (progress.completedLessons.length / progress.totalLessons) * 100
  return Math.round(lessonProgress * 100) / 100
}

const calculateQuizScore = (quizScores: Record<string, number>): number => {
  const scores = Object.values(quizScores)
  if (scores.length === 0) return 0
  
  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length
  return Math.round(average * 100) / 100
}

const calculateOverallProgress = (progress: CourseProgress): number => {
  const lessonProgress = calculateProgress(progress)
  const quizScore = calculateQuizScore(progress.quizScores)
  
  // Weight: 70% lesson completion, 30% quiz performance
  const overall = (lessonProgress * 0.7) + (quizScore * 0.3)
  return Math.round(overall * 100) / 100
}

describe('Progress Calculation', () => {
  describe('Lesson Progress', () => {
    it('should calculate 0% for no completed lessons', () => {
      const progress: CourseProgress = {
        courseId: 'course1',
        completedLessons: [],
        quizScores: {},
        totalLessons: 10,
        totalPoints: 100,
        earnedPoints: 0
      }
      
      expect(calculateProgress(progress)).toBe(0)
    })

    it('should calculate 50% for half completed lessons', () => {
      const progress: CourseProgress = {
        courseId: 'course1',
        completedLessons: ['lesson1', 'lesson2', 'lesson3', 'lesson4', 'lesson5'],
        quizScores: {},
        totalLessons: 10,
        totalPoints: 100,
        earnedPoints: 0
      }
      
      expect(calculateProgress(progress)).toBe(50)
    })

    it('should calculate 100% for all completed lessons', () => {
      const progress: CourseProgress = {
        courseId: 'course1',
        completedLessons: ['lesson1', 'lesson2', 'lesson3', 'lesson4', 'lesson5'],
        quizScores: {},
        totalLessons: 5,
        totalPoints: 100,
        earnedPoints: 0
      }
      
      expect(calculateProgress(progress)).toBe(100)
    })
  })

  describe('Quiz Score Calculation', () => {
    it('should calculate 0% for no quiz scores', () => {
      const quizScores = {}
      expect(calculateQuizScore(quizScores)).toBe(0)
    })

    it('should calculate average quiz score', () => {
      const quizScores = {
        'quiz1': 80,
        'quiz2': 90,
        'quiz3': 70
      }
      
      expect(calculateQuizScore(quizScores)).toBe(80)
    })

    it('should handle single quiz score', () => {
      const quizScores = {
        'quiz1': 85
      }
      
      expect(calculateQuizScore(quizScores)).toBe(85)
    })
  })

  describe('Overall Progress Calculation', () => {
    it('should calculate overall progress with lesson and quiz weights', () => {
      const progress: CourseProgress = {
        courseId: 'course1',
        completedLessons: ['lesson1', 'lesson2', 'lesson3', 'lesson4'], // 40% lesson progress
        quizScores: {
          'quiz1': 80,
          'quiz2': 90
        }, // 85% quiz average
        totalLessons: 10,
        totalPoints: 100,
        earnedPoints: 0
      }
      
      // Expected: (40 * 0.7) + (85 * 0.3) = 28 + 25.5 = 53.5
      expect(calculateOverallProgress(progress)).toBe(53.5)
    })

    it('should handle no quiz scores', () => {
      const progress: CourseProgress = {
        courseId: 'course1',
        completedLessons: ['lesson1', 'lesson2', 'lesson3', 'lesson4', 'lesson5'], // 50% lesson progress
        quizScores: {}, // 0% quiz score
        totalLessons: 10,
        totalPoints: 100,
        earnedPoints: 0
      }
      
      // Expected: (50 * 0.7) + (0 * 0.3) = 35 + 0 = 35
      expect(calculateOverallProgress(progress)).toBe(35)
    })

    it('should handle perfect scores', () => {
      const progress: CourseProgress = {
        courseId: 'course1',
        completedLessons: ['lesson1', 'lesson2', 'lesson3', 'lesson4', 'lesson5'], // 100% lesson progress
        quizScores: {
          'quiz1': 100,
          'quiz2': 100
        }, // 100% quiz average
        totalLessons: 5,
        totalPoints: 100,
        earnedPoints: 0
      }
      
      // Expected: (100 * 0.7) + (100 * 0.3) = 70 + 30 = 100
      expect(calculateOverallProgress(progress)).toBe(100)
    })
  })
})
