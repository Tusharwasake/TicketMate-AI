# AI Ticket Assistant - Backend API Documentation

## Base URL

**Development:**

```
http://localhost:4000/api
```

**Production:**

```
https://ticketmate-ai.onrender.com/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

---

## User Management

### POST /auth/signup

Register a new user with role selection and skills.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "user", // optional: "user" or "moderator" (default: "user")
  "skills": ["javascript", "react", "customer support"] // optional array
}
```

**Response (201):**

```json
{
  "user": {
    "_id": "user_id",
    "email": "user@example.com",
    "role": "user",
    "skills": ["javascript", "react", "customer support"],
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "jwt_token_here",
  "message": "User created successfully"
}
```

**Error Responses:**

```json
// 400 - Validation Error
{
  "error": "Email and password are required"
}

// 400 - Invalid Role
{
  "error": "Invalid role. Allowed roles are: user, moderator"
}

// 400 - Invalid Skills
{
  "error": "All skills must be non-empty strings"
}

// 409 - User Exists
{
  "error": "User with this email already exists"
}
```

### POST /auth/login

Authenticate a user.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**

```json
{
  "user": {
    "_id": "user_id",
    "email": "user@example.com",
    "role": "user",
    "skills": []
  },
  "token": "jwt_token_here",
  "message": "Login successful"
}
```

### POST /auth/logout

Logout the current user.

**Headers:** Authorization required

**Response (200):**

```json
{
  "message": "Logout successful"
}
```

### GET /auth/users

Get all users (Admin only).

**Headers:** Authorization required

**Response (200):**

```json
{
  "users": [
    {
      "_id": "user_id",
      "email": "user@example.com",
      "role": "user",
      "skills": ["javascript"],
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1,
  "message": "Users retrieved successfully"
}
```

### POST /auth/update-user

Update user role and skills (Admin only).

**Headers:** Authorization required

**Request Body:**

```json
{
  "email": "user@example.com",
  "role": "moderator",
  "skills": ["javascript", "react", "node.js"]
}
```

**Response (200):**

```json
{
  "message": "User updated successfully"
}
```

---

## Ticket Management

### POST /tickets

Create a new support ticket.

**Headers:** Authorization required

**Request Body:**

```json
{
  "title": "Login issue with mobile app",
  "description": "Users are unable to login on iOS devices after the latest update. Getting 'Invalid credentials' error even with correct login details."
}
```

**Response (201):**

