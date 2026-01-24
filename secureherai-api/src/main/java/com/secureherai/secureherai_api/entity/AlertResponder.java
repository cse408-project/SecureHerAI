package com.secureherai.secureherai_api.entity;

import com.secureherai.secureherai_api.enums.AlertStatus;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * AlertResponder entity tracks the relationship between an alert and a
 * responder.
 * 
 * Status meanings:
 * - PENDING: Responder notified but hasn't acted yet (shown in pending section)
 * - ACCEPTED: Responder accepted, no further action yet (shown in
 * accepted/critical section)
 * - REJECTED: Responder dismissed the alert (removed from homepage)
 * - CANCELED: Responder unable to continue, new notification batch created
 * (removed from homepage)
 * - FORWARDED: Alert was forwarded to another responder (this record gets
 * deleted, new one created for target)
 * - EN_ROUTE: Responder is traveling to victim location (shown in
 * accepted/critical section)
 * - ARRIVED: Responder has arrived at location (shown in accepted/critical
 * section)
 * - RESOLVED: Responder successfully completed response (alert status becomes
 * FINISHED)
 */
@Entity
@Table(name = "alert_responders")
@IdClass(AlertResponderId.class)
public class AlertResponder {

    @Id
    @Column(name = "alert_id")
    private UUID alertId;

    @Id
    @Column(name = "responder_id")
    private UUID responderId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "alert_id", insertable = false, updatable = false)
    private Alert alert;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responder_id", insertable = false, updatable = false)
    private Responder responder;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private AlertStatus status; // PENDING, ACCEPTED, REJECTED, CANCELED, FORWARDED, EN_ROUTE, ARRIVED, RESOLVED

    private String eta;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;

    @Column(name = "arrival_time")
    private LocalDateTime arrivalTime;

    private String notes;

    // Forwarding tracking fields
    @Column(name = "forwarded_from_responder_id")
    private UUID forwardedFromResponderId;

    @Column(name = "forwarded_at")
    private LocalDateTime forwardedAt;

    // Constructors
    public AlertResponder() {
    }

    public AlertResponder(UUID alertId, UUID responderId) {
        this.alertId = alertId;
        this.responderId = responderId;
        this.status = AlertStatus.PENDING; // Default to pending for new records
    }

    public AlertResponder(UUID alertId, UUID responderId, AlertStatus status) {
        this.alertId = alertId;
        this.responderId = responderId;
        this.status = status;
    }

    // Getters and Setters
    public UUID getAlertId() {
        return alertId;
    }

    public void setAlertId(UUID alertId) {
        this.alertId = alertId;
    }

    public UUID getResponderId() {
        return responderId;
    }

    public void setResponderId(UUID responderId) {
        this.responderId = responderId;
    }

    public Alert getAlert() {
        return alert;
    }

    public void setAlert(Alert alert) {
        this.alert = alert;
    }

    public Responder getResponder() {
        return responder;
    }

    public void setResponder(Responder responder) {
        this.responder = responder;
    }

    public AlertStatus getStatus() {
        return status;
    }

    public void setStatus(AlertStatus status) {
        this.status = status;
    }

    public String getEta() {
        return eta;
    }

    public void setEta(String eta) {
        this.eta = eta;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getAcceptedAt() {
        return acceptedAt;
    }

    public void setAcceptedAt(LocalDateTime acceptedAt) {
        this.acceptedAt = acceptedAt;
    }

    public LocalDateTime getArrivalTime() {
        return arrivalTime;
    }

    public void setArrivalTime(LocalDateTime arrivalTime) {
        this.arrivalTime = arrivalTime;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public UUID getForwardedFromResponderId() {
        return forwardedFromResponderId;
    }

    public void setForwardedFromResponderId(UUID forwardedFromResponderId) {
        this.forwardedFromResponderId = forwardedFromResponderId;
    }

    public LocalDateTime getForwardedAt() {
        return forwardedAt;
    }

    public void setForwardedAt(LocalDateTime forwardedAt) {
        this.forwardedAt = forwardedAt;
    }

    /**
     * Check if this alert was forwarded to the responder
     */
    public boolean isForwarded() {
        return forwardedFromResponderId != null || AlertStatus.FORWARDED.equals(status);
    }
}
