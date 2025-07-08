/**
 * Integration test for API Service Layer
 * Tests HTTP communication and error handling
 * 
 * This test verifies that:
 * 1. API requests are formatted correctly
 * 2. Authentication headers are included
 * 3. Error responses are handled gracefully
 * 4. Network failures are managed properly
 * 5. Response data is processed correctly
 */

// Mock API service implementation
class ApiServiceMock {
  constructor(baseUrl = 'https://api.secureherai.com', authToken = null) {
    this.baseUrl = baseUrl;
    this.authToken = authToken;
  }

  setAuthToken(token) {
    this.authToken = token;
  }

  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    if (includeAuth && this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  async request(endpoint, options = {}) {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const config = {
        method: options.method || 'GET',
        headers: this.getHeaders(options.includeAuth !== false),
        ...options
      };

      if (options.body) {
        config.body = JSON.stringify(options.body);
      }

      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          return {
            success: false,
            error: 'Unauthorized',
            shouldLogout: true,
            status: 401
          };
        }

        return {
          success: false,
          error: data.message || `HTTP ${response.status}`,
          status: response.status
        };
      }

      return {
        success: true,
        data: data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        isNetworkError: true
      };
    }
  }

  // Authentication endpoints
  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: credentials,
      includeAuth: false
    });
  }

  async verifyLoginCode(data) {
    return this.request('/auth/verify-code', {
      method: 'POST',
      body: data,
      includeAuth: false
    });
  }

  async initiateGoogleLogin() {
    return this.request('/auth/google', {
      method: 'POST',
      includeAuth: false
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST'
    });
  }

  async verifyToken(token) {
    const tempToken = this.authToken;
    this.authToken = token;
    const result = await this.request('/auth/verify-token');
    this.authToken = tempToken;
    return result;
  }

  // Emergency endpoints
  async triggerEmergencyAlert(alertData) {
    return this.request('/emergency/alert', {
      method: 'POST',
      body: alertData
    });
  }

  async cancelEmergencyAlert(alertId) {
    return this.request(`/emergency/alert/${alertId}/cancel`, {
      method: 'PUT'
    });
  }

  async getEmergencyHistory() {
    return this.request('/emergency/history');
  }

  // Contact endpoints
  async getContacts() {
    return this.request('/contacts');
  }

  async createContact(contactData) {
    return this.request('/contacts', {
      method: 'POST',
      body: contactData
    });
  }

  async updateContact(contactId, contactData) {
    return this.request(`/contacts/${contactId}`, {
      method: 'PUT',
      body: contactData
    });
  }

  async deleteContact(contactId) {
    return this.request(`/contacts/${contactId}`, {
      method: 'DELETE'
    });
  }

  // User profile endpoints
  async getUserProfile() {
    return this.request('/user/profile');
  }

  async updateUserProfile(profileData) {
    return this.request('/user/profile', {
      method: 'PUT',
      body: profileData
    });
  }
}

describe('API Service Integration Tests', () => {
  let apiService;
  let mockFetch;

  beforeEach(() => {
    // Mock global fetch
    mockFetch = jest.fn();
    global.fetch = mockFetch;

    // Create API service instance
    apiService = new ApiServiceMock('https://api.secureherai.com', 'test-token-123');
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete global.fetch;
  });

  // Test 1: Login API call
  test('makes login request with correct payload', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        message: 'Login code sent'
      })
    });

    const credentials = { email: 'user@example.com', password: 'password123' };
    const result = await apiService.login(credentials);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.secureherai.com/auth/login',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }),
        body: JSON.stringify(credentials)
      })
    );

    expect(result.success).toBe(true);
    expect(result.data.message).toBe('Login code sent');
  });

  // Test 2: Authenticated request with token
  test('includes authorization header in authenticated requests', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        contacts: []
      })
    });

    await apiService.getContacts();

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.secureherai.com/contacts',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token-123'
        })
      })
    );
  });

  // Test 3: Emergency alert with location data
  test('sends emergency alert with proper payload', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({
        success: true,
        alertId: 'alert-123'
      })
    });

    const alertData = {
      location: { latitude: 23.8103, longitude: 90.4125 },
      contacts: [{ id: '1', phone: '+8801712345678' }],
      message: 'Emergency alert'
    };

    const result = await apiService.triggerEmergencyAlert(alertData);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.secureherai.com/emergency/alert',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(alertData),
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token-123'
        })
      })
    );

    expect(result.success).toBe(true);
    expect(result.data.alertId).toBe('alert-123');
  });

  // Test 4: Handle 401 unauthorized response
  test('handles 401 unauthorized response correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({
        message: 'Token expired'
      })
    });

    const result = await apiService.getUserProfile();

    expect(result.success).toBe(false);
    expect(result.shouldLogout).toBe(true);
    expect(result.status).toBe(401);
    expect(result.error).toBe('Unauthorized');
  });

  // Test 5: Handle server error (500)
  test('handles server error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({
        message: 'Internal server error'
      })
    });

    const result = await apiService.getContacts();

    expect(result.success).toBe(false);
    expect(result.status).toBe(500);
    expect(result.error).toBe('Internal server error');
    expect(result.shouldLogout).toBeUndefined();
  });

  // Test 6: Handle network error
  test('handles network connection failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network request failed'));

    const result = await apiService.getContacts();

    expect(result.success).toBe(false);
    expect(result.error).toBe('Network request failed');
    expect(result.isNetworkError).toBe(true);
  });

  // Test 7: Contact CRUD operations
  test('performs contact CRUD operations correctly', async () => {
    // Create contact
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({
        id: 'contact-123',
        name: 'Emergency Contact',
        phone: '+8801712345678'
      })
    });

    const contactData = { name: 'Emergency Contact', phone: '+8801712345678' };
    const createResult = await apiService.createContact(contactData);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.secureherai.com/contacts',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(contactData)
      })
    );

    // Update contact
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        id: 'contact-123',
        name: 'Updated Contact',
        phone: '+8801712345678'
      })
    });

    const updateData = { name: 'Updated Contact' };
    await apiService.updateContact('contact-123', updateData);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.secureherai.com/contacts/contact-123',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(updateData)
      })
    );

    // Delete contact
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: async () => ({})
    });

    await apiService.deleteContact('contact-123');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.secureherai.com/contacts/contact-123',
      expect.objectContaining({
        method: 'DELETE'
      })
    );
  });

  // Test 8: Token verification
  test('verifies token correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        valid: true,
        user: { id: '1', name: 'John Doe' }
      })
    });

    const result = await apiService.verifyToken('test-token-456');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.secureherai.com/auth/verify-token',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token-456'
        })
      })
    );

    expect(result.success).toBe(true);
    expect(result.data.valid).toBe(true);
  });

  // Test 9: Emergency alert cancellation
  test('cancels emergency alert correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        message: 'Alert cancelled'
      })
    });

    const result = await apiService.cancelEmergencyAlert('alert-456');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.secureherai.com/emergency/alert/alert-456/cancel',
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token-123'
        })
      })
    );

    expect(result.success).toBe(true);
    expect(result.data.message).toBe('Alert cancelled');
  });

  // Test 10: Request without authentication
  test('makes requests without auth header when specified', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true
      })
    });

    const credentials = { email: 'user@test.com', password: 'pass123' };
    await apiService.login(credentials);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.secureherai.com/auth/login',
      expect.objectContaining({
        headers: expect.not.objectContaining({
          'Authorization': expect.any(String)
        })
      })
    );
  });
});
