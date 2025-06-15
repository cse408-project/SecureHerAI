package com.secureherai.secureherai_api.scheduler;

import com.secureherai.secureherai_api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Scheduled task to clean up unverified user accounts
 */
@Component
public class AccountCleanupTask {

    @Autowired
    private UserRepository userRepository;
    
    /**
     * Delete old accounts that are older than 7 days
     * Runs daily at 1:00 AM
     */
    @Scheduled(cron = "0 0 1 * * ?")
    public void cleanupUnverifiedAccounts() {
        // Now that isVerified is properly mapped to database, we can use it
        // Find and delete unverified accounts created more than 7 days ago
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(7);
        userRepository.deleteByIsVerifiedFalseAndCreatedAtBefore(cutoffDate);
    }
}
