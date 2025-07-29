import { AlertStatusString } from "./AlertStatus";

export interface AlertResponder {
  alertId: string;
  responderId: string;
  status: AlertStatusString;
  acceptedAt: string;
  eta?: string;
}
export interface CreateResponderRequest {
  alertId: string;
  responderId: string;
}

export interface UpdateResponderStatusRequest {
  alertId: string;
  responderId: string;
  status: AlertStatusString;
  eta?: string;
}
export interface ResponderDetails {
  alertId: string;
  responderId: string;
  responderName: string;
  status: AlertStatusString;
  acceptedAt: string;
  updatedAt: string;
  eta?: string;
  userDetails?: {
    userId: string;
    name: string;
    phone: string;
    email?: string;
  };
}
