/**
 * Enrollment Service
 * Business logic for course enrollments
 * Phase 3: Course & Enrollment Services - Week 2
 */

import { traceLogger } from '@/lib/tracing/trace-logger';
import { EnrollmentRepository } from './enrollment.repository';
import { CourseRepository } from '../course/course.repository';
import type { Enrollment } from '@/lib/types/course.types';

export class EnrollmentService {
  private enrollmentRepo = new EnrollmentRepository();
  private courseRepo = new CourseRepository();

  /**
   * Enroll a student in a course
   */
  async enrollStudent(
    userId: string,
    courseId: string,
    userName: string,
    userEmail: string
  ): Promise<Enrollment> {
    const spanId = traceLogger.startSpan('Enrollment', 'enrollStudent', {
      userId,
      courseId,
    });

    try {
      traceLogger.log('info', 'Enrollment', 'Starting enrollment process');

      // Check if course exists and is published
      traceLogger.log('info', 'Enrollment', 'Verifying course exists and is published');
      const course = await this.courseRepo.getById(courseId);

      if (!course.isPublished) {
        throw new Error('Cannot enroll in unpublished course');
      }

      // Check if course is paid (future payment check here)
      if (course.isPaid) {
        traceLogger.log('warn', 'Enrollment', 'Attempted enrollment in paid course without payment');
        throw new Error('This course requires payment. Please complete checkout first.');
      }

      // Check if already enrolled
      traceLogger.log('info', 'Enrollment', 'Checking existing enrollment');
      const existingEnrollment = await this.enrollmentRepo.getByUserAndCourse(userId, courseId);

      if (existingEnrollment) {
        if (existingEnrollment.status === 'dropped') {
          // Re-enroll dropped student
          traceLogger.log('info', 'Enrollment', 'Re-enrolling previously dropped student');
          await this.enrollmentRepo.update(existingEnrollment.id, {
            status: 'active',
            enrolledAt: new Date() as any,
            lastAccessedAt: new Date() as any,
          });

          traceLogger.log('success', 'Enrollment', 'Student re-enrolled successfully');
          traceLogger.endSpan(spanId, 'success');

          return await this.enrollmentRepo.getById(existingEnrollment.id);
        }

        throw new Error('Already enrolled in this course');
      }

      // Create enrollment
      traceLogger.log('info', 'Enrollment', 'Creating enrollment document');
      const enrollment = await this.enrollmentRepo.create({
        userId,
        courseId,
        userName,
        userEmail,
        courseTitle: course.title,
        teacherName: course.teacherName,
        totalLessonsCount: course.lessonsCount,
      });

      // Increment course enrollment count
      traceLogger.log('info', 'Enrollment', 'Incrementing course enrollment count');
      await this.courseRepo.incrementEnrollmentCount(courseId);

      traceLogger.log('success', 'Enrollment', 'Student enrolled successfully', {
        enrollmentId: enrollment.id,
      });
      traceLogger.endSpan(spanId, 'success');

      return enrollment;
    } catch (error: any) {
      traceLogger.log('error', 'Enrollment', 'Enrollment failed', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Get all enrollments for a student
   */
  async getStudentEnrollments(userId: string): Promise<Enrollment[]> {
    const spanId = traceLogger.startSpan('Enrollment', 'getStudentEnrollments', { userId });

    try {
      traceLogger.log('info', 'Enrollment', 'Fetching student enrollments');

      const enrollments = await this.enrollmentRepo.getByUser(userId);

      traceLogger.log('success', 'Enrollment', 'Enrollments retrieved', {
        count: enrollments.length,
      });
      traceLogger.endSpan(spanId, 'success');

      return enrollments;
    } catch (error: any) {
      traceLogger.log('error', 'Enrollment', 'Failed to get enrollments', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Get all enrollments for a course (teacher view)
   */
  async getCourseEnrollments(courseId: string, teacherId: string): Promise<Enrollment[]> {
    const spanId = traceLogger.startSpan('Enrollment', 'getCourseEnrollments', {
      courseId,
      teacherId,
    });

    try {
      traceLogger.log('info', 'Enrollment', 'Verifying course ownership');

      // Verify teacher owns the course
      const course = await this.courseRepo.getById(courseId);
      if (course.teacherId !== teacherId) {
        throw new Error('Unauthorized: Only course owner can view enrollments');
      }

      traceLogger.log('info', 'Enrollment', 'Fetching course enrollments');
      const enrollments = await this.enrollmentRepo.getByCourse(courseId);

      traceLogger.log('success', 'Enrollment', 'Course enrollments retrieved', {
        count: enrollments.length,
      });
      traceLogger.endSpan(spanId, 'success');

      return enrollments;
    } catch (error: any) {
      traceLogger.log('error', 'Enrollment', 'Failed to get enrollments', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Unenroll a student from a course
   */
  async unenrollStudent(enrollmentId: string, userId: string): Promise<void> {
    const spanId = traceLogger.startSpan('Enrollment', 'unenrollStudent', {
      enrollmentId,
    });

    try {
      traceLogger.log('info', 'Enrollment', 'Fetching enrollment');

      const enrollment = await this.enrollmentRepo.getById(enrollmentId);

      // Verify ownership
      if (enrollment.userId !== userId) {
        throw new Error('Unauthorized: Cannot unenroll other users');
      }

      // Update status to dropped
      traceLogger.log('info', 'Enrollment', 'Marking enrollment as dropped');
      await this.enrollmentRepo.update(enrollmentId, {
        status: 'dropped',
      });

      traceLogger.log('success', 'Enrollment', 'Student unenrolled', {
        enrollmentId,
      });
      traceLogger.endSpan(spanId, 'success');
    } catch (error: any) {
      traceLogger.log('error', 'Enrollment', 'Unenroll failed', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Check if user is enrolled in a course
   */
  async isEnrolled(userId: string, courseId: string): Promise<boolean> {
    const spanId = traceLogger.startSpan('Enrollment', 'isEnrolled', {
      userId,
      courseId,
    });

    try {
      const enrollment = await this.enrollmentRepo.getByUserAndCourse(userId, courseId);

      const enrolled = enrollment !== null && enrollment.status === 'active';

      traceLogger.log('info', 'Enrollment', 'Enrollment check completed', {
        enrolled,
      });
      traceLogger.endSpan(spanId, 'success');

      return enrolled;
    } catch (error: any) {
      traceLogger.log('error', 'Enrollment', 'Enrollment check failed', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Get enrollment details (for student)
   */
  async getEnrollmentDetails(userId: string, courseId: string): Promise<Enrollment | null> {
    const spanId = traceLogger.startSpan('Enrollment', 'getEnrollmentDetails', {
      userId,
      courseId,
    });

    try {
      traceLogger.log('info', 'Enrollment', 'Fetching enrollment details');

      const enrollment = await this.enrollmentRepo.getByUserAndCourse(userId, courseId);

      if (enrollment && enrollment.userId !== userId) {
        throw new Error('Unauthorized: Cannot view other users enrollments');
      }

      traceLogger.log('success', 'Enrollment', 'Enrollment details retrieved', {
        found: enrollment !== null,
      });
      traceLogger.endSpan(spanId, 'success');

      return enrollment;
    } catch (error: any) {
      traceLogger.log('error', 'Enrollment', 'Failed to get enrollment details', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Get all students enrolled in any of the teacher's courses
   * with aggregated enrollment data grouped by student
   * 
   * @param teacherId - The teacher's user ID
   * @param filters - Optional filters for courseId, status, and search
   * @returns Object containing students array with their enrollments
   */
  async getTeacherStudents(
    teacherId: string,
    filters?: {
      courseId?: string;
      status?: 'active' | 'completed' | 'dropped';
      searchQuery?: string;
    }
  ): Promise<{
    students: Array<{
      userId: string;
      userName: string;
      userEmail: string;
      enrollments: Array<{
        enrollmentId: string;
        courseId: string;
        courseTitle: string;
        status: 'active' | 'completed' | 'dropped';
        progressPercentage: number;
        completedLessonsCount: number;
        totalLessonsCount: number;
        enrolledAt: any;
        lastAccessedAt: any;
        averageQuizScore: number;
      }>;
      totalEnrollments: number;
      activeEnrollments: number;
      completedEnrollments: number;
      totalProgressPercentage: number;
    }>;
    totalEnrollments: number;
  }> {
    const spanId = traceLogger.startSpan('Enrollment', 'getTeacherStudents', {
      teacherId,
      filters,
    });

    try {
      traceLogger.log('info', 'Enrollment', 'Fetching teacher courses');

      // First, get all courses owned by this teacher
      const courses = await this.courseRepo.getByTeacher(teacherId);
      const courseIds = courses.map((c) => c.id);

      if (courseIds.length === 0) {
        traceLogger.log('info', 'Enrollment', 'Teacher has no courses');
        traceLogger.endSpan(spanId, 'success');
        return { students: [], totalEnrollments: 0 };
      }

      traceLogger.log('info', 'Enrollment', `Fetching enrollments for ${courseIds.length} courses`);

      // Fetch all enrollments for these courses
      const allEnrollments: Enrollment[] = [];
      for (const courseId of courseIds) {
        // Apply courseId filter if provided
        if (filters?.courseId && courseId !== filters.courseId) {
          continue;
        }

        const enrollments = await this.enrollmentRepo.getByCourse(courseId);
        allEnrollments.push(...enrollments);
      }

      // Apply status filter
      let filteredEnrollments = allEnrollments;
      if (filters?.status) {
        filteredEnrollments = filteredEnrollments.filter((e) => e.status === filters.status);
      }

      // Group enrollments by student
      const studentMap = new Map<
        string,
        {
          userId: string;
          userName: string;
          userEmail: string;
          enrollments: Array<{
            enrollmentId: string;
            courseId: string;
            courseTitle: string;
            status: 'active' | 'completed' | 'dropped';
            progressPercentage: number;
            completedLessonsCount: number;
            totalLessonsCount: number;
            enrolledAt: any;
            lastAccessedAt: any;
            averageQuizScore: number;
          }>;
        }
      >();

      for (const enrollment of filteredEnrollments) {
        const existing = studentMap.get(enrollment.userId);

        const enrollmentData = {
          enrollmentId: enrollment.id,
          courseId: enrollment.courseId,
          courseTitle: enrollment.courseTitle,
          status: enrollment.status,
          progressPercentage: enrollment.progressPercentage,
          completedLessonsCount: enrollment.completedLessonsCount,
          totalLessonsCount: enrollment.totalLessonsCount,
          enrolledAt: enrollment.enrolledAt,
          lastAccessedAt: enrollment.lastAccessedAt,
          averageQuizScore: enrollment.averageQuizScore || 0,
        };

        if (existing) {
          existing.enrollments.push(enrollmentData);
        } else {
          studentMap.set(enrollment.userId, {
            userId: enrollment.userId,
            userName: enrollment.userName,
            userEmail: enrollment.userEmail,
            enrollments: [enrollmentData],
          });
        }
      }

      // Convert map to array and calculate aggregated stats
      let students = Array.from(studentMap.values()).map((student) => {
        const totalEnrollments = student.enrollments.length;
        const activeEnrollments = student.enrollments.filter((e) => e.status === 'active').length;
        const completedEnrollments = student.enrollments.filter((e) => e.status === 'completed').length;
        const totalProgressPercentage =
          student.enrollments.reduce((sum, e) => sum + e.progressPercentage, 0) / totalEnrollments;

        return {
          ...student,
          totalEnrollments,
          activeEnrollments,
          completedEnrollments,
          totalProgressPercentage: Math.round(totalProgressPercentage),
        };
      });

      // Apply search filter (case-insensitive)
      if (filters?.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        students = students.filter(
          (s) =>
            s.userName.toLowerCase().includes(query) ||
            s.userEmail.toLowerCase().includes(query)
        );
      }

      // Sort by total progress (descending) then by name
      students.sort((a, b) => {
        if (b.totalProgressPercentage !== a.totalProgressPercentage) {
          return b.totalProgressPercentage - a.totalProgressPercentage;
        }
        return a.userName.localeCompare(b.userName);
      });

      traceLogger.log('success', 'Enrollment', 'Teacher students retrieved', {
        totalStudents: students.length,
        totalEnrollments: allEnrollments.length,
      });
      traceLogger.endSpan(spanId, 'success');

      return {
        students,
        totalEnrollments: allEnrollments.length,
      };
    } catch (error: any) {
      traceLogger.log('error', 'Enrollment', 'Failed to get teacher students', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }
}
