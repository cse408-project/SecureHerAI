package com.secureherai.secureherai_api.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "alert_notifications")
public class AlertNotification {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;
    
    @Column(name = "alert_id", nullable = false)
    private UUID alertId;
    
    @Column(name = "contact_id")
    private UUID contactId; // Can be null for emergency services
    
    @Column(name = "recipient_type", nullable = false)
    private String recipientType; // trusted_contact, emergency_service
    
    @Column(name = "recipient_name", nullable = false)
    private String recipientName;
    
    @Column(nullable = false)
    private String status; // notified, notified_of_cancellation, failed
    
    @CreationTimestamp
    @Column(name = "notification_time", nullable = false)
    private LocalDateTime notificationTime;
    
    // Constructors
    public AlertNotification() {}
    
    public AlertNotification(UUID alertId, UUID contactId, String recipientType, String recipientName, String status) {
        this.alertId = alertId;
        this.contactId = contactId;
        this.recipientType = recipientType;
        this.recipientName = recipientName;
        this.status = status;
    }
    
    public AlertNotification(UUID alertId, String recipientType, String recipientName, String status) {
        this.alertId = alertId;
        this.recipientType = recipientType;
        this.recipientName = recipientName;
        this.status = status;
    }
    
    // Getters and Setters
    public UUID getId() {
        return id;
    }
    
    public void setId(UUID id) {
        this.id = id;
    }
    
    public UUID getAlertId() {
        return alertId;
    }
    
    public void setAlertId(UUID alertId) {
        this.alertId = alertId;
    }
    
    public UUID getContactId() {
        return contactId;
    }
    
    public void setContactId(UUID contactId) {
        this.contactId = contactId;
    }
    
    public String getRecipientType() {
        return recipientType;
    }
    
    public void setRecipientType(String recipientType) {
        this.recipientType = recipientType;
    }
    
    public String getRecipientName() {
        return recipientName;
    }
    
    public void setRecipientName(String recipientName) {
        this.recipientName = recipientName;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public LocalDateTime getNotificationTime() {
        return notificationTime;
    }
    
    public void setNotificationTime(LocalDateTime notificationTime) {
        this.notificationTime = notificationTime;
    }
}
