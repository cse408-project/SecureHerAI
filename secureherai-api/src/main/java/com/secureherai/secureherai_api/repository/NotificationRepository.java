package com.secureherai.secureherai_api.repository;

import com.secureherai.secureherai_api.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    // Find notifications by user ID
    List<Notification> findByUserIdOrderByCreatedAtDesc(UUID userId);
    
    // Find notifications by user ID with pagination
    Page<Notification> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);
    
    // Find unread notifications for a user
    List<Notification> findByUserIdAndStatusOrderByCreatedAtDesc(UUID userId, Notification.NotificationStatus status);
    
    // Find notifications by type for a user
    List<Notification> findByUserIdAndTypeOrderByCreatedAtDesc(UUID userId, Notification.NotificationType type);
    
    // Count unread notifications for a user
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.userId = :userId AND n.status = :status")
    long countByUserIdAndStatus(@Param("userId") UUID userId, @Param("status") Notification.NotificationStatus status);
    
    // Find high priority pending notifications
    @Query("SELECT n FROM Notification n WHERE n.status = :status AND n.priority >= :minPriority ORDER BY n.priority DESC, n.createdAt ASC")
    List<Notification> findHighPriorityPendingNotifications(@Param("status") Notification.NotificationStatus status, @Param("minPriority") Integer minPriority);
    
    // Find pending notifications by type
    List<Notification> findByStatusAndTypeOrderByCreatedAtAsc(Notification.NotificationStatus status, Notification.NotificationType type);
    
    // Mark notification as read
    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.status = :status, n.readAt = :readAt WHERE n.id = :id AND n.userId = :userId")
    int markAsRead(@Param("id") Long id, @Param("userId") UUID userId, @Param("status") Notification.NotificationStatus status, @Param("readAt") LocalDateTime readAt);
    
    // Mark all notifications as read for a user
    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.status = :newStatus, n.readAt = :readAt WHERE n.userId = :userId AND n.status = :currentStatus")
    int markAllAsRead(@Param("userId") UUID userId, @Param("currentStatus") Notification.NotificationStatus currentStatus, @Param("newStatus") Notification.NotificationStatus newStatus, @Param("readAt") LocalDateTime readAt);
    
    // Update notification status
    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.status = :status, n.sentAt = :sentAt WHERE n.id = :id")
    int updateStatus(@Param("id") Long id, @Param("status") Notification.NotificationStatus status, @Param("sentAt") LocalDateTime sentAt);
    
    // Find notifications that need to be sent (pending status)
    @Query("SELECT n FROM Notification n WHERE n.status = :status ORDER BY n.priority DESC, n.createdAt ASC")
    List<Notification> findPendingNotifications(@Param("status") Notification.NotificationStatus status);
    
    // Find notifications created after a specific time
    @Query("SELECT n FROM Notification n WHERE n.userId = :userId AND n.createdAt > :since ORDER BY n.createdAt DESC")
    List<Notification> findByUserIdAndCreatedAtAfter(@Param("userId") UUID userId, @Param("since") LocalDateTime since);
    
    // Delete old notifications (cleanup)
    @Modifying
    @Transactional
    @Query("DELETE FROM Notification n WHERE n.createdAt < :cutoffDate AND n.status = :status")
    int deleteOldNotifications(@Param("cutoffDate") LocalDateTime cutoffDate, @Param("status") Notification.NotificationStatus status);
    
    // Find notifications by channel
    List<Notification> findByChannelAndStatusOrderByCreatedAtAsc(Notification.NotificationChannel channel, Notification.NotificationStatus status);
    
    // Get notification statistics for a user
    @Query("SELECT " +
           "COUNT(CASE WHEN n.status = 'PENDING' THEN 1 END) as pending, " +
           "COUNT(CASE WHEN n.status = 'SENT' THEN 1 END) as sent, " +
           "COUNT(CASE WHEN n.status = 'READ' THEN 1 END) as read, " +
           "COUNT(CASE WHEN n.status = 'FAILED' THEN 1 END) as failed " +
           "FROM Notification n WHERE n.userId = :userId")
    Object[] getNotificationStats(@Param("userId") UUID userId);
    
    // TTL and batch-related queries
    @Query("SELECT n FROM Notification n WHERE n.alertId = :alertId AND n.type = :type AND n.status = :status")
    List<Notification> findByAlertIdAndTypeAndStatus(
        @Param("alertId") UUID alertId, 
        @Param("type") Notification.NotificationType type,
        @Param("status") Notification.NotificationStatus status
    );
    
    @Query("SELECT n FROM Notification n WHERE n.expiresAt < :now AND n.status = :status AND n.type = :type")
    List<Notification> findExpiredEmergencyNotifications(
        @Param("now") LocalDateTime now,
        @Param("status") Notification.NotificationStatus status,
        @Param("type") Notification.NotificationType type
    );
    
    @Query("SELECT MAX(n.batchNumber) FROM Notification n WHERE n.alertId = :alertId AND n.type = :type")
    Integer findMaxBatchNumberForAlert(
        @Param("alertId") UUID alertId,
        @Param("type") Notification.NotificationType type
    );
    
    @Query("SELECT COUNT(DISTINCT n.userId) FROM Notification n WHERE n.alertId = :alertId AND n.type = :type")
    long countRespondersNotifiedForAlert(
        @Param("alertId") UUID alertId,
        @Param("type") Notification.NotificationType type
    );
    
    // Delete all notifications by user ID (for account deletion)
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.userId = :userId")
    void deleteByUserId(@Param("userId") UUID userId);
}
