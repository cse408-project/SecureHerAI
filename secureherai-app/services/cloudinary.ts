import * as ImagePicker from 'expo-image-picker';

interface CloudinaryResponse {
  success: boolean;
  url?: string;
  error?: string;
}

class CloudinaryService {
  private cloudName: string;
  private uploadPreset: string;
  private apiKey: string;

  constructor() {
    this.cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
    this.uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '';
    this.apiKey = process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY || '';

    if (!this.cloudName || !this.uploadPreset) {
      console.error('Cloudinary configuration is missing. Please check your environment variables.');
    }
  }

  /**
   * Request camera permissions
   */
  async requestCameraPermissions(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
      return false;
    }
  }

  /**
   * Request media library permissions
   */
  async requestMediaLibraryPermissions(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting media library permissions:', error);
      return false;
    }
  }

  /**
   * Pick an image from the device gallery
   */
  async pickImageFromGallery(): Promise<ImagePicker.ImagePickerResult | null> {
    try {
      const hasPermission = await this.requestMediaLibraryPermissions();
      if (!hasPermission) {
        throw new Error('Media library permission denied');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for profile pictures
        quality: 0.8,
        base64: false,
      });

      return result;
    } catch (error) {
      console.error('Error picking image from gallery:', error);
      return null;
    }
  }

  /**
   * Take a photo with the camera
   */
  async takePhotoWithCamera(): Promise<ImagePicker.ImagePickerResult | null> {
    try {
      const hasPermission = await this.requestCameraPermissions();
      if (!hasPermission) {
        throw new Error('Camera permission denied');
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for profile pictures
        quality: 0.8,
        base64: false,
      });

      return result;
    } catch (error) {
      console.error('Error taking photo with camera:', error);
      return null;
    }
  }

  /**
   * Upload an image to Cloudinary
   */
  async uploadImage(imageUri: string, folder: string = 'profile_pictures'): Promise<CloudinaryResponse> {
    try {
      if (!this.cloudName || !this.uploadPreset) {
        return {
          success: false,
          error: 'Cloudinary configuration is missing'
        };
      }

      // Validate image URI
      if (!imageUri || typeof imageUri !== 'string') {
        throw new Error('Invalid image URI provided');
      }

      // Create FormData for the upload
      const formData = new FormData();
      
      // Handle file upload differently for web vs mobile
      const fileExtension = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
      const mimeType = fileExtension === 'png' ? 'image/png' : 'image/jpeg';
      const fileName = `profile_${Date.now()}.${fileExtension}`;
      
      // Check if we're running on web or mobile
      const isWeb = typeof window !== 'undefined' && typeof window.navigator !== 'undefined';
      
      if (isWeb) {
        try {
          // For web, convert URI to blob first
          const response = await fetch(imageUri);
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status}`);
          }
          const blob = await response.blob();
          formData.append('file', blob, fileName);
        } catch (blobError) {
          console.error('Failed to create blob from URI:', blobError);
          // Fallback: try direct URI (might work for data URIs)
          formData.append('file', imageUri);
        }
      } else {
        // For mobile (React Native)
        formData.append('file', {
          uri: imageUri,
          type: mimeType,
          name: fileName,
        } as any);
      }

      // Add upload parameters
      formData.append('upload_preset', this.uploadPreset);
      
      // Optional parameters
      if (folder) {
        formData.append('folder', folder);
      }
      
      // Add timestamp for unique public_id
      const timestamp = Date.now();
      formData.append('public_id', `${folder}_${timestamp}`);

      // Upload to Cloudinary
      const uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
        }
        
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      return {
        success: true,
        url: result.secure_url
      };

    } catch (error) {
      console.error('Cloudinary upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Upload profile picture - convenient method that handles the entire flow
   */
  async uploadProfilePicture(imageUri: string): Promise<CloudinaryResponse> {
    return this.uploadImage(imageUri, 'profile_pictures');
  }

  /**
   * Upload profile picture with picker - convenient method that handles the entire flow
   */
  async uploadProfilePictureWithPicker(source: 'camera' | 'gallery'): Promise<CloudinaryResponse> {
    try {
      let result: ImagePicker.ImagePickerResult | null = null;

      if (source === 'camera') {
        result = await this.takePhotoWithCamera();
      } else {
        result = await this.pickImageFromGallery();
      }

      if (!result || result.canceled || !result.assets || result.assets.length === 0) {
        return {
          success: false,
          error: 'Image selection was cancelled'
        };
      }

      const imageUri = result.assets[0].uri;
      return await this.uploadProfilePicture(imageUri);
    } catch (error) {
      console.error('Profile picture upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Delete an image from Cloudinary (requires authentication)
   * Note: For production, this should be implemented on the backend for security
   */
  async deleteImage(publicId: string): Promise<CloudinaryResponse> {
    console.warn('Delete operation should be implemented on the backend for security');
    return {
      success: false,
      error: 'Delete operation should be implemented on the backend'
    };
  }

  /**
   * Generate transformation URL for different image sizes
   */
  generateImageUrl(publicId: string, transformation?: string): string {
    if (!this.cloudName) {
      return '';
    }

    const baseUrl = `https://res.cloudinary.com/${this.cloudName}/image/upload/`;
    const transformationPart = transformation ? `${transformation}/` : '';
    
    return `${baseUrl}${transformationPart}${publicId}`;
  }

  /**
   * Generate common profile picture transformations
   */
  getProfilePictureUrl(publicId: string, size: 'small' | 'medium' | 'large' = 'medium'): string {
    const transformations = {
      small: 'w_100,h_100,c_fill,g_face,f_auto,q_auto',
      medium: 'w_200,h_200,c_fill,g_face,f_auto,q_auto',
      large: 'w_400,h_400,c_fill,g_face,f_auto,q_auto'
    };

    return this.generateImageUrl(publicId, transformations[size]);
  }
}

// Create and export a singleton instance
const cloudinaryService = new CloudinaryService();
export default cloudinaryService;