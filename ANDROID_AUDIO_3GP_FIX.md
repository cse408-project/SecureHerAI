# Android Audio 3GP Format Fix

## Issue Description

After implementing the M4A format configuration for Android audio recording, the system was still producing `.3gp` files instead of `.m4a` files. The logs showed:

```
Audio uploaded successfully: https://res.cloudinary.com/dhb8x5ucj/video/upload/v1753808530/report_evidence/vcdvo2fxoey8tpgjxuzj.3gp
```

This indicated that the recording options were not being properly applied to the `expo-audio` recorder.

## Root Cause Analysis

The issue was in the `audioRecordingService.ts` file where the `startRecording` method was calling:

```typescript
await recorder.prepareToRecordAsync(); // No options passed
```

The recording options configured in `getRecordingOptions()` were not being passed to the `prepareToRecordAsync` method, causing the recorder to use default settings which result in `.3gp` format on Android.

## Solution Implemented

### 1. Fixed Recording Options Application

**File**: `services/audioRecordingService.ts`

**Before**:
```typescript
async startRecording(recorder: any): Promise<AudioRecordingResult> {
  // ... permission checks
  console.log("🎙️ Starting audio recording...");
  
  // Prepare the recorder
  await recorder.prepareToRecordAsync();
  
  // Start recording
  recorder.record();
  // ...
}
```

**After**:
```typescript
async startRecording(recorder: any): Promise<AudioRecordingResult> {
  // ... permission checks
  console.log("🎙️ Starting audio recording...");
  console.log("📝 Recording options:", this.getRecordingOptions());

  // Prepare the recorder with explicit recording options
  await recorder.prepareToRecordAsync(this.getRecordingOptions());

  // Start recording
  recorder.record();
  // ...
}
```

### 2. Added Debug Logging

Added logging to verify that the correct recording options are being applied:
- Log the recording options before calling `prepareToRecordAsync`
- This helps verify that the M4A configuration is being passed correctly

## Expected Results

With this fix, Android recordings should now:

1. **Produce M4A files** instead of 3GP files
2. **Use AAC codec** for better Azure Speech compatibility
3. **Have proper MIME types** when uploaded to Cloudinary
4. **Work correctly** with Azure Speech-to-Text backend

The expected log output should now show:
```
📝 Recording options: {
  extension: '.m4a',
  outputFormat: 'mpeg4',
  audioEncoder: 'aac',
  sampleRate: 16000,
  numberOfChannels: 1,
  bitRate: 128000
}
Audio uploaded successfully: https://res.cloudinary.com/dhb8x5ucj/video/upload/v1753808530/report_evidence/vcdvo2fxoey8tpgjxuzj.m4a
```

## Technical Context

### Recording Configuration Chain
1. `useAudioRecording` hook calls `audioRecordingService.getRecordingOptions()`
2. `useAudioRecorder` from expo-audio is initialized with these options
3. `startRecording` calls `prepareToRecordAsync()` with explicit options
4. Recording produces M4A file with AAC codec optimized for speech recognition

### Platform-Specific Settings
- **Android**: Custom M4A/AAC configuration for Azure Speech compatibility
- **iOS**: Same M4A/AAC configuration for consistency
- **Sample Rate**: 16kHz optimal for speech recognition
- **Channels**: Mono (1 channel)
- **Bitrate**: 128kbps for good speech quality

## Testing Instructions

1. **Test SOS Voice Recording on Android**:
   - Open SOS modal
   - Record a voice message
   - Check console logs for recording options
   - Verify uploaded file has `.m4a` extension
   - Confirm SOS submission succeeds

2. **Verify Backend Processing**:
   - Ensure Azure Speech-to-Text can process the M4A files
   - Check that SOS alerts are properly created
   - Validate speech-to-text transcription works

3. **Test Cross-Platform**:
   - Test on iOS to ensure no regression
   - Test on web platform if applicable
   - Verify all platforms produce M4A files

## Validation

- ✅ TypeScript compilation passes
- ✅ Linting passes with no errors
- ✅ Recording options properly passed to prepareToRecordAsync
- ✅ Debug logging added for troubleshooting
- ✅ 3GP MIME type detection added to Cloudinary service
- ✅ resource_type: 'auto' configured for 3GP files
- ✅ isAudioFile method updated to include 3GP files
- ⏳ Runtime testing needed to confirm M4A file generation OR proper 3GP handling

## Related Files Modified

- `services/audioRecordingService.ts` - Fixed recording options application
- Previous fixes maintained:
  - `getRecordingOptions()` method with M4A configuration
  - `getPlatformInfo()` method with correct format info

## Rollback Plan

If issues arise, the change can be reverted by removing the recording options parameter:

```typescript
await recorder.prepareToRecordAsync(); // Revert to no options
```

This would restore the previous behavior but return to 3GP format issue.

---

**Generated**: 2025-01-29
**Status**: Ready for testing
**Priority**: High - Critical for SOS voice functionality on Android
