package com.secureherai.secureherai_api.entity;

import jakarta.persistence.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Collections;
import java.util.UUID;

@Entity
@Table(name = "users")
public class User implements UserDetails {
    
    @Id
    @GeneratedValue
    private UUID id;
    
    @Column(name = "full_name", nullable = false)
    private String fullName;
    
    @Column(nullable = false, unique = true)
    private String email;
    
    @Column(unique = true)
    private String phone;
    
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;
    
    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;
    
    @Column(name = "profile_picture", columnDefinition = "TEXT")
    private String profilePicture;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.USER;
    
    @Column(name = "email_alerts", nullable = false)
    private Boolean emailAlerts = true;
    
    @Column(name = "sms_alerts", nullable = false)
    private Boolean smsAlerts = true;
    
    @Column(name = "push_notifications", nullable = false)
    private Boolean pushNotifications = true;
    
    @Column(name = "contribution_points")
    private Integer contributionPoints = 0;
    
    // Password reset fields
    @Column(name = "reset_token")
    private String resetToken;
    
    @Column(name = "reset_token_expiry")
    private LocalDateTime resetTokenExpiry;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // UserDetails fields
    @Column(name = "is_account_non_expired", nullable = false)
    private Boolean isAccountNonExpired = true;
    
    @Column(name = "is_account_non_locked", nullable = false)
    private Boolean isAccountNonLocked = true;
    
    @Column(name = "is_credentials_non_expired", nullable = false)
    private Boolean isCredentialsNonExpired = true;
    
    @Column(name = "is_enabled", nullable = false)
    private Boolean isEnabled = true;
    
    public enum Role {
        USER, RESPONDER, ADMIN
    }
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Constructors
    public User() {}

    public User(String fullName, String email, String phone, String passwordHash, LocalDate dateOfBirth) {
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.passwordHash = passwordHash;
        this.dateOfBirth = dateOfBirth;
    }

    // UserDetails implementation
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return isAccountNonExpired != null ? isAccountNonExpired : true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return isAccountNonLocked != null ? isAccountNonLocked : true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return isCredentialsNonExpired != null ? isCredentialsNonExpired : true;
    }

    @Override
    public boolean isEnabled() {
        return isEnabled != null ? isEnabled : true;
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    
    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }
    
    public String getProfilePicture() { return profilePicture; }
    public void setProfilePicture(String profilePicture) { this.profilePicture = profilePicture; }
    
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    
    public Boolean getEmailAlerts() { return emailAlerts; }
    public void setEmailAlerts(Boolean emailAlerts) { this.emailAlerts = emailAlerts; }
    
    public Boolean getSmsAlerts() { return smsAlerts; }
    public void setSmsAlerts(Boolean smsAlerts) { this.smsAlerts = smsAlerts; }
    
    public Boolean getPushNotifications() { return pushNotifications; }
    public void setPushNotifications(Boolean pushNotifications) { this.pushNotifications = pushNotifications; }
    
    public Integer getContributionPoints() { return contributionPoints; }
    public void setContributionPoints(Integer contributionPoints) { this.contributionPoints = contributionPoints; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    // UserDetails field getters and setters
    public Boolean getIsAccountNonExpired() { return isAccountNonExpired; }
    public void setIsAccountNonExpired(Boolean isAccountNonExpired) { this.isAccountNonExpired = isAccountNonExpired; }
    
    public Boolean getIsAccountNonLocked() { return isAccountNonLocked; }
    public void setIsAccountNonLocked(Boolean isAccountNonLocked) { this.isAccountNonLocked = isAccountNonLocked; }
    
    public Boolean getIsCredentialsNonExpired() { return isCredentialsNonExpired; }
    public void setIsCredentialsNonExpired(Boolean isCredentialsNonExpired) { this.isCredentialsNonExpired = isCredentialsNonExpired; }
    
    public Boolean getIsEnabled() { return isEnabled; }
    public void setIsEnabled(Boolean isEnabled) { this.isEnabled = isEnabled; }
    
    // Reset token getters and setters
    public String getResetToken() { return resetToken; }
    public void setResetToken(String resetToken) { this.resetToken = resetToken; }
    
    public LocalDateTime getResetTokenExpiry() { return resetTokenExpiry; }
    public void setResetTokenExpiry(LocalDateTime resetTokenExpiry) { this.resetTokenExpiry = resetTokenExpiry; }
}