'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef, RefObject } from 'react';
import { 
  UserGroupIcon, 
  DocumentTextIcon, 
  AcademicCapIcon, 
  ShieldCheckIcon,
  ChartBarIcon,
  DevicePhoneMobileIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Button from '@/components/Button';
import ImageSlider from '@/components/ImageSlider';
import { useAuth } from '@/contexts/AuthContext';
import IMAGES from '@/utils/images';

export default function Home() {
  const { user, logout, hasSpecificPermission } = useAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [scrolled, setScrolled] = useState(false);
  // Add a flag to prevent scroll events from overriding manual clicks
  const [ignoreScrollEvents, setIgnoreScrollEvents] = useState(false);
  
  // Refs for scroll sections with proper types
  const homeRef = useRef<HTMLDivElement>(null);
  const capabilitiesRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Update logged in state after component mounts to avoid hydration mismatch
    setIsLoggedIn(!!user);
    
    // Add scroll listener for navbar animation and scroll spy
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      
      // Skip scroll spy if we just clicked a navigation item
      if (ignoreScrollEvents) return;
      
      // Improved scroll spy implementation with better detection
      const scrollPosition = window.scrollY + 150; // Increased offset for better detection
      
      // Get offsets of all sections
      const aboutOffset = aboutRef.current?.offsetTop || Number.MAX_SAFE_INTEGER;
      const capabilitiesOffset = capabilitiesRef.current?.offsetTop || Number.MAX_SAFE_INTEGER;
      const homeOffset = 0; // Home is always at the top
      
      // Determine active section based on scroll position
      if (scrollPosition >= aboutOffset - 200) { // Added margin to trigger earlier
        setActiveSection("about");
      } else if (scrollPosition >= capabilitiesOffset - 100) {
        setActiveSection("capabilities");
      } else {
        setActiveSection("home");
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    // Add smooth scrolling behavior
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Run handleScroll immediately instead of with a delay
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.documentElement.style.scrollBehavior = '';
    };
  }, [user, ignoreScrollEvents]);

  // Improved scroll to section function
  const scrollToSection = (sectionRef: any, sectionName: string) => {
    if (sectionRef.current) {
      // Force active section update immediately when clicking navigation
      setActiveSection(sectionName);
      setMobileMenuOpen(false);
      
      // Prevent scroll events from changing the active section for a bit
      setIgnoreScrollEvents(true);
      
      // Calculate scroll position
      const yOffset = -100; // Increased header offset for better positioning
      const y = sectionRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
      
      // Scroll to the section immediately
      window.scrollTo({ top: y, behavior: 'smooth' });
      
      // Re-enable scroll events after the scroll animation is likely complete
      setTimeout(() => {
        setIgnoreScrollEvents(false);
      }, 1000);
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirmation(true);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const features = [
    {
      name: 'Personnel Management',
      description: 'Efficiently manage reservist and enlisted personnel records with role-based access control.',
      icon: UserGroupIcon,
    },
    {
      name: 'Document Validation',
      description: 'Secure document upload, verification, and management with blockchain-backed immutability.',
      icon: DocumentTextIcon,
    },
    {
      name: 'Training Tracking',
      description: 'Schedule, manage, and track training sessions and attendance for all personnel.',
      icon: AcademicCapIcon,
    },
    {
      name: 'Secure Infrastructure',
      description: 'Built with security in mind, featuring JWT authentication and role-based permissions.',
      icon: ShieldCheckIcon,
    },
    {
      name: 'Analytics Dashboard',
      description: 'Comprehensive analytics and reporting for data-driven decision making.',
      icon: ChartBarIcon,
    },
    {
      name: 'Mobile Responsive',
      description: 'Access the system on any device with a fully responsive design.',
      icon: DevicePhoneMobileIcon,
    },
  ];

  const navigationItems = [
    { name: 'HOME', href: '/', section: 'home' },
    { name: 'CAPABILITIES', href: '#capabilities', section: 'capabilities' },
    { name: 'ABOUT', href: '#about', section: 'about' },
  ];

  const userNavigationItems = [
    { name: 'DASHBOARD', href: '/dashboard' },
    { 
      name: 'DOCUMENTS', 
      href: '/documents',
      requiredPermission: ['manage_documents']
    },
    { 
      name: 'POLICY CONTROL', 
      href: '/policies',
      requiredPermission: ['upload_policy', 'edit_policy', 'delete_policy'] 
    },
    { 
      name: 'TRAININGS', 
      href: '/trainings',
      requiredPermission: ['manage_trainings'] 
    },
    { 
      name: 'PERSONNEL', 
      href: '/personnel',
      requiredPermission: ['view_personnel', 'manage_company_personnel']
    },
    { 
      name: 'COMPANIES', 
      href: '/companies',
      requiredPermission: ['manage_company_personnel']
    }
  ];

  // Filter navigation based on permissions
  const userNavigation = userNavigationItems.filter(item => {
    // If no required permissions, show the item
    if (!item.requiredPermission) return true;
    
    // Check if user has any of the required permissions
    return Array.isArray(item.requiredPermission) 
      ? item.requiredPermission.some(p => {
          // Explicitly call the permission check function
          return hasSpecificPermission?.(p) === true;
        })
      : hasSpecificPermission?.(item.requiredPermission) === true;
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Modern navigation bar with animation */}
      <nav className={`fixed w-full z-50 transition-all duration-500 ${scrolled ? 'bg-[#092140]/95 py-2 shadow-lg' : 'bg-[#092140]/80 py-4'}`}>
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <Link href="/" 
                onClick={() => scrollToSection(homeRef, "home")}
                className="flex items-center group">
                <div className="relative flex flex-col overflow-hidden">
                  <span className="text-white font-bold text-lg sm:text-xl tracking-wider group-hover:text-[#D1B000] transition-colors duration-300">301st READY RESERVE</span>
                  <span className="text-[#D1B000] text-xs sm:text-sm tracking-widest">INFANTRY BATTALION</span>
                  <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#D1B000] group-hover:w-full transition-all duration-500"></div>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="items-center hidden space-x-1 md:flex">
              {!isLoggedIn && (
                <>
                  {navigationItems.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => scrollToSection(
                        item.section === "home" ? homeRef : 
                        item.section === "capabilities" ? capabilitiesRef : 
                        aboutRef,
                        item.section
                      )}
                      className={`px-3 py-2 text-sm font-medium tracking-wider relative ${
                        activeSection === item.section 
                          ? 'text-[#D1B000]' 
                          : 'text-white hover:text-[#D1B000]'
                      } transition-all duration-300`}
                    >
                      {item.name}
                      <div className={`absolute bottom-0 left-0 w-full h-[2px] bg-[#D1B000] transform ${activeSection === item.section ? 'scale-x-100' : 'scale-x-0 hover:scale-x-100'} transition-transform duration-300 origin-left`}></div>
                    </button>
                  ))}
                </>
              )}
              
              {isLoggedIn && (
                <>
                  {userNavigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="px-3 py-2 text-sm font-medium tracking-wider text-white hover:text-[#D1B000]"
                    >
                      {item.name}
                    </Link>
                  ))}
                </>
              )}
            </div>

            {/* Right side actions */}
            <div className="flex items-center space-x-4">
              {/* Search field removed as requested */}
              
              {isLoggedIn ? (
                <div className="flex items-center space-x-3">
                  <Link
                    href="/profile"
                    className="p-1 text-white hover:text-[#D1B000]"
                  >
                    <UserCircleIcon className="w-6 h-6" aria-hidden="true" />
                  </Link>
                  <button
                    onClick={handleLogoutClick}
                    className="p-1 text-white hover:text-[#D1B000]"
                    title="Logout"
                  >
                    <ArrowRightOnRectangleIcon className="w-6 h-6" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link href="/login">
                    <button className="bg-[#D1B000] hover:bg-[#9e8500] text-[#092140] font-bold px-4 py-2 rounded-none text-sm tracking-wider transition-all">
                      SIGN IN
                    </button>
                  </Link>
                  <Link href="/register">
                    <button className="bg-transparent hover:bg-[#D1B000]/10 text-white border border-[#D1B000] font-bold px-4 py-2 rounded-none text-sm tracking-wider transition-all">
                      REGISTER
                    </button>
                  </Link>
                </div>
              )}
              
              {/* Mobile menu button */}
              <button 
                className="md:hidden text-white hover:text-[#D1B000] focus:outline-none" 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="w-6 h-6" />
                ) : (
                  <Bars3Icon className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu, show/hide based on mobile menu state */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#092140] shadow-lg animate-fadeIn">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {!isLoggedIn ? (
                navigationItems.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => scrollToSection(
                      item.section === "home" ? homeRef : 
                      item.section === "capabilities" ? capabilitiesRef : 
                      aboutRef,
                      item.section
                    )}
                    className={`block w-full text-left px-3 py-2 text-sm font-medium tracking-wider ${
                      activeSection === item.section 
                        ? 'text-[#D1B000] border-l-4 border-[#D1B000] bg-[#092140]/50 pl-3' 
                        : 'text-white hover:text-[#D1B000]'
                    } transition-all duration-300`}
                  >
                    {item.name}
                  </button>
                ))
              ) : (
                userNavigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-sm font-medium tracking-wider text-white hover:text-[#D1B000]"
                  >
                    {item.name}
                  </Link>
                ))
              )}
            </div>
          </div>
        )}
      </nav>

      {/* US Army-style hero with image slider */}
      <div ref={homeRef} className="relative min-h-screen bg-[#092140]">
        {/* Image slider - positioned at lower z-index */}
        <div className="absolute inset-0">
          <ImageSlider 
            images={[
              '/images/AFP.png',
              '/images/battalion-training.jpg',
              '/images/battalion-training-2.jpg',
              '/images/battalion-training-3.jpg'
            ]}
            flippedImages={['/images/AFP.png']}
            alt="301st Ready Reserve Infantry Battalion"
            className="h-full"
            interval={6000}
            showControls={true}
            showIndicators={true}
          />
          
          {/* Gradient overlay for better text readability - increased z-index */}
          <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>
        </div>
        
        {/* Content positioned over the image */}
        <div className="relative z-20 flex flex-col justify-center h-screen max-w-3xl px-8 md:px-16 animate-fadeIn">
          <div className="mb-8">
            {/* Single decorative line above Administrative Portal */}
            <div className="w-100 h-[2px] bg-[#D1B000] mb-3 animate-slideInUp"></div>
            <div className="text-[#D1B000] text-sm tracking-widest uppercase mb-2 animate-slideInUp">Administrative Portal</div>
            <h1 className="mb-6 text-5xl font-bold tracking-tight text-white animate-slideInUp animation-delay-300">
              <span className="block mb-2">301st READY</span>
              <span className="block">RESERVE INFANTRY</span>
              <span className="block">BATTALION</span>
            </h1>
            
            <p className="mb-3 text-gray-300 animate-slideInUp animation-delay-500">
              Personnel Management System for administrators and staff members of the 301st Ready Reserve Infantry Battalion.
            </p>
            
            {/* Add decorative line under the paragraph text in gold color */}
            <div className="w-100 h-[2px] bg-[#D1B000] mb-8 animate-slideInUp animation-delay-600"></div>
          </div>
        </div>
        
        {/* Scroll indicator - increased z-index */}
        <div className="absolute z-20 transform -translate-x-1/2 cursor-pointer bottom-10 left-1/2 animate-bounce"
             onClick={() => scrollToSection(capabilitiesRef, "capabilities")}>
          <svg className="w-10 h-10 text-[#D1B000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
          </svg>
        </div>
      </div>

      {/* Benefits banner with unique Philippines-focused messaging - Remove skew transformation which might cause spacing issues */}
      <div className="bg-[#092140] py-10">
        <div className="px-4 mx-auto text-center max-w-7xl sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-wide text-white uppercase md:text-3xl animate-pulse">
            SECURE. EFFICIENT. INTEGRATED.<br/>
            PERSONNEL MANAGEMENT SYSTEM.
          </h2>
        </div>
      </div>

      {/* Features section with modern cards */}
      <div id="capabilities" ref={capabilitiesRef} className="py-24 bg-white">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="text-base text-[#D9534F] font-semibold tracking-wide uppercase">Battalion Management System</h2>
            <p className="mt-2 text-4xl leading-tight font-extrabold tracking-tight text-[#092140] sm:text-5xl">
              Administrative Capabilities
            </p>
            <div className="w-24 h-1 bg-[#D1B000] mx-auto my-6"></div>
            <p className="max-w-2xl mx-auto mt-4 text-xl text-gray-500">
              Our digital platform enhances the battalion's administrative efficiency through modern tools for personnel, training, and documentation management.
            </p>
          </div>

          {/* Redesigned Feature Cards */}
          <div className="px-4 mx-auto mb-24 max-w-7xl sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {/* Personnel Management Card */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden transition-transform hover:translate-y-[-5px]">
                <div className="bg-[#092140] px-6 py-4 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Personnel Management</h3>
                  <div className="text-[#D1B000] text-xl font-bold">01</div>
                </div>
                <div className="p-6">
                  <div className="flex items-start mb-4">
                    <div className="bg-[#092140] p-3 rounded-full mr-4">
                      <svg className="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="leading-relaxed text-gray-600">
                        Efficiently manage reservist and enlisted personnel records with role-based access control.
                      </p>
                      <ul className="mt-4 space-y-2">
                        <li className="flex items-center text-sm text-gray-600">
                          <svg className="h-4 w-4 text-[#D1B000] mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Personnel profile management
                        </li>
                        <li className="flex items-center text-sm text-gray-600">
                          <svg className="h-4 w-4 text-[#D1B000] mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Role-based access control
                        </li>
                        <li className="flex items-center text-sm text-gray-600">
                          <svg className="h-4 w-4 text-[#D1B000] mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Record tracking and updates
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Validation Card */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden transition-transform hover:translate-y-[-5px]">
                <div className="bg-[#092140] px-6 py-4 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Document Validation</h3>
                  <div className="text-[#D1B000] text-xl font-bold">02</div>
                </div>
                <div className="p-6">
                  <div className="flex items-start mb-4">
                    <div className="bg-[#092140] p-3 rounded-full mr-4">
                      <svg className="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="leading-relaxed text-gray-600">
                        Secure document upload, verification, and management with blockchain-backed immutability.
                      </p>
                      <ul className="mt-4 space-y-2">
                        <li className="flex items-center text-sm text-gray-600">
                          <svg className="h-4 w-4 text-[#D1B000] mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Secure document storage
                        </li>
                        <li className="flex items-center text-sm text-gray-600">
                          <svg className="h-4 w-4 text-[#D1B000] mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Blockchain verification
                        </li>
                        <li className="flex items-center text-sm text-gray-600">
                          <svg className="h-4 w-4 text-[#D1B000] mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Version control and history
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Training Tracking Card */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden transition-transform hover:translate-y-[-5px]">
                <div className="bg-[#092140] px-6 py-4 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Training Tracking</h3>
                  <div className="text-[#D1B000] text-xl font-bold">03</div>
                </div>
                <div className="p-6">
                  <div className="flex items-start mb-4">
                    <div className="bg-[#092140] p-3 rounded-full mr-4">
                      <svg className="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <p className="leading-relaxed text-gray-600">
                        Schedule, manage, and track training sessions and attendance for all personnel.
                      </p>
                      <ul className="mt-4 space-y-2">
                        <li className="flex items-center text-sm text-gray-600">
                          <svg className="h-4 w-4 text-[#D1B000] mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Training calendar management
                        </li>
                        <li className="flex items-center text-sm text-gray-600">
                          <svg className="h-4 w-4 text-[#D1B000] mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Attendance tracking
                        </li>
                        <li className="flex items-center text-sm text-gray-600">
                          <svg className="h-4 w-4 text-[#D1B000] mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Performance reporting
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Statistics section */}
      <div className="bg-[#092140] py-20 relative overflow-hidden">
        {/* Add subtle moving background effect */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('/tactical-pattern.png')] bg-repeat animate-slide"></div>
        </div>
        
        <div className="relative px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-[1px] bg-[#D1B000] mx-2"></div>
            <div className="w-16 h-[1px] bg-[#D1B000] mx-2"></div>
          </div>
          <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
            <div className="p-6 transition-all duration-500 transform hover:scale-110">
              <p className="text-4xl md:text-5xl font-bold text-[#D1B000] animate-count">130K+</p>
              <p className="mt-2 text-sm font-medium tracking-wider text-white uppercase md:text-base">Active Personnel</p>
            </div>
            <div className="p-6 transition-all duration-500 transform hover:scale-110">
              <p className="text-4xl md:text-5xl font-bold text-[#D1B000] animate-count">45+</p>
              <p className="mt-2 text-sm font-medium tracking-wider text-white uppercase md:text-base">Years of Service</p>
            </div>
            <div className="p-6 transition-all duration-500 transform hover:scale-110">
              <p className="text-4xl md:text-5xl font-bold text-[#D1B000] animate-count">24/7</p>
              <p className="mt-2 text-sm font-medium tracking-wider text-white uppercase md:text-base">Operational Support</p>
            </div>
            <div className="p-6 transition-all duration-500 transform hover:scale-110">
              <p className="text-4xl md:text-5xl font-bold text-[#D1B000] animate-count">100%</p>
              <p className="mt-2 text-sm font-medium tracking-wider text-white uppercase md:text-base">Commitment</p>
            </div>
          </div>
          <div className="flex justify-center mt-8">
            <div className="w-16 h-[1px] bg-[#D1B000] mx-2"></div>
            <div className="w-16 h-[1px] bg-[#D1B000] mx-2"></div>
          </div>
        </div>
      </div>
      
      {/* About Section - New */}
      <div id="about" ref={aboutRef} className="relative py-20 bg-white scroll-mt-20">
        {/* Improved marker that's bigger and positioned better */}
        <div className="absolute top-0 left-0 w-full h-40 -mt-40" id="about-marker"></div>
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-base text-[#D9534F] font-semibold tracking-wide uppercase">About Us</h2>
            <p className="mt-2 text-4xl leading-tight font-extrabold tracking-tight text-[#092140] sm:text-5xl">
              Our Mission & Heritage
            </p>
            <div className="flex justify-center mt-6 mb-8">
              <div className="w-16 h-[1px] bg-[#D1B000] mx-2"></div>
              <div className="w-16 h-[1px] bg-[#D1B000] mx-2"></div>
            </div>
          </div>
          
          <div className="grid items-center grid-cols-1 gap-12 md:grid-cols-2">
            <div className="relative">
              <div className="absolute -left-4 -top-4 w-24 h-24 border-2 border-[#D1B000] opacity-50 z-20"></div>
              <div className="relative z-10 w-full overflow-hidden transition-all duration-700 transform rounded shadow-xl h-80 hover:shadow-2xl">
                <ImageSlider 
                  images={[
                    '/images/AFP.png',
                    '/images/battalion-training.jpg',
                    '/images/battalion-training-2.jpg',
                    '/images/battalion-training-3.jpg'
                  ]}
                  alt="301st Ready Reserve Battalion Personnel"
                  className="h-full rounded"
                  interval={5000}
                />
              </div>
              <div className="absolute -right-4 -bottom-4 w-24 h-24 border-2 border-[#D1B000] opacity-50 z-20"></div>
            </div>
            
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-[#092140]">Excellence in Readiness</h3>
              <p className="text-gray-600">
                The 301st Ready Reserve Infantry Battalion stands as a pillar of national defense, comprised of trained citizen-soldiers prepared to augment the regular force in times of need. 
              </p>
              <p className="text-gray-600">
                Established under the Reserve Force of the Philippine Army, our battalion maintains operational readiness through regular training, professional development, and community integration.
              </p>
              
              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="border-l-2 border-[#D1B000] pl-4">
                  <h4 className="font-bold text-[#092140]">Our Vision</h4>
                  <p className="text-sm text-gray-600">A professional, responsive, and capable reserve force that complements the regular force</p>
                </div>
                <div className="border-l-2 border-[#D1B000] pl-4">
                  <h4 className="font-bold text-[#092140]">Our Values</h4>
                  <p className="text-sm text-gray-600">Patriotism, Honor, Duty, Service Excellence, and Professionalism</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-[#092140] border-t border-gray-800 text-white py-2">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-between items-center text-[10px] py-1">
            <div className="flex items-center">
              <div className="mr-4">
                <div className="flex items-center mb-1">
                  <div className="w-6 h-[1px] bg-[#D1B000] mr-2"></div>
                  <div className="w-6 h-[1px] bg-[#D1B000]"></div>
                </div>
                <span className="font-semibold">301st READY RESERVE</span>
                <span className="text-[#D1B000] ml-1">INFANTRY BATTALION</span>
              </div>
              <div className="hidden space-x-3 sm:flex">
                <button onClick={() => scrollToSection(homeRef, "home")} className="text-gray-400 transition-colors hover:text-white">Home</button>
                <button onClick={() => scrollToSection(capabilitiesRef, "capabilities")} className="text-gray-400 transition-colors hover:text-white">Capabilities</button>
                <button onClick={() => scrollToSection(aboutRef, "about")} className="text-gray-400 transition-colors hover:text-white">About</button>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-gray-400">
              <span>© {new Date().getFullYear()} AFP</span>
              <span className="hidden sm:inline">|</span>
              <span className="hidden sm:inline">info@afp.mil.ph</span>
              <div className="flex items-center ml-2">
                <div className="w-6 h-[1px] bg-[#D1B000] mr-2"></div>
                <div className="w-6 h-[1px] bg-[#D1B000]"></div>
              </div>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Logout confirmation dialog */}
      {showLogoutConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-75">
          <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
            <h3 className="text-lg font-medium text-gray-900">Confirm Logout</h3>
            <p className="mt-2 text-gray-500">Are you sure you want to log out of your account?</p>
            <div className="flex justify-end mt-4 space-x-3">
              <button
                onClick={() => setShowLogoutConfirmation(false)}
                className="px-4 py-2 text-gray-800 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="bg-[#D9534F] hover:bg-red-700 text-white px-4 py-2 rounded"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Add CSS animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        
        @keyframes slideInUp {
          0% { 
            opacity: 0;
            transform: translateY(20px);
          }
          100% { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        
        @keyframes slide {
          0% { transform: translateX(0) translateY(0); }
          100% { transform: translateX(-20px) translateY(-20px); }
        }
        
        @keyframes count {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 1s ease-out forwards;
        }
        
        .animate-slideInUp {
          animation: slideInUp 1s ease-out forwards;
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-slide {
          animation: slide 15s linear infinite alternate;
        }

        .animate-count {
          animation: count 1.5s ease-out forwards;
        }
        
        .animation-delay-300 {
          animation-delay: 300ms;
        }
        
        .animation-delay-500 {
          animation-delay: 500ms;
        }
        
        .animation-delay-700 {
          animation-delay: 700ms;
        }
        
        /* Reveal animations on scroll */
        .reveal {
          opacity: 0;
          transform: translateY(30px);
          transition: all 1s ease;
        }
        
        .reveal.active {
          opacity: 1;
          transform: translateY(0);
        }
        
        /* Focus styles for accessibility */
        *:focus-visible {
          outline: 2px solid #D1B000;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}
