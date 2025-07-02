import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  AuthContextType,
  User,
  AuthResponse,
  RegisterRequest,
} from "../types/auth";
import ApiService from "../services/api";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

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
        // Save token
        await AsyncStorage.setItem("auth_token", token);
        setToken(token);

        // Get user info from token (JWT decode)
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

        // Using a safer method that works in web and native without external dependencies
        // This is a simple JWT decode that should work in all environments
        // In a production app, consider using a proper JWT library
        const jsonPayload = JSON.parse(
          decodeURIComponent(
            atob(base64)
              .split("")
              .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join("")
          )
        );
        const decodedToken = JSON.parse(jsonPayload);

        // Create user object from token
        const userData: User = {
          userId: decodedToken.sub,
          fullName: decodedToken.fullName || "Google User",
          email: decodedToken.email,
          role: decodedToken.role || "USER",
        };

        setUser(userData);
        await AsyncStorage.setItem("user_data", JSON.stringify(userData));

        // Check if profile needs completion (based on profileComplete from token)
        const needsProfileCompletion = decodedToken.profileComplete === false;

        // Return success response
        return {
          success: true,
          token: token,
          userId: userData.userId,
          fullName: userData.fullName,
          role: userData.role,
          needsProfileCompletion: needsProfileCompletion,
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

  // Expose a method to directly set a token (used for deep links)
  const setTokenAndUpdateUser = async (newToken: string): Promise<void> => {
    try {
      // Save token
      await AsyncStorage.setItem("auth_token", newToken);
      setToken(newToken);

      // Parse token to get user info
      try {
        // Split the token to get the payload part
        const parts = newToken.split(".");
        if (parts.length !== 3) {
          throw new Error("Invalid token format");
        }

        // Decode the base64-encoded payload
        const payload = parts[1];
        // Need to pad the base64 string to make it a valid length
        const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");

        // For browser environments
        if (typeof atob === "function") {
          const jsonString = atob(base64);
          const decodedToken = JSON.parse(jsonString);

          // Create user object from token
          const userData: User = {
            userId: decodedToken.sub,
            fullName: decodedToken.fullName || "User",
            email: decodedToken.email,
            role: decodedToken.role || "USER",
          };

          setUser(userData);
          await AsyncStorage.setItem("user_data", JSON.stringify(userData));
        }
        // For React Native environments
        else {
          // Fetch user profile using the token
          const profileResponse = await ApiService.getUserProfile();
          if (profileResponse.success && profileResponse.data) {
            setUser(profileResponse.data);
            await AsyncStorage.setItem(
              "user_data",
              JSON.stringify(profileResponse.data)
            );
          }
        }
      } catch (error) {
        console.error("Error decoding token:", error);

        // Fetch user profile as fallback
        try {
          const profileResponse = await ApiService.getUserProfile();
          if (profileResponse.success && profileResponse.data) {
            setUser(profileResponse.data);
            await AsyncStorage.setItem(
              "user_data",
              JSON.stringify(profileResponse.data)
            );
          }
        } catch (profileError) {
          console.error("Failed to fetch user profile:", profileError);
        }
      }
    } catch (error) {
      console.error("Failed to set token:", error);
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
  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    verifyLoginCode,
    register,
    logout,
    handleGoogleLogin,
    forgotPassword,
    resetPassword,
    setToken: setTokenAndUpdateUser, // Expose the new method
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
