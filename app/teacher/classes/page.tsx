/**
 * Teacher Classes Page
 * 
 * Main page for teachers to manage all their scheduled classes.
 * Features:
 * - Tabs: Upcoming (7 days) / Past (30 days)
 * - Schedule Class button (opens ScheduleClassModal)
 * - Instant Meeting button (opens InstantMeetingModal)
 * - List of classes with ClassCard components
 * - Empty states for no classes
 * - Loading states
 * - Error handling
 * 
 * Integrates with: GET /api/classes, DELETE /api/classes/[id]
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Zap, Plus, AlertCircle, Video, RefreshCw, Filter } from 'lucide-react';
import { ClassCard } from '@/components/teacher/class-card';
import { ScheduleClassModal } from '@/components/teacher/schedule-class-modal';
import { InstantMeetingModal } from '@/components/teacher/instant-meeting-modal';
import { traceLogger } from '@/lib/tracing/trace-logger';

interface ClassData {
  id: string;
  title: string;
  courseTitle: string;
  lessonTitle?: string;
  type: 'one-time' | 'recurring';
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  startTime: string;
  endTime: string;
  googleMeetLink: string;
  participants: {
    studentIds: string[];
    externalEmails?: string[];
  };
  studentNames?: string[];
  description?: string;
  recurrence?: {
    pattern: 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
    endDate?: string;
  };
  recording?: {
    status: 'pending' | 'available' | 'expired' | 'archived';
    url?: string;
    expiresAt?: string;
  };
}

interface CourseOption {
  id: string;
  title: string;
}

export default function TeacherClassesPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Modal state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isInstantModalOpen, setIsInstantModalOpen] = useState(false);

  // Data state
  const [upcomingClasses, setUpcomingClasses] = useState<ClassData[]>([]);
  const [pastClasses, setPastClasses] = useState<ClassData[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);

  // Filter state
  const [timeRange, setTimeRange] = useState<number>(30); // days
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');

  // UI state
  const [isLoadingUpcoming, setIsLoadingUpcoming] = useState(true);
  const [isLoadingPast, setIsLoadingPast] = useState(false);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  // Auth check
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (user.role !== 'teacher') {
      router.push('/dashboard');
      return;
    }

    loadCourses();
    loadUpcomingClasses();
  }, [user, router, authLoading, token]);

  // Reload classes when filters change
  useEffect(() => {
    if (!user || !token) return;
    if (activeTab === 'upcoming') {
      loadUpcomingClasses();
    } else {
      loadPastClasses();
    }
  }, [timeRange, selectedCourseId]);

  // Load past classes when tab changes
  useEffect(() => {
    if (activeTab === 'past' && pastClasses.length === 0 && !isLoadingPast) {
      loadPastClasses();
    }
  }, [activeTab]);

  const loadCourses = async () => {
    const spanId = traceLogger.startSpan('TeacherClassesPage', 'loadCourses');
    setIsLoadingCourses(true);

    try {
      const response = await fetch(`/api/courses?teacherId=${user?.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load courses');
      }

      const data = await response.json();
      const coursesData: CourseOption[] = (data.courses || []).map((course: any) => ({
        id: course.id,
        title: course.title,
      }));

      traceLogger.log('info', 'TeacherClassesPage', 'Courses loaded', {
        count: coursesData.length,
      });

      setCourses(coursesData);
      traceLogger.endSpan(spanId, 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      traceLogger.log('warn', 'TeacherClassesPage', 'Failed to load courses', {
        error: errorMessage,
      });
      // Don't set error state here - courses filter is optional
      traceLogger.endSpan(spanId, 'error', { message: errorMessage });
    } finally {
      setIsLoadingCourses(false);
    }
  };

  const loadUpcomingClasses = async () => {
    const spanId = traceLogger.startSpan('TeacherClassesPage', 'loadUpcomingClasses');
    setIsLoadingUpcoming(true);
    setError('');

    try {
      // Build query params
      const params = new URLSearchParams({
        type: 'upcoming',
        days: timeRange.toString(),
      });

      if (selectedCourseId !== 'all') {
        params.append('courseId', selectedCourseId);
      }

      const response = await fetch(`/api/classes?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load upcoming classes');
      }

      const data = await response.json();
      const classes: ClassData[] = data.classes || [];

      traceLogger.log('info', 'TeacherClassesPage', 'Upcoming classes loaded', {
        count: classes.length,
        timeRange,
        courseId: selectedCourseId,
      });

      setUpcomingClasses(classes);
      traceLogger.endSpan(spanId, 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      // Use 'warn' instead of 'error' to avoid Next.js error boundary
      traceLogger.log('warn', 'TeacherClassesPage', 'Failed to load upcoming classes', {
        error: errorMessage,
      });
      setError(errorMessage);
      traceLogger.endSpan(spanId, 'error', { message: errorMessage });
    } finally {
      setIsLoadingUpcoming(false);
    }
  };

  const loadPastClasses = async () => {
    const spanId = traceLogger.startSpan('TeacherClassesPage', 'loadPastClasses');
    setIsLoadingPast(true);
    setError('');

    try {
      // Build query params
      const params = new URLSearchParams({
        type: 'past',
        days: timeRange.toString(),
      });

      if (selectedCourseId !== 'all') {
        params.append('courseId', selectedCourseId);
      }

      const response = await fetch(`/api/classes?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load past classes');
      }

      const data = await response.json();
      const classes: ClassData[] = data.classes || [];

      traceLogger.log('info', 'TeacherClassesPage', 'Past classes loaded', {
        count: classes.length,
        timeRange,
        courseId: selectedCourseId,
      });

      setPastClasses(classes);
      traceLogger.endSpan(spanId, 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      // Use 'warn' instead of 'error' to avoid Next.js error boundary
      traceLogger.log('warn', 'TeacherClassesPage', 'Failed to load past classes', {
        error: errorMessage,
      });
      setError(errorMessage);
      traceLogger.endSpan(spanId, 'error', { message: errorMessage });
    } finally {
      setIsLoadingPast(false);
    }
  };

  const handleCancelClass = async (classId: string) => {
    if (!confirm('Are you sure you want to cancel this class? Participants will be notified.')) {
      return;
    }

    const spanId = traceLogger.startSpan('TeacherClassesPage', 'cancelClass');

    try {
      const response = await fetch(`/api/classes/${classId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to cancel class');
      }

      traceLogger.log('info', 'TeacherClassesPage', 'Class cancelled', { classId });
      traceLogger.endSpan(spanId, 'success');

      // Reload classes
      if (activeTab === 'upcoming') {
        loadUpcomingClasses();
      } else {
        loadPastClasses();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      // Use 'warn' instead of 'error' to avoid Next.js error boundary
      traceLogger.log('warn', 'TeacherClassesPage', 'Failed to cancel class', {
        classId,
        error: errorMessage,
      });
      alert(`Failed to cancel class: ${errorMessage}`);
      traceLogger.endSpan(spanId, 'error', { message: errorMessage });
    }
  };

  const handleScheduleSuccess = () => {
    loadUpcomingClasses();
  };

  const handleInstantMeetingSuccess = (meetLink: string) => {
    // Optionally show success message or redirect to meet link
    loadUpcomingClasses();
  };

  // Loading skeleton
  if (authLoading || isLoadingUpcoming) {
    return (
      <div className="container max-w-7xl py-8">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-10 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
        <Skeleton className="h-12 w-full mb-6" />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Video className="mr-3 h-8 w-8 text-blue-600" />
            My Classes
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your scheduled classes and start instant meetings
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => setIsInstantModalOpen(true)} variant="outline" size="lg">
            <Zap className="mr-2 h-5 w-5 text-yellow-500" />
            Instant Meeting
          </Button>
          <Button onClick={() => setIsScheduleModalOpen(true)} size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Schedule Class
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'upcoming' | 'past')}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="upcoming">
              <Calendar className="mr-2 h-4 w-4" />
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="past">
              <RefreshCw className="mr-2 h-4 w-4" />
              Past
            </TabsTrigger>
          </TabsList>

          {/* Filters */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Filter className="h-5 w-5 text-muted-foreground" />
            
            {/* Time Range Filter */}
            <Select
              value={timeRange.toString()}
              onValueChange={(val) => setTimeRange(parseInt(val))}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Next 7 days</SelectItem>
                <SelectItem value="30">Next 30 days</SelectItem>
                <SelectItem value="90">Next 90 days</SelectItem>
                <SelectItem value="365">All upcoming</SelectItem>
              </SelectContent>
            </Select>

            {/* Course Filter */}
            <Select
              value={selectedCourseId}
              onValueChange={setSelectedCourseId}
              disabled={isLoadingCourses || courses.length === 0}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Upcoming Classes Tab */}
        <TabsContent value="upcoming" className="mt-6">
          {upcomingClasses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Upcoming Classes</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {selectedCourseId !== 'all'
                    ? `No classes found for this course in the next ${timeRange} days.`
                    : `You don't have any scheduled classes in the next ${timeRange} days.`}
                </p>
                <div className="flex gap-2">
                  <Button onClick={() => setIsScheduleModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Schedule Your First Class
                  </Button>
                  <Button variant="outline" onClick={() => setIsInstantModalOpen(true)}>
                    <Zap className="mr-2 h-4 w-4" />
                    Start Instant Meeting
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {upcomingClasses.map((classData) => (
                <ClassCard
                  key={classData.id}
                  classData={classData}
                  onCancel={() => handleCancelClass(classData.id)}
                  onEdit={() => {
                    // TODO: Implement edit modal
                    alert('Edit functionality coming soon');
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Past Classes Tab */}
        <TabsContent value="past" className="mt-6">
          {isLoadingPast ? (
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          ) : pastClasses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <RefreshCw className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Past Classes</h3>
                <p className="text-muted-foreground text-center">
                  {selectedCourseId !== 'all'
                    ? `No classes found for this course in the last ${timeRange} days.`
                    : `You don't have any completed classes in the last ${timeRange} days.`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pastClasses.map((classData) => (
                <ClassCard key={classData.id} classData={classData} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <ScheduleClassModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSuccess={handleScheduleSuccess}
      />

      <InstantMeetingModal
        isOpen={isInstantModalOpen}
        onClose={() => setIsInstantModalOpen(false)}
        onSuccess={handleInstantMeetingSuccess}
      />
    </div>
  );
}
