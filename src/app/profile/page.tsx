"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { UserIcon, DocumentTextIcon, AcademicCapIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import ConfirmationDialog from '@/components/ConfirmationDialog';
import TwoFactorAuthSetup from '@/components/TwoFactorAuthSetup';
import axios from 'axios';

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    alternativeEmail: '',
    company: '',
    rank: '',
    phone: '',
    address: {
      street: '',
      city: '',
      province: '',
      postalCode: ''
    },
    emergencyContact: {
      name: '',
      relationship: '',
      contactNumber: ''
    }
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Existing useEffect for authentication
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }

    if (user) {
      // Load user profile from API
      loadUserProfile();
    }
  }, [isLoading, isAuthenticated, router, user]);

  const loadUserProfile = async () => {
    try {
      // Get the token
      const token = localStorage.getItem('token');
      if (!token) {
        setErrorMessage('Authentication error. Please log in again.');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
        return;
      }

      // Fetch user profile data
      const response = await axios.get('/api/user/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        const userData = response.data.data.user;
        
        // Set form data with user profile information, ensuring all values are defined
        const newFormData = {
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          alternativeEmail: userData.alternativeEmail || '',
          company: userData.company || '',
          rank: userData.rank || '',
          phone: userData.contactNumber || '',
          address: {
            street: userData.address?.street || '',
            city: userData.address?.city || '',
            province: userData.address?.province || '',
            postalCode: userData.address?.postalCode || ''
          },
          emergencyContact: {
            name: userData.emergencyContact?.name || '',
            relationship: userData.emergencyContact?.relationship || '',
            contactNumber: userData.emergencyContact?.contactNumber || ''
          }
        };
        
        setFormData(newFormData);
      }
    } catch (error: any) {
      // Handle 401 errors (token expired/invalid)
      if (error.response && error.response.status === 401) {
        setErrorMessage('Session expired. Please log in again.');
        // Clear token and redirect to login
        localStorage.removeItem('token');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setErrorMessage('Failed to load profile. Please refresh the page.');
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Handle nested objects
    if (name.includes('.')) {
      const [parentKey, childKey] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [parentKey]: {
          ...(prev[parentKey as keyof typeof prev] as Record<string, string>),
          [childKey]: value
        }
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    // Validate required fields before submitting
    if (!formData.rank) {
      setErrorMessage('Please select a rank before saving.');
      setIsSubmitting(false);
      return;
    }

    try {
      // Get the token
      const token = localStorage.getItem('token');
      if (!token) {
        setErrorMessage('Authentication error. Please log in again.');
        setIsSubmitting(false);
        setTimeout(() => {
          router.push('/login');
        }, 2000);
        return;
      }

      // Prepare update data
      const updateData = {
        firstName: formData.firstName || '',
        lastName: formData.lastName || '',
        contactNumber: formData.phone || '',
        alternativeEmail: formData.alternativeEmail || '',
        address: formData.address || {
          street: '',
          city: '',
          province: '',
          postalCode: ''
        },
        emergencyContact: formData.emergencyContact || {
          name: '',
          relationship: '',
          contactNumber: ''
        },
        rank: formData.rank,
        company: formData.company || ''
      };

      // Send update to API
      const response = await axios.put('/api/user/profile', updateData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setSuccessMessage('Profile updated successfully!');
        setIsEditing(false);
        
        // Reload profile to ensure we have the latest data
        await loadUserProfile();
      } else {
        throw new Error(response.data.error || 'Failed to update profile');
      }
    } catch (error: any) {
      // Handle 401 errors (token expired/invalid)
      if (error.response && error.response.status === 401) {
        if (error.response.data && error.response.data.error && error.response.data.error.includes('rank')) {
          setErrorMessage('Please select a valid rank.');
        } else {
          setErrorMessage('Session expired. Please log in again.');
          // Clear token and redirect to login
          localStorage.removeItem('token');
          setTimeout(() => {
            router.push('/login');
          }, 2000);
        }
      } else {
        setErrorMessage(error.response?.data?.error || error.message || 'Failed to update profile');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccountClick = () => {
    setShowDeleteConfirmation(true);
  };

  const handleDeleteAccount = async () => {
    // In a real app, you would make an API call to delete the user's account
    router.push('/login');
  };

  const handle2FASetup = () => {
    setShow2FASetup(true);
  };

  const handle2FAComplete = async (secret: string, backupCodes: string[]) => {
    try {
      // In a real app, you would make an API call to save the 2FA settings
      setIs2FAEnabled(true);
      setShow2FASetup(false);
    } catch (error) {
      // Silent error handling for now
    }
  };

  const handle2FACancel = () => {
    setShow2FASetup(false);
  };

  const handle2FADisable = () => {
    // In a real app, you would make an API call to disable 2FA
    setIs2FAEnabled(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const companies = ['Alpha', 'Bravo', 'Charlie', 'Headquarters', 'NERRSC (NERR-Signal Company)', 'NERRFAB (NERR-Field Artillery Battery)'];
  const ranks = ['Private', 'Private First Class', 'Corporal', 'Sergeant', 'Second Lieutenant', 'First Lieutenant', 'Captain', 'Major', 'Lieutenant Colonel', 'Colonel', 'Brigadier General'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="bg-indigo-100 rounded-full p-3">
              <UserIcon className="h-8 w-8 text-indigo-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-medium text-gray-900">My Profile</h2>
              <p className="text-sm text-gray-500">
                {(user.role as string) === 'administrator' ? 'Administrator' : 
                 (user.role as string) === 'super_administrator' ? 'Super Administrator' : 
                 (user.role as string) === 'staff' ? 'Staff Officer' : 
                 user.role}
              </p>
            </div>
            <div className="ml-auto">
              {isEditing ? (
                <div className="flex space-x-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="button"
                    isLoading={isSubmitting}
                    onClick={handleSubmit}
                  >
                    Save Changes
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}
        
        {successMessage && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Information Column */}
          <div className="lg:col-span-2">
            <Card title="Personal Information">
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      placeholder="Enter your first name"
                      value={formData.firstName}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      placeholder="Enter your last name"
                      value={formData.lastName}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={true} // Email cannot be changed
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="alternativeEmail" className="block text-sm font-medium text-gray-700">
                      Alternative Email
                    </label>
                    <input
                      id="alternativeEmail"
                      name="alternativeEmail"
                      type="email"
                      placeholder="Enter your alternative email"
                      value={formData.alternativeEmail}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      This email can also be used for login and password recovery
                    </p>
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="text"
                      placeholder="Enter your phone number"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                      Company
                    </label>
                    <select
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md disabled:bg-gray-100 disabled:text-gray-500"
                    >
                      <option value="">Select Company</option>
                      {companies.map((company) => (
                        <option key={company} value={company}>
                          {company}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="rank" className="block text-sm font-medium text-gray-700">
                      Rank
                    </label>
                    <select
                      id="rank"
                      name="rank"
                      value={formData.rank}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md disabled:bg-gray-100 disabled:text-gray-500"
                    >
                      <option value="">Select Rank</option>
                      {ranks.map((rank) => (
                        <option key={rank} value={rank}>
                          {rank}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </form>
            </Card>
            
            <div className="mt-6">
              <Card title="Address Information">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="address.street" className="block text-sm font-medium text-gray-700">
                      Street Address
                    </label>
                    <input
                      id="address.street"
                      name="address.street"
                      type="text"
                      placeholder="Enter street address"
                      value={formData.address.street}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="address.city" className="block text-sm font-medium text-gray-700">
                      City
                    </label>
                    <input
                      id="address.city"
                      name="address.city"
                      type="text"
                      placeholder="Enter city"
                      value={formData.address.city}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="address.province" className="block text-sm font-medium text-gray-700">
                      Province
                    </label>
                    <input
                      id="address.province"
                      name="address.province"
                      type="text"
                      placeholder="Enter province"
                      value={formData.address.province}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="address.postalCode" className="block text-sm font-medium text-gray-700">
                      Postal Code
                    </label>
                    <input
                      id="address.postalCode"
                      name="address.postalCode"
                      type="text"
                      placeholder="Enter postal code"
                      value={formData.address.postalCode}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
                    />
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <Card title="Emergency Contact">
              <div className="space-y-4">
                <div>
                  <label htmlFor="emergencyContact.name" className="block text-sm font-medium text-gray-700">
                    Contact Name
                  </label>
                  <input
                    id="emergencyContact.name"
                    name="emergencyContact.name"
                    type="text"
                    placeholder="Enter emergency contact name"
                    value={formData.emergencyContact.name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label htmlFor="emergencyContact.relationship" className="block text-sm font-medium text-gray-700">
                    Relationship
                  </label>
                  <input
                    id="emergencyContact.relationship"
                    name="emergencyContact.relationship"
                    type="text"
                    placeholder="Enter relationship"
                    value={formData.emergencyContact.relationship}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label htmlFor="emergencyContact.contactNumber" className="block text-sm font-medium text-gray-700">
                    Contact Phone
                  </label>
                  <input
                    id="emergencyContact.contactNumber"
                    name="emergencyContact.contactNumber"
                    type="text"
                    placeholder="Enter emergency contact phone"
                    value={formData.emergencyContact.contactNumber}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>
              </div>
            </Card>

            <Card title="Account Settings">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h3>
                  
                  {is2FAEnabled ? (
                    <div className="mt-2">
                      <div className="flex items-center mb-2">
                        <ShieldCheckIcon className="h-4 w-4 text-green-500 mr-1" />
                        <span className="text-xs text-green-600 font-medium">2FA enabled</span>
                      </div>
                      <Button 
                        size="sm" 
                        variant="danger" 
                        onClick={handle2FADisable}
                      >
                        Disable 2FA
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      className="mt-2"
                      onClick={handle2FASetup}
                    >
                      Enable 2FA
                    </Button>
                  )}
                </div>
                
                <div className="pt-2 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900">Delete Account</h3>
                  <p className="text-xs text-gray-500 mt-1">Permanently delete your account.</p>
                  <Button 
                    size="sm" 
                    variant="danger" 
                    className="mt-2"
                    onClick={handleDeleteAccountClick}
                  >
                    Delete Account
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <ConfirmationDialog
          isOpen={showDeleteConfirmation}
          title="Delete Account"
          message="Are you sure you want to delete your account? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleDeleteAccount}
          onClose={() => setShowDeleteConfirmation(false)}
        />

        {/* 2FA Setup Modal */}
        {show2FASetup && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
              <TwoFactorAuthSetup
                onComplete={handle2FAComplete}
                onCancel={handle2FACancel}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 