# Azure Speech-to-Text Setup Instructions

## Quick Setup Guide

### 1. Azure Speech Service Setup

1. Go to [Azure Portal](https://portal.azure.com)
2. Create a new "Speech" resource under Cognitive Services
3. Copy the API key and region from the resource
4. Set environment variables:
   ```bash
   export AZURE_SPEECH_KEY="your-key-here"
   export AZURE_SPEECH_REGION="your-region-here" # e.g., "eastus", "westus2"
   ```

### 2. Test the Endpoint

#### Test with cURL (if you have a WAV file):

```bash
curl -X POST \
  http://localhost:8080/api/speech/transcribe \
  -F 'audio=@test-audio.wav'
```

#### Health Check:

```bash
curl http://localhost:8080/api/speech/health
```

### 3. Frontend Integration

The endpoint is already configured for CORS with your frontend URLs:

- `http://localhost:8081` (your Expo app)
- `http://localhost:3000` (alternative dev port)

### 4. Important Notes

- Audio files are automatically cleaned up after processing
- Maximum file size: 10MB
- Supported formats: WAV, MP3, FLAC, OGG
- The service uses English (US) language recognition by default
- Processing is done in real-time for files up to 30 seconds

### 5. Dependencies Added

- Azure Cognitive Services Speech SDK v1.44.0
- Multipart file upload configuration (10MB limit)

The implementation follows Azure best practices with proper error handling, logging, and resource cleanup.
