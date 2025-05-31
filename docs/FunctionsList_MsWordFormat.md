# Armed Forces of the Philippines
# Personnel Management System
## Function Specification Document

---

**Date:** May 2024  
**Version:** 1.0  
**Project:** AFP Personnel Management System  
**Document Type:** Function Specification  

---

## Table of Contents

1. [Introduction](#introduction)
2. [User Roles Overview](#user-roles-overview)
3. [Common Functions](#common-functions)
4. [Reservist Functions (Mobile Only)](#reservist-functions)
5. [Staff Functions (Web)](#staff-functions)
6. [Admin Functions (Web)](#admin-functions)
7. [Director Functions (Web)](#director-functions)
8. [Technical Implementation Notes](#technical-implementation-notes)

---

## Introduction

This document outlines the comprehensive list of all functions available in the Armed Forces of the Philippines Personnel Management System. The functions are organized by user role and platform availability (Web and Mobile).

---

## User Roles Overview

The system supports four main user roles with different permission levels and platform access:

1. **Reservist (CPT)** - Regular military personnel/reservists (Mobile App Only)
2. **Staff (MAJ)** - Administrative staff members (Web Application)
3. **Admin (COL)** - System administrators (Web Application)
4. **Director (BGEN)** - Senior leadership (Web Application)

---

## Common Functions

### Authentication & Security
| Function | Web (Staff/Admin/Director) | Mobile (Reservist) | Description |
|----------|-----|--------|-------------|
| Login | ✓ | ✓ | Access the system using email and password |
| Two-Factor Authentication | ✓ | ✓ | Additional security layer using OTP |
| Password Reset | ✓ | ✓ | Reset forgotten passwords |
| Session Management | ✓ | ✓ | Automatic timeout for inactive sessions |
| View Profile | ✓ | ✓ | View personal information and status |
| Edit Profile | ✓ | ✓ | Update personal information |

### Dashboard
| Function | Web (Staff/Admin/Director) | Mobile (Reservist) | Description |
|----------|-----|--------|-------------|
| Activity Summary | ✓ | ✓ | View personal activity and pending items |
| Document Status | ✓ | ✓ | Overview of document completion status |
| Training Status | ✓ | ✓ | Overview of training completion status |
| Notifications | ✓ | ✓ | System alerts and reminders |

---

## Reservist Functions (Mobile Only)

### Document Management
| Function | Mobile (Reservist) | Description |
|----------|--------|-------------|
| View Required Documents | ✓ | See list of required documentation |
| Upload Documents | ✓ | Submit personal documents to the system |
| Track Document Status | ✓ | Check verification status of uploaded documents |
| Download Documents | ✓ | Retrieve personal documents from the system |

### Training Management
| Function | Mobile (Reservist) | Description |
|----------|--------|-------------|
| View Available Trainings | ✓ | Browse upcoming training opportunities |
| Register for Training | ✓ | Enroll in available training programs |
| Training Calendar | ✓ | Calendar view of scheduled trainings |
| Training Completion | ✓ | Track completed trainings and certifications |

### Resources
| Function | Mobile (Reservist) | Description |
|----------|--------|-------------|
| Access Resource Library | ✓ | View training materials and resources |
| Download Resources | ✓ | Save resources for offline access |

---

## Staff Functions (Web)

### Personnel Management
| Function | Web (Staff) | Description |
|----------|-----|-------------|
| View Personnel List | ✓ | See all personnel under jurisdiction |
| Search Personnel | ✓ | Find specific personnel records |
| Filter Personnel | ✓ | Filter personnel by various attributes |
| Personnel Details | ✓ | View detailed personnel information |

### Document Processing
| Function | Web (Staff) | Description |
|----------|-----|-------------|
| Review Submitted Documents | ✓ | Examine documents uploaded by personnel |
| Approve/Reject Documents | ✓ | Process document verification |
| Document Version History | ✓ | Track changes to documents over time |
| Generate Document Reports | ✓ | Create reports on document status |

### Training Administration
| Function | Web (Staff) | Description |
|----------|-----|-------------|
| Track Training Attendance | ✓ | Monitor personnel attendance in trainings |
| Training Completion Verification | ✓ | Verify training completion by personnel |
| Training Reports | ✓ | Generate reports on training statistics |

### Reporting
| Function | Web (Staff) | Description |
|----------|-----|-------------|
| Generate Personnel Reports | ✓ | Create reports on personnel status |
| Readiness Reporting | ✓ | Generate unit readiness reports |
| Export Reports | ✓ | Export reports in various formats |

---

## Admin Functions (Web)

### System Administration
| Function | Web (Admin) | Description |
|----------|-----|-------------|
| User Account Management | ✓ | Create, modify, or disable user accounts |
| Role Assignment | ✓ | Assign or change user roles |
| Permission Management | ✓ | Configure user permissions |
| System Configuration | ✓ | Modify system settings |

### Audit & Compliance
| Function | Web (Admin) | Description |
|----------|-----|-------------|
| View Audit Logs | ✓ | Review system activity logs |
| User Activity Tracking | ✓ | Monitor user actions within the system |
| Generate Audit Reports | ✓ | Create detailed audit trail reports |

### Content Management
| Function | Web (Admin) | Description |
|----------|-----|-------------|
| Manage Document Templates | ✓ | Create/edit document templates |
| Update Resource Library | ✓ | Add/remove resources from the library |
| Training Program Management | ✓ | Create and configure training programs |

---

## Director Functions (Web)

### Strategic Oversight
| Function | Web (Director) | Description |
|----------|-----|-------------|
| Executive Dashboard | ✓ | High-level overview of system status |
| Readiness Analytics | ✓ | Comprehensive readiness metrics and trends |
| Strategic Reports | ✓ | Reports for strategic decision-making |

### Performance Monitoring
| Function | Web (Director) | Description |
|----------|-----|-------------|
| Unit Performance Metrics | ✓ | Comparative analysis of unit performance |
| Training Effectiveness | ✓ | Analysis of training program effectiveness |
| Document Compliance | ✓ | Overview of document compliance across units |

### Resource Allocation
| Function | Web (Director) | Description |
|----------|-----|-------------|
| Resource Allocation Dashboard | ✓ | Overview of resource distribution |
| Approval Workflows | ✓ | Approve high-level requests and changes |

---

## Technical Implementation Notes

### Web Application (Staff, Admin, Director)
- Built with Next.js framework
- Desktop-oriented design optimized for administrative tasks
- Full functionality for administration and oversight
- Used exclusively by Staff (MAJ), Admin (COL), and Director (BGEN) roles

### Mobile Application (Reservist)
- Progressive Web App (PWA) with responsive design
- Native-like experience optimized for mobile devices
- Streamlined interface for essential reservist functions
- Used exclusively by Reservist (CPT) role for field operations

### Security Considerations
- Role-based access control implemented across all functions
- Two-factor authentication available for all users
- Session timeout protection for security
- Audit logging of all significant actions
- Secure communication between mobile app and backend systems

---

**Prepared by:** [Your Name]  
**Department:** [Your Department]  
**Contact:** [Your Email/Contact Information] 