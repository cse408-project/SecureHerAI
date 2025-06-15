# AI Chat Helper Module (Optional)

## Overview

This optional module provides AI-powered assistance, guidance, and support for users through natural language interaction.

## Endpoints

### Chat with AI

| API Endpoint | HTTP Method |              Description              |
| ------------ | :---------: | :-----------------------------------: |
| /api/ai/chat |   `POST`    | Sends a message to the AI chat helper |

> #### Request Body
>
> ```json
> {
>   "userId": "12345",
>   "message": "What should I do in an emergency?"
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
>   "response": "In an emergency, try to remain calm and call for help immediately."
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

## Features

The AI Chat Helper provides:

- **Real-time Guidance**: Immediate responses to safety-related questions
- **Safety Tips**: Proactive safety advice based on user context
- **Feature Navigation**: Help with using application features
- **Emotional Support**: Compassionate responses during stressful situations
- **Resource Connection**: Information about local emergency services and support

## Usage Examples

### Emergency Guidance

**User**: "I think someone is following me, what should I do?"
**AI**: "Your safety is the priority. Trust your instincts. Move to a public, well-lit area with other people. Consider triggering an SOS alert if you feel threatened. Would you like me to help you contact someone?"

### Feature Help

**User**: "How do I add a trusted contact?"
**AI**: "You can add a trusted contact by going to Settings > Trusted Contacts > Add Contact. Enter their name, phone number, and relationship to you. They'll be notified automatically if you trigger an SOS alert."

### Safety Tips

**User**: "I'm walking home alone at night."
**AI**: "Here are some safety tips: Stay in well-lit areas, avoid shortcuts through isolated areas, keep your phone charged, share your location with trusted contacts, and stay alert to your surroundings. Would you like me to help you start journey tracking?"
