/**
 * Schedule Class Modal Component
 * 
 * Allows teachers to schedule one-time or recurring classes with enrolled students.
 * Features:
 * - Course selection (teacher's courses only)
 * - Student multi-select (enrolled students only)
 * - Date/time picker with timezone awareness
 * - Duration selector (30/60/90/120 minutes)
 * - Recurrence pattern UI (daily/weekly/bi-weekly)
 * - Optional description/agenda field
 * - External participant support (email addresses)
 * 
 * Integrates with: POST /api/classes
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CalendarNew } from '@/components/ui/calendar-new';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  CalendarIcon,
  Clock,
  Users,
  Repeat,
  X,
  Plus,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { traceLogger } from '@/lib/tracing/trace-logger';

interface Course {
  id: string;
  title: string;
  enrollmentCount: number;
}

interface EnrolledStudent {
  id: string;
  name: string;
  email: string;
}

interface ScheduleClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedCourseId?: string | null;
}

export function ScheduleClassModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedCourseId,
}: ScheduleClassModalProps) {
  const { user, token } = useAuth();

  // Form state
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>('09:00');
  const [duration, setDuration] = useState<number>(60);
  const [description, setDescription] = useState<string>('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [externalEmails, setExternalEmails] = useState<string[]>([]);
  const [externalEmailInput, setExternalEmailInput] = useState<string>('');

  // Recurrence state
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recurrencePattern, setRecurrencePattern] = useState<
    'daily' | 'weekly' | 'bi-weekly'
  >('weekly');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | undefined>(undefined);

  // Data state
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);

  // UI state
  const [isLoadingCourses, setIsLoadingCourses] = useState<boolean>(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Logging context
  const spanId = React.useRef<string | null>(null);

  // Load teacher's courses on modal open and reset form
  useEffect(() => {
    if (isOpen && user && token) {
      console.log('🚪 [ScheduleClassModal] Modal opened, resetting form and loading courses');
      // Reset form state to prevent stale data from previous sessions
      resetForm();
      loadTeacherCourses();
    }
  }, [isOpen, user, token]);

  // Load enrolled students when course is selected
  useEffect(() => {
    if (selectedCourseId && token) {
      loadEnrolledStudents(selectedCourseId);
    } else {
      setEnrolledStudents([]);
      setSelectedStudentIds([]);
    }
  }, [selectedCourseId, token]);

  // Set preselected course if provided
  useEffect(() => {
    if (preselectedCourseId && courses.length > 0) {
      setSelectedCourseId(preselectedCourseId);
    }
  }, [preselectedCourseId, courses]);

  const loadTeacherCourses = async () => {
    spanId.current = traceLogger.startSpan('ScheduleClassModal', 'loadTeacherCourses');
    setIsLoadingCourses(true);
    setError('');

    try {
      // CRITICAL: Filter by teacherId to only show courses owned by this teacher
      // This prevents 403 errors when fetching enrollments for courses they don't own
      const response = await fetch(`/api/courses?teacherId=${user?.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load courses');
      }

      const data = await response.json();
      const coursesData: Course[] = data.courses || [];

      traceLogger.log('info', 'ScheduleClassModal', 'Courses loaded successfully', {
        count: coursesData.length,
        teacherId: user?.id,
      });

      setCourses(coursesData);
      traceLogger.endSpan(spanId.current, 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      // Use 'warn' instead of 'error' to avoid Next.js error boundary
      traceLogger.log('warn', 'ScheduleClassModal', 'Failed to load courses', { error: errorMessage });
      setError('Failed to load courses. Please try again.');
      traceLogger.endSpan(spanId.current!, 'error', { message: errorMessage });
    } finally {
      setIsLoadingCourses(false);
    }
  };

  const loadEnrolledStudents = async (courseId: string) => {
    const enrollSpanId = traceLogger.startSpan(
      'ScheduleClassModal',
      'loadEnrolledStudents'
    );
    setIsLoadingStudents(true);
    setError('');

    try {
      const response = await fetch(`/api/courses/${courseId}/enrollments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load enrolled students');
      }

      const data = await response.json();
      
      // API returns data.enrollments array
      const enrollmentsData = data.data?.enrollments || data.enrollments || [];
      
      console.log('📋 [ScheduleClassModal] API Response:', {
        fullData: data,
        enrollmentsData,
        count: enrollmentsData.length
      });
      
      // CRITICAL: Use e.userId (not e.studentId or e.id)
      // Enrollment schema has userId field which is the actual student's Firebase UID
      // e.id is the document ID format: {userId}_{courseId}
      const students: EnrolledStudent[] = enrollmentsData.map((e: any) => ({
        id: e.userId,  // This is the actual student ID for validation
        name: e.userName || 'Unknown Student',
        email: e.userEmail || '',
      }));

      console.log('✅ [ScheduleClassModal] Mapped students:', students);

      traceLogger.log('info', 'ScheduleClassModal', 'Enrolled students loaded', {
        courseId,
        count: students.length,
      });

      setEnrolledStudents(students);
      traceLogger.endSpan(enrollSpanId, 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      // Use 'warn' instead of 'error' to avoid Next.js error boundary
      traceLogger.log('warn', 'ScheduleClassModal', 'Failed to load enrolled students', {
        courseId,
        error: errorMessage,
      });
      setError('Failed to load enrolled students. Please try again.');
      traceLogger.endSpan(enrollSpanId, 'error', { message: errorMessage });
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleAddExternalEmail = () => {
    const email = externalEmailInput.trim();
    if (!email) return;

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Invalid email address');
      return;
    }

    if (externalEmails.includes(email)) {
      setError('Email already added');
      return;
    }

    setExternalEmails((prev) => [...prev, email]);
    setExternalEmailInput('');
    setError('');
  };

  const handleRemoveExternalEmail = (email: string) => {
    setExternalEmails((prev) => prev.filter((e) => e !== email));
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!selectedCourseId) errors.push('Please select a course');
    if (!selectedDate) errors.push('Please select a date');
    if (!selectedTime) errors.push('Please select a time');
    if (selectedStudentIds.length === 0 && externalEmails.length === 0) {
      errors.push('Please select at least one student or add external participants');
    }
    if (isRecurring && !recurrenceEndDate) {
      errors.push('Please select an end date for recurring classes');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const submitSpanId = traceLogger.startSpan('ScheduleClassModal', 'scheduleClass');
    setIsSubmitting(true);
    setError('');
    setValidationErrors([]);

    try {
      // Combine date and time
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const startDateTime = new Date(selectedDate!);
      startDateTime.setHours(hours, minutes, 0, 0);

      // Get selected course title
      const selectedCourse = courses.find(c => c.id === selectedCourseId);
      const courseTitle = selectedCourse?.title || 'Scheduled Class';

      // Prepare request body
      const requestBody: any = {
        courseId: selectedCourseId,
        title: courseTitle, // ADD TITLE - REQUIRED BY API
        description,
        startTime: startDateTime.toISOString(),
        duration, // Duration in minutes
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        studentIds: selectedStudentIds,
        externalEmails: externalEmails.length > 0 ? externalEmails : undefined,
        recordingEnabled: true, // Enable recording by default
      };

      // Add recurrence if enabled
      if (isRecurring && recurrenceEndDate) {
        // Calculate daysOfWeek from selectedDate
        // For weekly and bi-weekly patterns, we need to specify which day of the week
        // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        const dayOfWeek = startDateTime.getDay();
        
        requestBody.recurrence = {
          pattern: recurrencePattern,
          daysOfWeek: [dayOfWeek], // Always include the day of the selected date
          endDate: recurrenceEndDate.toISOString(),
        };
      }

      traceLogger.log('info', 'ScheduleClassModal', 'Scheduling class', {
        courseId: selectedCourseId,
        type: requestBody.type,
        studentCount: selectedStudentIds.length,
        externalCount: externalEmails.length,
        startTime: startDateTime.toISOString(),
      });

      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to schedule class');
      }

      const data = await response.json();

      traceLogger.log('info', 'ScheduleClassModal', 'Class scheduled successfully', {
        classId: data.class?.id,
        meetLink: data.class?.googleMeetLink,
      });

      traceLogger.endSpan(submitSpanId, 'success');

      // Reset form and close modal
      resetForm();
      onSuccess();
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      // Use 'warn' instead of 'error' to avoid Next.js error boundary
      traceLogger.log('warn', 'ScheduleClassModal', 'Failed to schedule class', { error: errorMessage });
      setError(errorMessage);
      traceLogger.endSpan(submitSpanId, 'error', { message: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedCourseId('');
    setSelectedDate(undefined);
    setSelectedTime('09:00');
    setDuration(60);
    setDescription('');
    setSelectedStudentIds([]);
    setExternalEmails([]);
    setExternalEmailInput('');
    setIsRecurring(false);
    setRecurrencePattern('weekly');
    setRecurrenceEndDate(undefined);
    setError('');
    setValidationErrors([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Class</DialogTitle>
          <DialogDescription>
            Schedule a one-time or recurring class with your students. Google Meet link will be
            generated automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Course Selection */}
          <div className="space-y-2">
            <Label htmlFor="course">Course *</Label>
            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
              <SelectTrigger id="course">
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingCourses ? (
                  <div className="flex items-center justify-center p-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2 text-sm">Loading courses...</span>
                  </div>
                ) : courses.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    No courses available
                  </div>
                ) : (
                  courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title} ({course.enrollmentCount} students)
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Date & Time Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date Picker */}
            <div className="space-y-2">
              <Label>Date *</Label>
              <CalendarNew
                mode="single"
                selectedDate={selectedDate}
                onSelectSingle={setSelectedDate}
                disabled={(date: Date) => date < new Date()}
                value={null}
                onChange={() => {}}
                allowClear
              />
            </div>

            {/* Time Picker */}
            <div className="space-y-2">
              <Label htmlFor="time">Time *</Label>
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="time"
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Duration Selection */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duration</Label>
            <Select value={duration.toString()} onValueChange={(val) => setDuration(Number(val))}>
              <SelectTrigger id="duration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="90">1.5 hours</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Recurrence Options */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="recurring"
                checked={isRecurring}
                onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
              />
              <Label htmlFor="recurring" className="flex items-center cursor-pointer">
                <Repeat className="mr-2 h-4 w-4" />
                Make this a recurring class
              </Label>
            </div>

            {isRecurring && (
              <div className="ml-6 space-y-4 border-l-2 pl-4">
                <div className="space-y-2">
                  <Label htmlFor="pattern">Repeat Pattern</Label>
                  <Select value={recurrencePattern} onValueChange={setRecurrencePattern as any}>
                    <SelectTrigger id="pattern">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="bi-weekly">Bi-weekly (Every 2 weeks)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>End Date *</Label>
                  <CalendarNew
                    mode="single"
                    selectedDate={recurrenceEndDate}
                    onSelectSingle={setRecurrenceEndDate}
                    disabled={(date: Date) => !selectedDate || date <= selectedDate}
                    value={null}
                    onChange={() => {}}
                    allowClear
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Student Selection */}
          <div className="space-y-2">
            <Label className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              Enrolled Students *
            </Label>

            {isLoadingStudents ? (
              <div className="flex items-center justify-center p-4 border rounded-md">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm">Loading students...</span>
              </div>
            ) : enrolledStudents.length === 0 ? (
              <div className="p-4 border rounded-md text-sm text-muted-foreground">
                {selectedCourseId
                  ? 'No students enrolled in this course yet'
                  : 'Select a course to see enrolled students'}
              </div>
            ) : (
              <ScrollArea className="h-48 border rounded-md p-4">
                <div className="space-y-2">
                  {enrolledStudents.map((student) => (
                    <div key={student.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={student.id}
                        checked={selectedStudentIds.includes(student.id)}
                        onCheckedChange={() => handleStudentToggle(student.id)}
                      />
                      <Label htmlFor={student.id} className="flex-1 cursor-pointer">
                        {student.name}
                        <span className="text-xs text-muted-foreground ml-2">
                          ({student.email})
                        </span>
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {selectedStudentIds.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Selected: {selectedStudentIds.length} student(s)
              </div>
            )}
          </div>

          {/* External Participants */}
          <div className="space-y-2">
            <Label>External Participants (Optional)</Label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="email@example.com"
                value={externalEmailInput}
                onChange={(e) => setExternalEmailInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddExternalEmail();
                  }
                }}
              />
              <Button type="button" variant="outline" size="icon" onClick={handleAddExternalEmail}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {externalEmails.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {externalEmails.map((email) => (
                  <Badge key={email} variant="secondary" className="flex items-center gap-1">
                    {email}
                    <button
                      type="button"
                      onClick={() => handleRemoveExternalEmail(email)}
                      className="ml-1 hover:bg-destructive/20 rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description / Agenda (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add notes, topics, or agenda for this class..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scheduling...
              </>
            ) : (
              'Schedule Class'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
