'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ButtonVerifier from '@/components/ButtonVerifier';
import RoleSimulatorComponent from '@/components/RoleSimulatorComponent';
import PermissionReport from '@/components/PermissionReport';
import Card from '@/components/Card';

export default function ButtonVerificationPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [showRoleSimulator, setShowRoleSimulator] = useState(false);
  const [showPermissionReport, setShowPermissionReport] = useState(false);
  const [activeTab, setActiveTab] = useState<'buttons' | 'permissions'>('buttons');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Button Verification System</h1>
        <p className="text-gray-600">
          Use this page to verify that all buttons in the application are functioning correctly for each user role.
          Mark buttons as verified after testing them to track your progress.
        </p>
      </div>

      <div className="mb-6">
        <Card>
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Role Simulation</h2>
              <button
                className="text-sm text-blue-600 hover:text-blue-800"
                onClick={() => setShowRoleSimulator(!showRoleSimulator)}
              >
                {showRoleSimulator ? 'Hide Role Simulator' : 'Show Role Simulator'}
              </button>
            </div>
            
            {showRoleSimulator && (
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-600 mb-4">
                  Use this tool to simulate different user roles without logging out. This allows you to test button permissions for all roles.
                </p>
                <RoleSimulatorComponent />
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('buttons')}
              className={`${
                activeTab === 'buttons'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Button Verification
            </button>
            <button
              onClick={() => setActiveTab('permissions')}
              className={`${
                activeTab === 'permissions'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Permission Report
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'buttons' ? (
        <ButtonVerifier />
      ) : (
        <PermissionReport />
      )}
    </div>
  );
} 