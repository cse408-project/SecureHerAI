# Incident Report Module

## Overview

This module handles incident reporting, evidence upload, report management, and visibility settings.

## Endpoints

### Submit Incident Report

| API Endpoint       | HTTP Method |          Description          |
| ------------------ | :---------: | :---------------------------: |
| /api/report/submit |   `POST`    | Submits a new incident report |

> #### Request Body
>
> ```json
> {
>   "userId": "12345",
>   "incidentType": "theft",
>   "description": "My bag was stolen.",
>   "location": {
>     "latitude": 23.8103,
>     "longitude": 90.4125
>   },
>   "evidence": ["data:image/jpeg;base64,..."]
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
>   "reportId": "report123",
>   "message": "Incident report submitted successfully."
> }
> ```

> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid incident type"
> }
> ```
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "error": "User not authenticated"
> }
> ```

---

### Get User Reports

| API Endpoint             | HTTP Method |                     Description                     |
| ------------------------ | :---------: | :-------------------------------------------------: |
| /api/report/user-reports |    `GET`    | Retrieves the list of reports submitted by the user |

> #### Request Parameters
>
> - `userId`: The ID of the user

> #### Response - Success
>
> ```json
> {
>   "success": true,
>   "reports": [
>     {
>       "reportId": "report123",
>       "incidentType": "theft",
>       "status": "pending",
>       "timestamp": "2023-10-01T12:00:00Z"
>     }
>   ]
> }
> ```

> #### Response - Error Cases
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
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
> - `reportId`: The ID of the report

> #### Response - Success
>
> ```json
> {
>   "success": true,
>   "report": {
>     "reportId": "report123",
>     "incidentType": "theft",
>     "description": "My bag was stolen.",
>     "location": {
>       "latitude": 23.8103,
>       "longitude": 90.4125
>     },
>     "status": "pending",
>     "timestamp": "2023-10-01T12:00:00Z",
>     "evidence": ["data:image/jpeg;base64,..."]
>   }
> }
> ```

> #### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid report ID"
> }
> ```
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
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
>   "reportId": "report123",
>   "evidence": ["data:image/jpeg;base64,..."]
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
>   "message": "Evidence uploaded successfully."
> }
> ```

> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid report ID"
> }
> ```
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
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
>   "reportId": "report123",
>   "isVisible": false
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
>   "message": "Report visibility updated."
> }
> ```

> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid report ID"
> }
> ```
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "error": "User not authenticated"
> }
> ```
