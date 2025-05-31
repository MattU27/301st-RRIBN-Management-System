"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { toast } from 'react-hot-toast';
import { 
  DocumentTextIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon, 
  PlusCircleIcon,
  DocumentPlusIcon,
  ShieldCheckIcon,
  ClockIcon,
  ArrowLeftIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';

// Define policy types locally instead of importing from model
export enum PolicyStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

export enum PolicyCategory {
  OPERATIONS = 'Operations',
  SAFETY = 'Safety',
  HR = 'HR',
  FINANCE = 'Finance',
  SECURITY = 'Security',
  COMPLIANCE = 'Compliance',
  TRAINING = 'Training',
  PROMOTIONS = 'Promotions',
  GENERAL = 'General',
  CUSTOM = 'Custom'
}

interface Policy {
  _id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  version: string;
  status: 'draft' | 'published' | 'archived';
  effectiveDate: string;
  expirationDate?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  documentUrl?: string;
}

export default function PoliciesPage() {
  const { user, isAuthenticated, isLoading, getToken } = useAuth();
  const router = useRouter();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Load policies data from the database
  useEffect(() => {
    if (user) {
      setLoading(true);
      
      const fetchPolicies = async () => {
        try {
          // Get token from auth context
          const token = await getToken();
          
          if (!token) {
            console.error('No token available');
            toast.error('Authentication token is missing');
            setLoading(false);
            return;
          }
          
          console.log('Fetching policies with token:', token.substring(0, 15) + '...');
          
          // Make API request to fetch policies
          const response = await fetch('/api/policies', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          console.log('Policies API response status:', response.status);
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error('Error response data:', errorData);
            throw new Error(errorData.error || 'Failed to fetch policies');
          }
          
          const data = await response.json();
          console.log(`Retrieved ${data.policies?.length || 0} policies from API`);
          setPolicies(data.policies || []);
        } catch (error) {
          console.error('Error fetching policies:', error);
          toast.error(error instanceof Error ? error.message : 'Failed to load policies');
          setPolicies([]);
        } finally {
          setLoading(false);
        }
      };
      
      fetchPolicies();
    }
  }, [user]);

  const filteredPolicies = () => {
    if (activeTab === 'all') {
      return policies;
    }
    return policies.filter(policy => policy.status === activeTab);
  };

  const handleViewPolicy = (policy: Policy) => {
    setSelectedPolicy(policy);
    setShowViewModal(true);
  };

  const handleEditPolicy = (policyId: string) => {
    // Use href instead of router.push to ensure a full page navigation
    window.location.href = `/policies/edit/${policyId}`;
  };

  const handleDeleteClick = (policyId: string) => {
    setPolicyToDelete(policyId);
    setShowDeleteConfirmation(true);
  };

  const handleArchivePolicy = async () => {
    if (!policyToDelete) return;
    
    try {
      const token = await getToken();
      
      // Call API to archive the policy
      const response = await fetch(`/api/policies?id=${policyToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to archive policy');
      }
      
      // Update local state
      const updatedPolicies = policies.map(policy => 
        policy._id === policyToDelete 
          ? {...policy, status: PolicyStatus.ARCHIVED} 
          : policy
      );
      
      setPolicies(updatedPolicies);
      toast.success('Policy archived successfully');
    } catch (error) {
      console.error('Error archiving policy:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to archive policy');
    } finally {
      setPolicyToDelete(null);
      setShowDeleteConfirmation(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <ShieldCheckIcon className="h-4 w-4 mr-1" />
            Published
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <PencilIcon className="h-4 w-4 mr-1" />
            Draft
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <ClockIcon className="h-4 w-4 mr-1" />
            Archived
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {user.role !== 'staff' && (
              <Button 
                variant="secondary" 
                onClick={() => router.back()}
                className="mr-4"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back
              </Button>
            )}
            <h1 className="text-2xl font-bold text-gray-900">Policy</h1>
          </div>
          {user.role !== 'administrator' && (
            <Button
              variant="primary"
              onClick={() => router.push('/policy/upload')}
              className="flex items-center"
            >
              <DocumentPlusIcon className="h-5 w-5 mr-2" />
              Upload Policy
            </Button>
          )}
        </div>
        <p className="text-sm text-gray-500">View available policies and upload new policy documents</p>
      </div>

      <Card>
        <div className="border-b border-gray-200">
          <nav className="flex" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('all')}
              className={`${
                activeTab === 'all'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
            >
              All Policies
            </button>
            <button
              className={`${
                activeTab === 'published'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
              onClick={() => setActiveTab('published')}
            >
              Published
            </button>
            <button
              className={`${
                activeTab === 'draft'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
              onClick={() => setActiveTab('draft')}
            >
              Drafts
            </button>
            <button
              className={`${
                activeTab === 'archived'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
              onClick={() => setActiveTab('archived')}
            >
              Archived
            </button>
          </nav>
        </div>

        <div className="mt-6">
          {filteredPolicies().length === 0 ? (
            <div className="text-center py-12">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No policies found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {activeTab === 'all' 
                  ? 'Get started by creating a new policy.' 
                  : activeTab === 'published'
                  ? 'There are no published policies available.'
                  : activeTab === 'draft'
                  ? 'There are no policy drafts available.'
                  : 'There are no archived policies.'}
              </p>
              {['director'].includes(user.role) && activeTab === 'all' && (
                <div className="mt-6">
                  <Button
                    variant="primary"
                    onClick={() => router.push('/policies/new')}
                    className="inline-flex items-center"
                  >
                    <PlusCircleIcon className="h-5 w-5 mr-2" />
                    New Policy
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Version
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Effective Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPolicies().map((policy) => (
                    <tr key={policy._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">{policy.title}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{policy.category}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{policy.version}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(policy.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(policy.effectiveDate)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => handleViewPolicy(policy)}
                            variant="secondary"
                            size="sm"
                            className="px-2 py-1 text-xs"
                          >
                            View
                          </Button>
                          {['admin', 'administrator'].includes(user.role) && policy.status !== 'archived' && (
                            <Button
                              onClick={() => handleDeleteClick(policy._id)}
                              variant="secondary" 
                              size="sm"
                              className="px-2 py-1 text-xs"
                            >
                              Archive
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/* View Policy Modal - Enhanced for better readability */}
      {showViewModal && selectedPolicy && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-800 opacity-80"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle w-full max-w-6xl">
              {/* Header with title and close button */}
              <div className="bg-white px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-indigo-100 rounded-full p-2 mr-3">
                      <DocumentTextIcon className="h-6 w-6 text-indigo-600" aria-hidden="true" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 leading-tight truncate max-w-[500px]">{selectedPolicy.title}</h2>
                  </div>
                  <button
                    type="button"
                    className="rounded-md p-2 hover:bg-gray-100 focus:outline-none"
                    onClick={() => setShowViewModal(false)}
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Metadata badges */}
              <div className="bg-gray-50 px-6 py-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  Category: {selectedPolicy.category}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                  Version: {selectedPolicy.version}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                  Effective: {formatDate(selectedPolicy.effectiveDate)}
                </span>
                {selectedPolicy.expirationDate && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                    Expires: {formatDate(selectedPolicy.expirationDate)}
                  </span>
                )}
                {getStatusBadge(selectedPolicy.status)}
              </div>
              
              {/* Main content area */}
              <div className="bg-white px-6 py-5">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  {/* Left side - Policy description and content */}
                  <div className="lg:col-span-3">
                    <div className="mb-5">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
                      <div className="bg-gray-50 p-4 rounded-md">
                        <div className="text-gray-700 whitespace-pre-wrap break-words overflow-auto max-h-[150px] text-sm">
                          {selectedPolicy.description}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Policy Content</h3>
                      <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-80">
                        <div className="text-gray-700 whitespace-pre-wrap break-words text-sm">
                          {selectedPolicy.content}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right side - Document preview & actions */}
                  <div className="lg:col-span-2">
                    <div className="bg-gray-50 p-4 rounded-md h-full flex flex-col justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Document</h3>
                        <div className="flex justify-center mb-4">
                          <div className="w-32 h-40 bg-white border border-gray-300 shadow-sm rounded-md flex items-center justify-center">
                            <DocumentTextIcon className="h-16 w-16 text-indigo-300" />
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 text-center mb-6">
                          This policy was uploaded as a file. Please use the buttons below to view or download the attached document.
                        </p>
                      </div>
                      
                      <div className="mt-auto space-y-3">
                        <button
                          type="button"
                          onClick={() => {
                            try {
                              // Always use the policy ID for reliable document retrieval
                              const viewUrl = `/api/policies/document?id=${selectedPolicy._id}`;
                              const newWindow = window.open(viewUrl, '_blank');
                              
                              // Add an error handler in case the document can't be loaded
                              setTimeout(() => {
                                if (newWindow && newWindow.document.body.textContent?.includes('error')) {
                                  toast.error('There was a problem loading the document. A placeholder has been created.');
                                }
                              }, 1000);
                            } catch (error) {
                              console.error('Error opening document:', error);
                              toast.error('Failed to open document. Please try again.');
                            }
                          }}
                          className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                        >
                          <EyeIcon className="h-5 w-5 mr-2" />
                          View Document
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => {
                            try {
                              // Download option
                              const downloadUrl = `/api/policies/document?id=${selectedPolicy._id}&download=true`;
                              const newWindow = window.open(downloadUrl, '_blank');
                              
                              // Add an error handler in case the document can't be downloaded
                              setTimeout(() => {
                                if (newWindow && newWindow.document.body.textContent?.includes('error')) {
                                  toast.error('There was a problem downloading the document. A placeholder has been created.');
                                }
                              }, 1000);
                            } catch (error) {
                              console.error('Error downloading document:', error);
                              toast.error('Failed to download document. Please try again.');
                            }
                          }}
                          className="w-full inline-flex justify-center items-center px-4 py-3 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download PDF
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Footer with actions */}
              <div className="bg-gray-50 px-6 py-3 flex justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setShowViewModal(false)}
                  className="w-auto sm:text-sm"
                >
                  Close
                </Button>
                {['admin', 'director'].includes(user.role) && selectedPolicy.status !== 'archived' && (
                  <Button
                    variant="primary"
                    onClick={() => {
                      setShowViewModal(false);
                      handleEditPolicy(selectedPolicy._id);
                    }}
                    className="ml-3 w-auto sm:text-sm"
                  >
                    Edit Policy
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ArchiveBoxIcon className="h-6 w-6 text-yellow-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Archive Policy</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to archive this policy? It will no longer be active but can still be viewed in the archive.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button
                  variant="warning"
                  onClick={handleArchivePolicy}
                  className="w-full sm:w-auto sm:text-sm"
                >
                  Archive
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowDeleteConfirmation(false)}
                  className="mt-3 w-full sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 