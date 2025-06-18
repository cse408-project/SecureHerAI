package com.secureherai.secureherai_api.repository;

import com.secureherai.secureherai_api.entity.AlertNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface AlertNotificationRepository extends JpaRepository<AlertNotification, UUID> {
    
    // Find notifications by alert ID
    List<AlertNotification> findByAlertId(UUID alertId);
    
    // Find notifications by contact ID
    List<AlertNotification> findByContactId(UUID contactId);
    
    // Find notifications by recipient type
    List<AlertNotification> findByRecipientType(String recipientType);
    
    // Find notifications by status
    List<AlertNotification> findByStatus(String status);
    
    // Find notifications for a specific alert and contact
    List<AlertNotification> findByAlertIdAndContactId(UUID alertId, UUID contactId);
    
    // Find notifications within a time range
    List<AlertNotification> findByNotificationTimeBetween(LocalDateTime startTime, LocalDateTime endTime);
    
    // Find failed notifications for retry
    @Query("SELECT an FROM AlertNotification an WHERE an.status = 'failed' AND an.notificationTime >= :since")
    List<AlertNotification> findFailedNotificationsSince(@Param("since") LocalDateTime since);
    
    // Count notifications by alert and status
    @Query("SELECT COUNT(an) FROM AlertNotification an WHERE an.alertId = :alertId AND an.status = :status")
    Long countByAlertIdAndStatus(@Param("alertId") UUID alertId, @Param("status") String status);
    
    // Find recent notifications for a contact
    @Query("SELECT an FROM AlertNotification an WHERE an.contactId = :contactId ORDER BY an.notificationTime DESC")
    List<AlertNotification> findRecentNotificationsByContact(@Param("contactId") UUID contactId);
}
