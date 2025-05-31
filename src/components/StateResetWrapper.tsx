'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

interface StateResetWrapperProps {
  children: ReactNode;
}

/**
 * A component that helps reset state on navigation
 * This is particularly helpful for preventing state from persisting across
 * navigation events where we want a fresh start (like login/logout)
 */
export default function StateResetWrapper({ children }: StateResetWrapperProps) {
  const pathname = usePathname();
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Track navigation changes
  useEffect(() => {
    console.log('PathChanged:', pathname);
    
    if (currentPath && currentPath !== pathname) {
      console.log('Navigation detected from', currentPath, 'to', pathname);
      setIsTransitioning(true);
      
      // Add a small delay to ensure any state resets can happen
      setTimeout(() => {
        setCurrentPath(pathname);
        setIsTransitioning(false);
      }, 50);
    } else if (!currentPath) {
      // First render, just set the path
      setCurrentPath(pathname);
    }
  }, [pathname, currentPath]);
  
  // Render the children, which will get a fresh state after navigation
  return <>{children}</>;
} 