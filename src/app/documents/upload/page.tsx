"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { DocumentTextIcon, ArrowLeftIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { User } from '@/types/auth';
import { DocumentType, DocumentTypeLabels, DocumentTypeDescriptions } from '@/types/document';

// Extend the User type to include serviceId and company
interface ExtendedUser extends User {
  serviceId?: string;
  company?: string;
}

export default function UploadDocumentPage() {
  const { user: authUser, isAuthenticated, isLoading } = useAuth();
  const user = authUser as ExtendedUser | null;
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<DocumentType>(DocumentType.BIRTH_CERTIFICATE);
  const [expirationDate, setExpirationDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [filePreview, setFilePreview] = useState<string | null>(null);
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setName(selectedFile.name.split('.')[0]); // Set name to filename without extension
      
      // Generate preview for image files
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setFilePreview(null);
      }
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    
    if (!name) {
      setError('Please enter a document name');
      return;
    }
    
    setError('');
    setIsUploading(true);
    
    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append('file', file);
      
      // Get token from local storage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Upload file first
      const uploadResponse = await axios.post('/api/upload', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (!uploadResponse.data.success) {
        throw new Error(uploadResponse.data.error || 'Failed to upload file');
      }
      
      // Create document record with file URL
      const documentData = {
        name,
        description,
        type,
        expirationDate: expirationDate || undefined,
        fileUrl: uploadResponse.data.fileUrl,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size
      };
      
      const documentResponse = await axios.post('/api/documents', documentData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!documentResponse.data.success) {
        throw new Error(documentResponse.data.error || 'Failed to create document record');
      }
      
      toast.success('Document uploaded successfully');
      router.push('/documents');
    } catch (error: any) {
      console.error('Upload error:', error);
      setError(error.message || 'Failed to upload document');
      toast.error(error.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };
  
  // Redirect if not authenticated
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <button
          onClick={() => router.back()}
          className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Upload Document</h1>
      </div>
      
      <Card>
        <div className="p-6">
          <div className="flex items-center mb-6">
            <div className="bg-indigo-100 rounded-full p-3">
              <DocumentTextIcon className="h-8 w-8 text-indigo-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-medium text-gray-900">Document Upload</h2>
              <p className="text-sm text-gray-500">
                Upload a new document to your personnel file
              </p>
            </div>
          </div>
          
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
              <div className="flex">
                <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-1">
                Document File*
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  {filePreview ? (
                    <div className="mb-4">
                      <img src={filePreview} alt="Preview" className="mx-auto h-32 object-contain" />
                    </div>
                  ) : (
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PDF, PNG, JPG, GIF up to 10MB
                  </p>
                  {file && (
                    <p className="text-sm text-indigo-600 mt-2">
                      Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Document Name*
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  Document Type*
                </label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value as DocumentType)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                >
                  {Object.values(DocumentType).map((docType) => (
                    <option key={docType} value={docType}>
                      {DocumentTypeLabels[docType]}
                    </option>
                  ))}
                </select>
                {type && (
                  <p className="mt-1 text-xs text-gray-500">
                    {DocumentTypeDescriptions[type]}
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="expiration" className="block text-sm font-medium text-gray-700 mb-1">
                  Expiration Date (if applicable)
                </label>
                <input
                  type="date"
                  id="expiration"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Enter a brief description of the document"
              />
            </div>
            
            {/* Display user information */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Document will be uploaded by:</h3>
              <div className="text-sm text-gray-600">
                <p><span className="font-medium">Name:</span> {user?.firstName} {user?.lastName}</p>
                {user?.serviceId && <p><span className="font-medium">Service ID:</span> {user.serviceId}</p>}
                {user?.company && <p><span className="font-medium">Company:</span> {user.company}</p>}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={() => router.back()}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={isUploading}
                isLoading={isUploading}
              >
                Upload Document
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
} 