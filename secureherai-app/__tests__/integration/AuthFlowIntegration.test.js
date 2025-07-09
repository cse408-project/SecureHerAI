/**
 * Integration test for Authentication Flow
 * Tests the complete auth flow without UI rendering
 * 
 * This test verifies that:
 * 1. Login form submission works correctly
 * 2. OTP verification process functions
 * 3. Token storage and user data persistence
 * 4. Navigation between auth screens
 * 5. Error handling throughout the flow
 */

// Mock the authentication flow service
class AuthFlowMock {
  constructor(apiService, router, storage, alertService) {
    this.apiService = apiService;
    this.router = router;
    this.storage = storage;
    this.alertService = alertService;
    this.currentUser = null;
    this.authToken = null;
  }

  async login(email, password) {
    try {
      // Validate inputs
      if (!this.validateEmail(email)) {
        throw new Error('Invalid email format');
      }
      
      if (!password || password.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }

      // Call login API
      const result = await this.apiService.login({ email, password });
      
      if (result.success) {
        // Store email for OTP verification
        await this.storage.setItem('pending_email', email);
        
        // Navigate to OTP verification
        this.router.push('/(auth)/verification');
        
        return {
          success: true,
          message: 'Login code sent to your email',
          requiresOTP: true
        };
      } else {
        throw new Error(result.message || 'Login failed');
      }
    } catch (error) {
      this.alertService.showError('Login Failed', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async verifyOTP(code) {
    try {
      // Validate OTP format
      if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
        throw new Error('Invalid OTP format');
      }

      const email = await this.storage.getItem('pending_email');
      if (!email) {
        throw new Error('No pending verification found');
      }

      // Call OTP verification API
      const result = await this.apiService.verifyLoginCode({ email, code });
      
      if (result.success) {
        // Store auth token and user data
        this.authToken = result.token;
        this.currentUser = result.user;
        
        await this.storage.setItem('auth_token', result.token);
        await this.storage.setItem('user_data', JSON.stringify(result.user));
        await this.storage.removeItem('pending_email');
        
        // Navigate to main app
        this.router.replace('/(tabs)/home');
        
        return {
          success: true,
          user: result.user,
          token: result.token
        };
      } else {
        throw new Error(result.message || 'Invalid verification code');
      }
    } catch (error) {
      this.alertService.showError('Verification Failed', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async googleLogin() {
    try {
      const result = await this.apiService.initiateGoogleLogin();
      
      if (result.success) {
        // Store auth data
        this.authToken = result.token;
        this.currentUser = result.user;
        
        await this.storage.setItem('auth_token', result.token);
        await this.storage.setItem('user_data', JSON.stringify(result.user));
        
        // Navigate to main app
        this.router.replace('/(tabs)/home');
        
        return {
          success: true,
          user: result.user,
          token: result.token
        };
      } else {
        throw new Error(result.message || 'Google login failed');
      }
    } catch (error) {
      this.alertService.showError('Google Login Failed', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async logout() {
    try {
      // Call logout API if token exists
      if (this.authToken) {
        await this.apiService.logout();
      }
      
      // Clear local storage
      await this.storage.removeItem('auth_token');
      await this.storage.removeItem('user_data');
      await this.storage.removeItem('pending_email');
      
      // Reset state
      this.authToken = null;
      this.currentUser = null;
      
      // Navigate to login
      this.router.replace('/(auth)/login');
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async checkAuthStatus() {
    try {
      const token = await this.storage.getItem('auth_token');
      const userData = await this.storage.getItem('user_data');
      
      if (token && userData) {
        // Verify token with API
        const result = await this.apiService.verifyToken(token);
        
        if (result.valid) {
          this.authToken = token;
          this.currentUser = JSON.parse(userData);
          return {
            isAuthenticated: true,
            user: this.currentUser
          };
        } else {
          // Token expired, clear storage
          await this.logout();
          return { isAuthenticated: false };
        }
      }
      
      return { isAuthenticated: false };
    } catch (error) {
      return {
        isAuthenticated: false,
        error: error.message
      };
    }
  }

  validateEmail(email) {
    return /\S+@\S+\.\S+/.test(email);
  }
}

describe('Authentication Flow Integration Tests', () => {
  let mockApiService;
  let mockRouter;
  let mockStorage;
  let mockAlertService;
  let authFlow;

  beforeEach(() => {
    // Mock API service
    mockApiService = {
      login: jest.fn(),
      verifyLoginCode: jest.fn(),
      initiateGoogleLogin: jest.fn(),
      logout: jest.fn(),
      verifyToken: jest.fn()
    };

    // Mock router
    mockRouter = {
      push: jest.fn(),
      replace: jest.fn()
    };

    // Mock storage
    mockStorage = {
      setItem: jest.fn(),
      getItem: jest.fn(),
      removeItem: jest.fn()
    };

    // Mock alert service
    mockAlertService = {
      showError: jest.fn(),
      showSuccess: jest.fn()
    };

    // Create auth flow instance
    authFlow = new AuthFlowMock(
      mockApiService,
      mockRouter,
      mockStorage,
      mockAlertService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: Complete successful login flow
  test('completes full login flow with email and OTP', async () => {
    // Setup mocks for successful login
    mockApiService.login.mockResolvedValueOnce({
      success: true,
      message: 'Login code sent'
    });

    mockApiService.verifyLoginCode.mockResolvedValueOnce({
      success: true,
      token: 'jwt-token-123',
      user: { id: '1', name: 'John Doe', email: 'john@example.com' }
    });

    mockStorage.setItem.mockResolvedValue(true);
    mockStorage.getItem.mockImplementation((key) => {
      if (key === 'pending_email') return Promise.resolve('john@example.com');
      return Promise.resolve(null);
    });

    // Step 1: Login
    const loginResult = await authFlow.login('john@example.com', 'password123');
    
    expect(mockApiService.login).toHaveBeenCalledWith({
      email: 'john@example.com',
      password: 'password123'
    });
    expect(mockStorage.setItem).toHaveBeenCalledWith('pending_email', 'john@example.com');
    expect(mockRouter.push).toHaveBeenCalledWith('/(auth)/verification');
    expect(loginResult.success).toBe(true);
    expect(loginResult.requiresOTP).toBe(true);

    // Step 2: OTP Verification
    const otpResult = await authFlow.verifyOTP('123456');
    
    expect(mockApiService.verifyLoginCode).toHaveBeenCalledWith({
      email: 'john@example.com',
      code: '123456'
    });
    expect(mockStorage.setItem).toHaveBeenCalledWith('auth_token', 'jwt-token-123');
    expect(mockStorage.setItem).toHaveBeenCalledWith('user_data', JSON.stringify({
      id: '1', name: 'John Doe', email: 'john@example.com'
    }));
    expect(mockStorage.removeItem).toHaveBeenCalledWith('pending_email');
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)/home');
    expect(otpResult.success).toBe(true);
    expect(otpResult.token).toBe('jwt-token-123');
  });

  // Test 2: Login with invalid email format
  test('rejects invalid email format', async () => {
    const result = await authFlow.login('invalid-email', 'password123');
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid email format');
    expect(mockApiService.login).not.toHaveBeenCalled();
    expect(mockAlertService.showError).toHaveBeenCalledWith('Login Failed', 'Invalid email format');
  });

  // Test 3: Login with short password
  test('rejects password shorter than 8 characters', async () => {
    const result = await authFlow.login('john@example.com', '123');
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Password must be at least 8 characters');
    expect(mockApiService.login).not.toHaveBeenCalled();
  });

  // Test 4: API login failure
  test('handles API login failure', async () => {
    mockApiService.login.mockResolvedValueOnce({
      success: false,
      message: 'Invalid credentials'
    });

    const result = await authFlow.login('john@example.com', 'wrongpassword');
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid credentials');
    expect(mockAlertService.showError).toHaveBeenCalledWith('Login Failed', 'Invalid credentials');
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  // Test 5: Invalid OTP format
  test('rejects invalid OTP format', async () => {
    const result1 = await authFlow.verifyOTP('12345'); // Too short
    const result2 = await authFlow.verifyOTP('abcdef'); // Not numeric
    const result3 = await authFlow.verifyOTP('1234567'); // Too long

    expect(result1.success).toBe(false);
    expect(result1.error).toBe('Invalid OTP format');
    expect(result2.success).toBe(false);
    expect(result3.success).toBe(false);
    expect(mockApiService.verifyLoginCode).not.toHaveBeenCalled();
  });

  // Test 6: OTP verification without pending email
  test('handles OTP verification without pending email', async () => {
    mockStorage.getItem.mockResolvedValueOnce(null);

    const result = await authFlow.verifyOTP('123456');
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('No pending verification found');
    expect(mockApiService.verifyLoginCode).not.toHaveBeenCalled();
  });

  // Test 7: Google login success
  test('handles successful Google login', async () => {
    mockApiService.initiateGoogleLogin.mockResolvedValueOnce({
      success: true,
      token: 'google-jwt-456',
      user: { id: '2', name: 'Jane Doe', email: 'jane@gmail.com' }
    });

    const result = await authFlow.googleLogin();
    
    expect(mockApiService.initiateGoogleLogin).toHaveBeenCalled();
    expect(mockStorage.setItem).toHaveBeenCalledWith('auth_token', 'google-jwt-456');
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)/home');
    expect(result.success).toBe(true);
    expect(result.user.name).toBe('Jane Doe');
  });

  // Test 8: Logout flow
  test('handles logout correctly', async () => {
    authFlow.authToken = 'existing-token';
    authFlow.currentUser = { id: '1', name: 'John' };

    mockApiService.logout.mockResolvedValueOnce({ success: true });

    const result = await authFlow.logout();
    
    expect(mockApiService.logout).toHaveBeenCalled();
    expect(mockStorage.removeItem).toHaveBeenCalledWith('auth_token');
    expect(mockStorage.removeItem).toHaveBeenCalledWith('user_data');
    expect(mockStorage.removeItem).toHaveBeenCalledWith('pending_email');
    expect(mockRouter.replace).toHaveBeenCalledWith('/(auth)/login');
    expect(result.success).toBe(true);
    expect(authFlow.authToken).toBeNull();
    expect(authFlow.currentUser).toBeNull();
  });

  // Test 9: Check auth status with valid token
  test('checks auth status with valid stored token', async () => {
    mockStorage.getItem.mockImplementation((key) => {
      if (key === 'auth_token') return Promise.resolve('stored-token');
      if (key === 'user_data') return Promise.resolve(JSON.stringify({ id: '1', name: 'John' }));
      return Promise.resolve(null);
    });

    mockApiService.verifyToken.mockResolvedValueOnce({ valid: true });

    const result = await authFlow.checkAuthStatus();
    
    expect(mockApiService.verifyToken).toHaveBeenCalledWith('stored-token');
    expect(result.isAuthenticated).toBe(true);
    expect(result.user.name).toBe('John');
  });

  // Test 10: Check auth status with expired token
  test('handles expired token during auth check', async () => {
    mockStorage.getItem.mockImplementation((key) => {
      if (key === 'auth_token') return Promise.resolve('expired-token');
      if (key === 'user_data') return Promise.resolve(JSON.stringify({ id: '1', name: 'John' }));
      return Promise.resolve(null);
    });

    mockApiService.verifyToken.mockResolvedValueOnce({ valid: false });

    const result = await authFlow.checkAuthStatus();
    
    expect(result.isAuthenticated).toBe(false);
    expect(mockStorage.removeItem).toHaveBeenCalledWith('auth_token');
    expect(mockRouter.replace).toHaveBeenCalledWith('/(auth)/login');
  });
});
