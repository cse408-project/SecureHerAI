package com.secureherai.secureherai_api.dto.report;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class ReportRequest {
    
    // Submit incident report request
    public static class SubmitReport {
        @NotBlank(message = "Incident type is required")
        @Pattern(regexp = "harassment|theft|assault|other", 
                 message = "Incident type must be one of: harassment, theft, assault, other")
        private String incidentType;
        
        @NotBlank(message = "Description is required")
        @Size(min = 10, max = 2000, message = "Description must be between 10 and 2000 characters")
        private String description;
        
        @Valid
        private Location location; // Optional - location can be null
        
        private String address;
        
        @NotNull(message = "Incident time is required")
        private LocalDateTime incidentTime;
        
        @NotBlank(message = "Visibility setting is required")
        @Pattern(regexp = "public|officials_only|private", 
                 message = "Visibility must be one of: public, officials_only, private")
        private String visibility;
        
        @NotNull(message = "Anonymous setting is required")
        private Boolean anonymous;
        
        private UUID alertId; // Optional - link to an existing alert
        
        private List<String> evidence; // Base64 encoded evidence files
        
        private String involvedParties; // JSON string
        
        public SubmitReport() {}
        
        // Getters and Setters
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
        
        public Location getLocation() {
            return location;
        }
        
        public void setLocation(Location location) {
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
        
        public UUID getAlertId() {
            return alertId;
        }
        
        public void setAlertId(UUID alertId) {
            this.alertId = alertId;
        }
        
        public List<String> getEvidence() {
            return evidence;
        }
        
        public void setEvidence(List<String> evidence) {
            this.evidence = evidence;
        }
        
        public String getInvolvedParties() {
            return involvedParties;
        }
        
        public void setInvolvedParties(String involvedParties) {
            this.involvedParties = involvedParties;
        }
    }
    
    // Upload evidence request
    public static class UploadEvidence {
        @NotNull(message = "Report ID is required")
        private UUID reportId;
        
        @NotNull(message = "Evidence URLs are required")
        @Size(min = 1, message = "At least one evidence URL is required")
        private List<String> evidence; // URLs to evidence files
        
        private String description;
        
        public UploadEvidence() {}
        
        public UploadEvidence(UUID reportId, List<String> evidence) {
            this.reportId = reportId;
            this.evidence = evidence;
        }
        
        // Getters and Setters
        public UUID getReportId() {
            return reportId;
        }
        
        public void setReportId(UUID reportId) {
            this.reportId = reportId;
        }
        
        public List<String> getEvidence() {
            return evidence;
        }
        
        public void setEvidence(List<String> evidence) {
            this.evidence = evidence;
        }
        
        public String getDescription() {
            return description;
        }
        
        public void setDescription(String description) {
            this.description = description;
        }
    }
    
    // Delete evidence request
    public static class DeleteEvidence {
        @NotNull(message = "Report ID is required")
        private UUID reportId;
        
        @NotNull(message = "Evidence URL is required")
        @NotBlank(message = "Evidence URL cannot be blank")
        private String evidenceUrl;
        
        public DeleteEvidence() {}
        
        public DeleteEvidence(UUID reportId, String evidenceUrl) {
            this.reportId = reportId;
            this.evidenceUrl = evidenceUrl;
        }
        
        // Getters and Setters
        public UUID getReportId() {
            return reportId;
        }
        
        public void setReportId(UUID reportId) {
            this.reportId = reportId;
        }
        
        public String getEvidenceUrl() {
            return evidenceUrl;
        }
        
        public void setEvidenceUrl(String evidenceUrl) {
            this.evidenceUrl = evidenceUrl;
        }
    }

    public static class UserReportsByTime {
        @NotNull(message = "Start time is required")
        private LocalDateTime start;

        @NotNull(message = "End time is required")
        private LocalDateTime end;

        public UserReportsByTime() {
        }


        public UserReportsByTime(LocalDateTime start, LocalDateTime end) {
            this.start = start;
            this.end = end;
        }


        public LocalDateTime getStart() {
            return this.start;
        }

        public void setStart(LocalDateTime start) {
            this.start = start;
        }

        public LocalDateTime getEnd() {
            return this.end;
        }

        public void setEnd(LocalDateTime end) {
            this.end = end;
        }
    }
    
    // Update report request (comprehensive update for all fields)
    public static class UpdateReport {
        @NotNull(message = "Report ID is required")
        private UUID reportId;
        
        @Size(min = 10, max = 2000, message = "Description must be between 10 and 2000 characters")
        private String description;
        
        @Valid
        private Location location;
        
        private String address;
        
        private LocalDateTime incidentTime;
        
        @Pattern(regexp = "public|officials_only|private", 
                 message = "Visibility must be one of: public, officials_only, private")
        private String visibility;
        
        private Boolean anonymous;
        
        private String actionTaken;
        
        private String involvedParties; // JSON string
        
        @Pattern(regexp = "submitted|under_review|resolved", 
                 message = "Status must be one of: submitted, under_review, resolved")
        private String status;
        
        public UpdateReport() {}
        
        // Getters and Setters
        public UUID getReportId() {
            return reportId;
        }
        
        public void setReportId(UUID reportId) {
            this.reportId = reportId;
        }
        
        public String getDescription() {
            return description;
        }
        
        public void setDescription(String description) {
            this.description = description;
        }
        
        public Location getLocation() {
            return location;
        }
        
        public void setLocation(Location location) {
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
        
        public String getStatus() {
            return status;
        }
        
        public void setStatus(String status) {
            this.status = status;
        }
    }
    
    // Location inner class
    public static class Location {
        @NotNull(message = "Latitude is required")
        private BigDecimal latitude;
        
        @NotNull(message = "Longitude is required")
        private BigDecimal longitude;
        
        public Location() {}
        
        public Location(BigDecimal latitude, BigDecimal longitude) {
            this.latitude = latitude;
            this.longitude = longitude;
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
    }
}