'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeftIcon, 
  MegaphoneIcon, 
  PencilIcon, 
  TrashIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { formatDistance, format } from 'date-fns';
import ReactMarkdown from 'react-markdown';

interface AnnouncementParams {
  params: {
    id: string;
  };
}

interface Announcement {
  _id: string;
  title: string;
  content: string;
  authorName: string;
  status: 'draft' | 'published' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  publishDate: string;
  expiryDate: string | null;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function AnnouncementPage({ params }: AnnouncementParams) {
  const { id } = params;
  const router = useRouter();
  const { user, isAuthenticated, isLoading, getToken } = useAuth();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Check if user can manage announcements
  const canManage = user && user.role === 'staff';
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    
    if (!isLoading && isAuthenticated && user && user.role !== 'staff') {
      router.push('/dashboard');
      toast.error('Only staff members can access announcements');
      return;
    }
    
    if (!isLoading && isAuthenticated) {
      fetchAnnouncement();
    }
  }, [isLoading, isAuthenticated, id, user]);
  
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
        setAnnouncement(data.data);
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
  
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this announcement? This action cannot be undone.')) {
      return;
    }
    
    setDeleting(true);
    try {
      const token = await getToken();
      
      if (!token) {
        throw new Error('Authentication failed');
      }
      
      const response = await fetch(`/api/announcements/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete announcement');
      }
      
      toast.success('Announcement deleted successfully');
      router.push('/announcements');
    } catch (error: any) {
      console.error('Error deleting announcement:', error);
      toast.error(error.message || 'Failed to delete announcement');
    } finally {
      setDeleting(false);
    }
  };

  // Get priority badge style
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Get status badge style and icon
  const getStatusDetails = (status: string) => {
    switch (status) {
      case 'published':
        return {
          classes: 'bg-green-100 text-green-800',
          icon: <CheckCircleIcon className="h-4 w-4 mr-1" />
        };
      case 'draft':
        return {
          classes: 'bg-yellow-100 text-yellow-800',
          icon: <ClockIcon className="h-4 w-4 mr-1" />
        };
      case 'archived':
        return {
          classes: 'bg-gray-100 text-gray-800',
          icon: <ArchiveBoxIcon className="h-4 w-4 mr-1" />
        };
      default:
        return {
          classes: 'bg-gray-100 text-gray-800',
          icon: <ExclamationCircleIcon className="h-4 w-4 mr-1" />
        };
    }
  };
  
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'PPP');
    } catch (error) {
      return 'Invalid date';
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
      <div className="max-w-4xl mx-auto px-4 py-8">
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
  
  if (!announcement) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <div className="p-6 text-center">
            <ExclamationCircleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Announcement Not Found</h2>
            <p className="text-gray-600 mb-4">
              The announcement you're looking for doesn't exist or has been removed.
            </p>
            <Button
              variant="primary"
              onClick={() => router.push('/announcements')}
            >
              Back to Announcements
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const statusDetails = getStatusDetails(announcement.status);
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-y-4">
        <Button
          variant="secondary"
          onClick={() => router.push('/announcements')}
          className="text-sm flex items-center border border-blue-500 text-blue-600 hover:bg-blue-50"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Announcements
        </Button>
        
        <div className="flex space-x-3">
          {canManage && (
            <>
              <Button
                variant="secondary"
                onClick={() => router.push(`/announcements/edit/${id}`)}
                className="flex items-center"
              >
                <PencilIcon className="h-4 w-4 mr-1" />
                Edit
              </Button>
              
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center"
              >
                {deleting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  <>
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Delete
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
      
      <Card>
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{announcement.title}</h1>
              <div className="flex flex-wrap items-center text-sm text-gray-500 gap-2">
                <span>By {announcement.authorName}</span>
                <span className="text-gray-300">•</span>
                <span>Created {formatDate(announcement.createdAt)}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusDetails.classes}`}>
                {statusDetails.icon}
                {announcement.status.charAt(0).toUpperCase() + announcement.status.slice(1)}
              </span>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityBadge(announcement.priority)}`}>
                Priority: {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}
              </span>
            </div>
          </div>
          
          <div className="my-8">
            <div className="prose prose-indigo max-w-none">
              <ReactMarkdown>{announcement.content}</ReactMarkdown>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
              <div>
                <span className="font-medium">Published: </span>
                {formatDate(announcement.publishDate)}
              </div>
              {announcement.expiryDate && (
                <div>
                  <span className="font-medium">Expires: </span>
                  {formatDate(announcement.expiryDate)}
                </div>
              )}
              <div>
                <span className="font-medium">Views: </span>
                {announcement.viewCount}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
} 