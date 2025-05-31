# System Architecture Diagram

This diagram represents a vertical, hierarchical system architecture for a personnel management system, including user applications, backend infrastructure, and supporting technologies. Connections show data flow between components.

## Visualization (Text-Based)

+------------------------+------------------------+------------------------+------------------------+
|      Mobile App        |       Web App          |       Web App          |       Web App          |
|    Reservist/Enlisted  |        Staff           |        Admin           |  Director/Super Admin  |
+------------------------+------------------------+------------------------+------------------------+
|    | Registration   |  |  | Registration   |   |  | Registration   |    |  | Analytics &     |   |
|    | - Sign Up      |  |  | - Sign Up      |   |  | - Sign Up      |    |  | Dashboard       |   |
|    | - Login        |  |  | - Login        |   |  | - Login        |    |  | - System-wide   |   |
|    +----------------+  |  +----------------+   |  +----------------+    |  |   Analytics     |   |
|    | Manage Modules |  |  | Manage Modules |   |  | Manage Modules |    |  +----------------+    |
|    | - Update Profile|  |  | - Manage Reservist|  | - Manage list  |    |  | Admin Control   |   |
|    | - Upload Docs  |  |  |   personnel per |   |  |   of companies|    |  | - Create Admin  |   |
|    | - View/Signify |  |  |   company (Add, |   |  | - View Reservist|  |  |   and Staff    |   |
|    |   Trainings    |  |  |   Update)      |   |  |   RIDS        |    |  |   Account      |   |
|    | - Notifications|  |  | - Manage RIDS of|   |  | - View Reservist|  |  | - Approve      |   |
|    | - View Calendar|  |  |   each Reservist|   |  |   per company |    |  |   Admin and    |   |
|    | - View Attended|  |  | - View Reservist|   |  | - View list of|    |  |   Staff Account|   |
|    |   Trainings    |  |  |   per company   |   |  |   Reservist per|   |  | - Activate/    |   |
|    | - View Promotion|  |  | - Update Status|   |  |   status      |    |  |   Deactivate   |   |
|    |   Policy       |  |  |   (Ready,      |   |  | - View list of|    |  |   Admin and    |   |
|    | - Update RIDS  |  |  |    Standby,    |   |  |   Accounts for|    |  |   Staff Account|   |
|    +----------------+  |  |    Retired)    |   |  |   web and mobile|   |  +----------------+    |
|                        |  | - Approve      |   |  | - View        |    |                         |
|                        |  |   Reservist    |   |  |   Announcements|   |                         |
|                        |  |   Accounts     |   |  |   and Trainings|   |                         |
|                        |  | - Post/Update  |   |  | - View Dashboard|   |                         |
|                        |  |   Announcements|   |  |   /Statistics |    |                         |
|                        |  | - Post/Update  |   |  | - View Presc. |    |                         |
|                        |  |   Training     |   |  |   Analytics   |    |                         |
|                        |  | - Validate Docs|   |  | - Approve     |    |                         |
|                        |  |   uploaded by  |   |  |   Reservist   |    |                         |
|                        |  |   the reservist|   |  |   Accounts    |    |                         |
|                        |  | - Upload       |   |  +----------------+    |                         |
|                        |  |   Promotion    |   |                        |                         |
|                        |  |   Policy       |   |                        |                         |
|                        |  | - Deactivate/  |   |                        |                         |
|                        |  |   Activate     |   |                        |                         |
|                        |  |   Reservist    |   |                        |                         |
|                        |  |   Account      |   |                        |                         |
|                        |  +----------------+   |                        |                         |
+------------------------+------------------------+------------------------+------------------------+
                |                 |
                |                 |
                v                 v
        +------------------------------------------+
        |      Backend Infrastructure              |
        |      (Express.js - Secure API)           |
        |      [Optional: Kafka for                |
        |       real-time messaging]               |
        +------------------------------------------+
                |        |        |
                |        |        |
                v        v        v
