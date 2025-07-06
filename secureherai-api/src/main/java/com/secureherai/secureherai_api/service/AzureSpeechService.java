package com.secureherai.secureherai_api.service;

import com.microsoft.cognitiveservices.speech.*;
import com.microsoft.cognitiveservices.speech.audio.AudioConfig;
import com.secureherai.secureherai_api.util.AudioFormatConverter;
import lombok.extern.slf4j.Slf4j;
import org.apache.tika.Tika;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Future;

/**
 * Azure Speech-to-Text service implementation
 * Handles audio file transcription using Azure Cognitive Services Speech SDK
 * Supports multiple audio formats: WAV, MP3, AAC, WebM, OGG, FLAC, WMA
 */
@Service
@Slf4j
public class AzureSpeechService {

    @Value("${azure.speech.key}")
    private String speechKey;

    @Value("${azure.speech.region}")
    private String speechRegion;

    @Autowired
    private AudioFormatConverter audioConverter;

    private final Tika tika = new Tika();

    /**
     * Transcribes audio file to text using Azure Speech-to-Text service
     * Supports multiple audio formats: WAV, MP3, AAC, WebM, OGG, FLAC, WMA
     *
     * @param audioFile The audio file to transcribe
     * @return Transcription result containing recognized text and confidence
     * @throws IOException If file operations fail
     * @throws InterruptedException If transcription is interrupted
     * @throws ExecutionException If transcription fails
     */
    public SpeechTranscriptionResult transcribeAudioFile(File audioFile)
            throws IOException, InterruptedException, ExecutionException, Exception {

        log.info("Starting transcription for file: {} ({})", audioFile.getName(), 
                 formatFileSize(audioFile.length()));

        // Validate Azure Speech configuration
        validateAzureConfiguration();

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

        File wavFile = null;
        try {
            // Convert audio to WAV format if needed
            wavFile = audioConverter.convertToWav(audioFile);
            log.info("Audio converted to WAV format: {}", wavFile.getName());

            // Perform Azure Speech recognition on the WAV file
            return performSpeechRecognition(wavFile, audioFile.getName());

        } catch (Exception e) {
            log.error("Error during transcription of file {}: {}", audioFile.getName(), e.getMessage(), e);
            throw e;
        } finally {
            // Clean up temporary WAV file if it was created
            if (wavFile != null && !wavFile.equals(audioFile)) {
                audioConverter.cleanupTempFile(wavFile);
            }
        }
    }

    /**
     * Transcribes audio from a URL using Azure Speech-to-Text service
     * Supports multiple audio formats through automatic conversion
     *
     * @param audioUrl The URL of the audio file to transcribe
     * @param languageCode Optional language code (e.g., "en-US")
     * @return Transcription result containing recognized text and confidence
     * @throws InterruptedException If transcription is interrupted
     * @throws ExecutionException If transcription fails
     * @throws IOException If file operations fail
     */
    public SpeechTranscriptionResult transcribeAudioFromUrl(String audioUrl, String languageCode) 
            throws InterruptedException, ExecutionException, IOException, Exception {
        
        log.info("Starting transcription for audio URL: {}", audioUrl);
        
        // Validate Azure Speech configuration
        validateAzureConfiguration();
        
        // Validate URL
        if (audioUrl == null || audioUrl.trim().isEmpty()) {
            throw new IllegalArgumentException("Audio URL cannot be empty");
        }
        
        File tempFile = null;
        File wavFile = null;
        try {
            // Download the audio file from URL to a temporary file
            tempFile = downloadAudioFromUrl(audioUrl);
            log.debug("Downloaded audio from URL to temporary file: {}", tempFile.getAbsolutePath());
            
            // Detect audio format
            String detectedFormat = tika.detect(tempFile);
            log.info("Detected audio format from URL: {}", detectedFormat);
            
            // Convert to WAV if needed
            wavFile = audioConverter.convertUrlAudioToWav(tempFile, detectedFormat);
            
            // Perform Azure Speech recognition on the WAV file
            return performSpeechRecognition(wavFile, "URL: " + audioUrl, languageCode);
            
        } finally {
            // Clean up temporary files
            if (tempFile != null && tempFile.exists()) {
                // Keep for debugging as in original code
                log.info("Temporary file kept for debugging: {}", tempFile.getAbsolutePath());
            }
            
            if (wavFile != null && !wavFile.equals(tempFile)) {
                audioConverter.cleanupTempFile(wavFile);
            }
        }
    }
    
