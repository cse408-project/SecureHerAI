# Heat Map Module

## Overview

This module provides AI-powered safety intelligence, risk assessment, safe route suggestions, and area safety reporting.

## Endpoints

### Get Heat Map Data

| API Endpoint      | HTTP Method |               Description                |
| ----------------- | :---------: | :--------------------------------------: |
| /api/heatmap/data |    `GET`    | Retrieves the heat map data for the user |

> #### Request Parameters
>
> - `userId`: The ID of the user
> - `timeRange`: The time range for the heat map data

> #### Response - Success
>
> ```json
> {
>   "success": true,
>   "heatmap": {
>     "2023-10-01": {
>       "latitude": 23.8103,
>       "longitude": 90.4125,
>       "intensity": 0.8
>     }
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
>   "error": "Invalid time range"
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

### Get Safe Routes

| API Endpoint             | HTTP Method |              Description               |
| ------------------------ | :---------: | :------------------------------------: |
| /api/heatmap/safe-routes |    `GET`    | Retrieves the safe routes for the user |

> #### Request Parameters
>
> - `userId`: The ID of the user
> - `destination`: The destination coordinates

> #### Response - Success
>
> ```json
> {
>   "success": true,
>   "routes": [
>     {
>       "routeId": "route123",
>       "path": [
>         {
>           "latitude": 23.8103,
>           "longitude": 90.4125
>         }
>       ],
>       "safetyScore": 0.9
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
>   "error": "Invalid destination data"
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

### Report Area Safety

| API Endpoint        | HTTP Method |              Description              |
| ------------------- | :---------: | :-----------------------------------: |
| /api/heatmap/report |   `POST`    | Reports the safety of a specific area |

> #### Request Body
>
> ```json
> {
>   "userId": "12345",
>   "location": {
>     "latitude": 23.8103,
>     "longitude": 90.4125
>   },
>   "safetyScore": 0.7,
>   "comments": "This area feels unsafe due to lack of streetlights."
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
>   "message": "Area safety reported successfully."
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

### Get Risk Assessment

| API Endpoint                 | HTTP Method |                Description                 |
| ---------------------------- | :---------: | :----------------------------------------: |
| /api/heatmap/risk-assessment |    `GET`    | Retrieves the risk assessment for the user |

> #### Request Parameters
>
> - `userId`: The ID of the user
> - `location`: The location coordinates

> #### Response - Success
>
> ```json
> {
>   "success": true,
>   "riskLevel": "high",
>   "advice": "Avoid this area if possible."
> }
> ```

> #### Response - Error Cases
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
