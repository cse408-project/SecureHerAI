/**
 * Alert statuses - for the Alert entity itself
 * - WAITING: Alert is waiting for a responder (no one accepted yet)
 * - ACTIVE: Alert is active and has at least one responder who accepted
 * - FINISHED: Alert has been resolved by responders
 * - DELETED: Alert was deleted (soft delete)
 * - EXPIRED: Alert expired without response
 */
export enum AlertStatus {
  WAITING = "WAITING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
  DELETED = "DELETED",
  EXPIRED = "EXPIRED",
}

/**
 * Responder statuses - for AlertResponder records
 * - PENDING: Responder has been notified, awaiting response
 * - ACCEPTED: Responder accepted the alert
 * - REJECTED: Responder rejected the alert
 * - CANCELED: Responder canceled after accepting
 * - FORWARDED: Responder forwarded the alert to others
 * - EN_ROUTE: Responder is on the way
 * - ARRIVED: Responder has arrived at the scene
 * - RESOLVED: Responder has resolved/finished the alert
 */
export enum ResponderStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  CANCELED = "CANCELED",
  FORWARDED = "FORWARDED",
  EN_ROUTE = "EN_ROUTE",
  ARRIVED = "ARRIVED",
  RESOLVED = "RESOLVED",
}

/**
 * Severity levels for alerts (AI-analyzed or manually set)
 */
export enum AlertSeverity {
  CRITICAL = "CRITICAL",
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
  FALSE_ALARM = "FALSE_ALARM",
}

// Combined type for backward compatibility (used in some places)
export type AlertStatusString =
  | "WAITING"
  | "ACTIVE"
  | "FINISHED"
  | "DELETED"
  | "EXPIRED"
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "CANCELED"
  | "FORWARDED"
  | "EN_ROUTE"
  | "ARRIVED"
  | "RESOLVED"
  // Legacy values for backward compatibility
  | "CRITICAL"
  | "FALSE_ALARM"
  | "RESOLVED";

export type SeverityString =
  | "CRITICAL"
  | "HIGH"
  | "MEDIUM"
  | "LOW"
  | "FALSE_ALARM";

// Helper to check if a status is a pending section status
export const isPendingStatus = (status: string): boolean => {
  return (
    status === ResponderStatus.PENDING || status === ResponderStatus.FORWARDED
  );
};

// Helper to check if a status is an active section status
export const isActiveStatus = (status: string): boolean => {
  return [
    ResponderStatus.ACCEPTED,
    ResponderStatus.EN_ROUTE,
    ResponderStatus.ARRIVED,
  ].includes(status as ResponderStatus);
};

// Helper to check if a status is terminal (no further transitions)
export const isTerminalStatus = (status: string): boolean => {
  return [
    ResponderStatus.REJECTED,
    ResponderStatus.CANCELED,
    ResponderStatus.RESOLVED,
  ].includes(status as ResponderStatus);
};

// Convert string to AlertStatus with fallback
export const parseAlertStatus = (status: string): AlertStatus => {
  const upperStatus = status.toUpperCase();

  switch (upperStatus) {
    case "ACTIVE":
      return AlertStatus.ACTIVE;
    case "FINISHED":
    case "RESOLVED": // Legacy mapping
      return AlertStatus.FINISHED;
    case "DELETED":
      return AlertStatus.DELETED;
    case "EXPIRED":
      return AlertStatus.EXPIRED;
    // Legacy mappings
    case "CRITICAL":
      return AlertStatus.ACTIVE; // CRITICAL is now a severity, not a status
    case "FALSE_ALARM":
      return AlertStatus.FINISHED;
    default:
      console.warn(`Unknown alert status: ${status}, defaulting to ACTIVE`);
      return AlertStatus.ACTIVE;
  }
};

// Convert string to ResponderStatus with fallback
export const parseResponderStatus = (status: string): ResponderStatus => {
  const upperStatus = status.toUpperCase();

  switch (upperStatus) {
    case "PENDING":
      return ResponderStatus.PENDING;
    case "ACCEPTED":
      return ResponderStatus.ACCEPTED;
    case "REJECTED":
      return ResponderStatus.REJECTED;
    case "CANCELED":
    case "CANCELLED":
      return ResponderStatus.CANCELED;
    case "FORWARDED":
      return ResponderStatus.FORWARDED;
    case "EN_ROUTE":
    case "ENROUTE":
      return ResponderStatus.EN_ROUTE;
    case "ARRIVED":
      return ResponderStatus.ARRIVED;
    case "RESOLVED":
      return ResponderStatus.RESOLVED;
    default:
      console.warn(
        `Unknown responder status: ${status}, defaulting to PENDING`,
      );
      return ResponderStatus.PENDING;
  }
};

// Get color for severity
export const getSeverityColor = (severity: string): string => {
  switch (severity?.toUpperCase()) {
    case "CRITICAL":
      return "#DC2626"; // Red
    case "HIGH":
      return "#EA580C"; // Orange
    case "MEDIUM":
      return "#CA8A04"; // Yellow/Amber
    case "LOW":
      return "#16A34A"; // Green
    case "FALSE_ALARM":
      return "#6B7280"; // Gray
    default:
      return "#CA8A04"; // Default to Medium (Yellow)
  }
};

// Get color for responder status
export const getResponderStatusColor = (status: string): string => {
  switch (status?.toUpperCase()) {
    case "PENDING":
      return "#CA8A04"; // Amber
    case "ACCEPTED":
      return "#2563EB"; // Blue
    case "REJECTED":
      return "#DC2626"; // Red
    case "CANCELED":
      return "#6B7280"; // Gray
    case "FORWARDED":
      return "#7C3AED"; // Purple
    case "EN_ROUTE":
      return "#0891B2"; // Cyan
    case "ARRIVED":
      return "#059669"; // Emerald
    case "RESOLVED":
      return "#16A34A"; // Green
    default:
      return "#6B7280"; // Gray
  }
};
