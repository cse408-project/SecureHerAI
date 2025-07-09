# Audio File Display Fix Summary

## Issue
Audio files uploaded to the app were being displayed as "Video" in the evidence list/summary cards in `reports/details.tsx`, even though they were correctly detected as audio files during upload and displayed correctly in the evidence viewer modal.

## Root Cause
The issue was in the `getFileTypeFromUrl` function in `details.tsx`. This function checked URL path patterns before file extensions. Some audio files were uploaded before the full audio support was implemented, causing them to be stored in Cloudinary with incorrect URL paths like:

`https://res.cloudinary.com/cloudname/image/upload/v123456789/audio_file.mp3`

The function would see `/image/` in the URL and return 'image', even though the file extension was `.mp3`.

## Solution
Updated the `getFileTypeFromUrl` function in `details.tsx` to prioritize file extension detection over URL path detection:

1. **File Extension First**: Check the actual file extension to determine the true file type
2. **URL Path Fallback**: Only use URL path patterns if the extension is not recognized
3. **Audio Priority**: Audio extensions are checked first to prevent misclassification

## Changes Made

### app/reports/details.tsx
- Modified `getFileTypeFromUrl` function to check file extensions before URL paths
- This ensures audio files like `.mp3`, `.wav`, `.aac`, etc. are correctly identified regardless of their Cloudinary URL path

### app/(tabs)/reports.tsx
- Fixed unescaped entity issue: `haven't` → `haven&apos;t`

## Impact
- ✅ Audio files now correctly display as "Audio" in evidence lists
- ✅ Audio files uploaded before the fix are now properly recognized
- ✅ Evidence viewer modal continues to work correctly for all file types
- ✅ File type detection remains consistent across all screens
- ✅ No breaking changes to existing functionality

## Testing
Verified that the function correctly identifies:
- Audio files with incorrect URL paths (previously uploaded)
- Audio files with correct URL paths (newly uploaded)
- Video, image, and document files continue to work as expected
- All TypeScript types and linting pass
