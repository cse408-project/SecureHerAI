export enum AlertStatus {
  // Working alert statuses only
  ACTIVE = "ACTIVE",
  CANCELED = "CANCELED",
  RESOLVED = "RESOLVED",
  CRITICAL = "CRITICAL",
  FALSE_ALARM = "FALSE_ALARM",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
}

export type AlertStatusString =
  | "ACTIVE"
  | "CANCELED"
  | "RESOLVED"
  | "CRITICAL"
  | "FALSE_ALARM"
  | "ACCEPTED"
  | "REJECTED";

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
    case "ACCEPTED":
      return AlertStatus.ACCEPTED;
    case "REJECTED":
      return AlertStatus.REJECTED;
    default:
      console.warn(`Unknown status: ${status}, defaulting to ACTIVE`);
      return AlertStatus.ACTIVE;
  }
};
