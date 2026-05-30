/**
 * Lesson Resource List Component
 * Display and download lesson resources (PDF, DOC, etc.)
 * Phase: PDF & Document Integration - Checkpoint 5
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Download, 
  File, 
  FileText, 
  FileSpreadsheet, 
  Presentation,
  Loader2,
  AlertCircle,
  FolderOpen,
  Eye
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import type { LessonResource } from '@/lib/types/course.types';

interface ResourceListProps {
  courseId: string;
  lessonId: string;
  className?: string;
  showTitle?: boolean;
  onError?: (error: string) => void;
}

interface ResourceWithUrl extends LessonResource {
  downloadUrl: string | null;
}

// File type icons
const FILE_ICONS = {
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  ppt: Presentation,
  pptx: Presentation,
  xlsx: FileSpreadsheet,
  txt: File
};

const FILE_COLORS = {
  pdf: 'text-red-500',
  doc: 'text-blue-500',
  docx: 'text-blue-500',
  ppt: 'text-orange-500',
  pptx: 'text-orange-500',
  xlsx: 'text-green-500',
  txt: 'text-gray-500'
};

export function ResourceList({
  courseId,
  lessonId,
  className,
  showTitle = true,
  onError
}: ResourceListProps) {
  const { token, user } = useAuth();
  const [resources, setResources] = useState<ResourceWithUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());

  // Fetch resources when user and token are available
  useEffect(() => {
    if (user && token) {
      fetchResources();
    } else {
      setLoading(false);
      setError('Please sign in to view resources');
    }
  }, [courseId, lessonId, user, token]);

  // Fetch resources from API
  const fetchResources = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!token) {
        setLoading(false);
        setError('Please sign in to view resources');
        return;
      }
      
      const response = await fetch(
        `/api/courses/${courseId}/lessons/${lessonId}/resources`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch resources');
      }
      
      const data = await response.json();
      setResources(data.resources || []);
      
    } catch (error: any) {
      console.error('Fetch resources error:', error);
      const errorMessage = error.message || 'Failed to load resources';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Download resource
  const handleDownload = async (resource: ResourceWithUrl) => {
    if (!resource.downloadUrl) {
      alert('Download URL not available');
      return;
    }
    
    setDownloadingIds(prev => new Set(prev).add(resource.id));
    
    try {
      // Open in new tab to trigger download
      window.open(resource.downloadUrl, '_blank');
      
      // Remove from downloading state after delay
      setTimeout(() => {
        setDownloadingIds(prev => {
          const next = new Set(prev);
          next.delete(resource.id);
          return next;
        });
      }, 1000);
      
    } catch (error) {
      console.error('Download error:', error);
      setDownloadingIds(prev => {
        const next = new Set(prev);
        next.delete(resource.id);
        return next;
      });
    }
  };

  // Preview resource using Google Docs Viewer
  const handlePreview = (resource: ResourceWithUrl) => {
    if (!resource.downloadUrl) {
      alert('Preview not available');
      return;
    }
    
    // Google Docs Viewer supports: PDF, DOC, DOCX, PPT, PPTX, XLSX, TXT
    const previewUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(resource.downloadUrl)}&embedded=true`;
    window.open(previewUrl, '_blank', 'width=1200,height=800');
  };

  // Get file icon component
  const getFileIcon = (type: LessonResource['type']) => {
    const IconComponent = FILE_ICONS[type] || File;
    const colorClass = FILE_COLORS[type] || 'text-gray-500';
    return <IconComponent className={`h-6 w-6 ${colorClass}`} />;
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Format upload date
  const formatDate = (timestamp: any): string => {
    if (!timestamp) return 'Unknown';
    
    try {
      // Handle Firestore Timestamp
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Unknown';
    }
  };

  // Loading state
  if (loading) {
    return (
      <Card className={`p-6 ${className || ''}`}>
        {showTitle && (
          <h3 className="text-lg font-semibold mb-4">Lesson Resources</h3>
        )}
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={`p-6 ${className || ''}`}>
        {showTitle && (
          <h3 className="text-lg font-semibold mb-4">Lesson Resources</h3>
        )}
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <div>
            <p className="font-medium">Failed to load resources</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={fetchResources}
          className="mt-4"
        >
          Try Again
        </Button>
      </Card>
    );
  }

  // Empty state
  if (resources.length === 0) {
    return (
      <Card className={`p-6 ${className || ''}`}>
        {showTitle && (
          <h3 className="text-lg font-semibold mb-4">Lesson Resources</h3>
        )}
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <FolderOpen className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            No resources available for this lesson yet
          </p>
        </div>
      </Card>
    );
  }

  // Resources list
  return (
    <Card className={`p-6 ${className || ''}`}>
      {showTitle && (
        <h3 className="text-lg font-semibold mb-4">
          Lesson Resources ({resources.length})
        </h3>
      )}
      
      <div className="space-y-3">
        {resources.map((resource) => (
          <div
            key={resource.id}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
          >
            {/* File Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Icon */}
              <div className="flex-shrink-0">
                {getFileIcon(resource.type)}
              </div>
              
              {/* Details */}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {resource.title}
                </p>
                
                {resource.description && (
                  <p className="text-sm text-muted-foreground truncate">
                    {resource.description}
                  </p>
                )}
                
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span>{resource.type.toUpperCase()}</span>
                  <span>•</span>
                  <span>{formatFileSize(resource.fileSize)}</span>
                  <span>•</span>
                  <span>{formatDate(resource.uploadedAt)}</span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2 ml-4 flex-shrink-0">
              {/* Preview Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePreview(resource)}
                disabled={!resource.downloadUrl}
                className="flex-shrink-0"
                title="Preview in Google Docs Viewer"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              
              {/* Download Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(resource)}
                disabled={!resource.downloadUrl || downloadingIds.has(resource.id)}
                className="flex-shrink-0"
              >
                {downloadingIds.has(resource.id) ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Opening...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </>
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
