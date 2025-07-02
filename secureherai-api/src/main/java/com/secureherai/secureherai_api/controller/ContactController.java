package com.secureherai.secureherai_api.controller;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.secureherai.secureherai_api.dto.contacts.ContactRequest;
import com.secureherai.secureherai_api.dto.contacts.ContactResponse;
import com.secureherai.secureherai_api.service.ContactService;
import com.secureherai.secureherai_api.service.JwtService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/contacts")
public class ContactController {

    @Autowired
    private ContactService contactService;

    @Autowired
    private JwtService jwtService;    @PostMapping("/add")
    public ResponseEntity<ContactResponse.GenericResponse> addTrustedContact(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody ContactRequest.AddTrustedContact request) {
        try {
            String token = authHeader.replace("Bearer ", "");
            
            // Validate token and extract user ID in one step to catch all JWT exceptions
            UUID userId;
            try {
                if (!jwtService.isTokenValid(token)) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ContactResponse.GenericResponse(false, null, "Unable to add contacts with invalid token"));
                }
                userId = jwtService.extractUserId(token);
            } catch (io.jsonwebtoken.ExpiredJwtException e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ContactResponse.GenericResponse(false, null, "Unable to add contacts with invalid token"));
            } catch (io.jsonwebtoken.JwtException e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ContactResponse.GenericResponse(false, null, "Unable to add contacts with invalid token"));            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ContactResponse.GenericResponse(false, null, "Unable to add contacts with invalid token"));
            }
            
            ContactResponse.GenericResponse response = contactService.addTrustedContact(userId, request);
            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ContactResponse.GenericResponse(false, null, "An unexpected error occurred"));
        }
    }

    @GetMapping("/test")
    public ResponseEntity<Object> testContactsEndpoint() {
        try {
            return ResponseEntity.ok().body(
                new ContactResponse.GenericResponse(true, "Contacts API is working", null)
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ContactResponse.GenericResponse(false, null, "Test endpoint failed: " + e.getMessage()));
        }
    }

    @GetMapping({"", "/"})
    public ResponseEntity<Object> getTrustedContacts(
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            
            // Validate token and extract user ID in one step to catch all JWT exceptions
            UUID tokenUserId;
            try {
                if (!jwtService.isTokenValid(token)) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ContactResponse.GenericResponse(false, null, "Unable to get contacts with invalid token"));
                }
                tokenUserId = jwtService.extractUserId(token);
            } catch (io.jsonwebtoken.ExpiredJwtException e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ContactResponse.GenericResponse(false, null, "Unable to get contacts with invalid token"));
            } catch (io.jsonwebtoken.JwtException e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ContactResponse.GenericResponse(false, null, "Unable to get contacts with invalid token"));            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ContactResponse.GenericResponse(false, null, "Unable to get contacts with invalid token"));
            }
            
            Object response = contactService.getTrustedContacts(tokenUserId);
            if (response instanceof ContactResponse.GetContactsResponse) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ContactResponse.GenericResponse(false, null, "An unexpected error occurred"));
        }
    }

    @DeleteMapping("/delete")
    public ResponseEntity<ContactResponse.GenericResponse> deleteTrustedContact(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody ContactRequest.DeleteTrustedContact request) {
        try {
            String token = authHeader.replace("Bearer ", "");
            
            // Validate token and extract user ID in one step to catch all JWT exceptions
            UUID tokenUserId;
            try {
                if (!jwtService.isTokenValid(token)) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ContactResponse.GenericResponse(false, null, "Unable to delete contacts with invalid token"));
                }
                tokenUserId = jwtService.extractUserId(token);            } catch (io.jsonwebtoken.ExpiredJwtException e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ContactResponse.GenericResponse(false, null, "Unable to delete contacts with invalid token"));
            } catch (io.jsonwebtoken.JwtException e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ContactResponse.GenericResponse(false, null, "Unable to delete contacts with invalid token"));
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ContactResponse.GenericResponse(false, null, "Unable to delete contacts with invalid token"));
            }
            
            UUID contactId = UUID.fromString(request.getContactId());
            ContactResponse.GenericResponse response = contactService.deleteTrustedContact(tokenUserId, contactId);
            
            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ContactResponse.GenericResponse(false, null, "Invalid contact ID format"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ContactResponse.GenericResponse(false, null, "An unexpected error occurred"));
        }
    }

    @PutMapping("/update")
    public ResponseEntity<ContactResponse.GenericResponse> updateTrustedContact(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody ContactRequest.UpdateTrustedContact request) {
        try {
            String token = authHeader.replace("Bearer ", "");
            
            // Validate token and extract user ID in one step to catch all JWT exceptions
            UUID tokenUserId;
            try {
                if (!jwtService.isTokenValid(token)) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ContactResponse.GenericResponse(false, null, "Unable to update contacts with invalid token"));
                }
                tokenUserId = jwtService.extractUserId(token);
            } catch (io.jsonwebtoken.ExpiredJwtException e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ContactResponse.GenericResponse(false, null, "Unable to update contacts with invalid token"));
            } catch (io.jsonwebtoken.JwtException e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ContactResponse.GenericResponse(false, null, "Unable to update contacts with invalid token"));
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ContactResponse.GenericResponse(false, null, "Unable to update contacts with invalid token"));
            }
            
            ContactResponse.GenericResponse response = contactService.updateTrustedContact(tokenUserId, request);
            
            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ContactResponse.GenericResponse(false, null, "Invalid contact ID format"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ContactResponse.GenericResponse(false, null, "An unexpected error occurred"));
        }
    }
}
