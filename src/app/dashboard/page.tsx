"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { UserRole } from '@/types/auth';
import AnnouncementWall from '@/components/AnnouncementWall';
import { 
  UserIcon, 
  UserGroupIcon, 
  DocumentTextIcon, 
  AcademicCapIcon, 
  BellAlertIcon, 
  CalendarIcon, 
  ChartBarIcon, 
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  CubeIcon,
  CheckCircleIcon,
  BoltIcon,
  UserPlusIcon,
  ArrowDownTrayIcon,
  ClockIcon,
  HeartIcon,
  DocumentCheckIcon,
  DocumentDuplicateIcon,
  LightBulbIcon,
  MegaphoneIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import ReadinessChart from '@/components/ReadinessChart';
import { toast } from 'react-hot-toast';

// Define interfaces for the state types
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

// Define interfaces for API response data
interface PersonnelStatsResponse {
  success: boolean;
  data: {
    total: number;
    active: number;
    companies?: ReadinessData[];
  };
}

interface DocumentStatsResponse {
  success: boolean;
  data: {
    total: number;
    pending: number;
    verified: number;
  };
}

interface TrainingStatsResponse {
  success: boolean;
  data: {
    upcoming: number;
    completed: number;
    totalRegistrations: number;
    completedRegistrations: number;
  };
}

interface ActivityResponse {
  success: boolean;
  data: {
    activities: ActivityData[];
  };
}

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading, hasSpecificPermission } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalPersonnel: 0,
    activePersonnel: 0,
    readyPersonnel: 0,
    pendingDocuments: 0,
    verifiedDocuments: 0,
    documentCompletionRate: 0,
    upcomingTrainings: 0,
    completedTrainings: 0,
    trainingParticipationRate: 0,
    readinessScore: 0
  });

  const [readinessData, setReadinessData] = useState<ReadinessData[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityData[]>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is an admin
  const isAdmin = ['administrator', 'admin'].includes(String(user?.role).toLowerCase());

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Fetch dashboard statistics
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token not found');
        }
        
        // Connect to MongoDB afp_personnel_db through API
        const baseUrl = '/api';
        
        // Fetch personnel stats
        const personnelResponse = await fetch(`${baseUrl}/personnel/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Database': 'afp_personnel_db'
          }
        });
        
        // Fetch document stats
        const documentsResponse = await fetch(`${baseUrl}/documents/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Database': 'afp_personnel_db'
          }
        });
        
        // Fetch training stats
        const trainingsResponse = await fetch(`${baseUrl}/trainings/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Database': 'afp_personnel_db'
          }
        });
        
        // Fetch recent activity
        const activityResponse = await fetch(`${baseUrl}/activity`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Database': 'afp_personnel_db'
          }
        });
        
        if (!personnelResponse.ok || !documentsResponse.ok || !trainingsResponse.ok || !activityResponse.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        
        const personnelData = await personnelResponse.json();
        const documentsData = await documentsResponse.json();
        const trainingsData = await trainingsResponse.json();
        const activityData = await activityResponse.json();
        
        if (personnelData.success && documentsData.success && trainingsData.success && activityData.success) {
          // Update stats
          setStats({
            totalPersonnel: personnelData.data.total || 0,
            activePersonnel: personnelData.data.active || 0,
            readyPersonnel: personnelData.data.readyPersonnel || personnelData.data.active || 0,
            pendingDocuments: documentsData.data.pending || 0,
            verifiedDocuments: documentsData.data.verified || 0,
            documentCompletionRate: calculateDocumentCompletionRate(documentsData),
            upcomingTrainings: trainingsData.data.upcoming || 0,
            completedTrainings: trainingsData.data.completed || 0,
            trainingParticipationRate: calculateTrainingParticipationRate(trainingsData),
            readinessScore: calculateReadinessScore(personnelData, documentsData, trainingsData)
          });
          
          // Update readiness data if available
          if (personnelData.data.companies) {
            setReadinessData(personnelData.data.companies);
          }
          
          // Set recent activity
          if (activityData.data.activities) {
            setRecentActivity(activityData.data.activities);
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Fallback to default values if API calls fail
        setStats({
          totalPersonnel: 245,
          activePersonnel: 198,
          readyPersonnel: 0,
          pendingDocuments: 12,
          verifiedDocuments: 0,
          documentCompletionRate: 0,
          upcomingTrainings: 3,
          completedTrainings: 87,
          trainingParticipationRate: 0,
          readinessScore: 78
        });
        
        // Use example data for readiness
        setReadinessData([
          {
            company: 'Alpha',
            personnel: 45,
            readyPersonnel: 38,
            documentsComplete: 92,
            trainingsComplete: 85,
            readinessScore: 88
          },
          {
            company: 'Bravo',
            personnel: 42,
            readyPersonnel: 35,
            documentsComplete: 88,
            trainingsComplete: 82,
            readinessScore: 85
          },
          {
            company: 'Charlie',
            personnel: 38,
            readyPersonnel: 30,
            documentsComplete: 78,
            trainingsComplete: 75,
            readinessScore: 76
          },
          {
            company: 'HQ',
            personnel: 25,
            readyPersonnel: 23,
            documentsComplete: 95,
            trainingsComplete: 90,
            readinessScore: 93
          },
          {
            company: 'Signal',
            personnel: 30,
            readyPersonnel: 24,
            documentsComplete: 80,
            trainingsComplete: 78,
            readinessScore: 79
          },
          {
            company: 'FAB',
            personnel: 35,
            readyPersonnel: 28,
            documentsComplete: 82,
            trainingsComplete: 80,
            readinessScore: 81
          }
        ]);
        
        // Use example data for activity
        setRecentActivity([
          {
            id: '1',
            type: 'personnel',
            action: 'created',
            details: 'Staff account created for Jane Smith',
            timestamp: new Date().toISOString(),
            user: 'admin'
          },
          {
            id: '2',
            type: 'document',
            action: 'uploaded',
            details: 'New policy document uploaded',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            user: 'admin'
          },
          {
            id: '3',
            type: 'training',
            action: 'published',
            details: 'New training schedule published',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            user: 'admin'
          },
          {
            id: '4',
            type: 'personnel',
            action: 'updated',
            details: 'Batch processing of 15 personnel records',
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            user: 'admin'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user]);
  
  // Helper function to calculate overall readiness score
  const calculateReadinessScore = (
    personnelData: PersonnelStatsResponse, 
    documentsData: DocumentStatsResponse, 
    trainingsData: TrainingStatsResponse
  ): number => {
    const documentCompletionRate = documentsData.data.verified / (documentsData.data.total || 1) * 100;
    const trainingCompletionRate = trainingsData.data.completedRegistrations / (trainingsData.data.totalRegistrations || 1) * 100;
    const personnelActiveRate = personnelData.data.active / (personnelData.data.total || 1) * 100;
    
    // Weight factors (can be adjusted as needed)
    const documentWeight = 0.3;
    const trainingWeight = 0.5;
    const personnelWeight = 0.2;
    
    // Calculate weighted average
    const readinessScore = Math.round(
      (documentCompletionRate * documentWeight) +
      (trainingCompletionRate * trainingWeight) +
      (personnelActiveRate * personnelWeight)
    );
    
    return Math.min(readinessScore, 100); // Ensure score doesn't exceed 100
  };

  // Helper function to calculate document completion rate
  const calculateDocumentCompletionRate = (documentsData: DocumentStatsResponse): number => {
    return Math.round(documentsData.data.verified / (documentsData.data.total || 1) * 100);
  };

  // Helper function to calculate training participation rate
  const calculateTrainingParticipationRate = (trainingsData: TrainingStatsResponse): number => {
    return Math.round(trainingsData.data.completedRegistrations / (trainingsData.data.totalRegistrations || 1) * 100);
  };

  // Helper function to get a formatted role name
  const getFormattedRoleName = (role?: UserRole | string): string => {
    if (!role) return 'User';
    
    const roleStr = role.toString().toLowerCase();
    if (roleStr === 'director') return 'Director';
    if (roleStr === 'administrator' || roleStr === 'admin') return 'Administrator';
    if (roleStr === 'staff') return 'Staff';
    if (roleStr === 'reservist') return 'Reservist';
    if (roleStr === 'enlisted') return 'Enlisted';
    
    // For other roles, capitalize the first letter
    return roleStr.charAt(0).toUpperCase() + roleStr.slice(1);
  };

  if (isLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleNavigation = (path: string, requiredPermission?: string) => {
    // Check if permission is required and user has it
    if (requiredPermission && !hasSpecificPermission(requiredPermission)) {
      toast.error('You do not have permission to access this feature.');
      return;
    }
    router.push(path);
  };

  // Role-specific dashboard rendering
  const renderStaffDashboard = () => (
    <div className="max-h-screen overflow-hidden">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Staff Dashboard</h2>
      
      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Card className="flex flex-col justify-between">
          <div className="flex items-center">
            <div className="bg-indigo-100 rounded-full p-2">
              <UserGroupIcon className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-md font-medium text-gray-900">{stats.totalPersonnel}</h3>
              <p className="text-xs text-gray-500">Total Personnel</p>
            </div>
          </div>
        </Card>
        <Card className="flex flex-col justify-between">
          <div className="flex items-center">
            <div className="bg-green-100 rounded-full p-2">
              <UserIcon className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-md font-medium text-gray-900">{stats.readyPersonnel}</h3>
              <p className="text-xs text-gray-500">Ready Personnel</p>
            </div>
          </div>
        </Card>
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-yellow-100 rounded-full p-2">
                <DocumentTextIcon className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-md font-medium text-gray-900">{stats.pendingDocuments}</h3>
                <p className="text-xs text-gray-500">Pending Documents</p>
              </div>
            </div>
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => handleNavigation('/documents/pending', 'manage_documents')}
            >
              Review
            </Button>
          </div>
        </Card>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Column - Announcements */}
        <Card className="h-[500px] overflow-hidden">
          <div className="h-full flex flex-col">
            <div className="flex-grow overflow-y-auto">
        <AnnouncementWall 
          showTitle={false} 
          horizontalScroll={false}
          compact={true}
        />
            </div>
          </div>
        </Card>

        {/* Right Column - Company Overview and Account Approvals */}
        <div className="space-y-4">
          {/* Company Overview */}
          <Card className="p-3">
            <div className="flex items-center mb-3">
              <BuildingOfficeIcon className="h-5 w-5 text-indigo-600 mr-2" />
              <h3 className="font-medium text-gray-900">Company Overview</h3>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div className="bg-gray-50 rounded-md p-2 text-center">
                <p className="text-sm font-medium text-gray-900">{stats.readyPersonnel}</p>
                <p className="text-xs text-gray-500">Ready</p>
              </div>
              <div className="bg-gray-50 rounded-md p-2 text-center">
                <p className="text-sm font-medium text-gray-900">{stats.totalPersonnel - stats.readyPersonnel}</p>
                <p className="text-xs text-gray-500">Standby</p>
              </div>
              <div className="bg-gray-50 rounded-md p-2 text-center">
                <p className="text-sm font-medium text-gray-900">0</p>
                <p className="text-xs text-gray-500">Retired</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="w-full"
              onClick={() => handleNavigation('/personnel', 'view_company_personnel')}
            >
              View Personnel
            </Button>
          </Card>

          {/* Account Approvals */}
          <Card className="p-3">
            <div className="flex items-center mb-3">
              <UserPlusIcon className="h-5 w-5 text-indigo-600 mr-2" />
              <h3 className="font-medium text-gray-900">Account Approvals</h3>
            </div>
            <div className="space-y-2">
              <div className="border border-gray-200 rounded-md p-2 text-center">
                <p className="text-sm text-gray-500">No pending approvals</p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                className="w-full"
                onClick={() => handleNavigation('/reservist-approvals', 'approve_reservist_accounts')}
              >
                View All Approvals
              </Button>
            </div>
          </Card>

          {/* Training Management */}
          <Card className="p-3">
            <div className="flex items-center mb-3">
              <AcademicCapIcon className="h-5 w-5 text-indigo-600 mr-2" />
              <h3 className="font-medium text-gray-900">Training Management</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500 px-1">
                <span>Next Training:</span>
                <span>Combat Readiness (Jun 15)</span>
              </div>
              <Button
                size="sm"
                variant="secondary"
                className="w-full"
                onClick={() => handleNavigation('/trainings', 'manage_trainings')}
              >
                Manage Trainings
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );

  // Completely redesigned admin dashboard
  const renderAdminDashboard = () => (
    <div className="overflow-hidden">
      {/* Only Overview tab - simplified header */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-gray-900">Administrator Dashboard</h2>
        <button 
          className="px-4 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md"
          aria-current="page"
        >
          Overview
        </button>
      </div>
      
      {/* Main content in a streamlined container */}
      <div className="bg-white rounded-lg shadow">
        {/* Combined layout with stats and announcements side by side */}
        <div className="grid grid-cols-12 gap-3 p-2">
          {/* Stats in a row - taking 7 columns */}
          <div className="col-span-7">
            <div className="grid grid-cols-3 gap-3 p-2">
              {/* Total Personnel */}
              <div className="bg-gray-50 rounded p-3 border border-gray-100">
                <h3 className="text-sm font-medium text-gray-700">Total Personnel</h3>
                <p className="text-2xl font-bold text-indigo-600">{stats.totalPersonnel}</p>
                <div className="flex items-center">
                  <span className="text-xs text-green-500 mr-1">↑ 2.5%</span>
                  <span className="text-xs text-gray-500">from last month</span>
                </div>
              </div>
              
              {/* Training Completion */}
              <div className="bg-gray-50 rounded p-3 border border-gray-100">
                <h3 className="text-sm font-medium text-gray-700">Training Completion</h3>
                <p className="text-2xl font-bold text-indigo-600">{stats.trainingParticipationRate}%</p>
                <div className="flex items-center">
                  <span className="text-xs text-green-500 mr-1">↑ 5.3%</span>
                  <span className="text-xs text-gray-500">from last quarter</span>
                </div>
              </div>
              
              {/* Document Verification */}
              <div className="bg-gray-50 rounded p-3 border border-gray-100">
                <h3 className="text-sm font-medium text-gray-700">Document Verification</h3>
                <p className="text-2xl font-bold text-indigo-600">{stats.documentCompletionRate}%</p>
                <div className="flex items-center">
                  <span className="text-xs text-red-500 mr-1">↓ 0.8%</span>
                  <span className="text-xs text-gray-500">from last week</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Announcements taking 5 columns */}
          <div className="col-span-5 p-2">
            <div className="bg-blue-50 rounded border border-blue-100 overflow-hidden h-[150px]">
              <div className="px-3 py-1.5">
                <span className="text-sm font-medium text-blue-700">Announcements</span>
              </div>
              <div className="overflow-y-auto px-3" style={{ height: '100px' }}>
                <AnnouncementWall 
                  showTitle={false} 
                  horizontalScroll={false}
                  compact={true}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Batch processing and trending data */}
        <div className="grid grid-cols-12 gap-3 p-2 pt-0">
          {/* Training chart takes 7 columns */}
          <div className="col-span-7 bg-gray-50 rounded border border-gray-100 p-3">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-700">Training Attendance Trends</h3>
            </div>
            <div className="h-36 bg-white rounded-sm flex items-center justify-center">
              <div className="text-center">
                <ChartBarIcon className="h-8 w-8 text-gray-300 mx-auto" />
                <p className="text-xs text-gray-400">Training attendance chart</p>
              </div>
            </div>
          </div>
          
          {/* Batch processing takes 5 columns */}
          <div className="col-span-5 bg-gray-50 rounded border border-gray-100 p-3">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Batch Processing</h3>
            <div className="space-y-2">
              <button className="w-full text-xs bg-white border border-gray-200 rounded py-1.5 flex items-center justify-center text-gray-700 hover:bg-gray-50">
                <ArrowDownTrayIcon className="h-4 w-4 mr-1.5 text-indigo-500" />
                Import Personnel
              </button>
              <button className="w-full text-xs bg-white border border-gray-200 rounded py-1.5 flex items-center justify-center text-gray-700 hover:bg-gray-50">
                <ArrowDownTrayIcon className="h-4 w-4 mr-1.5 text-indigo-500" transform="rotate(180)" />
                Export Reports
              </button>
              <button className="w-full text-xs bg-white border border-gray-200 rounded py-1.5 flex items-center justify-center text-gray-700 hover:bg-gray-50">
                <CheckCircleIcon className="h-4 w-4 mr-1.5 text-indigo-500" />
                Bulk Update
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Finally, the director dashboard
  const renderDirectorDashboard = () => (
    <div className="space-y-4">
      {/* First row - main cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Analytics card */}
        <Card className="h-[300px] overflow-auto">
          <div className="p-4">
            <div className="flex items-center mb-3">
              <ChartBarIcon className="h-6 w-6 text-indigo-600" />
              <h2 className="ml-3 text-md font-medium text-gray-900">System-wide Analytics</h2>
            </div>
            <p className="text-xs text-gray-600 mb-3">View comprehensive analytics across the entire organization.</p>
            <div className="space-y-2">
              <Button 
                variant="primary"
                size="sm" 
                className="w-full" 
                onClick={() => handleNavigation('/analytics/system', 'view_audit_logs')}
              >
                System Analytics Dashboard
              </Button>
              <Button 
                variant="secondary"
                size="sm" 
                className="w-full" 
                onClick={() => handleNavigation('/analytics/reports', 'run_reports')}
              >
                Generate Reports
              </Button>
            </div>
          </div>
        </Card>

        {/* System Administration card */}
        <Card className="h-[300px] overflow-auto">
          <div className="p-4">
            <div className="flex items-center mb-3">
              <Cog6ToothIcon className="h-6 w-6 text-indigo-600" />
              <h2 className="ml-3 text-md font-medium text-gray-900">System Administration</h2>
            </div>
            <p className="text-xs text-gray-600 mb-3">Oversee and manage system settings and administrators.</p>
            <div className="space-y-2">
              <Button 
                variant="primary"
                size="sm" 
                className="w-full" 
                onClick={() => handleNavigation('/admin/accounts', 'create_admin_accounts')}
              >
                Manage Admin Accounts
              </Button>
              <Button 
                variant="secondary"
                size="sm" 
                className="w-full" 
                onClick={() => handleNavigation('/admin/settings', 'access_system_settings')}
              >
                System Configuration
              </Button>
              <Button 
                variant="secondary"
                size="sm" 
                className="w-full" 
                onClick={() => handleNavigation('/admin/audit-logs', 'view_audit_logs')}
              >
                Audit Logs
              </Button>
            </div>
          </div>
        </Card>

        {/* Strategic Overview card */}
        <Card className="h-[300px] overflow-auto">
          <div className="p-4">
            <div className="flex items-center mb-3">
              <BoltIcon className="h-6 w-6 text-indigo-600" />
              <h2 className="ml-3 text-md font-medium text-gray-900">Strategic Overview</h2>
            </div>
            <p className="text-xs text-gray-600 mb-3">Access high-level organizational metrics and KPIs.</p>
            <div className="space-y-2">
              <Button 
                variant="primary"
                size="sm" 
                className="w-full" 
                onClick={() => handleNavigation('/analytics/readiness', 'view_personnel')}
              >
                Readiness Assessment
              </Button>
              <Button 
                variant="secondary"
                size="sm" 
                className="w-full" 
                onClick={() => handleNavigation('/analytics/performance', 'run_reports')}
              >
                Performance Metrics
              </Button>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Second row - Announcements Wall (horizontal) */}
      <div className="h-[250px]">
        <AnnouncementWall />
      </div>
    </div>
  );

  // Also create a simplified reservist dashboard
  const renderReservistDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card title="My Documents" className="h-[400px] overflow-auto">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-500">Completed</span>
            <span className="text-sm font-medium text-gray-900">4/6</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '66%' }}></div>
          </div>
          <ul className="space-y-2">
            <li className="flex justify-between items-center">
              <div className="flex items-center">
                <DocumentTextIcon className="h-4 w-4 text-gray-400" />
                <span className="ml-2 text-xs text-gray-600">Personal Information Form</span>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Verified
              </span>
            </li>
            <li className="flex justify-between items-center">
              <div className="flex items-center">
                <DocumentTextIcon className="h-4 w-4 text-gray-400" />
                <span className="ml-2 text-xs text-gray-600">Medical Certificate</span>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Pending
              </span>
            </li>
          </ul>
          <Button 
            size="sm" 
            variant="secondary" 
            className="w-full"
            onClick={() => handleNavigation('/documents')}
          >
            View All Documents
          </Button>
        </div>
      </Card>

      <Card title="Upcoming Trainings" className="h-[400px] overflow-auto">
        <div className="space-y-3">
          <ul className="space-y-2">
            <li className="flex justify-between items-center">
              <div className="flex items-center">
                <AcademicCapIcon className="h-4 w-4 text-gray-400" />
                <div className="ml-2">
                  <span className="text-xs font-medium text-gray-900">Basic Combat Training</span>
                  <p className="text-xs text-gray-500">March 15, 2024 - Camp Aguinaldo</p>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="primary"
                onClick={() => handleNavigation('/trainings/register/basic-combat')}
              >
                Register
              </Button>
            </li>
            <li className="flex justify-between items-center">
              <div className="flex items-center">
                <AcademicCapIcon className="h-4 w-4 text-gray-400" />
                <div className="ml-2">
                  <span className="text-xs font-medium text-gray-900">First Aid Seminar</span>
                  <p className="text-xs text-gray-500">April 2, 2024 - Medical Center</p>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="primary"
                onClick={() => handleNavigation('/trainings/register/first-aid')}
              >
                Register
              </Button>
            </li>
          </ul>
          <Button 
            size="sm" 
            variant="secondary" 
            className="w-full"
            onClick={() => handleNavigation('/trainings?tab=upcoming')}
          >
            View All Trainings
          </Button>
        </div>
      </Card>
    </div>
  );

  // Main return function with simplified role determination
  return (
    <main className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">
        Welcome, {user.firstName} {user.lastName}
      </h1>
      
      {/* Render dashboard based on user role string value */}
      {['administrator', 'admin'].includes(String(user.role).toLowerCase()) && renderAdminDashboard()}
      {['director'].includes(String(user.role).toLowerCase()) && renderDirectorDashboard()}
      {['staff'].includes(String(user.role).toLowerCase()) && renderStaffDashboard()}
      {['reservist', 'enlisted'].includes(String(user.role).toLowerCase()) && renderReservistDashboard()}
    </main>
  );
} 