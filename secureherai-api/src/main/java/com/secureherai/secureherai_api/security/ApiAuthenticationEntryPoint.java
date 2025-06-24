package com.secureherai.secureherai_api.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class ApiAuthenticationEntryPoint implements AuthenticationEntryPoint {

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        
        // Check if this is an API request
        String requestURI = request.getRequestURI();
        if (requestURI.startsWith("/api/")) {
            // For API requests, return JSON error response instead of redirecting
            response.setContentType("application/json");
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"success\": false, \"error\": \"User not authenticated\"}");
        } else {
            // For non-API requests, redirect to OAuth2 login
            response.sendRedirect("/oauth2/authorize/google");
        }
    }
}
