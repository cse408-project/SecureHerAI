package com.secureherai.secureherai_api.dto.contacts;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class ContactResponse {
    
    // Generic Response for simple success/error messages
    public static class GenericResponse {
        private boolean success;
        private String message;
        private String error;
        
        public GenericResponse(boolean success, String message, String error) {
            this.success = success;
            this.message = message;
            this.error = error;
        }
        
        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        
        public String getError() { return error; }
        public void setError(String error) { this.error = error; }
    }
    
    // Get Contacts Response
    public static class GetContactsResponse {
        private boolean success;
        private List<ContactInfo> contacts;
        
        public GetContactsResponse(boolean success, List<ContactInfo> contacts) {
            this.success = success;
            this.contacts = contacts;
        }
        
        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        
        public List<ContactInfo> getContacts() { return contacts; }
        public void setContacts(List<ContactInfo> contacts) { this.contacts = contacts; }
    }
    
    // Contact Info DTO for responses
    public static class ContactInfo {
        private String contactId;
        private String name;
        private String phone;
        private String relationship;
        private String email;
        private Boolean shareLocation;
        private LocalDateTime createdAt;
        
        public ContactInfo() {}
        
        public ContactInfo(String contactId, String name, String phone, String relationship, 
                          String email, Boolean shareLocation) {
            this.contactId = contactId;
            this.name = name;
            this.phone = phone;
            this.relationship = relationship;
            this.email = email;
            this.shareLocation = shareLocation;
        }
        
        public ContactInfo(UUID contactId, String name, String phone, String relationship, 
                          String email, Boolean shareLocation, LocalDateTime createdAt) {
            this.contactId = contactId != null ? contactId.toString() : null;
            this.name = name;
            this.phone = phone;
            this.relationship = relationship;
            this.email = email;
            this.shareLocation = shareLocation;
            this.createdAt = createdAt;
        }
        
        // Getters and Setters
        public String getContactId() { return contactId; }
        public void setContactId(String contactId) { this.contactId = contactId; }
        
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        
        public String getRelationship() { return relationship; }
        public void setRelationship(String relationship) { this.relationship = relationship; }
        
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        
        public Boolean getShareLocation() { return shareLocation; }
        public void setShareLocation(Boolean shareLocation) { this.shareLocation = shareLocation; }
        
        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    }
}
