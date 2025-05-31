'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { ChartBarIcon, UserGroupIcon, DocumentTextIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

export default function ReadinessReportPage() {
  const { user, isAuthenticated, hasSpecificPermission } = useAuth();
  const router = useRouter();

  if (!hasSpecificPermission('view_reports')) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <div className="text-center py-12">
            <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Access Denied</h3>
            <p className="mt-1 text-sm text-gray-500">
              You do not have permission to view readiness reports.
            </p>
            <div className="mt-6">
              <Button onClick={() => router.push('/dashboard')} variant="secondary">
                Return to Dashboard
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const brigadeStats = {
    totalPersonnel: 245,
    readyPersonnel: 198,
    overallReadiness: 78,
    companies: [
      {
        name: 'Alpha Company',
        readiness: 88,
        personnel: 45,
        readyPersonnel: 38,
        documentsComplete: 92,
        trainingsComplete: 85
      },
      {
        name: 'Bravo Company',
        readiness: 85,
        personnel: 42,
        readyPersonnel: 35,
        documentsComplete: 88,
        trainingsComplete: 82
      },
      {
        name: 'Charlie Company',
        readiness: 76,
        personnel: 38,
        readyPersonnel: 30,
        documentsComplete: 78,
        trainingsComplete: 75
      },
      {
        name: 'HQ Company',
        readiness: 93,
        personnel: 25,
        readyPersonnel: 23,
        documentsComplete: 95,
        trainingsComplete: 90
      }
    ],
    trainingStats: {
      completed: 87,
      inProgress: 45,
      scheduled: 12,
      success: {
        combat: 85,
        medical: 78,
        technical: 72
      }
    },
    resourceStats: {
      equipment: 88,
      facilities: 72,
      personnel: 65
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex justify-between items-center">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.push('/dashboard')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Return to Dashboard
        </Button>
      </div>
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Brigade Readiness Report
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Comprehensive overview of brigade readiness status
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Button variant="secondary" className="ml-3">
            Export PDF
          </Button>
          <Button variant="primary" className="ml-3">
            Share Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Overall Brigade Status</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-500">Overall Readiness</span>
                <span className="text-sm font-medium text-green-600">{brigadeStats.overallReadiness}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${
                    brigadeStats.overallReadiness > 80 ? 'bg-green-600' : 
                    brigadeStats.overallReadiness > 60 ? 'bg-yellow-600' : 'bg-red-600'
                  }`}
                  style={{ width: `${brigadeStats.overallReadiness}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-500">Personnel Ready</span>
                <span className="text-sm font-medium text-blue-600">
                  {brigadeStats.readyPersonnel}/{brigadeStats.totalPersonnel}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${(brigadeStats.readyPersonnel / brigadeStats.totalPersonnel * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Company Readiness</h3>
          <div className="space-y-4">
            {brigadeStats.companies.map((company, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <UserGroupIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">{company.name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{company.readiness}% Ready</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      company.readiness > 80 ? 'bg-green-600' : 
                      company.readiness > 60 ? 'bg-yellow-600' : 'bg-red-600'
                    }`}
                    style={{ width: `${company.readiness}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Training Status</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{brigadeStats.trainingStats.completed}</div>
                <div className="text-sm text-gray-500">Completed</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{brigadeStats.trainingStats.inProgress}</div>
                <div className="text-sm text-gray-500">In Progress</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{brigadeStats.trainingStats.scheduled}</div>
                <div className="text-sm text-gray-500">Scheduled</div>
              </div>
            </div>
            <div className="pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Training Success Rates</h4>
              <div className="space-y-3">
                {Object.entries(brigadeStats.trainingStats.success).map(([type, rate]) => (
                  <div key={type} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 capitalize">{type} Training</span>
                      <span className="text-sm font-medium text-gray-900">{rate}% Success</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          rate > 80 ? 'bg-green-600' : 
                          rate > 60 ? 'bg-yellow-600' : 'bg-red-600'
                        }`}
                        style={{ width: `${rate}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Resource Utilization</h3>
          <div className="space-y-4">
            {Object.entries(brigadeStats.resourceStats).map(([resource, utilization]) => (
              <div key={resource} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 capitalize">{resource}</span>
                  <span className="text-sm font-medium text-gray-900">{utilization}% Utilized</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      utilization > 80 ? 'bg-green-600' : 
                      utilization > 60 ? 'bg-yellow-600' : 'bg-red-600'
                    }`}
                    style={{ width: `${utilization}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
} 