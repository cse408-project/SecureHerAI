import * as ImagePicker from 'expo-image-picker';
import CryptoJS from 'crypto-js';
import { Platform } from 'react-native';
import mime from 'mime';

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
  publicId?: string;
  format?: string;
  metadata?: any;
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
   * Upload evidence for reports - handles images, videos, audio files, and documents
   */
  async uploadEvidence(fileUri: string): Promise<CloudinaryResponse> {
    try {
      // For blob URIs (web), we need to check the actual blob MIME type
      let resourceType: "image" | "video" | "raw" = "image";

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
            } else if (
              blob.type.startsWith("application/") ||
              blob.type.startsWith("text/")
            ) {
              resourceType = "raw"; // Documents go under 'raw' resource type
            }
          }
        } catch {
          console.warn(
            "Could not fetch blob for MIME type detection, falling back to URI analysis"
          );
        }
      } else {
        // For file URIs, use the enhanced detection methods
        resourceType = this.getResourceType(fileUri);
      }

      console.log(
        `Uploading evidence with resource type: ${resourceType} for URI: ${fileUri.substring(
          0,
          100
        )} on platform: ${Platform.OS}`
      );

      // For Android, try the specialized method first for all file types
      if (Platform.OS === 'android') {
        console.log("🤖 Trying Android-specific upload first...");
        try {
          const androidResult = await this.uploadFileAndroid(fileUri, "report_evidence", resourceType);
          if (androidResult.success) {
            console.log(`✅ Android-specific ${resourceType} upload successful`);
            return androidResult;
          }
        } catch (androidError) {
          console.log(`🔧 Android-specific ${resourceType} method failed, falling back to general method:`, androidError);
        }
      }

      return this.uploadFile(fileUri, "report_evidence", resourceType);
    } catch (error) {
      console.error("Error in uploadEvidence:", error);
      // Fallback to image if there's any error in detection
      return this.uploadFile(fileUri, "report_evidence", "image");
    }
  }

  /**
   * Get the correct MIME type for a file URI - critical for Android
   */
  private getMimeType(uri: string, resourceType: "image" | "video" | "raw" = "image"): string {
    try {
      // First, try to get MIME type from the uri using the mime package
      const detectedMimeType = mime.getType(uri);
      
      if (detectedMimeType) {
        console.log("📋 Detected MIME type from uri:", detectedMimeType);
        return detectedMimeType;
      }

      // Fallback to manual detection based on file extension
      const fileExtension = uri.split(".").pop()?.toLowerCase();
      
      if (!fileExtension) {
        return resourceType === "video" ? "video/mp4" : 
               resourceType === "raw" ? "application/octet-stream" : "image/jpeg";
      }

      // Manual MIME type mapping for better Android compatibility
      const mimeMap: { [key: string]: string } = {
        // Images
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'bmp': 'image/bmp',
        'svg': 'image/svg+xml',
        'tiff': 'image/tiff',
        'ico': 'image/x-icon',
        
        // Videos
        'mp4': 'video/mp4',
        'mov': 'video/mov',
        'avi': 'video/avi',
        'webm': 'video/webm',
        'flv': 'video/flv',
        'wmv': 'video/wmv',
        '3gp': 'video/3gpp',
        'mkv': 'video/mkv',
        'm4v': 'video/mp4',
        
        // Audio
        'mp3': 'audio/mpeg',
        'wav': 'audio/wav',
        'aac': 'audio/aac',
        'ogg': 'audio/ogg',
        'flac': 'audio/flac',
        'm4a': 'audio/mp4',
        'wma': 'audio/wma',
        'opus': 'audio/opus',
        'amr': 'audio/amr',
        
        // Documents
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'txt': 'text/plain',
        'rtf': 'application/rtf',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'ppt': 'application/vnd.ms-powerpoint',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'csv': 'text/csv'
      };

      const mimeType = mimeMap[fileExtension];
      
      if (mimeType) {
        console.log("📋 Manual MIME type for", fileExtension, ":", mimeType);
        return mimeType;
      }

      // Final fallback
      const fallbackMimeType = resourceType === "video" ? "video/mp4" : 
                              resourceType === "raw" ? "application/octet-stream" : "image/jpeg";
      console.log("📋 Fallback MIME type:", fallbackMimeType);
      return fallbackMimeType;

    } catch (error) {
      console.error("Error detecting MIME type:", error);
      return resourceType === "video" ? "video/mp4" : 
             resourceType === "raw" ? "application/octet-stream" : "image/jpeg";
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
      lowerUri.includes(".wmv") ||
      lowerUri.includes(".3gp") ||
      lowerUri.includes(".mkv") ||
      lowerUri.includes(".m4v")
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
      lowerUri.includes(".m4a") ||
      lowerUri.includes(".wma") ||
      lowerUri.includes(".opus") ||
      lowerUri.includes(".amr") ||
      lowerUri.includes(".3gp")
    );
  }

  /**
   * Check if the file is a document based on URI or extension
   */
  private isDocumentFile(uri: string): boolean {
    const lowerUri = uri.toLowerCase();
    return (
      lowerUri.includes(".pdf") ||
      lowerUri.includes(".doc") ||
      lowerUri.includes(".docx") ||
      lowerUri.includes(".txt") ||
      lowerUri.includes(".rtf") ||
      lowerUri.includes(".xls") ||
      lowerUri.includes(".xlsx") ||
      lowerUri.includes(".ppt") ||
      lowerUri.includes(".pptx") ||
      lowerUri.includes(".csv")
    );
  }

  /**
   * Get the appropriate resource type for a file
   */
  private getResourceType(uri: string): "image" | "video" | "raw" {
    if (this.isVideoFile(uri) || this.isAudioFile(uri)) {
      return "video"; // Cloudinary handles audio under video resource type
    } else if (this.isDocumentFile(uri)) {
      return "raw"; // Documents go under raw resource type
    } else {
      return "image"; // Default to image
    }
  }

  /**
   * Generic file upload method that handles images, videos, audio, and documents
   */
  async uploadFile(
    fileUri: string,
    folder: string = "profile_pictures",
    resourceType: "image" | "video" | "raw" = "image"
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

        // Use our improved MIME type detection - CRITICAL for Android
        const mimeType = this.getMimeType(fileUri, resourceType);
        const fileName = `${folder}_${Date.now()}.${fileExtension}`;

        console.log("📱 Mobile FormData:", {
          uri: fileUri.substring(0, 100),
          type: mimeType,
          name: fileName,
          fileExtension: fileExtension,
          resourceType: resourceType,
          platform: Platform.OS
        });

        // CRITICAL: Platform-specific file object structure for React Native
        // Android requires a specific format to avoid "Network request failed" errors
        if (Platform.OS === 'android') {
          // Android-specific file object structure
          formData.append("file", {
            uri: fileUri,
            type: mimeType,
            name: fileName,
          } as any);
        } else {
          // iOS and other platforms
          formData.append("file", {
            uri: fileUri,
            type: mimeType,
            name: fileName,
          } as any);
        }
      }

      // Add upload parameters
      formData.append("upload_preset", this.uploadPreset);

      // Add resource type for non-image files
      if (resourceType !== "image") {
        formData.append("resource_type", resourceType);
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

      // CRITICAL: For React Native, don't set Content-Type header - let the system handle it
      const fetchOptions: RequestInit = {
        method: "POST",
        body: formData,
      };

      // Platform-specific fetch options
      if (isWeb) {
        // For web, let the browser set the Content-Type header automatically for FormData
        // This ensures proper boundary parameters are included
      } else {
        // For React Native, especially Android, we might need to be more explicit
        // But don't set Content-Type for FormData - this causes issues
        if (Platform.OS === 'android') {
          // Android-specific fetch options
          // Ensure we don't set Content-Type header as it interferes with FormData
          console.log("📱 Using Android-specific fetch configuration");
        }
      }

      console.log("🚀 Fetch options:", {
        method: fetchOptions.method,
        hasBody: !!fetchOptions.body,
        headers: fetchOptions.headers || "none",
        platform: Platform.OS
      });

      // Add timeout and retry logic for better reliability on mobile
      const timeoutDuration = Platform.OS === 'android' ? 90000 : 60000; // Longer timeout for Android
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Upload timeout after ${timeoutDuration/1000} seconds`)), timeoutDuration)
      );

      const uploadPromise = fetch(uploadUrl, fetchOptions);
      
      console.log("📡 Starting upload request...");
      const response = await Promise.race([uploadPromise, timeoutPromise]);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Cloudinary upload failed:", {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText,
          resourceType: resourceType,
          platform: Platform.OS,
          url: uploadUrl
        });

        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          // If it's not JSON, create a generic error message based on status
          const statusErrorMessages: { [key: number]: string } = {
            400: "Bad request - check your upload parameters",
            401: "Unauthorized - check your Cloudinary credentials",
            403: "Forbidden - check your upload preset permissions",
            413: "File too large - reduce file size and try again",
            415: "Unsupported media type - check file format",
            429: "Rate limit exceeded - please try again later",
            500: "Cloudinary server error - please try again later"
          };

          const errorMessage = statusErrorMessages[response.status] || 
            `HTTP error! status: ${response.status}, response: ${errorText}`;

          throw new Error(errorMessage);
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
      console.error("📊 Upload context:", {
        fileUri: fileUri.substring(0, 100),
        folder: folder,
        resourceType: resourceType,
        platform: Platform.OS,
        cloudName: this.cloudName,
        uploadPreset: this.uploadPreset,
        isWeb: typeof window !== "undefined"
      });

      // Android-specific error handling
      if (Platform.OS === 'android' && error instanceof Error) {
        if (error.message.includes('Network request failed')) {
          console.log("🔧 Android network error detected, trying Android-specific method...");
          
          // For Android, try the specialized Android upload method
          try {
            const androidResult = await this.uploadFileAndroid(fileUri, folder, resourceType);
            if (androidResult.success) {
              console.log("✅ Android-specific upload successful");
              return androidResult;
            }
          } catch (androidError) {
            console.error("❌ Android-specific method also failed:", androidError);
            
            // Last resort: try simple upload (only for images)
            if (resourceType === "image") {
              try {
                const fallbackResult = await this.uploadImageSimple(fileUri);
                if (fallbackResult.success) {
                  console.log("✅ Simple upload fallback successful");
                  return fallbackResult;
                }
              } catch (simpleError) {
                console.error("❌ All Android upload methods failed:", simpleError);
              }
            }
          }
        }
      }

      // For videos and documents, don't try image fallback
      if (resourceType === "video" || resourceType === "raw") {
        return {
          success: false,
          error: error instanceof Error ? error.message : `${resourceType} upload failed`,
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
   * Android-specific upload method with enhanced compatibility for all file types
   */
  async uploadFileAndroid(fileUri: string, folder: string = "profile_pictures", resourceType: "image" | "video" | "raw" = "image"): Promise<CloudinaryResponse> {
    try {
      if (!this.cloudName || !this.uploadPreset) {
        return {
          success: false,
          error: "Cloudinary configuration is missing",
        };
      }

      console.log("🤖 Using Android-specific upload method for:", fileUri.substring(0, 100), "Resource type:", resourceType);

      const formData = new FormData();
      
      // Use simpler file object for Android
      const fileExtension = fileUri.split(".").pop()?.toLowerCase() || 
        (resourceType === "video" ? "mp4" : resourceType === "raw" ? "pdf" : "jpg");
      const fileName = `android_${resourceType}_${Date.now()}.${fileExtension}`;
      
      // Enhanced MIME type detection for Android
      let mimeType = this.getMimeType(fileUri, resourceType as "image" | "video");
      
      // Override with simplified MIME types for better Android compatibility
      if (resourceType === "video") {
        if (["mp4", "mov", "avi", "webm"].includes(fileExtension)) {
          mimeType = fileExtension === "webm" ? "video/webm" : "video/mp4";
        } else if (["mp3", "wav", "aac", "ogg", "flac", "m4a", "3gp"].includes(fileExtension)) {
          // Audio files uploaded as video resource type
          mimeType = fileExtension === "wav" ? "audio/wav" : 
                     fileExtension === "mp3" ? "audio/mpeg" :
                     fileExtension === "aac" ? "audio/aac" :
                     fileExtension === "ogg" ? "audio/ogg" :
                     fileExtension === "flac" ? "audio/flac" :
                     fileExtension === "m4a" ? "audio/mp4" :
                     fileExtension === "3gp" ? "video/3gpp" : "audio/mpeg";
        }
      } else if (resourceType === "raw") {
        // Document files
        if (fileExtension === "pdf") mimeType = "application/pdf";
        else if (fileExtension === "doc") mimeType = "application/msword";
        else if (fileExtension === "docx") mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        else if (fileExtension === "txt") mimeType = "text/plain";
        else if (fileExtension === "csv") mimeType = "text/csv";
        else mimeType = "application/octet-stream";
      } else {
        // Image files
        if (fileExtension === "png") mimeType = "image/png";
        else if (fileExtension === "gif") mimeType = "image/gif";
        else if (fileExtension === "webp") mimeType = "image/webp";
        else if (fileExtension === "jpeg" || fileExtension === "jpg") mimeType = "image/jpeg";
      }

      console.log("🤖 Android file details:", {
        fileExtension,
        fileName,
        mimeType,
        resourceType,
        originalUri: fileUri.substring(0, 100)
      });

      // Android-optimized file object structure
      formData.append("file", {
        uri: fileUri,
        name: fileName,
        type: mimeType,
      } as any);

      formData.append("upload_preset", this.uploadPreset);
      
      // Add resource type for non-image files
      if (resourceType !== "image") {
        formData.append("resource_type", resourceType);
      }
      
      // For audio files (including 3GP), use 'auto' to let Cloudinary detect correctly
      if (["mp3", "wav", "aac", "ogg", "flac", "m4a", "3gp"].includes(fileExtension)) {
        console.log("🎵 Audio file detected, using resource_type: auto for:", fileExtension);
        formData.append("resource_type", "auto");
      }
      
      if (folder && folder !== "profile_pictures") {
        formData.append("folder", folder);
      }

      // Choose correct upload endpoint based on resource type
      const uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/${resourceType}/upload`;

      console.log("🤖 Android upload config:", {
        url: uploadUrl,
        fileName,
        mimeType,
        folder,
        resourceType
      });

      // Android-specific timeout for larger files
      const timeoutDuration = resourceType === "video" ? 120000 : 
                             resourceType === "raw" ? 90000 : 60000; // Different timeouts based on file type
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Android upload timeout after ${timeoutDuration/1000} seconds`)), timeoutDuration)
      );

      const uploadPromise = fetch(uploadUrl, {
        method: "POST",
        body: formData,
        // Explicitly no headers - let Android handle it for proper multipart boundaries
      });

      console.log("📡 Starting Android upload request...");
      const response = await Promise.race([uploadPromise, timeoutPromise]);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("🤖 Android upload failed:", {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText,
          resourceType: resourceType
        });
        throw new Error(`Android upload failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log("✅ Android upload successful:", result.secure_url);

      return {
        success: true,
        url: result.secure_url,
      };
    } catch (error) {
      console.error("❌ Android upload error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Android upload failed",
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
      const isWeb = typeof window !== "undefined" && typeof window.navigator !== "undefined";

      if (isWeb) {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        formData.append("file", blob);
      } else {
        // For React Native - platform-specific file handling
        const fileExtension = imageUri.split(".").pop()?.toLowerCase() || "jpg";
        const mimeType = this.getMimeType(imageUri, "image");
        const fileName = `simple_upload_${Date.now()}.${fileExtension}`;

        console.log("📱 Simple upload file object:", {
          uri: imageUri.substring(0, 100),
          type: mimeType,
          name: fileName,
          platform: Platform.OS
        });

        // Platform-specific file object structure
        if (Platform.OS === 'android') {
          // Android-specific approach - sometimes needs different handling
          formData.append("file", {
            uri: imageUri,
            type: mimeType,
            name: fileName,
          } as any);
        } else {
          // iOS and other platforms
          formData.append("file", {
            uri: imageUri,
            type: mimeType,
            name: fileName,
          } as any);
        }
      }

      formData.append("upload_preset", this.uploadPreset);

      const uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;

      // Platform-specific fetch configuration
      const fetchConfig: RequestInit = {
        method: "POST",
        body: formData,
      };

      // Don't set Content-Type header for FormData - let the system handle it
      // This is especially important for Android
      const response = await fetch(uploadUrl, fetchConfig);

      const result = await response.json();

      if (!response.ok) {
        console.error("Simple upload failed:", result);
        throw new Error(result.error?.message || "Upload failed");
      }

      console.log("✅ Simple upload successful:", result.secure_url);

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
   * Upload profile picture - convenient method that handles the entire flow with Android optimization
   */
  async uploadProfilePicture(imageUri: string): Promise<CloudinaryResponse> {
    try {
      console.log(
        `📷 Uploading profile picture on platform: ${Platform.OS} for URI: ${imageUri.substring(
          0,
          100
        )}`
      );

      // For Android, use the same robust approach as evidence upload
      if (Platform.OS === 'android') {
        console.log("🤖 Trying Android-specific profile picture upload first...");
        try {
          const androidResult = await this.uploadFileAndroid(imageUri, "profile_pictures", "image");
          if (androidResult.success) {
            console.log("✅ Android-specific profile picture upload successful");
            return androidResult;
          }
        } catch (androidError) {
          console.log("🔧 Android-specific profile picture method failed, falling back to general method:", androidError);
        }
      }

      // Fall back to the standard method
      return this.uploadImage(imageUri, "profile_pictures");
    } catch (error) {
      console.error("Error in uploadProfilePicture:", error);
      // Final fallback to simple upload
      return this.uploadImageSimple(imageUri);
    }
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
   * Pick multiple files from gallery for evidence (including videos and documents)
   */
  async pickMultipleFilesFromGallery(): Promise<ImagePicker.ImagePickerResult | null> {
    try {
      const hasPermission = await this.requestMediaLibraryPermissions();
      if (!hasPermission) {
        throw new Error("Media library permission denied");
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All, // Allow all file types
        allowsMultipleSelection: true,
        quality: 0.8,
        base64: false,
      });

      return result;
    } catch (error) {
      console.error("Error picking files from gallery:", error);
      return null;
    }
  }

  /**
   * Pick a video from gallery
   */
  async pickVideoFromGallery(): Promise<ImagePicker.ImagePickerResult | null> {
    try {
      const hasPermission = await this.requestMediaLibraryPermissions();
      if (!hasPermission) {
        throw new Error("Media library permission denied");
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false, // Don't edit videos
        quality: 0.8,
        base64: false,
      });

      return result;
    } catch (error) {
      console.error("Error picking video from gallery:", error);
      return null;
    }
  }

  /**
   * Record a video with camera
   */
  async recordVideoWithCamera(): Promise<ImagePicker.ImagePickerResult | null> {
    try {
      const hasPermission = await this.requestCameraPermissions();
      if (!hasPermission) {
        throw new Error("Camera permission denied");
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 0.8,
        base64: false,
      });

      return result;
    } catch (error) {
      console.error("Error recording video with camera:", error);
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
   * Test video upload connectivity and Android compatibility
   */
  async testVideoUpload(): Promise<{ success: boolean; message: string; platform: string }> {
    try {
      const platform = Platform.OS;
      
      if (!this.cloudName || !this.uploadPreset) {
        return {
          success: false,
          message: "Cloudinary configuration is missing",
          platform
        };
      }

      console.log(`🎬 Testing video upload on ${platform}...`);

      // For mobile platforms, we'll try to create a minimal test
      if (platform === 'android') {
        // Test Android-specific video upload capability
        const testFormData = new FormData();
        testFormData.append("upload_preset", this.uploadPreset);
        testFormData.append("resource_type", "video");
        
        // Create a minimal test video data (1-second silent video in base64)
        const testVideoDataUrl = "data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAABCJtZGF0AAACrgYF//+q3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE1NSByMjkxNyAwYWY4YWMzIC0gSC4yNjQvTVBFRy00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMtMjAxOCAtIGh0dHA6Ly93d3cudmlkZW9sYW4ub3JnL3gyNjQuaHRtbCAtIG9wdGlvbnM6IGNhYmFjPTEgcmVmPTMgZGVibG9jaz0xOjA6MCBhbmFseXNlPTB4Mzo2eDN0cmVsbGlzLTEgbWU9aGV4IHN1Ym1lPTcgcHN5PTEgcHN5X3JkPTEuMDA6MC4wMCBtaXhlZF9yZWY9MSBtZV9yYW5nZT0xNiBjaHJvbWFfbWU9MSB0cmVsbGlzXzEgOGRjdD0xIGNxbT0wIGRlYWR6b25lPTIxLDExIGZhc3RfcHNraXA9MSBjaHJvbWFfcXBfb2Zmc2V0PS0yIHRocmVhZHM9MSBsb29rYWhlYWRfdGhyZWFkcz0xIHNsaWNlZF90aHJlYWRzPTAgbnI9MCBkZWNpbWF0ZT0xIGludGVybGFjZWQ9MCBibHVyYXlfY29tcGF0PTAgY29uc3RyYWluZWRfaW50cmE9MCBiZnJhbWVzPTMgYl9weXJhbWlkPTIgYl9hZGFwdD0xIGJfYmlhcz0wIGRpcmVjdD0xIHdlaWdodGI9MSBvcGVuX2dvcD0wIHdlaWdodHA9MiBrZXlpbnQ9MjUwIGtleWludF9taW49MjUgc2NlbmVjdXQ9NDAgaW50cmFfcmVmcmVzaD0wIHJjX2xvb2thaGVhZD00MCByYz1jcmYgbWJ0cmVlPTEgY3JmPTIzLjAgcWNvbXA9MC42MCBxcG1pbj0wIHFwbWF4PTY5IHFwc3RlcD00IGlwX3JhdGlvPTEuNDA=";
        
        testFormData.append("file", {
          uri: testVideoDataUrl,
          name: "test_video.mp4",
          type: "video/mp4",
        } as any);

        const testUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/video/upload`;
        
        console.log(`🧪 Testing Android video upload to:`, testUrl);
        
        const response = await fetch(testUrl, {
          method: "POST",
          body: testFormData,
        });

        if (response.ok) {
          const result = await response.json();
          console.log("✅ Android video upload test successful:", result.secure_url);
          
          // Clean up test video
          try {
            await this.deleteFileByUrl(result.secure_url);
          } catch (deleteError) {
            console.warn("Could not delete test video:", deleteError);
          }
          
          return {
            success: true,
            message: "Android video upload test successful",
            platform
          };
        } else {
          const errorText = await response.text();
          return {
            success: false,
            message: `Android video upload test failed: ${response.status} - ${errorText}`,
            platform
          };
        }
      } else {
        return {
          success: true,
          message: "Video upload testing not implemented for this platform yet",
          platform
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Video upload test failed",
        platform: Platform.OS
      };
    }
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

  /**
   * Dedicated video upload method with enhanced Android compatibility
   * This method is specifically optimized for video uploads on Android
   */
  async uploadVideo(
    videoUri: string, 
    folder: string = "videos",
    options: {
      timeout?: number;
      retryAttempts?: number;
      compressionQuality?: number;
    } = {}
  ): Promise<CloudinaryResponse> {
    const {
      timeout = Platform.OS === 'android' ? 180000 : 120000, // 3 minutes for Android, 2 for others
      retryAttempts = 2,
      compressionQuality = 0.8
    } = options;

    console.log(`🎬 Starting dedicated video upload for ${Platform.OS}:`, {
      uri: videoUri.substring(0, 100),
      folder,
      timeout: timeout / 1000 + 's',
      retryAttempts,
      compressionQuality
    });

    // Validate video URI
    if (!videoUri || typeof videoUri !== "string") {
      return {
        success: false,
        error: "Invalid video URI provided",
      };
    }

    // Validate Cloudinary configuration
    if (!this.cloudName || !this.uploadPreset) {
      return {
        success: false,
        error: "Cloudinary configuration is missing",
      };
    }

    // Verify it's actually a video file
    if (!this.isVideoFile(videoUri)) {
      console.warn("⚠️ File might not be a video, URI:", videoUri.substring(0, 100));
    }

    let lastError: Error | null = null;

    // Retry logic for better reliability
    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        console.log(`🎯 Video upload attempt ${attempt}/${retryAttempts}`);

        // For Android, always try the specialized method first
        if (Platform.OS === 'android') {
          console.log("🤖 Using Android-optimized video upload method");
          
          const androidResult = await this.uploadVideoAndroid(videoUri, folder, {
            timeout,
            compressionQuality
          });
          
          if (androidResult.success) {
            console.log("✅ Android video upload successful on attempt", attempt);
            return androidResult;
          } else {
            console.log(`🔧 Android method failed on attempt ${attempt}:`, androidResult.error);
            lastError = new Error(androidResult.error || "Android upload failed");
          }
        } else {
          // For iOS and other platforms, use the general method
          console.log("📱 Using general video upload method");
          
          const generalResult = await this.uploadFile(videoUri, folder, "video");
          
          if (generalResult.success) {
            console.log("✅ General video upload successful on attempt", attempt);
            return generalResult;
          } else {
            console.log(`🔧 General method failed on attempt ${attempt}:`, generalResult.error);
            lastError = new Error(generalResult.error || "General upload failed");
          }
        }

        // Wait before retry (exponential backoff)
        if (attempt < retryAttempts) {
          const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`⏳ Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }

      } catch (error) {
        console.error(`❌ Video upload attempt ${attempt} failed:`, error);
        lastError = error instanceof Error ? error : new Error("Unknown error");
        
        if (attempt < retryAttempts) {
          const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`⏳ Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    // All attempts failed
    console.error("❌ All video upload attempts failed");
    return {
      success: false,
      error: lastError?.message || "Video upload failed after all retry attempts",
    };
  }

  /**
   * Android-specific video upload method with maximum compatibility
   */
  private async uploadVideoAndroid(
    videoUri: string,
    folder: string = "videos",
    options: {
      timeout?: number;
      compressionQuality?: number;
    } = {}
  ): Promise<CloudinaryResponse> {
    const { timeout = 180000, compressionQuality = 0.8 } = options;
    
    try {
      console.log("🤖 Android video upload starting with enhanced options");

      const formData = new FormData();
      
      // Get file extension and create proper file name
      const fileExtension = videoUri.split(".").pop()?.toLowerCase() || "mp4";
      const fileName = `android_video_${Date.now()}.${fileExtension}`;
      
      // Enhanced MIME type detection for video files
      let mimeType = "video/mp4"; // Default fallback
      
      if (fileExtension === "mp4") mimeType = "video/mp4";
      else if (fileExtension === "mov") mimeType = "video/quicktime";
      else if (fileExtension === "avi") mimeType = "video/x-msvideo";
      else if (fileExtension === "webm") mimeType = "video/webm";
      else if (fileExtension === "mkv") mimeType = "video/x-matroska";
      else if (fileExtension === "3gp") mimeType = "video/3gpp";
      else if (fileExtension === "wmv") mimeType = "video/x-ms-wmv";
      else if (fileExtension === "flv") mimeType = "video/x-flv";
      else if (fileExtension === "m4v") mimeType = "video/x-m4v";

      console.log("🎬 Android video file details:", {
        originalUri: videoUri.substring(0, 100),
        fileName,
        fileExtension,
        mimeType,
        timeout: timeout / 1000 + 's'
      });

      // Create file object with Android-optimized structure
      formData.append("file", {
        uri: videoUri,
        name: fileName,
        type: mimeType,
      } as any);

      // Add Cloudinary parameters
      formData.append("upload_preset", this.uploadPreset);
      formData.append("resource_type", "video");
      
      if (folder && folder !== "videos") {
        formData.append("folder", folder);
      }

      // Add quality parameters for video optimization
      if (compressionQuality < 1.0) {
        formData.append("quality", Math.round(compressionQuality * 100).toString());
      }

      // Choose the video upload endpoint
      const uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/video/upload`;

      console.log("🚀 Android video upload configuration:", {
        url: uploadUrl,
        folder,
        quality: compressionQuality,
        fileName
      });

      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Android video upload timeout after ${timeout/1000} seconds`)), timeout)
      );

      // Create upload promise with Android-specific options
      const uploadPromise = fetch(uploadUrl, {
        method: "POST",
        body: formData,
        // Critical: No headers for Android - let the system handle multipart boundaries
      });

      console.log("📡 Starting Android video upload request...");
      const response = await Promise.race([uploadPromise, timeoutPromise]);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("🤖 Android video upload failed:", {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText
        });
        
        // Provide specific error messages for common issues
        if (response.status === 413) {
          throw new Error("Video file is too large. Please compress the video or choose a smaller file.");
        } else if (response.status === 415) {
          throw new Error("Video format not supported. Please use MP4, MOV, or AVI format.");
        } else if (response.status === 400) {
          throw new Error("Invalid video file or upload parameters.");
        } else {
          throw new Error(`Android video upload failed: ${response.status} - ${errorText}`);
        }
      }

      const result = await response.json();
      console.log("✅ Android video upload successful:", {
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        duration: result.duration,
        size: result.bytes
      });

      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        metadata: {
          duration: result.duration,
          width: result.width,
          height: result.height,
          size: result.bytes
        }
      };

    } catch (error) {
      console.error("❌ Android video upload error:", error);
      
      // Handle specific Android network errors
      if (error instanceof Error) {
        if (error.message.includes('Network request failed')) {
          return {
            success: false,
            error: "Network connection failed. Please check your internet connection and try again.",
          };
        } else if (error.message.includes('timeout')) {
          return {
            success: false,
            error: "Upload timed out. Please try with a smaller video file or better internet connection.",
          };
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : "Android video upload failed",
      };
    }
  }
}

// Create and export a singleton instance
const cloudinaryService = new CloudinaryService();
export default cloudinaryService;
