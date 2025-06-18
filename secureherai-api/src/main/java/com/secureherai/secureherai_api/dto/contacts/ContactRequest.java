package com.secureherai.secureherai_api.dto.contacts;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public class ContactRequest {
    
    // Add Trusted Contact Request
    public static class AddTrustedContact {
        @NotNull(message = "User ID is required")
        private String userId;
        
        @Valid
        @NotNull(message = "Contact information is required")
        private ContactInfo contact;
        
        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        
        public ContactInfo getContact() { return contact; }
        public void setContact(ContactInfo contact) { this.contact = contact; }
        
        public static class ContactInfo {
            @NotBlank(message = "Name is required")
            private String name;
            
            @NotBlank(message = "Phone number is required")
            @Pattern(regexp = "^\\+[1-9]\\d{1,14}$", message = "Invalid phone number format. Use international format: +1234567890")
            private String phone;
            
            @NotBlank(message = "Relationship is required")
            private String relationship;
            
            @Email(message = "Invalid email format")
            private String email;
            
            private Boolean shareLocation = true;
            
            // Getters and Setters
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
        }
    }
    
    // Delete Trusted Contact Request
    public static class DeleteTrustedContact {
        @NotNull(message = "User ID is required")
        private String userId;
        
        @NotNull(message = "Contact ID is required")
        private String contactId;
        
        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        
        public String getContactId() { return contactId; }
        public void setContactId(String contactId) { this.contactId = contactId; }
    }
}
