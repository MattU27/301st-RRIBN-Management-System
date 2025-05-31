"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { 
  UserIcon, 
  UserGroupIcon, 
  DocumentTextIcon, 
  AcademicCapIcon, 
  CheckCircleIcon,
  DocumentCheckIcon,
  ClockIcon,
  UserPlusIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import ReadinessChart from '@/components/ReadinessChart';

// Define interfaces for the state types (simplified for example)
interface ReadinessData {
  company: string;
  personnel: number;
  readyPersonnel: number;
  documentsComplete: number;
  trainingsComplete: number;
  readinessScore: number;
}

interface ActivityData {
  id: string;
  type: string;
  action: string;
  details: string;
  timestamp: string;
  user: string;
}

export default function DashboardPageExample() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalPersonnel: 55,
    activePersonnel: 0,
    pendingDocuments: 1,
    verifiedDocuments: 0,
    documentCompletionRate: 0,
    upcomingTrainings: 0,
    completedTrainings: 0,
    trainingParticipationRate: 0,
    readinessScore: 0
  });

  const [readinessData, setReadinessData] = useState<ReadinessData[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityData[]>([]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Simplified function to navigate to other pages
  const handleNavigation = (path: string) => {
    router.push(path);
  };

  // Welcome section component
  const WelcomeSection = () => (
    <Card className="bg-white shadow-md">
      <div className="flex items-center">
        <div className="flex-shrink-0 bg-indigo-100 p-3 rounded-full">
          <UserIcon className="h-8 w-8 text-indigo-600" />
        </div>
        <div className="ml-4">
          <h1 className="text-xl font-medium text-gray-900">Welcome, {user?.name || 'Gerimiah Almero'}</h1>
          <p className="text-sm text-gray-500">
            Staff | Captain | NERRSC (NERR-Signal Company) Company
          </p>
        </div>
      </div>
    </Card>
  );

  // System overview components
  const PersonnelOverview = () => (
    <Card className="bg-blue-50">
      <div className="flex flex-col">
        <div className="flex items-center mb-3">
          <UserGroupIcon className="h-6 w-6 text-blue-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Personnel</h3>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Total:</span>
            <span className="font-medium">{stats.totalPersonnel}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Active:</span>
            <span className="font-medium">{stats.activePersonnel}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Readiness:</span>
            <span className="font-medium">0%</span>
          </div>
        </div>
      </div>
    </Card>
  );

  const DocumentsOverview = () => (
    <Card className="bg-green-50">
      <div className="flex flex-col">
        <div className="flex items-center mb-3">
          <DocumentTextIcon className="h-6 w-6 text-green-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Documents</h3>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Pending:</span>
            <span className="font-medium">{stats.pendingDocuments}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Verified:</span>
            <span className="font-medium">N/A</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Completion:</span>
            <span className="font-medium">N/A%</span>
          </div>
        </div>
      </div>
    </Card>
  );

  const TrainingsOverview = () => (
    <Card className="bg-yellow-50">
      <div className="flex flex-col">
        <div className="flex items-center mb-3">
          <AcademicCapIcon className="h-6 w-6 text-yellow-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Trainings</h3>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Upcoming:</span>
            <span className="font-medium">{stats.upcomingTrainings}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Completed:</span>
            <span className="font-medium">{stats.completedTrainings}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Participation:</span>
            <span className="font-medium">N/A%</span>
          </div>
        </div>
      </div>
    </Card>
  );

  // Quick actions components
  const TotalPersonnelAction = () => (
    <Card className="bg-white" interactive onClick={() => handleNavigation('/personnel')}>
      <div className="flex items-center">
        <div className="bg-indigo-100 p-3 rounded-full">
          <UserGroupIcon className="h-6 w-6 text-indigo-600" />
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-semibold text-gray-900">55</h3>
          <p className="text-sm text-gray-500">Total Personnel</p>
        </div>
      </div>
      <div className="mt-3">
        <Button 
          label="View All" 
          onClick={() => handleNavigation('/personnel')} 
          variant="outline"
          className="text-sm w-full"
        />
      </div>
    </Card>
  );

  const ActivePersonnelAction = () => (
    <Card className="bg-white" interactive onClick={() => handleNavigation('/personnel')}>
      <div className="flex items-center">
        <div className="bg-green-100 p-3 rounded-full">
          <CheckCircleIcon className="h-6 w-6 text-green-600" />
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-semibold text-gray-900">0</h3>
          <p className="text-sm text-gray-500">Active Personnel</p>
        </div>
      </div>
      <div className="mt-3">
        <Button 
          label="Review" 
          onClick={() => handleNavigation('/personnel')} 
          variant="outline"
          className="text-sm w-full"
        />
      </div>
    </Card>
  );

  const PendingDocumentsAction = () => (
    <Card className="bg-white" interactive onClick={() => handleNavigation('/documents')}>
      <div className="flex items-center">
        <div className="bg-amber-100 p-3 rounded-full">
          <DocumentDuplicateIcon className="h-6 w-6 text-amber-600" />
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-semibold text-gray-900">1</h3>
          <p className="text-sm text-gray-500">Pending Documents</p>
        </div>
      </div>
      <div className="mt-3">
        <Button 
          label="Review" 
          onClick={() => handleNavigation('/documents')} 
          variant="outline"
          className="text-sm w-full"
        />
      </div>
    </Card>
  );

  // Management sections components
  const PersonnelManagement = () => (
    <Card className="bg-white">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Personnel Management</h3>
        <Button 
          label="View All" 
          onClick={() => handleNavigation('/personnel')} 
          variant="outline"
          className="text-xs"
        />
      </div>
      <div className="bg-gray-50 p-3 rounded-lg mb-3">
        <h4 className="font-medium mb-1">Recent Updates</h4>
        <div className="text-sm text-gray-500">
          <p>No updates available</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button 
          label="Add Personnel" 
          onClick={() => handleNavigation('/personnel/add')}
          className="flex items-center justify-center"
          icon={<UserPlusIcon className="h-4 w-4 mr-1" />}
        />
        <Button 
          label="View Roster" 
          onClick={() => handleNavigation('/personnel')}
          variant="outline"
          className="flex items-center justify-center"
          icon={<UserGroupIcon className="h-4 w-4 mr-1" />}
        />
      </div>
    </Card>
  );

  const DocumentVerification = () => (
    <Card className="bg-white">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Document Verification</h3>
        <Button 
          label="View All" 
          onClick={() => handleNavigation('/documents')} 
          variant="outline"
          className="text-xs"
        />
      </div>
      <div className="bg-gray-50 p-3 rounded-lg mb-3">
        <h4 className="font-medium mb-1">Pending Verification</h4>
        <div className="text-sm">
          <div className="flex justify-between items-center py-1">
            <span className="text-blue-600">ID Card.pdf</span>
            <Button 
              label="Review" 
              onClick={() => handleNavigation('/documents/pending')}
              variant="small"
              className="text-xs"
            />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button 
          label="Verify Documents" 
          onClick={() => handleNavigation('/documents/verify')}
          className="flex items-center justify-center"
          icon={<DocumentCheckIcon className="h-4 w-4 mr-1" />}
        />
        <Button 
          label="Document History" 
          onClick={() => handleNavigation('/documents/history')}
          variant="outline"
          className="flex items-center justify-center"
          icon={<ClockIcon className="h-4 w-4 mr-1" />}
        />
      </div>
    </Card>
  );

  return (
    <DashboardLayout
      welcomeSection={<WelcomeSection />}
      systemOverview={[
        <PersonnelOverview key="personnel" />,
        <DocumentsOverview key="documents" />,
        <TrainingsOverview key="trainings" />
      ]}
      quickActions={[
        <TotalPersonnelAction key="total-personnel" />,
        <ActivePersonnelAction key="active-personnel" />,
        <PendingDocumentsAction key="pending-documents" />
      ]}
      managementSections={[
        <PersonnelManagement key="personnel-management" />,
        <DocumentVerification key="document-verification" />
      ]}
    />
  );
} 