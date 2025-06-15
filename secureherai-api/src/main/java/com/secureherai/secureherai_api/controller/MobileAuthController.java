package com.secureherai.secureherai_api.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@RestController
@RequestMapping("/api/auth/mobile")
public class MobileAuthController {

    /**
     * Endpoint for mobile app to complete OAuth flow
     * This redirects to a mobile app using a custom URL scheme
     */
    @GetMapping("/oauth-success")
    public void handleMobileRedirect(
            @RequestParam("token") String token,
            HttpServletResponse response) throws IOException {
        
        // Redirect to the mobile app using custom URL scheme
        response.sendRedirect("secureherai://auth?token=" + token);
    }
    
    /**
     * Test endpoint to confirm mobile redirection works
     */
    @GetMapping("/test-redirect")
    public ResponseEntity<String> testMobileRedirect() {
        return new ResponseEntity<>(
            "<html><body>" +
            "<h1>Test Mobile Redirection</h1>" +
            "<p>Click the link below to test mobile deep linking:</p>" +
            "<a href=\"secureherai://auth?token=test-token\">Open in SecureHer App</a>" +
            "</body></html>", 
            HttpStatus.OK
        );
    }
}
