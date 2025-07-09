package com.secureherai.secureherai_api.controller;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.secureherai.secureherai_api.dto.report.ReportRequest;
import com.secureherai.secureherai_api.dto.report.ReportResponse;
import com.secureherai.secureherai_api.service.JwtService;
import com.secureherai.secureherai_api.service.ReportService;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ReportControllerTest {

    @Mock
    private ReportService reportService;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private ReportController reportController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private UUID testUserId;
    private UUID testReportId;
    private String validToken;
    private String authHeader;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(reportController).build();
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        
        testUserId = UUID.randomUUID();
        testReportId = UUID.randomUUID();
        validToken = "valid-jwt-token";
        authHeader = "Bearer " + validToken;
        
        // Default JWT service behavior
        when(jwtService.isTokenValid(validToken)).thenReturn(true);
        when(jwtService.extractUserId(validToken)).thenReturn(testUserId);
        when(jwtService.extractRole(validToken)).thenReturn("USER");
    }

    @Test
    void testSubmitReport_Success() throws Exception {
        // Arrange
        ReportRequest.SubmitReport request = createSubmitReportRequest();
        ReportResponse.GenericResponse successResponse = new ReportResponse.GenericResponse(
            true, "Incident report submitted successfully", null, testReportId);
        
        when(reportService.submitReport(eq(testUserId), any(ReportRequest.SubmitReport.class)))
            .thenReturn(successResponse);

        // Act & Assert
        mockMvc.perform(post("/api/report/submit")
                .header("Authorization", authHeader)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Incident report submitted successfully"))
                .andExpect(jsonPath("$.reportId").value(testReportId.toString()));

        verify(reportService).submitReport(eq(testUserId), any(ReportRequest.SubmitReport.class));
    }

    @Test
    void testSubmitReport_InvalidToken() throws Exception {
        // Arrange
        when(jwtService.isTokenValid(validToken)).thenReturn(false);
        ReportRequest.SubmitReport request = createSubmitReportRequest();

        // Act & Assert
        mockMvc.perform(post("/api/report/submit")
                .header("Authorization", authHeader)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));

        verify(reportService, never()).submitReport(any(), any());
    }

    @Test
    void testSubmitReport_ServiceError() throws Exception {
        // Arrange
        ReportRequest.SubmitReport request = createSubmitReportRequest();
        ReportResponse.GenericResponse errorResponse = new ReportResponse.GenericResponse(
            false, null, "User not found");
        
        when(reportService.submitReport(eq(testUserId), any(ReportRequest.SubmitReport.class)))
            .thenReturn(errorResponse);

        // Act & Assert
        mockMvc.perform(post("/api/report/submit")
                .header("Authorization", authHeader)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void testGetUserReports_Success() throws Exception {
        // Arrange
        List<ReportResponse.ReportSummary> reportList = Arrays.asList(createReportSummary());
        ReportResponse.UserReportsResponse successResponse = new ReportResponse.UserReportsResponse(
            true, reportList, null);
        
        when(reportService.getUserReports(testUserId)).thenReturn(successResponse);

        // Act & Assert
        mockMvc.perform(get("/api/report/user-reports")
                .header("Authorization", authHeader))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.reports").isArray())
                .andExpect(jsonPath("$.reports[0].reportId").value(testReportId.toString()));

        verify(reportService).getUserReports(testUserId);
    }

    @Test
    void testGetUserReports_InvalidToken() throws Exception {
        // Arrange
        when(jwtService.isTokenValid(validToken)).thenReturn(false);

        // Act & Assert
        mockMvc.perform(get("/api/report/user-reports")
                .header("Authorization", authHeader))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));

        verify(reportService, never()).getUserReports(any());
    }

    @Test
    void testGetReportDetails_Success() throws Exception {
        // Arrange
        ReportResponse.ReportDetails details = createReportDetails();
        ReportResponse.ReportDetailsResponse successResponse = new ReportResponse.ReportDetailsResponse(
            true, details, null);
        
        when(reportService.getReportDetails(testReportId, testUserId)).thenReturn(successResponse);

        // Act & Assert
        mockMvc.perform(get("/api/report/details")
                .header("Authorization", authHeader)
                .param("reportId", testReportId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.report.reportId").value(testReportId.toString()));

        verify(reportService).getReportDetails(testReportId, testUserId);
    }

    @Test
    void testUploadEvidence_Success() throws Exception {
        // Arrange
        ReportRequest.UploadEvidence request = new ReportRequest.UploadEvidence();
        request.setReportId(testReportId);
        request.setEvidence(Arrays.asList("https://example.com/image.jpg"));
        request.setDescription("Test evidence");
        
        ReportResponse.GenericResponse successResponse = new ReportResponse.GenericResponse(
            true, "Evidence uploaded successfully", null);
        
        when(reportService.uploadEvidence(eq(testUserId), any(ReportRequest.UploadEvidence.class)))
            .thenReturn(successResponse);

        // Act & Assert
        mockMvc.perform(post("/api/report/upload-evidence")
                .header("Authorization", authHeader)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Evidence uploaded successfully"));

        verify(reportService).uploadEvidence(eq(testUserId), any(ReportRequest.UploadEvidence.class));
    }

    @Test
    void testUpdateReport_Success() throws Exception {
        // Arrange
        ReportRequest.UpdateReport request = new ReportRequest.UpdateReport();
        request.setReportId(testReportId);
        request.setDescription("Updated description");
        request.setStatus("under_review");
        
        ReportResponse.GenericResponse successResponse = new ReportResponse.GenericResponse(
            true, "Report updated successfully", null);
        
        when(reportService.updateReport(eq(testUserId), eq("USER"), any(ReportRequest.UpdateReport.class)))
            .thenReturn(successResponse);

        // Act & Assert
        mockMvc.perform(put("/api/report/update")
                .header("Authorization", authHeader)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Report updated successfully"));

        verify(reportService).updateReport(eq(testUserId), eq("USER"), any(ReportRequest.UpdateReport.class));
    }

    @Test
    void testGetPublicReports_AdminAccess() throws Exception {
        // Arrange
        when(jwtService.extractRole(validToken)).thenReturn("ADMIN");
        
        List<ReportResponse.ReportSummary> reportList = Arrays.asList(createReportSummary());
        ReportResponse.UserReportsResponse successResponse = new ReportResponse.UserReportsResponse(
            true, reportList, null);
        
        when(reportService.getPublicReports("ADMIN")).thenReturn(successResponse);

        // Act & Assert
        mockMvc.perform(get("/api/report/public-reports")
                .header("Authorization", authHeader))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.reports").isArray());

        verify(reportService).getPublicReports("ADMIN");
    }

    @Test
    void testGetPublicReports_ResponderAccess() throws Exception {
        // Arrange
        when(jwtService.extractRole(validToken)).thenReturn("RESPONDER");
        
        List<ReportResponse.ReportSummary> reportList = Arrays.asList(createReportSummary());
        ReportResponse.UserReportsResponse successResponse = new ReportResponse.UserReportsResponse(
            true, reportList, null);
        
        when(reportService.getPublicReports("RESPONDER")).thenReturn(successResponse);

        // Act & Assert
        mockMvc.perform(get("/api/report/public-reports")
                .header("Authorization", authHeader))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(reportService).getPublicReports("RESPONDER");
    }

    @Test
    void testGetPublicReports_AccessDenied() throws Exception {
        // Arrange
        when(jwtService.extractRole(validToken)).thenReturn("USER");

        // Act & Assert
        mockMvc.perform(get("/api/report/public-reports")
                .header("Authorization", authHeader))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));

        verify(reportService, never()).getPublicReports(any());
    }

    @Test
    void testSearchReports_Success() throws Exception {
        // Arrange
        List<ReportResponse.ReportSummary> reportList = Arrays.asList(createReportSummary());
        ReportResponse.UserReportsResponse successResponse = new ReportResponse.UserReportsResponse(
            true, reportList, null);
        
        when(reportService.searchAndFilterReports(
            eq("test"), eq("harassment"), eq("public"), eq("submitted"), 
            eq(testUserId), eq("USER"), eq(0), eq(10)))
            .thenReturn(successResponse);

        // Act & Assert
        mockMvc.perform(get("/api/report/search")
                .header("Authorization", authHeader)
                .param("query", "test")
                .param("incidentType", "harassment")
                .param("visibility", "public")
                .param("status", "submitted")
                .param("page", "0")
                .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(reportService).searchAndFilterReports(
            eq("test"), eq("harassment"), eq("public"), eq("submitted"), 
            eq(testUserId), eq("USER"), eq(0), eq(10));
    }

    @Test
    void testSearchReports_InvalidIncidentType() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/report/search")
                .header("Authorization", authHeader)
                .param("incidentType", "invalid-type"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));

        verify(reportService, never()).searchAndFilterReports(any(), any(), any(), any(), any(), any(), anyInt(), anyInt());
    }

    @Test
    void testSearchReports_InvalidVisibility() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/report/search")
                .header("Authorization", authHeader)
                .param("visibility", "invalid-visibility"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));

        verify(reportService, never()).searchAndFilterReports(any(), any(), any(), any(), any(), any(), anyInt(), anyInt());
    }

    @Test
    void testSearchReports_InvalidStatus() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/report/search")
                .header("Authorization", authHeader)
                .param("status", "invalid-status"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));

        verify(reportService, never()).searchAndFilterReports(any(), any(), any(), any(), any(), any(), anyInt(), anyInt());
    }

    @Test
    void testGetReportCategories_Success() throws Exception {
        // Arrange
        ReportResponse.Categories categories = new ReportResponse.Categories();
        categories.setIncidentTypes(Arrays.asList("harassment", "theft", "assault", "other"));
        categories.setVisibilityOptions(Arrays.asList("public", "officials_only", "private"));
        categories.setStatusOptions(Arrays.asList("submitted", "under_review", "resolved", "closed"));
        
        ReportResponse.CategoriesResponse successResponse = new ReportResponse.CategoriesResponse(
            true, categories, null);
        
        when(reportService.getReportCategories()).thenReturn(successResponse);

        // Act & Assert
        mockMvc.perform(get("/api/report/categories")
                .header("Authorization", authHeader))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.categories.incidentTypes").isArray());

        verify(reportService).getReportCategories();
    }

    @Test
    void testGetReportStats_Success() throws Exception {
        // Arrange
        ReportResponse.ReportStats stats = new ReportResponse.ReportStats();
        stats.setTotalReports(5);
        stats.setRecentReports(2);
        
        ReportResponse.StatsResponse successResponse = new ReportResponse.StatsResponse(
            true, stats, null);
        
        when(reportService.getReportStats(testUserId, "USER")).thenReturn(successResponse);

        // Act & Assert
        mockMvc.perform(get("/api/report/stats")
                .header("Authorization", authHeader))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.stats.totalReports").value(5));

        verify(reportService).getReportStats(testUserId, "USER");
    }

    @Test
    void testDeleteReport_Success() throws Exception {
        // Arrange
        ReportResponse.GenericResponse successResponse = new ReportResponse.GenericResponse(
            true, "Report deleted successfully", null);
        
        when(reportService.deleteReport(testReportId, testUserId, "USER")).thenReturn(successResponse);

        // Act & Assert
        mockMvc.perform(delete("/api/report/delete")
                .header("Authorization", authHeader)
                .param("reportId", testReportId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Report deleted successfully"));

        verify(reportService).deleteReport(testReportId, testUserId, "USER");
    }

    @Test
    void testDeleteReport_InvalidReportId() throws Exception {
        // Act & Assert
        mockMvc.perform(delete("/api/report/delete")
                .header("Authorization", authHeader)
                .param("reportId", "invalid-uuid"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));

        verify(reportService, never()).deleteReport(any(), any(), any());
    }

    @Test
    void testMissingAuthorizationHeader() throws Exception {
        // Act & Assert
        mockMvc.perform(post("/api/report/submit")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isBadRequest()); // or 400 depending on implementation
    }

    @Test
    void testJwtException() throws Exception {
        // Arrange
        when(jwtService.isTokenValid(validToken)).thenThrow(new io.jsonwebtoken.JwtException("Invalid token"));

        // Act & Assert
        mockMvc.perform(get("/api/report/user-reports")
                .header("Authorization", authHeader))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    // Helper methods
    private ReportRequest.SubmitReport createSubmitReportRequest() {
        ReportRequest.SubmitReport request = new ReportRequest.SubmitReport();
        request.setIncidentType("harassment");
        request.setDescription("Test incident description");
        request.setIncidentTime(LocalDateTime.now());
        request.setVisibility("public");
        request.setAnonymous(false);
        request.setAddress("Test Address");
        
        ReportRequest.Location location = new ReportRequest.Location();
        location.setLatitude(new BigDecimal("23.7808"));
        location.setLongitude(new BigDecimal("90.2792"));
        request.setLocation(location);
        
        return request;
    }

    private ReportResponse.ReportSummary createReportSummary() {
        ReportResponse.LocationInfo location = new ReportResponse.LocationInfo(
            new BigDecimal("23.7808"), new BigDecimal("90.2792"), "Test Address");
        
        return new ReportResponse.ReportSummary(
            testReportId,
            "harassment",
            "Test incident description",
            location,
            LocalDateTime.now(),
            "submitted",
            "public",
            false,
            LocalDateTime.now()
        );
    }

    private ReportResponse.ReportDetails createReportDetails() {
        ReportResponse.ReportDetails details = new ReportResponse.ReportDetails();
        details.setReportId(testReportId);
        details.setIncidentType("harassment");
        details.setDescription("Test incident description");
        details.setStatus("submitted");
        details.setVisibility("public");
        details.setAnonymous(false);
        details.setCreatedAt(LocalDateTime.now());
        details.setUpdatedAt(LocalDateTime.now());
        
        ReportResponse.LocationInfo location = new ReportResponse.LocationInfo(
            new BigDecimal("23.7808"), new BigDecimal("90.2792"), "Test Address");
        details.setLocation(location);
        
        return details;
    }
}
