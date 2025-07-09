package com.secureherai.secureherai_api.dto.sos;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Request DTO for canceling an SOS alert
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SOSCancelAlertRequestDto {
    
    @NotNull(message = "Alert ID is required")
    private UUID alertId;
}
