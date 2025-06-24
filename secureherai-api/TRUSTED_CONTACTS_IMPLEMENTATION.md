# Trusted Contacts Module Implementation

## Overview
This module implements the Trusted Contacts feature for the SecureHerAI API, allowing users to manage their emergency contacts who will be notified during alerts.

## Database Schema
Based on the provided SQL schema:
```sql
CREATE TABLE trusted_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    relationship TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    share_location BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, phone)
);
```

## Implemented Components

### 1. Entity Layer
- **TrustedContact.java**: JPA entity mapping to the `trusted_contacts` table
  - Direct field mapping for `user_id` from User entity
  - Relationship mapping to User entity with lazy loading
  - All constraints and defaults implemented

### 2. Repository Layer
- **TrustedContactRepository.java**: Spring Data JPA repository
  - Standard CRUD operations
  - Custom query methods for user-specific operations
  - Phone number uniqueness checking

### 3. DTO Layer
- **ContactRequest.java**: Request DTOs with validation
  - `AddTrustedContact` - for adding new contacts
  - `DeleteTrustedContact` - for deleting contacts
  - Input validation including phone number format validation
  
- **ContactResponse.java**: Response DTOs
  - `GenericResponse` - for success/error messages
  - `GetContactsResponse` - for listing contacts
  - `ContactInfo` - contact information structure

### 4. Service Layer
- **ContactService.java**: Business logic implementation
  - Add trusted contact with duplicate phone checking
  - Get all trusted contacts for a user
  - Delete trusted contact with ownership verification
  - Comprehensive error handling

### 5. Controller Layer
- **ContactController.java**: REST API endpoints
  - `POST /api/contacts/add` - Add trusted contact
  - `GET /api/contacts` - Get trusted contacts
  - `DELETE /api/contacts/delete` - Delete trusted contact
  - JWT authentication and authorization
  - User ID validation for security

## API Endpoints

### Add Trusted Contact
- **Endpoint**: `POST /api/contacts/add`
- **Authentication**: Required (JWT Bearer token)
- **Request Body**:
```json
{
  "userId": "user-uuid",
  "contact": {
    "name": "John Doe",
    "phone": "+8801712345678",
    "relationship": "friend",
    "email": "john@example.com",
    "shareLocation": true
  }
}
```
- **Success Response** (200):
```json
{
  "success": true,
  "message": "Trusted contact added successfully."
}
```

### Get Trusted Contacts
- **Endpoint**: `GET /api/contacts`
- **Authentication**: Required (JWT Bearer token)
- **Optional Query Parameter**: `userId`
- **Success Response** (200):
```json
{
  "success": true,
  "contacts": [
    {
      "contactId": "contact-uuid",
      "name": "John Doe",
      "phone": "+8801712345678",
      "relationship": "friend",
      "email": "john@example.com",
      "shareLocation": true,
      "createdAt": "2025-06-16T10:30:00"
    }
  ]
}
```

### Delete Trusted Contact
- **Endpoint**: `DELETE /api/contacts/delete`
- **Authentication**: Required (JWT Bearer token)
- **Request Body**:
```json
{
  "userId": "user-uuid",
  "contactId": "contact-uuid"
}
```
- **Success Response** (200):
```json
{
  "success": true,
  "message": "Trusted contact deleted successfully."
}
```

## Security Features

### Authentication
- All endpoints require valid JWT Bearer token
- Token validation using JwtService
- User identification from token

### Authorization
- User can only access their own contacts
- UserId validation against JWT token
- Contact ownership verification for delete operations

### Input Validation
- Phone number format validation (international format)
- Email format validation
- Required field validation
- Maximum length constraints

## Error Handling

### HTTP Status Codes
- **200 OK**: Successful operations
- **400 Bad Request**: Validation errors, business logic errors
- **401 Unauthorized**: Authentication failures
- **403 Forbidden**: Authorization failures (wrong user)
- **500 Internal Server Error**: Unexpected errors

### Error Response Format
```json
{
  "success": false,
  "error": "Error message description"
}
```

## Testing

### Test File: `con_not_test.http`
Comprehensive test suite including:

#### Success Scenarios
- Add contacts with complete information
- Add contacts with minimal information
- Get all contacts
- Delete contacts

#### Validation Error Scenarios
- Invalid phone number format
- Invalid email format
- Missing required fields
- Duplicate phone numbers

#### Authentication/Authorization Scenarios
- Missing authentication token
- Invalid/expired tokens
- Wrong user ID access attempts

#### Edge Cases
- Maximum length values
- Special characters in names
- Non-existent contact deletion

## Business Rules

1. **Phone Number Uniqueness**: Each user can have only one contact per phone number
2. **User Isolation**: Users can only manage their own contacts
3. **Required Fields**: Name, phone, and relationship are mandatory
4. **Phone Format**: Must be in international format (+countrycode...)
5. **Email Validation**: Must be valid email format if provided
6. **Default Values**: `shareLocation` defaults to true if not specified

## Usage Instructions

1. **Setup**: Ensure all entity classes are properly imported and JPA is configured
2. **Authentication**: Obtain JWT token from authentication endpoint
3. **Testing**: Use the provided `.http` file with VS Code REST Client extension
4. **Variables**: Replace `{{authToken}}` and `{{userId}}` with actual values
5. **Sequence**: Run tests in order for dependency-based tests

## Integration Points

- **User Entity**: References user table for user validation
- **JWT Service**: For authentication and user identification
- **Email Service**: Ready for future notification integration
- **Alert System**: Contacts can be used for emergency notifications

## Future Enhancements

1. **Notification Integration**: Send alerts to trusted contacts
2. **Contact Categories**: Different types of emergency contacts
3. **Location Sharing**: Implement actual location sharing functionality
4. **Contact Verification**: Phone/email verification process
5. **Bulk Operations**: Add/delete multiple contacts at once
6. **Contact Import**: Import from phone contacts or CSV files
