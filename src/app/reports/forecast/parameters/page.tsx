'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { ChartBarIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

export default function ForecastParametersPage() {
  const { user, isAuthenticated, hasSpecificPermission } = useAuth();
  const router = useRouter();
  const [parameters, setParameters] = useState({
    timeframe: '90',
    personnelGrowth: '5',
    trainingCompletion: '85',
    resourceUtilization: '75',
    readinessThreshold: '80',
    confidenceLevel: '95'
  });

  if (!hasSpecificPermission('manage_reports')) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <div className="text-center py-12">
            <AdjustmentsHorizontalIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Access Denied</h3>
            <p className="mt-1 text-sm text-gray-500">
              You do not have permission to adjust forecast parameters.
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically make an API call to save the parameters
    alert('Forecast parameters updated successfully!');
    router.push('/dashboard');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Forecast Parameters
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Adjust parameters used in readiness forecasting calculations
          </p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div>
              <label htmlFor="timeframe" className="block text-sm font-medium text-gray-700">
                Forecast Timeframe (Days)
              </label>
              <select
                id="timeframe"
                value={parameters.timeframe}
                onChange={(e) => setParameters({ ...parameters, timeframe: e.target.value })}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="30">30 Days</option>
                <option value="60">60 Days</option>
                <option value="90">90 Days</option>
                <option value="180">180 Days</option>
              </select>
            </div>

            <div>
              <label htmlFor="personnelGrowth" className="block text-sm font-medium text-gray-700">
                Expected Personnel Growth (%)
              </label>
              <input
                type="number"
                id="personnelGrowth"
                value={parameters.personnelGrowth}
                onChange={(e) => setParameters({ ...parameters, personnelGrowth: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                min="0"
                max="100"
              />
            </div>

            <div>
              <label htmlFor="trainingCompletion" className="block text-sm font-medium text-gray-700">
                Training Completion Target (%)
              </label>
              <input
                type="number"
                id="trainingCompletion"
                value={parameters.trainingCompletion}
                onChange={(e) => setParameters({ ...parameters, trainingCompletion: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                min="0"
                max="100"
              />
            </div>

            <div>
              <label htmlFor="resourceUtilization" className="block text-sm font-medium text-gray-700">
                Resource Utilization Target (%)
              </label>
              <input
                type="number"
                id="resourceUtilization"
                value={parameters.resourceUtilization}
                onChange={(e) => setParameters({ ...parameters, resourceUtilization: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                min="0"
                max="100"
              />
            </div>

            <div>
              <label htmlFor="readinessThreshold" className="block text-sm font-medium text-gray-700">
                Minimum Readiness Threshold (%)
              </label>
              <input
                type="number"
                id="readinessThreshold"
                value={parameters.readinessThreshold}
                onChange={(e) => setParameters({ ...parameters, readinessThreshold: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                min="0"
                max="100"
              />
            </div>

            <div>
              <label htmlFor="confidenceLevel" className="block text-sm font-medium text-gray-700">
                Statistical Confidence Level (%)
              </label>
              <input
                type="number"
                id="confidenceLevel"
                value={parameters.confidenceLevel}
                onChange={(e) => setParameters({ ...parameters, confidenceLevel: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                min="0"
                max="100"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/dashboard')}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Parameters
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
} 