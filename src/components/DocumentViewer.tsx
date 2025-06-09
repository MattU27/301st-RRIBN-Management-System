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
  fileUrl: string;
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

  // Determine if the URL is a GridFS URL or a regular URL
  const isGridFSUrl = document.fileUrl && document.fileUrl.startsWith('/api/files/');

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
  const handleDownload = () => {
    window.open(document.fileUrl, '_blank');
  };

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
            
            <div className="mt-4 border-t border-gray-200 pt-4">
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
                      `${document.uploadedBy.firstName} ${document.uploadedBy.lastName} (${document.uploadedBy.serviceId})` : 
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
            
            <div className="mt-6 bg-gray-50 p-4 rounded-md">
              <div className="mb-4 flex justify-end">
                <Button
                  variant="secondary"
                  onClick={handleDownload}
                  className="flex items-center"
                >
                  <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                  Download
                </Button>
              </div>
              
              {/* Document preview */}
              <div className="relative bg-gray-100 rounded-md overflow-hidden" style={{ height: '70vh' }}>
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 border-t-2 border-b-2 border-indigo-500 rounded-full animate-spin"></div>
                  </div>
                )}
                
                {error && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-4">
                      <ExclamationCircleIcon className="w-12 h-12 text-red-500 mx-auto" />
                      <p className="mt-2 text-red-600">{error}</p>
                      <p className="mt-1 text-sm text-gray-500">
                        You can still download the file to view it locally.
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Use iframe for PDF preview */}
                <iframe
                  src={document.fileUrl}
                  className="w-full h-full"
                  onLoad={handleIframeLoad}
                  onError={handleIframeError}
                  title={document.name}
                  sandbox="allow-same-origin allow-scripts"
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