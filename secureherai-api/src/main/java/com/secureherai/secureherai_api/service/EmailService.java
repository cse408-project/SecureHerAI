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
            emailBody.append("<p><b>Important:</b> Please log in to verify your account. Accounts that remain unverified for more than 7 days will be automatically deleted.</p>");
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

    public void sendLoginCodeEmail(String toEmail, String fullName, String loginCode) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("SecureHerAI - Login Verification Code");
            
            StringBuilder emailBody = new StringBuilder();
            emailBody.append("<!DOCTYPE html><html><body style='font-family: Arial, sans-serif; line-height: 1.6;'>");
            emailBody.append("<div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;'>");
            emailBody.append("<h2 style='color: #4a4a4a;'>Login Verification Code</h2>");
            emailBody.append("<p>Dear ").append(fullName).append(",</p>");
            emailBody.append("<p>You are attempting to sign in to your <b>SecureHerAI</b> account.</p>");
            emailBody.append("<p>Your login verification code is: <b style='font-size: 24px; color: rgb(0, 110, 255); background-color: #f5f5f5; padding: 10px; border-radius: 5px; display: inline-block;'>" + loginCode + "</b></p>");
            emailBody.append("<p>Enter this code in the app or website to complete your login.</p>");
            emailBody.append("<p><i>This code will expire in 10 minutes for security reasons.</i></p>");
            emailBody.append("<p>If you did not attempt to sign in, please ignore this email and consider changing your password.</p>");
            emailBody.append("<p>Best regards,<br><b>SecureHerAI Team</b></p>");
            emailBody.append("</div></body></html>");
            
            helper.setText(emailBody.toString(), true); // true indicates HTML content
            
            mailSender.send(mimeMessage);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send login code email: " + e.getMessage(), e);
        }
    }

    public void sendWelcomeEmailForOAuth(String toEmail, String name, String provider) {
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
            emailBody.append("<p>Dear " + name + ",</p>");
            emailBody.append("<p>Thank you for signing up with <b>SecureHerAI</b> using your " + provider + " account.</p>");
            emailBody.append("<p>Your account has been created successfully and you can now use all features of our application.</p>");
            emailBody.append("<p>We're committed to helping you stay safe and secure.</p>");
            emailBody.append("<p>Best regards,<br><b>SecureHerAI Team</b></p>");
            emailBody.append("</div></body></html>");
            
            helper.setText(emailBody.toString(), true);
            mailSender.send(mimeMessage);
            
        } catch (MessagingException e) {
            // Log error but don't fail the registration process
            System.err.println("Failed to send welcome email: " + e.getMessage());
        }
    }
}
