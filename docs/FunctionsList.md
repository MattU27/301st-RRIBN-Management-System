# Armed Forces of the Philippines Personnel Management System
## List of Functions by User Role

This document provides a comprehensive list of all functions available in the Armed Forces of the Philippines Personnel Management System, organized by user role and platform (Web and Mobile).

## User Roles Overview

The system supports four main user roles with different permission levels:

1. **Reservist (CPT)** - Regular military personnel/reservists
2. **Staff (MAJ)** - Administrative staff members
3. **Admin (COL)** - System administrators
4. **Director (BGEN)** - Senior leadership

---

## Common Functions (All Users)

### Authentication & Security
| Function | Web | Mobile | Description |
|----------|-----|--------|-------------|
| Login | ✅ | ✅ | Access the system using email and password |
| Two-Factor Authentication | ✅ | ✅ | Additional security layer using OTP |
| Password Reset | ✅ | ✅ | Reset forgotten passwords |
| Session Management | ✅ | ✅ | Automatic timeout for inactive sessions |
| View Profile | ✅ | ✅ | View personal information and status |
| Edit Profile | ✅ | ✅ | Update personal information |

### Dashboard
| Function | Web | Mobile | Description |
|----------|-----|--------|-------------|
| Activity Summary | ✅ | ✅ | View personal activity and pending items |
| Document Status | ✅ | ✅ | Overview of document completion status |
| Training Status | ✅ | ✅ | Overview of training completion status |
| Notifications | ✅ | ✅ | System alerts and reminders |

---

## Reservist Functions (CPT)

### Document Management
| Function | Web | Mobile | Description |
|----------|-----|--------|-------------|
| View Required Documents | ✅ | ✅ | See list of required documentation |
| Upload Documents | ✅ | ✅ | Submit personal documents to the system |
| Track Document Status | ✅ | ✅ | Check verification status of uploaded documents |
| Download Documents | ✅ | ✅ | Retrieve personal documents from the system |

### Training Management
| Function | Web | Mobile | Description |
|----------|-----|--------|-------------|
| View Available Trainings | ✅ | ✅ | Browse upcoming training opportunities |
| Register for Training | ✅ | ✅ | Enroll in available training programs |
| Training Calendar | ✅ | ✅ | Calendar view of scheduled trainings |
| Training Completion | ✅ | ✅ | Track completed trainings and certifications |

### Resources
| Function | Web | Mobile | Description |
|----------|-----|--------|-------------|
| Access Resource Library | ✅ | ✅ | View training materials and resources |
| Download Resources | ✅ | ✅ | Save resources for offline access |

---

## Staff Functions (MAJ)

### Personnel Management
| Function | Web | Mobile | Description |
|----------|-----|--------|-------------|
| View Personnel List | ✅ | ✅ | See all personnel under jurisdiction |
| Search Personnel | ✅ | ✅ | Find specific personnel records |
| Filter Personnel | ✅ | ✅ | Filter personnel by various attributes |
| Personnel Details | ✅ | ✅ | View detailed personnel information |

### Document Processing
| Function | Web | Mobile | Description |
|----------|-----|--------|-------------|
| Review Submitted Documents | ✅ | ✅ | Examine documents uploaded by personnel |
| Approve/Reject Documents | ✅ | ✅ | Process document verification |
| Document Version History | ✅ | ✅ | Track changes to documents over time |
| Generate Document Reports | ✅ | ✓ (Limited) | Create reports on document status |

### Training Administration
| Function | Web | Mobile | Description |
|----------|-----|--------|-------------|
| Track Training Attendance | ✅ | ✅ | Monitor personnel attendance in trainings |
| Training Completion Verification | ✅ | ✅ | Verify training completion by personnel |
| Training Reports | ✅ | ✓ (Limited) | Generate reports on training statistics |

### Reporting
| Function | Web | Mobile | Description |
|----------|-----|--------|-------------|
| Generate Personnel Reports | ✅ | ✓ (Limited) | Create reports on personnel status |
| Readiness Reporting | ✅ | ✓ (Limited) | Generate unit readiness reports |
| Export Reports | ✅ | ✓ (Limited) | Export reports in various formats |

---

## Admin Functions (COL)

### System Administration
| Function | Web | Mobile | Description |
|----------|-----|--------|-------------|
| User Account Management | ✅ | ✓ (Limited) | Create, modify, or disable user accounts |
| Role Assignment | ✅ | ✓ (Limited) | Assign or change user roles |
| Permission Management | ✅ | ✓ (Limited) | Configure user permissions |
| System Configuration | ✅ | ❌ | Modify system settings |

### Audit & Compliance
| Function | Web | Mobile | Description |
|----------|-----|--------|-------------|
| View Audit Logs | ✅ | ✓ (Limited) | Review system activity logs |
| User Activity Tracking | ✅ | ✓ (Limited) | Monitor user actions within the system |
| Generate Audit Reports | ✅ | ❌ | Create detailed audit trail reports |

### Content Management
| Function | Web | Mobile | Description |
|----------|-----|--------|-------------|
| Manage Document Templates | ✅ | ❌ | Create/edit document templates |
| Update Resource Library | ✅ | ❌ | Add/remove resources from the library |
| Training Program Management | ✅ | ✓ (Limited) | Create and configure training programs |

---

## Director Functions (BGEN)

### Strategic Oversight
| Function | Web | Mobile | Description |
|----------|-----|--------|-------------|
| Executive Dashboard | ✅ | ✅ | High-level overview of system status |
| Readiness Analytics | ✅ | ✓ (Limited) | Comprehensive readiness metrics and trends |
| Strategic Reports | ✅ | ✓ (Limited) | Reports for strategic decision-making |

### Performance Monitoring
| Function | Web | Mobile | Description |
|----------|-----|--------|-------------|
| Unit Performance Metrics | ✅ | ✅ | Comparative analysis of unit performance |
| Training Effectiveness | ✅ | ✓ (Limited) | Analysis of training program effectiveness |
| Document Compliance | ✅ | ✓ (Limited) | Overview of document compliance across units |

### Resource Allocation
| Function | Web | Mobile | Description |
|----------|-----|--------|-------------|
| Resource Allocation Dashboard | ✅ | ✓ (Limited) | Overview of resource distribution |
| Approval Workflows | ✅ | ✅ | Approve high-level requests and changes |

---

## Technical Notes

### Web Application
- Built with Next.js framework
- Responsive design for desktop and tablet use
- Full functionality available on web platform

### Mobile Application
- Progressive Web App (PWA) with responsive design
- Native-like experience on mobile devices
- Some advanced administrative functions limited on mobile
- Optimized for on-the-go access to essential functions

### Security Considerations
- Role-based access control implemented across all functions
- Two-factor authentication available for all users
- Session timeout protection for security
- Audit logging of all significant actions 