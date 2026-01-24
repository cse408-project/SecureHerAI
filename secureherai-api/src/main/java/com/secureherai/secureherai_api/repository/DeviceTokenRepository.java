package com.secureherai.secureherai_api.repository;

import com.secureherai.secureherai_api.entity.DeviceToken;
import com.secureherai.secureherai_api.entity.DeviceToken.Platform;
import com.secureherai.secureherai_api.entity.DeviceToken.TokenType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DeviceTokenRepository extends JpaRepository<DeviceToken, Long> {

    /**
     * Find all active tokens for a user
     */
    List<DeviceToken> findByUserIdAndIsActiveTrue(UUID userId);

    /**
     * Find token by its value
     */
    Optional<DeviceToken> findByToken(String token);

    /**
     * Find token by user and device ID
     */
    Optional<DeviceToken> findByUserIdAndDeviceId(UUID userId, String deviceId);

    /**
     * Find active tokens by user and platform
     */
    List<DeviceToken> findByUserIdAndPlatformAndIsActiveTrue(UUID userId, Platform platform);

    /**
     * Find all active Expo push tokens for a user
     */
    @Query("SELECT dt FROM DeviceToken dt WHERE dt.userId = :userId AND dt.tokenType = :tokenType AND dt.isActive = true")
    List<DeviceToken> findActiveTokensByType(@Param("userId") UUID userId, @Param("tokenType") TokenType tokenType);

    /**
     * Deactivate all tokens for a user (on logout)
     */
    @Modifying
    @org.springframework.transaction.annotation.Transactional
    @Query("UPDATE DeviceToken dt SET dt.isActive = false WHERE dt.userId = :userId")
    int deactivateAllTokensForUser(@Param("userId") UUID userId);

    /**
     * Deactivate a specific token
     */
    @Modifying
    @org.springframework.transaction.annotation.Transactional
    @Query("UPDATE DeviceToken dt SET dt.isActive = false WHERE dt.token = :token")
    int deactivateToken(@Param("token") String token);

    /**
     * Check if token exists and is active
     */
    boolean existsByTokenAndIsActiveTrue(String token);

    /**
     * Find all active tokens for multiple users (batch notification)
     */
    @Query("SELECT dt FROM DeviceToken dt WHERE dt.userId IN :userIds AND dt.isActive = true")
    List<DeviceToken> findActiveTokensForUsers(@Param("userIds") List<UUID> userIds);

    /**
     * Count tokens by user
     */
    long countByUserId(UUID userId);

    /**
     * Delete all tokens for a user
     */
    @Modifying
    @org.springframework.transaction.annotation.Transactional
    @Query("DELETE FROM DeviceToken dt WHERE dt.userId = :userId")
    void deleteByUserId(@Param("userId") UUID userId);
}
