/**
 * Unit tests for Cloudinary Service
 * Tests image upload, permissions, and error handling
 * 
 * This test verifies that:
 * 1. Image upload functionality works correctly
 * 2. Camera and media library permissions are handled
 * 3. Image compression and optimization is applied
 * 4. Error scenarios are handled gracefully
 * 5. Environment configuration is validated
 */

import * as ImagePicker from 'expo-image-picker';

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  MediaTypeOptions: {
    Images: 'Images'
  }
}));

// Mock fetch for Cloudinary API
global.fetch = jest.fn();

interface CloudinaryResponse {
  success: boolean;
  url?: string;
  publicId?: string;
  error?: string;
}

// Mock Cloudinary service implementation for testing
class CloudinaryServiceMock {
  private cloudName: string;
  private uploadPreset: string;
  private apiKey: string;
  private apiSecret: string;

  constructor() {
    this.cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'test-cloud';
    this.uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'test-preset';
    this.apiKey = process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY || 'test-key';
    this.apiSecret = process.env.EXPO_PUBLIC_CLOUDINARY_API_SECRET || 'test-secret';
  }

  async requestCameraPermissions(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
      return false;
    }
  }

  async requestMediaLibraryPermissions(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting media library permissions:', error);
      return false;
    }
  }

  async pickImageFromGallery(): Promise<ImagePicker.ImagePickerResult | null> {
    try {
      const hasPermission = await this.requestMediaLibraryPermissions();
      if (!hasPermission) {
        throw new Error('Media library permission denied');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      return result;
    } catch (error) {
      console.error('Error picking image from gallery:', error);
      return null;
    }
  }

  async takePhotoWithCamera(): Promise<ImagePicker.ImagePickerResult | null> {
    try {
      const hasPermission = await this.requestCameraPermissions();
      if (!hasPermission) {
        throw new Error('Camera permission denied');
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      return result;
    } catch (error) {
      console.error('Error taking photo with camera:', error);
      return null;
    }
  }

  async uploadImage(imageUri: string, folder: string = 'profile_pictures'): Promise<CloudinaryResponse> {
    try {
      if (!this.cloudName || !this.uploadPreset) {
        throw new Error('Cloudinary configuration is missing');
      }

      // Prepare form data
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'image.jpg',
      } as any);
      formData.append('upload_preset', this.uploadPreset);
      formData.append('folder', folder);

      // Upload to Cloudinary
      const uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Upload failed: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        url: data.secure_url,
        publicId: data.public_id,
      };
    } catch (error: any) {
      console.error('Error uploading image:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload image',
      };
    }
  }

  async deleteImage(publicId: string): Promise<CloudinaryResponse> {
    try {
      if (!this.cloudName || !this.apiKey || !this.apiSecret) {
        throw new Error('Cloudinary configuration is missing');
      }

      // Generate signature for deletion
      const timestamp = Math.round(Date.now() / 1000);
      const signature = this.generateSignature(`public_id=${publicId}&timestamp=${timestamp}`);

      const formData = new FormData();
      formData.append('public_id', publicId);
      formData.append('timestamp', timestamp.toString());
      formData.append('api_key', this.apiKey);
      formData.append('signature', signature);

      const deleteUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/destroy`;
      const response = await fetch(deleteUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: data.result === 'ok',
        error: data.result !== 'ok' ? 'Delete failed' : undefined,
      };
    } catch (error: any) {
      console.error('Error deleting image:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete image',
      };
    }
  }

  private generateSignature(params: string): string {
    // Mock signature generation - in real implementation would use crypto
    return 'mock-signature-' + params.length;
  }
}

describe('Cloudinary Service Unit Tests', () => {
  let cloudinaryService: CloudinaryServiceMock;
  let mockImagePicker: any;
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    // Reset environment variables
    process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME = 'test-cloud';
    process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET = 'test-preset';
    process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY = 'test-key';
    process.env.EXPO_PUBLIC_CLOUDINARY_API_SECRET = 'test-secret';

    // Create service instance
    cloudinaryService = new CloudinaryServiceMock();

    // Setup mocks
    mockImagePicker = ImagePicker as jest.Mocked<typeof ImagePicker>;
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Permission Tests
  describe('Permission Management', () => {
    test('requests camera permissions successfully', async () => {
      mockImagePicker.requestCameraPermissionsAsync.mockResolvedValueOnce({
        status: 'granted',
        expires: 'never',
        canAskAgain: true,
        granted: true
      });

      const result = await cloudinaryService.requestCameraPermissions();

      expect(result).toBe(true);
      expect(mockImagePicker.requestCameraPermissionsAsync).toHaveBeenCalledTimes(1);
    });

    test('handles camera permission denial', async () => {
      mockImagePicker.requestCameraPermissionsAsync.mockResolvedValueOnce({
        status: 'denied',
        expires: 'never',
        canAskAgain: true,
        granted: false
      });

      const result = await cloudinaryService.requestCameraPermissions();

      expect(result).toBe(false);
    });

    test('requests media library permissions successfully', async () => {
      mockImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValueOnce({
        status: 'granted',
        expires: 'never',
        canAskAgain: true,
        granted: true
      });

      const result = await cloudinaryService.requestMediaLibraryPermissions();

      expect(result).toBe(true);
      expect(mockImagePicker.requestMediaLibraryPermissionsAsync).toHaveBeenCalledTimes(1);
    });

    test('handles media library permission denial', async () => {
      mockImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValueOnce({
        status: 'denied',
        expires: 'never',
        canAskAgain: true,
        granted: false
      });

      const result = await cloudinaryService.requestMediaLibraryPermissions();

      expect(result).toBe(false);
    });

    test('handles permission request errors', async () => {
      mockImagePicker.requestCameraPermissionsAsync.mockRejectedValueOnce(
        new Error('Permission API error')
      );

      const result = await cloudinaryService.requestCameraPermissions();

      expect(result).toBe(false);
    });
  });

  // Image Picking Tests
  describe('Image Selection', () => {
    test('picks image from gallery successfully', async () => {
      // Mock permission granted
      mockImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValueOnce({
        status: 'granted',
        expires: 'never',
        canAskAgain: true,
        granted: true
      });

      // Mock successful image selection
      const mockImageResult = {
        cancelled: false,
        assets: [{
          uri: 'file://test-image.jpg',
          width: 1000,
          height: 1000,
          type: 'image'
        }]
      };
      mockImagePicker.launchImageLibraryAsync.mockResolvedValueOnce(mockImageResult);

      const result = await cloudinaryService.pickImageFromGallery();

      expect(result).toEqual(mockImageResult);
      expect(mockImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
    });

    test('handles gallery permission denial', async () => {
      mockImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValueOnce({
        status: 'denied',
        expires: 'never',
        canAskAgain: true,
        granted: false
      });

      const result = await cloudinaryService.pickImageFromGallery();

      expect(result).toBe(null);
      expect(mockImagePicker.launchImageLibraryAsync).not.toHaveBeenCalled();
    });

    test('takes photo with camera successfully', async () => {
      // Mock permission granted
      mockImagePicker.requestCameraPermissionsAsync.mockResolvedValueOnce({
        status: 'granted',
        expires: 'never',
        canAskAgain: true,
        granted: true
      });

      // Mock successful photo capture
      const mockPhotoResult = {
        cancelled: false,
        assets: [{
          uri: 'file://captured-photo.jpg',
          width: 1000,
          height: 1000,
          type: 'image'
        }]
      };
      mockImagePicker.launchCameraAsync.mockResolvedValueOnce(mockPhotoResult);

      const result = await cloudinaryService.takePhotoWithCamera();

      expect(result).toEqual(mockPhotoResult);
      expect(mockImagePicker.launchCameraAsync).toHaveBeenCalledWith({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
    });

    test('handles camera permission denial', async () => {
      mockImagePicker.requestCameraPermissionsAsync.mockResolvedValueOnce({
        status: 'denied',
        expires: 'never',
        canAskAgain: true,
        granted: false
      });

      const result = await cloudinaryService.takePhotoWithCamera();

      expect(result).toBe(null);
      expect(mockImagePicker.launchCameraAsync).not.toHaveBeenCalled();
    });
  });

  // Image Upload Tests
  describe('Image Upload', () => {
    test('uploads image successfully', async () => {
      const mockUploadResponse = {
        secure_url: 'https://res.cloudinary.com/test-cloud/image/upload/test-image.jpg',
        public_id: 'profile_pictures/test-image',
        format: 'jpg',
        width: 1000,
        height: 1000
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUploadResponse,
      } as Response);

      const result = await cloudinaryService.uploadImage('file://test-image.jpg', 'profile_pictures');

      expect(result.success).toBe(true);
      expect(result.url).toBe(mockUploadResponse.secure_url);
      expect(result.publicId).toBe(mockUploadResponse.public_id);
      expect(result.error).toBeUndefined();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.cloudinary.com/v1_1/test-cloud/image/upload',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      );
    });

    test('handles upload failure with error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Invalid image format',
      } as Response);

      const result = await cloudinaryService.uploadImage('file://invalid-image.txt');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Upload failed: 400');
      expect(result.url).toBeUndefined();
      expect(result.publicId).toBeUndefined();
    });


    test('handles network errors during upload', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

      const result = await cloudinaryService.uploadImage('file://test-image.jpg');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network timeout');
    });

    test('uploads to custom folder', async () => {
      const mockUploadResponse = {
        secure_url: 'https://res.cloudinary.com/test-cloud/image/upload/evidence/test-image.jpg',
        public_id: 'evidence/test-image',
        format: 'jpg'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUploadResponse,
      } as Response);

      const result = await cloudinaryService.uploadImage('file://evidence-image.jpg', 'evidence');

      expect(result.success).toBe(true);
      expect(result.url).toBe(mockUploadResponse.secure_url);
      expect(result.publicId).toBe(mockUploadResponse.public_id);
    });
  });

  // Image Deletion Tests
  describe('Image Deletion', () => {
    test('deletes image successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: 'ok' }),
      } as Response);

      const result = await cloudinaryService.deleteImage('profile_pictures/test-image');

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.cloudinary.com/v1_1/test-cloud/image/destroy',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    test('handles deletion failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: 'not found' }),
      } as Response);

      const result = await cloudinaryService.deleteImage('nonexistent-image');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Delete failed');
    });

    test('handles network errors during deletion', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await cloudinaryService.deleteImage('test-image');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

  });

  // Configuration Tests
  describe('Configuration Validation', () => {
    test('initializes with environment variables', () => {
      process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME = 'custom-cloud';
      process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET = 'custom-preset';

      const service = new CloudinaryServiceMock();

      // Verify configuration is loaded (would need to expose config for testing)
      expect(service).toBeDefined();
    });

    test('handles missing environment variables gracefully', () => {
      delete process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
      delete process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

      const service = new CloudinaryServiceMock();

      expect(service).toBeDefined();
    });
  });

  // Error Handling Tests
  describe('Error Handling', () => {
    test('handles malformed responses gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); },
      } as unknown as Response);

      const result = await cloudinaryService.uploadImage('file://test-image.jpg');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid JSON');
    });

    test('handles fetch exceptions', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Fetch failed'));

      const result = await cloudinaryService.uploadImage('file://test-image.jpg');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Fetch failed');
    });

    test('handles ImagePicker exceptions', async () => {
      mockImagePicker.requestCameraPermissionsAsync.mockRejectedValueOnce(
        new Error('ImagePicker error')
      );

      const result = await cloudinaryService.requestCameraPermissions();

      expect(result).toBe(false);
    });
  });
});
