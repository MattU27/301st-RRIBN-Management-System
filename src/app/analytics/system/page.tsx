"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/ui/Card';
import AnalyticsNav from '@/components/AnalyticsNav';
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  DocumentTextIcon, 
  AcademicCapIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ShieldCheckIcon,
  BoltIcon,
  FireIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

// Analytics data interface
interface AnalyticsData {
  personnel: {
    total: number;
    active: number;
    pending: number;
    activeRate: number;
  };
  companies: Array<{
    name: string;
    readinessScore: number;
    totalPersonnel: number;
    activePersonnel: number;
    documentsComplete: number;
    trainingsComplete: number;
  }>;
  documents: {
    total: number;
    pending: number;
    verified: number;
    completionRate: number;
  };
  trainings: {
    upcoming: number;
    completed: number;
    total: number;
    participationRate: number;
    monthlyCompletion: Array<{
      year: number;
      month: number;
      count: number;
    }>;
  };
  distribution: {
    personnelByCompany: Array<{
      company: string;
      count: number;
    }>;
  };
  risks: {
    lowReadinessCompanies: Array<{
      name: string;
      readinessScore: number;
      documentsComplete: number;
      trainingsComplete: number;
    }>;
    documentBacklog: Array<{
      company: string;
      count: number;
    }>;
  };
}

// Mock data for fallback
const MOCK_ANALYTICS_DATA: AnalyticsData = {
  personnel: {
    total: 245,
    active: 208,
    pending: 37,
    activeRate: 85
  },
  companies: [
    {
      name: "Alpha",
      readinessScore: 92,
      totalPersonnel: 45,
      activePersonnel: 42,
      documentsComplete: 95,
      trainingsComplete: 88
    },
    {
      name: "Bravo",
      readinessScore: 85,
      totalPersonnel: 42,
      activePersonnel: 38,
      documentsComplete: 82,
      trainingsComplete: 80
    },
    {
      name: "Charlie",
      readinessScore: 78,
      totalPersonnel: 38,
      activePersonnel: 32,
      documentsComplete: 75,
      trainingsComplete: 72
    },
    {
      name: "Headquarters",
      readinessScore: 95,
      totalPersonnel: 25,
      activePersonnel: 24,
      documentsComplete: 98,
      trainingsComplete: 92
    },
    {
      name: "NERRSC", // NERR-Signal Company
      readinessScore: 88,
      totalPersonnel: 55,
      activePersonnel: 48,
      documentsComplete: 85,
      trainingsComplete: 84
    },
    {
      name: "NERRFAB", // NERR-Field Artillery Battery
      readinessScore: 80, // Example score
      totalPersonnel: 40, // Example size
      activePersonnel: 35, // Example active
      documentsComplete: 80, // Example docs
      trainingsComplete: 75 // Example training
    }
  ],
  documents: {
    total: 1450,
    pending: 120,
    verified: 1330,
    completionRate: 92
  },
  trainings: {
    upcoming: 8,
    completed: 45,
    total: 53,
    participationRate: 88,
    monthlyCompletion: [
      { year: 2023, month: 11, count: 6 },
      { year: 2023, month: 12, count: 8 },
      { year: 2024, month: 1, count: 7 },
      { year: 2024, month: 2, count: 10 },
      { year: 2024, month: 3, count: 8 },
      { year: 2024, month: 4, count: 12 }
    ]
  },
  distribution: {
    personnelByCompany: [
      { company: "Alpha", count: 45 },
      { company: "Bravo", count: 42 },
      { company: "Charlie", count: 38 },
      { company: "Headquarters", count: 25 },
      { company: "NERRSC", count: 55 },
      { company: "NERRFAB", count: 40 }
    ]
  },
  risks: {
    lowReadinessCompanies: [
      {
        name: "Charlie",
        readinessScore: 78,
        documentsComplete: 75,
        trainingsComplete: 72
      }
    ],
    documentBacklog: [
      { company: "Charlie", count: 28 },
      { company: "Delta", count: 22 },
      { company: "Bravo", count: 20 }
    ]
  }
};

// Helper function to get cookies
const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

