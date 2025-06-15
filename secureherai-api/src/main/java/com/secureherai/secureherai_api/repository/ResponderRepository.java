package com.secureherai.secureherai_api.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.secureherai.secureherai_api.entity.Responder;

@Repository
public interface ResponderRepository extends JpaRepository<Responder, UUID> {
    
    Optional<Responder> findByUserId(UUID userId);
    
    boolean existsByBadgeNumber(String badgeNumber);
    
    @Query("SELECT r FROM Responder r WHERE r.status = :status AND r.isActive = true")
    List<Responder> findByStatusAndIsActiveTrue(@Param("status") Responder.Status status);
    
    @Query("SELECT r FROM Responder r WHERE r.responderType = :type AND r.isActive = true")
    List<Responder> findByResponderTypeAndIsActiveTrue(@Param("type") Responder.ResponderType type);
    
    @Query("SELECT r FROM Responder r WHERE r.status = :status AND r.responderType = :type AND r.isActive = true")
    List<Responder> findByStatusAndResponderTypeAndIsActiveTrue(
        @Param("status") Responder.Status status, 
        @Param("type") Responder.ResponderType type
    );
}
