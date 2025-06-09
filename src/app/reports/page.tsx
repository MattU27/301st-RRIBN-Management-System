'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { 
  ChartBarIcon, 
  DocumentTextIcon, 
  ArrowDownTrayIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ClipboardDocumentCheckIcon,
  UsersIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';
import { exportToCSV, exportToExcel, exportToPDF, printReport } from '@/utils/exportUtils';
import PermissionGuard from '@/components/PermissionGuard';

// Report types
type ReportType = 
  | 'personnel_roster'
  | 'training_completion'
  | 'document_status'
  | 'readiness_summary'
  | 'audit_logs'
  | 'reservist_listing';

// Interface to match MongoDB personnel data structure
interface PersonnelData {
  _id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  rank: string;
  serviceNumber: string;
  company: string;
  phone: string;
  email: string;
  alternativeEmail?: string;
  status: string;
  isActive: boolean;
  isVerified: boolean;
  dateJoined?: string;
  lastUpdated?: string;
}

// Interface for data displayed in the report
interface ReportPersonnel {
  id: string;
  serialNumber: string;
  name: string;
  rank: string;
  company: string;
  contactNumber: string;
  email: string;
  status: string;
  active: string;
  verified: string;
  dateJoined: string;
  lastUpdated: string;
}

// Report formats
type ExportFormat = 'csv' | 'excel' | 'pdf';

interface ReportDefinition {
  id: ReportType;
  name: string;
  description: string;
  icon: React.ReactNode;
  requiredPermission: string;
  getData: () => Promise<any[]>;
}

