"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Button from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';

const AccountDeactivationNotice: React.FC = () => {
  const { accountDeactivated, dismissDeactivationNotice, logout } = useAuth();
  const router = useRouter();
  const [deactivationReason, setDeactivationReason] = useState<string | null>(null);

  // Get deactivation reason from sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && accountDeactivated) {
      console.log('AccountDeactivationNotice: Component mounted, deactivation state =', accountDeactivated);
      
      try {
        // Get the reason from sessionStorage without overriding it
        const reason = sessionStorage.getItem('deactivationReason');
        console.log('AccountDeactivationNotice: Retrieved reason from sessionStorage:', reason);
        
        if (reason) {
          setDeactivationReason(reason);
          console.log('AccountDeactivationNotice: Set reason state to:', reason);
        } else {
          // Check global variable as fallback (might have been set by websocketService)
          const globalWindow = window as any;
          if (globalWindow.lastDeactivationReason) {
            console.log('AccountDeactivationNotice: Using global variable fallback:', globalWindow.lastDeactivationReason);
            const globalReason = globalWindow.lastDeactivationReason;
            setDeactivationReason(globalReason);
            sessionStorage.setItem('deactivationReason', globalReason);
          } else {
            const defaultReason = 'No reason provided by administrator';
            console.log('AccountDeactivationNotice: No reason found, using default:', defaultReason);
            setDeactivationReason(defaultReason);
            sessionStorage.setItem('deactivationReason', defaultReason);
          }
        }
        
        // Log all sessionStorage for debugging
        console.log('AccountDeactivationNotice: All sessionStorage items:');
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key) {
            console.log(`- ${key}: ${sessionStorage.getItem(key)}`);
          }
        }
      } catch (error) {
        console.error('AccountDeactivationNotice: Error handling deactivation reason:', error);
        setDeactivationReason('Error retrieving deactivation reason');
      }
      
      // Set a timeout to automatically redirect to login
      const redirectTimer = setTimeout(() => {
        console.log('AccountDeactivationNotice: Redirect timer triggered, logging out');
        logout();
        router.push('/login');
      }, 5000);

      // Cleanup function
      return () => {
        clearTimeout(redirectTimer);
        console.log('AccountDeactivationNotice: Component unmounting, cleanup performed');
      };
    }
  }, [accountDeactivated, logout, router]);

  if (!accountDeactivated) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-75">
      <div className="bg-white rounded-lg shadow-xl p-6 md:p-8 mx-4 max-w-md w-full animate-fadeIn">
        <div className="flex items-center justify-center mb-6 text-red-600">
          <ExclamationTriangleIcon className="h-16 w-16" />
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-4">
          Account Deactivated
        </h2>
        <p className="text-gray-600 text-center mb-4">
          Your account has been deactivated by an administrator. You will be automatically logged out in a few seconds.
        </p>
        
        {/* Always show the deactivation reason section */}
        <div className="bg-gray-100 p-4 rounded-md mb-6">
          <h3 className="font-medium text-gray-900 mb-1">Reason for deactivation:</h3>
          <p className="text-gray-700">{deactivationReason || 'No reason provided'}</p>
        </div>
        
        <p className="text-gray-500 text-sm text-center mb-6">
          If you believe this is an error, please contact your system administrator
          for assistance.
        </p>
        <div className="flex justify-center">
          <Button
            variant="secondary"
            onClick={() => {
              dismissDeactivationNotice();
              router.push('/login');
            }}
            className="w-full sm:w-auto"
          >
            Return to Login
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AccountDeactivationNotice; 