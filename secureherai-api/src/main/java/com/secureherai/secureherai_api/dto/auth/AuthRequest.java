package com.secureherai.secureherai_api.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// Combined DTOs for Login, Register, and Password Reset
public class AuthRequest {

    // Login Request
    public static class Login {
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;
        
        @NotBlank(message = "Password is required")
        private String password;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }    // Register Request
    public static class Register {
        @NotBlank(message = "Full name is required")
        private String fullName;
        
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;
        
        @NotBlank(message = "Password is required")
        @Size(min = 8, message = "Password must be at least 8 characters long")
        private String password;
        
        @NotBlank(message = "Phone number is required")
        private String phoneNumber;
          private String dateOfBirth;
        
        // Role specification - mandatory
        @NotBlank(message = "Role is required")
        private String role; // "USER" or "RESPONDER"
        
        // Responder-specific fields (only required if role is "RESPONDER")
        private String responderType; // "POLICE", "MEDICAL", "FIRE", "SECURITY", "OTHER"
        private String badgeNumber;

        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        public String getPhoneNumber() { return phoneNumber; }
        public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
        public String getDateOfBirth() { return dateOfBirth; }
        public void setDateOfBirth(String dateOfBirth) { this.dateOfBirth = dateOfBirth; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        public String getResponderType() { return responderType; }
        public void setResponderType(String responderType) { this.responderType = responderType; }
        public String getBadgeNumber() { return badgeNumber; }
        public void setBadgeNumber(String badgeNumber) { this.badgeNumber = badgeNumber; }
    }

    // Forgot Password Request
    public static class ForgotPassword {
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
    }

    // Reset Password Request
    public static class ResetPassword {
        @NotBlank(message = "Token is required")
        private String token;
        
        @NotBlank(message = "New password is required")
        @Size(min = 8, message = "Password must be at least 8 characters long")
        private String newPassword;

        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }
        public String getNewPassword() { return newPassword; }
        public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
    }

    // Verify Login Code Request
    public static class VerifyLoginCode {
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;
        
        @NotBlank(message = "Login code is required")
        private String loginCode;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getLoginCode() { return loginCode; }
        public void setLoginCode(String loginCode) { this.loginCode = loginCode; }
    }    // Update Profile Request
    public static class UpdateProfile {
        @Size(max = 100, message = "Full name cannot exceed 100 characters")
        private String fullName;
        
        @Size(max = 20, message = "Phone number cannot exceed 20 characters")
        private String phoneNumber;
        
        @Size(max = 500, message = "Profile picture URL cannot exceed 500 characters")
        private String profilePicture; // URL to profile picture, not base64 data
        
        // Added date of birth field
        private String dateOfBirth;
        
        // Added email preferences
        private Boolean emailAlerts;
        private Boolean smsAlerts;
        private Boolean pushNotifications;
        
        // Responder-specific fields (only processed if user is a responder)
        private String status; // AVAILABLE, BUSY, OFF_DUTY
        private String responderType; // POLICE, MEDICAL, FIRE
        private String badgeNumber;

        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }
        public String getPhoneNumber() { return phoneNumber; }
        public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
        public String getProfilePicture() { return profilePicture; }
        public void setProfilePicture(String profilePicture) { this.profilePicture = profilePicture; }
        public String getDateOfBirth() { return dateOfBirth; }
        public void setDateOfBirth(String dateOfBirth) { this.dateOfBirth = dateOfBirth; }
        public Boolean getEmailAlerts() { return emailAlerts; }
        public void setEmailAlerts(Boolean emailAlerts) { this.emailAlerts = emailAlerts; }
        public Boolean getSmsAlerts() { return smsAlerts; }
        public void setSmsAlerts(Boolean smsAlerts) { this.smsAlerts = smsAlerts; }
        public Boolean getPushNotifications() { return pushNotifications; }
        public void setPushNotifications(Boolean pushNotifications) { this.pushNotifications = pushNotifications; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getResponderType() { return responderType; }
        public void setResponderType(String responderType) { this.responderType = responderType; }
        public String getBadgeNumber() { return badgeNumber; }
        public void setBadgeNumber(String badgeNumber) { this.badgeNumber = badgeNumber; }
    }
}
