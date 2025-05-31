"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/ui/Card';
import Link from 'next/link';
import { 
  UserGroupIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  TrashIcon,
  BriefcaseIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import axios from 'axios';
import { UserStatus } from '@/types/auth';
import DeactivationReasonModal from '@/components/DeactivationReasonModal';
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

export default function AdministratorAccountsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Loading user accounts...');
  const [users, setUsers] = useState<User[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(8);
  const [showDeactivationModal, setShowDeactivationModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const isNavigatingRef = useRef(false); // Ref to track navigation state
  const initialFetchDoneRef = useRef(false); // Track initial fetch
  const activationHandledRef = useRef(false); // Track if activation redirect was handled
  const fetchInProgressRef = useRef(false); // Track if fetch is in progress

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

    // Only fetch users initially if we don't already have data and not already fetching
    if (users.length === 0 && !initialFetchDoneRef.current && !fetchInProgressRef.current) {
      initialFetchDoneRef.current = true;
      fetchUsers();
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
      if (!fetchInProgressRef.current) {
        fetchUsers();
      }
      searchTimeoutRef.current = null;
    }, 500);
    
    // Cleanup
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Handle activation redirect - only run once on initial load
  useEffect(() => {
    // Skip if activation has been handled or we're not authenticated yet
    if (activationHandledRef.current || !isAuthenticated) {
      return;
    }
    
    const queryParams = new URLSearchParams(window.location.search);
    const fromActivation = queryParams.get('fromActivation');
    const userId = queryParams.get('userId');
    
    if (fromActivation === 'true' && userId) {
      console.log('Detected activation redirect with userId:', userId);
      activationHandledRef.current = true;
      
      // Instead of refreshing, just update our UI if the user exists
      const updatedQParams = new URLSearchParams(window.location.search);
      updatedQParams.delete('fromActivation');
      updatedQParams.delete('userId');
      
      // Replace the URL without the query parameters to avoid issues on refresh
      window.history.replaceState(
        null, 
        '', 
        window.location.pathname + (updatedQParams.toString() ? `?${updatedQParams.toString()}` : '')
      );
      
      // Only fetch users once when redirected from activation if we need to
      if (users.length === 0 && !fetchInProgressRef.current) {
        fetchUsers();
      }
      
      toast.success(`User account has been successfully activated`);
    }
  }, [isAuthenticated, users.length]);

  const fetchUsers = async (refreshCallback?: () => void) => {
    // Prevent concurrent fetches
    if (fetchInProgressRef.current) {
      return;
    }
    
    fetchInProgressRef.current = true;
    
    try {
      setLoading(true);
      setLoadingMessage('Loading user accounts...');
      
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Build URL with search only
      let url = '/api/admin/users?';
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}`;
      
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        // Check for inactive users and log their deactivation reasons for debugging
        const inactiveUsers = response.data.data.users
          .filter((u: User) => u.status === UserStatus.INACTIVE);
          
        if (inactiveUsers.length > 0) {
          console.log('Inactive users with deactivation reasons:', 
            inactiveUsers.map((u: User) => ({
              id: u._id,
              name: `${u.firstName} ${u.lastName}`,
              reason: u.deactivationReason || 'No reason provided'
            }))
          );
        }
        
        // Filter out archived users from the main view
        let filteredUsers = response.data.data.users;
        
        // Only show non-archived users in the main view
        filteredUsers = filteredUsers.filter((u: User) => !u.isArchived);
        
        setUsers(filteredUsers);
        setError(null);
        
        if (refreshCallback) {
          refreshCallback();
        }
      } else {
        setError(response.data.error || 'Failed to fetch user accounts');
      }
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.error || err.message || 'An error occurred while fetching users');
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  };

  const handleStatusChange = (userId: string, newStatus: UserStatus) => {
    handleStatusChangeWithReason(userId, newStatus);
  };

  const handleStatusChangeWithReason = async (userId: string, newStatus: UserStatus, reason?: string) => {
    try {
      setLoading(true);
      setLoadingMessage(`Updating user status...`);
      
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const payload: any = { userId, status: newStatus };
      
      // Add reason if provided (for deactivation)
      if (reason && newStatus === UserStatus.INACTIVE) {
        console.log(`Adding reason "${reason}" to deactivation payload`);
        payload.reason = reason;
        
        // Automatically mark deactivated accounts as archived
        payload.isArchived = true;
        console.log('Automatically marking account as archived');
      }
      
      console.log('Sending PATCH request with payload:', payload);
      
      const response = await axios.patch('/api/admin/users', 
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      console.log('Response from PATCH request:', response.data);
      
      if (response.data.success) {
        // Add additional debug request to check user state after update
        console.log('Verifying user state after deactivation...');
        try {
          const checkResponse = await axios.get(`/api/admin/users?search=${userId}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          if (checkResponse.data.success) {
            const foundUser = checkResponse.data.data.users.find((u: any) => u._id === userId);
            if (foundUser) {
              console.log('User state after deactivation:', {
                id: foundUser._id,
                name: `${foundUser.firstName} ${foundUser.lastName}`,
                status: foundUser.status,
                isArchived: foundUser.isArchived,
                deactivationReason: foundUser.deactivationReason
              });
            } else {
              console.log('User not found in verification check - may have been filtered out due to isArchived=true');
            }
          }
        } catch (verifyErr) {
          console.error('Error verifying user state:', verifyErr);
        }
        
        // Request fresh data from the server
        fetchUsers(() => {
          console.log('Data refreshed after status change');
        });
        setError(null);
      } else {
        setError(response.data.error || 'Failed to update user status');
      }
    } catch (err: any) {
      console.error('Error updating user status:', err);
      setError(err.response?.data?.error || err.message || 'An error occurred while updating user status');
    } finally {
      setLoading(false);
      // Reset selected user
      setSelectedUser(null);
    }
  };

  const handleDelete = (id: string) => {
    setConfirmDelete(id);
  };

  const confirmDeleteAccount = async () => {
    if (confirmDelete) {
      try {
        setLoading(true);
        setLoadingMessage('Deleting user account...');
        
        const token = await getToken();
        if (!token) {
          throw new Error('Authentication token not found');
        }
        
        const response = await axios.delete(`/api/admin/users?id=${confirmDelete}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data.success) {
          setUsers(users.filter(user => user._id !== confirmDelete));
          setError(null);
        } else {
          setError(response.data.error || 'Failed to delete user account');
        }
      } catch (err: any) {
        console.error('Error deleting user:', err);
        setError(err.response?.data?.error || err.message || 'An error occurred while deleting user');
      } finally {
        setConfirmDelete(null);
        setLoading(false);
      }
    }
  };

  const cancelDelete = () => {
    setConfirmDelete(null);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
  };

  const clearFilters = () => {
    // Clear any pending search timeouts
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    
    setSearchQuery('');
    fetchUsers();
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

  const initiateDeactivation = (user: User) => {
    console.log('Initiating deactivation for user:', user);
    setSelectedUser(user);
    setShowDeactivationModal(true);
  };

  const handleDeactivationConfirm = (reason: string) => {
    console.log('Deactivation confirmed with reason:', reason);
    
    if (!reason || !reason.trim()) {
      console.error('Empty deactivation reason provided, using default');
      reason = 'No specific reason provided';
    }
    
    // Store the reason as a backup
    try {
      localStorage.setItem('lastDeactivationReason', reason);
      console.log('Stored deactivation reason in localStorage as backup:', reason);
    } catch (error) {
      console.error('Error storing deactivation reason in localStorage:', error);
    }
    
    if (selectedUser) {
      // This is important: the reason must be passed to the API
      console.log(`Deactivating user ${selectedUser._id} (${selectedUser.firstName} ${selectedUser.lastName}) with reason: "${reason}"`);
      
      handleStatusChangeWithReason(selectedUser._id, UserStatus.INACTIVE, reason);
      setShowDeactivationModal(false);
    } else {
      console.error('No user selected for deactivation');
      setError('No user selected for deactivation');
    }
  };

  // Optimized navigation function to prevent double fetches
  const navigateToArchive = () => {
    // Set navigation flag to prevent additional fetches
    isNavigatingRef.current = true;
    
    // Clear users state to force a fresh fetch when returning
    setUsers([]);
    
    // Ensure any in-progress operations are canceled
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    
    // Use replace instead of push to avoid browser history issues
    router.replace('/admin/archive');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Administrator Accounts</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => router.replace('/admin/archive')}
            className="px-4 py-2 bg-gray-600 text-white font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Archive
          </button>
          <Link
            href="/admin/create"
            className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Create New Account
          </Link>
        </div>
      </div>

      <Card>
        <div className="p-6">
          <div className="flex items-center mb-4">
            <UserGroupIcon className="h-8 w-8 text-indigo-600" />
            <h2 className="ml-3 text-lg font-medium text-gray-900">Administrator Accounts</h2>
          </div>
          <p className="text-gray-600 mb-6">Manage system administrator accounts, approve new registrations, and set permissions.</p>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Filters and Search */}
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
                  onClick={clearFilters}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Confirmation Dialog */}
          {confirmDelete && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Deletion</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this user account? This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-3">
                  <button 
                    onClick={cancelDelete}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmDeleteAccount}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-md">
              <BriefcaseIcon className="h-12 w-12 text-gray-400 mb-2" />
              <h3 className="text-lg font-medium text-gray-900">No user accounts found</h3>
              <p className="text-gray-500 text-center mt-1">
                {searchQuery 
                  ? 'Try changing your search criteria'
                  : 'Start by creating a new user account'
                }
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
                                    console.log(`Viewing deactivation reason for ${user.firstName} ${user.lastName}:`, reason);
                                    
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
                            {user.status === UserStatus.PENDING && (
                              <button 
                                onClick={() => handleStatusChange(user._id, UserStatus.ACTIVE)}
                                className="text-green-600 hover:text-green-900 mx-1 px-3 py-1 border border-green-600 rounded-md"
                                title="Approve Account"
                              >
                                Activate
                              </button>
                            )}
                            
                            {user.status === UserStatus.ACTIVE && (
                              <button 
                                onClick={() => initiateDeactivation(user)}
                                className="text-yellow-600 hover:text-yellow-900 mx-1 px-3 py-1 border border-yellow-600 rounded-md"
                                title="Deactivate Account"
                              >
                                Deactivate
                              </button>
                            )}
                            
                            {user.status === UserStatus.INACTIVE && (
                              <button 
                                onClick={() => handleStatusChange(user._id, UserStatus.ACTIVE)}
                                className="text-green-600 hover:text-green-900 mx-1 px-3 py-1 border border-green-600 rounded-md"
                                title="Reactivate Account"
                              >
                                Activate
                              </button>
                            )}
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

      {/* Deactivation Reason Modal */}
      {selectedUser && (
        <DeactivationReasonModal
          isOpen={showDeactivationModal}
          onClose={() => setShowDeactivationModal(false)}
          onConfirm={handleDeactivationConfirm}
          userName={getFullName(selectedUser)}
        />
      )}
    </div>
  );
} 