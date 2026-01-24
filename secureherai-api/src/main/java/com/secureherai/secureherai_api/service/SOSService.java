package com.secureherai.secureherai_api.service;

import com.secureherai.secureherai_api.dto.sos.LocationDto;
import com.secureherai.secureherai_api.entity.Alert;
import com.secureherai.secureherai_api.entity.AlertResponder;
import com.secureherai.secureherai_api.entity.IncidentReport;
import com.secureherai.secureherai_api.entity.User;
import com.secureherai.secureherai_api.entity.Responder;
import com.secureherai.secureherai_api.enums.AlertStatus;
import com.secureherai.secureherai_api.repository.AlertRepository;
import com.secureherai.secureherai_api.repository.AlertResponderRepository;
import com.secureherai.secureherai_api.repository.UserRepository;
import com.secureherai.secureherai_api.repository.ResponderRepository;
import com.secureherai.secureherai_api.service.GeminiSpeechService.SpeechTranscriptionResult;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ExecutionException;
import java.time.LocalDateTime;

/**
 * Service for handling SOS alerts (voice and text-based)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SOSService {

    private final AlertRepository alertRepository;
    private final AlertResponderRepository alertResponderRepository;
    private final UserRepository userRepository;
    private final ResponderRepository responderRepository;
    private final GeminiSpeechService geminiSpeechService;
    private final NotificationService notificationService;
    private final SettingsService settingsService;
    private final ReportService reportService;

    // Default SOS keywords
    private static final List<String> DEFAULT_KEYWORDS = Arrays.asList("help", "emergency", "sos");

    // Directory for storing audio files
    private static final String SOS_AUDIO_DIR = "data/sos";

    /**
     * Process voice command and create an alert if a keyword is detected
     * Uses Gemini AI for both transcription AND severity/incident analysis
     *
     * @param userId    The user ID from authentication
     * @param audioFile The audio file containing the voice command
     * @param location  Location information
     * @return The created alert or null if no keywords were detected
     */
    @Transactional
    public Alert processVoiceCommand(UUID userId, MultipartFile audioFile, LocationDto location)
            throws IOException, InterruptedException, ExecutionException, Exception {

        log.info("Processing voice command for user: {}", userId);

        File tempFile = null;
        try {
            // Save the uploaded file temporarily
            tempFile = saveTemporaryFile(audioFile);

            // Transcribe the audio file using Gemini AI (includes severity analysis)
            SpeechTranscriptionResult transcriptionResult = geminiSpeechService.transcribeAudioFile(tempFile);

            if (!transcriptionResult.isSuccess()) {
                log.warn("Transcription failed: {}", transcriptionResult.getMessage());
                return null;
            }

            String transcribedText = transcriptionResult.getText();
            log.info("Transcribed text: {} | Severity: {} | IncidentType: {} | HasEmergencyKeyword: {}",
                    transcribedText, transcriptionResult.getSeverity(),
                    transcriptionResult.getIncidentType(), transcriptionResult.isHasEmergencyKeyword());

            // Use Gemini's AI keyword detection OR fallback to local keyword check
            boolean hasKeyword = transcriptionResult.isHasEmergencyKeyword()
                    || containsKeyword(transcribedText, userId);

            if (hasKeyword) {
                // Save the audio file to a persistent location
                String audioUrl = saveAudioFile(audioFile, userId);

                // Create alert with AI-analyzed severity and incident type
                Alert alert = new Alert();
                alert.setUserId(userId);
                alert.setLatitude(location.getLatitude());
                alert.setLongitude(location.getLongitude());
                alert.setAddress(location.getAddress());
                alert.setTriggerMethod("voice");
                alert.setAlertMessage(transcribedText);
                alert.setAudioRecording(audioUrl);

                // Set AI-analyzed fields
                alert.setSeverity(transcriptionResult.getSeverity());
                alert.setIncidentType(transcriptionResult.getIncidentType());
                alert.setEmotionDetected(transcriptionResult.getEmotion());
                alert.setAiSummary(transcriptionResult.getSummary());

                // Alert status is WAITING on creation (becomes ACTIVE when a responder accepts)
                alert.setStatus(AlertStatus.WAITING);

                // Save the alert
                Alert savedAlert = alertRepository.save(alert);

                // Auto-generate incident report for this alert
                try {
                    IncidentReport autoReport = reportService.autoGenerateReportFromAlert(savedAlert);
                    if (autoReport != null) {
                        log.info("Auto-generated incident report for alert: {}", savedAlert.getId());
                    }
                } catch (Exception e) {
                    log.warn("Failed to auto-generate report for alert {}: {}", savedAlert.getId(), e.getMessage());
                }

                // Send notifications to trusted contacts and nearby responders
                notificationService.sendSOSAlertNotifications(savedAlert);

                return savedAlert;
            } else {
                log.info("No keywords detected in voice command");
                return null;
            }
        } finally {
            // Clean up the temporary file
            // cleanupTemporaryFile(tempFile);
        }
    }

    /**
     * Process voice command from URL and create an alert if a keyword is detected
     * Uses Gemini AI for both transcription AND severity/incident analysis
     *
     * @param userId   The user ID from authentication
     * @param audioUrl The URL of the audio file
     * @param location Location information
     * @return The created alert or null if no keywords were detected
     */
    @Transactional
    public Alert processVoiceCommandFromUrl(UUID userId, String audioUrl, LocationDto location)
            throws IOException, InterruptedException, ExecutionException, Exception {

        log.info("Processing voice command from URL for user: {}", userId);

        // Transcribe the audio from URL using Gemini AI (includes severity analysis)
        SpeechTranscriptionResult transcriptionResult = geminiSpeechService.transcribeAudioFromUrl(audioUrl, null);

        if (!transcriptionResult.isSuccess()) {
            log.warn("URL transcription failed: {}", transcriptionResult.getMessage());
            return null;
        }

        String transcribedText = transcriptionResult.getText();
        log.info("Transcribed text from URL: {} | Severity: {} | IncidentType: {} | HasEmergencyKeyword: {}",
                transcribedText, transcriptionResult.getSeverity(),
                transcriptionResult.getIncidentType(), transcriptionResult.isHasEmergencyKeyword());

        // Use Gemini's AI keyword detection OR fallback to local keyword check
        boolean hasKeyword = transcriptionResult.isHasEmergencyKeyword() || containsKeyword(transcribedText, userId);

        if (hasKeyword) {
            // Create alert with AI-analyzed severity and incident type
            Alert alert = new Alert();
            alert.setUserId(userId);
            alert.setLatitude(location.getLatitude());
            alert.setLongitude(location.getLongitude());
            alert.setAddress(location.getAddress());
            alert.setTriggerMethod("voice");
            alert.setAlertMessage(transcribedText);
            alert.setAudioRecording(audioUrl); // Use the provided URL directly
            alert.setTriggeredAt(LocalDateTime.now());

            // Set AI-analyzed fields
            alert.setSeverity(transcriptionResult.getSeverity());
            alert.setIncidentType(transcriptionResult.getIncidentType());
            alert.setEmotionDetected(transcriptionResult.getEmotion());
            alert.setAiSummary(transcriptionResult.getSummary());

            // Alert status is WAITING on creation (becomes ACTIVE when a responder accepts)
            alert.setStatus(AlertStatus.WAITING);

            // Save the alert
            Alert savedAlert = alertRepository.save(alert);

            // Auto-generate incident report for this alert
            try {
                IncidentReport autoReport = reportService.autoGenerateReportFromAlert(savedAlert);
                if (autoReport != null) {
                    log.info("Auto-generated incident report for alert: {}", savedAlert.getId());
                }
            } catch (Exception e) {
                log.warn("Failed to auto-generate report for alert {}: {}", savedAlert.getId(), e.getMessage());
            }

            // Send notifications to trusted contacts and nearby responders
            notificationService.sendSOSAlertNotifications(savedAlert);

            return savedAlert;
        } else {
            log.info("No keywords detected in voice command from URL");
            return null;
        }
    }

    /**
     * Process text command and create an alert if the provided keyword matches
     * user's SOS keyword. Uses Gemini AI for severity and incident analysis.
     *
     * @param userId   The user ID from authentication
     * @param message  The text message
     * @param keyword  The keyword to check
     * @param location Location information
     * @return The created alert or null if the keyword doesn't match
     */
    @Transactional
    public Alert processTextCommand(UUID userId, String message, String keyword, LocationDto location) {

        log.info("Processing text command for user: {}", userId);

        try {
            // Get user's custom SOS keyword
            String userSosKeyword = settingsService.getSosKeyword(userId);

            // Check if the provided keyword matches the user's SOS keyword
            // (case-insensitive)
            if (keyword != null && keyword.toLowerCase().equals(userSosKeyword.toLowerCase())) {

                // Analyze the message text using Gemini AI for severity classification
                SpeechTranscriptionResult analysisResult = geminiSpeechService.analyzeTextMessage(message);

                log.info(
                        "Text analysis complete: Severity: {} | IncidentType: {} | HasEmergencyKeyword: {} | FalseAlarm: {}",
                        analysisResult.getSeverity(), analysisResult.getIncidentType(),
                        analysisResult.isHasEmergencyKeyword(), analysisResult.isFalseAlarm());

                // Check if this is a false alarm - don't create an alert
                if (analysisResult.isFalseAlarm() || "FALSE_ALARM".equals(analysisResult.getSeverity())) {
                    log.info("AI detected FALSE_ALARM - not creating alert for user: {}", userId);
                    return null;
                }

                // Create alert with AI-analyzed severity and incident type
                Alert alert = new Alert();
                alert.setUserId(userId);
                alert.setLatitude(location.getLatitude());
                alert.setLongitude(location.getLongitude());
                alert.setAddress(location.getAddress());
                alert.setTriggerMethod("text");
                alert.setAlertMessage(message);
                alert.setTriggeredAt(LocalDateTime.now());

                // Set AI-analyzed fields (truncate summary if needed)
                alert.setSeverity(analysisResult.getSeverity());
                alert.setIncidentType(analysisResult.getIncidentType());
                alert.setEmotionDetected(analysisResult.getEmotion());

                // Ensure summary is not too long for database
                String summary = analysisResult.getSummary();
                if (summary != null && summary.length() > 200) {
                    summary = summary.substring(0, 197) + "...";
                }
                alert.setAiSummary(summary);

                // Alert status is WAITING on creation (becomes ACTIVE when a responder accepts)
                alert.setStatus(AlertStatus.WAITING);

                // Save the alert
                Alert savedAlert = alertRepository.save(alert);

                // Auto-generate incident report for this alert
                try {
                    IncidentReport autoReport = reportService.autoGenerateReportFromAlert(savedAlert);
                    if (autoReport != null) {
                        log.info("Auto-generated incident report for alert: {}", savedAlert.getId());
                    }
                } catch (Exception e) {
                    log.warn("Failed to auto-generate report for alert {}: {}", savedAlert.getId(), e.getMessage());
                }

                // Send notifications to trusted contacts and nearby responders
                notificationService.sendSOSAlertNotifications(savedAlert);

                return savedAlert;
            } else {
                log.info("Keyword '{}' does not match user's SOS keyword '{}' in text command", keyword,
                        userSosKeyword);
                return null;
            }
        } catch (Exception e) {
            log.error("Error processing text command for user: {}", userId, e);
            return null;
        }
    }

    /**
     * Check if text contains any of the default keywords or user's custom keyword
     *
     * @param text   The text to check
     * @param userId The user ID to get custom keyword
     * @return True if any keyword is found, false otherwise
     */
    private boolean containsKeyword(String text, UUID userId) {
        if (text == null || text.isEmpty()) {
            return false;
        }

        String lowercaseText = text.toLowerCase();

        // Check default keywords
        boolean hasDefaultKeyword = DEFAULT_KEYWORDS.stream().anyMatch(lowercaseText::contains);

        // Check user's custom keyword
        try {
            String userKeyword = settingsService.getSosKeyword(userId);
            boolean hasUserKeyword = userKeyword != null && lowercaseText.contains(userKeyword.toLowerCase());

            return hasDefaultKeyword || hasUserKeyword;
        } catch (Exception e) {
            log.warn("Error getting user's SOS keyword for user: {}, using default keywords only", userId, e);
            return hasDefaultKeyword;
        }
    }

    /**
     * Saves audio file to persistent storage
     *
     * @param audioFile The audio file
     * @param userId    User ID for file naming
     * @return The relative URL to the saved file
     */
    private String saveAudioFile(MultipartFile audioFile, UUID userId) throws IOException {
        // Create directory if it doesn't exist
        Path sosDir = Paths.get(SOS_AUDIO_DIR);
        if (!Files.exists(sosDir)) {
            Files.createDirectories(sosDir);
        }

        // Generate filename with user ID and timestamp
        String originalFileName = audioFile.getOriginalFilename();
        String fileExtension = getFileExtension(originalFileName);
        String uniqueFileName = String.format("sos_voice_%s_%d%s",
                userId.toString(),
                System.currentTimeMillis(),
                fileExtension);

        Path filePath = sosDir.resolve(uniqueFileName);

        // Copy uploaded file to persistent storage
        Files.copy(audioFile.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        log.info("Saved SOS audio file: {}", filePath.toAbsolutePath());

        // Return relative path/URL to the file
        return SOS_AUDIO_DIR + "/" + uniqueFileName;
    }

    /**
     * Saves the uploaded file to a temporary location
     *
     * @param audioFile The uploaded file
     * @return The temporary file
     */
    private File saveTemporaryFile(MultipartFile audioFile) throws IOException {
        // Create temporary directory if it doesn't exist
        Path tempDir = Paths.get("data/temp");
        if (!Files.exists(tempDir)) {
            Files.createDirectories(tempDir);
        }

        // Generate unique filename
        String originalFileName = audioFile.getOriginalFilename();
        String fileExtension = getFileExtension(originalFileName);
        String uniqueFileName = String.format("temp_sos_%d_%s%s",
                System.currentTimeMillis(),
                Thread.currentThread().getId(),
                fileExtension);

        Path tempFilePath = tempDir.resolve(uniqueFileName);

        // Copy uploaded file to temporary location
        Files.copy(audioFile.getInputStream(), tempFilePath, StandardCopyOption.REPLACE_EXISTING);

        File tempFile = tempFilePath.toFile();
        log.debug("Saved temporary file: {}", tempFile.getAbsolutePath());

        return tempFile;
    }

    /**
     * Cleans up the temporary file
     *
     * @param tempFile The temporary file to delete
     */
    private void cleanupTemporaryFile(File tempFile) {
        if (tempFile != null && tempFile.exists()) {
            try {
                if (tempFile.delete()) {
                    log.debug("Deleted temporary file: {}", tempFile.getAbsolutePath());
                } else {
                    log.warn("Failed to delete temporary file: {}", tempFile.getAbsolutePath());
                }
            } catch (Exception e) {
                log.warn("Error deleting temporary file: {}", tempFile.getAbsolutePath(), e);
            }
        }
    }

    /**
     * Extract file extension from filename
     *
     * @param fileName The filename
     * @return The file extension including the dot
     */
    private String getFileExtension(String fileName) {
        if (fileName == null || fileName.isEmpty()) {
            return ".wav"; // Default extension
        }

        int lastDotIndex = fileName.lastIndexOf('.');
        if (lastDotIndex > 0 && lastDotIndex < fileName.length() - 1) {
            return fileName.substring(lastDotIndex);
        }

        return ".wav"; // Default extension
    }

    /**
     * Get all alerts for a specific user
     * 
     * @param userId The user ID
     * @return List of user's alerts
     */
    public List<Alert> getUserAlerts(UUID userId) {
        log.info("Getting all alerts for user: {}", userId);
        return alertRepository.findByUserId(userId);
    }

    /**
     * Get all active alerts (for responders)
     * 
     * @return List of all active alerts
     */
    public List<Alert> getAllAlerts() {
        log.info("Getting all active alerts for responders");
        return alertRepository.findAllAlerts();
    }

    /**
     * Cancel an alert
     * 
     * @param alertId The alert ID
     * @param userId  The user ID (for authorization)
     * @return The updated alert or null if not found or unauthorized
     */
    @Transactional
    public Alert cancelAlert(UUID alertId, UUID userId) {
        log.info("Canceling alert with ID: {} for user: {}", alertId, userId);

        // Find the alert and check if user is authorized
        Optional<Alert> alertOpt = alertRepository.findById(alertId);

        if (alertOpt.isEmpty()) {
            log.warn("Alert with ID: {} not found", alertId);
            return null;
        }

        Alert alert = alertOpt.get();

        // Check if the user owns this alert
        if (!alert.getUserId().equals(userId)) {
            log.warn("User {} is not authorized to cancel alert {}", userId, alertId);
            return null;
        }

        // Check if the alert can be canceled - only allow ACTIVE alerts
        // (FINISHED/DELETED/EXPIRED alerts cannot be canceled)
        AlertStatus currentStatus = alert.getStatus();
        if (!AlertStatus.ACTIVE.equals(currentStatus)) {
            log.warn("Alert {} is in {} state, cannot cancel", alertId, currentStatus);
            return null;
        }

        // Update alert status to DELETED (user-initiated cancellation)
        alert.setStatus(AlertStatus.DELETED);
        alert.setDeletedAt(LocalDateTime.now());

        // Save and return the updated alert
        return alertRepository.save(alert);
    }

    /**
     * Get participant location for navigation
     * For Users: returns responder's location
     * For Responders: returns user's location
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getAlertParticipantLocation(UUID alertId, UUID requesterId) {
        log.info("Getting participant location for alert: {} by user: {}", alertId, requesterId);

        // Find the alert
        Optional<Alert> alertOpt = alertRepository.findById(alertId);
        if (!alertOpt.isPresent()) {
            throw new RuntimeException("Alert not found with ID: " + alertId);
        }

        Alert alert = alertOpt.get();

        // Get the user who created the alert
        Optional<User> userOpt = userRepository.findById(alert.getUserId());
        if (!userOpt.isPresent()) {
            throw new RuntimeException("Alert user not found");
        }
        User alertUser = userOpt.get();

        // Check if requester is the alert user
        boolean isUser = alert.getUserId().equals(requesterId);

        // Check if requester is a responder for this alert
        Optional<AlertResponder> alertResponderOpt = alertResponderRepository.findByAlertIdAndResponderId(alertId,
                requesterId);
        boolean isResponder = alertResponderOpt.isPresent();

        if (!isUser && !isResponder) {
            throw new RuntimeException("User is not authorized to access this alert's participant location");
        }

        Map<String, Object> result = new HashMap<>();

        if (isUser) {
            // User is requesting responder's location
            // Find ANY responder for this alert
            List<AlertResponder> alertResponders = alertResponderRepository.findByAlertId(alertId);
            if (alertResponders.isEmpty()) {
                throw new RuntimeException("No responder assigned to this alert yet");
            }

            // Get the first accepted responder
            AlertResponder acceptedResponder = alertResponders.stream()
                    .filter(ar -> AlertStatus.ACCEPTED.equals(ar.getStatus()) ||
                            AlertStatus.EN_ROUTE.equals(ar.getStatus()) ||
                            AlertStatus.ARRIVED.equals(ar.getStatus()))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("No active responder found for this alert"));

            Optional<Responder> responderOpt = responderRepository.findById(acceptedResponder.getResponderId());
            if (!responderOpt.isPresent()) {
                throw new RuntimeException("Responder not found");
            }
            Responder responder = responderOpt.get();

            result.put("success", true);

            Map<String, Object> participantLocation = new HashMap<>();
            participantLocation.put("latitude", responder.getUser().getCurrentLatitude());
            participantLocation.put("longitude", responder.getUser().getCurrentLongitude());
            participantLocation.put("lastUpdate", responder.getUser().getLastLocationUpdate());
            result.put("participantLocation", participantLocation);

            Map<String, Object> participantInfo = new HashMap<>();
            participantInfo.put("name", responder.getUser().getFullName());
            participantInfo.put("role", "RESPONDER");
            participantInfo.put("responderType", responder.getResponderType().toString());
            participantInfo.put("badgeNumber", responder.getBadgeNumber());

            // Add contact information
            participantInfo.put("phone", responder.getUser().getPhone());
            participantInfo.put("email", responder.getUser().getEmail());
            participantInfo.put("profilePicture", responder.getUser().getProfilePicture());

            result.put("participantInfo", participantInfo);
        } else {
            // Responder is requesting user's location
            result.put("success", true);

            Map<String, Object> participantLocation = new HashMap<>();
            participantLocation.put("latitude", alertUser.getCurrentLatitude());
            participantLocation.put("longitude", alertUser.getCurrentLongitude());
            participantLocation.put("lastUpdate", alertUser.getLastLocationUpdate());
            result.put("participantLocation", participantLocation);

            Map<String, Object> participantInfo = new HashMap<>();
            participantInfo.put("name", alertUser.getFullName());
            participantInfo.put("role", "USER");

            // Add contact information
            participantInfo.put("phone", alertUser.getPhone());
            participantInfo.put("email", alertUser.getEmail());
            participantInfo.put("profilePicture", alertUser.getProfilePicture());

            result.put("participantInfo", participantInfo);
        }

        return result;
    }

    /**
     * Update alert status by responder (resolved, rejected)
     * Note: EN_ROUTE, ARRIVED, RESOLVED are responder statuses
     * (AlertResponder.status)
     * This method updates the Alert.status field which should only be: ACTIVE,
     * FINISHED, DELETED, EXPIRED
     * 
     * @param alertId     The alert ID to update
     * @param responderId The responder ID making the update
     * @param newStatus   The new status for the alert (FINISHED or DELETED)
     * @param notes       Optional notes about the status update
     * @return The updated alert or null if not found/unauthorized
     */
    @Transactional
    public Alert updateAlertStatus(UUID alertId, UUID responderId, String newStatus, String notes) {
        log.info("Updating alert {} to status {} by responder {}", alertId, newStatus, responderId);

        // Find the alert
        Optional<Alert> alertOpt = alertRepository.findById(alertId);
        if (alertOpt.isEmpty()) {
            log.warn("Alert not found: {}", alertId);
            return null;
        }

        Alert alert = alertOpt.get();

        // Verify this responder is assigned to the alert
        Optional<AlertResponder> alertResponderOpt = alertResponderRepository.findByAlertIdAndResponderId(alertId,
                responderId);
        if (alertResponderOpt.isEmpty()) {
            log.warn("Responder {} is not assigned to alert {}", responderId, alertId);
            return null;
        }

        // Valid Alert statuses that responders can set (not responder statuses)
        // RESOLVED/REJECTED -> FINISHED (alert is complete)
        List<AlertStatus> validAlertStatuses = Arrays.asList(AlertStatus.FINISHED);
        AlertStatus statusEnum;
        try {
            statusEnum = AlertStatus.fromString(newStatus);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid status: {}", newStatus);
            throw new IllegalArgumentException("Invalid status: " + newStatus);
        }

        if (!validAlertStatuses.contains(statusEnum)) {
            log.warn("Invalid alert status for responder update: {}", newStatus);
            throw new IllegalArgumentException(
                    "Invalid status: " + newStatus + ". Responders can only set Alert status to FINISHED.");
        }

        // Update alert status
        alert.setStatus(statusEnum);

        // If finishing the alert, set resolved time
        if (AlertStatus.FINISHED.equals(statusEnum)) {
            alert.setResolvedAt(LocalDateTime.now());
        }

        // Add notes if provided
        if (notes != null && !notes.trim().isEmpty()) {
            AlertResponder alertResponder = alertResponderOpt.get();
            alertResponder.setNotes(notes);
            alertResponderRepository.save(alertResponder);
        }

        // Save and return the updated alert
        Alert updatedAlert = alertRepository.save(alert);

        // Note: This method updates Alert.status only.
        // AlertResponder.status should be updated via the ResponderController
        // endpoints.

        // Notify the user about the status change
        try {
            notificationService.sendAlertStatusUpdate(updatedAlert.getUserId(), alertId, statusEnum.getValue(),
                    responderId);
            log.info("Alert status updated to {} for alert {}", statusEnum.getValue(), alertId);
        } catch (Exception e) {
            log.error("Error sending notification for alert status update", e);
        }

        return updatedAlert;
    }

    /**
     * Update alert severity (victim or assigned responder can change)
     * 
     * @param alertId     The alert ID to update
     * @param userId      The user ID making the update (must be victim or assigned
     *                    responder)
     * @param newSeverity The new severity value (CRITICAL, HIGH, MEDIUM, LOW,
     *                    FALSE_ALARM)
     * @return The updated alert or null if not found/unauthorized
     */
    @Transactional
    public Alert updateAlertSeverity(UUID alertId, UUID userId, String newSeverity) {
        log.info("Updating alert {} severity to {} by user {}", alertId, newSeverity, userId);

        // Find the alert
        Optional<Alert> alertOpt = alertRepository.findById(alertId);
        if (alertOpt.isEmpty()) {
            log.warn("Alert not found: {}", alertId);
            return null;
        }

        Alert alert = alertOpt.get();

        // Check authorization: user must be victim OR assigned responder
        boolean isVictim = alert.getUserId().equals(userId);
        boolean isAssignedResponder = false;

        if (!isVictim) {
            // Check if user is an assigned responder with ACCEPTED, EN_ROUTE, or ARRIVED
            // status
            Optional<AlertResponder> alertResponderOpt = alertResponderRepository.findByAlertIdAndResponderId(alertId,
                    userId);
            if (alertResponderOpt.isPresent()) {
                AlertStatus responderStatus = alertResponderOpt.get().getStatus();
                isAssignedResponder = responderStatus == AlertStatus.ACCEPTED ||
                        responderStatus == AlertStatus.EN_ROUTE ||
                        responderStatus == AlertStatus.ARRIVED;
            }
        }

        if (!isVictim && !isAssignedResponder) {
            log.warn("User {} is not authorized to update severity for alert {}", userId, alertId);
            return null;
        }

        // Alert must be ongoing (WAITING or ACTIVE)
        if (!alert.getStatus().isAlertOngoing()) {
            log.warn("Cannot update severity for completed alert {}", alertId);
            throw new IllegalArgumentException("Cannot update severity for a completed alert");
        }

        // Update severity
        alert.setSeverity(newSeverity);
        Alert updatedAlert = alertRepository.save(alert);

        log.info("Alert {} severity updated to {} by {}", alertId, newSeverity, isVictim ? "victim" : "responder");

        return updatedAlert;
    }

    /**
     * Get alert details including responder information if available
     * 
     * @param alertId The alert ID to retrieve
     * @param userId  The user ID requesting the details (for authorization)
     * @return Map containing alert details and responder info if available
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getAlertDetails(UUID alertId, UUID userId) {
        log.info("Getting alert details for alertId: {} requested by userId: {}", alertId, userId);

        Map<String, Object> result = new HashMap<>();

        // Find the alert
        Optional<Alert> alertOpt = alertRepository.findById(alertId);
        if (alertOpt.isEmpty()) {
            log.warn("Alert not found: {}", alertId);
            result.put("success", false);
            result.put("error", "Alert not found");
            return result;
        }

        Alert alert = alertOpt.get();

        // Check authorization - must be either the alert creator or an assigned
        // responder
        boolean isAuthorized = alert.getUserId().equals(userId);

        if (!isAuthorized) {
            // Check if user is a responder for this alert
            Optional<AlertResponder> alertResponderOpt = alertResponderRepository.findByAlertIdAndResponderId(alertId,
                    userId);
            isAuthorized = alertResponderOpt.isPresent();
        }

        if (!isAuthorized) {
            log.warn("User {} is not authorized to view alert {}", userId, alertId);
            result.put("success", false);
            result.put("error", "Not authorized to view this alert");
            return result;
        }

        // Basic alert details
        result.put("success", true);
        result.put("alert", alert);

        // If there are responders assigned, include their information
        List<AlertResponder> alertResponders = alertResponderRepository.findByAlertId(alertId);
        if (!alertResponders.isEmpty()) {
            List<Map<String, Object>> responderInfoList = new java.util.ArrayList<>();

            for (AlertResponder alertResponder : alertResponders) {
                Optional<Responder> responderOpt = responderRepository.findById(alertResponder.getResponderId());
                if (responderOpt.isPresent()) {
                    Responder responder = responderOpt.get();
                    User responderUser = responder.getUser();

                    Map<String, Object> responderInfo = new HashMap<>();
                    responderInfo.put("responderId", responder.getUserId());
                    responderInfo.put("name", responderUser.getFullName());
                    responderInfo.put("phone", responderUser.getPhone());
                    responderInfo.put("email", responderUser.getEmail());
                    responderInfo.put("profilePicture", responderUser.getProfilePicture());
                    responderInfo.put("responderType", responder.getResponderType().toString());
                    responderInfo.put("badgeNumber", responder.getBadgeNumber());
                    responderInfo.put("status", alertResponder.getStatus());
                    responderInfo.put("acceptedAt", alertResponder.getAcceptedAt());
                    responderInfo.put("notes", alertResponder.getNotes());

                    responderInfoList.add(responderInfo);
                }
            }

            result.put("responders", responderInfoList);
        }

        return result;
    }

    /**
     * Poke alert - Send notification to more nearby responders
     * Limited to MAX_POKES (2) pokes per alert
     * 
     * @param alertId The alert ID to poke
     * @param userId  The user ID making the poke (must be the victim)
     * @return Map containing result of the poke operation
     */
    @Transactional
    public Map<String, Object> pokeAlert(UUID alertId, UUID userId) {
        log.info("Poking alert {} by user {}", alertId, userId);

        Map<String, Object> result = new HashMap<>();

        // Find the alert
        Optional<Alert> alertOpt = alertRepository.findById(alertId);
        if (alertOpt.isEmpty()) {
            log.warn("Alert not found: {}", alertId);
            result.put("error", "Alert not found");
            result.put("statusCode", 404);
            return result;
        }

        Alert alert = alertOpt.get();

        // Check authorization: user must be the victim
        if (!alert.getUserId().equals(userId)) {
            log.warn("User {} is not authorized to poke alert {}", userId, alertId);
            result.put("error", "Not authorized to poke this alert");
            result.put("statusCode", 403);
            return result;
        }

        // Alert must be ongoing (WAITING or ACTIVE)
        if (!alert.getStatus().isAlertOngoing()) {
            log.warn("Cannot poke completed alert {}", alertId);
            result.put("error", "Cannot poke a completed alert");
            result.put("statusCode", 400);
            return result;
        }

        // Check poke count limit (MAX_POKES = 2)
        final int MAX_POKES = 2;
        int currentPokeCount = alert.getPokeCount() != null ? alert.getPokeCount() : 0;

        if (currentPokeCount >= MAX_POKES) {
            log.warn("Poke limit reached for alert {}", alertId);
            result.put("error", "Maximum poke limit reached (" + MAX_POKES + " pokes)");
            result.put("statusCode", 429);
            result.put("pokeCount", currentPokeCount);
            result.put("maxPokes", MAX_POKES);
            return result;
        }

        // Get victim user
        Optional<User> victimOpt = userRepository.findById(userId);
        if (victimOpt.isEmpty()) {
            log.error("Victim user not found: {}", userId);
            result.put("error", "User not found");
            result.put("statusCode", 404);
            return result;
        }

        User victim = victimOpt.get();

        // Get already notified responder IDs
        List<AlertResponder> existingResponders = alertResponderRepository.findByAlertId(alertId);
        List<UUID> excludeIds = existingResponders.stream()
                .map(AlertResponder::getResponderId)
                .toList();

        // Notify new responders through the notification service
        int notifiedCount = notificationService.pokeAlertToNewResponders(alert, victim, excludeIds);

        if (notifiedCount == 0) {
            log.warn("No new responders available to notify for alert {}", alertId);
            result.put("error", "No new responders available nearby");
            result.put("statusCode", 404);
            return result;
        }

        // Increment poke count
        alert.setPokeCount(currentPokeCount + 1);
        alert.setLastPokedAt(LocalDateTime.now());
        alertRepository.save(alert);

        log.info("Successfully poked alert {} - notified {} new responders (poke {}/{})",
                alertId, notifiedCount, currentPokeCount + 1, MAX_POKES);

        result.put("success", true);
        result.put("message", "Alert poked successfully - " + notifiedCount + " new responders notified");
        result.put("notifiedCount", notifiedCount);
        result.put("pokeCount", currentPokeCount + 1);
        result.put("maxPokes", MAX_POKES);
        result.put("canPokeAgain", currentPokeCount + 1 < MAX_POKES);

        return result;
    }
}
