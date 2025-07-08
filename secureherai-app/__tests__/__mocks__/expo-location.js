// Mock for expo-location module
module.exports = {
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(() => Promise.resolve({
    coords: { latitude: 0, longitude: 0 }
  })),
  watchPositionAsync: jest.fn(),
  hasServicesEnabledAsync: jest.fn(() => Promise.resolve(true)),
  requestBackgroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getProviderStatusAsync: jest.fn(() => Promise.resolve({})),
  enableNetworkProviderAsync: jest.fn(() => Promise.resolve()),
  geocodeAsync: jest.fn(() => Promise.resolve([])),
  reverseGeocodeAsync: jest.fn(() => Promise.resolve([])),
};
