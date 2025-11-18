# FlexAGE Project Overview

## Introduction

FlexAGE (Flexible Assessment Grading Engine) is a comprehensive web-based platform designed to modernize assessment creation, submission, and grading processes in educational environments. The system enables educators to create flexible assessments with customizable rubrics and provides AI-powered automated grading capabilities.

## System Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (Next.js)     │◄──►│   (FastAPI)     │◄──►│ (PostgreSQL)    │
│                 │    │                 │    │                 │
│ • React/TypeScript │  │ • Python        │    │ • User Data     │
│ • Tailwind CSS    │  │ • SQLAlchemy    │    │ • Assessments   │
│ • Shadcn/ui       │  │ • Pydantic      │    │ • Submissions   │
│ • Authentication  │  │ • JWT Auth      │    │ • Outcomes      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   AI/LLM        │
                    │   (Google AI)   │
                    │                 │
                    │ • Automated     │
                    │   Grading       │
                    │ • Feedback      │
                    │   Generation    │
                    └─────────────────┘
```

### Technology Stack

#### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui (Radix UI primitives)
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Rich Text Editor**: Pell Editor

#### Backend
- **Framework**: FastAPI
- **Language**: Python 3.8+
- **Database ORM**: SQLAlchemy
- **Data Validation**: Pydantic
- **Authentication**: JWT with OAuth2
- **Password Hashing**: BCrypt
- **Database Migrations**: Alembic
- **AI Integration**: Google Generative AI

#### Database
- **Primary Database**: PostgreSQL
- **Features Used**: JSONB, UUIDs, Foreign Keys, Constraints

#### Deployment
- **Backend**: Vercel (serverless)
- **Frontend**: Vercel
- **Database**: Cloud PostgreSQL

## Core Concepts

### FlexAGE Components
A **FlexAGE Component** represents a course, module, or assessment unit. It contains:
- General instructions for students
- Multiple assessment entries
- Enrolled students
- Creator/configurator information

### Entries
An **Entry** is an individual assessment task within a FlexAGE Component:
- Has specific instructions
- Contains a customizable rubric definition
- Tracks student submissions and outcomes
- Supports rich text content

### Submissions
**Submissions** are student responses to entries:
- Rich text content support
- Multiple submissions allowed per entry
- Timestamped creation
- Linked to specific students and entries

### Outcomes
**Outcomes** represent grading results:
- AI-generated feedback and scores
- Manual override capabilities
- Confidence metrics
- Structured data format

### Student Entry States
Tracks the progression of students through entries:
- `not_submitted`: Initial state
- `submitted_processing`: Submission received, grading in progress
- `outcome_available`: Grading complete, feedback available

## User Roles

### Student
- View enrolled FlexAGE Components
- Access entry instructions and requirements
- Submit responses to entries
- View feedback and grades
- Track submission history

### Configurator
- Create and manage FlexAGE Components
- Design entries with custom rubrics
- Enroll students in components
- Review submissions and outcomes
- Override AI-generated grades

### Admin
- Full system access
- User management capabilities
- System configuration
- All configurator permissions

## Key Features

### Flexible Rubric System
- Grid-based rubric definition
- Custom criteria and performance levels
- Cell-specific descriptions
- JSON-based storage for flexibility

### AI-Powered Grading
- Automated feedback generation
- Rubric-based scoring
- Confidence metrics
- Background processing

### Rich Content Support
- HTML-based rich text editing
- Support for formatted content
- Responsive display across devices

### Multi-Submission Support
- Students can submit multiple times
- Complete submission history
- Latest submission tracking
- Progress monitoring

### Role-Based Access Control
- JWT-based authentication
- Role-specific UI routing
- API endpoint protection
- Secure session management

## Data Flow

### Student Submission Flow
1. Student accesses enrolled FlexAGE Component
2. Selects an entry to complete
3. Reads instructions and rubric
4. Creates and submits response
5. System creates StudentEntryState record
6. Background task processes submission for grading
7. AI generates outcome with feedback
8. Student views feedback and score

### Configurator Assessment Flow
1. Configurator creates FlexAGE Component
2. Defines entries with rubrics
3. Enrolls students
4. Monitors submission progress
5. Reviews AI-generated outcomes
6. Makes manual adjustments if needed
7. Provides additional feedback

## Security Considerations

### Authentication
- JWT tokens with expiration
- Secure password hashing (BCrypt)
- Role-based access control
- Session management

### Authorization
- API endpoint protection by role
- UI route guards
- Resource ownership validation
- CORS configuration

### Data Protection
- Input validation and sanitization
- SQL injection prevention (SQLAlchemy ORM)
- XSS protection
- Secure headers

## Performance Features

### Backend Optimizations
- SQLAlchemy lazy loading strategies
- Database indexing on key fields
- Efficient query patterns
- Background task processing

### Frontend Optimizations
- Next.js App Router for performance
- Component lazy loading
- Efficient state management
- Optimized API calls

### Scalability Considerations
- Stateless API design
- Database connection pooling
- Serverless deployment compatibility
- Modular architecture

## Integration Points

### AI/LLM Integration
- Google Generative AI for automated grading
- Configurable AI models
- Fallback mechanisms
- Error handling and retries

### External Services
- Vercel for deployment
- PostgreSQL cloud databases
- Email services (future)
- File storage (future)

## Future Enhancements

### Planned Features
- File upload support for submissions
- Advanced analytics and reporting
- Email notifications
- Batch operations for configurators
- Advanced AI model configurations
- Multi-language support

### Architectural Improvements
- Microservices architecture
- Enhanced caching strategies
- Real-time notifications
- Advanced monitoring and logging
- API versioning
- Enhanced testing coverage

This overview provides the foundation for understanding FlexAGE's architecture and capabilities. For detailed implementation information, refer to the specific technical documentation files.
