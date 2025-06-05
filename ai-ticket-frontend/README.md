# AI Ticket Assistant API Documentation

## Tech Stack

### Frontend

- **Framework**: React 18+ with Vite
- **Styling**:
  - Tailwind CSS (utility-first CSS framework)
  - DaisyUI (Tailwind CSS components)
- **State Management**: React Hooks (useState, useEffect)
- **Routing**: React Router DOM
- **Markdown**: ReactMarkdown for rendering formatted text
- **Build Tool**: Vite with ESBuild
- **Package Manager**: npm/yarn

### Backend (Inferred)

- **Runtime**: Node.js
- **Framework**: Express.js (likely)
- **Database**: MongoDB (based on `_id` fields)
- **Authentication**: JWT (JSON Web Tokens)
- **AI Integration**: Custom AI service for ticket analysis and reply suggestions
- **Deployment**: Render.com

### Development Tools

- **Code Quality**: ESLint, Prettier (typical for React projects)
- **Version Control**: Git
- **Environment**: Development and Production environments

### Browser Support

- Modern browsers with ES6+ support
- LocalStorage/SessionStorage for client-side data persistence
- Fallback to in-memory storage for restricted environments

## Base URL

- Development: `http://localhost:4000/api`
- Production: `https://ticketmate-ai.onrender.com/api`

## Frontend Architecture

### Key Dependencies

```json
{
  "react": "^18.x",
  "react-dom": "^18.x",
  "react-router-dom": "^6.x",
  "react-markdown": "^9.x",
  "vite": "^5.x",
  "@vitejs/plugin-react": "^4.x",
  "tailwindcss": "^3.x",
  "daisyui": "^4.x"
}
```

### Project Structure

```
ai-ticket-frontend/
├── src/
│   ├── components/
│   │   ├── ErrorBoundary.jsx      # Global error handling
│   │   ├── navbar.jsx             # Navigation component
│   │   ├── check-auth.jsx         # Authentication guard
│   │   └── check-auth-debug.jsx   # Debug authentication
│   ├── pages/
│   │   ├── Tickets.jsx           # Main tickets dashboard
│   │   ├── Ticket.jsx            # Individual ticket view
│   │   ├── Login.jsx             # Login page
│   │   ├── Signup.jsx            # Registration page
│   │   └── Admin.jsx             # Admin panel
│   ├── utils/
│   │   ├── api.js                # API client utilities
│   │   └── storage.js            # Safe storage wrapper
│   ├── index.css                 # Tailwind imports
│   └── main.jsx                  # App entry point
├── index.html
├── vite.config.js               # Vite configuration
└── package.json
```

### State Management Strategy

- **Local State**: React useState for component-level state
- **Authentication**: JWT tokens stored in localStorage/sessionStorage
- **API State**: Manual fetch with loading/error states
- **No Global State**: Simple prop passing and context-free architecture

### Security Features

- **JWT Authentication**: Bearer token validation
- **Role-based Access Control**: User, Moderator, Admin roles
- **Safe Storage**: Fallback mechanism for restricted environments
- **Input Validation**: Client-side validation with server-side verification
- **Error Boundaries**: Graceful error handling and recovery

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <token>
```

## Data Models

### User

```typescript
{
  _id: string
  email: string
  password: string (hashed)
  role: "user" | "moderator" | "admin"
  skills?: string[]
  createdAt: Date
  updatedAt: Date
}
```

### Ticket

```typescript
{
  _id: string
  title: string
  description: string
  status: "TODO" | "open" | "in-progress" | "resolved" | "closed" | "cancelled"
  priority?: "low" | "medium" | "high"
  createdBy: User | string
  assignedTo?: User | string
  assignedAt?: Date
  resolvedAt?: Date
  helpfulNotes?: string // AI-generated analysis
  replyCanbeGiven?: string[] // AI-suggested replies
  relatedSkills?: string[]
  tags?: string[]
  replies: Reply[]
  createdAt: Date
  updatedAt: Date
}
```

### Reply

```typescript
{
  message: string;
  author: User | string;
  createdAt: Date;
}
```

## API Endpoints

### Authentication

#### POST /auth/signup

Create a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "token": "jwt_token_here",
  "user": {
    "_id": "user_id",
    "email": "user@example.com",
    "role": "user"
  }
}
```

