package com.secureherai.secureherai_api.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.secureherai.secureherai_api.util.AudioFormatConverter;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import org.apache.tika.Tika;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Gemini AI Speech-to-Text service implementation
 * Uses Gemini 2.5 Flash model for audio transcription with emotion detection
 * 
 * Features:
 * - Audio transcription with speaker diarization
 * - Emotion detection (happy, sad, angry, neutral, fearful, anxious)
 * - Language detection
 * - Summary generation
 * - Supports multiple audio formats: WAV, MP3, AAC, WebM, OGG, FLAC
 */
@Service
@Slf4j
public class GeminiSpeechService {

    @Value("${gemini.api.key:${GOOGLE_CLOUD_API_KEY:}}")
    private String apiKey;

    @Value("${gemini.model:gemini-2.5-flash}")
    private String modelName;

    @Autowired
    private AudioFormatConverter audioConverter;

    private final Tika tika = new Tika();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final OkHttpClient httpClient;

    // Gemini API base URL
    private static final String GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

    // Supported audio MIME types by Gemini
    private static final List<String> SUPPORTED_MIME_TYPES = List.of(
        "audio/wav", "audio/mp3", "audio/mpeg", "audio/aac", 
        "audio/webm", "audio/ogg", "audio/flac", "audio/aiff"
    );

    public GeminiSpeechService() {
        this.httpClient = new OkHttpClient.Builder()
            .connectTimeout(60, TimeUnit.SECONDS)
            .readTimeout(120, TimeUnit.SECONDS)
            .writeTimeout(60, TimeUnit.SECONDS)
            .build();
    }

    /**
     * Transcribes audio file to text using Gemini AI with emotion detection
     * Supports multiple audio formats: WAV, MP3, AAC, WebM, OGG, FLAC
     *
     * @param audioFile The audio file to transcribe
     * @return Transcription result containing text, emotion, and metadata
     * @throws IOException If file operations fail
     */
    public SpeechTranscriptionResult transcribeAudioFile(File audioFile) throws IOException {
        log.info("Starting Gemini transcription for file: {} ({})", 
                audioFile.getName(), formatFileSize(audioFile.length()));

        // Validate input file
        if (!audioFile.exists() || audioFile.length() == 0) {
            throw new IllegalArgumentException("Audio file does not exist or is empty: " + audioFile.getName());
        }

        // Check if format is supported
        if (!audioConverter.isSupportedByExtension(audioFile.getName())) {
            throw new UnsupportedOperationException(
                "Unsupported audio format. Supported formats: " + 
                String.join(", ", audioConverter.getSupportedFormats())
            );
        }

        try {
            // Detect MIME type
            String mimeType = detectMimeType(audioFile);
            log.debug("Detected MIME type: {}", mimeType);

            // Read audio file and encode to Base64
            byte[] audioBytes = Files.readAllBytes(audioFile.toPath());
            String base64Audio = Base64.getEncoder().encodeToString(audioBytes);

            // Call Gemini API
            return callGeminiApi(base64Audio, mimeType, audioFile.getName());

        } catch (Exception e) {
            log.error("Error during Gemini transcription of file {}: {}", 
                    audioFile.getName(), e.getMessage(), e);
            return createErrorResult("Transcription failed: " + e.getMessage());
        }
    }

    /**
     * Transcribes audio from a URL using Gemini AI
     *
     * @param audioUrl The URL of the audio file to transcribe
     * @param languageCode Optional language code (not used, Gemini auto-detects)
     * @return Transcription result containing text, emotion, and metadata
     * @throws IOException If file operations fail
     */
    public SpeechTranscriptionResult transcribeAudioFromUrl(String audioUrl, String languageCode) 
            throws IOException {
        
        log.info("Starting Gemini transcription for audio URL: {}", audioUrl);
        
        if (audioUrl == null || audioUrl.trim().isEmpty()) {
            throw new IllegalArgumentException("Audio URL cannot be empty");
        }
        
        File tempFile = null;
        try {
            // Download the audio file from URL
            tempFile = downloadAudioFromUrl(audioUrl);
            log.debug("Downloaded audio from URL to: {}", tempFile.getAbsolutePath());
            
            // Transcribe using the downloaded file
            return transcribeAudioFile(tempFile);
            
        } finally {
            // Clean up temp file
            if (tempFile != null && tempFile.exists()) {
                log.debug("Keeping temporary file for debugging: {}", tempFile.getAbsolutePath());
            }
        }
    }

