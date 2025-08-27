# Overview

This is a Korean cryptocurrency exchange listing monitor application that tracks new coin listings on major Korean exchanges (Upbit and Bithumb). The system provides real-time monitoring, notifications, and a dashboard interface for viewing recent listings and system status.

The application is built as a full-stack TypeScript project with a React frontend and Express backend, designed to help users stay informed about new cryptocurrency opportunities on Korean exchanges.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React 18** with TypeScript for the user interface
- **Vite** as the build tool and development server
- **TailwindCSS** with **shadcn/ui** components for styling and UI components
- **Wouter** for client-side routing (lightweight React router alternative)
- **TanStack Query** for server state management and API data fetching
- **React Hook Form** with **Zod** validation for form handling

## Backend Architecture
- **Express.js** server with TypeScript
- **RESTful API** design with routes for listings, settings, and system status
- **In-memory storage** implementation with interface for future database migration
- **Cron job scheduling** for periodic exchange monitoring
- **Service-oriented architecture** with separate services for exchange monitoring and notifications

## Data Storage Solutions
- **Drizzle ORM** configured for PostgreSQL with schema definitions
- **In-memory storage** currently implemented as fallback/development option
- **Database schemas** defined for listings, notification settings, and system status
- **Neon Database** integration ready (@neondatabase/serverless)

## Authentication and Authorization
- No authentication system currently implemented
- Single-user application design
- Session management placeholder exists but not utilized

## External Service Integrations

### Exchange APIs
- **Upbit API** integration for monitoring Korean exchange listings
- **Bithumb API** integration as secondary exchange source
- Rate limiting awareness and error handling for API calls
- Real-time price tracking and market data collection

### Notification Services
- **Email notifications** with placeholder for SendGrid integration
- **Telegram Bot** notification support
- **Discord Webhook** notification capability
- Configurable notification preferences and filtering options

### Development Tools
- **Replit** platform optimizations and development environment support
- **Hot Module Replacement** for development workflow
- **Error overlay** and debugging tools integration

## Key Design Patterns
- **Repository pattern** for data access abstraction
- **Service layer** separation for business logic
- **Dependency injection** for service management
- **Event-driven** monitoring with scheduled tasks
- **Responsive design** with mobile-first approach using Tailwind breakpoints

## API Structure
- `/api/listings` - CRUD operations for cryptocurrency listings
- `/api/settings` - Notification and monitoring configuration
- `/api/status` - System health and exchange API status monitoring
- **JSON responses** with consistent error handling middleware
- **Query parameter** support for filtering and pagination

## Monitoring and Reliability
- **Health check** endpoints for exchange API status
- **Response time** tracking for external API calls
- **Rate limit** monitoring and usage tracking
- **Error logging** and notification system status tracking
- **Graceful degradation** when external services are unavailable