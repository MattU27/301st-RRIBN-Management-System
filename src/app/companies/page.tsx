'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { toast } from 'react-hot-toast';
import { 
  UsersIcon, 
  BuildingOfficeIcon, 
  PencilIcon,
  UserPlusIcon,
  ArrowPathIcon,
  ChartBarIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import ConfirmationDialog from '@/components/ConfirmationDialog';
import Link from 'next/link';
import CompanyCard from './CompanyCard';
import { CheckCircleIcon as SolidCheckCircleIcon } from '@heroicons/react/24/solid';

// Interface for company data
interface CompanyData {
  name: string;
  totalPersonnel: number;
  activePersonnel: number;
  readinessScore: number;
  documentsComplete: number;
  trainingsComplete: number;
}

export default function CompaniesPage() {
  const { user, isAuthenticated, isLoading, getToken, hasSpecificPermission } = useAuth();
  const router = useRouter();
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Check if user has permission to manage companies
  const canManageCompanies = hasSpecificPermission('manage_company_personnel');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!isLoading && user && !['staff', 'administrator', 'director'].includes(user.role)) {
      router.push('/dashboard');
      toast.error('You do not have permission to access this page');
      return;
    }

    // Fetch companies data
    fetchCompaniesData();

    // Set up automatic refresh every 5 minutes
    const intervalId = setInterval(() => {
      fetchCompaniesData();
    }, 5 * 60 * 1000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [isLoading, isAuthenticated, user, router]);

  const fetchCompaniesData = async () => {
    setLoading(true);
    try {
      // Get token for authentication
      const token = await getToken();
      
      if (!token) {
        throw new Error('Authentication failed');
      }
      
      // Fetch company statistics from API
      const response = await fetch('/api/companies/statistics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch company data');
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        setCompanies(data.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching companies data:', error);
      toast.error('Failed to load companies data');
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="max-w-[1400px] mx-auto px-5 py-3">
      <div className="mb-4">
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex items-center">
            <div className="bg-indigo-100 rounded-full p-2.5">
              <BuildingOfficeIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-3">
              <h2 className="text-lg font-medium text-gray-900">Company Management</h2>
              <p className="text-sm text-gray-500">
                Manage and view company data
              </p>
            </div>
          </div>
        </div>
      </div>

      {companies.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <BuildingOfficeIcon className="h-14 w-14 text-gray-400 mx-auto mb-5" />
          <h3 className="text-xl font-medium text-gray-900">No Companies Found</h3>
          <p className="text-sm text-gray-500 mt-2">
            There are no companies in the database yet. Data will synchronize automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((company) => (
            <CompanyCard 
              key={company.name} 
              company={company} 
              onViewPersonnel={(companyName) => 
                router.push(`/personnel/company/${companyName.toLowerCase().replace(/[()]/g, "").replace(/ /g, "-")}`)
              }
              onViewReport={(companyName) => 
                router.push(`/reports/company/${companyName.toLowerCase().replace(/[()]/g, "").replace(/ /g, "-")}`)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
} 