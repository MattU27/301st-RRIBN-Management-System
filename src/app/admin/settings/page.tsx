'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/ui/Card';
import { auditService } from '@/utils/auditService';
import { 
  Cog6ToothIcon, 
  UserGroupIcon, 
  DocumentTextIcon, 
  AcademicCapIcon,
  ServerIcon,
  BellAlertIcon,
  ShieldCheckIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

// Define system configuration interface
interface SystemConfig {
  // General settings
  systemName: string;
  logoUrl: string;
  maintenanceMode: boolean;
  
  // Security settings
  passwordMinLength: number;
  passwordRequiresUppercase: boolean;
  passwordRequiresNumber: boolean;
  passwordRequiresSpecial: boolean;
  sessionTimeoutMinutes: number;
  
  // Notification settings
  emailNotificationsEnabled: boolean;
  documentVerificationReminders: boolean;
  trainingUpcomingReminders: boolean;
  systemAlertsEnabled: boolean;
  
  // Document settings
  allowedDocumentTypes: string[];
  maxDocumentSizeMB: number;
  documentRetentionDays: number;
  
  // Training settings
  autoCloseCompletedTrainings: boolean;
  trainingReminderDays: number;
}

export default function SystemConfigurationPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, hasSpecificPermission } = useAuth();
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Default configuration values
  const [config, setConfig] = useState<SystemConfig>({
    systemName: 'AFP Personnel Management System',
    logoUrl: '/afp_logo.png',
    maintenanceMode: false,
    
    passwordMinLength: 8,
    passwordRequiresUppercase: true,
    passwordRequiresNumber: true,
    passwordRequiresSpecial: true,
    sessionTimeoutMinutes: 30,
    
    emailNotificationsEnabled: true,
    documentVerificationReminders: true,
    trainingUpcomingReminders: true,
    systemAlertsEnabled: true,
    
    allowedDocumentTypes: ['pdf', 'jpg', 'jpeg', 'png', 'docx'],
    maxDocumentSizeMB: 10,
    documentRetentionDays: 365,
    
    autoCloseCompletedTrainings: true,
    trainingReminderDays: 7
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user && !hasSpecificPermission('access_system_settings')) {
      router.push('/dashboard');
      return;
    }
    
    // In a real application, we would fetch the current configuration from the backend
    const loadSystemConfig = async () => {
      try {
        // This would be a real API call in production
        // const response = await fetch('/api/admin/system-config');
        // const data = await response.json();
        // setConfig(data);
        
        // For demo purposes, we'll use localStorage to persist settings
        const savedConfig = localStorage.getItem('systemConfig');
        if (savedConfig) {
          setConfig(JSON.parse(savedConfig));
        }
      } catch (error) {
        console.error('Failed to load system configuration:', error);
      }
    };
    
    loadSystemConfig();
  }, [isLoading, isAuthenticated, router, user, hasSpecificPermission]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setConfig(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setConfig(prev => ({ ...prev, [name]: Number(value) }));
    } else {
      setConfig(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleArrayInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const arrayValues = value.split(',').map(item => item.trim());
    setConfig(prev => ({ ...prev, [name]: arrayValues }));
  };

  const handleSaveSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!user || !token) {
        toast.error('Authentication required');
        return;
      }

      // Save to API
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      // Log changes
      if (user && user._id) {
        const changesSummary = Object.entries(config)
          .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
          .join(', ');
        
        await auditService.logSystemConfigAction(
          user._id,
          `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          user.role || 'admin',
          `Updated system settings: ${changesSummary}`
        );
      }

      // Reload settings to ensure UI is in sync with server
      const loadSystemConfig = async () => {
        try {
          // This would be a real API call in production
          // const response = await fetch('/api/admin/system-config');
          // const data = await response.json();
          // setConfig(data);
          
          // For demo purposes, we'll use localStorage to persist settings
          const savedConfig = localStorage.getItem('systemConfig');
          if (savedConfig) {
            setConfig(JSON.parse(savedConfig));
          }
        } catch (error) {
          console.error('Failed to load system configuration:', error);
        }
      };

      await loadSystemConfig();
      
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Cog6ToothIcon className="h-8 w-8 text-indigo-600 mr-2" />
        <h1 className="text-2xl font-bold text-gray-900">System Configuration</h1>
      </div>
      
      {showSuccess && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          System configuration saved successfully!
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-6">
        {/* General Settings */}
        <Card>
          <div className="p-6">
            <div className="flex items-center mb-4">
              <ServerIcon className="h-6 w-6 text-indigo-600 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">General Settings</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="systemName" className="block text-sm font-medium text-gray-700 mb-1">
                  System Name
                </label>
                <input
                  type="text"
                  id="systemName"
                  name="systemName"
                  value={config.systemName}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                />
              </div>
              
              <div>
                <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  Logo URL
                </label>
                <input
                  type="text"
                  id="logoUrl"
                  name="logoUrl"
                  value={config.logoUrl}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                />
              </div>
              
              <div className="flex items-center mt-2">
                <input
                  type="checkbox"
                  id="maintenanceMode"
                  name="maintenanceMode"
                  checked={config.maintenanceMode}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="maintenanceMode" className="ml-2 block text-sm text-gray-700">
                  Maintenance Mode
                </label>
              </div>
            </div>
          </div>
        </Card>
        
        {/* Security Settings */}
        <Card>
          <div className="p-6">
            <div className="flex items-center mb-4">
              <ShieldCheckIcon className="h-6 w-6 text-indigo-600 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Security Settings</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="passwordMinLength" className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Password Length
                </label>
                <input
                  type="number"
                  id="passwordMinLength"
                  name="passwordMinLength"
                  value={config.passwordMinLength}
                  onChange={handleInputChange}
                  min={6}
                  max={30}
                  className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                />
              </div>
              
              <div>
                <label htmlFor="sessionTimeoutMinutes" className="block text-sm font-medium text-gray-700 mb-1">
                  Session Timeout (minutes)
                </label>
                <input
                  type="number"
                  id="sessionTimeoutMinutes"
                  name="sessionTimeoutMinutes"
                  value={config.sessionTimeoutMinutes}
                  onChange={handleInputChange}
                  min={5}
                  className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                />
              </div>
              
              <div className="flex items-center mt-2">
                <input
                  type="checkbox"
                  id="passwordRequiresUppercase"
                  name="passwordRequiresUppercase"
                  checked={config.passwordRequiresUppercase}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="passwordRequiresUppercase" className="ml-2 block text-sm text-gray-700">
                  Require Uppercase Letters
                </label>
              </div>
              
              <div className="flex items-center mt-2">
                <input
                  type="checkbox"
                  id="passwordRequiresNumber"
                  name="passwordRequiresNumber"
                  checked={config.passwordRequiresNumber}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="passwordRequiresNumber" className="ml-2 block text-sm text-gray-700">
                  Require Numbers
                </label>
              </div>
              
              <div className="flex items-center mt-2">
                <input
                  type="checkbox"
                  id="passwordRequiresSpecial"
                  name="passwordRequiresSpecial"
                  checked={config.passwordRequiresSpecial}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="passwordRequiresSpecial" className="ml-2 block text-sm text-gray-700">
                  Require Special Characters
                </label>
              </div>
            </div>
          </div>
        </Card>
        
        {/* Notification Settings */}
        <Card>
          <div className="p-6">
            <div className="flex items-center mb-4">
              <BellAlertIcon className="h-6 w-6 text-indigo-600 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Notification Settings</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="emailNotificationsEnabled"
                  name="emailNotificationsEnabled"
                  checked={config.emailNotificationsEnabled}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="emailNotificationsEnabled" className="ml-2 block text-sm text-gray-700">
                  Enable Email Notifications
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="documentVerificationReminders"
                  name="documentVerificationReminders"
                  checked={config.documentVerificationReminders}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="documentVerificationReminders" className="ml-2 block text-sm text-gray-700">
                  Document Verification Reminders
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="trainingUpcomingReminders"
                  name="trainingUpcomingReminders"
                  checked={config.trainingUpcomingReminders}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="trainingUpcomingReminders" className="ml-2 block text-sm text-gray-700">
                  Training Reminders
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="systemAlertsEnabled"
                  name="systemAlertsEnabled"
                  checked={config.systemAlertsEnabled}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="systemAlertsEnabled" className="ml-2 block text-sm text-gray-700">
                  System Alerts
                </label>
              </div>
            </div>
          </div>
        </Card>
        
        {/* Document Settings */}
        <Card>
          <div className="p-6">
            <div className="flex items-center mb-4">
              <DocumentTextIcon className="h-6 w-6 text-indigo-600 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Document Settings</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="allowedDocumentTypes" className="block text-sm font-medium text-gray-700 mb-1">
                  Allowed Document Types (comma-separated)
                </label>
                <textarea
                  id="allowedDocumentTypes"
                  name="allowedDocumentTypes"
                  value={config.allowedDocumentTypes.join(', ')}
                  onChange={handleArrayInputChange}
                  rows={2}
                  className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                />
              </div>
              
              <div>
                <label htmlFor="maxDocumentSizeMB" className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Document Size (MB)
                </label>
                <input
                  type="number"
                  id="maxDocumentSizeMB"
                  name="maxDocumentSizeMB"
                  value={config.maxDocumentSizeMB}
                  onChange={handleInputChange}
                  min={1}
                  max={50}
                  className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                />
              </div>
              
              <div>
                <label htmlFor="documentRetentionDays" className="block text-sm font-medium text-gray-700 mb-1">
                  Document Retention Period (days)
                </label>
                <input
                  type="number"
                  id="documentRetentionDays"
                  name="documentRetentionDays"
                  value={config.documentRetentionDays}
                  onChange={handleInputChange}
                  min={30}
                  className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                />
              </div>
            </div>
          </div>
        </Card>
        
        {/* Training Settings */}
        <Card>
          <div className="p-6">
            <div className="flex items-center mb-4">
              <AcademicCapIcon className="h-6 w-6 text-indigo-600 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Training Settings</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoCloseCompletedTrainings"
                  name="autoCloseCompletedTrainings"
                  checked={config.autoCloseCompletedTrainings}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="autoCloseCompletedTrainings" className="ml-2 block text-sm text-gray-700">
                  Auto-close Completed Trainings
                </label>
              </div>
              
              <div>
                <label htmlFor="trainingReminderDays" className="block text-sm font-medium text-gray-700 mb-1">
                  Training Reminder Days Before
                </label>
                <input
                  type="number"
                  id="trainingReminderDays"
                  name="trainingReminderDays"
                  value={config.trainingReminderDays}
                  onChange={handleInputChange}
                  min={1}
                  max={30}
                  className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                />
              </div>
            </div>
          </div>
        </Card>
        
        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              'Save Configuration'
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 