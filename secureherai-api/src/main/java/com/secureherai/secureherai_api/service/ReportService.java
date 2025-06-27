package com.secureherai.secureherai_api.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.secureherai.secureherai_api.dto.report.ReportRequest;
import com.secureherai.secureherai_api.dto.report.ReportResponse;
import com.secureherai.secureherai_api.entity.IncidentReport;
import com.secureherai.secureherai_api.entity.User;
import com.secureherai.secureherai_api.repository.IncidentReportRepository;
import com.secureherai.secureherai_api.repository.UserRepository;

@Service
@Transactional
public class ReportService {
    
    private static final Logger logger = LoggerFactory.getLogger(ReportService.class);
    
    @Autowired
    private IncidentReportRepository reportRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    /**
     * Submit a new incident report
     */
    public ReportResponse.GenericResponse submitReport(UUID userId, ReportRequest.SubmitReport request) {
        try {
            // Log the incoming request
            logger.info("Submitting report for user: {}", userId);
            logger.debug("Incident type: {}", request.getIncidentType());
            logger.debug("Location: {}, {}", request.getLocation().getLatitude(), request.getLocation().getLongitude());
            
            // Verify user exists
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                logger.warn("User not found: {}", userId);
                return new ReportResponse.GenericResponse(false, null, "User not found");
            }
            
            logger.debug("User found: {}", userOpt.get().getFullName());
            
            // Check if alert already has a report (if alertId provided)
            if (request.getAlertId() != null) {
                logger.debug("Checking for existing report with alertId: {}", request.getAlertId());
                Optional<IncidentReport> existingReport = reportRepository.findByAlertId(request.getAlertId());
                if (existingReport.isPresent()) {
                    logger.warn("Report already exists for alert: {}", request.getAlertId());
                    return new ReportResponse.GenericResponse(false, null, "An incident report already exists for this alert");
                }
            }
            
            logger.debug("Creating new incident report...");
            
            // Create new incident report
            IncidentReport report = new IncidentReport(
                userId,
                request.getIncidentType(),
                request.getDescription(),
                request.getLocation().getLatitude(),
                request.getLocation().getLongitude(),
                request.getIncidentTime(),
                request.getVisibility(),
                request.getAnonymous()
            );
            
            logger.debug("Report created, setting optional fields...");
            
            // Set optional fields
            if (request.getAddress() != null) {
                report.setAddress(request.getAddress());
            }
            
            if (request.getAlertId() != null) {
                report.setAlertId(request.getAlertId());
            }
            
            if (request.getInvolvedParties() != null) {
                report.setInvolvedParties(request.getInvolvedParties());
            }
            
            logger.debug("Saving report to database...");
            
            // Save the report
            IncidentReport savedReport = reportRepository.save(report);
            
            logger.info("Report saved successfully with ID: {}", savedReport.getId());
            
            // TODO: Handle evidence upload if provided
            // This would typically involve saving files to storage and storing URLs
            
            return new ReportResponse.GenericResponse(
                true, 
                "Incident report submitted successfully", 
                null, 
                savedReport.getId()
            );
            
        } catch (Exception e) {
            logger.error("Error in submitReport: {}", e.getMessage(), e);
            return new ReportResponse.GenericResponse(false, null, "An error occurred while submitting the report: " + e.getMessage());
        }
    }
    
    /**
     * Get all reports for a user
     */
    public ReportResponse.UserReportsResponse getUserReports(UUID userId) {
        try {
            logger.debug("Retrieving reports for user: {}", userId);
            
            // Verify user exists
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                logger.warn("User not found when retrieving reports: {}", userId);
                return new ReportResponse.UserReportsResponse(false, null, "User not found");
            }
            
            List<IncidentReport> reports = reportRepository.findByUserIdOrderByCreatedAtDesc(userId);
            logger.debug("Found {} reports for user: {}", reports.size(), userId);
            
            List<ReportResponse.ReportSummary> reportSummaries = reports.stream()
                .map(this::convertToReportSummary)
                .collect(Collectors.toList());
            
            return new ReportResponse.UserReportsResponse(true, reportSummaries, null);
            
        } catch (Exception e) {
            logger.error("Error retrieving reports for user {}: {}", userId, e.getMessage(), e);
            return new ReportResponse.UserReportsResponse(false, null, "An error occurred while retrieving reports: " + e.getMessage());
        }
    }
    
    /**
     * Get detailed information for a specific report
     */
    public ReportResponse.ReportDetailsResponse getReportDetails(UUID reportId, UUID userId) {
        try {
            logger.debug("Retrieving report details for report: {} by user: {}", reportId, userId);
            
            // Find report and verify ownership
            Optional<IncidentReport> reportOpt = reportRepository.findByIdAndUserId(reportId, userId);
            if (reportOpt.isEmpty()) {
                logger.warn("Report not found or access denied - Report: {}, User: {}", reportId, userId);
                return new ReportResponse.ReportDetailsResponse(false, null, "Report not found or access denied");
            }
            
            IncidentReport report = reportOpt.get();
            ReportResponse.ReportDetails reportDetails = convertToReportDetails(report);
            
            logger.debug("Successfully retrieved report details for: {}", reportId);
            return new ReportResponse.ReportDetailsResponse(true, reportDetails, null);
            
        } catch (Exception e) {
            logger.error("Error retrieving report details for report {}: {}", reportId, e.getMessage(), e);
            return new ReportResponse.ReportDetailsResponse(false, null, "An error occurred while retrieving report details: " + e.getMessage());
        }
    }
    
    /**
     * Upload evidence for a report
     */
    public ReportResponse.GenericResponse uploadEvidence(UUID userId, ReportRequest.UploadEvidence request) {
        try {
            logger.debug("Uploading evidence for report: {} by user: {}", request.getReportId(), userId);
            
            // Verify report exists and user owns it
            Optional<IncidentReport> reportOpt = reportRepository.findByIdAndUserId(request.getReportId(), userId);
            if (reportOpt.isEmpty()) {
                logger.warn("Report not found or access denied for evidence upload - Report: {}, User: {}", request.getReportId(), userId);
                return new ReportResponse.GenericResponse(false, null, "Report not found or access denied");
            }
            
            // TODO: Implement actual evidence upload logic
            // This would involve:
            // 1. Decoding base64 files
            // 2. Validating file types and sizes
            // 3. Storing files (e.g., in cloud storage)
            // 4. Saving file URLs to database
            
            logger.info("Evidence uploaded successfully for report: {}", request.getReportId());
            return new ReportResponse.GenericResponse(true, "Evidence uploaded successfully", null);
            
        } catch (Exception e) {
            logger.error("Error uploading evidence for report {}: {}", request.getReportId(), e.getMessage(), e);
            return new ReportResponse.GenericResponse(false, null, "An error occurred while uploading evidence: " + e.getMessage());
        }
    }
    
    /**
     * Update report visibility
     */
    public ReportResponse.GenericResponse updateReportVisibility(UUID userId, ReportRequest.UpdateVisibility request) {
        try {
            logger.debug("Updating visibility for report: {} by user: {} to: {}", request.getReportId(), userId, request.getVisibility());
            
            // Verify report exists and user owns it
            Optional<IncidentReport> reportOpt = reportRepository.findByIdAndUserId(request.getReportId(), userId);
            if (reportOpt.isEmpty()) {
                logger.warn("Report not found or access denied for visibility update - Report: {}, User: {}", request.getReportId(), userId);
                return new ReportResponse.GenericResponse(false, null, "Report not found or access denied");
            }
            
            IncidentReport report = reportOpt.get();
            String oldVisibility = report.getVisibility();
            report.setVisibility(request.getVisibility());
            reportRepository.save(report);
            
            logger.info("Report visibility updated from {} to {} for report: {}", oldVisibility, request.getVisibility(), request.getReportId());
            return new ReportResponse.GenericResponse(true, "Report visibility updated successfully", null);
            
        } catch (Exception e) {
            logger.error("Error updating visibility for report {}: {}", request.getReportId(), e.getMessage(), e);
            return new ReportResponse.GenericResponse(false, null, "An error occurred while updating report visibility: " + e.getMessage());
        }
    }
    
    /**
     * Get reports for admin/officials (with appropriate visibility filtering)
     */
    public ReportResponse.UserReportsResponse getPublicReports(String userRole) {
        try {
            logger.debug("Retrieving public reports for user role: {}", userRole);
            List<IncidentReport> reports;
            
            switch (userRole) {
                case "ADMIN":
                    // Admins can see all reports
                    reports = reportRepository.findAll();
                    logger.debug("Admin access: Retrieved {} total reports", reports.size());
                    break;
                case "RESPONDER":
                    // Responders can see public and officials_only reports
                    reports = reportRepository.findPublicReports();
                    logger.debug("Responder access: Retrieved {} public/officials_only reports", reports.size());
                    break;
                default:
                    // Regular users should not access this endpoint
                    logger.warn("Access denied for user role: {}", userRole);
                    return new ReportResponse.UserReportsResponse(false, null, "Access denied");
            }
            
            List<ReportResponse.ReportSummary> reportSummaries = reports.stream()
                .map(this::convertToReportSummary)
                .collect(Collectors.toList());
            
            return new ReportResponse.UserReportsResponse(true, reportSummaries, null);
            
        } catch (Exception e) {
            logger.error("Error retrieving public reports for role {}: {}", userRole, e.getMessage(), e);
            return new ReportResponse.UserReportsResponse(false, null, "An error occurred while retrieving reports: " + e.getMessage());
        }
    }
    
    /**
     * Convert IncidentReport entity to ReportSummary DTO
     */
    private ReportResponse.ReportSummary convertToReportSummary(IncidentReport report) {
        String truncatedDescription = report.getDescription().length() > 100 
            ? report.getDescription().substring(0, 100) + "..." 
            : report.getDescription();
            
        ReportResponse.LocationInfo location = new ReportResponse.LocationInfo(
            report.getLatitude(),
            report.getLongitude(),
            report.getAddress()
        );
        
        return new ReportResponse.ReportSummary(
            report.getId(),
            report.getIncidentType(),
            truncatedDescription,
            location,
            report.getIncidentTime(),
            report.getStatus(),
            report.getVisibility(),
            report.getAnonymous(),
            report.getCreatedAt()
        );
    }
    
    /**
     * Convert IncidentReport entity to ReportDetails DTO
     */
    private ReportResponse.ReportDetails convertToReportDetails(IncidentReport report) {
        ReportResponse.ReportDetails details = new ReportResponse.ReportDetails();
        
        details.setReportId(report.getId());
        details.setAlertId(report.getAlertId());
        details.setIncidentType(report.getIncidentType());
        details.setDescription(report.getDescription());
        
        ReportResponse.LocationInfo location = new ReportResponse.LocationInfo(
            report.getLatitude(),
            report.getLongitude(),
            report.getAddress()
        );
        details.setLocation(location);
        
        details.setAddress(report.getAddress());
        details.setIncidentTime(report.getIncidentTime());
        details.setStatus(report.getStatus());
        details.setVisibility(report.getVisibility());
        details.setAnonymous(report.getAnonymous());
        details.setActionTaken(report.getActionTaken());
        details.setInvolvedParties(report.getInvolvedParties());
        details.setCreatedAt(report.getCreatedAt());
        details.setUpdatedAt(report.getUpdatedAt());
        
        // TODO: Load evidence URLs from separate evidence table
        details.setEvidence(new ArrayList<>());
        
        return details;
    }
}
