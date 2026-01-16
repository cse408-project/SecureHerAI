package com.secureherai.secureherai_api.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity for queuing notifications when user is offline.
 * Notifications are delivered when user comes online or via SMS fallback.
 */
@Entity
@Table(name = "notification_queue", indexes = {
        @Index(name = "idx_notification_queue_user_id", columnList = "user_id"),
        @Index(name = "idx_notification_queue_status", columnList = "status"),
        @Index(name = "idx_notification_queue_alert_id", columnList = "alert_id")
})
public class NotificationQueue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "alert_id")
    private UUID alertId;

    @Column(name = "notification_id")
    private Long notificationId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private QueueStatus status = QueueStatus.QUEUED;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "payload", columnDefinition = "TEXT")
    private String payload; // JSON string

    @Column(nullable = false)
    private Integer priority = 0;

    @Column(name = "attempt_count")
    private Integer attemptCount = 0;

    @Column(name = "max_attempts")
    private Integer maxAttempts = 5;

    @Column(name = "sms_fallback_enabled")
    private Boolean smsFallbackEnabled = true;

    @Column(name = "sms_sent")
    private Boolean smsSent = false;

    @Column(name = "sms_sent_at")
    private LocalDateTime smsSentAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    // Enums
    public enum QueueStatus {
        QUEUED, // Waiting to be delivered
        DELIVERED, // Successfully delivered via push/WebSocket
        SMS_SENT, // Delivered via SMS fallback
        FAILED, // Failed after all attempts
        EXPIRED, // Expired before delivery
        CANCELLED // Cancelled (e.g., alert resolved)
    }

    // Constructors
    public NotificationQueue() {
    }

    public NotificationQueue(UUID userId, UUID alertId, String title, String message, Integer priority) {
        this.userId = userId;
        this.alertId = alertId;
        this.title = title;
        this.message = message;
        this.priority = priority;
        this.expiresAt = LocalDateTime.now().plusHours(2); // Default 2 hour expiry
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public UUID getAlertId() {
        return alertId;
    }

    public void setAlertId(UUID alertId) {
        this.alertId = alertId;
    }

    public Long getNotificationId() {
        return notificationId;
    }

    public void setNotificationId(Long notificationId) {
        this.notificationId = notificationId;
    }

    public QueueStatus getStatus() {
        return status;
    }

    public void setStatus(QueueStatus status) {
        this.status = status;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getPayload() {
        return payload;
    }

    public void setPayload(String payload) {
        this.payload = payload;
    }

    public Integer getPriority() {
        return priority;
    }

    public void setPriority(Integer priority) {
        this.priority = priority;
    }

    public Integer getAttemptCount() {
        return attemptCount;
    }

    public void setAttemptCount(Integer attemptCount) {
        this.attemptCount = attemptCount;
    }

    public Integer getMaxAttempts() {
        return maxAttempts;
    }

    public void setMaxAttempts(Integer maxAttempts) {
        this.maxAttempts = maxAttempts;
    }

    public Boolean getSmsFallbackEnabled() {
        return smsFallbackEnabled;
    }

    public void setSmsFallbackEnabled(Boolean smsFallbackEnabled) {
        this.smsFallbackEnabled = smsFallbackEnabled;
    }

    public Boolean getSmsSent() {
        return smsSent;
    }

    public void setSmsSent(Boolean smsSent) {
        this.smsSent = smsSent;
    }

    public LocalDateTime getSmsSentAt() {
        return smsSentAt;
    }

    public void setSmsSentAt(LocalDateTime smsSentAt) {
        this.smsSentAt = smsSentAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getDeliveredAt() {
        return deliveredAt;
    }

    public void setDeliveredAt(LocalDateTime deliveredAt) {
        this.deliveredAt = deliveredAt;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }
}
