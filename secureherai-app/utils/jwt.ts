/**
 * Decode a JWT token without verifying signature
 * @param token - The JWT token to decode
 * @returns The decoded payload
 */
export function decodeJWT(token: string): any {
  try {
    // Split the token to get the payload part
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid token format");
    }

    // Decode the base64-encoded payload
    const payload = parts[1];
    // Need to pad the base64 string to make it a valid length
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");

    // For React Native/Expo, we need to handle base64 decoding differently
    let jsonString: string;

    if (typeof atob === "function") {
      // Browser environment
      jsonString = atob(base64);
    } else {
      // React Native environment - use Buffer if available, otherwise manual decode
      if (typeof Buffer !== "undefined") {
        jsonString = Buffer.from(base64, "base64").toString("utf8");
      } else {
        // Fallback for environments without Buffer
        throw new Error("Base64 decoding not available in this environment");
      }
    }

    const decodedToken = JSON.parse(jsonString);
    return decodedToken;
  } catch (error) {
    console.error("Error decoding JWT:", error);
    throw new Error("Failed to decode JWT token");
  }
}

/**
 * Check if a JWT token is expired
 * @param token - The JWT token to check
 * @returns True if expired, false otherwise
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = decodeJWT(token);
    const now = Date.now() / 1000; // Convert to seconds
    return decoded.exp < now;
  } catch {
    return true; // Consider invalid tokens as expired
  }
}
