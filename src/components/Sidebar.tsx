"use client";

import { useState, useEffect, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  DocumentTextIcon, 
  AcademicCapIcon, 
  UserGroupIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  MegaphoneIcon,
  ClipboardDocumentListIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LightBulbIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { navigationConfig, NavItem } from '@/config/navigation';
import { UserRole } from '@/types/auth';

// Create a context for sidebar state that can be accessed from any component
const SidebarContext = createContext<{
  isCollapsed: boolean;
  toggleSidebar: () => void;
  isMounted: boolean;
}>({
  isCollapsed: false,
  toggleSidebar: () => {},
  isMounted: false
});

// Export the provider and a hook for accessing the context
export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  
  // Initialize on client side only
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
      setIsCollapsed(savedState === 'true');
    }
    setIsMounted(true);
    
    // Add an event listener for window resize to handle sidebar state responsively
    const handleResize = () => {
      if (window.innerWidth < 768 && !isCollapsed) {
        setIsCollapsed(true);
        localStorage.setItem('sidebarCollapsed', 'true');
      }
    };
    
    window.addEventListener('resize', handleResize);
    // Call once to initialize based on current window size
    handleResize();
    
    // Force a document repaint to ensure transitions work correctly
    // document.body.style.transition = 'padding 0.3s ease'; // Removed this as it might interfere
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', String(newState));
    
    // Remove body class manipulation to avoid conflicts
    /* 
    if (newState) {
      document.body.classList.add('sidebar-collapsed');
      document.body.classList.remove('sidebar-expanded');
    } else {
      document.body.classList.add('sidebar-expanded');
      document.body.classList.remove('sidebar-collapsed');
    }
    */
    
    // Force layout recalculation - Keep this if necessary, might not be needed anymore
    // document.body.offsetHeight; 
  };
  
  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar, isMounted }}>
      {children}
    </SidebarContext.Provider>
  );
};

// Hook to use sidebar context
export const useSidebarState = () => useContext(SidebarContext);

