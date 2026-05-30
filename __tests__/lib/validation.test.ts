import { describe, it, expect } from '@jest/globals'
import { z } from 'zod'

// Test validation schemas
const userSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['student', 'teacher', 'admin']),
  firstName: z.string().optional(),
  lastName: z.string().optional()
})

const courseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  category: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  estimatedDuration: z.number().min(0)
})

describe('Validation Schemas', () => {
  describe('User Schema', () => {
    it('should validate correct user data', () => {
      const validUser = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'student',
        firstName: 'John',
        lastName: 'Doe'
      }

      const result = userSchema.safeParse(validUser)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const invalidUser = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'password123',
        role: 'student'
      }

      const result = userSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['email'])
      }
    })

    it('should reject short password', () => {
      const invalidUser = {
        username: 'testuser',
        email: 'test@example.com',
        password: '123',
        role: 'student'
      }

      const result = userSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['password'])
      }
    })

    it('should reject invalid role', () => {
      const invalidUser = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'invalid-role'
      }

      const result = userSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['role'])
      }
    })
  })

  describe('Course Schema', () => {
    it('should validate correct course data', () => {
      const validCourse = {
        title: 'Spanish for Beginners',
        description: 'Learn basic Spanish',
        category: 'spanish',
        difficulty: 'beginner',
        estimatedDuration: 10
      }

      const result = courseSchema.safeParse(validCourse)
      expect(result.success).toBe(true)
    })

    it('should reject empty title', () => {
      const invalidCourse = {
        title: '',
        description: 'Learn basic Spanish',
        difficulty: 'beginner',
        estimatedDuration: 10
      }

      const result = courseSchema.safeParse(invalidCourse)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['title'])
      }
    })

    it('should reject negative duration', () => {
      const invalidCourse = {
        title: 'Spanish for Beginners',
        description: 'Learn basic Spanish',
        difficulty: 'beginner',
        estimatedDuration: -5
      }

      const result = courseSchema.safeParse(invalidCourse)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['estimatedDuration'])
      }
    })
  })
})
