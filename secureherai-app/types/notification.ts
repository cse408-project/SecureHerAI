export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  recipientId: string;
  senderId?: string;

  // TTL-specific fields
  alertId?: string;
  batchNumber?: number;
  expiresAt?: string;

  // Emergency-specific fields
  emergencyLocation?: {
    latitude: number;
    longitude: number;
  };
  responderName?: string;
  alertUserId?: string;
}

export enum NotificationType {
  GENERAL = "GENERAL",
  EMERGENCY_REQUEST = "EMERGENCY_REQUEST",
  EMERGENCY_ACCEPTED = "EMERGENCY_ACCEPTED",
  EMERGENCY_EXPIRED = "EMERGENCY_EXPIRED",
  SYSTEM = "SYSTEM",
}

export enum NotificationStatus {
  SENT = "SENT",
  READ = "READ",
  ACCEPTED = "ACCEPTED",
  EXPIRED = "EXPIRED",
}

export interface NotificationResponse {
  success: boolean;
  data?: Notification[];
  totalCount?: number;
  unreadCount?: number;
  message?: string;
  error?: string;
}

export interface AlertNotificationsResponse {
  success: boolean;
  alertId: string;
  inAppNotifications: Notification[];
  emailNotifications: EmailNotification[];
  totalNotifications: number;
  responderAcceptances: ResponderAcceptance[];
  message?: string;
  error?: string;
}

export interface EmailNotification {
  id: string;
  alertId: string;
  recipientEmail: string;
  subject: string;
  body: string;
  sentAt: string;
  status: "SENT" | "DELIVERED" | "FAILED";
  batchNumber?: number;
}

export interface ResponderAcceptance {
  id: string;
  alertId: string;
  responderId: string;
  responderName: string;
  acceptedAt: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface AcceptEmergencyRequest {
  alertId: string;
  alertUserId: string;
  responderName: string;
  notificationId?: string;
}

export interface NotificationMarkReadRequest {
  notificationId: string;
}

export interface NotificationCreateRequest {
  type: NotificationType;
  title: string;
  message: string;
  recipientId: string;
  alertId?: string;
  emergencyLocation?: {
    latitude: number;
    longitude: number;
  };
}

export interface NotificationListResponse {
  success: boolean;
  notifications: Notification[];
  totalCount: number;
  unreadCount: number;
  page?: number;
  size?: number;
  message?: string;
  error?: string;
}

export interface NotificationCountResponse {
  success: boolean;
  unreadCount: number;
  message?: string;
  error?: string;
}

export interface NotificationActionResponse {
  success: boolean;
  message: string;
  alertId?: string;
  markedCount?: number;
  error?: string;
}

// Legacy notification type for backward compatibility
export interface LegacyNotification {
  id: number;
  message: string;
}
