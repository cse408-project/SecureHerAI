# Responder Module

## Overview

This module handles responder functionality including alert response, user communication, status updates, and incident reporting.

## Endpoints

### Accept/Reject Alert

| API Endpoint                  | HTTP Method |                  Description                  |
| ----------------------------- | :---------: | :-------------------------------------------: |
| /api/responder/alert-response |   `POST`    | Responds to an incoming alert (accept/reject) |

> #### Request Body
>
> ```json
> {
>   "alertId": "abc123",
>   "userId": "responder123",
>   "response": "accept"
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
>   "message": "Alert response recorded."
> }
> ```

> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid alert ID"
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

### View User Location

| API Endpoint                 | HTTP Method |                      Description                       |
| ---------------------------- | :---------: | :----------------------------------------------------: |
| /api/responder/user-location |    `GET`    | Retrieves the current location of the user in distress |

> #### Request Parameters
>
> - `alertId`: The ID of the alert

> #### Response - Success
>
> ```json
> {
>   "success": true,
>   "location": {
>     "latitude": 23.8103,
>     "longitude": 90.4125
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
>   "error": "Invalid alert ID"
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

### Contact User

| API Endpoint                | HTTP Method |          Description          |
| --------------------------- | :---------: | :---------------------------: |
| /api/responder/contact-user |   `POST`    | Contacts the user in distress |

> #### Request Body
>
> ```json
> {
>   "alertId": "abc123",
>   "userId": "responder123",
>   "message": "Help is on the way!"
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
>   "message": "Contact message sent to the user."
> }
> ```

> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid alert ID"
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

### View Evidence

| API Endpoint            | HTTP Method |                 Description                 |
| ----------------------- | :---------: | :-----------------------------------------: |
| /api/responder/evidence |    `GET`    | Retrieves the evidence for a specific alert |

> #### Request Parameters
>
> - `alertId`: The ID of the alert

> #### Response - Success
>
> ```json
> {
>   "success": true,
>   "evidence": ["data:image/jpeg;base64,..."]
> }
> ```

> #### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid alert ID"
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

### Update Alert Status

| API Endpoint                       | HTTP Method |          Description           |
| ---------------------------------- | :---------: | :----------------------------: |
| /api/responder/update-alert-status |    `PUT`    | Updates the status of an alert |

> #### Request Body
>
> ```json
> {
>   "alertId": "abc123",
>   "status": "in_progress"
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
>   "message": "Alert status updated."
> }
> ```

> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid alert ID"
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

### Get Assigned Alerts

| API Endpoint                   | HTTP Method |                      Description                       |
| ------------------------------ | :---------: | :----------------------------------------------------: |
| /api/responder/assigned-alerts |    `GET`    | Retrieves the list of alerts assigned to the responder |

> #### Request Parameters
>
> - `userId`: The ID of the responder

> #### Response - Success
>
> ```json
> {
>   "success": true,
>   "alerts": [
>     {
>       "alertId": "abc123",
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

### Update Responder Status

| API Endpoint                 | HTTP Method |            Description            |
| ---------------------------- | :---------: | :-------------------------------: |
| /api/responder/update-status |    `PUT`    | Updates the status of a responder |

> #### Request Body
>
> ```json
> {
>   "userId": "responder123",
>   "status": "available"
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
>   "message": "Responder status updated."
> }
> ```

> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid user ID"
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

### Submit Incident Report

| API Endpoint                 | HTTP Method |                   Description                    |
| ---------------------------- | :---------: | :----------------------------------------------: |
| /api/responder/submit-report |   `POST`    | Submits an incident report on behalf of the user |

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

### Get Available Responders

| API Endpoint             | HTTP Method |                       Description                        |
| ------------------------ | :---------: | :------------------------------------------------------: |
| /api/responder/available |    `GET`    | Retrieves a list of available responders for emergencies |

> #### Request Parameters (Optional)
>
> - `type`: Filter by responder type (POLICE, MEDICAL, FIRE, SECURITY, OTHER)

> #### Response - Success
>
> ```json
> {
>   "success": true,
>   "responders": [
>     {
>       "userId": "responder123",
>       "fullName": "Officer John Smith",
>       "responderType": "POLICE",
>       "badgeNumber": "POL-001",
>       "status": "AVAILABLE",
>       "currentLocation": {
>         "latitude": 23.8103,
>         "longitude": 90.4125
>       },
>       "lastStatusUpdate": "2025-06-15T10:30:00Z"
>     }
>   ]
> }
> ```

> #### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid responder type"
> }
> ```
