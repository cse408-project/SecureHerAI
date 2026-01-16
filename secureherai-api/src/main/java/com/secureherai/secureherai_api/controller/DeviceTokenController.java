package com.secureherai.secureherai_api.controller;

import com.secureherai.secureherai_api.dto.DeviceTokenDTO;
import com.secureherai.secureherai_api.entity.DeviceToken;
import com.secureherai.secureherai_api.entity.DeviceToken.Platform;
import com.secureherai.secureherai_api.entity.DeviceToken.TokenType;
import com.secureherai.secureherai_api.entity.User;
import com.secureherai.secureherai_api.repository.DeviceTokenRepository;
import com.secureherai.secureherai_api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

/**
 * Controller for managing device push notification tokens
 */
@RestController
@RequestMapping("/api/device-tokens")
@RequiredArgsConstructor
@Slf4j
public class DeviceTokenController {

    private final DeviceTokenRepository deviceTokenRepository;
    private final UserRepository userRepository;

    /**
     * Register or update a device push token
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerToken(
            @AuthenticationPrincipal User user,
            @RequestBody DeviceTokenDTO request) {

        log.info("Registering device token for user {}", user.getId());

        // Check if token already exists
        Optional<DeviceToken> existing = deviceTokenRepository.findByToken(request.getToken());

        if (existing.isPresent()) {
            DeviceToken token = existing.get();
            // If token belongs to another user, transfer ownership
            if (!token.getUserId().equals(user.getId())) {
                token.setUserId(user.getId());
            }
            token.setIsActive(true);
            token.setLastUsedAt(LocalDateTime.now());
            token.setDeviceName(request.getDeviceName());
            deviceTokenRepository.save(token);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Token updated successfully"));
        }

        // Check if we already have a token for this device
        if (request.getDeviceId() != null) {
            Optional<DeviceToken> existingDevice = deviceTokenRepository.findByUserIdAndDeviceId(
                    user.getId(), request.getDeviceId());

            if (existingDevice.isPresent()) {
                DeviceToken token = existingDevice.get();
                token.setToken(request.getToken());
                token.setIsActive(true);
                token.setLastUsedAt(LocalDateTime.now());
                deviceTokenRepository.save(token);

                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "Token updated for existing device"));
            }
        }

        // Create new token
        DeviceToken newToken = new DeviceToken();
        newToken.setUserId(user.getId());
        newToken.setToken(request.getToken());
        newToken.setTokenType(parseTokenType(request.getTokenType()));
        newToken.setPlatform(parsePlatform(request.getPlatform()));
        newToken.setDeviceId(request.getDeviceId());
        newToken.setDeviceName(request.getDeviceName());
        newToken.setIsActive(true);

        deviceTokenRepository.save(newToken);

        log.info("New device token registered for user {}", user.getId());

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Token registered successfully"));
    }

    /**
     * Deactivate a device token (on logout)
     */
    @DeleteMapping("/deactivate")
    public ResponseEntity<?> deactivateToken(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, String> request) {

        String token = request.get("token");
        if (token == null || token.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Token is required"));
        }

        deviceTokenRepository.deactivateToken(token);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Token deactivated"));
    }

    /**
     * Deactivate all tokens for user (logout from all devices)
     */
    @DeleteMapping("/deactivate-all")
    public ResponseEntity<?> deactivateAllTokens(@AuthenticationPrincipal User user) {
        int count = deviceTokenRepository.deactivateAllTokensForUser(user.getId());

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Deactivated " + count + " tokens"));
    }

    private TokenType parseTokenType(String type) {
        if (type == null)
            return TokenType.EXPO_PUSH;
        return switch (type.toUpperCase()) {
            case "FCM" -> TokenType.FCM;
            case "APNS" -> TokenType.APNS;
            default -> TokenType.EXPO_PUSH;
        };
    }

    private Platform parsePlatform(String platform) {
        if (platform == null)
            return Platform.ANDROID;
        return switch (platform.toUpperCase()) {
            case "IOS" -> Platform.IOS;
            case "WEB" -> Platform.WEB;
            default -> Platform.ANDROID;
        };
    }
}
