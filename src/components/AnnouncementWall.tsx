"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { formatDistanceToNow } from 'date-fns';
import { MegaphoneIcon, ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { UserRole } from '@/types/auth';
import React from 'react';

// Announcement type
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

// Component props
interface AnnouncementWallProps {
  showTitle?: boolean;
  horizontalScroll?: boolean;
  compact?: boolean;
}

export default function AnnouncementWall({ 
  showTitle = true, 
  horizontalScroll = false,
  compact = false 
}: AnnouncementWallProps) {
  const { user, getToken } = useAuth();
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [cardsPerSlide, setCardsPerSlide] = useState(4);
  
  // Calculate total number of slides
  const totalSlides = Math.ceil(announcements.length / cardsPerSlide);
  
  // Reference for the carousel container
  const carouselRef = React.useRef<HTMLDivElement>(null);

  // Check if user can create announcements (staff only)
  const canCreateAnnouncements = user?.role === UserRole.STAFF;

  // Fetch announcements
  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(true);
      try {
        const token = await getToken();
        
        if (!token) {
          throw new Error('Authentication failed');
        }
        
        const response = await fetch('/api/announcements?status=published&limit=5', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch announcements');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setAnnouncements(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching announcements:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, [getToken]);
  
  // Update cards per slide based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (horizontalScroll) {
        // Show more cards when in horizontal scroll mode
        if (window.innerWidth >= 1280) {
          setCardsPerSlide(5);
        } else if (window.innerWidth >= 1024) {
          setCardsPerSlide(4);
        } else if (window.innerWidth >= 768) {
          setCardsPerSlide(3);
        } else {
          setCardsPerSlide(2);
        }
      } else {
        // Standard vertical layout
        if (window.innerWidth >= 1280) {
          setCardsPerSlide(3);
        } else if (window.innerWidth >= 1024) {
          setCardsPerSlide(2);
        } else if (window.innerWidth >= 640) {
          setCardsPerSlide(1);
        } else {
          setCardsPerSlide(1);
        }
      }
    };
    
    // Set initial value
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, [horizontalScroll]);

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
  };

  // Get priority style
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

  // Handle view announcement
  const handleViewAnnouncement = (id: string) => {
    // Redirect to the appropriate announcement page based on role
    if (user?.role === UserRole.STAFF) {
      router.push(`/announcements/${id}`);
    } else {
      router.push(`/announcements/${id}/view`);
    }
  };

  // Create new announcement
  const handleCreateAnnouncement = () => {
    router.push('/announcements/new');
  };

  // View all announcements
  const handleViewAll = () => {
    // Redirect to the appropriate announcements page based on role
    if (user?.role === UserRole.STAFF) {
      router.push('/announcements');
    } else {
      router.push('/announcements/view');
    }
  };

  // Navigate to previous slide
  const prevSlide = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : totalSlides - 1));
  };

  // Navigate to next slide
  const nextSlide = () => {
    setActiveIndex((prev) => (prev < totalSlides - 1 ? prev + 1 : 0));
  };

  // Navigate to a specific slide (for pagination dots)
  const goToSlide = (index: number) => {
    setActiveIndex(index);
  };

  // Get announcements for current slide
  const getCurrentSlideAnnouncements = () => {
    const startIndex = activeIndex * cardsPerSlide;
    return announcements.slice(startIndex, startIndex + cardsPerSlide);
  };

  return (
    <Card className="flex flex-col">
      {showTitle && (
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-blue-50 rounded-t-lg">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <MegaphoneIcon className="h-5 w-5 mr-2 text-indigo-600" />
            Announcements
          </h2>
          <div className="flex space-x-2">
            {canCreateAnnouncements && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreateAnnouncement}
                className="text-xs py-1.5 px-3 h-8 bg-blue-700 hover:bg-blue-800 text-white font-medium shadow-md"
              >
                New Announcement
              </Button>
            )}
          </div>
        </div>
      )}
      
      <div className={`flex-grow ${horizontalScroll ? 'overflow-x-auto' : 'overflow-hidden'}`}>
        {loading ? (
          <div className="p-6 text-center text-gray-500 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mr-3"></div>
            <span>Loading announcements...</span>
          </div>
        ) : announcements.length === 0 ? (
          <div className="p-6 text-center text-gray-500 flex flex-col items-center justify-center">
            <MegaphoneIcon className="h-12 w-12 text-gray-300 mb-2" />
            <p>No announcements available</p>
          </div>
        ) : (
          <div className="relative px-6 py-2">
            {/* Navigation buttons */}
            {totalSlides > 1 && (
              <>
                <button
                  className="carousel-nav-button prev-button"
                  onClick={prevSlide}
                  aria-label="Previous slide"
                >
                  <ChevronLeftIcon className="h-6 w-6 text-indigo-600" />
                </button>
                <button
                  className="carousel-nav-button next-button"
                  onClick={nextSlide}
                  aria-label="Next slide"
                >
                  <ChevronRightIcon className="h-6 w-6 text-indigo-600" />
                </button>
              </>
            )}
            
            {/* Carousel container */}
            <div
              ref={carouselRef}
              className={`carousel-container ${horizontalScroll ? 'horizontal-carousel' : ''}`}
            >
              <div 
                className={`carousel-track transition-transform duration-300 ease-in-out ${horizontalScroll ? 'flex' : ''}`}
                style={horizontalScroll ? {} : { transform: `translateX(-${activeIndex * 100}%)` }}
              >
                {horizontalScroll ? (
                  // Horizontal layout - all announcements in a row
                  announcements.map((announcement) => (
                    <div 
                      key={announcement._id} 
                      className="bg-white hover:bg-gray-50 p-2 rounded-lg border border-gray-200 cursor-pointer shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col flex-shrink-0"
                      style={{ width: '350px', minWidth: '350px', marginRight: '12px' }}
                      onClick={() => handleViewAnnouncement(announcement._id)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h3 className={`${compact ? 'text-xs' : 'text-sm'} font-semibold text-gray-900 line-clamp-1 break-words pr-2`}>
                          {announcement.title}
                        </h3>
                        <span className={`ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${getPriorityBadge(announcement.priority)}`}>
                          {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}
                        </span>
                      </div>
                      
                      <p className={`text-[10px] text-gray-600 ${compact ? 'mb-1 line-clamp-1' : 'mb-2 line-clamp-2'} break-words flex-grow`}>
                        {announcement.content}
                      </p>
                      
                      <div className="flex justify-between items-center text-[10px] text-gray-500 mt-auto pt-1 border-t border-gray-100">
                        <span className="truncate max-w-[45%]">By {announcement.authorName}</span>
                        <span>{formatDate(announcement.createdAt)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  // Standard vertical layout with slides
                  Array.from({ length: totalSlides }).map((_, slideIndex) => (
                    <div 
                      key={`slide-${slideIndex}`} 
                      className="carousel-slide flex"
                      style={{ 
                        minWidth: '100%',
                        display: 'grid',
                        gridTemplateColumns: `repeat(${cardsPerSlide}, minmax(0, 1fr))`,
                        gap: '16px',
                        padding: '10px 0'
                      }}
                    >
                      {announcements
                        .slice(slideIndex * cardsPerSlide, (slideIndex + 1) * cardsPerSlide)
                        .map((announcement) => (
                          <div 
                            key={announcement._id} 
                            className="bg-white hover:bg-gray-50 p-2 rounded-lg border border-gray-200 cursor-pointer shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col"
                            onClick={() => handleViewAnnouncement(announcement._id)}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <h3 className={`${compact ? 'text-xs' : 'text-sm'} font-semibold text-gray-900 line-clamp-1 break-words pr-2`}>
                                {announcement.title}
                              </h3>
                              <span className={`ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${getPriorityBadge(announcement.priority)}`}>
                                {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}
                              </span>
                            </div>
                            
                            <p className={`text-[10px] text-gray-600 ${compact ? 'mb-1 line-clamp-1' : 'mb-2 line-clamp-2'} break-words flex-grow`}>
                              {announcement.content}
                            </p>
                            
                            <div className="flex justify-between items-center text-[10px] text-gray-500 mt-auto pt-1 border-t border-gray-100">
                              <span className="truncate max-w-[45%]">By {announcement.authorName}</span>
                              <span>{formatDate(announcement.createdAt)}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {/* Pagination dots */}
            {totalSlides > 1 && (
              <div className="carousel-pagination">
                {Array.from({ length: totalSlides }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`carousel-pagination-dot ${index === activeIndex ? 'active' : ''}`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* "View all announcements" button - no longer duplicated */}
      <div className="p-2 bg-indigo-100 rounded-b-lg text-center border-t border-indigo-200 flex justify-center items-center">
        <button
          onClick={handleViewAll}
          className="inline-flex items-center justify-center text-xs text-indigo-700 hover:text-indigo-900 font-medium transition-all duration-200 hover:scale-105 py-1 px-4 rounded-full bg-white shadow-sm hover:shadow-md"
        >
          View all announcements
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </Card>
  );
} 