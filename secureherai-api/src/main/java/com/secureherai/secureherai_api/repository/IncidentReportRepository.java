package com.secureherai.secureherai_api.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.secureherai.secureherai_api.entity.IncidentReport;

@Repository
public interface IncidentReportRepository extends JpaRepository<IncidentReport, UUID> {
    
    // Find reports by user ID
    List<IncidentReport> findByUserId(UUID userId);
    
    // Find reports by user ID ordered by creation date
    List<IncidentReport> findByUserIdOrderByCreatedAtDesc(UUID userId);
    
    // Find report by ID and user ID (for authorization)
    Optional<IncidentReport> findByIdAndUserId(UUID id, UUID userId);
    
    // Find reports by alert ID
    Optional<IncidentReport> findByAlertId(UUID alertId);
    
    // Find reports by incident type
    List<IncidentReport> findByIncidentType(String incidentType);
    
    // Find reports by status
    List<IncidentReport> findByStatus(String status);
    
    // Find reports by visibility
    List<IncidentReport> findByVisibility(String visibility);
    
    // Find public reports (excluding private ones)
    @Query("SELECT ir FROM IncidentReport ir WHERE ir.visibility IN ('public', 'officials_only')")
    List<IncidentReport> findPublicReports();
    
    // Find reports within a time range
    List<IncidentReport> findByIncidentTimeBetween(LocalDateTime startTime, LocalDateTime endTime);
    
    // Find recent reports by user (last 30 days)
    @Query("SELECT ir FROM IncidentReport ir WHERE ir.userId = :userId AND ir.createdAt >= :since ORDER BY ir.createdAt DESC")
    List<IncidentReport> findRecentReportsByUser(@Param("userId") UUID userId, @Param("since") LocalDateTime since);
    
    // Find reports by status for admin review
    List<IncidentReport> findByStatusOrderByCreatedAtAsc(String status);
    
    // Count reports by user
    Long countByUserId(UUID userId);
    
    // Count reports by status
    Long countByStatus(String status);
    
    // Find reports within geographical area (for heatmap functionality)
    @Query("SELECT ir FROM IncidentReport ir WHERE ir.latitude BETWEEN :minLat AND :maxLat " +
           "AND ir.longitude BETWEEN :minLon AND :maxLon " +
           "AND ir.visibility = 'public'")
    List<IncidentReport> findReportsInArea(@Param("minLat") Double minLat, 
                                          @Param("maxLat") Double maxLat,
                                          @Param("minLon") Double minLon, 
                                          @Param("maxLon") Double maxLon);
    
    // Additional methods for search and filter functionality
    
    // Find reports by visibility ordered by creation date
    List<IncidentReport> findByVisibilityOrderByCreatedAtDesc(String visibility);
    
    // Find user's reports by visibility
    List<IncidentReport> findByUserIdAndVisibilityOrderByCreatedAtDesc(UUID userId, String visibility);
    
    // Find user's reports by incident type
    List<IncidentReport> findByUserIdAndIncidentTypeOrderByCreatedAtDesc(UUID userId, String incidentType);
    
    // Search in description and address for a user
    @Query("SELECT ir FROM IncidentReport ir WHERE ir.userId = :userId AND " +
           "(LOWER(ir.description) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(ir.address) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "ORDER BY ir.createdAt DESC")
    List<IncidentReport> findByUserIdAndSearchQuery(@Param("userId") UUID userId, @Param("query") String query);
    
    // Find all reports ordered by creation date (for admins)
    List<IncidentReport> findAllByOrderByCreatedAtDesc();
    
    // Find reports by user and incident time range
    List<IncidentReport> findByUserIdAndIncidentTimeBetween(UUID userId, LocalDateTime startTime, LocalDateTime endTime);
}
