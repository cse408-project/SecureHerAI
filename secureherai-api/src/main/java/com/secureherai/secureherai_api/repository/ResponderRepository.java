package com.secureherai.secureherai_api.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
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
            @Param("type") Responder.ResponderType type);

    @Modifying
    @org.springframework.transaction.annotation.Transactional
    @Query("DELETE FROM Responder r WHERE r.userId = :userId")
    void deleteByUserId(@Param("userId") UUID userId);

    @Query("SELECT r FROM Responder r WHERE r.badgeNumber = :badgeNumber")
    Optional<Responder> findByBadgeNumber(@Param("badgeNumber") String badgeNumber);

    /**
     * Search responders by badge number, name (from user), or branch name
     * Returns only active responders, excludes the current responder
     */
    @Query("SELECT r FROM Responder r JOIN r.user u WHERE r.isActive = true AND r.userId != :excludeResponderId " +
            "AND (LOWER(r.badgeNumber) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "OR LOWER(r.branchName) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Responder> searchResponders(@Param("query") String query,
            @Param("excludeResponderId") UUID excludeResponderId);

    /**
     * Get all active responders except the current one
     */
    @Query("SELECT r FROM Responder r WHERE r.isActive = true AND r.userId != :excludeResponderId")
    List<Responder> findAllActiveExcept(@Param("excludeResponderId") UUID excludeResponderId);

    /**
     * Find responders by list of IDs
     */
    @Query("SELECT r FROM Responder r WHERE r.userId IN :responderIds")
    List<Responder> findByUserIdIn(@Param("responderIds") List<UUID> responderIds);
}
