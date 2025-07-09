package com.secureherai.secureherai_api.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.secureherai.secureherai_api.dto.contacts.ContactRequest;
import com.secureherai.secureherai_api.dto.contacts.ContactResponse;
import com.secureherai.secureherai_api.entity.TrustedContact;
import com.secureherai.secureherai_api.entity.User;
import com.secureherai.secureherai_api.exception.AuthenticationException;
import com.secureherai.secureherai_api.repository.TrustedContactRepository;
import com.secureherai.secureherai_api.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class ContactServiceTest {

    @Mock
    private TrustedContactRepository trustedContactRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ContactService contactService;

    private UUID userId;
    private UUID contactId;
    private User testUser;
    private TrustedContact testContact;
    private ContactRequest.ContactInfo contactInfo;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        contactId = UUID.randomUUID();
        
        testUser = new User();
        testUser.setId(userId);
        testUser.setFullName("Test User");
        testUser.setEmail("test@example.com");
        
        testContact = new TrustedContact();
        testContact.setId(contactId);
        testContact.setUserId(userId);
        testContact.setName("John Doe");
        testContact.setPhone("+1234567890");
        testContact.setRelationship("Friend");
        testContact.setEmail("john@example.com");
        testContact.setShareLocation(true);
        testContact.setCreatedAt(LocalDateTime.now());
        
        contactInfo = new ContactRequest.ContactInfo();
        contactInfo.setName("John Doe");
        contactInfo.setPhone("+1234567890");
        contactInfo.setRelationship("Friend");
        contactInfo.setEmail("john@example.com");
        contactInfo.setShareLocation(true);
    }

    @Test
    void addTrustedContact_Success() {
        // Arrange
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(trustedContactRepository.findByUserIdAndPhone(userId, "+1234567890")).thenReturn(Optional.empty());
        when(trustedContactRepository.save(any(TrustedContact.class))).thenReturn(testContact);

        ContactRequest.AddTrustedContact request = new ContactRequest.AddTrustedContact();
        request.setContact(contactInfo);

        // Act
        ContactResponse.GenericResponse response = contactService.addTrustedContact(userId, request);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Trusted contact added successfully.", response.getMessage());
        assertNull(response.getError());
        verify(trustedContactRepository).save(any(TrustedContact.class));
    }

    @Test
    void addTrustedContact_UserNotFound() {
        // Arrange
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        ContactRequest.AddTrustedContact request = new ContactRequest.AddTrustedContact();
        request.setContact(contactInfo);

        // Act & Assert
        assertThrows(AuthenticationException.class, () -> 
            contactService.addTrustedContact(userId, request));
    }

    @Test
    void addTrustedContact_DuplicatePhone() {
        // Arrange
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(trustedContactRepository.findByUserIdAndPhone(userId, "+1234567890")).thenReturn(Optional.of(testContact));

        ContactRequest.AddTrustedContact request = new ContactRequest.AddTrustedContact();
        request.setContact(contactInfo);

        // Act
        ContactResponse.GenericResponse response = contactService.addTrustedContact(userId, request);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("A contact with this phone number already exists", response.getError());
        verify(trustedContactRepository, never()).save(any());
    }

    @Test
    void getTrustedContacts_Success() {
        // Arrange
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(trustedContactRepository.findByUserId(userId)).thenReturn(Arrays.asList(testContact));

        // Act
        Object result = contactService.getTrustedContacts(userId);

        // Assert
        assertTrue(result instanceof ContactResponse.GetContactsResponse);
        ContactResponse.GetContactsResponse response = (ContactResponse.GetContactsResponse) result;
        assertTrue(response.isSuccess());
        assertEquals(1, response.getContacts().size());
        assertEquals("John Doe", response.getContacts().get(0).getName());
    }

    @Test
    void getTrustedContacts_UserNotFound() {
        // Arrange
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(AuthenticationException.class, () -> 
            contactService.getTrustedContacts(userId));
    }

    @Test
    void deleteTrustedContact_Success() {
        // Arrange
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(trustedContactRepository.findByIdAndUserId(contactId, userId)).thenReturn(Optional.of(testContact));

        // Act
        ContactResponse.GenericResponse response = contactService.deleteTrustedContact(userId, contactId);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Trusted contact deleted successfully.", response.getMessage());
        verify(trustedContactRepository).delete(testContact);
    }

    @Test
    void deleteTrustedContact_ContactNotFound() {
        // Arrange
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(trustedContactRepository.findByIdAndUserId(contactId, userId)).thenReturn(Optional.empty());

        // Act
        ContactResponse.GenericResponse response = contactService.deleteTrustedContact(userId, contactId);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Contact not found or doesn't belong to this user", response.getError());
        verify(trustedContactRepository, never()).delete(any());
    }

    @Test
    void updateTrustedContact_Success() {
        // Arrange
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(trustedContactRepository.findByIdAndUserId(contactId, userId)).thenReturn(Optional.of(testContact));
        when(trustedContactRepository.save(any(TrustedContact.class))).thenReturn(testContact);

        ContactRequest.UpdateTrustedContact request = new ContactRequest.UpdateTrustedContact();
        request.setContactId(contactId.toString());
        request.setContact(contactInfo);

        // Act
        ContactResponse.GenericResponse response = contactService.updateTrustedContact(userId, request);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Trusted contact updated successfully.", response.getMessage());
        verify(trustedContactRepository).save(testContact);
    }

    @Test
    void updateTrustedContact_InvalidContactId() {
        // Arrange
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));

        ContactRequest.UpdateTrustedContact request = new ContactRequest.UpdateTrustedContact();
        request.setContactId("invalid-uuid");
        request.setContact(contactInfo);

        // Act
        ContactResponse.GenericResponse response = contactService.updateTrustedContact(userId, request);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Invalid contact ID format", response.getError());
    }

    @Test
    void updateTrustedContact_PhoneConflict() {
        // Arrange
        UUID otherContactId = UUID.randomUUID();
        TrustedContact otherContact = new TrustedContact();
        otherContact.setId(otherContactId);
        otherContact.setPhone("+1234567890");

        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(trustedContactRepository.findByIdAndUserId(contactId, userId)).thenReturn(Optional.of(testContact));
        when(trustedContactRepository.findByUserIdAndPhone(userId, "+1234567890")).thenReturn(Optional.of(otherContact));

        // Change phone number to create conflict
        testContact.setPhone("+9876543210");
        
        ContactRequest.UpdateTrustedContact request = new ContactRequest.UpdateTrustedContact();
        request.setContactId(contactId.toString());
        request.setContact(contactInfo);

        // Act
        ContactResponse.GenericResponse response = contactService.updateTrustedContact(userId, request);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Another contact with this phone number already exists", response.getError());
    }
}
