'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { toast } from 'react-hot-toast';
import { UserRole } from '@/types/auth';
import {
  MegaphoneIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArchiveBoxIcon,
  EyeIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import AnnouncementCard from './AnnouncementCard';

// Announcement interface
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

export default function AnnouncementsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, getToken } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('published');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Status options for filtering
  const statusOptions = [
    { value: 'published', label: 'Published', icon: <CheckCircleIcon className="h-4 w-4" /> },
    { value: 'draft', label: 'Drafts', icon: <ClockIcon className="h-4 w-4" /> },
    { value: 'archived', label: 'Archived', icon: <ArchiveBoxIcon className="h-4 w-4" /> },
    { value: 'all', label: 'All', icon: <EyeIcon className="h-4 w-4" /> }
  ];
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    
    if (!isLoading && user && isAuthenticated) {
      // Redirect administrators and directors to the view-only page
      if (user.role === UserRole.ADMINISTRATOR || user.role === UserRole.DIRECTOR) {
        router.push('/announcements/view');
        return;
      }
      
      // Check if user is staff, otherwise redirect to dashboard
      if (user.role !== UserRole.STAFF) {
        router.push('/dashboard');
        toast.error('Only staff members can manage announcements');
        return;
      }
      
      fetchAnnouncements();
    }
  }, [isLoading, isAuthenticated, selectedStatus, user]);
  
  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      
      if (!token) {
        throw new Error('Authentication failed');
      }
      
      // Log for debugging
      console.log(`Fetching announcements with status: ${selectedStatus}`);
      
      const response = await fetch(`/api/announcements?status=${selectedStatus}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch announcements');
      }
      
      const data = await response.json();
      console.log('API response:', data); // Debug log
      
      if (data.success) {
        setAnnouncements(data.data || []);
      } else {
        throw new Error(data.error || 'Failed to load announcements');
      }
    } catch (error: any) {
      console.error('Error fetching announcements:', error);
      toast.error(error.message || 'Failed to load announcements');
      setAnnouncements([]); // Clear on error to avoid stale data
    } finally {
      setLoading(false);
    }
  };
  
  // Handle bulk archive
  const handleBulkArchive = async () => {
    if (selectedIds.length === 0) {
      toast.error('No announcements selected');
      return;
    }
    
    try {
      const token = await getToken();
      
      if (!token) {
        throw new Error('Authentication failed');
      }
      
      const response = await fetch('/api/announcements', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'archive',
          ids: selectedIds
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to archive announcements');
      }
      
      const result = await response.json();
      toast.success(`Successfully archived ${result.result.modified} announcements`);
      
      // Refresh data and clear selection
      setSelectedIds([]);
      fetchAnnouncements();
    } catch (error: any) {
      console.error('Error archiving announcements:', error);
      toast.error(error.message || 'Failed to archive announcements');
    }
  };
  
  // Handle bulk publish
  const handleBulkPublish = async () => {
    if (selectedIds.length === 0) {
      toast.error('No announcements selected');
      return;
    }
    
    try {
      const token = await getToken();
      
      if (!token) {
        throw new Error('Authentication failed');
      }
      
      const response = await fetch('/api/announcements', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'update-status',
          ids: selectedIds,
          data: { status: 'published' }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to publish announcements');
      }
      
      const result = await response.json();
      toast.success(`Successfully published ${result.result.modified} announcements`);
      
      // Refresh data and clear selection
      setSelectedIds([]);
      fetchAnnouncements();
    } catch (error: any) {
      console.error('Error publishing announcements:', error);
      toast.error(error.message || 'Failed to publish announcements');
    }
  };
  
  // Handle delete announcement
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement? This action cannot be undone.')) {
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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete announcement');
      }
      
      toast.success('Announcement deleted successfully');
      fetchAnnouncements();
    } catch (error: any) {
      console.error('Error deleting announcement:', error);
      toast.error(error.message || 'Failed to delete announcement');
    }
  };
  
  // Toggle selection of an announcement
  const toggleSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };
  
  // Get status badge style
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  if (!isAuthenticated && !isLoading) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center">
          <Button
            variant="secondary"
            className="mr-2 inline-flex items-center"
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back
          </Button>
          
          <div className="bg-indigo-100 rounded-full p-2 mr-3">
            <MegaphoneIcon className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Announcements</h1>
            <p className="text-sm text-gray-500">Create and manage announcements for personnel</p>
          </div>
        </div>
        
        <div className="flex mt-2 md:mt-0">
          <Link href="/announcements/new" passHref>
            <Button 
              variant="primary" 
              className="inline-flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-1.5" />
              New Announcement
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
        <div className="flex flex-wrap border-b">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              className={`
                px-4 py-3 flex items-center text-sm font-medium
                ${selectedStatus === option.value 
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}
              `}
              onClick={() => setSelectedStatus(option.value)}
            >
              {option.icon}
              <span className="ml-1.5">{option.label}</span>
            </button>
          ))}
        </div>
        
        {selectedIds.length > 0 && (
          <div className="bg-gray-50 px-4 py-2.5 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              {selectedIds.length} announcements selected
            </div>
            <div className="flex space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleBulkPublish}
                className="text-xs py-1"
                disabled={selectedStatus === 'published'}
              >
                <CheckCircleIcon className="h-3.5 w-3.5 mr-1" />
                Publish
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleBulkArchive}
                className="text-xs py-1"
                disabled={selectedStatus === 'archived'}
              >
                <ArchiveBoxIcon className="h-3.5 w-3.5 mr-1" />
                Archive
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : announcements.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {announcements.map((announcement) => (
            <AnnouncementCard
              key={announcement._id}
              announcement={announcement}
              onDelete={handleDelete}
              onEdit={(id) => router.push(`/announcements/edit/${id}`)}
              onView={(id) => router.push('/announcements')}
              isSelected={selectedIds.includes(announcement._id)}
              onToggleSelect={toggleSelection}
              canManage={['staff', 'admin', 'administrator', 'director'].includes(user?.role || '')}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="flex justify-center mb-4">
            <MegaphoneIcon className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No Announcements Found</h3>
          <p className="mt-2 text-sm text-gray-500">
            There are no published announcements at the moment.
          </p>
          <div className="mt-6">
            <Link href="/announcements/new" passHref>
              <Button variant="primary">
                Create Your First Announcement
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
} 