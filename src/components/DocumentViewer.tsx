'use client';

import { useState, useEffect } from 'react';
import { DocumentVersion } from '@/types/personnel';
import { 
  DocumentTextIcon, 
  ArrowDownTrayIcon, 
  ClockIcon, 
  UserIcon, 
  ShieldCheckIcon,
  DocumentDuplicateIcon,
  ArrowUpTrayIcon,
  XMarkIcon,
  ExclamationCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import Button from './Button';
import DocumentVersionHistory from './DocumentVersionHistory';
import ConfirmationDialog from './ConfirmationDialog';
import { DocumentTypeLabels, DocumentType as DocType } from '@/types/document';
import { toast } from 'react-hot-toast';

type DocumentStatus = 'verified' | 'pending' | 'rejected';

interface Document {
  _id: string;
  name: string;
  type: string;
  uploadDate: string;
  status: DocumentStatus;
  verifiedBy?: string | {
    _id: string;
    firstName?: string;
    lastName?: string;
    serviceId?: string;
    rank?: string;
    name?: string;
  };
  verifiedDate?: string;
  comments?: string;
  fileUrl?: string;
  expirationDate?: string;
  uploadedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    serviceId?: string;
    serviceNumber?: string;
    company?: string;
    rank?: string;
  };
}

interface DocumentViewerProps {
  document: Document;
  onClose: () => void;
}

