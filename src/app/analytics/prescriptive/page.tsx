"use client";

import { useState, useEffect, useRef, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/ui/Card';
import { UserRole } from '@/types/auth';
import { 
  LightBulbIcon, 
  ArrowTrendingUpIcon,
  UserIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ArrowTopRightOnSquareIcon,
  BoltIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ArrowsRightLeftIcon,
  EyeIcon,
  ChartBarIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PrinterIcon,
  DocumentArrowDownIcon,
  XMarkIcon,
  EnvelopeIcon,
  PhoneIcon,
  IdentificationIcon,
  BuildingOfficeIcon,
  ClockIcon,
  AcademicCapIcon,
  CheckIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Dialog, Transition } from '@headlessui/react';

// Helper function to get cookies
const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

// Types for prescriptive analytics data
interface PromotionRecommendation {
  id: string;
  name: string;
  currentRank: string;
  recommendedRank: string;
  company: string;
  score: number;
  serviceId: string;
  militaryEmail: string;
  eligibilityDate: string;
}

interface PrescriptiveData {
  trainingRecommendations: {
    companies: Array<{
      company: string;
      currentTrainingCompletion: number;
      potentialImprovement: number;
      currentReadiness: number;
      projectedReadiness: number;
    }>;
    overallSuggestion: string;
  };
  resourceAllocation: {
    imbalances: Array<{
      company: string;
      currentCount: number;
      deviation: number;
      recommendation: string;
    }>;
    suggestion: string;
  };
  documentVerification: {
    backlog: Array<{
      company: string;
      count: number;
      oldestPendingDate: string;
    }>;
    growthRate: number;
    suggestion: string;
  };
  promotionRecommendations: {
    personnel: PromotionRecommendation[];
    suggestion: string;
  };
}

// Personnel interface for detailed profile view
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

// Helper function to get initials from a name
const getInitials = (name: string): string => {
  if (!name) return '?';
  const names = name.split(' ');
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
};

// Helper function to get a consistent color based on name/id for avatar
const getAvatarColor = (id: string): string => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-red-500', 'bg-yellow-500', 
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
  ];
  return colors[Math.abs(hash % colors.length)];
};

// --- Official Rank List ---
const OFFICIAL_RANKS = [
  'Private',
  'Private First Class',
  'Corporal',
  'Sergeant',
  // 'Staff Sergeant', // Not in the provided list
  // 'Sergeant First Class', // Not in the provided list
  'Second Lieutenant',
  'First Lieutenant',
  'Captain',
  'Major',
  'Lieutenant Colonel',
  'Colonel',
  'Brigadier General'
];

