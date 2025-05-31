"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
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

  // Fetch documents from API
  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get('/api/documents', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setDocuments(response.data.data.documents);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
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
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
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
      toast.error(error.message || 'Failed to update document status');
    } finally {
      setIsVerifying(false);
    }
  };

  const filteredDocuments = activeTab === 'all' 
    ? documents 
    : documents.filter(doc => doc.status === activeTab);

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

  // Determine if the user can verify documents
  const canVerifyDocuments = user && ['admin', 'director', 'staff'].includes(user.role);
  
  // Determine if user is an administrator (for RIDS permissions)
  const isAdministrator = user && user.role === 'administrator';

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Count of pending documents
  const pendingCount = documents.filter(doc => doc.status === 'pending').length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="mt-1 text-sm text-gray-500">
            View, verify, and manage documents
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-2">
          <Button
            variant="primary"
            onClick={() => router.push('/documents/upload')}
            className="flex items-center"
          >
            <DocumentTextIcon className="h-5 w-5 mr-2" />
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
                  <EyeIcon className="h-5 w-5 mr-2" />
                  View RIDS
                </>
              ) : (
                <>
                  <DocumentCheckIcon className="h-5 w-5 mr-2" />
                  Manage RIDS
                </>
              )}
            </Button>
          )}
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-indigo-100 rounded-full p-3">
                <DocumentTextIcon className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="ml-4">
                <h2 className="text-lg font-medium text-gray-900">Document Verification</h2>
                <p className="text-sm text-gray-500">
                  Review, verify, and manage documents for the 301st
                </p>
              </div>
            </div>
            {canVerifyDocuments && pendingCount > 0 && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <ShieldExclamationIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
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
            <nav className="-mb-px flex space-x-8">
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
                  <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center bg-indigo-600 text-white rounded-full text-xs">
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
            </nav>
          </div>

          <div className="mt-6">
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-12">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
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
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Document
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Classification
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Upload Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredDocuments.map((document) => (
                      <tr key={document._id} className={document.status === 'pending' ? 'bg-yellow-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3" />
                            <div className="text-sm font-medium text-gray-900">{document.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{document.type}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              document.securityClassification === 'Unclassified' ? 'bg-gray-100 text-gray-800' :
                              document.securityClassification === 'Confidential' ? 'bg-blue-100 text-blue-800' :
                              document.securityClassification === 'Secret' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {document.securityClassification}
                            </span>
                          </div>
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button 
                              className="text-indigo-600 hover:text-indigo-900 tooltip"
                              onClick={() => handleViewDocument(document)}
                            >
                              <DocumentMagnifyingGlassIcon className="h-5 w-5" />
                              <span className="tooltiptext">View</span>
                            </button>
                            
                            {canVerifyDocuments && document.status === 'pending' && (
                              <button 
                                className="text-green-600 hover:text-green-900 tooltip"
                                onClick={() => handleVerifyDocumentClick(document)}
                              >
                                <DocumentCheckIcon className="h-5 w-5" />
                                <span className="tooltiptext">Verify</span>
                              </button>
                            )}

                            {canVerifyDocuments && (
                              <button 
                                className="text-red-600 hover:text-red-900 tooltip"
                                onClick={() => handleDeleteDocumentClick(document._id)}
                              >
                                <TrashIcon className="h-5 w-5" />
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
                            className="mt-1 block w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
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
                  className="w-full sm:w-auto mt-3 sm:mt-0 sm:ml-3"
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
                  className="w-full sm:w-auto mt-3 sm:mt-0"
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