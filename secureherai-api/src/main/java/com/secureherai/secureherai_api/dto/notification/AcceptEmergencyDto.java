package com.secureherai.secureherai_api.dto.notification;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

/**
 * DTO for accepting emergency response
 */
public class AcceptEmergencyDto {
    
    @NotNull(message = "Alert ID is required")
    private UUID alertId;
    
    @NotNull(message = "Alert user ID is required")
    private UUID alertUserId;
    
    private String responderName;
    
    // Constructors
    public AcceptEmergencyDto() {}
    
    public AcceptEmergencyDto(UUID alertId, UUID alertUserId, String responderName) {
        this.alertId = alertId;
        this.alertUserId = alertUserId;
        this.responderName = responderName;
    }
    
    // Getters and setters
    public UUID getAlertId() {
        return alertId;
    }
    
    public void setAlertId(UUID alertId) {
        this.alertId = alertId;
    }
    
    public UUID getAlertUserId() {
        return alertUserId;
    }
    
    public void setAlertUserId(UUID alertUserId) {
        this.alertUserId = alertUserId;
    }
    
    public String getResponderName() {
        return responderName;
    }
    
    public void setResponderName(String responderName) {
        this.responderName = responderName;
    }
    
    @Override
    public String toString() {
        return "AcceptEmergencyDto{" +
                "alertId=" + alertId +
                ", alertUserId=" + alertUserId +
                ", responderName='" + responderName + '\'' +
                '}';
    }
}
