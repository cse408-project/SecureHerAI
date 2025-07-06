# Multi-Format Audio Transcription Service

## Overview

The SecureHerAI Azure Speech Service has been enhanced to support multiple audio formats including WebM, MP3, AAC, WAV, OGG, FLAC, and WMA. The service automatically converts unsupported formats to WAV before processing with Azure Speech-to-Text.

## Supported Audio Formats

| Format | MIME Type             | Extension   | Notes                      |
| ------ | --------------------- | ----------- | -------------------------- |
| WAV    | audio/wav, audio/wave | .wav        | Native Azure Speech format |
| MP3    | audio/mpeg, audio/mp3 | .mp3        | Converted to WAV           |
| AAC    | audio/mp4, audio/aac  | .aac, .m4a  | Converted to WAV           |
| WebM   | audio/webm            | .webm       | Converted to WAV           |
| OGG    | audio/ogg, audio/opus | .ogg, .opus | Converted to WAV           |
| FLAC   | audio/flac            | .flac       | Converted to WAV           |
| WMA    | audio/x-ms-wma        | .wma        | Converted to WAV           |

## Key Components

### 1. AudioFormatConverter (`AudioFormatConverter.java`)

- **Purpose**: Converts various audio formats to WAV using JAVE2/FFmpeg
- **Features**:
  - Automatic format detection using Apache Tika
  - Optimized conversion settings for Azure Speech (16kHz, mono, 16-bit PCM)
  - Temporary file management
  - Format validation

### 2. Enhanced AzureSpeechService (`AzureSpeechService.java`)

- **Purpose**: Main service for audio transcription
- **Features**:
  - Multi-format support through AudioFormatConverter
  - File and URL transcription
  - Automatic cleanup of temporary files
  - Enhanced error handling and logging

### 3. AudioTranscriptionController (`AudioTranscriptionController.java`)

- **Purpose**: REST API endpoints for audio transcription
- **Endpoints**:
  - `GET /api/audio/supported-formats` - List supported formats
  - `POST /api/audio/transcribe` - Upload and transcribe audio file
  - `POST /api/audio/transcribe-url` - Transcribe audio from URL
  - `GET /api/audio/health` - Health check

## Dependencies Added

```xml
<!-- JAVE2 for audio format conversion -->
<dependency>
    <groupId>ws.schild</groupId>
    <artifactId>jave-all-deps</artifactId>
    <version>3.5.0</version>
</dependency>

<!-- Apache Tika for audio format detection -->
<dependency>
    <groupId>org.apache.tika</groupId>
    <artifactId>tika-core</artifactId>
    <version>2.9.1</version>
</dependency>
<dependency>
    <groupId>org.apache.tika</groupId>
    <artifactId>tika-parsers-standard-package</artifactId>
    <version>2.9.1</version>
</dependency>
```

## Usage Examples

### 1. Check Supported Formats

```http
GET http://localhost:8080/api/audio/supported-formats
```

### 2. Upload Audio File for Transcription

```http
POST http://localhost:8080/api/audio/transcribe
Content-Type: multipart/form-data

file: your-audio-file.mp3
language: en-US
```

### 3. Transcribe Audio from URL

```http
POST http://localhost:8080/api/audio/transcribe-url
Content-Type: application/x-www-form-urlencoded

url=https://example.com/audio.webm&language=en-US
```

## Configuration

Ensure these environment variables are set:

```properties
# Azure Speech Service Configuration
azure.speech.key=your-azure-speech-key
azure.speech.region=your-azure-region
```

## File Structure

```
data/
├── temp/           # Temporary converted files
├── uploads/        # Uploaded files (cleaned after processing)
└── received/       # Downloaded files from URLs
```

## Conversion Process

1. **Format Detection**: Apache Tika detects the audio format
2. **Validation**: Check if format is supported
3. **Conversion**: JAVE2/FFmpeg converts to WAV if needed
   - Sample Rate: 16kHz
   - Channels: Mono
   - Bit Depth: 16-bit PCM
4. **Transcription**: Azure Speech processes the WAV file
5. **Cleanup**: Temporary files are automatically removed

## Error Handling

- **Unsupported Format**: Returns list of supported formats
- **Conversion Failure**: Detailed error message with troubleshooting info
- **Azure Speech Errors**: Proper error propagation with context
- **File I/O Errors**: Graceful handling with cleanup

## Performance Considerations

- **Memory Usage**: Large files are processed in chunks
- **Temporary Storage**: Files are cleaned up automatically
- **Conversion Time**: Depends on file size and format complexity
- **Azure Limits**: Respects Azure Speech service quotas

## Testing

Use the provided test file: `endpoints/audio_transcription_test.http`

Contains tests for:

- All supported audio formats
- File upload transcription
- URL-based transcription
- Error scenarios
- Different languages

## Logging

Enhanced logging provides:

- File format detection results
- Conversion progress and timing
- Temporary file management
- Azure Speech service interactions
- Error details with stack traces

## Security Notes

- File uploads are validated for format
- Temporary files are automatically cleaned
- URL downloads include basic validation
- No persistent storage of user audio data

## Future Enhancements

- Batch processing support
- Custom conversion settings
- Progress tracking for large files
- Streaming transcription for real-time audio
- Additional language detection