```json
{
  "message": "Ticket Created and Processing",
  "ticket": {
    "_id": "ticket_id",
    "title": "Login issue with mobile app",
    "description": "Users are unable to login...",
    "status": "TODO",
    "createdBy": "user_id",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### GET /tickets

Get all tickets (role-based filtering).

**Headers:** Authorization required

**Response (200):**
For admins/moderators:

```json
[
  {
    "_id": "ticket_id",
    "title": "Login issue with mobile app",
    "description": "Users are unable to login...",
    "status": "IN_PROGRESS",
    "priority": "high",
    "helpfulNotes": "This appears to be an authentication issue...",
    "relatedSkills": ["ios", "authentication", "mobile"],
    "replyCanbeGiven": [
      "Thank you for reporting this issue...",
      "I can see this is affecting iOS users...",
      "Let me investigate this authentication problem..."
    ],
    "assignedTo": {
      "_id": "moderator_id",
      "email": "moderator@example.com"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "replies": []
  }
]
```

For users (only their tickets):

```json
[
  {
    "_id": "ticket_id",
    "title": "Login issue with mobile app",
    "description": "Users are unable to login...",
    "status": "IN_PROGRESS",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### GET /tickets/:id

Get a specific ticket.

**Headers:** Authorization required

**Parameters:** `id` - Ticket ID

**Response (200):**

```json
{
  "ticket": {
    "_id": "ticket_id",
    "title": "Login issue with mobile app",
    "description": "Users are unable to login...",
    "status": "IN_PROGRESS",
    "priority": "high",
    "helpfulNotes": "This appears to be an authentication issue...",
    "relatedSkills": ["ios", "authentication", "mobile"],
    "replyCanbeGiven": [
      "Thank you for reporting this issue...",
      "I can see this is affecting iOS users...",
      "Let me investigate this authentication problem..."
    ],
    "assignedTo": {
      "_id": "moderator_id",
      "email": "moderator@example.com",
      "role": "moderator"
    },
    "replies": [
      {
        "_id": "reply_id",
        "message": "We've identified the issue and are working on a fix.",
        "author": {
          "_id": "moderator_id",
          "email": "moderator@example.com",
          "role": "moderator"
        },
        "createdAt": "2024-01-01T01:00:00.000Z"
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T01:00:00.000Z"
  }
}
```

### POST /tickets/:id/reply

Add a reply to a ticket.

**Headers:** Authorization required

**Parameters:** `id` - Ticket ID

**Request Body:**

```json
{
  "message": "We've identified the issue and are working on a fix. Expected resolution time is 2-3 hours.",
  "status": "IN_PROGRESS" // optional
}
```

**Response (200):**

```json
{
  "message": "Reply added successfully",
  "ticket": {
    // Full ticket object with new reply included
  }
}
```

### PATCH /tickets/:id/status

Update ticket status.

**Headers:** Authorization required (Admin/Moderator/Assigned Agent)

**Parameters:** `id` - Ticket ID

**Request Body:**

```json
{
  "status": "resolved"
}
```

**Response (200):**

```json
{
  "message": "Ticket status updated successfully",
  "ticket": {
    "_id": "ticket_id",
    "status": "resolved",
    "resolvedAt": "2024-01-01T02:00:00.000Z"
    // ... other ticket fields
  }
}
```

### PATCH /tickets/:id

Update ticket (general updates).

**Headers:** Authorization required (Admin/Moderator)

**Parameters:** `id` - Ticket ID

**Request Body:**

```json
{
  "assignedTo": "moderator_id",
  "priority": "high",
  "deadline": "2024-01-02T00:00:00.000Z"
}
```

**Response (200):**

```json
{
  "message": "Ticket updated successfully",
  "ticket": {
    // Updated ticket object
  }
}
```

---

## User Roles & Permissions

### User (`user`)

- Create tickets
- View their own tickets
- Reply to their own tickets

### Moderator (`moderator`)

- View all tickets
- Reply to any ticket
- Update ticket status
- Get assigned tickets based on skills

### Admin (`admin`)

- All moderator permissions
- Manage users (update roles/skills)
- Delete tickets
- View all users

---

## AI Processing Workflow

When a ticket is created:

1. **Immediate Response**: Ticket created with status "TODO"
2. **Background Processing** (via Inngest):
   - AI analyzes ticket using Gemini
   - Extracts summary, priority, helpful notes, and related skills
   - Generates 3 reply suggestions
   - Finds best moderator based on skills
   - Updates ticket status to "IN_PROGRESS"
   - Sends email notification to assigned moderator

### AI Analysis Output

```json
{
  "summary": "iOS authentication failure affecting mobile app users",
  "priority": "high",
  "helpfulNotes": "This appears to be related to recent iOS updates. Check authentication tokens and session management.",
  "relatedSkills": ["ios", "authentication", "mobile"],
  "replySuggestions": [
    "Thank you for reporting this iOS login issue. I'm investigating the authentication problem immediately.",
    "I can see this is affecting multiple iOS users. Let me check our recent app updates and authentication flow.",
    "This appears to be an iOS-specific issue. I'm escalating to our mobile team for urgent resolution."
  ]
}
```

---

## Error Responses

### 400 - Bad Request

```json
{
  "message": "Title and Description are required"
}
```

### 401 - Unauthorized

```json
{
  "error": "Access Denied no token found"
}
```

### 403 - Forbidden

```json
{
  "message": "Access denied"
}
```

### 404 - Not Found

```json
{
  "message": "Ticket not found"
}
```

### 500 - Internal Server Error

```json
{
  "message": "Internal server Error"
}
```

---

## Environment Variables

```env
MONGO_URL=mongodb://localhost:27017/ai-ticket-system
ACCESS_TOKEN_SECRET=your-jwt-secret
GEMINI_API_KEY=your-gemini-api-key
INNGEST_SIGNING_KEY=your-inngest-signing-key
INNGEST_EVENT_KEY=your-inngest-event-key
MAILTRAP_SMTP_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_SMTP_PORT=587
MAILTRAP_SMTP_USER=your-mailtrap-user
MAILTRAP_SMTP_PASS=your-mailtrap-password
SERVER_PORT=3000
```
