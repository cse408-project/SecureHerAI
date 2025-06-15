# Admin Module

## Overview

This module provides administrative functionality for system management, statistics, and oversight.

## Endpoints

### Get All Alerts

| API Endpoint      | HTTP Method |           Description            |
| ----------------- | :---------: | :------------------------------: |
| /api/admin/alerts |    `GET`    | Retrieves the list of all alerts |

> #### Request Parameters
>
> - `status`: (optional) Filter by alert status

> #### Response - Success
>
> ```json
> {
>   "success": true,
>   "alerts": [
>     {
>       "alertId": "abc123",
>       "userId": "12345",
>       "status": "active",
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
>   "error": "Admin not authenticated"
> }
> ```

---

### Get Alert Statistics

| API Endpoint                | HTTP Method |           Description           |
| --------------------------- | :---------: | :-----------------------------: |
| /api/admin/alert-statistics |    `GET`    | Retrieves statistics for alerts |

> #### Request Parameters
>
> - `timeRange`: (optional) Filter by time range

> #### Response - Success
>
> ```json
> {
>   "success": true,
>   "statistics": {
>     "totalAlerts": 100,
>     "activeAlerts": 10,
>     "resolvedAlerts": 90
>   }
> }
> ```

> #### Response - Error Cases
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "error": "Admin not authenticated"
> }
> ```

---

### Manage Reports

| API Endpoint       | HTTP Method |                Description                 |
| ------------------ | :---------: | :----------------------------------------: |
| /api/admin/reports |    `GET`    | Retrieves the list of all incident reports |

> #### Request Parameters
>
> - `status`: (optional) Filter by report status

> #### Response - Success
>
> ```json
> {
>   "success": true,
>   "reports": [
>     {
>       "reportId": "report123",
>       "userId": "12345",
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
>   "error": "Admin not authenticated"
> }
> ```

---

### Update System Settings

| API Endpoint        | HTTP Method |         Description         |
| ------------------- | :---------: | :-------------------------: |
| /api/admin/settings |    `PUT`    | Updates the system settings |

> #### Request Body
>
> ```json
> {
>   "settingName": "maxAlertRadius",
>   "settingValue": "500"
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
>   "message": "System settings updated."
> }
> ```

> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid setting value"
> }
> ```
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "error": "Admin not authenticated"
> }
> ```
