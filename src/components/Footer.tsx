'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface FooterProps {
  className?: string;
}

const Footer = ({ className = '' }: FooterProps) => {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  // Check if current page is a public page (login, register, home, password recovery)
  const isPublicPage = pathname === '/' || 
                     pathname === '/login' || 
                     pathname === '/register' || 
                     pathname.includes('/password-recovery') || 
                     pathname.includes('/reset-password');

  // If we're on a public page OR user is authenticated, don't show the footer
  if (isPublicPage || isAuthenticated) {
    // Return null to completely hide the footer
    return null;
  }

  return (
    <footer className={`bg-gray-800 text-white ${className}`}>
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div className="flex-1 min-w-[200px] max-w-xs">
            <h3 className="text-sm font-semibold mb-2">Quick Links</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link href="/dashboard" className="text-gray-300 hover:text-white">Dashboard</Link>
              <Link href="/documents" className="text-gray-300 hover:text-white">Documents</Link>
              <Link href="/trainings?tab=upcoming" className="text-gray-300 hover:text-white">Trainings</Link>
              <Link href="/personnel" className="text-gray-300 hover:text-white">Personnel</Link>
            </div>
          </div>
          <div className="flex-1 min-w-[200px] max-w-xs">
            <h3 className="text-sm font-semibold mb-2">Contact</h3>
            <div className="text-xs text-gray-300 space-y-1">
              <p>Email: support@afp.mil</p>
              <p>Phone: +63 (2) 8911-6001</p>
              <p>Camp General E. Aguinaldo, QC</p>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-700">
          {/* Copyright text removed */}
        </div>
      </div>
    </footer>
  );
};

export default Footer; 