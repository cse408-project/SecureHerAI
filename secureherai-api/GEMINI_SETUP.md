# Gemini AI Audio Transcription Setup Guide

This guide explains how to set up and use Gemini AI for audio transcription with emotion detection in the SecureHerAI API.

## Overview

SecureHerAI uses **Gemini 2.5 Flash** for advanced audio transcription with the following features:

- **High-accuracy transcription** - Converts speech to text with high confidence
- **Emotion detection** - Detects emotions: happy, sad, angry, neutral, fearful, anxious
- **Language detection** - Auto-detects spoken language
- **Urgency detection** - Identifies urgent/distressed speech patterns
- **Summary generation** - Provides brief summaries of audio content
- **Multiple audio formats** - Supports WAV, MP3, AAC, WebM, OGG, FLAC

## Prerequisites

1. **Google Cloud Account** with Gemini API access
2. **API Key** from Google AI Studio (https://aistudio.google.com/apikey)

## Setup Steps

### 1. Get Your Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

**Note**: You can use the same API key used for Google Maps if you've already enabled the Generative Language API.

### 2. Enable Required APIs

In your Google Cloud Console, ensure these APIs are enabled:
- **Generative Language API** (for Gemini)

### 3. Configure Environment Variables

Add the following to your `.env` file in the `secureherai-api` directory:

```env
# Gemini AI API Key (same key works for Google Maps if enabled)
GOOGLE_CLOUD_API_KEY=your_gemini_api_key_here
```

### 4. Docker Configuration

The `docker-compose-dev.yml` and `docker-compose-deploy.yml` files are already configured to pass the API key:

```yaml
environment:
  - GOOGLE_CLOUD_API_KEY=${GOOGLE_CLOUD_API_KEY}
```

### 5. Application Configuration

The `application.properties` file contains the Gemini configuration:

```properties
# Gemini AI Configuration
gemini.api.key=${GOOGLE_CLOUD_API_KEY:}
gemini.model=gemini-2.5-flash
```

## API Endpoints

### POST /api/speech/transcribe

Transcribes an audio file with emotion detection.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Parameter: `audio` (the audio file)

**Response:**
```json
{
  "success": true,
  "transcribedText": "Help, I need assistance!",
  "confidence": 0.92,
  "message": "Transcription successful",
  "fileName": "recording.wav",
  "processingTimeMs": 2340,
  "emotion": "fearful",
  "language": "English",
  "languageCode": "en-US",
  "urgent": true,
  "distressed": true,
  "summary": "A person calling for emergency help in a distressed voice"
}
```

### GET /api/speech/health

Health check endpoint for the speech service.

**Response:**
```
Speech-to-Text service is running
```

## Supported Audio Formats

| Format | MIME Types |
|--------|-----------|
| WAV | `audio/wav`, `audio/wave`, `audio/vnd.wave` |
| MP3 | `audio/mpeg`, `audio/mp3` |
| AAC | `audio/aac`, `audio/mp4` |
| WebM | `audio/webm`, `video/webm` |
| OGG | `audio/ogg`, `audio/vorbis`, `audio/opus` |
| FLAC | `audio/flac` |
| WMA | `audio/x-ms-wma` |

## Emotion Detection

The service detects the following emotions in speech:

| Emotion | Description |
|---------|-------------|
| `happy` | Joyful, positive tone |
| `sad` | Melancholic, low energy |
| `angry` | Aggressive, frustrated |
| `neutral` | Calm, standard tone |
| `fearful` | Scared, panicked |
| `anxious` | Worried, nervous |

## SOS Integration

The SOSService automatically uses Gemini for voice command processing:

1. User sends audio recording
2. Gemini transcribes and analyzes the audio
3. If SOS keywords detected AND (distress detected OR urgency flagged):
   - Alert is created with high priority
   - Emergency contacts notified
   - Responders alerted

## Pricing

Gemini API pricing (as of 2025):
- **Gemini 2.5 Flash**: Pay-as-you-go, free tier available
- Audio is counted at ~32 tokens per second
- See [Gemini Pricing](https://ai.google.dev/gemini-api/docs/pricing) for current rates

## Troubleshooting

### "API key not configured"
Ensure `GOOGLE_CLOUD_API_KEY` is set in your environment or `.env` file.

### "Unsupported audio format"
Convert your audio to WAV or MP3 format. The service supports auto-conversion for most formats.

### "Request too large"
Audio files must be under 20MB for inline processing. For larger files, the audio will be uploaded first.

### "Model not found"
Ensure you're using a valid Gemini model name. Default is `gemini-2.5-flash`.

## Migration from Azure/Google Cloud Speech

This project migrated from Azure Cognitive Services Speech-to-Text:

| Before | After |
|--------|-------|
| Azure Speech SDK | Gemini 2.5 Flash API |
| Service account credentials | Simple API key |
| Text-only output | Text + emotion + urgency |
| Azure VM deployment | Render.com deployment |

## Files Modified

- `GeminiSpeechService.java` - Main transcription service
- `SpeechController.java` - REST API controller
- `SOSService.java` - SOS processing integration
- `SpeechTranscriptionResponseDto.java` - Response with emotion fields
- `application.properties` - Gemini configuration
- `pom.xml` - OkHttp dependency (no SDK required)

## Testing

Run the unit tests:
```bash
cd secureherai-api
./mvnw test -Dtest=GeminiSpeechServiceTest
./mvnw test -Dtest=SpeechControllerTest
```

## Further Resources

- [Gemini API Documentation](https://ai.google.dev/gemini-api/docs)
- [Audio Understanding Guide](https://ai.google.dev/gemini-api/docs/audio)
- [API Key Setup](https://aistudio.google.com/apikey)
