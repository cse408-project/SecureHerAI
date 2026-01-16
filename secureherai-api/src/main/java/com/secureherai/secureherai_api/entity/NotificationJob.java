package com.secureherai.secureherai_api.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity for storing scheduled notification jobs in the database.
 * This allows notification escalation to survive server restarts.
 */
@Entity
@Table(name = "notification_jobs", indexes = {
        @Index(name = "idx_notification_job_status", columnList = "status"),
        @Index(name = "idx_notification_job_execute_at", columnList = "execute_at"),
        @Index(name = "idx_notification_job_alert_id", columnList = "alert_id")
})
public class NotificationJob {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "alert_id", nullable = false)
    private UUID alertId;

    @Enumerated(EnumType.STRING)
    @Column(name = "job_type", nullable = false, length = 30)
    private JobType jobType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private JobStatus status = JobStatus.PENDING;

    @Column(name = "batch_number", nullable = false)
    private Integer batchNumber;

    @Column(name = "responders_to_notify")
    private Integer respondersToNotify;

    @Column(name = "execute_at", nullable = false)
    private LocalDateTime executeAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "executed_at")
    private LocalDateTime executedAt;

    @Column(name = "retry_count")
    private Integer retryCount = 0;

    @Column(name = "max_retries")
    private Integer maxRetries = 3;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    // Enums
    public enum JobType {
        ESCALATE_NOTIFICATION, // Expand to more responders if no response
        EXPIRE_NOTIFICATION, // Mark notification as expired
        SEND_SMS_FALLBACK, // Send SMS if push/in-app failed
        FOLLOW_UP_CHECK // "Are you safe?" follow-up
    }

    public enum JobStatus {
        PENDING,
        PROCESSING,
        COMPLETED,
        FAILED,
        CANCELLED
    }

    // Constructors
    public NotificationJob() {
    }

    public NotificationJob(UUID alertId, JobType jobType, Integer batchNumber,
            Integer respondersToNotify, LocalDateTime executeAt) {
        this.alertId = alertId;
        this.jobType = jobType;
        this.batchNumber = batchNumber;
        this.respondersToNotify = respondersToNotify;
        this.executeAt = executeAt;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public UUID getAlertId() {
        return alertId;
    }

    public void setAlertId(UUID alertId) {
        this.alertId = alertId;
    }

    public JobType getJobType() {
        return jobType;
    }

    public void setJobType(JobType jobType) {
        this.jobType = jobType;
    }

    public JobStatus getStatus() {
        return status;
    }

    public void setStatus(JobStatus status) {
        this.status = status;
    }

    public Integer getBatchNumber() {
        return batchNumber;
    }

    public void setBatchNumber(Integer batchNumber) {
        this.batchNumber = batchNumber;
    }

    public Integer getRespondersToNotify() {
        return respondersToNotify;
    }

    public void setRespondersToNotify(Integer respondersToNotify) {
        this.respondersToNotify = respondersToNotify;
    }

    public LocalDateTime getExecuteAt() {
        return executeAt;
    }

    public void setExecuteAt(LocalDateTime executeAt) {
        this.executeAt = executeAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getExecutedAt() {
        return executedAt;
    }

    public void setExecutedAt(LocalDateTime executedAt) {
        this.executedAt = executedAt;
    }

    public Integer getRetryCount() {
        return retryCount;
    }

    public void setRetryCount(Integer retryCount) {
        this.retryCount = retryCount;
    }

    public Integer getMaxRetries() {
        return maxRetries;
    }

    public void setMaxRetries(Integer maxRetries) {
        this.maxRetries = maxRetries;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }
}
