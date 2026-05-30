# PDF & Document Integration Research
**Date:** October 26, 2025  
**Project:** DualLing - Language Learning Platform  
**Status:** Research & Architecture Design

---

## 📋 Executive Summary

This document provides comprehensive research on integrating PDF and document file support into DualLing's existing course structure. It includes:
- Current architecture analysis
- Storage solution comparison (Firebase Storage vs Google Cloud Storage)
- Cost-efficient implementation strategy
- Data model design
- Security and access control recommendations
- Implementation roadmap

---

## 🏗️ Current Architecture Analysis

### Existing Lesson Structure

**Current Lesson Types:**
```typescript
type LessonType = 'video' | 'reading' | 'quiz' | 'exercise';
```

**Firestore Schema (`courses/{courseId}/lessons/{lessonId}`):**
```typescript
interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  type: 'video' | 'reading' | 'quiz' | 'exercise';
  
  // Media
  videoUrl?: string;
  videoThumbnail?: string;
  duration?: number;
  contentMarkdown?: string;
  
  // Quiz data
  quizQuestions?: QuizQuestion[];
  passingScore?: number;
  
  // Publishing
  isPublished: boolean;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Existing Storage Infrastructure

✅ **Firebase Storage is already configured:**
- Storage bucket: `paji-duolingo.firebasestorage.app`
- Client SDK initialized in `lib/firebase/config.ts`
- Security rules configured in `storage.rules`
- Emulator support on port 9199

**Current Storage Rules:**
```javascript
// User profile pictures
match /users/{userId}/{allPaths=**} {
  allow read: if isAuthenticated();
  allow write: if isOwner(userId) || isAdmin();
}

// Course content (thumbnails, videos, resources)
match /courses/{courseId}/{allPaths=**} {
  allow read: if isAuthenticated();
  allow write: if isTeacher() || isAdmin();
}
```

**Existing File Upload Utilities:**
```typescript
// lib/api/apiUtils.ts
validateFileUpload(file: File, options: {
  maxSize?: number;        // Default: 5MB
  allowedTypes?: string[]; // Default: images only
})
```

---

## 💰 Storage Solution Comparison

### Firebase Storage vs Google Cloud Storage

| Feature | Firebase Storage | Google Cloud Storage |
|---------|------------------|---------------------|
| **Pricing Model** | Pay-as-you-go | Pay-as-you-go |
| **Free Tier** | 5GB stored, 1GB/day downloads, 20K/day uploads | None (charges from $0.01) |
| **Storage Cost** | $0.026/GB/month | $0.020/GB/month (Standard) |
| **Download Cost** | $0.12/GB | $0.12/GB (same) |
| **Upload Cost** | Free | Free |
| **Integration** | ✅ Native Firebase SDK | Requires GCS SDK |
| **Authentication** | ✅ Firebase Auth built-in | Requires IAM setup |
| **Security Rules** | ✅ Declarative rules | IAM policies |
| **CDN** | ✅ Automatic via Firebase | Manual setup |
| **Best For** | Small to medium apps | Enterprise scale |

### Cost Projection (Monthly)

**Scenario: 1,000 active users, 50 courses, 500 PDFs**

#### Firebase Storage (RECOMMENDED ✅)
```
Storage (20GB):        $0.52
Downloads (50GB):      $6.00
Uploads (5GB):         $0.00 (free)
-----------------------------------
TOTAL:                 ~$6.52/month
```

#### Google Cloud Storage
```
Storage (20GB):        $0.40
Downloads (50GB):      $6.00
Uploads (5GB):         $0.00 (free)
API Calls:             $0.10
-----------------------------------
TOTAL:                 ~$6.50/month
```

**Verdict:** Firebase Storage is MORE cost-efficient when considering:
- 5GB free storage (saves ~$0.13/month)
- No setup/integration cost (already configured)
- Built-in CDN and authentication
- Simpler developer experience
- Free tier covers initial growth

---

## 🎯 Recommended Solution: Firebase Storage

### Why Firebase Storage?

1. **Already Configured** ✅
   - Storage bucket active
   - Security rules in place
   - SDK initialized
   - No additional setup needed

2. **Cost-Efficient** 💰
   - 5GB free storage tier
   - 1GB/day free downloads
   - No API call charges
   - Automatic CDN included

3. **Developer-Friendly** 👨‍💻
   - Native Firebase SDK
   - Works with existing Firebase Auth
   - Simple upload/download APIs
   - Built-in progress tracking

4. **Scalable** 📈
   - Handles files up to 5TB each
   - Global CDN distribution
   - Automatic resumable uploads
   - Easy to upgrade to GCS later

---

## 📐 Architecture Design

### 1. Data Model Extension

#### Extended Lesson Type
```typescript
// Add new lesson resource type
interface LessonResource {
  id: string;
  type: 'pdf' | 'doc' | 'docx' | 'ppt' | 'pptx' | 'xlsx' | 'txt';
  title: string;
  description?: string;
  fileUrl: string;           // Firebase Storage URL
  fileName: string;          // Original file name
  fileSize: number;          // Size in bytes
  mimeType: string;          // MIME type
  uploadedAt: Timestamp;
  uploadedBy: string;        // Teacher UID
}

