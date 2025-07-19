package com.secureherai.secureherai_api.controller;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.secureherai.secureherai_api.dto.report.ReportRequest;
import com.secureherai.secureherai_api.dto.report.ReportResponse;
import com.secureherai.secureherai_api.service.JwtService;
import com.secureherai.secureherai_api.service.ReportService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/report")
public class ReportController {
    
    @Autowired
    private ReportService reportService;
    
    @Autowired
    private JwtService jwtService;
    
    /**
     * Submit a new incident report
     * POST /api/report/submit
     */
    @PostMapping("/submit")
    public ResponseEntity<ReportResponse.GenericResponse> submitReport(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody ReportRequest.SubmitReport request) {
        
        try {
            String token = authHeader.replace("Bearer ", "");
            
            // Validate token
            if (!jwtService.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ReportResponse.GenericResponse(false, null, "User not authenticated"));
            }
            
            UUID userId = jwtService.extractUserId(token);
            ReportResponse.GenericResponse response = reportService.submitReport(userId, request);
            
            if (response.isSuccess()) {
                return ResponseEntity.status(HttpStatus.CREATED).body(response);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            
        } catch (io.jsonwebtoken.JwtException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ReportResponse.GenericResponse(false, null, "Invalid authentication token"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ReportResponse.GenericResponse(false, null, "An unexpected error occurred"));
        }
    }
    
