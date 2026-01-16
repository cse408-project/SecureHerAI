package com.secureherai.secureherai_api.websocket;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket configuration for real-time emergency notifications.
 * Uses STOMP protocol over WebSocket for bi-directional communication.
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable simple broker for topics (one-to-many) and queues (one-to-one)
        config.enableSimpleBroker("/topic", "/queue");
        // Set prefix for messages bound for @MessageMapping methods
        config.setApplicationDestinationPrefixes("/app");
        // Set prefix for user-specific destinations
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Main WebSocket endpoint for emergency notifications
        // NOTE: setAllowedOriginPatterns is REQUIRED here for Spring WebSocket origin
        // validation
        // This is different from HTTP CORS headers - Spring checks origin at STOMP
        // handshake level
        // Without this, you get 403 Forbidden even if nginx CORS headers are correct
        registry.addEndpoint("/ws/emergency")
                .setAllowedOriginPatterns("*")
                .withSockJS(); // Fallback for browsers without WebSocket support

        // Plain WebSocket endpoint (without SockJS fallback) for mobile apps
        registry.addEndpoint("/ws/emergency")
                .setAllowedOriginPatterns("*");
    }
}
