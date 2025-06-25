'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  UserGroupIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  UserPlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  BuildingOfficeIcon,
  ChevronDownIcon,
  ArrowPathIcon,
  UserCircleIcon,
  ChartBarIcon,
  DocumentArrowDownIcon,
  XMarkIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import PersonnelModal from '@/components/PersonnelModal';
import { Personnel, PersonnelStatus, CompanyType, RankType } from '@/types/personnel';
import { UserRole } from '@/types/auth';
import ConfirmationDialog from '@/components/ConfirmationDialog';
import PermissionGuard from '@/components/PermissionGuard';
import { useRouter } from 'next/navigation';
import { auditService } from '@/utils/auditService';
import { AuditAction } from '@/models/AuditLog';
import { getRankDisplayName, getCompanyDisplayName } from '@/utils/formatters';
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import ApproveAccountsModal from './accounts/modal';
import SyncStatusButton from '@/components/SyncStatusButton';
import mongoose from 'mongoose';

const COMPANIES: CompanyType[] = ['Alpha', 'Bravo', 'Charlie', 'Headquarters', 'NERRSC (NERR-Signal Company)', 'NERRFAB (NERR-Field Artillery Battery)'];
const STATUS_OPTIONS: PersonnelStatus[] = ['ready', 'standby', 'retired'];

const ITEMS_PER_PAGE = 10;

