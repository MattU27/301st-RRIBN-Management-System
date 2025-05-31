"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

// Password strength requirements (should match backend)
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REQUIRES_UPPERCASE = true;
const PASSWORD_REQUIRES_LOWERCASE = true;
const PASSWORD_REQUIRES_NUMBER = true;
const PASSWORD_REQUIRES_SYMBOL = true;

export default function ResetPasswordPage() {
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
                  Login Now
                </Link>
              </div>
            ) : (
              <form className="p-5" onSubmit={handleSubmit}>
                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-base font-medium text-red-700">{error}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex space-x-6">
                  {/* Left side - Password inputs */}
                  <div className="w-1/2">
                    <div className="mb-3">
                      <label htmlFor="new-password" className="block text-base font-medium text-gray-700 mb-1">
                        New Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <input
                          id="new-password"
                          name="newPassword"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          className="appearance-none relative block w-full pl-12 px-4 py-3 text-lg border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#092140] focus:border-[#092140] focus:z-10 bg-white/90"
                          placeholder="Enter your new password"
                        />
                      </div>
                      
                      {/* Password strength indicator */}
                      {newPassword && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-base text-gray-600">Password Strength:</span>
                            <span className={`text-base font-medium ${
                              strengthText === 'Weak' ? 'text-red-600' : 
                              strengthText === 'Medium' ? 'text-yellow-600' : 
                              strengthText === 'Strong' ? 'text-green-600' : ''
                            }`}>{strengthText}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className={`h-2.5 rounded-full ${strengthClass}`} 
                              style={{ width: `${(passwordStrength / 5) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="confirm-password" className="block text-base font-medium text-gray-700 mb-1">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </div>
                        <input
                          id="confirm-password"
                          name="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className="appearance-none relative block w-full pl-12 px-4 py-3 text-lg border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#092140] focus:border-[#092140] focus:z-10 bg-white/90"
                          placeholder="Confirm your new password"
                        />
                      </div>
                      {newPassword && confirmPassword && newPassword !== confirmPassword && (
                        <p className="mt-1 text-base text-red-600 font-medium">
                          Passwords do not match
                        </p>
                      )}
                    </div>
                    
                    <div className="mt-4">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-3 px-4 border border-transparent rounded-md shadow-md text-lg font-medium text-white bg-gradient-to-r from-[#092140] to-[#0a2d5a] hover:from-[#0a2d5a] hover:to-[#0d3b74] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#092140] ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </div>
                        ) : 'Reset Password'}
                      </button>
                    </div>
                  </div>
                  
                  {/* Right side - Password requirements */}
                  <div className="w-1/2">
                    <div className="p-4 bg-gray-50/80 rounded-md border border-gray-200 h-full shadow-sm">
                      <p className="text-base font-medium text-gray-700 mb-3">Password requirements:</p>
                      
                      <div className="space-y-2.5">
                        <div className={`text-base flex items-center ${newPassword.length >= PASSWORD_MIN_LENGTH ? "text-green-600" : "text-gray-600"}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${newPassword.length >= PASSWORD_MIN_LENGTH ? "text-green-600" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={newPassword.length >= PASSWORD_MIN_LENGTH ? "M5 13l4 4L19 7" : "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
                          </svg>
                          At least {PASSWORD_MIN_LENGTH} characters
                        </div>
                        
                        {PASSWORD_REQUIRES_UPPERCASE && (
                          <div className={`text-base flex items-center ${/[A-Z]/.test(newPassword) ? "text-green-600" : "text-gray-600"}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${/[A-Z]/.test(newPassword) ? "text-green-600" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={/[A-Z]/.test(newPassword) ? "M5 13l4 4L19 7" : "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
                            </svg>
                            Uppercase letter (A-Z)
                          </div>
                        )}
                        
                        {PASSWORD_REQUIRES_LOWERCASE && (
                          <div className={`text-base flex items-center ${/[a-z]/.test(newPassword) ? "text-green-600" : "text-gray-600"}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${/[a-z]/.test(newPassword) ? "text-green-600" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={/[a-z]/.test(newPassword) ? "M5 13l4 4L19 7" : "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
                            </svg>
                            Lowercase letter (a-z)
                          </div>
                        )}
                        
                        {PASSWORD_REQUIRES_NUMBER && (
                          <div className={`text-base flex items-center ${/[0-9]/.test(newPassword) ? "text-green-600" : "text-gray-600"}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${/[0-9]/.test(newPassword) ? "text-green-600" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={/[0-9]/.test(newPassword) ? "M5 13l4 4L19 7" : "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
                            </svg>
                            Number (0-9)
                          </div>
                        )}
                        
                        {PASSWORD_REQUIRES_SYMBOL && (
                          <div className={`text-base flex items-center ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword) ? "text-green-600" : "text-gray-600"}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword) ? "text-green-600" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword) ? "M5 13l4 4L19 7" : "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
                            </svg>
                            Special character (!@#$...)
                          </div>
                        )}
                        
                        <div className={`text-base flex items-center ${newPassword === confirmPassword && newPassword !== "" ? "text-green-600" : "text-gray-600"}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${newPassword === confirmPassword && newPassword !== "" ? "text-green-600" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={newPassword === confirmPassword && newPassword !== "" ? "M5 13l4 4L19 7" : "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
                          </svg>
                          Passwords match
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer - minimal */}
      <footer className="bg-gradient-to-r from-[#092140] to-[#0f3b6d] text-white py-0.5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-[#f0c14b]">301st READY RESERVE INFANTRY BATTALION</span>
            <span>© {new Date().getFullYear()} AFP</span>
          </div>
        </div>
      </footer>
    </div>
  );
} 