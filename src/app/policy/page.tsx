"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { UserRole } from '@/types/auth';
import { 
  DocumentTextIcon, 
  DocumentPlusIcon, 
  ArchiveBoxIcon,
  ShieldCheckIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  PencilIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

export default function PolicyControlPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!isLoading && isAuthenticated && user && user.role !== 'administrator') {
      router.push('/dashboard');
      toast.error('You do not have permission to access this page');
      return;
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900">Policy Control</h1>
        <p className="text-sm text-gray-500">Manage and control organizational policies and procedures</p>
      </div>

      {/* First row of cards - policy management options in a single row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Manage Policies Card */}
        <Card>
          <div className="p-4">
            <div className="flex items-center mb-2">
              <div className="bg-indigo-100 rounded-full p-2 mr-3">
                <DocumentTextIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <h2 className="text-base font-medium text-gray-900">Manage Policies</h2>
            </div>
            <p className="text-xs text-gray-500 mb-3 line-clamp-2">
              Review, approve, and manage existing policies in the system, including archived policies.
            </p>
            <Button 
              variant="primary" 
              size="sm"
              className="w-full"
              onClick={() => router.push('/policies')}
            >
              View All Policies
            </Button>
          </div>
        </Card>
        
        {/* Policy Compliance Card */}
        <Card>
          <div className="p-4">
            <div className="flex items-center mb-2">
              <div className="bg-red-100 rounded-full p-2 mr-3">
                <ShieldCheckIcon className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="text-base font-medium text-gray-900">Compliance</h2>
            </div>
            <p className="text-xs text-gray-500 mb-3 line-clamp-2">
              Monitor and enforce policy compliance across the organization.
            </p>
            <Button 
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={() => router.push('/policy/compliance')}
            >
              View Compliance
            </Button>
          </div>
        </Card>
      </div>

      {/* Second row - secondary policy management options in a single row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Policy Analytics Card */}
        <Card>
          <div className="p-4">
            <div className="flex items-center mb-2">
              <div className="bg-blue-100 rounded-full p-2 mr-3">
                <ChartBarIcon className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="text-base font-medium text-gray-900">Policy Analytics</h2>
            </div>
            <p className="text-xs text-gray-500 mb-3 line-clamp-2">
              View analytics and reports related to policy usage and compliance.
            </p>
            <Button 
              variant="secondary" 
              size="sm"
              className="w-full"
              onClick={() => router.push('/policy/analytics')}
            >
              View Analytics
            </Button>
          </div>
        </Card>

        {/* Policy Settings Card */}
        <Card>
          <div className="p-4">
            <div className="flex items-center mb-2">
              <div className="bg-yellow-100 rounded-full p-2 mr-3">
                <Cog6ToothIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <h2 className="text-base font-medium text-gray-900">Policy Settings</h2>
            </div>
            <p className="text-xs text-gray-500 mb-3 line-clamp-2">
              Configure policy settings, categories, and approval workflows.
            </p>
            <Button 
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={() => router.push('/policy/settings')}
            >
              Manage Settings
            </Button>
          </div>
        </Card>
      </div>
      
      {/* Recent Activities - Horizontal layout */}
      <div>
        <h2 className="text-base font-medium text-gray-900 mb-2">Recent Activities</h2>
        <Card>
          <div className="p-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center p-2 border border-gray-100 rounded-md">
                <PencilIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Emergency Response Protocol updated</p>
                  <p className="text-xs text-gray-500">Yesterday at 2:30 PM</p>
                </div>
              </div>
              <div className="flex items-center p-2 border border-gray-100 rounded-md">
                <DocumentPlusIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">New Data Security Policy created</p>
                  <p className="text-xs text-gray-500">April 14, 2023 at 10:15 AM</p>
                </div>
              </div>
              <div className="flex items-center p-2 border border-gray-100 rounded-md">
                <UserGroupIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Personnel Leave Policy shared</p>
                  <p className="text-xs text-gray-500">April 10, 2023 at 3:45 PM</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
} 