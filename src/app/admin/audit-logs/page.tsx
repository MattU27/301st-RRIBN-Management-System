'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/ui/Card';
import { AuditAction, AuditResource } from '@/models/AuditLog';
import { auditService } from '@/utils/auditService';
import { 
  ClockIcon, 
  UserIcon, 
  DocumentTextIcon, 
  ArrowPathIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SparklesIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

// Define audit log interface here to avoid importing server-side models directly
interface AuditLog {
  _id: string;
  timestamp: string;
  userId: number | string;
  userName: string;
  userRole: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string | number;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AuditLogsPage() {
  const { user, isAuthenticated, isLoading, hasSpecificPermission } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1
  });
  const [error, setError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  
  // Add state for modal and selected log
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [filters, setFilters] = useState({
    action: '' as AuditAction | '',
    resource: '' as AuditResource | '',
    startDate: '',
    endDate: '',
    searchTerm: ''
  });

  // Helper function to get cookies
  const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user && !hasSpecificPermission('view_audit_logs')) {
      router.push('/dashboard');
      return;
    }

    fetchAuditLogs();
    
    // Log page view to audit log
    if (user) {
      auditService.logPageView(
        user._id,
        `${user.firstName} ${user.lastName}`,
        user.role,
        '/admin/audit-logs'
      );
    }
  }, [isLoading, isAuthenticated, router, user, hasSpecificPermission, filters, pagination.page]);

  const fetchAuditLogs = async (page = pagination.page) => {
    try {
      setLoading(true);
      setError(null);

      // Get token
      let token = null;
      if (typeof window !== 'undefined') {
        token = 
          localStorage.getItem('token') || 
          getCookie('token') || 
          sessionStorage.getItem('token');
      }

      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setLoading(false);
        return;
      }

      // Build query parameters
      const queryParams = new URLSearchParams();
      
      if (filters.action) {
        queryParams.append('action', filters.action);
      }
      
      if (filters.resource) {
        queryParams.append('resource', filters.resource);
      }
      
      if (filters.startDate) {
        queryParams.append('startDate', filters.startDate);
      }
      
      if (filters.endDate) {
        queryParams.append('endDate', filters.endDate);
      }
      
      if (filters.searchTerm) {
        queryParams.append('searchTerm', filters.searchTerm);
      }
      
      queryParams.append('page', page.toString());
      queryParams.append('limit', pagination.limit.toString());

      // Fetch logs from API
      const response = await fetch(`/api/admin/audit-logs?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch audit logs: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setLogs(data.data.logs);
        setPagination(data.data.pagination);
      } else {
        throw new Error(data.message || 'Failed to fetch audit logs');
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError((err as Error).message);
      
      // If no logs exist or there's an error, show empty state
      setLogs([]);
      setPagination({
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 1
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    // Reset to page 1 when filters change
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const resetFilters = () => {
    setFilters({
      action: '',
      resource: '',
      startDate: '',
      endDate: '',
      searchTerm: ''
    });
    // Reset to page 1 when filters are reset
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getActionColor = (action: AuditAction) => {
    switch (action) {
      case 'create':
      case 'upload':
        return 'bg-green-100 text-green-800';
      case 'delete':
        return 'bg-red-100 text-red-800';
      case 'update':
      case 'verify':
      case 'approve':
        return 'bg-blue-100 text-blue-800';
      case 'login':
      case 'logout':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const exportToCSV = () => {
    if (logs.length === 0) {
      alert('No logs to export');
      return;
    }
    
    // Format the logs as CSV
    const headers = ['Timestamp', 'User', 'Role', 'Action', 'Resource', 'Resource ID', 'Details', 'IP Address'];
    const csvRows = [headers];
    
    logs.forEach(log => {
      csvRows.push([
        formatDate(log.timestamp),
        log.userName,
        log.userRole,
        log.action,
        log.resource,
        log.resourceId ? String(log.resourceId) : '',
        log.details || '',
        log.ipAddress || ''
      ]);
    });
    
    // Convert to CSV string
    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    
    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const seedSampleLogs = async () => {
    try {
      setSeeding(true);
      
      // Get token
      let token = null;
      if (typeof window !== 'undefined') {
        token = 
          localStorage.getItem('token') || 
          getCookie('token') || 
          sessionStorage.getItem('token');
      }

      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setSeeding(false);
        return;
      }

      // Call seed API endpoint
      const response = await fetch('/api/admin/seed-audit-logs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user?._id,
          userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
          userRole: user?.role || 'admin'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to seed audit logs: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Show success message
        alert(`Successfully created ${data.count} sample audit log entries`);
        // Refresh the audit logs
        fetchAuditLogs();
      } else {
        throw new Error(data.message || 'Failed to seed audit logs');
      }
    } catch (err) {
      console.error('Error seeding audit logs:', err);
      alert(`Error: ${(err as Error).message}`);
    } finally {
      setSeeding(false);
    }
  };

  const cleanupDirectorLogs = async () => {
    try {
      setCleaning(true);
      
      // Get token
      let token = null;
      if (typeof window !== 'undefined') {
        token = 
          localStorage.getItem('token') || 
          getCookie('token') || 
          sessionStorage.getItem('token');
      }

      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setCleaning(false);
        return;
      }

      // Call cleanup API endpoint
      const response = await fetch('/api/admin/cleanup-director-logs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to clean up director logs: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Show success message
        alert(`Successfully removed ${data.count} director log entries`);
        // Refresh the audit logs
        fetchAuditLogs();
      } else {
        throw new Error(data.message || 'Failed to clean up director logs');
      }
    } catch (err) {
      console.error('Error cleaning up director logs:', err);
      alert(`Error: ${(err as Error).message}`);
    } finally {
      setCleaning(false);
    }
  };

  // Add handler to view log details
  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };
  
  // Add modal close handler
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedLog(null);
  };

  // Add this component inside the AuditLogsPage function
  const LogDetailsModal = ({ log, isOpen, onClose }: { log: AuditLog | null, isOpen: boolean, onClose: () => void }) => {
    if (!isOpen || !log) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Audit Log Details</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <dl className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-6">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Timestamp</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(log.timestamp)}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">User</dt>
                  <dd className="mt-1 text-sm text-gray-900">{log.userName}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Role</dt>
                  <dd className="mt-1 text-sm text-gray-900">{log.userRole}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Action</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Resource</dt>
                  <dd className="mt-1 text-sm text-gray-900">{log.resource}</dd>
                </div>
                
                {log.resourceId && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Resource ID</dt>
                    <dd className="mt-1 text-sm text-gray-900">{log.resourceId}</dd>
                  </div>
                )}
                
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Details</dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{log.details}</dd>
                </div>
                
                {log.ipAddress && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">IP Address</dt>
                    <dd className="mt-1 text-sm text-gray-900">{log.ipAddress}</dd>
                  </div>
                )}
                
                {log.userAgent && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">User Agent</dt>
                    <dd className="mt-1 text-sm text-gray-900 break-words">{log.userAgent}</dd>
                  </div>
                )}
              </dl>
            </div>
            
            <div className="mt-6">
              <button
                onClick={onClose}
                className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div className="flex items-center mb-4 md:mb-0">
          <ClockIcon className="h-8 w-8 text-indigo-600 mr-2" />
          <h1 className="text-2xl font-bold text-gray-900">System Audit Logs</h1>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={exportToCSV}
            disabled={logs.length === 0}
            className={`px-4 py-2 ${logs.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'} text-white text-sm font-medium rounded-md flex items-center`}
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export to CSV
          </button>
        </div>
      </div>

      <Card>
        <div className="p-4">
          <div className="flex items-center mb-4">
            <FunnelIcon className="h-5 w-5 text-indigo-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <div>
              <label htmlFor="action" className="block text-sm font-medium text-gray-700 mb-1">
                Action
              </label>
              <select
                id="action"
                name="action"
                className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                value={filters.action}
                onChange={handleFilterChange}
              >
                <option value="">All Actions</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
                <option value="view">View</option>
                <option value="download">Download</option>
                <option value="upload">Upload</option>
                <option value="verify">Verify</option>
                <option value="approve">Approve</option>
                <option value="reject">Reject</option>
                <option value="system">System</option>
              </select>
            </div>
            <div>
              <label htmlFor="resource" className="block text-sm font-medium text-gray-700 mb-1">
                Resource
              </label>
              <select
                id="resource"
                name="resource"
                className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                value={filters.resource}
                onChange={handleFilterChange}
              >
                <option value="">All Resources</option>
                <option value="user">User</option>
                <option value="personnel">Personnel</option>
                <option value="document">Document</option>
                <option value="training">Training</option>
                <option value="announcement">Announcement</option>
                <option value="report">Report</option>
                <option value="system">System</option>
              </select>
            </div>
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                value={filters.startDate}
                onChange={handleFilterChange}
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                value={filters.endDate}
                onChange={handleFilterChange}
              />
            </div>
            <div>
              <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                id="searchTerm"
                name="searchTerm"
                placeholder="Search by user or details"
                className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                value={filters.searchTerm}
                onChange={handleFilterChange}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 flex items-center"
            >
              <ArrowPathIcon className="h-4 w-4 mr-1" />
              Reset Filters
            </button>
          </div>
        </div>
      </Card>

      <div className="mt-6">
        <Card>
          {loading ? (
            <div className="p-10 flex justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <div className="text-red-500 mb-2">Error loading audit logs</div>
              <div className="text-sm text-gray-600">{error}</div>
              <button
                onClick={() => fetchAuditLogs()}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Resource
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Details
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        View
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">
                          No audit logs found matching your criteria
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(log.timestamp)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                <UserIcon className="h-4 w-4 text-indigo-600" />
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">{log.userName}</div>
                                <div className="text-xs text-gray-500">{log.userRole}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionColor(log.action)}`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              {log.resource}
                              {log.resourceId && (
                                <span className="ml-1 text-xs text-gray-400">#{log.resourceId}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                            {log.details || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                            <button
                              onClick={() => handleViewDetails(log)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="View full details"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span>
                    {' '}-{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>
                    {' '}of{' '}
                    <span className="font-medium">{pagination.total}</span> results
                  </div>
                  
                  <nav className="flex items-center">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className={`mx-1 p-2 rounded-md ${pagination.page === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-200'}`}
                    >
                      <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                    
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      // Calculate page numbers to display (always show current page in the middle if possible)
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`mx-1 px-3 py-1 rounded-md ${
                            pageNum === pagination.page 
                              ? 'bg-indigo-600 text-white' 
                              : 'text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className={`mx-1 p-2 rounded-md ${pagination.page === pagination.totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-200'}`}
                    >
                      <ChevronRightIcon className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              )}
              
              {pagination.totalPages <= 1 && logs.length > 0 && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
                  Showing {logs.length} of {pagination.total} logs
                </div>
              )}
            </>
          )}
        </Card>
      </div>
      
      {/* Log Details Modal */}
      <LogDetailsModal
        log={selectedLog}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  );
} 