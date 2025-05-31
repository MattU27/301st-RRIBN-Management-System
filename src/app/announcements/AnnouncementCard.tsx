import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  MegaphoneIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  CheckCircleIcon,
  ClockIcon,
  ArchiveBoxIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import Card from '@/components/Card';
import Button from '@/components/Button';

interface AnnouncementProps {
  announcement: {
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
  };
  onDelete: (id: string) => void;
  onEdit?: (id: string) => void;
  onView?: (id: string) => void;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  canManage?: boolean;
}

export default function AnnouncementCard({
  announcement,
  onDelete,
  onEdit,
  onView,
  isSelected = false,
  onToggleSelect,
  canManage = false
}: AnnouncementProps) {
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

  // Format publish date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Show first 150 characters of content as preview
  const contentPreview = announcement.content.length > 150
    ? `${announcement.content.substring(0, 150)}...`
    : announcement.content;

  const statusDetails = getStatusDetails(announcement.status);

  return (
    <Card className={`transition-all duration-200 h-full ${isSelected ? 'ring-2 ring-indigo-500' : 'hover:shadow-md'}`}>
      <div className="p-4 h-full flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{announcement.title}</h3>
            <p className="text-sm text-gray-500 flex items-center mt-1">
              <span>By {announcement.authorName}</span>
              <span className="mx-1.5">•</span>
              <span>{formatDate(announcement.createdAt)}</span>
            </p>
          </div>
          
          {onToggleSelect && (
            <div className="ml-2 flex-shrink-0">
              <input 
                type="checkbox" 
                checked={isSelected}
                onChange={() => onToggleSelect(announcement._id)}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
            </div>
          )}
        </div>
        
        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusDetails.classes}`}>
            {statusDetails.icon}
            {announcement.status.charAt(0).toUpperCase() + announcement.status.slice(1)}
          </span>
          
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(announcement.priority)}`}>
            {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}
          </span>
        </div>
        
        {/* Content preview */}
        <div className="text-sm text-gray-700 mb-3 flex-grow">
          <p className="line-clamp-3">{contentPreview}</p>
        </div>
        
        {/* Actions */}
        <div className="mt-auto pt-3 border-t border-gray-200 flex justify-between items-center">
          <div className="text-xs text-gray-500 flex items-center">
            <EyeIcon className="h-3.5 w-3.5 mr-1" />
            {announcement.viewCount} views
          </div>
          
          <div className="flex space-x-2">
            {canManage && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onEdit && onEdit(announcement._id)}
                className="py-1 px-2 text-xs"
              >
                <PencilIcon className="h-3.5 w-3.5 mr-1" />
                Edit
              </Button>
            )}
            
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onView && onView(announcement._id)}
              className="py-1 px-2 text-xs"
            >
              <EyeIcon className="h-3.5 w-3.5 mr-1" />
              View
            </Button>
            
            {canManage && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => onDelete(announcement._id)}
                className="py-1 px-2 text-xs"
              >
                <TrashIcon className="h-3.5 w-3.5 mr-1" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
} 