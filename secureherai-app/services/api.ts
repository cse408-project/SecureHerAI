import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  SubmitReportRequest,
  GenericReportResponse,
  UserReportsResponse,
  ReportDetailsResponse,
  UploadEvidenceRequest,
  UpdateReportRequest,
} from "../types/report";

//Ensure API base URL works in both web and native environments
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:8080/api";

//Debug log for API base URL
console.log("API_BASE_URL:", API_BASE_URL);

// Test API connection on startup
fetch(`${API_BASE_URL}/isOk`)
  .then((response) => response.json())
  .then((data) => console.log("API Health Check:", data))
  .catch((error) => console.error("API Health Check Failed:", error));

class ApiService {
  private async getHeaders(
    includeAuth: boolean = false
  ): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (includeAuth) {
      const token = await AsyncStorage.getItem("auth_token");
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    return headers;
  }

  // Google Authentication Methods
  getGoogleAuthUrl(): string {
    return `${API_BASE_URL.replace("/api", "")}/oauth2/authorize/google`;
  }

  async handleGoogleAuthToken(token: string) {
    try {
      console.log("API: Processing Google auth token");

      // This method will validate the token received from Google OAuth flow
      // It returns user info just like a normal login would
      const response = await fetch(
        `${API_BASE_URL}/auth/google/validate-token`,
        {
          method: "POST",
          headers: await this.getHeaders(),
          body: JSON.stringify({ token }),
        }
      );

      console.log(
        "API: Google token validation response status:",
        response.status
      );

      const data = await response.json();
      console.log("API: Google token validation data:", data);

      if (!response.ok) {
        return {
          success: false,
          error:
            data.error ||
            data.message ||
            `Server returned ${response.status}: ${response.statusText}`,
        };
      }

      return data;
    } catch (error) {
      console.error(
        "API: Network error during Google auth token validation:",
        error
      );
      return {
        success: false,
        error: "Network error. Please check your connection and try again.",
      };
    }
  }

  // Regular Authentication Methods
  async login(email: string, password: string) {
    try {
      console.log("API: Attempting login for:", email);
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: await this.getHeaders(),
        body: JSON.stringify({ email, password }),
      });

      console.log("API: Login response status:", response.status);

      const data = await response.json();
      console.log("API: Login response data:", data);

      if (!response.ok) {
        // Return the actual error message from the server
        return {
          success: false,
          error:
            data.error ||
            data.message ||
            `Server returned ${response.status}: ${response.statusText}`,
        };
      }

