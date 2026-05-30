/**
 * Instant Meeting Modal Component
 * 
 * Quick-start modal for immediate Google Meet sessions.
 * Features:
 * - Course selection (optional - for tracking purposes)
 * - Student multi-select from enrolled students
 * - Optional description
 * - Instant Meet link generation
 * - Auto-starts with "in-progress" status
 * 
 * Integrates with: POST /api/classes/instant
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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Video,
  Users,
  X,
  Plus,
  AlertCircle,
  Loader2,
  ExternalLink,
  Zap,
} from 'lucide-react';
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

interface InstantMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (meetLink: string) => void;
  preselectedCourseId?: string | null;
}

export function InstantMeetingModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedCourseId,
}: InstantMeetingModalProps) {
  const { user, token } = useAuth();

  // Form state
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [externalEmails, setExternalEmails] = useState<string[]>([]);
  const [externalEmailInput, setExternalEmailInput] = useState<string>('');

  // Data state
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);

  // UI state
  const [isLoadingCourses, setIsLoadingCourses] = useState<boolean>(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [meetLink, setMeetLink] = useState<string>('');

  // Load teacher's courses on modal open and reset form
  useEffect(() => {
    if (isOpen && user && token) {
      console.log('🚪 [InstantMeetingModal] Modal opened, resetting form and loading courses');
      // Reset form state to prevent stale data from previous sessions
      setSelectedCourseId('');
      setDescription('');
      setSelectedStudentIds([]);
      setExternalEmails([]);
      setExternalEmailInput('');
      setError('');
      setMeetLink('');
      setEnrolledStudents([]);
      loadTeacherCourses();
    }
  }, [isOpen, user, token]);

  // Load enrolled students when course is selected
  useEffect(() => {
    if (selectedCourseId && token) {
      console.log('📚 [InstantMeetingModal] Course changed, loading students for:', selectedCourseId);
      loadEnrolledStudents(selectedCourseId);
    } else {
      console.log('🧹 [InstantMeetingModal] Clearing students (no course selected)');
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
    const spanId = traceLogger.startSpan('InstantMeetingModal', 'loadTeacherCourses');
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

      traceLogger.log('info', 'InstantMeetingModal', 'Courses loaded', {
        count: coursesData.length,
      });

      setCourses(coursesData);
      traceLogger.endSpan(spanId, 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      // Use 'warn' instead of 'error' to avoid Next.js error boundary
      traceLogger.log('warn', 'InstantMeetingModal', 'Failed to load courses', {
        error: errorMessage,
      });
      setError('Failed to load courses. Please try again.');
      traceLogger.endSpan(spanId, 'error', { message: errorMessage });
    } finally {
      setIsLoadingCourses(false);
    }
  };

  const loadEnrolledStudents = async (courseId: string) => {
    const spanId = traceLogger.startSpan('InstantMeetingModal', 'loadEnrolledStudents');
    setIsLoadingStudents(true);

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
      
      console.log('📋 [InstantMeetingModal] API Response:', {
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

      console.log('✅ [InstantMeetingModal] Mapped students:', students);
      console.log('📝 [InstantMeetingModal] Student IDs:', students.map(s => s.id));

      traceLogger.log('info', 'InstantMeetingModal', 'Students loaded', {
        courseId,
        count: students.length,
        studentIds: students.map(s => s.id),
      });

      setEnrolledStudents(students);
      traceLogger.endSpan(spanId, 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      // Use 'warn' instead of 'error' to avoid Next.js error boundary
      traceLogger.log('warn', 'InstantMeetingModal', 'Failed to load students', {
        error: errorMessage,
      });
      traceLogger.endSpan(spanId, 'error', { message: errorMessage });
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

  const handleStartMeeting = async () => {
    if (!selectedCourseId) {
      setError('Please select a course');
      return;
    }

    if (selectedStudentIds.length === 0 && externalEmails.length === 0) {
      setError('Please select at least one participant');
      return;
    }

    const spanId = traceLogger.startSpan('InstantMeetingModal', 'startInstantMeeting');
    setIsSubmitting(true);
    setError('');

    try {
      // Extract course title for API requirement
      const selectedCourse = courses.find(c => c.id === selectedCourseId);
      const courseTitle = selectedCourse?.title || 'Instant Meeting';

      const requestBody: any = {
        courseId: selectedCourseId,
        title: courseTitle, // REQUIRED by API
        description,
        duration: 60, // Default 1 hour for instant meetings
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        studentIds: selectedStudentIds, // Flat array, not nested
        externalEmails: externalEmails.length > 0 ? externalEmails : undefined,
        recordingEnabled: true,
      };

      console.log('🚀 [InstantMeetingModal] Starting instant meeting:', {
        courseId: selectedCourseId,
        title: courseTitle,
        studentIds: selectedStudentIds,
        studentCount: selectedStudentIds.length,
        externalCount: externalEmails.length,
      });

      traceLogger.log('info', 'InstantMeetingModal', 'Starting instant meeting', {
        courseId: selectedCourseId,
        title: courseTitle,
        studentIds: selectedStudentIds,
        studentCount: selectedStudentIds.length,
        externalCount: externalEmails.length,
      });

      const response = await fetch('/api/classes/instant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start instant meeting');
      }

      const data = await response.json();
      const generatedMeetLink = data.class?.googleMeetLink || '';

      traceLogger.log('info', 'InstantMeetingModal', 'Instant meeting started', {
        classId: data.class?.id,
        meetLink: generatedMeetLink,
      });

      setMeetLink(generatedMeetLink);
      traceLogger.endSpan(spanId, 'success');

      // Call success callback with meet link
      onSuccess(generatedMeetLink);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      // Use 'warn' instead of 'error' to avoid Next.js error boundary
      traceLogger.log('warn', 'InstantMeetingModal', 'Failed to start meeting', {
        error: errorMessage,
      });
      setError(errorMessage);
      traceLogger.endSpan(spanId, 'error', { message: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinMeeting = () => {
    if (meetLink) {
      window.open(meetLink, '_blank');
      handleClose();
    }
  };

  const resetForm = () => {
    setSelectedCourseId('');
    setDescription('');
    setSelectedStudentIds([]);
    setExternalEmails([]);
    setExternalEmailInput('');
    setError('');
    setMeetLink('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Show success state if meet link was generated
  if (meetLink) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-green-600">
              <Zap className="mr-2 h-5 w-5" />
              Meeting Ready!
            </DialogTitle>
            <DialogDescription>
              Your instant meeting has been created. Click below to join.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert className="border-green-500 bg-green-50">
              <Video className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Google Meet link generated successfully. Participants will receive calendar invites
                automatically.
              </AlertDescription>
            </Alert>

            <div className="p-4 bg-muted rounded-md">
              <Label className="text-xs text-muted-foreground">Meeting Link</Label>
              <p className="text-sm font-mono break-all mt-1">{meetLink}</p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">
              Close
            </Button>
            <Button onClick={handleJoinMeeting} className="w-full sm:w-auto">
              <ExternalLink className="mr-2 h-4 w-4" />
              Join Meeting Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Show form to configure instant meeting
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Zap className="mr-2 h-5 w-5 text-yellow-500" />
            Start Instant Meeting
          </DialogTitle>
          <DialogDescription>
            Start a meeting right now with your students. Google Meet link will be generated
            instantly.
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
                  <div className="p-2 text-sm text-muted-foreground">No courses available</div>
                ) : (
                  courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title} ({course.enrollmentCount} students)
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Select a course to track this meeting and invite enrolled students.
            </p>
          </div>

          {/* Student Selection */}
          <div className="space-y-2">
            <Label className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              Participants *
            </Label>

            {isLoadingStudents ? (
              <div className="flex items-center justify-center p-4 border rounded-md">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm">Loading students...</span>
              </div>
            ) : enrolledStudents.length === 0 ? (
              <div className="p-4 border rounded-md text-sm text-muted-foreground">
                {selectedCourseId
                  ? 'No students enrolled in this course yet. Add external participants below.'
                  : 'Select a course to see enrolled students'}
              </div>
            ) : (
              <ScrollArea className="h-40 border rounded-md p-4">
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
            <Label htmlFor="description">Meeting Topic (Optional)</Label>
            <Textarea
              id="description"
              placeholder="What will you discuss in this meeting?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleStartMeeting} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Start Meeting Now
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
