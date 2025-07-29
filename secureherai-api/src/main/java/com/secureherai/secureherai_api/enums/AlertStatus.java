package com.secureherai.secureherai_api.enums;

/**
 * Consolidated enum for all Alert and Responder Status values
 * Used to standardize status across the entire application
 */
public enum AlertStatus {
    // Alert statuses
    ACTIVE("ACTIVE"),
    CANCELED("CANCELED"),
    RESOLVED("RESOLVED"),
    CRITICAL("CRITICAL"),
    FALSE_ALARM("FALSE_ALARM"),
    EXPIRED("EXPIRED"),
    
    // Responder statuses
    PENDING("PENDING"),
    ACCEPTED("ACCEPTED"),
    REJECTED("REJECTED"),
    FORWARDED("FORWARDED"),
    EN_ROUTE("EN_ROUTE"),
    ARRIVED("ARRIVED");

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
     * Check if this status is an alert status (not responder specific)
     */
    public boolean isAlertStatus() {
        return this == ACTIVE || this == CANCELED || this == RESOLVED || 
               this == CRITICAL || this == FALSE_ALARM || this == EXPIRED;
    }

    /**
     * Check if this status is a responder status
     */
    public boolean isResponderStatus() {
        return this == PENDING || this == ACCEPTED || this == REJECTED || 
               this == FORWARDED || this == EN_ROUTE || this == ARRIVED || this == RESOLVED;
    }

    /**
     * Convert string to AlertStatus enum, case insensitive
     * @param status string status
     * @return AlertStatus enum
     * @throws IllegalArgumentException if status is invalid
     */
    public static AlertStatus fromString(String status) {
        if (status == null) {
            throw new IllegalArgumentException("Status cannot be null");
        }
        
        // Handle common variations
        String normalizedStatus = status.toUpperCase().trim();
        switch (normalizedStatus) {
            // Alert statuses
            case "ACTIVE":
                return ACTIVE;
            case "CANCELED":
            case "CANCELLED":
                return CANCELED;
            case "RESOLVED":
                return RESOLVED;
            case "CRITICAL":
                return CRITICAL;
            case "FALSE_ALARM":
            case "FALSE":
                return FALSE_ALARM;
            case "EXPIRED":
                return EXPIRED;
            
            // Responder statuses
            case "PENDING":
                return PENDING;
            case "ACCEPTED":
                return ACCEPTED;
            case "REJECTED":
                return REJECTED;
            case "FORWARDED":
                return FORWARDED;
            case "EN_ROUTE":
            case "ENROUTE":
                return EN_ROUTE;
            case "ARRIVED":
                return ARRIVED;
                
            default:
                throw new IllegalArgumentException("Invalid alert status: " + status);
        }
    }

    /**
     * Check if the status is valid
     * @param status string status to check
     * @return true if valid, false otherwise
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
        return new AlertStatus[]{ACTIVE, CANCELED, RESOLVED, CRITICAL, FALSE_ALARM, EXPIRED};
    }

    /**
     * Get all responder-specific statuses
     */
    public static AlertStatus[] getResponderStatuses() {
        return new AlertStatus[]{PENDING, ACCEPTED, REJECTED, FORWARDED, EN_ROUTE, ARRIVED, RESOLVED};
    }
}