const Sidebar = () => {
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuth();
  const { isCollapsed, toggleSidebar, isMounted } = useSidebarState();
  
  // Don't render anything during SSR or if not mounted yet to avoid hydration issues
  if (!isMounted) return null;
  
  // Hide Sidebar in these cases:
  // 1. User is not logged in or not authenticated
  if (!user || !isAuthenticated) {
    return null;
  }

  // 2. Always hide on the homepage (/) regardless of login status
  if (pathname === '/' || pathname === '/login' || pathname === '/register') {
    return null;
  }
  
  // Filter navigation items based on user role
  const navigation = navigationConfig.filter(item => {
    // If no user role, don't show the item
    if (!user?.role) return false;
    
    // Check if the user role is included in item.roles
    const userRole = user.role as UserRole;
    return item.roles.includes(userRole);
  });

  // Get the appropriate icon for each navigation item
  const getNavIcon = (label: string) => {
    switch (label) {
      case 'Dashboard':
        return <HomeIcon className="h-6 w-6" aria-hidden="true" />;
      case 'Documents':
        return <DocumentTextIcon className="h-6 w-6" aria-hidden="true" />;
      case 'Manage RIDS':
        return <DocumentTextIcon className="h-6 w-6" aria-hidden="true" />;
      case 'View RIDS':
        return <EyeIcon className="h-6 w-6" aria-hidden="true" />;
      case 'Trainings':
        return <AcademicCapIcon className="h-6 w-6" aria-hidden="true" />;
      case 'Personnel':
        return <UserGroupIcon className="h-6 w-6" aria-hidden="true" />;
      case 'Analytics':
        return <ChartBarIcon className="h-6 w-6" aria-hidden="true" />;
      case 'Prescriptive Analytics':
        return <LightBulbIcon className="h-6 w-6" aria-hidden="true" />;
      case 'Announcements':
        return <MegaphoneIcon className="h-6 w-6" aria-hidden="true" />;
      case 'Policy':
        return <ClipboardDocumentListIcon className="h-6 w-6" aria-hidden="true" />;
      case 'Policy Control':
        return <ShieldCheckIcon className="h-6 w-6" aria-hidden="true" />;
      case 'Companies':
        return <BuildingOfficeIcon className="h-6 w-6" aria-hidden="true" />;
      case 'Manage Accounts':
        return <Cog6ToothIcon className="h-6 w-6" aria-hidden="true" />;
      default:
        return <HomeIcon className="h-6 w-6" aria-hidden="true" />;
    }
  };

  const handleLogoutClick = async () => {
    try {
      await logout();
      // We don't need to manually redirect - the AuthContext should handle that
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Check if a navigation item is active
  const isActiveNavItem = (item: NavItem): boolean => {
    if (pathname === item.href) return true;
    if (item.children) {
      return item.children.some(child => pathname === child.href);
    }
    return false;
  };

  return (
    <aside 
      className={`fixed top-0 left-0 h-screen bg-black shadow-lg flex flex-col z-20 will-change-transform transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
      style={{ 
        transform: 'translateX(0)',
        opacity: 1
      }}
    >
      {/* Toggle button */}
      <button 
        onClick={toggleSidebar}
        className="absolute -right-3 top-16 bg-indigo-600 text-white rounded-full p-1 shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 z-50 transform scale-100 transition-transform"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
        ) : (
          <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
      
      {/* Logo */}
      <div className="flex-shrink-0 p-4 border-b border-gray-800 overflow-hidden">
        <Link href="/" className="text-white font-bold focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded-md block">
          <div className={`flex flex-col ${isCollapsed ? 'items-center' : ''}`}>
            <span className="text-white font-bold text-lg tracking-wider">
              {isCollapsed ? '301' : '301st RRIBN'}
            </span>
            {!isCollapsed && (
              <span className="text-[#FFBF00] text-xs tracking-widest">INFANTRY BATTALION</span>
            )}
          </div>
        </Link>
      </div>
      
      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navigation.map((item) => (
          <div key={item.label}>
            <Link
              href={item.href}
              className={`
                ${isActiveNavItem(item) 
                  ? 'bg-gray-900 text-[#FFBF00]' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }
                group flex items-center ${isCollapsed ? 'justify-center' : 'px-3'} py-3 rounded-md text-sm font-medium w-full
              `}
              aria-current={isActiveNavItem(item) ? 'page' : undefined}
              title={isCollapsed ? item.label : ''}
            >
              <div className={isCollapsed ? '' : 'mr-3'}>
                {getNavIcon(item.label)}
              </div>
              <span className={`transform ${isCollapsed ? 'opacity-0 scale-0 absolute' : 'opacity-100 scale-100'} transition-all duration-200`}>
                {item.label}
              </span>
            </Link>

            {item.children && isActiveNavItem(item) && !isCollapsed && (
              <div className="ml-8 mt-1 space-y-1">
                {item.children.map((child) => (
                  <Link
                    key={child.label}
                    href={child.href}
                    className={`
                      ${pathname === child.href
                        ? 'bg-gray-900 text-[#FFBF00]'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }
                      group flex items-center px-3 py-2 rounded-md text-sm font-medium w-full
                    `}
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
      
      {/* User Profile and Logout */}
      <div className={`p-4 border-t border-gray-800 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
        {/* Role Indicator */}
        {user?.role && !isCollapsed && (
          <div className="mb-3 px-1">
            <div className="bg-gray-800 rounded-md py-1 px-2 flex items-center justify-center">
              <ShieldCheckIcon className="h-4 w-4 text-[#FFBF00] mr-2" aria-hidden="true" />
              <span className="text-xs font-medium text-white capitalize">
                {String(user.role) === 'administrator' || String(user.role) === 'admin' ? 'Administrator' : 
                 String(user.role) === 'director' ? 'Director' : 
                 String(user.role) === 'staff' ? 'Staff Member' : 
                 String(user.role) === 'reservist' ? 'Reservist' :
                 String(user.role) === 'enlisted' ? 'Enlisted' :
                 String(user.role)}
              </span>
            </div>
          </div>
        )}
        <Link
          href="/profile"
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'px-3'} py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-md mb-2`}
          title={isCollapsed ? 'Profile' : ''}
        >
          <UserCircleIcon className={`h-6 w-6 ${isCollapsed ? '' : 'mr-3'}`} aria-hidden="true" />
          <span className={`transform ${isCollapsed ? 'opacity-0 scale-0 absolute' : 'opacity-100 scale-100'} transition-all duration-200`}>
            Profile
          </span>
        </Link>
        <button
          onClick={handleLogoutClick}
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'px-3'} py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-md w-full`}
          title={isCollapsed ? 'Logout' : ''}
        >
          <ArrowRightOnRectangleIcon className={`h-6 w-6 ${isCollapsed ? '' : 'mr-3'}`} aria-hidden="true" />
          <span className={`transform ${isCollapsed ? 'opacity-0 scale-0 absolute' : 'opacity-100 scale-100'} transition-all duration-200`}>
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar; 