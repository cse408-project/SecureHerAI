package com.secureherai.secureherai_api.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.Arrays;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.secureherai.secureherai_api.dto.contacts.ContactRequest;
import com.secureherai.secureherai_api.dto.contacts.ContactResponse;
import com.secureherai.secureherai_api.service.ContactService;
import com.secureherai.secureherai_api.service.JwtService;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;

@WebMvcTest(ContactController.class)
@Import(com.secureherai.secureherai_api.config.TestSecurityConfig.class)
class ContactControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ContactService contactService;

    @MockBean
    private JwtService jwtService;

    @Autowired
    private ObjectMapper objectMapper;

    private final String validToken = "valid-jwt-token";
    private final String invalidToken = "invalid-jwt-token";
    private final UUID userId = UUID.randomUUID();

    @Test
    void addTrustedContact_Success() throws Exception {
        // Arrange
        ContactRequest.AddTrustedContact request = new ContactRequest.AddTrustedContact();
        ContactRequest.ContactInfo contactInfo = new ContactRequest.ContactInfo();
        contactInfo.setName("John Doe");
        contactInfo.setPhone("+1234567890");
        contactInfo.setEmail("john@example.com");
        contactInfo.setRelationship("Friend");
        contactInfo.setShareLocation(true);
        request.setContact(contactInfo);

        ContactResponse.GenericResponse response = new ContactResponse.GenericResponse(true, "Contact added successfully", null);

        when(jwtService.isTokenValid(validToken)).thenReturn(true);
        when(jwtService.extractUserId(validToken)).thenReturn(userId);
        when(contactService.addTrustedContact(eq(userId), any(ContactRequest.AddTrustedContact.class))).thenReturn(response);

        // Act & Assert
        mockMvc.perform(post("/api/contacts/add")
                .header("Authorization", "Bearer " + validToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Contact added successfully"));
    }

    @Test
    void addTrustedContact_InvalidToken() throws Exception {
        // Arrange
        ContactRequest.AddTrustedContact request = new ContactRequest.AddTrustedContact();
        ContactRequest.ContactInfo contactInfo = new ContactRequest.ContactInfo();
        contactInfo.setName("John Doe");
        contactInfo.setPhone("+1234567890");
        contactInfo.setRelationship("Friend");
        request.setContact(contactInfo);

        when(jwtService.isTokenValid(invalidToken)).thenReturn(false);

        // Act & Assert
        mockMvc.perform(post("/api/contacts/add")
                .header("Authorization", "Bearer " + invalidToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value("Unable to add contacts with invalid token"));
    }

    @Test
    void addTrustedContact_ExpiredToken() throws Exception {
        // Arrange
        ContactRequest.AddTrustedContact request = new ContactRequest.AddTrustedContact();
        ContactRequest.ContactInfo contactInfo = new ContactRequest.ContactInfo();
        contactInfo.setName("John Doe");
        contactInfo.setPhone("+1234567890");
        contactInfo.setRelationship("Friend");
        request.setContact(contactInfo);

        when(jwtService.isTokenValid(validToken)).thenThrow(new ExpiredJwtException(null, null, "Token expired"));

        // Act & Assert
        mockMvc.perform(post("/api/contacts/add")
                .header("Authorization", "Bearer " + validToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value("Unable to add contacts with invalid token"));
    }

    @Test
    void addTrustedContact_ServiceError() throws Exception {
        // Arrange
        ContactRequest.AddTrustedContact request = new ContactRequest.AddTrustedContact();
        ContactRequest.ContactInfo contactInfo = new ContactRequest.ContactInfo();
        contactInfo.setName("John Doe");
        contactInfo.setPhone("+1234567890");
        contactInfo.setRelationship("Friend");
        request.setContact(contactInfo);

        ContactResponse.GenericResponse response = new ContactResponse.GenericResponse(false, null, "Contact already exists");

        when(jwtService.isTokenValid(validToken)).thenReturn(true);
        when(jwtService.extractUserId(validToken)).thenReturn(userId);
        when(contactService.addTrustedContact(eq(userId), any(ContactRequest.AddTrustedContact.class))).thenReturn(response);

        // Act & Assert
        mockMvc.perform(post("/api/contacts/add")
                .header("Authorization", "Bearer " + validToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value("Contact already exists"));
    }

    @Test
    void testContactsEndpoint_Success() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/contacts/test"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Contacts API is working"));
    }

    @Test
    void getTrustedContacts_Success() throws Exception {
        // Arrange
        ContactResponse.ContactInfo contact = new ContactResponse.ContactInfo();
        contact.setContactId(UUID.randomUUID().toString());
        contact.setName("John Doe");
        contact.setPhone("+1234567890");
        contact.setEmail("john@example.com");
        contact.setRelationship("Friend");
        contact.setShareLocation(true);

        ContactResponse.GetContactsResponse response = new ContactResponse.GetContactsResponse(
            true, Arrays.asList(contact));

        when(jwtService.isTokenValid(validToken)).thenReturn(true);
        when(jwtService.extractUserId(validToken)).thenReturn(userId);
        when(contactService.getTrustedContacts(userId)).thenReturn(response);

        // Act & Assert
        mockMvc.perform(get("/api/contacts")
                .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.contacts").isArray())
                .andExpect(jsonPath("$.contacts[0].name").value("John Doe"));
    }

    @Test
    void getTrustedContacts_InvalidToken() throws Exception {
        // Arrange
        when(jwtService.isTokenValid(invalidToken)).thenReturn(false);

        // Act & Assert
        mockMvc.perform(get("/api/contacts")
                .header("Authorization", "Bearer " + invalidToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value("Unable to get contacts with invalid token"));
    }

    @Test
    void deleteTrustedContact_Success() throws Exception {
        // Arrange
        String contactId = UUID.randomUUID().toString();
        ContactRequest.DeleteTrustedContact request = new ContactRequest.DeleteTrustedContact();
        request.setContactId(contactId);

        ContactResponse.GenericResponse response = new ContactResponse.GenericResponse(true, "Contact deleted successfully", null);

        when(jwtService.isTokenValid(validToken)).thenReturn(true);
        when(jwtService.extractUserId(validToken)).thenReturn(userId);
        when(contactService.deleteTrustedContact(eq(userId), any(UUID.class))).thenReturn(response);

        // Act & Assert
        mockMvc.perform(delete("/api/contacts/delete")
                .header("Authorization", "Bearer " + validToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Contact deleted successfully"));
    }

    @Test
    void deleteTrustedContact_InvalidContactId() throws Exception {
        // Arrange
        ContactRequest.DeleteTrustedContact request = new ContactRequest.DeleteTrustedContact();
        request.setContactId("invalid-uuid");

        when(jwtService.isTokenValid(validToken)).thenReturn(true);
        when(jwtService.extractUserId(validToken)).thenReturn(userId);

        // Act & Assert
        mockMvc.perform(delete("/api/contacts/delete")
                .header("Authorization", "Bearer " + validToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value("Invalid contact ID format"));
    }

    @Test
    void updateTrustedContact_Success() throws Exception {
        // Arrange
        ContactRequest.UpdateTrustedContact request = new ContactRequest.UpdateTrustedContact();
        request.setContactId(UUID.randomUUID().toString());
        ContactRequest.ContactInfo contactInfo = new ContactRequest.ContactInfo();
        contactInfo.setName("John Updated");
        contactInfo.setPhone("+1234567890");
        contactInfo.setEmail("john.updated@example.com");
        contactInfo.setRelationship("Close Friend");
        contactInfo.setShareLocation(false);
        request.setContact(contactInfo);

        ContactResponse.GenericResponse response = new ContactResponse.GenericResponse(true, "Contact updated successfully", null);

        when(jwtService.isTokenValid(validToken)).thenReturn(true);
        when(jwtService.extractUserId(validToken)).thenReturn(userId);
        when(contactService.updateTrustedContact(eq(userId), any(ContactRequest.UpdateTrustedContact.class))).thenReturn(response);

        // Act & Assert
        mockMvc.perform(put("/api/contacts/update")
                .header("Authorization", "Bearer " + validToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Contact updated successfully"));
    }

    @Test
    void updateTrustedContact_InvalidToken() throws Exception {
        // Arrange
        ContactRequest.UpdateTrustedContact request = new ContactRequest.UpdateTrustedContact();
        request.setContactId(UUID.randomUUID().toString());
        ContactRequest.ContactInfo contactInfo = new ContactRequest.ContactInfo();
        contactInfo.setName("John Updated");
        contactInfo.setPhone("+1234567890");
        contactInfo.setRelationship("Friend");
        request.setContact(contactInfo);

        when(jwtService.isTokenValid(invalidToken)).thenReturn(false);

        // Act & Assert
        mockMvc.perform(put("/api/contacts/update")
                .header("Authorization", "Bearer " + invalidToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value("Unable to update contacts with invalid token"));
    }

    @Test
    void updateTrustedContact_ServiceError() throws Exception {
        // Arrange
        ContactRequest.UpdateTrustedContact request = new ContactRequest.UpdateTrustedContact();
        request.setContactId(UUID.randomUUID().toString());
        ContactRequest.ContactInfo contactInfo = new ContactRequest.ContactInfo();
        contactInfo.setName("John Updated");
        contactInfo.setPhone("+1234567890");
        contactInfo.setRelationship("Friend");
        request.setContact(contactInfo);

        ContactResponse.GenericResponse response = new ContactResponse.GenericResponse(false, null, "Contact not found");

        when(jwtService.isTokenValid(validToken)).thenReturn(true);
        when(jwtService.extractUserId(validToken)).thenReturn(userId);
        when(contactService.updateTrustedContact(eq(userId), any(ContactRequest.UpdateTrustedContact.class))).thenReturn(response);

        // Act & Assert
        mockMvc.perform(put("/api/contacts/update")
                .header("Authorization", "Bearer " + validToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value("Contact not found"));
    }
}
