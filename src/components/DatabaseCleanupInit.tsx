"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';

/**
 * Component that runs database cleanup operations on application initialization
 * This helps resolve persistent problematic data issues
 */
export default function DatabaseCleanupInit() {
  const { isAuthenticated, user } = useAuth();
  const [hasRun, setHasRun] = useState(false);
  
  useEffect(() => {
    // Only run this once per session
    if (hasRun) return;
    
    // Only run for authenticated admin/director users
    if (!isAuthenticated || !user || !['admin', 'director', 'administrator'].includes(user.role)) {
      return;
    }
    
    const runCleanup = async () => {
      try {
        console.log('Running initialization database cleanup...');
        const token = localStorage.getItem('token');
        
        if (!token) return;
        
        // Call the db-cleanup API
        await axios.get('/api/db-cleanup', {
          headers: {
            Authorization: `Bearer ${token}`
          },
          params: {
            _t: new Date().getTime() // Cache busting
          }
        });
        
        console.log('Database cleanup completed successfully');
        setHasRun(true);
      } catch (error) {
        console.error('Error during database cleanup:', error);
      }
    };
    
    // Run the cleanup after a short delay to not block UI rendering
    const timeoutId = setTimeout(() => {
      runCleanup();
    }, 5000);
    
    return () => clearTimeout(timeoutId);
  }, [isAuthenticated, user, hasRun]);
  
  // This component doesn't render anything visible
  return null;
} 