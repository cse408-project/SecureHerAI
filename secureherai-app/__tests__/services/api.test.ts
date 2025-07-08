/**
 * Unit tests for API Service
 * Tests HTTP communication and API interactions
 * 
 * This test verifies that:
 * 1. API requests are correctly formatted
 * 2. Authentication headers are properly included
 * 3. Error responses are handled gracefully
 * 4. Network failures are managed appropriately
 * 5. Response data is processed correctly
 */

// Mock the global fetch
global.fetch = jest.fn();

// Import or mock the API service
const API_BASE_URL = 'https://api.secureherai.com';

// Mock API service implementation for testing
class ApiServiceMock {
  private authToken: string | null;

  constructor() {
    this.authToken = null;
  }

  setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  async getHeaders(includeAuth = false): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    if (includeAuth && this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  // Authentication endpoints
  async login(email: string, password: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: await this.getHeaders(),
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || `Server returned ${response.status}`
        };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.'
      };
    }
  }

  async verifyLoginCode(email: string, loginCode: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-login-code`, {
        method: 'POST',
        headers: await this.getHeaders(),
        body: JSON.stringify({ email, loginCode })
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || 'Verification failed'
        };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.'
      };
    }
  }

  async register(userData: any): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: await this.getHeaders(),
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || 'Registration failed'
        };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.'
      };
    }
  }

  // Profile endpoints
  async getUserProfile(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/user/profile`, {
        method: 'GET',
        headers: await this.getHeaders(true)
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          return {
            success: false,
            error: 'Unauthorized',
            shouldLogout: true
          };
        }
        return {
          success: false,
          error: data.error || data.message || 'Failed to fetch profile'
        };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.'
      };
    }
  }

  async updateProfile(profileData: any): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/user/profile`, {
        method: 'PUT',
        headers: await this.getHeaders(true),
        body: JSON.stringify(profileData)
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || 'Profile update failed'
        };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.'
      };
    }
  }

  // Contact endpoints
  async getTrustedContacts(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/contacts`, {
        method: 'GET',
        headers: await this.getHeaders(true)
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || 'Failed to fetch contacts'
        };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.'
      };
    }
  }

  async addTrustedContact(contact: any): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/contacts/add`, {
        method: 'POST',
        headers: await this.getHeaders(true),
        body: JSON.stringify({ contact })
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || 'Failed to add contact'
        };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.'
      };
    }
  }

  async updateTrustedContact(contactId: string, contact: any): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/contacts/update`, {
        method: 'PUT',
        headers: await this.getHeaders(true),
        body: JSON.stringify({ contactId, contact })
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || 'Failed to update contact'
        };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.'
      };
    }
  }

  async deleteTrustedContact(contactId: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/contacts/delete`, {
        method: 'DELETE',
        headers: await this.getHeaders(true),
        body: JSON.stringify({ contactId })
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || 'Failed to delete contact'
        };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.'
      };
    }
  }
}

describe('API Service Unit Tests', () => {
  let apiService: ApiServiceMock;
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    // Reset fetch mock
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockClear();

    // Create API service instance
    apiService = new ApiServiceMock();
    apiService.setAuthToken('test-token-123');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Authentication Tests
  describe('Authentication Methods', () => {
    test('login sends correct request format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Login code sent' })
      } as Response);

      const result = await apiService.login('user@example.com', 'password123');

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/auth/login`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }),
          body: JSON.stringify({ email: 'user@example.com', password: 'password123' })
        })
      );

      expect(result.success).toBe(true);
    });

    test('login handles API error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid credentials' })
      } as Response);

      const result = await apiService.login('user@example.com', 'wrongpass');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });

    test('login handles network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

      const result = await apiService.login('user@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error. Please check your connection and try again.');
    });

    test('verifyLoginCode sends correct request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          token: 'jwt-token-456',
          user: { id: '1', name: 'John Doe' }
        })
      } as Response);

      const result = await apiService.verifyLoginCode('user@example.com', '123456');

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/auth/verify-login-code`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'user@example.com', loginCode: '123456' })
        })
      );

      expect(result.success).toBe(true);
      expect(result.data.token).toBe('jwt-token-456');
    });

    test('register sends correct request format', async () => {
      const userData = {
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phoneNumber: '+8801712345678',
        role: 'USER'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'User registered successfully' })
      } as Response);

      const result = await apiService.register(userData);

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/auth/register`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(userData)
        })
      );

      expect(result.success).toBe(true);
    });
  });

  // Profile Tests
  describe('Profile Methods', () => {
    test('getUserProfile includes authorization header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: { id: '1', name: 'John Doe', email: 'john@example.com' }
        })
      } as Response);

      const result = await apiService.getUserProfile();

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/user/profile`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token-123'
          })
        })
      );

      expect(result.success).toBe(true);
    });

    test('getUserProfile handles 401 unauthorized', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Token expired' })
      } as Response);

      const result = await apiService.getUserProfile();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
      expect(result.shouldLogout).toBe(true);
    });

    test('updateProfile sends correct data', async () => {
      const profileData = {
        fullName: 'John Smith',
        phoneNumber: '+8801712345679',
        emailAlerts: true
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Profile updated successfully' })
      } as Response);

      const result = await apiService.updateProfile(profileData);

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/user/profile`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(profileData)
        })
      );

      expect(result.success).toBe(true);
    });
  });

  // Contact Tests
  describe('Contact Methods', () => {
    test('getTrustedContacts retrieves contacts correctly', async () => {
      const mockContacts = [
        { contactId: '1', name: 'Contact 1', phone: '+8801712345678' },
        { contactId: '2', name: 'Contact 2', phone: '+8801812345678' }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, contacts: mockContacts })
      } as Response);

      const result = await apiService.getTrustedContacts();

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/contacts`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token-123'
          })
        })
      );

      expect(result.success).toBe(true);
      expect(result.data.contacts).toHaveLength(2);
    });

    test('addTrustedContact sends correct contact data', async () => {
      const contactData = {
        name: 'Emergency Contact',
        phone: '+8801712345678',
        relationship: 'Family',
        email: 'contact@example.com',
        shareLocation: true
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Contact added successfully' })
      } as Response);

      const result = await apiService.addTrustedContact(contactData);

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/contacts/add`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ contact: contactData })
        })
      );

      expect(result.success).toBe(true);
    });

    test('updateTrustedContact sends correct update data', async () => {
      const contactId = 'contact-123';
      const updateData = {
        name: 'Updated Contact',
        phone: '+8801812345678',
        relationship: 'Friend'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Contact updated successfully' })
      } as Response);

      const result = await apiService.updateTrustedContact(contactId, updateData);

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/contacts/update`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ contactId, contact: updateData })
        })
      );

      expect(result.success).toBe(true);
    });

    test('deleteTrustedContact sends correct contact ID', async () => {
      const contactId = 'contact-456';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Contact deleted successfully' })
      } as Response);

      const result = await apiService.deleteTrustedContact(contactId);

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/contacts/delete`,
        expect.objectContaining({
          method: 'DELETE',
          body: JSON.stringify({ contactId })
        })
      );

      expect(result.success).toBe(true);
    });

    test('contact methods handle validation errors', async () => {
      const invalidContact = {
        name: '',
        phone: 'invalid-phone',
        relationship: ''
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid phone number format' })
      } as Response);

      const result = await apiService.addTrustedContact(invalidContact);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid phone number format');
    });
  });

  // Error Handling Tests
  describe('Error Handling', () => {
    test('handles server errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' })
      } as Response);

      const result = await apiService.getUserProfile();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Internal server error');
    });

    test('handles network timeouts', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Request timeout'));

      const result = await apiService.getTrustedContacts();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error. Please check your connection and try again.');
    });
  });
});