// Extended Lesson interface
interface Lesson {
  // ... existing fields ...
  
  // NEW: Resources array
  resources?: LessonResource[];
  
  // NEW: Primary resource (backward compatible)
  primaryResourceUrl?: string;
  primaryResourceType?: 'pdf' | 'doc' | 'docx' | 'ppt' | 'pptx';
}
```

#### Firestore Schema Update
```typescript
// courses/{courseId}/lessons/{lessonId}
{
  // Existing fields...
  
  // NEW: Multiple resources support
  resources: [
    {
      id: "resource_1",
      type: "pdf",
      title: "Week 1 Vocabulary Guide",
      description: "Complete vocabulary list with examples",
      fileUrl: "gs://bucket/courses/{courseId}/lessons/{lessonId}/vocab-guide.pdf",
      fileName: "vocab-guide.pdf",
      fileSize: 2048576, // 2MB
      mimeType: "application/pdf",
      uploadedAt: Timestamp,
      uploadedBy: "teacher_uid"
    }
  ],
  
  // OPTIONAL: Quick access to primary resource
  primaryResourceUrl: "gs://...",
  primaryResourceType: "pdf"
}
```

### 2. Storage Structure

#### Recommended Folder Hierarchy
```
paji-duolingo.firebasestorage.app/
├── courses/
│   ├── {courseId}/
│   │   ├── thumbnail.jpg           (course cover)
│   │   ├── lessons/
│   │   │   ├── {lessonId}/
│   │   │   │   ├── resources/
│   │   │   │   │   ├── {resourceId}.pdf
│   │   │   │   │   ├── {resourceId}.docx
│   │   │   │   │   └── thumbnails/
│   │   │   │   │       └── {resourceId}_thumb.png
│   │   │   │   ├── videos/
│   │   │   │   │   └── lesson-video.mp4
│   │   │   │   └── images/
│   │   │   │       └── diagram.png
│   │   │   └── ...
│   │   └── ...
│   └── ...
├── users/
│   └── {userId}/
│       └── profile-picture.jpg
└── public/
    └── assets/
```

**Naming Convention:**
```javascript
// Resource path template
`courses/${courseId}/lessons/${lessonId}/resources/${resourceId}.${ext}`

// Example
"courses/2l7VdVb0JbXRGs0zlgLb/lessons/abc123/resources/res_456.pdf"
```

### 3. Security Rules Enhancement

#### Updated `storage.rules`
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isTeacher() {
      return request.auth.token.role == 'teacher' || 
             request.auth.token.role == 'admin';
    }
    
    function isValidDocumentType() {
      return request.resource.contentType.matches(
        'application/pdf|' +
        'application/msword|' +
        'application/vnd.openxmlformats-officedocument.*|' +
        'application/vnd.ms-powerpoint|' +
        'text/plain'
      );
    }
    
    function isValidFileSize() {
      // Max 50MB for documents
      return request.resource.size <= 50 * 1024 * 1024;
    }
    
    // Course resources (PDFs, documents)
    match /courses/{courseId}/lessons/{lessonId}/resources/{resource} {
      // All authenticated users can read
      allow read: if isAuthenticated();
      
      // Only teachers can upload/delete
      allow write: if isTeacher() && 
                      isValidDocumentType() && 
                      isValidFileSize();
    }
    
    // Course thumbnails
    match /courses/{courseId}/thumbnail.{ext} {
      allow read: if true;  // Public
      allow write: if isTeacher();
    }
    
    // User profile pictures
    match /users/{userId}/{allPaths=**} {
      allow read: if isAuthenticated();
      allow write: if request.auth.uid == userId;
    }
  }
}
```

