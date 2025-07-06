package com.secureherai.secureherai_api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for URL-based speech-to-text transcription
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AudioUrlRequestDto {
    
    /**
     * URL of the audio file to transcribe
     */
    private String audioUrl;
    
    /**
     * Optional language code (e.g., "en-US", "es-ES")
     * If not provided, defaults to "en-US"
     */
    private String languageCode;
}
