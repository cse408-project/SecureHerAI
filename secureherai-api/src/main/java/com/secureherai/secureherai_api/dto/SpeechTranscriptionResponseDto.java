package com.secureherai.secureherai_api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for speech-to-text transcription API
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
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
}
