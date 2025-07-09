package com.secureherai.secureherai_api.repository;

import com.secureherai.secureherai_api.entity.IncidentReport;
import com.secureherai.secureherai_api.entity.ReportEvidence;
import com.secureherai.secureherai_api.entity.User;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
public class ReportEvidenceRepositoryTest {

    @Autowired
    private ReportEvidenceRepository reportEvidenceRepository;

    @Autowired
    private IncidentReportRepository incidentReportRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TestEntityManager entityManager;

    private User testUser;
    private IncidentReport testReport;
    private UUID reportId;
    private static int counter = 0;

    @BeforeEach
    public void setUp() {
        reportEvidenceRepository.deleteAll();
        incidentReportRepository.deleteAll();
        userRepository.deleteAll();
        
        counter++;

        // Create a test user
        testUser = new User();
        testUser.setFullName("Test Evidence User " + counter);
        testUser.setEmail("evidence_test" + counter + "@example.com");
        testUser.setPhone("+1234567" + String.format("%03d", counter));
        testUser.setPasswordHash("hashedPassword");
        testUser.setRole(User.Role.USER);
        testUser.setEmailAlerts(true);
        testUser.setSmsAlerts(true);
        testUser.setPushNotifications(true);
        testUser.setIsVerified(true);
        testUser.setIsAccountNonExpired(true);
        testUser.setIsAccountNonLocked(true);
        testUser.setIsCredentialsNonExpired(true);
        testUser.setIsEnabled(true);
        testUser = userRepository.save(testUser);

        // Create a test incident report
        testReport = new IncidentReport();
        testReport.setUserId(testUser.getId());
        testReport.setIncidentType("HARASSMENT");
        testReport.setDescription("This is a test report for evidence testing");
        testReport.setAddress("Test Location");
        testReport.setLatitude(new BigDecimal("10.0"));
        testReport.setLongitude(new BigDecimal("20.0"));
        testReport.setIncidentTime(LocalDateTime.now());
        testReport.setVisibility("public");
        testReport.setAnonymous(false);
        testReport.setStatus("SUBMITTED");
        testReport = incidentReportRepository.save(testReport);
        reportId = testReport.getId();
    }

    @Test
    public void testSaveEvidence() {
        // Create a new evidence
        ReportEvidence evidence = new ReportEvidence(reportId, "http://example.com/image.jpg", "image", "Test image");
        evidence.setFileSize(1024);
        evidence.setUploadedAt(LocalDateTime.now()); // Explicitly set upload time

        // Save the evidence
        ReportEvidence savedEvidence = reportEvidenceRepository.save(evidence);
        
        // Assert that the saved evidence is not null and has an ID
        assertThat(savedEvidence).isNotNull();
        assertThat(savedEvidence.getId()).isNotNull();
        assertThat(savedEvidence.getReportId()).isEqualTo(reportId);
        assertThat(savedEvidence.getFileUrl()).isEqualTo("http://example.com/image.jpg");
        assertThat(savedEvidence.getFileType()).isEqualTo("image");
        assertThat(savedEvidence.getDescription()).isEqualTo("Test image");
        assertThat(savedEvidence.getFileSize()).isEqualTo(1024);
        assertThat(savedEvidence.getUploadedAt()).isNotNull();
    }

    @Test
    public void testFindByReportId() {
        // Create multiple evidence entries for the same report
        ReportEvidence evidence1 = new ReportEvidence(reportId, "http://example.com/image1.jpg", "image", "Test image 1");
        evidence1.setUploadedAt(LocalDateTime.now());
        ReportEvidence evidence2 = new ReportEvidence(reportId, "http://example.com/image2.jpg", "image", "Test image 2");
        evidence2.setUploadedAt(LocalDateTime.now());
        ReportEvidence evidence3 = new ReportEvidence(reportId, "http://example.com/audio.wav", "audio", "Test audio");
        evidence3.setUploadedAt(LocalDateTime.now());
        
        reportEvidenceRepository.saveAll(List.of(evidence1, evidence2, evidence3));
        
        // Test findByReportId method
        List<ReportEvidence> foundEvidence = reportEvidenceRepository.findByReportId(reportId);
        
        assertThat(foundEvidence).isNotNull();
        assertThat(foundEvidence).hasSize(3);
        assertThat(foundEvidence.stream().map(ReportEvidence::getFileUrl))
            .contains("http://example.com/image1.jpg", "http://example.com/image2.jpg", "http://example.com/audio.wav");
    }

