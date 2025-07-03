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
    return this.uploadFile(imageUri, folder, 'image');
  }

  /**
   * Upload evidence for reports - handles images, videos, and audio files
   */
  async uploadEvidence(fileUri: string): Promise<CloudinaryResponse> {
    // Determine file type and appropriate resource type
    const isVideo = this.isVideoFile(fileUri);
    const isAudio = this.isAudioFile(fileUri);
    
    // Cloudinary typically handles audio files under 'video' resource type
    // unless your account specifically supports 'audio' resource type
    const resourceType = (isVideo || isAudio) ? 'video' : 'image';
    
    return this.uploadFile(fileUri, 'report_evidence', resourceType);
  }

  /**
   * Check if the file is a video based on URI or extension
   */
  private isVideoFile(uri: string): boolean {
    const lowerUri = uri.toLowerCase();
    return lowerUri.includes('video') || 
           lowerUri.includes('.mp4') || 
           lowerUri.includes('.mov') || 
           lowerUri.includes('.avi') || 
           lowerUri.includes('.webm') ||
           lowerUri.includes('.flv') ||
           lowerUri.includes('.wmv');
  }

  /**
   * Check if the file is an audio file based on URI or extension
   */
  private isAudioFile(uri: string): boolean {
    const lowerUri = uri.toLowerCase();
    return lowerUri.includes('audio') || 
           lowerUri.includes('.mp3') || 
           lowerUri.includes('.wav') || 
           lowerUri.includes('.flac') || 
           lowerUri.includes('.aac') || 
           lowerUri.includes('.ogg') || 
           lowerUri.includes('.m4a');
  }

  /**
   * Generic file upload method that handles both images and videos
   */
  async uploadFile(fileUri: string, folder: string = 'profile_pictures', resourceType: 'image' | 'video' = 'image'): Promise<CloudinaryResponse> {
    try {
      if (!this.cloudName || !this.uploadPreset) {
        return {
          success: false,
          error: 'Cloudinary configuration is missing'
        };
      }

      // Validate file URI
      if (!fileUri || typeof fileUri !== 'string') {
        throw new Error('Invalid file URI provided');
      }

      console.log(`🎬 Uploading ${resourceType} to Cloudinary:`, fileUri.substring(0, 100));

      // Create FormData for the upload
      const formData = new FormData();
      
      // Check if we're running on web or mobile
      const isWeb = typeof window !== 'undefined' && typeof window.navigator !== 'undefined';
      
      if (isWeb) {
        try {
          // For web, convert URI to blob first
          const response = await fetch(fileUri);
          if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.status}`);
          }
          const blob = await response.blob();
          
          console.log('Blob info:', {
            type: blob.type,
            size: blob.size,
            resourceType: resourceType
          });
          
          // Determine file extension and MIME type from blob or fallback
          let fileExtension = resourceType === 'video' ? 'mp4' : 'jpg';
          let mimeType = resourceType === 'video' ? 'video/mp4' : 'image/jpeg';
          
          if (blob.type) {
            if (blob.type.includes('png')) {
              fileExtension = 'png';
              mimeType = 'image/png';
            } else if (blob.type.includes('gif')) {
              fileExtension = 'gif';
              mimeType = 'image/gif';
            } else if (blob.type.includes('webp')) {
              fileExtension = 'webp';
              mimeType = 'image/webp';
            } else if (blob.type.includes('video/mp4')) {
              fileExtension = 'mp4';
              mimeType = 'video/mp4';
            } else if (blob.type.includes('video/mov')) {
              fileExtension = 'mov';
              mimeType = 'video/mov';
            } else if (blob.type.includes('audio/mpeg') || blob.type.includes('audio/mp3')) {
              fileExtension = 'mp3';
              mimeType = 'audio/mpeg';
            } else if (blob.type.includes('audio/wav')) {
              fileExtension = 'wav';
              mimeType = 'audio/wav';
            } else if (blob.type.includes('audio/aac')) {
              fileExtension = 'aac';
              mimeType = 'audio/aac';
            } else if (blob.type.includes('audio/ogg')) {
              fileExtension = 'ogg';
              mimeType = 'audio/ogg';
            } else if (blob.type.includes('audio/flac')) {
              fileExtension = 'flac';
              mimeType = 'audio/flac';
            } else if (blob.type.includes('audio/m4a') || blob.type.includes('audio/mp4')) {
              fileExtension = 'm4a';
              mimeType = 'audio/mp4';
            } else if (blob.type.includes('video')) {
              fileExtension = 'mp4';
              mimeType = 'video/mp4';
            } else if (blob.type.includes('audio')) {
              fileExtension = 'mp3';
              mimeType = 'audio/mpeg';
            }
          } else {
            // If no MIME type, try to infer from URI
            const uriExtension = fileUri.split('.').pop()?.toLowerCase();
            if (uriExtension) {
              fileExtension = uriExtension;
              if (['mp4', 'mov', 'avi', 'webm'].includes(uriExtension)) {
                mimeType = `video/${uriExtension === 'mov' ? 'mov' : 'mp4'}`;
              } else if (['mp3', 'wav', 'aac', 'ogg', 'flac', 'm4a'].includes(uriExtension)) {
                mimeType = uriExtension === 'mp3' ? 'audio/mpeg' : 
                          uriExtension === 'wav' ? 'audio/wav' :
                          uriExtension === 'aac' ? 'audio/aac' :
                          uriExtension === 'ogg' ? 'audio/ogg' :
                          uriExtension === 'flac' ? 'audio/flac' :
                          uriExtension === 'm4a' ? 'audio/mp4' : 'audio/mpeg';
              } else if (['png', 'gif', 'webp', 'jpg', 'jpeg'].includes(uriExtension)) {
                mimeType = `image/${uriExtension === 'jpg' ? 'jpeg' : uriExtension}`;
              }
            }
          }
          
          const fileName = `${folder}_${Date.now()}.${fileExtension}`;
          
          // Create a new blob with correct MIME type if needed
          let finalBlob = blob;
          if (!blob.type || (!blob.type.startsWith('image/') && !blob.type.startsWith('video/') && !blob.type.startsWith('audio/'))) {
            console.log('Creating new blob with correct MIME type:', mimeType);
            finalBlob = new Blob([blob], { type: mimeType });
          }
          
          formData.append('file', finalBlob, fileName);
        } catch (blobError) {
          console.error('Failed to create blob from URI:', blobError);
          throw new Error('Failed to process file');
        }
      } else {
        // For mobile (React Native)
        const fileExtension = fileUri.split('.').pop()?.toLowerCase() || 
                             (resourceType === 'video' ? 'mp4' : 'jpg');
        
        // Determine MIME type based on extension
        let mimeType = 'image/jpeg'; // default
        if (resourceType === 'video') {
          if (['mp3', 'wav', 'aac', 'ogg', 'flac', 'm4a'].includes(fileExtension)) {
            // Audio files
            mimeType = fileExtension === 'mp3' ? 'audio/mpeg' : 
                      fileExtension === 'wav' ? 'audio/wav' :
                      fileExtension === 'aac' ? 'audio/aac' :
                      fileExtension === 'ogg' ? 'audio/ogg' :
                      fileExtension === 'flac' ? 'audio/flac' :
                      fileExtension === 'm4a' ? 'audio/mp4' : 'audio/mpeg';
          } else {
            // Video files
            mimeType = 'video/mp4';
          }
        } else if (fileExtension === 'png') {
          mimeType = 'image/png';
        } else if (fileExtension === 'gif') {
          mimeType = 'image/gif';
        } else if (fileExtension === 'webp') {
          mimeType = 'image/webp';
        }
        
        const fileName = `${folder}_${Date.now()}.${fileExtension}`;
        
        formData.append('file', {
          uri: fileUri,
          type: mimeType,
          name: fileName,
        } as any);
      }

      // Add upload parameters
      formData.append('upload_preset', this.uploadPreset);
      
      // Add resource type for videos
      if (resourceType === 'video') {
        formData.append('resource_type', 'video');
      }
      
      // Optional parameters - only add folder if it's different from default
      if (folder && folder !== 'profile_pictures') {
        formData.append('folder', folder);
      }

      // Choose the correct upload URL based on resource type
      const uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/${resourceType}/upload`;
      
      console.log('Uploading to Cloudinary:', {
        url: uploadUrl,
        cloudName: this.cloudName,
        uploadPreset: this.uploadPreset,
        folder: folder,
        resourceType: resourceType
      });
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Cloudinary upload failed:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText,
          resourceType: resourceType
        });
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
        }
        
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log(`✅ ${resourceType} uploaded successfully:`, result.secure_url);

      return {
        success: true,
        url: result.secure_url
      };

    } catch (error) {
      console.error(`❌ Cloudinary ${resourceType} upload error:`, error);
      
      // For videos, don't try image fallback
      if (resourceType === 'video') {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Video upload failed'
        };
      }
      
      // Try simple upload as fallback for images only
      console.log('Trying simple upload as fallback...');
      const fallbackResult = await this.uploadImageSimple(fileUri);
      if (fallbackResult.success) {
        return fallbackResult;
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Simple upload method with minimal configuration (fallback)
   */
  async uploadImageSimple(imageUri: string): Promise<CloudinaryResponse> {
    try {
      if (!this.cloudName || !this.uploadPreset) {
        return {
          success: false,
          error: 'Cloudinary configuration is missing'
        };
      }

      console.log('Simple upload attempt for:', imageUri.substring(0, 100));

      const formData = new FormData();
      
      // Check if we're running on web or mobile
      const isWeb = typeof window !== 'undefined';
      
      if (isWeb) {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        formData.append('file', blob);
      } else {
        formData.append('file', {
          uri: imageUri,
          type: 'image/jpeg',
          name: 'upload.jpg',
        } as any);
      }

      formData.append('upload_preset', this.uploadPreset);

      const uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('Simple upload failed:', result);
        throw new Error(result.error?.message || 'Upload failed');
      }

      return {
        success: true,
        url: result.secure_url
      };

    } catch (error) {
      console.error('Simple upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
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
   * Pick multiple images from gallery for evidence
   */
  async pickMultipleImagesFromGallery(): Promise<ImagePicker.ImagePickerResult | null> {
    try {
      const hasPermission = await this.requestMediaLibraryPermissions();
      if (!hasPermission) {
        throw new Error('Media library permission denied');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        // @ts-ignore - MediaTypeOptions will be deprecated, but still works for now
        mediaTypes: ImagePicker.MediaTypeOptions.All, // Allow images and videos
        allowsMultipleSelection: true,
        allowsEditing: false, // Disable editing for multiple selection
        quality: 0.8,
        base64: false,
      });

      return result;
    } catch (error) {
      console.error('Error picking multiple images from gallery:', error);
      return null;
    }
  }

  /**
   * Take photo with camera for evidence
   */
  async takeEvidencePhotoWithCamera(): Promise<ImagePicker.ImagePickerResult | null> {
    try {
      const hasPermission = await this.requestCameraPermissions();
      if (!hasPermission) {
        throw new Error('Camera permission denied');
      }

      const result = await ImagePicker.launchCameraAsync({
        // @ts-ignore - MediaTypeOptions will be deprecated, but still works for now
        mediaTypes: ImagePicker.MediaTypeOptions.All, // Allow photos and videos
        allowsEditing: false, // Keep original for evidence
        quality: 0.8,
        base64: false,
      });

      return result;
    } catch (error) {
      console.error('Error taking evidence photo with camera:', error);
      return null;
    }
  }

  /**
   * Upload multiple evidence files
   */
  async uploadMultipleEvidence(imageUris: string[]): Promise<CloudinaryResponse[]> {
    const uploadPromises = imageUris.map(uri => this.uploadEvidence(uri));
    return Promise.all(uploadPromises);
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