### 4. File Upload Implementation

#### Backend API: `/api/courses/[id]/lessons/[lessonId]/resources`

**POST - Upload Resource**
```typescript
// app/api/courses/[id]/lessons/[lessonId]/resources/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase/admin';
import { getStorage } from 'firebase-admin/storage';
import { getAdminDb } from '@/lib/firebase/admin';
import { v4 as uuidv4 } from 'uuid';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; lessonId: string } }
) {
  try {
    // 1. Verify authentication & teacher role
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const decodedToken = await verifyIdToken(token);
    
    if (decodedToken.role !== 'teacher' && decodedToken.role !== 'admin') {
      return NextResponse.json(
        { error: 'Teacher access required' },
        { status: 403 }
      );
    }
    
    // 2. Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // 3. Validate file
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: PDF, DOC, DOCX, PPT, PPTX, XLSX, TXT' },
        { status: 400 }
      );
    }
    
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size: 50MB' },
        { status: 400 }
      );
    }
    
    // 4. Generate resource ID and path
    const resourceId = uuidv4();
    const fileExt = file.name.split('.').pop();
    const storagePath = `courses/${params.id}/lessons/${params.lessonId}/resources/${resourceId}.${fileExt}`;
    
    // 5. Upload to Firebase Storage
    const bucket = getStorage().bucket();
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    const storageFile = bucket.file(storagePath);
    await storageFile.save(fileBuffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          uploadedBy: decodedToken.uid,
          uploadedAt: new Date().toISOString(),
          originalName: file.name
        }
      }
    });
    
    // 6. Get signed URL (1 year expiry)
    const [signedUrl] = await storageFile.getSignedUrl({
      action: 'read',
      expires: Date.now() + 365 * 24 * 60 * 60 * 1000 // 1 year
    });
    
    // 7. Create resource document
    const resource: LessonResource = {
      id: resourceId,
      type: fileExt as any,
      title: title || file.name,
      description: description || '',
      fileUrl: `gs://${bucket.name}/${storagePath}`,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      uploadedAt: new Date(),
      uploadedBy: decodedToken.uid
    };
    
    // 8. Update Firestore lesson document
    const db = getAdminDb();
    const lessonRef = db
      .collection('courses')
      .doc(params.id)
      .collection('lessons')
      .doc(params.lessonId);
    
    await lessonRef.update({
      resources: FieldValue.arrayUnion(resource),
      updatedAt: FieldValue.serverTimestamp()
    });
    
    return NextResponse.json({
      success: true,
      resource: {
        ...resource,
        downloadUrl: signedUrl
      }
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload resource' },
      { status: 500 }
    );
  }
}

// GET - List lesson resources
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; lessonId: string } }
) {
  try {
    const db = getAdminDb();
    const lessonDoc = await db
      .collection('courses')
      .doc(params.id)
      .collection('lessons')
      .doc(params.lessonId)
      .get();
    
    if (!lessonDoc.exists) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }
    
    const resources = lessonDoc.data()?.resources || [];
    
    // Generate download URLs for each resource
    const bucket = getStorage().bucket();
    const resourcesWithUrls = await Promise.all(
      resources.map(async (resource: LessonResource) => {
        const path = resource.fileUrl.replace(`gs://${bucket.name}/`, '');
        const file = bucket.file(path);
        const [signedUrl] = await file.getSignedUrl({
          action: 'read',
          expires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
        });
        
        return {
          ...resource,
          downloadUrl: signedUrl
        };
      })
    );
    
    return NextResponse.json({
      success: true,
      resources: resourcesWithUrls
    });
    
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resources' },
      { status: 500 }
    );
  }
}
```

#### Frontend Upload Component

**`components/teacher/resource-upload.tsx`**
```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, X } from 'lucide-react';

interface ResourceUploadProps {
  courseId: string;
  lessonId: string;
  token: string;
  onUploadComplete: (resource: any) => void;
}

