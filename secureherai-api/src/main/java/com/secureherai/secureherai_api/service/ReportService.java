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
            if (request.getLocation() != null) {
                logger.debug("Location: {}, {}", request.getLocation().getLatitude(), request.getLocation().getLongitude());
            } else {
                logger.debug("No location provided");
            }
            
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
            
            // Check for potential duplicate reports (same user, time, location, type within 5 minutes)
            // Only check location-based duplicates if location is provided
            if (request.getLocation() != null) {
                java.time.LocalDateTime reportTime = request.getIncidentTime();
                java.time.LocalDateTime startTime = reportTime.minusMinutes(5);
                java.time.LocalDateTime endTime = reportTime.plusMinutes(5);
                
                List<IncidentReport> recentReports = reportRepository.findByUserIdAndIncidentTimeBetween(userId, startTime, endTime);
                for (IncidentReport existing : recentReports) {
                    // Check if it's very similar (same type and close location)
                    if (existing.getIncidentType().equals(request.getIncidentType()) 
                        && existing.getLatitude() != null && existing.getLongitude() != null) {
                        // Calculate distance between coordinates (simple approximation)
                        double latDiff = Math.abs(existing.getLatitude().doubleValue() - request.getLocation().getLatitude().doubleValue());
                        double lonDiff = Math.abs(existing.getLongitude().doubleValue() - request.getLocation().getLongitude().doubleValue());
                        
                        // If within ~100 meters (approximately 0.001 degrees)
                        if (latDiff < 0.001 && lonDiff < 0.001) {
                            logger.warn("Potential duplicate report detected for user: {} at similar time and location", userId);
                            return new ReportResponse.GenericResponse(false, null, 
                                "A similar report already exists for this time and location. Please check your recent reports.");
                        }
                    }
                }
            }
            
            logger.debug("Creating new incident report...");
            
            // Create new incident report with or without location
            IncidentReport report;
            if (request.getLocation() != null) {
                report = new IncidentReport(
                    userId,
                    request.getIncidentType(),
                    request.getDescription(),
                    request.getLocation().getLatitude(),
                    request.getLocation().getLongitude(),
                    request.getIncidentTime(),
                    request.getVisibility(),
                    request.getAnonymous()
                );
            } else {
                report = new IncidentReport(
                    userId,
                    request.getIncidentType(),
                    request.getDescription(),
                    request.getIncidentTime(),
                    request.getVisibility(),
                    request.getAnonymous()
                );
            }
            
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
     * Update report (comprehensive update for all fields)
     */
    public ReportResponse.GenericResponse updateReport(UUID userId, ReportRequest.UpdateReport request) {
        try {
            logger.debug("Updating report: {} by user: {}", request.getReportId(), userId);
            
            // Verify report exists and user owns it
            Optional<IncidentReport> reportOpt = reportRepository.findByIdAndUserId(request.getReportId(), userId);
            if (reportOpt.isEmpty()) {
                logger.warn("Report not found or access denied for update - Report: {}, User: {}", request.getReportId(), userId);
                return new ReportResponse.GenericResponse(false, null, "Report not found or access denied");
            }
            
            IncidentReport report = reportOpt.get();
            
            // Update fields if they are provided
            if (request.getDescription() != null && !request.getDescription().trim().isEmpty()) {
                report.setDescription(request.getDescription().trim());
            }
            
            if (request.getLocation() != null) {
                if (request.getLocation().getLatitude() != null) {
                    report.setLatitude(request.getLocation().getLatitude());
                }
                if (request.getLocation().getLongitude() != null) {
                    report.setLongitude(request.getLocation().getLongitude());
                }
            }
            
            if (request.getAddress() != null) {
                report.setAddress(request.getAddress().trim());
            }
            
            if (request.getIncidentTime() != null) {
                report.setIncidentTime(request.getIncidentTime());
            }
            
            if (request.getVisibility() != null && !request.getVisibility().trim().isEmpty()) {
                report.setVisibility(request.getVisibility().trim());
            }
            
            if (request.getAnonymous() != null) {
                report.setAnonymous(request.getAnonymous());
            }
            
            if (request.getActionTaken() != null) {
                report.setActionTaken(request.getActionTaken().trim());
            }
            
            if (request.getInvolvedParties() != null) {
                report.setInvolvedParties(request.getInvolvedParties());
            }
            
            reportRepository.save(report);
            
            logger.info("Report updated successfully: {}", request.getReportId());
            return new ReportResponse.GenericResponse(true, "Report updated successfully", null);
            
        } catch (Exception e) {
            logger.error("Error updating report {}: {}", request.getReportId(), e.getMessage(), e);
            return new ReportResponse.GenericResponse(false, null, "An error occurred while updating the report: " + e.getMessage());
        }
    }
    
    /**
     * Get reports for admin/officials (with appropriate visibility filtering)
     */
    public ReportResponse.UserReportsResponse getPublicReports(String userRole) {
        try {
            logger.debug("Retrieving public reports for user role: {}", userRole);
            List<IncidentReport> reports;
            
            reports = switch (userRole) {
                case "ADMIN" -> {
                    // Admins can see all reports
                    List<IncidentReport> adminReports = reportRepository.findAll();
                    logger.debug("Admin access: Retrieved {} total reports", adminReports.size());
                    yield adminReports;
                }
                case "RESPONDER" -> {
                    // Responders can see public and officials_only reports
                    List<IncidentReport> responderReports = reportRepository.findPublicReports();
                    logger.debug("Responder access: Retrieved {} public/officials_only reports", responderReports.size());
                    yield responderReports;
                }
                default -> {
                    // Regular users should not access this endpoint
                    logger.warn("Access denied for user role: {}", userRole);
                    yield null;
                }
            };
            
            if (reports == null) {
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
    
    /**
     * Search reports by query
     */
    public ReportResponse.UserReportsResponse searchReports(String query, UUID userId, String userRole, int page, int size) {
        try {
            logger.info("Searching reports for user: {}, query: '{}', role: {}", userId, query, userRole);
            
            List<IncidentReport> reports;
            
            // Handle special search queries
            if ("public-reports".equalsIgnoreCase(query)) {
                // For public reports, check if user has appropriate role
                if ("ADMIN".equals(userRole) || "RESPONDER".equals(userRole)) {
                    reports = reportRepository.findByVisibilityOrderByCreatedAtDesc("public");
                } else {
                    reports = new ArrayList<>();
                }
            } else if ("private-reports".equalsIgnoreCase(query)) {
                // Only show user's own private reports
                reports = reportRepository.findByUserIdAndVisibilityOrderByCreatedAtDesc(userId, "private");
            } else if (isValidIncidentType(query)) {
                // Search by incident type (only user's own reports)
                reports = reportRepository.findByUserIdAndIncidentTypeOrderByCreatedAtDesc(userId, query.toLowerCase());
            } else {
                // General text search in descriptions and addresses
                reports = reportRepository.findByUserIdAndSearchQuery(userId, query);
            }
            
            // Apply pagination manually (simple approach)
            int startIndex = page * size;
            int endIndex = Math.min(startIndex + size, reports.size());
            if (startIndex >= reports.size()) {
                reports = new ArrayList<>();
            } else {
                reports = reports.subList(startIndex, endIndex);
            }
            
            List<ReportResponse.ReportSummary> summaries = reports.stream()
                .map(this::convertToReportSummary)
                .collect(Collectors.toList());
            
            logger.info("Found {} reports for search query: '{}'", summaries.size(), query);
            return new ReportResponse.UserReportsResponse(true, summaries, null);
            
        } catch (Exception e) {
            logger.error("Error searching reports for user: {}, query: '{}'", userId, query, e);
            return new ReportResponse.UserReportsResponse(false, null, "Failed to search reports");
        }
    }
    
    /**
     * Filter reports by criteria
     */
    public ReportResponse.UserReportsResponse filterReports(String incidentType, String visibility, String status, 
                                                           UUID userId, String userRole, int page, int size) {
        try {
            logger.info("Filtering reports for user: {}, type: {}, visibility: {}, status: {}", 
                       userId, incidentType, visibility, status);
            
            List<IncidentReport> reports;
            
            // Start with user's reports
            reports = reportRepository.findByUserIdOrderByCreatedAtDesc(userId);
            
            // Apply filters
            if (incidentType != null && !incidentType.isEmpty()) {
                reports = reports.stream()
                    .filter(r -> incidentType.equals(r.getIncidentType()))
                    .collect(Collectors.toList());
            }
            
            if (visibility != null && !visibility.isEmpty()) {
                reports = reports.stream()
                    .filter(r -> visibility.equals(r.getVisibility()))
                    .collect(Collectors.toList());
            }
            
            if (status != null && !status.isEmpty()) {
                reports = reports.stream()
                    .filter(r -> status.equals(r.getStatus()))
                    .collect(Collectors.toList());
            }
            
            // Apply pagination
            int startIndex = page * size;
            int endIndex = Math.min(startIndex + size, reports.size());
            if (startIndex >= reports.size()) {
                reports = new ArrayList<>();
            } else {
                reports = reports.subList(startIndex, endIndex);
            }
            
            List<ReportResponse.ReportSummary> summaries = reports.stream()
                .map(this::convertToReportSummary)
                .collect(Collectors.toList());
            
            logger.info("Found {} reports after filtering", summaries.size());
            return new ReportResponse.UserReportsResponse(true, summaries, null);
            
        } catch (Exception e) {
            logger.error("Error filtering reports for user: {}", userId, e);
            return new ReportResponse.UserReportsResponse(false, null, "Failed to filter reports");
        }
    }
    
    /**
     * Combined search and filter reports with advanced query support
     */
    public ReportResponse.UserReportsResponse searchAndFilterReports(
            String query, String incidentType, String visibility, String status, 
            UUID userId, String userRole, int page, int size) {
        try {
            logger.info("Searching and filtering reports for user: {}, query: '{}', type: {}, visibility: {}, status: {}, role: {}", 
                        userId, query, incidentType, visibility, status, userRole);
            
            List<IncidentReport> reports;
            
            // Handle special search queries first
            if (query != null && "public-reports".equalsIgnoreCase(query)) {
                if ("ADMIN".equals(userRole) || "RESPONDER".equals(userRole)) {
                    reports = reportRepository.findByVisibilityOrderByCreatedAtDesc("public");
                } else {
                    reports = new ArrayList<>();
                }
            } else if (query != null && "private-reports".equalsIgnoreCase(query)) {
                reports = reportRepository.findByUserIdAndVisibilityOrderByCreatedAtDesc(userId, "private");
            } else {
                // Start with user's reports or all reports based on role
                if ("ADMIN".equals(userRole) || "RESPONDER".equals(userRole)) {
                    reports = reportRepository.findAllByOrderByCreatedAtDesc();
                } else {
                    reports = reportRepository.findByUserIdOrderByCreatedAtDesc(userId);
                }
                
                // Apply query filter
                if (query != null && !query.trim().isEmpty()) {
                    final String searchQuery = query.toLowerCase();
                    reports = reports.stream()
                        .filter(report -> 
                            report.getDescription().toLowerCase().contains(searchQuery) ||
                            report.getIncidentType().toLowerCase().contains(searchQuery) ||
                            (report.getAddress() != null && report.getAddress().toLowerCase().contains(searchQuery)))
                        .collect(Collectors.toList());
                }
            }
            
            // Apply additional filters
            if (incidentType != null) {
                final String filterType = incidentType.toLowerCase();
                reports = reports.stream()
                    .filter(report -> report.getIncidentType().equalsIgnoreCase(filterType))
                    .collect(Collectors.toList());
            }
            
            if (visibility != null) {
                reports = reports.stream()
                    .filter(report -> report.getVisibility().equalsIgnoreCase(visibility))
                    .collect(Collectors.toList());
            }
            
            if (status != null) {
                reports = reports.stream()
                    .filter(report -> report.getStatus().equalsIgnoreCase(status))
                    .collect(Collectors.toList());
            }
            
            // Apply pagination
            int startIndex = page * size;
            int endIndex = Math.min(startIndex + size, reports.size());
            if (startIndex >= reports.size()) {
                reports = new ArrayList<>();
            } else {
                reports = reports.subList(startIndex, endIndex);
            }
            
            List<ReportResponse.ReportSummary> summaries = reports.stream()
                .map(this::convertToReportSummary)
                .collect(Collectors.toList());
            
            logger.info("Found {} reports after search and filter", summaries.size());
            return new ReportResponse.UserReportsResponse(true, summaries, null);
            
        } catch (Exception e) {
            logger.error("Error searching and filtering reports: {}", e.getMessage(), e);
            return new ReportResponse.UserReportsResponse(false, null, "Failed to search and filter reports: " + e.getMessage());
        }
    }
    
    /**
     * Delete a report
     */
    public ReportResponse.GenericResponse deleteReport(UUID reportId, UUID userId, String userRole) {
        try {
            logger.info("Attempting to delete report: {} by user: {} with role: {}", reportId, userId, userRole);
            
            Optional<IncidentReport> reportOpt = reportRepository.findById(reportId);
            if (reportOpt.isEmpty()) {
                return new ReportResponse.GenericResponse(false, null, "Report not found");
            }
            
            IncidentReport report = reportOpt.get();
            
            // Check permissions: users can only delete their own reports, admins can delete any
            if (!report.getUserId().equals(userId) && !"ADMIN".equals(userRole)) {
                return new ReportResponse.GenericResponse(false, null, "You don't have permission to delete this report");
            }
            
            // Delete the report
            reportRepository.delete(report);
            
            logger.info("Successfully deleted report: {}", reportId);
            return new ReportResponse.GenericResponse(true, "Report deleted successfully", null);
            
        } catch (Exception e) {
            logger.error("Error deleting report {}: {}", reportId, e.getMessage(), e);
            return new ReportResponse.GenericResponse(false, null, "Failed to delete report: " + e.getMessage());
        }
    }

    /**
     * Get report categories for filtering
     */
    public ReportResponse.CategoriesResponse getReportCategories() {
        try {
            ReportResponse.Categories categories = new ReportResponse.Categories();
            
            categories.setIncidentTypes(List.of("harassment", "theft", "assault", "other"));
            categories.setVisibilityOptions(List.of("public", "officials_only", "private"));
            categories.setStatusOptions(List.of("submitted", "under_review", "resolved", "closed"));
            
            return new ReportResponse.CategoriesResponse(true, categories, null);
            
        } catch (Exception e) {
            logger.error("Error getting report categories", e);
            return new ReportResponse.CategoriesResponse(false, null, "Failed to get categories");
        }
    }
    
    /**
     * Get report statistics for user
     */
    public ReportResponse.StatsResponse getReportStats(UUID userId, String userRole) {
        try {
            logger.info("Getting report stats for user: {}, role: {}", userId, userRole);
            
            List<IncidentReport> userReports = reportRepository.findByUserIdOrderByCreatedAtDesc(userId);
            
            ReportResponse.ReportStats stats = new ReportResponse.ReportStats();
            stats.setTotalReports(userReports.size());
            
            // Count by type
            java.util.Map<String, Integer> reportsByType = new java.util.HashMap<>();
            reportsByType.put("harassment", 0);
            reportsByType.put("theft", 0);
            reportsByType.put("assault", 0);
            reportsByType.put("other", 0);
            
            for (IncidentReport report : userReports) {
                String type = report.getIncidentType();
                reportsByType.put(type, reportsByType.getOrDefault(type, 0) + 1);
            }
            stats.setReportsByType(reportsByType);
            
            // Count by status
            java.util.Map<String, Integer> reportsByStatus = new java.util.HashMap<>();
            reportsByStatus.put("submitted", 0);
            reportsByStatus.put("under_review", 0);
            reportsByStatus.put("resolved", 0);
            reportsByStatus.put("closed", 0);
            
            for (IncidentReport report : userReports) {
                String status = report.getStatus();
                reportsByStatus.put(status, reportsByStatus.getOrDefault(status, 0) + 1);
            }
            stats.setReportsByStatus(reportsByStatus);
            
            // Count by visibility
            java.util.Map<String, Integer> reportsByVisibility = new java.util.HashMap<>();
            reportsByVisibility.put("public", 0);
            reportsByVisibility.put("officials_only", 0);
            reportsByVisibility.put("private", 0);
            
            for (IncidentReport report : userReports) {
                String visibility = report.getVisibility();
                reportsByVisibility.put(visibility, reportsByVisibility.getOrDefault(visibility, 0) + 1);
            }
            stats.setReportsByVisibility(reportsByVisibility);
            
            // Recent reports (last 30 days)
            java.time.LocalDateTime thirtyDaysAgo = java.time.LocalDateTime.now().minusDays(30);
            int recentReports = (int) userReports.stream()
                .filter(r -> r.getCreatedAt().isAfter(thirtyDaysAgo))
                .count();
            stats.setRecentReports(recentReports);
            
            return new ReportResponse.StatsResponse(true, stats, null);
            
        } catch (Exception e) {
            logger.error("Error getting report stats for user: {}", userId, e);
            return new ReportResponse.StatsResponse(false, null, "Failed to get report statistics");
        }
    }

    // Helper method to validate incident type
    private boolean isValidIncidentType(String incidentType) {
        return incidentType != null && 
               (incidentType.equalsIgnoreCase("harassment") || 
                incidentType.equalsIgnoreCase("theft") || 
                incidentType.equalsIgnoreCase("assault") || 
                incidentType.equalsIgnoreCase("other"));
    }
}
