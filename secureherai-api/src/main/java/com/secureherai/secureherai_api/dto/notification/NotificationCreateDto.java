package com.secureherai.secureherai_api.dto.notification;

import com.secureherai.secureherai_api.entity.Notification;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.Map;
import java.util.UUID;

public class NotificationCreateDto {
    
    @NotNull(message = "User ID is required")
    private UUID userId;
    
    @NotNull(message = "Notification type is required")
    private Notification.NotificationType type;
    
    @NotNull(message = "Notification channel is required")
    private Notification.NotificationChannel channel;
    
    @NotBlank(message = "Title is required")
    private String title;
    
    @NotBlank(message = "Message is required")
    private String message;
    
    private Map<String, Object> payload;
    
    private Integer priority = 0;
    
    // Constructors
    public NotificationCreateDto() {}
    
    public NotificationCreateDto(UUID userId, Notification.NotificationType type, 
                                Notification.NotificationChannel channel, String title, String message) {
        this.userId = userId;
        this.type = type;
        this.channel = channel;
        this.title = title;
        this.message = message;
    }
    
    public NotificationCreateDto(UUID userId, Notification.NotificationType type, 
                                Notification.NotificationChannel channel, String title, String message,
                                Map<String, Object> payload, Integer priority) {
        this.userId = userId;
        this.type = type;
        this.channel = channel;
        this.title = title;
        this.message = message;
        this.payload = payload;
        this.priority = priority;
    }
    
    // Getters and Setters
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
}
