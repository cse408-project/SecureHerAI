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
 * - Severity/Priority assessment (CRITICAL, HIGH, MEDIUM, LOW)
 * - Incident type classification
 * - Language detection
 * - Keyword detection for emergency triggers
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
            "audio/webm", "audio/ogg", "audio/flac", "audio/aiff");

    // Emergency keywords for detection
    private static final List<String> EMERGENCY_KEYWORDS = List.of(
            "help", "emergency", "sos", "danger", "attack", "fire", "accident",
            "police", "ambulance", "rescue", "save me", "hurt", "bleeding",
            "assault", "robbery", "theft", "harassment", "stalker", "following",
            "scared", "afraid", "trapped", "kidnap", "threat", "weapon");

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
                            String.join(", ", audioConverter.getSupportedFormats()));
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
     * @param audioUrl     The URL of the audio file to transcribe
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
            return createErrorResult(
                    "Gemini API key is not configured. Set GOOGLE_CLOUD_API_KEY environment variable.");
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
                return createErrorResult(
                        "Gemini API error: " + response.code() + " - " + extractErrorMessage(responseBody));
            }

            return parseGeminiResponse(responseBody, fileName);
        }
    }

    /**
     * Builds the Gemini API request body with audio data and prompt
     */
    private String buildRequestBody(String base64Audio, String mimeType) throws IOException {
        // Comprehensive prompt for transcription with full analysis
        String prompt = """
                Process the audio file and provide a detailed transcription with comprehensive safety analysis.

                Requirements:
                1. Provide the full transcription of all speech in the audio.
                2. Detect the primary emotion of the speaker. Choose exactly one: happy, sad, angry, neutral, fearful, anxious.
                3. Detect the language being spoken.
                4. Identify if there's any urgency or distress in the voice.
                5. Provide a brief summary of the audio content.
                6. Rate your confidence in the transcription from 0.0 to 1.0.
                7. Assess the SEVERITY/PRIORITY level based on the content and tone:
                   - CRITICAL: Immediate life-threatening danger (attack, weapon, severe injury, fire, kidnapping)
                   - HIGH: Serious safety threat requiring immediate response (assault, active harassment, being followed)
                   - MEDIUM: Safety concern requiring attention (theft, harassment, suspicious activity)
                   - LOW: General concern or false alarm potential
                8. Classify the INCIDENT TYPE based on content:
                   - emergency: Life-threatening situations
                   - assault: Physical attacks or violence
                   - harassment: Verbal abuse, sexual harassment, stalking
                   - theft: Robbery, pickpocketing, property crimes
                   - accident: Vehicle accidents, falls, injuries
                   - other: Unclassified incidents
                9. Detect if any EMERGENCY KEYWORDS are present (help, sos, emergency, danger, attack, fire, police, etc.)
                10. Provide recommended response action.

                Respond in this exact JSON format:
                {
                    "transcription": "the full transcribed text here",
                    "emotion": "one of: happy, sad, angry, neutral, fearful, anxious",
                    "language": "detected language name",
                    "languageCode": "ISO language code like en-US",
                    "isUrgent": true or false,
                    "isDistressed": true or false,
                    "summary": "brief summary of what was said",
                    "confidence": 0.0 to 1.0,
                    "severity": "one of: CRITICAL, HIGH, MEDIUM, LOW",
                    "incidentType": "one of: emergency, assault, harassment, theft, accident, other",
                    "keywordsDetected": ["list", "of", "detected", "emergency", "keywords"],
                    "hasEmergencyKeyword": true or false,
                    "recommendedAction": "brief recommended response action"
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

            log.info(
                    "Gemini transcription successful for file: {} - Emotion: {}, Urgent: {}, Severity: {}, IncidentType: {}",
                    fileName, output.emotion, output.isUrgent, output.severity, output.incidentType);

            SpeechTranscriptionResult result = new SpeechTranscriptionResult();
            result.setSuccess(true);
            result.setText(output.transcription != null ? output.transcription : "");
            result.setConfidence(output.confidence != null ? output.confidence : 0.0);
            result.setMessage("Transcription successful");
            result.setEmotion(output.emotion != null ? output.emotion : "neutral");
            result.setLanguage(output.language);
            result.setLanguageCode(output.languageCode);
            result.setUrgent(output.isUrgent != null ? output.isUrgent : false);
            result.setDistressed(output.isDistressed != null ? output.isDistressed : false);
            result.setSummary(output.summary);

            // New fields for severity and incident classification
            result.setSeverity(output.severity != null ? output.severity : "MEDIUM");
            result.setIncidentType(output.incidentType != null ? output.incidentType : "other");
            result.setKeywordsDetected(output.keywordsDetected != null ? output.keywordsDetected : List.of());
            result.setHasEmergencyKeyword(output.hasEmergencyKeyword != null ? output.hasEmergencyKeyword : false);
            result.setRecommendedAction(output.recommendedAction);

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
                    result.setSeverity("MEDIUM");
                    result.setIncidentType("other");
                    result.setKeywordsDetected(List.of());
                    result.setHasEmergencyKeyword(detectEmergencyKeywords(text));
                    return result;
                }
            } catch (Exception ex) {
                log.debug("Could not extract raw text from response", ex);
            }

            return createErrorResult("Failed to parse transcription result: " + e.getMessage());
        }
    }

    /**
     * Analyze text message for emergency content using Gemini AI
     * This is a single API call that handles both transcription analysis and text
     * analysis
     * 
     * @param text The text message to analyze
     * @return Analysis result with severity, incident type, keywords, etc.
     */
    public SpeechTranscriptionResult analyzeTextMessage(String text) {
        log.info("Analyzing text message with Gemini AI: {}",
                text.length() > 100 ? text.substring(0, 100) + "..." : text);

        if (apiKey == null || apiKey.isEmpty()) {
            log.error("Gemini API key is not configured");
            return createTextAnalysisResult(text, "Gemini API not configured, using fallback analysis");
        }

        try {
            String requestBody = buildTextAnalysisRequestBody(text);
            String apiUrl = String.format("%s/%s:generateContent?key=%s",
                    GEMINI_API_BASE_URL, modelName, apiKey);

            Request request = new Request.Builder()
                    .url(apiUrl)
                    .post(RequestBody.create(requestBody, MediaType.parse("application/json")))
                    .addHeader("Content-Type", "application/json")
                    .build();

            try (Response response = httpClient.newCall(request).execute()) {
                String responseBody = response.body() != null ? response.body().string() : "";

                if (!response.isSuccessful()) {
                    log.error("Gemini API error for text analysis: {} - {}", response.code(), responseBody);
                    return createTextAnalysisResult(text, "Gemini API error, using fallback");
                }

                return parseTextAnalysisResponse(responseBody, text);
            }
        } catch (Exception e) {
            log.error("Error analyzing text with Gemini: {}", e.getMessage(), e);
            return createTextAnalysisResult(text, "Analysis error, using fallback");
        }
    }

    /**
     * Build request body for text-only analysis
     */
    private String buildTextAnalysisRequestBody(String text) throws IOException {
        String prompt = String.format(
                """
                        Analyze the following emergency/safety message and provide a comprehensive assessment.

                        MESSAGE TO ANALYZE:
                        "%s"

                        Requirements:
                        1. Assess the SEVERITY/PRIORITY level:
                           - CRITICAL: Immediate life-threatening danger (attack, weapon, severe injury, fire, kidnapping)
                           - HIGH: Serious safety threat requiring immediate response (assault, active harassment, being followed)
                           - MEDIUM: Safety concern requiring attention (theft, harassment, suspicious activity)
                           - LOW: General concern or false alarm potential
                        2. Classify the INCIDENT TYPE:
                           - emergency: Life-threatening situations
                           - assault: Physical attacks or violence
                           - harassment: Verbal abuse, sexual harassment, stalking
                           - theft: Robbery, pickpocketing, property crimes
                           - accident: Vehicle accidents, falls, injuries
                           - other: Unclassified incidents
                        3. Detect the primary emotion. Choose exactly one: happy, sad, angry, neutral, fearful, anxious.
                        4. Identify if there's urgency or distress in the message.
                        5. Detect emergency keywords present.
                        6. Provide a brief summary and recommended action.
                        7. Rate confidence from 0.0 to 1.0.

                        Respond in this exact JSON format:
                        {
                            "transcription": "the original message text",
                            "emotion": "one of: happy, sad, angry, neutral, fearful, anxious",
                            "language": "detected language name",
                            "languageCode": "ISO language code like en-US",
                            "isUrgent": true or false,
                            "isDistressed": true or false,
                            "summary": "brief summary of the situation",
                            "confidence": 0.0 to 1.0,
                            "severity": "one of: CRITICAL, HIGH, MEDIUM, LOW",
                            "incidentType": "one of: emergency, assault, harassment, theft, accident, other",
                            "keywordsDetected": ["list", "of", "detected", "keywords"],
                            "hasEmergencyKeyword": true or false,
                            "recommendedAction": "brief recommended response"
                        }
                        """,
                text);

        GeminiRequest geminiRequest = new GeminiRequest();
        geminiRequest.contents = new ArrayList<>();

        GeminiContent content = new GeminiContent();
        content.parts = new ArrayList<>();

        GeminiPart textPart = new GeminiPart();
        textPart.text = prompt;
        content.parts.add(textPart);

        geminiRequest.contents.add(content);

        geminiRequest.generationConfig = new GeminiGenerationConfig();
        geminiRequest.generationConfig.responseMimeType = "application/json";
        geminiRequest.generationConfig.temperature = 0.2;

        return objectMapper.writeValueAsString(geminiRequest);
    }

    /**
     * Parse text analysis response from Gemini
     */
    private SpeechTranscriptionResult parseTextAnalysisResponse(String responseBody, String originalText) {
        try {
            GeminiResponse response = objectMapper.readValue(responseBody, GeminiResponse.class);

            if (response.candidates == null || response.candidates.isEmpty()) {
                return createTextAnalysisResult(originalText, "No analysis result from Gemini");
            }

            GeminiCandidate candidate = response.candidates.get(0);
            if (candidate.content == null || candidate.content.parts == null || candidate.content.parts.isEmpty()) {
                return createTextAnalysisResult(originalText, "Empty response from Gemini");
            }

            String jsonText = candidate.content.parts.get(0).text;
            GeminiTranscriptionOutput output = objectMapper.readValue(jsonText, GeminiTranscriptionOutput.class);

            log.info("Gemini text analysis successful - Severity: {}, IncidentType: {}, HasKeyword: {}",
                    output.severity, output.incidentType, output.hasEmergencyKeyword);

            SpeechTranscriptionResult result = new SpeechTranscriptionResult();
            result.setSuccess(true);
            result.setText(originalText);
            result.setConfidence(output.confidence != null ? output.confidence : 0.8);
            result.setMessage("Text analysis successful");
            result.setEmotion(output.emotion != null ? output.emotion : "neutral");
            result.setLanguage(output.language);
            result.setLanguageCode(output.languageCode);
            result.setUrgent(output.isUrgent != null ? output.isUrgent : false);
            result.setDistressed(output.isDistressed != null ? output.isDistressed : false);
            result.setSummary(output.summary);
            result.setSeverity(output.severity != null ? output.severity : "MEDIUM");
            result.setIncidentType(output.incidentType != null ? output.incidentType : "other");
            result.setKeywordsDetected(output.keywordsDetected != null ? output.keywordsDetected : List.of());
            result.setHasEmergencyKeyword(output.hasEmergencyKeyword != null ? output.hasEmergencyKeyword : false);
            result.setRecommendedAction(output.recommendedAction);

            return result;

        } catch (Exception e) {
            log.error("Failed to parse Gemini text analysis response: {}", e.getMessage(), e);
            return createTextAnalysisResult(originalText, "Parse error: " + e.getMessage());
        }
    }

    /**
     * Create fallback text analysis result using simple keyword detection
     */
    private SpeechTranscriptionResult createTextAnalysisResult(String text, String message) {
        SpeechTranscriptionResult result = new SpeechTranscriptionResult();
        result.setSuccess(true);
        result.setText(text);
        result.setMessage(message);

        // Fallback analysis using keyword detection
        String lowerText = text.toLowerCase();
        List<String> detectedKeywords = EMERGENCY_KEYWORDS.stream()
                .filter(lowerText::contains)
                .toList();

        boolean hasEmergency = !detectedKeywords.isEmpty();
        result.setHasEmergencyKeyword(hasEmergency);
        result.setKeywordsDetected(detectedKeywords);

        // Determine severity based on keywords
        if (lowerText.contains("attack") || lowerText.contains("weapon") ||
                lowerText.contains("kidnap") || lowerText.contains("fire") ||
                lowerText.contains("bleeding") || lowerText.contains("dying")) {
            result.setSeverity("CRITICAL");
            result.setIncidentType("emergency");
        } else if (lowerText.contains("assault") || lowerText.contains("following") ||
                lowerText.contains("stalker") || lowerText.contains("threat")) {
            result.setSeverity("HIGH");
            result.setIncidentType("assault");
        } else if (lowerText.contains("harassment") || lowerText.contains("theft") ||
                lowerText.contains("robbery") || lowerText.contains("scared")) {
            result.setSeverity("MEDIUM");
            result.setIncidentType(
                    lowerText.contains("theft") || lowerText.contains("robbery") ? "theft" : "harassment");
        } else if (hasEmergency) {
            result.setSeverity("MEDIUM");
            result.setIncidentType("other");
        } else {
            result.setSeverity("LOW");
            result.setIncidentType("other");
        }

        result.setUrgent(result.getSeverity().equals("CRITICAL") || result.getSeverity().equals("HIGH"));
        result.setDistressed(
                lowerText.contains("scared") || lowerText.contains("afraid") || lowerText.contains("help"));
        result.setEmotion(result.isDistressed() ? "fearful" : "neutral");
        result.setConfidence(0.6);
        result.setLanguage("English");
        result.setLanguageCode("en-US");
        result.setSummary("Emergency message requiring attention");
        result.setRecommendedAction(hasEmergency ? "Immediate response recommended" : "Monitor situation");

        return result;
    }

    /**
     * Simple keyword detection fallback
     */
    private boolean detectEmergencyKeywords(String text) {
        if (text == null || text.isEmpty())
            return false;
        String lowerText = text.toLowerCase();
        return EMERGENCY_KEYWORDS.stream().anyMatch(lowerText::contains);
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
                fileName.isEmpty() ? "audio.unknown" : fileName);
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
            if (fileName.endsWith(".wav"))
                return "audio/wav";
            if (fileName.endsWith(".mp3"))
                return "audio/mp3";
            if (fileName.endsWith(".aac") || fileName.endsWith(".m4a"))
                return "audio/aac";
            if (fileName.endsWith(".webm"))
                return "audio/webm";
            if (fileName.endsWith(".ogg") || fileName.endsWith(".opus"))
                return "audio/ogg";
            if (fileName.endsWith(".flac"))
                return "audio/flac";
            return "audio/wav";
        }

        return mimeType;
    }

    /**
     * Normalizes MIME type for Gemini API compatibility
     */
    private String normalizeMimeType(String mimeType) {
        if (mimeType == null)
            return "audio/wav";

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

        // New fields for severity and incident classification
        public String severity; // CRITICAL, HIGH, MEDIUM, LOW
        public String incidentType; // emergency, assault, harassment, theft, accident, other
        public List<String> keywordsDetected; // List of detected emergency keywords
        public Boolean hasEmergencyKeyword; // Whether emergency keywords are present
        public String recommendedAction; // Recommended response action
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
     * and severity/incident classification for emergency response
     */
    @Data
    public static class SpeechTranscriptionResult {
        private boolean success;
        private String text;
        private double confidence;
        private String message;

        // Emotion detection fields
        private String emotion; // happy, sad, angry, neutral, fearful, anxious
        private String language; // Detected language name
        private String languageCode; // ISO language code (e.g., en-US)
        private boolean urgent; // Is the message urgent?
        private boolean distressed; // Is the speaker distressed?
        private String summary; // Brief summary of the content

        // Severity and incident classification fields
        private String severity; // CRITICAL, HIGH, MEDIUM, LOW
        private String incidentType; // emergency, assault, harassment, theft, accident, other
        private List<String> keywordsDetected; // List of detected emergency keywords
        private boolean hasEmergencyKeyword; // Whether emergency keywords are present
        private String recommendedAction; // Recommended response action

        public SpeechTranscriptionResult() {
            this.keywordsDetected = new ArrayList<>();
        }

        public SpeechTranscriptionResult(boolean success, String text, double confidence, String message) {
            this.success = success;
            this.text = text;
            this.confidence = confidence;
            this.message = message;
            this.emotion = "neutral";
            this.severity = "MEDIUM";
            this.incidentType = "other";
            this.keywordsDetected = new ArrayList<>();
        }
    }
}
