// Company Types
export type CompanyType = 'Alpha' | 'Bravo' | 'Charlie' | 'Delta' | 'Headquarters' | 'NERFAB';

// Personnel Status Types
export type PersonnelStatus = 'active' | 'standby' | 'leave' | 'ready' | 'deployed';

// Personnel Interface
export interface Personnel {
  id: string;
  name: string;
  rank: string;
  company: CompanyType;
  email: string;
  status: PersonnelStatus;
  lastUpdated: string;
  serviceNumber?: string;
  // Add any other fields that might be needed
} 