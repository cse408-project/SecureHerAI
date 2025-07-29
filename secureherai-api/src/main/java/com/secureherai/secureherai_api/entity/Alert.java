package com.secureherai.secureherai_api.entity;

import com.secureherai.secureherai_api.enums.AlertStatus;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "alerts")
public class Alert {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;
    
    @Column(name = "user_id", nullable = false)
    private UUID userId;
    
    @Column(nullable = false, precision = 9, scale = 6)
    private BigDecimal latitude;
    
    @Column(nullable = false, precision = 9, scale = 6)
    private BigDecimal longitude;
    
    private String address;
    
    @Column(name = "trigger_method", nullable = false)
    private String triggerMethod; // manual, voice, automatic
    
    @Column(name = "alert_message")
    private String alertMessage;
    
    @Column(name = "audio_recording")
    private String audioRecording; // URL reference to stored audio
    
    @CreationTimestamp
    @Column(name = "triggered_at", nullable = false)
    private LocalDateTime triggeredAt;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private AlertStatus status = AlertStatus.ACTIVE; // active, canceled, resolved, expired
    
    @Column(name = "verification_status")
    private String verificationStatus = "pending"; // pending, verified, rejected
    
    @Column(name = "canceled_at")
    private LocalDateTime canceledAt;
    
    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Constructors
    public Alert() {}
    
    public Alert(UUID userId, BigDecimal latitude, BigDecimal longitude, String triggerMethod) {
        this.userId = userId;
        this.latitude = latitude;
        this.longitude = longitude;
        this.triggerMethod = triggerMethod;
    }
    
    public Alert(UUID userId, BigDecimal latitude, BigDecimal longitude, String address, 
                String triggerMethod, String alertMessage) {
        this.userId = userId;
        this.latitude = latitude;
        this.longitude = longitude;
        this.address = address;
        this.triggerMethod = triggerMethod;
        this.alertMessage = alertMessage;
    }
    
    // Getters and Setters
    public UUID getId() {
        return id;
    }
    
    public void setId(UUID id) {
        this.id = id;
    }
    
    public UUID getUserId() {
        return userId;
    }
    
    public void setUserId(UUID userId) {
        this.userId = userId;
    }
    
    public BigDecimal getLatitude() {
        return latitude;
    }
    
    public void setLatitude(BigDecimal latitude) {
        this.latitude = latitude;
    }
    
    public BigDecimal getLongitude() {
        return longitude;
    }
    
    public void setLongitude(BigDecimal longitude) {
        this.longitude = longitude;
    }
    
    public String getAddress() {
        return address;
    }
    
    public void setAddress(String address) {
        this.address = address;
    }
    
    public String getTriggerMethod() {
        return triggerMethod;
    }
    
    public void setTriggerMethod(String triggerMethod) {
        this.triggerMethod = triggerMethod;
    }
    
    public String getAlertMessage() {
        return alertMessage;
    }
    
    public void setAlertMessage(String alertMessage) {
        this.alertMessage = alertMessage;
    }
    
    public String getAudioRecording() {
        return audioRecording;
    }
    
    public void setAudioRecording(String audioRecording) {
        this.audioRecording = audioRecording;
    }
    
    public LocalDateTime getTriggeredAt() {
        return triggeredAt;
    }
    
    public void setTriggeredAt(LocalDateTime triggeredAt) {
        this.triggeredAt = triggeredAt;
    }
    
    public AlertStatus getStatus() {
        return status;
    }
    
    public void setStatus(AlertStatus status) {
        this.status = status;
    }
    
    public String getVerificationStatus() {
        return verificationStatus;
    }
    
    public void setVerificationStatus(String verificationStatus) {
        this.verificationStatus = verificationStatus;
    }
    
    public LocalDateTime getCanceledAt() {
        return canceledAt;
    }
    
    public void setCanceledAt(LocalDateTime canceledAt) {
        this.canceledAt = canceledAt;
    }
    
    public LocalDateTime getResolvedAt() {
        return resolvedAt;
    }
    
    public void setResolvedAt(LocalDateTime resolvedAt) {
        this.resolvedAt = resolvedAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