export function ResourceUpload({
  courseId,
  lessonId,
  token,
  onUploadComplete
}: ResourceUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain'
      ];
      
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Invalid file type. Please upload PDF, DOC, DOCX, PPT, or TXT files.');
        return;
      }
      
      // Validate file size (50MB max)
      const maxSize = 50 * 1024 * 1024;
      if (selectedFile.size > maxSize) {
        setError('File too large. Maximum size is 50MB.');
        return;
      }
      
      setFile(selectedFile);
      setTitle(selectedFile.name);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    setProgress(0);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('description', description);
      
      const response = await fetch(
        `/api/courses/${courseId}/lessons/${lessonId}/resources`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }
      
      const data = await response.json();
      setProgress(100);
      
      // Reset form
      setFile(null);
      setTitle('');
      setDescription('');
      
      // Notify parent
      onUploadComplete(data.resource);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="space-y-2">
        <Label htmlFor="file-upload">Upload Document</Label>
        <div className="flex items-center gap-2">
          <Input
            id="file-upload"
            type="file"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
            onChange={handleFileChange}
            disabled={uploading}
          />
          {file && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setFile(null)}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-sm text-gray-500">
          Accepted: PDF, DOC, DOCX, PPT, PPTX, TXT (max 50MB)
        </p>
      </div>
      
      {file && (
        <>
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
            <FileText className="h-5 w-5 text-blue-600" />
            <div className="flex-1">
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-gray-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="resource-title">Title</Label>
            <Input
              id="resource-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Resource title"
              disabled={uploading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="resource-description">Description (Optional)</Label>
            <Input
              id="resource-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description"
              disabled={uploading}
            />
          </div>
          
          {uploading && (
            <Progress value={progress} className="w-full" />
          )}
          
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          
          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Uploading...' : 'Upload Resource'}
          </Button>
        </>
      )}
    </div>
  );
}
```

### 5. Student View Component

**`components/lessons/resource-list.tsx`**
```typescript
'use client';

