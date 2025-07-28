package com.secureherai.secureherai_api.repository;

import com.secureherai.secureherai_api.entity.UserDevice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserDeviceRepository extends JpaRepository<UserDevice, UUID> {
    
    /**
     * Find all active FCM tokens for a user
     */
    @Query("SELECT ud.fcmToken FROM UserDevice ud WHERE ud.userId = :userId AND ud.isActive = true")
    List<String> findActiveFcmTokensByUserId(@Param("userId") UUID userId);
    
    /**
     * Find all active devices for a user
     */
    List<UserDevice> findByUserIdAndIsActiveTrue(UUID userId);
    
    /**
     * Find device by FCM token
     */
    Optional<UserDevice> findByFcmToken(String fcmToken);
    
    /**
     * Check if FCM token exists for any user
     */
    boolean existsByFcmToken(String fcmToken);
    
    /**
     * Deactivate all devices for a user
     */
    @Modifying
    @Query("UPDATE UserDevice ud SET ud.isActive = false WHERE ud.userId = :userId")
    int deactivateAllDevicesForUser(@Param("userId") UUID userId);
    
    /**
     * Deactivate device by FCM token
     */
    @Modifying
    @Query("UPDATE UserDevice ud SET ud.isActive = false WHERE ud.fcmToken = :fcmToken")
    int deactivateDeviceByFcmToken(@Param("fcmToken") String fcmToken);
    
    /**
     * Update last used timestamp for a device
     */
    @Modifying
    @Query("UPDATE UserDevice ud SET ud.lastUsedAt = :timestamp WHERE ud.fcmToken = :fcmToken")
    int updateLastUsedAt(@Param("fcmToken") String fcmToken, @Param("timestamp") LocalDateTime timestamp);
    
    /**
     * Delete inactive devices older than specified date
     */
    @Modifying
    @Query("DELETE FROM UserDevice ud WHERE ud.isActive = false AND ud.updatedAt < :cutoffDate")
    int deleteInactiveDevicesOlderThan(@Param("cutoffDate") LocalDateTime cutoffDate);
    
    /**
     * Find all devices by user ID (active and inactive)
     */
    List<UserDevice> findByUserId(UUID userId);
    
    /**
     * Count active devices for a user
     */
    int countByUserIdAndIsActiveTrue(UUID userId);
}