// Function declarations that need to come before they're used
// Get current date in readable format for last analysis date
const getFormattedDate = () => {
  const date = new Date();
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function PrescriptiveAnalyticsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [prescriptiveData, setPrescriptiveData] = useState<PrescriptiveData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'training' | 'personnel' | 'resources' | 'documents'>('training');
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  // --- Pagination State --- 
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // --- Filter/Search State --- 
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCompany, setFilterCompany] = useState(''); // Example filter by company
  const [filterRank, setFilterRank] = useState(''); // Example filter by recommended rank

  const tableRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const [selectedPersonnelId, setSelectedPersonnelId] = useState<string | null>(null);
  const [personnelData, setPersonnelData] = useState<Personnel | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingPersonnel, setLoadingPersonnel] = useState(false);

  // Fetch prescriptive analytics data from the API
  const fetchPrescriptiveData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Debug: Log all available cookies
      if (typeof document !== 'undefined') {
        console.log('All available cookies:', document.cookie);
      }
      
      // Get token from auth context instead of cookies
      let authToken = null;
      
      try {
        // Use the getToken function from auth context directly
        if (isAuthenticated && !isLoading) {
          console.log('Getting token from auth context getToken function');
          authToken = await getToken();
        }
      } catch (tokenError) {
        console.error('Error getting token from auth context:', tokenError);
      }
      
      console.log('Found token from auth context:', authToken ? 'Yes' : 'No');
      
      // Fallback to cookies if no token from context
      if (!authToken) {
        console.log('Falling back to cookie checking');
        authToken = getCookie('token') || getCookie('auth_token') || getCookie('jwt') || getCookie('accessToken');
        console.log('Found token from cookies:', authToken ? 'Yes' : 'No');
      }
      
      if (!authToken) {
        setError('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }
      
      // Call the real API endpoint with the token
      const response = await fetch('/api/analytics/prescriptive', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch analytics data');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load analytics data');
      }
      
      console.log('Loaded prescriptive analytics data:', data);
      setPrescriptiveData(data.data);
      setLastRefreshed(getFormattedDate());
      setLoading(false);
    } catch (err) {
      console.error('Error fetching prescriptive data:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setLoading(false);
    }
  };

  // Effect to load data on component mount
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      fetchPrescriptiveData();
    }
  }, [isAuthenticated, isLoading]);

  // Effect for initial auth check and data fetch
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    // Allow administrators to access this page, but redirect others
    const userRole = user?.role?.toString().toLowerCase();
    if (userRole !== 'administrator' && userRole !== 'admin') {
      router.push('/dashboard');
      return;
    }

    fetchPrescriptiveData();
  }, [isLoading, isAuthenticated, router, user]);

  // Effect to reset page number when filters change
  useEffect(() => {
      setCurrentPage(1);
  }, [searchTerm, filterCompany, filterRank]);

  // Function to handle printing
  const handlePrint = () => {
    window.print();
  };

  // Function to handle PDF export
  const handleExportPDF = async () => {
    if (!tableRef.current) return;
    
    try {
      const contentElement = tableRef.current;
      
      // Create PDF document
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Add title
      pdf.setFontSize(18);
      pdf.setTextColor(44, 62, 80);
      pdf.text('Personnel Recommended for Promotion', 15, 15);
      
      // Add date
      pdf.setFontSize(10);
      pdf.setTextColor(128, 128, 128);
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, 15, 22);
      
      // Add description
      pdf.setFontSize(11);
      pdf.setTextColor(60, 60, 60);
      pdf.text('This report contains a list of personnel eligible for promotion based on current metrics.', 15, 30);
      
      // Generate text-based report content
      let yPosition = 40;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 15;
      const textWidth = pageWidth - (margin * 2);
      
      // Add each personnel to the PDF
      if (prescriptiveData?.promotionRecommendations?.personnel) {
        const personnel = prescriptiveData.promotionRecommendations.personnel;
        
        // Apply current filters
        const filteredPersonnel = personnel.filter(person => {
          const searchTermLower = searchTerm.toLowerCase();
          const matchesSearch = (
            person.name.toLowerCase().includes(searchTermLower) ||
            person.serviceId.toLowerCase().includes(searchTermLower) ||
            person.militaryEmail.toLowerCase().includes(searchTermLower)
          );
          const matchesCompany = filterCompany ? person.company === filterCompany : true;
          const matchesRank = filterRank ? person.recommendedRank === filterRank : true;
          
          return matchesSearch && matchesCompany && matchesRank;
        });
        
        // Loop through filtered personnel
        for (const person of filteredPersonnel) {
          // Check if we need a new page
          if (yPosition > 250) {
            pdf.addPage();
            yPosition = 20;
          }
          
          // Add personnel info
          pdf.setFontSize(12);
          pdf.setTextColor(0, 0, 0);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${person.name} (${person.serviceId})`, margin, yPosition);
          yPosition += 6;
          
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(80, 80, 80);
          pdf.text(`Company: ${person.company}`, margin, yPosition);
          yPosition += 5;
          
          pdf.text(`Current Rank: ${person.currentRank}`, margin, yPosition);
          yPosition += 5;
          
          pdf.text(`Recommended Rank: ${person.recommendedRank}`, margin, yPosition);
          yPosition += 5;
          
          pdf.text(`Basis Score: ${person.score}%`, margin, yPosition);
          yPosition += 5;
          
          pdf.text(`Email: ${person.militaryEmail}`, margin, yPosition);
          yPosition += 5;
          
          pdf.text(`Eligibility Date: ${person.eligibilityDate}`, margin, yPosition);
          yPosition += 10;
          
          // Add a divider line
          pdf.setDrawColor(200, 200, 200);
          pdf.line(margin, yPosition, pageWidth - margin, yPosition);
          yPosition += 10;
        }
      }
      
      // Add footer with recommendation
      const footerText = prescriptiveData?.promotionRecommendations?.suggestion || 
        "These personnel have demonstrated readiness for promotion based on training completion and time in rank.";
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.setFont('helvetica', 'italic');
      
      const splitFooter = pdf.splitTextToSize(footerText, textWidth);
      pdf.text(splitFooter, margin, pdf.internal.pageSize.getHeight() - 20);
      
      // Save the PDF
      pdf.save('personnel-promotion-recommendations.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  // Function to fetch personnel data for the modal
  const fetchPersonnelData = async (id: string) => {
    setLoadingPersonnel(true);
    try {
      // Find the personnel in the promotion recommendations
      const personFromRecommendations = prescriptiveData?.promotionRecommendations?.personnel?.find(
        person => person.id === id
      );
      
      if (personFromRecommendations) {
        // Use data from the recommendations
        const mockData: Personnel = {
          id: personFromRecommendations.id,
          name: personFromRecommendations.name,
          rank: personFromRecommendations.currentRank,
          status: 'Ready',
          email: personFromRecommendations.militaryEmail,
          phone: '09123456789',
          company: personFromRecommendations.company,
          dateJoined: '2023-05-15',
          lastUpdated: '2024-03-01',
          serviceId: personFromRecommendations.serviceId,
          position: 'Infantry',
          performanceScore: personFromRecommendations.score,
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
            }
          ]
        };
        
        // Wait a bit to simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setPersonnelData(mockData);
      } else {
        // Fallback to mock data for development/testing
        const mockData: Personnel = {
          id,
          name: 'Unknown Personnel',
          rank: 'Unknown',
          status: 'Ready',
          email: 'unknown@example.com',
          phone: '09123456789',
          company: 'Unknown',
          dateJoined: '2023-05-15',
          lastUpdated: '2024-03-01',
          serviceId: 'SXXX',
          position: 'Infantry',
          performanceScore: 85,
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
            }
          ]
        };
        
        await new Promise(resolve => setTimeout(resolve, 500));
        setPersonnelData(mockData);
        console.warn('Personnel not found in recommendations, using fallback data:', id);
      }
    } catch (error) {
      console.error('Error fetching personnel data:', error);
    } finally {
      setLoadingPersonnel(false);
    }
  };

  // Function to open the personnel profile modal
  const openPersonnelModal = (personnelId: string) => {
    setSelectedPersonnelId(personnelId);
    fetchPersonnelData(personnelId);
    setIsModalOpen(true);
  };

  // Function to close the personnel profile modal
  const closePersonnelModal = () => {
    setIsModalOpen(false);
    setSelectedPersonnelId(null);
    setPersonnelData(null);
  };

  // Function to handle printing profile
  const handlePrintProfile = () => {
    if (!personnelData) return;
    
    // First fix the linter errors in the existing code
    const trainingCompletion = personnelData.trainingCompletion || 0;
    const qualificationsLength = personnelData.qualifications?.length || 0;
    
    // Create a print-only element that won't affect the current view
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'absolute';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    printFrame.style.left = '-1000px';
    printFrame.style.top = '-1000px';
    document.body.appendChild(printFrame);
    
    // Generate printable HTML
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Profile - ${personnelData.name}</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          @media print {
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #111827;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            padding-bottom: 20px;
            border-bottom: 1px solid #e5e7eb;
          }
          .profile {
            display: flex;
            align-items: center;
          }
          .avatar {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background-color: #4f46e5;
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 28px;
            font-weight: bold;
            margin-right: 20px;
          }
          .name {
            font-size: 24px;
            font-weight: bold;
            margin: 0 0 5px 0;
          }
          .rank {
            font-size: 16px;
            color: #4b5563;
            margin: 0 0 5px 0;
          }
          .id {
            font-size: 14px;
            color: #6b7280;
            margin: 0;
          }
          .section {
            margin-bottom: 20px;
            padding: 15px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
          }
          .section-title {
            font-size: 18px;
            font-weight: 600;
            margin-top: 0;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #e5e7eb;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
          }
          .info-item {
            margin-bottom: 10px;
          }
          .info-label {
            font-size: 14px;
            font-weight: 500;
            color: #6b7280;
            margin-bottom: 4px;
          }
          .info-value {
            font-size: 14px;
          }
          .progress-container {
            width: 100px;
            height: 8px;
            background-color: #e5e7eb;
            border-radius: 4px;
            overflow: hidden;
          }
          .progress-value {
            height: 100%;
            background-color: #3b82f6;
          }
          .qualifications {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            list-style: none;
            padding: 0;
            margin: 0;
          }
          .qualification-item {
            font-size: 14px;
            display: flex;
            align-items: center;
          }
          .qualification-item:before {
            content: "✓";
            color: #22c55e;
            font-weight: bold;
            margin-right: 8px;
          }
          .award {
            display: flex;
            margin-bottom: 15px;
          }
          .award-icon {
            width: 32px;
            height: 32px;
            background-color: #fef3c7;
            color: #d97706;
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 16px;
            margin-right: 12px;
            flex-shrink: 0;
          }
          .award-title {
            font-size: 14px;
            font-weight: 500;
            margin: 0 0 2px 0;
          }
          .award-date {
            font-size: 12px;
            color: #6b7280;
            margin: 0 0 4px 0;
          }
          .award-desc {
            font-size: 14px;
            color: #4b5563;
            margin: 0;
          }
          .meta-info {
            text-align: right;
            font-size: 12px;
            color: #9ca3af;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="profile">
              <div class="avatar">${personnelData.name.split(' ').map(n => n[0]).join('')}</div>
              <div>
                <h1 class="name">${personnelData.name}</h1>
                <p class="rank">${personnelData.rank}</p>
                <p class="id">Service ID: ${personnelData.serviceId}</p>
              </div>
            </div>
            <div style="text-align: right;">
              <div style="margin-bottom: 5px;">
                <div class="info-label">Company</div>
                <div class="info-value">${personnelData.company}</div>
              </div>
              ${personnelData.performanceScore ? `
              <div>
                <div class="info-label">Performance Score</div>
                <div class="info-value" style="color: ${personnelData.performanceScore >= 90 ? '#059669' : personnelData.performanceScore >= 80 ? '#b45309' : '#dc2626'}">
                  ${personnelData.performanceScore}%
                </div>
              </div>
              ` : ''}
            </div>
          </div>

          <div class="section">
            <h2 class="section-title">Personal Information</h2>
            <div class="grid">
              <div class="info-item">
                <div class="info-label">Email</div>
                <div class="info-value">${personnelData.email}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Phone</div>
                <div class="info-value">${personnelData.phone || '-'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Position</div>
                <div class="info-value">${personnelData.position || '-'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Company</div>
                <div class="info-value">${personnelData.company}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Date Joined</div>
                <div class="info-value">${personnelData.dateJoined}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Training Completion</div>
                <div style="display: flex; align-items: center;">
                  <span style="margin-right: 8px;">${trainingCompletion}%</span>
                  <div class="progress-container">
                    <div class="progress-value" style="width: ${trainingCompletion}%;"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          ${personnelData.qualifications && personnelData.qualifications.length > 0 ? `
          <div class="section">
            <h2 class="section-title">Qualifications</h2>
            <ul class="qualifications">
              ${personnelData.qualifications.map(q => `
                <li class="qualification-item">${q}</li>
              `).join('')}
            </ul>
          </div>
          ` : ''}

          ${personnelData.awards && personnelData.awards.length > 0 ? `
          <div class="section">
            <h2 class="section-title">Awards & Recognition</h2>
            ${personnelData.awards.map(award => `
              <div class="award">
                <div class="award-icon">★</div>
                <div>
                  <h3 class="award-title">${award.title}</h3>
                  <p class="award-date">Awarded on ${award.date}</p>
                  <p class="award-desc">${award.description}</p>
                </div>
              </div>
            `).join('')}
          </div>
          ` : ''}

          <div class="meta-info">
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
        </div>
        <script>
          // Auto-print when loaded
          window.onload = function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 500);
            }, 250);
          };
        </script>
      </body>
      </html>
    `;
    
    // Set iframe contents
    const iframeDoc = printFrame.contentWindow?.document || printFrame.contentDocument;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(printContent);
      iframeDoc.close();
    }
    
    // Remove the iframe after printing is complete or after a timeout
    setTimeout(() => {
      try {
        document.body.removeChild(printFrame);
      } catch (e) {
        console.error('Error removing print frame:', e);
      }
    }, 5000);
  };

  // Function to handle PDF export for profile
  const handleExportProfilePDF = async () => {
    if (!personnelData) return;
    
    try {
      // Create a temporary container for the HTML content
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '-9999px';
      document.body.appendChild(tempContainer);
      
      // First fix the linter errors in the existing code
      const trainingCompletion = personnelData.trainingCompletion || 0;
      const qualificationsLength = personnelData.qualifications?.length || 0;
      
      // Generate HTML content with military styling
      tempContainer.innerHTML = `
        <div style="width: 800px; padding: 0; font-family: 'Arial', sans-serif; background-color: white; color: #000000; position: relative; display: flex; flex-direction: column; min-height: 1131px;">
          <!-- Header with military styling -->
          <div style="background-color: #2c3e50; color: white; padding: 15px; display: flex; justify-content: space-between; align-items: center; border-bottom: 5px solid #e74c3c;">
            <div style="display: flex; align-items: center;">
              <!-- Military-style emblem placeholder -->
              <div style="width: 45px; height: 45px; border-radius: 50%; background-color: #e74c3c; display: flex; justify-content: center; align-items: center; border: 2px solid white; margin-right: 15px;">
                <div style="font-weight: bold; font-size: 16px;">301st</div>
              </div>
              <div>
                <div style="font-size: 18px; font-weight: bold; text-transform: uppercase;">301st Ready Reserve Infantry Battalion</div>
                <div style="font-size: 14px; opacity: 0.9;">Community Defense Center</div>
              </div>
            </div>
            <div style="text-align: right; font-size: 14px;">
              <div>DOCUMENT: PERSONNEL-${personnelData.serviceId}</div>
              <div>CLASSIFICATION: OFFICIAL</div>
            </div>
          </div>

          <!-- Personnel Identification Section -->
          <div style="padding: 20px; display: flex; align-items: center; border-bottom: 1px solid #ddd; background-color: #f8f9fa;">
            <!-- Military Avatar with Rank Color -->
            <div style="width: 80px; height: 80px; border-radius: 8px; background-color: #34495e; color: white; display: flex; justify-content: center; align-items: center; font-size: 32px; font-weight: bold; border: 2px solid #7f8c8d; margin-right: 20px;">
              ${personnelData.name.split(' ').map(n => n[0]).join('')}
            </div>
            
            <div style="flex-grow: 1;">
              <h1 style="margin: 0; font-size: 24px; color: #000000; text-transform: uppercase;">${personnelData.name}</h1>
              <div style="display: flex; align-items: center; margin-top: 5px;">
                <div style="font-weight: bold; color: #34495e; margin-right: 10px; padding: 2px 8px; background-color: #ecf0f1; border-radius: 4px;">${personnelData.rank}</div>
                <div style="color: #7f8c8d; margin-right: 15px;">ID: ${personnelData.serviceId}</div>
                <div style="background-color: #27ae60; color: white; padding: 2px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase;">
                  Active
                </div>
              </div>
            </div>

            <div style="text-align: right; border-left: 1px solid #ddd; padding-left: 20px;">
              <div style="color: #7f8c8d; margin-bottom: 5px;">Performance Rating</div>
              <div style="font-size: 28px; font-weight: bold; color: ${personnelData.performanceScore && personnelData.performanceScore >= 90 ? '#27ae60' : personnelData.performanceScore && personnelData.performanceScore >= 80 ? '#f39c12' : '#e74c3c'};">
                ${personnelData.performanceScore || 0}%
              </div>
            </div>
          </div>

          <!-- Main Content -->
          <div style="display: flex; flex: 1;">
            <!-- Left Column -->
            <div style="width: 65%; padding: 20px; border-right: 1px solid #ddd;">
              <!-- Service Information -->
              <div style="margin-bottom: 25px;">
                <h2 style="margin: 0 0 15px 0; color: #34495e; font-size: 18px; text-transform: uppercase; border-bottom: 2px solid #34495e; padding-bottom: 5px;">Service Information</h2>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
                  <div>
                    <div style="font-weight: bold; color: #7f8c8d; font-size: 13px;">Company Assignment</div>
                    <div style="color: #000000; font-size: 15px;">${personnelData.company}</div>
                  </div>
                  <div>
                    <div style="font-weight: bold; color: #7f8c8d; font-size: 13px;">Position</div>
                    <div style="color: #000000; font-size: 15px;">${personnelData.position || '-'}</div>
                  </div>
                  <div>
                    <div style="font-weight: bold; color: #7f8c8d; font-size: 13px;">Date Enlisted</div>
                    <div style="color: #000000; font-size: 15px;">${personnelData.dateJoined}</div>
                  </div>
                  <div>
                    <div style="font-weight: bold; color: #7f8c8d; font-size: 13px;">Service Status</div>
                    <div style="color: #000000; font-size: 15px;">Active Duty</div>
                  </div>
                </div>
              </div>

              <!-- Contact Information -->
              <div style="margin-bottom: 25px;">
                <h2 style="margin: 0 0 15px 0; color: #34495e; font-size: 18px; text-transform: uppercase; border-bottom: 2px solid #34495e; padding-bottom: 5px;">Contact Information</h2>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
                  <div>
                    <div style="font-weight: bold; color: #7f8c8d; font-size: 13px;">Military Email</div>
                    <div style="color: #000000; font-size: 15px;">${personnelData.email}</div>
                  </div>
                  <div>
                    <div style="font-weight: bold; color: #7f8c8d; font-size: 13px;">Phone</div>
                    <div style="color: #000000; font-size: 15px;">${personnelData.phone || '-'}</div>
                  </div>
                </div>
              </div>

              <!-- Awards & Recognition -->
              ${personnelData.awards && personnelData.awards.length > 0 ? `
              <div style="margin-bottom: 25px;">
                <h2 style="margin: 0 0 15px 0; color: #34495e; font-size: 18px; text-transform: uppercase; border-bottom: 2px solid #34495e; padding-bottom: 5px;">Awards & Recognition</h2>
                <div style="border: 1px solid #ddd; border-radius: 6px; overflow: hidden;">
                  ${personnelData.awards.map((award, index) => `
                    <div style="display: flex; padding: 12px; ${index % 2 === 0 ? 'background-color: #f8f9fa;' : ''}">
                      <div style="width: 30px; height: 30px; background-color: #f1c40f; color: #7f500b; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 16px; margin-right: 12px; flex-shrink: 0;">★</div>
                      <div style="flex-grow: 1;">
                        <div style="font-weight: bold; color: #000000; font-size: 15px;">${award.title}</div>
                        <div style="display: flex; justify-content: space-between; font-size: 13px;">
                          <div style="color: #7f8c8d;">Awarded on ${award.date}</div>
                        </div>
                        <div style="color: #34495e; margin-top: 5px; font-size: 14px;">${award.description}</div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
              ` : ''}
            </div>

            <!-- Right Column -->
            <div style="width: 35%; padding: 20px;">
              <!-- Training Status -->
              <div style="margin-bottom: 25px; background-color: #f8f9fa; border-radius: 6px; padding: 15px;">
                <h2 style="margin: 0 0 15px 0; color: #34495e; font-size: 18px; text-transform: uppercase; border-bottom: 2px solid #34495e; padding-bottom: 5px;">Training Status</h2>
                <div style="text-align: center; margin-bottom: 15px;">
                  <div style="font-size: 14px; color: #7f8c8d; margin-bottom: 5px;">Overall Completion</div>
                  <div style="font-size: 32px; font-weight: bold; color: ${trainingCompletion >= 90 ? '#27ae60' : trainingCompletion >= 75 ? '#f39c12' : '#e74c3c'};">${trainingCompletion}%</div>
                </div>
                <div style="height: 10px; background-color: #ecf0f1; border-radius: 5px; overflow: hidden; margin-bottom: 15px;">
                  <div style="height: 100%; width: ${trainingCompletion}%; background-color: ${trainingCompletion >= 90 ? '#27ae60' : trainingCompletion >= 75 ? '#f39c12' : '#e74c3c'};"></div>
                </div>
              </div>

              <!-- Qualifications -->
              ${personnelData.qualifications && personnelData.qualifications.length > 0 ? `
              <div style="margin-bottom: 25px;">
                <h2 style="margin: 0 0 15px 0; color: #34495e; font-size: 18px; text-transform: uppercase; border-bottom: 2px solid #34495e; padding-bottom: 5px;">Qualifications</h2>
                <div style="display: grid; grid-template-columns: 1fr; gap: 10px;">
                  ${personnelData.qualifications.map(q => `
                    <div style="display: flex; align-items: center; background-color: #ecf0f1; padding: 8px 12px; border-radius: 4px;">
                      <div style="width: 18px; height: 18px; background-color: #2ecc71; color: white; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 10px; margin-right: 10px;">✓</div>
                      <div style="color: #000000; font-size: 14px;">${q}</div>
                    </div>
                  `).join('')}
                </div>
              </div>
              ` : ''}
            </div>
          </div>

          <!-- Spacer to push footer down -->
          <div style="flex-grow: 1;"></div>

          <!-- Footer - positioned at bottom -->
          <div style="background-color: #34495e; color: white; padding: 15px; font-size: 12px; display: flex; justify-content: space-between; width: 100%; margin-top: auto;">
            <div>301st Ready Reserve Infantry Battalion Community Defense Center</div>
            <div>Generated on ${new Date().toLocaleString()}</div>
          </div>

          <!-- Watermark (subtle) -->
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 100px; color: rgba(0,0,0,0.03); white-space: nowrap; pointer-events: none; text-transform: uppercase;">OFFICIAL COPY</div>
        </div>
      `;

      // Use html2canvas to convert the HTML to a canvas with proper text rendering
      const canvas = await html2canvas(tempContainer, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          // Ensure all text elements in the clone are properly colored
          // Fix for linter error: Property 'style' does not exist on type 'Element'
          const allTextElements = clonedDoc.querySelectorAll('div, h1, h2, h3, h4, p, span');
          allTextElements.forEach((el) => {
            // Use type assertion to inform TypeScript that el has style property
            const element = el as HTMLElement;
            if (!element.style.color && element.tagName !== 'DIV') {
              element.style.color = '#000000';
            }
          });
        }
      });

      // Create PDF from canvas
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Calculate dimensions to fit the image properly on the page
      const imgWidth = 210; // A4 width in mm (210mm)
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = Math.min(canvas.height * imgWidth / canvas.width, pageHeight);
      
      // Get image data from canvas
      const imgData = canvas.toDataURL('image/png');
      
      // Add the image, centered
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      // Save the PDF
      pdf.save(`personnel-profile-${personnelData.serviceId}.pdf`);
      
      // Clean up
      document.body.removeChild(tempContainer);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
            <h3 className="text-sm font-medium text-red-800">Error loading prescriptive analytics</h3>
          </div>
          <p className="mt-2 text-sm text-red-700">{error}</p>
          <button 
            className="mt-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700"
            onClick={() => fetchPrescriptiveData()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!prescriptiveData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2" />
            <h3 className="text-sm font-medium text-yellow-800">No data available</h3>
          </div>
          <p className="mt-2 text-sm text-yellow-700">No prescriptive analytics data is currently available.</p>
        </div>
      </div>
    );
  }

  // Calculate summary statistics
  const getAverageImprovement = () => {
    const companies = prescriptiveData.trainingRecommendations.companies;
    return companies.reduce((sum, company) => sum + company.potentialImprovement, 0) / companies.length;
  };

  const getAverageProjectedReadiness = () => {
    const companies = prescriptiveData.trainingRecommendations.companies;
    return companies.reduce((sum, company) => sum + company.projectedReadiness, 0) / companies.length;
  };

  const getHighestImpactCompany = () => {
    const companies = prescriptiveData.trainingRecommendations.companies;
    return companies.reduce((highest, company) => 
      company.potentialImprovement > highest.potentialImprovement ? company : highest, 
      companies[0]
    );
  };

  const renderTrainingOptimizationContent = () => {
    // Placeholder implementation - restore if needed
    return (
      <Card title="Training Optimization">
        <div className="space-y-2">
          <p className="text-gray-600 text-sm">
            Analysis suggests focusing training resources on <span className="font-medium">Bravo Company</span> due to lower completion rates (currently 65%).
          </p>
          <p className="text-gray-600 text-sm">
            Consider implementing standardized <span className="font-medium">Combat Readiness Drills</span> across all units to potentially improve overall readiness by an average of {getAverageImprovement().toFixed(1)}%.
          </p>
          <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium mt-2">View Training Details &rarr;</button>
        </div>
      </Card>
    );
  };
  
  const renderPromotionRecommendationsContent = () => {
    if (!prescriptiveData?.promotionRecommendations?.personnel) {
      return <p>No promotion recommendations available.</p>;
    }

    const personnel = prescriptiveData.promotionRecommendations.personnel;
    
    // --- Filter and Search Logic --- 
    const filteredPersonnel = personnel.filter(person => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = (
        person.name.toLowerCase().includes(searchTermLower) ||
        person.serviceId.toLowerCase().includes(searchTermLower) ||
        person.militaryEmail.toLowerCase().includes(searchTermLower)
      );
      const matchesCompany = filterCompany ? person.company === filterCompany : true;
      const matchesRank = filterRank ? person.recommendedRank === filterRank : true;
      
      return matchesSearch && matchesCompany && matchesRank;
    });
    // --- End Filter and Search Logic --- 

    // --- Pagination Logic (operates on filteredPersonnel) --- 
    const totalItems = filteredPersonnel.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    // Use Math.max with 1 to ensure adjustedCurrentPage is never less than 1
    const adjustedCurrentPage = Math.max(1, Math.min(currentPage, totalPages)); 
    const startIndex = (adjustedCurrentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPersonnel = filteredPersonnel.slice(startIndex, endIndex);

    const handlePreviousPage = () => {
      setCurrentPage((prev) => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
       // Use adjustedCurrentPage for calculating next page boundary correctly
       // Ensure next page doesn't exceed totalPages
       setCurrentPage((prev) => Math.min(adjustedCurrentPage + 1, totalPages));
    };

    // --- End Pagination Logic --- 

    // --- Get unique companies/ranks for filters ---
    const uniqueCompanies = Array.from(new Set(personnel.map(p => p.company)));
    // Use the official rank list for the filter dropdown
    // const uniqueRecommendedRanks = Array.from(new Set(personnel.map(p => p.recommendedRank))); 
    // --- End Filter data gathering ---

    return (
      <Card className="w-full overflow-hidden flex flex-col flex-grow">
        <div className="px-6 py-5 border-b border-gray-200 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold leading-6 text-gray-900">Personnel Promotion Eligibility Report</h3>
              <p className="mt-1 text-sm text-gray-500">
                Comprehensive list of personnel eligible for promotion based on training, time in rank, and performance metrics.
              </p>
            </div>
            <div className="flex space-x-2 print:hidden">
              <button
                onClick={handlePrint}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PrinterIcon className="h-4 w-4 mr-1.5" />
                Print Report
              </button>
              <button
                onClick={handleExportPDF}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <DocumentArrowDownIcon className="h-4 w-4 mr-1.5" />
                Export Report
              </button>
            </div>
          </div>
        </div>

        {/* --- Filter/Search Controls --- */}
        <div className="px-4 py-4 sm:px-6 border-b border-gray-200 flex-shrink-0 bg-gray-50">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 sr-only">
                Search
              </label>
              <input
                type="text"
                name="search"
                id="search"
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Search by Name, ID, Email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="companyFilter" className="block text-sm font-medium text-gray-700 sr-only">
                Filter by Company
              </label>
              <select
                id="companyFilter"
                name="companyFilter"
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                value={filterCompany}
                onChange={(e) => setFilterCompany(e.target.value)}
              >
                <option value="">All Companies</option>
                {uniqueCompanies.map(company => (
                  <option key={company} value={company}>{company}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="rankFilter" className="block text-sm font-medium text-gray-700 sr-only">
                Filter by Recommended Rank
              </label>
              <select
                id="rankFilter"
                name="rankFilter"
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                value={filterRank}
                onChange={(e) => setFilterRank(e.target.value)}
              >
                <option value="">All Recommended Ranks</option>
                {/* Map over OFFICIAL_RANKS */}
                {OFFICIAL_RANKS.map(rank => (
                  <option key={rank} value={rank}>{rank}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        {/* --- End Filter/Search Controls --- */}

        <div ref={tableRef} className="overflow-x-auto overflow-y-auto flex-grow">
          <div className="p-4 space-y-6 bg-white">
            {/* Report Header Section */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Personnel Promotion Eligibility Report</h3>
              <p className="text-gray-600 mb-4">
                This report identifies personnel who meet the criteria for promotion based on training completion, 
                time in rank, and performance metrics. Each candidate has been evaluated and assigned a basis score 
                that reflects their readiness for advancement.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-3 rounded shadow-sm">
                  <div className="text-sm font-medium text-gray-500">Total Eligible Personnel</div>
                  <div className="text-2xl font-bold text-indigo-600">
                    {prescriptiveData?.promotionRecommendations?.personnel?.length || 0}
                  </div>
                </div>
                <div className="bg-white p-3 rounded shadow-sm">
                  <div className="text-sm font-medium text-gray-500">Average Basis Score</div>
                  <div className="text-2xl font-bold text-indigo-600">
                    {prescriptiveData?.promotionRecommendations?.personnel?.length ? 
                      Math.round(prescriptiveData.promotionRecommendations.personnel.reduce((sum, p) => sum + p.score, 0) / 
                      prescriptiveData.promotionRecommendations.personnel.length) : 0}%
                  </div>
                </div>
                <div className="bg-white p-3 rounded shadow-sm">
                  <div className="text-sm font-medium text-gray-500">Report Generated</div>
                  <div className="text-lg font-medium text-gray-800">{lastRefreshed || new Date().toLocaleDateString()}</div>
                </div>
              </div>
            </div>
            
            {currentPersonnel.length > 0 ? (
              currentPersonnel.map((person) => (
                <div key={person.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 h-12 w-12 rounded-full ${getAvatarColor(person.id)} flex items-center justify-center text-white font-medium`}>
                        {getInitials(person.name)}
                      </div>
                      <div className="ml-4">
                        <h4 className="text-lg font-medium text-gray-900">{person.name}</h4>
                        <div className="flex items-center mt-1">
                          <span className="text-sm text-gray-500 mr-2">Service ID: {person.serviceId}</span>
                          <span className="text-sm text-gray-500">{person.company}</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      className="text-indigo-600 hover:text-indigo-900 focus:outline-none inline-flex items-center"
                      onClick={() => openPersonnelModal(person.id)} 
                    >
                      <EyeIcon className="h-4 w-4 mr-1.5" />
                      View Profile
                    </button>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Current Rank</div>
                      <div className="mt-1 text-sm text-gray-900">{person.currentRank}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Recommended Rank</div>
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <ArrowTrendingUpIcon className="h-4 w-4 mr-1 text-green-600" aria-hidden="true" />
                          {person.recommendedRank}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Basis Score</div>
                      <div className="mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          person.score >= 90 ? 'bg-green-100 text-green-800' : 
                          person.score >= 80 ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {person.score}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email</div>
                      <div className="mt-1 text-sm text-gray-900 truncate">{person.militaryEmail}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Eligibility Date</div>
                      <div className="mt-1 text-sm text-gray-900">{person.eligibilityDate}</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-gray-500">
                No personnel found matching your criteria.
              </div>
            )}
          </div>
        </div>

        {/* Pagination Controls - Operates on filtered data length */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 flex-shrink-0">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{filteredPersonnel.length > 0 ? startIndex + 1 : 0}</span> to <span className="font-medium">{Math.min(endIndex, totalItems)}</span> of{' '}
                  <span className="font-medium">{totalItems}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={handlePreviousPage}
                    disabled={adjustedCurrentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                  {/* Current page indicator - Simple version */}
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    Page {adjustedCurrentPage} of {totalPages}
                  </span>
                  <button
                    onClick={handleNextPage}
                    disabled={adjustedCurrentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Next</span>
                    <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </Card>
    );
  };
  
  const renderResourceAllocationContent = () => {
    // Placeholder implementation - restore if needed
    return (
      <Card title="Resource Allocation">
        <div className="space-y-2">
          <p className="text-gray-600 text-sm">
            Staffing analysis indicates <span className="font-medium">Bravo Company</span> is currently <span className="font-medium text-red-600">understaffed</span> (deviation: -8). 
            <span className="font-medium">HQ</span> shows a potential surplus (deviation: +3).
          </p>
          <p className="text-gray-600 text-sm">
            Recommendation: Reallocate 3-5 personnel from HQ to Bravo or assign personnel from the reserve pool to improve operational balance.
          </p>
          <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium mt-2">View Company Staffing &rarr;</button>
        </div>
      </Card>
    );
  };
  
  const renderDocumentsContent = () => {
    // Placeholder implementation - restore if needed
    const backlog = prescriptiveData?.documentVerification?.backlog || [];
    const totalPending = backlog.reduce((sum, item) => sum + item.count, 0);
    const oldest = backlog.reduce((oldest, item) => 
      !oldest || new Date(item.oldestPendingDate) < new Date(oldest.oldestPendingDate) ? item : oldest, 
      backlog[0]
    );
    
    return (
      <Card title="Document Backlog">
        <div className="space-y-2">
          <p className="text-gray-600 text-sm">
            There are currently <span className="font-medium">{totalPending}</span> documents pending verification across all companies.
          </p>
          <p className="text-gray-600 text-sm">
            The backlog has grown by <span className="font-medium text-red-600">{prescriptiveData?.documentVerification?.growthRate || 0}%</span> in the last 30 days. 
            Priority should be given to <span className="font-medium">{oldest?.company} Company</span> which has the oldest pending documents (since {oldest?.oldestPendingDate}).
          </p>
          <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium mt-2">View Document Queue &rarr;</button>
        </div>
      </Card>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'training':
        return renderTrainingOptimizationContent();
      case 'personnel':
        return renderPromotionRecommendationsContent();
      case 'resources':
        return renderResourceAllocationContent();
      case 'documents':
        return renderDocumentsContent();
      default:
        return null;
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 flex flex-col min-h-[calc(100vh-theme(space.24))] space-y-6">
      {/* Header - Don't grow/shrink */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center flex-shrink-0">
        <div className="flex items-center mb-3 sm:mb-0">
          <LightBulbIcon className="h-7 w-7 text-indigo-600 mr-3" />
          <h1 className="text-2xl font-bold text-gray-900">Prescriptive Analytics</h1>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-xs text-gray-500">Last refreshed: {lastRefreshed || 'Never'}</span>
          <button 
            onClick={fetchPrescriptiveData} 
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh Analysis'}
          </button>
        </div>
      </div>

      {/* Main Content Area - Promotion Recommendations Card - Allow to grow */}
      {renderPromotionRecommendationsContent()}

      {/* Other Insights - Don't grow/shrink */}
      <div className="border-t border-gray-200 pt-6 flex-shrink-0">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Other Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {renderTrainingOptimizationContent()}
           {renderResourceAllocationContent()}
           {renderDocumentsContent()}
        </div>
      </div>

      {/* Personnel Profile Modal */}
      <Transition.Root show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closePersonnelModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform rounded-lg bg-white text-left shadow-xl transition-all w-full max-w-7xl max-h-[90vh] overflow-hidden">
                  {loadingPersonnel ? (
                    <div className="p-4 flex justify-center items-center h-96">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                    </div>
                  ) : personnelData ? (
                    <>
                      <div className="flex justify-between items-center p-4 border-b border-gray-200">
                        <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900">
                          Personnel Profile
                        </Dialog.Title>
                        <div className="flex items-center space-x-3">
                          <button
                            type="button"
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            onClick={handlePrintProfile}
                          >
                            <PrinterIcon className="h-4 w-4 mr-1.5" />
                            Print
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            onClick={handleExportProfilePDF}
                          >
                            <DocumentArrowDownIcon className="h-4 w-4 mr-1.5" />
                            Export PDF
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-md text-gray-400 hover:text-gray-500"
                            onClick={closePersonnelModal}
                          >
                            <span className="sr-only">Close</span>
                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                      <div className="overflow-y-auto max-h-[calc(90vh-4rem)]">
                        <div ref={profileRef} className="p-4 space-y-4">
                          {/* Profile Header */}
                          <div className="bg-white shadow rounded-lg p-4">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                              <div className="flex items-center">
                                <div className="h-20 w-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                                  {personnelData.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div className="ml-6">
                                  <h2 className="text-2xl font-bold text-gray-900">{personnelData.name}</h2>
                                  <div className="flex items-center mt-1">
                                    <span className="text-gray-600 mr-3">{personnelData.rank}</span>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(personnelData.status)}`}>
                                      {personnelData.status}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-500 mt-1">
                                    Service ID: {personnelData.serviceId}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-4 md:mt-0 flex flex-col items-end">
                                <div className="text-right">
                                  <span className="text-sm font-medium text-gray-500">Company</span>
                                  <div className="text-lg font-medium text-gray-900">{personnelData.company}</div>
                                </div>
                                {personnelData.performanceScore && (
                                  <div className="mt-2 text-right">
                                    <span className="text-sm font-medium text-gray-500">Performance Score</span>
                                    <div className={`text-lg font-medium ${getScoreColor(personnelData.performanceScore)}`}>
                                      {personnelData.performanceScore}%
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Personal Information */}
                          <div className="bg-white shadow rounded-lg overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-200">
                              <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
                            </div>
                            <div className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-3">
                                  <div>
                                    <div className="flex items-center">
                                      <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
                                      <span className="text-sm font-medium text-gray-500">Email</span>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-900 truncate" title={personnelData.email}>{personnelData.email}</p>
                                  </div>
                                  <div>
                                    <div className="flex items-center">
                                      <PhoneIcon className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
                                      <span className="text-sm font-medium text-gray-500">Phone</span>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-900">{personnelData.phone || '-'}</p>
                                  </div>
                                </div>
                                <div className="space-y-3">
                                  <div>
                                    <div className="flex items-center">
                                      <IdentificationIcon className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
                                      <span className="text-sm font-medium text-gray-500">Position</span>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-900">{personnelData.position || '-'}</p>
                                  </div>
                                   <div>
                                    <div className="flex items-center">
                                      <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
                                      <span className="text-sm font-medium text-gray-500">Company</span>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-900">{personnelData.company}</p>
                                  </div>
                                </div>
                                <div className="space-y-3">
                                  <div>
                                    <div className="flex items-center">
                                      <ClockIcon className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
                                      <span className="text-sm font-medium text-gray-500">Date Joined</span>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-900">{personnelData.dateJoined}</p>
                                  </div>
                                  <div>
                                    <div className="flex items-center">
                                      <AcademicCapIcon className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
                                      <span className="text-sm font-medium text-gray-500">Training Completion</span>
                                    </div>
                                    <div className="flex items-center mt-1">
                                      <span className="text-sm text-gray-900 mr-2">{personnelData.trainingCompletion}%</span>
                                      <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${personnelData.trainingCompletion}%` }}></div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Qualifications */}
                          {personnelData.qualifications && personnelData.qualifications.length > 0 && (
                            <div className="bg-white shadow rounded-lg overflow-hidden">
                              <div className="px-4 py-3 border-b border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900">Qualifications</h3>
                              </div>
                              <div className="p-4">
                                <ul className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2">
                                  {personnelData.qualifications.map((qualification, index) => (
                                    <li key={index} className="flex items-center text-sm text-gray-900">
                                      <CheckIcon className="h-4 w-4 text-green-500 mr-1.5 flex-shrink-0" />
                                      {qualification}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}

                          {/* Awards & Recognition */}
                          {personnelData.awards && personnelData.awards.length > 0 && (
                            <div className="bg-white shadow rounded-lg overflow-hidden">
                              <div className="px-4 py-3 border-b border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900">Awards & Recognition</h3>
                              </div>
                              <div className="p-4">
                                <div className="space-y-4">
                                  {personnelData.awards.map((award, index) => (
                                    <div key={index} className="flex">
                                      <div className="flex-shrink-0">
                                        <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                                          <StarIcon className="h-5 w-5 text-yellow-600" />
                                        </div>
                                      </div>
                                      <div className="ml-3">
                                        <h4 className="text-sm font-medium text-gray-900">{award.title}</h4>
                                        <p className="text-xs text-gray-500 mt-0.5">Awarded on {award.date}</p>
                                        <p className="text-sm text-gray-600 mt-1">{award.description}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-6 text-center">
                      <p className="text-gray-500">No personnel data available</p>
                    </div>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
}

// Add print styles at the end of the file
const printStyles = `
  @media print {
    body * {
      visibility: hidden;
    }
    .print-container, .print-container * {
      visibility: visible;
    }
    .print-hide {
      display: none !important;
    }
    .overflow-x-auto {
      overflow: visible !important;
    }
    .overflow-y-auto {
      overflow: visible !important;
    }
    table {
      width: 100% !important;
      page-break-inside: auto;
    }
    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    thead {
      display: table-header-group;
    }
    tfoot {
      display: table-footer-group;
    }
  }
`;

// Add styles to the document head
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = printStyles;
  document.head.appendChild(style);
} 