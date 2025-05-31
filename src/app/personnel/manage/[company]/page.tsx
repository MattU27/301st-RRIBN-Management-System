'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { toast } from 'react-hot-toast';
import { 
  UserGroupIcon, 
  BuildingOfficeIcon, 
  ArrowLeftIcon,
  UserPlusIcon,
  UserMinusIcon,
  ChevronUpDownIcon
} from '@heroicons/react/24/outline';
import SyncStatusButton from '@/components/SyncStatusButton';

// Personnel interface
interface Personnel {
  id: string;
  name: string;
  rank?: string;
  serviceNumber?: string;
  email?: string;
  status: string;
  company?: string;
}

export default function ManageCompanyPersonnel() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, getToken } = useAuth();
  const [companyData, setCompanyData] = useState<any>(null);
  const [companyPersonnel, setCompanyPersonnel] = useState<Personnel[]>([]);
  const [availablePersonnel, setAvailablePersonnel] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPersonnel, setSelectedPersonnel] = useState<string[]>([]);
  const [selectedAvailable, setSelectedAvailable] = useState<string[]>([]);
  const [searchCompany, setSearchCompany] = useState('');
  const [searchAvailable, setSearchAvailable] = useState('');
  
  // Get company slug from params
  const companySlug = params?.company as string;
  
  // Format company name from slug
  const formatCompanyName = (slug: string) => {
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Company name for display
  const companyName = formatCompanyName(companySlug || '');
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    
    if (!companySlug) {
      router.push('/companies');
      return;
    }
    
    // Fetch company data and personnel
    fetchCompanyData();
  }, [isLoading, isAuthenticated, companySlug]);
  
  const fetchCompanyData = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      
      if (!token) {
        throw new Error('Authentication failed');
      }
      
      // Fetch company data
      const companyResponse = await fetch(`/api/companies/statistics?name=${companySlug}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!companyResponse.ok) {
        throw new Error('Failed to fetch company data');
      }
      
      const companyResult = await companyResponse.json();
      if (companyResult.success && companyResult.data?.length > 0) {
        setCompanyData(companyResult.data[0]);
      } else {
        throw new Error('Company not found');
      }
      
      // Fetch company personnel
      const personnelResponse = await fetch(`/api/personnel/company/${companySlug}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!personnelResponse.ok) {
        throw new Error('Failed to fetch company personnel');
      }
      
      const personnelResult = await personnelResponse.json();
      if (personnelResult.success) {
        setCompanyPersonnel(personnelResult.data || []);
      }
      
      // Fetch available personnel (not assigned to this company)
      const availableResponse = await fetch(`/api/personnel/available?exclude=${companySlug}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!availableResponse.ok) {
        throw new Error('Failed to fetch available personnel');
      }
      
      const availableResult = await availableResponse.json();
      if (availableResult.success) {
        setAvailablePersonnel(availableResult.data || []);
      }
    } catch (error: any) {
      console.error('Error fetching company data:', error);
      toast.error(error.message || 'Failed to load company data');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter personnel by search term
  const filteredCompanyPersonnel = companyPersonnel.filter(person => 
    person.name?.toLowerCase().includes(searchCompany.toLowerCase()) ||
    person.rank?.toLowerCase().includes(searchCompany.toLowerCase()) ||
    person.serviceNumber?.toLowerCase().includes(searchCompany.toLowerCase())
  );
  
  const filteredAvailablePersonnel = availablePersonnel.filter(person => 
    person.name?.toLowerCase().includes(searchAvailable.toLowerCase()) ||
    person.rank?.toLowerCase().includes(searchAvailable.toLowerCase()) ||
    person.serviceNumber?.toLowerCase().includes(searchAvailable.toLowerCase())
  );
  
  // Handle adding personnel to company
  const handleAddToCompany = async () => {
    if (selectedAvailable.length === 0) {
      toast.error('No personnel selected to add');
      return;
    }
    
    try {
      const token = await getToken();
      
      if (!token) {
        throw new Error('Authentication failed');
      }
      
      const response = await fetch('/api/personnel/assign-company', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personnelIds: selectedAvailable,
          companySlug
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign personnel to company');
      }
      
      const result = await response.json();
      toast.success(`${result.count} personnel assigned to ${companyName}`);
      
      // Reset selection and refresh data
      setSelectedAvailable([]);
      fetchCompanyData();
    } catch (error: any) {
      console.error('Error assigning personnel:', error);
      toast.error(error.message || 'Failed to assign personnel to company');
    }
  };
  
  // Handle removing personnel from company
  const handleRemoveFromCompany = async () => {
    if (selectedPersonnel.length === 0) {
      toast.error('No personnel selected to remove');
      return;
    }
    
    try {
      const token = await getToken();
      
      if (!token) {
        throw new Error('Authentication failed');
      }
      
      const response = await fetch('/api/personnel/unassign-company', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personnelIds: selectedPersonnel
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove personnel from company');
      }
      
      const result = await response.json();
      toast.success(`${result.count} personnel removed from ${companyName}`);
      
      // Reset selection and refresh data
      setSelectedPersonnel([]);
      fetchCompanyData();
    } catch (error: any) {
      console.error('Error removing personnel:', error);
      toast.error(error.message || 'Failed to remove personnel from company');
    }
  };
  
  // Toggle selection of company personnel
  const toggleSelectPersonnel = (id: string) => {
    setSelectedPersonnel(prev => 
      prev.includes(id) 
        ? prev.filter(p => p !== id) 
        : [...prev, id]
    );
  };
  
  // Toggle selection of available personnel
  const toggleSelectAvailable = (id: string) => {
    setSelectedAvailable(prev => 
      prev.includes(id) 
        ? prev.filter(p => p !== id) 
        : [...prev, id]
    );
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-[1400px] mx-auto px-5 py-5">
      <div className="space-y-4">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button 
                variant="secondary"
                size="sm"
                onClick={() => router.push('/companies')}
                className="mr-2"
              >
                <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
              </Button>
              <div className="bg-indigo-100 rounded-full p-2">
                <BuildingOfficeIcon className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="ml-3">
                <h2 className="text-base font-medium text-gray-900">Manage {companyName} Personnel</h2>
                <p className="text-xs text-gray-500">
                  Assign or remove personnel from this company
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <SyncStatusButton 
                onSyncComplete={() => fetchCompanyData()} 
                className="text-xs border border-blue-500 text-blue-600 px-3 py-1.5 rounded-md"
              />
            </div>
          </div>
        </div>
        
        {/* Main content - two columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Company Personnel */}
          <Card>
            <div className="p-4 flex flex-col h-full">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-gray-900">
                  {companyName} Personnel ({filteredCompanyPersonnel.length})
                </h3>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleRemoveFromCompany}
                  disabled={selectedPersonnel.length === 0}
                  className="py-1 px-2 text-xs whitespace-nowrap text-red-600 border border-red-300 hover:bg-red-50"
                >
                  <UserMinusIcon className="h-3.5 w-3.5 mr-1" />
                  Remove Selected
                </Button>
              </div>
              
              {/* Search input */}
              <div className="mb-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search personnel..."
                    value={searchCompany}
                    onChange={(e) => setSearchCompany(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
              
              {/* Personnel list */}
              <div className="overflow-auto flex-grow border border-gray-200 rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                        <input 
                          type="checkbox" 
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPersonnel(filteredCompanyPersonnel.map(p => p.id));
                            } else {
                              setSelectedPersonnel([]);
                            }
                          }}
                          checked={selectedPersonnel.length > 0 && selectedPersonnel.length === filteredCompanyPersonnel.length}
                          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                      </th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rank
                      </th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCompanyPersonnel.length > 0 ? (
                      filteredCompanyPersonnel.map((person) => (
                        <tr key={person.id} className={selectedPersonnel.includes(person.id) ? 'bg-indigo-50' : ''}>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <input 
                              type="checkbox" 
                              checked={selectedPersonnel.includes(person.id)}
                              onChange={() => toggleSelectPersonnel(person.id)}
                              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                            {person.name}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                            {person.rank || '-'}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                              ${person.status === 'Ready' || person.status === 'ready' ? 'bg-green-100 text-green-800' : 
                                person.status === 'Standby' || person.status === 'standby' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-gray-100 text-gray-800'}`}>
                              {person.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-3 py-4 text-center text-sm text-gray-500">
                          No personnel assigned to this company
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
          
          {/* Available Personnel */}
          <Card>
            <div className="p-4 flex flex-col h-full">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-gray-900">
                  Available Personnel ({filteredAvailablePersonnel.length})
                </h3>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleAddToCompany}
                  disabled={selectedAvailable.length === 0}
                  className="py-1 px-2 text-xs whitespace-nowrap text-green-600 border border-green-300 hover:bg-green-50"
                >
                  <UserPlusIcon className="h-3.5 w-3.5 mr-1" />
                  Add Selected
                </Button>
              </div>
              
              {/* Search input */}
              <div className="mb-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search available personnel..."
                    value={searchAvailable}
                    onChange={(e) => setSearchAvailable(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
              
              {/* Available personnel list */}
              <div className="overflow-auto flex-grow border border-gray-200 rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                        <input 
                          type="checkbox" 
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAvailable(filteredAvailablePersonnel.map(p => p.id));
                            } else {
                              setSelectedAvailable([]);
                            }
                          }}
                          checked={selectedAvailable.length > 0 && selectedAvailable.length === filteredAvailablePersonnel.length}
                          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                      </th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rank
                      </th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAvailablePersonnel.length > 0 ? (
                      filteredAvailablePersonnel.map((person) => (
                        <tr key={person.id} className={selectedAvailable.includes(person.id) ? 'bg-indigo-50' : ''}>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <input 
                              type="checkbox" 
                              checked={selectedAvailable.includes(person.id)}
                              onChange={() => toggleSelectAvailable(person.id)}
                              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                            {person.name}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                            {person.rank || '-'}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                              ${person.status === 'Ready' || person.status === 'ready' ? 'bg-green-100 text-green-800' : 
                                person.status === 'Standby' || person.status === 'standby' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-gray-100 text-gray-800'}`}>
                              {person.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-3 py-4 text-center text-sm text-gray-500">
                          No available personnel found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
} 