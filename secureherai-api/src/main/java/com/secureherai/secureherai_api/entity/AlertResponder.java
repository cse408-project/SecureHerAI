package com.secureherai.secureherai_api.entity;

import com.secureherai.secureherai_api.enums.AlertStatus;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "alert_responders")
@IdClass(AlertResponderId.class)
public class AlertResponder {
    
    @Id
    @Column(name = "alert_id")
    private UUID alertId;
    
    @Id
    @Column(name = "responder_id")
    private UUID responderId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "alert_id", insertable = false, updatable = false)
    private Alert alert;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responder_id", insertable = false, updatable = false)
    private Responder responder;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private AlertStatus status; // accepted, rejected, pending, forwarded, en_route, arrived, resolved
    
    private String eta;
    
    @CreationTimestamp
    @Column(name = "accepted_at", nullable = false)
    private LocalDateTime acceptedAt; // Note: Gets set for ALL records (pending, accepted, etc) - better named as "createdAt"
    
    @Column(name = "arrival_time")
    private LocalDateTime arrivalTime;
    
    private String notes;
    
    // Constructors
    public AlertResponder() {}
    
    public AlertResponder(UUID alertId, UUID responderId) {
        this.alertId = alertId;
        this.responderId = responderId;
        this.status = AlertStatus.ACCEPTED; // Default to accepted for backward compatibility
    }
    
    public AlertResponder(UUID alertId, UUID responderId, AlertStatus status) {
        this.alertId = alertId;
        this.responderId = responderId;
        this.status = status;
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
    
    public Alert getAlert() {
        return alert;
    }
    
    public void setAlert(Alert alert) {
        this.alert = alert;
    }
    
    public Responder getResponder() {
        return responder;
    }
    
    public void setResponder(Responder responder) {
        this.responder = responder;
    }
    
    public AlertStatus getStatus() {
        return status;
    }
    
    public void setStatus(AlertStatus status) {
        this.status = status;
    }
    
    public String getEta() {
        return eta;
    }
    
    public void setEta(String eta) {
        this.eta = eta;
    }
    
    public LocalDateTime getAcceptedAt() {
        return acceptedAt;
    }
    
    public void setAcceptedAt(LocalDateTime acceptedAt) {
        this.acceptedAt = acceptedAt;
    }
    
    public LocalDateTime getArrivalTime() {
        return arrivalTime;
    }
    
    public void setArrivalTime(LocalDateTime arrivalTime) {
        this.arrivalTime = arrivalTime;
    }
    
    public String getNotes() {
        return notes;
    }
    
    public void setNotes(String notes) {
        this.notes = notes;
    }
}
