package com.secureherai.secureherai_api.repository;

import com.secureherai.secureherai_api.entity.AlertResponder;
import com.secureherai.secureherai_api.entity.AlertResponderId;
import org.springframework.data.jpa.repository.JpaRepository;
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
    Optional<AlertResponder> findByAlertIdAndResponderId(@Param("alertId") UUID alertId, @Param("responderId") UUID responderId);
    
    // Find accepted alerts by responder with specific status
    @Query("SELECT ar FROM AlertResponder ar WHERE ar.responderId = :responderId AND ar.status = :status ORDER BY ar.acceptedAt DESC")
    List<AlertResponder> findByResponderIdAndStatus(@Param("responderId") UUID responderId, @Param("status") String status);
    
    // Check if an alert has any accepted responders
    @Query("SELECT COUNT(ar) > 0 FROM AlertResponder ar WHERE ar.alertId = :alertId")
    boolean existsByAlertId(@Param("alertId") UUID alertId);
    
    // Get count of responders who accepted a specific alert
    @Query("SELECT COUNT(ar) FROM AlertResponder ar WHERE ar.alertId = :alertId")
    long countByAlertId(@Param("alertId") UUID alertId);
    
    // Delete all alert responder records for a specific user (for account deletion)
    void deleteByResponderId(UUID responderId);
    
    // Delete all alert responder records for a specific alert
    void deleteByAlertId(UUID alertId);
}
