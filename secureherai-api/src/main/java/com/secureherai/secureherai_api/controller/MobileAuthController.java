package com.secureherai.secureherai_api.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.logging.Logger;

@RestController
@RequestMapping("/api/auth/mobile")
public class MobileAuthController {
    private static final Logger LOGGER = Logger.getLogger(MobileAuthController.class.getName());
    
    @Value("${app.mobile.redirect.scheme:secureheraiapp}")
    private String mobileRedirectScheme;
    
    @Value("${app.frontend.url:http://localhost:8081}")
    private String frontendUrl;

    /**
     * Endpoint for mobile app to complete OAuth flow
     * This redirects to a mobile app using a custom URL scheme
     */
    @GetMapping("/oauth-success")
    public void handleMobileRedirect(
            @RequestParam("token") String token,
            HttpServletResponse response) throws IOException {
        
        // Use the app.json scheme from the mobile app
        String redirectUrl = mobileRedirectScheme + "://auth?token=" + token;
        LOGGER.info("Redirecting mobile OAuth to: " + redirectUrl);
        
        // Redirect to the mobile app using custom URL scheme
        response.sendRedirect(redirectUrl);
    }
    
    /**
     * Test endpoint to confirm mobile redirection works
     */
    @GetMapping("/test-redirect")
    public ResponseEntity<String> testMobileRedirect() {
        String testToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoiVVNFUiIsImZ1bGxOYW1lIjoiVGVzdCBVc2VyIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
        
        return new ResponseEntity<>(
            "<html><body>" +
            "<h1>Test Mobile Redirection</h1>" +
            "<p>Click the links below to test mobile deep linking:</p>" +
            "<ul>" +
            "<li><a href=\"" + mobileRedirectScheme + "://auth?token=" + testToken + "\">Open in SecureHer App (Primary Scheme)</a></li>" +
            "<li><a href=\"secureherai://auth?token=" + testToken + "\">Open in SecureHer App (Fallback Scheme)</a></li>" +
            "</ul>" +
            "<p>If you're testing on a device, one of these should open the app.</p>" +
            "<p>If you're testing on web, you might need to register a web protocol handler.</p>" +
            "</body></html>", 
            HttpStatus.OK
        );
    }
    
    /**
     * Web-friendly redirect for OAuth2 flow completion
     */
    @GetMapping("/web-redirect")
    public void handleWebRedirect(
            @RequestParam("token") String token,
            HttpServletResponse response) throws IOException {
        
        // Redirect to the web app's dashboard with the token
        String redirectUrl = frontendUrl + "/dashboard?token=" + token;
        LOGGER.info("Redirecting web OAuth to: " + redirectUrl);
        
        // Redirect to the web app
        response.sendRedirect(redirectUrl);
    }
}
