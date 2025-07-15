package com.secureherai.secureherai_api.controller;

import com.secureherai.secureherai_api.dto.auth.AuthRequest;
import com.secureherai.secureherai_api.dto.auth.AuthResponse;
import com.secureherai.secureherai_api.service.UserService;
import com.secureherai.secureherai_api.service.JwtService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserService userService;
    
    @Autowired
    private JwtService jwtService;

    @GetMapping("/profile")
    public ResponseEntity<Object> getProfile(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            if (!jwtService.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new AuthResponse.Error("Authentication token is invalid or expired"));
            }
            
            UUID userId = jwtService.extractUserId(token);
            Object response = userService.getProfile(userId);
            
            if (response instanceof AuthResponse.Error) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
            
            return ResponseEntity.ok(response);
        } catch (io.jsonwebtoken.JwtException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new AuthResponse.Error("Invalid or expired authentication token"));
        } catch (Exception e) {
            System.err.println("Unexpected error in getProfile: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new AuthResponse.Error("An unexpected error occurred while retrieving profile"));
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<Object> updateProfile(@RequestHeader("Authorization") String authHeader,
                                              @Valid @RequestBody AuthRequest.UpdateProfile request) {
        try {
            String token = authHeader.replace("Bearer ", "");
            if (!jwtService.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new AuthResponse.Error("Invalid or expired token"));
            }
            
            UUID userId = UUID.fromString(jwtService.extractSubject(token));
            Object response = userService.updateProfile(userId, request);
            
            if (response instanceof AuthResponse.Error) {
                return ResponseEntity.badRequest().body(response);
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new AuthResponse.Error("An error occurred: " + e.getMessage()));
        }
    }
}
