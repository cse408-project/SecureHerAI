package com.secureherai.secureherai_api.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "report_evidence")
public class ReportEvidence {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;
    
    @Column(name = "report_id", nullable = false)
    private UUID reportId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "report_id", insertable = false, updatable = false)
    private IncidentReport report;
    
    @Column(name = "file_url", nullable = false)
    private String fileUrl;
    
    @Column(name = "file_type", nullable = false)
    private String fileType; // image, video, audio, document
    
    @Column(name = "file_size")
    private Integer fileSize;
    
    private String description;
    
    @CreationTimestamp
    @Column(name = "uploaded_at", nullable = false)
    private LocalDateTime uploadedAt;
    
    // Constructors
    public ReportEvidence() {}
    
    public ReportEvidence(UUID reportId, String fileUrl, String fileType, String description) {
        this.reportId = reportId;
        this.fileUrl = fileUrl;
        this.fileType = fileType;
        this.description = description;
    }
    
    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    
    public UUID getReportId() { return reportId; }
    public void setReportId(UUID reportId) { this.reportId = reportId; }
    
    public IncidentReport getReport() { return report; }
    public void setReport(IncidentReport report) { this.report = report; }
    
    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }
    
    public String getFileType() { return fileType; }
    public void setFileType(String fileType) { this.fileType = fileType; }
    
    public Integer getFileSize() { return fileSize; }
    public void setFileSize(Integer fileSize) { this.fileSize = fileSize; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public LocalDateTime getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(LocalDateTime uploadedAt) { this.uploadedAt = uploadedAt; }
}
