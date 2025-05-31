'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import Button from '@/components/Button';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface SyncStatusButtonProps {
  onSyncComplete?: () => void;
  className?: string;
  label?: string;
}

// Status mapping from database values to UI display values
const STATUS_MAPPING = {
  "Active": "Ready",
  "Inactive": "Retired",
  "Deployed": "Standby",
  "Pending": "Standby"
};

export default function SyncStatusButton({ 
  onSyncComplete, 
  className = '',
  label = 'Sync Status Data'
}: SyncStatusButtonProps) {
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const { getToken } = useAuth();
  
  const handleSync = async () => {
    setSyncing(true);
    let hasError = false;
    try {
      // Get authentication token
      const token = await getToken();
      
      if (!token) {
        throw new Error('Authentication failed');
      }
      
      // First sync company data
      setProgress('Syncing company data...');
      try {
        const companyResponse = await fetch('/api/companies/sync', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!companyResponse.ok) {
          const errorData = await companyResponse.json();
          console.warn('Company sync issue:', errorData.error);
          toast.error(`Company sync failed: ${errorData.error}`);
          hasError = true;
        } else {
          const companyResult = await companyResponse.json();
          console.log('Companies synced successfully:', companyResult);
          toast.success('Company data synchronized');
        }
      } catch (error) {
        console.error('Company sync error:', error);
        toast.error(`Company sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        hasError = true;
      }
      
      // Fix company-personnel relationships first
      setProgress('Fixing company-personnel relationships...');
      try {
        const companyPersonnelResponse = await fetch('/api/companies/sync-personnel', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!companyPersonnelResponse.ok) {
          const errorData = await companyPersonnelResponse.json();
          console.warn('Company-personnel sync issue:', errorData.error);
          toast.error(`Company-personnel sync failed: ${errorData.error}`);
          hasError = true;
        } else {
          const relationshipResult = await companyPersonnelResponse.json();
          console.log('Company-personnel relationships synced:', relationshipResult);
        }
      } catch (error) {
        console.error('Company-personnel sync error:', error);
        toast.error(`Company-personnel sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        hasError = true;
      }
      
      // Then sync personnel data
      setProgress('Syncing personnel data...');
      try {
        const personnelResponse = await fetch('/api/personnel/sync', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!personnelResponse.ok) {
          const errorData = await personnelResponse.json();
          toast.error(`Personnel sync failed: ${errorData.error}`);
          hasError = true;
        } else {
          const result = await personnelResponse.json();
          console.log('Personnel synced successfully:', result);
        }
      } catch (error) {
        console.error('Personnel sync error:', error);
        toast.error(`Personnel sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        hasError = true;
      }
      
      // Show final status message
      setProgress('Finalizing sync...');
      if (hasError) {
        toast.error('Sync completed with some issues. Check console for details.');
      } else {
        toast.success('All data synchronized successfully');
      }
      
      // Call the completion callback if provided
      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (error: any) {
      console.error('Error syncing data:', error);
      toast.error(error.message || 'Failed to sync data');
    } finally {
      setProgress(null);
      setSyncing(false);
    }
  };
  
  return (
    <Button
      variant="secondary"
      size="sm"
      className={`flex items-center ${className}`}
      onClick={handleSync}
      disabled={syncing}
    >
      <ArrowPathIcon className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
      {syncing ? (progress || 'Syncing...') : label}
    </Button>
  );
} 