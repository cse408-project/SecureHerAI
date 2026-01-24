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
        @Query(value = "SELECT * FROM notification_queue WHERE status = 'QUEUED' " +
                        "AND sms_fallback_enabled = true AND sms_sent = false " +
                        "AND attempt_count >= :minAttempts AND expires_at > :now", nativeQuery = true)
        List<NotificationQueue> findNotificationsNeedingSMSFallback(
                        @Param("minAttempts") Integer minAttempts,
                        @Param("now") LocalDateTime now);

        /**
         * Find expired queued notifications
         */
        @Query(value = "SELECT * FROM notification_queue WHERE status = 'QUEUED' AND expires_at <= :now", nativeQuery = true)
        List<NotificationQueue> findExpiredNotifications(@Param("now") LocalDateTime now);

        /**
         * Cancel queued notifications for an alert
         */
        @Modifying
        @org.springframework.transaction.annotation.Transactional
        @Query(value = "UPDATE notification_queue SET status = 'CANCELLED' WHERE alert_id = :alertId AND status = 'QUEUED'", nativeQuery = true)
        int cancelQueuedNotificationsForAlert(@Param("alertId") UUID alertId);

        /**
         * Mark notifications as delivered
         */
        @Modifying
        @org.springframework.transaction.annotation.Transactional
        @Query(value = "UPDATE notification_queue SET status = 'DELIVERED', delivered_at = :now WHERE id IN :ids", nativeQuery = true)
        int markAsDelivered(@Param("ids") List<Long> ids, @Param("now") LocalDateTime now);

        /**
         * Increment attempt count
         */
        @Modifying
        @org.springframework.transaction.annotation.Transactional
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