import { FileText, Download, FileIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Resource {
  id: string;
  type: string;
  title: string;
  description?: string;
  fileName: string;
  fileSize: number;
  downloadUrl: string;
  uploadedAt: Date;
}

interface ResourceListProps {
  resources: Resource[];
}

export function ResourceList({ resources }: ResourceListProps) {
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-6 w-6 text-red-600" />;
      case 'doc':
      case 'docx':
        return <FileIcon className="h-6 w-6 text-blue-600" />;
      case 'ppt':
      case 'pptx':
        return <FileIcon className="h-6 w-6 text-orange-600" />;
      default:
        return <FileText className="h-6 w-6 text-gray-600" />;
    }
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };
  
  if (!resources || resources.length === 0) {
    return null;
  }
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Lesson Resources</h3>
      <div className="space-y-2">
        {resources.map((resource) => (
          <Card key={resource.id}>
            <CardContent className="flex items-center gap-4 p-4">
              {getFileIcon(resource.type)}
              
              <div className="flex-1">
                <h4 className="font-medium">{resource.title}</h4>
                {resource.description && (
                  <p className="text-sm text-gray-600">{resource.description}</p>
                )}
                <p className="text-xs text-gray-500">
                  {resource.fileName} • {formatFileSize(resource.fileSize)}
                </p>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(resource.downloadUrl, '_blank')}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

---

## 📦 Implementation Roadmap

### Phase 1: Backend Infrastructure (2-3 days)

**Day 1: Data Model & API**
- [ ] Update `lib/types/course.types.ts` with `LessonResource` interface
- [ ] Create API route: `/api/courses/[id]/lessons/[lessonId]/resources/route.ts`
- [ ] Implement POST (upload) endpoint with validation
- [ ] Implement GET (list resources) endpoint
- [ ] Add DELETE endpoint for resource removal
- [ ] Write unit tests

**Day 2: Storage & Security**
- [ ] Update `storage.rules` with document upload rules
- [ ] Configure file type validation
- [ ] Set up signed URL generation
- [ ] Test security rules in emulator
- [ ] Document storage path conventions

**Day 3: Repository Layer**
- [ ] Create `lib/services/resources/resource.repository.ts`
- [ ] Implement CRUD operations
- [ ] Add error handling and logging
- [ ] Integration tests

### Phase 2: Teacher UI (2 days)

**Day 4: Upload Component**
- [ ] Create `components/teacher/resource-upload.tsx`
- [ ] Implement file picker with validation
- [ ] Add upload progress indicator
- [ ] Handle errors gracefully
- [ ] Test with various file types

**Day 5: Lesson Modal Integration**
- [ ] Integrate resource upload into `components/teacher/lesson-modal.tsx`
- [ ] Add resource management section
- [ ] Implement delete functionality
- [ ] Update lesson edit page

### Phase 3: Student UI (1 day)

**Day 6: Display Components**
- [ ] Create `components/lessons/resource-list.tsx`
- [ ] Integrate into `components/lessons/lesson-viewer.tsx`
- [ ] Add download tracking (optional analytics)
- [ ] Test on mobile devices

### Phase 4: Testing & Polish (1 day)

**Day 7: QA & Documentation**
- [ ] End-to-end testing (upload → view → download)
- [ ] Test file size limits
- [ ] Test invalid file types
- [ ] Performance testing with large files
- [ ] Update user documentation
- [ ] Create video tutorial for teachers

---

## 🔒 Security Considerations

### File Type Validation

**Frontend Validation:**
```typescript
const allowedTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain'
];
```

**Backend Validation:**
- MIME type checking
- File extension validation
- Magic number verification (future enhancement)

### File Size Limits

- **Maximum file size:** 50MB per document
- **Rationale:** Balance between usability and cost
- **Total storage per course:** No limit (monitored)

### Access Control

1. **Upload:** Teachers & Admins only
2. **Download:** All authenticated enrolled students
3. **Delete:** Course owner only
4. **Storage Rules:** Declarative Firebase rules

### Virus Scanning (Future Enhancement)

Consider integrating Cloud Storage virus scanning:
- Automatic scanning on upload
- Quarantine suspicious files
- Notify admins of threats

---

## 📊 Monitoring & Analytics

### Metrics to Track

1. **Storage Usage**
   - Total storage per course
   - Storage growth rate
   - Cost per month

2. **Usage Metrics**
   - Download counts per resource
   - Most popular resources
   - Engagement rate

3. **Error Tracking**
   - Failed uploads
   - Invalid file types
   - Size limit violations

### Firebase Console Monitoring

```
Firebase Console → Storage
├── Usage (GB stored, downloads, uploads)
├── Files (browse, search, delete)
└── Rules (test, debug)
```

---

## 💡 Future Enhancements

### Short-term (3-6 months)
- [ ] PDF preview in browser (PDF.js)
- [ ] Document thumbnails generation
- [ ] Resource versioning (v1, v2, etc.)
- [ ] Bulk upload (zip files)

### Medium-term (6-12 months)
- [ ] In-app PDF viewer/annotator
- [ ] Convert DOC/DOCX to PDF automatically
- [ ] Video resource support (not just YouTube)
- [ ] Audio file support (MP3, WAV)

### Long-term (12+ months)
- [ ] AI-powered document summarization
- [ ] Automatic quiz generation from PDFs
- [ ] OCR for scanned documents
- [ ] Interactive presentations (H5P)

---

## 🎓 Usage Examples

### Teacher Workflow

1. **Create Lesson** → Select "Reading" type
2. **Add Resource** → Click "Upload Document"
3. **Choose File** → Select PDF from computer
4. **Add Details** → Title: "Week 1 Vocabulary"
5. **Upload** → Wait for completion
6. **Publish Lesson** → Students can now access

### Student Workflow

1. **Open Lesson** → Navigate to course
2. **View Resources** → See list of available documents
3. **Download** → Click download button
4. **Study** → Open PDF in preferred reader

---

## ❓ FAQ

**Q: Can students upload files?**  
A: Not in Phase 1. This will be added in Phase 4 (Assignments System).

**Q: What if a teacher uploads the wrong file?**  
A: Teachers can delete resources and re-upload. Version history coming later.

**Q: Are downloads tracked?**  
A: Not initially. Analytics can be added in Phase 2 if needed.

**Q: Can resources be reused across lessons?**  
A: Not automatically. Teachers must re-upload or we can add "resource library" feature.

**Q: What happens if storage costs exceed budget?**  
A: Firebase alerts can be configured. We can also implement storage quotas per teacher.

---

## 📞 Next Steps

1. **Review this document** with the team
2. **Approve architecture** and cost estimates
3. **Prioritize features** (MVP vs nice-to-have)
4. **Begin Phase 1** implementation
5. **Set up monitoring** dashboards

---

## 📚 References

- [Firebase Storage Documentation](https://firebase.google.com/docs/storage)
- [Firebase Storage Pricing](https://firebase.google.com/pricing)
- [Firebase Security Rules](https://firebase.google.com/docs/storage/security)
- [Next.js File Upload](https://nextjs.org/docs/app/building-your-application/routing/route-handlers#request-body)
- [Firebase Admin SDK - Storage](https://firebase.google.com/docs/admin/setup)

---

**Document Version:** 1.0  
**Last Updated:** October 26, 2025  
**Author:** GitHub Copilot  
**Status:** Ready for Review ✅
