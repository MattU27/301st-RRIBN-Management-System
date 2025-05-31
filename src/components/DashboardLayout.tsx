"use client";

import React, { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardLayoutProps {
  welcomeSection?: ReactNode;
  systemOverview?: ReactNode[];
  quickActions?: ReactNode[];
  managementSections?: ReactNode[];
  className?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  welcomeSection,
  systemOverview = [],
  quickActions = [],
  managementSections = [],
  className = '',
}) => {
  const { user } = useAuth();
  
  if (!user) return null;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Welcome section - stays at the top */}
      {welcomeSection && (
        <div className="mb-6">
          {welcomeSection}
        </div>
      )}

      {/* System Overview - rearranged horizontally */}
      {systemOverview.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">System Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {systemOverview.map((item, index) => (
              <div key={`overview-${index}`}>
                {item}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions - rearranged horizontally */}
      {quickActions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((item, index) => (
              <div key={`action-${index}`}>
                {item}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Management Sections - arranged in 2 columns */}
      {managementSections.length > 0 && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {managementSections.map((section, index) => (
              <div key={`section-${index}`}>
                {section}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout; 