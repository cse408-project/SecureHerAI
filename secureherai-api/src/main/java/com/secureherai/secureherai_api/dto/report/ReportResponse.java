package com.secureherai.secureherai_api.dto.report;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class ReportResponse {
    
    // Generic response for operations
    public static class GenericResponse {
        private boolean success;
        private String message;
        private String error;
        private UUID reportId; // For submit operations
        
        public GenericResponse() {}
        
        public GenericResponse(boolean success, String message, String error) {
            this.success = success;
            this.message = message;
            this.error = error;
        }
        
        public GenericResponse(boolean success, String message, String error, UUID reportId) {
            this.success = success;
            this.message = message;
            this.error = error;
            this.reportId = reportId;
        }
        
        // Getters and Setters
        public boolean isSuccess() {
            return success;
        }
        
        public void setSuccess(boolean success) {
            this.success = success;
        }
        
        public String getMessage() {
            return message;
        }
        
        public void setMessage(String message) {
            this.message = message;
        }
        
        public String getError() {
            return error;
        }
        
        public void setError(String error) {
            this.error = error;
        }
        
        public UUID getReportId() {
            return reportId;
        }
        
        public void setReportId(UUID reportId) {
            this.reportId = reportId;
        }
    }
    
    // User reports response
    public static class UserReportsResponse {
        private boolean success;
        private List<ReportSummary> reports;
        private String error;
        
        public UserReportsResponse() {}
        
        public UserReportsResponse(boolean success, List<ReportSummary> reports, String error) {
            this.success = success;
            this.reports = reports;
            this.error = error;
        }
        
        // Getters and Setters
        public boolean isSuccess() {
            return success;
        }
        
        public void setSuccess(boolean success) {
            this.success = success;
        }
        
        public List<ReportSummary> getReports() {
            return reports;
        }
        
        public void setReports(List<ReportSummary> reports) {
            this.reports = reports;
        }
        
        public String getError() {
            return error;
        }
        
        public void setError(String error) {
            this.error = error;
        }
    }
    
    // Report details response
    public static class ReportDetailsResponse {
        private boolean success;
        private ReportDetails report;
        private String error;
        
        public ReportDetailsResponse() {}
        
        public ReportDetailsResponse(boolean success, ReportDetails report, String error) {
            this.success = success;
            this.report = report;
            this.error = error;
        }
        
        // Getters and Setters
        public boolean isSuccess() {
            return success;
        }
        
        public void setSuccess(boolean success) {
            this.success = success;
        }
        
        public ReportDetails getReport() {
            return report;
        }
        
        public void setReport(ReportDetails report) {
            this.report = report;
        }
        
        public String getError() {
            return error;
        }
        
        public void setError(String error) {
            this.error = error;
        }
    }
    
    // Report summary class for listing
    public static class ReportSummary {
        private UUID reportId;
        private String incidentType;
        private String description; // Truncated
        private LocationInfo location;
        private LocalDateTime incidentTime;
        private String status;
        private String visibility;
        private Boolean anonymous;
        private LocalDateTime createdAt;
        
        public ReportSummary() {}
        
        public ReportSummary(UUID reportId, String incidentType, String description, 
                           LocationInfo location, LocalDateTime incidentTime, 
                           String status, String visibility, Boolean anonymous, 
                           LocalDateTime createdAt) {
            this.reportId = reportId;
            this.incidentType = incidentType;
            this.description = description;
            this.location = location;
            this.incidentTime = incidentTime;
            this.status = status;
            this.visibility = visibility;
            this.anonymous = anonymous;
            this.createdAt = createdAt;
        }
        
        // Getters and Setters
        public UUID getReportId() {
            return reportId;
        }
        
        public void setReportId(UUID reportId) {
            this.reportId = reportId;
        }
        
        public String getIncidentType() {
            return incidentType;
        }
        
        public void setIncidentType(String incidentType) {
            this.incidentType = incidentType;
        }
        
        public String getDescription() {
            return description;
        }
        
        public void setDescription(String description) {
            this.description = description;
        }
        
        public LocationInfo getLocation() {
            return location;
        }
        
        public void setLocation(LocationInfo location) {
            this.location = location;
        }
        
        public LocalDateTime getIncidentTime() {
            return incidentTime;
        }
        
        public void setIncidentTime(LocalDateTime incidentTime) {
            this.incidentTime = incidentTime;
        }
        
        public String getStatus() {
            return status;
        }
        
        public void setStatus(String status) {
            this.status = status;
        }
        
        public String getVisibility() {
            return visibility;
        }
        
        public void setVisibility(String visibility) {
            this.visibility = visibility;
        }
        
        public Boolean getAnonymous() {
            return anonymous;
        }
        
        public void setAnonymous(Boolean anonymous) {
            this.anonymous = anonymous;
        }
        
        public LocalDateTime getCreatedAt() {
            return createdAt;
        }
        
        public void setCreatedAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
        }
    }
    
    // Full report details class
    public static class ReportDetails {
        private UUID reportId;
        private UUID alertId;
        private String incidentType;
        private String description;
        private LocationInfo location;
        private String address;
        private LocalDateTime incidentTime;
        private String status;
        private String visibility;
        private Boolean anonymous;
        private String actionTaken;
        private String involvedParties;
        private List<String> evidence; // URLs or base64 data
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        
        public ReportDetails() {}
        
        // Getters and Setters
        public UUID getReportId() {
            return reportId;
        }
        
        public void setReportId(UUID reportId) {
            this.reportId = reportId;
        }
        
        public UUID getAlertId() {
            return alertId;
        }
        
        public void setAlertId(UUID alertId) {
            this.alertId = alertId;
        }
        
        public String getIncidentType() {
            return incidentType;
        }
        
        public void setIncidentType(String incidentType) {
            this.incidentType = incidentType;
        }
        
        public String getDescription() {
            return description;
        }
        
        public void setDescription(String description) {
            this.description = description;
        }
        
        public LocationInfo getLocation() {
            return location;
        }
        
        public void setLocation(LocationInfo location) {
            this.location = location;
        }
        
        public String getAddress() {
            return address;
        }
        
        public void setAddress(String address) {
            this.address = address;
        }
        
        public LocalDateTime getIncidentTime() {
            return incidentTime;
        }
        
        public void setIncidentTime(LocalDateTime incidentTime) {
            this.incidentTime = incidentTime;
        }
        
        public String getStatus() {
            return status;
        }
        
        public void setStatus(String status) {
            this.status = status;
        }
        
        public String getVisibility() {
            return visibility;
        }
        
        public void setVisibility(String visibility) {
            this.visibility = visibility;
        }
        
        public Boolean getAnonymous() {
            return anonymous;
        }
        
        public void setAnonymous(Boolean anonymous) {
            this.anonymous = anonymous;
        }
        
        public String getActionTaken() {
            return actionTaken;
        }
        
        public void setActionTaken(String actionTaken) {
            this.actionTaken = actionTaken;
        }
        
        public String getInvolvedParties() {
            return involvedParties;
        }
        
        public void setInvolvedParties(String involvedParties) {
            this.involvedParties = involvedParties;
        }
        
        public List<String> getEvidence() {
            return evidence;
        }
        
        public void setEvidence(List<String> evidence) {
            this.evidence = evidence;
        }
        
        public LocalDateTime getCreatedAt() {
            return createdAt;
        }
        
        public void setCreatedAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
        }
        
        public LocalDateTime getUpdatedAt() {
            return updatedAt;
        }
        
        public void setUpdatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
        }
    }
    
    // Location info class
    public static class LocationInfo {
        private BigDecimal latitude;
        private BigDecimal longitude;
        private String address;
        
        public LocationInfo() {}
        
        public LocationInfo(BigDecimal latitude, BigDecimal longitude, String address) {
            this.latitude = latitude;
            this.longitude = longitude;
            this.address = address;
        }
        
        // Getters and Setters
        public BigDecimal getLatitude() {
            return latitude;
        }
        
        public void setLatitude(BigDecimal latitude) {
            this.latitude = latitude;
        }
        
        public BigDecimal getLongitude() {
            return longitude;
        }
        
        public void setLongitude(BigDecimal longitude) {
            this.longitude = longitude;
        }
        
        public String getAddress() {
            return address;
        }
        
        public void setAddress(String address) {
            this.address = address;
        }
    }
}
