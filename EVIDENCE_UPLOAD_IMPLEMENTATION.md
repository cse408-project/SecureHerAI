# Evidence Upload Implementation

## Overview
This document outlines the implementation of evidence upload functionality for incident reports using Cloudinary cloud storage and URL-based evidence management.

## Backend Implementation

### Key Changes
1. **Evidence Storage Model**: Evidence is now stored as URLs pointing to Cloudinary-hosted files, replacing the previous base64 approach.

2. **Database Schema**: 
   - `ReportEvidence` entity stores evidence metadata and Cloudinary URLs
   - `ReportEvidenceRepository` provides database operations
   - Evidence linked to reports via `reportId` foreign key

3. **API Implementation**:
   - `ReportService.uploadEvidence()` validates URLs and stores evidence metadata
   - URL validation ensures proper format (http/https)
   - File type detection based on URL extensions
   - Evidence retrieval integrated into report details

### API Endpoint
```http
POST /api/report/upload-evidence
Content-Type: application/json
Authorization: Bearer {token}

{
  "reportId": "uuid",
  "evidence": [
    "https://res.cloudinary.com/secureherai/image/upload/v123/report_evidence/photo1.jpg",
    "https://res.cloudinary.com/secureherai/video/upload/v124/report_evidence/video1.mp4"
  ],
  "description": "Evidence description"
}
```

## Frontend Implementation

### Cloudinary Service Enhancements
- `uploadEvidence()`: Upload files to 'report_evidence' folder
- `pickMultipleImagesFromGallery()`: Select multiple files for evidence
- `takeEvidencePhotoWithCamera()`: Capture evidence with camera
- `uploadMultipleEvidence()`: Batch upload multiple files

### Evidence Upload Screen (`report-evidence.tsx`)
- **Multi-file Support**: Users can select multiple photos/videos
- **Cloudinary Integration**: Files uploaded to cloud storage before database
- **Progress Tracking**: Visual indicators for upload status
- **File Preview**: Thumbnails and file type indicators
- **Error Handling**: Comprehensive error management and user feedback

### User Experience Features
- **Image/Video Picker**: Camera and gallery options
- **Upload Progress**: Real-time upload status with loading indicators
- **File Management**: Add/remove files before submission
- **Visual Feedback**: Success/error states and confirmation messages
- **Quick Access**: Evidence upload button directly from reports list

## Security Considerations

### URL Validation
- Backend validates all URLs for proper format
- Only HTTP/HTTPS protocols accepted
- File type validation based on extensions

### Access Control
- Evidence upload restricted to report owners
- Cloudinary upload using secure upload presets
- Evidence URLs stored in database for audit trail

## Supported File Types

### Images
- JPG, JPEG, PNG, GIF, BMP, WEBP

### Videos
- MP4, AVI, MOV, WMV, FLV, WEBM

### Audio (NEW)
- MP3, WAV, AAC, OGG, FLAC, M4A

### Documents
- PDF, DOC, DOCX, TXT

## Testing

### Backend Tests
Evidence upload tests included in `endpoints/report_test.http`:
- Valid evidence URL upload
- Multiple evidence files
- Error scenarios (invalid URLs, missing report ID)

### Example Test Data
```json
{
  "reportId": "eb8671f7-dab8-4366-8b6b-bdc761beede9",
  "evidence": [
    "https://res.cloudinary.com/secureherai/image/upload/v1234567892/report_evidence/evidence_1234567892.jpg",
    "https://res.cloudinary.com/secureherai/video/upload/v1234567893/report_evidence/evidence_1234567893.mp4"
  ],
  "description": "Photos and video evidence taken at the incident location"
}
```

## Environment Configuration

### Required Environment Variables
```env
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
EXPO_PUBLIC_CLOUDINARY_API_KEY=your_api_key
```

## Usage Flow

1. **User Access**: Navigate to evidence upload from report details or reports list
2. **File Selection**: Choose camera, gallery, or multiple files
3. **Cloud Upload**: Files automatically uploaded to Cloudinary
4. **Progress Tracking**: Visual feedback during upload process
5. **Database Storage**: Evidence URLs saved to database via API
6. **Confirmation**: Success feedback and navigation back to reports

## Benefits

- **Scalability**: Cloud storage handles large files efficiently
- **Performance**: URLs reduce database load compared to base64
- **Reliability**: Cloudinary provides robust file management
- **User Experience**: Smooth upload process with visual feedback
- **Security**: Proper validation and access controls

## Future Enhancements

- **File Size Limits**: Implement configurable size restrictions
- **Video Compression**: Automatic compression for large video files
- **Metadata Extraction**: Extract EXIF data from images
- **Thumbnail Generation**: Automatic thumbnail creation for previews
- **Batch Operations**: Bulk evidence management features
