package com.secureherai.secureherai_api.dto.notification;

import com.secureherai.secureherai_api.entity.Notification;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

public class NotificationResponseDto {
    
    private Long id;
    private UUID userId;
    private Notification.NotificationType type;
    private Notification.NotificationChannel channel;
    private String title;
    private String message;
    private Map<String, Object> payload;
    private Integer priority;
    private Notification.NotificationStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime sentAt;
    private LocalDateTime readAt;
    
    // Constructors
    public NotificationResponseDto() {}
    
    public NotificationResponseDto(Notification notification) {
        this.id = notification.getId();
        this.userId = notification.getUserId();
        this.type = notification.getType();
        this.channel = notification.getChannel();
        this.title = notification.getTitle();
        this.message = notification.getMessage();
        this.payload = notification.getPayload();
        this.priority = notification.getPriority();
        this.status = notification.getStatus();
        this.createdAt = notification.getCreatedAt();
        this.sentAt = notification.getSentAt();
        this.readAt = notification.getReadAt();
    }
    
    // Static factory method
    public static NotificationResponseDto fromEntity(Notification notification) {
        return new NotificationResponseDto(notification);
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
    
    public Notification.NotificationType getType() {
        return type;
    }
    
    public void setType(Notification.NotificationType type) {
        this.type = type;
    }
    
    public Notification.NotificationChannel getChannel() {
        return channel;
    }
    
    public void setChannel(Notification.NotificationChannel channel) {
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
    
    public Notification.NotificationStatus getStatus() {
        return status;
    }
    
    public void setStatus(Notification.NotificationStatus status) {
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
}
