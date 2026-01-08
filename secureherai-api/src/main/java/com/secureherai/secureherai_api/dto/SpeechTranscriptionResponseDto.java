package com.secureherai.secureherai_api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for speech-to-text transcription API with emotion detection
 * Powered by Gemini 2.5 Flash AI model
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpeechTranscriptionResponseDto {
    
    /**
     * Whether the transcription was successful
     */
    private boolean success;
    
    /**
     * The transcribed text from the audio
     */
    private String transcribedText;
    
    /**
     * Confidence score of the transcription (0.0 to 1.0)
     */
    private double confidence;
    
    /**
     * Status message or error description
     */
    private String message;
    
    /**
     * Original filename of the uploaded audio
     */
    private String fileName;
    
    /**
     * Processing time in milliseconds
     */
    private long processingTimeMs;
    
    // ==================== Emotion Detection Fields ====================
    
    /**
     * Detected emotion: happy, sad, angry, neutral, fearful, anxious
     */
    private String emotion;
    
    /**
     * Detected language name (e.g., "English")
     */
    private String language;
    
    /**
     * ISO language code (e.g., "en-US")
     */
    private String languageCode;
    
    /**
     * Whether the message contains urgency
     */
    private boolean urgent;
    
    /**
     * Whether the speaker sounds distressed
     */
    private boolean distressed;
    
    /**
     * Brief summary of the audio content
     */
    private String summary;
    
    /**
     * Constructor for basic response (backward compatibility)
     */
    public SpeechTranscriptionResponseDto(boolean success, String transcribedText, 
            double confidence, String message, String fileName, long processingTimeMs) {
        this.success = success;
        this.transcribedText = transcribedText;
        this.confidence = confidence;
        this.message = message;
        this.fileName = fileName;
        this.processingTimeMs = processingTimeMs;
        this.emotion = "neutral";
    }
}
