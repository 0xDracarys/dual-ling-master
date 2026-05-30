import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/firebase/admin'
import { EnrollmentService } from '@/lib/services/enrollment/enrollment.service'
import { traceLogger } from '@/lib/tracing/trace-logger'

/**
 * GET /api/teacher/students
 * 
 * Fetch all students enrolled in any of the teacher's courses
 * with aggregated enrollment and progress data.
 * 
 * Query Parameters:
 * - courseId (optional): Filter by specific course
 * - status (optional): Filter by enrollment status (active|completed|dropped)
 * - search (optional): Search by student name or email
 * 
 * @returns Array of students with their course enrollments
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const traceId = `teacher-students-${Date.now()}`
  const spanId = traceLogger.startSpan('API', 'GET /api/teacher/students', { traceId })

  try {
    traceLogger.log('info', 'API', 'Fetching teacher students list')

    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      traceLogger.log('warn', 'API', 'Missing or invalid authorization header')
      traceLogger.endSpan(spanId, 'error', { message: 'Unauthorized' })
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decodedToken = await verifyIdToken(token)

    // Verify teacher role
    if (decodedToken.role !== 'teacher') {
      traceLogger.log('warn', 'API', 'Non-teacher attempted to access teacher students', {
        userId: decodedToken.uid,
        role: decodedToken.role,
      })
      traceLogger.endSpan(spanId, 'error', { message: 'Forbidden' })
      return NextResponse.json(
        { success: false, error: 'Forbidden - Teacher role required' },
        { status: 403 }
      )
    }

    const teacherId = decodedToken.uid

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const courseId = searchParams.get('courseId') || undefined
    const status = searchParams.get('status') as 'active' | 'completed' | 'dropped' | undefined
    const searchQuery = searchParams.get('search') || undefined

    traceLogger.log('info', 'API', 'Fetching students with filters', {
      teacherId,
      courseId,
      status,
      searchQuery,
    })

    // Instantiate service and fetch students
    const enrollmentService = new EnrollmentService()
    const studentsData = await enrollmentService.getTeacherStudents(
      teacherId,
      { courseId, status, searchQuery }
    )

    const duration = Date.now() - startTime
    traceLogger.log('success', 'API', 'Successfully fetched teacher students', {
      totalStudents: studentsData.students.length,
      totalEnrollments: studentsData.totalEnrollments,
      duration,
    })
    traceLogger.endSpan(spanId, 'success')

    return NextResponse.json({
      success: true,
      data: studentsData,
    })
  } catch (error: any) {
    const duration = Date.now() - startTime
    traceLogger.log('error', 'API', 'Error fetching teacher students', {
      error: error.message,
      stack: error.stack,
      duration,
    })
    traceLogger.endSpan(spanId, 'error', { message: error.message })

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch students',
      },
      { status: 500 }
    )
  }
}
