# Fake Alert Detection Module

## Overview

This module handles AI-powered verification of alert authenticity through various analysis methods.

## Endpoints

### Verify Alert

| API Endpoint      | HTTP Method |              Description              |
| ----------------- | :---------: | :-----------------------------------: |
| /api/alert/verify |   `POST`    | Verifies the authenticity of an alert |

> #### Request Body
>
> ```json
> {
>   "alertId": "abc123",
>   "userId": "12345",
>   "verificationMethod": "audio"
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
>   "message": "Alert verified as genuine."
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

### Get Alert Status

| API Endpoint      | HTTP Method |               Description                |
| ----------------- | :---------: | :--------------------------------------: |
| /api/alert/status |    `GET`    | Retrieves the status of a specific alert |

> #### Request Parameters
>
> - `alertId`: The ID of the alert

> #### Response - Success
>
> ```json
> {
>   "success": true,
>   "status": "verified"
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