export default function SystemAnalyticsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>(MOCK_ANALYTICS_DATA);
  const [lastRefreshed, setLastRefreshed] = useState<string>(new Date().toLocaleString());
  
  // Section toggle states
  const [showExecutiveSummary, setShowExecutiveSummary] = useState(true);
  const [showOperationalReadiness, setShowOperationalReadiness] = useState(true);
  const [showPerformanceOverview, setShowPerformanceOverview] = useState(true);
  const [showTrainingTrend, setShowTrainingTrend] = useState(true);
  const [showCompanyPerformance, setShowCompanyPerformance] = useState(true);
  const [showRiskAnalysis, setShowRiskAnalysis] = useState(true);
  
  // Add these state variables for popups
  const [showCompanyDetails, setShowCompanyDetails] = useState(false);
  const [showTrainingDetails, setShowTrainingDetails] = useState(false);
  const [showRiskDetails, setShowRiskDetails] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<null | any>(null);

  // Fetch analytics data from the API
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Try different ways to get the token
      let token = null;
      if (typeof window !== 'undefined') {
        token = 
          localStorage.getItem('token') || 
          getCookie('token') || 
          sessionStorage.getItem('token');
      }
      
      if (!token) {
        console.error('Authentication token not found');
        // Fall back to mock data
        setAnalyticsData(MOCK_ANALYTICS_DATA);
        setLoading(false);
        setLastRefreshed(new Date().toLocaleString());
        return;
      }

      console.log('Fetching analytics data with token:', token.substring(0, 10) + '...');
      
      const response = await fetch('/api/analytics/stats', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Database': 'afp_personnel_db'
        }
      });

      if (!response.ok) {
        console.error('API Error:', response.status, response.statusText);
        // Fall back to mock data
        setAnalyticsData(MOCK_ANALYTICS_DATA);
      } else {
        const data = await response.json();
        
        if (data.success) {
          console.log('Successfully fetched analytics data');
          setAnalyticsData(data.data);
        } else {
          console.error('API returned success: false', data.message);
          // Fall back to mock data
          setAnalyticsData(MOCK_ANALYTICS_DATA);
        }
      }
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      // Fall back to mock data
      setAnalyticsData(MOCK_ANALYTICS_DATA);
    } finally {
      setLoading(false);
      setLastRefreshed(new Date().toLocaleString());
    }
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.role !== 'director') {
      router.push('/dashboard');
      return;
    }

    fetchAnalyticsData();
  }, [isLoading, isAuthenticated, router, user]);

  const getMonthName = (monthNumber: number) => {
    const months = [
      'January', 'February', 'March', 'April', 
      'May', 'June', 'July', 'August', 
      'September', 'October', 'November', 'December'
    ];
    return months[monthNumber - 1];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">System-wide Analytics</h1>
        <div className="flex items-center">
          <span className="text-sm text-gray-500 mr-4">Last refreshed: {lastRefreshed}</span>
          <button 
            onClick={() => fetchAnalyticsData()} 
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Data
          </button>
        </div>
      </div>

      {/* Grid layout for sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Column 1 */}
        <div className="space-y-4">
          {/* Executive Summary Card */}
          <Card>
            <div className="p-4">
              <div 
                className="flex items-center justify-between mb-3 cursor-pointer"
                onClick={() => setShowExecutiveSummary(!showExecutiveSummary)}
              >
                <div className="flex items-center">
                  <ShieldCheckIcon className="h-6 w-6 text-indigo-600" />
                  <h2 className="ml-3 text-lg font-medium text-gray-900">Executive Summary</h2>
                </div>
                <button className="p-1 rounded-full bg-gray-100 hover:bg-gray-200">
                  {showExecutiveSummary ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
              </div>
              
              {showExecutiveSummary && (
                <>
                  <p className="text-gray-600 mb-3">Overview of key battalion metrics and operational status.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-semibold text-gray-900">Overall Readiness</h3>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <ArrowUpIcon className="h-3 w-3 mr-1" />
                          2.1%
                        </span>
                      </div>
                      <div className="mt-2 flex items-baseline">
                        <p className="text-2xl font-semibold text-gray-900">87%</p>
                        <p className="ml-1 text-sm text-gray-500">effectiveness</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-semibold text-gray-900">Personnel Strength</h3>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <ArrowUpIcon className="h-3 w-3 mr-1" />
                          3.2%
                        </span>
                      </div>
                      <div className="mt-2 flex items-baseline">
                        <p className="text-2xl font-semibold text-gray-900">{analyticsData.personnel.active}</p>
                        <p className="ml-1 text-sm text-gray-500">active of {analyticsData.personnel.total}</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-semibold text-gray-900">Training Status</h3>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <ArrowDownIcon className="h-3 w-3 mr-1" />
                          1.5%
                        </span>
                      </div>
                      <div className="mt-2 flex items-baseline">
                        <p className="text-2xl font-semibold text-gray-900">{analyticsData.trainings.participationRate}%</p>
                        <p className="ml-1 text-sm text-gray-500">completion</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-semibold text-gray-900">Documentation</h3>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <ArrowUpIcon className="h-3 w-3 mr-1" />
                          4.3%
                        </span>
                      </div>
                      <div className="mt-2 flex items-baseline">
                        <p className="text-2xl font-semibold text-gray-900">{analyticsData.documents.completionRate}%</p>
                        <p className="ml-1 text-sm text-gray-500">verified</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Performance Overview */}
          <Card>
            <div className="p-4">
              <div 
                className="flex items-center justify-between mb-3 cursor-pointer"
                onClick={() => setShowPerformanceOverview(!showPerformanceOverview)}
              >
                <div className="flex items-center">
                  <ChartBarIcon className="h-6 w-6 text-indigo-600" />
                  <h2 className="ml-3 text-lg font-medium text-gray-900">Performance Overview</h2>
                </div>
                <button className="p-1 rounded-full bg-gray-100 hover:bg-gray-200">
                  {showPerformanceOverview ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
              </div>
              
              {showPerformanceOverview && (
                <>
                  <p className="text-gray-600 mb-3">Comprehensive view of system-wide metrics and KPIs.</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-100">
                      <div className="flex items-center mb-1">
                        <UserGroupIcon className="h-5 w-5 text-indigo-700 mr-2" />
                        <h3 className="text-sm font-semibold text-gray-900">Personnel</h3>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-indigo-600">{analyticsData.personnel.total}</div>
                        <div className="text-xs text-gray-600">Total Personnel</div>
                        <div className="mt-1 flex justify-between items-center">
                          <span className="text-xs text-gray-600">Active:</span>
                          <span className="text-xs font-bold text-indigo-600">{analyticsData.personnel.activeRate}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${analyticsData.personnel.activeRate}%` }}></div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                      <div className="flex items-center mb-1">
                        <DocumentTextIcon className="h-5 w-5 text-emerald-700 mr-2" />
                        <h3 className="text-sm font-semibold text-gray-900">Documentation</h3>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-emerald-600">{analyticsData.documents.completionRate}%</div>
                        <div className="text-xs text-gray-600">Completion Rate</div>
                        <div className="mt-1 flex justify-between items-center">
                          <span className="text-xs text-gray-600">Verified:</span>
                          <span className="text-xs font-bold text-emerald-600">{analyticsData.documents.verified}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${analyticsData.documents.completionRate}%` }}></div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                      <div className="flex items-center mb-1">
                        <AcademicCapIcon className="h-5 w-5 text-amber-700 mr-2" />
                        <h3 className="text-sm font-semibold text-gray-900">Training</h3>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-amber-600">{analyticsData.trainings.participationRate}%</div>
                        <div className="text-xs text-gray-600">Participation Rate</div>
                        <div className="mt-1 flex justify-between items-center">
                          <span className="text-xs text-gray-600">Completed:</span>
                          <span className="text-xs font-bold text-amber-600">{analyticsData.trainings.completed}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div className="bg-amber-600 h-1.5 rounded-full" style={{ width: `${analyticsData.trainings.participationRate}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>

        {/* Column 2 */}
        <div className="space-y-4">
          {/* Operational Readiness */}
          <Card>
            <div className="p-4">
              <div 
                className="flex items-center justify-between mb-3 cursor-pointer"
                onClick={() => setShowOperationalReadiness(!showOperationalReadiness)}
              >
                <div className="flex items-center">
                  <BoltIcon className="h-6 w-6 text-indigo-600" />
                  <h2 className="ml-3 text-lg font-medium text-gray-900">Operational Readiness</h2>
                </div>
                <button className="p-1 rounded-full bg-gray-100 hover:bg-gray-200">
                  {showOperationalReadiness ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
              </div>
              
              {showOperationalReadiness && (
                <>
                  <p className="text-gray-600 mb-3">Overall readiness levels across the organization.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="border rounded-lg p-3">
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">Battalion Readiness Level</h3>
                      <div className="flex justify-center">
                        <div className="relative h-40 w-40">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-3xl font-bold text-indigo-600">87%</div>
                          </div>
                          <div className="h-full w-full rounded-full border-8 border-indigo-500"></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-3">
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">Key Readiness Factors</h3>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-xs font-medium text-gray-700">Personnel</span>
                            <span className="text-xs font-medium text-gray-700">92%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: "92%" }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-xs font-medium text-gray-700">Training</span>
                            <span className="text-xs font-medium text-gray-700">83%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: "83%" }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-xs font-medium text-gray-700">Equipment</span>
                            <span className="text-xs font-medium text-gray-700">78%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div className="bg-yellow-500 h-1.5 rounded-full" style={{ width: "78%" }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-xs font-medium text-gray-700">Documentation</span>
                            <span className="text-xs font-medium text-gray-700">95%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: "95%" }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Training Completion Trend */}
          <Card>
            <div className="p-4">
              <div 
                className="flex items-center justify-between mb-3 cursor-pointer"
                onClick={() => setShowTrainingTrend(!showTrainingTrend)}
              >
                <div className="flex items-center">
                  <AcademicCapIcon className="h-6 w-6 text-indigo-600" />
                  <h2 className="ml-3 text-lg font-medium text-gray-900">Training Completion Trend</h2>
                </div>
                <div className="flex items-center">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowTrainingDetails(!showTrainingDetails);
                    }}
                    className="px-2 py-1 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-md hover:bg-indigo-100 mr-2"
                  >
                    {showTrainingDetails ? 'Show Summary' : 'Show Details'}
                  </button>
                  <button className="p-1 rounded-full bg-gray-100 hover:bg-gray-200">
                    {showTrainingTrend ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              
              {showTrainingTrend && (
                <>
                  <p className="text-gray-600 mb-3">Monthly training completion rates over the past 6 months.</p>
                  
                  {showTrainingDetails ? (
                    <div className="space-y-2">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                            <th scope="col" className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trainings Completed</th>
                            <th scope="col" className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participation Rate</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {analyticsData.trainings.monthlyCompletion.map((item, index) => (
                            <tr key={index}>
                              <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-900">
                                {getMonthName(item.month)} {item.year}
                              </td>
                              <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-900">
                                {item.count}
                              </td>
                              <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-900">
                                {Math.round((item.count / analyticsData.trainings.total) * 100)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="grid grid-cols-6 gap-2 h-40">
                      {analyticsData.trainings.monthlyCompletion.map((item, index) => {
                        const maxCount = Math.max(...analyticsData.trainings.monthlyCompletion.map(i => i.count));
                        const heightPercentage = (item.count / maxCount) * 100;
                        
                        return (
                          <div key={index} className="flex flex-col items-center">
                            <div className="flex-grow w-full flex items-end">
                              <div 
                                className="bg-indigo-500 w-full rounded-t-md" 
                                style={{ height: `${heightPercentage}%` }}
                              ></div>
                            </div>
                            <div className="mt-1 text-xs text-gray-600 whitespace-nowrap">
                              {getMonthName(item.month).substring(0, 3)}
                            </div>
                            <div className="text-xs text-gray-900 font-medium">
                              {item.count}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>
        </div>

        {/* Column 3 */}
        <div className="space-y-4">
          {/* Company Performance - simplified with popup */}
          <Card>
            <div className="p-4">
              <div 
                className="flex items-center justify-between mb-3 cursor-pointer"
                onClick={() => setShowCompanyPerformance(!showCompanyPerformance)}
              >
                <div className="flex items-center">
                  <FireIcon className="h-6 w-6 text-indigo-600" />
                  <h2 className="ml-3 text-lg font-medium text-gray-900">Company Performance</h2>
                </div>
                <div className="flex items-center">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCompanyDetails(true);
                    }}
                    className="px-2 py-1 bg-indigo-50 text-xs text-indigo-600 font-medium rounded hover:bg-indigo-100 mr-2"
                  >
                    View All Details
                  </button>
                  <button className="p-1 rounded-full bg-gray-100 hover:bg-gray-200">
                    {showCompanyPerformance ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              
              {showCompanyPerformance && (
                <>
                  <p className="text-gray-600 mb-3">Top performing companies by readiness score.</p>
                  <div className="space-y-3">
                    {analyticsData.companies
                      .sort((a, b) => b.readinessScore - a.readinessScore)
                      .slice(0, 3)
                      .map((company, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 rounded-md p-2">
                          <div className="flex items-center">
                            <div className={`w-2 h-8 rounded-l-md ${
                              company.readinessScore >= 80 ? 'bg-green-500' : 
                              company.readinessScore >= 60 ? 'bg-yellow-500' : 
                              'bg-red-500'
                            }`}></div>
                            <div className="ml-2">
                              <div className="text-sm font-medium text-gray-900">{company.name}</div>
                              <div className="text-xs text-gray-500">{company.activePersonnel} / {company.totalPersonnel} personnel</div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <span className={`text-sm font-medium mr-2 ${
                              company.readinessScore >= 80 ? 'text-green-700' : 
                              company.readinessScore >= 60 ? 'text-yellow-700' : 
                              'text-red-700'
                            }`}>
                              {company.readinessScore}%
                            </span>
                            <button 
                              className="text-xs text-indigo-600 hover:text-indigo-800"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCompany(company);
                                setShowCompanyDetails(true);
                              }}
                            >
                              Details
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Risk Analysis */}
          <Card>
            <div className="p-4">
              <div 
                className="flex items-center justify-between mb-3 cursor-pointer"
                onClick={() => setShowRiskAnalysis(!showRiskAnalysis)}
              >
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-6 w-6 text-indigo-600" />
                  <h2 className="ml-3 text-lg font-medium text-gray-900">Risk Analysis</h2>
                </div>
                <div className="flex items-center">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowRiskDetails(!showRiskDetails);
                    }}
                    className="px-2 py-1 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-md hover:bg-indigo-100 mr-2"
                  >
                    {showRiskDetails ? 'Show Less' : 'Show More'}
                  </button>
                  <button className="p-1 rounded-full bg-gray-100 hover:bg-gray-200">
                    {showRiskAnalysis ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              
              {showRiskAnalysis && (
                <>
                  <p className="text-gray-600 mb-3">Identified risks and areas requiring attention.</p>
                  
                  <div className="space-y-2">
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-2">
                      <div className="flex">
                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                        <div className="ml-2">
                          <p className="text-sm text-yellow-700 font-medium">Charlie Company Readiness Below Threshold</p>
                          {showRiskDetails && (
                            <p className="text-xs text-yellow-600">Documentation completion is at 75%, below the required 80% minimum.</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {showRiskDetails && (
                      <>
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-2">
                          <div className="flex">
                            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                            <div className="ml-2">
                              <p className="text-sm text-yellow-700 font-medium">Equipment Readiness Concerns</p>
                              <p className="text-xs text-yellow-600">Overall equipment readiness at 78%, requires attention.</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-green-50 border-l-4 border-green-400 p-2">
                          <div className="flex">
                            <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
                            <div className="ml-2">
                              <p className="text-sm text-green-700 font-medium">Headquarters Exceeding Targets</p>
                              <p className="text-xs text-green-600">95% readiness score with 98% documentation completion.</p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Export and Actions */}
                  <div className="flex justify-end mt-4 space-x-3">
                    <button className="px-3 py-1.5 bg-white border border-gray-300 text-xs font-medium rounded-md text-gray-700 hover:bg-gray-50 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export PDF
                    </button>
                    <button className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Generate Full Report
                    </button>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Company Details Modal */}
      {showCompanyDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedCompany ? `${selectedCompany.name} Company Details` : 'All Companies Performance'}
              </h2>
              <button 
                onClick={() => {
                  setShowCompanyDetails(false);
                  setSelectedCompany(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {selectedCompany ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-2 text-gray-900">Company Overview</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Personnel:</span>
                        <span className="text-sm font-medium text-gray-900">{selectedCompany.totalPersonnel}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Active Personnel:</span>
                        <span className="text-sm font-medium text-gray-900">{selectedCompany.activePersonnel}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Readiness Score:</span>
                        <span className={`text-sm font-medium ${
                          selectedCompany.readinessScore >= 80 ? 'text-green-700' : 
                          selectedCompany.readinessScore >= 60 ? 'text-yellow-700' : 
                          'text-red-700'
                        }`}>{selectedCompany.readinessScore}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-2 text-gray-900">Performance Metrics</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-gray-600">Document Completion:</span>
                          <span className="text-sm font-medium text-gray-900">{selectedCompany.documentsComplete}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: `${selectedCompany.documentsComplete}%` }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-gray-600">Training Completion:</span>
                          <span className="text-sm font-medium text-gray-900">{selectedCompany.trainingsComplete}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${selectedCompany.trainingsComplete}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-2 text-gray-900">Recommendations</h3>
                  <ul className="space-y-2 text-sm">
                    {selectedCompany.readinessScore < 80 && (
                      <li className="flex items-start">
                        <span className="text-yellow-500 mr-2">⚠️</span>
                        <span className="text-gray-700">Readiness score ({selectedCompany.readinessScore}%) is below the target of 80%.</span>
                      </li>
                    )}
                    {selectedCompany.documentsComplete < 80 && (
                      <li className="flex items-start">
                        <span className="text-yellow-500 mr-2">⚠️</span>
                        <span className="text-gray-700">Document completion rate needs improvement.</span>
                      </li>
                    )}
                    {selectedCompany.trainingsComplete < 80 && (
                      <li className="flex items-start">
                        <span className="text-yellow-500 mr-2">⚠️</span>
                        <span className="text-gray-700">Additional training sessions recommended.</span>
                      </li>
                    )}
                    {selectedCompany.readinessScore >= 90 && (
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span className="text-gray-700">Excellent performance across all metrics.</span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Personnel</th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Readiness</th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documents</th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trainings</th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analyticsData.companies.map((company, index) => (
                      <tr key={index}>
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{company.name}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                          {company.activePersonnel} / {company.totalPersonnel}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className={`text-sm font-medium ${
                              company.readinessScore >= 80 ? 'text-green-700' : 
                              company.readinessScore >= 60 ? 'text-yellow-700' : 
                              'text-red-700'
                            }`}>
                              {company.readinessScore}%
                            </span>
                            <div className="ml-2 w-16 bg-gray-200 rounded-full h-1.5">
                              <div className={`h-1.5 rounded-full ${
                                company.readinessScore >= 80 ? 'bg-green-500' : 
                                company.readinessScore >= 60 ? 'bg-yellow-500' : 
                                'bg-red-500'
                              }`} style={{ width: `${company.readinessScore}%` }}></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{company.documentsComplete}%</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{company.trainingsComplete}%</td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <button 
                            onClick={() => setSelectedCompany(company)}
                            className="text-xs font-medium text-indigo-600 hover:text-indigo-900"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            <div className="mt-6 flex justify-end space-x-3">
              <button 
                onClick={() => {
                  setShowCompanyDetails(false);
                  setSelectedCompany(null);
                }}
                className="px-4 py-2 bg-white border border-gray-300 text-sm font-medium rounded-md shadow-sm hover:bg-gray-50 text-gray-700"
              >
                Close
              </button>
              <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-indigo-700">
                Export Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 