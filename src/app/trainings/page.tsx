"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { 
  AcademicCapIcon, 
  CalendarIcon, 
  MapPinIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import ConfirmationDialog from '@/components/ConfirmationDialog';
import { toast } from 'react-hot-toast';
import { auditService } from '@/utils/auditService';
import { autoTable } from 'jspdf-autotable';
import { ITraining } from '@/models/Training';
import { UserRole } from '@/models/Personnel';
// Remove static imports and type declarations - we'll do them dynamically
// import jsPDF from 'jspdf';
// import 'jspdf-autotable';
// declare module 'jspdf' {
//   interface jsPDF {
//     autoTable: (options: any) => jsPDF;
//   }
// }

type TrainingStatus = 'upcoming' | 'ongoing' | 'completed';
type RegistrationStatus = 'registered' | 'not_registered' | 'completed' | 'cancelled';

interface Training {
  id?: string;
  _id?: string;
  title: string;
  description: string;
  type?: string;
  startDate: string;
  endDate: string;
  location: string | { 
    name?: string;
    address?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    }
  };
  locationDisplay?: string;
  status: TrainingStatus;
  capacity: number;
  registered: number;
  registrationStatus?: RegistrationStatus;
  instructor?: string | {
    name?: string;
    rank?: string;
    specialization?: string;
    contactInfo?: string;
  };
  instructorDisplay?: string;
  category?: string;
  mandatory?: boolean;
  attendees?: Array<any>;
  tags?: string[];
}

