'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Card from './Card';
import Button from './Button';
import { UserRole } from '@/types/personnel';

interface ButtonVerificationItem {
  id: string;
  page: string;
  buttonText: string;
  requiredPermission?: string;
  requiredRole?: UserRole;
  location: string;
  functionality: string;
  verified: boolean;
}

export default function ButtonVerifier() {
  const { user } = useAuth();
  const [verificationItems, setVerificationItems] = useState<ButtonVerificationItem[]>([
    // Dashboard buttons
    {
      id: 'dashboard-view-profile',
      page: 'Dashboard',
      buttonText: 'View Profile',
      requiredPermission: 'view_own_profile',
      location: 'Dashboard sidebar',
      functionality: 'Navigate to profile page',
      verified: false
    },
    {
      id: 'dashboard-view-documents',
      page: 'Dashboard',
      buttonText: 'View Documents',
      requiredPermission: 'view_own_documents',
      location: 'Dashboard sidebar',
      functionality: 'Navigate to documents page',
      verified: false
    },
    {
      id: 'dashboard-view-trainings',
      page: 'Dashboard',
      buttonText: 'View Trainings',
      requiredPermission: 'view_trainings',
      location: 'Dashboard sidebar',
      functionality: 'Navigate to trainings page',
      verified: false
    },
    
    // Personnel page buttons
    {
      id: 'personnel-add',
      page: 'Personnel',
      buttonText: 'Add Personnel',
      requiredPermission: 'edit_company_personnel',
      location: 'Personnel page bottom',
      functionality: 'Open add personnel modal',
      verified: false
    },
    {
      id: 'personnel-edit',
      page: 'Personnel',
      buttonText: 'Edit',
      requiredPermission: 'edit_company_personnel',
      location: 'Personnel card',
      functionality: 'Open edit personnel modal',
      verified: false
    },
    {
      id: 'personnel-view',
      page: 'Personnel',
      buttonText: 'View',
      requiredPermission: 'view_company_personnel',
      location: 'Personnel card',
      functionality: 'Open view personnel modal',
      verified: false
    },
    {
      id: 'personnel-delete',
      page: 'Personnel',
      buttonText: 'Delete',
      requiredPermission: 'delete_personnel',
      location: 'Personnel card',
      functionality: 'Show delete confirmation dialog',
      verified: false
    },
    
    // Documents page buttons
    {
      id: 'documents-upload',
      page: 'Documents',
      buttonText: 'Upload Document',
      requiredPermission: 'upload_own_documents',
      location: 'Documents page top',
      functionality: 'Open upload document modal',
      verified: false
    },
    {
      id: 'documents-view',
      page: 'Documents',
      buttonText: 'View',
      requiredPermission: 'view_own_documents',
      location: 'Document list',
      functionality: 'View document details',
      verified: false
    },
    {
      id: 'documents-delete',
      page: 'Documents',
      buttonText: 'Delete',
      requiredPermission: 'upload_own_documents',
      location: 'Document list',
      functionality: 'Show delete confirmation dialog',
      verified: false
    },
    {
      id: 'documents-verify',
      page: 'Documents',
      buttonText: 'Verify',
      requiredPermission: 'verify_documents',
      location: 'Document details',
      functionality: 'Mark document as verified',
      verified: false
    },
    
    // Trainings page buttons
    {
      id: 'trainings-register',
      page: 'Trainings',
      buttonText: 'Register',
      requiredPermission: 'register_trainings',
      location: 'Training card',
      functionality: 'Register for training',
      verified: false
    },
    {
      id: 'trainings-cancel',
      page: 'Trainings',
      buttonText: 'Cancel Registration',
      requiredPermission: 'register_trainings',
      location: 'Training card',
      functionality: 'Show cancel confirmation dialog',
      verified: false
    },
    {
      id: 'trainings-view-details',
      page: 'Trainings',
      buttonText: 'View Details',
      requiredPermission: 'view_trainings',
      location: 'Training card',
      functionality: 'View training details',
      verified: false
    },
    
    // Profile page buttons
    {
      id: 'profile-edit',
      page: 'Profile',
      buttonText: 'Edit Profile',
      requiredPermission: 'edit_own_profile',
      location: 'Profile page',
      functionality: 'Enable profile editing',
      verified: false
    },
    {
      id: 'profile-save',
      page: 'Profile',
      buttonText: 'Save Changes',
      requiredPermission: 'edit_own_profile',
      location: 'Profile page (edit mode)',
      functionality: 'Save profile changes',
      verified: false
    },
    {
      id: 'profile-cancel',
      page: 'Profile',
      buttonText: 'Cancel',
      requiredPermission: 'edit_own_profile',
      location: 'Profile page (edit mode)',
      functionality: 'Cancel profile editing',
      verified: false
    },
    {
      id: 'profile-enable-2fa',
      page: 'Profile',
      buttonText: 'Enable 2FA',
      requiredPermission: 'edit_own_profile',
      location: 'Profile security section',
      functionality: 'Open 2FA setup modal',
      verified: false
    },
    {
      id: 'profile-delete-account',
      page: 'Profile',
      buttonText: 'Delete Account',
      requiredPermission: 'edit_own_profile',
      location: 'Profile danger zone',
      functionality: 'Show delete account confirmation',
      verified: false
    },
    
    // Reports page buttons
    {
      id: 'reports-export',
      page: 'Reports',
      buttonText: 'Export',
      requiredPermission: 'export_reports',
      location: 'Reports page',
      functionality: 'Export selected report',
      verified: false
    },
    
    // Navbar buttons
    {
      id: 'navbar-logout',
      page: 'Navbar',
      buttonText: 'Logout',
      requiredPermission: 'view_own_profile',
      location: 'Navbar top right',
      functionality: 'Show logout confirmation dialog',
      verified: false
    }
  ]);

  const markAsVerified = (id: string) => {
    setVerificationItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, verified: true } : item
      )
    );
  };

  const resetVerification = () => {
    setVerificationItems(prev => 
      prev.map(item => ({ ...item, verified: false }))
    );
  };

  const getPageItems = (page: string) => {
    return verificationItems.filter(item => item.page === page);
  };

  const getVerificationProgress = () => {
    const total = verificationItems.length;
    const verified = verificationItems.filter(item => item.verified).length;
    return {
      percentage: total > 0 ? Math.round((verified / total) * 100) : 0,
      verified,
      total
    };
  };

  const progress = getVerificationProgress();

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Button Verification Checklist</h2>
            <Button 
              size="sm" 
              variant="secondary" 
              onClick={resetVerification}
            >
              Reset Verification
            </Button>
          </div>
          
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Verification Progress</span>
              <span className="text-sm font-medium text-gray-700">{progress.verified}/{progress.total} ({progress.percentage}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full ${
                  progress.percentage >= 90 ? 'bg-green-600' :
                  progress.percentage >= 50 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${progress.percentage}%` }}
              ></div>
            </div>
          </div>
          
          {['Dashboard', 'Personnel', 'Documents', 'Trainings', 'Profile', 'Reports', 'Navbar'].map(page => (
            <div key={page} className="mb-6">
              <h3 className="text-md font-medium text-gray-800 mb-3 border-b pb-2">{page} Page Buttons</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Button</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Functionality</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getPageItems(page).map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{item.buttonText}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{item.location}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{item.functionality}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {item.verified ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          <Button
                            size="sm"
                            variant={item.verified ? "success" : "primary"}
                            onClick={() => markAsVerified(item.id)}
                            disabled={item.verified}
                          >
                            {item.verified ? "Verified" : "Mark as Verified"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
} 