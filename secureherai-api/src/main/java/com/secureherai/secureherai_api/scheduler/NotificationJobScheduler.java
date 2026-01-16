package com.secureherai.secureherai_api.scheduler;

import com.secureherai.secureherai_api.entity.NotificationJob;
import com.secureherai.secureherai_api.entity.NotificationJob.JobStatus;
import com.secureherai.secureherai_api.entity.NotificationJob.JobType;
import com.secureherai.secureherai_api.entity.NotificationQueue;
import com.secureherai.secureherai_api.repository.NotificationJobRepository;
import com.secureherai.secureherai_api.repository.NotificationQueueRepository;
import com.secureherai.secureherai_api.service.EmergencyNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Scheduler for processing notification jobs from the database.
 * Handles:
 * - Escalation of emergency notifications to more responders
 * - SMS fallback for offline users
 * - Expiration of old notifications
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationJobScheduler {

    private final NotificationJobRepository jobRepository;
    private final NotificationQueueRepository queueRepository;
    private final EmergencyNotificationService emergencyNotificationService;

    /**
     * Process pending notification jobs every 30 seconds
     */
    @Scheduled(fixedRate = 30000) // 30 seconds
    @Transactional
    public void processPendingJobs() {
        List<NotificationJob> dueJobs = jobRepository.findDueJobs(JobStatus.PENDING, LocalDateTime.now());

        if (dueJobs.isEmpty()) {
            return;
        }

        log.info("Processing {} pending notification jobs", dueJobs.size());

        for (NotificationJob job : dueJobs) {
            try {
                processJob(job);
            } catch (Exception e) {
                log.error("Error processing job {}: {}", job.getId(), e.getMessage());
                handleJobFailure(job, e.getMessage());
            }
        }
    }

    /**
     * Process SMS fallback for queued notifications every 2 minutes
     */
    @Scheduled(fixedRate = 120000) // 2 minutes
    @Transactional
    public void processSMSFallback() {
        // Find notifications that have been queued for a while and need SMS fallback
        List<NotificationQueue> needingSMS = queueRepository.findNotificationsNeedingSMSFallback(
                3, // Minimum 3 delivery attempts before SMS
                LocalDateTime.now());

        if (needingSMS.isEmpty()) {
            return;
        }

        log.info("Processing {} notifications for SMS fallback", needingSMS.size());

        for (NotificationQueue queued : needingSMS) {
            try {
                emergencyNotificationService.sendSMSFallback(queued);
            } catch (Exception e) {
                log.error("Error sending SMS fallback for queue {}: {}", queued.getId(), e.getMessage());
            }
        }
    }

    /**
     * Clean up expired notifications every 5 minutes
     */
    @Scheduled(fixedRate = 300000) // 5 minutes
    @Transactional
    public void cleanupExpiredNotifications() {
        List<NotificationQueue> expired = queueRepository.findExpiredNotifications(LocalDateTime.now());

        if (expired.isEmpty()) {
            return;
        }

        log.info("Cleaning up {} expired queued notifications", expired.size());

        for (NotificationQueue notification : expired) {
            notification.setStatus(NotificationQueue.QueueStatus.EXPIRED);
            queueRepository.save(notification);
        }
    }

    /**
     * Retry failed jobs every minute
     */
    @Scheduled(fixedRate = 60000) // 1 minute
    @Transactional
    public void retryFailedJobs() {
        List<NotificationJob> failedJobs = jobRepository.findJobsToRetry();

        if (failedJobs.isEmpty()) {
            return;
        }

        log.info("Retrying {} failed notification jobs", failedJobs.size());

        for (NotificationJob job : failedJobs) {
            job.setStatus(JobStatus.PENDING);
            job.setRetryCount(job.getRetryCount() + 1);
            job.setExecuteAt(LocalDateTime.now().plusMinutes(job.getRetryCount())); // Exponential backoff
            jobRepository.save(job);
        }
    }

    private void processJob(NotificationJob job) {
        job.setStatus(JobStatus.PROCESSING);
        jobRepository.save(job);

        switch (job.getJobType()) {
            case ESCALATE_NOTIFICATION:
                emergencyNotificationService.escalateNotification(job);
                break;
            case EXPIRE_NOTIFICATION:
                emergencyNotificationService.expireNotification(job);
                break;
            case SEND_SMS_FALLBACK:
                emergencyNotificationService.processSMSFallbackJob(job);
                break;
            case FOLLOW_UP_CHECK:
                emergencyNotificationService.sendFollowUpCheck(job);
                break;
            default:
                log.warn("Unknown job type: {}", job.getJobType());
        }

        job.setStatus(JobStatus.COMPLETED);
        job.setExecutedAt(LocalDateTime.now());
        jobRepository.save(job);

        log.info("Completed job {} of type {}", job.getId(), job.getJobType());
    }

    private void handleJobFailure(NotificationJob job, String errorMessage) {
        job.setStatus(JobStatus.FAILED);
        job.setErrorMessage(errorMessage);
        jobRepository.save(job);
    }
}
