'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { 
  ChartBarIcon, 
  UsersIcon, 
  ArrowDownTrayIcon, 
  ArrowLeftIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';
import { exportToCSV, exportToExcel, exportToPDF } from '@/utils/exportUtils';
import ReservistTable from '@/app/reports/components/ReservistTable';

interface ReservistData {
  _id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  alternativeEmail?: string;
  phone?: string;
  rank: string;
  company: string;
  serviceNumber?: string;
  status: string;
  address?: string;
  role: string;
  isVerified: boolean;
  isActive: boolean;
  dateJoined?: string;
  lastUpdated?: string;
}

export default function CompanyReservistsPage({ params }: { params: { company: string } }) {
  const { user, isAuthenticated, hasSpecificPermission, getToken } = useAuth();
  const router = useRouter();
  const [reservists, setReservists] = useState<ReservistData[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Format the company name for display
  const companyName = params.company
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Fetch company reservists data
    fetchCompanyReservists();
  }, [isAuthenticated, params.company]);

  const fetchCompanyReservists = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get authentication token
      const token = await getToken();
      
      if (!token) {
        throw new Error('Authentication failed');
      }
      
      // API endpoint to fetch personnel data by company
      // Convert the URL-friendly company name back to the actual company name for filtering
      const formattedCompany = companyName.replace(/-/g, ' ');
      
      // Create the API URL with company filter
      const apiUrl = `/api/personnel/company?company=${encodeURIComponent(formattedCompany)}&role=reservist`;
      
      // Make the API request
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch company reservists');
      }
      
      const data = await response.json();
      
      // Debug the response structure
      console.log('API Response structure:', JSON.stringify(data, null, 2).slice(0, 200) + '...');
      
      if (data.success) {
        if (Array.isArray(data.data)) {
          // Filter for reservists only (in case the API doesn't filter properly)
          const reservistData = data.data.filter((person: ReservistData) => 
            person.role === 'reservist'
          );
          setReservists(reservistData);
        } else {
          throw new Error('Invalid response format: data is not an array');
        }
      } else {
        throw new Error(data.error || 'Invalid response from server');
      }
    } catch (error) {
      console.error('Error fetching reservists:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch reservists');
      
      // Use fallback sample data in development mode or for demo purposes
      if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_USE_SAMPLE_DATA === 'true') {
        console.log('Using fallback sample data for demonstration');
        // Sample data for demonstration purposes
        const sampleReservists: ReservistData[] = [
          {
            _id: '1',
            firstName: 'John',
            lastName: 'Martinez',
            name: 'John Martinez',
            email: 'john.m@example.com',
            alternativeEmail: 'john.alt@example.com',
            phone: '09171234567',
            rank: 'Private',
            company: companyName,
            serviceNumber: '2019-10180',
            status: 'Ready',
            address: '2301 A San anton Street sampaloc manila',
            role: 'reservist',
            isVerified: true,
            isActive: true,
            dateJoined: '2023-04-21T00:00:00.000Z',
            lastUpdated: '2023-04-21T13:01:26.715Z'
          },
          {
            _id: '2',
            firstName: 'Maria',
            lastName: 'Santos',
            name: 'Maria Santos',
            email: 'maria.s@example.com',
            phone: '09182345678',
            rank: 'Corporal',
            company: companyName,
            serviceNumber: '2023-92595',
            status: 'Ready',
            role: 'reservist',
            isVerified: true,
            isActive: true,
            dateJoined: '2023-05-15T00:00:00.000Z',
            lastUpdated: '2023-05-15T10:30:45.123Z'
          },
          {
            _id: '3',
            firstName: 'Antonio',
            lastName: 'Reyes',
            name: 'Antonio Reyes',
            email: 'antonio.r@example.com',
            phone: '09193456789',
            rank: 'Private',
            company: companyName,
            serviceNumber: '2022-45678',
            status: 'Standby',
            role: 'reservist',
            isVerified: true,
            isActive: false,
            dateJoined: '2022-10-20T00:00:00.000Z',
            lastUpdated: '2023-02-10T14:20:33.456Z'
          }
        ];
        setReservists(sampleReservists);
        setError('Using sample data (database connection failed)');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    
    try {
      // Prepare data for export - create a clean version with only necessary fields
      const exportData = reservists.map(reservist => ({
        'Serial Number': reservist.serviceNumber || 'N/A',
        'Name': reservist.name || `${reservist.firstName} ${reservist.lastName}`,
        'Rank': reservist.rank || 'N/A',
        'Contact': reservist.phone || 'N/A',
        'Email': reservist.email || reservist.alternativeEmail || 'N/A',
        'Status': reservist.status || 'N/A',
        'Active': reservist.isActive ? 'Yes' : 'No',
        'Verified': reservist.isVerified ? 'Yes' : 'No',
        'Date Joined': reservist.dateJoined ? new Date(reservist.dateJoined).toLocaleDateString() : 'N/A',
        'Last Updated': reservist.lastUpdated ? new Date(reservist.lastUpdated).toLocaleDateString() : 'N/A'
      }));
      
      const filename = `${companyName.toLowerCase().replace(/\s+/g, '_')}_reservists_${new Date().toISOString().split('T')[0]}`;
      
      // Export based on selected format
      switch (exportFormat) {
        case 'csv':
          exportToCSV(exportData, filename);
          break;
        case 'excel':
          exportToExcel(exportData, filename);
          break;
        case 'pdf':
          exportToPDF(exportData, `${companyName} Reservist Roster`, filename);
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
          details: `Exported ${companyName} Reservist Roster as ${exportFormat.toUpperCase()}`
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

  const handlePrint = () => {
    window.print();
  };

  if (!hasSpecificPermission('view_personnel')) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <div className="text-center py-12">
            <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Access Denied</h3>
            <p className="mt-1 text-sm text-gray-500">
              You do not have permission to view company reservist reports.
            </p>
            <div className="mt-6">
              <Button onClick={() => router.push('/dashboard')} variant="secondary">
                Return to Dashboard
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header section with back button */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
        <div className="flex items-center mb-4 sm:mb-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push('/reports')}
            className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{companyName} Reservist Report</h1>
            <p className="text-sm text-gray-500">
              Complete roster of all reservists in {companyName} Company
            </p>
          </div>
        </div>
        
        {/* Export actions */}
        <div className="flex flex-wrap gap-2">
          <div className="relative z-10">
            <select
              id="exportFormat"
              name="exportFormat"
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white"
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as 'pdf' | 'excel' | 'csv')}
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
            </select>
          </div>
          
          <Button 
            variant="primary" 
            onClick={handleGenerateReport}
            disabled={isGenerating || reservists.length === 0}
            className="flex items-center"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
            {isGenerating ? 'Exporting...' : 'Export'}
          </Button>
          
          <Button
            variant="secondary"
            onClick={handlePrint}
            className="flex items-center"
          >
            <PrinterIcon className="h-4 w-4 mr-1" />
            Print
          </Button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-4 rounded-md bg-red-50 text-red-800">
          <p>{error}</p>
        </div>
      )}
      
      {/* Main content */}
      <Card className="mb-6 print:shadow-none">
        <div className="p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
              <UsersIcon className="h-5 w-5 mr-2 text-indigo-600" />
              Reservist Roster
            </h2>
            <span className="text-sm text-gray-500">
              {reservists.length} reservist{reservists.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          {/* Reservist table */}
          <ReservistTable data={reservists} isLoading={loading} />
        </div>
      </Card>
      
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