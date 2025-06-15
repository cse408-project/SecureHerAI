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
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.AVAILABLE;
    
    @Column(name = "current_latitude", precision = 9, scale = 6)
    private BigDecimal currentLatitude;
    
    @Column(name = "current_longitude", precision = 9, scale = 6)
    private BigDecimal currentLongitude;
    
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
    
    @Column(name = "last_status_update")
    private LocalDateTime lastStatusUpdate = LocalDateTime.now();
    
    public enum ResponderType {
        POLICE, MEDICAL, FIRE, SECURITY, OTHER
    }
    
    public enum Status {
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
        this.userId = user.getId();
        this.responderType = responderType;
        this.badgeNumber = badgeNumber;
    }

    // Getters and Setters
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    
    public User getUser() { return user; }
    public void setUser(User user) { 
        this.user = user;
        this.userId = user != null ? user.getId() : null;
    }
    
    public ResponderType getResponderType() { return responderType; }
    public void setResponderType(ResponderType responderType) { this.responderType = responderType; }
    
    public String getBadgeNumber() { return badgeNumber; }
    public void setBadgeNumber(String badgeNumber) { this.badgeNumber = badgeNumber; }
    
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    
    public BigDecimal getCurrentLatitude() { return currentLatitude; }
    public void setCurrentLatitude(BigDecimal currentLatitude) { this.currentLatitude = currentLatitude; }
    
    public BigDecimal getCurrentLongitude() { return currentLongitude; }
    public void setCurrentLongitude(BigDecimal currentLongitude) { this.currentLongitude = currentLongitude; }
    
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    
    public LocalDateTime getLastStatusUpdate() { return lastStatusUpdate; }
    public void setLastStatusUpdate(LocalDateTime lastStatusUpdate) { this.lastStatusUpdate = lastStatusUpdate; }
}
