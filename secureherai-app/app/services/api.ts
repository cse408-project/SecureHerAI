import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:8080/api";

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
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: await this.getHeaders(),
      body: JSON.stringify({ email, password }),
    });

    return response.json();
  }

  async verifyLoginCode(email: string, loginCode: string) {
    const response = await fetch(`${API_BASE_URL}/auth/verify-login-code`, {
      method: "POST",
      headers: await this.getHeaders(),
      body: JSON.stringify({ email, loginCode }),
    });

    return response.json();
  }

  // Alias for deep link compatibility
  async verifyLogin(data: { email: string; loginCode: string }) {
    return this.verifyLoginCode(data.email, data.loginCode);
  }

  async register(data: any) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: await this.getHeaders(),
      body: JSON.stringify(data),
    });

    return response.json();
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
