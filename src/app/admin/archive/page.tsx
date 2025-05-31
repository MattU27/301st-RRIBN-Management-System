"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/ui/Card';
import Link from 'next/link';
import { 
  UserGroupIcon, 
  CheckCircleIcon, 
  InformationCircleIcon,
  BriefcaseIcon,
  ExclamationTriangleIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import axios from 'axios';
import { UserStatus } from '@/types/auth';
import { toast } from 'react-hot-toast';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: UserStatus;
  rank?: string;
  company?: string;
  lastLogin?: string;
  createdAt: string;
  deactivationReason?: string;
  isArchived?: boolean;
  serviceId?: string;
}

export default function ArchivedAccountsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Loading archived accounts...');
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(8);
  const [actionLoading, setActionLoading] = useState({ id: '', action: '' });
  const isNavigatingRef = useRef(false); // Ref to track navigation state
  const initialFetchDoneRef = useRef(false); // New ref for tracking initial fetch
  const fetchInProgressRef = useRef(false); // New ref to prevent concurrent fetches

  // Separate useEffect for authentication checking
  useEffect(() => {
    // If we're in the middle of navigation, don't fetch
    if (isNavigatingRef.current) {
      return;
    }
    
    // Skip if still loading
    if (isLoading) {
      return;
    }
    
    // Handle authentication
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.role !== 'director') {
      router.push('/dashboard');
      return;
    }

    // Only fetch users initially if we don't already have data
    // This prevents redundant fetches when navigating back to this page
    if (users.length === 0 && !initialFetchDoneRef.current && !fetchInProgressRef.current) {
      initialFetchDoneRef.current = true;
      fetchArchivedUsers();
    }
  }, [isLoading, isAuthenticated, router, user]);

  // Separate useEffect for search query with debouncing
  useEffect(() => {
    if (!isAuthenticated || !user || isLoading) return;
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout
    searchTimeoutRef.current = setTimeout(() => {
      fetchArchivedUsers();
      searchTimeoutRef.current = null;
    }, 500);
    
    // Cleanup
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const fetchArchivedUsers = async () => {
    // Prevent concurrent fetches
    if (fetchInProgressRef.current) {
      return;
    }
    
    fetchInProgressRef.current = true;
    
    try {
      setLoading(true);
      setLoadingMessage('Loading archived accounts...');
      
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Build URL - only include search parameter if provided
      let url = '/api/admin/users?archived=true';
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      
      console.log('Fetching archived users with URL:', url);
      
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Archive API raw response:', JSON.stringify(response.data));
      
      if (response.data.success) {
        const allUsers = response.data.data.users;
        console.log(`API returned ${allUsers.length} users`);
        
        // Log the full user data to debug the isArchived flag
        console.log('Raw user data from API:', allUsers.map((u: User) => ({
          id: u._id,
          name: `${u.firstName} ${u.lastName}`,
          status: u.status,
          isArchived: u.isArchived,
          deactivationReason: u.deactivationReason
        })));
        
        // Make sure we're filtering to only show archived users
        const archivedUsers = allUsers.filter((u: User) => u.isArchived === true);
        console.log(`After filtering for isArchived=true: ${archivedUsers.length} users`);
        
        // Debug info for deactivated users
        const deactivatedUsers = allUsers.filter((u: User) => u.status === UserStatus.INACTIVE);
        console.log(`Deactivated users count: ${deactivatedUsers.length}`);
        
        // Check if there are deactivated users not marked as archived
        const notArchivedButDeactivated = deactivatedUsers.filter((u: User) => !u.isArchived);
        if (notArchivedButDeactivated.length > 0) {
          console.log(`Found ${notArchivedButDeactivated.length} deactivated users that are not archived:`, 
            notArchivedButDeactivated.map((u: User) => ({ id: u._id, name: `${u.firstName} ${u.lastName}` }))
          );
        }
        
        setUsers(archivedUsers);
        setError(null);
      } else {
        setError(response.data.error || 'Failed to fetch archived accounts');
      }
    } catch (err: any) {
      console.error('Error fetching archived users:', err);
      setError(err.response?.data?.error || err.message || 'An error occurred while fetching archived accounts');
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  };

  // Add this as a fallback function for activation
  const activateUserDirectly = async (userId: string) => {
    try {
      console.log('Attempting direct activation method for user:', userId);
      
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Try a direct endpoint that specifically handles activation from archive
      const response = await axios.post(
        '/api/admin/archive/activate',
        { userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Direct activation response:', response.data);
      
      if (response.data.success) {
        toast.success('User has been activated through direct method');
        setTimeout(() => router.push('/admin/accounts'), 500);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Direct activation failed:', error);
      return false;
    }
  };

  const handleReactivateUser = async (userId: string) => {
    try {
      setActionLoading({ id: userId, action: 'reactivate' });
      console.log(`Starting activation process for user ${userId}`);
      
      const token = await getToken();
      if (!token) {
        toast.error('Authentication token not found');
        return;
      }
      
      // Call direct activation endpoint
      console.log('Calling direct activation endpoint...');
      const response = await axios.post(
        '/api/admin/archive/activate',
        { userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Activation API response:', response.data);
      
      if (response.data.success) {
        toast.success('Account activated successfully!');
        
        // Remove the user from the local state to avoid unnecessary refreshes
        setUsers(users.filter(u => u._id !== userId));
        
        // Use our optimized navigation function
        navigateToAccounts(userId);
      } else {
        console.error('Failed to activate account:', response.data.error);
        toast.error('Failed to activate account: ' + (response.data.error || 'Unknown error'));
        
        // Refresh the archive list in case of failure
        fetchArchivedUsers();
      }
    } catch (err) {
      console.error('Error during activation:', err);
      toast.error('Failed to activate account. Please try again.');
      
      // Refresh the archive list in case of failure
      fetchArchivedUsers();
    } finally {
      setActionLoading({ id: '', action: '' });
    }
  };

  // Optimized navigation function to prevent double fetches
  const navigateToAccounts = (userId?: string) => {
    // Set navigation flag to prevent additional fetches
    isNavigatingRef.current = true;
    
    // Clear users state to force a fresh fetch when returning
    setUsers([]);
    
    // Ensure any in-progress operations are canceled
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    
    // Create a URL with state that can be detected on the accounts page
    const state = { fromArchive: true, activated: userId ? true : false };
    
    // Use simple navigation without options that cause linter errors
    if (userId) {
      // Use replace instead of push to avoid browser history issues
      router.replace(`/admin/accounts?fromActivation=true&userId=${userId}`);
    } else {
      router.replace('/admin/accounts');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-gray-600">{loadingMessage}</p>
      </div>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const getFullName = (user: User) => {
    return `${user.firstName} ${user.lastName}`;
  };

  // Get current users for pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(users.length / usersPerPage);

  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const getStatusBadgeColor = (status: UserStatus) => {
    switch (status) {
      case UserStatus.ACTIVE:
        return 'bg-green-100 text-green-800';
      case UserStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case UserStatus.INACTIVE:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Debounce search by 500ms
    searchTimeoutRef.current = setTimeout(() => {
      if (!fetchInProgressRef.current) {
        fetchArchivedUsers();
      }
      searchTimeoutRef.current = null;
    }, 500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Archive - Deactivated Accounts</h1>
        <button
          onClick={() => navigateToAccounts()}
          className="px-4 py-2 bg-blue-100 text-blue-700 font-medium rounded-md border border-blue-300 hover:bg-blue-200 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm"
        >
          Back to Accounts
        </button>
      </div>

      <Card>
        <div className="p-6">
          <div className="flex items-center mb-4">
            <ArchiveBoxIcon className="h-8 w-8 text-gray-500" />
            <h2 className="ml-3 text-lg font-medium text-gray-900">Archived Accounts</h2>
          </div>
          <p className="text-gray-600 mb-6">View and manage deactivated user accounts that have been archived.</p>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Search */}
          <div className="mb-6">
            <div className="w-full md:w-1/2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="search"
                  name="search"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search by name, rank, email, or service ID"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    fetchArchivedUsers();
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-md">
              <ArchiveBoxIcon className="h-12 w-12 text-gray-400 mb-2" />
              <h3 className="text-lg font-medium text-gray-900">No archived accounts found</h3>
              <p className="text-gray-500 text-center mt-1">
                There are no archived accounts at this time
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-md border border-gray-200">
              <div className="w-full" style={{ overflow: 'hidden' }}>
                <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[18%]">
                        Name
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[22%]">
                        Rank & Company
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[13%]">
                        Service ID
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[11%]">
                        Role
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">
                        Status
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[14%]">
                        Last Login
                      </th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[12%]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentUsers.map((user) => (
                      <tr key={user._id}>
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{getFullName(user)}</div>
                          <div className="text-sm text-gray-500 truncate max-w-[200px]">{user.email}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-900 truncate max-w-[200px]">{user.rank || 'N/A'}</div>
                          <div className="text-sm text-gray-500 max-w-[300px] whitespace-normal">{user.company || 'N/A'}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-900 truncate max-w-[150px]">{user.serviceId || 'N/A'}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-900 capitalize truncate max-w-[130px]">
                            {user.role === 'administrator' ? 'Administrator' : user.role}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(user.status)}`}>
                              {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                            </span>
                            {user.status === UserStatus.INACTIVE && (
                              <div className="relative ml-2 group">
                                <InformationCircleIcon 
                                  className="h-5 w-5 text-gray-400 hover:text-gray-600 cursor-help" 
                                  onClick={() => {
                                    const reason = user.deactivationReason || 'No reason provided';
                                    alert(`Deactivation reason for ${user.firstName} ${user.lastName}:\n${reason}`);
                                  }}
                                />
                                <div className="absolute z-50 top-0 right-6 mt-0 p-3 bg-gray-800 text-white text-sm rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-64 pointer-events-none border border-gray-700">
                                  <p className="font-semibold mb-1 text-yellow-300">Deactivation Reason:</p>
                                  <p className="break-words">{user.deactivationReason || 'No reason provided'}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500 truncate max-w-[150px]">
                          {formatDate(user.lastLogin)}
                        </td>
                        <td className="px-4 py-4 text-right text-sm font-medium">
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleReactivateUser(user._id)}
                              disabled={actionLoading.id === user._id && actionLoading.action === 'reactivate'}
                              className="text-green-600 hover:text-green-900 mx-1 px-3 py-1 border border-green-600 rounded-md"
                              title="Activate Account"
                            >
                              {actionLoading.id === user._id && actionLoading.action === 'reactivate' ? (
                                <span className="flex items-center">
                                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Processing...
                                </span>
                              ) : (
                                'Activate'
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {users.length > usersPerPage && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                        currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                        currentPage === totalPages ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{indexOfFirstUser + 1}</span> to{' '}
                        <span className="font-medium">
                          {Math.min(indexOfLastUser, users.length)}
                        </span>{' '}
                        of <span className="font-medium">{users.length}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => paginate(currentPage - 1)}
                          disabled={currentPage === 1}
                          className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                            currentPage === 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          <span className="sr-only">Previous</span>
                          <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                        {[...Array(totalPages)].map((_, i) => (
                          <button
                            key={i + 1}
                            onClick={() => paginate(i + 1)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === i + 1
                                ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {i + 1}
                          </button>
                        ))}
                        <button
                          onClick={() => paginate(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                            currentPage === totalPages ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          <span className="sr-only">Next</span>
                          <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
} 