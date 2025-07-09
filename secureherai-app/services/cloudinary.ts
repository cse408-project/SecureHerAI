import * as ImagePicker from 'expo-image-picker';
import CryptoJS from 'crypto-js';
import { Platform } from 'react-native';

// Alternative crypto for React Native if needed
let alternateCrypto: any;
try {
  alternateCrypto = require('react-native-crypto-js');
} catch (e) {
  // Fallback to crypto-js
  alternateCrypto = CryptoJS;
}

interface CloudinaryResponse {
  success: boolean;
  url?: string;
  error?: string;
}

class CloudinaryService {
  private cloudName: string;
  private uploadPreset: string;
  private apiKey: string;
  private apiSecret: string;

  constructor() {
    this.cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
    this.uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '';
    this.apiKey = process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY || '';
    this.apiSecret = process.env.EXPO_PUBLIC_CLOUDINARY_API_SECRET || '';

    if (!this.cloudName || !this.uploadPreset) {
      console.error(
        "Cloudinary configuration is missing. Please check your environment variables."
      );
    }
  }

  /**
   * Request camera permissions
   */
  async requestCameraPermissions(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === "granted";
    } catch (error) {
      console.error("Error requesting camera permissions:", error);
      return false;
    }
  }

  /**
   * Request media library permissions
   */
  async requestMediaLibraryPermissions(): Promise<boolean> {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      return status === "granted";
    } catch (error) {
      console.error("Error requesting media library permissions:", error);
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
        throw new Error("Media library permission denied");
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
      console.error("Error picking image from gallery:", error);
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
        throw new Error("Camera permission denied");
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for profile pictures
        quality: 0.8,
        base64: false,
      });

      return result;
    } catch (error) {
      console.error("Error taking photo with camera:", error);
      return null;
    }
  }

  /**
   * Upload an image to Cloudinary
   */
  async uploadImage(
    imageUri: string,
    folder: string = "profile_pictures"
  ): Promise<CloudinaryResponse> {
    return this.uploadFile(imageUri, folder, "image");
  }

  /**
   * Upload evidence for reports - handles images, videos, and audio files
   */
  async uploadEvidence(fileUri: string): Promise<CloudinaryResponse> {
    try {
      // For blob URIs (web), we need to check the actual blob MIME type
      let resourceType: "image" | "video" = "image";

      if (fileUri.startsWith("blob:")) {
        try {
          // Fetch the blob to get its MIME type
          const response = await fetch(fileUri);
          if (response.ok) {
            const blob = await response.blob();
            console.log("Detected blob MIME type:", blob.type);

            if (
              blob.type.startsWith("audio/") ||
              blob.type.startsWith("video/")
            ) {
              resourceType = "video"; // Cloudinary handles audio under 'video' resource type
            } else if (blob.type.startsWith("image/")) {
              resourceType = "image";
            }
          }
        } catch {
          console.warn(
            "Could not fetch blob for MIME type detection, falling back to URI analysis"
          );
        }
      } else {
        // For file URIs, use the existing detection methods
        const isVideo = this.isVideoFile(fileUri);
        const isAudio = this.isAudioFile(fileUri);

        // Cloudinary typically handles audio files under 'video' resource type
        // unless your account specifically supports 'audio' resource type
        resourceType = isVideo || isAudio ? "video" : "image";
      }

      console.log(
        `Uploading evidence with resource type: ${resourceType} for URI: ${fileUri.substring(
          0,
          100
        )}`
      );

      return this.uploadFile(fileUri, "report_evidence", resourceType);
    } catch (error) {
      console.error("Error in uploadEvidence:", error);
      // Fallback to image if there's any error in detection
      return this.uploadFile(fileUri, "report_evidence", "image");
    }
  }

  /**
   * Check if the file is a video based on URI or extension
   */
  private isVideoFile(uri: string): boolean {
    const lowerUri = uri.toLowerCase();
    return (
      lowerUri.includes("video") ||
      lowerUri.includes(".mp4") ||
      lowerUri.includes(".mov") ||
      lowerUri.includes(".avi") ||
      lowerUri.includes(".webm") ||
      lowerUri.includes(".flv") ||
      lowerUri.includes(".wmv")
    );
  }

  /**
   * Check if the file is an audio file based on URI or extension
   */
  private isAudioFile(uri: string): boolean {
    const lowerUri = uri.toLowerCase();
    return (
      lowerUri.includes("audio") ||
      lowerUri.includes(".mp3") ||
      lowerUri.includes(".wav") ||
      lowerUri.includes(".flac") ||
      lowerUri.includes(".aac") ||
      lowerUri.includes(".ogg") ||
      lowerUri.includes(".m4a")
    );
  }

  /**
   * Generic file upload method that handles both images and videos
   */
  async uploadFile(
    fileUri: string,
    folder: string = "profile_pictures",
    resourceType: "image" | "video" = "image"
  ): Promise<CloudinaryResponse> {
    try {
      if (!this.cloudName || !this.uploadPreset) {
        return {
          success: false,
          error: "Cloudinary configuration is missing",
        };
      }

      // Validate file URI
      if (!fileUri || typeof fileUri !== "string") {
        throw new Error("Invalid file URI provided");
      }

      console.log(
        `🎬 Uploading ${resourceType} to Cloudinary:`,
        fileUri.substring(0, 100)
      );

      // Create FormData for the upload
      const formData = new FormData();

      // Check if we're running on web or mobile
      const isWeb =
        typeof window !== "undefined" &&
        typeof window.navigator !== "undefined";

      if (isWeb) {
        try {
          // For web, convert URI to blob first
          const response = await fetch(fileUri);
          if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.status}`);
          }
          const blob = await response.blob();

          console.log("Blob info:", {
            type: blob.type,
            size: blob.size,
            resourceType: resourceType,
          });

          // Determine file extension and MIME type from blob or fallback
          let fileExtension = resourceType === "video" ? "mp4" : "jpg";
          let mimeType = resourceType === "video" ? "video/mp4" : "image/jpeg";

          if (blob.type) {
            if (blob.type.includes("png")) {
              fileExtension = "png";
              mimeType = "image/png";
            } else if (blob.type.includes("gif")) {
              fileExtension = "gif";
              mimeType = "image/gif";
            } else if (blob.type.includes("webp")) {
              fileExtension = "webp";
              mimeType = "image/webp";
            } else if (blob.type.includes("video/mp4")) {
              fileExtension = "mp4";
              mimeType = "video/mp4";
            } else if (blob.type.includes("video/mov")) {
              fileExtension = "mov";
              mimeType = "video/mov";
            } else if (
              blob.type.includes("audio/mpeg") ||
              blob.type.includes("audio/mp3")
            ) {
              fileExtension = "mp3";
              mimeType = "audio/mpeg";
            } else if (blob.type.includes("audio/wav")) {
              fileExtension = "wav";
              mimeType = "audio/wav";
            } else if (blob.type.includes("audio/aac")) {
              fileExtension = "aac";
              mimeType = "audio/aac";
            } else if (blob.type.includes("audio/ogg")) {
              fileExtension = "ogg";
              mimeType = "audio/ogg";
            } else if (blob.type.includes("audio/flac")) {
              fileExtension = "flac";
              mimeType = "audio/flac";
            } else if (
              blob.type.includes("audio/m4a") ||
              blob.type.includes("audio/mp4")
            ) {
              fileExtension = "m4a";
              mimeType = "audio/mp4";
            } else if (blob.type.includes("video")) {
              fileExtension = "mp4";
              mimeType = "video/mp4";
            } else if (blob.type.includes("audio")) {
              fileExtension = "mp3";
              mimeType = "audio/mpeg";
            }
          } else {
            // If no MIME type, try to infer from URI
            const uriExtension = fileUri.split(".").pop()?.toLowerCase();
            if (uriExtension) {
              fileExtension = uriExtension;
              if (["mp4", "mov", "avi", "webm"].includes(uriExtension)) {
                mimeType = `video/${uriExtension === "mov" ? "mov" : "mp4"}`;
              } else if (
                ["mp3", "wav", "aac", "ogg", "flac", "m4a"].includes(
                  uriExtension
                )
              ) {
                mimeType =
                  uriExtension === "mp3"
                    ? "audio/mpeg"
                    : uriExtension === "wav"
                    ? "audio/wav"
                    : uriExtension === "aac"
                    ? "audio/aac"
                    : uriExtension === "ogg"
                    ? "audio/ogg"
                    : uriExtension === "flac"
                    ? "audio/flac"
                    : uriExtension === "m4a"
                    ? "audio/mp4"
                    : "audio/mpeg";
              } else if (
                ["png", "gif", "webp", "jpg", "jpeg"].includes(uriExtension)
              ) {
                mimeType = `image/${
                  uriExtension === "jpg" ? "jpeg" : uriExtension
                }`;
              }
            }
          }

          const fileName = `${folder}_${Date.now()}.${fileExtension}`;

          // Create a new blob with correct MIME type if needed
          let finalBlob = blob;
          if (
            !blob.type ||
            (!blob.type.startsWith("image/") &&
              !blob.type.startsWith("video/") &&
              !blob.type.startsWith("audio/"))
          ) {
            console.log("Creating new blob with correct MIME type:", mimeType);
            finalBlob = new Blob([blob], { type: mimeType });
          }

          formData.append("file", finalBlob, fileName);
        } catch (blobError) {
          console.error("Failed to create blob from URI:", blobError);
          throw new Error("Failed to process file");
        }
      } else {
        // For mobile (React Native)
        const fileExtension =
          fileUri.split(".").pop()?.toLowerCase() ||
          (resourceType === "video" ? "mp4" : "jpg");

        // Determine MIME type based on extension
        let mimeType = "image/jpeg"; // default
        if (resourceType === "video") {
          if (
            ["mp3", "wav", "aac", "ogg", "flac", "m4a"].includes(fileExtension)
          ) {
            // Audio files
            mimeType =
              fileExtension === "mp3"
                ? "audio/mpeg"
                : fileExtension === "wav"
                ? "audio/wav"
                : fileExtension === "aac"
                ? "audio/aac"
                : fileExtension === "ogg"
                ? "audio/ogg"
                : fileExtension === "flac"
                ? "audio/flac"
                : fileExtension === "m4a"
                ? "audio/mp4"
                : "audio/mpeg";
          } else {
            // Video files
            mimeType = "video/mp4";
          }
        } else if (fileExtension === "png") {
          mimeType = "image/png";
        } else if (fileExtension === "gif") {
          mimeType = "image/gif";
        } else if (fileExtension === "webp") {
          mimeType = "image/webp";
        }

        const fileName = `${folder}_${Date.now()}.${fileExtension}`;

        formData.append("file", {
          uri: fileUri,
          type: mimeType,
          name: fileName,
        } as any);
      }

      // Add upload parameters
      formData.append("upload_preset", this.uploadPreset);

      // Add resource type for videos
      if (resourceType === "video") {
        formData.append("resource_type", "video");
      }

      // Optional parameters - only add folder if it's different from default
      if (folder && folder !== "profile_pictures") {
        formData.append("folder", folder);
      }

      // Choose the correct upload URL based on resource type
      const uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/${resourceType}/upload`;

      console.log("Uploading to Cloudinary:", {
        url: uploadUrl,
        cloudName: this.cloudName,
        uploadPreset: this.uploadPreset,
        folder: folder,
        resourceType: resourceType,
      });

      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Cloudinary upload failed:", {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText,
          resourceType: resourceType,
        });

        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          throw new Error(
            `HTTP error! status: ${response.status}, response: ${errorText}`
          );
        }

        throw new Error(
          errorData.error?.message || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();
      console.log(
        `✅ ${resourceType} uploaded successfully:`,
        result.secure_url
      );

      return {
        success: true,
        url: result.secure_url,
      };
    } catch (error) {
      console.error(`❌ Cloudinary ${resourceType} upload error:`, error);

      // For videos, don't try image fallback
      if (resourceType === "video") {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Video upload failed",
        };
      }

      // Try simple upload as fallback for images only
      console.log("Trying simple upload as fallback...");
      const fallbackResult = await this.uploadImageSimple(fileUri);
      if (fallbackResult.success) {
        return fallbackResult;
      }

      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
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
          error: "Cloudinary configuration is missing",
        };
      }

      console.log("Simple upload attempt for:", imageUri.substring(0, 100));

      const formData = new FormData();

      // Check if we're running on web or mobile
      const isWeb = typeof window !== "undefined";

      if (isWeb) {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        formData.append("file", blob);
      } else {
        formData.append("file", {
          uri: imageUri,
          type: "image/jpeg",
          name: "upload.jpg",
        } as any);
      }

      formData.append("upload_preset", this.uploadPreset);

      const uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;

      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Simple upload failed:", result);
        throw new Error(result.error?.message || "Upload failed");
      }

      return {
        success: true,
        url: result.secure_url,
      };
    } catch (error) {
      console.error("Simple upload error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      };
    }
  }

  /**
   * Upload profile picture - convenient method that handles the entire flow
   */
  async uploadProfilePicture(imageUri: string): Promise<CloudinaryResponse> {
    return this.uploadImage(imageUri, "profile_pictures");
  }

  /**
   * Upload profile picture with picker - convenient method that handles the entire flow
   */
  async uploadProfilePictureWithPicker(
    source: "camera" | "gallery"
  ): Promise<CloudinaryResponse> {
    try {
      let result: ImagePicker.ImagePickerResult | null = null;

      if (source === "camera") {
        result = await this.takePhotoWithCamera();
      } else {
        result = await this.pickImageFromGallery();
      }

      if (
        !result ||
        result.canceled ||
        !result.assets ||
        result.assets.length === 0
      ) {
        return {
          success: false,
          error: "Image selection was cancelled",
        };
      }

      const imageUri = result.assets[0].uri;
      return await this.uploadProfilePicture(imageUri);
    } catch (error) {
      console.error("Profile picture upload error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
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
        throw new Error("Media library permission denied");
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
      console.error("Error picking multiple images from gallery:", error);
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
        throw new Error("Camera permission denied");
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
      console.error("Error taking evidence photo with camera:", error);
      return null;
    }
  }

  /**
   * Upload multiple evidence files
   */
  async uploadMultipleEvidence(
    imageUris: string[]
  ): Promise<CloudinaryResponse[]> {
    const uploadPromises = imageUris.map((uri) => this.uploadEvidence(uri));
    return Promise.all(uploadPromises);
  }

  /**
   * Extract public ID from Cloudinary URL
   */
  private extractPublicIdFromUrl(cloudinaryUrl: string): { publicId: string; resourceType: string } | null {
    try {
      // Example URL: https://res.cloudinary.com/cloudname/image/upload/v1234567890/folder/filename.jpg
      // Or: https://res.cloudinary.com/cloudname/video/upload/v1234567890/folder/filename.mp4
      
      const url = new URL(cloudinaryUrl);
      const pathParts = url.pathname.split('/');
      
      // Find cloudname, resource type, and upload type
      const cloudNameIndex = pathParts.findIndex(part => part === this.cloudName);
      if (cloudNameIndex === -1) return null;
      
      const resourceType = pathParts[cloudNameIndex + 1]; // 'image', 'video', etc.
      const uploadType = pathParts[cloudNameIndex + 2]; // 'upload'
      
      if (uploadType !== 'upload') return null;
      
      // Everything after upload/ is the public ID (including version and folder)
      const publicIdParts = pathParts.slice(cloudNameIndex + 3);
      
      // Remove version if present (starts with 'v' followed by numbers)
      if (publicIdParts.length > 0 && /^v\d+$/.test(publicIdParts[0])) {
        publicIdParts.shift();
      }
      
      // Join the remaining parts and remove file extension
      let publicId = publicIdParts.join('/');
      
      // Remove file extension
      const lastDotIndex = publicId.lastIndexOf('.');
      if (lastDotIndex > publicId.lastIndexOf('/')) {
        publicId = publicId.substring(0, lastDotIndex);
      }
      
      return { publicId, resourceType };
    } catch (error) {
      console.error('Error extracting public ID from URL:', error);
      return null;
    }
  }

  /**
   * Generate signature for Cloudinary API requests
   */  private generateSignature(params: Record<string, any>, apiSecret: string): string {
    try {
      // For deletion, we need to include the parameters we're sending in the request
      // Based on the example and error logs, we need public_id and timestamp
      const sortedParams = Object.keys(params)
        .filter(key => key !== 'file' && key !== 'api_key' && key !== 'resource_type' && key !== 'cloud_name')
        .sort()
        .map(key => `${key}=${params[key]}`)
        .join('&');

      // Add API secret directly to the parameter string (no separator)
      const stringToSign = sortedParams + apiSecret;

      console.log('🔐 String to sign:', stringToSign);
      console.log('🔐 String to sign length:', stringToSign.length);

      // Generate SHA-1 hash - try multiple methods for React Native compatibility
      let signature = '';

      // Method 1: Standard crypto-js with explicit hex
      try {
        const hash = CryptoJS.SHA1(stringToSign);
        signature = hash.toString(CryptoJS.enc.Hex);
        console.log('🔐 Method 1 signature:', signature, 'length:', signature.length);
      } catch (e) {
        console.warn('Method 1 failed:', e);
      }

      // Method 2: Standard crypto-js with default toString
      if (!signature || signature.length !== 40) {
        try {
          signature = CryptoJS.SHA1(stringToSign).toString();
          console.log('🔐 Method 2 signature:', signature, 'length:', signature.length);
        } catch (e) {
          console.warn('Method 2 failed:', e);
        }
      }

      // Method 3: Alternative crypto library if available
      if (!signature || signature.length !== 40) {
        try {
          if (alternateCrypto && alternateCrypto.SHA1) {
            signature = alternateCrypto.SHA1(stringToSign).toString();
            console.log('🔐 Method 3 signature:', signature, 'length:', signature.length);
          }
        } catch (e) {
          console.warn('Method 3 failed:', e);
        }
      }

      console.log('🔐 Generated signature:', signature);
      console.log('🔐 Signature length:', signature.length);
      
      // Ensure we have a proper 40-character hex string
      if (signature.length !== 40) {
        console.error('❌ Invalid signature length! Expected 40, got:', signature.length);
        console.error('❌ Signature:', signature);
        // Fallback: try with toString()
        const fallbackSignature = CryptoJS.SHA1(stringToSign).toString();
        console.log('� Fallback signature:', fallbackSignature);
        return fallbackSignature;
      }
      
      return signature;
    } catch (error) {
      console.error('❌ Error generating signature:', error);
      // Fallback to a simple hash for debugging
      const fallbackSignature = CryptoJS.SHA1('test').toString();
      console.log('🔄 Fallback test signature:', fallbackSignature);
      throw error;
    }
  }

  /**
   * Delete a file from Cloudinary using the file URL
   */
  async deleteFileByUrl(cloudinaryUrl: string): Promise<CloudinaryResponse> {
    try {
      if (!this.cloudName || !this.apiKey) {
        return {
          success: false,
          error: 'Cloudinary configuration is missing for deletion operations'
        };
      }

      if (!this.apiSecret) {
        return {
          success: false,
          error: 'Cloudinary API secret is missing - required for deletion operations'
        };
      }

      console.log('🗑️ Attempting to delete file from Cloudinary:', cloudinaryUrl);
      console.log('🔑 Using API Key:', this.apiKey.substring(0, 8) + '...');
      console.log('🔐 API Secret available:', this.apiSecret ? 'Yes' : 'No');
      console.log('🔐 API Secret length:', this.apiSecret?.length || 0);

      // Extract public ID and resource type from URL
      const extracted = this.extractPublicIdFromUrl(cloudinaryUrl);
      if (!extracted) {
        return {
          success: false,
          error: 'Could not extract public ID from Cloudinary URL'
        };
      }

      const { publicId, resourceType } = extracted;
      console.log('🔍 Extracted public ID:', publicId, 'Resource type:', resourceType);

      // For client-side deletion, we'll use the unsigned delete approach
      // Note: This requires your Cloudinary account to allow unsigned deletes for the resource type
      
      const timestamp = Math.floor(Date.now() / 1000);
      const params = {
        public_id: publicId,
        timestamp: timestamp,
        api_key: this.apiKey
      };

      console.log('📋 Deletion parameters:', {
        public_id: publicId,
        timestamp: timestamp,
        api_key: this.apiKey.substring(0, 8) + '...'
      });

      // Note: For security reasons, actual signature generation should be done on the backend
      // This is a simplified approach for demonstration
      const signature = this.generateSignature(params, this.apiSecret || '');

      const formData = new FormData();
      formData.append('public_id', publicId);
      formData.append('timestamp', timestamp.toString());
      formData.append('api_key', this.apiKey);
      formData.append('signature', signature);

      const deleteUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/${resourceType}/destroy`;
      console.log('🌐 Delete URL:', deleteUrl);

      const response = await fetch(deleteUrl, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('❌ Cloudinary deletion failed:', result);
        return {
          success: false,
          error: result.error?.message || 'Failed to delete file from Cloudinary'
        };
      }

      if (result.result === 'ok') {
        console.log('✅ File deleted successfully from Cloudinary:', publicId);
        return {
          success: true
        };
      } else {
        console.warn('⚠️ Cloudinary deletion result:', result.result);
        return {
          success: false,
          error: `Deletion failed: ${result.result}`
        };
      }

    } catch (error) {
      console.error('❌ Error deleting file from Cloudinary:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred during deletion'
      };
    }
  }

  /**
   * Delete an image from Cloudinary (deprecated - use deleteFileByUrl instead)
   */
  async deleteImage(publicId: string): Promise<CloudinaryResponse> {
    console.warn('deleteImage is deprecated. Use deleteFileByUrl instead.');
    
    // For backward compatibility, construct a URL and use the new method
    const imageUrl = `https://res.cloudinary.com/${this.cloudName}/image/upload/${publicId}`;
    return this.deleteFileByUrl(imageUrl);
  }

  /**
   * Generate transformation URL for different image sizes
   */
  generateImageUrl(publicId: string, transformation?: string): string {
    if (!this.cloudName) {
      return "";
    }

    const baseUrl = `https://res.cloudinary.com/${this.cloudName}/image/upload/`;
    const transformationPart = transformation ? `${transformation}/` : "";

    return `${baseUrl}${transformationPart}${publicId}`;
  }

  /**
   * Generate common profile picture transformations
   */
  getProfilePictureUrl(
    publicId: string,
    size: "small" | "medium" | "large" = "medium"
  ): string {
    const transformations = {
      small: "w_100,h_100,c_fill,g_face,f_auto,q_auto",
      medium: "w_200,h_200,c_fill,g_face,f_auto,q_auto",
      large: "w_400,h_400,c_fill,g_face,f_auto,q_auto",
    };

    return this.generateImageUrl(publicId, transformations[size]);
  }
}

// Create and export a singleton instance
const cloudinaryService = new CloudinaryService();
export default cloudinaryService;
