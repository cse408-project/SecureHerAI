# SOS Alert System Module

## Overview

This module handles emergency alert triggering, voice command detection, alert management, and cancellation.

## Endpoints

### Trigger SOS Alert

| API Endpoint     | HTTP Method |                Description                |
| ---------------- | :---------: | :---------------------------------------: |
| /api/sos/trigger |   `POST`    | Triggers the SOS alert with user location |

> #### Request Body
>
> ```json
> {
>   "userId": "12345",
>   "location": {
>     "latitude": 23.8103,
>     "longitude": 90.4125
>   },
>   "message": "Need help!",
>   "alertType": "emergency"
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
>   "alertId": "abc123",
>   "message": "SOS alert triggered successfully."
> }
> ```

> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid location data"
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

### Voice Command Detection

| API Endpoint           | HTTP Method |             Description             |
| ---------------------- | :---------: | :---------------------------------: |
| /api/sos/voice-command |   `POST`    | Detects voice command for SOS alert |

> #### Request Body
>
> ```json
> {
>   "userId": "12345",
>   "audioData": "base64-encoded-audio",
>   "language": "en-US"
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
>   "message": "SOS alert triggered successfully via voice command."
> }
> ```

> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid audio data"
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

### Cancel SOS Alert

| API Endpoint    | HTTP Method |         Description          |
| --------------- | :---------: | :--------------------------: |
| /api/sos/cancel |   `POST`    | Cancels the active SOS alert |

> #### Request Body
>
> ```json
> {
>   "userId": "12345",
>   "alertId": "abc123"
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
>   "message": "SOS alert canceled successfully."
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

### Get Active Alerts

| API Endpoint           | HTTP Method |               Description               |
| ---------------------- | :---------: | :-------------------------------------: |
| /api/sos/active-alerts |    `GET`    | Retrieves the list of active SOS alerts |

> #### Request Parameters
>
> - `userId`: The ID of the user

> #### Response - Success
>
> ```json
> {
>   "success": true,
>   "alerts": [
>     {
>       "alertId": "abc123",
>       "timestamp": "2023-10-01T12:00:00Z",
>       "location": {
>         "latitude": 23.8103,
>         "longitude": 90.4125
>       },
>       "status": "active"
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
