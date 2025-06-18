package com.secureherai.secureherai_api.service;

import com.secureherai.secureherai_api.dto.contacts.ContactRequest;
import com.secureherai.secureherai_api.dto.contacts.ContactResponse;
import com.secureherai.secureherai_api.entity.TrustedContact;
import com.secureherai.secureherai_api.entity.User;
import com.secureherai.secureherai_api.exception.AuthenticationException;
import com.secureherai.secureherai_api.repository.TrustedContactRepository;
import com.secureherai.secureherai_api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class ContactService {

    @Autowired
    private TrustedContactRepository trustedContactRepository;

    @Autowired
    private UserRepository userRepository;    public ContactResponse.GenericResponse addTrustedContact(UUID userId, ContactRequest.AddTrustedContact request) {
        try {
            // Verify user exists
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                throw new AuthenticationException("Invalid authentication token - user not found");
            }

            // Check if contact with same phone already exists for this user
            Optional<TrustedContact> existingContact = trustedContactRepository.findByUserIdAndPhone(userId, request.getContact().getPhone());
            if (existingContact.isPresent()) {
                return new ContactResponse.GenericResponse(false, null, "A contact with this phone number already exists");
            }

            // Create new trusted contact
            TrustedContact contact = new TrustedContact(
                userId,
                request.getContact().getName(),
                request.getContact().getRelationship(),
                request.getContact().getPhone(),
                request.getContact().getEmail(),
                request.getContact().getShareLocation()
            );

            trustedContactRepository.save(contact);
              return new ContactResponse.GenericResponse(true, "Trusted contact added successfully.", null);

        } catch (AuthenticationException e) {
            // Re-throw authentication exceptions to be handled by controller
            throw e;
        } catch (Exception e) {
            return new ContactResponse.GenericResponse(false, null, "An error occurred while adding the contact: " + e.getMessage());
        }
    }

    public Object getTrustedContacts(UUID userId) {        try {
            // Verify user exists
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                throw new AuthenticationException("Invalid authentication token - user not found");
            }

            List<TrustedContact> contacts = trustedContactRepository.findByUserId(userId);
            
            List<ContactResponse.ContactInfo> contactInfoList = contacts.stream()
                .map(contact -> new ContactResponse.ContactInfo(
                    contact.getId(),
                    contact.getName(),
                    contact.getPhone(),
                    contact.getRelationship(),
                    contact.getEmail(),
                    contact.getShareLocation(),
                    contact.getCreatedAt()
                ))
                .collect(Collectors.toList());            return new ContactResponse.GetContactsResponse(true, contactInfoList);

        } catch (AuthenticationException e) {
            // Re-throw authentication exceptions to be handled by controller
            throw e;
        } catch (Exception e) {
            return new ContactResponse.GenericResponse(false, null, "An error occurred while retrieving contacts: " + e.getMessage());
        }
    }

    public ContactResponse.GenericResponse deleteTrustedContact(UUID userId, UUID contactId) {
        try {            // Verify user exists
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                throw new AuthenticationException("Invalid authentication token - user not found");
            }

            // Find the contact and verify it belongs to the user
            Optional<TrustedContact> contactOpt = trustedContactRepository.findByIdAndUserId(contactId, userId);
            if (contactOpt.isEmpty()) {
                return new ContactResponse.GenericResponse(false, null, "Contact not found or doesn't belong to this user");
            }

            trustedContactRepository.delete(contactOpt.get());
              return new ContactResponse.GenericResponse(true, "Trusted contact deleted successfully.", null);

        } catch (AuthenticationException e) {
            // Re-throw authentication exceptions to be handled by controller
            throw e;
        } catch (Exception e) {
            return new ContactResponse.GenericResponse(false, null, "An error occurred while deleting the contact: " + e.getMessage());
        }
    }
}
