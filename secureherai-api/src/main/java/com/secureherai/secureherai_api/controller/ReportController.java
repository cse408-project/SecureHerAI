package com.secureherai.secureherai_api.controller;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
     * Get details of a specific report
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
            ReportResponse.ReportDetailsResponse response = reportService.getReportDetails(reportId, userId);
            
            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
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
     * Update report visibility
     * PUT /api/report/update-visibility
     */
    @PutMapping("/update-visibility")
    public ResponseEntity<ReportResponse.GenericResponse> updateReportVisibility(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody ReportRequest.UpdateVisibility request) {
        
        try {
            String token = authHeader.replace("Bearer ", "");
            
            // Validate token
            if (!jwtService.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ReportResponse.GenericResponse(false, null, "User not authenticated"));
            }
            
            UUID userId = jwtService.extractUserId(token);
            ReportResponse.GenericResponse response = reportService.updateReportVisibility(userId, request);
            
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
     * Get public reports (for admins and responders)
     * GET /api/report/public-reports
     */
    @GetMapping("/public-reports")
    public ResponseEntity<ReportResponse.UserReportsResponse> getPublicReports(
            @RequestHeader("Authorization") String authHeader) {
        
        try {
            String token = authHeader.replace("Bearer ", "");
            
            // Validate token
            if (!jwtService.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ReportResponse.UserReportsResponse(false, null, "User not authenticated"));
            }
            
            // Extract user role for authorization
            String userRole;
            try {
                userRole = jwtService.extractRole(token);
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ReportResponse.UserReportsResponse(false, null, "Invalid authentication token"));
            }
            
            // Only allow admins and responders to access public reports
            if (!"ADMIN".equals(userRole) && !"RESPONDER".equals(userRole)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ReportResponse.UserReportsResponse(false, null, "Insufficient permissions to access public reports"));
            }
            
            ReportResponse.UserReportsResponse response = reportService.getPublicReports(userRole);
            
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
}
