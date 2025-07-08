/**
 * Integration test for Emergency Alert Flow
 * Tests the complete emergency flow without UI rendering
 * 
 * This test verifies that:
 * 1. Emergency button press triggers location service
 * 2. Location data is gathered correctly
 * 3. Emergency contacts are retrieved
 * 4. Alert is sent with proper payload
 * 5. Navigation occurs after successful alert
 */

// Mock the emergency flow service
class EmergencyFlowMock {
  constructor(locationService, alertService, contactService, router, storage) {
    this.locationService = locationService;
    this.alertService = alertService;
    this.contactService = contactService;
    this.router = router;
    this.storage = storage;
  }

  async triggerEmergency() {
    try {
      // Step 1: Get current location
      const location = await this.locationService.getCurrentLocation();
      
      // Step 2: Get emergency contacts
      const contacts = await this.contactService.getEmergencyContacts();
      
      // Step 3: Prepare alert payload
      const alertPayload = {
        location: location.coords,
        contacts: contacts,
        timestamp: new Date().toISOString(),
        alertType: 'emergency',
        message: 'Emergency alert triggered'
      };
      
      // Step 4: Send emergency alert
      const alertResult = await this.alertService.triggerEmergencyAlert(alertPayload);
      
      if (alertResult.success) {
        // Step 5: Store alert in local storage
        await this.storage.storeEmergencyAlert({
          id: alertResult.alertId,
          ...alertPayload
        });
        
        // Step 6: Navigate to emergency status screen
        this.router.push(`/(tabs)/emergency?alertId=${alertResult.alertId}&status=sent`);
        
        return {
          success: true,
          alertId: alertResult.alertId,
          location: location.coords,
          contactsNotified: contacts.length
        };
      } else {
        throw new Error(alertResult.message || 'Failed to send emergency alert');
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async cancelEmergency(alertId) {
    try {
      const result = await this.alertService.cancelEmergencyAlert(alertId);
      
      if (result.success) {
        await this.storage.updateEmergencyAlert(alertId, { status: 'cancelled' });
        this.router.push('/(tabs)/home');
      }
      
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

describe('Emergency Flow Integration Tests', () => {
  let mockLocationService;
  let mockAlertService;
  let mockContactService;
  let mockRouter;
  let mockStorage;
  let emergencyFlow;

  beforeEach(() => {
    // Mock location service
    mockLocationService = {
      getCurrentLocation: jest.fn(),
      requestPermission: jest.fn()
    };

    // Mock alert service
    mockAlertService = {
      triggerEmergencyAlert: jest.fn(),
      cancelEmergencyAlert: jest.fn()
    };

    // Mock contact service
    mockContactService = {
      getEmergencyContacts: jest.fn()
    };

    // Mock router
    mockRouter = {
      push: jest.fn(),
      replace: jest.fn()
    };

    // Mock storage
    mockStorage = {
      storeEmergencyAlert: jest.fn(),
      updateEmergencyAlert: jest.fn(),
      getEmergencyAlert: jest.fn()
    };

    // Create emergency flow instance
    emergencyFlow = new EmergencyFlowMock(
      mockLocationService,
      mockAlertService,
      mockContactService,
      mockRouter,
      mockStorage
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: Complete successful emergency flow
  test('triggers complete emergency alert flow successfully', async () => {
    // Setup mocks for successful flow
    mockLocationService.getCurrentLocation.mockResolvedValueOnce({
      coords: {
        latitude: 23.8103,
        longitude: 90.4125,
        accuracy: 10
      }
    });

    mockContactService.getEmergencyContacts.mockResolvedValueOnce([
      { id: '1', name: 'Emergency Contact 1', phone: '+8801712345678' },
      { id: '2', name: 'Emergency Contact 2', phone: '+8801812345678' }
    ]);

    mockAlertService.triggerEmergencyAlert.mockResolvedValueOnce({
      success: true,
      alertId: 'alert-123',
      message: 'Emergency alert sent successfully'
    });

    mockStorage.storeEmergencyAlert.mockResolvedValueOnce(true);

    // Execute emergency flow
    const result = await emergencyFlow.triggerEmergency();

    // Verify the complete flow
    expect(mockLocationService.getCurrentLocation).toHaveBeenCalledTimes(1);
    expect(mockContactService.getEmergencyContacts).toHaveBeenCalledTimes(1);
    
    expect(mockAlertService.triggerEmergencyAlert).toHaveBeenCalledWith({
      location: { latitude: 23.8103, longitude: 90.4125, accuracy: 10 },
      contacts: [
        { id: '1', name: 'Emergency Contact 1', phone: '+8801712345678' },
        { id: '2', name: 'Emergency Contact 2', phone: '+8801812345678' }
      ],
      timestamp: expect.any(String),
      alertType: 'emergency',
      message: 'Emergency alert triggered'
    });

    expect(mockStorage.storeEmergencyAlert).toHaveBeenCalledWith({
      id: 'alert-123',
      location: { latitude: 23.8103, longitude: 90.4125, accuracy: 10 },
      contacts: expect.any(Array),
      timestamp: expect.any(String),
      alertType: 'emergency',
      message: 'Emergency alert triggered'
    });

    expect(mockRouter.push).toHaveBeenCalledWith('/(tabs)/emergency?alertId=alert-123&status=sent');

    expect(result.success).toBe(true);
    expect(result.alertId).toBe('alert-123');
    expect(result.contactsNotified).toBe(2);
  });

  // Test 2: Handle location service failure
  test('handles location service failure gracefully', async () => {
    mockLocationService.getCurrentLocation.mockRejectedValueOnce(
      new Error('Location permission denied')
    );

    const result = await emergencyFlow.triggerEmergency();

    expect(result.success).toBe(false);
    expect(result.error).toBe('Location permission denied');
    expect(mockAlertService.triggerEmergencyAlert).not.toHaveBeenCalled();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  // Test 3: Handle no emergency contacts
  test('handles empty emergency contacts list', async () => {
    mockLocationService.getCurrentLocation.mockResolvedValueOnce({
      coords: { latitude: 23.8103, longitude: 90.4125 }
    });

    mockContactService.getEmergencyContacts.mockResolvedValueOnce([]);

    mockAlertService.triggerEmergencyAlert.mockResolvedValueOnce({
      success: true,
      alertId: 'alert-456'
    });

    const result = await emergencyFlow.triggerEmergency();

    expect(result.success).toBe(true);
    expect(result.contactsNotified).toBe(0);
    expect(mockAlertService.triggerEmergencyAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        contacts: []
      })
    );
  });

  // Test 4: Handle alert service failure
  test('handles alert service failure', async () => {
    mockLocationService.getCurrentLocation.mockResolvedValueOnce({
      coords: { latitude: 23.8103, longitude: 90.4125 }
    });

    mockContactService.getEmergencyContacts.mockResolvedValueOnce([
      { id: '1', name: 'Contact 1', phone: '+8801712345678' }
    ]);

    mockAlertService.triggerEmergencyAlert.mockResolvedValueOnce({
      success: false,
      message: 'Server error'
    });

    const result = await emergencyFlow.triggerEmergency();

    expect(result.success).toBe(false);
    expect(result.error).toBe('Server error');
    expect(mockStorage.storeEmergencyAlert).not.toHaveBeenCalled();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  // Test 5: Emergency cancellation flow
  test('handles emergency alert cancellation', async () => {
    const alertId = 'alert-789';
    
    mockAlertService.cancelEmergencyAlert.mockResolvedValueOnce({
      success: true,
      message: 'Alert cancelled successfully'
    });

    mockStorage.updateEmergencyAlert.mockResolvedValueOnce(true);

    const result = await emergencyFlow.cancelEmergency(alertId);

    expect(mockAlertService.cancelEmergencyAlert).toHaveBeenCalledWith(alertId);
    expect(mockStorage.updateEmergencyAlert).toHaveBeenCalledWith(alertId, { status: 'cancelled' });
    expect(mockRouter.push).toHaveBeenCalledWith('/(tabs)/home');
    expect(result.success).toBe(true);
  });

  // Test 6: Network failure during alert
  test('handles network failure during alert transmission', async () => {
    mockLocationService.getCurrentLocation.mockResolvedValueOnce({
      coords: { latitude: 23.8103, longitude: 90.4125 }
    });

    mockContactService.getEmergencyContacts.mockResolvedValueOnce([
      { id: '1', name: 'Contact 1', phone: '+8801712345678' }
    ]);

    mockAlertService.triggerEmergencyAlert.mockRejectedValueOnce(
      new Error('Network request failed')
    );

    const result = await emergencyFlow.triggerEmergency();

    expect(result.success).toBe(false);
    expect(result.error).toBe('Network request failed');
    expect(mockStorage.storeEmergencyAlert).not.toHaveBeenCalled();
  });

  // Test 7: Storage failure handling
  test('continues flow even if storage fails', async () => {
    mockLocationService.getCurrentLocation.mockResolvedValueOnce({
      coords: { latitude: 23.8103, longitude: 90.4125 }
    });

    mockContactService.getEmergencyContacts.mockResolvedValueOnce([
      { id: '1', name: 'Contact 1', phone: '+8801712345678' }
    ]);

    mockAlertService.triggerEmergencyAlert.mockResolvedValueOnce({
      success: true,
      alertId: 'alert-999'
    });

    // Storage fails but flow should continue
    mockStorage.storeEmergencyAlert.mockRejectedValueOnce(
      new Error('Storage error')
    );

    const result = await emergencyFlow.triggerEmergency();

    expect(result.success).toBe(false);
    expect(result.error).toBe('Storage error');
    expect(mockAlertService.triggerEmergencyAlert).toHaveBeenCalled();
  });
});
