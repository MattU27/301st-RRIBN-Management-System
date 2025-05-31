'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { toast } from 'react-hot-toast';
import { 
  UserGroupIcon, 
  BuildingOfficeIcon,
  ChevronLeftIcon
} from '@heroicons/react/24/outline';

// Personnel interface
interface Personnel {
  id: string;
  name: string;
  rank: string;
  status: string;
  email: string;
  phone?: string;
  dateJoined: string;
  lastUpdated: string;
}

// Sample company data
const COMPANY_DATA: Record<string, { 
  name: string, 
  personnel: Personnel[],
  totalPersonnel: number,
  activePersonnel: number,
  readinessScore: number
}> = {
  'alpha': {
    name: 'Alpha',
    totalPersonnel: 45,
    activePersonnel: 38,
    readinessScore: 87,
    personnel: [
      {
        id: '1',
        name: 'John Smith',
        rank: 'Private First Class',
        status: 'Ready',
        email: 'john.smith@army.mil.ph',
        phone: '09123456789',
        dateJoined: '2023-04-15',
        lastUpdated: '2024-03-01'
      },
      {
        id: '2',
        name: 'Maria Garcia',
        rank: 'Corporal',
        status: 'Ready',
        email: 'maria.garcia@army.mil.ph',
        phone: '09187654321',
        dateJoined: '2022-11-10',
        lastUpdated: '2024-02-20'
      },
      {
        id: '3',
        name: 'James Wilson',
        rank: 'Sergeant',
        status: 'Standby',
        email: 'james.wilson@army.mil.ph',
        dateJoined: '2021-06-22',
        lastUpdated: '2024-01-15'
      }
    ]
  },
  'bravo': {
    name: 'Bravo',
    totalPersonnel: 52,
    activePersonnel: 48,
    readinessScore: 92,
    personnel: [
      {
        id: '4',
        name: 'Sarah Johnson',
        rank: 'Corporal',
        status: 'Ready',
        email: 'sarah.johnson@army.mil.ph',
        phone: '09234567890',
        dateJoined: '2022-07-22',
        lastUpdated: '2024-02-15'
      },
      {
        id: '5',
        name: 'Robert Brown',
        rank: 'Staff Sergeant',
        status: 'Ready',
        email: 'robert.brown@army.mil.ph',
        phone: '09198765432',
        dateJoined: '2020-09-05',
        lastUpdated: '2024-03-10'
      }
    ]
  },
  'charlie': {
    name: 'Charlie',
    totalPersonnel: 38,
    activePersonnel: 32,
    readinessScore: 76,
    personnel: [
      {
        id: '6',
        name: 'Michael Davis',
        rank: 'Sergeant',
        status: 'Ready',
        email: 'michael.davis@army.mil.ph',
        dateJoined: '2021-09-10',
        lastUpdated: '2024-01-20'
      },
      {
        id: '7',
        name: 'Jennifer Lee',
        rank: 'Private First Class',
        status: 'Standby',
        email: 'jennifer.lee@army.mil.ph',
        phone: '09223344556',
        dateJoined: '2023-02-14',
        lastUpdated: '2024-02-28'
      }
    ]
  },
  'headquarters': {
    name: 'Headquarters',
    totalPersonnel: 24,
    activePersonnel: 22,
    readinessScore: 94,
    personnel: [
      {
        id: '8',
        name: 'Lisa Wilson',
        rank: 'Staff Sergeant',
        status: 'Ready',
        email: 'lisa.wilson@army.mil.ph',
        phone: '09123789456',
        dateJoined: '2020-03-15',
        lastUpdated: '2024-03-05'
      }
    ]
  },
  'nerrsc': {
    name: 'NERRSC (NERR-Signal Company)',
    totalPersonnel: 32,
    activePersonnel: 27,
    readinessScore: 85,
    personnel: [
      {
        id: '9',
        name: 'David Martinez',
        rank: 'Technical Sergeant',
        status: 'Ready',
        email: 'david.martinez@army.mil.ph',
        phone: '09345678901',
        dateJoined: '2019-11-20',
        lastUpdated: '2024-02-10'
      }
    ]
  },
  'nerrfab': {
    name: 'NERRFAB (NERR-Field Artillery Battery)',
    totalPersonnel: 28,
    activePersonnel: 24,
    readinessScore: 82,
    personnel: [
      {
        id: '10',
        name: 'Thomas Anderson',
        rank: 'Master Sergeant',
        status: 'Ready',
        email: 'thomas.anderson@army.mil.ph',
        phone: '09456789012',
        dateJoined: '2018-08-05',
        lastUpdated: '2024-01-25'
      }
    ]
  }
};

interface CompanyPageProps {
  params: {
    company: string;
  }
}

