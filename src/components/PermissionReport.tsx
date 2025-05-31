'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Card from './Card';
import { UserRole } from '@/types/personnel';
import Button from './Button';

// Define permissions by role (copied from AuthContext for reference)
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  'RESERVIST': [
    'view_own_profile',
    'edit_own_profile',
    'view_own_documents',
    'upload_own_documents',
    'view_trainings',
    'register_trainings',
    'view_announcements'
  ],
  'STAFF': [
    'view_own_profile',
    'edit_own_profile',
    'view_own_documents',
    'upload_own_documents',
    'view_trainings',
    'register_trainings',
    'view_announcements',
    'view_company_personnel',
    'edit_company_personnel',
    'verify_documents',
    'manage_trainings',
    'post_announcements'
  ],
  'ADMIN': [
    'view_own_profile',
    'edit_own_profile',
    'view_own_documents',
    'upload_own_documents',
    'view_trainings',
    'register_trainings',
    'view_announcements',
    'view_all_personnel',
    'edit_all_personnel',
    'delete_personnel',
    'verify_documents',
    'manage_trainings',
    'post_announcements',
    'manage_staff_accounts',
    'view_system_logs'
  ],
  'DIRECTOR': [
    'view_own_profile',
    'edit_own_profile',
    'view_own_documents',
    'upload_own_documents',
    'view_trainings',
    'register_trainings',
    'view_announcements',
    'view_all_personnel',
    'edit_all_personnel',
    'delete_personnel',
    'verify_documents',
    'manage_trainings',
    'post_announcements',
    'manage_staff_accounts',
    'manage_admin_accounts',
    'view_system_logs',
    'view_analytics',
    'export_reports',
    'system_configuration'
  ]
};

// Permission descriptions for better readability
const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  'view_own_profile': 'View your own profile information',
  'edit_own_profile': 'Edit your own profile information',
  'view_own_documents': 'View your own documents',
  'upload_own_documents': 'Upload documents to your profile',
  'view_trainings': 'View available trainings',
  'register_trainings': 'Register for trainings',
  'view_announcements': 'View system announcements',
  'view_company_personnel': 'View personnel in your company',
  'edit_company_personnel': 'Edit personnel in your company',
  'verify_documents': 'Verify documents uploaded by personnel',
  'manage_trainings': 'Create and manage training sessions',
  'post_announcements': 'Post announcements to the system',
  'view_all_personnel': 'View all personnel across companies',
  'edit_all_personnel': 'Edit all personnel across companies',
  'delete_personnel': 'Delete personnel records',
  'manage_staff_accounts': 'Manage staff user accounts',
  'view_system_logs': 'View system activity logs',
  'manage_admin_accounts': 'Manage administrator accounts',
  'view_analytics': 'View system analytics and reports',
  'export_reports': 'Export system reports',
  'system_configuration': 'Configure system settings'
};

// Group permissions by category
const PERMISSION_CATEGORIES: Record<string, string[]> = {
  'Profile': [
    'view_own_profile',
    'edit_own_profile'
  ],
  'Documents': [
    'view_own_documents',
    'upload_own_documents',
    'verify_documents'
  ],
  'Trainings': [
    'view_trainings',
    'register_trainings',
    'manage_trainings'
  ],
  'Personnel': [
    'view_company_personnel',
    'edit_company_personnel',
    'view_all_personnel',
    'edit_all_personnel',
    'delete_personnel'
  ],
  'System': [
    'view_announcements',
    'post_announcements',
    'manage_staff_accounts',
    'manage_admin_accounts',
    'view_system_logs',
    'view_analytics',
    'export_reports',
    'system_configuration'
  ]
};

