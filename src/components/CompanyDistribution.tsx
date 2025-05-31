'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';

// Essential companies that should always be displayed
const ESSENTIAL_COMPANIES = [
  'Alpha',
  'Bravo',
  'Charlie',
  'Headquarters',
  'NERRSC (NERR-Signal Company)',
  'NERRFAB (NERR-Field Artillery Battery)'
];

interface CompanyData {
  _id?: string;
  name?: string;
  count?: number;
  total?: number;
  active?: number;
  activeCount?: number;
}

export default function CompanyDistribution() {
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [debug, setDebug] = useState<string>('');
  const { getToken } = useAuth();

  useEffect(() => {
    fetchCompanyDistribution();
  }, []);

  // Helper function to normalize company names
  const normalizeCompanyName = (name: string): string => {
    return name?.toLowerCase().trim() || '';
  };

  const fetchPersonnelByCompany = async (token: string) => {
    try {
      // Fetch all personnel
      console.log('Fetching personnel data...');
      const response = await fetch('/api/personnel?pageSize=1000', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch personnel data');
      }
      
      const data = await response.json();
      
      if (!data.success || !data.data?.personnel) {
        throw new Error('Invalid personnel data response');
      }
      
      // Count personnel by company
      const personnelList = data.data.personnel;
      console.log(`Found ${personnelList.length} personnel records`);
      
      // Debug: log company distribution
      const companyDebug: Record<string, number> = {};
      personnelList.forEach((p: any) => {
        if (p.company) {
          companyDebug[p.company] = (companyDebug[p.company] || 0) + 1;
        }
      });
      console.log('Companies found in personnel data:', companyDebug);
      setDebug(JSON.stringify(companyDebug, null, 2));
      
      const companyCount = new Map<string, number>();
      
      // Initialize essential companies with zero count
      ESSENTIAL_COMPANIES.forEach(company => {
        companyCount.set(company, 0);
      });
      
      // Count personnel for each company
      personnelList.forEach((person: any) => {
        if (!person.company) return;
        
        // Store original company name for debugging
        const originalCompany = person.company;
        
        // Find matching essential company (case insensitive)
        const normalizedPersonCompany = normalizeCompanyName(person.company);
        
        let matched = false;
        for (const company of ESSENTIAL_COMPANIES) {
          const normalizedCompany = normalizeCompanyName(company);
          const shortName = company.includes('(') ? normalizeCompanyName(company.split('(')[0]) : '';
          
          // Check for match with full name or abbreviation
          if (normalizedPersonCompany === normalizedCompany || 
              (shortName && normalizedPersonCompany === shortName)) {
            companyCount.set(company, (companyCount.get(company) || 0) + 1);
            console.log(`Matched personnel to company: ${originalCompany} -> ${company}`);
            matched = true;
            break;
          }
        }
        
        // If not matched to an essential company, add to the map
        if (!matched && person.company) {
          companyCount.set(person.company, (companyCount.get(person.company) || 0) + 1);
          console.log(`Unmatched company: ${originalCompany}`);
        }
      });
      
      // Convert map to array
      const companyData = Array.from(companyCount.entries()).map(([name, count]) => ({
        name,
        count
      }));
      
      console.log('Processed company distribution:', companyData);
      return companyData;
    } catch (error) {
      console.error('Error fetching personnel data:', error);
      return ESSENTIAL_COMPANIES.map(name => ({ name, count: 0 }));
    }
  };

  const fetchCompanyDistribution = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      
      if (!token) {
        throw new Error('Authentication failed');
      }
      
      // Try to get data by fetching all personnel first (most accurate)
      const personnelByCompany = await fetchPersonnelByCompany(token);
      
      // Sort companies - essential companies first in predefined order
      const sortedCompanies = personnelByCompany.sort((a, b) => {
        const aIndex = ESSENTIAL_COMPANIES.indexOf(a.name || '');
        const bIndex = ESSENTIAL_COMPANIES.indexOf(b.name || '');
        
        // Sort essential companies by their order in the array
        if (aIndex >= 0 && bIndex >= 0) {
          return aIndex - bIndex;
        }
        // Essential companies come before non-essential
        else if (aIndex >= 0) {
          return -1;
        }
        else if (bIndex >= 0) {
          return 1;
        }
        // Sort remaining companies alphabetically
        else {
          return (a.name || '').localeCompare(b.name || '');
        }
      });
      
      // Ensure we only show essential companies for cleaner UI
      const essentialCompanies = sortedCompanies.filter(c => 
        ESSENTIAL_COMPANIES.includes(c.name || '')
      );
      
      console.log('Final company distribution for display:', essentialCompanies);
      setCompanies(essentialCompanies);
    } catch (error) {
      console.error('Error fetching company distribution:', error);
      
      // Last resort, use hardcoded companies
      const defaultCompanies = ESSENTIAL_COMPANIES.map(name => ({
        name,
        count: 0
      }));
      
      setCompanies(defaultCompanies);
    } finally {
      setLoading(false);
    }
  };

  const getCompanyDisplayName = (name: string) => {
    // Shorten long company names for display
    if (name === 'NERRFAB (NERR-Field Artillery Battery)') return 'NERRFAB';
    if (name === 'NERRSC (NERR-Signal Company)') return 'NERRSC';
    return name;
  };

  return (
    <div className="p-4">
      <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
        <BuildingOfficeIcon className="h-3 w-3 mr-1 text-indigo-600" /> Company Distribution
      </h3>
      
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {companies.map((company) => (
            <div key={company.name} className="flex justify-between items-center text-xs px-2 py-1 bg-indigo-50 rounded break-words">
              <span className="font-medium text-indigo-700 pr-1 overflow-hidden">
                {getCompanyDisplayName(company.name || '')}
              </span>
              <span className="font-bold text-indigo-800 flex-shrink-0">{company.count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Add this to see the debug output in development */}
      {process.env.NODE_ENV === 'development' && debug && (
        <div className="mt-4 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40 hidden">
          <pre>{debug}</pre>
        </div>
      )}
    </div>
  );
} 