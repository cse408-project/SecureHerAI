# Azure Speech-to-Text API Documentation

## Overview

This endpoint provides Azure Speech-to-Text transcription capabilities for audio files. It accepts multipart form data with audio files and returns the transcribed text along with metadata.

## Endpoint

- **URL**: `/api/speech/transcribe`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`

## Request Parameters

- **audio** (required): Audio file to transcribe
  - Supported formats: WAV, MP3, FLAC, OGG
  - Maximum file size: 10MB
  - Form field name: `audio`

## Response Format

```json
{
  "success": true,
  "transcribedText": "Hello, this is a test transcription.",
  "confidence": 1.0,
  "message": "Speech recognized successfully",
  "fileName": "test-audio.wav",
  "processingTimeMs": 1250
}
```

## Response Fields

- **success**: Boolean indicating if transcription was successful
- **transcribedText**: The transcribed text from the audio
- **confidence**: Confidence score (0.0 to 1.0)
- **message**: Status message or error description
- **fileName**: Original filename of the uploaded audio
- **processingTimeMs**: Processing time in milliseconds

## Environment Variables Required

Before using this endpoint, set the following environment variables:

```bash
export AZURE_SPEECH_KEY="your-azure-speech-key"
export AZURE_SPEECH_REGION="your-azure-region"
```

## Example Usage

### cURL Example

```bash
curl -X POST \
  http://localhost:8080/api/speech/transcribe \
  -H 'Content-Type: multipart/form-data' \
  -F 'audio=@/path/to/your/audio-file.wav'
```

### JavaScript/Fetch Example

```javascript
const formData = new FormData();
formData.append("audio", audioFile); // audioFile is a File object

fetch("http://localhost:8080/api/speech/transcribe", {
  method: "POST",
  body: formData,
})
  .then((response) => response.json())
  .then((data) => {
    console.log("Transcription result:", data);
  });
```

### React Native Example

```javascript
const uploadAudio = async (audioUri) => {
  const formData = new FormData();
  formData.append("audio", {
    uri: audioUri,
    type: "audio/wav",
    name: "recording.wav",
  });

  try {
    const response = await fetch(
      "http://localhost:8080/api/speech/transcribe",
      {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Transcription error:", error);
    throw error;
  }
};
```

## Error Responses

### Invalid File Format (400 Bad Request)

```json
{
  "success": false,
  "transcribedText": "",
  "confidence": 0.0,
  "message": "Unsupported file format. Supported formats: WAV, MP3, FLAC, OGG",
  "fileName": "invalid-file.txt",
  "processingTimeMs": 10
}
```

### File Too Large (400 Bad Request)

```json
{
  "success": false,
  "transcribedText": "",
  "confidence": 0.0,
  "message": "File size exceeds maximum limit of 10 MB",
  "fileName": "large-file.wav",
  "processingTimeMs": 5
}
```

### No Speech Detected (200 OK)

```json
{
  "success": false,
  "transcribedText": "",
  "confidence": 0.0,
  "message": "No speech could be recognized in the audio file",
  "fileName": "silent-audio.wav",
  "processingTimeMs": 800
}
```

### Azure Service Error (500 Internal Server Error)

```json
{
  "success": false,
  "transcribedText": "",
  "confidence": 0.0,
  "message": "Internal server error during transcription: Azure Speech key is not configured",
  "fileName": "test-audio.wav",
  "processingTimeMs": 50
}
```

## Health Check

- **URL**: `/api/speech/health`
- **Method**: `GET`
- **Response**: `"Speech-to-Text service is running"`

## Notes

- Audio files are temporarily saved in `data/received/` directory and automatically deleted after processing
- The service supports real-time transcription for files up to 30 seconds
- For longer audio files, consider implementing batch transcription
- The endpoint uses Azure Speech-to-Text service with English (US) language by default
- Cross-Origin Resource Sharing (CORS) is enabled for localhost:8081 and localhost:3000
