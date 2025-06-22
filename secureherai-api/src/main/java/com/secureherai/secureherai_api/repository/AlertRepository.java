package com.secureherai.secureherai_api.repository;

import com.secureherai.secureherai_api.entity.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AlertRepository extends JpaRepository<Alert, UUID> {
    
    // Find alerts by user ID
    List<Alert> findByUserId(UUID userId);
    
    // Find active alerts by user ID
    List<Alert> findByUserIdAndStatus(UUID userId, String status);
    
    // Find alert by ID and user ID (for authorization)
    Optional<Alert> findByIdAndUserId(UUID id, UUID userId);
    
    // Find alerts within a time range
    List<Alert> findByTriggeredAtBetween(LocalDateTime startTime, LocalDateTime endTime);
    
    // Find alerts by status
    List<Alert> findByStatus(String status);
    
    // Find alerts by verification status
    List<Alert> findByVerificationStatus(String verificationStatus);
    
    // Find recent alerts by user (last 24 hours)
    @Query("SELECT a FROM Alert a WHERE a.userId = :userId AND a.triggeredAt >= :since ORDER BY a.triggeredAt DESC")
    List<Alert> findRecentAlertsByUser(@Param("userId") UUID userId, @Param("since") LocalDateTime since);
    
    // Find active alerts for all users (for responders)
    @Query("SELECT a FROM Alert a WHERE a.status = 'active' ORDER BY a.triggeredAt DESC")
    List<Alert> findActiveAlerts();
    
    // Count alerts by user and status
    @Query("SELECT COUNT(a) FROM Alert a WHERE a.userId = :userId AND a.status = :status")
    Long countByUserIdAndStatus(@Param("userId") UUID userId, @Param("status") String status);
}