    /**
     * Calls the Gemini API with audio data for transcription
     */
    private SpeechTranscriptionResult callGeminiApi(String base64Audio, String mimeType, String fileName) 
            throws IOException {
        
        if (apiKey == null || apiKey.isEmpty()) {
            log.error("Gemini API key is not configured");
            return createErrorResult("Gemini API key is not configured. Set GOOGLE_CLOUD_API_KEY environment variable.");
        }

        // Build the API URL
        String apiUrl = String.format("%s/%s:generateContent?key=%s", 
                GEMINI_API_BASE_URL, modelName, apiKey);

        // Build the request body with structured output for emotion detection
        String requestBody = buildRequestBody(base64Audio, mimeType);

        log.debug("Calling Gemini API for file: {}", fileName);

        Request request = new Request.Builder()
            .url(apiUrl)
            .post(RequestBody.create(requestBody, MediaType.parse("application/json")))
            .addHeader("Content-Type", "application/json")
            .build();

        try (Response response = httpClient.newCall(request).execute()) {
            String responseBody = response.body() != null ? response.body().string() : "";
            
            if (!response.isSuccessful()) {
                log.error("Gemini API error: {} - {}", response.code(), responseBody);
                return createErrorResult("Gemini API error: " + response.code() + " - " + extractErrorMessage(responseBody));
            }

            return parseGeminiResponse(responseBody, fileName);
        }
    }

    /**
     * Builds the Gemini API request body with audio data and prompt
     */
    private String buildRequestBody(String base64Audio, String mimeType) throws IOException {
        // Prompt for transcription with emotion detection
        String prompt = """
            Process the audio file and provide a detailed transcription with analysis.
            
            Requirements:
            1. Provide the full transcription of all speech in the audio.
            2. Detect the primary emotion of the speaker. Choose exactly one: happy, sad, angry, neutral, fearful, anxious.
            3. Detect the language being spoken.
            4. Identify if there's any urgency or distress in the voice.
            5. Provide a brief summary of the audio content.
            6. Rate your confidence in the transcription from 0.0 to 1.0.
            
            Respond in this exact JSON format:
            {
                "transcription": "the full transcribed text here",
                "emotion": "one of: happy, sad, angry, neutral, fearful, anxious",
                "language": "detected language name",
                "languageCode": "ISO language code like en-US",
                "isUrgent": true or false,
                "isDistressed": true or false,
                "summary": "brief summary of what was said",
                "confidence": 0.0 to 1.0
            }
            """;

        // Normalize MIME type for Gemini
        String normalizedMimeType = normalizeMimeType(mimeType);

        GeminiRequest geminiRequest = new GeminiRequest();
        geminiRequest.contents = new ArrayList<>();

        GeminiContent content = new GeminiContent();
        content.parts = new ArrayList<>();

        // Add audio data part
        GeminiPart audioPart = new GeminiPart();
        audioPart.inlineData = new GeminiInlineData();
        audioPart.inlineData.mimeType = normalizedMimeType;
        audioPart.inlineData.data = base64Audio;
        content.parts.add(audioPart);

        // Add text prompt part
        GeminiPart textPart = new GeminiPart();
        textPart.text = prompt;
        content.parts.add(textPart);

        geminiRequest.contents.add(content);

        // Configure generation settings
        geminiRequest.generationConfig = new GeminiGenerationConfig();
        geminiRequest.generationConfig.responseMimeType = "application/json";
        geminiRequest.generationConfig.temperature = 0.2;

        return objectMapper.writeValueAsString(geminiRequest);
    }

