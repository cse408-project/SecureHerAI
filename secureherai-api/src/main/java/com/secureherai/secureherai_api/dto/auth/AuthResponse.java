package com.secureherai.secureherai_api.dto.auth;

import java.time.LocalDate;
import java.time.LocalDateTime;

// Combined DTOs for all Authentication Responses
public class AuthResponse {

    // Login/Register Success Response
    public static class Success {
        private boolean success = true;
        private String token;
        private String userId;
        private String fullName;
        private String role;
        private String message;

        public Success() {}

        public Success(String token, String userId, String fullName, String role) {
            this.token = token;
            this.userId = userId;
            this.fullName = fullName;
            this.role = role;
        }

        public Success(String message) {
            this.message = message;
        }

        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }
        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }

    // Error Response
    public static class Error {
        private boolean success = false;
        private String error;

        public Error(String error) {
            this.error = error;
        }

        public boolean isSuccess() { return success; }
        public String getError() { return error; }
        public void setError(String error) { this.error = error; }
    }
    
    // Profile Response
    public static class Profile {
        private boolean success = true;
        private UserProfile data;

        public Profile(UserProfile data) {
            this.data = data;
        }

        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        public UserProfile getData() { return data; }
        public void setData(UserProfile data) { this.data = data; }

        public static class UserProfile {
            private String userId;
            private String fullName;
            private String email;
            private String phoneNumber;
            private String profilePicture;
            private LocalDate dateOfBirth;
            private UserSettings settings;
            private String role;
            // Responder-specific fields (only populated if role is RESPONDER)
            private ResponderInfo responderInfo;

            public UserProfile() {}

            public UserProfile(String userId, String fullName, String email, String phoneNumber, 
                             String profilePicture, LocalDate dateOfBirth, boolean emailAlerts, 
                             boolean smsAlerts, boolean pushNotifications) {
                this.userId = userId;
                this.fullName = fullName;
                this.email = email;
                this.phoneNumber = phoneNumber;
                this.profilePicture = profilePicture;
                this.dateOfBirth = dateOfBirth;
                this.settings = new UserSettings(emailAlerts, smsAlerts, pushNotifications, "help");
            }

            // Constructor with role
            public UserProfile(String userId, String fullName, String email, String phoneNumber, 
                             String profilePicture, LocalDate dateOfBirth, boolean emailAlerts, 
                             boolean smsAlerts, boolean pushNotifications, String role) {
                this(userId, fullName, email, phoneNumber, profilePicture, dateOfBirth, 
                     emailAlerts, smsAlerts, pushNotifications);
                this.role = role;
            }

            // Getters and Setters
            public String getUserId() { return userId; }
            public void setUserId(String userId) { this.userId = userId; }
            public String getFullName() { return fullName; }
            public void setFullName(String fullName) { this.fullName = fullName; }
            public String getEmail() { return email; }
            public void setEmail(String email) { this.email = email; }
            public String getPhoneNumber() { return phoneNumber; }
            public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
            public String getProfilePicture() { return profilePicture; }
            public void setProfilePicture(String profilePicture) { this.profilePicture = profilePicture; }
            public LocalDate getDateOfBirth() { return dateOfBirth; }
            public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }
            public UserSettings getSettings() { return settings; }
            public void setSettings(UserSettings settings) { this.settings = settings; }
            public String getRole() { return role; }
            public void setRole(String role) { this.role = role; }
            public ResponderInfo getResponderInfo() { return responderInfo; }
            public void setResponderInfo(ResponderInfo responderInfo) { this.responderInfo = responderInfo; }

            public static class ResponderInfo {
                private String responderType;
                private String badgeNumber;
                private String branchName;
                private String address;
                private java.math.BigDecimal currentLatitude;
                private java.math.BigDecimal currentLongitude;
                private String status;
                private boolean isActive;
                private LocalDateTime lastStatusUpdate;

                public ResponderInfo() {}

                public ResponderInfo(String responderType, String badgeNumber, String status, 
                                   boolean isActive, LocalDateTime lastStatusUpdate) {
                    this.responderType = responderType;
                    this.badgeNumber = badgeNumber;
                    this.status = status;
                    this.isActive = isActive;
                    this.lastStatusUpdate = lastStatusUpdate;
                }

                public ResponderInfo(String responderType, String badgeNumber, String branchName, String address,
                                   java.math.BigDecimal currentLatitude, java.math.BigDecimal currentLongitude,
                                   String status, boolean isActive, LocalDateTime lastStatusUpdate) {
                    this.responderType = responderType;
                    this.badgeNumber = badgeNumber;
                    this.branchName = branchName;
                    this.address = address;
                    this.currentLatitude = currentLatitude;
                    this.currentLongitude = currentLongitude;
                    this.status = status;
                    this.isActive = isActive;
                    this.lastStatusUpdate = lastStatusUpdate;
                }

                // Getters and Setters
                public String getResponderType() { return responderType; }
                public void setResponderType(String responderType) { this.responderType = responderType; }
                public String getBadgeNumber() { return badgeNumber; }
                public void setBadgeNumber(String badgeNumber) { this.badgeNumber = badgeNumber; }
                public String getBranchName() { return branchName; }
                public void setBranchName(String branchName) { this.branchName = branchName; }
                public String getAddress() { return address; }
                public void setAddress(String address) { this.address = address; }
                public java.math.BigDecimal getCurrentLatitude() { return currentLatitude; }
                public void setCurrentLatitude(java.math.BigDecimal currentLatitude) { this.currentLatitude = currentLatitude; }
                public java.math.BigDecimal getCurrentLongitude() { return currentLongitude; }
                public void setCurrentLongitude(java.math.BigDecimal currentLongitude) { this.currentLongitude = currentLongitude; }
                public String getStatus() { return status; }
                public void setStatus(String status) { this.status = status; }
                public boolean isActive() { return isActive; }
                public void setActive(boolean isActive) { this.isActive = isActive; }
                public LocalDateTime getLastStatusUpdate() { return lastStatusUpdate; }
                public void setLastStatusUpdate(LocalDateTime lastStatusUpdate) { this.lastStatusUpdate = lastStatusUpdate; }
            }
        }

        // UserSettings class for profile response
        public static class UserSettings {
            private boolean emailAlerts;
            private boolean smsAlerts;
            private boolean pushNotifications;
            private String sosKeyword;

            public UserSettings() {}

            public UserSettings(boolean emailAlerts, boolean smsAlerts, boolean pushNotifications, String sosKeyword) {
                this.emailAlerts = emailAlerts;
                this.smsAlerts = smsAlerts;
                this.pushNotifications = pushNotifications;
                this.sosKeyword = sosKeyword;
            }

            // Getters and Setters
            public boolean isEmailAlerts() { return emailAlerts; }
            public void setEmailAlerts(boolean emailAlerts) { this.emailAlerts = emailAlerts; }
            public boolean isSmsAlerts() { return smsAlerts; }
            public void setSmsAlerts(boolean smsAlerts) { this.smsAlerts = smsAlerts; }
            public boolean isPushNotifications() { return pushNotifications; }
            public void setPushNotifications(boolean pushNotifications) { this.pushNotifications = pushNotifications; }
            public String getSosKeyword() { return sosKeyword; }
            public void setSosKeyword(String sosKeyword) { this.sosKeyword = sosKeyword; }
        }
    }
}
