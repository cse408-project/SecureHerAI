package com.secureherai.secureherai_api.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "incident_reports", 
       uniqueConstraints = {
           @UniqueConstraint(columnNames = {"user_id", "incident_time", "incident_type"})
       })
public class IncidentReport {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;
    
    @Column(name = "user_id", nullable = false)
    private UUID userId;
    
    @Column(name = "alert_id")
    private UUID alertId;
    
    @Column(name = "incident_type", nullable = false)
    private String incidentType; // harassment, theft, assault, other
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;
    
    @Column(precision = 9, scale = 6)
    private BigDecimal latitude;
    
    @Column(precision = 9, scale = 6)
    private BigDecimal longitude;
    
    private String address;
    
    @Column(name = "incident_time", nullable = false)
    private LocalDateTime incidentTime;
    
    @Column(nullable = false)
    private String visibility; // public, officials_only, private
    
    @Column(nullable = false)
    private Boolean anonymous = false;
    
    @Column(nullable = false)
    private String status = "submitted"; // submitted, under_review, resolved
    
    @Column(name = "action_taken", columnDefinition = "TEXT")
    private String actionTaken;
    
    @Column(name = "involved_parties", columnDefinition = "TEXT")
    private String involvedParties; // JSON string
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Constructors
    public IncidentReport() {}
    
    public IncidentReport(UUID userId, String incidentType, String description, 
                         BigDecimal latitude, BigDecimal longitude, 
                         LocalDateTime incidentTime, String visibility, Boolean anonymous) {
        this.userId = userId;
        this.incidentType = incidentType;
        this.description = description;
        this.latitude = latitude;
        this.longitude = longitude;
        this.incidentTime = incidentTime;
        this.visibility = visibility;
        this.anonymous = anonymous;
    }
    
    // Constructor without location (for optional location reports)
    public IncidentReport(UUID userId, String incidentType, String description, 
                         LocalDateTime incidentTime, String visibility, Boolean anonymous) {
        this.userId = userId;
        this.incidentType = incidentType;
        this.description = description;
        this.incidentTime = incidentTime;
        this.visibility = visibility;
        this.anonymous = anonymous;
        // latitude and longitude remain null
    }
    
    // Getters and Setters
    public UUID getId() {
        return id;
    }
    
    public void setId(UUID id) {
        this.id = id;
    }
    
    public UUID getUserId() {
        return userId;
    }
    
    public void setUserId(UUID userId) {
        this.userId = userId;
    }
    
    public UUID getAlertId() {
        return alertId;
    }
    
    public void setAlertId(UUID alertId) {
        this.alertId = alertId;
    }
    
    public String getIncidentType() {
        return incidentType;
    }
    
    public void setIncidentType(String incidentType) {
        this.incidentType = incidentType;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public BigDecimal getLatitude() {
        return latitude;
    }
    
    public void setLatitude(BigDecimal latitude) {
        this.latitude = latitude;
    }
    
    public BigDecimal getLongitude() {
        return longitude;
    }
    
    public void setLongitude(BigDecimal longitude) {
        this.longitude = longitude;
    }
    
    public String getAddress() {
        return address;
    }
    
    public void setAddress(String address) {
        this.address = address;
    }
    
    public LocalDateTime getIncidentTime() {
        return incidentTime;
    }
    
    public void setIncidentTime(LocalDateTime incidentTime) {
        this.incidentTime = incidentTime;
    }
    
    public String getVisibility() {
        return visibility;
    }
    
    public void setVisibility(String visibility) {
        this.visibility = visibility;
    }
    
    public Boolean getAnonymous() {
        return anonymous;
    }
    
    public void setAnonymous(Boolean anonymous) {
        this.anonymous = anonymous;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public String getActionTaken() {
        return actionTaken;
    }
    
    public void setActionTaken(String actionTaken) {
        this.actionTaken = actionTaken;
    }
    
    public String getInvolvedParties() {
        return involvedParties;
    }
    
    public void setInvolvedParties(String involvedParties) {
        this.involvedParties = involvedParties;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