export default function TrainingsPage() {
  const { user, isAuthenticated, isLoading, hasSpecificPermission } = useAuth();
  const router = useRouter();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'registered' | 'past'>('upcoming');
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [trainingToCancel, setTrainingToCancel] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingCSV, setExportingCSV] = useState(false);
  
  // Add state for creating trainings
  const [showCreateTrainingModal, setShowCreateTrainingModal] = useState(false);
  const [newTraining, setNewTraining] = useState<Partial<Training>>({
    title: '',
    description: '',
    type: '',
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
    location: {
      name: '',
      address: ''
    },
    instructor: {
      name: '',
      rank: ''
    },
    capacity: 20,
    category: '',
    mandatory: false,
    tags: []
  });
  
  // Add state for editing trainings
  const [showEditTrainingModal, setShowEditTrainingModal] = useState(false);
  const [editTraining, setEditTraining] = useState<Partial<Training>>({
    title: '',
    description: '',
    type: '',
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
    location: {
      name: '',
      address: ''
    },
    instructor: {
      name: '',
      rank: ''
    },
    capacity: 20,
    category: '',
    mandatory: false,
    tags: []
  });
  
  // Add state for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6); // Show 6 items per page
  const [totalPages, setTotalPages] = useState(1);
  
  // Add a ref to track if we've already logged the page view
  const hasLoggedPageView = useRef(false);
  // Add a ref to track if jsPDF has been preloaded
  const jsPDFModuleRef = useRef<any>(null);
  const jsPDFAutoTableRef = useRef<boolean>(false);

  // Add state for seeding trainings
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }

    // Check for URL parameters that might specify which tab to show
    const searchParams = new URLSearchParams(window.location.search);
    const tab = searchParams.get('tab');
    if (tab && ['all', 'upcoming', 'registered', 'past'].includes(tab)) {
      setActiveTab(tab as 'all' | 'upcoming' | 'registered' | 'past');
    } else {
      // Default to 'upcoming' if no valid tab parameter is provided
      setActiveTab('upcoming');
    }

    const fetchTrainings = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        console.log('Fetching trainings for user:', user._id, 'with role:', user.role);
        
        // Get the auth token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('Authentication token not found');
          throw new Error('Authentication token not found');
        }
        
        // Call the API to retrieve trainings
        console.log('Making API request to /api/trainings');
        const response = await fetch('/api/trainings', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API response not OK:', response.status, errorText);
          throw new Error(`Failed to fetch trainings: ${response.status} ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Trainings API response:', data);
        
        if (data.success) {
          // Process each training to calculate additional properties
          const now = new Date();
          const processedTrainings = data.data.trainings.map((training: any) => {
            // Parse dates into JavaScript Date objects
            const startDate = new Date(training.startDate);
            const endDate = new Date(training.endDate);
            
            // Calculate training status based on dates
            let status: TrainingStatus = 'upcoming';
            if (now > endDate) {
              status = 'completed';
            } else if (now >= startDate && now <= endDate) {
              status = 'ongoing';
            }
            
            // Create display strings for complex objects
            const locationDisplay = typeof training.location === 'object' 
              ? (training.location?.name || training.location?.address || 'No location specified') 
              : (training.location && training.location.trim() !== '' ? training.location : 'No location specified');
            
            const instructorDisplay = typeof training.instructor === 'object'
              ? ((training.instructor?.rank ? `${training.instructor.rank} ` : '') + (training.instructor?.name || 'TBD'))
              : (training.instructor && training.instructor.trim() !== '' ? training.instructor : 'TBD');
            
            return {
              id: training._id,
              _id: training._id,
              title: training.title,
              description: training.description || '',
              type: training.type,
              startDate: training.startDate || new Date().toISOString(),
              endDate: training.endDate || new Date().toISOString(),
              location: training.location,
              locationDisplay,
              status, // Use the calculated status based on dates
              capacity: training.capacity || 0,
              registered: training.attendees?.length || 0,
              registrationStatus: training.registrationStatus || 'not_registered',
              instructor: training.instructor,
              instructorDisplay,
              category: training.type || 'Other', // Use type as category, default to 'Other'
              mandatory: training.mandatory || false,
              attendees: training.attendees || [],
              tags: training.tags || []
            };
          });
          
          console.log(`Processed ${processedTrainings.length} trainings`);
          setTrainings(processedTrainings);
        } else {
          console.error('API returned error:', data.error);
          throw new Error(data.error || 'Failed to load trainings');
        }
      } catch (error) {
        console.error('Error fetching trainings:', error);
        toast.error('Failed to load trainings. Please try again later.');
        
        // For development purposes, try to seed some data if none exists and user is admin
        if (user && (['administrator', 'admin', 'director'].includes(user.role as string))) {
          console.log('Admin user detected. You may want to seed training data using the /api/trainings/seed endpoint.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTrainings();
    
    // Log page view to audit log - only once per session
    if (user && !hasLoggedPageView.current) {
      auditService.logPageView(
        user._id,
        `${user.firstName} ${user.lastName}`,
        user.role,
        '/trainings'
      );
      hasLoggedPageView.current = true;
    }
  }, [isLoading, isAuthenticated, router, user]);

  // Preload the PDF modules
  useEffect(() => {
    // Preload jsPDF in the background after the component mounts
    const preloadJsPDF = async () => {
      try {
        const jsPDFModule = await import('jspdf');
        await import('jspdf-autotable');
        
        jsPDFModuleRef.current = jsPDFModule;
        jsPDFAutoTableRef.current = true;
        
        console.log('jsPDF modules preloaded successfully');
      } catch (error) {
        console.error('Error preloading jsPDF:', error);
      }
    };
    
    preloadJsPDF();
  }, []);

  const handleRegister = async (trainingId: string | undefined) => {
    try {
      if (!trainingId) {
        throw new Error('Training ID is required');
      }
      
      setLoading(true);
      
      // Get the auth token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Authentication token not found');
        throw new Error('Authentication token not found');
      }
      
      // Call the API to register for the training
      const response = await fetch('/api/trainings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          trainingId, 
          action: 'register' 
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to register for training');
      }
      
      const data = await response.json();
      
      // Update local state with the updated training
      setTrainings(prevTrainings => 
        prevTrainings.map(training => 
          training.id === trainingId ? { 
            ...training,
            registrationStatus: 'registered',
            registered: training.registered + 1,
            attendees: data.data.training.attendees || training.attendees 
          } : training
        )
      );

      // If currently on the "Upcoming" tab, automatically switch to "Registered" tab
      // to show the user their registration immediately
      if (activeTab === 'upcoming') {
        setActiveTab('registered');
      }

      toast.success('You have been registered for the training. Switched to "Registered" tab.');
    } catch (error) {
      console.error('Error registering for training:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to register for training');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRegistrationClick = (trainingId: string | undefined) => {
    if (!trainingId) {
      toast.error('Training ID is required');
      return;
    }
    setTrainingToCancel(trainingId);
    setShowCancelConfirmation(true);
  };

  const handleCancelRegistration = async () => {
    if (!user || !trainingToCancel) return;

    try {
      // Get the auth token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch('/api/trainings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          trainingId: trainingToCancel,
          action: 'cancel',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel registration');
      }

      const data = await response.json();
      
      // Update local state with the updated training
      setTrainings(prevTrainings => 
        prevTrainings.map(training => 
          training.id === trainingToCancel ? {
            ...training,
            registrationStatus: 'not_registered',
            registered: Math.max(0, training.registered - 1),
            attendees: data.data.training.attendees || []
          } : training
        )
      );

      setTrainingToCancel(null);
      setShowCancelConfirmation(false);
      
      // If currently on the "Registered" tab and this was the only registered training,
      // automatically switch to "Upcoming" tab to show the user available trainings
      if (activeTab === 'registered') {
        const remainingRegisteredTrainings = trainings.filter(
          t => t.id !== trainingToCancel && t.registrationStatus === 'registered'
        );
        
        if (remainingRegisteredTrainings.length === 0) {
          setActiveTab('upcoming');
          toast.success('Your registration has been cancelled. Switched to "Upcoming" tab.');
        } else {
          toast.success('Your registration has been cancelled.');
        }
      } else {
        toast.success('Your registration has been cancelled.');
      }
    } catch (error) {
      console.error('Error cancelling registration:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to cancel registration');
    }
  };

  const handleViewDetails = (training: Training) => {
    setSelectedTraining(training);
    setShowDetailsModal(true);
    
    // Fetch detailed personnel data for this training
    const fetchPersonnelData = async () => {
      try {
        // Get the auth token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('Authentication token not found');
          return;
        }
        
        console.log(`Fetching personnel data for training: ${training.title} (ID: ${training.id || training._id})`);
        
        // Call the API to get personnel data for this training
        const response = await fetch(`/api/trainings/personnel?trainingId=${training.id || training._id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          console.error('Failed to fetch personnel data:', response.status);
          return;
        }
        
        const data = await response.json();
        console.log('Personnel data response:', data);
        
        if (data.success && data.data.attendees) {
          console.log(`Received ${data.data.attendees.length} attendees from API`);
          
          // Update the training with the enhanced attendee data
          setSelectedTraining({
            ...training,
            attendees: data.data.attendees
          });
        } else {
          console.log('No attendees data in API response or unsuccessful request');
        }
      } catch (error) {
        console.error('Error fetching personnel data:', error);
      }
    };
    
    fetchPersonnelData();
  };

  // Move state-setting logic from filteredTrainings into a useEffect hook
  useEffect(() => {
    // Apply filtering logic
    let filtered: Training[] = [];
    
    switch (activeTab) {
      case 'all':
        filtered = trainings;
        break;
      case 'upcoming':
        filtered = trainings.filter(training => 
          (training.status === 'upcoming' || training.status === 'ongoing') &&
          training.registrationStatus !== 'registered'
        );
        break;
      case 'registered':
        filtered = trainings.filter(training => 
          training.registrationStatus === 'registered'
        );
        break;
      case 'past':
        filtered = trainings.filter(training => 
          training.status === 'completed' || training.registrationStatus === 'completed' ||
          new Date(training.endDate) < new Date() // Consider end dates in the past
        );
        break;
      default:
        filtered = trainings;
    }
    
    // Update total pages based on filtered results
    setTotalPages(Math.max(1, Math.ceil(filtered.length / itemsPerPage)));
    
    // Ensure currentPage is valid after filtering
    if (currentPage > Math.ceil(filtered.length / itemsPerPage) && filtered.length > 0) {
      setCurrentPage(1);
    }
  }, [trainings, activeTab, currentPage, itemsPerPage]);

  // Modify the filteredTrainings function to handle past trainings
  const filteredTrainings = () => {
    let filtered: Training[] = [];
    
    switch (activeTab) {
      case 'all':
        filtered = trainings;
        break;
      case 'upcoming':
        filtered = trainings.filter(training => 
          (training.status === 'upcoming' || training.status === 'ongoing') &&
          training.registrationStatus !== 'registered'
        );
        break;
      case 'registered':
        filtered = trainings.filter(training => 
          training.registrationStatus === 'registered'
        );
        break;
      case 'past':
        filtered = trainings.filter(training => 
          training.status === 'completed' || training.registrationStatus === 'completed' ||
          new Date(training.endDate) < new Date() // Consider end dates in the past
        );
        break;
      default:
        filtered = trainings;
    }
    
    // Calculate pagination indices
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    // Return paginated results
    return filtered.slice(startIndex, endIndex);
  };

  // Add date format helper functions
  const formatDateForDisplay = (dateString: string | undefined) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      // Format: MM/DD/YYYY hh:mm AM/PM (Filipino-friendly format)
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const year = date.getFullYear();
      
      let hours = date.getHours();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // Convert 0 to 12
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${month}/${day}/${year} ${hours}:${minutes} ${ampm}`;
    } catch (error) {
      console.error('Error formatting date for display:', error);
      return '';
    }
  };
  
  const formatDateForInput = (dateString: string | undefined) => {
    if (!dateString) return '';
    
    try {
      return new Date(dateString).toISOString().slice(0, 16);
    } catch (error) {
      console.error('Error formatting date for input:', error);
      return '';
    }
  };

  // Format dates in a readable way for display in the UI
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Date not specified';
    
    try {
      // Use Filipino-friendly date format (Month Day, Year at h:mm AM/PM)
      const options: Intl.DateTimeFormatOptions = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true // Use 12-hour format with AM/PM
      };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  // Use useCallback for export functions to prevent unnecessary re-renders
  const exportToCSV = useCallback((training: Training) => {
    // Prevent multiple clicks
    if (exportingCSV) return;
    
    setExportingCSV(true);
    try {
      // Show loading toast
      const loadingToast = toast.loading('Preparing CSV export...');

      // Helper function to sanitize and escape CSV fields to handle commas, quotes, etc.
      const escapeCSV = (field: any): string => {
        // Convert to string and handle null/undefined
        const str = field === null || field === undefined ? '' : String(field);
        
        // Check if the string contains characters that need escaping
        if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
          // Escape quotes by doubling them and wrap the entire field in quotes
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };
      
      // Create CSV content with proper structure
      let csvContent = 'data:text/csv;charset=utf-8,';
      
      // Add document title and metadata
      csvContent += 'TRAINING DETAILS REPORT\r\n';
      csvContent += `Generated on,${new Date().toLocaleString()}\r\n`;
      csvContent += `Training ID,${escapeCSV(training.id || training._id || 'N/A')}\r\n\r\n`;
      
      // Section 1: Training Information
      csvContent += 'TRAINING INFORMATION\r\n';
      csvContent += 'Field,Value\r\n';
      csvContent += `Title,${escapeCSV(training.title)}\r\n`;
      csvContent += `Description,${escapeCSV(training.description || 'No description provided')}\r\n`;
      csvContent += `Category/Type,${escapeCSV(training.category || 'N/A')}\r\n`;
      csvContent += `Status,${escapeCSV(training.status.charAt(0).toUpperCase() + training.status.slice(1))}\r\n`;
      csvContent += `Mandatory,${training.mandatory ? 'Yes' : 'No'}\r\n\r\n`;
      
      // Section 2: Schedule and Location
      csvContent += 'SCHEDULE AND LOCATION\r\n';
      csvContent += 'Field,Value\r\n';
      csvContent += `Start Date,${escapeCSV(formatDate(training.startDate))}\r\n`;
      csvContent += `End Date,${escapeCSV(formatDate(training.endDate))}\r\n`;
      csvContent += `Location,${escapeCSV(training.locationDisplay || 'N/A')}\r\n`;
      csvContent += `Instructor,${escapeCSV(training.instructorDisplay || 'N/A')}\r\n\r\n`;
      
      // Section 3: Registration Information
      csvContent += 'REGISTRATION INFORMATION\r\n';
      csvContent += 'Field,Value\r\n';
      csvContent += `Capacity,${escapeCSV(training.capacity)}\r\n`;
      csvContent += `Registered,${escapeCSV(training.registered)}\r\n`;
      csvContent += `Availability,${escapeCSV(training.capacity - training.registered)} slots remaining\r\n`;
      csvContent += `Registration Percentage,${Math.round((training.registered / training.capacity) * 100)}%\r\n`;
      
      // Add user registration status if available
      if (training.registrationStatus) {
        let statusText = '';
        
        if (training.registrationStatus === 'registered') {
          statusText = 'You are registered for this training';
        } else if (training.registrationStatus === 'completed') {
          statusText = 'You have completed this training';
        } else if (training.registrationStatus === 'cancelled') {
          statusText = 'Your registration was cancelled';
        } else {
          statusText = 'You are not registered for this training';
        }
        
        csvContent += `\r\nYour Status,${escapeCSV(statusText)}\r\n\r\n`;
      } else {
        csvContent += '\r\n';
      }
      
      // Section 4: Registered Personnel
      if (training.attendees && training.attendees.length > 0) {
        csvContent += 'REGISTERED PERSONNEL\r\n';
        
        // Table header with more comprehensive fields, adding Service ID
        csvContent += 'Serial Number,Rank,Last Name,First Name,Service ID,Company/Unit,Status,Registration Date\r\n';
        
        // Process and add the attendee rows with serial numbers
        training.attendees.forEach((attendee, index) => {
          const serialNumber = index + 1;
          
          // Get actual user data if available
          const rank = attendee.userData?.rank || '';
          const firstName = attendee.userData?.firstName || '';
          const lastName = attendee.userData?.lastName || '';

          // If we don't have a full name, try to extract it from email
          let fullName = '';
          if (attendee.userData?.fullName && attendee.userData.fullName.trim() !== '') {
            fullName = attendee.userData.fullName;
          } else if (`${firstName} ${lastName}`.trim() !== '') {
            fullName = `${firstName} ${lastName}`.trim();
          } else if (attendee.userData?.email) {
            // Try to extract name from email (format: firstname.lastname@domain)
            const email = attendee.userData.email;
            const localPart = email.split('@')[0];
            if (localPart && localPart.includes('.')) {
              const nameParts = localPart.split('.');
              if (nameParts.length >= 2) {
                const extractedFirstName = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1);
                const extractedLastName = nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1);
                fullName = `${extractedFirstName} ${extractedLastName}`;
              }
            }
          }

          // If still empty, use the email username or "Personnel" as fallback
          if (!fullName && attendee.userData?.email) {
            fullName = attendee.userData.email.split('@')[0] || 'Personnel';
          } else if (!fullName) {
            fullName = 'Personnel';
          }

          // Enhanced Service ID lookup - check multiple possible fields
          const serviceId = attendee.userData?.serviceId || 
                          attendee.userData?.militaryId || 
                          attendee.userData?.serialNumber || 
                          attendee.userData?.serviceNumber || 
                          attendee.userData?.afpSerialNumber || '';

          // Use the actual company from attendee data
          const company = attendee.userData?.company && attendee.userData.company !== 'Unassigned'
            ? attendee.userData.company
            : '';
          const status = attendee.status === 'attended' ? 'Attended' : 
            attendee.status.charAt(0).toUpperCase() + attendee.status.slice(1);
          const registrationDate = attendee.registrationDate 
            ? escapeCSV(new Date(attendee.registrationDate).toLocaleDateString())
            : escapeCSV(new Date().toLocaleDateString());
          
          csvContent += `${serialNumber},${rank},${lastName},${firstName},${serviceId},${company},${status},${registrationDate}\r\n`;
        });
      } else {
        csvContent += 'REGISTERED PERSONNEL\r\n';
        csvContent += 'No personnel registered for this training.\r\n';
      }
      
      // Add footer with system information
      csvContent += '\r\nReport generated from,AFP Personnel Management System\r\n';
      
      // Encode and trigger download
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `${training.title.replace(/\s+/g, '_')}_details.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success('CSV export successful!');
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      toast.error('Failed to export as CSV. Please try again.');
    } finally {
      setExportingCSV(false);
    }
  }, []);
  
  // Function to export training details to PDF
  const exportToPDF = useCallback(async (training: Training) => {
    // Prevent multiple clicks
    if (exportingPDF) return;
    
    // Create a safe copy of the training data with all required fields
    // This ensures we have default values for everything to prevent undefined errors
    const safeTraining = {
      ...training,
      title: training.title || 'Untitled Training',
      description: training.description || 'No description provided',
      category: training.category || training.type || 'N/A',
      startDate: training.startDate || new Date().toISOString(),
      endDate: training.endDate || new Date().toISOString(),
      locationDisplay: training.locationDisplay || 
        (typeof training.location === 'object' ? 
          (training.location?.name || training.location?.address || 'N/A') : 
          training.location || 'N/A'),
      instructorDisplay: training.instructorDisplay || 
        (typeof training.instructor === 'object' ? 
          training.instructor?.name || 'N/A' : 
          training.instructor || 'N/A'),
      status: training.status || 'upcoming',
      capacity: Number(training.capacity) || 0,
      registered: Number(training.registered) || 0,
      registrationStatus: training.registrationStatus || 'not_registered',
      attendees: Array.isArray(training.attendees) ? training.attendees : []
    };
    
    // Ensure we have the correct count even if attendees list exists
    if (Array.isArray(safeTraining.attendees) && safeTraining.attendees.length > 0 && safeTraining.registered === 0) {
      safeTraining.registered = safeTraining.attendees.length;
    }
    
    setExportingPDF(true);
    // Show loading toast to indicate the export is in progress
    const loadingToast = toast.loading('Preparing PDF export...');
    
    try {
      let jsPDFModule;
      
      // Check if we already have the module loaded
      if (jsPDFModuleRef.current) {
        jsPDFModule = jsPDFModuleRef.current;
        // Make sure autotable is loaded too
        if (!jsPDFAutoTableRef.current) {
          await import('jspdf-autotable');
          jsPDFAutoTableRef.current = true;
        }
      } else {
        // Dynamically import jsPDF and jspdf-autotable only when needed
        jsPDFModule = await import('jspdf');
        await import('jspdf-autotable');
        
        // Save for future use
        jsPDFModuleRef.current = jsPDFModule;
        jsPDFAutoTableRef.current = true;
      }
      
      // Create a new jsPDF instance
      const doc = new jsPDFModule.default();
      
      // Use a consistent font throughout the document
      const fontFamily = 'helvetica';

      // Set document properties
      doc.setProperties({
        title: `${safeTraining.title} - Training Details`,
        subject: 'Training Report',
        author: 'AFP Personnel Management System',
        creator: 'AFP Personnel Management System'
      });

      // Define simple colors
      const primaryColor = [79, 70, 229]; // Indigo color to match app theme
      const textColor = [60, 60, 60]; // Dark gray

      // Simple header
      doc.setFillColor(237, 233, 254); // Very light indigo background
      doc.rect(10, 10, doc.internal.pageSize.width - 20, 20, 'F');

      // Add document title
      doc.setFontSize(16);
      doc.setFont(fontFamily, 'bold');
      doc.setTextColor(...primaryColor);
      doc.text(safeTraining.title, 15, 22);

      // Add "Training Report" subtitle
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("AFP Personnel Management System - Training Report", 15, 28);

      // Reset styles for body content
      doc.setFont(fontFamily, 'normal');
      doc.setTextColor(...textColor);
      
      // Add description section
      let yPos = 40;

      // Simple section divider
      doc.setLineWidth(0.1);
      doc.setDrawColor(200, 200, 200);
      doc.line(10, yPos, doc.internal.pageSize.width - 10, yPos);
      yPos += 6;

      doc.setFontSize(12);
      doc.setFont(fontFamily, 'bold');
      doc.text('Description:', 10, yPos);
      doc.setFont(fontFamily, 'normal');
      doc.setFontSize(10);

      // Handle long descriptions with text wrapping
      const descriptionLines = doc.splitTextToSize(
        safeTraining.description, 
        180
      );
      yPos += 6;
      doc.text(descriptionLines, 10, yPos);

      // Calculate Y position after description (dynamic)
      yPos += (descriptionLines.length * 5) + 8;

      // Add training details section header
      doc.setLineWidth(0.1);
      doc.setDrawColor(200, 200, 200);
      doc.line(10, yPos, doc.internal.pageSize.width - 10, yPos);
      yPos += 6;

      doc.setFontSize(12);
      doc.setFont(fontFamily, 'bold');
      doc.text('Training Details', 10, yPos);
      yPos += 8;

      // Function to add a label-value pair
      const addLabelValue = (label: string, value: string, x: number, y: number, maxWidth: number = 80) => {
        doc.setFont(fontFamily, 'bold');
        doc.setFontSize(9);
        doc.text(label, x, y);
        
        doc.setFont(fontFamily, 'normal');
        doc.setFontSize(9);
        
        // Handle potential long values with wrapping
        const valueLines = doc.splitTextToSize(value, maxWidth);
        const valueY = y + 5;
        doc.text(valueLines, x, valueY);
        
        // Return the total height needed
        return valueLines.length * 5 + 2;
      };
      
      // Create two columns
      const col1X = 15;
      const col2X = 105;
      const baseRowHeight = 14;
      
      // First row
      let row1Y = yPos + 6;
      addLabelValue('START DATE:', formatDate(safeTraining.startDate), col1X, row1Y);
      addLabelValue('CATEGORY:', safeTraining.category, col2X, row1Y);
      
      // Second row
      let row2Y = row1Y + baseRowHeight;
      addLabelValue('END DATE:', formatDate(safeTraining.endDate), col1X, row2Y);
      
      // Status with simple text
      const statusText = safeTraining.status.charAt(0).toUpperCase() + safeTraining.status.slice(1);
      addLabelValue('STATUS:', statusText, col2X, row2Y);
      
      // Third row
      let row3Y = row2Y + baseRowHeight;
      addLabelValue('LOCATION:', safeTraining.locationDisplay, col1X, row3Y);
      addLabelValue('CAPACITY:', safeTraining.capacity.toString(), col2X, row3Y);
      
      // Fourth row
      let row4Y = row3Y + baseRowHeight;
      addLabelValue('INSTRUCTOR:', safeTraining.instructorDisplay, col1X, row4Y);
      
      // Registration progress with simple text
      const registrationText = `${safeTraining.registered} of ${safeTraining.capacity}`;
      addLabelValue('REGISTERED:', registrationText, col2X, row4Y);
      
      // Simple progress bar
      const progressBarWidth = 50;
      const progressBarHeight = 3;
      const progressBarX = col2X;
      const progressBarY = row4Y + 8;
      const progress = safeTraining.capacity > 0 ? Math.min(safeTraining.registered / safeTraining.capacity, 1) : 0;
      
      // Draw background bar (light gray)
      doc.setFillColor(226, 232, 240); // Light slate gray
      doc.rect(progressBarX, progressBarY, progressBarWidth, progressBarHeight, 'F');
      
      // Draw progress
      if (progress > 0) {
        doc.setFillColor(...primaryColor); // Use indigo for progress
        doc.rect(progressBarX, progressBarY, progressBarWidth * progress, progressBarHeight, 'F');
      }
      
      // Add percentage text
      const percentText = `${Math.round(progress * 100)}%`;
      doc.setFontSize(8);
      doc.text(percentText, progressBarX + progressBarWidth + 5, progressBarY + 2);
      
      // Update yPos after all details
      yPos = row4Y + 16;
      
      // Add registration status section if applicable
      if (safeTraining.registrationStatus) {
        yPos += 4;
        
        let statusText = '';
        
        if (safeTraining.registrationStatus === 'registered') {
          statusText = 'You are registered for this training';
        } else if (safeTraining.registrationStatus === 'completed') {
          statusText = 'You have completed this training';
        } else if (safeTraining.registrationStatus === 'cancelled') {
          statusText = 'Your registration was cancelled';
        } else {
          statusText = 'You are not registered for this training';
        }
        
        // Draw a simple box for status
        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(0.5);
        doc.rect(10, yPos, doc.internal.pageSize.width - 20, 10, 'S');
        
        doc.setFontSize(10);
        doc.setFont(fontFamily, 'bold');
        
        // Center the text
        const statusWidth = doc.getStringUnitWidth(statusText) * 10 / doc.internal.scaleFactor;
        const statusX = (doc.internal.pageSize.width - statusWidth) / 2;
        doc.text(statusText, statusX, yPos + 6);
        
        yPos += 16;
      }
      
      // Add personnel section
      if (safeTraining.attendees && safeTraining.attendees.length > 0) {
        // Create the personnel table
        const tableHeaders = [['Rank', 'Name', 'Service ID', 'Company', 'Status']];
        
        // Generate the personnel data using the same pattern
        const ranks = ['Private', 'Corporal', 'Sergeant', 'Lieutenant', 'Captain', 'Major', 'Colonel'];
        const firstNames = ['Juan', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Lourdes', 'Antonio', 'Elena'];
        const lastNames = ['Santos', 'Reyes', 'Cruz', 'Garcia', 'Gonzales', 'Mendoza', 'Dela Cruz', 'Bautista'];
        const companies = ['1st Infantry Division', '2nd Infantry Division', 'Special Forces', 'Intelligence Unit', 'Naval Forces', 'Air Force Squadron'];
        
        const tableData = safeTraining.attendees.map((attendee, index) => {
          // Get actual user data if available
          const rank = attendee.userData?.rank || '';
          const firstName = attendee.userData?.firstName || '';
          const lastName = attendee.userData?.lastName || '';

          // If we don't have a full name, try to extract it from email
          let fullName = '';
          if (attendee.userData?.fullName && attendee.userData.fullName.trim() !== '') {
            fullName = attendee.userData.fullName;
          } else if (`${firstName} ${lastName}`.trim() !== '') {
            fullName = `${firstName} ${lastName}`.trim();
          } else if (attendee.userData?.email) {
            // Try to extract name from email (format: firstname.lastname@domain)
            const email = attendee.userData.email;
            const localPart = email.split('@')[0];
            if (localPart && localPart.includes('.')) {
              const nameParts = localPart.split('.');
              if (nameParts.length >= 2) {
                const extractedFirstName = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1);
                const extractedLastName = nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1);
                fullName = `${extractedFirstName} ${extractedLastName}`;
              }
            }
          }

          // If still empty, use the email username or "Personnel" as fallback
          if (!fullName && attendee.userData?.email) {
            fullName = attendee.userData.email.split('@')[0] || 'Personnel';
          } else if (!fullName) {
            fullName = 'Personnel';
          }
          
          // Enhanced Service ID lookup - check multiple possible fields
          const serviceId = attendee.userData?.serviceId || 
                          attendee.userData?.militaryId || 
                          attendee.userData?.serialNumber || 
                          attendee.userData?.serviceNumber || 
                          attendee.userData?.afpSerialNumber || '';

          // Use the actual company from attendee data
          const company = attendee.userData?.company && attendee.userData.company !== 'Unassigned'
            ? attendee.userData.company
            : '';
          const status = attendee.status === 'attended' ? 'Attended' : 
            attendee.status.charAt(0).toUpperCase() + attendee.status.slice(1);
          
          return [rank, fullName, serviceId, company, status];
        });
        
        // Draw the table
        autoTable(doc, {
          startY: yPos,
          head: tableHeaders,
          body: tableData,
          theme: 'striped',
          headStyles: {
            fillColor: [80, 80, 80],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 8
          },
          bodyStyles: {
            fontSize: 8
          },
          margin: { left: 10, right: 10 },
          styles: {
            font: fontFamily,
            overflow: 'linebreak'
          }
        });
        
        // Update yPos
        yPos = (doc as any).lastAutoTable.finalY + 10;
      }
      
      // Add simple footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.1);
        doc.line(10, doc.internal.pageSize.height - 15, doc.internal.pageSize.width - 10, doc.internal.pageSize.height - 15);
        
        // Footer text
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.setFont(fontFamily, 'normal');
        
        // Left side - generation date
        doc.text(
          `Generated on ${new Date().toLocaleString()}`, 
          15, 
          doc.internal.pageSize.height - 10
        );
        
        // Right side - page numbers
        doc.text(
          `Page ${i} of ${pageCount}`, 
          doc.internal.pageSize.width - 30, 
          doc.internal.pageSize.height - 10
        );
      }
      
      // Save PDF file with a safe filename
      const safeFileName = safeTraining.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      doc.save(`${safeFileName}_details.pdf`);
      
      // Dismiss loading toast and show success message
      toast.dismiss(loadingToast);
      toast.success('PDF export successful!');
    } catch (error) {
      // Dismiss loading toast and show error
      toast.dismiss(loadingToast);
      console.error('Error exporting to PDF:', error);
      
      // Provide more specific error message based on the type of error
      if (error instanceof Error) {
        if (error.message.includes('Cannot read properties') || error.message.includes('undefined')) {
          toast.error('PDF library not loaded properly. Please try again in a moment.');
        } else {
          toast.error(`Failed to export as PDF: ${error.message}`);
        }
      } else {
        toast.error('Failed to export as PDF. Please try again.');
      }
    } finally {
      setExportingPDF(false);
    }
  }, [formatDate]);

  // After fetchTrainings, add a function to seed trainings
  const seedTrainings = async () => {
    try {
      // Only admin users should be able to seed trainings
      if (!user || !['administrator', 'admin', 'director'].includes(user.role as string)) {
        toast.error('Only administrators can seed training data');
        return;
      }

      setIsSeeding(true);
      try {
        // Get the auth token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token not found');
        }

        // Call the training seed API
        const response = await fetch('/api/trainings/seed', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to seed trainings: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        if (data.success) {
          toast.success('Training data seeded successfully');
          // Reload the trainings using the fetchTrainings function from useEffect
          const token = localStorage.getItem('token');
          if (token) {
            setLoading(true);
            try {
              const response = await fetch('/api/trainings', {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
              if (!response.ok) {
                throw new Error('Failed to fetch trainings');
              }
              
              const data = await response.json();
              if (data.success) {
                setTrainings(data.data.trainings.map((training: any) => {
                  const locationDisplay = typeof training.location === 'object' 
                    ? (training.location?.name || training.location?.address || 'No location specified') 
                    : (training.location && training.location.trim() !== '' ? training.location : 'No location specified');
                  
                  const instructorDisplay = typeof training.instructor === 'object'
                    ? ((training.instructor?.rank ? `${training.instructor.rank} ` : '') + (training.instructor?.name || 'TBD'))
                    : (training.instructor && training.instructor.trim() !== '' ? training.instructor : 'TBD');
                  
                  return {
                    id: training._id,
                    _id: training._id,
                    title: training.title,
                    description: training.description || '',
                    type: training.type,
                    startDate: training.startDate || new Date().toISOString(),
                    endDate: training.endDate || new Date().toISOString(),
                    location: training.location,
                    locationDisplay,
                    status: training.status,
                    capacity: training.capacity || 0,
                    registered: training.attendees?.length || 0,
                    registrationStatus: training.registrationStatus || 'not_registered',
                    instructor: training.instructor,
                    instructorDisplay,
                    category: training.type || 'Other',
                    mandatory: training.mandatory || false,
                    attendees: training.attendees || [],
                    tags: training.tags || []
                  };
                }));
              }
            } catch (error) {
              console.error('Error reloading trainings:', error);
            } finally {
              setLoading(false);
            }
          }
        } else {
          throw new Error(data.error || 'Failed to seed trainings');
        }
      } catch (error) {
        console.error('Error seeding trainings:', error);
        toast.error('Failed to seed training data. Please try again later.');
      } finally {
        setIsSeeding(false);
      }
    } catch (error) {
      console.error('Error seeding trainings:', error);
      toast.error('Failed to seed training data. Please try again later.');
    }
  };

  // Add handler for opening the create training modal
  const handleCreateTrainingClick = () => {
    setShowCreateTrainingModal(true);
  };
  
  // Add handler for submitting a new training
  const handleCreateTraining = async () => {
    try {
      setLoading(true);
      
      // Get the auth token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Create the training data
      const trainingData = {
        ...newTraining,
        status: 'upcoming' as TrainingStatus
      };
      
      // Call the API to create a new training using our dedicated endpoint
      const response = await fetch('/api/trainings/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          training: trainingData 
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create training: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Training created successfully!');
        
        // Reset the form
        setNewTraining({
          title: '',
          description: '',
          type: '',
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
          location: {
            name: '',
            address: ''
          },
          instructor: {
            name: '',
            rank: ''
          },
          capacity: 20,
          category: '',
          mandatory: false,
          tags: []
        });
        
        // Close the modal
        setShowCreateTrainingModal(false);
        
        // Refresh the trainings using the dedicated refresh function
        await refreshTrainings();
        
        // Log the action
        auditService.logUserAction(
          user?._id || '',
          `${user?.firstName} ${user?.lastName}`,
          user?.role || '',
          'create',
          'training',
          data.data?.training?._id,
          `Created new training: ${trainingData.title}`
        );
      } else {
        throw new Error(data.error || 'Failed to create training');
      }
    } catch (error) {
      console.error('Error creating training:', error);
      toast.error('Failed to create training. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Add a dedicated function to refresh trainings
  const refreshTrainings = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log('Refreshing trainings for user:', user._id, 'with role:', user.role);
      
      // Get the auth token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Authentication token not found');
        throw new Error('Authentication token not found');
      }
      
      // Call the API to get trainings with authorization header
      console.log('Making API request to /api/trainings');
      const response = await fetch('/api/trainings', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        // Add cache-busting parameter to ensure fresh data
        cache: 'no-store'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API response not OK:', response.status, errorText);
        throw new Error(`Failed to fetch trainings: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Received API response:', data);
      
      if (data.success) {
        // Map the API response to our Training interface with enhanced properties
        const enhancedTrainings = data.data.trainings.map((training: any) => {
          // Format the location display
          const locationDisplay = typeof training.location === 'object' 
            ? (training.location?.name || training.location?.address || 'No location specified') 
            : (training.location && training.location.trim() !== '' ? training.location : 'No location specified');
          
          // Format the instructor display
          const instructorDisplay = typeof training.instructor === 'object'
            ? ((training.instructor?.rank ? `${training.instructor.rank} ` : '') + (training.instructor?.name || 'TBD'))
            : (training.instructor && training.instructor.trim() !== '' ? training.instructor : 'TBD');
          
          return {
            id: training._id,
            _id: training._id,
            title: training.title,
            description: training.description || '',
            type: training.type,
            startDate: training.startDate || new Date().toISOString(),
            endDate: training.endDate || new Date().toISOString(),
            location: training.location,
            locationDisplay: locationDisplay,
            status: training.status,
            capacity: training.capacity || 0,
            registered: training.attendees?.length || 0,
            registrationStatus: training.registrationStatus || 'not_registered',
            instructor: training.instructor,
            instructorDisplay: instructorDisplay,
            category: training.type || 'Other',
            mandatory: training.mandatory || false,
            attendees: training.attendees || [],
            tags: training.tags || []
          };
        });
        
        setTrainings(enhancedTrainings);
        console.log('Updated training state with enhanced trainings:', enhancedTrainings);
      } else {
        throw new Error(data.error || 'Failed to fetch trainings');
      }
    } catch (error) {
      console.error('Error refreshing trainings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add pagination navigation functions
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Add handler for editing a training
  const handleEditTrainingClick = (training: Training) => {
    // Format dates properly
    const formattedTraining = {
      ...training,
      startDate: training.startDate,
      endDate: training.endDate,
      location: typeof training.location === 'string' 
        ? { name: training.location, address: '' } 
        : training.location,
      instructor: typeof training.instructor === 'string'
        ? { name: training.instructor, rank: '' }
        : training.instructor
    };
    
    setEditTraining(formattedTraining);
    setShowDetailsModal(false);
    setShowEditTrainingModal(true);
  };
  
  // Add handler for submitting an updated training
  const handleUpdateTraining = async () => {
    try {
      setLoading(true);
      
      // Get the auth token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Create the training data for update
      const trainingData = {
        ...editTraining
      };
      
      const trainingId = editTraining.id || editTraining._id;
      
      if (!trainingId) {
        throw new Error('Training ID is missing');
      }
      
      // Call the API to update the training
      const response = await fetch(`/api/trainings/${trainingId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          training: trainingData 
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update training: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Training updated successfully!');
        
        // Close the modal
        setShowEditTrainingModal(false);
        
        // Refresh the trainings using the dedicated refresh function
        await refreshTrainings();
        
        // Log the action
        auditService.logUserAction(
          user?._id || '',
          `${user?.firstName} ${user?.lastName}`,
          user?.role || '',
          'update',
          'training',
          trainingId,
          `Updated training: ${trainingData.title}`
        );
      } else {
        throw new Error(data.error || 'Failed to update training');
      }
    } catch (error) {
      console.error('Error updating training:', error);
      toast.error('Failed to update training. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-t-2 border-b-2 border-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const renderNoTrainingsFound = () => {
    // Get appropriate message based on active tab
    const getMessage = () => {
      switch (activeTab) {
        case 'all':
          return 'There are no trainings available at the moment.';
        case 'upcoming':
          return 'There are no upcoming trainings at the moment.';
        case 'registered':
          return 'You are not registered for any trainings.';
        case 'past':
          return 'There are no past trainings to display.';
        default:
          return 'There are no trainings available at the moment.';
      }
    };

    return (
      <div className="flex flex-col items-center justify-center py-10">
        <AcademicCapIcon className="w-12 h-12 mx-auto text-gray-400" />
        <div className="mb-4 text-center">
          <h3 className="mt-2 text-sm font-medium text-gray-900">No trainings found</h3>
          <p className="mt-1 text-sm text-gray-500">{getMessage()}</p>
        </div>
        
        {/* Admin seed option - only show for admins and only on the "all" or "upcoming" tabs */}
        {user && 
         (['administrator', 'admin', 'director'].includes(user.role as string)) && 
         (activeTab === 'all' || activeTab === 'upcoming') && 
         trainings.length === 0 && (
          <div className="p-4 mt-6 border border-blue-200 rounded-md bg-blue-50">
            <h4 className="mb-2 text-lg font-medium text-blue-800">Administrator Options</h4>
            <p className="mb-4 text-sm text-blue-600">No training data found in the system. As an administrator, you can seed some sample training data for testing.</p>
            <button
              onClick={seedTrainings}
              disabled={isSeeding}
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSeeding ? 'Seeding Trainings...' : 'Seed Training Data'}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="flex flex-col items-center justify-between mb-6 md:flex-row">
        <div className="flex items-center mb-4 md:mb-0">
          <AcademicCapIcon className="w-10 h-10 mr-3 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">Trainings & Seminars</h1>
        </div>
        
        {/* Add Create Training Button - only visible to staff */}
        {user && user.role === 'staff' && (
          <Button
            onClick={handleCreateTrainingClick}
            className="flex items-center px-6 py-3 font-bold text-white transition-all duration-200 transform bg-green-600 rounded-md shadow-md hover:bg-green-700 hover:scale-105"
            aria-label="Create Training"
          >
            <AcademicCapIcon className="w-6 h-6 mr-2" />
            <span className="text-base font-semibold">Create Training</span>
          </Button>
        )}
      </div>

      <div className="space-y-6">
        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 bg-indigo-100 rounded-full">
              <AcademicCapIcon className="w-8 h-8 text-indigo-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-medium text-gray-900">Trainings & Seminars</h2>
              <p className="text-sm text-gray-500">
                View and register for upcoming trainings and seminars
              </p>
            </div>
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
                All Trainings
              </button>
              <button
                className={`${
                  activeTab === 'upcoming'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
                onClick={() => setActiveTab('upcoming')}
              >
                Upcoming
              </button>
              <button
                className={`${
                  activeTab === 'registered'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
                onClick={() => setActiveTab('registered')}
              >
                Registered
              </button>
              <button
                className={`${
                  activeTab === 'past'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
                onClick={() => setActiveTab('past')}
              >
                Past Trainings
              </button>
            </nav>
          </div>

          <div className="mt-6">
            {filteredTrainings().length === 0 ? (
              renderNoTrainingsFound()
            ) : (
              <div className="grid grid-cols-1 gap-6 mt-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredTrainings().map((training) => (
                  <div key={training.id} className="flex flex-col h-full overflow-hidden bg-white rounded-lg shadow">
                    <div className="flex-grow px-4 py-5 sm:p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 p-3 bg-indigo-100 rounded-md">
                          <AcademicCapIcon className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div className="flex-1 w-0 ml-5">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">{training.category}</dt>
                            <dd>
                              <div className="text-lg font-medium text-gray-900 truncate">{training.title}</div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center text-sm text-gray-500">
                          <CalendarIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                          <span>{formatDate(training.startDate)} - {formatDate(training.endDate)}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPinIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                          <span>{training.locationDisplay}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <UserGroupIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                          <span>{training.registered} / {training.capacity} registered</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <ClockIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                          <span>
                            {training.status === 'upcoming' ? 'Upcoming' : 
                             training.status === 'ongoing' ? 'Ongoing' : 'Completed'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Standardized button layout with consistent grid */}
                      <div className="grid grid-cols-2 gap-2 mt-5">
                        <div>
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            fullWidth
                            className="flex items-center justify-center w-full h-10 font-medium text-blue-800 transition-colors bg-blue-100 border border-blue-300 rounded-md hover:bg-blue-200"
                            onClick={() => handleViewDetails(training)}
                          >
                            View Details
                          </Button>
                        </div>
                        
                        <div>
                          {training.status === 'upcoming' && training.registrationStatus === 'registered' ? (
                            <Button 
                              variant="danger" 
                              size="sm" 
                              fullWidth
                              className="bg-[#dc3545] text-white border-0 rounded-md px-5 h-10 flex items-center justify-center hover:bg-[#bb2d3b] font-medium shadow-sm"
                              onClick={() => {
                                setTrainingToCancel(training.id || '');
                                setShowCancelConfirmation(true);
                                setShowDetailsModal(false);
                              }}
                            >
                              Cancel Registration
                            </Button>
                          ) : training.status === 'upcoming' ? (
                            <Button 
                              variant="primary" 
                              size="sm" 
                              fullWidth
                              className="flex items-center justify-center w-full h-10 font-medium text-white transition-colors bg-green-600 border border-green-700 rounded-md hover:bg-green-700"
                              onClick={() => handleRegister(training.id || '')}
                              disabled={training.registered >= training.capacity}
                            >
                              Register
                            </Button>
                          ) : activeTab === 'past' || new Date(training.endDate) < new Date() ? (
                            <Button 
                              variant="secondary"
                              size="sm"
                              fullWidth
                              className="flex items-center justify-center w-full h-10 font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded-md"
                              disabled={true}
                            >
                              Past Training
                            </Button>
                          ) : (
                            <Button 
                              variant="secondary"
                              size="sm"
                              fullWidth
                              className="flex items-center justify-center w-full h-10 font-medium text-blue-800 bg-blue-100 border border-blue-300 rounded-md"
                              disabled={true}
                            >
                              Completed
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* No trainings message */}
      {filteredTrainings().length === 0 && renderNoTrainingsFound()}
      
      {/* Pagination controls */}
      {trainings.length > 0 && (
        <div className="flex items-center justify-center mt-8 space-x-2">
          <button
            onClick={() => goToPage(1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded-md ${
              currentPage === 1 
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
            }`}
            aria-label="Go to first page"
          >
            <span className="sr-only">First</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M7.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L3.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>
          
          <button
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded-md ${
              currentPage === 1 
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
            }`}
            aria-label="Go to previous page"
          >
            <span className="sr-only">Previous</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          
          <div className="flex space-x-1">
            {[...Array(totalPages).keys()].map((page) => (
              <button
                key={page + 1}
                onClick={() => goToPage(page + 1)}
                className={`px-3 py-1 rounded-md ${
                  currentPage === page + 1
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                }`}
                aria-label={`Go to page ${page + 1}`}
                aria-current={currentPage === page + 1 ? 'page' : undefined}
              >
                {page + 1}
              </button>
            ))}
          </div>
          
          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded-md ${
              currentPage === totalPages 
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
            }`}
            aria-label="Go to next page"
          >
            <span className="sr-only">Next</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          
          <button
            onClick={() => goToPage(totalPages)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded-md ${
              currentPage === totalPages 
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
            }`}
            aria-label="Go to last page"
          >
            <span className="sr-only">Last</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 15.707a1 1 0 001.414 0l5-5a1 1 0 000-1.414l-5-5a1 1 0 00-1.414 1.414L8.586 10 4.293 14.293a1 1 0 000 1.414z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M12.293 15.707a1 1 0 001.414 0l5-5a1 1 0 000-1.414l-5-5a1 1 0 00-1.414 1.414L16.586 10l-4.293 4.293a1 1 0 000 1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Training Details Modal */}
      {showDetailsModal && selectedTraining && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              {/* Header Section with Title */}
              <div className="px-6 py-4 bg-white border-b border-gray-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0 mr-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-lg">
                      <AcademicCapIcon className="w-6 h-6 text-indigo-600" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedTraining.title}</h2>
                    <p className="text-sm text-gray-600">
                      {selectedTraining.category} • {formatDate(selectedTraining.startDate)} to {formatDate(selectedTraining.endDate)}
                    </p>
                  </div>
                  <div className="ml-auto">
                    {selectedTraining.registrationStatus === 'registered' ? (
                      <div className="flex items-center px-3 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                        Registered
                      </div>
                    ) : (
                      <div className="flex items-center px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                        <XCircleIcon className="w-4 h-4 mr-1" />
                        Not Registered
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Main Content Area with Tabs */}
              <div className="bg-white">
                <div className="border-b border-gray-200">
                  <nav className="flex px-6 -mb-px space-x-8">
                    <button
                      className="px-1 py-4 text-sm font-medium text-indigo-600 border-b-2 border-indigo-500"
                      aria-current="page"
                    >
                      DESCRIPTION
                    </button>
                  </nav>
                </div>

                <div className="px-6 py-4">
                  {/* Description Section */}
                  <div>
                    <div className="mb-6">
                      <p className="text-sm text-gray-700">{selectedTraining.description}</p>
                    </div>

                    {/* Capacity Section */}
                    <div className="mb-4">
                      <h3 className="mb-2 text-sm font-medium text-gray-700 uppercase">CAPACITY</h3>
                      <div className="p-4 rounded-md bg-gray-50">
                        <div className="mb-2 text-xs font-semibold text-indigo-600">
                          {Math.round((selectedTraining.registered / selectedTraining.capacity) * 100)}% Full • {selectedTraining.registered}/{selectedTraining.capacity} Slots
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-indigo-600 h-2.5 rounded-full" 
                            style={{ width: `${(selectedTraining.registered / selectedTraining.capacity) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Training Details Section (shown in same tab for simplicity) */}
                    <div className="mb-4">
                      <h3 className="mb-2 text-sm font-medium text-gray-700 uppercase">TRAINING DETAILS</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="p-3 rounded-md bg-gray-50">
                            <div className="mb-1 text-xs font-medium text-gray-500">Location</div>
                            <div className="text-sm text-gray-900">{selectedTraining.locationDisplay}</div>
                          </div>
                        </div>
                        <div>
                          <div className="p-3 rounded-md bg-gray-50">
                            <div className="mb-1 text-xs font-medium text-gray-500">Instructor</div>
                            <div className="text-sm text-gray-900">{selectedTraining.instructorDisplay}</div>
                          </div>
                        </div>
                        <div>
                          <div className="p-3 rounded-md bg-gray-50">
                            <div className="mb-1 text-xs font-medium text-gray-500">Start Date</div>
                            <div className="text-sm text-gray-900">{formatDate(selectedTraining.startDate)}</div>
                          </div>
                        </div>
                        <div>
                          <div className="p-3 rounded-md bg-gray-50">
                            <div className="mb-1 text-xs font-medium text-gray-500">End Date</div>
                            <div className="text-sm text-gray-900">{formatDate(selectedTraining.endDate)}</div>
                          </div>
                        </div>
                        <div>
                          <div className="p-3 rounded-md bg-gray-50">
                            <div className="mb-1 text-xs font-medium text-gray-500">Status</div>
                            <div className="text-sm text-gray-900 capitalize">{selectedTraining.status}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Registered Personnel Section */}
                    <div>
                      <h3 className="mb-2 text-sm font-medium text-gray-700 uppercase">REGISTERED PERSONNEL</h3>
                      <div className="overflow-hidden bg-white border border-gray-200 rounded-md" style={{ maxHeight: "250px", overflowY: "auto" }}>
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="sticky top-0 bg-gray-50">
                            <tr>
                              <th scope="col" className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Rank</th>
                              <th scope="col" className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Name</th>
                              <th scope="col" className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Service ID</th>
                              <th scope="col" className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Company</th>
                              <th scope="col" className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Status</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {selectedTraining.attendees && selectedTraining.attendees.length > 0 ? (
                              // Filter attendees to remove duplicates and empty entries
                              selectedTraining.attendees
                                .filter((attendee, index, self) => {
                                  // Get unique userId - with null safety check
                                  const userId = attendee.userId 
                                    ? (typeof attendee.userId === 'object'
                                        ? (attendee.userId?._id || attendee.userId?.id || null) 
                                        : attendee.userId)
                                    : null;
                                  
                                  // Skip if no userId
                                  if (!userId) {
                                    return false;
                                  }
                                  
                                  // Check if this is the first occurrence of this userId
                                  return index === self.findIndex(a => {
                                    // Add null safety here too
                                    const aId = a.userId
                                      ? (typeof a.userId === 'object' 
                                          ? (a.userId?._id || a.userId?.id || null) 
                                          : a.userId)
                                      : null;
                                    return aId === userId;
                                  });
                                })
                                .map((attendee, index) => {
                                  // Get actual user data if available
                                  const rank = attendee.userData?.rank || '';
                                  
                                  // Get name info
                                  let fullName = '';
                                  if (attendee.userData?.fullName && attendee.userData.fullName.trim() !== '') {
                                    fullName = attendee.userData.fullName;
                                  } else if (attendee.userData?.firstName || attendee.userData?.lastName) {
                                    const firstName = attendee.userData?.firstName || '';
                                    const lastName = attendee.userData?.lastName || '';
                                    fullName = `${firstName} ${lastName}`.trim();
                                  } else if (attendee.userData?.email) {
                                    // Try to extract name from email (format: firstname.lastname@domain)
                                    const email = attendee.userData.email;
                                    const localPart = email.split('@')[0];
                                    if (localPart && localPart.includes('.')) {
                                      const nameParts = localPart.split('.');
                                      if (nameParts.length >= 2) {
                                        const extractedFirstName = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1);
                                        const extractedLastName = nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1);
                                        fullName = `${extractedFirstName} ${extractedLastName}`;
                                      }
                                    }
                                  }

                                  // If still empty, use the email username or "Personnel" as fallback
                                  if (!fullName && attendee.userData?.email) {
                                    fullName = attendee.userData.email.split('@')[0] || 'Personnel';
                                  } else if (!fullName) {
                                    // Try to get full name directly from userId reference if it exists
                                    if (attendee.userId && typeof attendee.userId === 'object') {
                                      const userRef = attendee.userId;
                                      if (userRef.firstName || userRef.lastName) {
                                        fullName = `${userRef.firstName || ''} ${userRef.lastName || ''}`.trim();
                                      } else {
                                        fullName = 'Personnel';
                                      }
                                    } else {
                                      fullName = 'Personnel';
                                    }
                                  }

                                  // Use the company from userData
                                  let company = attendee.userData?.company || '';
                                  
                                  // Enhanced Service ID lookup - check multiple possible fields
                                  let serviceId = '';
                                  if (attendee.userData) {
                                    serviceId = attendee.userData.serviceId || 
                                               attendee.userData.militaryId || 
                                               attendee.userData.serialNumber || 
                                               attendee.userData.serviceNumber || 
                                               attendee.userData.afpSerialNumber || '';
                                    
                                    // If still empty but we have a userId, use it as fallback
                                    if (!serviceId && attendee.userId) {
                                      const userIdStr = typeof attendee.userId === 'object' 
                                        ? (attendee.userId._id || attendee.userId.id || '').toString()
                                        : attendee.userId.toString();
                                      
                                      // Only use userId as serviceId if it's a relatively short string
                                      if (userIdStr && userIdStr.length < 15) {
                                        serviceId = userIdStr;
                                      }
                                    }
                                  }
                                  
                                  // If company is still empty, try to get it from userId reference
                                  if (!company && attendee.userId && typeof attendee.userId === 'object') {
                                    company = attendee.userId.company || '';
                                  }
                                  
                                  // Validate status based on training dates
                                  let status = attendee.status || 'registered';
                                  
                                  // Get training dates
                                  const now = new Date();
                                  const startDate = new Date(selectedTraining.startDate);
                                  const endDate = new Date(selectedTraining.endDate);
                                  
                                  // For upcoming trainings, override completed/attended statuses to registered
                                  if (startDate > now && (status === 'completed' || status === 'attended')) {
                                    status = 'registered';
                                  }
                                  
                                  // Format the status for display
                                  const displayStatus = status.charAt(0).toUpperCase() + status.slice(1);
                                  
                                  return (
                                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                      <td className="px-3 py-2 text-xs text-gray-900 whitespace-nowrap">{rank}</td>
                                      <td className="px-3 py-2 text-xs text-gray-900 whitespace-nowrap">{fullName}</td>
                                      <td className="px-3 py-2 text-xs text-gray-900 whitespace-nowrap">{serviceId}</td>
                                      <td className="px-3 py-2 text-xs text-gray-900 whitespace-nowrap">{company}</td>
                                      <td className="px-3 py-2 text-xs whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium 
                                          ${status === 'registered' ? 'bg-green-100 text-green-800' : 
                                            status === 'completed' ? 'bg-blue-100 text-blue-800' : 
                                            status === 'absent' ? 'bg-red-100 text-red-800' : 
                                            status === 'attended' ? 'bg-yellow-100 text-yellow-800' : 
                                            'bg-gray-100 text-gray-800'}`}>
                                          {displayStatus}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })
                            ) : (
                              <tr>
                                <td colSpan={5} className="px-3 py-4 text-sm text-center text-gray-500">
                                  {selectedTraining.registered > 0 
                                    ? "Mobile app registrations exist but detailed information is not available" 
                                    : "No personnel registered yet."}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer with Actions */}
              <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center space-x-3">
                  <Button
                    variant="secondary"
                    className="flex items-center justify-center px-4 font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-md h-9 hover:bg-gray-50"
                    onClick={() => setShowDetailsModal(false)}
                  >
                    Close
                  </Button>
                  
                  {/* Staff Edit Button */}
                  {user && user.role && (String(user.role).toLowerCase() === 'staff') && (
                    <Button
                      variant="secondary"
                      className="flex items-center justify-center px-4 font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-md h-9 hover:bg-gray-50"
                      onClick={() => handleEditTrainingClick(selectedTraining)}
                    >
                      <PencilIcon className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  )}
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex items-center px-2 space-x-1 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 h-9"
                      onClick={() => exportToCSV(selectedTraining)}
                      disabled={exportingCSV}
                    >
                      {exportingCSV ? (
                        <div className="w-4 h-4 border-t-2 border-b-2 border-gray-500 rounded-full animate-spin"></div>
                      ) : (
                        <ArrowDownTrayIcon className="w-4 h-4" />
                      )}
                      <span className="text-xs">CSV</span>
                    </Button>
                    
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex items-center px-2 space-x-1 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 h-9"
                      onClick={() => exportToPDF(selectedTraining)}
                      disabled={exportingPDF}
                    >
                      {exportingPDF ? (
                        <div className="w-4 h-4 border-t-2 border-b-2 border-gray-500 rounded-full animate-spin"></div>
                      ) : (
                        <DocumentTextIcon className="w-4 h-4" />
                      )}
                      <span className="text-xs">PDF</span>
                    </Button>
                  </div>
                </div>
                
                <div>
                  {selectedTraining && selectedTraining.status === 'upcoming' && (
                    selectedTraining.registrationStatus === 'registered' ? (
                      <Button
                        variant="danger"
                        className="flex items-center justify-center px-4 font-medium text-white transition-colors bg-red-600 border-0 rounded-md h-9 hover:bg-red-700"
                        onClick={() => {
                          setTrainingToCancel(selectedTraining.id || '');
                          setShowCancelConfirmation(true);
                          setShowDetailsModal(false);
                        }}
                      >
                        Cancel Registration
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        className="flex items-center justify-center px-4 font-medium text-white transition-colors bg-green-600 border border-green-700 rounded-md h-9 hover:bg-green-700"
                        onClick={() => handleRegister(selectedTraining.id || '')}
                        disabled={selectedTraining.registered >= selectedTraining.capacity}
                      >
                        Register
                      </Button>
                    )
                  )}
                  {selectedTraining && (selectedTraining.status === 'completed' || new Date(selectedTraining.endDate) < new Date()) && (
                    <div className="text-sm text-gray-500">
                      This training has ended
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Registration Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showCancelConfirmation}
        onClose={() => setShowCancelConfirmation(false)}
        onConfirm={handleCancelRegistration}
        title="Cancel Training Registration"
        message="You are about to cancel your registration for this training session. This action cannot be undone automatically and will require you to register again if you change your mind."
        confirmText="Yes, Cancel My Registration"
        cancelText="No, Keep My Registration"
        type="training-cancel"
      />

      {/* Add the Create Training Modal */}
      {showCreateTrainingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Create New Training</h2>
                <button
                  onClick={() => setShowCreateTrainingModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Close"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={(e) => { e.preventDefault(); handleCreateTraining(); }}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                      value={newTraining.title}
                      onChange={(e) => setNewTraining({...newTraining, title: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={newTraining.description}
                      onChange={(e) => setNewTraining({...newTraining, description: e.target.value})}
                    ></textarea>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type</label>
                      <select
                        id="type"
                        name="type"
                        className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={newTraining.type || ''}
                        onChange={(e) => setNewTraining({...newTraining, type: e.target.value})}
                      >
                        <option value="">Select Type</option>
                        <option value="workshop">Workshop</option>
                        <option value="seminar">Seminar</option>
                        <option value="field_exercise">Field Exercise</option>
                        <option value="combat_drill">Combat Drill</option>
                        <option value="leadership">Leadership</option>
                        <option value="technical">Technical</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">Capacity</label>
                      <input
                        type="number"
                        id="capacity"
                        name="capacity"
                        min="1"
                        className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={newTraining.capacity}
                        onChange={(e) => setNewTraining({...newTraining, capacity: parseInt(e.target.value, 10)})}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
                      <div className="relative">
                        <input
                          type="datetime-local"
                          id="startDate"
                          name="startDate"
                          className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          value={formatDateForInput(newTraining.startDate)}
                          onChange={(e) => {
                            const selectedDate = new Date(e.target.value);
                            console.log('Selected start date:', selectedDate, 'Original input:', e.target.value);
                            setNewTraining({...newTraining, startDate: selectedDate.toISOString()});
                          }}
                        />
                        <div className="p-2 mt-1 text-sm font-medium text-blue-800 border border-blue-100 rounded-md bg-blue-50">
                          Selected: {newTraining.startDate ? formatDateForDisplay(newTraining.startDate) : 'No date selected'}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
                      <div className="relative">
                        <input
                          type="datetime-local"
                          id="endDate"
                          name="endDate"
                          className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          value={formatDateForInput(newTraining.endDate)}
                          onChange={(e) => {
                            const selectedDate = new Date(e.target.value);
                            console.log('Selected end date:', selectedDate, 'Original input:', e.target.value);
                            setNewTraining({...newTraining, endDate: selectedDate.toISOString()});
                          }}
                        />
                        <div className="p-2 mt-1 text-sm font-medium text-blue-800 border border-blue-100 rounded-md bg-blue-50">
                          Selected: {newTraining.endDate ? formatDateForDisplay(newTraining.endDate) : 'No date selected'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location</label>
                    <div className="grid grid-cols-1 gap-4 mt-1 md:grid-cols-2">
                      <input
                        type="text"
                        id="locationName"
                        name="locationName"
                        placeholder="Location Name"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={typeof newTraining.location === 'object' ? newTraining.location.name || '' : ''}
                        onChange={(e) => setNewTraining({
                          ...newTraining, 
                          location: typeof newTraining.location === 'object' 
                            ? { ...newTraining.location, name: e.target.value }
                            : { name: e.target.value, address: '' }
                        })}
                      />
                      <input
                        type="text"
                        id="locationAddress"
                        name="locationAddress"
                        placeholder="Location Address"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={typeof newTraining.location === 'object' ? newTraining.location.address || '' : ''}
                        onChange={(e) => setNewTraining({
                          ...newTraining, 
                          location: typeof newTraining.location === 'object' 
                            ? { ...newTraining.location, address: e.target.value }
                            : { name: '', address: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="instructor" className="block text-sm font-medium text-gray-700">Instructor</label>
                    <div className="grid grid-cols-1 gap-4 mt-1 md:grid-cols-2">
                      <input
                        type="text"
                        id="instructorName"
                        name="instructorName"
                        placeholder="Instructor Name"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={typeof newTraining.instructor === 'object' ? newTraining.instructor.name || '' : ''}
                        onChange={(e) => setNewTraining({
                          ...newTraining, 
                          instructor: typeof newTraining.instructor === 'object' 
                            ? { ...newTraining.instructor, name: e.target.value }
                            : { name: e.target.value, rank: '' }
                        })}
                      />
                      <input
                        type="text"
                        id="instructorRank"
                        name="instructorRank"
                        placeholder="Instructor Rank"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={typeof newTraining.instructor === 'object' ? newTraining.instructor.rank || '' : ''}
                        onChange={(e) => setNewTraining({
                          ...newTraining, 
                          instructor: typeof newTraining.instructor === 'object' 
                            ? { ...newTraining.instructor, rank: e.target.value }
                            : { name: '', rank: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="mandatory"
                      name="mandatory"
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      checked={newTraining.mandatory}
                      onChange={(e) => setNewTraining({...newTraining, mandatory: e.target.checked})}
                    />
                    <label htmlFor="mandatory" className="block ml-2 text-sm text-gray-900">Mandatory Training</label>
                  </div>
                  
                  <div>
                    <label htmlFor="tags" className="block text-sm font-medium text-gray-700">Tags (comma separated)</label>
                    <input
                      type="text"
                      id="tags"
                      name="tags"
                      className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={newTraining.tags?.join(', ') || ''}
                      onChange={(e) => setNewTraining({...newTraining, tags: e.target.value.split(',').map(tag => tag.trim())})}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end mt-6 space-x-3">
                  <Button
                    type="button"
                    onClick={() => setShowCreateTrainingModal(false)}
                    className="text-gray-800 bg-gray-200 hover:bg-gray-300"
                    aria-label="Cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="text-white bg-blue-600 hover:bg-blue-700"
                    disabled={loading}
                    aria-label="Create Training"
                  >
                    {loading ? 'Creating...' : 'Create Training'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add the Edit Training Modal */}
      {showEditTrainingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Edit Training</h2>
                <button
                  onClick={() => setShowEditTrainingModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Close"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={(e) => { e.preventDefault(); handleUpdateTraining(); }}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="editTitle" className="block text-sm font-medium text-gray-700">Title</label>
                    <input
                      type="text"
                      id="editTitle"
                      name="editTitle"
                      className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                      value={editTraining.title}
                      onChange={(e) => setEditTraining({...editTraining, title: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="editDescription" className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      id="editDescription"
                      name="editDescription"
                      rows={3}
                      className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={editTraining.description}
                      onChange={(e) => setEditTraining({...editTraining, description: e.target.value})}
                    ></textarea>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="editType" className="block text-sm font-medium text-gray-700">Type</label>
                      <select
                        id="editType"
                        name="editType"
                        className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={editTraining.type || ''}
                        onChange={(e) => setEditTraining({...editTraining, type: e.target.value})}
                      >
                        <option value="">Select Type</option>
                        <option value="workshop">Workshop</option>
                        <option value="seminar">Seminar</option>
                        <option value="field_exercise">Field Exercise</option>
                        <option value="combat_drill">Combat Drill</option>
                        <option value="leadership">Leadership</option>
                        <option value="technical">Technical</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="editCapacity" className="block text-sm font-medium text-gray-700">Capacity</label>
                      <input
                        type="number"
                        id="editCapacity"
                        name="editCapacity"
                        min="1"
                        className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={editTraining.capacity}
                        onChange={(e) => setEditTraining({...editTraining, capacity: parseInt(e.target.value, 10)})}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="editStartDate" className="block text-sm font-medium text-gray-700">Start Date</label>
                      <div className="relative">
                        <input
                          type="datetime-local"
                          id="editStartDate"
                          name="editStartDate"
                          className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          value={formatDateForInput(editTraining.startDate)}
                          onChange={(e) => {
                            const selectedDate = new Date(e.target.value);
                            console.log('Selected edit start date:', selectedDate, 'Original input:', e.target.value);
                            setEditTraining({...editTraining, startDate: selectedDate.toISOString()});
                          }}
                        />
                        <div className="p-2 mt-1 text-sm font-medium text-blue-800 border border-blue-100 rounded-md bg-blue-50">
                          Selected: {editTraining.startDate ? formatDateForDisplay(editTraining.startDate) : 'No date selected'}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="editEndDate" className="block text-sm font-medium text-gray-700">End Date</label>
                      <div className="relative">
                        <input
                          type="datetime-local"
                          id="editEndDate"
                          name="editEndDate"
                          className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          value={formatDateForInput(editTraining.endDate)}
                          onChange={(e) => {
                            const selectedDate = new Date(e.target.value);
                            console.log('Selected edit end date:', selectedDate, 'Original input:', e.target.value);
                            setEditTraining({...editTraining, endDate: selectedDate.toISOString()});
                          }}
                        />
                        <div className="p-2 mt-1 text-sm font-medium text-blue-800 border border-blue-100 rounded-md bg-blue-50">
                          Selected: {editTraining.endDate ? formatDateForDisplay(editTraining.endDate) : 'No date selected'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="editLocation" className="block text-sm font-medium text-gray-700">Location</label>
                    <div className="grid grid-cols-1 gap-4 mt-1 md:grid-cols-2">
                      <input
                        type="text"
                        id="editLocationName"
                        name="editLocationName"
                        placeholder="Location Name"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={typeof editTraining.location === 'object' ? editTraining.location.name || '' : ''}
                        onChange={(e) => setEditTraining({
                          ...editTraining, 
                          location: typeof editTraining.location === 'object' 
                            ? { ...editTraining.location, name: e.target.value } 
                            : { name: e.target.value, address: '' }
                        })}
                      />
                      <input
                        type="text"
                        id="editLocationAddress"
                        name="editLocationAddress"
                        placeholder="Address (Optional)"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={typeof editTraining.location === 'object' ? editTraining.location.address || '' : ''}
                        onChange={(e) => setEditTraining({
                          ...editTraining, 
                          location: typeof editTraining.location === 'object' 
                            ? { ...editTraining.location, address: e.target.value } 
                            : { name: '', address: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="editInstructor" className="block text-sm font-medium text-gray-700">Instructor</label>
                    <div className="grid grid-cols-1 gap-4 mt-1 md:grid-cols-2">
                      <input
                        type="text"
                        id="editInstructorName"
                        name="editInstructorName"
                        placeholder="Instructor Name"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={typeof editTraining.instructor === 'object' ? editTraining.instructor.name || '' : ''}
                        onChange={(e) => setEditTraining({
                          ...editTraining, 
                          instructor: typeof editTraining.instructor === 'object' 
                            ? { ...editTraining.instructor, name: e.target.value } 
                            : { name: e.target.value, rank: '' }
                        })}
                      />
                      <input
                        type="text"
                        id="editInstructorRank"
                        name="editInstructorRank"
                        placeholder="Rank (Optional)"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={typeof editTraining.instructor === 'object' ? editTraining.instructor.rank || '' : ''}
                        onChange={(e) => setEditTraining({
                          ...editTraining, 
                          instructor: typeof editTraining.instructor === 'object' 
                            ? { ...editTraining.instructor, rank: e.target.value } 
                            : { name: '', rank: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="editMandatory"
                      name="editMandatory"
                      type="checkbox"
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      checked={editTraining.mandatory || false}
                      onChange={(e) => setEditTraining({...editTraining, mandatory: e.target.checked})}
                    />
                    <label htmlFor="editMandatory" className="block ml-2 text-sm text-gray-900">Mandatory training</label>
                  </div>
                </div>
                
                <div className="flex justify-end mt-6 space-x-3">
                  <Button
                    variant="secondary"
                    type="button"
                    className="flex items-center justify-center h-10 px-4 font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    onClick={() => setShowEditTrainingModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    className="flex items-center justify-center h-10 px-4 font-medium text-white transition-colors bg-indigo-600 border border-indigo-700 rounded-md hover:bg-indigo-700"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="w-5 h-5 mr-2 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                    ) : null}
                    Update Training
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 