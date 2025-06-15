# Contacts & Notification Module

## Overview

This module handles trusted contacts management and notification preferences for emergency alerts.

## Endpoints

### Add Trusted Contact

| API Endpoint      | HTTP Method |             Description             |
| ----------------- | :---------: | :---------------------------------: |
| /api/contacts/add |   `POST`    | Adds a trusted contact for the user |

> #### Request Body
>
> ```json
> {
>   "userId": "12345",
>   "contact": {
>     "name": "John Doe",
>     "phone": "+8801712345678",
>     "relationship": "friend"
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
>   "message": "Trusted contact added successfully."
> }
> ```

> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid phone number format"
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

### Get Trusted Contacts

| API Endpoint  | HTTP Method |              Description               |
| ------------- | :---------: | :------------------------------------: |
| /api/contacts |    `GET`    | Retrieves the list of trusted contacts |

> #### Request Parameters
>
> - `userId`: The ID of the user

> #### Response - Success
>
> ```json
> {
>   "success": true,
>   "contacts": [
>     {
>       "contactId": "cont123",
>       "name": "John Doe",
>       "phone": "+8801712345678",
>       "relationship": "friend"
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

### Delete Trusted Contact

| API Endpoint         | HTTP Method |        Description        |
| -------------------- | :---------: | :-----------------------: |
| /api/contacts/delete |  `DELETE`   | Deletes a trusted contact |

> #### Request Body
>
> ```json
> {
>   "userId": "12345",
>   "contactId": "cont123"
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
>   "message": "Trusted contact deleted successfully."
> }
> ```

> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid contact ID"
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

### Update Notification Preferences

| API Endpoint                          | HTTP Method |                    Description                    |
| ------------------------------------- | :---------: | :-----------------------------------------------: |
| /api/notifications/update-preferences |    `PUT`    | Updates the notification preferences for the user |

> #### Request Body
>
> ```json
> {
>   "userId": "12345",
>   "preferences": {
>     "emailAlerts": true,
>     "smsAlerts": false,
>     "pushNotifications": true
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
>   "message": "Notification preferences updated successfully."
> }
> ```

> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid notification preference value"
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
