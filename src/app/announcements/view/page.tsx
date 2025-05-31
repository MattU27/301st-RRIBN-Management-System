'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { toast } from 'react-hot-toast';
import {
  MegaphoneIcon,
  EyeIcon,
  CheckCircleIcon,
  ClockIcon,
  ArchiveBoxIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { UserRole } from '@/types/auth';

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

export default function AnnouncementsViewPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, getToken } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('published');
  
  // For drag scrolling
  const [isScrolling, setIsScrolling] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Status options for filtering
  const statusOptions = [
    { value: 'published', label: 'Published', icon: <CheckCircleIcon className="h-4 w-4" /> }
  ];
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    
    if (!isLoading && user && isAuthenticated) {
      if (user.role !== UserRole.ADMINISTRATOR && user.role !== UserRole.DIRECTOR) {
        router.push('/dashboard');
        toast.error('You do not have permission to access this page');
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
      
      console.log(`Fetching announcements with status: ${selectedStatus}`);
      const response = await fetch(`/api/announcements?status=${selectedStatus}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        console.error(`API Error: Status ${response.status}, ${response.statusText}`);
        const errorText = await response.text();
        console.error(`Error response: ${errorText}`);
        throw new Error(`Failed to fetch announcements: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('API response:', data);
      
      if (data.success) {
        setAnnouncements(data.data || []);
      } else {
        console.error('API returned error:', data.error);
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
  
  // Format date
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
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
  
  // Handle scroll event
  const handleScroll = () => {
    if (!scrollContainerRef.current || announcements.length <= 1) return;
    
    const scrollPosition = scrollContainerRef.current.scrollLeft;
    const itemWidth = scrollContainerRef.current.scrollWidth / announcements.length;
    const newIndex = Math.min(
      Math.max(0, Math.round(scrollPosition / itemWidth)),
      announcements.length - 1
    );
    
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }
  };

  // Add scroll event listener
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [announcements.length, activeIndex]);

  if (!isAuthenticated && !isLoading) {
    return null; // Will redirect in useEffect
  }
  
  // Add drag scrolling handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current) return;
    setIsScrolling(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
    
    // Prevent text selection during drag
    e.preventDefault();
    document.body.style.userSelect = 'none';
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isScrolling || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const distance = x - startX;
    scrollContainerRef.current.scrollLeft = scrollLeft - distance;
  };

  const handleMouseUp = () => {
    setIsScrolling(false);
    document.body.style.userSelect = '';
  };

  // Handle touch events for mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current) return;
    setIsScrolling(true);
    setStartX(e.touches[0].clientX - scrollContainerRef.current.getBoundingClientRect().left);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isScrolling || !scrollContainerRef.current) return;
    e.preventDefault(); // Prevent page scrolling
    const x = e.touches[0].clientX - scrollContainerRef.current.getBoundingClientRect().left;
    const distance = x - startX;
    scrollContainerRef.current.scrollLeft = scrollLeft - distance;
  };

  const handleViewAnnouncement = (id: string) => {
    console.log(`Navigating to announcement: ${id}`);
    router.push(`/announcements/${id}/view`);
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      <Button
        variant="secondary"
        className="mb-4 inline-flex items-center"
        onClick={() => router.push('/dashboard')}
      >
        <ArrowLeftIcon className="h-4 w-4 mr-1" />
        Back to Dashboard
      </Button>
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div className="flex items-center">
          <div className="bg-indigo-100 rounded-full p-1.5 mr-2">
            <MegaphoneIcon className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Announcements</h1>
            <p className="text-xs text-gray-500">View all announcements</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow mb-4 overflow-hidden">
        <div className="flex flex-wrap border-b">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              className={`
                px-3 py-2 flex items-center text-sm font-medium
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
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : announcements.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {announcements.map((announcement) => (
            <Card 
              key={announcement._id}
              className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
              interactive={true}
              onClick={() => handleViewAnnouncement(announcement._id)}
            >
              <div className="p-5 h-full flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 line-clamp-1 break-words">{announcement.title}</h3>
                    <p className="text-base text-gray-500 flex items-center mt-2">
                      <span className="truncate">By {announcement.authorName}</span>
                      <span className="mx-2 flex-shrink-0">•</span>
                      <span className="truncate">{formatDate(announcement.createdAt)}</span>
                    </p>
                  </div>
                </div>
                
                {/* Priority Badge */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getPriorityBadge(announcement.priority)}`}>
                    {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}
                  </span>
                </div>
                
                {/* Content preview */}
                <div className="text-base text-gray-700 mb-4 flex-grow">
                  <p className="line-clamp-4 break-words">
                    {announcement.content}
                  </p>
                </div>
                
                {/* View count */}
                <div className="mt-auto pt-3 border-t border-gray-200 flex justify-end items-center">
                  <div className="text-sm text-gray-500 flex items-center">
                    <EyeIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>{announcement.viewCount} views</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="flex justify-center mb-4">
            <MegaphoneIcon className="h-16 w-16 text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-900">No Announcements Found</h3>
          <p className="mt-2 text-base text-gray-500">
            There are no published announcements at the moment.
          </p>
        </div>
      )}
    </div>
  );
} 