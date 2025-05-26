# SecureHerAI

Women's Safety Application with AI Integration

## Setup Instructions

### Prerequisites

- Java 17+
- Maven 3.6+
- PostgreSQL 12+

### Environment Configuration

1. **Copy the environment template:**

   ```bash
   cp .env.example .env
   ```
2. **Configure your environment variables in `.env`:**

   - `MAIL_USERNAME`: Your Gmail address
   - `MAIL_PASSWORD`: Your Gmail App Password (not your regular password)

   To generate Gmail App Password:

   - Go to Google Account settings
   - Enable 2-factor authentication
   - Generate an App Password for "Mail"
   - Use that 16-character password in your `.env` file
3. **Never commit the `.env` file to version control** - it contains sensitive credentials

### Running the Application

```bash
docker-compose -f docker-compose-dev.yml down
export DOCKER_BUILDKIT=1 && docker-compose -f docker-compose-dev.yml up --build
```

The API will be available at `http://localhost:8080`

### Testing the API

Use the HTTP files in `endpoints/` directory:

- `auth_test.http` - Authentication endpoints
- `structure_test.http` - Other API endpoints
