'use client';

import React, { useEffect, useState } from 'react';

interface ScreenReaderAnnouncerProps {
  message: string;
  assertive?: boolean;
  clearAfter?: number; // milliseconds
}

/**
 * ScreenReaderAnnouncer - A component that announces messages to screen readers
 * using ARIA live regions.
 * 
 * Usage:
 * - For important updates that should interrupt, use assertive=true
 * - For non-critical updates, use assertive=false (default, polite)
 * - Messages are cleared after clearAfter milliseconds (default: 5000)
 *
 * Example: <ScreenReaderAnnouncer message="Form submitted successfully" />
 */
const ScreenReaderAnnouncer: React.FC<ScreenReaderAnnouncerProps> = ({ 
  message, 
  assertive = false, 
  clearAfter = 5000 
}) => {
  const [announcement, setAnnouncement] = useState(message);

  useEffect(() => {
    setAnnouncement(message);
    
    // Clear the announcement after the specified time
    if (message) {
      const timer = setTimeout(() => {
        setAnnouncement('');
      }, clearAfter);
      
      return () => clearTimeout(timer);
    }
  }, [message, clearAfter]);

  return (
    <div 
      aria-live={assertive ? 'assertive' : 'polite'} 
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
};

// Create a global announcer that can be used throughout the app
export const useScreenReaderAnnouncement = () => {
  const [message, setMessage] = useState('');
  const [isAssertive, setIsAssertive] = useState(false);

  const announce = (announcementMessage: string, assertive = false) => {
    setMessage(announcementMessage);
    setIsAssertive(assertive);
  };

  const ScreenReaderMessage = () => (
    <ScreenReaderAnnouncer message={message} assertive={isAssertive} />
  );

  return { announce, ScreenReaderMessage };
};

export default ScreenReaderAnnouncer; 