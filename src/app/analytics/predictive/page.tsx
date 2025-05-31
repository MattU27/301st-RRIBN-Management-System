"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/ui/Card';
import {
  ChartBarIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

// Predictive analytics data interface
interface PredictiveData {
  readinessProjection: {
    organizations: Array<{
      name: string;
      current: number;
      projected: Array<{
        month: string;
        value: number;
      }>;
    }>;
    overallProjection: Array<{
      month: string;
      value: number;
    }>;
  };
  personnelTrends: {
    projectedGrowth: Array<{
      month: string;
      value: number;
    }>;
    attritionRisk: Array<{
      company: string;
      risk: number;
      personnel: number;
    }>;
  };
  documentCompliance: {
    complianceTrend: Array<{
      month: string;
      value: number;
    }>;
    riskAssessment: string;
  };
}

export default function PredictiveAnalyticsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [predictiveData, setPredictiveData] = useState<PredictiveData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch predictive analytics data from the API
  const fetchPredictiveData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch('/api/analytics/predictive', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch predictive analytics data: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setPredictiveData(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch predictive analytics data');
      }
    } catch (err) {
      console.error('Error fetching predictive analytics data:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
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

    fetchPredictiveData();
  }, [isLoading, isAuthenticated, router, user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
            <h3 className="text-sm font-medium text-red-800">Error loading predictive analytics</h3>
          </div>
          <p className="mt-2 text-sm text-red-700">{error}</p>
          <button 
            className="mt-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700"
            onClick={() => fetchPredictiveData()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!predictiveData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2" />
            <h3 className="text-sm font-medium text-yellow-800">No data available</h3>
          </div>
          <p className="mt-2 text-sm text-yellow-700">No predictive analytics data is currently available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Predictive Analytics</h1>
        <button 
          onClick={() => fetchPredictiveData()} 
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 flex items-center"
        >
          <ArrowPathIcon className="h-4 w-4 mr-1" />
          Refresh Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center mb-4">
              <ChartBarIcon className="h-8 w-8 text-indigo-600" />
              <h2 className="ml-3 text-lg font-medium text-gray-900">Readiness Projection</h2>
            </div>
            <p className="text-gray-600 mb-6">Forecasted readiness levels for the next 6 months.</p>

            {predictiveData.readinessProjection.organizations.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Organization Projections</h3>
                <div className="space-y-4">
                  {predictiveData.readinessProjection.organizations.map((org, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-900">{org.name}</span>
                        <span className="text-sm text-gray-500">Current: {org.current}%</span>
                      </div>
                      <div className="h-10 relative">
                        <div className="absolute inset-0 flex items-end">
                          {org.projected.map((month, idx) => (
                            <div 
                              key={idx} 
                              className="flex-1 mx-0.5 flex flex-col items-center"
                            >
                              <div 
                                className={`w-full rounded-t ${
                                  month.value >= 90 ? 'bg-green-500' : 
                                  month.value >= 80 ? 'bg-green-400' : 
                                  month.value >= 70 ? 'bg-yellow-400' : 'bg-red-400'
                                }`}
                                style={{ height: `${Math.max(5, month.value)}%` }}
                              ></div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-between mt-1">
                        {org.projected.map((month, idx) => (
                          <div key={idx} className="flex-1 text-center">
                            <span className="text-xs text-gray-500">{month.month.slice(0, 3)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-indigo-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Overall Readiness Forecast</h3>
              <div className="h-14 relative mb-1">
                <div className="absolute inset-0 flex items-end">
                  {predictiveData.readinessProjection.overallProjection.map((month, idx) => (
                    <div 
                      key={idx} 
                      className="flex-1 mx-0.5 flex flex-col items-center"
                    >
                      <div 
                        className={`w-full rounded-t ${
                          month.value >= 90 ? 'bg-indigo-600' : 
                          month.value >= 80 ? 'bg-indigo-500' : 
                          month.value >= 70 ? 'bg-indigo-400' : 'bg-indigo-300'
                        }`}
                        style={{ height: `${Math.max(10, month.value)}%` }}
                      ></div>
                      <span className="text-xs font-medium text-indigo-800 mt-1">{month.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between mt-3">
                {predictiveData.readinessProjection.overallProjection.map((month, idx) => (
                  <div key={idx} className="flex-1 text-center">
                    <span className="text-xs text-gray-500">{month.month}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center mb-4">
              <ArrowTrendingUpIcon className="h-8 w-8 text-emerald-600" />
              <h2 className="ml-3 text-lg font-medium text-gray-900">Personnel Trends</h2>
            </div>
            <p className="text-gray-600 mb-6">Projected personnel changes and attrition risk analysis.</p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Projected Workforce Growth</h3>
              <div className="h-14 relative mb-1">
                <div className="absolute inset-0 flex items-end">
                  {predictiveData.personnelTrends.projectedGrowth.map((month, idx) => (
                    <div 
                      key={idx} 
                      className="flex-1 mx-0.5 flex flex-col items-center"
                    >
                      <div 
                        className={`w-full rounded-t ${
                          month.value > 0 ? 'bg-emerald-500' : 'bg-red-400'
                        }`}
                        style={{ 
                          height: `${Math.min(100, Math.abs(month.value) * 10)}%` 
                        }}
                      ></div>
                      <span className={`text-xs font-medium mt-1 ${
                        month.value > 0 ? 'text-emerald-800' : 'text-red-800'
                      }`}>{month.value > 0 ? `+${month.value}%` : `${month.value}%`}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between mt-3">
                {predictiveData.personnelTrends.projectedGrowth.map((month, idx) => (
                  <div key={idx} className="flex-1 text-center">
                    <span className="text-xs text-gray-500">{month.month}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Attrition Risk Analysis</h3>
              <div className="space-y-3">
                {predictiveData.personnelTrends.attritionRisk.map((company, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900">{company.company}</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100">
                        {company.personnel} personnel
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500 w-24">Risk Level:</span>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full">
                        <div 
                          className={`h-2 rounded-full ${
                            company.risk > 60 ? 'bg-red-500' : 
                            company.risk > 30 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${company.risk}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-xs font-medium">
                        {company.risk}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mb-6">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <ClockIcon className="h-8 w-8 text-amber-600" />
            <h2 className="ml-3 text-lg font-medium text-gray-900">Document Compliance Forecast</h2>
          </div>
          <p className="text-gray-600 mb-6">Projected document compliance trends and risk assessment.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Compliance Trend</h3>
              <div className="h-14 relative mb-1">
                <div className="absolute inset-0 flex items-end">
                  {predictiveData.documentCompliance.complianceTrend.map((month, idx) => (
                    <div 
                      key={idx} 
                      className="flex-1 mx-0.5 flex flex-col items-center"
                    >
                      <div 
                        className={`w-full rounded-t ${
                          month.value >= 90 ? 'bg-green-500' : 
                          month.value >= 80 ? 'bg-green-400' : 
                          month.value >= 70 ? 'bg-yellow-400' : 'bg-red-400'
                        }`}
                        style={{ height: `${month.value}%` }}
                      ></div>
                      <span className="text-xs font-medium text-gray-800 mt-1">{month.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between mt-3">
                {predictiveData.documentCompliance.complianceTrend.map((month, idx) => (
                  <div key={idx} className="flex-1 text-center">
                    <span className="text-xs text-gray-500">{month.month}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-amber-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Compliance Risk Assessment</h3>
              <div className="bg-white rounded-lg p-4 h-full flex items-center">
                <div className="w-full">
                  <p className="text-gray-700">
                    {predictiveData.documentCompliance.riskAssessment}
                  </p>
                  <div className="mt-4 flex justify-center">
                    <button className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-md hover:bg-amber-700">
                      Generate Detailed Report
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
} 