export default function CompanyPersonnelPage({ params }: CompanyPageProps) {
  // Access params directly since Next.js still supports this for migration
  const { company } = params;
  const { user, isAuthenticated, isLoading, hasSpecificPermission, getToken } = useAuth();
  const router = useRouter();
  const [companyData, setCompanyData] = useState<typeof COMPANY_DATA[keyof typeof COMPANY_DATA] | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Check if user has permission to view personnel
  const canViewPersonnel = hasSpecificPermission('view_personnel');
  
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

    // Fetch company data
    fetchCompanyData();
  }, [isLoading, isAuthenticated, user, router, company]);

  const fetchCompanyData = async () => {
    setLoading(true);
    try {
      // Get token for authentication
      const token = await getToken();
      
      if (!token) {
        throw new Error('Authentication failed');
      }
      
      // First get the company details from the companies API
      const response = await fetch(`/api/companies/statistics`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch company data');
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        // Find the matching company based on url slug
        const normalizedCompany = company.replace(/-/g, ' ').toLowerCase();
        const companyData = data.data.find((c: any) => 
          c.name.toLowerCase().replace(/\(|\)/g, '').includes(normalizedCompany)
        );
        
        if (companyData) {
          // Now get personnel data for this company
          const personnelResponse = await fetch(`/api/personnel/company/${companyData.name}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (personnelResponse.ok) {
            const personnelData = await personnelResponse.json();
            
            if (personnelData.success && Array.isArray(personnelData.data)) {
              // Combine the company data with personnel data
              setCompanyData({
                ...companyData,
                personnel: personnelData.data
              });
            } else {
              // If we failed to get personnel data, still show company info
              setCompanyData({
                ...companyData,
                personnel: []
              });
            }
          } else {
            // If personnel API fails, use company data with empty personnel array
            setCompanyData({
              ...companyData,
              personnel: []
            });
          }
        } else {
          // In case no matching company is found
          toast.error('Company not found');
          router.push('/companies');
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
      toast.error('Failed to load company data');
      
      // Fallback to mock data if API call fails
      const normalizedCompany = company.toLowerCase();
      
      if (COMPANY_DATA[normalizedCompany]) {
        setCompanyData(COMPANY_DATA[normalizedCompany]);
      } else {
        toast.error('Company not found');
        router.push('/companies');
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter personnel based on search term and filters
  const filteredPersonnel = companyData?.personnel.filter(person => 
    (searchTerm === '' || 
      person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.email.toLowerCase().includes(searchTerm.toLowerCase())
    ) &&
    (statusFilter === 'All' || person.status === statusFilter)
  ) || [];

  const getReadinessColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 75) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!canViewPersonnel) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <div className="p-6 text-center">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-base font-semibold text-gray-900">Access Denied</h3>
            <p className="mt-1 text-sm text-gray-500">
              You do not have permission to view personnel.
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

  if (!companyData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <div className="p-6 text-center">
            <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-base font-semibold text-gray-900">Company Not Found</h3>
            <p className="mt-1 text-sm text-gray-500">
              The company you are looking for does not exist.
            </p>
            <div className="mt-6">
              <Button
                variant="primary"
                onClick={() => router.push('/companies')}
              >
                Back to Companies
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        <div className="flex">
          <Button
            variant="secondary"
            size="sm"
            className="flex items-center"
            onClick={() => router.push('/companies')}
          >
            <ChevronLeftIcon className="h-4 w-4 mr-1" />
            Back to Companies
          </Button>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center">
              <div className="bg-indigo-100 rounded-full p-3">
                <BuildingOfficeIcon className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="ml-4">
                <h2 className="text-lg font-medium text-gray-900">{companyData.name} Company</h2>
                <p className="text-sm text-gray-500">
                  Personnel Management
                </p>
              </div>
            </div>
            <div className="mt-4 md:mt-0 flex items-center space-x-4">
              <div>
                <span className="text-sm font-medium text-gray-500">Personnel</span>
                <div className="text-lg font-medium text-gray-900">{companyData.activePersonnel} / {companyData.totalPersonnel}</div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Readiness</span>
                <div className="flex items-center">
                  <span className="text-lg font-medium text-gray-900 mr-2">{companyData.readinessScore}%</span>
                  <div className="w-20 bg-gray-200 rounded-full h-2.5">
                    <div className={`h-2.5 rounded-full ${getReadinessColor(companyData.readinessScore)}`} style={{ width: `${companyData.readinessScore}%` }}></div>
                  </div>
                </div>
              </div>
              <Button
                variant="primary"
                onClick={() => router.push('/personnel/manage')}
              >
                Add Personnel
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="w-full md:w-2/3">
              <label htmlFor="search" className="block text-xs font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                id="search"
                placeholder="Search by name or email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div className="w-full md:w-1/3">
              <label htmlFor="statusFilter" className="block text-xs font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="All">All Statuses</option>
                <option value="Ready">Ready</option>
                <option value="Standby">Standby</option>
                <option value="Retired">Retired</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Joined
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPersonnel.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                      No personnel records found
                    </td>
                  </tr>
                ) : (
                  filteredPersonnel.map((person) => (
                    <tr key={person.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {person.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {person.rank}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          person.status === 'Ready' ? 'bg-green-100 text-green-800' :
                          person.status === 'Standby' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {person.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {person.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {person.phone || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {person.dateJoined}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button 
                          variant="secondary"
                          size="sm"
                          onClick={() => router.push(`/personnel/manage?id=${person.id}`)}
                          className="mr-2"
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="info"
                          size="sm"
                          onClick={() => router.push(`/personnel/view/${person.id}`)}
                          className="mr-2"
                        >
                          View
                        </Button>
                        <Button 
                          variant="primary"
                          size="sm"
                          onClick={() => router.push(`/personnel/status?id=${person.id}`)}
                        >
                          Update Status
                        </Button>
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
  );
} 