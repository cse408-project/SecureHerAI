package com.secureherai.secureherai_api.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "notifications")
public class Notification {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id", nullable = false)
    private UUID userId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private NotificationType type;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private NotificationChannel channel;
    
    @Column(nullable = false, length = 100)
    private String title;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json")
    private Map<String, Object> payload;
    
    @Column(nullable = false)
    private Integer priority = 0;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private NotificationStatus status = NotificationStatus.PENDING;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "sent_at")
    private LocalDateTime sentAt;
    
    @Column(name = "read_at")
    private LocalDateTime readAt;
    
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;
    
    @Column(name = "batch_number")
    private Integer batchNumber;
    
    @Column(name = "alert_id")
    private UUID alertId;
    
    // Enums
    public enum NotificationType {
        EMERGENCY_NEARBY("Emergency alert sent to nearby responder"),
        EMERGENCY_TRUSTED_CONTACT("Emergency alert sent to user's trusted contact"),
        HEATMAP_ALERT("Proactive safety warning when entering a high-risk zone"),
        EMERGENCY_ACCEPTED("Confirmation that a responder has accepted your emergency alert"),
        ARE_YOU_SAFE("Are you safe? follow-up alert if emergency status remains unresolved"),
        SYSTEM_NOTIFICATION("App/system updates, maintenance notices, policy changes");
        
        private final String description;
        
        NotificationType(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    public enum NotificationChannel {
        IN_APP,
        EMAIL,
        BOTH
    }
    
    public enum NotificationStatus {
        PENDING,
        SENT,
        READ,
        FAILED
    }
    
    // Constructors
    public Notification() {}
    
    public Notification(UUID userId, NotificationType type, NotificationChannel channel, 
                       String title, String message) {
        this.userId = userId;
        this.type = type;
        this.channel = channel;
        this.title = title;
        this.message = message;
    }
    
    public Notification(UUID userId, NotificationType type, NotificationChannel channel, 
                       String title, String message, Map<String, Object> payload, Integer priority) {
        this.userId = userId;
        this.type = type;
        this.channel = channel;
        this.title = title;
        this.message = message;
        this.payload = payload;
        this.priority = priority;
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
    
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
    }
    
    public NotificationType getType() {
        return type;
    }
    
    public void setType(NotificationType type) {
        this.type = type;
    }
    
    public NotificationChannel getChannel() {
        return channel;
    }
    
    public void setChannel(NotificationChannel channel) {
        this.channel = channel;
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
    
    public Map<String, Object> getPayload() {
        return payload;
    }
    
    public void setPayload(Map<String, Object> payload) {
        this.payload = payload;
    }
    
    public Integer getPriority() {
        return priority;
    }
    
    public void setPriority(Integer priority) {
        this.priority = priority;
    }
    
    public NotificationStatus getStatus() {
        return status;
    }
    
    public void setStatus(NotificationStatus status) {
        this.status = status;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getSentAt() {
        return sentAt;
    }
    
    public void setSentAt(LocalDateTime sentAt) {
        this.sentAt = sentAt;
    }
    
    public LocalDateTime getReadAt() {
        return readAt;
    }
    
    public void setReadAt(LocalDateTime readAt) {
        this.readAt = readAt;
    }
    
    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }
    
    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }
    
    public Integer getBatchNumber() {
        return batchNumber;
    }
    
    public void setBatchNumber(Integer batchNumber) {
        this.batchNumber = batchNumber;
    }
    
    public UUID getAlertId() {
        return alertId;
    }
    
    public void setAlertId(UUID alertId) {
        this.alertId = alertId;
    }
    
    // Helper methods
    public void markAsSent() {
        this.status = NotificationStatus.SENT;
        this.sentAt = LocalDateTime.now();
    }
    
    public void markAsRead() {
        this.status = NotificationStatus.READ;
        this.readAt = LocalDateTime.now();
    }
    
    public void markAsFailed() {
        this.status = NotificationStatus.FAILED;
    }
    
    public boolean isRead() {
        return this.status == NotificationStatus.READ;
    }
    
    public boolean isSent() {
        return this.status == NotificationStatus.SENT || this.status == NotificationStatus.READ;
    }
    
    public boolean isExpired() {
        return expiresAt != null && LocalDateTime.now().isAfter(expiresAt);
    }
    
    public void setTTL(java.time.Duration ttl) {
        this.expiresAt = LocalDateTime.now().plus(ttl);
    }
    
    public boolean isPending() {
        return this.status == NotificationStatus.PENDING;
    }
    
    public boolean isFailed() {
        return this.status == NotificationStatus.FAILED;
    }
}
