/**
 * Recording Actions Component
 * 
 * Provides Download, Archive ("Keep Forever"), and Delete buttons for class recordings.
 * Includes confirmation dialogs for destructive actions.
 * 
 * @see docs/google-meet-calendar/google-meet-calendar.scope.md - UI Component
 * @see docs/google-meet-calendar/google-meet-calendar.prd.md - Lines 740-765
 */

'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Download, Archive, Trash2, Loader2 } from 'lucide-react';

interface RecordingActionsProps {
  classId: string;
  recordingUrl: string;
  archived: boolean;
  onArchiveSuccess?: () => void;
  onDeleteSuccess?: () => void;
}

export function RecordingActions({
  classId,
  recordingUrl,
  archived,
  onArchiveSuccess,
  onDeleteSuccess,
}: RecordingActionsProps) {
  const { token } = useAuth();
  const { toast } = useToast();
  const [archiving, setArchiving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  /**
   * Handle download button click - opens recording URL in new tab
   */
  const handleDownload = () => {
    window.open(recordingUrl, '_blank', 'noopener,noreferrer');

    toast({
      title: 'Opening Recording',
      description: 'Your recording will open in a new tab',
    });
  };

  /**
   * Handle archive button click - move to permanent storage ("Keep Forever")
   */
  const handleArchive = async () => {
    setArchiving(true);

    try {
      const response = await fetch(`/api/classes/${classId}/recording/archive`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to archive recording');
      }

      toast({
        title: 'Recording Archived',
        description: 'This recording will now be kept forever',
      });

      onArchiveSuccess?.();
    } catch (error) {
      console.error('Archive recording error:', error);
      toast({
        title: 'Archive Failed',
        description: error instanceof Error ? error.message : 'Failed to archive recording',
        variant: 'destructive',
      });
    } finally {
      setArchiving(false);
    }
  };

  /**
   * Handle delete button click - permanently delete recording
   */
  const handleDelete = async () => {
    setDeleting(true);

    try {
      const response = await fetch(`/api/classes/${classId}/recording`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete recording');
      }

      toast({
        title: 'Recording Deleted',
        description: 'The recording has been permanently deleted',
      });

      onDeleteSuccess?.();
    } catch (error) {
      console.error('Delete recording error:', error);
      toast({
        title: 'Delete Failed',
        description: error instanceof Error ? error.message : 'Failed to delete recording',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {/* Download Button */}
      <Button
        onClick={handleDownload}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <Download className="h-4 w-4" />
        Download
      </Button>

      {/* Archive Button - Hide if already archived */}
      {!archived && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              disabled={archiving}
            >
              {archiving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Archiving...
                </>
              ) : (
                <>
                  <Archive className="h-4 w-4" />
                  Keep Forever
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Archive Recording?</AlertDialogTitle>
              <AlertDialogDescription>
                This recording will be moved to your "DualLing Archived Recordings" folder in Google
                Drive and kept forever. It will not be automatically deleted after 30 days.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleArchive} disabled={archiving}>
                {archiving ? 'Archiving...' : 'Archive'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Delete Button */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="destructive"
            size="sm"
            className="flex items-center gap-2"
            disabled={deleting}
          >
            {deleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete
              </>
            )}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recording?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the recording from Google Drive. This action cannot be undone.
              {archived && (
                <span className="block mt-2 text-yellow-600 dark:text-yellow-500">
                  ⚠️ This recording is archived (kept forever). Are you sure you want to delete it?
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete Permanently'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
