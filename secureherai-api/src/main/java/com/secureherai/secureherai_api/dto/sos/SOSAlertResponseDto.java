package com.secureherai.secureherai_api.dto.sos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO for SOS alert creation endpoints
 */
@Data
@NoArgsConstructor
public class SOSAlertResponseDto {
    
    private boolean success;
    private String message;
    
    // Alert details - only populated if success is true
    private UUID alertId;
    private UUID userId;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String address;
    private String triggerMethod;
    private String alertMessage;
    private String audioRecording;
    private LocalDateTime triggeredAt;
    private String status;
    private String verificationStatus;
    private LocalDateTime canceledAt;
    private LocalDateTime resolvedAt;
    
    /**
     * Constructor for successful responses with all alert details
     */
    public SOSAlertResponseDto(
            boolean success, 
            String message, 
            UUID alertId, 
            UUID userId, 
            BigDecimal latitude, 
            BigDecimal longitude, 
            String address,
            String triggerMethod, 
            String alertMessage,
            String audioRecording,
            LocalDateTime triggeredAt, 
            String status,
            String verificationStatus,
            LocalDateTime canceledAt,
            LocalDateTime resolvedAt) {
        this.success = success;
        this.message = message;
        this.alertId = alertId;
        this.userId = userId;
        this.latitude = latitude;
        this.longitude = longitude;
        this.address = address;
        this.triggerMethod = triggerMethod;
        this.alertMessage = alertMessage;
        this.audioRecording = audioRecording;
        this.triggeredAt = triggeredAt;
        this.status = status;
        this.verificationStatus = verificationStatus;
        this.canceledAt = canceledAt;
        this.resolvedAt = resolvedAt;
    }
    
    /**
     * Constructor for error responses
     */
    public SOSAlertResponseDto(boolean success, String message) {
        this.success = success;
        this.message = message;
    }
}