export default function DocumentViewer({ document, onClose }: DocumentViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Get the document URL based on the document ID
  const getDocumentUrl = (id: string, download: boolean = false): string => {
    console.log('Getting document URL for ID:', id);
    
    // If the document has a direct fileUrl that's not empty
    if (document.fileUrl && document.fileUrl.trim() !== '') {
      console.log('Document has fileUrl:', document.fileUrl);
      
      // Check if it's a gridfs URL and convert it to our API endpoint
      if (document.fileUrl.startsWith('gridfs://')) {
        const gridFsId = document.fileUrl.replace('gridfs://', '');
        console.log('Converting gridfs URL to API endpoint, ID:', gridFsId);
        
        // Use the files API endpoint which works with GridFS IDs directly
        const tokenParam = token ? `&token=${encodeURIComponent(token)}` : '';
        return `/api/files/${gridFsId}${download ? '?download=true' : ''}${download ? tokenParam.replace('&', '&') : tokenParam}`;
      }
      
      // If it's already an API URL, use it directly
      if (document.fileUrl.startsWith('/api/')) {
        return document.fileUrl + (download ? '?download=true' : '');
      }
      
      return document.fileUrl;
    }
    
    // Otherwise use our API endpoint with the document ID
    const tokenParam = token ? `&token=${encodeURIComponent(token)}` : '';
    return `/api/documents/document?id=${id}${download ? '&download=true' : ''}${tokenParam}`;
  };

  // Get token from localStorage on component mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    } else {
      setError('Authentication token not found. Please log in again.');
    }
  }, []);

  useEffect(() => {
    // Reset state when document changes
    setIsLoading(true);
    setError(null);
  }, [document]);

  // Handle loading state change
  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  // Handle iframe error
  const handleIframeError = () => {
    setIsLoading(false);
    setError('Failed to load document. The file might be corrupted or in an unsupported format.');
  };

  // Handle API error response
  const handleApiError = (errorResponse: any) => {
    setIsLoading(false);
    
    let errorMessage = 'Failed to load document.';
    
    if (errorResponse && typeof errorResponse === 'object') {
      if (errorResponse.error) {
        errorMessage = `Error: ${errorResponse.error}`;
        
        // Add details if available
        if (errorResponse.details) {
          errorMessage += ` - ${errorResponse.details}`;
        }
        
        // Add database info if available
        if (errorResponse.database) {
          errorMessage += ` (Database: ${errorResponse.database})`;
        }
      }
    }
    
    setError(errorMessage);
  };

  // Get document type for display
  const getDocumentType = (type: string): string => {
    // Try to map to our defined document types
    if (Object.values(DocType).includes(type as DocType)) {
      return DocumentTypeLabels[type as DocType];
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

  // Get status badge
  const getStatusBadge = (status: string) => {
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
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Unknown
          </span>
        );
    }
  };

  // Handle download
  const handleDownload = async () => {
    if (!document._id && !document.fileUrl) {
      setError('Document ID or URL not available');
      return;
    }

    try {
      // Create a download URL
      const downloadUrl = getDocumentUrl(document._id, true);
      console.log('Downloading document from:', downloadUrl);
      
      // Check if document is available before downloading
      setIsLoading(true);
      const checkResponse = await fetch(downloadUrl, { 
        method: 'HEAD',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (!checkResponse.ok) {
        console.error('Download check failed with status:', checkResponse.status);
        
        // Try to get error details from response
        try {
          const contentType = checkResponse.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await checkResponse.json();
            console.error('Download error details:', errorData);
            handleApiError(errorData);
            toast.error('Download failed. Please try again.');
            return;
          }
        } catch (parseError) {
          // Continue with download attempt if we can't parse the error
        }
      }
      
      // Open in a new window/tab for download
      window.open(downloadUrl, '_blank');
      
      toast.success('Document download started');
    } catch (error) {
      console.error('Download error:', error);
      setError(`Failed to download: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast.error('Download failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle opening the document in a new tab
  const handleOpenDocument = async () => {
    if (!document._id && !document.fileUrl) {
      setError('Document ID or URL not available');
      return;
    }

    try {
      // Get the document URL
      const viewUrl = getDocumentUrl(document._id);
      console.log('Opening document URL:', viewUrl);
      
      // Check if document is available before opening
      setIsLoading(true);
      const checkResponse = await fetch(viewUrl, { 
        method: 'HEAD',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (!checkResponse.ok) {
        console.error('Document check failed with status:', checkResponse.status);
        
        // Try to get error details from response
        try {
          const contentType = checkResponse.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await checkResponse.json();
            console.error('Error details:', errorData);
            handleApiError(errorData);
            toast.error('Failed to open document. Please try again.');
            return;
          }
        } catch (parseError) {
          // Continue with open attempt if we can't parse the error
        }
      }
      
      // Open in a new tab
      window.open(viewUrl, '_blank');
    } catch (error) {
      console.error('Open document error:', error);
      setError(`Failed to open document: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast.error('Failed to open document. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Get the iframe source URL
  const getIframeSrc = (): string => {
    if (!document._id && !document.fileUrl) return 'about:blank';
    
    // Return the document URL
    return getDocumentUrl(document._id);
  };

  // Fetch document to check for errors before displaying in iframe
  useEffect(() => {
    if (!document._id && !document.fileUrl) return;
    
    const checkDocument = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const url = getDocumentUrl(document._id);
        console.log('Checking document availability at:', url);
        
        // Make a HEAD request to check if the document is available
        const response = await fetch(url, { 
          method: 'HEAD',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        
        if (!response.ok) {
          console.error('Document check failed with status:', response.status);
          
          // Try to get error details from response
          try {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const errorData = await response.json();
              console.error('Error details:', errorData);
              handleApiError(errorData);
            } else {
              setError(`Failed to load document: ${response.status} ${response.statusText}`);
            }
          } catch (parseError) {
            setError(`Failed to load document: ${response.status} ${response.statusText}`);
          }
          
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error checking document:', error);
        setError(`Failed to check document: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setIsLoading(false);
      }
    };
    
    checkDocument();
  }, [document._id, document.fileUrl, token]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full">
          <div className="px-4 pt-5 pb-4 bg-white sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 mx-auto bg-indigo-100 rounded-full sm:mx-0 sm:h-10 sm:w-10">
                <DocumentTextIcon className="w-6 h-6 text-indigo-600" aria-hidden="true" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Document Viewer
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    {document.name}
                  </p>
                </div>
              </div>
              <div className="flex-1"></div>
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 text-gray-400 bg-white rounded-md hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={onClose}
              >
                <span className="sr-only">Close</span>
                <XMarkIcon className="w-6 h-6" aria-hidden="true" />
              </button>
            </div>
            
            <div className="pt-4 mt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Document Type</h4>
                  <p className="mt-1 text-sm text-gray-900">{getDocumentType(document.type)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Status</h4>
                  <div className="mt-1">{getStatusBadge(document.status)}</div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Upload Date</h4>
                  <p className="mt-1 text-sm text-gray-900">{document.uploadDate}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Uploaded By</h4>
                  <p className="mt-1 text-sm text-gray-900">
                    {document.uploadedBy ? 
                      `${document.uploadedBy.firstName} ${document.uploadedBy.lastName} ${document.uploadedBy.serviceNumber ? `(${document.uploadedBy.serviceNumber})` : ''}` : 
                      'Unknown'}
                  </p>
                </div>
                {document.status === 'verified' && (
                  <>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Verified By</h4>
                      <p className="mt-1 text-sm text-gray-900">
                        {document.verifiedBy ? (
                          typeof document.verifiedBy === 'string' ? document.verifiedBy : 
                            `${document.verifiedBy.firstName || ''} ${document.verifiedBy.lastName || ''}`
                        ) : 'Staff Member'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Verified Date</h4>
                      <p className="mt-1 text-sm text-gray-900">{document.verifiedDate || 'Unknown'}</p>
                    </div>
                  </>
                )}
                {document.status === 'rejected' && document.comments && (
                  <div className="sm:col-span-2">
                    <h4 className="text-sm font-medium text-gray-500">Rejection Reason</h4>
                    <p className="mt-1 text-sm text-red-600">{document.comments}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 mt-6 rounded-md bg-gray-50">
              <div className="flex justify-end mb-4 space-x-2">
                <Button
                  variant="secondary"
                  onClick={handleOpenDocument}
                  className="flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Download Document
                </Button>
              </div>
              
              {/* Document preview */}
              <div className="relative overflow-hidden bg-gray-100 rounded-md" style={{ height: '70vh' }}>
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 border-t-2 border-b-2 border-indigo-500 rounded-full animate-spin"></div>
                  </div>
                )}
                
                {error && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-4 max-w-md">
                      <ExclamationCircleIcon className="w-12 h-12 text-red-500 mx-auto" />
                      <p className="mt-2 text-red-600 font-medium">{error}</p>
                      <div className="mt-4 bg-red-50 p-3 rounded-md">
                        <h4 className="text-sm font-medium text-red-800">Troubleshooting Steps:</h4>
                        <ul className="mt-2 text-sm text-red-700 list-disc pl-5">
                          <li>Check your internet connection</li>
                          <li>Verify that the MongoDB database (afp_personnel_db) is running</li>
                          <li>Make sure you have permission to access this document</li>
                          <li>Try refreshing the page and logging in again</li>
                        </ul>
                      </div>
                      <div className="mt-4">
                        <Button
                          variant="primary"
                          onClick={handleDownload}
                          className="flex items-center mx-auto"
                        >
                          <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                          Download File
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Use iframe for PDF preview */}
                <iframe
                  src={getIframeSrc()}
                  className="w-full h-full"
                  onLoad={handleIframeLoad}
                  onError={handleIframeError}
                  title={document.name}
                  sandbox="allow-same-origin allow-scripts"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
          <div className="px-4 py-3 bg-gray-50 sm:px-6 sm:flex sm:flex-row-reverse">
            <Button
              variant="secondary"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 