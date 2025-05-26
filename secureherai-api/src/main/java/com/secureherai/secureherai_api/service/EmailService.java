package com.secureherai.secureherai_api.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("SecureHerAI - Password Reset Request");
            
            StringBuilder emailBody = new StringBuilder();
            emailBody.append("<!DOCTYPE html><html><body style='font-family: Arial, sans-serif; line-height: 1.6;'>");
            emailBody.append("<div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;'>");
            emailBody.append("<h2 style='color: #4a4a4a;'>Password Reset Request</h2>");
            emailBody.append("<p>Dear User,</p>");
            emailBody.append("<p>You have requested to reset your password for your <b>SecureHerAI</b> account.</p>");
            emailBody.append("<p>Your password reset code is: <b style='font-size: 18px; color:rgb(0, 110, 255);'>" + resetToken + "</b></p>");
            emailBody.append("<p>Enter this code in the app or website to complete your password reset.</p>");
            emailBody.append("<p><i>This code will expire in 1 hour for security reasons.</i></p>");
            emailBody.append("<p>If you did not request this password reset, please ignore this email.</p>");
            emailBody.append("<p>Best regards,<br><b>SecureHerAI Team</b></p>");
            emailBody.append("</div></body></html>");
            
            helper.setText(emailBody.toString(), true); // true indicates HTML content
            
            mailSender.send(mimeMessage);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send password reset email: " + e.getMessage(), e);
        }
    }

    public void sendWelcomeEmail(String toEmail, String fullName) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Welcome to SecureHerAI!");
            
            StringBuilder emailBody = new StringBuilder();
            emailBody.append("<!DOCTYPE html><html><body style='font-family: Arial, sans-serif; line-height: 1.6;'>");
            emailBody.append("<div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;'>");
            emailBody.append("<h2 style='color: #4a4a4a;'>Welcome to SecureHerAI!</h2>");
            emailBody.append("<p>Dear ").append(fullName).append(",</p>");
            emailBody.append("<p>Welcome to <b>SecureHerAI</b>! Your account has been successfully created.</p>");
            emailBody.append("<p>SecureHerAI is designed to keep you safe with advanced safety features including:</p>");
            emailBody.append("<ul>");
            emailBody.append("<li>Real-time location sharing with trusted contacts</li>");
            emailBody.append("<li>Emergency SOS alerts</li>");
            emailBody.append("<li>Journey tracking and safety notifications</li>");
            emailBody.append("<li>AI-powered risk assessment</li>");
            emailBody.append("</ul>");
            emailBody.append("<p>Get started by setting up your emergency contacts and notification preferences in the app.</p>");
            emailBody.append("<p>Stay safe,<br><b>SecureHerAI Team</b></p>");
            emailBody.append("</div></body></html>");
            
            helper.setText(emailBody.toString(), true); // true indicates HTML content
            
            mailSender.send(mimeMessage);
        } catch (MessagingException e) {
            // Don't throw exception for welcome email failure, just log it
            System.err.println("Failed to send welcome email: " + e.getMessage());
        }
    }
}
