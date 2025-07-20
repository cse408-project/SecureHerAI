package com.secureherai.secureherai_api.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "trusted_contacts", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "phone"}))
public class TrustedContact {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;
    
    @Column(name = "user_id", nullable = false)
    private UUID userId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;
    
    @Column(nullable = false)
    private String name;
    
    @Column(nullable = false)
    private String relationship;
    
    @Column(nullable = false)
    private String phone;
    
    @Column(nullable = false)
    private String email;
    
    @Column(name = "share_location", nullable = false)
    private Boolean shareLocation = true;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    // Constructors
    public TrustedContact() {}
    
    public TrustedContact(UUID userId, String name, String relationship, String phone, String email, Boolean shareLocation) {
        this.userId = userId;
        this.name = name;
        this.relationship = relationship;
        this.phone = phone;
        this.email = email;
        this.shareLocation = shareLocation != null ? shareLocation : true;
    }
    
    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getRelationship() { return relationship; }
    public void setRelationship(String relationship) { this.relationship = relationship; }
    
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public Boolean getShareLocation() { return shareLocation; }
    public void setShareLocation(Boolean shareLocation) { this.shareLocation = shareLocation; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