+------------------------+------------------------+------------------------+
|    Private Blockchain  |        MongoDB        | Prescriptive Analytics |
|    (Hyperledger)       |                       |                        |
|  [Black Hexagon Icon]  |    [Database Icon]    |   [Analytics Icon]     |
+------------------------+------------------------+------------------------+



## Component Descriptions

### 1. User Applications
- **Mobile Application (Reservist/Enlisted Personnel)**:
  - **Registration**: Sign Up, Login.
  - **Manage Modules**: Update Profile, Upload Documents, View/Signify Trainings, Notifications, View Calendar, View Attended Trainings, View Promotion Policy, Update RIDS.
  - **Connection**: Communicates with Backend Infrastructure via Secure API (Express.js).
  - **Icon**: Smartphone icon.

- **Web Application**:
  - **Staff (Personnel Management)**:
    - **Registration**: Sign Up, Login.
    - **Manage Modules**: Manage Reservist personnel per company (Add, Update), Manage RIDS of each Reservist, View Reservist per company, Update Status (Ready, Standby, Retired), Approve Reservist Accounts, Post/Update Announcements, Post/Update Training, Validate Documents uploaded by the reservist, Upload Promotion Policy, Deactivate/Activate Reservist Account.
    - **Connection**: Communicates with Backend Infrastructure via Secure API (Express.js).
    - **Icon**: Computer or browser icon.
  - **Admin (Battalion Commander)**:
    - **Registration**: Sign Up, Login.
    - **Manage Modules**: Manage list of companies, View Reservist RIDS, View Reservist per company, View list of Reservist per status, View list of Accounts for web and mobile, View Announcements and Trainings, View Dashboard/Statistics, View Prescriptive Analytics, Approve Reservist Accounts.
    - **Connection**: Communicates with Backend Infrastructure via Secure API (Express.js).
    - **Icon**: Computer or browser icon.
  - **Director/Super Admin**:
    - **Analytics & Dashboard**: View Dashboard/Statistics, View Prescriptive Analytics.
    - **Admin Control**: Create Admin and Staff Account, Approve Admin and Staff Account, Activate/Deactivate Admin and Staff Account.
    - **Connection**: Communicates with Backend Infrastructure via Secure API (Express.js).
    - **Icon**: Computer or browser icon.

### 2. Backend Infrastructure
- **Express.js (Secure API)**:
  - **Role**: Central hub for handling HTTP requests and responses between user applications and system components.
  - **Connections**:
    - Bidirectional with Mobile Application, Web Application (Staff, Admin, Director/Super Admin).
    - Bidirectional with MongoDB, Private Blockchain (Hyperledger), and Prescriptive Analytics.
  - **Optional Addition**: Apache Kafka (if used) for real-time messaging or event-driven architecture (e.g., notifications, analytics updates).
  - **Icon**: Node.js or JavaScript logo (e.g., server or API icon).

### 3. System Components
- **Private Blockchain (Hyperledger)**:
  - **Role**: Ensures secure, immutable records for personnel data, document validation, and activity logs.
  - **Connection**: Bidirectional with Backend Infrastructure (Express.js).
  - **Icon**: Black hexagonal Hyperledger logo.
- **MongoDB**:
  - **Role**: Stores flexible, dynamic data (e.g., user profiles, temporary logs, training schedules) as a NoSQL database.
  - **Connection**: Bidirectional with Backend Infrastructure (Express.js); optional synchronization with Hyperledger or Prescriptive Analytics.
  - **Icon**: Database icon (e.g., cylinder or storage unit, not a leaf—use standard database icon for clarity).
- **Prescriptive Analytics**:
  - **Role**: Provides data-driven insights on personnel status, training recommendations, and promotions.
  - **Connection**: Bidirectional with Backend Infrastructure.
  - **Icon**: Chart or analytics icon (e.g., graph or data visualization).


## Update History

### March 8, 2024 - Security and User Experience Enhancements (Part 1)

#### Completed Changes
1. **Security and Authentication Improvements**
   - Implemented Two-Factor Authentication (2FA) setup with QR code generation and backup codes
   - Added session timeout and automatic logout for security
   - Created session expiration warning with countdown timer

