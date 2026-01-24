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

        // Find accepted alert responders - using parameter
        @Query("SELECT ar FROM AlertResponder ar WHERE ar.alertId = :alertId AND ar.status = :acceptedStatus")
        List<AlertResponder> findAcceptedByAlertId(@Param("alertId") UUID alertId,
                        @Param("acceptedStatus") AlertStatus acceptedStatus);

        // Get count of responders who accepted a specific alert
        @Query("SELECT COUNT(ar) FROM AlertResponder ar WHERE ar.alertId = :alertId")
        long countByAlertId(@Param("alertId") UUID alertId);

        // Count by responder ID
        @Query("SELECT COUNT(ar) FROM AlertResponder ar WHERE ar.responderId = :responderId")
        long countByResponderId(@Param("responderId") UUID responderId);

        // Delete all alert responder records for a specific user (for account deletion)
        @Modifying
        @org.springframework.transaction.annotation.Transactional
        @Query("DELETE FROM AlertResponder ar WHERE ar.responderId = :responderId")
        void deleteByResponderId(@Param("responderId") UUID responderId);

        // Delete all alert responder records for a specific alert
        @Modifying
        @org.springframework.transaction.annotation.Transactional
        @Query("DELETE FROM AlertResponder ar WHERE ar.alertId = :alertId")
        void deleteByAlertId(@Param("alertId") UUID alertId);

        // Find alert responders by responder ID with specific alert statuses
        @Query("SELECT ar FROM AlertResponder ar JOIN Alert a ON ar.alertId = a.id WHERE ar.responderId = :responderId AND a.status IN :statuses ORDER BY a.triggeredAt DESC")
        List<AlertResponder> findByResponderIdWithAlertStatus(@Param("responderId") UUID responderId,
                        @Param("statuses") List<AlertStatus> statuses);

        // Delete all PENDING AlertResponder records for a specific alert (when someone
        // accepts)
        @Modifying
        @org.springframework.transaction.annotation.Transactional
        @Query("DELETE FROM AlertResponder ar WHERE ar.alertId = :alertId AND ar.status = :status")
        void deleteByAlertIdAndStatus(@Param("alertId") UUID alertId, @Param("status") AlertStatus status);

        // Find all AlertResponder records for a specific alert with given status
        @Query("SELECT ar FROM AlertResponder ar WHERE ar.alertId = :alertId AND ar.status = :status")
        List<AlertResponder> findByAlertIdAndStatus(@Param("alertId") UUID alertId,
                        @Param("status") AlertStatus status);

        // Check if a responder already has a record for this alert (any status)
        @Query("SELECT COUNT(ar) > 0 FROM AlertResponder ar WHERE ar.alertId = :alertId AND ar.responderId = :responderId")
        boolean existsByAlertIdAndResponderId(@Param("alertId") UUID alertId, @Param("responderId") UUID responderId);

        // Find all alerts where responder has PENDING status (for pending alerts
        // display)
        @Query("SELECT ar FROM AlertResponder ar JOIN Alert a ON ar.alertId = a.id WHERE ar.responderId = :responderId AND ar.status = :pendingStatus AND a.status IN :alertStatuses ORDER BY a.triggeredAt DESC")
        List<AlertResponder> findPendingForResponder(@Param("responderId") UUID responderId,
                        @Param("pendingStatus") AlertStatus pendingStatus,
                        @Param("alertStatuses") List<AlertStatus> alertStatuses);

        // Find all alerts where responder has PENDING or FORWARDED status (for pending
        // section display)
        // Using native query for complex IN clause with enums
        // Checks for WAITING (no one accepted) or ACTIVE (someone accepted) alerts
        @Query(value = "SELECT ar.* FROM alert_responders ar JOIN alerts a ON ar.alert_id = a.id WHERE ar.responder_id = :responderId AND ar.status IN ('PENDING', 'FORWARDED') AND a.status IN ('WAITING', 'ACTIVE') ORDER BY a.triggered_at DESC", nativeQuery = true)
        List<AlertResponder> findPendingOrForwardedForResponder(@Param("responderId") UUID responderId);

        // Find all alerts where responder has active status (ACCEPTED, EN_ROUTE,
        // ARRIVED) for accepted/critical section
        // Using native query for complex IN clause with enums
        // Only ACTIVE alerts (someone has accepted) show in accepted section
        @Query(value = "SELECT ar.* FROM alert_responders ar JOIN alerts a ON ar.alert_id = a.id WHERE ar.responder_id = :responderId AND ar.status IN ('ACCEPTED', 'EN_ROUTE', 'ARRIVED') AND a.status = 'ACTIVE' ORDER BY ar.accepted_at DESC", nativeQuery = true)
        List<AlertResponder> findActiveForResponder(@Param("responderId") UUID responderId);

        // Delete all PENDING or FORWARDED AlertResponder records for a specific alert
        // (when someone accepts)
        // Using native query for complex IN clause with enums
        @Modifying
        @org.springframework.transaction.annotation.Transactional
        @Query(value = "DELETE FROM alert_responders WHERE alert_id = :alertId AND status IN ('PENDING', 'FORWARDED') AND responder_id != :exceptResponderId", nativeQuery = true)
        void deleteOtherPendingByAlertId(@Param("alertId") UUID alertId,
                        @Param("exceptResponderId") UUID exceptResponderId);

        // Find responders currently assigned to this alert (not in pending/forwarded
        // status)
        // Using native query for complex NOT IN clause with enums
        @Query(value = "SELECT ar.* FROM alert_responders ar WHERE ar.alert_id = :alertId AND ar.status NOT IN ('PENDING', 'FORWARDED', 'REJECTED', 'CANCELED')", nativeQuery = true)
        List<AlertResponder> findAssignedByAlertId(@Param("alertId") UUID alertId);

        // Count responders assigned to alert (excluding pending/forwarded)
        @Query(value = "SELECT COUNT(*) FROM alert_responders WHERE alert_id = :alertId AND status NOT IN ('PENDING', 'FORWARDED', 'REJECTED', 'CANCELED')", nativeQuery = true)
        long countAssignedByAlertId(@Param("alertId") UUID alertId);
}
