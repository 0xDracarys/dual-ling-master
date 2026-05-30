/**
 * Class Card Component
 * 
 * Reusable card for displaying class information in lists and dashboard widgets.
 * Features:
 * - Class title, date/time, and duration
 * - Course name and lesson (if applicable)
 * - Google Meet link with "Join" button
 * - Participants count and list
 * - Recording status badge
 * - Action buttons: Edit, Cancel
 * - Status indicators (scheduled, in-progress, completed, cancelled)
 * - Recurring class indicator
 * 
 * Used in: TeacherClassesPage, UpcomingClassesWidget
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Video,
  Calendar,
  Clock,
  Users,
  Repeat,
  ExternalLink,
  Edit,
  Trash2,
  CircleDot,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { format, formatDistanceToNow, isBefore, isAfter } from 'date-fns';
import { cn } from '@/lib/utils';
import { RecordingStatusBadge } from './recording-status-badge';
import { RecordingActions } from './recording-actions';

interface ClassCardProps {
  classData: {
    id: string;
    title: string;
    courseTitle: string;
    lessonTitle?: string;
    type: 'one-time' | 'recurring';
    status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
    startTime: string; // ISO string
    endTime: string; // ISO string
    googleMeetLink: string;
    participants: {
      studentIds: string[];
      externalEmails?: string[];
    };
    studentNames?: string[]; // Pre-fetched student names for display
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
  };
  onEdit?: () => void;
  onCancel?: () => void;
  onJoin?: () => void;
  compact?: boolean;
}

export function ClassCard({
  classData,
  onEdit,
  onCancel,
  onJoin,
  compact = false,
}: ClassCardProps) {
  const startDate = new Date(classData.startTime);
  const endDate = new Date(classData.endTime);
  const now = new Date();

  // Determine if class is happening soon (within 30 minutes)
  const minutesUntilStart = (startDate.getTime() - now.getTime()) / 1000 / 60;
  const isStartingSoon = minutesUntilStart > 0 && minutesUntilStart <= 30;

  // Determine if class is currently happening
  const isHappeningNow = isAfter(now, startDate) && isBefore(now, endDate);

  // Calculate duration in minutes
  const durationMinutes = (endDate.getTime() - startDate.getTime()) / 1000 / 60;

  // Get status badge styling
  const getStatusBadge = () => {
    switch (classData.status) {
      case 'scheduled':
        if (isHappeningNow) {
          return (
            <Badge className="bg-green-500 hover:bg-green-600 text-white">
              <CircleDot className="mr-1 h-3 w-3 animate-pulse" />
              Live Now
            </Badge>
          );
        }
        if (isStartingSoon) {
          return (
            <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">
              <AlertCircle className="mr-1 h-3 w-3" />
              Starting Soon
            </Badge>
          );
        }
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-300">
            <Calendar className="mr-1 h-3 w-3" />
            Scheduled
          </Badge>
        );
      case 'in-progress':
        return (
          <Badge className="bg-green-500 hover:bg-green-600 text-white">
            <CircleDot className="mr-1 h-3 w-3 animate-pulse" />
            In Progress
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="text-green-600 border-green-300">
            <CheckCircle className="mr-1 h-3 w-3" />
            Completed
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="text-red-600 border-red-300">
            <XCircle className="mr-1 h-3 w-3" />
            Cancelled
          </Badge>
        );
    }
  };

  // Get recording badge
  const getRecordingBadge = () => {
    if (!classData.recording) return null;

    switch (classData.recording.status) {
      case 'available':
        return (
          <Badge variant="secondary" className="text-xs">
            Recording Available
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            Recording Expired
          </Badge>
        );
      case 'archived':
        return (
          <Badge variant="secondary" className="text-xs">
            Archived
          </Badge>
        );
      default:
        return null;
    }
  };

  // Handle join meeting
  const handleJoinMeeting = () => {
    if (onJoin) {
      onJoin();
    } else {
      window.open(classData.googleMeetLink, '_blank');
    }
  };

  // Compact view (for dashboard widgets)
  if (compact) {
    return (
      <Card className={cn('hover:shadow-md transition-shadow', isHappeningNow && 'border-green-500 border-2')}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-base">{classData.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{classData.courseTitle}</p>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="mr-2 h-4 w-4" />
            <span>{format(startDate, 'MMM d, h:mm a')}</span>
            {isStartingSoon && (
              <span className="ml-2 text-yellow-600 font-medium">
                (in {Math.round(minutesUntilStart)} min)
              </span>
            )}
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          {(isHappeningNow || isStartingSoon) && (
            <Button size="sm" onClick={handleJoinMeeting} className="w-full bg-green-600 hover:bg-green-700">
              <Video className="mr-2 h-4 w-4" />
              Join Meeting
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  }

  // Full view (for classes page)
  return (
    <Card className={cn('hover:shadow-md transition-shadow', isHappeningNow && 'border-green-500 border-2')}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle>{classData.title}</CardTitle>
              {classData.type === 'recurring' && (
                <Badge variant="outline" className="text-xs">
                  <Repeat className="mr-1 h-3 w-3" />
                  Recurring
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {classData.courseTitle}
              {classData.lessonTitle && ` • ${classData.lessonTitle}`}
            </p>
          </div>
          {getStatusBadge()}
        </div>

        {classData.description && (
          <p className="text-sm text-muted-foreground mt-2">{classData.description}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Date & Time */}
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm">
            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{format(startDate, 'EEEE, MMMM d, yyyy')}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="mr-2 h-4 w-4" />
            <span>
              {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')} ({durationMinutes} min)
            </span>
          </div>
        </div>

        {/* Time until start (for upcoming classes) */}
        {classData.status === 'scheduled' && isBefore(now, startDate) && (
          <div className="text-sm text-muted-foreground">
            Starts {formatDistanceToNow(startDate, { addSuffix: true })}
          </div>
        )}

        <Separator />

        {/* Participants */}
        <div>
          <div className="flex items-center text-sm font-medium mb-2">
            <Users className="mr-2 h-4 w-4 text-muted-foreground" />
            Participants ({classData.participants.studentIds.length + (classData.participants.externalEmails?.length || 0)})
          </div>
          <div className="flex flex-wrap gap-2">
            {classData.studentNames && classData.studentNames.length > 0 ? (
              classData.studentNames.map((name, idx) => (
                <div key={idx} className="flex items-center gap-1">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">{name}</span>
                </div>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">
                {classData.participants.studentIds.length} enrolled student(s)
              </span>
            )}
            {classData.participants.externalEmails && classData.participants.externalEmails.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                +{classData.participants.externalEmails.length} external
              </Badge>
            )}
          </div>
        </div>

        {/* Recurrence Info */}
        {classData.type === 'recurring' && classData.recurrence && (
          <div className="text-sm text-muted-foreground">
            <Repeat className="inline mr-1 h-4 w-4" />
            Repeats {classData.recurrence.pattern}
            {classData.recurrence.endDate && ` until ${format(new Date(classData.recurrence.endDate), 'MMM d, yyyy')}`}
          </div>
        )}

        {/* Recording Section - Enhanced with Status Badge and Actions */}
        {classData.recording && classData.recording.status !== 'pending' && classData.recording.url && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Recording</h4>
                <RecordingStatusBadge
                  expiresAt={new Date(classData.recording.expiresAt || Date.now() + 30 * 24 * 60 * 60 * 1000)}
                  archived={classData.recording.status === 'archived'}
                />
              </div>
              <RecordingActions
                classId={classData.id}
                recordingUrl={classData.recording.url}
                archived={classData.recording.status === 'archived'}
                onArchiveSuccess={() => {
                  // Refresh component - parent should handle this
                  window.location.reload();
                }}
                onDeleteSuccess={() => {
                  // Refresh component - parent should handle this
                  window.location.reload();
                }}
              />
            </div>
          </>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        {/* Join/View Meeting Button */}
        {classData.status !== 'cancelled' && (
          <Button
            onClick={handleJoinMeeting}
            className={cn(
              'flex-1',
              (isHappeningNow || isStartingSoon) && 'bg-green-600 hover:bg-green-700'
            )}
          >
            <Video className="mr-2 h-4 w-4" />
            {isHappeningNow ? 'Join Now' : 'View Meeting Link'}
          </Button>
        )}

        {/* Edit Button (only for scheduled classes) */}
        {classData.status === 'scheduled' && onEdit && (
          <Button variant="outline" size="icon" onClick={onEdit}>
            <Edit className="h-4 w-4" />
          </Button>
        )}

        {/* Cancel Button (only for scheduled/in-progress classes) */}
        {(classData.status === 'scheduled' || classData.status === 'in-progress') && onCancel && (
          <Button variant="outline" size="icon" onClick={onCancel} className="text-red-600 hover:text-red-700">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
