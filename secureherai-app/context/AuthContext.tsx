import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { router } from "expo-router";

import {
  AuthContextType,
  User,
  AuthResponse,
  RegisterRequest,
} from "../types/auth";
import ApiService from "../services/api";

// Register the URL handler for the OAuth flow
// This ensures the app can handle the callback from OAuth
WebBrowser.maybeCompleteAuthSession();

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Handle OAuth redirect URLs
  const handleOAuthRedirect = useCallback(async (event: { url: string }) => {
    try {
      const url = event.url;
      console.log("Deep link detected:", url);

      // Parse the URL to extract token and other params
      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.search);
      const token = params.get("token");
      const error = params.get("error");

      if (error) {
        console.error("OAuth error:", error);
        return;
      }

      if (token) {
        console.log("Got OAuth token, processing...");
        const response = await handleGoogleLogin(token);
        if (response.success) {
          router.replace("/(tabs)");
        }
      }
    } catch (e) {
      console.error("Error handling OAuth redirect:", e);
    }
  }, []);

  useEffect(() => {
    checkAuthState();

    // Set up URL listener for deep linking (OAuth redirects)
    const subscription = Linking.addEventListener("url", handleOAuthRedirect);

    return () => {
      subscription.remove();
    };
  }, [handleOAuthRedirect]);

  useEffect(() => {
    // Log auth state changes for debugging
    console.log("AuthContext - Auth state changed:", {
      isAuthenticated: !!token && !!user,
      user,
      token,
    });
  }, [user, token]);

  const checkAuthState = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("auth_token");
      const storedUser = await AsyncStorage.getItem("user_data");

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));

        // Optionally refresh user profile
        try {
          const profileResponse = await ApiService.getUserProfile();
          if (profileResponse.success && profileResponse.data) {
            setUser(profileResponse.data);
            await AsyncStorage.setItem(
              "user_data",
              JSON.stringify(profileResponse.data)
            );
          }
        } catch (error) {
          console.error("Failed to refresh user profile:", error);
        }
      } else {
        setToken(null);
        setUser(null);
        console.log(
          "No auth token or user data found, setting state to unauthenticated."
        );
      }
    } catch (error) {
      console.error("Failed to check auth state:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (
    email: string,
    password: string
  ): Promise<AuthResponse> => {
    try {
      const response = await ApiService.login(email, password);
      return response;
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: "Network error. Please try again.",
      };
    }
  };

  const verifyLoginCode = async (
    email: string,
    code: string
  ): Promise<AuthResponse> => {
    try {
      const response = await ApiService.verifyLoginCode(email, code);

      if (response.success && response.token) {
        console.log("AuthContext - Setting token and user data...");
        await AsyncStorage.setItem("auth_token", response.token);
        setToken(response.token);

        // Create user object from response
        const userData: User = {
          userId: response.userId,
          fullName: response.fullName,
          email: email,
          role: response.role,
        };

        console.log("AuthContext - User data:", userData);
        setUser(userData);
        await AsyncStorage.setItem("user_data", JSON.stringify(userData));
        console.log("AuthContext - Auth state should now be true");
      }

      return response;
    } catch (error) {
      console.error("Verify login code error:", error);
      return {
        success: false,
        error: "Network error. Please try again.",
      };
    }
  };

  const register = async (data: RegisterRequest): Promise<AuthResponse> => {
    try {
      const response = await ApiService.register(data);
      return response;
    } catch (error) {
      console.error("Registration error:", error);
      return {
        success: false,
        error: "Network error. Please try again.",
      };
    }
  };

  // Method to handle Google OAuth authentication
  const handleGoogleLogin = async (token: string): Promise<AuthResponse> => {
    try {
      if (token) {
        // Validate the token with the backend
        const response = await ApiService.handleGoogleAuthToken(token);

        if (!response.success) {
          return response;
        }

        // Save token
        await AsyncStorage.setItem("auth_token", token);
        setToken(token);

        // Create user object from the response
        const userData: User = {
          userId: response.userId,
          fullName: response.fullName || "Google User",
          email: response.email,
          role: response.role || "USER",
        };

        setUser(userData);
        await AsyncStorage.setItem("user_data", JSON.stringify(userData));

        // Return success response
        return {
          success: true,
          token: token,
          userId: userData.userId,
          fullName: userData.fullName,
          role: userData.role,
          needsProfileCompletion: response.needsProfileCompletion,
        };
      }

      return {
        success: false,
        error: "Invalid token received from Google authentication.",
      };
    } catch (error) {
      console.error("Google login error:", error);
      return {
        success: false,
        error: "Failed to process Google login.",
      };
    }
  };

  // Method to initiate Google login
  const initiateGoogleLogin = async (): Promise<void> => {
    try {
      // Get Google auth URL from API service
      const authUrl = ApiService.getGoogleAuthUrl();

      // Open the auth URL in the browser
      await Linking.openURL(authUrl);
    } catch (error) {
      console.error("Error initiating Google login:", error);
      throw new Error("Failed to start Google authentication");
    }
  };

  const forgotPassword = async (email: string): Promise<AuthResponse> => {
    try {
      const response = await ApiService.forgotPassword(email);
      return response;
    } catch (error) {
      console.error("Forgot password error:", error);
      return {
        success: false,
        error: "Network error. Please try again.",
      };
    }
  };

  const resetPassword = async (
    token: string,
    newPassword: string
  ): Promise<AuthResponse> => {
    try {
      const response = await ApiService.resetPassword(token, newPassword);
      return response;
    } catch (error) {
      console.error("Reset password error:", error);
      return {
        success: false,
        error: "Network error. Please try again.",
      };
    }
  };
  const logout = async () => {
    console.log("AuthContext - Logging out...");
    // Clear state immediately for instant UI feedback
    setToken(null);
    setUser(null);

    try {
      // Then clear storage
      await AsyncStorage.removeItem("auth_token");
      await AsyncStorage.removeItem("user_data");
      console.log("AuthContext - Successfully cleared storage");
    } catch (error) {
      console.error("Logout error:", error);
      // State is already cleared above, so this is just cleanup
    }
    console.log("AuthContext - Logout process completed");
  };
  // Expose a method to directly set a token (used for deep links)
  const setTokenAndUpdateUser = async (newToken: string): Promise<void> => {
    try {
      await AsyncStorage.setItem("auth_token", newToken);
      setToken(newToken);

      // Optionally get user profile with new token
      try {
        const profileResponse = await ApiService.getUserProfile();
        if (profileResponse.success && profileResponse.data) {
          setUser(profileResponse.data);
          await AsyncStorage.setItem(
            "user_data",
            JSON.stringify(profileResponse.data)
          );
        }
      } catch (error) {
        console.error("Failed to get user profile after token update:", error);
      }
    } catch (error) {
      console.error("Failed to set token:", error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    verifyLoginCode,
    register,
    logout,
    handleGoogleLogin,
    initiateGoogleLogin, // Add this to expose the method for direct Google login
    forgotPassword,
    resetPassword,
    setToken: setTokenAndUpdateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthProvider;
