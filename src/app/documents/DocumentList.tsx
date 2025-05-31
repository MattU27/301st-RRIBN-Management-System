import { useState } from 'react';
import { 
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  DocumentMagnifyingGlassIcon,
  TrashIcon,
  DocumentCheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Button from '@/components/Button';
import { toast } from 'react-hot-toast';
import axios from 'axios';

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

interface DocumentListProps {
  documents: Document[];
  isAdmin: boolean;
  onDelete: (id: string) => void;
  onView: (document: Document) => void;
  onVerify?: (document: Document, status: 'verified' | 'rejected', comments?: string) => void;
  onDocumentsUpdated?: () => void;
}

export default function DocumentList({ 
  documents, 
  isAdmin, 
  onDelete, 
  onView, 
  onVerify,
  onDocumentsUpdated
}: DocumentListProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'verified' | 'pending' | 'rejected'>('all');
  const [documentToVerify, setDocumentToVerify] = useState<Document | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredDocuments = activeTab === 'all' 
    ? documents 
    : documents.filter(doc => doc.status === activeTab);

  const handleVerifyDocument = async (approved: boolean) => {
    if (!documentToVerify) return;
    
    try {
      setIsProcessing(true);
      
      if (onVerify) {
        await onVerify(
          documentToVerify, 
          approved ? 'verified' : 'rejected',
          !approved ? rejectReason : undefined
        );
      } else {
        // Direct API call if no callback provided
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Authentication required');
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
          toast.success(`Document ${approved ? 'verified' : 'rejected'} successfully`);
          
          if (onDocumentsUpdated) {
            onDocumentsUpdated();
          }
        } else {
          throw new Error(response.data.error || `Failed to ${approved ? 'verify' : 'reject'} document`);
        }
      }
    } catch (error: any) {
      console.error('Document verification error:', error);
      toast.error(error.message || 'Failed to process document');
    } finally {
      setIsProcessing(false);
      setShowVerifyModal(false);
      setDocumentToVerify(null);
      setRejectReason('');
    }
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

  const getSecurityBadge = (classification: SecurityClassification) => {
    switch (classification) {
      case 'Confidential':
        return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">Confidential</span>;
      case 'Secret':
        return <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">Secret</span>;
      case 'Top Secret':
        return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">Top Secret</span>;
      default:
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">Unclassified</span>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6">
          <button
            onClick={() => setActiveTab('all')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'all'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Documents
          </button>
          <button
            onClick={() => setActiveTab('verified')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'verified'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Verified
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pending'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'rejected'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Rejected
          </button>
        </nav>
      </div>

      <div className="flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Document
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Upload Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Security
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expiration
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDocuments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500">
                        No documents found in this category
                      </td>
                    </tr>
                  ) : (
                    filteredDocuments.map((document) => (
                      <tr key={document._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-indigo-100 rounded-md">
                              <DocumentMagnifyingGlassIcon className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{document.name}</div>
                              {document.comments && (
                                <div className="text-xs text-red-500 mt-1">{document.comments}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(document.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{document.type}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{document.uploadDate}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getSecurityBadge(document.securityClassification)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{document.expirationDate}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <button 
                            className="text-indigo-600 hover:text-indigo-900 mr-2"
                            onClick={() => onView(document)}
                          >
                            <DocumentMagnifyingGlassIcon className="h-5 w-5" />
                          </button>
                          
                          {isAdmin && document.status === 'pending' && (
                            <>
                              <button 
                                className="text-green-600 hover:text-green-900 mr-2"
                                onClick={() => {
                                  setDocumentToVerify(document);
                                  setShowVerifyModal(true);
                                }}
                              >
                                <DocumentCheckIcon className="h-5 w-5" />
                              </button>
                            </>
                          )}
                          
                          <button 
                            className="text-red-600 hover:text-red-900"
                            onClick={() => onDelete(document._id)}
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      {/* Verification Modal */}
      {showVerifyModal && documentToVerify && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
                    <DocumentCheckIcon className="h-6 w-6 text-indigo-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Verify Document
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Please verify or reject the document &quot;{documentToVerify.name}&quot;
                      </p>
                      
                      <div className="mt-4 space-y-4">
                        <div>
                          <textarea
                            placeholder="Enter reason for rejection (optional)"
                            className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none"
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
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row space-x-2">
                <Button
                  variant="primary"
                  onClick={() => handleVerifyDocument(true)}
                  disabled={isProcessing}
                  isLoading={isProcessing}
                  className="w-full sm:w-auto"
                >
                  Verify
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleVerifyDocument(false)}
                  disabled={isProcessing}
                  isLoading={isProcessing}
                  className="w-full sm:w-auto mt-3 sm:mt-0"
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
                  disabled={isProcessing}
                  className="w-full sm:w-auto mt-3 sm:mt-0"
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