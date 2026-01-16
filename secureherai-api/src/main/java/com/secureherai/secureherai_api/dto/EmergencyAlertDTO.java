package com.secureherai.secureherai_api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for emergency alert notifications sent via WebSocket/Push
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmergencyAlertDTO {
    private UUID alertId;
    private String type; // EMERGENCY_NEARBY, ARE_YOU_SAFE, EMERGENCY_ACCEPTED, etc.
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String address;
    private String message;
    private LocalDateTime triggeredAt;
    private String victimName;
    private String victimPhone;
    private String victimProfilePicture;
    private Integer priority;
    private String status;
}