    @Test
    public void testFindByReportIdOrderByUploadedAt() {
        // Create evidence entries with different upload times
        LocalDateTime now = LocalDateTime.now();
        
        ReportEvidence evidence1 = new ReportEvidence(reportId, "http://example.com/image1.jpg", "image", "Test image 1");
        evidence1.setUploadedAt(now);
        reportEvidenceRepository.save(evidence1);

        // Add time differences
        LocalDateTime secondTime = now.plusSeconds(10);
        ReportEvidence evidence2 = new ReportEvidence(reportId, "http://example.com/image2.jpg", "image", "Test image 2");
        evidence2.setUploadedAt(secondTime);
        reportEvidenceRepository.save(evidence2);
        
        LocalDateTime thirdTime = now.plusSeconds(20);
        ReportEvidence evidence3 = new ReportEvidence(reportId, "http://example.com/audio.wav", "audio", "Test audio");
        evidence3.setUploadedAt(thirdTime);
        reportEvidenceRepository.save(evidence3);
        
        // Clear the persistence context to ensure we're getting fresh data
        entityManager.flush();
        entityManager.clear();
        
        // Test findByReportIdOrderByUploadedAt method
        List<ReportEvidence> orderedEvidence = reportEvidenceRepository.findByReportIdOrderByUploadedAt(reportId);
        
        assertThat(orderedEvidence).isNotNull();
        assertThat(orderedEvidence).hasSize(3);
        
        // Verify the order based on uploadedAt
        assertThat(orderedEvidence.get(0).getFileUrl()).isEqualTo("http://example.com/image1.jpg");
        assertThat(orderedEvidence.get(1).getFileUrl()).isEqualTo("http://example.com/image2.jpg");
        assertThat(orderedEvidence.get(2).getFileUrl()).isEqualTo("http://example.com/audio.wav");
        
        // Verify timestamps are in ascending order
        LocalDateTime previousTime = null;
        for (ReportEvidence evidence : orderedEvidence) {
            if (previousTime != null) {
                assertThat(evidence.getUploadedAt()).isAfterOrEqualTo(previousTime);
            }
            previousTime = evidence.getUploadedAt();
        }
    }

    @Test
    public void testCountByReportId() {
        // Create multiple evidence entries for the same report
        ReportEvidence evidence1 = new ReportEvidence(reportId, "http://example.com/image1.jpg", "image", "Test image 1");
        evidence1.setUploadedAt(LocalDateTime.now());
        ReportEvidence evidence2 = new ReportEvidence(reportId, "http://example.com/image2.jpg", "image", "Test image 2");
        evidence2.setUploadedAt(LocalDateTime.now());
        ReportEvidence evidence3 = new ReportEvidence(reportId, "http://example.com/audio.wav", "audio", "Test audio");
        evidence3.setUploadedAt(LocalDateTime.now());
        
        reportEvidenceRepository.saveAll(List.of(evidence1, evidence2, evidence3));
        
        // Create a different report
        IncidentReport differentReport = new IncidentReport();
        differentReport.setUserId(testUser.getId());
        differentReport.setIncidentType("THEFT");
        differentReport.setDescription("This is a different test report");
        differentReport.setAddress("Different Location");
        differentReport.setLatitude(new BigDecimal("30.0"));
        differentReport.setLongitude(new BigDecimal("40.0"));
        differentReport.setIncidentTime(LocalDateTime.now());
        differentReport.setVisibility("public");
        differentReport.setAnonymous(false);
        differentReport.setStatus("SUBMITTED");
        differentReport = incidentReportRepository.save(differentReport);
        
        // Add evidence to different report
        ReportEvidence otherEvidence = new ReportEvidence(differentReport.getId(), "http://example.com/other.jpg", "image", "Other image");
        otherEvidence.setUploadedAt(LocalDateTime.now());
        reportEvidenceRepository.save(otherEvidence);
        
        // Test countByReportId method
        long count = reportEvidenceRepository.countByReportId(reportId);
        assertThat(count).isEqualTo(3);
        
        long otherCount = reportEvidenceRepository.countByReportId(differentReport.getId());
        assertThat(otherCount).isEqualTo(1);
    }
}
