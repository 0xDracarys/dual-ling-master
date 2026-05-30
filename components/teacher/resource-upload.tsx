/**
 * Lesson Resource Upload Component
 * Standalone component for uploading PDF, DOC, DOCX, PPT, PPTX, XLSX, TXT files
 * Phase: PDF & Document Integration - Checkpoint 4
 */

'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { 
  Upload, 
  File, 
  FileText, 
  FileSpreadsheet, 
  Presentation, 
  X, 
  CheckCircle, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import type { LessonResource } from '@/lib/types/course.types';

interface ResourceUploadProps {
  courseId: string;
  lessonId: string;
  onUploadComplete?: (resource: LessonResource & { downloadUrl: string }) => void;
  onError?: (error: string) => void;
  className?: string;
}

// File type configurations
const ALLOWED_FILE_TYPES = {
  'application/pdf': { ext: 'pdf', label: 'PDF', icon: FileText },
  'application/msword': { ext: 'doc', label: 'Word', icon: FileText },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { ext: 'docx', label: 'Word', icon: FileText },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { ext: 'pptx', label: 'PowerPoint', icon: Presentation },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { ext: 'xlsx', label: 'Excel', icon: FileSpreadsheet },
  'text/plain': { ext: 'txt', label: 'Text', icon: File }
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function ResourceUpload({
  courseId,
  lessonId,
  onUploadComplete,
  onError,
  className
}: ResourceUploadProps) {
  const { token, user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debug: Component mounted
  console.log('🎨 [ResourceUpload] Component rendered:', {
    courseId,
    lessonId,
    hasFile: !!selectedFile,
    hasToken: !!token,
    hasUser: !!user
  });

  // Validate file type and size
  const validateFile = (file: File): string | null => {
    if (!Object.keys(ALLOWED_FILE_TYPES).includes(file.type)) {
      return 'Invalid file type. Allowed: PDF, DOC, DOCX, PPT, PPTX, XLSX, TXT';
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size: ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB`;
    }
    
    return null;
  };

  // Handle file selection
  const handleFileSelect = (file: File) => {
    console.log('📁 [ResourceUpload] File selected:', {
      name: file.name,
      size: file.size,
      type: file.type
    });
    
    const error = validateFile(file);
    
    if (error) {
      console.error('❌ [ResourceUpload] File validation failed:', error);
      setErrorMessage(error);
      setUploadStatus('error');
      if (onError) onError(error);
      return;
    }
    
    console.log('✅ [ResourceUpload] File validated successfully');
    setSelectedFile(file);
    setUploadStatus('idle');
    setErrorMessage('');
    
    // Auto-fill title if empty
    if (!title) {
      const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
      setTitle(fileName);
      console.log('📝 [ResourceUpload] Auto-filled title:', fileName);
    }
  };

  // Handle drag and drop
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Upload file
  const handleUpload = async () => {
    console.log('🚀 [ResourceUpload] Starting upload:', {
      hasFile: !!selectedFile,
      fileName: selectedFile?.name,
      fileSize: selectedFile?.size,
      fileType: selectedFile?.type,
      title: title.trim(),
      hasDescription: !!description.trim(),
      courseId,
      lessonId,
      hasToken: !!token,
      hasUser: !!user,
      userId: user?.id
    });
    
    if (!selectedFile) {
      console.error('❌ [ResourceUpload] No file selected');
      setErrorMessage('Please select a file');
      setUploadStatus('error');
      return;
    }
    
    if (!title.trim()) {
      console.error('❌ [ResourceUpload] No title provided');
      setErrorMessage('Please provide a title');
      setUploadStatus('error');
      return;
    }
    
    if (!user || !token) {
      console.error('❌ [ResourceUpload] Not authenticated:', { hasUser: !!user, hasToken: !!token });
      setErrorMessage('Not authenticated');
      setUploadStatus('error');
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    setUploadStatus('idle');
    setErrorMessage('');
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', title.trim());
      if (description.trim()) {
        formData.append('description', description.trim());
      }
      
      console.log('📦 [ResourceUpload] FormData created:', {
        hasFile: formData.has('file'),
        hasTitle: formData.has('title'),
        hasDescription: formData.has('description')
      });
      
      // Simulate progress (actual progress tracking requires xhr)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 200);
      
      // Upload to API
      const apiUrl = `/api/courses/${courseId}/lessons/${lessonId}/resources`;
      console.log('🌐 [ResourceUpload] Sending POST request:', {
        url: apiUrl,
        method: 'POST',
        hasAuthHeader: !!token
      });
      
      const response = await fetch(
        apiUrl,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        }
      );
      
      console.log('📡 [ResourceUpload] Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [ResourceUpload] Upload failed:', errorData);
        throw new Error(errorData.error || 'Upload failed');
      }
      
      const data = await response.json();
      console.log('✅ [ResourceUpload] Upload successful:', data);
      
      // Success!
      setUploadStatus('success');
      setUploading(false);
      
      if (onUploadComplete && data.resource) {
        onUploadComplete(data.resource);
      }
      
      // Reset form after 2 seconds
      setTimeout(() => {
        resetForm();
      }, 2000);
      
    } catch (error: any) {
      console.error('💥 [ResourceUpload] Upload error:', {
        error: error.message,
        stack: error.stack,
        type: error.constructor.name
      });
      setErrorMessage(error.message || 'Failed to upload file');
      setUploadStatus('error');
      setUploading(false);
      setUploadProgress(0);
      
      if (onError) {
        onError(error.message || 'Failed to upload file');
      }
    }
  };

  // Reset form
  const resetForm = () => {
    setSelectedFile(null);
    setTitle('');
    setDescription('');
    setUploadProgress(0);
    setUploadStatus('idle');
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove selected file
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadStatus('idle');
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Get file icon
  const getFileIcon = (file: File) => {
    const config = ALLOWED_FILE_TYPES[file.type as keyof typeof ALLOWED_FILE_TYPES];
    const IconComponent = config?.icon || File;
    return <IconComponent className="h-8 w-8 text-blue-500" />;
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Card className={`p-6 ${className || ''}`}>
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h3 className="text-lg font-semibold">Upload Resource</h3>
          <p className="text-sm text-muted-foreground">
            Add PDF, Word, PowerPoint, Excel, or text files to this lesson
          </p>
        </div>

        {/* Drag and Drop Area */}
        {!selectedFile && (
          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-colors duration-200
              ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : 'border-gray-300 hover:border-gray-400'}
            `}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-sm font-medium mb-1">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">
              PDF, DOC, DOCX, PPT, PPTX, XLSX, TXT (max 50MB)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xlsx,.txt"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>
        )}

        {/* Selected File Preview */}
        {selectedFile && (
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {getFileIcon(selectedFile)}
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>
              {!uploading && uploadStatus !== 'success' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Title Input */}
            <div className="space-y-2 mb-4">
              <Label htmlFor="resource-title">Title *</Label>
              <Input
                id="resource-title"
                placeholder="e.g., Lesson 1 Vocabulary List"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={uploading || uploadStatus === 'success'}
              />
            </div>

            {/* Description Input */}
            <div className="space-y-2 mb-4">
              <Label htmlFor="resource-description">Description (optional)</Label>
              <Textarea
                id="resource-description"
                placeholder="Add notes about this resource..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={uploading || uploadStatus === 'success'}
                rows={3}
              />
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Uploading...</span>
                  <span className="text-sm font-medium">{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Status Messages */}
            {uploadStatus === 'success' && (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 rounded-lg mb-4">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm font-medium">Upload successful!</span>
              </div>
            )}

            {uploadStatus === 'error' && errorMessage && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 rounded-lg mb-4">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">{errorMessage}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  console.log('🖱️ [ResourceUpload] Upload button clicked!');
                  handleUpload();
                }}
                disabled={uploading || uploadStatus === 'success' || !title.trim()}
                className="flex-1"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : uploadStatus === 'success' ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Uploaded
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Resource
                  </>
                )}
              </Button>
              
              {uploadStatus === 'success' && (
                <Button
                  variant="outline"
                  onClick={resetForm}
                >
                  Upload Another
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