      return data;
    } catch (error) {
      console.error("API: Network error during login:", error);
      return {
        success: false,
        error: "Network error. Please check your connection and try again.",
      };
    }
  }

  async verifyLoginCode(email: string, loginCode: string) {
    try {
      console.log(
        "API: Verifying login code for:",
        email,
        "with code:",
        loginCode
      );

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${API_BASE_URL}/auth/verify-login-code`, {
        method: "POST",
        headers: await this.getHeaders(),
        body: JSON.stringify({ email, loginCode }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log("API: Response status:", response.status);

      const data = await response.json();
      console.log("API: Response data:", data);

      if (!response.ok) {
        // Return the actual error message from the server
        return {
          success: false,
          error:
            data.error ||
            data.message ||
            `Server returned ${response.status}: ${response.statusText}`,
        };
      }

      return data;
    } catch (error: any) {
      console.error("API: Network error during verification:", error);

      if (error.name === "AbortError") {
        return {
          success: false,
          error:
            "Request timed out. Please check your connection and try again.",
        };
      }

      return {
        success: false,
        error: `Network error: ${
          error.message || "Please check your connection and try again."
        }`,
      };
    }
  }

  // Alias for deep link compatibility
  async verifyLogin(data: { email: string; loginCode: string }) {
    return this.verifyLoginCode(data.email, data.loginCode);
  }
  async register(data: any) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: await this.getHeaders(),
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error:
            responseData.error ||
            responseData.message ||
            `Server returned ${response.status}: ${response.statusText}`,
        };
      }

      return responseData;
    } catch (error) {
      console.error("API: Network error during registration:", error);
      return {
        success: false,
        error: "Network error. Please check your connection and try again.",
      };
    }
  }

  async getUserProfile() {
    const response = await fetch(`${API_BASE_URL}/user/profile`, {
      method: "GET",
      headers: await this.getHeaders(true),
    });

    return response.json();
  }

  async getAlertUserDetails(alertId: string) {
    try {
      console.log("API: Getting alert details for alertId:", alertId);
      const response = await fetch(`${API_BASE_URL}/responder/alert-details/${alertId}`, {
        method: "GET",
        headers: await this.getHeaders(true),
      });

      const data = await response.json();
      console.log("API: Alert details response:", data);

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || "Failed to fetch alert details",
        };
      }

      return { success: true, data: data };
    } catch (error) {
      console.error("API: Error fetching alert details:", error);
      return {
        success: false,
        error: "Network error. Please check your connection and try again.",
      };
    }
  }

  async updateProfile(data: any) {
    const response = await fetch(`${API_BASE_URL}/user/profile`, {
      method: "PUT",
      headers: await this.getHeaders(true),
      body: JSON.stringify(data),
    });

    return response.json();
  }

  async forgotPassword(email: string) {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: "POST",
      headers: await this.getHeaders(),
      body: JSON.stringify({ email }),
    });

    return response.json();
  }

  async resetPassword(token: string, newPassword: string) {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: "POST",
      headers: await this.getHeaders(),
      body: JSON.stringify({ token, newPassword }),
    });

    return response.json();
  }

  async healthCheck() {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      headers: await this.getHeaders(),
    });

    return response.json();
  }

  async getGoogleOAuthUrl() {
    const response = await fetch(`${API_BASE_URL}/auth/google/login`, {
      method: "GET",
      headers: await this.getHeaders(),
    });

    return response.json();
  }

  // Trusted Contacts API Methods
  async getTrustedContacts() {
    try {
      const response = await fetch(`${API_BASE_URL}/contacts`, {
        method: "GET",
        headers: await this.getHeaders(true),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || "Failed to fetch contacts",
        };
      }

      return { success: true, data: data };
    } catch (error) {
      console.error("API: Error fetching contacts:", error);
      return {
        success: false,
        error: "Network error. Please check your connection and try again.",
      };
    }
  }

  async addTrustedContact(contact: {
    name: string;
    phone: string;
    relationship: string;
    email?: string;
    shareLocation?: boolean;
  }) {
    try {
      const response = await fetch(`${API_BASE_URL}/contacts/add`, {
        method: "POST",
        headers: await this.getHeaders(true),
        body: JSON.stringify({ contact }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || "Failed to add contact",
        };
      }

      return { success: true, data: data };
    } catch (error) {
      console.error("API: Error adding contact:", error);
      return {
        success: false,
        error: "Network error. Please check your connection and try again.",
      };
    }
  }

  async updateTrustedContact(
    contactId: string,
    contact: {
      name: string;
      phone: string;
      relationship: string;
      email?: string;
      shareLocation?: boolean;
    }
  ) {
    try {
      const response = await fetch(`${API_BASE_URL}/contacts/update`, {
        method: "PUT",
        headers: await this.getHeaders(true),
        body: JSON.stringify({ contactId, contact }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || "Failed to update contact",
        };
      }

      return { success: true, data: data };
    } catch (error) {
      console.error("API: Error updating contact:", error);
      return {
        success: false,
        error: "Network error. Please check your connection and try again.",
      };
    }
  }

  async deleteTrustedContact(contactId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/contacts/delete`, {
        method: "DELETE",
        headers: await this.getHeaders(true),
        body: JSON.stringify({ contactId }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || "Failed to delete contact",
        };
      }

      return { success: true, data: data };
    } catch (error) {
      console.error("API: Error deleting contact:", error);
      return {
        success: false,
        error: "Network error. Please check your connection and try again.",
      };
    }
  }

  // Responder-specific contact methods
  async getAllUsersAndContacts() {
    try {
      const response = await fetch(`${API_BASE_URL}/responder/all-users-contacts`, {
        method: "GET",
        headers: await this.getHeaders(true),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || "Failed to fetch all users and contacts",
        };
      }

      return { success: true, data: data };
    } catch (error) {
      console.error("API: Error fetching all users and contacts:", error);
      return {
        success: false,
        error: "Network error. Please check your connection and try again.",
      };
    }
  }

  // Settings API Methods (including notification preferences and SOS keyword)
  async getSettings() {
    try {
      const response = await fetch(`${API_BASE_URL}/settings`, {
        method: "GET",
        headers: await this.getHeaders(true),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || "Failed to fetch settings",
        };
      }

      return { success: true, data: data };
    } catch (error) {
      console.error("API: Error fetching settings:", error);
      return {
        success: false,
        error: "Network error. Please check your connection and try again.",
      };
    }
  }

  async updateSettings(settings: {
    emailAlerts?: boolean;
    smsAlerts?: boolean;
    pushNotifications?: boolean;
    sosKeyword?: string;
  }) {
    try {
      const response = await fetch(`${API_BASE_URL}/settings`, {
        method: "PUT",
        headers: await this.getHeaders(true),
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || "Failed to update settings",
        };
      }

      return { success: true, data: data };
    } catch (error) {
      console.error("API: Error updating settings:", error);
      return {
        success: false,
        error: "Network error. Please check your connection and try again.",
      };
    }
  }

  // Notification Preferences API Methods (backward compatibility)
  async getNotificationPreferences() {
    try {
      const response = await fetch(`${API_BASE_URL}/settings`, {
        method: "GET",
        headers: await this.getHeaders(true),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error:
            data.error ||
            data.message ||
            "Failed to fetch notification preferences",
        };
      }

      // Return data in the format expected by existing code
      return {
        success: true,
        data: {
          emailAlerts: data.settings.emailAlerts,
          smsAlerts: data.settings.smsAlerts,
          pushNotifications: data.settings.pushNotifications,
        },
      };
    } catch (error) {
      console.error("API: Error fetching notification preferences:", error);
      return {
        success: false,
        error: "Network error. Please check your connection and try again.",
      };
    }
  }

  async updateNotificationPreferences(preferences: {
    emailAlerts: boolean;
    smsAlerts: boolean;
    pushNotifications: boolean;
  }) {
    try {
      const response = await fetch(`${API_BASE_URL}/settings/notifications`, {
        method: "PUT",
        headers: await this.getHeaders(true),
        body: JSON.stringify({ preferences }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error:
            data.error ||
            data.message ||
            "Failed to update notification preferences",
        };
      }

      return { success: true, data: data };
    } catch (error) {
      console.error("API: Error updating notification preferences:", error);
      return {
        success: false,
        error: "Network error. Please check your connection and try again.",
      };
    }
  }

  // SOS Keyword API Methods
  async getSosKeyword() {
    try {
      const response = await fetch(`${API_BASE_URL}/settings/sos-keyword`, {
        method: "GET",
        headers: await this.getHeaders(true),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || "Failed to fetch SOS keyword",
        };
      }

      return { success: true, data: data };
    } catch (error) {
      console.error("API: Error fetching SOS keyword:", error);
      return {
        success: false,
        error: "Network error. Please check your connection and try again.",
      };
    }
  }

  async updateSosKeyword(sosKeyword: string, password?: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/settings/sos-keyword`, {
        method: "PUT",
        headers: await this.getHeaders(true),
        body: JSON.stringify({ sosKeyword, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || "Failed to update SOS keyword",
        };
      }

      return { success: true, data: data };
    } catch (error) {
      console.error("API: Error updating SOS keyword:", error);
      return {
        success: false,
        error: "Network error. Please check your connection and try again.",
      };
    }
  }

  async deleteAccount(password: string, confirmationText: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/delete-account`, {
        method: "DELETE",
        headers: await this.getHeaders(true),
        body: JSON.stringify({ password, confirmationText }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || "Failed to delete account",
        };
      }

      return { success: true, data: data };
    } catch (error) {
      console.error("API: Error deleting account:", error);
      return {
        success: false,
        error: "Network error. Please check your connection and try again.",
      };
    }
  }

  // Report API Methods
  async submitReport(
    reportData: SubmitReportRequest
  ): Promise<GenericReportResponse> {
    try {
      console.log("API: Submitting report:", reportData);
      const response = await fetch(`${API_BASE_URL}/report/submit`, {
        method: "POST",
        headers: await this.getHeaders(true),
        body: JSON.stringify(reportData),
      });

      const data = await response.json();
      console.log("API: Submit report response:", data);

      return data;
    } catch (error) {
      console.error("API: Submit report error:", error);
      return {
        success: false,
        error: "Network error occurred while submitting report",
      };
    }
  }

  async getUserReports(): Promise<UserReportsResponse> {
    try {
      console.log("API: Fetching user reports");
      const response = await fetch(`${API_BASE_URL}/report/user-reports`, {
        method: "GET",
        headers: await this.getHeaders(true),
      });

      const data = await response.json();
      console.log("API: User reports response:", data);

      return data;
    } catch (error) {
      console.error("API: Get user reports error:", error);
      return {
        success: false,
        error: "Network error occurred while fetching reports",
      };
    }
  }

  async getUserReportsByTime(
    start: string,
    end: string
  ): Promise<UserReportsResponse> {
    try {
      console.log("API: Fetching user reports");
      const url = new URL(`${API_BASE_URL}/report/user-reports/time`);
      url.searchParams.append("start", start);
      url.searchParams.append("end", end);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: await this.getHeaders(true),
      });

      const data = await response.json();
      console.log("API: User reports response:", data);

      return data;
    } catch (error) {
      console.error("API: Get user reports error:", error);
      return {
        success: false,
        error: "Network error occurred while fetching reports",
      };
    }
  }
  
  async getReportDetails(reportId: string): Promise<ReportDetailsResponse> {
    try {
      console.log("API: Fetching report details for:", reportId);
      const response = await fetch(
        `${API_BASE_URL}/report/details?reportId=${reportId}`,
        {
          method: "GET",
          headers: await this.getHeaders(true),
        }
      );

      const data = await response.json();
      console.log("API: Report details response:", data);

      return data;
    } catch (error) {
      console.error("API: Get report details error:", error);
      return {
        success: false,
        error: "Network error occurred while fetching report details",
      };
    }
  }

  async uploadEvidence(
    evidenceData: UploadEvidenceRequest
  ): Promise<GenericReportResponse> {
    try {
      console.log("API: Uploading evidence for report:", evidenceData.reportId);
      const response = await fetch(`${API_BASE_URL}/report/upload-evidence`, {
        method: "POST",
        headers: await this.getHeaders(true),
        body: JSON.stringify(evidenceData),
      });

      const data = await response.json();
      console.log("API: Upload evidence response:", data);

      return data;
    } catch (error) {
      console.error("API: Upload evidence error:", error);
      return {
        success: false,
        error: "Network error occurred while uploading evidence",
      };
    }
  }

  async deleteEvidence(
    reportId: string,
    evidenceUrl: string
  ): Promise<GenericReportResponse> {
    try {
      console.log(
        "API: Deleting evidence from report:",
        reportId,
        "URL:",
        evidenceUrl
      );
      const response = await fetch(`${API_BASE_URL}/report/delete-evidence`, {
        method: "POST",
        headers: await this.getHeaders(true),
        body: JSON.stringify({
          reportId,
          evidenceUrl,
        }),
      });

      const data = await response.json();
      console.log("API: Delete evidence response:", data);

      return data;
    } catch (error) {
      console.error("API: Delete evidence error:", error);
      return {
        success: false,
        error: "Network error occurred while deleting evidence",
      };
    }
  }

  async updateReport(
    updateData: UpdateReportRequest
  ): Promise<GenericReportResponse> {
    try {
      console.log("API: Updating report:", updateData.reportId);
      const response = await fetch(`${API_BASE_URL}/report/update`, {
        method: "PUT",
        headers: await this.getHeaders(true),
        body: JSON.stringify(updateData),
      });

      const data = await response.json();
      console.log("API: Update report response:", data);

      return data;
    } catch (error) {
      console.error("API: Update report error:", error);
      return {
        success: false,
        error: "Network error occurred while updating report",
      };
    }
  }

  async getPublicReports(): Promise<UserReportsResponse> {
    try {
      console.log("API: Fetching public reports");
      const response = await fetch(`${API_BASE_URL}/report/public-reports`, {
        method: "GET",
        headers: await this.getHeaders(true),
      });

      const data = await response.json();
      console.log("API: Public reports response:", data);

      return data;
    } catch (error) {
      console.error("API: Get public reports error:", error);
      return {
        success: false,
        error: "Network error occurred while fetching public reports",
      };
    }
  }

  /**
   * Get all active alerts for responders (all users' active alerts)
   */
  async getAllActiveAlerts() {
    try {
      console.log("API: Getting all active alerts (responder)");
      const response = await fetch(`${API_BASE_URL}/sos/active-alerts`, {
        method: "GET",
        headers: await this.getHeaders(true),
      });

      console.log("API: All active alerts response status:", response.status);
      const data = await response.json();

      return data;
    } catch (error) {
      console.error("API: Get all active alerts error:", error);
      return {
        success: false,
        error: "Network error occurred while getting all active alerts",
      };
    }
  }

  async searchReports(
    query: string,
    page = 0,
    size = 50
  ): Promise<UserReportsResponse> {
    try {
      console.log("API: Searching reports with query:", query);
      const params = new URLSearchParams({
        query,
        page: page.toString(),
        size: size.toString(),
        sortBy: "createdAt",
        sortDir: "desc",
      });

      const response = await fetch(`${API_BASE_URL}/report/search?${params}`, {
        method: "GET",
        headers: await this.getHeaders(true),
      });

      const data = await response.json();
      console.log("API: Search reports response:", data);

      return data;
    } catch (error) {
      console.error("API: Search reports error:", error);
      return {
        success: false,
        error: "Network error occurred while searching reports",
      };
    }
  }

  async filterReports(filters: {
    incidentType?: string;
    visibility?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<UserReportsResponse> {
    try {
      console.log("API: Filtering reports with filters:", filters);
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value);
        }
      });

      const response = await fetch(`${API_BASE_URL}/report/filter?${params}`, {
        method: "GET",
        headers: await this.getHeaders(true),
      });

      const data = await response.json();
      console.log("API: Filter reports response:", data);

      return data;
    } catch (error) {
      console.error("API: Filter reports error:", error);
      return {
        success: false,
        error: "Network error occurred while filtering reports",
      };
    }
  }

  async getReportCategories(): Promise<{
    success: boolean;
    categories?: string[];
    error?: string;
  }> {
    try {
      console.log("API: Fetching report categories");
      const response = await fetch(`${API_BASE_URL}/report/categories`, {
        method: "GET",
        headers: await this.getHeaders(true),
      });

      const data = await response.json();
      console.log("API: Report categories response:", data);

      return data;
    } catch (error) {
      console.error("API: Get report categories error:", error);
      return {
        success: false,
        error: "Network error occurred while fetching categories",
      };
    }
  }

  async getReportStats(): Promise<{
    success: boolean;
    stats?: any;
    error?: string;
  }> {
    try {
      console.log("API: Fetching report statistics");
      const response = await fetch(`${API_BASE_URL}/report/stats`, {
        method: "GET",
        headers: await this.getHeaders(true),
      });

      const data = await response.json();
      console.log("API: Report stats response:", data);

      return data;
    } catch (error) {
      console.error("API: Get report stats error:", error);
      return {
        success: false,
        error: "Network error occurred while fetching statistics",
      };
    }
  }

  async deleteReport(reportId: string): Promise<GenericReportResponse> {
    try {
      console.log("API: Deleting report:", reportId);

      // Check if we have auth token
      const token = await AsyncStorage.getItem("auth_token");
      if (!token) {
        console.error("API: No auth token found");
        return {
          success: false,
          error: "Authentication required. Please log in again.",
        };
      }

      const headers = await this.getHeaders(true);
      console.log("API: Request headers:", headers);

      const url = `${API_BASE_URL}/report/delete?reportId=${reportId}`;
      console.log("API: Delete URL:", url);

      const response = await fetch(url, {
        method: "DELETE",
        headers: headers,
      });

      console.log("API: Delete report response status:", response.status);
      console.log("API: Delete report response ok:", response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API: Delete report error response:", errorText);

        if (response.status === 401) {
          return {
            success: false,
            error: "Authentication failed. Please log in again.",
          };
        } else if (response.status === 403) {
          return {
            success: false,
            error: "You don't have permission to delete this report.",
          };
        } else if (response.status === 404) {
          return {
            success: false,
            error: "Report not found.",
          };
        }

        try {
          const errorData = JSON.parse(errorText);
          return {
            success: false,
            error:
              errorData.error ||
              errorData.message ||
              `Server error: ${response.status}`,
          };
        } catch {
          return {
            success: false,
            error: `Server error: ${response.status} - ${errorText}`,
          };
        }
      }

      const data = await response.json();
      console.log("API: Delete report response data:", data);

      return data;
    } catch (error) {
      console.error("API: Delete report error:", error);
      return {
        success: false,
        error: "Network error occurred while deleting report",
      };
    }
  }

  // SOS Alert Methods
  async submitSOSVoiceCommand(
    audioUrl: string,
    location: { latitude: number; longitude: number; address: string }
  ) {
    try {
      console.log("API: Submitting SOS voice command");
      const response = await fetch(`${API_BASE_URL}/sos/voice-command`, {
        method: "POST",
        headers: await this.getHeaders(true),
        body: JSON.stringify({
          audioUrl,
          location,
        }),
      });

      console.log("API: SOS voice command response status:", response.status);
      const data = await response.json();

      return data;
    } catch (error) {
      console.error("API: SOS voice command error:", error);
      return {
        success: false,
        error: "Network error occurred while submitting SOS voice command",
      };
    }
  }

  async submitSOSTextCommand(
    message: string,
    keyword: string,
    location: { latitude: number; longitude: number; address: string }
  ) {
    try {
      console.log("API: Submitting SOS text command");
      const response = await fetch(`${API_BASE_URL}/sos/text-command`, {
        method: "POST",
        headers: await this.getHeaders(true),
        body: JSON.stringify({
          message,
          keyword,
          location,
        }),
      });

      console.log("API: SOS text command response status:", response.status);
      const data = await response.json();

      return data;
    } catch (error) {
      console.error("API: SOS text command error:", error);
      return {
        success: false,
        error: "Network error occurred while submitting SOS text command",
      };
    }
  }

  async getUserAlerts() {
    try {
      console.log("API: Getting user alerts");
      const response = await fetch(`${API_BASE_URL}/sos/alerts`, {
        method: "GET",
        headers: await this.getHeaders(true),
      });

      console.log("API: User alerts response status:", response.status);
      const data = await response.json();

      return data;
    } catch (error) {
      console.error("API: Get user alerts error:", error);
      return {
        success: false,
        error: "Network error occurred while getting user alerts",
      };
    }
  }

  async getActiveAlerts() {
    try {
      console.log("API: Getting active alerts (responder)");
      const response = await fetch(`${API_BASE_URL}/sos/active-alerts`, {
        method: "GET",
        headers: await this.getHeaders(true),
      });

      console.log("API: Active alerts response status:", response.status);
      const data = await response.json();

      return data;
    } catch (error) {
      console.error("API: Get active alerts error:", error);
      return {
        success: false,
        error: "Network error occurred while getting active alerts",
      };
    }
  }

  /**
   * Get pending alerts for responder (alerts not yet accepted)
   */
  async getPendingAlerts() {
    try {
      console.log("API: Getting pending alerts (responder)");
      const response = await fetch(`${API_BASE_URL}/responder/pending-alerts`, {
        method: "GET",
        headers: await this.getHeaders(true),
      });

      console.log("API: Pending alerts response status:", response.status);
      const data = await response.json();

      return data;
    } catch (error) {
      console.error("API: Get pending alerts error:", error);
      return {
        success: false,
        error: "Network error occurred while getting pending alerts",
      };
    }
  }

  /**
   * Get accepted alerts for responder (alerts already accepted)
   */
  async getAcceptedAlerts() {
    try {
      console.log("API: Getting accepted alerts (responder)");
      const response = await fetch(`${API_BASE_URL}/responder/accepted-alerts`, {
        method: "GET",
        headers: await this.getHeaders(true),
      });

      console.log("API: Accepted alerts response status:", response.status);
      const data = await response.json();

      return data;
    } catch (error) {
      console.error("API: Get accepted alerts error:", error);
      return {
        success: false,
        error: "Network error occurred while getting accepted alerts",
      };
    }
  }

  async cancelAlert(alertId: string) {
    try {
      console.log("API: Canceling alert:", alertId);
      const response = await fetch(`${API_BASE_URL}/sos/cancel`, {
        method: "POST",
        headers: await this.getHeaders(true),
        body: JSON.stringify({
          alertId,
        }),
      });

      console.log("API: Cancel alert response status:", response.status);
      const data = await response.json();

      return data;
    } catch (error) {
      console.error("API: Cancel alert error:", error);
      return {
        success: false,
        error: "Network error occurred while canceling alert",
      };
    }
  }

  // New TTL Notification System API Methods

  /**
   * Get all notifications for the authenticated user
   */
  async getNotifications(page?: number, size?: number) {
    try {
      let url = `${API_BASE_URL}/notifications`;
      if (page !== undefined && size !== undefined) {
        url += `?page=${page}&size=${size}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: await this.getHeaders(true),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || "Failed to fetch notifications",
        };
      }

      return { success: true, data: data };
    } catch (error) {
      console.error("API: Error fetching notifications:", error);
      return {
        success: false,
        error: "Network error. Please check your connection and try again.",
      };
    }
  }

  /**
   * Get unread notifications for the authenticated user
   */
  async getUnreadNotifications() {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/unread`, {
        method: "GET",
        headers: await this.getHeaders(true),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error:
            data.error ||
            data.message ||
            "Failed to fetch unread notifications",
        };
      }

      return { success: true, data: data };
    } catch (error) {
      console.error("API: Error fetching unread notifications:", error);
      return {
        success: false,
        error: "Network error. Please check your connection and try again.",
      };
    }
  }

  /**
   * Get notification count for the authenticated user
   */
  async getNotificationCount() {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/count`, {
        method: "GET",
        headers: await this.getHeaders(true),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error:
            data.error || data.message || "Failed to fetch notification count",
        };
      }

      return { success: true, data: data };
    } catch (error) {
      console.error("API: Error fetching notification count:", error);
      return {
        success: false,
        error: "Network error. Please check your connection and try again.",
      };
    }
  }

  /**
   * Mark a notification as read
   */
  async markNotificationAsRead(notificationId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/mark-read`, {
        method: "POST",
        headers: await this.getHeaders(true),
        body: JSON.stringify({ notificationId }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error:
            data.error || data.message || "Failed to mark notification as read",
        };
      }

      return { success: true, data: data };
    } catch (error) {
      console.error("API: Error marking notification as read:", error);
      return {
        success: false,
        error: "Network error. Please check your connection and try again.",
      };
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsAsRead() {
    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/mark-all-read`,
        {
          method: "POST",
          headers: await this.getHeaders(true),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error:
            data.error ||
            data.message ||
            "Failed to mark all notifications as read",
        };
      }

      return { success: true, data: data };
    } catch (error) {
      console.error("API: Error marking all notifications as read:", error);
      return {
        success: false,
        error: "Network error. Please check your connection and try again.",
      };
    }
  }

  /**
   * Accept emergency response (for responders)
   */
  async acceptEmergencyResponse(requestData: {
    alertId: string;
    alertUserId: string;
    responderName: string;
    notificationId?: string;
  }) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/accept-emergency`,
        {
          method: "POST",
          headers: await this.getHeaders(true),
          body: JSON.stringify(requestData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error:
            data.error || data.message || "Failed to accept emergency response",
        };
      }

      return { success: true, data: data };
    } catch (error) {
      console.error("API: Error accepting emergency response:", error);
      return {
        success: false,
        error: "Network error. Please check your connection and try again.",
      };
    }
  }

  /**
   * Get all notifications for a specific alert (both in-app and email)
   */
  async getNotificationsForAlert(alertId: string) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/alert/${alertId}`,
        {
          method: "GET",
          headers: await this.getHeaders(true),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error:
            data.error ||
            data.message ||
            "Failed to fetch notifications for alert",
        };
      }

      return { success: true, data: data };
    } catch (error) {
      console.error("API: Error fetching notifications for alert:", error);
      return {
        success: false,
        error: "Network error. Please check your connection and try again.",
      };
    }
  }

  /**
   * Create a notification (admin/system use)
   */
  async createNotification(requestData: {
    type: string;
    title: string;
    message: string;
    recipientId: string;
    alertId?: string;
    emergencyLocation?: {
      latitude: number;
      longitude: number;
    };
  }) {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/create`, {
        method: "POST",
        headers: await this.getHeaders(true),
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || "Failed to create notification",
        };
      }

      return { success: true, data: data };
    } catch (error) {
      console.error("API: Error creating notification:", error);
      return {
        success: false,
        error: "Network error. Please check your connection and try again.",
      };
    }
  }

  /**
   * Accept an alert (for responders)
   */
  async acceptAlert(alertId: string) {
    try {
      console.log("API: Accepting alert:", alertId);
      const response = await fetch(`${API_BASE_URL}/responder/accept-alert`, {
        method: "PUT",
        headers: await this.getHeaders(true),
        body: JSON.stringify({
          alertId,
        }),
      });

      console.log("API: Accept alert response status:", response.status);
      const data = await response.json();

      return data;
    } catch (error) {
      console.error("API: Accept alert error:", error);
      return {
        success: false,
        error: "Network error occurred while accepting alert",
      };
    }
  }

  /**
   * Reject an alert (for responders)
   */
  async rejectAlert(alertId: string) {
    try {
      console.log("API: Rejecting alert:", alertId);
      const response = await fetch(`${API_BASE_URL}/responder/reject-alert`, {
        method: "PUT",
        headers: await this.getHeaders(true),
        body: JSON.stringify({
          alertId,
        }),
      });

      console.log("API: Reject alert response status:", response.status);
      const data = await response.json();

      return data;
    } catch (error) {
      console.error("API: Reject alert error:", error);
      return {
        success: false,
        error: "Network error occurred while rejecting alert",
      };
    }
  }

  /**
   * Forward an alert to another responder (for responders)
   */
  async forwardAlert(alertId: string, badgeNumber: string) {
    try {
      console.log("API: Forwarding alert:", alertId, "to badge:", badgeNumber);
      const response = await fetch(`${API_BASE_URL}/responder/forward-alert`, {
        method: "PUT",
        headers: await this.getHeaders(true),
        body: JSON.stringify({
          alertId,
          badgeNumber,
        }),
      });

      console.log("API: Forward alert response status:", response.status);
      const data = await response.json();

      return data;
    } catch (error) {
      console.error("API: Forward alert error:", error);
      return {
        success: false,
        error: "Network error occurred while forwarding alert",
      };
    }
  }

  /**
   * Update alert status (for responders)
   */
  async updateAlertStatus(alertId: string, status: string) {
    try {
      console.log("API: Updating alert status:", alertId, "to status:", status);
      const response = await fetch(`${API_BASE_URL}/responder/update-alert-status`, {
        method: "PUT",
        headers: await this.getHeaders(true),
        body: JSON.stringify({
          alertId,
          status,
        }),
      });

      console.log("API: Update alert status response status:", response.status);
      const data = await response.json();

      return data;
    } catch (error) {
      console.error("API: Update alert status error:", error);
      return {
        success: false,
        error: "Network error occurred while updating alert status",
      };
    }
  }
}

export default new ApiService();
