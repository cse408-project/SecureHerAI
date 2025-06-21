export interface User {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  profilePicture?: string;
  dateOfBirth?: string;
  role: "USER" | "RESPONDER";
  notificationPreferences?: {
    emailAlerts: boolean;
    smsAlerts: boolean;
    pushNotifications: boolean;
  };
  responderInfo?: {
    responderType: "POLICE" | "MEDICAL" | "FIRE";
    badgeNumber: string;
    status: "AVAILABLE" | "BUSY" | "OFF_DUTY";
    lastStatusUpdate: string;
    active: boolean;
  };
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  userId?: string;
  fullName?: string;
  role?: string;
  message?: string;
  error?: string;
  needsProfileCompletion?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface VerifyLoginCodeRequest {
  email: string;
  loginCode: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phoneNumber: string;
  dateOfBirth: string;
  role: "USER" | "RESPONDER";
  responderType?: "POLICE" | "MEDICAL" | "FIRE";
  badgeNumber?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  verifyLoginCode: (email: string, code: string) => Promise<AuthResponse>;
  register: (data: RegisterRequest) => Promise<AuthResponse>;
  handleGoogleLogin: (token: string) => Promise<AuthResponse>;
  forgotPassword: (email: string) => Promise<AuthResponse>;
  resetPassword: (token: string, newPassword: string) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  setToken: (token: string) => Promise<void>;
}

export interface CompleteProfileRequest {
  phoneNumber: string;
  dateOfBirth: string;
  role: "USER" | "RESPONDER";
  responderType?: "POLICE" | "MEDICAL" | "FIRE";
  badgeNumber?: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  phoneNumber?: string;
  profilePicture?: string;
  dateOfBirth?: string;
  emailAlerts?: boolean;
  smsAlerts?: boolean;
  pushNotifications?: boolean;
  status?: "AVAILABLE" | "BUSY" | "OFF_DUTY";
  responderType?: "POLICE" | "MEDICAL" | "FIRE";
  badgeNumber?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}