// Toast notification component
interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const Toast = ({ message, type, onClose }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  return (
    <div className="fixed right-4 bottom-4 z-50 animate-fade-in-up">
      <div className={`flex items-center p-4 rounded-lg shadow-lg ${
        type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {type === 'success' ? (
          <CheckCircleIcon className="mr-2 w-5 h-5" />
        ) : (
          <XCircleIcon className="mr-2 w-5 h-5" />
        )}
        <span>{message}</span>
        <button 
          onClick={onClose}
          className="ml-4 text-gray-500 hover:text-gray-700"
        >
          <XCircleIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// SearchInput component separated for better focus management
const SearchInput = ({ value, onChange }: { value: string, onChange: (value: string) => void }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = "personnel-search";
  
  // Handle change with direct value manipulation
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault(); // Prevent default behavior
    e.stopPropagation(); // Stop event propagation
    onChange(e.target.value);
  };

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      // Focus the input element when component mounts
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  }, []);

  return (
    <div className="relative w-full md:w-64">
      <label htmlFor={inputId} className="sr-only">Search personnel</label>
      <input
        ref={inputRef}
        id={inputId}
        type="text"
        placeholder="Search personnel..."
        className="py-2 pr-4 pl-4 w-full rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        value={value}
        onChange={handleChange}
        autoComplete="off"
        spellCheck="false"
        aria-label="Search personnel by name, rank, email or service number"
      />
    </div>
  );
};

// FilterDropdown component for consistent styling
const FilterDropdown = ({ 
  value, 
  onChange, 
  options, 
  label 
}: { 
  value: string, 
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, 
  options: {value: string, label: string}[],
  label: string
}) => {
  const id = `filter-${label.toLowerCase().replace(/\s/g, '-')}`;
  
  return (
    <div className="relative w-full md:w-auto">
      <label htmlFor={id} className="sr-only">{label}</label>
      <select
        id={id}
        className="py-2 pr-8 pl-3 w-full rounded-lg border border-gray-300 appearance-none md:w-40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        value={value}
        onChange={onChange}
        aria-label={label}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      <div className="flex absolute inset-y-0 right-0 items-center px-2 text-gray-700 pointer-events-none">
        <svg className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
        </svg>
      </div>
    </div>
  );
};

// Add new component for Personnel Account Form Modal
interface PersonnelAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Personnel>) => Promise<void>;
}

const PersonnelAccountModal = ({ isOpen, onClose, onSave }: PersonnelAccountModalProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  const [formData, setFormData] = useState<Partial<Personnel>>({
    name: '',
    email: '',
    rank: '' as RankType,
    company: '' as CompanyType,
    serviceNumber: '',
    phoneNumber: '',
    status: 'standby' as PersonnelStatus,
    role: 'reservist' as UserRole,
    dateJoined: new Date().toISOString().split('T')[0],
    trainings: [],
    documents: []
  });
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Check if user has admin role
  const isAdmin = user?.role === 'administrator' || user?.role === 'director';

  // Validation schema for personnel form
  const personnelSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address').refine(
      (email) => {
        const allowedDomains = ['gmail.com', 'outlook.com', 'yahoo.com', 'mil.ph'];
        const domain = email.split('@')[1]?.toLowerCase();
        return allowedDomains.includes(domain);
      },
      { message: 'Only gmail.com, outlook.com, yahoo.com, and mil.ph domains are allowed' }
    ),
    rank: z.string().min(1, 'Rank is required'),
    company: z.string().min(1, 'Company is required'),
    serviceNumber: z.string().min(1, 'Service number is required'),
    phoneNumber: z.string().optional(),
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setActiveTab('single');
      setFormData({
        name: '',
        email: '',
        rank: '' as RankType,
        company: '' as CompanyType,
        serviceNumber: '',
        phoneNumber: '',
        status: 'standby' as PersonnelStatus,
        role: 'reservist' as UserRole,
        dateJoined: new Date().toISOString().split('T')[0],
        trainings: [],
        documents: []
      });
      setBulkFile(null);
      setErrors({});
      setIsSubmitting(false);
      setIsUploading(false);
    }
  }, [isOpen]);

  // Validate a field
  const validateField = (name: string, value: any) => {
    // Clear error for this field
    setErrors(prev => ({ ...prev, [name]: '' }));
    
    // Validate the field
    try {
      if (personnelSchema.shape[name as keyof typeof personnelSchema.shape]) {
        personnelSchema.shape[name as keyof typeof personnelSchema.shape].parse(value);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({ ...prev, [name]: error.errors[0]?.message || `Invalid ${name}` }));
      }
    }
  };

  // Handle input change for single personnel form
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  // Handle form submission for single personnel
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Validate all fields
    let isValid = true;
    const newErrors: Record<string, string> = {};
    
    Object.entries(formData).forEach(([key, value]) => {
      if (personnelSchema.shape[key as keyof typeof personnelSchema.shape]) {
        try {
          personnelSchema.shape[key as keyof typeof personnelSchema.shape].parse(value);
        } catch (error) {
          if (error instanceof z.ZodError) {
            isValid = false;
            newErrors[key] = error.errors[0]?.message || `Invalid ${key}`;
          }
        }
      }
    });
    
    setErrors(newErrors);
    
    if (!isValid) {
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Prepare data with required fields for API
      const personnelData = {
        ...formData,
        dateJoined: new Date().toISOString().split('T')[0],
        trainings: [],
        documents: [],
        status: 'standby' as PersonnelStatus,
        role: 'reservist' as UserRole
      };
      
      console.log('Submitting personnel data:', personnelData);
      
      // Call the onSave function with prepared data
      await onSave(personnelData);
      onClose();
    } catch (error) {
      console.error('Failed to save personnel:', error);
      // Using toast from react-hot-toast instead of setToast
      toast.error(error instanceof Error ? `Failed to save personnel: ${error.message}` : 'Failed to save personnel. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle bulk upload file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBulkFile(e.target.files[0]);
    }
  };

  // Handle bulk upload submission
  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkFile) return;
    
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', bulkFile);
      
      const response = await fetch('/api/personnel/bulk', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        onClose();
      } else {
        throw new Error(result.error || 'Failed to upload personnel');
      }
    } catch (error) {
      console.error('Failed to upload personnel:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // Download template for bulk upload
  const downloadTemplate = () => {
    // Create a CSV template
    const headers = ['name', 'email', 'rank', 'company', 'serviceNumber', 'phoneNumber', 'status'];
    const template = headers.join(',');
    
    // Create download link
    const element = document.createElement('a');
    const file = new Blob([template], {type: 'text/csv'});
    element.href = URL.createObjectURL(file);
    element.download = 'personnel_template.csv';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (!isOpen) return null;

  return (
    <div className="overflow-y-auto fixed inset-0 z-50">
      <div className="flex justify-center items-center px-4 pt-4 pb-20 min-h-screen text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        {/* Modal panel */}
        <div className="inline-block overflow-hidden text-left align-bottom bg-white rounded-lg shadow-xl transition-all transform sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          {/* Close button */}
          <div className="block absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="text-gray-400 bg-white rounded-md hover:text-gray-500 focus:outline-none"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="w-6 h-6" aria-hidden="true" />
            </button>
          </div>

          {/* Modal content */}
          <div className="p-6 bg-white">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 w-full text-center sm:ml-4 sm:mt-0 sm:text-left">
                <h3 className="text-lg font-semibold leading-6 text-gray-900">
                  Add Personnel Account
                </h3>
                
                {/* Admin-only warning for staff users */}
                {!isAdmin && (
                  <div className="p-3 mt-4 bg-amber-50 rounded-md border border-amber-300">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-amber-800">Admin Access Required</h3>
                        <div className="mt-1 text-sm text-amber-700">
                          <p>Only users with administrator privileges can add personnel. Please contact an administrator for assistance.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Only show forms if user is admin */}
                {isAdmin ? (
                  <>
                    {/* Tab selection */}
                    <div className="mt-4 mb-6 border-b border-gray-200">
                      <div className="flex -mb-px">
                        <button
                          className={`py-2 px-4 text-sm font-medium ${
                            activeTab === 'single'
                              ? 'border-b-2 border-indigo-500 text-indigo-600'
                              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                          onClick={() => setActiveTab('single')}
                        >
                          Create a Personnel
                        </button>
                        <button
                          className={`ml-8 py-2 px-4 text-sm font-medium ${
                            activeTab === 'bulk'
                              ? 'border-b-2 border-indigo-500 text-indigo-600'
                              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                          onClick={() => setActiveTab('bulk')}
                        >
                          Bulk Upload
                        </button>
                      </div>
                    </div>
                    
                    {/* Single personnel form */}
                    {activeTab === 'single' && (
                      <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                          <div>
                            <label htmlFor="name" className="block mb-1 text-sm font-medium text-gray-700">
                              Full Name*
                            </label>
                            <input
                              type="text"
                              id="name"
                              name="name"
                              value={formData.name || ''}
                              onChange={handleChange}
                              className={`block w-full rounded-md border ${
                                errors.name ? 'border-red-300' : 'border-gray-300'
                              } shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2`}
                              required
                            />
                            {errors.name && (
                              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                            )}
                          </div>
                          
                          <div>
                            <label htmlFor="email" className="block mb-1 text-sm font-medium text-gray-700">
                              Email*
                            </label>
                            <input
                              type="email"
                              id="email"
                              name="email"
                              value={formData.email || ''}
                              onChange={handleChange}
                              className={`block w-full rounded-md border ${
                                errors.email ? 'border-red-300' : 'border-gray-300'
                              } shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2`}
                              required
                            />
                            {errors.email && (
                              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                            )}
                            <p className="mt-1 text-xs text-gray-500">
                              Only gmail.com, outlook.com, yahoo.com, and mil.ph domains are accepted.
                            </p>
                          </div>
                          
                          <div>
                            <label htmlFor="rank" className="block mb-1 text-sm font-medium text-gray-700">
                              Rank*
                            </label>
                            <select
                              id="rank"
                              name="rank"
                              value={formData.rank || ''}
                              onChange={handleChange}
                              className={`block w-full rounded-md border ${
                                errors.rank ? 'border-red-300' : 'border-gray-300'
                              } shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2`}
                              required
                            >
                              <option value="">Select Rank</option>
                              {['Private', 'Private First Class', 'Corporal', 'Sergeant', 'Second Lieutenant', 'First Lieutenant', 'Captain', 'Major', 'Lieutenant Colonel', 'Colonel', 'Brigadier General'].map((rank) => (
                                <option key={rank} value={rank}>
                                  {rank}
                                </option>
                              ))}
                            </select>
                            {errors.rank && (
                              <p className="mt-1 text-sm text-red-600">{errors.rank}</p>
                            )}
                          </div>
                          
                          <div>
                            <label htmlFor="company" className="block mb-1 text-sm font-medium text-gray-700">
                              Company*
                            </label>
                            <select
                              id="company"
                              name="company"
                              value={formData.company || ''}
                              onChange={handleChange}
                              className={`block w-full rounded-md border ${
                                errors.company ? 'border-red-300' : 'border-gray-300'
                              } shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2`}
                              required
                            >
                              <option value="">Select Company</option>
                              {['Alpha', 'Bravo', 'Charlie', 'Headquarters', 'NERRSC (NERR-Signal Company)', 'NERRFAB (NERR-Field Artillery Battery)'].map((company) => (
                                <option key={company} value={company}>
                                  {company}
                                </option>
                              ))}
                            </select>
                            {errors.company && (
                              <p className="mt-1 text-sm text-red-600">{errors.company}</p>
                            )}
                          </div>
                          
                          <div>
                            <label htmlFor="serviceNumber" className="block mb-1 text-sm font-medium text-gray-700">
                              Service Number*
                            </label>
                            <input
                              type="text"
                              id="serviceNumber"
                              name="serviceNumber"
                              value={formData.serviceNumber || ''}
                              onChange={handleChange}
                              className={`block w-full rounded-md border ${
                                errors.serviceNumber ? 'border-red-300' : 'border-gray-300'
                              } shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2`}
                              required
                            />
                            {errors.serviceNumber && (
                              <p className="mt-1 text-sm text-red-600">{errors.serviceNumber}</p>
                            )}
                          </div>
                          
                          <div>
                            <label htmlFor="phoneNumber" className="block mb-1 text-sm font-medium text-gray-700">
                              Phone Number (Optional)
                            </label>
                            <input
                              type="text"
                              id="phoneNumber"
                              name="phoneNumber"
                              value={formData.phoneNumber || ''}
                              onChange={handleChange}
                              className="block p-2 w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                        </div>
                        
                        <div className="flex justify-end mt-6 space-x-3">
                          <Button
                            variant="secondary"
                            onClick={onClose}
                            className="text-sm"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            variant="primary"
                            disabled={isSubmitting}
                            className="text-sm"
                          >
                            {isSubmitting ? 'Adding Personnel...' : 'Add Personnel'}
                          </Button>
                        </div>
                      </form>
                    )}
                    
                    {/* Bulk upload form */}
                    {activeTab === 'bulk' && (
                      <div>
                        <div className="p-4 mb-6 bg-blue-50 rounded-md">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="w-5 h-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="flex-1 ml-3 md:flex md:justify-between">
                              <p className="text-sm text-blue-700">
                                Upload a CSV file with personnel data. The file should have a header row with the following columns: name, email, rank, company, serviceNumber, phoneNumber, status.
                              </p>
                              <p className="mt-3 text-sm md:mt-0 md:ml-6">
                                <button
                                  onClick={downloadTemplate}
                                  className="font-medium text-blue-700 whitespace-nowrap hover:text-blue-600"
                                >
                                  Download Template
                                </button>
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <form onSubmit={handleBulkUpload}>
                          <div className="mb-6">
                            <label htmlFor="bulk-file" className="block mb-1 text-sm font-medium text-gray-700">
                              Personnel CSV File*
                            </label>
                            <div className="flex justify-center px-6 pt-5 pb-6 mt-1 rounded-md border-2 border-gray-300 border-dashed">
                              <div className="space-y-1 text-center">
                                <svg className="mx-auto w-12 h-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <div className="flex text-sm text-gray-600">
                                  <label
                                    htmlFor="bulk-file"
                                    className="relative font-medium text-indigo-600 bg-white rounded-md cursor-pointer hover:text-indigo-500"
                                  >
                                    <span>Upload a file</span>
                                    <input id="bulk-file" name="bulk-file" type="file" accept=".csv" className="sr-only" onChange={handleFileChange} />
                                  </label>
                                  <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-gray-500">CSV file up to 10MB</p>
                              </div>
                            </div>
                            {bulkFile && (
                              <p className="mt-2 text-sm text-gray-600">
                                Selected file: {bulkFile.name}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex justify-end mt-6 space-x-3">
                            <Button
                              variant="secondary"
                              onClick={onClose}
                              className="text-sm"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              variant="primary"
                              disabled={!bulkFile || isUploading}
                              className="text-sm"
                            >
                              {isUploading ? 'Uploading...' : 'Upload Personnel'}
                            </Button>
                          </div>
                        </form>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex justify-end mt-6">
                    <Button
                      variant="secondary"
                      onClick={onClose}
                      className="text-sm"
                    >
                      Close
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function PersonnelPage() {
  const { user, hasPermission, hasSpecificPermission } = useAuth();
  const router = useRouter();
  const [allPersonnel, setAllPersonnel] = useState<Personnel[]>([]);
  const [filteredPersonnel, setFilteredPersonnel] = useState<Personnel[]>([]);
  
  // Create separate state variables for input and filters
  const [searchValue, setSearchValue] = useState("");
  const [filterStatus, setFilterStatus] = useState<PersonnelStatus | 'All'>('ready');
  const [filterCompany, setFilterCompany] = useState<CompanyType | 'All'>('All');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPersonnel, setSelectedPersonnel] = useState<Personnel | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
  const [personnelToDelete, setPersonnelToDelete] = useState<Personnel | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  // Add new state for add personnel modal
  const [isAddPersonnelModalOpen, setIsAddPersonnelModalOpen] = useState(false);
  
  // Add state for approve accounts modal
  const [showApproveModal, setShowApproveModal] = useState(false);
  
  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Track recently modified personnel for animations
  const [recentlyModified, setRecentlyModified] = useState<string | null>(null);
  
  // Track selected personnel for status update
  const [selectedPersonnelForStatus, setSelectedPersonnelForStatus] = useState<Personnel | null>(null);
  
  // Function to fetch all personnel data
  const fetchAllPersonnel = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching all personnel data...');
      
      // Set limit=0 to retrieve all personnel records without pagination
      const response = await fetch(`/api/personnel?limit=0`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Process the data
        let personnelData = data.data.personnel || [];
        
        console.log(`Loaded ${personnelData.length} personnel records from API`);
        
        // Map MongoDB _id to id for frontend compatibility and normalize status values
        personnelData = personnelData.map((person: any) => {
          // Normalize status to match our allowed values
          const normalizedStatus = normalizeStatus(person.status);
          
          // Make sure to properly process the company field using our getCompanyDisplayName utility
          const companyDisplayName = getCompanyDisplayName(person.company);
          
          return {
            ...person,
            id: person._id || person.id,
            status: normalizedStatus,
            // Use the properly mapped company display name
            company: companyDisplayName, 
            lastUpdated: person.lastUpdated ? new Date(person.lastUpdated).toLocaleDateString() : new Date().toLocaleDateString()
          };
        });
        
        setAllPersonnel(personnelData);
        setFilteredPersonnel(personnelData);
        
        // Set pagination data
        const totalPagesCount = Math.ceil(personnelData.length / ITEMS_PER_PAGE);
        setTotalPages(totalPagesCount);
        console.log(`Setting total pages to ${totalPagesCount} (${personnelData.length} items at ${ITEMS_PER_PAGE} per page)`);
        setInitialLoadComplete(true);
      } else {
        throw new Error(data.error || 'Failed to fetch personnel');
      }
    } catch (error) {
      console.error('Failed to fetch personnel:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to apply filters to personnel data
  const applyFilters = (personnelData: Personnel[]) => {
    const filtered = personnelData.filter(person => {
      // Search filter
      const searchTerm = searchValue.toLowerCase();
      const searchMatch = searchValue === '' || 
        (person.name?.toLowerCase().includes(searchTerm)) ||
        (person.rank?.toLowerCase().includes(searchTerm)) ||
        (person.email?.toLowerCase().includes(searchTerm)) ||
        (typeof person.serviceNumber === 'string' && person.serviceNumber.toLowerCase().includes(searchTerm));
      
      // Company & status filters
      const companyMatch = filterCompany === 'All' || person.company === filterCompany;
      const statusMatch = filterStatus === 'All' || person.status === filterStatus;
      
      return searchMatch && companyMatch && statusMatch;
    });
    
    setFilteredPersonnel(filtered);
  };

  // Check if user has permission to view personnel
  const hasViewPermission = hasSpecificPermission('view_company_personnel') || 
                           hasSpecificPermission('view_all_personnel');

  // Load all personnel data once
  useEffect(() => {
    fetchAllPersonnel();
  }, []);

  // Helper function to normalize status values
  const normalizeStatus = (status: string): PersonnelStatus => {
    const validStatuses: PersonnelStatus[] = ['ready', 'standby', 'retired'];
    
    // Return the status if it's already valid
    if (validStatuses.includes(status?.toLowerCase() as PersonnelStatus)) {
      return status.toLowerCase() as PersonnelStatus;
    }
    
    // Map other statuses to one of the three allowed statuses
    const statusLower = status?.toLowerCase() || '';
    
    if (statusLower === 'active' || statusLower === 'pending') {
      return 'standby';
    }
    
    if (statusLower === 'inactive' || statusLower === 'medical' || statusLower === 'leave') {
      return 'retired';
    }
    
    // Default fallback to retired
    return 'retired';
  };

  // Client-side filtering effect
  useEffect(() => {
    if (!initialLoadComplete) return;
    
    // Filter personnel
    const filtered = allPersonnel.filter(person => {
      // Search filter
      const searchTerm = searchValue.toLowerCase();
      const searchMatch = searchValue === '' || 
        (person.name?.toLowerCase().includes(searchTerm)) ||
        (person.rank?.toLowerCase().includes(searchTerm)) ||
        (person.email?.toLowerCase().includes(searchTerm)) ||
        (typeof person.serviceNumber === 'string' && person.serviceNumber.toLowerCase().includes(searchTerm));
      
      // Company & status filters
      const companyMatch = filterCompany === 'All' || person.company === filterCompany;
      const statusMatch = filterStatus === 'All' || person.status === filterStatus;
      
      return searchMatch && companyMatch && statusMatch;
    });
    
    setFilteredPersonnel(filtered);
    setTotalPages(Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE)));
    
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [searchValue, filterCompany, filterStatus, allPersonnel, initialLoadComplete]);

  // Handle search input change separately to avoid rendering issues
  const handleSearchChange = (value: string) => {
    setSearchValue(value);
  };

  // Get current page data
  const currentPersonnel = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    
    // Log pagination information for debugging
    console.log(`Pagination: Page ${currentPage}, showing items ${startIndex+1}-${Math.min(endIndex, filteredPersonnel.length)} of ${filteredPersonnel.length}`);
    
    return filteredPersonnel.slice(startIndex, endIndex);
  }, [filteredPersonnel, currentPage, ITEMS_PER_PAGE]);

  // Company filter options
  const companyOptions = [
    { value: 'All', label: 'All Companies' },
    ...COMPANIES.map(company => ({ 
      value: company, 
      label: company 
    }))
  ];

  // Status filter options
  const statusOptions = [
    { value: 'All', label: 'All Status' },
    { value: 'ready', label: 'Ready' },
    { value: 'standby', label: 'Standby' },
    { value: 'retired', label: 'Retired' }
  ];

  // Modal handlers
  const handleView = (person: Personnel) => {
    setSelectedPersonnel(person);
    setModalMode('view');
    setIsModalOpen(true);
    
    // Log this view action to the audit system
    if (user && user._id) {
      auditService.logPersonnelAction(
        user._id,
        `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        user.role,
        'view' as AuditAction,
        person.id,
        person.name
      ).catch(error => console.error('Failed to log personnel view:', error));
    }
  };

  const handleEdit = (person: Personnel) => {
    setSelectedPersonnel(person);
    setModalMode('edit');
    setIsModalOpen(true);
    
    // Log this edit action to the audit system
    if (user && user._id) {
      auditService.logPersonnelAction(
        user._id,
        `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        user.role,
        'update' as AuditAction,
        person.id,
        person.name
      ).catch(error => console.error('Failed to log personnel edit initiation:', error));
    }
  };

  const handleDeleteClick = (person: Personnel) => {
    setPersonnelToDelete(person);
    setIsDeleteConfirmationOpen(true);
    
    // Log this delete attempt to the audit system
    if (user && user._id) {
      auditService.logPersonnelAction(
        user._id,
        `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        user.role,
        'delete' as AuditAction,
        person.id,
        person.name
      ).catch(error => console.error('Failed to log personnel delete attempt:', error));
    }
  };

  const handleDelete = async () => {
    setIsDeleteConfirmationOpen(false);
    if (!personnelToDelete) return;
    
    try {
      // Make API call to delete personnel
      const response = await fetch(`/api/personnel/${personnelToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete personnel');
      }
      
      // Remove from local state
      setAllPersonnel(prev => prev.filter(p => p.id !== personnelToDelete.id));
      setToast({
        message: `Successfully deleted ${personnelToDelete.name}`,
        type: 'success'
      });
      setPersonnelToDelete(null);
    } catch (error) {
      console.error('Delete error:', error);
      setToast({
        message: error instanceof Error ? error.message : 'Failed to delete personnel',
        type: 'error'
      });
    }
  };

  // Handle status change
  const handleStatusChange = async (person: Personnel, newStatus: PersonnelStatus) => {
    try {
      setSelectedPersonnelForStatus(null);
      
      // Make API call to update status
      const response = await fetch('/api/personnel/status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          personnelId: person.id,
          status: newStatus,
          reason: 'Status updated from personnel dashboard'
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update status');
      }
      
      // Update local state
      setAllPersonnel(prev => prev.map(p => 
        p.id === person.id 
          ? {...p, status: newStatus as PersonnelStatus, lastUpdated: new Date().toLocaleDateString()}
          : p
      ));
      
      // Show success message
      setToast({
        message: `${person.name}'s status updated to ${newStatus}`,
        type: 'success'
      });
      
      // Highlight the updated row
      setRecentlyModified(person.id.toString());
      
      // Find and add animation class to status badge
      setTimeout(() => {
        const statusBadge = document.querySelector(`[data-personnel-id="${person.id}"] .status-badge`);
        if (statusBadge) {
          statusBadge.classList.add('animate-status-update');
          setTimeout(() => {
            statusBadge.classList.remove('animate-status-update');
          }, 1000);
        }
      }, 100);
      
      setTimeout(() => setRecentlyModified(null), 3000);
      
    } catch (error) {
      console.error('Error updating status:', error);
      setToast({
        message: error instanceof Error ? error.message : 'Failed to update status',
        type: 'error'
      });
    }
  };

  // Helper function to ensure role is a valid enum value
  const getNormalizedRole = (role: any): UserRole => {
    // If 'user' is provided, convert to 'reservist'
    if (role === 'user') return 'reservist';
    
    // Check if the role is one of the valid enum values
    const validRoles: UserRole[] = ['staff', 'administrator', 'director', 'reservist', 'enlisted'];
    if (role && validRoles.includes(role as UserRole)) {
      return role as UserRole;
    }
    
    // Default to 'reservist' if no valid role is provided
    return 'reservist';
  };

  // Handle save (for edit/create modal)
  const handleSave = async (updatedData: Partial<Personnel>) => {
    if (!selectedPersonnel || !user || !user._id) return;
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Check for a string 'new' not a numerical comparison
      const isNewPersonnel = selectedPersonnel.id.toString() === 'new';
      const url = `/api/personnel`;
      const method = isNewPersonnel ? 'POST' : 'PUT';
      
      // Prepare the data
      let requestBody;
      
      // Handle the companyName field that comes from PersonnelModal
      const { companyName, ...otherData } = updatedData;
      
      // Normalize the role field to ensure it's a valid enum value
      if (otherData.role) {
        otherData.role = getNormalizedRole(otherData.role);
      }
      
      if (isNewPersonnel) {
        // For new personnel, use companyName if provided as the company field
        requestBody = { 
          ...otherData,
          // If companyName is provided, use it for the company field
          ...(companyName ? { company: companyName } : {}),
          // Ensure a valid role is set
          role: otherData.role || 'reservist'
        };
      } else {
        // For updating existing personnel, format according to the API's expected structure
        requestBody = {
          id: selectedPersonnel.id,
          data: { 
            ...otherData,
            // Use companyName if provided for the company field
            ...(companyName ? { company: companyName } : {}),
            // Ensure a valid role is set
            role: otherData.role || 'reservist',
            lastUpdated: new Date().toISOString()
          }
        };
      }
      
      console.log('Sending request:', method, url);
      console.log('Request body:', requestBody);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });
      
      // Log HTTP status for debugging
      console.log('API response status:', response.status);
      
      const result = await response.json();
      console.log('API response details:', JSON.stringify(result, null, 2));
      
      if (result.success) {
        // Update was successful
        setIsModalOpen(false);
        
        // Show success message
        setToast({
          message: `${updatedData.name || selectedPersonnel.name} has been ${isNewPersonnel ? 'created' : 'updated'} successfully`,
          type: 'success'
        });
        
        // Mark as recently modified for animation
        const newId = isNewPersonnel && result.data?.id ? result.data.id : selectedPersonnel.id;
        if (newId) setRecentlyModified(newId);
        
        // Log to audit system
        const action = isNewPersonnel ? 'create' as AuditAction : 'update' as AuditAction;
        auditService.logPersonnelAction(
          user._id,
          `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          user.role,
          action,
          isNewPersonnel && result.data?.id ? result.data.id : selectedPersonnel.id,
          updatedData.name || ''
        ).catch(error => console.error(`Failed to log personnel ${action}:`, error));
        
        // Refresh the personnel list
        refreshPersonnel();
      } else {
        // Handle specific error messages from the API
        if (result.errors && Array.isArray(result.errors) && result.errors.length > 0) {
          // Format all validation errors into a single message
          const errorMessage = `Validation failed: ${result.errors.join(', ')}`;
          throw new Error(errorMessage);
        } else {
          throw new Error(result.error || result.message || 'Failed to save personnel');
        }
      }
    } catch (error) {
      console.error('Failed to save personnel:', error);
      
      let errorMessage = 'Failed to save personnel. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('Validation failed:')) {
          // This is a validation error from our API
          errorMessage = error.message;
        } else if (error.message.includes('duplicate key')) {
          // MongoDB duplicate key error
          if (error.message.includes('email')) {
            errorMessage = 'A personnel record with this email already exists';
          } else if (error.message.includes('serviceNumber')) {
            errorMessage = 'A personnel record with this service number already exists';
          } else {
            errorMessage = 'A duplicate record already exists';
          }
        } else {
          errorMessage = `Failed to save personnel: ${error.message}`;
        }
      }
      
      setToast({
        message: errorMessage,
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to refresh personnel data after updates
  const refreshPersonnel = async () => {
    try {
      const response = await fetch(`/api/personnel?limit=0`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Process the data
        let personnelData = data.data.personnel || [];
        
        // Map MongoDB _id to id for frontend compatibility and normalize statuses
        personnelData = personnelData.map((person: any) => ({
          ...person,
          id: person._id || person.id,
          status: normalizeStatus(person.status),
          lastUpdated: person.lastUpdated ? new Date(person.lastUpdated).toLocaleDateString() : new Date().toLocaleDateString()
        }));
        
        setAllPersonnel(personnelData);
        
        // Apply existing filters
        applyFilters(personnelData);
      } else {
        console.error('Failed to refresh personnel list:', data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Failed to fetch personnel:', error);
    }
  };

  // Force re-render when current page changes to ensure pagination works correctly
  useEffect(() => {
    // Calculate current items for this page
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    
    // Force data refresh by setting a new array (even though it's the same data)
    const currentItems = filteredPersonnel.slice(startIndex, endIndex);
    console.log(`Page changed to ${currentPage}: showing items ${startIndex+1}-${Math.min(endIndex, filteredPersonnel.length)}`);
    
    // This will trigger a re-render even if filteredPersonnel hasn't changed
    if (currentPage > 1 && currentItems.length === 0 && filteredPersonnel.length > 0) {
      // If we ended up on a page with no items but there are items available,
      // reset to page 1 (this can happen if filtering changed)
      console.log("Reset to page 1 because current page has no items");
      setCurrentPage(1);
    }
  }, [currentPage, filteredPersonnel]);

  // Add handler for saving new personnel
  const handleAddPersonnel = async (data: Partial<Personnel>) => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'administrator' || user?.role === 'director';
    
    // Don't proceed if user isn't admin
    if (!isAdmin) {
      setToast({
        message: 'Unauthorized: Admin access required to add personnel',
        type: 'error'
      });
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      // Format the data correctly for the API
      const formattedData = {
        ...data,
        // Ensure dateJoined is in ISO format
        dateJoined: data.dateJoined || new Date().toISOString().split('T')[0],
        // Initialize empty arrays if not provided
        trainings: data.trainings || [],
        documents: data.documents || [],
        // Ensure proper status
        status: data.status || 'standby',
        // Set default role if not provided
        role: data.role || 'reservist' as UserRole
      };
      
      console.log('Sending personnel data:', formattedData);
      
      // Make API call to add personnel
      const response = await fetch('/api/personnel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formattedData)
      });
      
      // Log the raw response for debugging
      console.log('API response status:', response.status);
      
      const result = await response.json();
      console.log('API response data:', result);
      
      if (result.success) {
        // Show success message
        setToast({
          message: `${data.name} has been added successfully`,
          type: 'success'
        });
        
        // Refresh personnel list
        const refreshPersonnel = async () => {
          try {
            const response = await fetch(`/api/personnel?limit=0`);
            
            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
              // Process the data
              let personnelData = data.data.personnel || [];
              
              // Map MongoDB _id to id for frontend compatibility and normalize statuses
              personnelData = personnelData.map((person: any) => ({
                ...person,
                id: person._id || person.id,
                status: normalizeStatus(person.status),
                lastUpdated: person.lastUpdated ? new Date(person.lastUpdated).toLocaleDateString() : new Date().toLocaleDateString()
              }));
              
              setAllPersonnel(personnelData);
              
              // Apply existing filters
              applyFilters(personnelData);
            } else {
              console.error('Failed to refresh personnel list:', data.error || 'Unknown error');
            }
          } catch (error) {
            console.error('Failed to fetch personnel:', error);
          }
        };
        
        refreshPersonnel();
      } else {
        // Show more detailed error message
        const errorMessage = result.error || result.message || 'Failed to add personnel';
        console.error('API returned error:', errorMessage);
        setToast({
          message: `Failed to add personnel: ${errorMessage}`,
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Failed to add personnel:', error);
      setToast({
        message: error instanceof Error 
          ? `Error: ${error.message}` 
          : 'Failed to add personnel. Please try again.',
        type: 'error'
      });
    }
  };

  // Add permission check before opening the approve accounts modal
  const handleOpenApproveAccountsModal = () => {
    const canApproveAccounts = hasSpecificPermission('approve_reservist_accounts');
    
    if (!canApproveAccounts) {
      setToast({
        message: 'You do not have permission to approve account requests',
        type: 'error'
      });
      return;
    }
    
    setShowApproveModal(true);
  };

  // Main content for users with permission
  const PersonnelContent = () => (
    <div className="px-0 py-4 w-full">
      {/* Header section with icon and title */}
      <div className="p-4 mx-2 mb-4 bg-white rounded-lg shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex flex-grow items-center">
            <div className="p-2 mr-3 bg-indigo-100 rounded-full">
              <UserGroupIcon className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Personnel Management</h1>
              <p className="text-gray-500 text-xs mt-0.5">Add, update, and manage personnel records</p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            {/* Only show Add Personnel button for director role */}
            {user && (user.role === 'director') && (
              <Button
                variant="primary"
                onClick={() => setIsAddPersonnelModalOpen(true)}
                className="flex items-center bg-blue-600 hover:bg-blue-700 text-white shadow-sm whitespace-nowrap text-sm py-1.5"
              >
                <UserGroupIcon className="h-4 w-4 mr-1.5" />
                Add Personnel Accounts
              </Button>
            )}
            
            <SyncStatusButton 
              onSyncComplete={() => fetchAllPersonnel()} 
              className="whitespace-nowrap text-sm py-1.5"
            />
            
            <Button
              variant="primary"
              onClick={handleOpenApproveAccountsModal}
              className="flex items-center bg-green-600 hover:bg-green-700 text-white shadow-sm whitespace-nowrap text-sm py-1.5"
            >
              <UserCircleIcon className="h-4 w-4 mr-1.5" />
              Approve Personnel Accounts
            </Button>
          </div>
        </div>
      </div>
      
      {/* Filter section */}
      <div className="p-3 mx-2 mb-4 bg-white rounded-lg shadow-sm">
        <div className="flex flex-row justify-between items-center">
          <div className="flex items-center">
            <span className="mr-2 text-xs font-medium text-gray-700">Search</span>
            <SearchInput value={searchValue} onChange={handleSearchChange} />
          </div>
          
          <div className="flex items-center">
            <span className="mr-1 text-xs font-medium text-gray-700">Company</span>
            <FilterDropdown 
              value={filterCompany} 
              onChange={(e) => setFilterCompany(e.target.value as CompanyType | 'All')} 
              options={companyOptions}
              label="Filter by company"
            />
          </div>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="overflow-hidden mx-2 mb-4 bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {['Ready', 'Standby', 'Retired', 'All'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status === 'All' ? 'All' : status.toLowerCase() as PersonnelStatus)}
                className={`py-3 px-4 text-sm font-medium border-b-2 ${
                  (status === 'All' ? filterStatus === 'All' : filterStatus === status.toLowerCase())
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="flex items-center">
                  {status === 'Ready' && (
                    <span className="mr-2 w-2 h-2 bg-green-500 rounded-full"></span>
                  )}
                  {status === 'Standby' && (
                    <span className="mr-2 w-2 h-2 bg-yellow-500 rounded-full"></span>
                  )}
                  {status === 'Retired' && (
                    <span className="mr-2 w-2 h-2 bg-gray-500 rounded-full"></span>
                  )}
                  {status}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>
      
      {/* Personnel table with modern design */}
      <div className="overflow-hidden mx-2 bg-white rounded-lg shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Name
              </th>
              <th scope="col" className="px-4 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Rank
              </th>
              <th scope="col" className="px-4 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Company
              </th>
              <th scope="col" className="px-4 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Joined Date
              </th>
              <th scope="col" className="px-4 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Status
              </th>
              <th scope="col" className="px-4 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Last Updated
              </th>
              <th scope="col" className="px-4 py-2 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-2 text-sm text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : currentPersonnel.length > 0 ? (
              currentPersonnel.map((person, index) => (
                <tr 
                  key={person.id}
                  className={`${recentlyModified === person.id.toString() 
                    ? 'animate-highlight' 
                    : 'hover:bg-gray-50'}`}
                  onClick={() => handleView(person)}
                  data-personnel-id={person.id}
                >
                  <td className="px-4 py-1.5 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{person.name}</div>
                  </td>
                  <td className="px-4 py-1.5 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{getRankDisplayName(person.rank)}</div>
                  </td>
                  <td className="px-4 py-1.5 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{getCompanyDisplayName(person.company)}</div>
                  </td>
                  <td className="px-4 py-1.5 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{new Date(person.dateJoined).toLocaleDateString()}</div>
                  </td>
                  <td className="px-4 py-1.5 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`status-badge ${
                        // Map any statuses not in our official list to "retired"
                        ['ready', 'standby', 'retired'].includes(person.status?.toLowerCase()) ?
                          person.status?.toLowerCase() === 'ready' 
                            ? 'status-badge-ready' 
                            : person.status?.toLowerCase() === 'standby' 
                              ? 'status-badge-standby' 
                              : 'status-badge-retired'
                        : 'status-badge-retired'
                      }`}>
                        {['ready', 'standby', 'retired'].includes(person.status?.toLowerCase()) ?
                          person.status?.charAt(0).toUpperCase() + person.status?.slice(1).toLowerCase() :
                          'Retired'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-1.5 whitespace-nowrap text-sm text-gray-500">
                    {person.lastUpdated}
                  </td>
                  <td className="px-4 py-1.5 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        className="px-2 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 rounded border border-indigo-200 hover:bg-indigo-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleView(person);
                        }}
                      >
                        View
                      </button>
                      
                      <button
                        className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded border border-blue-200 hover:bg-blue-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(person);
                        }}
                      >
                        Edit
                      </button>
                      
                      {hasPermission('admin') && (
                        <button
                          className="p-1 text-red-600 rounded-full hover:bg-red-50"
                          title="Delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(person);
                          }}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-2 text-sm text-center text-gray-500">
                  No personnel records found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination with updated design */}
      <div className="flex justify-between items-center p-2 mx-2 mt-3 bg-white rounded-lg shadow-sm">
        <div className="text-xs text-gray-700">
          Showing <span className="font-medium">
            {currentPage === 1 ? "1" : `${(currentPage - 1) * ITEMS_PER_PAGE + 1}`} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredPersonnel.length)}
          </span> of{' '}
          <span className="font-medium">{filteredPersonnel.length}</span> personnel
        </div>
        <div className="flex items-center space-x-1">
          <button
            className="inline-flex relative items-center px-2 py-1 text-xs font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => {
              setCurrentPage(prev => Math.max(1, prev - 1));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          
          {/* Pagination numbers */}
          <div className="hidden space-x-1 sm:flex">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Calculate which page numbers to show
              let pageNum;
              if (totalPages <= 5) {
                // If 5 or fewer pages, show all
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                // If near beginning, show first 5 pages
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                // If near end, show last 5 pages
                pageNum = totalPages - 4 + i;
              } else {
                // Otherwise show current page and 2 on each side
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => {
                    setCurrentPage(pageNum);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`inline-flex items-center px-2 py-1 border text-xs font-medium rounded-md ${
                    currentPage === pageNum
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-600'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button
            className="inline-flex relative items-center px-2 py-1 text-xs font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => {
              setCurrentPage(prev => Math.min(totalPages, prev + 1));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>

      {/* Personnel Statistics - Using flex instead of grid for better horizontal layout */}
      <div className="flex flex-col gap-4 mx-2 mt-3 mb-4 lg:flex-row">
        {/* Summary Statistics Card */}
        <div className="flex-1 p-3 bg-white rounded-lg shadow-sm">
          <h3 className="flex items-center mb-2 text-xs font-semibold text-gray-700">
            <ChartBarIcon className="mr-1 w-3 h-3 text-indigo-600" /> Personnel Statistics
          </h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-blue-50 rounded-md p-1.5">
              <div className="text-xs font-medium text-blue-700">Ready</div>
              <div className="text-lg font-bold text-blue-800">
                {allPersonnel.filter(p => p.status === 'ready').length}
              </div>
            </div>
            <div className="bg-yellow-50 rounded-md p-1.5">
              <div className="text-xs font-medium text-yellow-700">Standby</div>
              <div className="text-lg font-bold text-yellow-800">
                {allPersonnel.filter(p => p.status === 'standby').length}
              </div>
            </div>
            <div className="bg-gray-50 rounded-md p-1.5">
              <div className="text-xs font-medium text-gray-700">Retired</div>
              <div className="text-lg font-bold text-gray-800">
                {allPersonnel.filter(p => p.status === 'retired').length}
              </div>
            </div>
          </div>
        </div>

        {/* Company Distribution Card */}
        <div className="flex-1 p-3 bg-white rounded-lg shadow-sm">
          <h3 className="flex items-center mb-2 text-xs font-semibold text-gray-700">
            <BuildingOfficeIcon className="mr-1 w-3 h-3 text-indigo-600" /> Company Distribution
          </h3>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6">
            {COMPANIES.map(company => {
              // Case-insensitive matching and normalize company names for better matching
              const count = allPersonnel.filter(p => {
                const normalizedPersonnelCompany = p.company?.toLowerCase().trim() || '';
                const normalizedCompany = company.toLowerCase().trim();
                
                // Handle special case for companies with parentheses
                if (normalizedCompany.includes('(')) {
                  const shortName = normalizedCompany.split('(')[0].trim();
                  return normalizedPersonnelCompany === normalizedCompany || 
                         normalizedPersonnelCompany === shortName || 
                         normalizedPersonnelCompany.startsWith(shortName);
                }
                
                return normalizedPersonnelCompany === normalizedCompany;
              }).length;
              
              return (
                <div key={company} className="flex justify-between items-center px-2 py-1 text-xs break-words bg-indigo-50 rounded">
                  <span className="overflow-hidden pr-1 font-medium text-indigo-700">
                    {company.includes('(') ? company.split('(')[0].trim() : company}
                  </span>
                  <span className="flex-shrink-0 font-bold text-indigo-800">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Personnel Modal */}
      <PersonnelModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        personnel={selectedPersonnel}
        mode={modalMode}
        onSave={handleSave}
      />

      {/* Add Personnel Account Modal */}
      <PersonnelAccountModal
        isOpen={isAddPersonnelModalOpen}
        onClose={() => setIsAddPersonnelModalOpen(false)}
        onSave={handleAddPersonnel}
      />

      {/* Approve Accounts Modal */}
      <ApproveAccountsModal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
      />

      <ConfirmationDialog
        isOpen={isDeleteConfirmationOpen}
        onClose={() => setIsDeleteConfirmationOpen(false)}
        onConfirm={handleDelete}
        title="Delete Personnel Record"
        message={`Are you sure you want to delete the record for ${personnelToDelete?.name}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );

  // Main render
  return (
    <div className="pb-6 w-full min-h-screen bg-gray-100">
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 rounded-full border-t-2 border-b-2 border-indigo-500 animate-spin"></div>
        </div>
      ) : (
        <PersonnelContent />
      )}

      {/* Personnel modal */}
      {isModalOpen && selectedPersonnel && (
        <PersonnelModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          personnel={selectedPersonnel}
          mode={modalMode}
          onSave={handleSave}
        />
      )}

      {/* Add Personnel Account Modal */}
      <PersonnelAccountModal
        isOpen={isAddPersonnelModalOpen}
        onClose={() => setIsAddPersonnelModalOpen(false)}
        onSave={handleAddPersonnel}
      />

      {/* Approve Accounts Modal */}
      <ApproveAccountsModal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
      />

      {/* Delete confirmation */}
      <ConfirmationDialog
        isOpen={isDeleteConfirmationOpen}
        onClose={() => setIsDeleteConfirmationOpen(false)}
        onConfirm={handleDelete}
        title="Delete Personnel Record"
        message={`Are you sure you want to delete the record for ${personnelToDelete?.name}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
      
      {/* Toast notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}