export default function ReportsPage() {
  const { user, isAuthenticated, isLoading, getToken } = useAuth();
  const router = useRouter();
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [allData, setAllData] = useState<any[] | null>(null);
  const [filterValue, setFilterValue] = useState('');
  const [filteredData, setFilteredData] = useState<any[] | null>(null);
  const [companyFilter, setCompanyFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [availableCompanies, setAvailableCompanies] = useState<string[]>([]);
  const [availableStatuses, setAvailableStatuses] = useState<string[]>([]);
  const rowsPerPage = 5; // Show 5 rows per page

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Extract unique companies and statuses when data changes
  useEffect(() => {
    if (!allData) return;
    
    // Extract unique companies and convert IDs to readable names
    const companies = Array.from(
      new Set(allData.map(item => getCompanyName(item.company)))
    ).filter(Boolean);
    
    setAvailableCompanies(companies.sort());
    
    // Extract unique statuses and capitalize first letter
    const statuses = Array.from(
      new Set(allData.map(item => {
        const status = item.status;
        return status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : '';
      }))
    ).filter(Boolean);
    
    setAvailableStatuses(statuses.sort());
  }, [allData]);

  // Apply filters when filter values or all data changes
  useEffect(() => {
    if (!allData) return;
    
    let filtered = [...allData];
    
    // Apply text search filter
    if (filterValue.trim()) {
      const lowerFilter = filterValue.toLowerCase();
      filtered = filtered.filter(item => {
        return Object.values(item).some(value => 
          String(value).toLowerCase().includes(lowerFilter)
        );
      });
    }
    
    // Apply company filter
    if (companyFilter) {
      filtered = filtered.filter(item => getCompanyName(item.company) === companyFilter);
    }
    
    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(item => {
        const itemStatus = item.status.charAt(0).toUpperCase() + item.status.slice(1).toLowerCase();
        return itemStatus === statusFilter;
      });
    }
    
    setFilteredData(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [filterValue, companyFilter, statusFilter, allData]);

  // Update preview data when filtered data or current page changes
  useEffect(() => {
    if (!filteredData) return;
    
    const startIdx = (currentPage - 1) * rowsPerPage;
    const endIdx = startIdx + rowsPerPage;
    setPreviewData(filteredData.slice(startIdx, endIdx));
  }, [filteredData, currentPage, rowsPerPage]);

  // Mock data for reports
  const getMockPersonnelData = async () => {
    return [
      { id: 1, name: 'John Doe', rank: 'Captain', company: 'Alpha', status: 'Ready', dateJoined: '2023-01-01' },
      { id: 2, name: 'Jane Smith', rank: 'Lieutenant', company: 'Bravo', status: 'Standby', dateJoined: '2023-02-15' },
      { id: 3, name: 'Robert Johnson', rank: 'Sergeant', company: 'Charlie', status: 'Ready', dateJoined: '2023-03-01' },
      { id: 4, name: 'Emily Davis', rank: 'Corporal', company: 'HQ', status: 'Retired', dateJoined: '2023-01-15' },
      { id: 5, name: 'Michael Wilson', rank: 'Private', company: 'Signal', status: 'Ready', dateJoined: '2023-06-01' }
    ];
  };

  const getMockTrainingData = async () => {
    return [
      { id: 1, title: 'Basic Training', startDate: '2023-01-15', endDate: '2023-02-15', completed: 45, registered: 50, completionRate: '90%' },
      { id: 2, name: 'Advanced Combat', startDate: '2023-03-10', endDate: '2023-03-25', completed: 32, registered: 40, completionRate: '80%' },
      { id: 3, name: 'Leadership Course', startDate: '2023-04-05', endDate: '2023-04-20', completed: 18, registered: 20, completionRate: '90%' },
      { id: 4, name: 'First Aid', startDate: '2023-05-10', endDate: '2023-05-12', completed: 38, registered: 40, completionRate: '95%' },
      { id: 5, name: 'Tactical Operations', startDate: '2023-06-01', endDate: '2023-06-15', completed: 25, registered: 30, completionRate: '83%' }
    ];
  };

  const getMockDocumentData = async () => {
    return [
      { id: 1, title: 'Military ID', type: 'ID', uploadDate: '2023-01-01', status: 'Verified', verifiedBy: 'Lt. Brown' },
      { id: 2, title: 'Medical Certificate', type: 'Medical', uploadDate: '2023-12-01', status: 'Verified', verifiedBy: 'Maj. Smith' },
      { id: 3, title: 'Training Certificate', type: 'Certificate', uploadDate: '2023-02-20', status: 'Pending', verifiedBy: null },
      { id: 4, title: 'Security Clearance', type: 'Clearance', uploadDate: '2023-03-15', status: 'Verified', verifiedBy: 'Col. Johnson' },
      { id: 5, title: 'Deployment Order', type: 'Order', uploadDate: '2023-05-10', status: 'Verified', verifiedBy: 'Maj. Smith' }
    ];
  };

  const getMockReadinessData = async () => {
    return [
      { company: 'Alpha', personnel: 45, readyPersonnel: 38, documentsComplete: 92, trainingsComplete: 85, readinessScore: 88 },
      { company: 'Bravo', personnel: 42, readyPersonnel: 35, documentsComplete: 88, trainingsComplete: 82, readinessScore: 85 },
      { company: 'Charlie', personnel: 38, readyPersonnel: 30, documentsComplete: 78, trainingsComplete: 75, readinessScore: 76 },
      { company: 'HQ', personnel: 25, readyPersonnel: 23, documentsComplete: 95, trainingsComplete: 90, readinessScore: 93 },
      { company: 'Signal', personnel: 30, readyPersonnel: 24, documentsComplete: 80, trainingsComplete: 78, readinessScore: 79 },
      { company: 'FAB', personnel: 35, readyPersonnel: 28, documentsComplete: 82, trainingsComplete: 80, readinessScore: 81 }
    ];
  };

  const getMockAuditLogData = async () => {
    // Get from localStorage for demo purposes
    const storedLogs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
    return storedLogs.length > 0 ? storedLogs : [
      { timestamp: new Date().toISOString(), userId: 1, userName: 'John Doe', userRole: 'ADMIN', action: 'view', resource: 'report', details: 'Viewed personnel roster report' },
      { timestamp: new Date().toISOString(), userId: 1, userName: 'John Doe', userRole: 'ADMIN', action: 'export', resource: 'report', details: 'Exported personnel roster as PDF' }
    ];
  };

  const getMockReservistListingData = async () => {
    try {
      // Get authentication token
      const token = await getToken();
      
      if (!token) {
        throw new Error('Authentication failed');
      }
      
      // API endpoint to fetch reservist data - using limit=0 to fetch all records
      const apiUrl = '/api/personnel?role=reservist&limit=0';
      
      // Make the API request
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        },
        next: { revalidate: 0 } // Ensure fresh data each time
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch reservist data');
      }
      
      const data = await response.json();
      
      // Debug the response structure
      console.log('API Response structure:', JSON.stringify(data, null, 2).slice(0, 200) + '...');
      
      // Check for different response structures
      if (data.success) {
        // Handle case where data is in data.personnel (standard structure)
        if (data.data && data.data.personnel && Array.isArray(data.data.personnel)) {
          console.log('Using data.data.personnel structure');
          console.log('Total records fetched:', data.data.personnel.length);
          
          // Map MongoDB data to report format
          return data.data.personnel.map((person: PersonnelData): ReportPersonnel => ({
            id: person._id,
            serialNumber: person.serviceNumber || 'N/A',
            name: person.name || `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'N/A',
            rank: person.rank || 'N/A',
            company: getCompanyName(person.company) || 'N/A',
            contactNumber: person.phone || 'N/A',
            email: person.email || 'N/A',
            status: person.status || 'N/A',
            active: person.isActive ? 'Yes' : 'No',
            verified: person.isVerified ? 'Yes' : 'No',
            dateJoined: person.dateJoined ? new Date(person.dateJoined).toLocaleDateString() : 'N/A',
            lastUpdated: person.lastUpdated ? new Date(person.lastUpdated).toLocaleDateString() : 'N/A'
          }));
        } 
        // Handle case where data is directly in data (alternative structure)
        else if (data.data && Array.isArray(data.data)) {
          console.log('Using data.data array structure');
          console.log('Total records fetched:', data.data.length);
          
          // Map MongoDB data to report format
          return data.data.map((person: PersonnelData): ReportPersonnel => ({
            id: person._id,
            serialNumber: person.serviceNumber || 'N/A',
            name: person.name || `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'N/A',
            rank: person.rank || 'N/A',
            company: getCompanyName(person.company) || 'N/A',
            contactNumber: person.phone || 'N/A',
            email: person.email || 'N/A',
            status: person.status || 'N/A',
            active: person.isActive ? 'Yes' : 'No',
            verified: person.isVerified ? 'Yes' : 'No',
            dateJoined: person.dateJoined ? new Date(person.dateJoined).toLocaleDateString() : 'N/A',
            lastUpdated: person.lastUpdated ? new Date(person.lastUpdated).toLocaleDateString() : 'N/A'
          }));
        }
      }
      
      // If response format doesn't match expected structures
      console.error('Failed to fetch reservist data: Invalid response format', data);
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error fetching reservist data:', error);
      
      // Use fallback sample data in development mode or for demo purposes
      if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_USE_SAMPLE_DATA === 'true') {
        console.log('Using fallback sample data for demonstration');
        // Generate more sample data to demonstrate pagination
        return Array(20).fill(0).map((_, index) => {
          const companies = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'HQ', 'NERRSC (Signal Company)'];
          const ranks = ['Private', 'Corporal', 'Sergeant', 'Staff Sergeant', 'Lieutenant', 'Captain', 'Major', 'Colonel', 'General'];
          const statuses = ['Ready', 'Standby', 'On Leave', 'Training'];
          
          return {
            id: `68064464c89aeb74f${457340 + index}`,
            serialNumber: `${2018 + Math.floor(index/5)}-${10000 + index * 100}`,
            name: [
              'John Matthew Banto', 
              'Camila Ramos', 
              'Antonio Reyes', 
              'Carmen Santos', 
              'Isabella Torres', 
              'Regina Gomez', 
              'Andres Ramirez', 
              'Gabriel Mercado', 
              'Maria Lim', 
              'Jose Rizal', 
              'Elena Cruz', 
              'Miguel Santos', 
              'Roberto Aquino', 
              'Javier Velasco',
              'Juan Tolentino',
              'Alberto Villanueva',
              'Felipe Gomez',
              'Ricardo Luna',
              'Eduardo Santos',
              'Rodrigo Duterte'
            ][index % 20],
            rank: ranks[index % ranks.length],
            company: companies[index % companies.length],
            contactNumber: `+63${9450000000 + index}`,
            email: `${['banto', 'ramos', 'reyes', 'santos', 'torres', 'gomez', 'ramirez', 'mercado', 'lim', 'rizal'][index % 10]}@afpreserve.mil.ph`,
            status: statuses[index % statuses.length],
            active: index % 5 === 0 ? 'No' : 'Yes',
            verified: 'Yes',
            dateJoined: `202${index % 5 + 1}-${(index % 12) + 1}-${(index % 28) + 1}`,
            lastUpdated: '2023-11-20'
          };
        });
      }
      
      // Return empty array in case of error and no fallback
      return [];
    }
  };

  // Define available reports
  const reports: ReportDefinition[] = [
    {
      id: 'personnel_roster',
      name: 'Personnel Roster',
      description: 'Complete list of all personnel with their basic information',
      icon: <UserGroupIcon className="w-8 h-8 text-indigo-600" />,
      requiredPermission: 'view_all_personnel',
      getData: getMockPersonnelData
    },
    {
      id: 'training_completion',
      name: 'Training Completion',
      description: 'Summary of training completion rates and statistics',
      icon: <AcademicCapIcon className="w-8 h-8 text-green-600" />,
      requiredPermission: 'view_trainings',
      getData: getMockTrainingData
    },
    {
      id: 'document_status',
      name: 'Document Status',
      description: 'Status of all documents and verification information',
      icon: <DocumentTextIcon className="w-8 h-8 text-blue-600" />,
      requiredPermission: 'view_documents',
      getData: getMockDocumentData
    },
    {
      id: 'readiness_summary',
      name: 'Readiness Summary',
      description: 'Overall readiness metrics by company and category',
      icon: <ChartBarIcon className="w-8 h-8 text-purple-600" />,
      requiredPermission: 'view_analytics',
      getData: getMockReadinessData
    },
    {
      id: 'audit_logs',
      name: 'Audit Logs',
      description: 'System audit logs showing user actions and events',
      icon: <ClipboardDocumentCheckIcon className="w-8 h-8 text-red-600" />,
      requiredPermission: 'view_system_logs',
      getData: getMockAuditLogData
    },
    {
      id: 'reservist_listing',
      name: 'Reservist Listing',
      description: 'Complete list of all reservists with contact information and status',
      icon: <UsersIcon className="w-8 h-8 text-yellow-600" />,
      requiredPermission: 'view_personnel', // Basic permission that all staff and above have
      getData: getMockReservistListingData
    }
  ];

  const handleSelectReport = async (reportType: ReportType) => {
    setSelectedReport(reportType);
    setPreviewData(null);
    setAllData(null);
    setFilteredData(null);
    setFilterValue('');
    setCompanyFilter('');
    setStatusFilter('');
    setCurrentPage(1);
    
    // Get data
    const report = reports.find(r => r.id === reportType);
    if (report) {
      try {
        const data = await report.getData();
        setAllData(data);
        setFilteredData(data);
        // Set the first page of data for preview
        setPreviewData(data.slice(0, rowsPerPage));
      } catch (error) {
        console.error('Failed to get report data:', error);
      }
    }
  };

  const handlePrint = () => {
    if (!selectedReport || !allData) return;
    
    // Get the report title
    const reportTitle = reports.find(r => r.id === selectedReport)?.name || 'Report';
    
    // Use the printReport utility function
    printReport(allData, reportTitle);
  };

  const handlePageChange = (newPage: number) => {
    if (!filteredData) return;
    
    setCurrentPage(newPage);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterValue(e.target.value);
  };

  const handleClearFilters = () => {
    setFilterValue('');
    setCompanyFilter('');
    setStatusFilter('');
  };

  const handleCompanyFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCompanyFilter(e.target.value);
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  };

  const handleGenerateReport = async () => {
    if (!selectedReport) return;
    
    setIsGenerating(true);
    
    try {
      const report = reports.find(r => r.id === selectedReport);
      if (!report) return;
      
      // Use all data, not just the preview
      const data = allData || await report.getData();
      
      const filename = `${report.name.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}`;
      
      // Export based on selected format
      switch (exportFormat) {
        case 'csv':
          exportToCSV(data, filename);
          break;
        case 'excel':
          // Excel export is now async
          await exportToExcel(data, filename);
          break;
        case 'pdf':
          // For PDF, use the exportToPDF function which opens in a new tab
          exportToPDF(data, report.name, filename);
          break;
      }
      
      // Log the export action (in a real app, this would be sent to the server)
      if (user) {
        const auditLog = {
          timestamp: new Date().toISOString(),
          userId: user._id,
          userName: `${user.firstName} ${user.lastName}`,
          userRole: user.role,
          action: 'export' as const,
          resource: 'report' as const,
          details: `Exported ${report.name} as ${exportFormat.toUpperCase()}`
        };
        
        console.log('AUDIT LOG:', auditLog);
        
        // Store in localStorage for demo purposes
        const storedLogs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
        storedLogs.push(auditLog);
        localStorage.setItem('auditLogs', JSON.stringify(storedLogs.slice(-100))); // Keep last 100 logs
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Define the valid companies to match the UI options (reusing the list from the API)
  const COMPANY_NAMES = [
    'Alpha',
    'Bravo',
    'Charlie', 
    'Headquarters',
    'NERRSC (NERR-Signal Company)',
    'NERRFAB (NERR-Field Artillery Battery)'
  ];

  // Helper function to get a readable company name
  const getCompanyName = (companyValue: string): string => {
    // Create a mapping of company IDs/codes to human-readable names
    const companyMappings: Record<string, string> = {
      '67efd5b3c7528c0dfb15442b': 'Headquarters',
      '67efd5b3c7528c0dfb15442f': 'Bravo',
      '67efd5b3c7528c0dfb15442c': 'Charlie',
      '67efd5b3c7528c0dfb154429': 'Alpha',
      '67efd5b3c7528c0dfb154430': 'NERRFAB (Artillery Battalion)',
      '67efd5b3c7528c0dfb154431': 'NERRSC (Signal Company)'
    };

    // If the company is a known ID, return the mapped name
    if (companyMappings[companyValue]) {
      return companyMappings[companyValue];
    }

    // For any other value, return as is
    return companyValue;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-t-2 border-b-2 border-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Calculate total pages
  const totalPages = filteredData ? Math.ceil(filteredData.length / rowsPerPage) : 0;

  return (
    <div className="container px-4 py-6 mx-auto">
      <div className="flex items-center mb-4">
        <ChartBarIcon className="mr-2 text-indigo-600 w-7 h-7" />
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
      </div>

      {/* Top section with report selection and export options */}
      <Card className="mb-6">
        <div className="p-4">
          <div className="flex flex-col items-start justify-between mb-4 md:flex-row md:items-center">
            <h2 className="mb-2 text-lg font-semibold text-gray-900 md:mb-0">Available Reports</h2>
          </div>
          
          <div className="flex flex-col justify-between mb-6 md:flex-row md:items-center">
            <div className="grid grid-cols-1 gap-3 mb-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 md:mb-0">
              {reports.map((report) => (
                <PermissionGuard key={report.id} permission={report.requiredPermission}>
                  <button
                    className={`h-full w-full text-left p-3 rounded-lg border ${
                      selectedReport === report.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => handleSelectReport(report.id)}
                  >
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="flex-shrink-0 mb-2">{report.icon}</div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{report.name}</h3>
                        <p className="mt-1 text-xs text-gray-500">{report.description}</p>
                      </div>
                    </div>
                  </button>
                </PermissionGuard>
              ))}
            </div>
            
            {selectedReport && (
              <div className="flex flex-wrap items-center gap-2 ml-0 md:ml-4">
                <div className="flex items-center mr-2">
                  <span className="mr-2 text-sm font-medium text-gray-700">Export as:</span>
                  <div className="flex space-x-2">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="w-4 h-4 text-indigo-600 form-radio"
                        name="exportFormat"
                        value="pdf"
                        checked={exportFormat === 'pdf'}
                        onChange={() => setExportFormat('pdf')}
                      />
                      <span className="ml-1 text-sm text-gray-700">PDF</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="w-4 h-4 text-indigo-600 form-radio"
                        name="exportFormat"
                        value="excel"
                        checked={exportFormat === 'excel'}
                        onChange={() => setExportFormat('excel')}
                      />
                      <span className="ml-1 text-sm text-gray-700">Excel</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="w-4 h-4 text-indigo-600 form-radio"
                        name="exportFormat"
                        value="csv"
                        checked={exportFormat === 'csv'}
                        onChange={() => setExportFormat('csv')}
                      />
                      <span className="ml-1 text-sm text-gray-700">CSV</span>
                    </label>
                  </div>
                </div>
                
                {exportFormat === 'pdf' ? (
                  <Button
                    onClick={handleGenerateReport}
                    disabled={isGenerating}
                    className="flex items-center"
                    size="sm"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                    {isGenerating ? 'Generating...' : `Export as PDF`}
                  </Button>
                ) : (
                  <Button
                    onClick={handleGenerateReport}
                    disabled={isGenerating}
                    className="flex items-center"
                    size="sm"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                    {isGenerating ? 'Generating...' : `Export as ${exportFormat.toUpperCase()}`}
                  </Button>
                )}
                
                <Button
                  onClick={handlePrint}
                  className="flex items-center"
                  variant="secondary"
                  size="sm"
                >
                  <PrinterIcon className="w-4 h-4 mr-1" />
                  Print
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Preview section taking full width */}
      {selectedReport ? (
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Preview: {reports.find(r => r.id === selectedReport)?.name}
              </h2>
              {filteredData && (
                <div className="text-sm text-gray-500">
                  Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length} records
                </div>
              )}
            </div>
            
            {/* Add search filter */}
            <div className="mb-4">
              <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-4">
                {/* Text search */}
                <div className="relative w-full md:w-64">
                  <input 
                    type="text"
                    className="w-full px-4 py-2 pr-10 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Search records..."
                    value={filterValue}
                    onChange={handleFilterChange}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>

                {/* Company filter */}
                <div className="w-full md:w-auto">
                  <select
                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={companyFilter}
                    onChange={handleCompanyFilterChange}
                  >
                    <option value="">All Companies</option>
                    {availableCompanies.map(company => (
                      <option key={company} value={company}>{company}</option>
                    ))}
                  </select>
                </div>

                {/* Status filter */}
                <div className="w-full md:w-auto">
                  <select
                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={statusFilter}
                    onChange={handleStatusFilterChange}
                  >
                    <option value="">All Statuses</option>
                    {availableStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                {/* Clear filters button */}
                <div className="w-full md:w-auto">
                  <button
                    onClick={handleClearFilters}
                    className="w-full px-4 py-2 text-sm text-gray-600 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
            
            {previewData ? (
              <>
                <div className="w-full overflow-x-auto bg-white rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200 table-fixed">
                    <thead className="bg-gray-50">
                      <tr>
                        {Object.keys(previewData[0]).map((key) => (
                          <th
                            key={key}
                            scope="col"
                            className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                          >
                            {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {previewData.map((row, rowIndex) => (
                        <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          {Object.values(row).map((value: any, valueIndex) => (
                            <td
                              key={valueIndex}
                              className="px-4 py-3 text-sm text-gray-500 truncate"
                            >
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination */}
                {totalPages > 0 && (
                  <div className="flex items-center justify-center mt-6 print:hidden">
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        variant="secondary"
                        size="sm"
                        className="flex items-center"
                      >
                        <ChevronLeftIcon className="w-4 h-4 mr-1" />
                        Previous
                      </Button>
                      
                      <div className="flex items-center">
                        <span className="px-3 py-1 text-sm text-gray-700">
                          Page {currentPage} of {totalPages} ({filteredData?.length || 0} total records)
                        </span>
                      </div>
                      
                      <Button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        variant="secondary" 
                        size="sm"
                        className="flex items-center"
                      >
                        Next
                        <ChevronRightIcon className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="py-8 text-center">
                <DocumentTextIcon className="w-12 h-12 mx-auto text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Loading preview data...</h3>
              </div>
            )}
          </div>
        </Card>
      ) : (
        <Card>
          <div className="py-12 text-center">
            <DocumentTextIcon className="w-12 h-12 mx-auto text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No report selected</h3>
            <p className="mt-1 text-sm text-gray-500">
              Select a report from the list above to generate and export
            </p>
          </div>
        </Card>
      )}
      
      {/* Print-specific styles */}
      <style jsx global>{`
        @media print {
          nav, button, select, .print-hide {
            display: none !important;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print-full-width {
            width: 100% !important;
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
} 