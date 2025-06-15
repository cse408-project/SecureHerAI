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
        await AsyncStorage.setItem("auth_token", response.token);
        setToken(response.token);

        // Create user object from response
        const userData: User = {
          userId: response.userId,
          fullName: response.fullName,
          email: email,
          role: response.role,
        };

        setUser(userData);
        await AsyncStorage.setItem("user_data", JSON.stringify(userData));
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

  const logout = async () => {
    // Clear state immediately for instant UI feedback
    setToken(null);
    setUser(null);

    try {
      // Then clear storage
      await AsyncStorage.removeItem("auth_token");
      await AsyncStorage.removeItem("user_data");
    } catch (error) {
      console.error("Logout error:", error);
      // State is already cleared above, so this is just cleanup
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
    isAuthenticated: !!token && !!user,
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
