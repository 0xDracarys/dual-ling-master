import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { CourseModel } from '@/lib/models/Course'
import { UserModel } from '@/lib/models/User'
import jwt from 'jsonwebtoken'

// Mock Next.js request
const createMockRequest = (method: string, body?: any, headers?: Record<string, string>) => ({
  method,
  json: async () => body,
  headers: new Headers(headers)
})

describe('Course Enrollment API', () => {
  let mongoServer: MongoMemoryServer
  let testUser: any
  let testCourse: any
  let authToken: string

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

    // Create test user
    testUser = new UserModel({
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedpassword',
      role: 'student',
      coursesEnrolled: [],
      progress: {},
      isActive: true
    })
    await testUser.save()

    // Create test course
    testCourse = new CourseModel({
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
    await testCourse.save()

    // Create auth token
    authToken = jwt.sign(
      { id: testUser._id, email: testUser.email, role: testUser.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    )
  })

  describe('POST /api/courses/[id]/enroll', () => {
    it('should successfully enroll user in course', async () => {
      const mockRequest = createMockRequest('POST', {}, {
        'Authorization': `Bearer ${authToken}`
      })

      // Import and test the handler
      const { enrollHandler } = await import('@/app/api/courses/[id]/enroll/route')
      const response = await enrollHandler(mockRequest as any, { params: { id: testCourse._id.toString() } })
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.data.message).toBe('Successfully enrolled in course')
      expect(data.data.courseId).toBe(testCourse._id.toString())

      // Verify user is enrolled
      const updatedUser = await UserModel.findById(testUser._id)
      expect(updatedUser?.coursesEnrolled).toContain(testCourse._id)

      // Verify course has the user
      const updatedCourse = await CourseModel.findById(testCourse._id)
      expect(updatedCourse?.enrolledStudents).toContain(testUser._id)
    })

    it('should not allow enrollment in unpublished course', async () => {
      // Create unpublished course
      const unpublishedCourse = new CourseModel({
        title: 'Unpublished Course',
        description: 'This course is not published',
        teacherId: new mongoose.Types.ObjectId(),
        isPublished: false,
        category: 'spanish',
        difficulty: 'beginner',
        estimatedDuration: 10,
        lessons: [],
        enrolledStudents: [],
        tags: ['spanish'],
        rating: 0,
        totalRatings: 0
      })
      await unpublishedCourse.save()

      const mockRequest = createMockRequest('POST', {}, {
        'Authorization': `Bearer ${authToken}`
      })

      const { enrollHandler } = await import('@/app/api/courses/[id]/enroll/route')
      
      await expect(
        enrollHandler(mockRequest as any, { params: { id: unpublishedCourse._id.toString() } })
      ).rejects.toThrow('Course is not available for enrollment')
    })

    it('should not allow duplicate enrollment', async () => {
      // First enrollment
      const mockRequest = createMockRequest('POST', {}, {
        'Authorization': `Bearer ${authToken}`
      })

      const { enrollHandler } = await import('@/app/api/courses/[id]/enroll/route')
      
      // First enrollment should succeed
      await enrollHandler(mockRequest as any, { params: { id: testCourse._id.toString() } })

      // Second enrollment should fail
      await expect(
        enrollHandler(mockRequest as any, { params: { id: testCourse._id.toString() } })
      ).rejects.toThrow('User is already enrolled in this course')
    })

    it('should require authentication', async () => {
      const mockRequest = createMockRequest('POST', {}) // No auth header

      const { enrollHandler } = await import('@/app/api/courses/[id]/enroll/route')
      
      await expect(
        enrollHandler(mockRequest as any, { params: { id: testCourse._id.toString() } })
      ).rejects.toThrow('Authentication required')
    })

    it('should return 404 for non-existent course', async () => {
      const nonExistentId = new mongoose.Types.ObjectId()
      const mockRequest = createMockRequest('POST', {}, {
        'Authorization': `Bearer ${authToken}`
      })

      const { enrollHandler } = await import('@/app/api/courses/[id]/enroll/route')
      
      await expect(
        enrollHandler(mockRequest as any, { params: { id: nonExistentId.toString() } })
      ).rejects.toThrow('Course not found')
    })
  })
})
