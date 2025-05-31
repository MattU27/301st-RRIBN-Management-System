// Define permission types
export type Permission = 
  // Company management
  | 'manage_company_personnel'
  | 'view_personnel'
  | 'view_all_personnel'
  | 'update_personnel_records'
  | 'update_personnel_status'
  
  // Account management
  | 'approve_reservist_accounts'
  | 'create_admin_accounts'
  | 'manage_admin_accounts'
  
  // Content management
  | 'post_announcements'
  | 'manage_announcements'
  | 'manage_trainings'
  | 'manage_documents'
  | 'upload_policy'
  | 'edit_policy'
  | 'delete_policy'
  
  // System management
  | 'access_system_settings'
  | 'view_audit_logs'
  | 'run_reports'
  | 'export_data';

// Define permission sets for each role
export const rolePermissions: Record<string, Permission[]> = {
  // Reservist permissions (basic user)
  reservist: [
    'view_personnel', // Can view their own personnel data
  ],
  
  // Staff permissions
  staff: [
    'manage_company_personnel',
    'view_personnel',
    'update_personnel_records',
    'update_personnel_status',
    'approve_reservist_accounts',
    'post_announcements',
    'manage_announcements',
    'manage_trainings',
    'manage_documents',
    'upload_policy',
  ],
  
  // Admin permissions (has all staff permissions plus more)
  admin: [
    // Staff permissions
    'manage_company_personnel',
    'view_personnel',
    'view_all_personnel',
    'update_personnel_records',
    'update_personnel_status',
    'approve_reservist_accounts',
    'post_announcements',
    'manage_announcements',
    'manage_trainings',
    'manage_documents',
    'upload_policy',
    
    // Admin-specific permissions
    'edit_policy',
    'delete_policy',
    'run_reports',
    'export_data',
    'view_audit_logs',
  ],
  
  // Administrator permissions (same as admin)
  administrator: [
    // Staff permissions
    'manage_company_personnel',
    'view_personnel',
    'view_all_personnel',
    'update_personnel_records',
    'update_personnel_status',
    'approve_reservist_accounts',
    'post_announcements',
    'manage_announcements',
    'manage_trainings',
    'manage_documents',
    'upload_policy',
    
    // Admin-specific permissions
    'edit_policy',
    'delete_policy',
    'run_reports',
    'export_data',
    'view_audit_logs',
  ],
  
  // Director (super admin) permissions
  director: [
    // Has all permissions
    'manage_company_personnel',
    'view_personnel',
    'update_personnel_records',
    'update_personnel_status',
    'approve_reservist_accounts',
    'create_admin_accounts',
    'manage_admin_accounts',
    'post_announcements',
    'manage_announcements',
    'manage_trainings',
    'manage_documents',
    'upload_policy',
    'edit_policy',
    'delete_policy',
    'access_system_settings',
    'view_audit_logs',
    'run_reports',
    'export_data',
  ]
};

// Helper function to check if a role has a specific permission
export function hasPermission(role: string, permission: Permission): boolean {
  if (!role || !rolePermissions[role]) {
    return false;
  }
  
  return rolePermissions[role].includes(permission);
}

// Helper function to check if the user's role is at least at the specified level
// Order: director > admin > staff > reservist
export function hasMinimumRole(userRole: string, requiredRole: string): boolean {
  const roleHierarchy = {
    director: 4,
    admin: 3,
    administrator: 3, // Add administrator with same level as admin
    staff: 2,
    reservist: 1
  };
  
  const userRoleLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
  const requiredRoleLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;
  
  return userRoleLevel >= requiredRoleLevel;
} 