    /**
     * Downloads audio from a URL to a temporary file
     *
     * @param audioUrl The URL of the audio file
     * @return The temporary file
     * @throws IOException If download fails
     */
    private File downloadAudioFromUrl(String audioUrl) throws IOException {
        java.net.URL url = new java.net.URL(audioUrl);
        String fileName = url.getPath();
        int lastSlashIndex = fileName.lastIndexOf('/');
        if (lastSlashIndex >= 0) {
            fileName = fileName.substring(lastSlashIndex + 1);
        }
        
        // Create temp directory if it doesn't exist
        Path tempDir = Path.of("data/received");
        if (!Files.exists(tempDir)) {
            Files.createDirectories(tempDir);
        }
        
        // Create temporary file
        String tempFileName = String.format("url_audio_%d_%s", 
            System.currentTimeMillis(), 
            fileName.isEmpty() ? "audio.unknown" : fileName
        );
        File tempFile = tempDir.resolve(tempFileName).toFile();
        
        // Download the file
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

    /**
     * Validates Azure Speech service configuration
     */
    private void validateAzureConfiguration() {
        if (speechKey == null || speechKey.trim().isEmpty()) {
            throw new IllegalStateException("Azure Speech key is not configured. Please set AZURE_SPEECH_KEY environment variable.");
        }

        if (speechRegion == null || speechRegion.trim().isEmpty()) {
            throw new IllegalStateException("Azure Speech region is not configured. Please set AZURE_SPEECH_REGION environment variable.");
        }
    }

    /**
     * Performs Azure Speech recognition on a WAV file
     */
    private SpeechTranscriptionResult performSpeechRecognition(File wavFile, String originalFileName) 
            throws InterruptedException, ExecutionException {
        return performSpeechRecognition(wavFile, originalFileName, null);
    }

    /**
     * Performs Azure Speech recognition on a WAV file with specified language
     */
    private SpeechTranscriptionResult performSpeechRecognition(File wavFile, String originalFileName, String languageCode) 
            throws InterruptedException, ExecutionException {
        
        SpeechConfig speechConfig = null;
        AudioConfig audioConfig = null;
        SpeechRecognizer speechRecognizer = null;

        try {
            // Configure Azure Speech service
            speechConfig = SpeechConfig.fromSubscription(speechKey, speechRegion);
            
            // Set language if provided, otherwise default to en-US
            if (languageCode != null && !languageCode.trim().isEmpty()) {
                speechConfig.setSpeechRecognitionLanguage(languageCode);
            } else {
                speechConfig.setSpeechRecognitionLanguage("en-US");
            }

            // Configure audio input from file
            audioConfig = AudioConfig.fromWavFileInput(wavFile.getAbsolutePath());

            // Create speech recognizer
            speechRecognizer = new SpeechRecognizer(speechConfig, audioConfig);

            log.debug("Configured Azure Speech recognizer for file: {}", originalFileName);

            // Perform recognition
            Future<SpeechRecognitionResult> task = speechRecognizer.recognizeOnceAsync();
            SpeechRecognitionResult result = task.get();

            // Process recognition result
            SpeechTranscriptionResult transcriptionResult = processRecognitionResult(result, originalFileName);

            log.info("Transcription completed for file: {}", originalFileName);
            return transcriptionResult;

        } finally {
            // Clean up resources
            if (speechRecognizer != null) {
                speechRecognizer.close();
            }
            if (audioConfig != null) {
                audioConfig.close();
            }
            if (speechConfig != null) {
                speechConfig.close();
            }
        }
    }

    /**
     * Formats file size for logging
     */
    private String formatFileSize(long sizeInBytes) {
        if (sizeInBytes < 1024) {
            return sizeInBytes + " B";
        } else if (sizeInBytes < 1024 * 1024) {
            return String.format("%.1f KB", sizeInBytes / 1024.0);
        } else {
            return String.format("%.1f MB", sizeInBytes / (1024.0 * 1024.0));
        }
    }

    /**
     * Processes the Azure Speech recognition result
     *
     * @param result Azure Speech recognition result
     * @param fileName Original file name for logging
     * @return Processed transcription result
     */
    private SpeechTranscriptionResult processRecognitionResult(SpeechRecognitionResult result, String fileName) {
        SpeechTranscriptionResult transcriptionResult = new SpeechTranscriptionResult();

        switch (result.getReason()) {
            case RecognizedSpeech:
                log.info("Speech recognized successfully for file: {}", fileName);
                transcriptionResult.setSuccess(true);
                transcriptionResult.setText(result.getText());
                transcriptionResult.setConfidence(1.0); // Azure doesn't provide confidence in basic recognition
                transcriptionResult.setMessage("Speech recognized successfully");
                break;

            case NoMatch:
                log.warn("No speech could be recognized for file: {}", fileName);
                transcriptionResult.setSuccess(false);
                transcriptionResult.setText("");
                transcriptionResult.setConfidence(0.0);
                transcriptionResult.setMessage("No speech could be recognized in the audio file");
                break;

            case Canceled:
                CancellationDetails cancellation = CancellationDetails.fromResult(result);
                log.error("Recognition was canceled for file: {}. Reason: {}", fileName, cancellation.getReason());

                transcriptionResult.setSuccess(false);
                transcriptionResult.setText("");
                transcriptionResult.setConfidence(0.0);

                if (cancellation.getReason() == CancellationReason.Error) {
                    String errorMessage = String.format("Recognition failed with error: %s - %s",
                            cancellation.getErrorCode(), cancellation.getErrorDetails());
                    transcriptionResult.setMessage(errorMessage);
                    log.error("Error details for file {}: {}", fileName, errorMessage);
                } else {
                    transcriptionResult.setMessage("Recognition was canceled: " + cancellation.getReason());
                }
                break;

            default:
                log.warn("Unexpected recognition result for file: {}", fileName);
                transcriptionResult.setSuccess(false);
                transcriptionResult.setText("");
                transcriptionResult.setConfidence(0.0);
                transcriptionResult.setMessage("Unexpected recognition result");
                break;
        }

        // Log the result for debugging
        if (!transcriptionResult.isSuccess()) {
            log.warn("Azure Speech Service failed for {}: {}", fileName, transcriptionResult.getMessage());
        }

        return transcriptionResult;
    }

    /**
     * Gets the list of supported audio formats
     * 
     * @return List of supported MIME types
     */
    public java.util.List<String> getSupportedAudioFormats() {
        return audioConverter.getSupportedFormats();
    }

    /**
     * Checks if a file format is supported based on filename
     * 
     * @param fileName The name of the audio file
     * @return true if the format is supported, false otherwise
     */
    public boolean isAudioFormatSupported(String fileName) {
        return audioConverter.isSupportedByExtension(fileName);
    }

    /**
     * Data class for speech transcription results
     */
    public static class SpeechTranscriptionResult {
        private boolean success;
        private String text;
        private double confidence;
        private String message;

        // Constructors
        public SpeechTranscriptionResult() {}

        public SpeechTranscriptionResult(boolean success, String text, double confidence, String message) {
            this.success = success;
            this.text = text;
            this.confidence = confidence;
            this.message = message;
        }

        // Getters and setters
        public boolean isSuccess() {
            return success;
        }

        public void setSuccess(boolean success) {
            this.success = success;
        }

        public String getText() {
            return text;
        }

        public void setText(String text) {
            this.text = text;
        }

        public double getConfidence() {
            return confidence;
        }

        public void setConfidence(double confidence) {
            this.confidence = confidence;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }
}
