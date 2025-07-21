# SOS Alert Auto-Report Generation Implementation

## Summary

Implemented automatic report generation for SOS alerts and created a new API endpoint to retrieve reports by alert ID. Updated both backend and frontend to support the new workflow.

## Backend Changes

### 1. Modified SOSService.java

- **File**: `secureherai-api/src/main/java/com/secureherai/secureherai_api/service/SOSService.java`
- **Changes**:
  - Added dependency injection for `ReportService`
  - Added auto-generation of incident reports when SOS alerts are successful
  - Auto-generated reports have:
    - `incidentType`: "emergency"
    - `description`: Alert message or "Emergency SOS alert triggered"
    - `visibility`: "officials_only" (for security)
    - `anonymous`: false (since it's from SOS)
    - Audio evidence automatically attached if available

### 2. Enhanced ReportService.java

- **File**: `secureherai-api/src/main/java/com/secureherai/secureherai_api/service/ReportService.java`
- **Changes**:
  - Added `autoGenerateReportFromAlert(Alert alert)` method
  - Added `getReportByAlertId(UUID alertId, UUID requestingUserId, String userRole)` method
  - Proper authorization checks: report owner and responders can view, responders can't delete owner's evidence

### 3. Updated ReportController.java

- **File**: `secureherai-api/src/main/java/com/secureherai/secureherai_api/controller/ReportController.java`
- **Changes**:
  - Added new endpoint: `GET /api/report/alert-report?alertId={alertId}`
  - Proper authentication and authorization
  - Returns auto-generated report details

### 4. Database Schema Update

- **File**: `secureherai-api/database/add_emergency_incident_type.sql`
- **Changes**:
  - Added "emergency" to the incident_type check constraint
  - Allows SOS-generated reports to have incident_type = 'emergency'

### 5. Updated API Test Files

- **Files**:
  - `secureherai-api/endpoints/sos_test.http`
  - `secureherai-api/endpoints/report_test.http`
- **Changes**:
  - Added test case for the new `GET /api/report/alert-report?alertId={alertId}` endpoint
  - Added documentation and example responses

## Frontend Changes

### 1. Updated API Service

- **File**: `secureherai-app/services/api.ts`
- **Changes**:
  - Added `getReportByAlertId(alertId: string)` method
  - Makes HTTP call to the new backend endpoint

### 2. Modified SOS Screen

- **File**: `secureherai-app/app/(tabs)/sos.tsx`
- **Changes**:
  - Removed "Create Report" button functionality
  - Added "Update Report" button that:
    - Fetches the auto-generated report using `getReportByAlertId()`
    - Navigates to report details/update page if report exists
    - Shows appropriate error if report doesn't exist yet
  - Cleaned up unused imports and state variables

## Features Implemented

### ✅ Backend Requirements

1. **Auto-generate reports for successful SOS alerts**

   - Report created with alert message as description
   - Location from alert automatically populated
   - Incident type set to "emergency"
   - Audio evidence automatically attached if available

2. **New API endpoint**: `GET /api/report/alert-report?alertId={alertId}`

   - Returns report details for a specific alert
   - Proper authorization (owner and responders can view)
   - Returns error if no report exists for the alert

3. **Authorization for report updates**
   - Only report owner and responders can update reports
   - Responders cannot delete owner's uploaded evidence (existing authorization in updateReport method)

### ✅ Frontend Requirements

1. **Removed "Create Report" button from emergency alert page**
2. **Added "Update Report" functionality**
   - Uses new `getReportByAlertId()` API
   - Navigates to report update page when report exists
   - Shows appropriate messaging when report doesn't exist yet

## Database Migration Required

Run the SQL migration file to allow "emergency" incident type:

```sql
-- File: secureherai-api/database/add_emergency_incident_type.sql
ALTER TABLE incident_reports DROP CONSTRAINT IF EXISTS incident_reports_incident_type_check;
ALTER TABLE incident_reports ADD CONSTRAINT incident_reports_incident_type_check
    CHECK (incident_type IN ('harassment', 'theft', 'assault', 'emergency', 'other'));
```

## API Testing

You can test the new functionality using the provided HTTP test files:

### Test SOS Alert Creation and Report Retrieval:

1. Trigger an SOS alert using `POST /api/sos/voice-command` or `POST /api/sos/text-command`
2. Get the `alertId` from the response
3. Fetch the auto-generated report using `GET /api/report/alert-report?alertId={alertId}`

### Expected Flow:

1. User triggers SOS alert (voice or text)
2. Alert is created and saved
3. Report is automatically generated and linked to alert
4. Audio evidence is attached if available
5. User can view/update the report through the new API endpoint

## Notes

- Auto-generated reports have `visibility: "officials_only"` for security
- The existing report update authorization logic ensures responders can update status but can't delete owner's evidence
- Frontend gracefully handles cases where reports haven't been generated yet
- All changes maintain backward compatibility with existing functionality
