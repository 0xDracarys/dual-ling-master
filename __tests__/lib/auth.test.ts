import { describe, it, expect, beforeEach } from '@jest/globals'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// Mock the auth functions
const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 10)
}

const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword)
}

const generateToken = (user: any): string => {
  return jwt.sign(
    { 
      id: user._id, 
      email: user.email, 
      role: user.role 
    },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  )
}

const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'test-secret')
  } catch (error) {
    return null
  }
}

describe('Authentication Functions', () => {
  describe('Password Hashing', () => {
    it('should hash password correctly', async () => {
      const password = 'testpassword123'
      const hashedPassword = await hashPassword(password)
      
      expect(hashedPassword).toBeDefined()
      expect(hashedPassword).not.toBe(password)
      expect(hashedPassword.length).toBeGreaterThan(0)
    })

    it('should verify correct password', async () => {
      const password = 'testpassword123'
      const hashedPassword = await hashPassword(password)
      
      const isValid = await comparePassword(password, hashedPassword)
      expect(isValid).toBe(true)
    })

    it('should reject incorrect password', async () => {
      const password = 'testpassword123'
      const wrongPassword = 'wrongpassword'
      const hashedPassword = await hashPassword(password)
      
      const isValid = await comparePassword(wrongPassword, hashedPassword)
      expect(isValid).toBe(false)
    })
  })

  describe('JWT Token', () => {
    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
      role: 'student'
    }

    it('should generate valid token', () => {
      const token = generateToken(mockUser)
      
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
    })

    it('should verify valid token', () => {
      const token = generateToken(mockUser)
      const decoded = verifyToken(token)
      
      expect(decoded).toBeDefined()
      expect(decoded.id).toBe(mockUser._id)
      expect(decoded.email).toBe(mockUser.email)
      expect(decoded.role).toBe(mockUser.role)
    })

    it('should reject invalid token', () => {
      const invalidToken = 'invalid.token.here'
      const decoded = verifyToken(invalidToken)
      
      expect(decoded).toBeNull()
    })

    it('should reject expired token', () => {
      // Create a token that expires immediately
      const expiredToken = jwt.sign(
        { id: mockUser._id, email: mockUser.email, role: mockUser.role },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1h' } // Expired 1 hour ago
      )
      
      const decoded = verifyToken(expiredToken)
      expect(decoded).toBeNull()
    })
  })
})
