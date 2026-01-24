import { AlertStatusString, SeverityString } from "./AlertStatus";

export interface AlertResponder {
  alertId: string;
  responderId: string;
  status: AlertStatusString;
  acceptedAt?: string;
  createdAt?: string;
  arrivalTime?: string;
  eta?: number;
  notes?: string;
  // Forwarding info
  forwarded?: boolean;
  forwardedFromResponderId?: string;
  forwardedFrom?: string; // Forwarder's name
  forwardedAt?: string;
}

export interface CreateResponderRequest {
  alertId: string;
  responderId: string;
}

export interface UpdateResponderStatusRequest {
  alertId: string;
  status: AlertStatusString;
  eta?: number;
}

export interface ResponderDetails {
  alertId: string;
  responderId: string;
  responderName: string;
  status: AlertStatusString;
  acceptedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  eta?: number;
  userDetails?: {
    userId: string;
    name: string;
    phone: string;
    email?: string;
  };
}

/**
 * Responder info for search results (used in forward modal)
 */
export interface ResponderSearchResult {
  id: string;
  badgeNumber: string;
  fullName: string;
  email: string;
  branch?: string;
  status: string; // Availability status: AVAILABLE, BUSY, OFF_DUTY
}

/**
 * Alert data returned in pending alerts list
 */
export interface PendingAlert {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  address?: string;
  status: AlertStatusString;
  alertMessage?: string;
  triggerMethod?: string;
  triggeredAt: string;
  severity: SeverityString;
  incidentType?: string;
  // Responder-specific info
  responderStatus: AlertStatusString;
  createdAt?: string;
  forwarded: boolean;
  forwardedFrom?: string;
  forwardedAt?: string;
  // Victim info
  victimName?: string;
  victimPhone?: string;
  batchNumber?: string;
}

/**
 * Alert data returned in accepted/active alerts list
 */
export interface AcceptedAlertResponder {
  alertId: string;
  responderId: string;
  responderStatus: AlertStatusString;
  acceptedAt?: string;
  createdAt?: string;
  arrivalTime?: string;
  eta?: number;
  notes?: string;
  // Forwarding info
  forwarded: boolean;
  forwardedFrom?: string;
  forwardedFromId?: string;
  forwardedAt?: string;
  // Alert info
  alertStatus: AlertStatusString;
  latitude: number;
  longitude: number;
  address?: string;
  alertMessage?: string;
  triggerMethod?: string;
  triggeredAt: string;
  resolvedAt?: string;
  severity: SeverityString;
  incidentType?: string;
  // Victim info
  victim?: {
    userId: string;
    fullName: string;
    phone?: string;
    profilePicture?: string;
  };
}
