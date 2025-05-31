'use client';

import React from 'react';

interface SkipToContentProps {
  mainContentId?: string;
}

/**
 * SkipToContent - Accessibility component that allows keyboard users to skip 
 * navigation and jump directly to the main content.
 * 
 * Usage: 
 * 1. Place this component at the top of your layout, before the navigation
 * 2. Add an id="main-content" (or your custom ID) to your main content container
 */
const SkipToContent: React.FC<SkipToContentProps> = ({ 
  mainContentId = 'main-content'
}) => {
  return (
    <a 
      href={`#${mainContentId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-indigo-600 focus:text-white focus:rounded-br-lg focus:shadow-md focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600"
      onClick={(e) => {
        // Ensures the skip link functions properly with Next.js client-side navigation
        e.preventDefault();
        const mainContent = document.getElementById(mainContentId);
        if (mainContent) {
          mainContent.tabIndex = -1;
          mainContent.focus();
          // Reset tabIndex after focus to not affect normal tab order
          setTimeout(() => {
            if (mainContent) mainContent.tabIndex = 0;
          }, 1000);
        }
      }}
    >
      Skip to main content
    </a>
  );
};

export default SkipToContent; 