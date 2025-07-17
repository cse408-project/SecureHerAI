package com.secureherai.secureherai_api.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "favourite_place")
public class FavouritePlace {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;
    
    @Column(name = "user_id", nullable = false)
    private UUID userId;
    
    @Column(nullable = false, precision = 9, scale = 6)
    private BigDecimal latitude;
    
    @Column(nullable = false, precision = 9, scale = 6)
    private BigDecimal longitude;
    
    private String address;
    
    @Column(name = "place_name", nullable = false)
    private String placeName;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    // Constructors
    public FavouritePlace() {}
    
    public FavouritePlace(UUID userId, BigDecimal latitude, BigDecimal longitude, String placeName) {
        this.userId = userId;
        this.latitude = latitude;
        this.longitude = longitude;
        this.placeName = placeName;
        this.createdAt = LocalDateTime.now();
    }
    
    public FavouritePlace(UUID userId, BigDecimal latitude, BigDecimal longitude, String address, 
                String placeName, String imageUrl) {
        this.userId = userId;
        this.latitude = latitude;
        this.longitude = longitude;
        this.address = address;
        this.placeName = placeName;
        this.imageUrl = imageUrl;
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
    
    public String getPlaceName() {
        return placeName;
    }

    public void setPlaceName(String placeName) {
        this.placeName = placeName;
    }

    public String getImageUrl() {
        return imageUrl;
    }
    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
