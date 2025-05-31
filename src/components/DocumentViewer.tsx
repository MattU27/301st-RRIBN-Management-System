'use client';

import { useState } from 'react';
import { Document as DocumentType, DocumentVersion } from '@/types/personnel';
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

type DocumentStatus = 'verified' | 'pending' | 'rejected';
type SecurityClassification = 'Unclassified' | 'Confidential' | 'Secret' | 'Top Secret';

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
  securityClassification: SecurityClassification;
  expirationDate?: string;
}

interface DocumentViewerProps {
  document: Document;
  onClose: () => void;
}

export default function DocumentViewer({ document: docData, onClose }: DocumentViewerProps) {
  const [showInfo, setShowInfo] = useState(true);

  const handleDownload = () => {
    // Create an anchor element and trigger download
    const link = document.createElement('a');
    link.href = docData.fileUrl;
    link.download = docData.name;
    
    // Append to the document body
    document.body.appendChild(link);
    
    // Trigger the download
    link.click();
    
    // Clean up
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="h-4 w-4 mr-1" />
            Verified
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ClockIcon className="h-4 w-4 mr-1" />
            Pending
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <ExclamationCircleIcon className="h-4 w-4 mr-1" />
            Rejected
          </span>
        );
    }
  };

  const getFileType = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    if (!extension) return 'unknown';
    
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(extension)) {
      return 'image';
    } else if (['pdf'].includes(extension)) {
      return 'pdf';
    } else if (['doc', 'docx'].includes(extension)) {
      return 'word';
    } else if (['xls', 'xlsx'].includes(extension)) {
      return 'excel';
    } else if (['ppt', 'pptx'].includes(extension)) {
      return 'powerpoint';
    } else {
      return 'unknown';
    }
  };

  const fileType = getFileType(docData.name);
  const isPreviewable = ['image', 'pdf'].includes(fileType);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col animate-fade-in-up">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center">
            <DocumentTextIcon className="h-6 w-6 text-indigo-600 mr-2" />
            <h2 className="document-title truncate max-w-2xl">
              {docData.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            aria-label="Close document viewer"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="flex-1 overflow-auto flex divide-x divide-gray-200">
          {/* Document preview pane */}
          <div className={`${showInfo ? 'w-3/4' : 'w-full'} h-full bg-gray-100 document-preview-container flex items-center justify-center p-4 relative`}>
            {isPreviewable ? (
              fileType === 'image' ? (
                <img 
                  src={docData.fileUrl} 
                  alt={docData.name} 
                  className="max-w-full max-h-[75vh] object-contain"
                />
              ) : (
                <iframe 
                  src={docData.fileUrl} 
                  className="w-full h-[75vh] border-0"
                  title={docData.name}
                />
              )
            ) : (
              <div className="text-center p-10">
                <div className="bg-indigo-100 mx-auto rounded-full p-3 h-20 w-20 flex items-center justify-center mb-4">
                  <DocumentTextIcon className="h-10 w-10 text-indigo-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  {docData.name}
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  This file type cannot be previewed
                </p>
                <Button
                  variant="primary"
                  onClick={handleDownload}
                  className="flex items-center mx-auto download-button py-3 px-6"
                  aria-label={`Download ${docData.name}`}
                >
                  <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                  Download File
                </Button>
              </div>
            )}
            
            <button 
              className="absolute top-2 right-2 bg-indigo-600 text-white rounded-full p-2 shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={() => setShowInfo(!showInfo)}
              title={showInfo ? "Hide details" : "Show details"}
              aria-label={showInfo ? "Hide document details" : "Show document details"}
            >
              {showInfo ? <XMarkIcon className="h-5 w-5" /> : <DocumentDuplicateIcon className="h-5 w-5" />}
            </button>
          </div>
          
          {/* Document info pane */}
          {showInfo && (
            <div className="w-1/4 h-full overflow-y-auto p-4 document-info-panel">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Document Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-gray-500">Status</div>
                      <div>{getStatusBadge(docData.status)}</div>
                      
                      <div className="text-gray-500">Type</div>
                      <div className="font-medium text-gray-900">{docData.type}</div>
                      
                      <div className="text-gray-500">Upload Date</div>
                      <div className="font-medium text-gray-900">{docData.uploadDate}</div>
                      
                      <div className="text-gray-500">Security</div>
                      <div className="font-medium text-gray-900">{docData.securityClassification}</div>
                      
                      {docData.expirationDate && (
                        <>
                          <div className="text-gray-500">Expiration</div>
                          <div className="font-medium text-gray-900">{docData.expirationDate}</div>
                        </>
                      )}
                      
                      {docData.verifiedBy && (
                        <>
                          <div className="text-gray-500">Verified By</div>
                          <div className="font-medium text-gray-900">{docData.verifiedBy}</div>
                        </>
                      )}
                      
                      {docData.verifiedDate && (
                        <>
                          <div className="text-gray-500">Verified Date</div>
                          <div className="font-medium text-gray-900">{docData.verifiedDate}</div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {docData.comments && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Comments</h4>
                    <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
                      {docData.comments}
                    </div>
                  </div>
                )}
                
                <div className="pt-4">
                  <Button
                    variant="primary"
                    onClick={handleDownload}
                    className="w-full flex items-center justify-center download-button font-medium py-3"
                    aria-label={`Download ${docData.name}`}
                  >
                    <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 