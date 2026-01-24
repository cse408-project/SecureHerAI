package com.secureherai.secureherai_api.repository;

import com.secureherai.secureherai_api.entity.Alert;
import com.secureherai.secureherai_api.enums.AlertStatus;
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
public interface AlertRepository extends JpaRepository<Alert, UUID> {

    // Find alerts by user ID
    List<Alert> findByUserId(UUID userId);

    // Find active alerts by user ID
    List<Alert> findByUserIdAndStatus(UUID userId, AlertStatus status);

    // Find alert by ID and user ID (for authorization)
    Optional<Alert> findByIdAndUserId(UUID id, UUID userId);

    // Find alerts within a time range
    List<Alert> findByTriggeredAtBetween(LocalDateTime startTime, LocalDateTime endTime);

    // Find alerts by status
    List<Alert> findByStatus(AlertStatus status);

    // Find alerts by verification status
    List<Alert> findByVerificationStatus(String verificationStatus);

    // Find recent alerts by user (last 24 hours)
    @Query("SELECT a FROM Alert a WHERE a.userId = :userId AND a.triggeredAt >= :since ORDER BY a.triggeredAt DESC")
    List<Alert> findRecentAlertsByUser(@Param("userId") UUID userId, @Param("since") LocalDateTime since);

    // Find active alerts for all users (for responders) - only ACTIVE status
    @Query(value = "SELECT * FROM alerts WHERE status = 'ACTIVE' ORDER BY triggered_at DESC", nativeQuery = true)
    List<Alert> findActiveAlerts();

    // Find only alerts with high severity (for priority)
    @Query(value = "SELECT * FROM alerts WHERE status = 'ACTIVE' AND severity = 'CRITICAL' ORDER BY triggered_at DESC", nativeQuery = true)
    List<Alert> findCriticalAlerts();

    // Find all alerts for all users (for responders)
    @Query("SELECT a FROM Alert a ORDER BY a.triggeredAt DESC")
    List<Alert> findAllAlerts();

    // Count alerts by user and status
    @Query("SELECT COUNT(a) FROM Alert a WHERE a.userId = :userId AND a.status = :status")
    Long countByUserIdAndStatus(@Param("userId") UUID userId, @Param("status") AlertStatus status);

    // Find only alert IDs by user ID (to avoid loading full entities with
    // relationships)
    @Query("SELECT a.id FROM Alert a WHERE a.userId = :userId")
    List<UUID> findAlertIdsByUserId(@Param("userId") UUID userId);

    // Delete all alerts by user ID (for account deletion)
    @Modifying
    @org.springframework.transaction.annotation.Transactional
    @Query("DELETE FROM Alert a WHERE a.userId = :userId")
    void deleteByUserId(@Param("userId") UUID userId);
}
