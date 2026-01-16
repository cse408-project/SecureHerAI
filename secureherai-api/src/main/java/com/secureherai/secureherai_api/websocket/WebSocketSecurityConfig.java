package com.secureherai.secureherai_api.websocket;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.support.ChannelInterceptor;

/**
 * Security configuration for WebSocket connections.
 * 
 * NOTE: We do NOT use @EnableWebSocketSecurity because it enforces CSRF by
 * default
 * and there's no clean way to disable it for JWT-based authentication.
 * 
 * JWT authentication is handled by WebSocketAuthInterceptor during CONNECT.
 * We simply disable the CSRF check by providing a no-op interceptor.
 * 
 * Reference: https://github.com/spring-projects/spring-security/issues/13640
 */
@Configuration
public class WebSocketSecurityConfig {

    /**
     * Create a no-op CSRF interceptor to disable CSRF for WebSocket.
     * 
     * NOTE: This bean name "csrfChannelInterceptor" is specifically looked up by
     * Spring Security.
     * By providing a no-op implementation, we disable CSRF checking for WebSocket
     * messages.
     * 
     * JWT authentication is still enforced by WebSocketAuthInterceptor on CONNECT.
     */
    @Bean("csrfChannelInterceptor")
    public ChannelInterceptor csrfChannelInterceptor() {
        // Return a no-op interceptor to disable CSRF for WebSocket
        return new ChannelInterceptor() {
        };
    }
}
