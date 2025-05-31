'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import {
  MegaphoneIcon,
  ArrowLeftIcon,
  EyeIcon,
  CalendarIcon,
  UserIcon,
  ExclamationTriangleIcon,
  UserCircleIcon,
  DocumentIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { UserRole } from '@/types/auth';

interface AnnouncementParams {
  params: {
    id: string;
  };
}

// Announcement interface
interface Announcement {
  _id: string;
  title: string;
  content: string;
  authorName: string;
  authorId: string;
  status: 'draft' | 'published' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  publishDate: string;
  expiryDate: string | null;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  attachments?: { url: string; name: string; size: number }[];
}

// Format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function AnnouncementViewPage({ params }: AnnouncementParams) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, getToken } = useAuth();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Get announcement ID from the params
  const id = params.id;
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    
    if (!isLoading && isAuthenticated && user) {
      // Only allow administrators and directors to view announcements
      if (user.role !== UserRole.ADMINISTRATOR && user.role !== UserRole.DIRECTOR) {
        router.push('/dashboard');
        toast.error('You do not have permission to access this page');
        return;
      }
      
      console.log(`Loading announcement details for ID: ${id}`);
      fetchAnnouncement();
    }
  }, [isLoading, isAuthenticated, id, user]);
  
  const fetchAnnouncement = async () => {
    setLoading(true);
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
      
      if (!response.ok) {
        console.error(`API Error: Status ${response.status}, ${response.statusText}`);
        const errorText = await response.text();
        console.error(`Error response: ${errorText}`);
        throw new Error(`Failed to fetch announcement: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('API response:', data);
      
      if (data.success) {
        setAnnouncement(data.data);
        // Log view count
        incrementViewCount();
      } else {
        console.error('API returned error:', data.error);
        throw new Error(data.error || 'Failed to load announcement');
      }
    } catch (error: any) {
      console.error('Error fetching announcement:', error);
      toast.error(error.message || 'Failed to load announcement');
    } finally {
      setLoading(false);
    }
  };
  
  // Increment view count
  const incrementViewCount = async () => {
    try {
      const token = await getToken();
      
      if (!token) {
        console.error('Failed to get authentication token for view count');
        return;
      }
      
      console.log(`Incrementing view count for announcement: ${id}`);
      const response = await fetch(`/api/announcements/${id}?action=view`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error(`Failed to increment view count: ${response.status} ${response.statusText}`);
      } else {
        console.log('View count incremented successfully');
      }
    } catch (error) {
      console.error('Error incrementing view count:', error);
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
  
  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP');
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  // Handle back navigation
  const handleBack = () => {
    router.push('/announcements/view');
  };
  
  // Handle delete announcement
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) {
      return;
    }
    
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
        throw new Error('Failed to delete announcement');
      }
      
      router.push('/announcements');
    } catch (error) {
      console.error('Error deleting announcement:', error);
      alert('Failed to delete announcement. Please try again.');
    }
  };
  
  if (!isAuthenticated && !isLoading) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex space-x-2 mb-4">
        <Button
          variant="secondary"
          className="inline-flex items-center"
          onClick={() => router.push('/dashboard')}
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Button>
        
        <Button
          variant="secondary"
          className="inline-flex items-center"
          onClick={handleBack}
        >
          <MegaphoneIcon className="h-4 w-4 mr-1" />
          Browse All Announcements
        </Button>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : !announcement ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="flex justify-center mb-4">
            <ExclamationTriangleIcon className="h-16 w-16 text-yellow-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-900">Announcement Not Found</h3>
          <p className="mt-2 text-base text-gray-500">
            The announcement you are looking for does not exist or has been removed.
          </p>
          <div className="mt-6">
            <Button
              variant="secondary"
              onClick={() => router.push('/announcements/view')}
            >
              View All Announcements
            </Button>
          </div>
        </div>
      ) : (
        <Card className="bg-white shadow-md">
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200 pb-6 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-3">{announcement.title}</h1>
                <div className="flex flex-wrap items-center gap-6 text-base text-gray-600">
                  <div className="flex items-center">
                    <UserCircleIcon className="h-5 w-5 mr-2 text-gray-500" />
                    <span>{announcement.authorName}</span>
                  </div>
                  <div className="flex items-center">
                    <CalendarIcon className="h-5 w-5 mr-2 text-gray-500" />
                    <span>{formatDate(announcement.createdAt)}</span>
                  </div>
                  <div className="flex items-center">
                    <EyeIcon className="h-5 w-5 mr-2 text-gray-500" />
                    <span>{announcement.viewCount} views</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 md:mt-0">
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getPriorityBadge(announcement.priority)}`}>
                  {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}
                </span>
              </div>
            </div>
            
            <div className="prose prose-lg max-w-none">
              <p className="text-lg text-gray-700 whitespace-pre-wrap">{announcement.content}</p>
            </div>
            
            {announcement.attachments && announcement.attachments.length > 0 && (
              <div className="mt-8 border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Attachments</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {announcement.attachments.map((attachment, index) => (
                    <a 
                      key={index}
                      href={attachment.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <DocumentIcon className="h-6 w-6 text-indigo-500 mr-3" />
                      <div className="overflow-hidden">
                        <span className="block text-base font-medium text-gray-900 truncate">{attachment.name}</span>
                        <span className="block text-sm text-gray-500">{formatFileSize(attachment.size)}</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-gray-50 px-6 py-4 md:px-8 md:py-5 flex justify-between items-center border-t border-gray-200 rounded-b-lg">
            {user?.role === UserRole.STAFF && (
              <div className="flex space-x-4">
                <Button
                  variant="secondary"
                  onClick={() => router.push(`/announcements/${announcement._id}/edit`)}
                  className="flex items-center text-base"
                >
                  <PencilIcon className="h-5 w-5 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDelete}
                  className="flex items-center text-base"
                >
                  <TrashIcon className="h-5 w-5 mr-2" />
                  Delete
                </Button>
              </div>
            )}
            {!user || user.role !== UserRole.STAFF && (
              <div></div> /* Empty div for spacing when no buttons are shown */
            )}
          </div>
        </Card>
      )}
    </div>
  );
} 