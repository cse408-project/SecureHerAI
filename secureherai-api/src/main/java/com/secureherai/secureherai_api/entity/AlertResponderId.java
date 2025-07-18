package com.secureherai.secureherai_api.entity;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class AlertResponderId implements Serializable {
    
    private UUID alertId;
    private UUID responderId;
    
    // Default constructor
    public AlertResponderId() {}
    
    // Constructor with parameters
    public AlertResponderId(UUID alertId, UUID responderId) {
        this.alertId = alertId;
        this.responderId = responderId;
    }
    
    // Getters and Setters
    public UUID getAlertId() {
        return alertId;
    }
    
    public void setAlertId(UUID alertId) {
        this.alertId = alertId;
    }
    
    public UUID getResponderId() {
        return responderId;
    }
    
    public void setResponderId(UUID responderId) {
        this.responderId = responderId;
    }
    
    // equals and hashCode for composite key
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        AlertResponderId that = (AlertResponderId) o;
        return Objects.equals(alertId, that.alertId) && 
               Objects.equals(responderId, that.responderId);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(alertId, responderId);
    }
    
    @Override
    public String toString() {
        return "AlertResponderId{" +
                "alertId=" + alertId +
                ", responderId=" + responderId +
                '}';
    }
}
