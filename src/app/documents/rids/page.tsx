"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { 
  UserIcon, 
  BuildingOfficeIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  ArrowTopRightOnSquareIcon,
  UserGroupIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  InformationCircleIcon,
  TrashIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { UserRole } from '@/types/auth';

// Define interfaces
interface Reservist {
  id: string;
  name: string;
  rank: string;
  serviceNumber: string;
  email: string;
  status: string;
  company: string;
  dateJoined: string;
  lastUpdated: string;
  ridsData?: RIDSData;
  ridsStatus: 'complete' | 'incomplete' | 'pending_verification' | 'verified';
  isRegistrationComplete?: boolean;
  certificates?: Certificate[]; // Added certificates array
}

interface Certificate {
  id: string;
  title: string;
  type: CertificateType;
  uploadDate: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  status: 'pending' | 'verified' | 'rejected';
  notes?: string;
}

enum CertificateType {
  MEDICAL = 'medical',
  TRAINING = 'training',
  EDUCATION = 'education',
  MILITARY = 'military',
  OTHER = 'other',
}

interface RIDSData {
  personalInformation: {
    fullName: string;
    dateOfBirth: string;
    placeOfBirth: string;
    gender: string;
    civilStatus: string;
    religion: string;
    citizenship: string;
    bloodType: string;
  };
  contactInformation: {
    residentialAddress: string;
    mobileNumber: string;
    officePhone?: string;
    emailAddress: string;
  };
  identificationInfo: {
    serviceId: string;
    height: string;
    weight: string;
    sssNumber?: string;
    tinNumber?: string;
    philHealthNumber?: string;
    pagIbigNumber?: string;
  };
  educationalBackground: {
    highestEducation: string;
    course?: string;
    school: string;
    yearGraduated: string;
  };
  occupationInfo: {
    occupation: string;
    employer?: string;
    officeAddress?: string;
  };
  militaryTraining: {
    name: string;
    authority: string;
    dateCompleted: string;
  }[];
  specialSkills: string[];
  awards: {
    title: string;
    authority: string;
    dateAwarded: string;
  }[];
  assignments: {
    authority: string;
    dateFrom: string;
    dateTo: string;
  }[];
  filePath?: string; // Path to the uploaded PDF file
  rank?: string;
  lastName?: string;
  firstName?: string;
  middleName?: string;
  afpsn?: string;
  brsvc?: string;
  sourceOfCommission?: string;
  reservistClassification?: string;
  mobilizationCenter?: string;
  designation?: string;
  battalion?: string;
  sizeOfCombatShoes?: string;
  sizeOfCap?: string;
  sizeOfBDU?: string;
  officePhone?: string;
  birthPlace?: string;
  age?: string;
  maritalStatus?: string;
  sex?: string;
  sssNo?: string;
  philhealthNo?: string;
  dependents?: {
    relation: string;
    name: string;
  }[];
  cadetAct?: string;
  rotc?: string;
  afpReserve?: string;
  bcor?: string;
  msgt?: string;
  dgResHoldr?: string;
  selected?: string;
  dirAppointee?: string;
  directCommission?: string;
  exafp?: string;
}

