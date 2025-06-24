import AsyncStorage from "@react-native-async-storage/async-storage";

// Ensure API base URL works in both web and native environments
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://192.168.0.103:8080/api";

// Debug log for API base URL
console.log("API_BASE_URL:", API_BASE_URL);

// Test API connection on startup
fetch(`${API_BASE_URL}/health`)
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

  async completeProfile(data: any) {
    const response = await fetch(`${API_BASE_URL}/user/complete-profile`, {
      method: "POST",
      headers: await this.getHeaders(true),
      body: JSON.stringify(data),
    });

    return response.json();
  }
}

export default new ApiService();
