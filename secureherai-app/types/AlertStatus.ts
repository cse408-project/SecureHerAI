export enum AlertStatus {
  // Alert statuses
  ACTIVE = "ACTIVE",
  CANCELED = "CANCELED",
  RESOLVED = "RESOLVED",
  CRITICAL = "CRITICAL",
  FALSE_ALARM = "FALSE_ALARM",
  EXPIRED = "EXPIRED",
  // Responder statuses
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  FORWARDED = "FORWARDED",
  EN_ROUTE = "EN_ROUTE",
  ARRIVED = "ARRIVED",
}

export type AlertStatusString =
  | "ACTIVE"
  | "CANCELED"
  | "RESOLVED"
  | "CRITICAL"
  | "FALSE_ALARM"
  | "EXPIRED"
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "FORWARDED"
  | "EN_ROUTE"
  | "ARRIVED";

// Helper functions for status categorization
export const isValidAlertStatus = (status: AlertStatus): boolean => {
  return Object.values(AlertStatus).includes(status);
};

// Convert string to AlertStatus with fallback
export const parseAlertStatus = (status: string): AlertStatus => {
  const upperStatus = status.toUpperCase();

  // Handle legacy values
  switch (upperStatus) {
    case "ACTIVE":
      return AlertStatus.ACTIVE;
    case "CANCELED":
    case "CANCELLED":
      return AlertStatus.CANCELED;
    case "RESOLVED":
      return AlertStatus.RESOLVED;
    case "CRITICAL":
      return AlertStatus.CRITICAL;
    case "FALSE_ALARM":
    case "FALSE":
      return AlertStatus.FALSE_ALARM;
    case "EXPIRED":
      return AlertStatus.EXPIRED;
    case "PENDING":
      return AlertStatus.PENDING;
    case "ACCEPTED":
      return AlertStatus.ACCEPTED;
    case "REJECTED":
      return AlertStatus.REJECTED;
    case "FORWARDED":
      return AlertStatus.FORWARDED;
    case "EN_ROUTE":
    case "ENROUTE":
      return AlertStatus.EN_ROUTE;
    case "ARRIVED":
      return AlertStatus.ARRIVED;
    default:
      console.warn(`Unknown status: ${status}, defaulting to ACTIVE`);
      return AlertStatus.ACTIVE;
  }
};
