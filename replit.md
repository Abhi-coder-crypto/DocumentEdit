# BG Remover Portal

## Overview

BG Remover Portal is a professional background removal service application that connects clients with editors. The platform allows users to upload images for background removal and receive edited results within a specified timeframe. The application features a dual-portal system with separate interfaces for users (to submit images and download results) and administrators (to manage requests and upload edited images).

**Key Features:**
- OTP-based passwordless authentication
- Image upload and management system
- Dual-portal architecture (user and admin)
- Status tracking for image processing requests
- File storage and delivery system

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **Framework**: React with TypeScript
- **Build Tool**: Vite for development and production builds
- **UI Components**: Radix UI primitives with custom shadcn/ui components
- **Styling**: Tailwind CSS v4 with custom theming
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state
- **Forms**: React Hook Form with Zod validation
- **Animations**: Framer Motion for UI transitions

**Design Patterns:**
- Component-based architecture with shadcn/ui design system
- Protected routes with role-based access control (user vs admin)
- Context-based authentication state management
- Custom hooks for reusable logic (mobile detection, toast notifications)

**Route Structure:**
- `/auth` - Authentication page with OTP verification
- `/` - User dashboard (protected)
- `/admin` - Admin dashboard (protected, admin-only)

### Backend Architecture

**Technology Stack:**
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST API
- **Database**: MongoDB for data persistence
- **File Upload**: Multer for multipart form data handling
- **Session Management**: In-memory session storage
- **Build**: ESBuild for server bundling

**API Design:**
- RESTful endpoints for authentication, image uploads, and request management
- File uploads stored in local `uploads/` directory (separate folders for original and edited images)
- OTP-based authentication flow (request OTP → verify OTP → session creation)

**Data Models:**
- **User**: Stores user information (name, email, role)
- **OTPSession**: Temporary storage for OTP verification codes with expiration
- **ImageRequest**: Tracks image upload requests with status (pending/completed)

**Security Considerations:**
- OTP expiration for time-limited authentication
- Role-based authorization (user vs admin)
- File type validation for uploads (JPEG, PNG, WEBP only)
- File size limits (10MB maximum)

### External Dependencies

**Database:**
- **MongoDB**: NoSQL database for storing users, OTP sessions, and image requests
  - Connection managed via `mongodb` driver
  - Connection string via `MONGODB_URI` environment variable
  - Uses cached connection pattern for serverless optimization

**File Storage:**
- **Local File System**: Images stored in `uploads/` directory
  - `uploads/original/` - User-uploaded images
  - `uploads/edited/` - Admin-uploaded edited images
  - Files named with timestamp and nanoid for uniqueness

**Email Service:**
- **Resend**: Integrated for sending transactional emails
  - OTP emails sent to clients and admins during login
  - Notification emails sent to clients when admin uploads edited images
  - Configuration in `server/email.ts`
  - API key stored as `RESEND_API_KEY` secret
- OTP format: 6-digit code with 10-minute expiration
- Free tier: 100 emails/day

**Third-Party Libraries:**
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling framework
- **Drizzle Kit**: Database migration toolkit (configured but using raw MongoDB driver)
- **bcryptjs**: Password hashing utilities (included but not actively used due to OTP auth)
- **nanoid**: Unique ID generation for files

**Development Tools:**
- **Replit Plugins**: Development banner, cartographer, runtime error overlay
- **Vite Plugins**: Custom meta images plugin for OpenGraph tags

**Build Process:**
- Client: Vite builds React app to `dist/public`
- Server: ESBuild bundles server code to `dist/index.cjs`
- Production: Serves static files from `dist/public` with Express

**Configuration Notes:**
- Drizzle config present but application uses MongoDB driver directly (not PostgreSQL)
- Environment expects `DATABASE_URL` (PostgreSQL) but application uses `MONGODB_URI`
- Future migration to PostgreSQL with Drizzle ORM is architecturally supported

**Required Secrets (configured via Replit Secrets):**
- `MONGODB_URI` - MongoDB connection string
- `RESEND_API_KEY` - Resend API key for sending OTP emails

**Admin Configuration:**
- Current admin email: `abhijeet18012001@gmail.com` (hardcoded in server/routes.ts line 124)
- To change admin email, update the email check in server/routes.ts