package com.secureherai.secureherai_api.repository;

import com.secureherai.secureherai_api.entity.NotificationQueue;
import com.secureherai.secureherai_api.entity.NotificationQueue.QueueStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationQueueRepository extends JpaRepository<NotificationQueue, Long> {

    /**
     * Find queued notifications for a user (to deliver when online)
     */
    List<NotificationQueue> findByUserIdAndStatusOrderByPriorityDescCreatedAtAsc(UUID userId, QueueStatus status);

    /**
     * Find notifications needing SMS fallback
     */
    @Query("SELECT nq FROM NotificationQueue nq WHERE nq.status = 'QUEUED' " +
            "AND nq.smsFallbackEnabled = true AND nq.smsSent = false " +
            "AND nq.attemptCount >= :minAttempts AND nq.expiresAt > :now")
    List<NotificationQueue> findNotificationsNeedingSMSFallback(
            @Param("minAttempts") Integer minAttempts,
            @Param("now") LocalDateTime now);

    /**
     * Find expired queued notifications
     */
    @Query("SELECT nq FROM NotificationQueue nq WHERE nq.status = 'QUEUED' AND nq.expiresAt <= :now")
    List<NotificationQueue> findExpiredNotifications(@Param("now") LocalDateTime now);

    /**
     * Cancel queued notifications for an alert
     */
    @Modifying
    @Query("UPDATE NotificationQueue nq SET nq.status = 'CANCELLED' WHERE nq.alertId = :alertId AND nq.status = 'QUEUED'")
    int cancelQueuedNotificationsForAlert(@Param("alertId") UUID alertId);

    /**
     * Mark notifications as delivered
     */
    @Modifying
    @Query("UPDATE NotificationQueue nq SET nq.status = 'DELIVERED', nq.deliveredAt = :now WHERE nq.id IN :ids")
    int markAsDelivered(@Param("ids") List<Long> ids, @Param("now") LocalDateTime now);

    /**
     * Increment attempt count
     */
    @Modifying
    @Query("UPDATE NotificationQueue nq SET nq.attemptCount = nq.attemptCount + 1 WHERE nq.id = :id")
    int incrementAttemptCount(@Param("id") Long id);

    /**
     * Find all queued notifications for a user
     */
    List<NotificationQueue> findByUserIdAndStatus(UUID userId, QueueStatus status);

    /**
     * Find queued notifications by alert ID and status
     */
    List<NotificationQueue> findByAlertIdAndStatus(UUID alertId, QueueStatus status);

    /**
     * Count queued notifications for a user
     */
    long countByUserIdAndStatus(UUID userId, QueueStatus status);
}
