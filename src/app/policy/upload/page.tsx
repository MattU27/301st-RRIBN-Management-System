"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeftIcon, 
  DocumentTextIcon, 
  CloudArrowUpIcon,
  PaperClipIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { PolicyCategory, PolicyStatus } from '@/app/policies/page';

export default function UploadPolicyPage() {
  const { user, isAuthenticated, getToken } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [policyData, setPolicyData] = useState({
    title: '',
    category: PolicyCategory.GENERAL,
    customCategory: '',
    description: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    expirationDate: ''
  });
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [fileError, setFileError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Handle category change specially
    if (name === 'category') {
      const showCustom = value === PolicyCategory.CUSTOM;
      setShowCustomCategory(showCustom);
    }
    
    setPolicyData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    
    // Reset errors
    setFileError('');
    
    if (selectedFile) {
      // Validate file type (only PDF)
      if (!selectedFile.type.includes('pdf') && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
        setFileError('Only PDF files are allowed');
        setFile(null);
        setPreviewUrl(null);
        return;
      }
      
      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (selectedFile.size > maxSize) {
        setFileError(`File size exceeds 10MB limit (${(selectedFile.size / (1024 * 1024)).toFixed(2)}MB)`);
        setFile(null);
        setPreviewUrl(null);
        return;
      }
      
      setFile(selectedFile);
      
      // Create a local URL for preview
      const fileUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(fileUrl);
    } else {
      setFile(null);
      setPreviewUrl(null);
    }
  };

  const handlePreview = () => {
    if (previewUrl) {
      setShowPreview(true);
    }
  };

  const closePreview = () => {
    setShowPreview(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!policyData.title || !policyData.description || !policyData.effectiveDate) {
      toast.error('Please fill all required fields');
      return;
    }

    // Validate custom category if it's selected
    if (policyData.category === PolicyCategory.CUSTOM && !policyData.customCategory) {
      toast.error('Please enter a custom category');
      return;
    }

    if (!file) {
      setFileError('Please upload a PDF file');
      return;
    }

    setLoading(true);

    try {
      // Get authentication token
      const token = await getToken();
      
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', policyData.title);
      
      // Use the custom category value if selected, otherwise use the selected category
      const categoryToUse = policyData.category === PolicyCategory.CUSTOM 
        ? policyData.customCategory 
        : policyData.category;
        
      formData.append('category', categoryToUse);
      formData.append('description', policyData.description);
      formData.append('effectiveDate', policyData.effectiveDate);
      
      if (policyData.expirationDate) {
        formData.append('expirationDate', policyData.expirationDate);
      }
      
      // Submit the form to the API
      const response = await fetch('/api/policies/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.details && Array.isArray(errorData.details)) {
          // Join all validation error messages
          throw new Error(errorData.details.join(', '));
        } else {
          throw new Error(errorData.error || 'Failed to upload policy');
        }
      }
      
      const data = await response.json();
      toast.success('Policy uploaded successfully');
      
      // Cleanup the preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      
      // Navigate back to policies page
      router.push('/policies');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload policy');
      console.error('Error uploading policy:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button 
              variant="secondary" 
              onClick={() => router.push('/policies')}
              className="mr-4"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Policies
            </Button>
            <h1 className="text-xl font-bold text-gray-900">Upload Policy</h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left side - File upload */}
          <div className="lg:col-span-2">
            <Card>
              <div className="p-4">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Policy Document</h2>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Policy File* (PDF only)
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md h-60">
                    <div className="space-y-1 text-center flex flex-col items-center justify-center">
                      {file ? (
                        <>
                          <DocumentTextIcon className="mx-auto h-12 w-12 text-indigo-600" />
                          <p className="text-sm text-gray-600 break-all">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          <div className="flex space-x-2 mt-2">
                            <button
                              type="button"
                              onClick={handlePreview}
                              className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                            >
                              <EyeIcon className="h-4 w-4 mr-1" />
                              Preview
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setFile(null);
                                setPreviewUrl(null);
                                if (fileInputRef.current) fileInputRef.current.value = '';
                              }}
                              className="text-xs text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                          <p className="text-sm text-gray-600">
                            <span className="inline-block">
                              Drag and drop your PDF file here, or
                            </span>
                          </p>
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                          >
                            <span>Browse files</span>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              className="sr-only"
                              accept=".pdf"
                              onChange={handleFileChange}
                              ref={fileInputRef}
                            />
                          </label>
                          <p className="text-xs text-gray-500">
                            PDF files only, up to 10MB
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right side - Policy details */}
          <div className="lg:col-span-3">
            <Card>
              <div className="p-4">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Policy Details</h2>
                
                <div className="grid grid-cols-1 gap-y-4 gap-x-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Policy Title*
                    </label>
                    <input
                      type="text"
                      name="title"
                      id="title"
                      value={policyData.title}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                      Category*
                    </label>
                    <select
                      name="category"
                      id="category"
                      value={policyData.category}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      {Object.values(PolicyCategory).map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  {showCustomCategory && (
                    <div>
                      <label htmlFor="customCategory" className="block text-sm font-medium text-gray-700">
                        Custom Category*
                      </label>
                      <input
                        type="text"
                        name="customCategory"
                        id="customCategory"
                        value={policyData.customCategory}
                        onChange={handleInputChange}
                        required={showCustomCategory}
                        placeholder="Enter custom category"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  )}

                  <div>
                    <label htmlFor="effectiveDate" className="block text-sm font-medium text-gray-700">
                      Effective Date*
                    </label>
                    <input
                      type="date"
                      name="effectiveDate"
                      id="effectiveDate"
                      value={policyData.effectiveDate}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="expirationDate" className="block text-sm font-medium text-gray-700">
                      Expiration Date (Optional)
                    </label>
                    <input
                      type="date"
                      name="expirationDate"
                      id="expirationDate"
                      value={policyData.expirationDate}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description*
                    </label>
                    <textarea
                      name="description"
                      id="description"
                      rows={3}
                      value={policyData.description}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Bottom action buttons */}
        <div className="mt-6 flex justify-end space-x-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push('/policies')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="flex items-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </>
            ) : (
              <>
                <PaperClipIcon className="h-5 w-5 mr-2" />
                Upload Policy
              </>
            )}
          </Button>
        </div>
      </form>

      {/* PDF Preview Modal */}
      {showPreview && previewUrl && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black bg-opacity-80 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl w-[98%] h-[95vh] max-w-7xl flex flex-col">
            <div className="flex justify-between items-center px-4 py-2 bg-gray-100 border-b">
              <h3 className="text-lg font-semibold text-black">PDF Preview</h3>
              <button
                type="button"
                onClick={closePreview}
                className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-200"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-hidden bg-gray-200">
              <object
                data={previewUrl}
                type="application/pdf"
                className="w-full h-full"
              >
                <div className="flex items-center justify-center h-full flex-col">
                  <p className="text-red-500 mb-2">Unable to display PDF. Browser may be blocking it.</p>
                  <a 
                    href={previewUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Open PDF in New Tab
                  </a>
                </div>
              </object>
            </div>
            <div className="p-3 border-t bg-gray-100">
              <div className="text-sm text-gray-600 text-center">
                <span>Note: If preview is blocked, use the "Open PDF in New Tab" option</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 