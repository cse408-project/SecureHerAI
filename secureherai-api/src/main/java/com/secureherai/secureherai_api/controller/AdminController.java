package com.secureherai.secureherai_api.controller;

import com.secureherai.secureherai_api.entity.User;
import com.secureherai.secureherai_api.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    // Fixed admin API key - change this in production!
    @Value("${admin.api.key:SECUREHER_ADMIN_KEY_2026}")
    private String adminApiKey;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TrustedContactRepository trustedContactRepository;

    @Autowired
    private FavoritePlaceRepository favoritePlaceRepository;

    @Autowired
    private AlertRepository alertRepository;

    @Autowired
    private AlertResponderRepository alertResponderRepository;

    @Autowired
    private ResponderRepository responderRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private DeviceTokenRepository deviceTokenRepository;

    @Autowired
    private IncidentReportRepository incidentReportRepository;

    @Autowired
    private SettingsRepository settingsRepository;

    /**
     * Validate admin API key from header
     */
    private boolean isValidAdminKey(String authKey) {
        return authKey != null && authKey.equals(adminApiKey);
    }

    /**
     * Get all users
     * GET /api/admin/users
     * Header: X-Admin-Key: SECUREHER_ADMIN_KEY_2026
     */
    @GetMapping("/users")
    public ResponseEntity<Object> getAllUsers(@RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        if (!isValidAdminKey(adminKey)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Invalid or missing admin API key"));
        }

        try {
            List<User> users = userRepository.findAll();
            List<Map<String, Object>> userList = users.stream()
                    .map(this::mapUserToResponse)
                    .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("count", userList.size());
            response.put("users", userList);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Error fetching users: " + e.getMessage()));
        }
    }

    /**
     * Get user by ID
     * GET /api/admin/users/{userId}
     * Header: X-Admin-Key: SECUREHER_ADMIN_KEY_2026
     */
    @GetMapping("/users/{userId}")
    public ResponseEntity<Object> getUserById(
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey,
            @PathVariable String userId) {
        if (!isValidAdminKey(adminKey)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Invalid or missing admin API key"));
        }

        try {
            UUID uuid = UUID.fromString(userId);
            Optional<User> userOpt = userRepository.findById(uuid);

            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("success", false, "message", "User not found with ID: " + userId));
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("user", mapUserToResponse(userOpt.get()));

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "Invalid UUID format: " + userId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Error fetching user: " + e.getMessage()));
        }
    }

    /**
     * Get user by email
     * GET /api/admin/users/email/{email}
     * Header: X-Admin-Key: SECUREHER_ADMIN_KEY_2026
     */
    @GetMapping("/users/email/{email}")
    public ResponseEntity<Object> getUserByEmail(
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey,
            @PathVariable String email) {
        if (!isValidAdminKey(adminKey)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Invalid or missing admin API key"));
        }

        try {
            Optional<User> userOpt = userRepository.findByEmail(email);

            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("success", false, "message", "User not found with email: " + email));
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("user", mapUserToResponse(userOpt.get()));

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Error fetching user: " + e.getMessage()));
        }
    }

    /**
     * Delete user by ID
     * DELETE /api/admin/users/{userId}
     * Header: X-Admin-Key: SECUREHER_ADMIN_KEY_2026
     */
    @DeleteMapping("/users/{userId}")
    @Transactional
    public ResponseEntity<Object> deleteUserById(
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey,
            @PathVariable String userId) {
        if (!isValidAdminKey(adminKey)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Invalid or missing admin API key"));
        }

        try {
            UUID uuid = UUID.fromString(userId);
            Optional<User> userOpt = userRepository.findById(uuid);

            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("success", false, "message", "User not found with ID: " + userId));
            }

            User user = userOpt.get();
            String userEmail = user.getEmail();
            String userName = user.getFullName();

            // Delete all related records first (cascade delete)
            Map<String, Integer> deletedCounts = deleteUserRelatedRecords(uuid);

            // Finally delete the user
            userRepository.delete(user);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "User and all related data deleted successfully");
            response.put("deletedUser", Map.of(
                    "id", userId,
                    "email", userEmail,
                    "fullName", userName));
            response.put("deletedRelatedRecords", deletedCounts);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "Invalid UUID format: " + userId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Error deleting user: " + e.getMessage()));
        }
    }

    /**
     * Delete user by email
     * DELETE /api/admin/users/email/{email}
     * Header: X-Admin-Key: SECUREHER_ADMIN_KEY_2026
     */
    @DeleteMapping("/users/email/{email}")
    @Transactional
    public ResponseEntity<Object> deleteUserByEmail(
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey,
            @PathVariable String email) {
        if (!isValidAdminKey(adminKey)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Invalid or missing admin API key"));
        }

        try {
            Optional<User> userOpt = userRepository.findByEmail(email);

            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("success", false, "message", "User not found with email: " + email));
            }

            User user = userOpt.get();
            UUID userId = user.getId();
            String userName = user.getFullName();

            // Delete all related records first (cascade delete)
            Map<String, Integer> deletedCounts = deleteUserRelatedRecords(userId);

            // Finally delete the user
            userRepository.delete(user);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "User and all related data deleted successfully");
            response.put("deletedUser", Map.of(
                    "id", userId.toString(),
                    "email", email,
                    "fullName", userName));
            response.put("deletedRelatedRecords", deletedCounts);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Error deleting user: " + e.getMessage()));
        }
    }

    /**
     * Delete all users - USE WITH EXTREME CAUTION!
     * DELETE /api/admin/users/all
     * Header: X-Admin-Key: SECUREHER_ADMIN_KEY_2026
     * Query param: confirm=DELETE_ALL_USERS (required for safety)
     */
    @DeleteMapping("/users/all")
    @Transactional
    public ResponseEntity<Object> deleteAllUsers(
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey,
            @RequestParam(value = "confirm", required = false) String confirmParam) {
        if (!isValidAdminKey(adminKey)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Invalid or missing admin API key"));
        }

        // Safety check - require confirmation parameter
        if (!"DELETE_ALL_USERS".equals(confirmParam)) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "success", false,
                            "message", "Confirmation required! Add query param: ?confirm=DELETE_ALL_USERS",
                            "warning", "This will permanently delete ALL users from the database!"));
        }

        try {
            List<User> allUsers = userRepository.findAll();
            long userCount = allUsers.size();

            // Delete all related records for each user first
            Map<String, Integer> totalDeletedCounts = new HashMap<>();
            totalDeletedCounts.put("trustedContacts", 0);
            totalDeletedCounts.put("favoritePlaces", 0);
            totalDeletedCounts.put("alertResponders", 0);
            totalDeletedCounts.put("alerts", 0);
            totalDeletedCounts.put("responders", 0);
            totalDeletedCounts.put("notifications", 0);
            totalDeletedCounts.put("deviceTokens", 0);
            totalDeletedCounts.put("incidentReports", 0);

            for (User user : allUsers) {
                Map<String, Integer> userDeletedCounts = deleteUserRelatedRecords(user.getId());
                userDeletedCounts.forEach((key, value) -> totalDeletedCounts.merge(key, value, Integer::sum));
            }

            // Now delete all users
            userRepository.deleteAll();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "All users and related data deleted successfully");
            response.put("deletedUsersCount", userCount);
            response.put("deletedRelatedRecords", totalDeletedCounts);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Error deleting all users: " + e.getMessage()));
        }
    }

    /**
     * Get user statistics
     * GET /api/admin/stats
     * Header: X-Admin-Key: SECUREHER_ADMIN_KEY_2026
     */
    @GetMapping("/stats")
    public ResponseEntity<Object> getUserStats(
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        if (!isValidAdminKey(adminKey)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Invalid or missing admin API key"));
        }

        try {
            List<User> users = userRepository.findAll();

            long totalUsers = users.size();
            long verifiedUsers = users.stream().filter(u -> Boolean.TRUE.equals(u.getIsVerified())).count();
            long unverifiedUsers = totalUsers - verifiedUsers;
            long userRole = users.stream().filter(u -> u.getRole().name().equals("USER")).count();
            long responderRole = users.stream().filter(u -> u.getRole().name().equals("RESPONDER")).count();
            long oauthUsers = users.stream().filter(u -> u.getOauthProvider() != null).count();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("stats", Map.of(
                    "totalUsers", totalUsers,
                    "verifiedUsers", verifiedUsers,
                    "unverifiedUsers", unverifiedUsers,
                    "usersByRole", Map.of(
                            "USER", userRole,
                            "RESPONDER", responderRole),
                    "oauthUsers", oauthUsers));

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Error fetching stats: " + e.getMessage()));
        }
    }

    /**
     * Helper method to delete all records related to a user
     * This handles foreign key constraints by deleting dependent records first
     * Uses count queries instead of loading entities to avoid Hibernate
     * relationship issues
     */
    private Map<String, Integer> deleteUserRelatedRecords(UUID userId) {
        Map<String, Integer> deletedCounts = new HashMap<>();

        // Delete trusted contacts where user is the owner
        long trustedContactsCount = trustedContactRepository.countByUserId(userId);
        trustedContactRepository.deleteByUserId(userId);
        deletedCounts.put("trustedContacts", (int) trustedContactsCount);

        // Delete favorite places
        long favoritePlacesCount = favoritePlaceRepository.countByUserId(userId);
        favoritePlaceRepository.deleteByUserId(userId);
        deletedCounts.put("favoritePlaces", (int) favoritePlacesCount);

        // Delete alert responders (where user is responder) - use count query
        long alertRespondersCount = alertResponderRepository.countByResponderId(userId);
        alertResponderRepository.deleteByResponderId(userId);
        deletedCounts.put("alertResponders", (int) alertRespondersCount);

        // Get alert IDs for this user (to delete their alert_responders first)
        // Use a native query approach to get just the IDs without loading full entities
        List<UUID> alertIds = alertRepository.findAlertIdsByUserId(userId);
        int alertsCount = alertIds.size();

        // First delete alert_responders for these alerts (to avoid FK constraint)
        for (UUID alertId : alertIds) {
            alertResponderRepository.deleteByAlertId(alertId);
        }

        alertRepository.deleteByUserId(userId);
        deletedCounts.put("alerts", alertsCount);

        // Delete responder profile if exists
        boolean hasResponderProfile = responderRepository.findByUserId(userId).isPresent();
        responderRepository.deleteByUserId(userId);
        deletedCounts.put("responders", hasResponderProfile ? 1 : 0);

        // Delete notifications - use count instead of loading entities
        long notificationsCount = notificationRepository.countByUserId(userId);
        notificationRepository.deleteByUserId(userId);
        deletedCounts.put("notifications", (int) notificationsCount);

        // Delete device tokens
        long deviceTokensCount = deviceTokenRepository.countByUserId(userId);
        deviceTokenRepository.deleteByUserId(userId);
        deletedCounts.put("deviceTokens", (int) deviceTokensCount);

        // Delete incident reports - need to count first
        Long incidentReportsCount = incidentReportRepository.countByUserId(userId);
        incidentReportRepository.deleteByUserId(userId);
        deletedCounts.put("incidentReports", incidentReportsCount != null ? incidentReportsCount.intValue() : 0);

        // Delete settings - this was the missing FK constraint!
        settingsRepository.deleteByUserId(userId);
        deletedCounts.put("settings", 1); // User has at most one settings record

        return deletedCounts;
    }

    /**
     * Map User entity to response object (exclude sensitive fields)
     */
    private Map<String, Object> mapUserToResponse(User user) {
        Map<String, Object> userMap = new HashMap<>();
        userMap.put("id", user.getId().toString());
        userMap.put("fullName", user.getFullName());
        userMap.put("email", user.getEmail());
        userMap.put("phone", user.getPhone());
        userMap.put("role", user.getRole().name());
        userMap.put("dateOfBirth", user.getDateOfBirth());
        userMap.put("isVerified", user.getIsVerified());
        userMap.put("isEnabled", user.isEnabled());
        userMap.put("isProfileComplete", user.getIsProfileComplete());
        userMap.put("oauthProvider", user.getOauthProvider());
        userMap.put("contributionPoints", user.getContributionPoints());
        userMap.put("currentLatitude", user.getCurrentLatitude());
        userMap.put("currentLongitude", user.getCurrentLongitude());
        userMap.put("createdAt", user.getCreatedAt());
        userMap.put("updatedAt", user.getUpdatedAt());
        return userMap;
    }
}
