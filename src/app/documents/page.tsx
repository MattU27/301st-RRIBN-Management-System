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

// Define document types and labels directly in this file
enum DocumentType {
  BIRTH_CERTIFICATE = 'birth_certificate',
  PICTURE_2X2 = 'picture_2x2',
  ROTC_CERTIFICATE = 'rotc_certificate',
  ENLISTMENT_ORDER = 'enlistment_order',
  PROMOTION_ORDER = 'promotion_order',
  ORDER_OF_INCORPORATION = 'order_of_incorporation',
  SCHOOLING_CERTIFICATE = 'schooling_certificate',
  COLLEGE_DIPLOMA = 'college_diploma',
  RIDS = 'rids',
  OTHER = 'other'
}

const DocumentTypeLabels: Record<DocumentType, string> = {
  [DocumentType.BIRTH_CERTIFICATE]: 'Birth Certificate',
  [DocumentType.PICTURE_2X2]: 'Picture 2x2',
  [DocumentType.ROTC_CERTIFICATE]: '3R ROTC Certificate',
  [DocumentType.ENLISTMENT_ORDER]: 'Enlistment Order',
  [DocumentType.PROMOTION_ORDER]: 'Promotion Order',
  [DocumentType.ORDER_OF_INCORPORATION]: 'Order of Incorporation',
  [DocumentType.SCHOOLING_CERTIFICATE]: 'Schooling Certificate',
  [DocumentType.COLLEGE_DIPLOMA]: 'College Diploma',
  [DocumentType.RIDS]: 'RIDS',
  [DocumentType.OTHER]: 'Other Document'
}

type DocumentStatus = 'verified' | 'pending' | 'rejected';

interface Document {
  _id: string;
  name: string;
  title?: string;
  type: string;
  uploadDate: string;
  status: DocumentStatus;
  verifiedBy?: string | {
    _id: string;
    firstName?: string;
    lastName?: string;
    serviceNumber?: string;
    rank?: string;
    name?: string;
  };
  verifiedDate?: string;
  comments?: string;
  fileUrl: string;
  expirationDate?: string;
  userId?: string;
  createdAt?: string;
  uploadedAt?: string | Date;
  uploadedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    serviceNumber?: string;
    company?: string;
    rank?: string;
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

// Add this helper function for Philippine time conversion
const convertToPhilippineTime = (dateString: string | Date) => {
  if (!dateString) return 'Unknown date';
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    // Create a formatter with Philippine timezone (Asia/Manila)
    return new Intl.DateTimeFormat('en-PH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Manila'
    }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Unknown date';
  }
};

