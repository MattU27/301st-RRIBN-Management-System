'use client';

import { useState } from 'react';
import { 
  UserGroupIcon, 
  UserPlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Personnel, RankType, CompanyType, PersonnelStatus } from '@/types/personnel';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

// Validation schema
const personnelSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  rank: z.string().min(1, 'Rank is required'),
  company: z.string().min(1, 'Company is required'),
  serviceNumber: z.string().min(1, 'Service number is required'),
  phoneNumber: z.string().optional(),
});

// Toast notification component
interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const Toast = ({ message, type, onClose }: ToastProps) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in-up">
      <div className={`flex items-center p-4 rounded-lg shadow-lg ${
        type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {type === 'success' ? (
          <CheckCircleIcon className="h-5 w-5 mr-2" />
        ) : (
          <XCircleIcon className="h-5 w-5 mr-2" />
        )}
        <span>{message}</span>
        <button 
          onClick={onClose}
          className="ml-4 text-gray-500 hover:text-gray-700"
        >
          <XCircleIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// Valid ranks and companies
const RANKS: RankType[] = [
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

const COMPANIES: CompanyType[] = [
  'Alpha',
  'Bravo',
  'Charlie',
  'Headquarters',
  'NERRSC (NERR-Signal Company)',
  'NERRFAB (NERR-Field Artillery Battery)'
];

export default function AddPersonnelAccounts() {
  const { user } = useAuth();
  const router = useRouter();
  
  // State for single personnel addition
  const [formData, setFormData] = useState<Partial<Personnel>>({
    name: '',
    email: '',
    rank: '' as RankType,
    company: '' as CompanyType,
    serviceNumber: '',
    phoneNumber: '',
    status: 'standby' as PersonnelStatus,
    role: 'reservist',
    dateJoined: new Date().toISOString().split('T')[0],
    trainings: [],
    documents: []
  });
  
  // State for bulk addition
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Handle input change for single personnel form
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

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
      // Make API call to add personnel
      const response = await fetch('/api/personnel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Show success message
        setToast({
          message: `${formData.name} has been added successfully`,
          type: 'success'
        });
        
        // Clear form data
        setFormData({
          name: '',
          email: '',
          rank: '' as RankType,
          company: '' as CompanyType,
          serviceNumber: '',
          phoneNumber: '',
          status: 'standby' as PersonnelStatus,
          role: 'reservist',
          dateJoined: new Date().toISOString().split('T')[0],
          trainings: [],
          documents: []
        });
      } else {
        throw new Error(result.error || 'Failed to add personnel');
      }
    } catch (error) {
      console.error('Failed to add personnel:', error);
      setToast({
        message: 'Failed to add personnel. Please try again.',
        type: 'error'
      });
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
        setToast({
          message: `Successfully added ${result.data.inserted || 0} personnel records`,
          type: 'success'
        });
        
        // Reset file input
        setBulkFile(null);
        const fileInput = document.getElementById('bulk-file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        throw new Error(result.error || 'Failed to upload personnel');
      }
    } catch (error) {
      console.error('Failed to upload personnel:', error);
      setToast({
        message: 'Failed to upload personnel. Please try again.',
        type: 'error'
      });
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

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with back button */}
        <div className="flex items-center mb-4">
          <Button
            variant="secondary"
            onClick={() => router.push('/personnel')}
            className="mr-4 flex items-center text-sm py-1.5"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Personnel
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Add Personnel Accounts</h1>
        </div>
        
        <Card>
          <div className="p-6">
            {/* Tab selection */}
            <div className="border-b border-gray-200 mb-6">
              <div className="flex -mb-px">
                <button
                  className={`py-2 px-4 text-sm font-medium ${
                    activeTab === 'single'
                      ? 'border-b-2 border-indigo-500 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('single')}
                >
                  Add Single Personnel
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
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
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
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
                  </div>
                  
                  <div>
                    <label htmlFor="rank" className="block text-sm font-medium text-gray-700 mb-1">
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
                      {RANKS.map((rank) => (
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
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
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
                      {COMPANIES.map((company) => (
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
                    <label htmlFor="serviceNumber" className="block text-sm font-medium text-gray-700 mb-1">
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
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="text"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber || ''}
                      onChange={handleChange}
                      className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                    />
                  </div>
                </div>
                
                <div className="mt-6">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting}
                    className="w-full md:w-auto"
                  >
                    {isSubmitting ? 'Adding Personnel...' : 'Add Personnel'}
                  </Button>
                </div>
              </form>
            )}
            
            {/* Bulk upload form */}
            {activeTab === 'bulk' && (
              <div>
                <div className="mb-6 bg-blue-50 p-4 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1 md:flex md:justify-between">
                      <p className="text-sm text-blue-700">
                        Upload a CSV file with personnel data. The file should have a header row with the following columns: name, email, rank, company, serviceNumber, phoneNumber, status.
                      </p>
                      <p className="mt-3 text-sm md:mt-0 md:ml-6">
                        <button
                          onClick={downloadTemplate}
                          className="whitespace-nowrap font-medium text-blue-700 hover:text-blue-600"
                        >
                          Download Template
                        </button>
                      </p>
                    </div>
                  </div>
                </div>
                
                <form onSubmit={handleBulkUpload}>
                  <div className="mb-6">
                    <label htmlFor="bulk-file" className="block text-sm font-medium text-gray-700 mb-1">
                      Personnel CSV File*
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="bulk-file"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500"
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
                  
                  <div className="mt-6">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={!bulkFile || isUploading}
                      className="w-full md:w-auto"
                    >
                      {isUploading ? 'Uploading...' : 'Upload Personnel'}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </Card>
      </div>
      
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