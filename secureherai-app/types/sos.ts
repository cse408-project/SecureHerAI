import { AlertStatusString } from "./AlertStatus";

export interface Alert {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  address: string;
  triggerMethod: string;
  alertMessage: string;
  audioRecording: string | null;
  triggeredAt: string;
  status: AlertStatusString;
  verificationStatus: string;
  canceledAt: string | null;
  resolvedAt: string | null;
  forwarded?: boolean;
  notes?: string;
}

export interface AlertResponse {
  success: boolean;
  message: string;
  alertId?: string;
  userId?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  triggerMethod?: string;
  alertMessage?: string;
  audioRecording?: string | null;
  triggeredAt?: string;
  status?: string;
  verificationStatus?: string;
  canceledAt?: string | null;
  resolvedAt?: string | null;
}

export interface SOSVoiceCommandRequest {
  audioUrl: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

export interface SOSTextCommandRequest {
  message: string;
  keyword: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

export interface SOSCancelRequest {
  alertId: string;
}

export type EmergencyAlert = {
  id: number | string;
  timestamp: string;
  type: string;
  status: string;
  location: string;
  respondersNotified?: number;
};
