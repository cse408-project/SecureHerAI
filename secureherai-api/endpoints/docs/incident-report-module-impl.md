# Incident Report Module

## Overview

This module handles incident reporting, evidence upload, report management, and visibility settings. Users can submit incident reports, upload evidence, and manage report visibility. Admins and responders can view public reports for monitoring and response purposes.

## Endpoints

### Submit Incident Report

| API Endpoint       | HTTP Method |          Description          |
| ------------------ | :---------: | :---------------------------: |
| /api/report/submit |   `POST`    | Submits a new incident report |

> #### Request Body
>
> ```json
> {
>   "incidentType": "theft",
>   "description": "My bag was stolen while I was waiting for the bus.",
>   "location": {
>     "latitude": 23.8103,
>     "longitude": 90.4125
>   },
>   "address": "Gulshan Avenue, Dhaka",
>   "incidentTime": "2023-10-01T18:30:00",
>   "visibility": "public",
>   "anonymous": false,
>   "alertId": "550e8400-e29b-41d4-a716-446655440000",
>   "evidence": ["data:image/jpeg;base64,..."],
>   "involvedParties": "{\"suspect\": {\"description\": \"Male, approximately 30-35 years old\"}}"
> }
> ```

> ### Response - Success
>
> #### Response Code: 201 (`Created`)
>
> #### Response Body
>
> ```json
> {
>   "success": true,
>   "message": "Incident report submitted successfully",
>   "error": null,
>   "reportId": "550e8400-e29b-41d4-a716-446655440001"
> }
> ```

> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "message": null,
>   "error": "Invalid incident type"
> }
> ```
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "message": null,
>   "error": "User not authenticated"
> }
> ```

---

### Get User Reports

| API Endpoint             | HTTP Method |                     Description                     |
| ------------------------ | :---------: | :-------------------------------------------------: |
| /api/report/user-reports |    `GET`    | Retrieves the list of reports submitted by the user |

> #### Response - Success
>
> ```json
> {
>   "success": true,
>   "reports": [
>     {
>       "reportId": "550e8400-e29b-41d4-a716-446655440001",
>       "incidentType": "theft",
>       "description": "My bag was stolen while I was waiting...",
>       "location": {
>         "latitude": 23.8103,
>         "longitude": 90.4125,
>         "address": "Gulshan Avenue, Dhaka"
>       },
>       "incidentTime": "2023-10-01T18:30:00",
>       "status": "submitted",
>       "visibility": "public",
>       "anonymous": false,
>       "createdAt": "2023-10-01T19:00:00Z"
>     }
>   ],
>   "error": null
> }
> ```

