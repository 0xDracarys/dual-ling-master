/**
 * Course Service
 * Business logic for course management
 * Phase 3: Course & Enrollment Services
 */

import { traceLogger } from '@/lib/tracing/trace-logger';
import { CourseRepository } from './course.repository';
import { LessonRepository } from './lesson.repository';
import type {
  Course,
  CreateCourseData,
  UpdateCourseData,
  CourseFilters,
  Lesson,
  CreateLessonData,
  UpdateLessonData,
} from '@/lib/types/course.types';

export class CourseService {
  private courseRepo = new CourseRepository();
  private lessonRepo = new LessonRepository();

  /**
   * Create a new course
   */
  async createCourse(data: CreateCourseData): Promise<Course> {
    const spanId = traceLogger.startSpan('Course', 'createCourse', {
      teacherId: data.teacherId,
      title: data.title,
    });

    try {
      traceLogger.log('info', 'Course', 'Validating course data');
      this.validateCourseData(data);
      traceLogger.log('success', 'Course', 'Course data validated');

      traceLogger.log('info', 'Course', 'Creating course document');
      const course = await this.courseRepo.create(data);

      traceLogger.log('success', 'Course', 'Course created successfully', {
        courseId: course.id,
        title: course.title,
      });
      traceLogger.endSpan(spanId, 'success');

      return course;
    } catch (error: any) {
      traceLogger.log('error', 'Course', 'Course creation failed', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Get course by ID (with lessons if requested)
   */
  async getCourseById(courseId: string, includeLessons: boolean = false): Promise<Course & { lessons?: Lesson[] }> {
    const spanId = traceLogger.startSpan('Course', 'getCourseById', {
      courseId,
      includeLessons,
    });

    try {
      traceLogger.log('info', 'Course', `Fetching course: ${courseId}`);
      const course = await this.courseRepo.getById(courseId);

      let lessons: Lesson[] | undefined;
      if (includeLessons) {
        traceLogger.log('info', 'Course', 'Fetching course lessons');
        lessons = await this.lessonRepo.getByCourse(courseId, course.isPublished);
        traceLogger.log('success', 'Course', 'Lessons retrieved', {
          count: lessons.length,
        });
      }

      traceLogger.log('success', 'Course', 'Course retrieved', {
        courseId,
        title: course.title,
      });
      traceLogger.endSpan(spanId, 'success');

      return { ...course, lessons };
    } catch (error: any) {
      traceLogger.log('error', 'Course', 'Course retrieval failed', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Get all published courses
   */
  async getPublishedCourses(filters?: CourseFilters): Promise<Course[]> {
    const spanId = traceLogger.startSpan('Course', 'getPublishedCourses', filters ? { filters } : undefined);

    try {
      traceLogger.log('info', 'Course', 'Querying published courses', { filters });
      const courses = await this.courseRepo.getPublished(filters);

      traceLogger.log('success', 'Course', 'Published courses retrieved', {
        count: courses.length,
      });
      traceLogger.endSpan(spanId, 'success');

      return courses;
    } catch (error: any) {
      traceLogger.log('error', 'Course', 'Failed to get courses', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Get courses by teacher
   */
  async getTeacherCourses(teacherId: string): Promise<Course[]> {
    const spanId = traceLogger.startSpan('Course', 'getTeacherCourses', { teacherId });

    try {
      traceLogger.log('info', 'Course', 'Querying teacher courses');
      const courses = await this.courseRepo.getByTeacher(teacherId);

      traceLogger.log('success', 'Course', 'Teacher courses retrieved', {
        count: courses.length,
      });
      traceLogger.endSpan(spanId, 'success');

      return courses;
    } catch (error: any) {
      traceLogger.log('error', 'Course', 'Failed to get teacher courses', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Get all courses (Admin only)
   */
  async getAllCourses(): Promise<Course[]> {
    const spanId = traceLogger.startSpan('Course', 'getAllCourses');

    try {
      traceLogger.log('info', 'Course', 'Querying all courses');
      const courses = await this.courseRepo.getAll();

      traceLogger.log('success', 'Course', 'All courses retrieved', {
        count: courses.length,
      });
      traceLogger.endSpan(spanId, 'success');

      return courses;
    } catch (error: any) {
      traceLogger.log('error', 'Course', 'Failed to get all courses', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Update course
   */
  async updateCourse(
    courseId: string,
    teacherId: string,
    data: UpdateCourseData
  ): Promise<Course> {
    const spanId = traceLogger.startSpan('Course', 'updateCourse', { courseId });

    try {
      // Verify ownership
      traceLogger.log('info', 'Course', 'Verifying course ownership');
      const course = await this.courseRepo.getById(courseId);

      if (course.teacherId !== teacherId) {
        throw new Error('Unauthorized: Only course owner can update');
      }

      traceLogger.log('info', 'Course', 'Updating course');
      await this.courseRepo.update(courseId, data);

      const updatedCourse = await this.courseRepo.getById(courseId);

      traceLogger.log('success', 'Course', 'Course updated successfully', {
        courseId,
      });
      traceLogger.endSpan(spanId, 'success');

      return updatedCourse;
    } catch (error: any) {
      traceLogger.log('error', 'Course', 'Course update failed', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Publish course
   */
  async publishCourse(courseId: string, teacherId: string): Promise<void> {
    const spanId = traceLogger.startSpan('Course', 'publishCourse', { courseId });

    try {
      // Verify ownership
      traceLogger.log('info', 'Course', 'Verifying course ownership');
      const course = await this.courseRepo.getById(courseId);

      if (course.teacherId !== teacherId) {
        throw new Error('Unauthorized: Only course owner can publish');
      }

      // Verify course has lessons
      if (course.lessonsCount === 0) {
        throw new Error('Cannot publish course with no lessons');
      }

      traceLogger.log('info', 'Course', 'Publishing course');
      await this.courseRepo.update(courseId, {
        isPublished: true,
        publishedAt: new Date() as any,
      });

      traceLogger.log('success', 'Course', 'Course published successfully', {
        courseId,
      });
      traceLogger.endSpan(spanId, 'success');
    } catch (error: any) {
      traceLogger.log('error', 'Course', 'Course publish failed', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Unpublish course
   */
  async unpublishCourse(courseId: string, teacherId: string): Promise<void> {
    const spanId = traceLogger.startSpan('Course', 'unpublishCourse', { courseId });

    try {
      // Verify ownership
      const course = await this.courseRepo.getById(courseId);
      if (course.teacherId !== teacherId) {
        throw new Error('Unauthorized: Only course owner can unpublish');
      }

      await this.courseRepo.update(courseId, {
        isPublished: false,
      });

      traceLogger.log('success', 'Course', 'Course unpublished', { courseId });
      traceLogger.endSpan(spanId, 'success');
    } catch (error: any) {
      traceLogger.log('error', 'Course', 'Course unpublish failed', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Delete course
   */
  async deleteCourse(courseId: string, teacherId: string): Promise<void> {
    const spanId = traceLogger.startSpan('Course', 'deleteCourse', { courseId });

    try {
      // Verify ownership
      const course = await this.courseRepo.getById(courseId);
      if (course.teacherId !== teacherId) {
        throw new Error('Unauthorized: Only course owner can delete');
      }

      // Check if course has enrollments
      if (course.enrollmentCount > 0) {
        throw new Error(
          'Cannot delete course with active enrollments. Unpublish instead.'
        );
      }

      await this.courseRepo.delete(courseId);

      traceLogger.log('success', 'Course', 'Course deleted', { courseId });
      traceLogger.endSpan(spanId, 'success');
    } catch (error: any) {
      traceLogger.log('error', 'Course', 'Course deletion failed', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Add lesson to course
   */
  async addLesson(
    courseId: string,
    teacherId: string,
    lessonData: CreateLessonData
  ): Promise<Lesson> {
    const spanId = traceLogger.startSpan('Course', 'addLesson', {
      courseId,
      lessonTitle: lessonData.title,
    });

    try {
      // Verify ownership
      const course = await this.courseRepo.getById(courseId);
      if (course.teacherId !== teacherId) {
        throw new Error('Unauthorized: Only course owner can add lessons');
      }

      traceLogger.log('info', 'Course', 'Creating lesson');
      const lesson = await this.lessonRepo.create(courseId, lessonData);

      // Increment course lesson count
      traceLogger.log('info', 'Course', 'Incrementing lesson count');
      await this.courseRepo.incrementLessonCount(courseId);

      traceLogger.log('success', 'Course', 'Lesson added successfully', {
        lessonId: lesson.id,
        courseId,
      });
      traceLogger.endSpan(spanId, 'success');

      return lesson;
    } catch (error: any) {
      traceLogger.log('error', 'Course', 'Add lesson failed', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Update lesson
   */
  async updateLesson(
    courseId: string,
    lessonId: string,
    teacherId: string,
    data: UpdateLessonData
  ): Promise<Lesson> {
    const spanId = traceLogger.startSpan('Course', 'updateLesson', {
      courseId,
      lessonId,
    });

    try {
      // Verify ownership
      const course = await this.courseRepo.getById(courseId);
      if (course.teacherId !== teacherId) {
        throw new Error('Unauthorized: Only course owner can update lessons');
      }

      await this.lessonRepo.update(courseId, lessonId, data);
      const updatedLesson = await this.lessonRepo.getById(courseId, lessonId);

      traceLogger.log('success', 'Course', 'Lesson updated', { lessonId });
      traceLogger.endSpan(spanId, 'success');

      return updatedLesson;
    } catch (error: any) {
      traceLogger.log('error', 'Course', 'Lesson update failed', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Delete lesson
   */
  async deleteLesson(
    courseId: string,
    lessonId: string,
    teacherId: string
  ): Promise<void> {
    const spanId = traceLogger.startSpan('Course', 'deleteLesson', {
      courseId,
      lessonId,
    });

    try {
      // Verify ownership
      const course = await this.courseRepo.getById(courseId);
      if (course.teacherId !== teacherId) {
        throw new Error('Unauthorized: Only course owner can delete lessons');
      }

      await this.lessonRepo.delete(courseId, lessonId);

      // Decrement course lesson count
      await this.courseRepo.update(courseId, {
        lessonsCount: course.lessonsCount - 1,
      });

      traceLogger.log('success', 'Course', 'Lesson deleted', { lessonId });
      traceLogger.endSpan(spanId, 'success');
    } catch (error: any) {
      traceLogger.log('error', 'Course', 'Lesson deletion failed', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Get lessons for a course
   */
  async getCourseLessons(courseId: string, publishedOnly: boolean = false): Promise<Lesson[]> {
    const spanId = traceLogger.startSpan('Course', 'getCourseLessons', {
      courseId,
      publishedOnly,
    });

    try {
      const lessons = await this.lessonRepo.getByCourse(courseId, publishedOnly);

      traceLogger.log('success', 'Course', 'Lessons retrieved', {
        count: lessons.length,
      });
      traceLogger.endSpan(spanId, 'success');

      return lessons;
    } catch (error: any) {
      traceLogger.log('error', 'Course', 'Failed to get lessons', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Validate course data
   */
  private validateCourseData(data: CreateCourseData): void {
    if (data.title.length < 3) {
      throw new Error('Course title must be at least 3 characters');
    }
    if (data.description.length < 10) {
      throw new Error('Course description must be at least 10 characters');
    }
    if (data.estimatedHours <= 0) {
      throw new Error('Estimated hours must be positive');
    }
    if (data.language === data.targetLanguage) {
      throw new Error('Course language and target language cannot be the same');
    }
  }
}
