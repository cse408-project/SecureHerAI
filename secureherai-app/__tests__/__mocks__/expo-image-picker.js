// Mock for expo-image-picker module
module.exports = {
  launchImageLibraryAsync: jest.fn(() => Promise.resolve({
    canceled: false,
    assets: [{
      uri: 'mock-image-uri',
      type: 'image',
      width: 100,
      height: 100,
    }]
  })),
  launchCameraAsync: jest.fn(() => Promise.resolve({
    canceled: false,
    assets: [{
      uri: 'mock-camera-uri',
      type: 'image',
      width: 100,
      height: 100,
    }]
  })),
  requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  MediaTypeOptions: {
    All: 'All',
    Videos: 'Videos',
    Images: 'Images',
  },
  ImagePickerResult: {},
};
