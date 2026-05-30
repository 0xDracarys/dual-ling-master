import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { CourseModel } from '@/lib/models/Course'
import { UserModel } from '@/lib/models/User'

// Mock Next.js request
const createMockRequest = (method: string, body?: any, searchParams?: Record<string, string>) => ({
  method,
  json: async () => body,
  url: `http://localhost:3000/api/courses${searchParams ? '?' + new URLSearchParams(searchParams).toString() : ''}`
})

describe('Courses API', () => {
  let mongoServer: MongoMemoryServer

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create()
    const mongoUri = mongoServer.getUri()
    await mongoose.connect(mongoUri)
  })

  afterAll(async () => {
    await mongoose.disconnect()
    await mongoServer.stop()
  })

  beforeEach(async () => {
    await CourseModel.deleteMany({})
    await UserModel.deleteMany({})
  })

  describe('GET /api/courses', () => {
    it('should return published courses', async () => {
      // Create test courses
      const course1 = new CourseModel({
        title: 'Spanish for Beginners',
        description: 'Learn basic Spanish',
        teacherId: new mongoose.Types.ObjectId(),
        isPublished: true,
        category: 'spanish',
        difficulty: 'beginner',
        estimatedDuration: 10,
        lessons: [],
        enrolledStudents: [],
        tags: ['spanish', 'beginner'],
        rating: 4.5,
        totalRatings: 10
      })

      const course2 = new CourseModel({
        title: 'French Intermediate',
        description: 'Advanced French lessons',
        teacherId: new mongoose.Types.ObjectId(),
        isPublished: false, // This should not be returned
        category: 'french',
        difficulty: 'intermediate',
        estimatedDuration: 15,
        lessons: [],
        enrolledStudents: [],
        tags: ['french', 'intermediate'],
        rating: 4.2,
        totalRatings: 8
      })

      await course1.save()
      await course2.save()

      // Mock the API call
      const mockRequest = createMockRequest('GET')
      
      // Import and test the handler
      const { getCoursesHandler } = await import('@/app/api/courses/route')
      const response = await getCoursesHandler(mockRequest as any)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.data.courses).toHaveLength(1)
      expect(data.data.courses[0].title).toBe('Spanish for Beginners')
      expect(data.data.courses[0].isPublished).toBe(true)
    })

    it('should filter courses by category', async () => {
      // Create test courses
      const spanishCourse = new CourseModel({
        title: 'Spanish for Beginners',
        description: 'Learn basic Spanish',
        teacherId: new mongoose.Types.ObjectId(),
        isPublished: true,
        category: 'spanish',
        difficulty: 'beginner',
        estimatedDuration: 10,
        lessons: [],
        enrolledStudents: [],
        tags: ['spanish'],
        rating: 4.5,
        totalRatings: 10
      })

      const frenchCourse = new CourseModel({
        title: 'French for Beginners',
        description: 'Learn basic French',
        teacherId: new mongoose.Types.ObjectId(),
        isPublished: true,
        category: 'french',
        difficulty: 'beginner',
        estimatedDuration: 10,
        lessons: [],
        enrolledStudents: [],
        tags: ['french'],
        rating: 4.3,
        totalRatings: 12
      })

      await spanishCourse.save()
      await frenchCourse.save()

      // Test filtering by category
      const mockRequest = createMockRequest('GET', undefined, { category: 'spanish' })
      const { getCoursesHandler } = await import('@/app/api/courses/route')
      const response = await getCoursesHandler(mockRequest as any)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.data.courses).toHaveLength(1)
      expect(data.data.courses[0].category).toBe('spanish')
    })

    it('should search courses by title', async () => {
      // Create test courses
      const course1 = new CourseModel({
        title: 'Spanish for Beginners',
        description: 'Learn basic Spanish',
        teacherId: new mongoose.Types.ObjectId(),
        isPublished: true,
        category: 'spanish',
        difficulty: 'beginner',
        estimatedDuration: 10,
        lessons: [],
        enrolledStudents: [],
        tags: ['spanish'],
        rating: 4.5,
        totalRatings: 10
      })

      const course2 = new CourseModel({
        title: 'French Intermediate',
        description: 'Advanced French lessons',
        teacherId: new mongoose.Types.ObjectId(),
        isPublished: true,
        category: 'french',
        difficulty: 'intermediate',
        estimatedDuration: 15,
        lessons: [],
        enrolledStudents: [],
        tags: ['french'],
        rating: 4.2,
        totalRatings: 8
      })

      await course1.save()
      await course2.save()

      // Test search functionality
      const mockRequest = createMockRequest('GET', undefined, { search: 'Spanish' })
      const { getCoursesHandler } = await import('@/app/api/courses/route')
      const response = await getCoursesHandler(mockRequest as any)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.data.courses).toHaveLength(1)
      expect(data.data.courses[0].title).toContain('Spanish')
    })

    it('should handle pagination correctly', async () => {
      // Create multiple test courses
      const courses = []
      for (let i = 0; i < 15; i++) {
        courses.push(new CourseModel({
          title: `Course ${i + 1}`,
          description: `Description for course ${i + 1}`,
          teacherId: new mongoose.Types.ObjectId(),
          isPublished: true,
          category: 'spanish',
          difficulty: 'beginner',
          estimatedDuration: 10,
          lessons: [],
          enrolledStudents: [],
          tags: ['test'],
          rating: 4.0,
          totalRatings: 5
        }))
      }

      await CourseModel.insertMany(courses)

      // Test first page
      const mockRequest = createMockRequest('GET', undefined, { page: '1', limit: '10' })
      const { getCoursesHandler } = await import('@/app/api/courses/route')
      const response = await getCoursesHandler(mockRequest as any)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.data.courses).toHaveLength(10)
      expect(data.data.pagination.page).toBe(1)
      expect(data.data.pagination.total).toBe(15)
      expect(data.data.pagination.pages).toBe(2)
    })
  })
})
