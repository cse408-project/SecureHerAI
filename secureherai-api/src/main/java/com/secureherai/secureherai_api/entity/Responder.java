package com.secureherai.secureherai_api.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "responders")
public class Responder {
    
    @Id
    @Column(name = "user_id")
    private UUID userId;
    
    @OneToOne
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "responder_type", nullable = false)
    private ResponderType responderType;
    
    @Column(name = "badge_number", unique = true)
    private String badgeNumber;
    
    @Column(name = "branch_name")
    private String branchName;
    
    @Column(name = "address")
    private String address;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.AVAILABLE;
    
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
    
    @Column(name = "last_status_update")
    private LocalDateTime lastStatusUpdate = LocalDateTime.now();
    
    public enum ResponderType {
        POLICE, MEDICAL, FIRE, SECURITY, OTHER
    }
    
    public enum Status {
        // Note: Even though enum is uppercase, JPA will convert to lowercase when storing in DB
        // so it will match the schema values: 'available', 'busy', 'off_duty'
        AVAILABLE, BUSY, OFF_DUTY
    }
    
    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        lastStatusUpdate = LocalDateTime.now();
    }

    // Constructors
    public Responder() {}

    public Responder(User user, ResponderType responderType, String badgeNumber) {
        this.user = user;
        // userId is managed by @MapsId - it will be set automatically
        this.responderType = responderType;
        this.badgeNumber = badgeNumber;
        this.status = Status.AVAILABLE;
    }

    public Responder(User user, ResponderType responderType, String badgeNumber, String branchName, String address) {
        this.user = user;
        this.responderType = responderType;
        this.badgeNumber = badgeNumber;
        this.branchName = branchName;
        this.address = address;
        this.status = Status.AVAILABLE;
    }

    // Getters and Setters
    public UUID getUserId() { return userId; }
    // With @MapsId, we don't need to set userId explicitly
    public void setUserId(UUID userId) { this.userId = userId; }
    
    public User getUser() { return user; }
    public void setUser(User user) { 
        this.user = user;
        // With @MapsId, we don't need to set userId explicitly
    }
    
    public ResponderType getResponderType() { return responderType; }
    public void setResponderType(ResponderType responderType) { this.responderType = responderType; }
    
    public String getBadgeNumber() { return badgeNumber; }
    public void setBadgeNumber(String badgeNumber) { this.badgeNumber = badgeNumber; }
    
    public String getBranchName() { return branchName; }
    public void setBranchName(String branchName) { this.branchName = branchName; }
    
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    
    public LocalDateTime getLastStatusUpdate() { return lastStatusUpdate; }
    public void setLastStatusUpdate(LocalDateTime lastStatusUpdate) { this.lastStatusUpdate = lastStatusUpdate; }
}
