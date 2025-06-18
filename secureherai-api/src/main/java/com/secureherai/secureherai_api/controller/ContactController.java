package com.secureherai.secureherai_api.controller;

import com.secureherai.secureherai_api.dto.contacts.ContactRequest;
import com.secureherai.secureherai_api.dto.contacts.ContactResponse;
import com.secureherai.secureherai_api.exception.AuthenticationException;
import com.secureherai.secureherai_api.service.ContactService;
import com.secureherai.secureherai_api.service.JwtService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api")
public class ContactController {

    @Autowired
    private ContactService contactService;

    @Autowired
    private JwtService jwtService;    @PostMapping("/contacts/add")
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
                    .body(new ContactResponse.GenericResponse(false, null, "Unable to add contacts with invalid token"));
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ContactResponse.GenericResponse(false, null, "Unable to add contacts with invalid token"));
            }
              // Validate that the request userId matches the token userId (if provided)
            if (request.getUserId() != null && !request.getUserId().equals(userId.toString())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ContactResponse.GenericResponse(false, null, "Cannot add contacts for another user"));
            }
            
            ContactResponse.GenericResponse response = contactService.addTrustedContact(userId, request);
              if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ContactResponse.GenericResponse(false, null, "Unable to add contacts with invalid token"));
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ContactResponse.GenericResponse(false, null, "Unable to add contacts with invalid token"));
        } catch (io.jsonwebtoken.JwtException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ContactResponse.GenericResponse(false, null, "Unable to add contacts with invalid token"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ContactResponse.GenericResponse(false, null, "An unexpected error occurred"));
        }
    }    @GetMapping("/contacts")
    public ResponseEntity<Object> getTrustedContacts(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) String userId) {
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
                    .body(new ContactResponse.GenericResponse(false, null, "Unable to get contacts with invalid token"));
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ContactResponse.GenericResponse(false, null, "Unable to get contacts with invalid token"));
            }
              // Validate that the request userId matches the token userId (if provided)
            if (userId != null && !userId.equals(tokenUserId.toString())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ContactResponse.GenericResponse(false, null, "Cannot access another user's contacts"));
            }
            
            Object response = contactService.getTrustedContacts(tokenUserId);            if (response instanceof ContactResponse.GetContactsResponse) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ContactResponse.GenericResponse(false, null, "Unable to get contacts with invalid token"));
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ContactResponse.GenericResponse(false, null, "Unable to get contacts with invalid token"));
        } catch (io.jsonwebtoken.JwtException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ContactResponse.GenericResponse(false, null, "Unable to get contacts with invalid token"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ContactResponse.GenericResponse(false, null, "An unexpected error occurred"));
        }
    }    @DeleteMapping("/contacts/delete")
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
                tokenUserId = jwtService.extractUserId(token);
            } catch (io.jsonwebtoken.ExpiredJwtException e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ContactResponse.GenericResponse(false, null, "Unable to delete contacts with invalid token"));
            } catch (io.jsonwebtoken.JwtException e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ContactResponse.GenericResponse(false, null, "Unable to delete contacts with invalid token"));
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ContactResponse.GenericResponse(false, null, "Unable to delete contacts with invalid token"));
            }
              // Validate that the request userId matches the token userId
            if (!request.getUserId().equals(tokenUserId.toString())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ContactResponse.GenericResponse(false, null, "Cannot access another user's contacts"));
            }
            
            UUID contactId = UUID.fromString(request.getContactId());
            ContactResponse.GenericResponse response = contactService.deleteTrustedContact(tokenUserId, contactId);
            
            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ContactResponse.GenericResponse(false, null, "Unable to delete contacts with invalid token"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ContactResponse.GenericResponse(false, null, "Invalid contact ID format"));
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ContactResponse.GenericResponse(false, null, "Unable to delete contacts with invalid token"));
        } catch (io.jsonwebtoken.JwtException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ContactResponse.GenericResponse(false, null, "Unable to delete contacts with invalid token"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ContactResponse.GenericResponse(false, null, "An unexpected error occurred"));
        }
    }
}
