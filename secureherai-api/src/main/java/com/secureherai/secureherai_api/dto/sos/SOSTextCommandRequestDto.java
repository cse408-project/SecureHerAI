package com.secureherai.secureherai_api.dto.sos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for text-based SOS alerts
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SOSTextCommandRequestDto {
    
    @NotBlank(message = "Text message is required")
    @Size(min = 1, max = 500, message = "Text message must be between 1 and 500 characters")
    private String message;
    
    /**
     * The keyword that triggers the alert (default: "help")
     */
    @NotBlank(message = "Keyword is required")
    private String keyword;
    
    @NotNull(message = "Location is required")
    @Valid
    private LocationDto location;
}
