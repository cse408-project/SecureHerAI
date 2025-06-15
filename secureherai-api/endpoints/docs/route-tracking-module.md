# Map & Route Tracking Module

## Overview

This module handles journey tracking, location updates, ETA calculations, and communication between users and responders.

## Endpoints

### Start Journey Tracking

| API Endpoint     | HTTP Method |            Description             |
| ---------------- | :---------: | :--------------------------------: |
| /api/route/start |   `POST`    | Starts tracking the user's journey |

> #### Request Body
>
> ```json
> {
>   "userId": "12345",
>   "destination": {
>     "latitude": 23.8103,
>     "longitude": 90.4125
>   }
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
>   "message": "Journey tracking started.",
>   "trackingId": "track123"
> }
> ```

> ### Response - Error Cases
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

### Update Location

| API Endpoint      | HTTP Method |             Description             |
| ----------------- | :---------: | :---------------------------------: |
| /api/route/update |   `POST`    | Updates the user's current location |

> #### Request Body
>
> ```json
> {
>   "userId": "12345",
>   "location": {
>     "latitude": 23.8103,
>     "longitude": 90.4125
>   },
>   "trackingId": "track123"
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
>   "message": "Location updated successfully."
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

### End Journey Tracking

| API Endpoint   | HTTP Method |           Description            |
| -------------- | :---------: | :------------------------------: |
| /api/route/end |   `POST`    | Ends the user's journey tracking |

> #### Request Body
>
> ```json
> {
>   "userId": "12345",
>   "trackingId": "track123"
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
>   "message": "Journey tracking ended."
> }
> ```

> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid tracking ID"
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

### Get Responder Location

| API Endpoint                  | HTTP Method |                   Description                   |
| ----------------------------- | :---------: | :---------------------------------------------: |
| /api/route/responder-location |    `GET`    | Retrieves the current location of the responder |

> #### Request Parameters
>
> - `userId`: The ID of the user
> - `alertId`: The ID of the alert

> #### Response - Success
>
> ```json
> {
>   "success": true,
>   "responderLocation": {
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

### Get ETA

| API Endpoint   | HTTP Method |                 Description                  |
| -------------- | :---------: | :------------------------------------------: |
| /api/route/eta |    `GET`    | Calculates and retrieves the ETA to the user |

> #### Request Parameters
>
> - `userId`: The ID of the user
> - `destination`: The destination coordinates

> #### Response - Success
>
> ```json
> {
>   "success": true,
>   "eta": "15 minutes"
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
