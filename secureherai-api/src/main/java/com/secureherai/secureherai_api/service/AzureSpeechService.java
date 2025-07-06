package com.secureherai.secureherai_api.service;

import com.microsoft.cognitiveservices.speech.*;
import com.microsoft.cognitiveservices.speech.audio.AudioConfig;
import lombok.extern.slf4j.Slf4j;
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
 */
@Service
@Slf4j
public class AzureSpeechService {

    @Value("${azure.speech.key}")
    private String speechKey;

    @Value("${azure.speech.region}")
    private String speechRegion;

    /**
     * Transcribes audio file to text using Azure Speech-to-Text service
     *
     * @param audioFile The audio file to transcribe
     * @return Transcription result containing recognized text and confidence
     * @throws IOException If file operations fail
     * @throws InterruptedException If transcription is interrupted
     * @throws ExecutionException If transcription fails
     */
    public SpeechTranscriptionResult transcribeAudioFile(File audioFile)
            throws IOException, InterruptedException, ExecutionException {

        log.info("Starting transcription for file: {}", audioFile.getName());

        // Validate Azure Speech configuration
        if (speechKey == null || speechKey.trim().isEmpty()) {
            throw new IllegalStateException("Azure Speech key is not configured. Please set AZURE_SPEECH_KEY environment variable.");
        }

        if (speechRegion == null || speechRegion.trim().isEmpty()) {
            throw new IllegalStateException("Azure Speech region is not configured. Please set AZURE_SPEECH_REGION environment variable.");
        }

        try {
            // Configure Azure Speech service
            SpeechConfig speechConfig = SpeechConfig.fromSubscription(speechKey, speechRegion);
            speechConfig.setSpeechRecognitionLanguage("en-US");

            // Configure audio input from file
            AudioConfig audioConfig = AudioConfig.fromWavFileInput(audioFile.getAbsolutePath());

            // Create speech recognizer
            SpeechRecognizer speechRecognizer = new SpeechRecognizer(speechConfig, audioConfig);

            log.debug("Configured Azure Speech recognizer for file: {}", audioFile.getName());

            // Perform recognition
            Future<SpeechRecognitionResult> task = speechRecognizer.recognizeOnceAsync();
            SpeechRecognitionResult result = task.get();

            // Process recognition result
            SpeechTranscriptionResult transcriptionResult = processRecognitionResult(result, audioFile.getName());

            // Clean up resources
            speechRecognizer.close();
            audioConfig.close();
            speechConfig.close();

            log.info("Transcription completed for file: {}", audioFile.getName());
            return transcriptionResult;

        } catch (Exception e) {
            log.error("Error during transcription of file {}: {}", audioFile.getName(), e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Transcribes audio from a URL using Azure Speech-to-Text service
     * This method downloads the file temporarily and then transcribes it
     *
     * @param audioUrl The URL of the audio file to transcribe
     * @param languageCode Optional language code (e.g., "en-US")
     * @return Transcription result containing recognized text and confidence
     * @throws InterruptedException If transcription is interrupted
     * @throws ExecutionException If transcription fails
     * @throws IOException If file operations fail
     */
    public SpeechTranscriptionResult transcribeAudioFromUrl(String audioUrl, String languageCode) 
            throws InterruptedException, ExecutionException, IOException {
        
        log.info("Starting transcription for audio URL: {}", audioUrl);
        
        // Validate Azure Speech configuration
        if (speechKey == null || speechKey.trim().isEmpty()) {
            throw new IllegalStateException("Azure Speech key is not configured. Please set AZURE_SPEECH_KEY environment variable.");
        }
        
        if (speechRegion == null || speechRegion.trim().isEmpty()) {
            throw new IllegalStateException("Azure Speech region is not configured. Please set AZURE_SPEECH_REGION environment variable.");
        }
        
        // Validate URL
        if (audioUrl == null || audioUrl.trim().isEmpty()) {
            throw new IllegalArgumentException("Audio URL cannot be empty");
        }
        
        File tempFile = null;
        try {
            // Download the audio file from URL to a temporary file
            tempFile = downloadAudioFromUrl(audioUrl);
            log.debug("Downloaded audio from URL to temporary file: {}", tempFile.getAbsolutePath());
            
            // Configure Azure Speech service
            SpeechConfig speechConfig = SpeechConfig.fromSubscription(speechKey, speechRegion);
            
            // Set language if provided, otherwise default to en-US
            if (languageCode != null && !languageCode.trim().isEmpty()) {
                speechConfig.setSpeechRecognitionLanguage(languageCode);
            } else {
                speechConfig.setSpeechRecognitionLanguage("en-US");
            }
            
            // Configure audio input from the downloaded file
            AudioConfig audioConfig = AudioConfig.fromWavFileInput(tempFile.getAbsolutePath());
            
            // Create speech recognizer
            SpeechRecognizer speechRecognizer = new SpeechRecognizer(speechConfig, audioConfig);
            
            log.debug("Configured Azure Speech recognizer for URL content");
            
            // Perform recognition
            Future<SpeechRecognitionResult> task = speechRecognizer.recognizeOnceAsync();
            SpeechRecognitionResult result = task.get();
            
            // Process recognition result
            SpeechTranscriptionResult transcriptionResult = processRecognitionResult(result, "URL: " + audioUrl);
            
            // Clean up resources
            speechRecognizer.close();
            audioConfig.close();
            speechConfig.close();
            
            log.info("Transcription completed for URL: {}", audioUrl);
            return transcriptionResult;
            
        } finally {
            // Always clean up the temporary file
            // TODO: Temporarily commented out for debugging - keeping temp files for analysis
            if (tempFile != null && tempFile.exists()) {
                log.info("Temporary file kept for debugging: {}", tempFile.getAbsolutePath());
                /*
                if (tempFile.delete()) {
                    log.debug("Deleted temporary file for URL: {}", tempFile.getAbsolutePath());
                } else {
                    log.warn("Failed to delete temporary file for URL: {}", tempFile.getAbsolutePath());
                }
                */
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
            fileName.isEmpty() ? "audio.wav" : fileName
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
