package com.secureherai.secureherai_api.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity for user settings including notification preferences and SOS keyword
 */
@Entity
@Table(name = "settings")
public class Settings {
    
    @Id
    @GeneratedValue
    private UUID id;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;
    
    // Notification preferences
    @Column(name = "email_alerts", nullable = false)
    private Boolean emailAlerts = true;
    
    @Column(name = "sms_alerts", nullable = false)
    private Boolean smsAlerts = true;
    
    @Column(name = "push_notifications", nullable = false)
    private Boolean pushNotifications = true;
    
    // SOS alert keyword (default: "help")
    @Column(name = "sos_keyword", nullable = false)
    private String sosKeyword = "help";
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Default constructor
    public Settings() {}
    
    // Constructor for new user settings with default values
    public Settings(User user) {
        this.user = user;
        this.emailAlerts = true;
        this.smsAlerts = true;
        this.pushNotifications = true;
        this.sosKeyword = "help";
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    // Constructor with all notification preferences
    public Settings(User user, Boolean emailAlerts, Boolean smsAlerts, Boolean pushNotifications, String sosKeyword) {
        this.user = user;
        this.emailAlerts = emailAlerts;
        this.smsAlerts = smsAlerts;
        this.pushNotifications = pushNotifications;
        this.sosKeyword = sosKeyword != null ? sosKeyword : "help";
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public UUID getId() {
        return id;
    }
    
    public void setId(UUID id) {
        this.id = id;
    }
    
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
    }
    
    public Boolean getEmailAlerts() {
        return emailAlerts;
    }
    
    public void setEmailAlerts(Boolean emailAlerts) {
        this.emailAlerts = emailAlerts;
    }
    
    public Boolean getSmsAlerts() {
        return smsAlerts;
    }
    
    public void setSmsAlerts(Boolean smsAlerts) {
        this.smsAlerts = smsAlerts;
    }
    
    public Boolean getPushNotifications() {
        return pushNotifications;
    }
    
    public void setPushNotifications(Boolean pushNotifications) {
        this.pushNotifications = pushNotifications;
    }
    
    public String getSosKeyword() {
        return sosKeyword;
    }
    
    public void setSosKeyword(String sosKeyword) {
        this.sosKeyword = sosKeyword != null ? sosKeyword : "help";
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