export default function ManageRIDS() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [reservists, setReservists] = useState<Reservist[]>([]);
  const [filteredReservists, setFilteredReservists] = useState<Reservist[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [selectedReservist, setSelectedReservist] = useState<Reservist | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newRidsFormData, setNewRidsFormData] = useState<Partial<RIDSData>>({
    personalInformation: {
      fullName: '',
      dateOfBirth: '',
      placeOfBirth: '',
      gender: '',
      civilStatus: '',
      religion: '',
      citizenship: 'Filipino',
      bloodType: '',
    },
    contactInformation: {
      residentialAddress: '',
      mobileNumber: '',
      emailAddress: '',
      officePhone: '',
    },
    identificationInfo: {
    serviceId: '',
      height: '',
      weight: '',
      sssNumber: '',
      tinNumber: '',
      philHealthNumber: '',
    },
    educationalBackground: {
      highestEducation: '',
      course: '',
      school: '',
      yearGraduated: '',
    },
    occupationInfo: {
      occupation: '',
      employer: '',
      officeAddress: '',
    },
    militaryTraining: [],
    specialSkills: [],
    awards: [],
    assignments: [],
    rank: '',
    lastName: '',
    firstName: '',
    middleName: '',
    afpsn: '',
    brsvc: '',
    dependents: [],
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reservistToDelete, setReservistToDelete] = useState<string | null>(null);
  const [hasProblematicId, setHasProblematicId] = useState(false);
  
  // Certificate upload state
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [selectedCertificateType, setSelectedCertificateType] = useState<CertificateType>(CertificateType.TRAINING);
  const [certificateTitle, setCertificateTitle] = useState('');
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [uploadingCertificate, setUploadingCertificate] = useState(false);
  const [certificateErrors, setCertificateErrors] = useState<Record<string, string>>({});
  const [reservistForCertificate, setReservistForCertificate] = useState<Reservist | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated && user && (['staff', 'admin', 'director', 'administrator'].includes(user.role))) {
      fetchReservists();
      checkUploadDirectories();
    }
  }, [isLoading, isAuthenticated, router, user]);

  useEffect(() => {
    // Check if the problematic service ID exists in the data
    const problematicId = 'CD-2019-1016780';
    const found = reservists.some(r => r.serviceNumber === problematicId);
    setHasProblematicId(found);
    
    if (found) {
      console.log('⚠️ WARNING: Problematic service ID detected in the data');
    }
  }, [reservists]);

  const fetchReservists = async () => {
    try {
      setIsLoadingData(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      // First, clear existing state completely
      setReservists([]);
      setFilteredReservists([]);
      setExpandedIds({});
      setSelectedReservist(null);
      
      // Clear browser cache by forcing page refresh if needed
      await new Promise(resolve => setTimeout(resolve, 100));

      // For problematic Service ID CD-2019-1016780, run emergency cleanup first
      const problematicId = 'CD-2019-1016780';
      const foundProblematic = reservists.some(r => r.serviceNumber === problematicId);
      
      if (foundProblematic) {
        console.log('Found problematic service ID in state, running emergency cleanup first');
        try {
          await axios.get('/api/emergency-cleanup', {
            headers: {
              Authorization: `Bearer ${token}`
            },
            params: {
              _t: new Date().getTime() // Cache busting
            }
          });
          console.log('Emergency cleanup completed');
        } catch (cleanupError) {
          console.error('Error during emergency cleanup:', cleanupError);
        }
      }

      // Then fetch new data with multiple cache busting techniques
      const response = await axios.get('/api/personnel/reservists', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        params: {
          // Staff can only see reservists in their company, admins and directors see all
          company: user?.role === 'staff' ? user?.company : undefined,
          // Add multiple cache-busting parameters
          _t: new Date().getTime(),
          _rid: Math.random().toString(36).substring(2),
          _nocache: true
        }
      });

      if (response.data.success) {
        // Double-check: Filter out any duplicates before setting state
        const uniqueData = response.data.data.reservists.filter(
          (r: Reservist, index: number, self: Reservist[]) => 
            index === self.findIndex((t: Reservist) => t.id === r.id)
        );
        
        // Also filter out any records with service ID CD-2019-1016780 that should be deleted
        const filteredData = uniqueData.filter(
          (r: Reservist) => r.serviceNumber !== 'CD-2019-1016780'
        );
        
        console.log(`Filtered ${uniqueData.length - filteredData.length} problematic records client-side`);
        
        setReservists(filteredData);
        setFilteredReservists(filteredData);
      } else {
        toast.error('Failed to load reservists');
      }
    } catch (error) {
      console.error('Error fetching reservists:', error);
      toast.error('Failed to load reservists');
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    // Filter reservists based on search term and status
    let filtered = [...reservists];
    
    // Apply search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        r.name.toLowerCase().includes(lowerSearchTerm) || 
        r.serviceNumber.toLowerCase().includes(lowerSearchTerm) || 
        r.email.toLowerCase().includes(lowerSearchTerm)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.ridsStatus === statusFilter);
    }
    
    setFilteredReservists(filtered);
  }, [searchTerm, statusFilter, reservists]);

  const toggleExpandReservist = (id: string) => {
    setExpandedIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  };

  const handleEditRIDS = (reservist: Reservist) => {
    setSelectedReservist(reservist);
    setIsEditModalOpen(true);
  };

  const handleVerifyRIDS = async (reservistId: string, isApproved: boolean) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.post(
        '/api/personnel/rids/verify',
        { 
          reservistId,
          isApproved,
          reason: isApproved ? undefined : 'Please update your information and resubmit'
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success(isApproved ? 'RIDS verified successfully' : 'RIDS rejected');
        fetchReservists(); // Refresh data
      } else {
        toast.error('Failed to update RIDS status');
      }
    } catch (error) {
      console.error('Error updating RIDS status:', error);
      toast.error('Failed to update RIDS status');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="h-4 w-4 mr-1" />
            Verified
          </span>
        );
      case 'pending_verification':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-200 text-yellow-900">
            <ClockIcon className="h-4 w-4 mr-1" />
            Pending Verification
          </span>
        );
      case 'incomplete':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="h-4 w-4 mr-1" />
            Incomplete
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

  // Add function to handle form input changes
  const handleRidsFormChange = (
    section: string,
    field: string,
    value: string | string[] | { name: string; authority: string; dateCompleted: string }[]
  ) => {
    setNewRidsFormData(prev => {
      const updated = { ...prev };
      
      if (section === 'root') {
        // @ts-ignore
        updated[field] = value;
      } else {
        // @ts-ignore
        if (!updated[section]) updated[section] = {};
        // @ts-ignore
        updated[section][field] = value;
      }
      
      return updated;
    });
  };

  // Add function to handle dependent changes
  const handleDependentChange = (index: number, field: string, value: string) => {
    setNewRidsFormData(prev => {
      const dependents = [...(prev.dependents || [])];
      if (!dependents[index]) {
        dependents[index] = { relation: '', name: '' };
      }
      dependents[index][field as 'relation' | 'name'] = value;
      return { ...prev, dependents };
    });
  };

  // Add function to add a new dependent row
  const addDependentRow = () => {
    setNewRidsFormData(prev => {
      const dependents = [...(prev.dependents || []), { relation: '', name: '' }];
      return { ...prev, dependents };
    });
  };

  // Add function to generate and download PDF
  const generateRidsPdf = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      toast.loading('Generating RIDS PDF...');
      
      const response = await axios.post(
        '/api/personnel/rids/generate-pdf',
        { ridsData: newRidsFormData },
        {
        headers: {
          Authorization: `Bearer ${token}`
          },
          responseType: 'blob' // Important for receiving binary data
        }
      );
      
      toast.dismiss();
      
      // Create a blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `RIDS_${newRidsFormData.lastName}_${newRidsFormData.firstName}.pdf`);
      
      // Append to html link element page
      document.body.appendChild(link);
      
      // Start download
      link.click();
      
      // Clean up and remove the link
      link.parentNode?.removeChild(link);
      
      toast.success('RIDS PDF generated and downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.dismiss();
      toast.error('Failed to generate RIDS PDF');
    }
  };

  // Add function to create a new RIDS
  const handleCreateRIDS = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const errors: Record<string, string> = {};
    if (!newRidsFormData.identificationInfo?.serviceId) 
      errors.serviceId = 'Service ID is required';
    if (!newRidsFormData.lastName) 
      errors.lastName = 'Last Name is required';
    if (!newRidsFormData.firstName) 
      errors.firstName = 'First Name is required';
    
    if (Object.keys(errors).length > 0) {
      setUploadErrors(errors);
      return;
    }
    
    setIsUploading(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      // Create form data for RIDS creation
      const formData = {
        ...newRidsFormData,
        personalInformation: {
          ...newRidsFormData.personalInformation,
          fullName: `${newRidsFormData.lastName}, ${newRidsFormData.firstName} ${newRidsFormData.middleName || ''}`.trim()
        }
      };
      
      // Call API to create RIDS
      const response = await axios.post(
        '/api/personnel/rids/create',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        toast.success('RIDS created successfully');
        setIsUploadModalOpen(false);
        
        // Generate and download the PDF
        await generateRidsPdf();
        
        // Reset form data
        setNewRidsFormData({
          personalInformation: {
            fullName: '',
            dateOfBirth: '',
            placeOfBirth: '',
            gender: '',
            civilStatus: '',
            religion: '',
            citizenship: '',
            bloodType: '',
          },
          contactInformation: {
            residentialAddress: '',
            mobileNumber: '',
            emailAddress: '',
          },
          identificationInfo: {
          serviceId: '',
            height: '',
            weight: '',
          },
          educationalBackground: {
            highestEducation: '',
            course: '',
            school: '',
            yearGraduated: '',
          },
          occupationInfo: {
            occupation: '',
            employer: '',
            officeAddress: '',
          },
          militaryTraining: [],
          specialSkills: [],
          awards: [],
          assignments: [],
          rank: '',
          lastName: '',
          firstName: '',
          middleName: '',
        });
        
        fetchReservists(); // Refresh the list
      } else {
        toast.error(response.data.error || 'Failed to create RIDS');
      }
    } catch (error: any) {
      console.error('Error creating RIDS:', error);
      if (error.response?.data?.error) {
        toast.error(`Creation failed: ${error.response.data.error}`);
      } else if (error.response?.data?.message) {
        toast.error(`Creation failed: ${error.response.data.message}`);
      } else if (error.message) {
        toast.error(`Creation failed: ${error.message}`);
      } else {
        toast.error('Failed to create RIDS. Please try again.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenPreview = () => {
    if (previewUrl) {
      setShowPreview(true);
    }
  };

  const handleClosePreview = () => {
    setShowPreview(false);
  };

  // Add a function to check and create the upload directories
  const checkUploadDirectories = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;
      
      const response = await axios.get('/api/personnel/rids/check-directories', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Directory check response:', response.data);
      
      if (!response.data.success || !response.data.canWrite) {
        toast.error('Upload directory is not writable. Please contact the administrator.');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking directories:', error);
      toast.error('Failed to check upload directories. Please try again.');
      return false;
    }
  };

  // Update the upload function to check directories first
  const handleOpenUploadModal = async () => {
    // Reset form data when opening the modal
    setNewRidsFormData({
      personalInformation: {
        fullName: '',
        dateOfBirth: '',
        placeOfBirth: '',
        gender: '',
        civilStatus: '',
        religion: '',
        citizenship: 'Filipino',
        bloodType: '',
      },
      contactInformation: {
        residentialAddress: '',
        mobileNumber: '',
        emailAddress: '',
        officePhone: '',
      },
      identificationInfo: {
        serviceId: '',
        height: '',
        weight: '',
        sssNumber: '',
        tinNumber: '',
        philHealthNumber: '',
      },
      educationalBackground: {
        highestEducation: '',
        course: '',
        school: '',
        yearGraduated: '',
      },
      occupationInfo: {
        occupation: '',
        employer: '',
        officeAddress: '',
      },
      militaryTraining: [],
      specialSkills: [],
      awards: [],
      assignments: [],
      rank: '',
      lastName: '',
      firstName: '',
      middleName: '',
      afpsn: '',
      brsvc: '',
      dependents: [],
    });
    
    setUploadErrors({});
      setIsUploadModalOpen(true);
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!isUploadModalOpen && previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [isUploadModalOpen]);

  // Add this function to handle RIDS deletion
  const handleDeleteRIDS = async (reservistId: string) => {
    setReservistToDelete(reservistId);
    setShowDeleteModal(true);
  };

  // Add a new function to force cleanup of the problematic ID
  const forceCleanupProblematicId = async () => {
    try {
      setIsLoadingData(true);
      const token = localStorage.getItem('token');
      if (!token) return;
      
      console.log('Running aggressive cleanup of problematic service ID');
      toast.loading('Running aggressive data cleanup...');
      
      // Run both emergency cleanup and force cleanup
      await Promise.all([
        axios.get('/api/emergency-cleanup', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.post('/api/force-cleanup', 
          { serviceId: 'CD-2019-1016780' }, 
          { headers: { Authorization: `Bearer ${token}` } }
        )
      ]);
      
      toast.dismiss();
      toast.success('Aggressive cleanup completed');
      
      // Clear all trace of the record locally
      setReservists(prevReservists => 
        prevReservists.filter(r => r.serviceNumber !== 'CD-2019-1016780')
      );
      setFilteredReservists(prevFiltered => 
        prevFiltered.filter(r => r.serviceNumber !== 'CD-2019-1016780')
      );
      
      // Wait a bit for database operations to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Hard refresh data
      await fetchReservists();
      
      // Force clear browser cache
      if (window.caches) {
        try {
          const cacheKeys = await window.caches.keys();
          await Promise.all(cacheKeys.map(key => window.caches.delete(key)));
          console.log('Browser cache cleared');
        } catch (cacheError) {
          console.error('Error clearing browser cache:', cacheError);
        }
      }
      
    } catch (error) {
      console.error('Error during force cleanup:', error);
      toast.error('Error during cleanup process');
    } finally {
      setIsLoadingData(false);
    }
  };

  const confirmDeleteRIDS = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !reservistToDelete) return;

      console.log('Deleting RIDS with ID:', reservistToDelete);
      
      // Find the service ID of the record being deleted to help with cleanup
      const recordToDelete = reservists.find(r => r.id === reservistToDelete);
      const serviceId = recordToDelete?.serviceNumber;
      
      // Show loading toast
      const loadingToastId = toast.loading('Deleting RIDS data...');
      
      // Immediately update local state to remove this specific entry
      setReservists(prevReservists => prevReservists.filter(r => r.id !== reservistToDelete));
      setFilteredReservists(prevFiltered => prevFiltered.filter(r => r.id !== reservistToDelete));
      
      // Special handling for known problematic service ID
      const isProblematicId = serviceId === 'CD-2019-1016780';
      
      if (isProblematicId) {
        console.log('Detected problematic Service ID. Using aggressive cleanup approach.');
        toast.dismiss(loadingToastId);
        toast.success('RIDS data is being thoroughly cleaned up...');
        
        // For problematic ID, run the comprehensive cleanup process
        await forceCleanupProblematicId();
        
        // Close modal and clear state since cleanup is handled in the function
        setShowDeleteModal(false);
        setReservistToDelete(null);
        return;
      }
      
      // Use the enhanced force cleanup endpoint for ALL deletions to prevent reoccurrence
      try {
        const response = await axios.post(
          '/api/force-cleanup',
          { 
            serviceId: serviceId
          },
          {
            headers: {
              Authorization: `Bearer ${token}`
            },
            timeout: 10000 // Set a longer timeout for this operation
          }
        );

        toast.dismiss(loadingToastId);
        
        if (response.data.success) {
          toast.success('RIDS deleted successfully');
          console.log('Cleanup response:', response.data);
          
          // Wait a moment before refreshing data
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Force a fresh reload from server with clean state
          await fetchReservists();
        } else {
          toast.error(`Failed to delete RIDS: ${response.data.error}`);
          // Still refresh the data to ensure UI is in sync
          fetchReservists();
        }
      } catch (apiError: any) {
        console.error('Force cleanup API error:', apiError);
        toast.dismiss(loadingToastId);
        toast.error('Error during deletion, but entry has been removed from view');
        
        // Still refresh data to keep UI in sync
        fetchReservists();
      }
    } catch (error: any) {
      console.error('Error deleting RIDS:', error);
      toast.error('There was an error, but the entry has been removed from view.');
      
      // Refresh data from server anyway
      fetchReservists();
    } finally {
      setShowDeleteModal(false);
      setReservistToDelete(null);
    }
  };

  // Add the cleanup handler function after fetchReservists function
  const handleCleanupAllRIDS = async () => {
    if (!confirm('Are you sure you want to clear ALL RIDS data? This will reset all reservist registrations.')) {
      return;
    }
    
    try {
      setIsLoadingData(true);
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await axios.post('/api/rids-cleanup', {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        toast.success('All RIDS data cleared successfully');
        // Force clear the local state immediately
        setReservists([]);
        setFilteredReservists([]);
        // Then fetch from the server
        fetchReservists();
      } else {
        toast.error(`Failed to clear RIDS data: ${response.data.error}`);
      }
    } catch (error: any) {
      console.error('Error clearing RIDS data:', error);
      toast.error(`Error clearing data: ${error.message}`);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Add a new function to clean up the problematic record
  const handleCleanupProblemRecord = async (serviceId: string) => {
    if (!confirm(`Are you sure you want to run a FORCE cleanup on Service ID: ${serviceId}?\nThis is a drastic action for persistent data issues.`)) {
      return;
    }
    
    try {
      setIsLoadingData(true);
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await axios.post('/api/force-cleanup', {
        serviceId
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        toast.success('Force cleanup completed successfully');
        console.log('Force cleanup response:', response.data);
        
        // Force clear the problematic record from local state
        setReservists(prevReservists => prevReservists.filter(r => r.serviceNumber !== serviceId));
        setFilteredReservists(prevFiltered => prevFiltered.filter(r => r.serviceNumber !== serviceId));
        
        // Then refresh from server
        fetchReservists();
      } else {
        toast.error(`Force cleanup failed: ${response.data.error}`);
      }
    } catch (error: any) {
      console.error('Error during force cleanup:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Add this function to determine if the user can manage (edit/verify) RIDS
  const canManageRIDS = () => {
    return user && ['staff', 'admin', 'director'].includes(user.role);
  };

  // Add this function to determine if the user is an administrator
  const isAdministrator = () => {
    return user && user.role === 'administrator';
  };

  // Certificate upload handlers
  const handleOpenCertificateModal = (reservist: Reservist) => {
    setReservistForCertificate(reservist);
    setCertificateTitle('');
    setCertificateFile(null);
    setSelectedCertificateType(CertificateType.TRAINING);
    setCertificateErrors({});
    setShowCertificateModal(true);
  };

  const handleCertificateTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCertificateType(e.target.value as CertificateType);
  };

  const handleCertificateFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCertificateFile(e.target.files[0]);
    }
  };

  const handleCertificateUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const errors: Record<string, string> = {};
    if (!certificateTitle.trim()) {
      errors.title = 'Certificate title is required';
    }
    if (!certificateFile) {
      errors.file = 'Please select a file to upload';
    } else if (certificateFile.size > 10 * 1024 * 1024) {
      errors.file = 'File size should be less than 10MB';
    }
    
    if (Object.keys(errors).length > 0) {
      setCertificateErrors(errors);
      return;
    }
    
    // At this point, certificateFile is guaranteed to be non-null due to validation above
    if (!certificateFile) return; // Extra check for TypeScript
    
    setUploadingCertificate(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token || !reservistForCertificate) return;
      
      // Create form data
      const formData = new FormData();
      formData.append('file', certificateFile);
      formData.append('title', certificateTitle);
      formData.append('type', selectedCertificateType);
      formData.append('reservistId', reservistForCertificate.id);
      
      // Upload certificate
      const response = await axios.post(
        '/api/personnel/certificates/upload',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (response.data.success) {
        toast.success('Certificate uploaded successfully');
        setShowCertificateModal(false);
        fetchReservists(); // Refresh data to show new certificate
      } else {
        toast.error(response.data.error || 'Failed to upload certificate');
      }
    } catch (error: any) {
      console.error('Error uploading certificate:', error);
      toast.error('Failed to upload certificate. Please try again.');
    } finally {
      setUploadingCertificate(false);
    }
  };

  const handleDeleteCertificate = async (certificateId: string) => {
    if (!confirm('Are you sure you want to delete this certificate?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await axios.delete(
        `/api/personnel/certificates/${certificateId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        toast.success('Certificate deleted successfully');
        fetchReservists(); // Refresh data
      } else {
        toast.error('Failed to delete certificate');
      }
    } catch (error) {
      console.error('Error deleting certificate:', error);
      toast.error('Failed to delete certificate');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isAdministrator() ? "View Reservist Information Data Sheets" : "Manage Reservist Information Data Sheets"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {isAdministrator() 
              ? "View and review RIDS forms for reservists."
              : "Review and manage RIDS forms for reservists under your company."}
          </p>
          <div className="mt-2 bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <InformationCircleIcon className="h-5 w-5 text-blue-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Registration Information</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    When you upload a RIDS with a Service ID, the reservist can register on the mobile app using that ID.
                    The Service ID acts as a pre-authorization for registration.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Emergency cleanup warning when problematic ID is detected */}
          {hasProblematicId && user && ['admin', 'director', 'administrator'].includes(user.role) && (
            <div className="mt-2 bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Problematic Record Detected</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>
                      A problematic Service ID (CD-2019-1016780) has been detected in the system.
                      This record may persist after deletion. Use the Emergency Cleanup button to fix this issue.
                    </p>
                    <div className="mt-2">
                      <Button
                        variant="danger"
                        onClick={forceCleanupProblematicId}
                        className="flex items-center text-sm"
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Run Emergency Cleanup
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="mt-4 md:mt-0 flex space-x-2">
          {/* Only show upload button for staff, admin, and director */}
          {canManageRIDS() && (
            <Button
              variant="primary"
              onClick={() => router.push('/documents/rids/create')}
              className="flex items-center"
            >
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              Create RIDS
            </Button>
          )}
          
          <Button
            variant="secondary"
            onClick={fetchReservists}
            className="flex items-center"
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Refresh
          </Button>
          
          {/* Only show clear all button for admin and director */}
          {user && ['admin', 'director'].includes(user.role || '') ? (
            <Button
              variant="danger"
              onClick={handleCleanupAllRIDS}
              className="flex items-center"
            >
              <TrashIcon className="h-5 w-5 mr-2" />
              Clear All
            </Button>
          ) : null}
        </div>
      </div>

      <Card>
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div className="w-full md:w-64 mb-4 md:mb-0">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search reservists..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 pl-12"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
              </div>
            </div>
            <div className="w-full md:w-64">
              <select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Statuses</option>
                <option value="verified">Verified</option>
                <option value="pending_verification">Pending Verification</option>
                <option value="incomplete">Incomplete</option>
              </select>
            </div>
          </div>

          {isLoadingData ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : filteredReservists.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No reservists found matching your criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reservist
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      RIDS Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registration
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredReservists.map((reservist) => (
                    <React.Fragment key={reservist.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <button 
                              className="mr-3 focus:outline-none"
                              onClick={() => toggleExpandReservist(reservist.id)}
                            >
                              {expandedIds[reservist.id] ? (
                                <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                              ) : (
                                <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                              )}
                            </button>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{reservist.name}</div>
                              <div className="text-sm text-gray-500">{reservist.rank}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{reservist.company}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{reservist.serviceNumber}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(reservist.ridsStatus)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {reservist.isRegistrationComplete ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Registered
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-200 text-yellow-900">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex space-x-2">
                            {/* Only show Edit button if user can manage RIDS */}
                            {canManageRIDS() && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleEditRIDS(reservist)}
                                className="flex items-center"
                              >
                                <PencilIcon className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            )}
                            
                            {/* Only show Verify/Reject buttons for pending verification if user can manage RIDS */}
                            {canManageRIDS() && reservist.ridsStatus === 'pending_verification' && (
                              <>
                                <Button
                                  variant="success"
                                  size="sm"
                                  onClick={() => handleVerifyRIDS(reservist.id, true)}
                                  className="flex items-center"
                                >
                                  <CheckIcon className="h-4 w-4 mr-1" />
                                  Verify
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleVerifyRIDS(reservist.id, false)}
                                  className="flex items-center"
                                >
                                  <XMarkIcon className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            
                            {/* View button always visible to all roles */}
                            <Button
                              variant="info"
                              size="sm"
                              onClick={() => router.push(`/documents/rids/view/${reservist.id}`)}
                              className="flex items-center"
                            >
                              <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            
                            {/* Delete button visible to STAFF role only, not for administrator */}
                            {!isAdministrator() && (
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleDeleteRIDS(reservist.id)}
                                className="flex items-center"
                              >
                                <TrashIcon className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                      
                      {/* Expanded RIDS details */}
                      {expandedIds[reservist.id] && (
                        <tr>
                          <td colSpan={6} className="px-6 py-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <div className="flex justify-between items-center mb-4">
                                <h3 className="text-md font-medium text-gray-900 bg-blue-50 px-2 py-1 rounded">RIDS Details</h3>
                                
                                {/* PDF Viewer Link */}
                                {reservist.ridsData?.filePath && (
                                  <a 
                                    href={reservist.ridsData.filePath} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                  >
                                    <DocumentTextIcon className="h-4 w-4 mr-1" />
                                    View PDF
                                  </a>
                                )}
                              </div>
                              
                              {!reservist.ridsData ? (
                                <p className="text-sm text-gray-500">No RIDS data available for this reservist.</p>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {/* Personal Information */}
                                  <div className="bg-white p-3 rounded shadow-sm">
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">Personal Information</h4>
                                    <ul className="text-xs space-y-1">
                                      <li className="flex justify-between">
                                        <span className="text-gray-500">Full Name:</span>
                                        <span className={`font-medium ${reservist.ridsData.personalInformation.fullName === 'Pending Registration' ? 'text-indigo-800 font-bold' : ''}`}>
                                          {reservist.ridsData.personalInformation.fullName}
                                        </span>
                                      </li>
                                      <li className="flex justify-between">
                                        <span className="text-gray-500">Date of Birth:</span>
                                        <span>{reservist.ridsData.personalInformation.dateOfBirth}</span>
                                      </li>
                                      <li className="flex justify-between">
                                        <span className="text-gray-500">Gender:</span>
                                        <span>{reservist.ridsData.personalInformation.gender}</span>
                                      </li>
                                      <li className="flex justify-between">
                                        <span className="text-gray-500">Blood Type:</span>
                                        <span>{reservist.ridsData.personalInformation.bloodType}</span>
                                      </li>
                                    </ul>
                                  </div>
                                  
                                  {/* Contact Information */}
                                  <div className="bg-white p-3 rounded shadow-sm">
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">Contact Information</h4>
                                    <ul className="text-xs space-y-1">
                                      <li className="flex justify-between">
                                        <span className="text-gray-500">Address:</span>
                                        <span className="text-right">{reservist.ridsData.contactInformation.residentialAddress}</span>
                                      </li>
                                      <li className="flex justify-between">
                                        <span className="text-gray-500">Mobile:</span>
                                        <span>{reservist.ridsData.contactInformation.mobileNumber}</span>
                                      </li>
                                      <li className="flex justify-between">
                                        <span className="text-gray-500">Email:</span>
                                        <span>{reservist.ridsData.contactInformation.emailAddress}</span>
                                      </li>
                                    </ul>
                                  </div>
                                  
                                  {/* Identification Info */}
                                  <div className="bg-white p-3 rounded shadow-sm">
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">Identification Info</h4>
                                    <ul className="text-xs space-y-1">
                                      <li className="flex justify-between">
                                        <span className="text-gray-500">Service ID:</span>
                                        <span className="font-semibold text-indigo-700">
                                          {reservist.ridsData.identificationInfo.serviceId}
                                        </span>
                                      </li>
                                      <li className="flex justify-between">
                                        <span className="text-gray-500">Height:</span>
                                        <span>{reservist.ridsData.identificationInfo.height}</span>
                                      </li>
                                      <li className="flex justify-between">
                                        <span className="text-gray-500">Weight:</span>
                                        <span>{reservist.ridsData.identificationInfo.weight}</span>
                                      </li>
                                    </ul>
                                  </div>
                                  
                                  {/* Educational Background */}
                                  <div className="bg-white p-3 rounded shadow-sm">
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">Educational Background</h4>
                                    <ul className="text-xs space-y-1">
                                      <li className="flex justify-between">
                                        <span className="text-gray-500">Highest Education:</span>
                                        <span>{reservist.ridsData.educationalBackground.highestEducation}</span>
                                      </li>
                                      <li className="flex justify-between">
                                        <span className="text-gray-500">Course:</span>
                                        <span className={reservist.ridsData.educationalBackground.course ? '' : 'font-medium text-gray-800'}>
                                          {reservist.ridsData.educationalBackground.course || 'N/A'}
                                        </span>
                                      </li>
                                      <li className="flex justify-between">
                                        <span className="text-gray-500">School:</span>
                                        <span>{reservist.ridsData.educationalBackground.school}</span>
                                      </li>
                                      <li className="flex justify-between">
                                        <span className="text-gray-500">Year Graduated:</span>
                                        <span>{reservist.ridsData.educationalBackground.yearGraduated}</span>
                                      </li>
                                    </ul>
                                  </div>
                                  
                                  {/* Occupation Info */}
                                  <div className="bg-white p-3 rounded shadow-sm">
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">Occupation</h4>
                                    <ul className="text-xs space-y-1">
                                      <li className="flex justify-between">
                                        <span className="text-gray-500">Occupation:</span>
                                        <span>{reservist.ridsData.occupationInfo.occupation}</span>
                                      </li>
                                      <li className="flex justify-between">
                                        <span className="text-gray-500">Employer:</span>
                                        <span className={reservist.ridsData.occupationInfo.employer ? '' : 'font-medium text-gray-800'}>
                                          {reservist.ridsData.occupationInfo.employer || 'N/A'}
                                        </span>
                                      </li>
                                    </ul>
                                  </div>
                                  
                                  {/* Military Training */}
                                  <div className="bg-white p-3 rounded shadow-sm">
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">Military Training</h4>
                                    {reservist.ridsData.militaryTraining.length === 0 ? (
                                      <p className="text-xs text-gray-500">No training data available.</p>
                                    ) : (
                                      <ul className="text-xs space-y-2">
                                        {reservist.ridsData.militaryTraining.map((training, idx) => (
                                          <li key={idx} className="border-b pb-1 last:border-b-0">
                                            <div className="font-medium">{training.name}</div>
                                            <div className="flex justify-between">
                                              <span className="text-gray-500">Authority:</span>
                                              <span>{training.authority}</span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-gray-500">Date:</span>
                                              <span>{training.dateCompleted}</span>
                                            </div>
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                  
                                  {/* Certificates Section */}
                                  <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-white p-3 rounded shadow-sm">
                                    <div className="flex justify-between items-center mb-2">
                                      <h4 className="text-sm font-medium text-gray-900">Certificates & Documents</h4>
                                      {canManageRIDS() && (
                                        <Button
                                          variant="info"
                                          size="sm"
                                          onClick={() => handleOpenCertificateModal(reservist)}
                                          className="flex items-center text-xs"
                                        >
                                          <DocumentTextIcon className="h-3 w-3 mr-1" />
                                          Upload Certificate
                                        </Button>
                                      )}
                                    </div>
                                    
                                    {!reservist.certificates || reservist.certificates.length === 0 ? (
                                      <p className="text-xs text-gray-500">No certificates available.</p>
                                    ) : (
                                      <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200 text-xs">
                                          <thead className="bg-gray-50">
                                            <tr>
                                              <th scope="col" className="px-3 py-2 text-left font-medium text-gray-500">Title</th>
                                              <th scope="col" className="px-3 py-2 text-left font-medium text-gray-500">Type</th>
                                              <th scope="col" className="px-3 py-2 text-left font-medium text-gray-500">Date</th>
                                              <th scope="col" className="px-3 py-2 text-left font-medium text-gray-500">Status</th>
                                              <th scope="col" className="px-3 py-2 text-left font-medium text-gray-500">Actions</th>
                                            </tr>
                                          </thead>
                                          <tbody className="bg-white divide-y divide-gray-200">
                                            {reservist.certificates.map((certificate) => (
                                              <tr key={certificate.id} className="hover:bg-gray-50">
                                                <td className="px-3 py-2 whitespace-nowrap">
                                                  <div className="font-medium text-gray-900">{certificate.title}</div>
                                                </td>
                                                <td className="px-3 py-2 whitespace-nowrap">
                                                  {certificate.type.charAt(0).toUpperCase() + certificate.type.slice(1)}
                                                </td>
                                                <td className="px-3 py-2 whitespace-nowrap">
                                                  {new Date(certificate.uploadDate).toLocaleDateString()}
                                                </td>
                                                <td className="px-3 py-2 whitespace-nowrap">
                                                  {certificate.status === 'verified' ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                      <CheckCircleIcon className="h-3 w-3 mr-1" />
                                                      Verified
                                                    </span>
                                                  ) : certificate.status === 'pending' ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                      <ClockIcon className="h-3 w-3 mr-1" />
                                                      Pending
                                                    </span>
                                                  ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                      <XCircleIcon className="h-3 w-3 mr-1" />
                                                      Rejected
                                                    </span>
                                                  )}
                                                </td>
                                                <td className="px-3 py-2 whitespace-nowrap">
                                                  <div className="flex space-x-2">
                                                    <a 
                                                      href={certificate.fileUrl} 
                                                      target="_blank" 
                                                      rel="noopener noreferrer"
                                                      className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                                                    >
                                                      <ArrowTopRightOnSquareIcon className="h-3 w-3 mr-1" />
                                                      View
                                                    </a>
                                                    
                                                    {canManageRIDS() && (
                                                      <button
                                                        type="button"
                                                        onClick={() => handleDeleteCertificate(certificate.id)}
                                                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none"
                                                      >
                                                        <TrashIcon className="h-3 w-3 mr-1" />
                                                        Delete
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
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
      
      {/* RIDS Upload Modal - Replace with Create RIDS Form */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle max-w-5xl w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Create New RIDS
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 mb-4">
                        Fill out the Reservist Information Data Sheet form. After saving, you can download the PDF.
                      </p>
                      
                      <form onSubmit={handleCreateRIDS} className="max-h-[70vh] overflow-y-auto p-2">
                        <div className="border border-gray-300 rounded-md p-4 mb-6">
                          <h4 className="text-center font-bold text-lg mb-4">PHILIPPINE ARMY<br/>RESERVIST INFORMATION DATA SHEET</h4>
                          
                          {/* Basic Information Section */}
                          <div className="grid grid-cols-6 gap-4 mb-4">
                            <div className="col-span-1">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Rank</label>
                              <select
                                value={newRidsFormData.rank || ''}
                                onChange={(e) => handleRidsFormChange('root', 'rank', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded-sm text-sm"
                              >
                                <option value="">Select Rank</option>
                                <option value="PFC">PFC</option>
                                <option value="CPL">CPL</option>
                                <option value="SGT">SGT</option>
                                <option value="SSG">SSG</option>
                                <option value="TSG">TSG</option>
                                <option value="MSG">MSG</option>
                                <option value="2LT">2LT</option>
                                <option value="1LT">1LT</option>
                                <option value="CPT">CPT</option>
                                <option value="MAJ">MAJ</option>
                                <option value="LTC">LTC</option>
                                <option value="COL">COL</option>
                              </select>
                            </div>
                            
                            <div className="col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                              <input
                                type="text"
                                value={newRidsFormData.lastName || ''}
                                onChange={(e) => handleRidsFormChange('root', 'lastName', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded-sm text-sm"
                              />
                              {uploadErrors.lastName && (
                                <p className="text-xs text-red-600 mt-1">{uploadErrors.lastName}</p>
                              )}
                            </div>
                            
                            <div className="col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                              <input
                                type="text"
                                value={newRidsFormData.firstName || ''}
                                onChange={(e) => handleRidsFormChange('root', 'firstName', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded-sm text-sm"
                              />
                              {uploadErrors.firstName && (
                                <p className="text-xs text-red-600 mt-1">{uploadErrors.firstName}</p>
                              )}
                            </div>
                            
                            <div className="col-span-1">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                              <input
                                type="text"
                                value={newRidsFormData.middleName || ''}
                                onChange={(e) => handleRidsFormChange('root', 'middleName', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded-sm text-sm"
                              />
                            </div>
                          </div>

                          {/* Source of Commission / AFP SN / BR SVC Section */}
                          <div className="grid grid-cols-6 gap-4 mb-4">
                            <div className="col-span-4">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Source of Commission / Enlistment</label>
                              <div className="grid grid-cols-4 gap-2">
                                <div className="flex items-center">
                                  <input 
                                    type="checkbox" 
                                    id="cadetAct"
                                    checked={newRidsFormData.cadetAct === 'true'}
                                    onChange={(e) => handleRidsFormChange('root', 'cadetAct', e.target.checked ? 'true' : 'false')}
                                    className="mr-1"
                                  />
                                  <label htmlFor="cadetAct" className="text-xs">CADET ACT</label>
                                </div>
                                <div className="flex items-center">
                                  <input 
                                    type="checkbox" 
                                    id="rotc"
                                    checked={newRidsFormData.rotc === 'true'}
                                    onChange={(e) => handleRidsFormChange('root', 'rotc', e.target.checked ? 'true' : 'false')}
                                    className="mr-1"
                                  />
                                  <label htmlFor="rotc" className="text-xs">ROTC</label>
                                </div>
                                <div className="flex items-center">
                                  <input 
                                    type="checkbox" 
                                    id="afpReserve"
                                    checked={newRidsFormData.afpReserve === 'true'}
                                    onChange={(e) => handleRidsFormChange('root', 'afpReserve', e.target.checked ? 'true' : 'false')}
                                    className="mr-1"
                                  />
                                  <label htmlFor="afpReserve" className="text-xs">AFP RESERVE</label>
                                </div>
                                <div className="flex items-center">
                                  <input 
                                    type="checkbox" 
                                    id="bcor"
                                    checked={newRidsFormData.bcor === 'true'}
                                    onChange={(e) => handleRidsFormChange('root', 'bcor', e.target.checked ? 'true' : 'false')}
                                    className="mr-1"
                                  />
                                  <label htmlFor="bcor" className="text-xs">BCOR</label>
                                </div>
                                <div className="flex items-center">
                                  <input 
                                    type="checkbox" 
                                    id="msgt"
                                    checked={newRidsFormData.msgt === 'true'}
                                    onChange={(e) => handleRidsFormChange('root', 'msgt', e.target.checked ? 'true' : 'false')}
                                    className="mr-1"
                                  />
                                  <label htmlFor="msgt" className="text-xs">MSGT</label>
                                </div>
                                <div className="flex items-center">
                                  <input 
                                    type="checkbox" 
                                    id="dgResHoldr"
                                    checked={newRidsFormData.dgResHoldr === 'true'}
                                    onChange={(e) => handleRidsFormChange('root', 'dgResHoldr', e.target.checked ? 'true' : 'false')}
                                    className="mr-1"
                                  />
                                  <label htmlFor="dgResHoldr" className="text-xs">DEGREE HOLDER</label>
                                </div>
                                <div className="flex items-center">
                                  <input 
                                    type="checkbox" 
                                    id="selected"
                                    checked={newRidsFormData.selected === 'true'}
                                    onChange={(e) => handleRidsFormChange('root', 'selected', e.target.checked ? 'true' : 'false')}
                                    className="mr-1"
                                  />
                                  <label htmlFor="selected" className="text-xs">SELECTED</label>
                                </div>
                                <div className="flex items-center">
                                  <input 
                                    type="checkbox" 
                                    id="dirAppointee"
                                    checked={newRidsFormData.dirAppointee === 'true'}
                                    onChange={(e) => handleRidsFormChange('root', 'dirAppointee', e.target.checked ? 'true' : 'false')}
                                    className="mr-1"
                                  />
                                  <label htmlFor="dirAppointee" className="text-xs">DIRECT APPOINTEE</label>
                                </div>
                                <div className="flex items-center">
                                  <input 
                                    type="checkbox" 
                                    id="directCommission"
                                    checked={newRidsFormData.directCommission === 'true'}
                                    onChange={(e) => handleRidsFormChange('root', 'directCommission', e.target.checked ? 'true' : 'false')}
                                    className="mr-1"
                                  />
                                  <label htmlFor="directCommission" className="text-xs">DIRECT COMMISSION</label>
                                </div>
                                <div className="flex items-center">
                                  <input 
                                    type="checkbox" 
                                    id="exafp"
                                    checked={newRidsFormData.exafp === 'true'}
                                    onChange={(e) => handleRidsFormChange('root', 'exafp', e.target.checked ? 'true' : 'false')}
                                    className="mr-1"
                                  />
                                  <label htmlFor="exafp" className="text-xs">EX-AFP</label>
                                </div>
                              </div>
                            </div>

                            <div className="col-span-1">
                              <label className="block text-sm font-medium text-gray-700 mb-1">AFP SN</label>
                              <input
                                type="text"
                                value={newRidsFormData.afpsn || ''}
                                onChange={(e) => handleRidsFormChange('root', 'afpsn', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded-sm text-sm"
                              />
                            </div>
                            
                            <div className="col-span-1">
                              <label className="block text-sm font-medium text-gray-700 mb-1">BR/SVC</label>
                              <input
                                type="text"
                                value={newRidsFormData.brsvc || ''}
                                onChange={(e) => handleRidsFormChange('root', 'brsvc', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded-sm text-sm"
                              />
                            </div>
                          </div>

                          {/* Additional sections will follow in next edits */}
                          
                          {/* Service ID, Reservist Classification, Mobilization Center */}
                          <div className="grid grid-cols-3 gap-4 mb-4">
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Service ID</label>
                            <input
                              type="text"
                                value={newRidsFormData.identificationInfo?.serviceId || ''}
                                onChange={(e) => handleRidsFormChange('identificationInfo', 'serviceId', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded-sm text-sm"
                                placeholder="e.g. CD-2023-123456"
                            />
                            {uploadErrors.serviceId && (
                                <p className="text-xs text-red-600 mt-1">{uploadErrors.serviceId}</p>
                            )}
                          </div>
                          
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Reservist Classification</label>
                              <select
                                value={newRidsFormData.reservistClassification || ''}
                                onChange={(e) => handleRidsFormChange('root', 'reservistClassification', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded-sm text-sm"
                              >
                                <option value="">Select Classification</option>
                                <option value="READY RESERVE">READY RESERVE</option>
                                <option value="STANDBY">STANDBY</option>
                                <option value="RETIRED">RETIRED</option>
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Mobilization Center</label>
                              <input
                                type="text"
                                value={newRidsFormData.mobilizationCenter || ''}
                                onChange={(e) => handleRidsFormChange('root', 'mobilizationCenter', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded-sm text-sm"
                              />
                            </div>
                          </div>
                          
                          {/* Designation, Squad/Team/Section, Battalion/Brigade/Division */}
                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                              <input
                                type="text"
                                value={newRidsFormData.designation || ''}
                                onChange={(e) => handleRidsFormChange('root', 'designation', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded-sm text-sm"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Squad/Team/Section</label>
                              <input
                                type="text"
                                value={newRidsFormData.battalion || ''}
                                onChange={(e) => handleRidsFormChange('root', 'battalion', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded-sm text-sm"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                              <input
                                type="text"
                                value={newRidsFormData.occupationInfo?.employer || ''}
                                onChange={(e) => handleRidsFormChange('occupationInfo', 'employer', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded-sm text-sm"
                              />
                            </div>
                          </div>
                          
                          {/* Uniform Sizes */}
                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Size of Combat Shoes</label>
                              <input
                                type="text"
                                value={newRidsFormData.sizeOfCombatShoes || ''}
                                onChange={(e) => handleRidsFormChange('root', 'sizeOfCombatShoes', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded-sm text-sm"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Size of Cap (cm)</label>
                              <input
                                type="text"
                                value={newRidsFormData.sizeOfCap || ''}
                                onChange={(e) => handleRidsFormChange('root', 'sizeOfCap', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded-sm text-sm"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Size of BDU</label>
                              <input
                                type="text"
                                value={newRidsFormData.sizeOfBDU || ''}
                                onChange={(e) => handleRidsFormChange('root', 'sizeOfBDU', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded-sm text-sm"
                              />
                            </div>
                          </div>
                          
                          {/* Personal Information Section */}
                          <h4 className="font-bold text-sm mb-2 border-t border-gray-300 pt-4">PERSONAL INFORMATION</h4>
                          
                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Present Occupation</label>
                              <input
                                type="text"
                                value={newRidsFormData.occupationInfo?.occupation || ''}
                                onChange={(e) => handleRidsFormChange('occupationInfo', 'occupation', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded-sm text-sm"
                              />
                            </div>
                            
                            <div className="col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name & Address</label>
                              <input
                                type="text"
                                value={newRidsFormData.occupationInfo?.officeAddress || ''}
                                onChange={(e) => handleRidsFormChange('occupationInfo', 'officeAddress', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded-sm text-sm"
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Home Address (Street/Barangay)</label>
                              <input
                                type="text"
                                value={newRidsFormData.contactInformation?.residentialAddress || ''}
                                onChange={(e) => handleRidsFormChange('contactInformation', 'residentialAddress', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded-sm text-sm"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Office Tel Nr</label>
                              <input
                                type="text"
                                value={newRidsFormData.contactInformation?.officePhone || ''}
                                onChange={(e) => handleRidsFormChange('contactInformation', 'officePhone', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded-sm text-sm"
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Tel Nr</label>
                              <input
                                type="text"
                                value={newRidsFormData.contactInformation?.mobileNumber || ''}
                                onChange={(e) => handleRidsFormChange('contactInformation', 'mobileNumber', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded-sm text-sm"
                              />
                            </div>
                            
                            <div className="col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">City/Town/Province/ZIP Code</label>
                              <input
                                type="text"
                                value={newRidsFormData.contactInformation?.residentialAddress || ''}
                                onChange={(e) => handleRidsFormChange('contactInformation', 'residentialAddress', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded-sm text-sm"
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-6 gap-4 mb-4">
                            <div className="col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Birth Place (Municipality, Province)</label>
                              <input
                                type="text"
                                value={newRidsFormData.personalInformation?.placeOfBirth || ''}
                                onChange={(e) => handleRidsFormChange('personalInformation', 'placeOfBirth', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded-sm text-sm"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Res. Tel. Nr</label>
                              <input
                                type="text"
                                value={newRidsFormData.contactInformation?.officePhone || ''}
                                onChange={(e) => handleRidsFormChange('contactInformation', 'officePhone', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded-sm text-sm"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                              <input
                                type="text"
                                value={newRidsFormData.age || ''}
                                onChange={(e) => handleRidsFormChange('root', 'age', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded-sm text-sm"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Religion</label>
                              <input
                                type="text"
                                value={newRidsFormData.personalInformation?.religion || ''}
                                onChange={(e) => handleRidsFormChange('personalInformation', 'religion', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded-sm text-sm"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Blood Type</label>
                              <select
                                value={newRidsFormData.personalInformation?.bloodType || ''}
                                onChange={(e) => handleRidsFormChange('personalInformation', 'bloodType', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded-sm text-sm"
                              >
                                <option value="">Select</option>
                                <option value="A+">A+</option>
                                <option value="A-">A-</option>
                                <option value="B+">B+</option>
                                <option value="B-">B-</option>
                                <option value="AB+">AB+</option>
                                <option value="AB-">AB-</option>
                                <option value="O+">O+</option>
                                <option value="O-">O-</option>
                              </select>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center">
                                    <input
                                    type="radio" 
                                    id="single"
                                    name="maritalStatus"
                                    value="Single"
                                    checked={newRidsFormData.personalInformation?.civilStatus === 'Single'}
                                    onChange={(e) => handleRidsFormChange('personalInformation', 'civilStatus', e.target.value)}
                                    className="mr-1"
                                  />
                                  <label htmlFor="single" className="text-xs">Single</label>
                                </div>
                                <div className="flex items-center">
                                  <input 
                                    type="radio" 
                                    id="married"
                                    name="maritalStatus"
                                    value="Married"
                                    checked={newRidsFormData.personalInformation?.civilStatus === 'Married'}
                                    onChange={(e) => handleRidsFormChange('personalInformation', 'civilStatus', e.target.value)}
                                    className="mr-1"
                                  />
                                  <label htmlFor="married" className="text-xs">Married</label>
                                </div>
                                <div className="flex items-center">
                                  <input 
                                    type="radio" 
                                    id="widow"
                                    name="maritalStatus"
                                    value="Widow"
                                    checked={newRidsFormData.personalInformation?.civilStatus === 'Widow'}
                                    onChange={(e) => handleRidsFormChange('personalInformation', 'civilStatus', e.target.value)}
                                    className="mr-1"
                                  />
                                  <label htmlFor="widow" className="text-xs">Widow</label>
                                </div>
                                <div className="flex items-center">
                                  <input 
                                    type="radio" 
                                    id="separated"
                                    name="maritalStatus"
                                    value="Separated"
                                    checked={newRidsFormData.personalInformation?.civilStatus === 'Separated'}
                                    onChange={(e) => handleRidsFormChange('personalInformation', 'civilStatus', e.target.value)}
                                    className="mr-1"
                                  />
                                  <label htmlFor="separated" className="text-xs">Separated</label>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center">
                                  <input 
                                    type="radio" 
                                    id="male"
                                    name="sex"
                                    value="Male"
                                    checked={newRidsFormData.personalInformation?.gender === 'Male'}
                                    onChange={(e) => handleRidsFormChange('personalInformation', 'gender', e.target.value)}
                                    className="mr-1"
                                  />
                                  <label htmlFor="male" className="text-xs">Male</label>
                                </div>
                                <div className="flex items-center">
                                  <input 
                                    type="radio" 
                                    id="female"
                                    name="sex"
                                    value="Female"
                                    checked={newRidsFormData.personalInformation?.gender === 'Female'}
                                    onChange={(e) => handleRidsFormChange('personalInformation', 'gender', e.target.value)}
                                    className="mr-1"
                                  />
                                  <label htmlFor="female" className="text-xs">Female</label>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Identification Section */}
                          <div className="grid grid-cols-4 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">T.I.N.</label>
                              <input
                                type="text"
                                value={newRidsFormData.identificationInfo?.tinNumber || ''}
                                onChange={(e) => handleRidsFormChange('identificationInfo', 'tinNumber', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded-sm text-sm"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">SSS Nr</label>
                              <input
                                type="text"
                                value={newRidsFormData.identificationInfo?.sssNumber || ''}
                                onChange={(e) => handleRidsFormChange('identificationInfo', 'sssNumber', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded-sm text-sm"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">PHILHEALTH Nr</label>
                              <input
                                type="text"
                                value={newRidsFormData.identificationInfo?.philHealthNumber || ''}
                                onChange={(e) => handleRidsFormChange('identificationInfo', 'philHealthNumber', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded-sm text-sm"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                              <input
                                type="email"
                                value={newRidsFormData.contactInformation?.emailAddress || ''}
                                onChange={(e) => handleRidsFormChange('contactInformation', 'emailAddress', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded-sm text-sm"
                              />
                            </div>
                          </div>

                          {/* Dependents Section */}
                          <h4 className="font-bold text-sm mb-2 border-t border-gray-300 pt-4">DEPENDENTS</h4>
                          
                          <div className="mb-4">
                            <div className="grid grid-cols-2 gap-4 mb-2">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Relation</label>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                              </div>
                            </div>
                            
                            {(newRidsFormData.dependents || []).map((dependent, index) => (
                              <div key={index} className="grid grid-cols-2 gap-4 mb-2">
                                <div>
                                  <input
                                    type="text"
                                    value={dependent.relation}
                                    onChange={(e) => handleDependentChange(index, 'relation', e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded-sm text-sm"
                                  />
                                </div>
                                <div>
                                  <input
                                    type="text"
                                    value={dependent.name}
                                    onChange={(e) => handleDependentChange(index, 'name', e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded-sm text-sm"
                                  />
                                </div>
                              </div>
                            ))}
                            
                                  <div className="mt-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={addDependentRow}
                                className="text-xs"
                              >
                                + Add Dependent
                              </Button>
                                  </div>
                              </div>

                          {/* Highest Educational Attainment */}
                          <h4 className="font-bold text-sm mb-2 border-t border-gray-300 pt-4">HIGHEST EDUCATIONAL ATTAINMENT</h4>
                          
                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                              <input
                                type="text"
                                value={newRidsFormData.educationalBackground?.course || ''}
                                onChange={(e) => handleRidsFormChange('educationalBackground', 'course', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded-sm text-sm"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
                              <input
                                type="text"
                                value={newRidsFormData.educationalBackground?.school || ''}
                                onChange={(e) => handleRidsFormChange('educationalBackground', 'school', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded-sm text-sm"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Date Graduated</label>
                              <input
                                type="text"
                                value={newRidsFormData.educationalBackground?.yearGraduated || ''}
                                onChange={(e) => handleRidsFormChange('educationalBackground', 'yearGraduated', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded-sm text-sm"
                              />
                            </div>
                          </div>

                          {/* Certification Statement */}
                          <div className="mt-8 text-center">
                            <p className="text-sm font-medium">I HEREBY CERTIFY that all entries in this document are correct.</p>
                            
                            <div className="grid grid-cols-2 gap-8 mt-4">
                              <div className="flex flex-col items-center">
                                <div className="border border-gray-300 w-24 h-32 mb-2 flex items-center justify-center">
                                  <span className="text-xs text-gray-500">2x2 Photo</span>
                                </div>
                              </div>
                              
                              <div className="flex flex-col items-center">
                                <div className="border border-gray-300 w-64 h-24 mb-2"></div>
                                <div className="border-t border-gray-500 w-64 pt-1">
                                  <span className="text-xs font-medium">SIGNATURE</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-8">
                              <div className="text-center">
                                <div className="border-t border-gray-500 w-64 pt-1 mx-auto">
                                  <span className="text-xs font-medium">Attesting Personnel</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button
                  variant="primary"
                  onClick={handleCreateRIDS}
                  disabled={isUploading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {isUploading ? 'Creating...' : 'Create & Download RIDS'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setIsUploadModalOpen(false)}
                  disabled={isUploading}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Existing Edit Modal */}
      {isEditModalOpen && selectedReservist && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              <div className="bg-white p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Edit RIDS for {selectedReservist.name}
                  </h3>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500"
                    onClick={() => setIsEditModalOpen(false)}
                  >
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                
                {/* RIDS Edit Form */}
                <div className="mt-4">
                  <form className="space-y-6">
                    {/* Personal Information Section */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 bg-blue-50 px-2 py-1 rounded mb-3">Personal Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
                          <input 
                            type="text" 
                            id="fullName" 
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            defaultValue={selectedReservist.ridsData?.personalInformation.fullName || 'Pending Registration'}
                          />
                        </div>
                        <div>
                          <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">Date of Birth</label>
                          <input 
                            type="date" 
                            id="dateOfBirth" 
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            defaultValue={selectedReservist.ridsData?.personalInformation.dateOfBirth}
                          />
                        </div>
                        <div>
                          <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Gender</label>
                          <select 
                            id="gender" 
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            defaultValue={selectedReservist.ridsData?.personalInformation.gender || ''}
                          >
                            <option value="">Select gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="bloodType" className="block text-sm font-medium text-gray-700">Blood Type</label>
                          <select 
                            id="bloodType" 
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            defaultValue={selectedReservist.ridsData?.personalInformation.bloodType || ''}
                          >
                            <option value="">Select blood type</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Contact Information Section */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 bg-blue-50 px-2 py-1 rounded mb-3">Contact Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label htmlFor="address" className="block text-sm font-medium text-gray-700">Residential Address</label>
                          <input 
                            type="text" 
                            id="address" 
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            defaultValue={selectedReservist.ridsData?.contactInformation.residentialAddress || ''}
                          />
                        </div>
                        <div>
                          <label htmlFor="mobile" className="block text-sm font-medium text-gray-700">Mobile Number</label>
                          <input 
                            type="text" 
                            id="mobile" 
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            defaultValue={selectedReservist.ridsData?.contactInformation.mobileNumber || ''}
                          />
                        </div>
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                          <input 
                            type="email" 
                            id="email" 
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            defaultValue={selectedReservist.ridsData?.contactInformation.emailAddress || ''}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Identification Information */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 bg-blue-50 px-2 py-1 rounded mb-3">Identification Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label htmlFor="serviceId" className="block text-sm font-medium text-gray-700">Service ID</label>
                          <input 
                            type="text" 
                            id="serviceId" 
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-100"
                            defaultValue={selectedReservist.ridsData?.identificationInfo.serviceId || ''}
                            readOnly
                          />
                        </div>
                        <div>
                          <label htmlFor="height" className="block text-sm font-medium text-gray-700">Height (cm)</label>
                          <input 
                            type="text" 
                            id="height" 
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            defaultValue={selectedReservist.ridsData?.identificationInfo.height || ''}
                          />
                        </div>
                        <div>
                          <label htmlFor="weight" className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                          <input 
                            type="text" 
                            id="weight" 
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            defaultValue={selectedReservist.ridsData?.identificationInfo.weight || ''}
                          />
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <Button
                    variant="secondary"
                    onClick={() => setIsEditModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      toast.success('RIDS updated successfully');
                      setIsEditModalOpen(false);
                    }}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      {showPreview && previewUrl && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="flex justify-between items-center bg-gray-50 px-4 py-3 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Preview RIDS Document
                </h3>
                <button
                  type="button"
                  className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={handleClosePreview}
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              <div className="bg-white p-4 h-[600px]">
                <iframe
                  src={previewUrl}
                  title="RIDS PDF Preview"
                  className="w-full h-full border-0"
                />
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button
                  variant="primary"
                  onClick={() => {
                    setShowPreview(false);
                    handleCreateRIDS(new Event('submit') as any);
                  }}
                  className="ml-3"
                >
                  Confirm Creation
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleClosePreview}
                >
                  Close Preview
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <TrashIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Delete RIDS Data
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this RIDS data? This action cannot be undone.
                        All of the reservist's information will be permanently removed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button
                  variant="danger"
                  onClick={confirmDeleteRIDS}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Delete
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowDeleteModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Certificate Upload Modal */}
      {showCertificateModal && reservistForCertificate && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <DocumentTextIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Upload Certificate for {reservistForCertificate.name}
                    </h3>
                    <div className="mt-4">
                      <form onSubmit={handleCertificateUpload}>
                        <div className="mb-4">
                          <label htmlFor="certificateTitle" className="block text-sm font-medium text-gray-700 mb-1">
                            Certificate Title
                          </label>
                          <input
                            type="text"
                            id="certificateTitle"
                            value={certificateTitle}
                            onChange={(e) => setCertificateTitle(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="e.g. Medical Fitness Certificate, Training Completion"
                          />
                          {certificateErrors.title && (
                            <p className="mt-1 text-sm text-red-600">{certificateErrors.title}</p>
                          )}
                        </div>

                        <div className="mb-4">
                          <label htmlFor="certificateType" className="block text-sm font-medium text-gray-700 mb-1">
                            Certificate Type
                          </label>
                          <select
                            id="certificateType"
                            value={selectedCertificateType}
                            onChange={handleCertificateTypeChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          >
                            <option value={CertificateType.MEDICAL}>Medical</option>
                            <option value={CertificateType.TRAINING}>Training</option>
                            <option value={CertificateType.EDUCATION}>Education</option>
                            <option value={CertificateType.MILITARY}>Military</option>
                            <option value={CertificateType.OTHER}>Other</option>
                          </select>
                        </div>

                        <div className="mb-4">
                          <label htmlFor="certificateFile" className="block text-sm font-medium text-gray-700 mb-1">
                            Certificate File (PDF only, max 10MB)
                          </label>
                          <input
                            type="file"
                            id="certificateFile"
                            onChange={handleCertificateFileChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            accept=".pdf"
                          />
                          {certificateErrors.file && (
                            <p className="mt-1 text-sm text-red-600">{certificateErrors.file}</p>
                          )}
                          <p className="mt-1 text-xs text-gray-500">
                            Please upload a PDF file. Accepted file types: .pdf
                          </p>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button
                  variant="primary"
                  type="button"
                  onClick={handleCertificateUpload}
                  disabled={uploadingCertificate}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {uploadingCertificate ? 'Uploading...' : 'Upload Certificate'}
                </Button>
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setShowCertificateModal(false)}
                  disabled={uploadingCertificate}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
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