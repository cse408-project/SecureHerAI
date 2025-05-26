package com.secureherai.secureherai_api.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("SecureHerAI - Password Reset Request");
            
            String resetUrl = "https://secureherai.com/reset-password?token=" + resetToken;
            String emailBody = String.format(
                "Dear User,\n\n" +
                "You have requested to reset your password for your SecureHerAI account.\n\n" +
                "Please click the link below to reset your password:\n%s\n\n" +
                "This link will expire in 1 hour for security reasons.\n\n" +
                "If you did not request this password reset, please ignore this email.\n\n" +
                "Best regards,\n" +
                "SecureHerAI Team",
                resetUrl
            );
            
            message.setText(emailBody);
            
            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("Failed to send password reset email: " + e.getMessage(), e);
        }
    }

    public void sendWelcomeEmail(String toEmail, String fullName) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Welcome to SecureHerAI!");
            
            String emailBody = String.format(
                "Dear %s,\n\n" +
                "Welcome to SecureHerAI! Your account has been successfully created.\n\n" +
                "SecureHerAI is designed to keep you safe with advanced safety features including:\n" +
                "- Real-time location sharing with trusted contacts\n" +
                "- Emergency SOS alerts\n" +
                "- Journey tracking and safety notifications\n" +
                "- AI-powered risk assessment\n\n" +
                "Get started by setting up your emergency contacts and notification preferences in the app.\n\n" +
                "Stay safe,\n" +
                "SecureHerAI Team",
                fullName
            );
            
            message.setText(emailBody);
            
            mailSender.send(message);
        } catch (Exception e) {
            // Don't throw exception for welcome email failure, just log it
            System.err.println("Failed to send welcome email: " + e.getMessage());
        }
    }
}
