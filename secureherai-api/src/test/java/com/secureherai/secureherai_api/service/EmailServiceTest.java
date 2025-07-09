package com.secureherai.secureherai_api.service;

import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock
    private JavaMailSender mailSender;
    
    @Mock
    private MimeMessage mimeMessage;

    @InjectMocks
    private EmailService emailService;

    @BeforeEach
    void setUp() {
        // Set the from email property
        ReflectionTestUtils.setField(emailService, "fromEmail", "noreply@secureherai.com");
        
        // Mock the createMimeMessage method to return our mock
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
    }

    @Test
    void sendWelcomeEmail_WithValidParameters_SendsEmail() {
        // Arrange
        String toEmail = "user@example.com";
        String fullName = "John Doe";
        
        doNothing().when(mailSender).send(any(MimeMessage.class));

        // Act
        assertDoesNotThrow(() -> emailService.sendWelcomeEmail(toEmail, fullName));

        // Assert
        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void sendLoginCodeEmail_WithValidParameters_SendsEmail() {
        // Arrange
        String toEmail = "user@example.com";
        String fullName = "John Doe";
        String loginCode = "123456";
        
        doNothing().when(mailSender).send(any(MimeMessage.class));

        // Act
        assertDoesNotThrow(() -> emailService.sendLoginCodeEmail(toEmail, fullName, loginCode));

        // Assert
        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void sendPasswordResetEmail_WithValidParameters_SendsEmail() {
        // Arrange
        String toEmail = "user@example.com";
        String fullName = "John Doe";
        String resetToken = "reset-token-123";
        
        doNothing().when(mailSender).send(any(MimeMessage.class));

        // Act
        assertDoesNotThrow(() -> emailService.sendPasswordResetEmail(toEmail, resetToken));

        // Assert
        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void sendWelcomeEmail_WhenEmailServiceFails_ThrowsException() {
        // Arrange
        String toEmail = "user@example.com";
        String fullName = "John Doe";
        
        doThrow(new RuntimeException("Email service unavailable")).when(mailSender).send(any(MimeMessage.class));

        // Act & Assert
        assertThrows(RuntimeException.class, () -> emailService.sendWelcomeEmail(toEmail, fullName));
        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void sendLoginCodeEmail_WhenEmailServiceFails_ThrowsException() {
        // Arrange
        String toEmail = "user@example.com";
        String fullName = "John Doe";
        String loginCode = "123456";
        
        doThrow(new RuntimeException("Email service unavailable")).when(mailSender).send(any(MimeMessage.class));

        // Act & Assert
        assertThrows(RuntimeException.class, () -> emailService.sendLoginCodeEmail(toEmail, fullName, loginCode));
        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void sendWelcomeEmail_WithNullParameters_HandlesGracefully() {
        // Arrange
        doNothing().when(mailSender).send(any(MimeMessage.class));

        // Act & Assert
        assertDoesNotThrow(() -> emailService.sendWelcomeEmail(null, null));
        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void sendLoginCodeEmail_WithEmptyLoginCode_HandlesGracefully() {
        // Arrange
        String toEmail = "user@example.com";
        String fullName = "John Doe";
        String loginCode = "";
        
        doNothing().when(mailSender).send(any(MimeMessage.class));

        // Act & Assert
        assertDoesNotThrow(() -> emailService.sendLoginCodeEmail(toEmail, fullName, loginCode));
        verify(mailSender).send(any(MimeMessage.class));
    }
}
