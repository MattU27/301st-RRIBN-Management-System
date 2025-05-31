import { NextResponse } from 'next/server';
import { UserRole } from '@/models/Personnel';
import { verifyJWT } from '@/utils/auth';

export interface DecodedToken {
  userId: string;
  role: UserRole | string;
  company?: string;
}

// Staff permissions map based on the diagram
export const STAFF_PERMISSIONS = {
  canManageOwnCompany: true,        // Can only manage their assigned company
  canAddUpdateRecords: true,        // Limited to their company
  canViewCompanyPersonnel: true,    // Limited to their company
  canUpdateStatus: true,            // Ready, Standby, Retired only
  canApproveCompanyAccounts: true,  // Limited to their company
  canManageAnnouncements: true,     // Post/Update announcements
  canManageTrainings: true,         // Input/Update trainings
  canValidateDocs: true,            // Validate docs
  canUploadPolicy: true,            // Upload policy
};

// Admin permissions map based on the diagram
export const ADMIN_PERMISSIONS = {
  canManageAllCompanies: true,      // Manage all companies
  canAccessFullRecords: true,       // Full records access
  canManageSystem: true,            // System management
  canControlPolicy: true,           // Policy control
  canBatchProcess: true,            // Batch processing
  canAccessPrescriptiveAnalytics: true, // Prescriptive analytics (moved from Director)
};

// Director permissions map based on the diagram
export const DIRECTOR_PERMISSIONS = {
  canAccessAnalytics: true,         // Analytics & Dashboard
  canAccessSystemAnalytics: true,   // System-wide analytics
  canCreateAdmin: true,             // Create admin accounts
  canApproveAccounts: true,         // Approve accounts
  canDeactivateAccounts: true,      // Deactivate accounts
};

// Helper function to check company access
const checkCompanyAccess = (decoded: DecodedToken, companyId?: string): boolean => {
  if (decoded.role === UserRole.STAFF) {
    return decoded.company === companyId;
  }
  return true; // Admin and Director can access all companies
};

export const checkStaffPermissions = async (token: string, companyId?: string) => {
  const decoded = await verifyJWT(token) as DecodedToken;
  
  if (!decoded) {
    return { allowed: false, error: 'Invalid token' };
  }

  if (decoded.role === UserRole.STAFF) {
    if (!checkCompanyAccess(decoded, companyId)) {
      return { allowed: false, error: 'Staff can only access their assigned company' };
    }
    return { allowed: true };
  }

  return { allowed: false, error: 'Staff role required' };
};

export const checkAdminPermissions = async (token: string) => {
  const decoded = await verifyJWT(token) as DecodedToken;
  
  if (!decoded) {
    return { allowed: false, error: 'Invalid token' };
  }

  if (decoded.role === UserRole.ADMIN || decoded.role === 'administrator') {
    return { allowed: true };
  }

  return { allowed: false, error: 'Administrator role required' };
};

export const checkDirectorPermissions = async (token: string) => {
  const decoded = await verifyJWT(token) as DecodedToken;
  
  if (!decoded) {
    return { allowed: false, error: 'Invalid token' };
  }

  if (decoded.role === UserRole.DIRECTOR) {
    return { allowed: true };
  }

  return { allowed: false, error: 'Director role required' };
};

// Helper function to check specific permissions
export const checkPermission = async (token: string, permission: keyof typeof STAFF_PERMISSIONS | keyof typeof ADMIN_PERMISSIONS | keyof typeof DIRECTOR_PERMISSIONS, companyId?: string) => {
  const decoded = await verifyJWT(token) as DecodedToken;
  
  if (!decoded) {
    return { allowed: false, error: 'Invalid token' };
  }

  switch (decoded.role) {
    case UserRole.STAFF:
      if (permission in STAFF_PERMISSIONS) {
        // Check company access for staff permissions
        if (!checkCompanyAccess(decoded, companyId)) {
          return { allowed: false, error: 'Staff can only access their assigned company' };
        }
        return { allowed: true };
      }
      break;

    case UserRole.ADMIN:
    case 'administrator':
      if (permission in ADMIN_PERMISSIONS) {
        return { allowed: true };
      }
      break;

    case UserRole.DIRECTOR:
      if (permission in DIRECTOR_PERMISSIONS) {
        return { allowed: true };
      }
      break;
  }

  return { allowed: false, error: `Permission ${permission} not granted for role ${decoded.role}` };
}; 