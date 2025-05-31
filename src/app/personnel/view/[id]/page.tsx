'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { 
  UserIcon, 
  ChevronLeftIcon,
  BuildingOfficeIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  ClockIcon,
  IdentificationIcon,
  StarIcon,
  MapPinIcon,
  PrinterIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// Personnel interface
interface Personnel {
  id: string;
  name: string;
  rank: string;
  status: string;
  email: string;
  phone?: string;
  company: string;
  dateJoined: string;
  lastUpdated: string;
  serviceId: string;
  position?: string;
  address?: string;
  dateOfBirth?: string;
  emergencyContact?: string;
  bloodType?: string;
  performanceScore?: number;
  qualifications?: string[];
  trainingCompletion?: number;
  documentsComplete?: number;
  awards?: Array<{title: string, date: string, description: string}>;
}

export default function PersonnelProfilePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const { user, isAuthenticated, isLoading, hasSpecificPermission, getToken } = useAuth();
  const [personnel, setPersonnel] = useState<Personnel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Check if user has permission to view personnel
  const canViewPersonnel = hasSpecificPermission('view_personnel') || 
                          hasSpecificPermission('view_all_personnel');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!isLoading && user && !['staff', 'admin', 'administrator', 'director'].includes(user.role)) {
      router.push('/dashboard');
      toast.error('You do not have permission to access this page');
      return;
    }

    fetchPersonnelData();
  }, [isLoading, isAuthenticated, user, router, id]);

  const fetchPersonnelData = async () => {
    setLoading(true);
    try {
      // Get token for authentication
      const token = await getToken();
      
      if (!token) {
        throw new Error('Authentication failed');
      }
      
      // Fetch personnel data from API
      const response = await fetch(`/api/personnel/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch personnel data');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setPersonnel(data.data);
      } else {
        throw new Error(data.message || 'Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching personnel data:', error);
      setError((error as Error).message);
      
      // If API call fails, use mock data based on ID
      // In production, you'd want to handle this differently
      const mockData: Personnel = {
        id,
        name: id === 'p001' ? 'Miguel Santos' : 
              id === 'p002' ? 'Juan Dela Cruz' : 
              id === 'p003' ? 'Ana Reyes' : 'Unknown Personnel',
        rank: id === 'p001' ? 'Private' : 
              id === 'p002' ? 'Private' : 
              id === 'p003' ? 'Private First Class' : 'Unknown',
        status: 'Ready',
        email: id === 'p001' ? 'miguel.santos@example.com' : 
               id === 'p002' ? 'juan.delacruz@example.com' : 
               id === 'p003' ? 'ana.reyes@example.com' : 'unknown@example.com',
        phone: '09123456789',
        company: id === 'p001' ? 'Alpha' : 
                 id === 'p002' ? 'Bravo' : 
                 id === 'p003' ? 'Charlie' : 'Unknown',
        dateJoined: '2023-05-15',
        lastUpdated: '2024-03-01',
        serviceId: id === 'p001' ? 'S001' : 
                  id === 'p002' ? 'S002' : 
                  id === 'p003' ? 'S003' : 'SXXX',
        position: 'Infantry',
        address: 'Camp General Mariano N. Castañeda, Silang, Cavite',
        dateOfBirth: '1998-07-22',
        emergencyContact: 'Family Contact: +63-9876543210',
        bloodType: 'O+',
        performanceScore: id === 'p001' ? 92 : 
                          id === 'p002' ? 88 : 
                          id === 'p003' ? 94 : 85,
        qualifications: [
          'Basic Combat Training',
          'First Aid Certification',
          'Weapons Handling',
          'Field Operations'
        ],
        trainingCompletion: 95,
        documentsComplete: 100,
        awards: [
          {
            title: 'Excellence in Field Training',
            date: '2023-12-10',
            description: 'Awarded for outstanding performance during field training exercises.'
          },
          {
            title: 'Marksmanship Badge',
            date: '2023-09-15',
            description: 'Achieved expert level in rifle marksmanship qualification.'
          }
        ]
      };
      
      setPersonnel(mockData);
    } finally {
      setLoading(false);
    }
  };

  // Function to handle printing
  const handlePrint = () => {
    window.print();
  };

  // Function to handle PDF export
  const handleExportPDF = async () => {
    if (!profileRef.current || !personnel) return;
    
    try {
      const profileElement = profileRef.current;
      const canvas = await html2canvas(profileElement);
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Add title
      pdf.setFontSize(16);
      pdf.setTextColor(44, 62, 80);
      pdf.text(`Personnel Profile: ${personnel.name}`, 15, 15);
      
      // Add date
      pdf.setFontSize(10);
      pdf.setTextColor(128, 128, 128);
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, 15, 22);
      
      // Calculate dimensions to fit the image properly on the page
      const imgWidth = 190;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      
      // Add the image
      pdf.addImage(imgData, 'PNG', 10, 30, imgWidth, imgHeight);
      
      // Save the PDF
      pdf.save(`personnel-profile-${personnel.serviceId}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error && !personnel) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <div className="p-6 text-center">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-base font-semibold text-gray-900">Error Loading Profile</h3>
            <p className="mt-1 text-sm text-gray-500">
              {error}
            </p>
            <div className="mt-6">
              <Button
                variant="primary"
                onClick={() => router.push('/personnel')}
              >
                Return to Personnel
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!personnel) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <div className="p-6 text-center">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-base font-semibold text-gray-900">Personnel Not Found</h3>
            <p className="mt-1 text-sm text-gray-500">
              The personnel you are looking for does not exist.
            </p>
            <div className="mt-6">
              <Button
                variant="primary"
                onClick={() => router.push('/personnel')}
              >
                Return to Personnel
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!canViewPersonnel) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <div className="p-6 text-center">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-base font-semibold text-gray-900">Access Denied</h3>
            <p className="mt-1 text-sm text-gray-500">
              You do not have permission to view personnel profiles.
            </p>
            <div className="mt-6">
              <Button
                variant="primary"
                onClick={() => router.push('/dashboard')}
              >
                Return to Dashboard
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Function to determine status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'standby':
        return 'bg-yellow-100 text-yellow-800';
      case 'leave':
        return 'bg-blue-100 text-blue-800';
      case 'medical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Function to determine performance score color
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Button
            variant="secondary"
            size="sm"
            className="flex items-center"
            onClick={() => router.back()}
          >
            <ChevronLeftIcon className="h-4 w-4 mr-1" />
            Back
          </Button>
        </div>
        <div className="flex space-x-2 print:hidden">
          <Button
            variant="secondary"
            size="sm"
            className="flex items-center"
            onClick={handlePrint}
          >
            <PrinterIcon className="h-4 w-4 mr-1.5" />
            Print Profile
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="flex items-center"
            onClick={handleExportPDF}
          >
            <DocumentArrowDownIcon className="h-4 w-4 mr-1.5" />
            Export PDF
          </Button>
        </div>
      </div>

      <div ref={profileRef} className="space-y-6">
        {/* Profile Header */}
        <Card>
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex items-center">
                <div className="h-20 w-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                  {personnel.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="ml-6">
                  <h2 className="text-2xl font-bold text-gray-900">{personnel.name}</h2>
                  <div className="flex items-center mt-1">
                    <span className="text-gray-600 mr-3">{personnel.rank}</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(personnel.status)}`}>
                      {personnel.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Service ID: {personnel.serviceId}
                  </p>
                </div>
              </div>
              <div className="mt-4 md:mt-0 flex flex-col items-end">
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-500">Company</span>
                  <div className="text-lg font-medium text-gray-900">{personnel.company}</div>
                </div>
                {personnel.performanceScore && (
                  <div className="mt-2 text-right">
                    <span className="text-sm font-medium text-gray-500">Performance Score</span>
                    <div className={`text-lg font-medium ${getScoreColor(personnel.performanceScore)}`}>
                      {personnel.performanceScore}%
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Personal Information */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-500">Email</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-900">{personnel.email}</p>
                </div>
                <div>
                  <div className="flex items-center">
                    <PhoneIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-500">Phone</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-900">{personnel.phone || 'Not provided'}</p>
                </div>
                <div>
                  <div className="flex items-center">
                    <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-500">Date of Birth</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-900">{personnel.dateOfBirth || 'Not provided'}</p>
                </div>
                <div>
                  <div className="flex items-center">
                    <IdentificationIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-500">Blood Type</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-900">{personnel.bloodType || 'Not provided'}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center">
                    <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-500">Position</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-900">{personnel.position || 'Not specified'}</p>
                </div>
                <div>
                  <div className="flex items-center">
                    <MapPinIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-500">Address</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-900">{personnel.address || 'Not provided'}</p>
                </div>
                <div>
                  <div className="flex items-center">
                    <PhoneIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-500">Emergency Contact</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-900">{personnel.emergencyContact || 'Not provided'}</p>
                </div>
                <div>
                  <div className="flex items-center">
                    <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-500">Date Joined</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-900">{personnel.dateJoined}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Qualifications & Training */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Qualifications & Training</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center mb-4">
                  <AcademicCapIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-500">Qualifications</span>
                </div>
                {personnel.qualifications && personnel.qualifications.length > 0 ? (
                  <ul className="space-y-2">
                    {personnel.qualifications.map((qualification, index) => (
                      <li key={index} className="text-sm text-gray-900">
                        • {qualification}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No qualifications listed</p>
                )}
              </div>
              <div>
                <div className="flex items-center mb-4">
                  <ClipboardDocumentListIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-500">Training Progress</span>
                </div>
                {personnel.trainingCompletion ? (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Completion Rate</span>
                      <span className="text-sm font-medium text-gray-900">{personnel.trainingCompletion}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${personnel.trainingCompletion}%` }}
                      ></div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Training data not available</p>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Documents & Certifications */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Documents & Certifications</h3>
          </div>
          <div className="p-6">
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm font-medium text-gray-500">Document Status</span>
              </div>
              {personnel.documentsComplete ? (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Completion Rate</span>
                    <span className="text-sm font-medium text-gray-900">{personnel.documentsComplete}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-green-600 h-2.5 rounded-full" 
                      style={{ width: `${personnel.documentsComplete}%` }}
                    ></div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Document status not available</p>
              )}
            </div>
          </div>
        </Card>

        {/* Awards & Recognition */}
        {personnel.awards && personnel.awards.length > 0 && (
          <Card>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Awards & Recognition</h3>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {personnel.awards.map((award, index) => (
                  <div key={index} className="flex">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                        <StarIcon className="h-5 w-5 text-yellow-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h4 className="text-sm font-medium text-gray-900">{award.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">Awarded on {award.date}</p>
                      <p className="text-sm text-gray-600 mt-2">{award.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// Add print styles
const printStyles = `
  @media print {
    body * {
      visibility: hidden;
    }
    .print-container, .print-container * {
      visibility: visible;
    }
    .print-hide, button {
      display: none !important;
    }
    header, nav, footer {
      display: none !important;
    }
  }
`;

// Add styles to document head
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = printStyles;
  document.head.appendChild(style);
} 