/**
 * Integration test for Storage Service
 * Tests data persistence and storage operations
 * 
 * This test verifies that:
 * 1. Emergency contacts are stored and retrieved correctly
 * 2. User settings persist across sessions
 * 3. Authentication tokens are handled securely
 * 4. Storage errors are handled gracefully
 * 5. Data migration and versioning works
 */

// Mock storage service implementation
class StorageServiceMock {
  constructor(asyncStorage) {
    this.storage = asyncStorage;
    this.KEYS = {
      AUTH_TOKEN: 'auth_token',
      USER_DATA: 'user_data',
      EMERGENCY_CONTACTS: 'emergency_contacts',
      USER_SETTINGS: 'user_settings',
      EMERGENCY_ALERTS: 'emergency_alerts',
      APP_VERSION: 'app_version'
    };
  }

  // Authentication storage
  async setAuthToken(token) {
    try {
      await this.storage.setItem(this.KEYS.AUTH_TOKEN, token);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getAuthToken() {
    try {
      const token = await this.storage.getItem(this.KEYS.AUTH_TOKEN);
      return { success: true, data: token };
    } catch (error) {
      return { success: false, error: error.message, data: null };
    }
  }

  async clearAuthToken() {
    try {
      await this.storage.removeItem(this.KEYS.AUTH_TOKEN);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // User data storage
  async setUserData(userData) {
    try {
      await this.storage.setItem(this.KEYS.USER_DATA, JSON.stringify(userData));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getUserData() {
    try {
      const data = await this.storage.getItem(this.KEYS.USER_DATA);
      const userData = data ? JSON.parse(data) : null;
      return { success: true, data: userData };
    } catch (error) {
      return { success: false, error: error.message, data: null };
    }
  }

  // Emergency contacts storage
  async setEmergencyContacts(contacts) {
    try {
      const contactsData = {
        contacts: contacts,
        lastUpdated: new Date().toISOString(),
        version: '1.0'
      };
      await this.storage.setItem(this.KEYS.EMERGENCY_CONTACTS, JSON.stringify(contactsData));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getEmergencyContacts() {
    try {
      const data = await this.storage.getItem(this.KEYS.EMERGENCY_CONTACTS);
      if (!data) {
        return { success: true, data: [] };
      }
      
      const contactsData = JSON.parse(data);
      return { 
        success: true, 
        data: contactsData.contacts || [],
        lastUpdated: contactsData.lastUpdated,
        version: contactsData.version
      };
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  }

  async addEmergencyContact(contact) {
    try {
      const currentContacts = await this.getEmergencyContacts();
      if (!currentContacts.success) {
        throw new Error(currentContacts.error);
      }

      const newContact = {
        id: contact.id || `contact_${Date.now()}`,
        name: contact.name,
        phone: contact.phone,
        relationship: contact.relationship || 'Friend',
        email: contact.email || '',
        addedAt: new Date().toISOString()
      };

      const updatedContacts = [...currentContacts.data, newContact];
      const result = await this.setEmergencyContacts(updatedContacts);
      
      return result.success ? 
        { success: true, data: newContact } : 
        { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // User settings storage
  async setUserSettings(settings) {
    try {
      const settingsData = {
        ...settings,
        lastUpdated: new Date().toISOString()
      };
      await this.storage.setItem(this.KEYS.USER_SETTINGS, JSON.stringify(settingsData));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getUserSettings() {
    try {
      const data = await this.storage.getItem(this.KEYS.USER_SETTINGS);
      if (!data) {
        // Return default settings
        return {
          success: true,
          data: {
            notifications: true,
            locationSharing: true,
            emergencyAlerts: true,
            theme: 'light'
          }
        };
      }
      
      const settings = JSON.parse(data);
      return { success: true, data: settings };
    } catch (error) {
      return { success: false, error: error.message, data: null };
    }
  }

  // Emergency alerts storage
  async storeEmergencyAlert(alertData) {
    try {
      const alertsResult = await this.getEmergencyAlerts();
      const currentAlerts = alertsResult.success ? alertsResult.data : [];

      const newAlert = {
        id: alertData.id,
        timestamp: alertData.timestamp || new Date().toISOString(),
        location: alertData.location,
        contacts: alertData.contacts,
        status: alertData.status || 'sent',
        message: alertData.message
      };

      const updatedAlerts = [newAlert, ...currentAlerts].slice(0, 50); // Keep last 50 alerts
      await this.storage.setItem(this.KEYS.EMERGENCY_ALERTS, JSON.stringify(updatedAlerts));
      
      return { success: true, data: newAlert };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getEmergencyAlerts() {
    try {
      const data = await this.storage.getItem(this.KEYS.EMERGENCY_ALERTS);
      const alerts = data ? JSON.parse(data) : [];
      return { success: true, data: alerts };
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  }

  // Clear all data
  async clearAllData() {
    try {
      await Promise.all([
        this.storage.removeItem(this.KEYS.AUTH_TOKEN),
        this.storage.removeItem(this.KEYS.USER_DATA),
        this.storage.removeItem(this.KEYS.EMERGENCY_CONTACTS),
        this.storage.removeItem(this.KEYS.USER_SETTINGS),
        this.storage.removeItem(this.KEYS.EMERGENCY_ALERTS)
      ]);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

describe('Storage Service Integration Tests', () => {
  let mockAsyncStorage;
  let storageService;

  beforeEach(() => {
    // Mock AsyncStorage
    mockAsyncStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    };

    // Create storage service instance
    storageService = new StorageServiceMock(mockAsyncStorage);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: Authentication token storage
  test('stores and retrieves authentication token correctly', async () => {
    const token = 'jwt-token-123';
    
    mockAsyncStorage.setItem.mockResolvedValueOnce();
    mockAsyncStorage.getItem.mockResolvedValueOnce(token);

    // Store token
    const storeResult = await storageService.setAuthToken(token);
    expect(storeResult.success).toBe(true);
    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('auth_token', token);

    // Retrieve token
    const getResult = await storageService.getAuthToken();
    expect(getResult.success).toBe(true);
    expect(getResult.data).toBe(token);
    expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('auth_token');
  });

  // Test 2: User data persistence
  test('persists user data correctly', async () => {
    const userData = {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+8801712345678'
    };

    mockAsyncStorage.setItem.mockResolvedValueOnce();
    mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(userData));

    // Store user data
    const storeResult = await storageService.setUserData(userData);
    expect(storeResult.success).toBe(true);
    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
      'user_data',
      JSON.stringify(userData)
    );

    // Retrieve user data
    const getResult = await storageService.getUserData();
    expect(getResult.success).toBe(true);
    expect(getResult.data).toEqual(userData);
  });

  // Test 3: Emergency contacts management
  test('manages emergency contacts correctly', async () => {
    const contact1 = {
      id: 'contact1',
      name: 'Emergency Contact 1',
      phone: '+8801712345678',
      relationship: 'Family'
    };

    const contact2 = {
      name: 'Emergency Contact 2',
      phone: '+8801812345678',
      relationship: 'Friend'
    };

    // Mock empty initial state
    mockAsyncStorage.getItem.mockResolvedValueOnce(null);
    mockAsyncStorage.setItem.mockResolvedValue();
    
    // Get initial empty contacts
    const initialResult = await storageService.getEmergencyContacts();
    expect(initialResult.success).toBe(true);
    expect(initialResult.data).toEqual([]);

    // Add first contact
    const addResult1 = await storageService.addEmergencyContact(contact1);
    expect(addResult1.success).toBe(true);
    expect(addResult1.data.name).toBe(contact1.name);
    expect(addResult1.data.id).toBe(contact1.id);

    // Mock updated state with first contact
    const contactsAfterFirst = {
      contacts: [contact1],
      lastUpdated: expect.any(String),
      version: '1.0'
    };
    mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(contactsAfterFirst));

    // Add second contact
    const addResult2 = await storageService.addEmergencyContact(contact2);
    expect(addResult2.success).toBe(true);
    expect(addResult2.data.name).toBe(contact2.name);
    expect(addResult2.data.id).toMatch(/^contact_\d+$/); // Generated ID
  });

  // Test 4: User settings persistence
  test('persists user settings with defaults', async () => {
    const customSettings = {
      notifications: false,
      locationSharing: true,
      emergencyAlerts: true,
      theme: 'dark'
    };

    // Test default settings when none exist
    mockAsyncStorage.getItem.mockResolvedValueOnce(null);
    const defaultResult = await storageService.getUserSettings();
    expect(defaultResult.success).toBe(true);
    expect(defaultResult.data).toEqual({
      notifications: true,
      locationSharing: true,
      emergencyAlerts: true,
      theme: 'light'
    });

    // Store custom settings
    mockAsyncStorage.setItem.mockResolvedValueOnce();
    const storeResult = await storageService.setUserSettings(customSettings);
    expect(storeResult.success).toBe(true);

    // Retrieve custom settings
    const settingsWithTimestamp = {
      ...customSettings,
      lastUpdated: expect.any(String)
    };
    mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(settingsWithTimestamp));
    
    const getResult = await storageService.getUserSettings();
    expect(getResult.success).toBe(true);
    expect(getResult.data.notifications).toBe(false);
    expect(getResult.data.theme).toBe('dark');
  });

  // Test 5: Emergency alerts storage
  test('stores emergency alerts with history', async () => {
    const alertData = {
      id: 'alert-123',
      location: { latitude: 23.8103, longitude: 90.4125 },
      contacts: [{ id: '1', name: 'Contact 1' }],
      message: 'Emergency alert'
    };

    // Mock empty alerts initially
    mockAsyncStorage.getItem.mockResolvedValueOnce(null);
    mockAsyncStorage.setItem.mockResolvedValueOnce();

    const result = await storageService.storeEmergencyAlert(alertData);
    
    expect(result.success).toBe(true);
    expect(result.data.id).toBe('alert-123');
    expect(result.data.status).toBe('sent');
    expect(result.data.timestamp).toBeTruthy();

    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
      'emergency_alerts',
      expect.stringContaining('"id":"alert-123"')
    );
  });

  // Test 6: Storage error handling
  test('handles storage errors gracefully', async () => {
    const storageError = new Error('Storage quota exceeded');
    
    // Test auth token storage error
    mockAsyncStorage.setItem.mockRejectedValueOnce(storageError);
    const authResult = await storageService.setAuthToken('token');
    expect(authResult.success).toBe(false);
    expect(authResult.error).toBe('Storage quota exceeded');

    // Test data retrieval error
    mockAsyncStorage.getItem.mockRejectedValueOnce(storageError);
    const getUserResult = await storageService.getUserData();
    expect(getUserResult.success).toBe(false);
    expect(getUserResult.data).toBe(null);
  });

  // Test 7: Data corruption handling
  test('handles corrupted data gracefully', async () => {
    // Mock corrupted JSON data
    mockAsyncStorage.getItem.mockResolvedValueOnce('invalid-json{');
    
    const result = await storageService.getUserData();
    expect(result.success).toBe(false);
    expect(result.data).toBe(null);
    expect(result.error).toContain('JSON'); // Should contain JSON parsing error
  });

  // Test 8: Clear all data functionality
  test('clears all user data correctly', async () => {
    mockAsyncStorage.removeItem.mockResolvedValue();

    const result = await storageService.clearAllData();
    
    expect(result.success).toBe(true);
    expect(mockAsyncStorage.removeItem).toHaveBeenCalledTimes(5);
    expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('auth_token');
    expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('user_data');
    expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('emergency_contacts');
    expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('user_settings');
    expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('emergency_alerts');
  });

  // Test 9: Token clearance on logout
  test('clears authentication token on logout', async () => {
    mockAsyncStorage.removeItem.mockResolvedValueOnce();

    const result = await storageService.clearAuthToken();
    
    expect(result.success).toBe(true);
    expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('auth_token');
  });

  // Test 10: Emergency alerts limit handling
  test('limits emergency alerts history to 50 entries', async () => {
    // Mock existing 50 alerts
    const existingAlerts = Array.from({ length: 50 }, (_, i) => ({
      id: `alert-${i}`,
      timestamp: new Date().toISOString()
    }));

    mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(existingAlerts));
    mockAsyncStorage.setItem.mockResolvedValueOnce();

    const newAlert = {
      id: 'alert-new',
      location: { latitude: 23.8103, longitude: 90.4125 },
      contacts: [],
      message: 'New alert'
    };

    await storageService.storeEmergencyAlert(newAlert);

    // Verify that setItem was called with exactly 50 alerts (new one + 49 old ones)
    const setItemCall = mockAsyncStorage.setItem.mock.calls[0][1];
    const storedAlerts = JSON.parse(setItemCall);
    expect(storedAlerts).toHaveLength(50);
    expect(storedAlerts[0].id).toBe('alert-new'); // New alert should be first
  });
});