> #### Response - Error Cases
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "reports": null,
>   "error": "User not authenticated"
> }
> ```

---

### Get Report Details

| API Endpoint        | HTTP Method |                Description                 |
| ------------------- | :---------: | :----------------------------------------: |
| /api/report/details |    `GET`    | Retrieves the details of a specific report |

> #### Request Parameters
>
> - `reportId`: The ID of the report (Query parameter)

> #### Response - Success
>
> ```json
> {
>   "success": true,
>   "report": {
>     "reportId": "550e8400-e29b-41d4-a716-446655440001",
>     "alertId": "550e8400-e29b-41d4-a716-446655440000",
>     "incidentType": "theft",
>     "description": "My bag was stolen while I was waiting for the bus.",
>     "location": {
>       "latitude": 23.8103,
>       "longitude": 90.4125,
>       "address": "Gulshan Avenue, Dhaka"
>     },
>     "address": "Gulshan Avenue, Dhaka",
>     "incidentTime": "2023-10-01T18:30:00",
>     "status": "submitted",
>     "visibility": "public",
>     "anonymous": false,
>     "actionTaken": null,
>     "involvedParties": "{\"suspect\": {\"description\": \"Male, approximately 30-35 years old\"}}",
>     "evidence": ["https://storage.example.com/evidence/image1.jpg"],
>     "createdAt": "2023-10-01T19:00:00Z",
>     "updatedAt": "2023-10-01T19:00:00Z"
>   },
>   "error": null
> }
> ```

> #### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "report": null,
>   "error": "Report not found or access denied"
> }
> ```
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "report": null,
>   "error": "User not authenticated"
> }
> ```

---

### Upload Evidence

| API Endpoint                | HTTP Method |              Description               |
| --------------------------- | :---------: | :------------------------------------: |
| /api/report/upload-evidence |   `POST`    | Uploads evidence for a specific report |

> #### Request Body
>
> ```json
> {
>   "reportId": "550e8400-e29b-41d4-a716-446655440001",
>   "evidence": [
>     "data:image/jpeg;base64,...",
>     "data:video/mp4;base64,..."
>   ],
>   "description": "Photos and video from the incident scene"
> }
> ```

> ### Response - Success
>
> #### Response Code: 200 (`OK`)
>
> #### Response Body
>
> ```json
> {
>   "success": true,
>   "message": "Evidence uploaded successfully",
>   "error": null,
>   "reportId": null
> }
> ```

> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "message": null,
>   "error": "Report not found or access denied"
> }
> ```
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "message": null,
>   "error": "User not authenticated"
> }
> ```

---

### Update Report Visibility

| API Endpoint                  | HTTP Method |            Description             |
| ----------------------------- | :---------: | :--------------------------------: |
| /api/report/update-visibility |    `PUT`    | Updates the visibility of a report |

> #### Request Body
>
> ```json
> {
>   "reportId": "550e8400-e29b-41d4-a716-446655440001",
>   "visibility": "private"
> }
> ```

> ### Response - Success
>
> #### Response Code: 200 (`OK`)
>
> #### Response Body
>
> ```json
> {
>   "success": true,
>   "message": "Report visibility updated successfully",
>   "error": null,
>   "reportId": null
> }
> ```

> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "message": null,
>   "error": "Report not found or access denied"
> }
> ```
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "message": null,
>   "error": "User not authenticated"
> }
> ```

---

### Get Public Reports

| API Endpoint               | HTTP Method |                           Description                           |
| -------------------------- | :---------: | :-------------------------------------------------------------: |
| /api/report/public-reports |    `GET`    | Retrieves public reports (Admin and Responder access required) |

> #### Response - Success
>
> ```json
> {
>   "success": true,
>   "reports": [
>     {
>       "reportId": "550e8400-e29b-41d4-a716-446655440001",
>       "incidentType": "theft",
>       "description": "My bag was stolen while I was waiting...",
>       "location": {
>         "latitude": 23.8103,
>         "longitude": 90.4125,
>         "address": "Gulshan Avenue, Dhaka"
>       },
>       "incidentTime": "2023-10-01T18:30:00",
>       "status": "submitted",
>       "visibility": "public",
>       "anonymous": false,
>       "createdAt": "2023-10-01T19:00:00Z"
>     }
>   ],
>   "error": null
> }
> ```

> #### Response - Error Cases
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "reports": null,
>   "error": "User not authenticated"
> }
> ```
>
> #### Response Code: 403 (`Forbidden`)
>
> ```json
> {
>   "success": false,
>   "reports": null,
>   "error": "Insufficient permissions to access public reports"
> }
> ```

## Data Models

### Incident Types
- `harassment`
- `theft`
- `assault`
- `other`

### Visibility Options
- `public` - Visible to all users and officials
- `officials_only` - Visible to admins and responders only
- `private` - Visible to report author only

### Report Status
- `submitted` - Initial status when report is created
- `under_review` - Being reviewed by officials
- `resolved` - Report has been addressed/closed

## Authorization

### User Level
- Submit incident reports
- View their own reports
- Upload evidence to their reports
- Update visibility of their reports

### Responder Level
- All user permissions
- View public and officials_only reports

### Admin Level
- All responder permissions
- View all reports regardless of visibility
- Update report status (future enhancement)

## Validation Rules

### Submit Report
- `incidentType`: Required, must be one of the valid types
- `description`: Required, 10-2000 characters
- `location`: Required with valid latitude/longitude
- `incidentTime`: Required timestamp
- `visibility`: Required, must be valid option
- `anonymous`: Required boolean value

### Evidence Upload
- `reportId`: Required, must exist and belong to user
- `evidence`: Required array with at least one file
- Files should be base64 encoded with proper data URL format

### Update Visibility
- `reportId`: Required, must exist and belong to user
- `visibility`: Required, must be valid option
