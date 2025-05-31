'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { toast } from 'react-hot-toast';
import { 
  ServerStackIcon as DatabaseIcon,
  ArrowPathIcon,
  ServerIcon,
  DocumentPlusIcon,
} from '@heroicons/react/24/outline';

export default function DatabaseManagementPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, getToken } = useAuth();
  const [testing, setTesting] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [dbInfo, setDbInfo] = useState<any>(null);
  
  // Test database connection
  const testConnection = async () => {
    setTesting(true);
    try {
      const response = await fetch('/api/test-connection');
      
      if (!response.ok) {
        throw new Error('Failed to test database connection');
      }
      
      const result = await response.json();
      setDbInfo(result);
      
      if (result.success && result.database.connected) {
        toast.success('Successfully connected to database');
      } else {
        toast.error('Database connection failed');
      }
    } catch (error: any) {
      console.error('Error testing database connection:', error);
      toast.error(error.message || 'Failed to test database connection');
    } finally {
      setTesting(false);
    }
  };
  
  // Seed database with initial data
  const seedDatabase = async () => {
    setSeeding(true);
    try {
      // Get authentication token
      const token = await getToken();
      
      if (!token) {
        throw new Error('Authentication failed');
      }
      
      const response = await fetch('/api/seed', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to seed database');
      }
      
      const result = await response.json();
      toast.success(result.message || 'Database seeded successfully');
      
      // Refresh db info
      testConnection();
    } catch (error: any) {
      console.error('Error seeding database:', error);
      toast.error(error.message || 'Failed to seed database');
    } finally {
      setSeeding(false);
    }
  };
  
  // Check if user is allowed to view this page
  if (!isLoading && !isAuthenticated) {
    router.push('/login');
    return null;
  }
  
  if (!isLoading && user && !['admin', 'administrator', 'director'].includes(user.role)) {
    router.push('/dashboard');
    toast.error('You do not have permission to access the database management page');
    return null;
  }
  
  return (
    <div className="max-w-[1400px] mx-auto px-5 py-5">
      <div className="space-y-4">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex items-center">
            <div className="bg-indigo-100 rounded-full p-2">
              <DatabaseIcon className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="ml-3">
              <h2 className="text-base font-medium text-gray-900">Database Management</h2>
              <p className="text-xs text-gray-500">
                Test connection and seed the database with initial data
              </p>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Connection Testing */}
          <Card>
            <div className="p-4">
              <div className="flex items-center mb-4">
                <ServerIcon className="h-5 w-5 text-indigo-600 mr-2" />
                <h3 className="text-base font-semibold text-gray-900">
                  Database Connection
                </h3>
              </div>
              
              <div className="mb-4">
                <Button
                  variant="primary"
                  onClick={testConnection}
                  disabled={testing}
                  className="w-full"
                >
                  {testing ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                      Testing Connection...
                    </>
                  ) : (
                    'Test Database Connection'
                  )}
                </Button>
              </div>
              
              {dbInfo && (
                <div className="bg-gray-50 p-3 rounded border border-gray-200 overflow-auto max-h-80">
                  <h4 className="text-sm font-medium mb-2">Connection Info:</h4>
                  <div className="text-xs text-gray-600 font-mono whitespace-pre-wrap">
                    {JSON.stringify(dbInfo, null, 2)}
                  </div>
                </div>
              )}
            </div>
          </Card>
          
          {/* Database Seeding */}
          <Card>
            <div className="p-4">
              <div className="flex items-center mb-4">
                <DocumentPlusIcon className="h-5 w-5 text-indigo-600 mr-2" />
                <h3 className="text-base font-semibold text-gray-900">
                  Database Seeding
                </h3>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-4">
                  This will initialize the database with sample companies and personnel data.
                  Only use this if the database is empty or you want to reset it.
                </p>
                <Button
                  variant="primary"
                  onClick={seedDatabase}
                  disabled={seeding}
                  className="w-full"
                >
                  {seeding ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                      Seeding Database...
                    </>
                  ) : (
                    'Seed Database'
                  )}
                </Button>
              </div>
              
              <div className="text-xs text-gray-500 mt-4">
                <p className="mb-2">This will create:</p>
                <ul className="list-disc pl-5">
                  <li>6 standard companies (Alpha, Bravo, Charlie, etc.)</li>
                  <li>50 personnel records randomly distributed among companies</li>
                  <li>Initial statistics for each company</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
} 