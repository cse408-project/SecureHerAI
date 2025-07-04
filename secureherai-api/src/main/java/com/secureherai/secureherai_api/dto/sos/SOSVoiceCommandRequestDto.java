package com.secureherai.secureherai_api.dto.sos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import org.springframework.web.multipart.MultipartFile;

/**
 * Request DTO for voice-based SOS alerts
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SOSVoiceCommandRequestDto {
    
    @NotNull(message = "Audio file is required")
    private MultipartFile audioFile;
    
    @NotNull(message = "Location is required")
    @Valid
    private LocationDto location;
}
