import { AuditAction, AuditResource } from '@/models/AuditLog';

/**
 * Service for logging user actions to the audit log
 */
export const auditService = {
  /**
   * Log an action for audit purposes
   */
  async logUserAction(
    userId: number | string,
    userName: string,
    userRole: string,
    action: AuditAction,
    resource: AuditResource,
    resourceId?: string | number,
    details?: string
  ): Promise<boolean> {
    try {
      // Get token from local storage or cookies
      let token = null;
      if (typeof window !== 'undefined') {
        token = localStorage.getItem('token') || 
                document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] || 
                sessionStorage.getItem('token');
      }
      
      if (!token) {
        console.error('Authentication token not found');
        return false;
      }
      
      // Create audit log entry
      const auditLog = {
        userId,
        userName,
        userRole,
        action,
        resource,
        resourceId,
        details,
        userAgent: navigator.userAgent
      };
      
      // Send to API
      const response = await fetch('/api/admin/audit-logs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(auditLog)
      });
      
      if (!response.ok) {
        console.error('Failed to log audit action:', response.status);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error logging audit action:', error);
      return false;
    }
  },
  
  /**
   * Log a page view
   */
  logPageView(
    userId: number | string,
    userName: string,
    userRole: string,
    pagePath: string
  ): Promise<boolean> {
    return this.logUserAction(
      userId,
      userName,
      userRole,
      'view',
      'system',
      undefined,
      `Viewed page: ${pagePath}`
    );
  },
  
  /**
   * Log a document action
   */
  logDocumentAction(
    userId: number | string,
    userName: string,
    userRole: string,
    action: AuditAction,
    documentId: string | number,
    documentName: string
  ): Promise<boolean> {
    return this.logUserAction(
      userId,
      userName,
      userRole,
      action,
      'document',
      documentId,
      `${action.charAt(0).toUpperCase() + action.slice(1)} document: ${documentName}`
    );
  },
  
  /**
   * Log a personnel action
   */
  logPersonnelAction(
    userId: number | string,
    userName: string,
    userRole: string,
    action: AuditAction,
    personnelId: string | number,
    personnelName: string
  ): Promise<boolean> {
    return this.logUserAction(
      userId,
      userName,
      userRole,
      action,
      'personnel',
      personnelId,
      `${action.charAt(0).toUpperCase() + action.slice(1)} personnel record: ${personnelName}`
    );
  },
  
  /**
   * Log a training action
   */
  logTrainingAction(
    userId: number | string,
    userName: string,
    userRole: string,
    action: AuditAction,
    trainingId: string | number,
    trainingName: string
  ): Promise<boolean> {
    return this.logUserAction(
      userId,
      userName,
      userRole,
      action,
      'training',
      trainingId,
      `${action.charAt(0).toUpperCase() + action.slice(1)} training: ${trainingName}`
    );
  },
  
  /**
   * Log a system configuration action
   */
  logSystemConfigAction(
    userId: number | string,
    userName: string,
    userRole: string,
    details: string
  ): Promise<boolean> {
    return this.logUserAction(
      userId,
      userName,
      userRole,
      'update',
      'system',
      undefined,
      `Updated system configuration: ${details}`
    );
  }
}; 