    /**
     * Get user's incident reports
     * GET /api/report/user-reports
     */
    @GetMapping("/user-reports")
    public ResponseEntity<ReportResponse.UserReportsResponse> getUserReports(
            @RequestHeader("Authorization") String authHeader) {
        
        try {
            String token = authHeader.replace("Bearer ", "");
            
            // Validate token
            if (!jwtService.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ReportResponse.UserReportsResponse(false, null, "User not authenticated"));
            }
            
            UUID userId = jwtService.extractUserId(token);
            ReportResponse.UserReportsResponse response = reportService.getUserReports(userId);
            
            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            
        } catch (io.jsonwebtoken.JwtException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ReportResponse.UserReportsResponse(false, null, "Invalid authentication token"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ReportResponse.UserReportsResponse(false, null, "An unexpected error occurred"));
        }
    }

    /**
     * Get user's incident reports by time range
     * GET /api/report/user-reports/time?start=2023-01-01T00:00:00&end=2023-12-31T23:59:59
     */
    @GetMapping("/user-reports/time")
    public ResponseEntity<ReportResponse.UserReportsResponse> getUserReportsByTime(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam String start,
            @RequestParam String end) {
        
        try {
            String token = authHeader.replace("Bearer ", "");
            
            // Validate token
            if (!jwtService.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ReportResponse.UserReportsResponse(false, null, "User not authenticated"));
            }
            
            // Parse the date strings to LocalDateTime
            // Handle ISO 8601 format like "2025-07-01T00:00:00.000Z"
            LocalDateTime startTime = parseISODateTime(start);
            LocalDateTime endTime = parseISODateTime(end);
            
            UUID userId = jwtService.extractUserId(token);
            ReportResponse.UserReportsResponse response = reportService.getUserReportsByTime(userId, startTime, endTime);
            
            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            
        } catch (java.time.format.DateTimeParseException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ReportResponse.UserReportsResponse(false, null, "Invalid date format. Use ISO format like: 2025-07-01T00:00:00.000Z or 2025-07-01T00:00:00"));
        } catch (io.jsonwebtoken.JwtException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ReportResponse.UserReportsResponse(false, null, "Invalid authentication token"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ReportResponse.UserReportsResponse(false, null, "An unexpected error occurred"));
        }
    }
    
    /**
     * Get details of a specific report
     * - Users: Can view their own reports or public reports
     * - Admin/Responder: Can view all reports regardless of visibility
     * GET /api/report/details?reportId={reportId}
     */
    @GetMapping("/details")
    public ResponseEntity<ReportResponse.ReportDetailsResponse> getReportDetails(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam UUID reportId) {
        
        try {
            String token = authHeader.replace("Bearer ", "");
            
            // Validate token
            if (!jwtService.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ReportResponse.ReportDetailsResponse(false, null, "User not authenticated"));
            }
            
            UUID userId = jwtService.extractUserId(token);
            String userRole;
            try {
                userRole = jwtService.extractRole(token);
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ReportResponse.ReportDetailsResponse(false, null, "Invalid authentication token"));
            }
            
            ReportResponse.ReportDetailsResponse response = reportService.getReportDetails(reportId, userId, userRole);
            
            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }
            
        } catch (io.jsonwebtoken.JwtException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ReportResponse.ReportDetailsResponse(false, null, "Invalid authentication token"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ReportResponse.ReportDetailsResponse(false, null, "An unexpected error occurred"));
        }
    }
    
    /**
     * Upload evidence for a report
     * POST /api/report/upload-evidence
     */
    @PostMapping("/upload-evidence")
    public ResponseEntity<ReportResponse.GenericResponse> uploadEvidence(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody ReportRequest.UploadEvidence request) {
        
        try {
            String token = authHeader.replace("Bearer ", "");
            
            // Validate token
            if (!jwtService.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ReportResponse.GenericResponse(false, null, "User not authenticated"));
            }
            
            UUID userId = jwtService.extractUserId(token);
            ReportResponse.GenericResponse response = reportService.uploadEvidence(userId, request);
            
            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            
        } catch (io.jsonwebtoken.JwtException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ReportResponse.GenericResponse(false, null, "Invalid authentication token"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ReportResponse.GenericResponse(false, null, "An unexpected error occurred"));
        }
    }

    /**
     * Delete evidence from a report
     * POST /api/report/delete-evidence
     */
    @PostMapping("/delete-evidence")
    public ResponseEntity<ReportResponse.GenericResponse> deleteEvidence(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody ReportRequest.DeleteEvidence request) {
        
        try {
            String token = authHeader.replace("Bearer ", "");
            
            // Validate token
            if (!jwtService.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ReportResponse.GenericResponse(false, null, "User not authenticated"));
            }
            
            UUID userId = jwtService.extractUserId(token);
            ReportResponse.GenericResponse response = reportService.deleteEvidence(userId, request);
            
            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            
        } catch (io.jsonwebtoken.JwtException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ReportResponse.GenericResponse(false, null, "Invalid authentication token"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ReportResponse.GenericResponse(false, null, "An unexpected error occurred"));
        }
    }
    
    /**
     * Update incident report (comprehensive update for all fields)
     * PUT /api/report/update
     */
    @PutMapping("/update")
    public ResponseEntity<ReportResponse.GenericResponse> updateReport(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody ReportRequest.UpdateReport request) {
        
        try {
            String token = authHeader.replace("Bearer ", "");
            
            // Validate token
            if (!jwtService.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ReportResponse.GenericResponse(false, null, "User not authenticated"));
            }
            
            UUID userId = jwtService.extractUserId(token);
            String userRole = jwtService.extractRole(token);
            ReportResponse.GenericResponse response = reportService.updateReport(userId, userRole, request);
            
            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            
        } catch (io.jsonwebtoken.JwtException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ReportResponse.GenericResponse(false, null, "Invalid authentication token"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ReportResponse.GenericResponse(false, null, "An unexpected error occurred"));
        }
    }
    
    /**
     * Get all reports (accessible to all authenticated users)
     * GET /api/report/all-reports
     */
    @GetMapping("/all-reports")
    public ResponseEntity<ReportResponse.UserReportsResponse> getPublicReports(
            @RequestHeader("Authorization") String authHeader) {
        
        try {
            String token = authHeader.replace("Bearer ", "");
            
            // Validate token
            if (!jwtService.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ReportResponse.UserReportsResponse(false, null, "User not authenticated"));
            }
            
            // Extract user role for service layer processing
            String userRole;
            try {
                userRole = jwtService.extractRole(token);
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ReportResponse.UserReportsResponse(false, null, "Invalid authentication token"));
            }
            
            // Allow all authenticated users to access all reports
            ReportResponse.UserReportsResponse response = reportService.getAllReports(userRole);
            
            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            
        } catch (io.jsonwebtoken.JwtException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ReportResponse.UserReportsResponse(false, null, "Invalid authentication token"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ReportResponse.UserReportsResponse(false, null, "An unexpected error occurred"));
        }
    }
    
    /**
     * Search and filter reports with advanced query support
     * GET /api/report/search?query={query}&incidentType={type}&visibility={visibility}&status={status}&page={page}&size={size}
     */
    @GetMapping("/search")
    public ResponseEntity<ReportResponse.UserReportsResponse> searchReports(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String incidentType,
            @RequestParam(required = false) String visibility,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        
        try {
            String token = authHeader.replace("Bearer ", "");
            
            // Validate token
            if (!jwtService.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ReportResponse.UserReportsResponse(false, null, "User not authenticated"));
            }
            
            // Validate filter parameters
            if (incidentType != null && !isValidIncidentType(incidentType)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ReportResponse.UserReportsResponse(false, null, 
                        "Invalid incident type. Must be one of: harassment, theft, assault, other"));
            }
            
            if (visibility != null && !isValidVisibility(visibility)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ReportResponse.UserReportsResponse(false, null, 
                        "Invalid visibility. Must be one of: public, officials_only, private"));
            }
            
            if (status != null && !isValidStatus(status)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ReportResponse.UserReportsResponse(false, null, 
                        "Invalid status. Must be one of: submitted, under_review, resolved, closed"));
            }
            
            UUID userId = jwtService.extractUserId(token);
            String userRole = jwtService.extractRole(token);
            
            ReportResponse.UserReportsResponse response = reportService.searchAndFilterReports(
                query, incidentType, visibility, status, userId, userRole, page, size);
            
            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            
        } catch (io.jsonwebtoken.JwtException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ReportResponse.UserReportsResponse(false, null, "Invalid authentication token"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ReportResponse.UserReportsResponse(false, null, "An unexpected error occurred"));
        }
    }
    
    /**
     * Get report categories for filtering
     * GET /api/report/categories
     */
    @GetMapping("/categories")
    public ResponseEntity<ReportResponse.CategoriesResponse> getReportCategories(
            @RequestHeader("Authorization") String authHeader) {
        
        try {
            String token = authHeader.replace("Bearer ", "");
            
            // Validate token
            if (!jwtService.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ReportResponse.CategoriesResponse(false, null, "User not authenticated"));
            }
            
            ReportResponse.CategoriesResponse response = reportService.getReportCategories();
            return ResponseEntity.ok(response);
            
        } catch (io.jsonwebtoken.JwtException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ReportResponse.CategoriesResponse(false, null, "Invalid authentication token"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ReportResponse.CategoriesResponse(false, null, "An unexpected error occurred"));
        }
    }
    
    /**
     * Get report statistics
     * GET /api/report/stats
     */
    @GetMapping("/stats")
    public ResponseEntity<ReportResponse.StatsResponse> getReportStats(
            @RequestHeader("Authorization") String authHeader) {
        
        try {
            String token = authHeader.replace("Bearer ", "");
            
            // Validate token
            if (!jwtService.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ReportResponse.StatsResponse(false, null, "User not authenticated"));
            }
            
            UUID userId = jwtService.extractUserId(token);
            String userRole = jwtService.extractRole(token);
            
            ReportResponse.StatsResponse response = reportService.getReportStats(userId, userRole);
            return ResponseEntity.ok(response);
            
        } catch (io.jsonwebtoken.JwtException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ReportResponse.StatsResponse(false, null, "Invalid authentication token"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ReportResponse.StatsResponse(false, null, "An unexpected error occurred"));
        }
    }
    
    /**
     * Delete an incident report
     * DELETE /api/report/delete?reportId={reportId}
     */
    @DeleteMapping("/delete")
    public ResponseEntity<ReportResponse.GenericResponse> deleteReport(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam String reportId) {
        
        try {
            String token = authHeader.replace("Bearer ", "");
            
            // Validate token
            if (!jwtService.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ReportResponse.GenericResponse(false, null, "User not authenticated"));
            }
            
            UUID userId = jwtService.extractUserId(token);
            String userRole = jwtService.extractRole(token);
            UUID reportUuid = UUID.fromString(reportId);
            
            ReportResponse.GenericResponse response = reportService.deleteReport(reportUuid, userId, userRole);
            
            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ReportResponse.GenericResponse(false, null, "Invalid report ID format"));
        } catch (io.jsonwebtoken.JwtException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ReportResponse.GenericResponse(false, null, "Invalid authentication token"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ReportResponse.GenericResponse(false, null, "An unexpected error occurred"));
        }
    }

    // Helper validation methods
    private boolean isValidIncidentType(String incidentType) {
        return incidentType != null && 
               (incidentType.equals("harassment") || incidentType.equals("theft") || 
                incidentType.equals("assault") || incidentType.equals("other"));
    }
    
    private boolean isValidVisibility(String visibility) {
        return visibility != null && 
               (visibility.equals("public") || visibility.equals("officials_only") || 
                visibility.equals("private"));
    }
    
    private boolean isValidStatus(String status) {
        return status != null && 
               (status.equals("submitted") || status.equals("under_review") || 
                status.equals("resolved") || status.equals("closed"));
    }
    
    /**
     * Parse ISO 8601 date string to LocalDateTime
     * Handles formats like "2025-07-01T00:00:00.000Z" and "2025-07-01T00:00:00"
     */
    private LocalDateTime parseISODateTime(String dateStr) {
        try {
            // Try parsing as ISO instant first (with Z timezone)
            if (dateStr.endsWith("Z") || dateStr.contains("+") || dateStr.contains("-")) {
                return OffsetDateTime.parse(dateStr).toLocalDateTime();
            } else {
                // Parse as local date-time
                return LocalDateTime.parse(dateStr);
            }
        } catch (Exception e) {
            // Fallback: try to parse with specific formatters
            try {
                // Handle format like "2025-07-01T00:00:00.000Z"
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
                return LocalDateTime.parse(dateStr, formatter);
            } catch (Exception e2) {
                throw new java.time.format.DateTimeParseException("Unable to parse date: " + dateStr, dateStr, 0);
            }
        }
    }
}
