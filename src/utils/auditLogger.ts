/**
 * Audit Logger Utility
 * 
 * This utility provides functions for logging user actions for audit purposes.
 * In a production environment, these logs would be sent to a secure server.
 */

export type AuditAction = 
  | 'login'
  | 'logout'
  | 'create'
  | 'update'
  | 'delete'
  | 'view'
  | 'download'
  | 'upload'
  | 'verify'
  | 'reject'
  | 'approve'
  | 'register'
  | 'cancel'
  | 'export'
  | 'import'
  | 'system';

export type AuditResource =
  | 'user'
  | 'personnel'
  | 'document'
  | 'training'
  | 'announcement'
  | 'report'
  | 'system';

export interface AuditLog {
  timestamp: string;
  userId: number;
  userName: string;
  userRole: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string | number;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
}

// In-memory store for audit logs (in a real app, this would be sent to a server)
const auditLogs: AuditLog[] = [];

/**
 * Log an action for audit purposes
 */
export function logAuditEvent(
  userId: number,
  userName: string,
  userRole: string,
  action: AuditAction,
  resource: AuditResource,
  resourceId?: string | number,
  details?: string
): void {
  const log: AuditLog = {
    timestamp: new Date().toISOString(),
    userId,
    userName,
    userRole,
    action,
    resource,
    resourceId,
    details,
    ipAddress: 'client-side', // In a real app, this would be captured server-side
    userAgent: navigator.userAgent
  };
  
  // In a real app, this would be sent to a server API
  console.log('AUDIT LOG:', log);
  auditLogs.push(log);
  
  // Optionally store in localStorage for demo purposes
  const storedLogs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
  storedLogs.push(log);
  localStorage.setItem('auditLogs', JSON.stringify(storedLogs.slice(-100))); // Keep last 100 logs
}

/**
 * Get audit logs (for admin/director viewing)
 */
export function getAuditLogs(
  filters?: {
    userId?: number;
    action?: AuditAction;
    resource?: AuditResource;
    startDate?: string;
    endDate?: string;
  }
): AuditLog[] {
  // In a real app, this would fetch from a server API
  let logs = [...auditLogs];
  
  // Apply filters
  if (filters) {
    if (filters.userId) {
      logs = logs.filter(log => log.userId === filters.userId);
    }
    
    if (filters.action) {
      logs = logs.filter(log => log.action === filters.action);
    }
    
    if (filters.resource) {
      logs = logs.filter(log => log.resource === filters.resource);
    }
    
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      logs = logs.filter(log => new Date(log.timestamp) >= startDate);
    }
    
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      logs = logs.filter(log => new Date(log.timestamp) <= endDate);
    }
  }
  
  return logs;
}

/**
 * Clear audit logs (for testing purposes only)
 */
export function clearAuditLogs(): void {
  auditLogs.length = 0;
  localStorage.removeItem('auditLogs');
} 