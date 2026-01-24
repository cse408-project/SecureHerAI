package com.secureherai.secureherai_api.enums;

/**
 * Consolidated enum for Alert Status and Responder Status values.
 * 
 * ALERT STATUS (Alert.java - visible to everyone):
 * - WAITING: Alert is waiting for a responder (all AlertResponders are
 * pending/canceled/forwarded)
 * - ACTIVE: Alert is active (at least one responder has accepted - includes
 * en_route/arrived)
 * - FINISHED: Alert is completed (resolved or rejected)
 * - DELETED: User deleted the alert
 * - EXPIRED: No response within TTL (20min test / 1 week production)
 * 
 * RESPONDER STATUS (AlertResponder.java - visible to victim and assigned
 * responder):
 * - PENDING: No one accepted yet (shown in pending section)
 * - ACCEPTED: Responder accepted but no action taken yet
 * - REJECTED: Responder dismissed it (severity may become false_alarm)
 * - CANCELED: Responder unable to continue, creates new notification batch
 * - FORWARDED: Another responder forwarded this to me (shown in pending with
 * forwarded flag)
 * - EN_ROUTE: Responder is traveling to location
 * - ARRIVED: Responder has arrived at location
 * - RESOLVED: Responder successfully completed the response
 * 
 * SEVERITY (Alert.java - visible to everyone, editable by victim and assigned
 * responder):
 * - CRITICAL, HIGH, MEDIUM, LOW, FALSE_ALARM (stored as String in Alert entity)
 */
public enum AlertStatus {
    // Alert statuses (for Alert.java status field)
    WAITING("WAITING"),
    ACTIVE("ACTIVE"),
    FINISHED("FINISHED"),
    DELETED("DELETED"),
    EXPIRED("EXPIRED"),

    // Responder statuses (for AlertResponder.java status field)
    PENDING("PENDING"),
    ACCEPTED("ACCEPTED"),
    REJECTED("REJECTED"),
    CANCELED("CANCELED"),
    FORWARDED("FORWARDED"),
    EN_ROUTE("EN_ROUTE"),
    ARRIVED("ARRIVED"),
    RESOLVED("RESOLVED");

    private final String value;

    AlertStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    @Override
    public String toString() {
        return value;
    }

    /**
     * Check if this status is an alert status (for Alert entity)
     */
    public boolean isAlertStatus() {
        return this == WAITING || this == ACTIVE || this == FINISHED || this == DELETED || this == EXPIRED;
    }

    /**
     * Check if this status is a responder status (for AlertResponder entity)
     */
    public boolean isResponderStatus() {
        return this == PENDING || this == ACCEPTED || this == REJECTED || this == CANCELED ||
                this == FORWARDED || this == EN_ROUTE || this == ARRIVED || this == RESOLVED;
    }

    /**
     * Check if responder status should be visible in pending section
     */
    public boolean isPendingSection() {
        return this == PENDING || this == FORWARDED;
    }

    /**
     * Check if responder status should be visible in accepted/critical section
     */
    public boolean isActiveSection() {
        return this == ACCEPTED || this == EN_ROUTE || this == ARRIVED;
    }

    /**
     * Check if responder status is terminal (cannot be changed back)
     */
    public boolean isTerminalStatus() {
        return this == RESOLVED || this == REJECTED || this == CANCELED;
    }

    /**
     * Check if alert status means alert is still ongoing (waiting for or has active
     * responder)
     */
    public boolean isAlertOngoing() {
        return this == WAITING || this == ACTIVE;
    }

    /**
     * Convert string to AlertStatus enum, case insensitive
     * Handles common variations and legacy values
     */
    public static AlertStatus fromString(String status) {
        if (status == null) {
            throw new IllegalArgumentException("Status cannot be null");
        }

        String normalizedStatus = status.toUpperCase().trim();
        switch (normalizedStatus) {
            // Alert statuses
            case "WAITING":
                return WAITING;
            case "ACTIVE":
                return ACTIVE;
            case "FINISHED":
                return FINISHED;
            case "DELETED":
                return DELETED;
            case "EXPIRED":
                return EXPIRED;

            // Responder statuses
            case "PENDING":
                return PENDING;
            case "ACCEPTED":
                return ACCEPTED;
            case "REJECTED":
                return REJECTED;
            case "CANCELED":
            case "CANCELLED":
                return CANCELED;
            case "FORWARDED":
                return FORWARDED;
            case "EN_ROUTE":
            case "ENROUTE":
                return EN_ROUTE;
            case "ARRIVED":
                return ARRIVED;
            case "RESOLVED":
                return RESOLVED;

            default:
                throw new IllegalArgumentException("Invalid alert status: " + status);
        }
    }

    /**
     * Check if the status is valid
     */
    public static boolean isValid(String status) {
        try {
            fromString(status);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * Get all alert-specific statuses
     */
    public static AlertStatus[] getAlertStatuses() {
        return new AlertStatus[] { WAITING, ACTIVE, FINISHED, DELETED, EXPIRED };
    }

    /**
     * Get all responder-specific statuses
     */
    public static AlertStatus[] getResponderStatuses() {
        return new AlertStatus[] { PENDING, ACCEPTED, REJECTED, CANCELED, FORWARDED, EN_ROUTE, ARRIVED, RESOLVED };
    }

    /**
     * Get valid next statuses for responder status transitions
     */
    public AlertStatus[] getValidNextStatuses() {
        switch (this) {
            case PENDING:
            case FORWARDED:
                return new AlertStatus[] { ACCEPTED, REJECTED };
            case ACCEPTED:
                return new AlertStatus[] { EN_ROUTE, ARRIVED, RESOLVED, CANCELED };
            case EN_ROUTE:
                return new AlertStatus[] { ACCEPTED, ARRIVED, RESOLVED, CANCELED };
            case ARRIVED:
                return new AlertStatus[] { ACCEPTED, EN_ROUTE, RESOLVED, CANCELED };
            case RESOLVED:
            case REJECTED:
            case CANCELED:
                return new AlertStatus[] {}; // Terminal states
            default:
                return new AlertStatus[] {};
        }
    }

    /**
     * Check if transition to new status is valid
     */
    public boolean canTransitionTo(AlertStatus newStatus) {
        AlertStatus[] validNext = getValidNextStatuses();
        for (AlertStatus valid : validNext) {
            if (valid == newStatus) {
                return true;
            }
        }
        return false;
    }
}
