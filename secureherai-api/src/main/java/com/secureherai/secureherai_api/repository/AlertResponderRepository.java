package com.secureherai.secureherai_api.repository;

import com.secureherai.secureherai_api.entity.AlertResponder;
import com.secureherai.secureherai_api.entity.AlertResponderId;
import com.secureherai.secureherai_api.enums.AlertStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AlertResponderRepository extends JpaRepository<AlertResponder, AlertResponderId> {

        // Find all alerts accepted by a specific responder
        @Query("SELECT ar FROM AlertResponder ar WHERE ar.responderId = :responderId ORDER BY ar.acceptedAt DESC")
        List<AlertResponder> findByResponderId(@Param("responderId") UUID responderId);

        // Find all responders who accepted a specific alert
        @Query("SELECT ar FROM AlertResponder ar WHERE ar.alertId = :alertId ORDER BY ar.acceptedAt ASC")
        List<AlertResponder> findByAlertId(@Param("alertId") UUID alertId);

        // Check if a responder has accepted a specific alert
        @Query("SELECT ar FROM AlertResponder ar WHERE ar.alertId = :alertId AND ar.responderId = :responderId")
        Optional<AlertResponder> findByAlertIdAndResponderId(@Param("alertId") UUID alertId,
                        @Param("responderId") UUID responderId);

        // Check if a responder has rejected a specific alert
        @Query("SELECT ar FROM AlertResponder ar WHERE ar.alertId = :alertId AND ar.responderId = :responderId AND ar.status = :status")
        Optional<AlertResponder> findByAlertIdAndResponderIdAndStatus(@Param("alertId") UUID alertId,
                        @Param("responderId") UUID responderId, @Param("status") AlertStatus status);

        // Find alerts by responder with specific status
        @Query("SELECT ar FROM AlertResponder ar WHERE ar.responderId = :responderId AND ar.status = :status ORDER BY ar.acceptedAt DESC")
        List<AlertResponder> findByResponderIdAndStatus(@Param("responderId") UUID responderId,
                        @Param("status") AlertStatus status);

        // Check if an alert has any accepted responders
        @Query("SELECT COUNT(ar) > 0 FROM AlertResponder ar WHERE ar.alertId = :alertId")
        boolean existsByAlertId(@Param("alertId") UUID alertId);

        // Find accepted alert responders
        @Query("SELECT ar FROM AlertResponder ar WHERE ar.alertId = :alertId AND ar.status = 'ACCEPTED'")
        List<AlertResponder> findAcceptedByAlertId(@Param("alertId") UUID alertId);

        // Get count of responders who accepted a specific alert
        @Query("SELECT COUNT(ar) FROM AlertResponder ar WHERE ar.alertId = :alertId")
        long countByAlertId(@Param("alertId") UUID alertId);

        // Count by responder ID
        @Query("SELECT COUNT(ar) FROM AlertResponder ar WHERE ar.responderId = :responderId")
        long countByResponderId(@Param("responderId") UUID responderId);

        // Delete all alert responder records for a specific user (for account deletion)
        // - using native query
        @Modifying
        @Query("DELETE FROM AlertResponder ar WHERE ar.responderId = :responderId")
        void deleteByResponderId(@Param("responderId") UUID responderId);

        // Delete all alert responder records for a specific alert - using native query
        @Modifying
        @Query("DELETE FROM AlertResponder ar WHERE ar.alertId = :alertId")
        void deleteByAlertId(@Param("alertId") UUID alertId);

        // Find alert responders by responder ID with specific alert statuses
        @Query("SELECT ar FROM AlertResponder ar JOIN Alert a ON ar.alertId = a.id WHERE ar.responderId = :responderId AND a.status IN :statuses ORDER BY a.triggeredAt DESC")
        List<AlertResponder> findByResponderIdWithAlertStatus(@Param("responderId") UUID responderId,
                        @Param("statuses") List<AlertStatus> statuses);
}
