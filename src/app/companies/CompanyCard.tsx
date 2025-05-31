import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { 
  UsersIcon, 
  BuildingOfficeIcon, 
  ChartBarIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

interface CompanyData {
  name: string;
  totalPersonnel: number;
  activePersonnel: number;
  readinessScore: number;
  documentsComplete: number;
  trainingsComplete: number;
}

interface CompanyCardProps {
  company: CompanyData;
  onViewPersonnel?: (companyName: string) => void;
  onViewReport?: (companyName: string) => void;
}

const getReadinessColor = (score: number) => {
  if (score >= 90) return 'bg-green-500';
  if (score >= 75) return 'bg-yellow-500';
  return 'bg-red-500';
};

// Format display name for easier reading
const formatDisplayName = (name: string) => {
  // For NERRSC and NERRFAB, extract the short name from parentheses
  if (name.includes('NERR')) {
    const match = name.match(/^([A-Z]+)/);
    return match ? match[0] : name;
  }
  return name;
};

// Get the full name for tooltip
const getFullName = (name: string) => {
  // Only return a different full name if it's a NERR company
  if (name.includes('NERR') && name.includes('(')) {
    return name;
  }
  return '';
};

export default function CompanyCard({ company, onViewPersonnel, onViewReport }: CompanyCardProps) {
  const router = useRouter();
  
  // Format company name for URL
  const formatCompanyName = (name: string) => {
    return name.toLowerCase().replace(/[()]/g, "").replace(/ /g, "-");
  };
  
  // Default handlers if not provided
  const handleViewPersonnel = () => {
    if (onViewPersonnel) {
      onViewPersonnel(company.name);
    } else {
      router.push(`/personnel/company/${formatCompanyName(company.name)}`);
    }
  };
  
  const handleViewReport = () => {
    if (onViewReport) {
      onViewReport(company.name);
    } else {
      router.push(`/reports/company/${formatCompanyName(company.name)}`);
    }
  };
  
  // Get display name and full name
  const displayName = formatDisplayName(company.name);
  const fullName = getFullName(company.name);
  
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
      <div className="p-4">
        {/* Card Header - Company Name, Icon and Readiness Score in one row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className="bg-indigo-100 rounded-full p-2 flex-shrink-0">
              <BuildingOfficeIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-3 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate" title={fullName}>
                {displayName}
              </h3>
              {fullName && (
                <p className="text-xs text-gray-500 truncate" title={fullName}>{fullName}</p>
              )}
            </div>
          </div>
          
          <div>
            <div className="flex items-center">
              <span className="text-xs font-medium text-gray-700 mr-2">Readiness:</span>
              <span className="text-xs font-medium text-gray-700">{company.readinessScore}%</span>
            </div>
            <div className="w-20 bg-gray-200 rounded-full h-1.5 mt-1">
              <div 
                className={`h-1.5 rounded-full ${getReadinessColor(company.readinessScore)}`} 
                style={{ width: `${company.readinessScore}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex justify-between mb-3 px-2">
          <div className="text-center">
            <div className="text-xs font-medium text-gray-500">Personnel</div>
            <div className="flex items-baseline justify-center mt-0.5">
              <div className="text-sm font-semibold text-gray-900">{company.activePersonnel || 0}</div>
              <div className="ml-1 text-xs text-gray-500">/{company.totalPersonnel || 0}</div>
            </div>
          </div>

          <div className="text-center">
            <div className="text-xs font-medium text-gray-500">Documents</div>
            <div className="text-sm font-semibold text-gray-900 mt-0.5">{company.documentsComplete || 0}%</div>
          </div>

          <div className="text-center">
            <div className="text-xs font-medium text-gray-500">Trainings</div>
            <div className="text-sm font-semibold text-gray-900 mt-0.5">{company.trainingsComplete || 0}%</div>
          </div>
        </div>
        
        {/* Actions Row */}
        <div className="flex space-x-2 pt-2 border-t border-gray-200">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleViewPersonnel}
            className="text-xs py-1 text-blue-600 border border-blue-300 hover:bg-blue-50 flex-1"
          >
            <UsersIcon className="h-4 w-4 mr-1" />
            View
          </Button>
          
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push(`/personnel/manage/${formatCompanyName(company.name)}`)}
            className="text-xs py-1 text-indigo-600 border border-indigo-300 hover:bg-indigo-50 flex-1"
          >
            <PencilIcon className="h-4 w-4 mr-1" />
            Manage
          </Button>
          
          <Button 
            variant="primary" 
            size="sm"
            onClick={handleViewReport}
            className="text-xs py-1 bg-yellow-400 hover:bg-yellow-500 text-gray-800 border-none flex-1"
          >
            <ChartBarIcon className="h-4 w-4 mr-1" />
            Report
          </Button>
        </div>
      </div>
    </Card>
  );
} 