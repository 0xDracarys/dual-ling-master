/**
 * Upcoming Classes Widget Component
 * 
 * Dashboard widget displaying next 3 upcoming classes with quick actions.
 * Features:
 * - Shows next 3 classes in compact format
 * - Countdown timer for next class
 * - Quick "Join" button for classes starting soon
 * - "View All" link to classes page
 * - Empty state for no upcoming classes
 * - Loading skeleton
 * 
 * Used in: Teacher Dashboard
 * Integrates with: GET /api/classes?timeFilter=upcoming&limit=3
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, ExternalLink, AlertCircle, Video } from 'lucide-react';
import { ClassCard } from '@/components/teacher/class-card';
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
}

export function UpcomingClassesWidget() {
  const { token } = useAuth();

  // Data state
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (token) {
      loadUpcomingClasses();
    }
  }, [token]);

  const loadUpcomingClasses = async () => {
    const spanId = traceLogger.startSpan('UpcomingClassesWidget', 'loadUpcomingClasses');
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/classes?timeFilter=upcoming&limit=3', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load upcoming classes');
      }

      const data = await response.json();
      const upcomingClasses: ClassData[] = data.classes || [];

      traceLogger.log('info', 'UpcomingClassesWidget', 'Classes loaded', {
        count: upcomingClasses.length,
      });

      setClasses(upcomingClasses);
      traceLogger.endSpan(spanId, 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      // Use 'warn' instead of 'error' to avoid Next.js error boundary
      traceLogger.log('warn', 'UpcomingClassesWidget', 'Failed to load classes', {
        error: errorMessage,
      });
      setError(errorMessage);
      traceLogger.endSpan(spanId, 'error', { message: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Video className="mr-2 h-5 w-5 text-blue-600" />
            Upcoming Classes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">
          <Video className="mr-2 h-5 w-5 text-blue-600" />
          Upcoming Classes
        </CardTitle>
        <Link href="/teacher/classes">
          <Button variant="ghost" size="sm">
            View All
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {classes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              No upcoming classes in the next 7 days
            </p>
            <Link href="/teacher/classes">
              <Button size="sm">
                Schedule Your First Class
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {classes.map((classData) => (
              <ClassCard key={classData.id} classData={classData} compact />
            ))}

            {classes.length >= 3 && (
              <Link href="/teacher/classes">
                <Button variant="outline" className="w-full">
                  View All Classes
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
