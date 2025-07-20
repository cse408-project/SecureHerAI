/**
 * TypeScript interfaces for the getAllUsersContacts API response
 * Based on ResponderController.getAllUsersContacts() backend implementation
 */

// Base types that should be shared across the type system
export type UUID = string;

export interface BaseApiResponse {
  success: boolean;
  message: string;
}

export interface SuccessResponse<T> extends BaseApiResponse {
  success: true;
  data: T;
}

export interface ErrorResponse extends BaseApiResponse {
  success: false;
  error?: string;
}

// Base response wrapper for getAllUsersContacts API
export interface GetAllUsersContactsResponse extends SuccessResponse<UserContactData[]> {
  data: UserContactData[];
  message: string;
}

// Individual user data with their contacts and responder info (if applicable)
export interface UserContactData {
  userId: UUID;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  profilePicture?: string;
  dateOfBirth?: string; // ISO date string
  isVerified: boolean;
  responderInfo?: ResponderInfo;
  trustedContacts: TrustedContactData[];
}

// User roles enum
export type UserRole = 'USER' | 'RESPONDER' | 'ADMIN';

// Responder-specific information (only present if user is a responder)
export interface ResponderInfo {
  responderType: ResponderType;
  badgeNumber: string;
  branchName?: string;
  address?: string;
  status: ResponderStatus;
  isActive: boolean;
  lastStatusUpdate?: string; // ISO datetime string
}

// Responder types
export type ResponderType = 'POLICE' | 'MEDICAL' | 'FIRE' | 'SECURITY';

// Responder status
export type ResponderStatus = 'AVAILABLE' | 'BUSY' | 'OFF_DUTY' | 'EN_ROUTE';

// Trusted contact information
export interface TrustedContactData {
  contactId: UUID;
  name: string;
  phone: string;
  email: string;
  relationship: string;
  shareLocation: boolean;
  createdAt: string; // ISO datetime string
}

// Error response for failed API calls
export interface UsersContactsErrorResponse extends ErrorResponse {}

// Combined response type
export type UsersContactsApiResponse = GetAllUsersContactsResponse | UsersContactsErrorResponse;

// Helper type guards
export function isSuccessResponse(response: UsersContactsApiResponse): response is GetAllUsersContactsResponse {
  return response.success === true;
}

export function isErrorResponse(response: UsersContactsApiResponse): response is UsersContactsErrorResponse {
  return response.success === false;
}

export function isResponder(user: UserContactData): user is UserContactData & { responderInfo: ResponderInfo } {
  return user.role === 'RESPONDER' && user.responderInfo !== undefined;
}