export default function PermissionReport() {
  const { user, hasSpecificPermission, simulateRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showRoleMatrix, setShowRoleMatrix] = useState(false);
  const [activeRole, setActiveRole] = useState<UserRole | null>(user?.role || null);
  
  // Reset active role when user changes
  useEffect(() => {
    if (user) {
      setActiveRole(user.role);
    }
  }, [user]);
  
  if (!user) return null;

  // Get all unique permissions across all roles
  const allPermissions = Object.values(ROLE_PERMISSIONS).flat();
  const uniquePermissions = [...new Set(allPermissions)].sort();
  
  // Filter permissions based on search and category
  const filteredPermissions = uniquePermissions.filter(permission => {
    const matchesSearch = permission.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (PERMISSION_DESCRIPTIONS[permission] || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedCategory === 'All') {
      return matchesSearch;
    }
    
    return matchesSearch && PERMISSION_CATEGORIES[selectedCategory]?.includes(permission);
  });

  // Get all categories
  const categories = ['All', ...Object.keys(PERMISSION_CATEGORIES)];
  
  // Check if a role has a specific permission
  const roleHasPermission = (role: UserRole, permission: string): boolean => {
    return ROLE_PERMISSIONS[role].includes(permission);
  };
  
  // Handle role change
  const handleRoleChange = (role: UserRole) => {
    setActiveRole(role);
    simulateRole(role);
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Permission Report</h2>
            <Button 
              size="sm" 
              variant="secondary" 
              onClick={() => setShowRoleMatrix(!showRoleMatrix)}
            >
              {showRoleMatrix ? 'Hide Role Matrix' : 'Show Role Matrix'}
            </Button>
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-4">
              Current user role: <span className="font-semibold">{user?.role || 'Not logged in'}</span>
              {activeRole !== user?.role && activeRole && (
                <span className="ml-2 text-indigo-600">
                  (Simulating: {activeRole})
                </span>
              )}
            </p>
            
            <h3 className="text-md font-medium text-gray-700 mb-2">Test as Role:</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              <Button 
                size="sm" 
                variant={activeRole === 'RESERVIST' ? 'primary' : 'secondary'}
                onClick={() => handleRoleChange('RESERVIST')}
              >
                Reservist
              </Button>
              <Button 
                size="sm" 
                variant={activeRole === 'STAFF' ? 'primary' : 'secondary'}
                onClick={() => handleRoleChange('STAFF')}
              >
                Staff
              </Button>
              <Button 
                size="sm" 
                variant={activeRole === 'ADMIN' ? 'primary' : 'secondary'}
                onClick={() => handleRoleChange('ADMIN')}
              >
                Admin
              </Button>
              <Button 
                size="sm" 
                variant={activeRole === 'DIRECTOR' ? 'primary' : 'secondary'}
                onClick={() => handleRoleChange('DIRECTOR')}
              >
                Director
              </Button>
            </div>
          </div>
          
          <div className="mb-4 flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search permissions..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
          
          {showRoleMatrix && (
            <div className="mb-6 overflow-x-auto">
              <h3 className="text-md font-medium text-gray-800 mb-3">Permission Role Matrix</h3>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permission</th>
                    <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Reservist</th>
                    <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                    <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                    <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Director</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPermissions.map((permission) => (
                    <tr key={permission}>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{permission}</td>
                      <td className="px-3 py-2 text-center">
                        {roleHasPermission('RESERVIST', permission) ? (
                          <span className="text-green-600">✓</span>
                        ) : (
                          <span className="text-red-600">✗</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {roleHasPermission('STAFF', permission) ? (
                          <span className="text-green-600">✓</span>
                        ) : (
                          <span className="text-red-600">✗</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {roleHasPermission('ADMIN', permission) ? (
                          <span className="text-green-600">✓</span>
                        ) : (
                          <span className="text-red-600">✗</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {roleHasPermission('DIRECTOR', permission) ? (
                          <span className="text-green-600">✓</span>
                        ) : (
                          <span className="text-red-600">✗</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          <div className="overflow-x-auto">
            <h3 className="text-md font-medium text-gray-800 mb-3">Current Permissions</h3>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permission</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPermissions.map((permission) => {
                  const hasPermission = hasSpecificPermission(permission);
                  return (
                    <tr key={permission} className={!hasPermission && searchTerm === '' ? 'bg-gray-50' : ''}>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{permission}</td>
                      <td className="px-3 py-2 text-sm text-gray-500">{PERMISSION_DESCRIPTIONS[permission] || permission}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                        {hasPermission ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Granted
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Denied
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
} 