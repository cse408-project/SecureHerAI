package com.secureherai.secureherai_api.repository;

import com.secureherai.secureherai_api.entity.ReportEvidence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReportEvidenceRepository extends JpaRepository<ReportEvidence, UUID> {
    
    /**
     * Find all evidence for a specific report
     */
    List<ReportEvidence> findByReportId(UUID reportId);
    
    /**
     * Find all evidence for a specific report ordered by upload time
     */
    @Query("SELECT e FROM ReportEvidence e WHERE e.reportId = :reportId ORDER BY e.uploadedAt ASC")
    List<ReportEvidence> findByReportIdOrderByUploadedAt(@Param("reportId") UUID reportId);
    
    /**
     * Count evidence files for a report
     */
    long countByReportId(UUID reportId);
}
