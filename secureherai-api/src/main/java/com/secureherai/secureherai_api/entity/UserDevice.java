package com.secureherai.secureherai_api.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_devices")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDevice {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;
    
    @Column(name = "user_id", nullable = false)
    private UUID userId;
    
    @Column(name = "fcm_token", nullable = false, unique = true)
    private String fcmToken;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "device_type", nullable = false)
    private DeviceType deviceType;
    
    @Column(name = "device_name")
    private String deviceName;
    
    @Column(name = "browser_info")
    private String browserInfo;
    
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @Column(name = "last_used_at")
    private LocalDateTime lastUsedAt;
    
    public enum DeviceType {
        WEB_BROWSER,
        ANDROID,
        IOS,
        DESKTOP
    }
    
    // Helper methods
    public void markAsUsed() {
        this.lastUsedAt = LocalDateTime.now();
    }
    
    public void activate() {
        this.isActive = true;
        markAsUsed();
    }
    
    public void deactivate() {
        this.isActive = false;
    }
}
