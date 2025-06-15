package com.secureherai.secureherai_api.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.view.RedirectView;

import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth/google")
public class GoogleAuthController {

    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String googleClientId;

    @GetMapping("/login")
    public ResponseEntity<Object> getLoginUrl() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("url", "/oauth2/authorize/google");
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/redirect")
    public RedirectView redirectToApp(HttpServletRequest request) {
        String token = request.getParameter("token");
        // Redirect to the mobile app with the token
        // This would use a deep link or a custom URL scheme that your mobile app handles
        return new RedirectView("secureherai://auth?token=" + token);
    }
}
