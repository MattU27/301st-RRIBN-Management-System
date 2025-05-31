"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ChartBarIcon, 
  ArrowTrendingUpIcon,
  UserIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const analyticsRoutes = [
  {
    name: 'System Analytics',
    href: '/analytics/system',
    icon: ChartBarIcon,
    description: 'Overview of system-wide performance and metrics'
  },
  {
    name: 'Prescriptive Analytics',
    href: '/analytics/prescriptive',
    icon: ArrowTrendingUpIcon,
    description: 'AI-driven recommendations and insights'
  },
  {
    name: 'Promotion Policies',
    href: '/analytics/promotion-policies',
    icon: UserIcon,
    description: 'Analyze and manage promotion criteria and recommendations'
  },
  {
    name: 'Reports',
    href: '/analytics/reports',
    icon: DocumentTextIcon,
    description: 'Generate and view custom reports'
  }
];

export default function AnalyticsNav() {
  const pathname = usePathname();
  
  return (
    <div className="bg-white shadow rounded-lg mb-6">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Analytics Navigation</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Navigate between different analytics sections
        </p>
      </div>
      <div className="border-t border-gray-200">
        <nav className="flex overflow-x-auto py-3 px-4">
          <ul className="flex space-x-8">
            {analyticsRoutes.map((route) => {
              const Icon = route.icon;
              const isActive = pathname === route.href;
              
              return (
                <li key={route.name}>
                  <Link 
                    href={route.href}
                    className={`flex items-center ${isActive 
                      ? 'text-indigo-600 font-medium border-b-2 border-indigo-600 pb-1' 
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 pb-1'}`}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    <span>{route.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
} 