"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

// Password strength requirements (should match backend)
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REQUIRES_UPPERCASE = true;
const PASSWORD_REQUIRES_LOWERCASE = true;
const PASSWORD_REQUIRES_NUMBER = true;
const PASSWORD_REQUIRES_SYMBOL = true;

// Create a component that uses useSearchParams
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string>('');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenError, setTokenError] = useState(false);
  
  // Password strength state
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [strengthClass, setStrengthClass] = useState('');
  const [strengthText, setStrengthText] = useState('');

  useEffect(() => {
    // Get token from URL query parameters
    const tokenFromUrl = searchParams?.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setTokenError(true);
    }
  }, [searchParams]);

  // Check password strength whenever password changes
  useEffect(() => {
    if (!newPassword) {
      setPasswordStrength(0);
      setStrengthClass('');
      setStrengthText('');
      return;
    }

    let strength = 0;
    
    // Length check
    if (newPassword.length >= PASSWORD_MIN_LENGTH) strength += 1;
    
    // Uppercase check
    if (/[A-Z]/.test(newPassword)) strength += 1;
    
    // Lowercase check
    if (/[a-z]/.test(newPassword)) strength += 1;
    
    // Number check
    if (/[0-9]/.test(newPassword)) strength += 1;
    
    // Symbol check
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) strength += 1;

    setPasswordStrength(strength);
    
    // Set text and class based on strength
    if (strength === 0) {
      setStrengthText('');
      setStrengthClass('');
    } else if (strength < 3) {
      setStrengthText('Weak');
      setStrengthClass('bg-red-500');
    } else if (strength < 5) {
      setStrengthText('Medium');
      setStrengthClass('bg-yellow-500');
    } else {
      setStrengthText('Strong');
      setStrengthClass('bg-green-500');
    }
  }, [newPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!token) {
      setError('Invalid or missing password reset token');
      setIsLoading(false);
      return;
    }

    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError('Please enter and confirm your new password');
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    // Check password requirements
    if (newPassword.length < PASSWORD_MIN_LENGTH) {
      setError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters long`);
      setIsLoading(false);
      return;
    }

    if (PASSWORD_REQUIRES_UPPERCASE && !/[A-Z]/.test(newPassword)) {
      setError('Password must contain at least one uppercase letter');
      setIsLoading(false);
      return;
    }

    if (PASSWORD_REQUIRES_LOWERCASE && !/[a-z]/.test(newPassword)) {
      setError('Password must contain at least one lowercase letter');
      setIsLoading(false);
      return;
    }

    if (PASSWORD_REQUIRES_NUMBER && !/[0-9]/.test(newPassword)) {
      setError('Password must contain at least one number');
      setIsLoading(false);
      return;
    }

    if (PASSWORD_REQUIRES_SYMBOL && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
      setError('Password must contain at least one special character (!, @, #, etc.)');
      setIsLoading(false);
      return;
    }

    console.log('Sending password reset request...');

    try {
      console.log('API Endpoint:', '/api/auth/reset-password');
      console.log('Request payload:', { token: token.substring(0, 8) + '...', newPasswordLength: newPassword.length });
      
      // Add a timeout to the axios request
      const response = await axios.post('/api/auth/reset-password', {
        token,
        newPassword,
        confirmPassword,
      }, {
        timeout: 15000, // 15 second timeout
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('API Response:', response.status, response.statusText);
      
      if (response.data.success) {
        console.log('Password reset successful');
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        console.error('API returned error:', response.data);
        setError(response.data.message || response.data.error || 'Failed to reset password');
      }
    } catch (err: any) {
      console.error('Error during password reset:', err);
      
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Response data:', err.response.data);
        console.error('Response status:', err.response.status);
        console.error('Response headers:', err.response.headers);
        
        // Get error message from response data, looking for message first, then error
        const errorMessage = err.response.data?.message || 
                err.response.data?.error || 
                err.response.data?.details || 
                `Error ${err.response.status}: ${err.response.statusText || 'An error occurred'}`;
        
        console.error('Error message to display:', errorMessage);
        setError(errorMessage);
      } else if (err.request) {
        // The request was made but no response was received
        console.error('No response received:', err.request);
        setError('The server did not respond. Please check your connection and try again.');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Request setup error:', err.message);
        setError(`Request error: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#f0f4f8] via-white to-[#e6f0f8]">
      {/* Header - even more compact */}
      <div className="bg-gradient-to-r from-[#092140] to-[#0f3b6d] text-white py-1 px-4 shadow-md">
        <div className="max-w-7xl mx-auto">
          <span className="text-base font-bold tracking-wider">301st READY RESERVE <span className="text-[#f0c14b]">INFANTRY BATTALION</span></span>
        </div>
      </div>

      {/* Main content - expanded */}
      <div className="flex-grow flex items-center justify-center px-4 bg-[url('/bg-pattern.png')] bg-no-repeat bg-center bg-cover bg-opacity-5">
        <div className="w-full max-w-5xl relative z-10">
          <div className="text-center mb-1">
            <h2 className="text-2xl font-bold text-[#092140]">Reset Password</h2>
            <div className="w-28 h-[2px] bg-gradient-to-r from-[#092140] to-[#f0c14b] mx-auto"></div>
          </div>

          <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-100 backdrop-blur-sm bg-white/95">
            {tokenError ? (
              <div className="p-5 text-center">
                <div className="text-red-500 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Invalid Reset Link</h3>
                <p className="text-gray-600 mb-3">
                  The password reset link is invalid or has expired.
                </p>
                <Link 
                  href="/password-recovery"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-[#092140] hover:bg-[#0a2d5a] focus:outline-none"
                >
                  Return to Password Recovery
                </Link>
              </div>
            ) : success ? (
              <div className="p-5 text-center">
                <div className="text-green-500 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Password Reset Successful</h3>
                <p className="text-gray-600 mb-3">
                  Your password has been updated. Redirecting to login...
                </p>
                <Link 
                  href="/login"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-[#092140] hover:bg-[#0a2d5a] focus:outline-none"
                >
                  Go to Login
                </Link>
              </div>
            ) : (
              <div className="p-5">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-red-700">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                      New Password
                    </label>
                    <div className="mt-1">
                      <input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#092140] focus:border-[#092140] sm:text-sm"
                      />
                    </div>
                    {newPassword && (
                      <div className="mt-1 text-xs">
                        <div className="flex items-center">
                          <div className="flex-grow h-1 bg-gray-200 rounded overflow-hidden">
                            <div 
                              className={`h-1 ${strengthClass}`} 
                              style={{ width: `${passwordStrength * 20}%` }}
                            ></div>
                          </div>
                          <span className="ml-2 text-gray-500">{strengthText}</span>
                        </div>
                        <ul className="mt-1 text-gray-500 list-disc pl-5">
                          <li className={newPassword.length >= PASSWORD_MIN_LENGTH ? 'text-green-500' : ''}>
                            At least {PASSWORD_MIN_LENGTH} characters
                          </li>
                          {PASSWORD_REQUIRES_UPPERCASE && (
                            <li className={/[A-Z]/.test(newPassword) ? 'text-green-500' : ''}>
                              Contains uppercase letter
                            </li>
                          )}
                          {PASSWORD_REQUIRES_LOWERCASE && (
                            <li className={/[a-z]/.test(newPassword) ? 'text-green-500' : ''}>
                              Contains lowercase letter
                            </li>
                          )}
                          {PASSWORD_REQUIRES_NUMBER && (
                            <li className={/[0-9]/.test(newPassword) ? 'text-green-500' : ''}>
                              Contains number
                            </li>
                          )}
                          {PASSWORD_REQUIRES_SYMBOL && (
                            <li className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword) ? 'text-green-500' : ''}>
                              Contains special character
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                      Confirm Password
                    </label>
                    <div className="mt-1">
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#092140] focus:border-[#092140] sm:text-sm"
                      />
                    </div>
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="mt-1 text-xs text-red-500">
                        Passwords do not match
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <Link href="/login" className="font-medium text-[#092140] hover:text-[#0a2d5a]">
                        Return to login
                      </Link>
                    </div>
                  </div>
                  
                  <div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#092140] hover:bg-[#0a2d5a] focus:outline-none ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </>
                      ) : 'Reset Password'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading fallback component
function ResetPasswordLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#f0f4f8] via-white to-[#e6f0f8]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#092140] mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading reset password form...</p>
      </div>
    </div>
  );
}

// Main component that wraps with Suspense
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordLoading />}>
      <ResetPasswordForm />
    </Suspense>
  );
} 