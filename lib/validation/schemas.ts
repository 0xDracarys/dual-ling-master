import { z } from "zod"

// Common validation patterns
const emailSchema = z.string().email("Invalid email format")
const passwordSchema = z.string().min(8, "Password must be at least 8 characters")
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format")

// User schemas
export const createUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50, "Username too long"),
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(["student", "teacher", "admin"]).default("student"),
})

export const updateUserSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  email: emailSchema.optional(),
  role: z.enum(["student", "teacher", "admin"]).optional(),
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
})

// Course schemas
export const createCourseSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().min(1, "Description is required").max(1000, "Description too long"),
  isPublished: z.boolean().default(false),
})

export const updateCourseSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(1000).optional(),
  isPublished: z.boolean().optional(),
})

// Lesson schemas
export const quizQuestionSchema = z.object({
  question: z.string().min(1, "Question is required"),
  options: z.array(z.string().min(1, "Option cannot be empty")).min(2, "At least 2 options required"),
  correctAnswer: z.number().min(0, "Invalid correct answer index"),
  explanation: z.string().optional(),
})

export const createLessonSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  type: z.enum(["text", "quiz", "video"]),
  content: z.object({
    text: z.string().optional(),
    questions: z.array(quizQuestionSchema).optional(),
    videoUrl: z.string().url("Invalid video URL").optional(),
  }),
  order: z.number().min(0, "Order must be non-negative"),
})

export const updateLessonSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  type: z.enum(["text", "quiz", "video"]).optional(),
  content: z.object({
    text: z.string().optional(),
    questions: z.array(quizQuestionSchema).optional(),
    videoUrl: z.string().url().optional(),
  }).optional(),
  order: z.number().min(0).optional(),
})

// Progress schemas
export const createProgressSchema = z.object({
  courseId: objectIdSchema,
  lessonId: objectIdSchema,
  completed: z.boolean().default(false),
  quizScore: z.number().min(0).max(100).optional(),
  timeSpent: z.number().min(0).optional(),
})

export const updateProgressSchema = z.object({
  completed: z.boolean().optional(),
  quizScore: z.number().min(0).max(100).optional(),
  timeSpent: z.number().min(0).optional(),
})

// Quiz submission schema
export const quizSubmissionSchema = z.object({
  courseId: objectIdSchema,
  lessonId: objectIdSchema,
  answers: z.array(z.number().min(0)),
  timeSpent: z.number().min(0).optional(),
})

// Query parameter schemas
export const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default("1"),
  limit: z.string().regex(/^\d+$/).transform(Number).default("10"),
})

export const courseQuerySchema = z.object({
  search: z.string().optional(),
  teacherId: objectIdSchema.optional(),
  isPublished: z.string().transform(val => val === "true").optional(),
  ...paginationSchema.shape,
})

export const progressQuerySchema = z.object({
  courseId: objectIdSchema.optional(),
  userId: objectIdSchema.optional(),
  ...paginationSchema.shape,
})

// Role-based access schemas
export const adminOnlySchema = z.object({
  role: z.literal("admin"),
})

export const teacherOrAdminSchema = z.object({
  role: z.enum(["teacher", "admin"]),
})

export const studentOrAdminSchema = z.object({
  role: z.enum(["student", "admin"]),
})

// Response schemas for API documentation
export const userResponseSchema = z.object({
  _id: z.string(),
  username: z.string(),
  email: z.string(),
  role: z.enum(["student", "teacher", "admin"]),
  coursesEnrolled: z.array(z.string()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const courseResponseSchema = z.object({
  _id: z.string(),
  title: z.string(),
  description: z.string(),
  teacherId: z.string(),
  teacherName: z.string().optional(),
  lessons: z.array(z.object({
    _id: z.string(),
    title: z.string(),
    type: z.enum(["text", "quiz", "video"]),
    order: z.number(),
  })),
  enrolledStudents: z.array(z.string()),
  isPublished: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const progressResponseSchema = z.object({
  _id: z.string(),
  userId: z.string(),
  courseId: z.string(),
  lessonId: z.string(),
  completed: z.boolean(),
  completedAt: z.string().datetime().optional(),
  quizScore: z.number().optional(),
  timeSpent: z.number().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

// Error response schema
export const errorResponseSchema = z.object({
  error: z.object({
    message: z.string(),
    code: z.string(),
    details: z.any().optional(),
  }),
})
