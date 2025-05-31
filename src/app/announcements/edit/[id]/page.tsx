'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { toast } from 'react-hot-toast';
import { ArrowLeftIcon, MegaphoneIcon, PaperClipIcon } from '@heroicons/react/24/outline';
import dynamic from 'next/dynamic';

// Dynamically import the markdown editor to avoid SSR issues
const MarkdownEditor = dynamic(() => import('@/components/MarkdownEditor'), { ssr: false });

// Priority and status types
type Priority = 'low' | 'medium' | 'high' | 'urgent';
type Status = 'draft' | 'published' | 'archived';

interface AnnouncementParams {
  params: {
    id: string;
  };
}

interface AnnouncementData {
  _id: string;
  title: string;
  content: string;
  status: Status;
  priority: Priority;
  publishDate: string;
  expiryDate: string | null;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export default function EditAnnouncementPage({ params }: AnnouncementParams) {
  const id = params.id;
  const router = useRouter();
  const { user, isAuthenticated, isLoading, getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [announcementData, setAnnouncementData] = useState<Partial<AnnouncementData>>({
    title: '',
    content: '',
    status: 'draft',
    priority: 'medium',
    publishDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    authorName: ''
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!isLoading && user && user.role !== 'staff') {
      router.push('/dashboard');
      toast.error('Only staff members can edit announcements');
      return;
    }

    if (!isLoading && isAuthenticated && id) {
      fetchAnnouncement();
    }
  }, [isLoading, isAuthenticated, id, user, router]);

  const fetchAnnouncement = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = await getToken();
      
      if (!token) {
        throw new Error('Authentication failed');
      }
      
      console.log(`Fetching announcement with ID: ${id}`);
      
      const response = await fetch(`/api/announcements/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Announcement not found');
        }
        throw new Error(data.error || 'Failed to fetch announcement');
      }
      
      if (data.success) {
        console.log('Successfully fetched announcement:', data.data);
        // Format dates for input fields
        const announcement = data.data;
        setAnnouncementData({
          ...announcement,
          publishDate: announcement.publishDate ? new Date(announcement.publishDate).toISOString().split('T')[0] : '',
          expiryDate: announcement.expiryDate ? new Date(announcement.expiryDate).toISOString().split('T')[0] : ''
        });
      } else {
        throw new Error(data.error || 'Failed to load announcement');
      }
    } catch (error: any) {
      console.error('Error fetching announcement:', error);
      setError(error.message || 'Failed to load announcement');
      toast.error(error.message || 'Failed to load announcement');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAnnouncementData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMarkdownChange = (value: string) => {
    setAnnouncementData((prev) => ({ ...prev, content: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = await getToken();
      
      if (!token) {
        throw new Error('Authentication failed');
      }
      
      // Prepare data for submission
      const dataToSubmit = {
        ...announcementData,
        publishDate: new Date(announcementData.publishDate || ''),
        expiryDate: announcementData.expiryDate ? new Date(announcementData.expiryDate) : null
      };

      console.log('Submitting announcement update:', dataToSubmit);

      // Submit to API
      const response = await fetch(`/api/announcements/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToSubmit)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update announcement');
      }

      toast.success('Announcement updated successfully');
      router.push('/announcements');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update announcement');
      console.error('Error updating announcement:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-4">
        <Button
          variant="secondary"
          onClick={() => router.push('/announcements')}
          className="mb-4 text-sm flex items-center border border-blue-500 text-blue-600 hover:bg-blue-50"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Announcements
        </Button>
        
        <Card>
          <div className="p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <MegaphoneIcon className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Error Loading Announcement</h3>
            <p className="mt-2 text-sm text-gray-500">{error}</p>
            <div className="mt-4">
              <Button
                variant="primary"
                onClick={() => fetchAnnouncement()}
                className="mr-2"
              >
                Try Again
              </Button>
              <Button
                variant="secondary"
                onClick={() => router.push('/announcements')}
              >
                Back to Announcements
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <Button
            variant="secondary"
            onClick={() => router.push('/announcements')}
            className="mb-2 text-sm flex items-center border border-blue-500 text-blue-600 hover:bg-blue-50"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Announcements
          </Button>
          
          <h1 className="text-2xl font-bold text-gray-900">Edit Announcement</h1>
          <p className="text-gray-500 mt-1">
            Update the announcement details below
          </p>
        </div>
        
        <div className="flex space-x-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push('/announcements')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-announcement-form"
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
                <MegaphoneIcon className="h-5 w-5 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <Card>
        <form id="edit-announcement-form" onSubmit={handleSubmit} className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <div className="md:col-span-3">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title *
              </label>
              <input
                type="text"
                name="title"
                id="title"
                required
                value={announcementData.title}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter announcement title"
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status *
              </label>
              <select
                name="status"
                id="status"
                required
                value={announcementData.status}
                onChange={handleInputChange}
                className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                Priority *
              </label>
              <select
                name="priority"
                id="priority"
                required
                value={announcementData.priority}
                onChange={handleInputChange}
                className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label htmlFor="authorName" className="block text-sm font-medium text-gray-700">
                Author
              </label>
              <input
                type="text"
                name="authorName"
                id="authorName"
                value={announcementData.authorName}
                disabled
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-50"
              />
            </div>

            <div>
              <label htmlFor="publishDate" className="block text-sm font-medium text-gray-700">
                Publish Date *
              </label>
              <input
                type="date"
                name="publishDate"
                id="publishDate"
                required
                value={announcementData.publishDate}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700">
                Expiry Date (Optional)
              </label>
              <input
                type="date"
                name="expiryDate"
                id="expiryDate"
                value={announcementData.expiryDate || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700">
              Announcement Content *
            </label>
            <div className="mt-1">
              <MarkdownEditor
                value={announcementData.content || ''}
                onChange={handleMarkdownChange}
              />
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
} 