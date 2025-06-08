"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/Button';
import Card from '@/components/Card';
import axios from 'axios';
import { UserRole } from '@/types/auth';
import bcrypt from 'bcryptjs';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    alternativeEmail: '',
    password: '',
    confirmPassword: '',
    role: 'staff',
    company: 'Alpha',
    rank: '',
    serviceId: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(true);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validate form
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (!formData.firstName || !formData.lastName) {
      setError('Please provide both first and last name');
      setIsLoading(false);
      return;
    }

    if (!formData.rank && ['reservist', 'enlisted'].includes(formData.role)) {
      setError('Please select a rank');
      setIsLoading(false);
      return;
    }
    
    // Check Service ID format/length if needed
    if (!formData.serviceId || formData.serviceId.trim().length < 5) {
      setError('Please provide a valid Service ID (minimum 5 characters)');
      setIsLoading(false);
      return;
    }
    
    // Validate primary email
    if (!isValidEmail(formData.email)) {
      setError('Please provide a valid email address (only gmail.com, outlook.com, yahoo.com, or mil.ph domains are accepted)');
      setIsLoading(false);
      return;
    }
    
    // Validate alternative email if provided
    if (formData.alternativeEmail && !isValidEmail(formData.alternativeEmail)) {
      setError('Please provide a valid alternative email address (only gmail.com, outlook.com, yahoo.com, or mil.ph domains are accepted)');
      setIsLoading(false);
      return;
    }

    try {
      let serviceIdExists = false;
      
      // First check if Service ID already exists
      try {
        const checkResponse = await axios.get(`/api/user/check-military-id?id=${encodeURIComponent(formData.serviceId)}`);
        if (checkResponse.data && checkResponse.data.exists) {
          serviceIdExists = true;
        }
      } catch (checkErr: any) {
        // If the endpoint doesn't exist or returns error, continue with registration
        console.warn('Could not verify Service ID uniqueness:', checkErr);
        // Only show the error in console, don't interrupt registration flow
      }
      
      if (serviceIdExists) {
        setError('This Service ID is already registered in the system');
        setIsLoading(false);
        return;
      }
      
      // Submit to the API
      const response = await axios.post('/api/auth/register', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        alternativeEmail: formData.alternativeEmail,
        password: formData.password,
        role: formData.role,
        company: formData.company,
        rank: formData.rank,
        serviceId: formData.serviceId,
        status: 'pending',
      });

      if (response.data.success) {
        // Show success message
        setRegistrationSuccess(true);
        // Reset form fields
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          alternativeEmail: '',
          password: '',
          confirmPassword: '',
          role: 'staff',
          company: 'Alpha',
          rank: '',
          serviceId: '',
        });
        setIsLoading(false);
      } else {
        throw new Error(response.data.error || 'Registration failed');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.response?.data?.error || err.message || 'Registration failed. Please try again.');
      setIsLoading(false);
    }
  };

  const companies = [
    'Alpha', 
    'Bravo', 
    'Charlie', 
    'Headquarters', 
    'NERRSC (NERR-Signal Company)', 
    'NERRFAB (NERR-Field Artillery Battery)'
  ];
  
  const ranks = [
    'Private',
    'Private First Class',
    'Corporal',
    'Sergeant',
    'Second Lieutenant',
    'First Lieutenant',
    'Captain',
    'Major',
    'Lieutenant Colonel',
    'Colonel',
    'Brigadier General'
  ];

  const roles = [
    { value: 'staff', label: 'Staff' },
    { value: 'administrator', label: 'Administrator' }
  ];

  // Helper function to validate email
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return false;
    
    // Check if the email domain is allowed
    const allowedDomains = ['gmail.com', 'outlook.com', 'yahoo.com', 'mil.ph'];
    const domain = email.split('@')[1].toLowerCase();
    return allowedDomains.includes(domain);
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
      <div className="flex-grow flex items-center justify-center py-6 px-4 sm:px-6 lg:px-8 relative">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-20 left-[10%] w-32 h-32 rounded-full bg-[#092140] opacity-5 transform rotate-45"></div>
          <div className="absolute bottom-20 right-[10%] w-40 h-40 rounded-full bg-[#D1B000] opacity-5"></div>
          <div className="absolute top-[40%] right-[15%] w-24 h-24 rounded-full bg-[#092140] opacity-5"></div>
        </div>
        
        <div className="max-w-4xl mx-auto w-full space-y-3 animate-fadeIn relative z-10">
          <div className="text-center">
            <div className="flex justify-center mb-3">
              <div className="relative">
                <div className="absolute -inset-1 rounded-full opacity-50 bg-gradient-to-r from-[#D1B000] to-[#092140] blur-sm animate-pulse"></div>
                <img 
                  src="/images/laang-kawal.png" 
                  alt="LAANG-KAWAL PILIPINAS" 
                  className="h-16 w-16 animate-breathe relative"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }} 
                />
              </div>
            </div>
            <h2 className="text-3xl font-extrabold text-[#092140] animate-slideInUp animation-delay-300">Create an account</h2>
            <p className="mt-1 text-base text-gray-600 animate-slideInUp animation-delay-500">
              Personnel Management System
            </p>
            
            {/* Enhanced gold line accent */}
            <div className="relative w-40 h-[2px] bg-[#D1B000] mx-auto mt-2 mb-3 animate-slideInUp animation-delay-600">
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#D1B000]"></div>
            </div>
          </div>

          <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-100 animate-slideInUp animation-delay-700 transition-all duration-300 hover:shadow-xl">
            {registrationSuccess ? (
              <div className="p-8">
                <div className="flex items-center justify-center mb-6 text-[#28a745]">
                  <svg className="h-16 w-16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-center text-gray-900 mb-4">Registration Successful</h3>
                <p className="text-gray-600 text-center mb-8">
                  Your registration has been submitted successfully. Your account is 
                  now pending approval from a super administrator.
                </p>
                <p className="text-gray-600 text-center mb-8">
                  Confirmation emails have been sent to your registered email address{formData.alternativeEmail ? " and your alternative email address" : ""}. 
                  Please check your inbox for further instructions.
                </p>
                <div className="flex justify-center">
                  <Link 
                    href="/login"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-[#092140] bg-[#D1B000] hover:bg-[#c0a000] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D1B000] transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1"
                  >
                    Return to Login
                  </Link>
                </div>
              </div>
            ) : (
              <form className="space-y-2 p-4" onSubmit={handleSubmit}>
                {error && (
                  <div className="bg-red-50 border-l-4 border-[#D9534F] p-2 mb-2 animate-fadeIn rounded-r">
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
                
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="group">
                      <label htmlFor="first-name" className="block text-base font-medium text-gray-700 mb-1 group-focus-within:text-[#092140] transition-colors duration-300">
                        First name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                          </svg>
                        </div>
                        <input
                          id="first-name"
                          name="firstName"
                          type="text"
                          autoComplete="given-name"
                          required
                          className="appearance-none relative block w-full pl-10 px-3 py-2 text-base border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#092140] focus:border-[#092140] focus:z-10 transition-all duration-300"
                          placeholder="First name"
                          value={formData.firstName}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    <div className="group">
                      <label htmlFor="last-name" className="block text-base font-medium text-gray-700 mb-1 group-focus-within:text-[#092140] transition-colors duration-300">
                        Last name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                          </svg>
                        </div>
                        <input
                          id="last-name"
                          name="lastName"
                          type="text"
                          autoComplete="family-name"
                          required
                          className="appearance-none relative block w-full pl-10 px-3 py-2 text-base border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#092140] focus:border-[#092140] focus:z-10 transition-all duration-300"
                          placeholder="Last name"
                          value={formData.lastName}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="group">
                      <label htmlFor="email-address" className="block text-base font-medium text-gray-700 mb-1 group-focus-within:text-[#092140] transition-colors duration-300">
                        AFP Email address
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
                          className="appearance-none relative block w-full pl-10 px-3 py-2 text-base border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#092140] focus:border-[#092140] focus:z-10 transition-all duration-300"
                          placeholder="Email address (mil.ph only)"
                          value={formData.email}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    
                    <div className="group">
                      <label htmlFor="alternative-email" className="block text-base font-medium text-gray-700 mb-1 group-focus-within:text-[#092140] transition-colors duration-300">
                        Alternative Email (Personal)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                          </svg>
                        </div>
                        <input
                          id="alternative-email"
                          name="alternativeEmail"
                          type="email"
                          autoComplete="email"
                          className="appearance-none relative block w-full pl-10 px-3 py-2 text-base border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#092140] focus:border-[#092140] focus:z-10 transition-all duration-300"
                          placeholder="Alternative email (gmail, outlook, yahoo)"
                          value={formData.alternativeEmail}
                          onChange={handleChange}
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Used for account recovery</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="group">
                      <label htmlFor="password" className="block text-base font-medium text-gray-700 mb-1 group-focus-within:text-[#092140] transition-colors duration-300">
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
                          autoComplete="new-password"
                          required
                          className="appearance-none relative block w-full pl-10 px-3 py-2 text-base border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#092140] focus:border-[#092140] focus:z-10 transition-all duration-300"
                          placeholder="Password"
                          value={formData.password}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    
                    <div className="group">
                      <label htmlFor="confirm-password" className="block text-base font-medium text-gray-700 mb-1 group-focus-within:text-[#092140] transition-colors duration-300">
                        Confirm password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                          </svg>
                        </div>
                        <input
                          id="confirm-password"
                          name="confirmPassword"
                          type="password"
                          autoComplete="new-password"
                          required
                          className="appearance-none relative block w-full pl-10 px-3 py-2 text-base border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#092140] focus:border-[#092140] focus:z-10 transition-all duration-300"
                          placeholder="Confirm password"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                        />
                      </div>
                      {formData.password !== formData.confirmPassword && formData.confirmPassword && (
                        <p className="mt-1 text-sm text-red-600 bg-red-50 p-2 rounded-md">
                          <span className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Passwords do not match
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  {formData.password && (
                    <div className="text-sm bg-gray-50 p-3 rounded-md border border-gray-100">
                      <div className="grid grid-cols-2 gap-3">
                        <ul className="list-disc pl-5 space-y-2 text-gray-500">
                          <li className={formData.password.length >= 8 ? "text-green-600" : ""}>
                            At least 8 characters
                          </li>
                          <li className={/[A-Z]/.test(formData.password) ? "text-green-600" : ""}>
                            At least one uppercase letter
                          </li>
                          <li className={/[a-z]/.test(formData.password) ? "text-green-600" : ""}>
                            At least one lowercase letter
                          </li>
                        </ul>
                        <ul className="list-disc pl-5 space-y-2 text-gray-500">
                          <li className={/[0-9]/.test(formData.password) ? "text-green-600" : ""}>
                            At least one number
                          </li>
                          <li className={/[^A-Za-z0-9]/.test(formData.password) ? "text-green-600" : ""}>
                            At least one special character
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="group">
                      <label htmlFor="account-type" className="block text-base font-medium text-gray-700 mb-1 group-focus-within:text-[#092140] transition-colors duration-300">
                        Account Type
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                          </svg>
                        </div>
                        <select
                          id="account-type"
                          name="role"
                          required
                          className="appearance-none relative block w-full pl-10 px-3 py-2 text-base border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#092140] focus:border-[#092140] focus:z-10 transition-all duration-300"
                          value={formData.role}
                          onChange={handleChange}
                        >
                          <option value="">Select account type</option>
                          {roles.map((role) => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                          <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    <div className="group">
                      <label htmlFor="company" className="block text-base font-medium text-gray-700 mb-1 group-focus-within:text-[#092140] transition-colors duration-300">
                        Company
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                          </svg>
                        </div>
                        <select
                          id="company"
                          name="company"
                          required
                          className="appearance-none relative block w-full pl-10 px-3 py-2 text-base border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#092140] focus:border-[#092140] focus:z-10 transition-all duration-300"
                          value={formData.company}
                          onChange={handleChange}
                        >
                          <option value="">Select company</option>
                          {companies.map((company) => (
                            <option key={company} value={company}>
                              {company}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                          <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    <div className="group">
                      <label htmlFor="rank" className="block text-base font-medium text-gray-700 mb-1 group-focus-within:text-[#092140] transition-colors duration-300">
                        Rank
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                          </svg>
                        </div>
                        <select
                          id="rank"
                          name="rank"
                          className="appearance-none relative block w-full pl-10 px-3 py-2 text-base border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#092140] focus:border-[#092140] focus:z-10 transition-all duration-300"
                          value={formData.rank}
                          onChange={handleChange}
                        >
                          <option value="">Select rank</option>
                          {ranks.map((rank) => (
                            <option key={rank} value={rank}>
                              {rank}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                          <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="service-id" className="block text-base font-medium text-gray-700 mb-1 group-focus-within:text-[#092140] transition-colors duration-300">
                      Service ID
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                        </svg>
                      </div>
                      <input
                        id="service-id"
                        name="serviceId"
                        type="text"
                        required
                        className="appearance-none relative block w-full pl-10 px-3 py-2 text-base border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#092140] focus:border-[#092140] focus:z-10 transition-all duration-300"
                        placeholder="Your AFP Service ID number"
                        value={formData.serviceId}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                
                  <div className="flex items-center bg-gray-50 p-3 rounded-md border border-gray-100">
                    <input
                      id="terms-and-privacy"
                      name="terms-and-privacy"
                      type="checkbox"
                      required
                      className="h-5 w-5 text-[#092140] focus:ring-[#D1B000] border-gray-300 rounded transition-all duration-300"
                      checked={agreeToTerms}
                      onChange={(e) => setAgreeToTerms(e.target.checked)}
                    />
                    <label htmlFor="terms-and-privacy" className="ml-2 block text-sm text-gray-700">
                      I agree to the <button type="button" onClick={(e) => {e.preventDefault(); setShowTermsModal(true);}} className="text-[#092140] hover:text-[#D1B000] transition-all duration-300 font-medium underline">Terms of Service</button> and <button type="button" onClick={(e) => {e.preventDefault(); setShowPrivacyModal(true);}} className="text-[#092140] hover:text-[#D1B000] transition-all duration-300 font-medium underline">Privacy Policy</button>
                    </label>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={isLoading || (formData.password !== formData.confirmPassword) || !agreeToTerms}
                      className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-lg font-medium rounded-md text-[#092140] bg-[#D1B000] hover:bg-[#c0a000] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D1B000] transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1 ${(isLoading || (formData.password !== formData.confirmPassword) || !agreeToTerms) ? 'opacity-70 cursor-not-allowed' : ''}`}
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
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-[#092140] group-hover:text-[#092140]">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                            </svg>
                          </span>
                          Register
                        </>
                      )}
                    </button>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-base text-gray-600">
                      Already have an account?{" "}
                      <Link href="/login" className="font-medium text-[#092140] hover:text-[#D1B000] transition-all duration-300">
                        Sign in
                      </Link>
                    </p>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Terms of Service Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto animate-slideInUp">
            <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-[#092140]">Terms of Service</h3>
              <button 
                onClick={() => setShowTermsModal(false)}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <h4 className="text-lg font-medium text-[#092140] mb-2">1. Introduction</h4>
                <p className="text-gray-700 mb-3">
                  Welcome to the 301st Ready Reserve Infantry Battalion Personnel Management System. These Terms of Service govern your use of our platform and services.
                </p>
              </div>
              
              <div className="mb-4">
                <h4 className="text-lg font-medium text-[#092140] mb-2">2. Use of Services</h4>
                <p className="text-gray-700 mb-3">
                  This system is intended for authorized personnel of the 301st Ready Reserve Infantry Battalion. Unauthorized access is prohibited.
                </p>
                <p className="text-gray-700 mb-3">
                  You are responsible for maintaining the confidentiality of your account information and password.
                </p>
              </div>
              
              <div className="mb-4">
                <h4 className="text-lg font-medium text-[#092140] mb-2">3. Data Handling</h4>
                <p className="text-gray-700 mb-3">
                  All information entered into the system is subject to military information security protocols and guidelines.
                </p>
              </div>
              
              <div className="mb-4">
                <h4 className="text-lg font-medium text-[#092140] mb-2">4. Modifications to Service</h4>
                <p className="text-gray-700 mb-3">
                  We reserve the right to modify or discontinue the service at any time, with or without notice.
                </p>
              </div>
              
              <div className="mb-4">
                <h4 className="text-lg font-medium text-[#092140] mb-2">5. Termination</h4>
                <p className="text-gray-700 mb-3">
                  We may terminate or suspend your account at any time for any reason, including breach of these Terms.
                </p>
              </div>
            </div>
            <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-end">
              <button 
                onClick={() => setShowTermsModal(false)} 
                className="px-4 py-2 bg-[#092140] text-white rounded-md hover:bg-[#0a2d5a] transition-colors"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto animate-slideInUp">
            <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-[#092140]">Privacy Policy</h3>
              <button 
                onClick={() => setShowPrivacyModal(false)}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <h4 className="text-lg font-medium text-[#092140] mb-2">1. Information Collection</h4>
                <p className="text-gray-700 mb-3">
                  The 301st Ready Reserve Infantry Battalion Personnel Management System collects personal information necessary for personnel management and administrative functions.
                </p>
              </div>
              
              <div className="mb-4">
                <h4 className="text-lg font-medium text-[#092140] mb-2">2. Use of Information</h4>
                <p className="text-gray-700 mb-3">
                  Personal information is used for official battalion operations, administrative tasks, and communication purposes.
                </p>
                <p className="text-gray-700 mb-3">
                  Information may be shared within the military chain of command on a need-to-know basis.
                </p>
              </div>
              
              <div className="mb-4">
                <h4 className="text-lg font-medium text-[#092140] mb-2">3. Data Security</h4>
                <p className="text-gray-700 mb-3">
                  We implement appropriate security measures to protect personal information from unauthorized access and disclosure.
                </p>
              </div>
              
              <div className="mb-4">
                <h4 className="text-lg font-medium text-[#092140] mb-2">4. Data Retention</h4>
                <p className="text-gray-700 mb-3">
                  Personal information is retained in accordance with military records management policies.
                </p>
              </div>
              
              <div className="mb-4">
                <h4 className="text-lg font-medium text-[#092140] mb-2">5. Your Rights</h4>
                <p className="text-gray-700 mb-3">
                  You have the right to request access to, correction of, or deletion of your personal information, subject to military regulations.
                </p>
              </div>
            </div>
            <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-end">
              <button 
                onClick={() => setShowPrivacyModal(false)} 
                className="px-4 py-2 bg-[#092140] text-white rounded-md hover:bg-[#0a2d5a] transition-colors"
              >
                I Understand
              </button>
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