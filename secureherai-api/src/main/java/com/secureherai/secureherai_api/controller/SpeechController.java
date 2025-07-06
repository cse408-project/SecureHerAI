package com.secureherai.secureherai_api.controller;

import com.secureherai.secureherai_api.dto.AudioUrlRequestDto;
import com.secureherai.secureherai_api.dto.SpeechTranscriptionResponseDto;
import com.secureherai.secureherai_api.service.AzureSpeechService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;

/**
 * REST controller for Azure Speech-to-Text API endpoints
 */
@RestController
@RequestMapping("/api/speech")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:8081", "http://localhost:3000"})
public class SpeechController {

    private final AzureSpeechService azureSpeechService;
    
    // Supported audio file formats
    private static final List<String> SUPPORTED_FORMATS = Arrays.asList(
        "audio/wav", "audio/wave", "audio/x-wav",
        "audio/mpeg", "audio/mp3", "audio/x-mpeg-3",
        "audio/flac", "audio/x-flac",
        "audio/ogg", "audio/vorbis"
    );
    
    // Maximum file size (10MB)
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;
    
    // Directory for temporary audio files
    private static final String TEMP_AUDIO_DIR = "data/received";

    /**
     * Transcribes uploaded audio file to text using Azure Speech-to-Text service
     *
     * @param audioFile The uploaded audio file (WAV, MP3, FLAC, OGG formats supported)
     * @return Transcription result with recognized text and metadata
     */
    @PostMapping(value = "/transcribe", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<SpeechTranscriptionResponseDto> transcribeAudio(
            @RequestParam(value = "audio", required = false) MultipartFile audioFile) {
        
        long startTime = System.currentTimeMillis();
        
        // Handle null file explicitly with a 400 response
        if (audioFile == null) {
            log.warn("No audio file provided in request");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                new SpeechTranscriptionResponseDto(
                    false, "", 0.0, "No audio file provided", "", 0
                )
            );
        }
        
        String originalFileName = audioFile.getOriginalFilename();
        
        log.info("Received transcription request for file: {} (size: {} bytes)", 
                originalFileName, audioFile.getSize());

        File tempFile = null;
        try {
            // Validate the uploaded file - this will throw IllegalArgumentException for invalid files
            validateAudioFile(audioFile);
            
            // Save the uploaded file temporarily
            tempFile = saveTemporaryFile(audioFile);
            
            // Transcribe the audio file
            AzureSpeechService.SpeechTranscriptionResult result = 
                azureSpeechService.transcribeAudioFile(tempFile);
            
            long processingTime = System.currentTimeMillis() - startTime;
            
            // Create response DTO
            SpeechTranscriptionResponseDto response = new SpeechTranscriptionResponseDto(
                result.isSuccess(),
                result.getText(),
                result.getConfidence(),
                result.getMessage(),
                originalFileName,
                processingTime
            );
            
            log.info("Transcription completed for file: {} in {}ms", 
                    originalFileName, processingTime);
            
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            // Handle validation errors with 400 Bad Request
            log.warn("Invalid file upload: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                new SpeechTranscriptionResponseDto(
                    false, "", 0.0, e.getMessage(), originalFileName,
                    System.currentTimeMillis() - startTime
                )
            );
            
        } catch (Exception e) {
            // Handle all other errors with 500 Internal Server Error
            log.error("Error processing transcription request for file: {}", originalFileName, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                new SpeechTranscriptionResponseDto(
                    false, "", 0.0, 
                    "Internal server error during transcription: " + e.getMessage(),
                    originalFileName,
                    System.currentTimeMillis() - startTime
                )
            );
            
        } finally {
            // Always clean up the temporary file
            if (tempFile != null) {
                cleanupTemporaryFile(tempFile);
            }
        }
    }

    /**
     * Transcribes audio from URL to text using Azure Speech-to-Text service
     * 
     * @param requestDto The request containing the audio URL
     * @return Transcription result with recognized text and metadata
     */
    @PostMapping(value = "/transcribe-url", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<SpeechTranscriptionResponseDto> transcribeAudioFromUrl(
            @RequestBody AudioUrlRequestDto requestDto) {
        
        long startTime = System.currentTimeMillis();
        String audioUrl = requestDto.getAudioUrl();
        
        log.info("Received URL transcription request for: {}", audioUrl);
        
        try {
            // Validate URL
            if (audioUrl == null || audioUrl.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(
                    new SpeechTranscriptionResponseDto(
                        false, "", 0.0, "Audio URL cannot be empty", "", 0
                    )
                );
            }
            
            // Transcribe the audio from URL
            AzureSpeechService.SpeechTranscriptionResult result = 
                azureSpeechService.transcribeAudioFromUrl(audioUrl, requestDto.getLanguageCode());
            
            long processingTime = System.currentTimeMillis() - startTime;
            
            // Create response DTO
            SpeechTranscriptionResponseDto response = new SpeechTranscriptionResponseDto(
                result.isSuccess(),
                result.getText(),
                result.getConfidence(),
                result.getMessage(),
                extractFilenameFromUrl(audioUrl),
                processingTime
            );
            
            log.info("URL transcription completed in {}ms", processingTime);
            
            return ResponseEntity.ok(response);
            
        } catch (UnsupportedOperationException e) {
            // Handle the specific error for URL transcription not being supported directly
            log.warn("URL transcription not supported: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body(
                new SpeechTranscriptionResponseDto(
                    false, "", 0.0, 
                    "This feature requires Azure Speech Batch Transcription API: " + e.getMessage(),
                    extractFilenameFromUrl(audioUrl),
                    System.currentTimeMillis() - startTime
                )
            );
            
        } catch (Exception e) {
            log.error("Error processing URL transcription request: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                new SpeechTranscriptionResponseDto(
                    false, "", 0.0, 
                    "Internal server error during URL transcription: " + e.getMessage(),
                    extractFilenameFromUrl(audioUrl),
                    System.currentTimeMillis() - startTime
                )
            );
        }
    }
    
    /**
     * Extracts filename from a URL
     * 
     * @param url The URL to extract filename from
     * @return The extracted filename or the whole URL if extraction fails
     */
    private String extractFilenameFromUrl(String url) {
        if (url == null || url.isEmpty()) {
            return "";
        }
        
        try {
            // Try to extract filename from the URL path
            String path = new java.net.URL(url).getPath();
            int lastSlashIndex = path.lastIndexOf('/');
            if (lastSlashIndex >= 0 && lastSlashIndex < path.length() - 1) {
                return path.substring(lastSlashIndex + 1);
            }
        } catch (Exception e) {
            // If URL parsing fails, just return the original URL
            log.debug("Failed to extract filename from URL: {}", url, e);
        }
        
        return url;
    }

    /**
     * Validates the uploaded audio file
     *
     * @param audioFile The uploaded file to validate
     * @throws IllegalArgumentException if validation fails
     */
    private void validateAudioFile(MultipartFile audioFile) {
        // Check if file is null or empty
        if (audioFile == null) {
            throw new IllegalArgumentException("Audio file is required");
        }
        
        if (audioFile.isEmpty()) {
            throw new IllegalArgumentException("Audio file cannot be empty");
        }
        
        // Check original filename
        String originalFileName = audioFile.getOriginalFilename();
        if (originalFileName == null || originalFileName.trim().isEmpty()) {
            throw new IllegalArgumentException("File must have a valid name");
        }

        // Check file size
        if (audioFile.getSize() <= 0) {
            throw new IllegalArgumentException("Audio file has no content");
        }
        
        if (audioFile.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException(
                String.format("File size exceeds maximum limit of %d MB", MAX_FILE_SIZE / (1024 * 1024))
            );
        }

        // Check content type
        String contentType = audioFile.getContentType();
        if (contentType == null || !SUPPORTED_FORMATS.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException(
                "Unsupported file format. Supported formats: WAV, MP3, FLAC, OGG"
            );
        }
    }

    /**
     * Saves the uploaded file to a temporary location
     *
     * @param audioFile The uploaded file
     * @return The temporary file
     * @throws IOException if file operations fail
     */
    private File saveTemporaryFile(MultipartFile audioFile) throws IOException {
        // Create directory if it doesn't exist
        Path tempDir = Paths.get(TEMP_AUDIO_DIR);
        if (!Files.exists(tempDir)) {
            Files.createDirectories(tempDir);
            log.debug("Created temporary directory: {}", tempDir.toAbsolutePath());
        }

        // Generate unique filename
        String originalFileName = audioFile.getOriginalFilename();
        String fileExtension = getFileExtension(originalFileName);
        String uniqueFileName = String.format("audio_%d_%s%s", 
            System.currentTimeMillis(),
            Thread.currentThread().getId(),
            fileExtension
        );

        Path tempFilePath = tempDir.resolve(uniqueFileName);
        
        // Copy uploaded file to temporary location
        Files.copy(audioFile.getInputStream(), tempFilePath, StandardCopyOption.REPLACE_EXISTING);
        
        File tempFile = tempFilePath.toFile();
        log.debug("Saved temporary file: {}", tempFile.getAbsolutePath());
        
        return tempFile;
    }

    /**
     * Cleans up the temporary file
     *
     * @param tempFile The temporary file to delete
     */
    private void cleanupTemporaryFile(File tempFile) {
        if (tempFile != null && tempFile.exists()) {
            try {
                if (tempFile.delete()) {
                    log.debug("Deleted temporary file: {}", tempFile.getAbsolutePath());
                } else {
                    log.warn("Failed to delete temporary file: {}", tempFile.getAbsolutePath());
                }
            } catch (Exception e) {
                log.warn("Error deleting temporary file: {}", tempFile.getAbsolutePath(), e);
            }
        }
    }

    /**
     * Extracts file extension from filename
     *
     * @param fileName The filename
     * @return The file extension including the dot, or empty string if no extension
     */
    private String getFileExtension(String fileName) {
        if (fileName == null || fileName.isEmpty()) {
            return "";
        }
        
        int lastDotIndex = fileName.lastIndexOf('.');
        if (lastDotIndex > 0 && lastDotIndex < fileName.length() - 1) {
            return fileName.substring(lastDotIndex);
        }
        
        return "";
    }

    /**
     * Health check endpoint for the speech service
     *
     * @return Service status
     */
    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("Speech-to-Text service is running");
    }
}
