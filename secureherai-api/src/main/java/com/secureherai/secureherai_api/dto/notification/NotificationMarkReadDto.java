package com.secureherai.secureherai_api.dto.notification;

import jakarta.validation.constraints.NotNull;

public class NotificationMarkReadDto {
    
    @NotNull(message = "Notification ID is required")
    private Long notificationId;
    
    // Constructors
    public NotificationMarkReadDto() {}
    
    public NotificationMarkReadDto(Long notificationId) {
        this.notificationId = notificationId;
    }
    
    // Getters and Setters
    public Long getNotificationId() {
        return notificationId;
    }
    
    public void setNotificationId(Long notificationId) {
        this.notificationId = notificationId;
    }
}
