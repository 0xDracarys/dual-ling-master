/**
 * Recording Status Badge Component
 * 
 * Displays the status of a class recording with appropriate styling and countdown.
 * - Available: Green badge (recording is accessible, >7 days remaining)
 * - Expiring: Yellow badge (recording will expire in ≤7 days, shows countdown)
 * - Archived: Blue badge (recording is kept forever)
 * 
 * @see docs/google-meet-calendar/google-meet-calendar.scope.md - UI Component
 * @see docs/google-meet-calendar/google-meet-calendar.prd.md - Lines 740-765
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle2, Clock, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecordingStatusBadgeProps {
  expiresAt: Date;
  archived: boolean;
  className?: string;
}

export function RecordingStatusBadge({
  expiresAt,
  archived,
  className,
}: RecordingStatusBadgeProps) {
  // Calculate days remaining
  const now = new Date();
  const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Determine status
  const status = archived ? 'archived' : daysRemaining <= 7 ? 'expiring' : 'available';

  // Badge configuration
  const badgeConfig = {
    archived: {
      icon: Archive,
      text: 'Kept Forever',
      variant: 'default' as const,
      className: 'bg-blue-500 text-white hover:bg-blue-600 border-blue-600',
    },
    expiring: {
      icon: Clock,
      text: `Expires ${formatDistanceToNow(expiresAt, { addSuffix: true })}`,
      variant: 'outline' as const,
      className: 'bg-yellow-50 text-yellow-700 border-yellow-400 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-700',
    },
    available: {
      icon: CheckCircle2,
      text: 'Available',
      variant: 'outline' as const,
      className: 'bg-green-50 text-green-700 border-green-400 dark:bg-green-950 dark:text-green-400 dark:border-green-700',
    },
  };

  const config = badgeConfig[status];
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, className)}
    >
      <Icon className="h-3 w-3" />
      {config.text}
    </Badge>
  );
}
