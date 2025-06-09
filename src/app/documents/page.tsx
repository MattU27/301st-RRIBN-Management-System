"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { DocumentService } from '@/services/DocumentService';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { 
  DocumentTextIcon, 
  DocumentCheckIcon,
  DocumentMagnifyingGlassIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  XMarkIcon,
  ShieldExclamationIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import ConfirmationDialog from '@/components/ConfirmationDialog';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import DocumentViewer from '@/components/DocumentViewer';
import { useSocket } from '@/contexts/SocketContext';
import { DocumentTypeLabels, DocumentType } from '@/types/document';

type DocumentStatus = 'verified' | 'pending' | 'rejected';

interface Document {
  _id: string;
  name: string;
  type: string;
  uploadDate: string;
  status: DocumentStatus;
  verifiedBy?: string;
  verifiedDate?: string;
  comments?: string;
  fileUrl: string;
  expirationDate?: string;
  userId?: string;
  uploadedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    serviceId: string;
    company?: string;
  };
}

// Add a token refresh utility function
const refreshTokenIfNeeded = async () => {
  try {
    // Check if token is expired or about to expire
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    // Simple check for token expiration - this is a basic implementation
    // In a production app, you might want to decode the token and check its expiry
    const tokenData = JSON.parse(atob(token.split('.')[1]));
    const expiryTime = tokenData.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    
    // If token expires in less than 5 minutes, refresh it
    if (expiryTime - currentTime < 300000) {
      console.log('Token is about to expire, refreshing...');
      const response = await axios.post('/api/auth/refresh', {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success && response.data.token) {
        localStorage.setItem('token', response.data.token);
        return response.data.token;
      }
    }
    
    return token;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
};

export default function DocumentsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'verified' | 'pending' | 'rejected'>('all');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [documentToVerify, setDocumentToVerify] = useState<Document | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Add filter states
  const [filterServiceId, setFilterServiceId] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [companies, setCompanies] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const { socket } = useSocket();

  // Listen for real-time document updates
  useEffect(() => {
    if (!socket) return;

    // Listen for new document events
    socket.on('document:new', (newDocument) => {
      console.log('New document received:', newDocument);
      
      // Add the new document to the state
      setDocuments((prevDocs) => [newDocument, ...prevDocs]);
      
      // Show a notification
      toast.success('New document uploaded');
    });

    // Listen for document update events
    socket.on('document:update', (updatedDocument) => {
      console.log('Document updated:', updatedDocument);
      
      // Update the document in the state
      setDocuments((prevDocs) => 
        prevDocs.map((doc) => 
          doc._id === updatedDocument._id ? updatedDocument : doc
        )
      );
    });

    // Listen for document delete events
    socket.on('document:delete', (deletedDocId) => {
      console.log('Document deleted:', deletedDocId);
      
      // Remove the document from the state
      setDocuments((prevDocs) => 
        prevDocs.filter((doc) => doc._id !== deletedDocId)
      );
    });

    return () => {
      // Clean up listeners
      socket.off('document:new');
      socket.off('document:update');
      socket.off('document:delete');
    };
  }, [socket]);

  // Fetch documents from API
  const fetchDocuments = async () => {
    try {
      setIsLoaded(false);
      console.log('Fetching documents...');
      
      // Use the new document service
      const response = await DocumentService.getAllDocuments();
      
      console.log('API response:', response);

      if (response.success) {
        const docs = response.data.documents;
        console.log('Documents received:', docs.length);
        console.log('Sample document:', docs.length > 0 ? docs[0] : 'No documents');
        
        setDocuments(docs);
        
        // Extract unique companies for the filter dropdown
        const uniqueCompanies = Array.from(
          new Set(
            docs
              .filter((doc: Document) => doc.uploadedBy?.company)
              .map((doc: Document) => doc.uploadedBy?.company)
          )
        );
        console.log('Unique companies:', uniqueCompanies);
        setCompanies(uniqueCompanies as string[]);
      } else {
        console.error('API returned success: false');
        toast.error('Failed to load documents: ' + (response.error || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      
      // More detailed error handling
      let errorMessage = 'Failed to load documents';
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        errorMessage += `: Server returned ${error.response.status}`;
        
        // Check if there's a more specific error message from the API
        if (error.response.data && error.response.data.error) {
          errorMessage += ` - ${error.response.data.error}`;
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Error request:', error.request);
        errorMessage += ': No response received from server';
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', error.message);
        errorMessage += `: ${error.message}`;
      }
      
      toast.error(errorMessage);
      
      // Set empty documents to avoid showing loading state indefinitely
      setDocuments([]);
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      fetchDocuments();
    }
  }, [isLoading, isAuthenticated, router]);

  const handleDeleteDocumentClick = (id: string) => {
    setDocumentToDelete(id);
    setShowDeleteConfirmation(true);
  };

  const handleDeleteDocument = async () => {
    if (!documentToDelete) return;
    
    try {
      // Try to refresh the token if needed
      const token = await refreshTokenIfNeeded() || localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
        router.push('/login');
        return;
      }
      
      const response = await axios.delete(`/api/documents?id=${documentToDelete}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setDocuments(documents.filter(doc => doc._id !== documentToDelete));
        toast.success('Document deleted successfully');
      } else {
        throw new Error(response.data.error || 'Failed to delete document');
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      
      // Check for authentication errors
      if (error.response && error.response.status === 401) {
        toast.error('Session expired. Please log in again.');
        localStorage.removeItem('token');
        router.push('/login');
        return;
      }
      
      toast.error(error.message || 'Failed to delete document');
    } finally {
      setDocumentToDelete(null);
      setShowDeleteConfirmation(false);
    }
  };

  const handleViewDocument = (document: Document) => {
    setSelectedDocument(document);
    setShowDocumentViewer(true);
  };

  const handleVerifyDocumentClick = (document: Document) => {
    setDocumentToVerify(document);
    setShowVerifyModal(true);
    setRejectReason('');
  };

  const handleVerifyDocument = async (approved: boolean) => {
    if (!documentToVerify) return;
    
    setIsVerifying(true);
    try {
      // Try to refresh the token if needed
      const token = await refreshTokenIfNeeded() || localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
        router.push('/login');
        return;
      }
      
      const response = await axios.put('/api/documents', {
        id: documentToVerify._id,
        status: approved ? 'verified' : 'rejected',
        comments: !approved ? rejectReason : undefined
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        // Update document in the list
        setDocuments(prevDocs => 
          prevDocs.map(doc => 
            doc._id === documentToVerify._id ? response.data.data.document : doc
          )
        );
        
        toast.success(`Document ${approved ? 'verified' : 'rejected'} successfully`);
        setShowVerifyModal(false);
        setDocumentToVerify(null);
      } else {
        throw new Error(response.data.error || 'Failed to update document status');
      }
    } catch (error: any) {
      console.error('Document verification error:', error);
      
      // Check for authentication errors
      if (error.response && error.response.status === 401) {
        toast.error('Session expired. Please log in again.');
        localStorage.removeItem('token');
        router.push('/login');
        return;
      }
      
      toast.error(error.message || 'Failed to update document status');
    } finally {
      setIsVerifying(false);
    }
  };

  // Apply filters
  const filteredDocuments = activeTab === 'all' 
    ? documents 
    : documents.filter(doc => doc.status === activeTab);
  
  // Apply additional filters (service ID and company)
  const finalFilteredDocuments = filteredDocuments.filter((doc: Document) => {
    // Filter by service ID if provided
    if (filterServiceId && doc.uploadedBy?.serviceId) {
      if (!doc.uploadedBy.serviceId.toLowerCase().includes(filterServiceId.toLowerCase())) {
        return false;
      }
    }
    
    // Filter by company if provided
    if (filterCompany && doc.uploadedBy?.company) {
      if (doc.uploadedBy.company !== filterCompany) {
        return false;
      }
    }
    
    return true;
  });

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="w-4 h-4 mr-1" />
            Verified
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ClockIcon className="w-4 h-4 mr-1" />
            Pending
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <ExclamationCircleIcon className="w-4 h-4 mr-1" />
            Rejected
          </span>
        );
    }
  };

  // Determine if the user can verify documents
  const canVerifyDocuments = user && ['admin', 'director', 'staff'].includes(user.role);
  
  // Determine if user is an administrator (for RIDS permissions)
  const isAdministrator = user && user.role === 'administrator';

  // Format document type for display
  const formatDocumentType = (type: string): string => {
    // Try to map to our defined document types
    if (Object.values(DocumentType).includes(type as DocumentType)) {
      return DocumentTypeLabels[type as DocumentType];
    }
    
    // Fallback for legacy document types
    const typeMapping: { [key: string]: string } = {
      'training_certificate': 'Training Certificate',
      'medical_record': 'Medical Certificate',
      'identification': 'Identification',
      'promotion': 'Promotion Order',
      'commendation': 'Commendation',
      'other': 'Other Document'
    };
    
    return typeMapping[type] || type;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-t-2 border-b-2 border-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Count of pending documents
  const pendingCount = documents.filter(doc => doc.status === 'pending').length;

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="flex flex-col mb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="mt-1 text-sm text-gray-500">
            View, verify, and manage documents
          </p>
        </div>
        <div className="flex mt-4 space-x-2 md:mt-0">
          <Button
            variant="primary"
            onClick={() => router.push('/documents/upload')}
            className="flex items-center"
          >
            <DocumentTextIcon className="w-5 h-5 mr-2" />
            Upload Document
          </Button>
          
          {/* RIDS Button - with different text for administrator vs staff/admin/director */}
          {user && (['staff', 'admin', 'director', 'administrator'].includes(user.role)) && (
            <Button
              variant="secondary"
              onClick={() => router.push('/documents/rids')}
              className="flex items-center"
            >
              {isAdministrator ? (
                <>
                  <EyeIcon className="w-5 h-5 mr-2" />
                  View RIDS
                </>
              ) : (
                <>
                  <DocumentCheckIcon className="w-5 h-5 mr-2" />
                  Manage RIDS
                </>
              )}
            </Button>
          )}
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-indigo-100 rounded-full">
                <DocumentTextIcon className="w-8 h-8 text-indigo-600" />
              </div>
              <div className="ml-4">
                <h2 className="text-lg font-medium text-gray-900">Document Verification</h2>
                <p className="text-sm text-gray-500">
                  Review, verify, and manage documents for the 301st
                </p>
              </div>
            </div>
            {canVerifyDocuments && pendingCount > 0 && (
              <div className="p-4 border-l-4 border-yellow-400 rounded bg-yellow-50">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <ShieldExclamationIcon className="w-5 h-5 text-yellow-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      <span className="font-medium">{pendingCount} document{pendingCount !== 1 ? 's' : ''}</span> pending verification
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <Card>
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px space-x-8">
              <button
                className={`${
                  activeTab === 'all'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
                onClick={() => setActiveTab('all')}
              >
                All Documents
              </button>
              <button
                className={`${
                  activeTab === 'verified'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
                onClick={() => setActiveTab('verified')}
              >
                Verified
              </button>
              <button
                className={`${
                  activeTab === 'pending'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm relative`}
                onClick={() => setActiveTab('pending')}
              >
                Pending
                {pendingCount > 0 && (
                  <span className="absolute flex items-center justify-center w-5 h-5 text-xs text-white bg-indigo-600 rounded-full -top-1 -right-1">
                    {pendingCount}
                  </span>
                )}
              </button>
              <button
                className={`${
                  activeTab === 'rejected'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
                onClick={() => setActiveTab('rejected')}
              >
                Rejected
              </button>
              
              {/* Filter toggle button */}
              <button
                className={`ml-auto whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
                  showFilters ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                  </svg>
                  Filters
                </div>
              </button>
            </nav>
          </div>

          {/* Filter section */}
          {showFilters && (
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="serviceId" className="block mb-1 text-sm font-medium text-gray-700">
                    Service ID
                  </label>
                  <input
                    type="text"
                    id="serviceId"
                    value={filterServiceId}
                    onChange={(e) => setFilterServiceId(e.target.value)}
                    placeholder="Filter by Service ID"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="company" className="block mb-1 text-sm font-medium text-gray-700">
                    Company
                  </label>
                  <select
                    id="company"
                    value={filterCompany}
                    onChange={(e) => setFilterCompany(e.target.value)}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="">All Companies</option>
                    {companies.map((company) => (
                      <option key={company} value={company}>
                        {company}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => {
                    setFilterServiceId('');
                    setFilterCompany('');
                  }}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}

          <div className="mt-6">
            {finalFilteredDocuments.length === 0 ? (
              <div className="py-12 text-center">
                <DocumentTextIcon className="w-12 h-12 mx-auto text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No documents found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {activeTab === 'all' 
                    ? 'There are no documents to manage.' 
                    : `You don't have any ${activeTab} documents.`}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        Document
                      </th>
                      <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        Upload Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        Uploaded By
                      </th>
                      <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {finalFilteredDocuments.map((document) => (
                      <tr key={document._id} className={document.status === 'pending' ? 'bg-yellow-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <DocumentTextIcon className="w-5 h-5 mr-3 text-gray-400" />
                            <div className="text-sm font-medium text-gray-900">{document.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{formatDocumentType(document.type)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(document.status)}
                          {document.status === 'rejected' && document.comments && (
                            <div className="mt-1 text-xs text-red-600">{document.comments}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{document.uploadDate}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {document.uploadedBy ? (
                            <div className="text-sm text-gray-900">
                              <div>{document.uploadedBy.firstName} {document.uploadedBy.lastName}</div>
                              <div className="text-xs text-gray-500">
                                {document.uploadedBy.serviceId}
                                {document.uploadedBy.company && (
                                  <span className="ml-1">| {document.uploadedBy.company}</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">Unknown</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                          <div className="flex space-x-2">
                            <button 
                              className="text-indigo-600 hover:text-indigo-900 tooltip"
                              onClick={() => handleViewDocument(document)}
                            >
                              <DocumentMagnifyingGlassIcon className="w-5 h-5" />
                              <span className="tooltiptext">View</span>
                            </button>
                            
                            {canVerifyDocuments && document.status === 'pending' && (
                              <button 
                                className="text-green-600 hover:text-green-900 tooltip"
                                onClick={() => handleVerifyDocumentClick(document)}
                              >
                                <DocumentCheckIcon className="w-5 h-5" />
                                <span className="tooltiptext">Verify</span>
                              </button>
                            )}

                            {canVerifyDocuments && (
                              <button 
                                className="text-red-600 hover:text-red-900 tooltip"
                                onClick={() => handleDeleteDocumentClick(document._id)}
                              >
                                <TrashIcon className="w-5 h-5" />
                                <span className="tooltiptext">Delete</span>
                              </button>
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
      </div>

      {/* Document Viewer Modal */}
      {showDocumentViewer && selectedDocument && (
        <DocumentViewer 
          document={selectedDocument} 
          onClose={() => setShowDocumentViewer(false)} 
        />
      )}

      {/* Verification Modal */}
      {showVerifyModal && documentToVerify && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="px-4 pt-5 pb-4 bg-white sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 mx-auto bg-indigo-100 rounded-full sm:mx-0 sm:h-10 sm:w-10">
                    <DocumentCheckIcon className="w-6 h-6 text-indigo-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">
                      Verify Document
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Please verify or reject the document "{documentToVerify.name}"
                      </p>
                      
                      <div className="mt-4 space-y-4">
                        <div>
                          <label htmlFor="rejectReason" className="block text-sm font-medium text-gray-700">
                            Reason for rejection (optional)
                          </label>
                          <textarea
                            id="rejectReason"
                            placeholder="Enter reason for rejection"
                            className="block w-full px-3 py-2 mt-1 text-gray-700 border rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            rows={4}
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 bg-gray-50 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button
                  variant="primary"
                  onClick={() => handleVerifyDocument(true)}
                  disabled={isVerifying}
                  isLoading={isVerifying}
                  className="w-full sm:w-auto sm:ml-3"
                >
                  Verify
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleVerifyDocument(false)}
                  disabled={isVerifying}
                  isLoading={isVerifying}
                  className="w-full mt-3 sm:w-auto sm:mt-0 sm:ml-3"
                >
                  Reject
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowVerifyModal(false);
                    setDocumentToVerify(null);
                    setRejectReason('');
                  }}
                  disabled={isVerifying}
                  className="w-full mt-3 sm:w-auto sm:mt-0"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={handleDeleteDocument}
        title="Delete Document"
        message="Are you sure you want to delete this document? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
} 