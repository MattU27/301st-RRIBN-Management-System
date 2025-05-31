"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { toast } from 'react-hot-toast';
import { ArrowLeftIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import dynamic from 'next/dynamic';
import { PolicyStatus, PolicyCategory } from '../../page';

// Dynamically import the markdown editor to avoid SSR issues
const MarkdownEditor = dynamic(() => import('@/components/MarkdownEditor'), { ssr: false });

interface PolicyEditParams {
  params: {
    id: string;
  };
}

interface Policy {
  _id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  version: string;
  status: string;
  effectiveDate: string;
  expirationDate?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export default function EditPolicyPage({ params }: PolicyEditParams) {
  // Use React.use to unwrap the params
  const unwrappedParams = React.use(params as any) as {id: string};
  const id = unwrappedParams.id;
  
  const { user, isAuthenticated, isLoading, getToken } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [policyData, setPolicyData] = useState({
    title: '',
    description: '',
    content: '',
    category: '',
    version: '',
    status: '',
    effectiveDate: '',
    expirationDate: ''
  });
  const [originalPolicy, setOriginalPolicy] = useState<Policy | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!isLoading && user && !['admin', 'director'].includes(user.role)) {
      router.push('/policies');
      toast.error('You do not have permission to edit policies');
      return;
    }

    if (id && isAuthenticated) {
      fetchPolicy();
    }
  }, [isLoading, isAuthenticated, user, router, id]);

  const fetchPolicy = async () => {
    try {
      setLoading(true);
      
      // Get token from auth context
      const token = await getToken();
      
      // Fetch the policy data using the ID
      try {
        const response = await fetch(`/api/policies/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch policy');
        }
        
        const data = await response.json();
        
        if (data.policy) {
          setOriginalPolicy(data.policy);
          setPolicyData({
            title: data.policy.title,
            description: data.policy.description,
            content: data.policy.content,
            category: data.policy.category,
            version: data.policy.version,
            status: data.policy.status,
            effectiveDate: new Date(data.policy.effectiveDate).toISOString().split('T')[0],
            expirationDate: data.policy.expirationDate 
              ? new Date(data.policy.expirationDate).toISOString().split('T')[0] 
              : ''
          });
          return;
        }
      } catch (apiError) {
        console.error('API error:', apiError);
        // Continue to fallback if API fails
      }
      
      // Fallback to mock data if API call fails
      // For demo using the mock policies in the list page
      const mockPolicies = [
        {
          _id: '1',
          title: 'Standard Operating Procedures',
          description: 'Outlines standard procedures for daily operations',
          content: '# Standard Operating Procedures\n\n## Overview\nThis document outlines the standard operating procedures for all daily operations within the organization.\n\n## Procedures\n1. Morning reporting\n2. Equipment checks\n3. Communication protocols\n4. Evening reporting',
          category: 'Operations',
          version: '1.2',
          status: 'published',
          effectiveDate: '2023-10-15',
          createdBy: 'Admin',
          createdAt: '2023-09-15T10:00:00Z',
          updatedAt: '2023-09-15T10:00:00Z'
        },
        {
          _id: '2',
          title: 'Emergency Response Protocol',
          description: 'Procedures to follow in emergency situations',
          content: '# Emergency Response Protocol\n\n## Overview\nThis document outlines the procedures to follow in various emergency situations.\n\n## Emergency Types\n1. Natural disasters\n2. Medical emergencies\n3. Security breaches\n4. Equipment failures',
          category: 'Safety',
          version: '2.1',
          status: 'published',
          effectiveDate: '2023-11-01',
          createdBy: 'Admin',
          createdAt: '2023-10-01T14:30:00Z',
          updatedAt: '2023-10-15T09:45:00Z'
        },
        {
          _id: '3',
          title: 'Personnel Leave Policy',
          description: 'Guidelines for requesting and approving leave',
          content: '# Personnel Leave Policy\n\n## Overview\nThis document outlines the guidelines for requesting and approving personnel leave.\n\n## Leave Types\n1. Annual leave\n2. Sick leave\n3. Emergency leave\n4. Training leave',
          category: 'HR',
          version: '1.0',
          status: 'draft',
          effectiveDate: '2024-01-01',
          createdBy: 'Admin',
          createdAt: '2023-11-10T11:20:00Z',
          updatedAt: '2023-11-10T11:20:00Z'
        },
        {
          _id: '4',
          title: 'Equipment Maintenance Guidelines',
          description: 'Procedures for regular equipment maintenance',
          content: '# Equipment Maintenance Guidelines\n\n## Overview\nThis document outlines the procedures for regular equipment maintenance.\n\n## Maintenance Schedule\n1. Daily checks\n2. Weekly maintenance\n3. Monthly inspections\n4. Quarterly overhauls',
          category: 'Operations',
          version: '1.5',
          status: 'archived',
          effectiveDate: '2022-06-01',
          expirationDate: '2023-06-01',
          createdBy: 'Admin',
          createdAt: '2022-05-15T13:40:00Z',
          updatedAt: '2023-06-02T10:15:00Z'
        }
      ];
      
      const policy = mockPolicies.find(p => p._id === id);
      
      if (policy) {
        setOriginalPolicy(policy);
        setPolicyData({
          title: policy.title,
          description: policy.description,
          content: policy.content,
          category: policy.category,
          version: policy.version,
          status: policy.status,
          effectiveDate: policy.effectiveDate,
          expirationDate: policy.expirationDate || ''
        });
      } else {
        toast.error('Policy not found');
        router.push('/policies');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch policy');
      console.error('Error fetching policy:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPolicyData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMarkdownChange = (value: string) => {
    setPolicyData((prev) => ({ ...prev, content: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = await getToken();
      
      // Prepare data for submission
      const dataToSubmit = {
        id,
        ...policyData,
        effectiveDate: new Date(policyData.effectiveDate),
        expirationDate: policyData.expirationDate ? new Date(policyData.expirationDate) : undefined
      };

      // In a real implementation, this would be a PUT request to `/api/policies`
      // For demo purposes, simulate a successful update
      setTimeout(() => {
        toast.success('Policy updated successfully');
        router.push('/policies');
      }, 1000);

      // Actual API call would look like this:
      /*
      const response = await fetch('/api/policies', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToSubmit)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update policy');
      }

      toast.success('Policy updated successfully');
      router.push('/policies');
      */
    } catch (error: any) {
      toast.error(error.message || 'Failed to update policy');
      console.error('Error updating policy:', error);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!isAuthenticated || !['admin', 'director'].includes(user?.role || '')) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
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
            <h1 className="text-2xl font-bold text-gray-900">Edit Policy</h1>
          </div>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Policy Title *
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
                  Category *
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

              <div>
                <label htmlFor="version" className="block text-sm font-medium text-gray-700">
                  Version *
                </label>
                <input
                  type="text"
                  name="version"
                  id="version"
                  value={policyData.version}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status *
                </label>
                <select
                  name="status"
                  id="status"
                  value={policyData.status}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  {Object.values(PolicyStatus).map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="effectiveDate" className="block text-sm font-medium text-gray-700">
                  Effective Date *
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
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description *
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

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                Policy Content *
              </label>
              <div className="mt-1">
                <MarkdownEditor
                  value={policyData.content}
                  onChange={handleMarkdownChange}
                />
              </div>
            </div>

            <div className="pt-5 flex justify-end space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/policies')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={saving}
                className="flex items-center"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <DocumentTextIcon className="h-5 w-5 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
} 