'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { toast } from 'react-hot-toast';
import { 
  UserGroupIcon, 
  UserIcon,
  ChevronLeftIcon
} from '@heroicons/react/24/outline';
import ConfirmationDialog from '@/components/ConfirmationDialog';

// Personnel interface
interface Personnel {
  id: string;
  name: string;
  rank: string;
  company: string;
  status: string;
  email: string;
  phone?: string;
}

// Status options
const STATUS_OPTIONS = [
  { value: 'Ready', label: 'Ready', color: 'status-badge status-badge-ready' },
  { value: 'Standby', label: 'Standby', color: 'status-badge status-badge-standby' },
  { value: 'Retired', label: 'Retired', color: 'status-badge status-badge-retired' }
];

// Sample data
const MOCK_PERSONNEL_DATA: Record<string, Personnel> = {
  '1': {
    id: '1',
    name: 'John Smith',
    rank: 'Private First Class',
    company: 'Alpha',
    status: 'Ready',
    email: 'john.smith@army.mil.ph',
    phone: '09123456789'
  },
  '2': {
    id: '2',
    name: 'Sarah Johnson',
    rank: 'Corporal',
    company: 'Bravo',
    status: 'Standby',
    email: 'sarah.johnson@army.mil.ph',
    phone: '09234567890'
  },
  '3': {
    id: '3',
    name: 'Michael Davis',
    rank: 'Sergeant',
    company: 'Charlie',
    status: 'Ready',
    email: 'michael.davis@army.mil.ph'
  }
};

// Content component that uses useSearchParams
function StatusPageContent() {
  const { user, isAuthenticated, isLoading, hasSpecificPermission } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const personnelId = searchParams.get('id');
  
  const [personnel, setPersonnel] = useState<Personnel | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [statusReason, setStatusReason] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Check if user has permission to update personnel status
  const canUpdateStatus = hasSpecificPermission('update_personnel_status');
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!isLoading && user && !['staff', 'admin', 'director'].includes(user.role)) {
      router.push('/dashboard');
      toast.error('You do not have permission to access this page');
      return;
    }

    if (!personnelId) {
      toast.error('Personnel ID is required');
      router.push('/personnel');
      return;
    }

    // Fetch personnel data
    fetchPersonnelData(personnelId);
  }, [isLoading, isAuthenticated, user, router, personnelId]);

  const fetchPersonnelData = async (id: string) => {
    setLoading(true);
    try {
      // In a real implementation, this would be an API call
      // For now, use the mock data
      const data = MOCK_PERSONNEL_DATA[id];
      
      if (data) {
        setPersonnel(data);
        setSelectedStatus(data.status);
      } else {
        toast.error('Personnel not found');
        router.push('/personnel');
      }
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Error fetching personnel data:', error);
      toast.error('Failed to load personnel data');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmStatusChange = () => {
    setShowConfirmation(true);
  };

  const updatePersonnelStatus = async () => {
    setShowConfirmation(false);
    
    if (!personnel || !selectedStatus) {
      toast.error('Missing required information');
      return;
    }

    try {
      // In a real implementation, this would call the API
      const response = await fetch('/api/personnel/status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          personnelId: personnel.id,
          status: selectedStatus,
          reason: statusReason
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update status');
      }
      
      toast.success(`Status updated to ${selectedStatus}`);
      
      // Update local data to show the change
      if (personnel) {
        setPersonnel({
          ...personnel,
          status: selectedStatus
        });
      }
      
      // Navigate back after a short delay
      setTimeout(() => {
        router.push(`/personnel/company/${personnel.company.toLowerCase()}`);
      }, 1500);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update personnel status');
    }
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

  if (!canUpdateStatus) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <div className="p-6 text-center">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-base font-semibold text-gray-900">Access Denied</h3>
            <p className="mt-1 text-sm text-gray-500">
              You do not have permission to update personnel status.
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

  if (!personnel) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <div className="p-6 text-center">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-base font-semibold text-gray-900">Personnel Not Found</h3>
            <p className="mt-1 text-sm text-gray-500">
              The personnel record you are looking for does not exist.
            </p>
            <div className="mt-6">
              <Button
                variant="primary"
                onClick={() => router.push('/personnel')}
              >
                Back to Personnel
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
            onClick={() => router.push(`/personnel/company/${personnel.company.toLowerCase()}`)}
          >
            <ChevronLeftIcon className="h-4 w-4 mr-1" />
            Back to {personnel.company} Company
          </Button>
        </div>
        
        <Card>
          <div className="flex flex-col md:flex-row p-6">
            <div className="flex-1">
              <h1 className="text-xl font-semibold mb-4">Update Status</h1>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p className="mt-1 text-sm text-gray-900">{personnel.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Rank</p>
                  <p className="mt-1 text-sm text-gray-900">{personnel.rank}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Company</p>
                  <p className="mt-1 text-sm text-gray-900">{personnel.company}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Current Status</p>
                  <p className="mt-1 text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      STATUS_OPTIONS.find(s => s.value === personnel.status)?.color || 'bg-gray-100 text-gray-800'
                    }`}>
                      {personnel.status}
                    </span>
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 md:mt-0 flex-1 md:border-l md:pl-6">
              <h2 className="text-lg font-medium mb-4">Change Status</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    New Status
                  </label>
                  <select
                    id="status"
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Status Change (Optional)
                  </label>
                  <textarea
                    id="reason"
                    rows={3}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Provide details about why the status is being changed"
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                  ></textarea>
                </div>
                
                <div className="pt-4">
                  <Button 
                    variant="primary" 
                    className="w-full"
                    disabled={selectedStatus === personnel.status}
                    onClick={handleConfirmStatusChange}
                  >
                    Update Status
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Confirmation dialog */}
      <ConfirmationDialog
        isOpen={showConfirmation}
        title="Confirm Status Change"
        message={`Are you sure you want to change ${personnel.name}'s status from ${personnel.status} to ${selectedStatus}?`}
        confirmText="Yes, Update Status"
        cancelText="Cancel"
        onConfirm={updatePersonnelStatus}
        onClose={() => setShowConfirmation(false)}
      />
    </div>
  );
}

// Main component that wraps the content in a Suspense boundary
export default function UpdateStatusPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    }>
      <StatusPageContent />
    </Suspense>
  );
} 