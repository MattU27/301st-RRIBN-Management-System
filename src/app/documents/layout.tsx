"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { DocumentTextIcon, DocumentCheckIcon } from '@heroicons/react/24/outline';

export default function DocumentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  const tabs = [
    { name: 'All Documents', href: '/documents', icon: DocumentTextIcon },
    { name: 'RIDS', href: '/documents/rids', icon: DocumentCheckIcon },
  ];

  return (
    <div>
      <div className="mb-6 border-b border-gray-200">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href || 
              (tab.href !== '/documents' && pathname.startsWith(tab.href));
            
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`
                  inline-flex items-center px-4 py-2 border-b-2 text-sm font-medium
                  ${isActive
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="h-5 w-5 mr-2" aria-hidden="true" />
                {tab.name}
              </Link>
            );
          })}
        </div>
      </div>
      {children}
    </div>
  );
} 