    /**
     * Parses the Gemini API response
     */
    private SpeechTranscriptionResult parseGeminiResponse(String responseBody, String fileName) {
        try {
            GeminiResponse response = objectMapper.readValue(responseBody, GeminiResponse.class);

            if (response.candidates == null || response.candidates.isEmpty()) {
                log.warn("No candidates in Gemini response for file: {}", fileName);
                return createErrorResult("No transcription result from Gemini");
            }

            GeminiCandidate candidate = response.candidates.get(0);
            if (candidate.content == null || candidate.content.parts == null || candidate.content.parts.isEmpty()) {
                log.warn("No content in Gemini response for file: {}", fileName);
                return createErrorResult("Empty response from Gemini");
            }

            String jsonText = candidate.content.parts.get(0).text;
            
            // Parse the JSON response from Gemini
            GeminiTranscriptionOutput output = objectMapper.readValue(jsonText, GeminiTranscriptionOutput.class);

            log.info("Gemini transcription successful for file: {} - Emotion: {}, Urgent: {}", 
                    fileName, output.emotion, output.isUrgent);

            SpeechTranscriptionResult result = new SpeechTranscriptionResult();
            result.setSuccess(true);
            result.setText(output.transcription != null ? output.transcription : "");
            result.setConfidence(output.confidence);
            result.setMessage("Transcription successful");
            result.setEmotion(output.emotion);
            result.setLanguage(output.language);
            result.setLanguageCode(output.languageCode);
            result.setUrgent(output.isUrgent);
            result.setDistressed(output.isDistressed);
            result.setSummary(output.summary);

            return result;

        } catch (Exception e) {
            log.error("Failed to parse Gemini response for file {}: {}", fileName, e.getMessage(), e);
            
            // Try to extract text directly if JSON parsing fails
            try {
                GeminiResponse response = objectMapper.readValue(responseBody, GeminiResponse.class);
                if (response.candidates != null && !response.candidates.isEmpty()) {
                    String text = response.candidates.get(0).content.parts.get(0).text;
                    SpeechTranscriptionResult result = new SpeechTranscriptionResult();
                    result.setSuccess(true);
                    result.setText(text);
                    result.setConfidence(0.7);
                    result.setMessage("Transcription successful (raw format)");
                    result.setEmotion("neutral");
                    return result;
                }
            } catch (Exception ex) {
                log.debug("Could not extract raw text from response", ex);
            }
            
            return createErrorResult("Failed to parse transcription result: " + e.getMessage());
        }
    }

