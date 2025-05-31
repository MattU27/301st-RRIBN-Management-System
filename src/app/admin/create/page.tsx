"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/ui/Card';
import Link from 'next/link';
import { UserPlusIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Company } from '@/models/User';
import axios from 'axios';

export default function CreateAdministratorPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    alternativeEmail: '',
    password: '',
    confirmPassword: '',
    rank: '',
    company: '',
    role: 'administrator',
    serviceId: ''
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }

      if (user?.role !== 'director') {
        router.push('/dashboard');
        return;
      }

      setLoading(false);
    }
  }, [isLoading, isAuthenticated, router, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Helper function to validate email
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return false;
    
    // Check if the email domain is allowed
    const allowedDomains = ['gmail.com', 'outlook.com', 'yahoo.com', 'mil.ph'];
    const domain = email.split('@')[1].toLowerCase();
    return allowedDomains.includes(domain);
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) return 'First name is required';
    if (!formData.lastName.trim()) return 'Last name is required';
    if (!formData.email.trim()) return 'Email is required';
    
    // Validate primary email
    if (!isValidEmail(formData.email)) {
      return 'Please provide a valid email address (only gmail.com, outlook.com, yahoo.com, or mil.ph domains are accepted)';
    }
    
    // Validate alternative email if provided
    if (formData.alternativeEmail && !isValidEmail(formData.alternativeEmail)) {
      return 'Please provide a valid alternative email address (only gmail.com, outlook.com, yahoo.com, or mil.ph domains are accepted)';
    }
    
    if (!formData.password) return 'Password is required';
    if (formData.password.length < 8) return 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
    if (!formData.serviceId.trim()) return 'Service ID is required';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    // Validate form
    const error = validateForm();
    if (error) {
      setFormError(error);
      return;
    }

    try {
      setCreating(true);
      
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Prepare user data
      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        alternativeEmail: formData.alternativeEmail || undefined,
        password: formData.password,
        role: formData.role,
        rank: formData.rank || undefined,
        company: formData.company || undefined,
        serviceId: formData.serviceId,
        status: 'pending' // All new accounts are pending until approved
      };
      
      console.log('Submitting user data:', {
        ...userData,
        password: '[REDACTED]'
      });
      
      // Send request to the API
      try {
        const response = await axios.post('/api/auth/register', userData, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data.success) {
          setFormSuccess('Account created successfully! The user will be able to login once the account is approved.');
          // Reset form
          setFormData({
            firstName: '',
            lastName: '',
            email: '',
            alternativeEmail: '',
            password: '',
            confirmPassword: '',
            rank: '',
            company: '',
            role: 'administrator',
            serviceId: ''
          });
        } else {
          setFormError(response.data.error || 'Failed to create account');
        }
      } catch (apiError: any) {
        console.error('API Error Response:', apiError.response?.data);
        console.error('Full error object:', apiError);
        
        // Extract the detailed error message if available
        const errorMessage = apiError.response?.data?.error || 'Failed to create account';
        
        // Check if there are validation errors
        if (apiError.response?.data?.validationErrors?.length > 0) {
          const validationErrors = apiError.response.data.validationErrors;
          setFormError(`${errorMessage}: ${validationErrors.join(', ')}`);
        } else {
          setFormError(errorMessage);
        }
        
        throw apiError;
      }
    } catch (err: any) {
      console.error('Error creating account:', err);
      
      // If the error wasn't handled by the inner catch, use this as a fallback
      if (!formError) {
        setFormError(err.response?.data?.error || err.message || 'An error occurred while creating the account');
      }
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create Administrator Account</h1>
        <Link
          href="/admin/accounts"
          className="px-4 py-2 bg-indigo-100 text-indigo-700 font-medium rounded-md border border-indigo-300 hover:bg-indigo-200 hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm"
        >
          Back to Accounts
        </Link>
      </div>

      <Card>
        <div className="p-6">
          <div className="flex items-center mb-4">
            <UserPlusIcon className="h-8 w-8 text-indigo-600" />
            <h2 className="ml-3 text-lg font-medium text-gray-900">New Account</h2>
          </div>
          <p className="text-gray-600 mb-6">Create a new account with appropriate permissions. The account will be in a pending state until approved.</p>

          {formError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
              <p className="text-sm text-red-600">{formError}</p>
            </div>
          )}

          {formSuccess && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-600">{formSuccess}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-base font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="First name"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-base font-medium text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Last name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-base font-medium text-gray-700 mb-1">
                  AFP Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Email address (mil.ph only)"
                />
              </div>
              <div>
                <label htmlFor="alternativeEmail" className="block text-base font-medium text-gray-700 mb-1">
                  Alternative Email (Personal)
                </label>
                <input
                  type="email"
                  id="alternativeEmail"
                  name="alternativeEmail"
                  value={formData.alternativeEmail}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Alternative email (gmail, outlook, yahoo)"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Used for account recovery
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-base font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Password"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Password must be at least 8 characters long.
                </p>
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-base font-medium text-gray-700 mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Confirm password"
                />
                {formData.password !== formData.confirmPassword && formData.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    Passwords do not match
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="serviceId" className="block text-base font-medium text-gray-700 mb-1">
                Service ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="serviceId"
                name="serviceId"
                value={formData.serviceId}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Your AFP Service ID number"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="role" className="block text-base font-medium text-gray-700 mb-1">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="administrator">Administrator</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
              <div>
                <label htmlFor="rank" className="block text-base font-medium text-gray-700 mb-1">
                  Rank
                </label>
                <select
                  id="rank"
                  name="rank"
                  value={formData.rank}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select Rank</option>
                  {/* Army Officer Ranks - exactly matching MilitaryRank enum values */}
                  <option value="Second Lieutenant">Second Lieutenant</option>
                  <option value="First Lieutenant">First Lieutenant</option>
                  <option value="Captain">Captain</option>
                  <option value="Major">Major</option>
                  <option value="Lieutenant Colonel">Lieutenant Colonel</option>
                  <option value="Colonel">Colonel</option>
                  <option value="Brigadier General">Brigadier General</option>
                  <option value="Major General">Major General</option>
                  <option value="Lieutenant General">Lieutenant General</option>
                  <option value="General">General</option>
                  
                  {/* Army Enlisted Ranks - exactly matching MilitaryRank enum values */}
                  <option value="Private">Private</option>
                  <option value="Private First Class">Private First Class</option>
                  <option value="Corporal">Corporal</option>
                  <option value="Sergeant">Sergeant</option>
                </select>
              </div>
              <div>
                <label htmlFor="company" className="block text-base font-medium text-gray-700 mb-1">
                  Company
                </label>
                <select
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select Company</option>
                  <option value="Alpha">Alpha</option>
                  <option value="Bravo">Bravo</option>
                  <option value="Charlie">Charlie</option>
                  <option value="Headquarters">Headquarters</option>
                  <option value="NERRSC (NERR-Signal Company)">NERRSC (NERR-Signal Company)</option>
                  <option value="NERRFAB (NERR-Field Artillery Battery)">NERRFAB (NERR-Field Artillery Battery)</option>
                </select>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={creating}
                className={`w-full md:w-auto px-4 py-3 ${creating ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center justify-center text-lg`}
              >
                {creating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
} 