"use client";

import React, { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import NotificationBell from './NotificationBell';
import Footer from './Footer';
import { useSidebarState } from './Sidebar';

interface MainContentWrapperProps {
  children: ReactNode;
}

const MainContentWrapper = ({ children }: MainContentWrapperProps) => {
  const { isAuthenticated, user } = useAuth();
  const pathname = usePathname();
  const { isCollapsed, isMounted } = useSidebarState();
  
  // Check if current page is a public page (login, register, home, password recovery)
  const isPublicPage = pathname === '/' || 
                     pathname === '/login' || 
                     pathname === '/register' || 
                     pathname.includes('/password-recovery') || 
                     pathname.includes('/reset-password');

  // Determine if we should apply sidebar margin
  const shouldApplySidebarMargin = () => {
    if (!isMounted) return false; // During SSR and first mount, don't apply margin
    if (!isAuthenticated || !user) return false; // No margin if not logged in
    if (isPublicPage) return false; // No margin on public pages
    
    return true;
  };
  
  // Apply different margin depending on sidebar collapse state
  const getSidebarMargin = () => {
    if (!shouldApplySidebarMargin()) return '';
    // When sidebar is collapsed, use small margin for the icon-only sidebar
    return isCollapsed ? 'ml-16' : 'ml-64';
  };
  
  const sidebarMargin = getSidebarMargin();
  
  // Only apply padding on authenticated pages
  const contentPadding = isPublicPage ? '' : 'p-6';

  // Determine if footer should be displayed
  const shouldShowFooter = !isAuthenticated && isPublicPage;
  
  // Determine if the header (with notification bell) should be shown
  const shouldShowHeader = isMounted && isAuthenticated && !isPublicPage;

  return (
    <>
      <main 
        id="main-content" 
        tabIndex={-1} 
        className={`${sidebarMargin} ${contentPadding} flex-grow min-h-screen ${isPublicPage ? '' : 'bg-gray-50'} transition-[margin-left] duration-300 ease-in-out`}
      >
        {shouldShowHeader && (
          <div className="flex justify-end mb-2">
            <NotificationBell />
          </div>
        )}
        {children}
      </main>
      {shouldShowFooter && <Footer className={sidebarMargin} />}
    </>
  );
};

export default MainContentWrapper; 