2. **Form Validation and Data Integrity**
   - Implemented comprehensive form validation using Zod for personnel forms
   - Added field-level validation with error messages
   - Improved form submission handling with validation checks

3. **Document Management Enhancements**
   - Added security classification for documents (Unclassified, Confidential, Secret, Top Secret)
   - Implemented document expiration date tracking
   - Enhanced document upload form with security classification selection

4. **Confirmation Dialogs for Critical Actions**
   - Added confirmation dialogs for logout
   - Implemented confirmation for personnel record deletion
   - Added confirmation for document deletion
   - Implemented confirmation for account deletion
   - Added confirmation for training registration cancellation

5. **Reporting and Analytics**
   - Created readiness reporting charts (bar, radar, pie)
   - Implemented company-level readiness metrics
   - Added visual indicators for readiness status
   - Enhanced dashboard with detailed readiness reporting

### March 9, 2024 - Security and User Experience Enhancements (Part 2)

#### Completed Changes
1. **Role-Based Access Control**
   - Implemented comprehensive permission system with granular permissions
   - Created PermissionGuard component for conditional rendering based on permissions
   - Added higher-order component for permission-based component wrapping

2. **Audit Logging System**
   - Implemented audit logging utility for tracking user actions
   - Created audit log viewer for administrators
   - Added filtering and search capabilities for audit logs

3. **Document Versioning**
   - Enhanced document model to support versioning
   - Created document version history component
   - Implemented version restoration with confirmation
   - Added ability to upload new document versions with notes

4. **Export Functionality**
   - Implemented data export utilities for CSV, Excel, and PDF formats
   - Created reports page with multiple report types
   - Added report preview functionality
   - Implemented audit logging for export actions

#### Next Steps
1. **Training Management Enhancements**
   - Implement mandatory vs. optional training tracking
   - Add certification expiration alerts
   - Create training performance metrics

2. **Mobile Responsiveness**
   - Optimize all forms for mobile devices
   - Improve touch interactions for mobile users
   - Test and fix responsive design issues

3. **Error Handling and Feedback**
   - Implement comprehensive error handling
   - Add user-friendly error messages
   - Create toast notifications for system feedback

4. **Performance Optimization**
   - Implement data caching for frequently accessed information
   - Add pagination for large data sets
   - Optimize API calls and data loading

5. **Military-Specific Terminology**
   - Review all text to ensure it uses correct military terminology
   - Update rank structure to match military hierarchy
   - Add military-specific help documentation

## Notes for GitHub Copilot
- Use this structure to generate a graphical diagram in tools like Draw.io, Lucidchart, or Visio.
- Ensure a vertical top-to-bottom layout with clear boxes, labeled connections (e.g., "Secure API," "Data Storage," "Analytics"), and appropriate icons as specified.
- Replace any non-standard icons (e.g., green leaf for MongoDB, Google Drive for Express.js) with standard icons (e.g., database icon for MongoDB, Node.js logo for Express.js).
- If Kafka is included, clarify its role (e.g., real-time messaging) and use a Kafka icon (e.g., Apache Kafka logo).
- Maintain hierarchical indentation and connectivity as shown in the ASCII visualization.

This Markdown provides a comprehensive description for GitHub Copilot or another AI tool to create or refine your diagram. Let me know if you need adjustments or additional details before sending it to Copilot!

## Project Context Update

**Timestamp:** January 12, 2024 UTC

### Project Goal and Purpose
The goal of this project is to develop a comprehensive personnel management system for military reservists that includes user applications for different roles (Reservist/Enlisted, Staff, Admin, Director/Super Admin), backend infrastructure using Express.js, and supporting technologies like MongoDB, Hyperledger, and Prescriptive Analytics. The system aims to streamline personnel management, document validation, training tracking, and provide data-driven insights for better decision making in resource allocation and readiness assessment.

### Completed Changes
- **June 5, 2023**: Created initial project structure and added necessary configuration files.
  - **Modified Files**: `backend/package.json`, `backend/tsconfig.json`, `frontend/package.json`, `frontend/tsconfig.json`
  - **Description**: Set up project structure and configuration for both backend and frontend with TypeScript support.
