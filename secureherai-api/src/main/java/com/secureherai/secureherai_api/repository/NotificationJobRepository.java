package com.secureherai.secureherai_api.repository;

import com.secureherai.secureherai_api.entity.NotificationJob;
import com.secureherai.secureherai_api.entity.NotificationJob.JobStatus;
import com.secureherai.secureherai_api.entity.NotificationJob.JobType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationJobRepository extends JpaRepository<NotificationJob, Long> {

        /**
         * Find all pending jobs that are due for execution
         */
        @Query("SELECT j FROM NotificationJob j WHERE j.status = :status AND j.executeAt <= :now ORDER BY j.executeAt ASC")
        List<NotificationJob> findDueJobs(@Param("status") JobStatus status, @Param("now") LocalDateTime now);

        /**
         * Find pending jobs for a specific alert
         */
        List<NotificationJob> findByAlertIdAndStatus(UUID alertId, JobStatus status);

        /**
         * Find pending escalation jobs for an alert
         */
        @Query("SELECT j FROM NotificationJob j WHERE j.alertId = :alertId AND j.status = :status AND j.jobType = :jobType")
        List<NotificationJob> findPendingEscalationJobs(
                        @Param("alertId") UUID alertId,
                        @Param("status") JobStatus status,
                        @Param("jobType") JobType jobType);

        /**
         * Cancel all pending jobs for an alert (when alert is resolved/cancelled)
         */
        @Modifying
        @org.springframework.transaction.annotation.Transactional
        @Query(value = "UPDATE notification_jobs SET status = 'CANCELLED' WHERE alert_id = :alertId AND status = 'PENDING'", nativeQuery = true)
        int cancelPendingJobsForAlert(@Param("alertId") UUID alertId);

        /**
         * Find jobs by alert ID and status list
         */
        @Query("SELECT j FROM NotificationJob j WHERE j.alertId = :alertId AND j.status IN :statuses")
        List<NotificationJob> findByAlertIdAndStatusIn(@Param("alertId") UUID alertId,
                        @Param("statuses") List<JobStatus> statuses);

        /**
         * Find the latest batch number for an alert
         */
        @Query("SELECT COALESCE(MAX(j.batchNumber), 0) FROM NotificationJob j WHERE j.alertId = :alertId")
        Integer findMaxBatchNumberForAlert(@Param("alertId") UUID alertId);

        /**
         * Find jobs that failed and need retry
         */
        @Query(value = "SELECT * FROM notification_jobs WHERE status = 'FAILED' AND retry_count < max_retries", nativeQuery = true)
        List<NotificationJob> findJobsToRetry();
}
