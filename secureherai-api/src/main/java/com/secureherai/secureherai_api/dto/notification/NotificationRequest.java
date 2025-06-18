package com.secureherai.secureherai_api.dto.notification;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public class NotificationRequest {    // Update notification preferences request
    public static class UpdatePreferences {
        // userId is now optional since it will be extracted from JWT token
        private String userId;
        
        @Valid
        @NotNull(message = "Preferences are required")
        private NotificationPreferences preferences;
        
        public UpdatePreferences() {}
        
        public UpdatePreferences(String userId, NotificationPreferences preferences) {
            this.userId = userId;
            this.preferences = preferences;
        }
        
        // Getters and Setters
        public String getUserId() {
            return userId;
        }
        
        public void setUserId(String userId) {
            this.userId = userId;
        }
        
        public NotificationPreferences getPreferences() {
            return preferences;
        }
        
        public void setPreferences(NotificationPreferences preferences) {
            this.preferences = preferences;
        }
    }
    
    // Notification preferences inner class
    public static class NotificationPreferences {
        @NotNull(message = "Email alerts preference is required")
        private Boolean emailAlerts;
        
        @NotNull(message = "SMS alerts preference is required")
        private Boolean smsAlerts;
        
        @NotNull(message = "Push notifications preference is required")
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
}