**Status Codes:**

- `201` - User created successfully
- `400` - Invalid input data
- `409` - User already exists

---

#### POST /auth/login

Authenticate user and get access token.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "token": "jwt_token_here",
  "user": {
    "_id": "user_id",
    "email": "user@example.com",
    "role": "user"
  }
}
```

**Status Codes:**

- `200` - Login successful
- `401` - Invalid credentials
- `400` - Invalid input data

---

#### GET /auth/users

Get all users (Admin only).

**Headers:**

```
Authorization: Bearer <admin_token>
```

**Response:**

```json
{
  "users": [
    {
      "_id": "user_id",
      "email": "user@example.com",
      "role": "user",
      "skills": ["JavaScript", "React"],
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Status Codes:**

- `200` - Success
- `401` - Unauthorized
- `403` - Forbidden (non-admin)

---

#### POST /auth/update-user

Update user role and skills (Admin only).

**Headers:**

```
Authorization: Bearer <admin_token>
```

**Request Body:**

```json
{
  "email": "user@example.com",
  "role": "moderator",
  "skills": ["JavaScript", "React", "Node.js"]
}
```

**Response:**

```json
{
  "message": "User updated successfully",
  "user": {
    "_id": "user_id",
    "email": "user@example.com",
    "role": "moderator",
    "skills": ["JavaScript", "React", "Node.js"]
  }
}
```

**Status Codes:**

- `200` - User updated successfully
- `401` - Unauthorized
- `403` - Forbidden (non-admin)
- `404` - User not found

### Tickets

#### GET /tickets

Get all tickets for the authenticated user.

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
[
  {
    "_id": "ticket_id",
    "title": "Login issue",
    "description": "Cannot login to the application",
    "status": "open",
    "priority": "high",
    "createdBy": {
      "_id": "user_id",
      "email": "user@example.com"
    },
    "assignedTo": null,
    "helpfulNotes": "AI analysis of the issue...",
    "replyCanbeGiven": [
      "Have you tried clearing your browser cache?",
      "Please check if your account is locked."
    ],
    "relatedSkills": ["Authentication", "Frontend"],
    "replies": [],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

**Status Codes:**

- `200` - Success
- `401` - Unauthorized

---

#### POST /tickets

Create a new ticket.

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "title": "Login issue",
  "description": "I cannot login to the application. Getting error message."
}
```

**Response:**

```json
{
  "_id": "ticket_id",
  "title": "Login issue",
  "description": "I cannot login to the application. Getting error message.",
  "status": "open",
  "createdBy": "user_id",
  "helpfulNotes": "AI-generated analysis...",
  "replyCanbeGiven": ["Suggested reply 1", "Suggested reply 2"],
  "relatedSkills": ["Authentication"],
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Status Codes:**

- `201` - Ticket created successfully
- `400` - Invalid input data
- `401` - Unauthorized

---

#### GET /tickets/:id

Get a specific ticket by ID.

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "ticket": {
    "_id": "ticket_id",
    "title": "Login issue",
    "description": "Cannot login to the application",
    "status": "open",
    "createdBy": {
      "_id": "user_id",
      "email": "user@example.com"
    },
    "assignedTo": {
      "_id": "moderator_id",
      "email": "mod@example.com",
      "role": "moderator"
    },
    "helpfulNotes": "AI analysis...",
    "replyCanbeGiven": ["Suggested replies..."],
    "replies": [
      {
        "message": "We're looking into this issue.",
        "author": {
          "_id": "moderator_id",
          "email": "mod@example.com",
          "role": "moderator"
        },
        "createdAt": "2024-01-01T01:00:00.000Z"
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Status Codes:**

- `200` - Success
- `401` - Unauthorized
- `403` - Forbidden (not authorized to view)
- `404` - Ticket not found

---

#### PATCH /tickets/:id

Update ticket assignment (Moderators/Admins only).

**Headers:**

```
Authorization: Bearer <moderator_token>
```

**Request Body:**

```json
{
  "assignedTo": "moderator_user_id"
}
```

**Response:**

```json
{
  "message": "Ticket updated successfully",
  "ticket": {
    "_id": "ticket_id",
    "assignedTo": "moderator_user_id",
    "assignedAt": "2024-01-01T02:00:00.000Z"
  }
}
```

**Status Codes:**

- `200` - Ticket updated successfully
- `401` - Unauthorized
- `403` - Forbidden (not a moderator/admin)
- `404` - Ticket not found

---

#### POST /tickets/:id/reply

Add a reply to a ticket.

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "message": "Thank you for the help! The issue is resolved.",
  "status": "resolved" // Optional: Update ticket status
}
```

**Response:**

```json
{
  "message": "Reply added successfully",
  "reply": {
    "message": "Thank you for the help! The issue is resolved.",
    "author": "user_id",
    "createdAt": "2024-01-01T03:00:00.000Z"
  },
  "ticket": {
    "_id": "ticket_id",
    "status": "resolved" // If status was updated
  }
}
```

**Status Codes:**

- `201` - Reply added successfully
- `400` - Invalid input data
- `401` - Unauthorized
- `403` - Forbidden (not authorized to reply)
- `404` - Ticket not found

---

#### PATCH /tickets/:id/resolve

Update ticket status (Moderators/Admins only).

**Headers:**

```
Authorization: Bearer <moderator_token>
```

**Request Body:**

```json
{
  "status": "resolved"
}
```

**Response:**

```json
{
  "message": "Ticket status updated successfully",
  "ticket": {
    "_id": "ticket_id",
    "status": "resolved",
    "resolvedAt": "2024-01-01T04:00:00.000Z"
  }
}
```

**Status Codes:**

- `200` - Status updated successfully
- `401` - Unauthorized
- `403` - Forbidden (not a moderator/admin)
- `404` - Ticket not found

## Error Response Format

All error responses follow this format:

```json
{
  "error": "Error message",
  "message": "Detailed error description"
}
```

## Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

## Environment Variables

Frontend expects these environment variables:

- `VITE_SERVER_URL` - Backend API URL
- `VITE_API_URL` - Alternative API URL

## AI Features

The system includes AI-powered features:

1. **AI Analysis** (`helpfulNotes`): Automatically generated insights about the ticket
2. **AI Suggested Replies** (`replyCanbeGiven`): Pre-written response suggestions for moderators
3. **Skill Detection** (`relatedSkills`): Automatically detected skills related to the ticket

These AI features are populated when creating tickets and help moderators provide better support.

## Notes

- All dates are in ISO 8601 format
- User roles: `user` (default), `moderator`, `admin`
- Ticket statuses: `TODO`, `open`, `in-progress`, `resolved`, `closed`, `cancelled`
- The frontend uses React with Tailwind CSS and DaisyUI
- Authentication uses JWT tokens
- Storage uses safe localStorage with fallbacks

## Deployment & Infrastructure

### Frontend Deployment

- **Build Process**: Vite production build with ESBuild optimization
- **Asset Management**: Hashed filenames for cache busting
- **Bundle Optimization**: Manual chunks disabled for simplicity
- **Static Hosting**: Compatible with Netlify, Vercel, or any static host

### Backend Deployment (Inferred)

- **Platform**: Render.com
- **Database**: MongoDB (likely MongoDB Atlas)
- **Environment Variables**:
  - Database connection strings
  - JWT secrets
  - AI service API keys

### Performance Optimizations

- **Code Splitting**: Vite handles automatic splitting
- **Image Optimization**: SVG icons used throughout
- **CSS Optimization**: Tailwind CSS purging unused styles
- **Bundle Size**: Minimized with ESBuild
- **Caching**: Asset versioning for browser caching

### Browser Compatibility

- **Modern Browsers**: Chrome 88+, Firefox 85+, Safari 14+
- **ES Features**: ES2020+ syntax support required
- **Storage APIs**: localStorage with sessionStorage fallback
- **Network**: Fetch API for HTTP requests

## Development Setup

### Prerequisites

```bash
Node.js 16+
npm or yarn
Git
```

### Installation

```bash
# Clone repository
git clone <repository-url>
cd ai-ticket-frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables

Create `.env` file:

```env
VITE_SERVER_URL=http://localhost:4000/api
# or
VITE_API_URL=http://localhost:4000/api
```

### Development Features

- **Hot Module Replacement**: Instant updates during development
- **Error Overlay**: Development error display
- **Source Maps**: Disabled in production for security
- **Debug Mode**: Authentication debug component available
