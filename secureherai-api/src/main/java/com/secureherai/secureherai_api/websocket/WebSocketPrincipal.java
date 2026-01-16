package com.secureherai.secureherai_api.websocket;

import java.security.Principal;
import java.util.UUID;

/**
 * Custom Principal for WebSocket connections that stores both user ID and
 * email.
 */
public class WebSocketPrincipal implements Principal {

    private final String name; // User ID as string
    private final String email;
    private final Long userIdLong;

    public WebSocketPrincipal(String userId, String email) {
        this.name = userId;
        this.email = email;
        // Try to parse as Long for convenience
        Long parsed = null;
        try {
            UUID uuid = UUID.fromString(userId);
            parsed = uuid.getLeastSignificantBits();
        } catch (Exception e) {
            try {
                parsed = Long.parseLong(userId);
            } catch (Exception ex) {
                // ignore
            }
        }
        this.userIdLong = parsed;
    }

    @Override
    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public Long getUserId() {
        return userIdLong;
    }

    public UUID getUserIdAsUUID() {
        try {
            return UUID.fromString(name);
        } catch (Exception e) {
            return null;
        }
    }
}
