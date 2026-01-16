package com.secureherai.secureherai_api.websocket;

import com.secureherai.secureherai_api.service.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

/**
 * Interceptor for WebSocket connections to handle JWT authentication.
 * Validates JWT tokens on CONNECT and sets the user principal.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");

            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                try {
                    if (jwtService.isTokenValid(token)) {
                        String email = jwtService.extractEmail(token);
                        UUID userId = jwtService.extractUserId(token);
                        String role = jwtService.extractRole(token);

                        // Create principal with user info
                        WebSocketPrincipal principal = new WebSocketPrincipal(
                                userId.toString(), email);

                        // Create authentication token
                        List<SimpleGrantedAuthority> authorities = Collections.singletonList(
                                new SimpleGrantedAuthority("ROLE_" + (role != null ? role : "USER")));

                        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(principal,
                                null, authorities);

                        accessor.setUser(auth);

                        // Store user info in session attributes for later use
                        if (accessor.getSessionAttributes() != null) {
                            accessor.getSessionAttributes().put("userId", userId);
                            accessor.getSessionAttributes().put("email", email);
                        }

                        log.debug("WebSocket authenticated for user: {}", email);
                    } else {
                        log.warn("Invalid JWT token in WebSocket connection");
                    }
                } catch (Exception e) {
                    log.error("Error validating JWT token in WebSocket", e);
                }
            }
        }

        return message;
    }
}
