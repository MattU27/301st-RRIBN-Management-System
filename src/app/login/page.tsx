"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { UserStatus } from '@/types/auth';

// Component with useSearchParams, wrapped in Suspense
function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pendingAccount, setPendingAccount] = useState(false);
  const [inactiveAccount, setInactiveAccount] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const { login, isAuthenticated, user, isRedirecting } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard';
  const [rememberMe, setRememberMe] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    console.log('Login page mounted, auth state:', { isAuthenticated, user, isRedirecting });
    
    // Only redirect if authenticated and not currently in a redirect process
    if (isAuthenticated && user && !isRedirecting) {
      console.log('User is authenticated, redirecting to dashboard...');
      // Use direct location for more reliable redirect
      window.location.href = '/dashboard';
    }
    
    // Check if the URL has a deactivated parameter
    const deactivated = searchParams?.get('deactivated');
    if (deactivated === 'true') {
      setInactiveAccount(true);
    }
  }, [isAuthenticated, user, isRedirecting, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPendingAccount(false);
    setInactiveAccount(false);
    setIsLoading(true);
    console.log('Attempting login with:', { email, rememberMe });

    try {
      // Check account status first
      try {
        console.log('Checking account status for:', email);
        const statusResponse = await axios.post('/api/auth/check-status', { email });
        
        // If account exists, check its status
        if (statusResponse.data.success && statusResponse.data.user) {
          const userStatus = statusResponse.data.user.status;
          console.log('Account status response:', statusResponse.data);
          
          if (userStatus === UserStatus.PENDING) {
            setPendingAccount(true);
            setIsLoading(false);
            return;
          }
          
          if (userStatus === UserStatus.INACTIVE) {
            setInactiveAccount(true);
            setIsLoading(false);
            return;
          }
        }
      } catch (statusError: any) {
        console.log('Error checking account status:', statusError);
        // If we get a 401, that could mean the user doesn't exist
        // but we'll continue with the login attempt to get the proper error message
        if (statusError.response?.status !== 401) {
          throw statusError;
        }
      }
      
      // Proceed with login 
      console.log('Proceeding with login attempt');
      await login(email, password, rememberMe); // Pass rememberMe to login function
      console.log('Login successful, redirecting...');
    } catch (err: any) {
      console.error('Login failed:', err);
      // Check if it's a specific error from the API
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError(err.message || 'Invalid email or password');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-gray-100">
      {/* Navy blue header bar that matches homepage */}
      <div className="bg-[#092140] text-white py-4 px-6 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center">
          <Link href="/" className="flex items-center group">
            <div className="flex flex-col relative overflow-hidden">
              <span className="text-white font-bold text-lg tracking-wider group-hover:text-[#D1B000] transition-colors duration-300">301st READY RESERVE</span>
              <span className="text-[#D1B000] text-xs tracking-widest">INFANTRY BATTALION</span>
              <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#D1B000] group-hover:w-full transition-all duration-500"></div>
            </div>
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-20 left-[10%] w-32 h-32 rounded-full bg-[#092140] opacity-5 transform rotate-45"></div>
          <div className="absolute bottom-20 right-[10%] w-40 h-40 rounded-full bg-[#D1B000] opacity-5"></div>
          <div className="absolute top-[40%] right-[15%] w-24 h-24 rounded-full bg-[#092140] opacity-5"></div>
        </div>
        
        <div className="max-w-md w-full space-y-8 animate-fadeIn relative z-10">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute -inset-1 rounded-full opacity-50 bg-gradient-to-r from-[#D1B000] to-[#092140] blur-sm animate-pulse"></div>
                <img 
                  src="/images/laang-kawal.png" 
                  alt="LAANG-KAWAL PILIPINAS" 
                  className="h-24 w-24 animate-breathe relative"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }} 
                />
              </div>
            </div>
            <h2 className="text-3xl font-extrabold text-[#092140] animate-slideInUp animation-delay-300">Sign in to your account</h2>
            <p className="mt-2 text-sm text-gray-600 animate-slideInUp animation-delay-500">
              Personnel Management System
            </p>
            
            {/* Enhanced gold line accent */}
            <div className="relative w-32 h-[2px] bg-[#D1B000] mx-auto mt-4 mb-8 animate-slideInUp animation-delay-600">
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#D1B000]"></div>
            </div>
          </div>

          <div className="bg-white shadow-xl rounded-lg overflow-hidden border border-gray-100 animate-slideInUp animation-delay-700 transition-all duration-300 hover:shadow-2xl">
            {pendingAccount ? (
              <div className="p-8">
                <div className="flex items-center justify-center mb-6 text-[#D1B000]">
                  <ClockIcon className="h-16 w-16" />
                </div>
                <h3 className="text-xl font-medium text-center text-gray-900 mb-4">Account Pending Approval</h3>
                <p className="text-gray-600 text-center mb-8">
                  Your account is currently pending approval by a system administrator. 
                  Please check back later or contact your administrator for assistance.
                </p>
                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      setPendingAccount(false);
                      setEmail('');
                      setPassword('');
                    }}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-[#092140] bg-[#D1B000] hover:bg-[#c0a000] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D1B000] transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1"
                  >
                    Try Another Account
                  </button>
                </div>
              </div>
            ) : inactiveAccount ? (
              <div className="p-8">
                <div className="flex items-center justify-center mb-6 text-[#D9534F]">
                  <ExclamationTriangleIcon className="h-16 w-16" />
                </div>
                <h3 className="text-xl font-medium text-center text-gray-900 mb-4">Account Inactive</h3>
                <p className="text-gray-600 text-center mb-8">
                  Your account has been deactivated. Please contact your system administrator
                  for assistance or to reactivate your account.
                </p>
                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      setInactiveAccount(false);
                      setEmail('');
                      setPassword('');
                    }}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-[#092140] bg-[#D1B000] hover:bg-[#c0a000] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D1B000] transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1"
                  >
                    Try Another Account
                  </button>
                </div>
              </div>
            ) : (
              <form className="space-y-6 p-8" onSubmit={handleSubmit}>
                {error && (
                  <div className="bg-red-50 border-l-4 border-[#D9534F] p-4 mb-6 animate-fadeIn rounded-r">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-[#D9534F]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-4">
                  <div className="group">
                    <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-1 group-focus-within:text-[#092140] transition-colors duration-300">
                      Email address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                        </svg>
                      </div>
                      <input
                        id="email-address"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        className="appearance-none relative block w-full pl-10 px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#092140] focus:border-[#092140] focus:z-10 sm:text-sm transition-all duration-300"
                        placeholder="Primary or alternative email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">You can use either your AFP email or alternative email</p>
                  </div>
                  <div className="group">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1 group-focus-within:text-[#092140] transition-colors duration-300">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                      </div>
                      <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        className="appearance-none relative block w-full pl-10 px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#092140] focus:border-[#092140] focus:z-10 sm:text-sm transition-all duration-300"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-6">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-[#092140] focus:ring-[#D1B000] border-gray-300 rounded transition-all duration-300"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                      Remember me
                    </label>
                  </div>

                  <div className="text-sm">
                    <Link 
                      href="/password-recovery"
                      className="font-medium text-[#092140] hover:text-[#D1B000] transition-all duration-300"
                    >
                      Forgot your password?
                    </Link>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-medium rounded-md text-[#092140] bg-[#D1B000] hover:bg-[#c0a000] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D1B000] transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#092140]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </div>
                    ) : (
                      <>
                        <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-[#092140] group-hover:text-[#092140]">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                          </svg>
                        </span>
                        Sign in
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
          
          {/* Register link */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Don't have an account yet?
              <Link href="/register" className="ml-1 font-medium text-[#092140] hover:text-[#D1B000] transition-all duration-300">
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-slideInUp">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-[#092140]">Reset Password</h3>
              <button 
                onClick={() => {
                  setShowForgotPasswordModal(false);
                  setResetEmailSent(false);
                  setResetEmail('');
                }}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              {resetEmailSent ? (
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Check your email</h3>
                  <p className="text-gray-600 mb-4">
                    We've sent a password reset link to <span className="font-medium">{resetEmail}</span>.
                    Please check your inbox and follow the instructions to reset your password.
                  </p>
                  <p className="text-sm text-gray-500">
                    If you don't see the email, check your spam folder or request another reset link.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-gray-600 mb-4">
                    Enter your email address below and we'll send you a link to reset your password.
                  </p>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    // This is just a placeholder for future integration
                    setResetEmailSent(true);
                  }}>
                    <div className="mb-4">
                      <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                          </svg>
                        </div>
                        <input
                          id="reset-email"
                          name="reset-email"
                          type="email"
                          required
                          className="appearance-none relative block w-full pl-10 px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#092140] focus:border-[#092140] focus:z-10 sm:text-sm transition-all duration-300"
                          placeholder="Email address"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#092140] text-white rounded-md hover:bg-[#0a2d5a] transition-colors"
                      >
                        Send Reset Link
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer that matches the homepage style */}
      <footer className="bg-[#092140] border-t border-gray-800 text-white py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-between items-center text-[10px] py-1">
            <div className="flex items-center">
              <div className="mr-4">
                <div className="flex items-center mb-1">
                  <div className="w-6 h-[1px] bg-[#D1B000] mr-2"></div>
                  <div className="w-6 h-[1px] bg-[#D1B000]"></div>
                </div>
                <span className="font-semibold">301st READY RESERVE</span>
                <span className="text-[#D1B000] ml-1">INFANTRY BATTALION</span>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-gray-400">
              <span>© {new Date().getFullYear()} AFP</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Enhanced CSS animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        
        @keyframes slideInUp {
          0% { 
            opacity: 0;
            transform: translateY(20px);
          }
          100% { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
        
        @keyframes breathe {
          0% {
            transform: scale(1);
            filter: drop-shadow(0 0 0px rgba(0, 153, 0, 0.7));
          }
          50% {
            transform: scale(1.05);
            filter: drop-shadow(0 0 8px rgba(0, 153, 0, 0.9));
          }
          100% {
            transform: scale(1);
            filter: drop-shadow(0 0 0px rgba(0, 153, 0, 0.7));
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 1s ease-out forwards;
        }
        
        .animate-slideInUp {
          animation: slideInUp 0.8s ease-out forwards;
        }
        
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        .animate-breathe {
          animation: breathe 3s ease-in-out infinite;
        }
        
        .animation-delay-300 {
          animation-delay: 300ms;
        }
        
        .animation-delay-500 {
          animation-delay: 500ms;
        }
        
        .animation-delay-600 {
          animation-delay: 600ms;
        }
        
        .animation-delay-700 {
          animation-delay: 700ms;
        }
      `}</style>
    </div>
  );
}

// Main login page component with Suspense
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0A355C]"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
} 