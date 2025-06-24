package com.secureherai.secureherai_api.dto.notification;

import java.time.LocalDateTime;
import java.util.UUID;

public class NotificationResponse {

    // Generic response for notification operations
    public static class GenericResponse {
        private boolean success;
        private String message;
        private String error;
        
        public GenericResponse() {}
        
        public GenericResponse(boolean success, String message, String error) {
            this.success = success;
            this.message = message;
            this.error = error;
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
        
        public String getError() {
            return error;
        }
        
        public void setError(String error) {
            this.error = error;
        }
    }
    
    // Get notification preferences response
    public static class GetPreferencesResponse {
        private boolean success;
        private NotificationPreferences preferences;
        private String error;
        
        public GetPreferencesResponse() {}
        
        public GetPreferencesResponse(boolean success, NotificationPreferences preferences, String error) {
            this.success = success;
            this.preferences = preferences;
            this.error = error;
        }
        
        // Getters and Setters
        public boolean isSuccess() {
            return success;
        }
        
        public void setSuccess(boolean success) {
            this.success = success;
        }
        
        public NotificationPreferences getPreferences() {
            return preferences;
        }
        
        public void setPreferences(NotificationPreferences preferences) {
            this.preferences = preferences;
        }
        
        public String getError() {
            return error;
        }
        
        public void setError(String error) {
            this.error = error;
        }
    }
    
    // Notification preferences class
    public static class NotificationPreferences {
        private Boolean emailAlerts;
        private Boolean smsAlerts;
        private Boolean pushNotifications;
        
        public NotificationPreferences() {}
        
        public NotificationPreferences(Boolean emailAlerts, Boolean smsAlerts, Boolean pushNotifications) {
            this.emailAlerts = emailAlerts;
            this.smsAlerts = smsAlerts;
            this.pushNotifications = pushNotifications;
        }
        
        // Getters and Setters
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
    }
    
    // Alert notification info
    public static class AlertNotificationInfo {
        private UUID id;
        private UUID alertId;
        private UUID contactId;
        private String recipientType;
        private String recipientName;
        private String status;
        private LocalDateTime notificationTime;
        
        public AlertNotificationInfo() {}
        
        public AlertNotificationInfo(UUID id, UUID alertId, UUID contactId, String recipientType, 
                                   String recipientName, String status, LocalDateTime notificationTime) {
            this.id = id;
            this.alertId = alertId;
            this.contactId = contactId;
            this.recipientType = recipientType;
            this.recipientName = recipientName;
            this.status = status;
            this.notificationTime = notificationTime;
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
}