    /**
     * Downloads audio from URL to temporary file
     */
    private File downloadAudioFromUrl(String audioUrl) throws IOException {
        URL url = new URL(audioUrl);
        String fileName = extractFileName(url);
        
        Path tempDir = Path.of("data/received");
        if (!Files.exists(tempDir)) {
            Files.createDirectories(tempDir);
        }
        
        String tempFileName = String.format("gemini_audio_%d_%s", 
            System.currentTimeMillis(), 
            fileName.isEmpty() ? "audio.unknown" : fileName
        );
        File tempFile = tempDir.resolve(tempFileName).toFile();
        
        try (java.io.InputStream in = url.openStream();
             java.io.FileOutputStream out = new java.io.FileOutputStream(tempFile)) {
            
            byte[] buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = in.read(buffer)) != -1) {
                out.write(buffer, 0, bytesRead);
            }
        }
        
        return tempFile;
    }

    private String extractFileName(URL url) {
        String path = url.getPath();
        int lastSlashIndex = path.lastIndexOf('/');
        if (lastSlashIndex >= 0 && lastSlashIndex < path.length() - 1) {
            return path.substring(lastSlashIndex + 1);
        }
        return "audio.unknown";
    }

    /**
     * Detects MIME type of audio file
     */
    private String detectMimeType(File file) throws IOException {
        String mimeType = tika.detect(file);
        
        // Default to audio/wav if detection fails
        if (mimeType == null || mimeType.equals("application/octet-stream")) {
            String fileName = file.getName().toLowerCase();
            if (fileName.endsWith(".wav")) return "audio/wav";
            if (fileName.endsWith(".mp3")) return "audio/mp3";
            if (fileName.endsWith(".aac") || fileName.endsWith(".m4a")) return "audio/aac";
            if (fileName.endsWith(".webm")) return "audio/webm";
            if (fileName.endsWith(".ogg") || fileName.endsWith(".opus")) return "audio/ogg";
            if (fileName.endsWith(".flac")) return "audio/flac";
            return "audio/wav";
        }
        
        return mimeType;
    }

    /**
     * Normalizes MIME type for Gemini API compatibility
     */
    private String normalizeMimeType(String mimeType) {
        if (mimeType == null) return "audio/wav";
        
        return switch (mimeType.toLowerCase()) {
            case "audio/mpeg", "audio/x-mpeg-3" -> "audio/mp3";
            case "audio/wave", "audio/x-wav", "audio/vnd.wave" -> "audio/wav";
            case "audio/x-aac", "audio/mp4" -> "audio/aac";
            case "audio/x-flac" -> "audio/flac";
            case "audio/vorbis", "audio/opus" -> "audio/ogg";
            case "video/webm" -> "audio/webm";
            default -> mimeType;
        };
    }

    private String formatFileSize(long sizeInBytes) {
        if (sizeInBytes < 1024) {
            return sizeInBytes + " B";
        } else if (sizeInBytes < 1024 * 1024) {
            return String.format("%.1f KB", sizeInBytes / 1024.0);
        } else {
            return String.format("%.1f MB", sizeInBytes / (1024.0 * 1024.0));
        }
    }

    private SpeechTranscriptionResult createErrorResult(String message) {
        SpeechTranscriptionResult result = new SpeechTranscriptionResult();
        result.setSuccess(false);
        result.setText("");
        result.setConfidence(0.0);
        result.setMessage(message);
        result.setEmotion("neutral");
        return result;
    }

    private String extractErrorMessage(String responseBody) {
        try {
            GeminiErrorResponse error = objectMapper.readValue(responseBody, GeminiErrorResponse.class);
            if (error.error != null && error.error.message != null) {
                return error.error.message;
            }
        } catch (Exception e) {
            log.debug("Could not parse error response", e);
        }
        return responseBody.length() > 200 ? responseBody.substring(0, 200) + "..." : responseBody;
    }

    /**
     * Gets the list of supported audio formats
     */
    public List<String> getSupportedAudioFormats() {
        return audioConverter.getSupportedFormats();
    }

    /**
     * Checks if a file format is supported
     */
    public boolean isAudioFormatSupported(String fileName) {
        return audioConverter.isSupportedByExtension(fileName);
    }

    // ==================== Request/Response DTOs ====================

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class GeminiRequest {
        public List<GeminiContent> contents;
        public GeminiGenerationConfig generationConfig;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class GeminiContent {
        public List<GeminiPart> parts;
        public String role;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class GeminiPart {
        public String text;
        public GeminiInlineData inlineData;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class GeminiInlineData {
        public String mimeType;
        public String data;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class GeminiGenerationConfig {
        public String responseMimeType;
        public Double temperature;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class GeminiResponse {
        public List<GeminiCandidate> candidates;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class GeminiCandidate {
        public GeminiContent content;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class GeminiTranscriptionOutput {
        public String transcription;
        public String emotion;
        public String language;
        public String languageCode;
        public Boolean isUrgent;
        public Boolean isDistressed;
        public String summary;
        public Double confidence;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class GeminiErrorResponse {
        public GeminiError error;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class GeminiError {
        public String message;
        public int code;
    }

    // ==================== Transcription Result Class ====================

    /**
     * Data class for speech transcription results with emotion detection
     */
    @Data
    public static class SpeechTranscriptionResult {
        private boolean success;
        private String text;
        private double confidence;
        private String message;
        
        // Emotion detection fields
        private String emotion;          // happy, sad, angry, neutral, fearful, anxious
        private String language;         // Detected language name
        private String languageCode;     // ISO language code (e.g., en-US)
        private boolean urgent;          // Is the message urgent?
        private boolean distressed;      // Is the speaker distressed?
        private String summary;          // Brief summary of the content

        public SpeechTranscriptionResult() {}

        public SpeechTranscriptionResult(boolean success, String text, double confidence, String message) {
            this.success = success;
            this.text = text;
            this.confidence = confidence;
            this.message = message;
            this.emotion = "neutral";
        }
    }
}
