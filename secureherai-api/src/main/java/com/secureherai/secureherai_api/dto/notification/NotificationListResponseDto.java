package com.secureherai.secureherai_api.dto.notification;

import java.util.List;

public class NotificationListResponseDto {
    
    private boolean success;
    private String message;
    private List<NotificationResponseDto> notifications;
    private long totalCount;
    private long unreadCount;
    
    // Constructors
    public NotificationListResponseDto() {}
    
    public NotificationListResponseDto(boolean success, String message) {
        this.success = success;
        this.message = message;
    }
    
    public NotificationListResponseDto(boolean success, String message, 
                                     List<NotificationResponseDto> notifications, 
                                     long totalCount, long unreadCount) {
        this.success = success;
        this.message = message;
        this.notifications = notifications;
        this.totalCount = totalCount;
        this.unreadCount = unreadCount;
    }
    
    // Static factory methods
    public static NotificationListResponseDto success(List<NotificationResponseDto> notifications, 
                                                     long totalCount, long unreadCount) {
        return new NotificationListResponseDto(true, "Notifications retrieved successfully", 
                                              notifications, totalCount, unreadCount);
    }
    
    public static NotificationListResponseDto error(String message) {
        return new NotificationListResponseDto(false, message);
    }
    
    // Getters and Setters
    public boolean isSuccess() {
        return success;
    }
    
    public void setSuccess(boolean success) {
        this.success = success;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    public List<NotificationResponseDto> getNotifications() {
        return notifications;
    }
    
    public void setNotifications(List<NotificationResponseDto> notifications) {
        this.notifications = notifications;
    }
    
    public long getTotalCount() {
        return totalCount;
    }
    
    public void setTotalCount(long totalCount) {
        this.totalCount = totalCount;
    }
    
    public long getUnreadCount() {
        return unreadCount;
    }
    
    public void setUnreadCount(long unreadCount) {
        this.unreadCount = unreadCount;
    }
}
