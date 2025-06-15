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

    @Value("${app.frontend.url:http://localhost:8081}")
    private String frontendUrl;

    /**
     * Creates a consistent email header with SecureHerAI branding
     */
    private String createEmailHeader(String title) {
        StringBuilder header = new StringBuilder();
        header.append("<!DOCTYPE html><html><body style='font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4;'>");
        header.append("<div style='max-width: 600px; margin: 20px auto; background-color: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden;'>");
        
        // Add header banner
        header.append("<div style='background: linear-gradient(135deg, rgb(0, 110, 255) 0%, rgb(168, 85, 247) 100%); padding: 20px; text-align: center;'>");
        header.append("<h1 style='color: white; margin: 0; font-size: 24px;'>🛡️ SecureHerAI</h1>");
        header.append("</div>");
        
        // Content area
        header.append("<div style='padding: 30px 20px;'>");
        header.append("<h2 style='color: #4a4a4a; margin-top: 0;'>" + title + "</h2>");
        
        return header.toString();
    }

    /**
     * Creates a consistent email footer
     */
    private String createEmailFooter() {
        StringBuilder footer = new StringBuilder();
        
        // Add footer
        footer.append("<hr style='margin: 30px 0; border: none; border-top: 1px solid #eee;'>");
        footer.append("<div style='text-align: center; color: #666; font-size: 12px;'>");
        footer.append("<p>© 2025 SecureHerAI. All rights reserved.</p>");
        footer.append("<p>This email was sent from a no-reply address. Please do not reply to this email.</p>");
        footer.append("</div>");
        
        footer.append("</div>"); // Close content div
        footer.append("</div>"); // Close container div
        footer.append("</body></html>");
        
        return footer.toString();
    }

    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("SecureHerAI - Password Reset Request");
            
            // Create reset link for web/app deep linking
            String resetLink = frontendUrl + "/reset-password?token=" + resetToken + "&email=" + toEmail;
            String appResetLink = "secureheraiapp://reset-password?token=" + resetToken + "&email=" + toEmail;
            
            StringBuilder emailBody = new StringBuilder();
            emailBody.append(createEmailHeader("Password Reset Request"));
            emailBody.append("<p>Dear User,</p>");
            emailBody.append("<p>You have requested to reset your password for your <b>SecureHerAI</b> account.</p>");
            
            // Add reset button/link
            emailBody.append("<div style='margin: 30px 0; text-align: center;'>");
            emailBody.append("<a href='" + resetLink + "' style='background-color: rgb(0, 110, 255); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; margin-right: 10px;'>Reset on Web</a>");
            emailBody.append("<a href='" + appResetLink + "' style='background-color: rgb(168, 85, 247); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;'>Open in App</a>");
            emailBody.append("</div>");
            
            emailBody.append("<p>Or, if the button doesn't work, you can manually enter this reset code in the app:</p>");
            emailBody.append("<p><b style='font-size: 18px; color: rgb(0, 110, 255); background-color: #f5f5f5; padding: 8px 12px; border-radius: 4px; display: inline-block; font-family: monospace;'>" + resetToken + "</b></p>");
            
            emailBody.append("<p><i>This reset link and code will expire in 1 hour for security reasons.</i></p>");
            emailBody.append("<p>If you did not request this password reset, please ignore this email and consider changing your password as a precaution.</p>");
            
            // Add manual link for copy-paste
            emailBody.append("<hr style='margin: 20px 0; border: none; border-top: 1px solid #eee;'>");
            emailBody.append("<p style='font-size: 12px; color: #666;'>If the button above doesn't work, copy and paste this link into your browser:</p>");
            emailBody.append("<p style='font-size: 12px; word-break: break-all; color: #007bff;'>" + resetLink + "</p>");
            
            emailBody.append("<p>Best regards,<br><b>SecureHerAI Team</b></p>");
            emailBody.append(createEmailFooter());
            
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
            
            String loginUrl = frontendUrl + "/login";
            
            StringBuilder emailBody = new StringBuilder();
            emailBody.append(createEmailHeader("Welcome to SecureHerAI!"));
            emailBody.append("<p>Dear ").append(fullName).append(",</p>");
            emailBody.append("<p>Welcome to <b>SecureHerAI</b>! Your account has been successfully created.</p>");
            
            // Add login button
            emailBody.append("<div style='margin: 30px 0; text-align: center;'>");
            emailBody.append("<a href='" + loginUrl + "' style='background-color: rgb(34, 197, 94); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;'>Login Now</a>");
            emailBody.append("</div>");
            
            emailBody.append("<p><b>Important:</b> Please log in to verify your account. Accounts that remain unverified for more than 7 days will be automatically deleted.</p>");
            emailBody.append("<p>SecureHerAI is designed to keep you safe with advanced safety features including:</p>");
            emailBody.append("<ul>");
            emailBody.append("<li>🔄 Real-time location sharing with trusted contacts</li>");
            emailBody.append("<li>🚨 Emergency SOS alerts</li>");
            emailBody.append("<li>📍 Journey tracking and safety notifications</li>");
            emailBody.append("<li>🤖 AI-powered risk assessment</li>");
            emailBody.append("</ul>");
            emailBody.append("<p>Get started by setting up your emergency contacts and notification preferences in the app.</p>");
            
            // Add manual link for copy-paste
            emailBody.append("<hr style='margin: 20px 0; border: none; border-top: 1px solid #eee;'>");
            emailBody.append("<p style='font-size: 12px; color: #666;'>If the button above doesn't work, copy and paste this link:</p>");
            emailBody.append("<p style='font-size: 12px; word-break: break-all; color: #007bff;'>" + loginUrl + "</p>");
            
            emailBody.append("<p>Stay safe,<br><b>SecureHerAI Team</b></p>");
            emailBody.append(createEmailFooter());
            
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
            
            // Create login verification link
            String verifyUrl = frontendUrl + "/verify-login?code=" + loginCode + "&email=" + toEmail;
            String appVerifyUrl = "secureheraiapp://verify-login?code=" + loginCode + "&email=" + toEmail;
            
            StringBuilder emailBody = new StringBuilder();
            emailBody.append(createEmailHeader("Login Verification Code"));
            emailBody.append("<p>Dear ").append(fullName).append(",</p>");
            emailBody.append("<p>You are attempting to sign in to your <b>SecureHerAI</b> account.</p>");
            
            // Add verification button
            emailBody.append("<div style='margin: 30px 0; text-align: center;'>");
            emailBody.append("<a href='" + verifyUrl + "' style='background-color: rgb(0, 110, 255); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; margin-right: 10px;'>Verify on Web</a>");
            emailBody.append("<a href='" + appVerifyUrl + "' style='background-color: rgb(168, 85, 247); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;'>Open in App</a>");
            emailBody.append("</div>");
            
            emailBody.append("<p>Or manually enter this verification code in the app:</p>");
            emailBody.append("<div style='text-align: center; margin: 20px 0;'>");
            emailBody.append("<div style='font-size: 32px; font-weight: bold; color: rgb(0, 110, 255); background-color: #f8f9ff; padding: 20px; border-radius: 8px; border: 2px dashed rgb(0, 110, 255); display: inline-block; font-family: monospace; letter-spacing: 4px;'>" + loginCode + "</div>");
            emailBody.append("</div>");
            
            emailBody.append("<p><i>⏰ This code will expire in 10 minutes for security reasons.</i></p>");
            emailBody.append("<p><b>Security Notice:</b> If you did not attempt to sign in, please ignore this email and consider changing your password immediately.</p>");
            
            // Add manual link for copy-paste
            emailBody.append("<hr style='margin: 20px 0; border: none; border-top: 1px solid #eee;'>");
            emailBody.append("<p style='font-size: 12px; color: #666;'>If the button above doesn't work, copy and paste this link:</p>");
            emailBody.append("<p style='font-size: 12px; word-break: break-all; color: #007bff;'>" + verifyUrl + "</p>");
            
            emailBody.append("<p>Best regards,<br><b>SecureHerAI Team</b></p>");
            emailBody.append(createEmailFooter());
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
            
            String appUrl = frontendUrl + "/dashboard";
            
            StringBuilder emailBody = new StringBuilder();
            emailBody.append(createEmailHeader("Welcome to SecureHerAI!"));
            emailBody.append("<p>Dear " + name + ",</p>");
            emailBody.append("<p>Thank you for signing up with <b>SecureHerAI</b> using your " + provider + " account! 🚀</p>");
            emailBody.append("<p>Your account has been created successfully and you can now access all premium safety features.</p>");
            
            // Add get started button
            emailBody.append("<div style='margin: 30px 0; text-align: center;'>");
            emailBody.append("<a href='" + appUrl + "' style='background-color: rgb(168, 85, 247); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;'>Get Started</a>");
            emailBody.append("</div>");
            
            emailBody.append("<p><b>What's Next?</b></p>");
            emailBody.append("<ul>");
            emailBody.append("<li>📱 Set up your emergency contacts</li>");
            emailBody.append("<li>🌍 Configure your location preferences</li>");
            emailBody.append("<li>🔔 Customize your notification settings</li>");
            emailBody.append("<li>🛡️ Explore our safety features</li>");
            emailBody.append("</ul>");
            
            emailBody.append("<p>We're committed to helping you stay safe and secure every step of the way.</p>");
            
            // Add manual link for copy-paste
            emailBody.append("<hr style='margin: 20px 0; border: none; border-top: 1px solid #eee;'>");
            emailBody.append("<p style='font-size: 12px; color: #666;'>If the button above doesn't work, copy and paste this link:</p>");
            emailBody.append("<p style='font-size: 12px; word-break: break-all; color: #007bff;'>" + appUrl + "</p>");
            
            emailBody.append("<p>Best regards,<br><b>SecureHerAI Team</b></p>");
            emailBody.append(createEmailFooter());
            
            helper.setText(emailBody.toString(), true);
            mailSender.send(mimeMessage);
            
        } catch (MessagingException e) {
            // Log error but don't fail the registration process
            System.err.println("Failed to send welcome email: " + e.getMessage());
        }
    }
}