export default function DocumentsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'verified' | 'pending' | 'rejected'>('all');
  const [showRejectConfirmation, setShowRejectConfirmation] = useState(false);
  const [documentToReject, setDocumentToReject] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [documentToVerify, setDocumentToVerify] = useState<Document | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Add filter states
  const [filterServiceNumber, setFilterServiceNumber] = useState('');
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
    
    // Listen for document rejection events (special case for mobile app)
    socket.on('document:reject', (rejectedDoc) => {
      console.log('Document rejected:', rejectedDoc);
      
      // Update the document status in the state
      setDocuments((prevDocs) => 
        prevDocs.map((doc) => 
          doc._id === rejectedDoc._id ? { ...doc, status: 'rejected', comments: rejectedDoc.comments || 'Document rejected' } : doc
        )
      );
    });

    return () => {
      // Clean up listeners
      socket.off('document:new');
      socket.off('document:update');
      socket.off('document:delete');
      socket.off('document:reject');
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
        
        // Process documents to ensure they have all required fields
        const processedDocs = docs.map((doc: Document) => {
          // Debug date fields
          console.log('Document date fields:', {
            id: doc._id,
            uploadDate: doc.uploadDate,
            createdAt: doc.createdAt,
            uploadedAt: (doc as any).uploadedAt,
            title: doc.title
          });
          
          // Debug uploader info
          console.log('Document uploader info:', {
            id: doc._id,
            uploadedBy: doc.uploadedBy,
            serviceNumber: doc.uploadedBy?.serviceNumber,
            hasServiceNumber: doc.uploadedBy && 'serviceNumber' in doc.uploadedBy
          });
          
          // Ensure document has a name
          if (!doc.name && doc.title) {
            doc.name = doc.title;
          } else if (!doc.name) {
            doc.name = 'Unnamed Document';
          }
          
          // Ensure document has a type
          if (!doc.type) {
            doc.type = 'other';
          }
          
          // Convert upload date to Philippine time
          if (doc.uploadDate) {
            doc.uploadDate = convertToPhilippineTime(doc.uploadDate);
          } else if (doc.createdAt) {
            doc.uploadDate = convertToPhilippineTime(doc.createdAt);
          } else if ((doc as any).uploadedAt) {
            // Some documents might have uploadedAt instead of uploadDate or createdAt
            doc.uploadDate = convertToPhilippineTime((doc as any).uploadedAt);
          } else {
            // If no date is available, use current date
            doc.uploadDate = convertToPhilippineTime(new Date());
          }
          
          // Convert verification date to Philippine time if available
          if (doc.verifiedDate) {
            doc.verifiedDate = convertToPhilippineTime(doc.verifiedDate);
          }
          
          // Enhanced uploader info handling
          if (!doc.uploadedBy) {
            doc.uploadedBy = {
              _id: 'unknown',
              firstName: 'Unknown',
              lastName: 'User',
              serviceNumber: '',
              rank: ''
            };
          } else {
            // Handle case where uploadedBy might have different field names (from mobile app)
            const uploader = doc.uploadedBy;
            
            // If we have a title field in uploadedBy (from mobile app), use it to populate firstName
            if ((uploader as any).title && !uploader.firstName) {
              uploader.firstName = (uploader as any).title;
            }
            
            // If we have a name field but no firstName (from mobile app), use it
            if ((uploader as any).name && !uploader.firstName) {
              const fullName = (uploader as any).name.split(' ');
              if (fullName.length > 1) {
                uploader.firstName = fullName[0];
                uploader.lastName = fullName.slice(1).join(' ');
              } else {
                uploader.firstName = fullName[0];
                uploader.lastName = '';
              }
            }
            
            // Make sure serviceNumber is set properly
            if ((uploader as any).serviceNumber && !uploader.serviceNumber) {
              uploader.serviceNumber = (uploader as any).serviceNumber;
            } else if ((uploader as any).serial_number && !uploader.serviceNumber) {
              // Some systems might use serial_number instead
              uploader.serviceNumber = (uploader as any).serial_number;
            }
            
            // If we have an id field but no _id, use it
            if ((uploader as any).id && !uploader._id) {
              uploader._id = (uploader as any).id;
            }
            
            // Ensure rank is available
            if (!uploader.rank) {
              uploader.rank = '';
            }
            
            // Ensure we have at least placeholder values
            if (!uploader.firstName) uploader.firstName = 'Unknown';
            if (!uploader.lastName) uploader.lastName = 'User';
            if (!uploader.serviceNumber) uploader.serviceNumber = '';
          }
          
          // Process verifiedBy information if available
          if (doc.status === 'verified' && doc.verifiedBy) {
            // If verifiedBy is a string (ObjectId), use placeholder staff information
            if (typeof doc.verifiedBy === 'string') {
              // Use @ts-ignore to bypass TypeScript type checking
              // @ts-ignore
              doc.verifiedBy = {
                _id: doc.verifiedBy,
                firstName: 'Staff',
                lastName: 'Member',
                rank: '',
              };
            } 
            // If verifiedBy is an object, ensure it has the necessary fields
            else if (typeof doc.verifiedBy === 'object') {
              const verifier = doc.verifiedBy;
              
              // If we have a name field but no firstName
              if (verifier.name && !verifier.firstName) {
                const fullName = verifier.name.split(' ');
                if (fullName.length > 1) {
                  verifier.firstName = fullName[0];
                  verifier.lastName = fullName.slice(1).join(' ');
                } else {
                  verifier.firstName = fullName[0];
                  verifier.lastName = '';
                }
              }
              
              // Ensure we have at least placeholder values
              if (!verifier.firstName && !verifier.lastName) {
                verifier.firstName = 'Staff';
                verifier.lastName = 'Member';
              }
            }
          }

          return doc;
        });
        
        setDocuments(processedDocs);
        
        // Extract unique companies for the filter dropdown
        const uniqueCompanies = Array.from(
          new Set(
            processedDocs
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

  const handleRejectDocumentClick = (id: string) => {
    setDocumentToReject(id);
    setShowRejectConfirmation(true);
  };

  const handleRejectDocument = async () => {
    if (!documentToReject) return;
    
    try {
      // Try to refresh the token if needed
      const token = await refreshTokenIfNeeded() || localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
        router.push('/login');
        return;
      }
      
      const response = await axios.delete(`/api/documents?id=${documentToReject}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        // Instead of filtering out the document, update its status to 'rejected'
        setDocuments(prevDocs => 
          prevDocs.map(doc => 
            doc._id === documentToReject ? { ...doc, status: 'rejected', comments: 'Document rejected by staff' } : doc
          )
        );
        toast.success('Document rejected successfully');
      } else {
        throw new Error(response.data.error || 'Failed to reject document');
      }
    } catch (error: any) {
      console.error('Reject error:', error);
      
      // Check for authentication errors
      if (error.response && error.response.status === 401) {
        toast.error('Session expired. Please log in again.');
        localStorage.removeItem('token');
        router.push('/login');
        return;
      }
      
      toast.error(error.message || 'Failed to reject document');
    } finally {
      setDocumentToReject(null);
      setShowRejectConfirmation(false);
    }
  };

  // Handle viewing a document
  const handleViewDocument = (document: Document) => {
    console.log('Viewing document:', document);
    
    // Create a safe copy of the document to avoid passing complex objects
    const safeDocument: any = {
      ...document,
      verifiedBy: typeof document.verifiedBy === 'object' ? 
        `${document.verifiedBy.firstName || ''} ${document.verifiedBy.lastName || ''}` : 
        document.verifiedBy || 'Staff Member'
    };
    
    // If the document has a fileUrl that starts with gridfs://, convert it to our API endpoint
    if (safeDocument.fileUrl && safeDocument.fileUrl.startsWith('gridfs://')) {
      const gridFsId = safeDocument.fileUrl.replace('gridfs://', '');
      console.log('Converting gridfs URL to API endpoint, ID:', gridFsId);
      
      // Update the fileUrl to use our API endpoint
      safeDocument.fileUrl = `/api/documents/document?id=${gridFsId}`;
    }
    
    setSelectedDocument(safeDocument);
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
        // Update document in the list with the updated document data
        // This ensures we have the verifiedBy and other fields
        const updatedDoc = response.data.data.document;
        
        // Convert dates to Philippine time
        if (updatedDoc.uploadDate) {
          updatedDoc.uploadDate = convertToPhilippineTime(updatedDoc.uploadDate);
        }
        if (updatedDoc.verifiedDate) {
          updatedDoc.verifiedDate = convertToPhilippineTime(updatedDoc.verifiedDate);
        }
        
        // Process verifiedBy information if available
        if (updatedDoc.status === 'verified' && updatedDoc.verifiedBy) {
          // If verifiedBy is a string (ObjectId), use current user's information
          if (typeof updatedDoc.verifiedBy === 'string' && user) {
            // @ts-ignore - We know this is correct for our usage
            updatedDoc.verifiedBy = {
              _id: updatedDoc.verifiedBy,
              firstName: user.firstName || 'Staff',
              lastName: user.lastName || 'Member',
              rank: user.role || '',
            };
          }
        }
        
        setDocuments(prevDocs => 
          prevDocs.map(doc => 
            doc._id === documentToVerify._id ? updatedDoc : doc
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
  
  // Apply additional filters (service number and company)
  const finalFilteredDocuments = filteredDocuments.filter((doc: Document) => {
    // Filter by service number if provided
    if (filterServiceNumber && doc.uploadedBy?.serviceNumber) {
      if (!doc.uploadedBy.serviceNumber.toLowerCase().includes(filterServiceNumber.toLowerCase())) {
        return false;
      }
    }
    
    // Filter by company if provided
    if (filterCompany && doc.uploadedBy?.company) {
      if (doc.uploadedBy.company !== filterCompany) {
        return false;
      }
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = doc.name?.toLowerCase().includes(query);
      const matchesTitle = doc.title?.toLowerCase().includes(query);
      const matchesType = doc.type?.toLowerCase().includes(query);
      const matchesUploader = doc.uploadedBy?.firstName?.toLowerCase().includes(query) || 
                             doc.uploadedBy?.lastName?.toLowerCase().includes(query) ||
                             doc.uploadedBy?.serviceNumber?.toLowerCase().includes(query);
      
      if (!(matchesName || matchesTitle || matchesType || matchesUploader)) {
        return false;
      }
    }
    
    return true;
  });

  // Calculate pagination
  const totalPages = Math.ceil(finalFilteredDocuments.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = finalFilteredDocuments.slice(indexOfFirstItem, indexOfLastItem);
  
  // Generate page numbers array
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }
  
  // Handle page change
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  
  // Handle items per page change
  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

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
      'other': 'Other Document',
      'birth_certificate': 'Birth Certificate'
    };
    
    return typeMapping[type] || type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ');
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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label htmlFor="serviceNumber" className="block mb-1 text-sm font-medium text-gray-700">
                    Service Number
                  </label>
                  <input
                    type="text"
                    id="serviceNumber"
                    value={filterServiceNumber}
                    onChange={(e) => setFilterServiceNumber(e.target.value)}
                    placeholder="Filter by Service Number"
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
                <div>
                  <label htmlFor="search" className="block mb-1 text-sm font-medium text-gray-700">
                    Search
                  </label>
                  <input
                    type="text"
                    id="search"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1); // Reset to first page when searching
                    }}
                    placeholder="Search documents..."
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => {
                    setFilterServiceNumber('');
                    setFilterCompany('');
                    setSearchQuery('');
                    setCurrentPage(1);
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
                    {currentItems.map((document) => (
                      <tr key={document._id} className={document.status === 'pending' ? 'bg-yellow-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <DocumentTextIcon className="w-5 h-5 mr-3 text-gray-400" />
                            <div className="text-sm font-medium text-gray-900">{document.name || document.title || 'Unnamed Document'}</div>
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
                          <div className="text-sm text-gray-500">{document.uploadDate || document.createdAt || 'Unknown date'}</div>
                          {document.status === 'verified' && (
                            <div className="mt-1 text-xs text-green-600">
                              {document.verifiedDate ? `Verified: ${document.verifiedDate}` : 'Verified'}
                              {document.verifiedBy && typeof document.verifiedBy === 'object' && (
                                <span className="block">
                                  by: {document.verifiedBy.rank ? `${document.verifiedBy.rank} ` : ''}
                                  {document.verifiedBy.firstName || ''} {document.verifiedBy.lastName || ''}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {document.uploadedBy ? (
                            <div className="text-sm text-gray-900">
                              <div>
                                {document.uploadedBy.rank ? `${document.uploadedBy.rank} ` : ''}
                                {document.uploadedBy.firstName || 'Unknown'} {document.uploadedBy.lastName || 'User'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {(() => {
                                  console.log('Rendering service number:', {
                                    id: document._id,
                                    serviceNumber: document.uploadedBy?.serviceNumber,
                                    hasServiceNumber: document.uploadedBy && 'serviceNumber' in document.uploadedBy
                                  });
                                  return document.uploadedBy?.serviceNumber || '';
                                })()}
                                {document.uploadedBy?.company && (
                                  <span className="ml-1">| {document.uploadedBy.company}</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">Unknown User</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                          <div className="flex space-x-2">
                            <button 
                              className="px-2 py-1 text-xs font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700"
                              onClick={() => handleViewDocument(document)}
                            >
                              View
                            </button>
                            
                            {canVerifyDocuments && document.status === 'pending' && (
                              <button 
                                className="px-2 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700"
                                onClick={() => handleVerifyDocumentClick(document)}
                              >
                                Verify
                              </button>
                            )}

                            {canVerifyDocuments && document.status !== 'verified' && (
                              <button 
                                className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700"
                                onClick={() => handleRejectDocumentClick(document._id)}
                              >
                                Reject
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {/* Pagination controls */}
                <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-700">
                      Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                      <span className="font-medium">
                        {indexOfLastItem > finalFilteredDocuments.length
                          ? finalFilteredDocuments.length
                          : indexOfLastItem}
                      </span>{' '}
                      of <span className="font-medium">{finalFilteredDocuments.length}</span> results
                    </span>
                    
                    <div className="ml-4">
                      <select
                        value={itemsPerPage}
                        onChange={handleItemsPerPageChange}
                        className="block py-2 pl-3 pr-10 text-base border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        <option value={5}>5 per page</option>
                        <option value={10}>10 per page</option>
                        <option value={20}>20 per page</option>
                        <option value={50}>50 per page</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex justify-between sm:justify-end">
                    <nav className="inline-flex -space-x-px rounded-md shadow-sm isolate" aria-label="Pagination">
                      <button
                        onClick={() => paginate(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md ${
                          currentPage === 1
                            ? 'cursor-not-allowed'
                            : 'hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                        }`}
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {/* Page numbers */}
                      {pageNumbers.length <= 6 ? (
                        // Show all page numbers if there are 6 or fewer
                        pageNumbers.map((number) => (
                          <button
                            key={number}
                            onClick={() => paginate(number)}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                              currentPage === number
                                ? 'z-10 bg-indigo-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                                : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                            }`}
                          >
                            {number}
                          </button>
                        ))
                      ) : (
                        // Show limited page numbers with ellipsis for more than 6 pages
                        <>
                          {/* Always show first page */}
                          <button
                            onClick={() => paginate(1)}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                              currentPage === 1
                                ? 'z-10 bg-indigo-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                                : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                            }`}
                          >
                            1
                          </button>
                          
                          {/* Show ellipsis if current page is > 3 */}
                          {currentPage > 3 && (
                            <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300">
                              ...
                            </span>
                          )}
                          
                          {/* Show current page and adjacent pages */}
                          {pageNumbers
                            .filter(
                              (number) => 
                                number !== 1 && 
                                number !== totalPages && 
                                (Math.abs(number - currentPage) <= 1)
                            )
                            .map((number) => (
                              <button
                                key={number}
                                onClick={() => paginate(number)}
                                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                  currentPage === number
                                    ? 'z-10 bg-indigo-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                                    : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                                }`}
                              >
                                {number}
                              </button>
                            ))}
                          
                          {/* Show ellipsis if current page is < totalPages - 2 */}
                          {currentPage < totalPages - 2 && (
                            <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300">
                              ...
                            </span>
                          )}
                          
                          {/* Always show last page */}
                          {totalPages > 1 && (
                            <button
                              onClick={() => paginate(totalPages)}
                              className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                currentPage === totalPages
                                  ? 'z-10 bg-indigo-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                                  : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                              }`}
                            >
                              {totalPages}
                            </button>
                          )}
                        </>
                      )}
                      
                      <button
                        onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className={`relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md ${
                          currentPage === totalPages
                            ? 'cursor-not-allowed'
                            : 'hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                        }`}
                      >
                        <span className="sr-only">Next</span>
                        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
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
                        Are you sure you want to verify the document "{documentToVerify.name}"?
                      </p>
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

      {/* Reject Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showRejectConfirmation}
        onClose={() => setShowRejectConfirmation(false)}
        onConfirm={handleRejectDocument}
        title="Reject Document"
        message="Are you sure you want to reject this document? This action cannot be undone."
        confirmText="Reject"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
} 