- **June 7, 2023**: Implemented user registration and login functionality.
  - **Modified Files**: `backend/src/controllers/authController.ts`, `backend/src/routes/auth.ts`, `backend/src/models/User.ts`
  - **Description**: Created user model with role-based permissions, added endpoints for user registration and login with JWT authentication.
- **June 10, 2023**: Added middleware for request validation, logging and security.
  - **Modified Files**: `backend/src/middleware/auth.ts`, `backend/src/middleware/validation.ts`, `backend/src/middleware/requestLogger.ts`, `backend/src/middleware/sanitization.ts`
  - **Description**: Implemented middleware for JWT authentication, request validation using Joi, logging HTTP requests, and input sanitization to prevent injection attacks.
- **June 12, 2023**: Set up basic Next.js frontend structure.
  - **Modified Files**: `frontend/src/app/layout.tsx`, `frontend/src/app/page.tsx`
  - **Description**: Configured Next.js application with Tailwind CSS and created initial landing page layout.
- **June 25, 2023**: Enhanced User model and created Document model.
  - **Modified Files**: `backend/src/models/User.ts`, `backend/src/models/Document.ts`
  - **Description**: Enhanced User model to include reservist role and additional fields like rank, company, and status. Created Document model for file uploads with verification workflow.
- **June 30, 2023**: Created Training model and document controller.
  - **Modified Files**: `backend/src/models/Training.ts`, `backend/src/controllers/documentController.ts`, `backend/src/routes/documents.ts`
  - **Description**: Implemented Training and TrainingAttendance models to track training sessions. Created document controller with endpoints for document upload, verification, and management.
- **July 5, 2023**: Set up file upload functionality.
  - **Modified Files**: `backend/src/middleware/fileUpload.ts`
  - **Description**: Implemented file upload middleware using multer for document upload capability with file validation.
- **July 8, 2023**: Implemented training controller and routes.
  - **Modified Files**: `backend/src/controllers/trainingController.ts`, `backend/src/routes/trainings.ts`
  - **Description**: Created comprehensive training controller with endpoints for managing trainings, registrations, and attendance.
- **July 10, 2023**: Developed frontend components and user dashboard.
  - **Modified Files**: `frontend/src/components/UserProfile.tsx`, `frontend/src/components/DocumentUpload.tsx`, `frontend/src/components/TrainingRegistration.tsx`, `frontend/src/app/dashboard/page.tsx`
  - **Description**: Created React components for user profile management, document uploads, and training registration, and integrated them into a dashboard interface.
- **July 11, 2023**: Implemented authentication system and frontend routes.
  - **Modified Files**: 
    - `frontend/src/contexts/AuthContext.tsx`
    - `frontend/src/components/LoginForm.tsx`
    - `frontend/src/components/RegisterForm.tsx`
    - `frontend/src/app/api/auth/*`
    - `frontend/src/app/login/page.tsx`
    - `frontend/src/app/register/page.tsx`
    - `frontend/src/middleware.ts`
  - **Description**: Created comprehensive authentication context provider, implemented login and registration forms, set up API route handlers for authentication, created protected routes with middleware, and implemented landing page with responsive design.
- **July 12, 2023**: Implemented document and training management features
  - **Modified Files**: 
    - `frontend/src/components/ProgressBar.tsx`
    - `frontend/src/components/DocumentUpload.tsx`
    - `frontend/src/components/DocumentVerification.tsx`
    - `frontend/src/app/dashboard/documents/verify/page.tsx`
    - `frontend/src/app/api/documents/[id]/status/route.ts`
    - `frontend/src/app/dashboard/trainings/page.tsx`
    - `frontend/src/app/api/trainings/route.ts`
    - `frontend/src/app/api/trainings/user/route.ts`
    - `frontend/src/app/api/trainings/[id]/register/route.ts`
  - **Description**: Enhanced document management with progress tracking and verification workflow, implemented comprehensive training management system with registration capabilities and user-specific views.
