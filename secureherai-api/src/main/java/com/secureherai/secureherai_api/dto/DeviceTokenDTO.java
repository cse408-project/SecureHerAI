package com.secureherai.secureherai_api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for device token registration requests
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeviceTokenDTO {
    private String token; // The push notification token
    private String tokenType; // EXPO_PUSH, FCM, or APNS
    private String platform; // ANDROID, IOS, or WEB
    private String deviceId; // Unique device identifier
    private String deviceName; // Human-readable device name
}
