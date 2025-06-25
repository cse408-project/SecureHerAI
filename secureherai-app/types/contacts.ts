// Types for Trusted Contacts Module
export interface TrustedContact {
  contactId: string;
  name: string;
  phone: string;
  relationship: string;
  email?: string;
  shareLocation?: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactRequest {
  name: string;
  phone: string;
  relationship: string;
  email?: string;
  shareLocation?: boolean;
}

export interface UpdateContactRequest {
  contactId: string;
  contact: CreateContactRequest;
}

export interface DeleteContactRequest {
  contactId: string;
}

// Types for Notification Preferences Module
export interface NotificationPreferences {
  userId: string;
  emailAlerts: boolean;
  smsAlerts: boolean;
  pushNotifications: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePreferencesRequest {
  preferences: {
    emailAlerts: boolean;
    smsAlerts: boolean;
    pushNotifications: boolean;
  };
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ContactsResponse {
  contacts: TrustedContact[];
}

export interface PreferencesResponse {
  preferences: NotificationPreferences;
}
