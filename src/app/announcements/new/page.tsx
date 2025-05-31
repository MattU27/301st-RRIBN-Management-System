"use client";

import { useState, useEffect } from 'react';
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

export default function NewAnnouncementPage() {
  const { user, isAuthenticated, isLoading, getToken } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [announcementData, setAnnouncementData] = useState({
    title: '',
    content: '',
    status: 'draft' as Status,
    priority: 'medium' as Priority,
    publishDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    authorName: '', // Will be populated from user data
    targetCompanies: null, // null means all companies
    targetRoles: null, // null means all roles
    attachmentUrls: []
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!isLoading && user && user.role !== 'staff') {
      router.push('/dashboard');
      toast.error('Only staff members can create announcements');
      return;
    }

    // Set author name from user data
    if (user) {
      setAnnouncementData(prev => ({
        ...prev,
        authorName: `${user.firstName} ${user.lastName} (${user.role.charAt(0).toUpperCase() + user.role.slice(1)})`
      }));
    }
  }, [isLoading, isAuthenticated, user, router]);

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
        publishDate: new Date(announcementData.publishDate),
        expiryDate: announcementData.expiryDate ? new Date(announcementData.expiryDate) : null
      };

      // Submit to API
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToSubmit)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create announcement');
      }

      toast.success('Announcement created successfully');
      router.push('/announcements');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create announcement');
      console.error('Error creating announcement:', error);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-4">
        <Button
          variant="secondary"
          onClick={() => router.push('/announcements')}
          className="mb-2 text-sm flex items-center border border-blue-500 text-blue-600 hover:bg-blue-50"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Announcements
        </Button>
        
        <h1 className="text-2xl font-bold text-gray-900">Create New Announcement</h1>
        <p className="text-gray-500 mt-1">
          Create a new announcement to be shared with personnel
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-50"
                disabled
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
                value={announcementData.expiryDate}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="content" className="block text-sm font-medium text-gray-700">
              Announcement Content *
            </label>
            <div className="mt-1">
              <MarkdownEditor
                value={announcementData.content}
                onChange={handleMarkdownChange}
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/announcements')}
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
                  <MegaphoneIcon className="h-5 w-5 mr-2" />
                  {announcementData.status === 'draft' ? 'Save as Draft' : 'Publish Announcement'}
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
} 