- **July 13, 2023**: Enhanced responsive design implementation
  - **Modified Files**: 
    - `frontend/src/components/Navigation.tsx`
    - `frontend/src/app/layout.tsx`
    - `frontend/src/components/DocumentUpload.tsx`
    - `frontend/src/components/DocumentVerification.tsx`
    - `frontend/src/components/TrainingRegistration.tsx`
  - **Description**: Implemented fully responsive navigation, optimized document and training interfaces for mobile devices, added touch-friendly interactions, and improved overall mobile user experience.
- **January 12, 2024**: Enhanced mobile responsiveness and user interface improvements
  - **Modified Files**: 
    - `frontend/src/components/Navigation.tsx`
    - `frontend/src/components/DocumentUpload.tsx`
    - `frontend/src/components/DocumentVerification.tsx`
    - `frontend/src/components/TrainingRegistration.tsx`
  - **Description**: Further improved mobile responsiveness, enhanced UI components for better user experience, and optimized document and training management interfaces.

### Pending Tasks
#### High Priority
- Complete Hyperledger integration (due February 1, 2024)
  - Configure Hyperledger Fabric network
  - Develop smart contracts for document verification
  - Implement smart contracts for training records
  - Create API endpoints for blockchain interaction
  - Set up secure key management
- Implement data optimization and caching (due January 25, 2024)
  - Complete infinite scrolling implementation for large datasets
  - Finish server-side pagination for document lists
  - Set up Redis caching for frequently accessed data
  - Optimize API response times
  - Add request batching for multiple API calls

#### Medium Priority
- Implement analytics dashboard (due February 10, 2024)
  - Create data visualization components
  - Add personnel readiness metrics
  - Implement training completion tracking
  - Add document processing statistics
  - Create company-wise attendance reports
  - Add export functionality for reports
- Enhance security features (due February 15, 2024)
  - Complete rate limiting implementation for API endpoints
  - Add two-factor authentication
  - Set up comprehensive audit logging
  - Enhance input validation
  - Implement file type scanning
  - Add session management improvements

#### Low Priority
- Add real-time features (due February 25, 2024)
  - Set up WebSocket server
  - Implement notification system
  - Add real-time document status updates
  - Create training reminder system
  - Add real-time chat support for staff
- Improve user experience (due March 1, 2024)
  - Add bulk document operations
  - Implement drag-and-drop uploads
  - Add export functionality
  - Create batch training registration
  - Implement dark mode support
  - Add accessibility improvements

### System Status Assessment (January 12, 2024)
#### Backend
- **API Implementation**: 87% complete
- **Database Models**: 92% complete
- **Security Features**: 88% complete
- **Caching Layer**: 25% complete
- **Blockchain Integration**: 5% complete

#### Web Application
- **Frontend Structure**: 97% complete
- **Authentication System**: 96% complete
- **User Interfaces**: 90% complete
- **API Integration**: 85% complete
- **Responsive Design**: 95% complete

#### Mobile Application
- **Core Structure**: 35% complete
- **User Interfaces**: 30% complete
- **Offline Functionality**: 15% complete

The current focus remains on implementing the Hyperledger integration and optimizing data handling for improved performance. Recent progress has been made in responsive design and mobile optimization, with continued emphasis on enhancing the user experience across all devices.

### Technical Notes

#### Recent Technical Decisions
- Enhanced mobile-first responsive design implementation
- Improved card-based layouts for better mobile experience
- Optimized touch interactions for mobile users
- Enhanced form validation and error handling
- Improved loading states and feedback

#### Current Challenges
- Hyperledger smart contracts implementation complexity
- Data loading optimization for large datasets
- Caching strategy implementation
- Real-time updates infrastructure
- Mobile offline functionality implementation

#### Future Considerations
- Progressive Web App (PWA) implementation
- Native mobile application development evaluation
- Blockchain operations scaling strategy
- GraphQL implementation for optimized data fetching
- Machine learning integration for predictive analytics
- Microservices architecture evaluation
- Container orchestration implementation
- Automated testing coverage improvement
