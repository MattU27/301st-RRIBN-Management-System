'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Button from './Button';

export default function SessionTimeoutWarning() {
  const { sessionExpiring, extendSession, logout } = useAuth();
  const [timeLeft, setTimeLeft] = useState(5 * 60); // 5 minutes in seconds
  const [hasMounted, setHasMounted] = useState(false);
  
  // Mark component as mounted after initial render
  useEffect(() => {
    setHasMounted(true);
  }, []);
  
  useEffect(() => {
    if (!sessionExpiring) {
      setTimeLeft(5 * 60);
      return;
    }
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [sessionExpiring]);
  
  // Don't show anything on first render or if not session expiring
  if (!hasMounted || !sessionExpiring) {
    return null;
  }
  
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-md z-50 border-l-4 border-yellow-500">
      <h3 className="text-lg font-medium text-gray-900 mb-2">Session Expiring</h3>
      <p className="text-sm text-gray-600 mb-3">
        Your session will expire in {minutes}:{seconds < 10 ? `0${seconds}` : seconds}. 
        You will be logged out due to inactivity.
      </p>
      <div className="flex space-x-3">
        <Button 
          onClick={extendSession}
          className="flex-1"
        >
          Stay Logged In
        </Button>
        <Button 
          onClick={logout}
          variant="secondary"
          className="flex-1"
        >
          Logout Now
        </Button>
      </div>
    </div>
  );
} 