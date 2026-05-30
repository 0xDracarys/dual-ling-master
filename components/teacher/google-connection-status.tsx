/**
 * Google Connection Status Component
 * 
 * Displays connection status, token expiry, and disconnect option.
 */

'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Calendar, Clock } from 'lucide-react';

interface GoogleConnectionStatusProps {
  status: {
    connected: boolean;
    connectedAt?: string;
    expiresAt?: string;
    scope?: string;
  } | null;
  onDisconnect: () => void;
}

export function GoogleConnectionStatus({
  status,
  onDisconnect,
}: GoogleConnectionStatusProps) {
  if (!status || !status.connected) {
    return null;
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Unknown';
    }
  };

  const getTimeUntilExpiry = (expiresAt: string) => {
    try {
      const now = new Date();
      const expiry = new Date(expiresAt);
      const diff = expiry.getTime() - now.getTime();

      if (diff < 0) return 'Expired';

      const minutes = Math.floor(diff / 1000 / 60);
      if (minutes < 60) return `${minutes} minutes`;

      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours} hours`;

      const days = Math.floor(hours / 24);
      return `${days} days`;
    } catch {
      return 'Unknown';
    }
  };

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-lg">Google Account Connected</h3>
            <p className="text-sm text-muted-foreground">
              Your Google account is connected and ready to use
            </p>
          </div>
        </div>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
          Active
        </Badge>
      </div>

      {/* Connection Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
        {status.connectedAt && (
          <div className="flex items-start space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Connected</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(status.connectedAt)}
              </p>
            </div>
          </div>
        )}

        {status.expiresAt && (
          <div className="flex items-start space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Token Expires In</p>
              <p className="text-xs text-muted-foreground">
                {getTimeUntilExpiry(status.expiresAt)}
              </p>
              <p className="text-xs text-muted-foreground italic mt-1">
                Automatically refreshed
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Permissions */}
      {status.scope && (
        <div className="p-4 border rounded-lg">
          <h4 className="font-medium mb-2">Granted Permissions</h4>
          <ul className="space-y-2 text-sm">
            {status.scope.includes('calendar.events') && (
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Manage calendar events</span>
              </li>
            )}
            {status.scope.includes('drive.readonly') && (
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Read Google Drive files</span>
              </li>
            )}
            {status.scope.includes('drive.file') && (
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Manage app-created Drive files</span>
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Disconnect Button */}
      <div className="pt-4 border-t">
        <Button
          variant="destructive"
          onClick={onDisconnect}
        >
          Disconnect Google Account
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          Disconnecting will revoke access and prevent you from scheduling new classes.
          Existing classes will not be affected.
        </p>
      </div>
    </div>
  );
}
