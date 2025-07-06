package com.secureherai.secureherai_api.dto.sos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for URL-based voice command SOS alerts
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SOSVoiceUrlCommandRequestDto {
    
    @NotBlank(message = "Audio URL is required")
    private String audioUrl;
    
    @NotNull(message = "Location is required")
    @Valid
    private LocationDto location;
}
